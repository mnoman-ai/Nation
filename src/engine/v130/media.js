import { addNotification, ensureV130, nextId, clamp } from './shared.js';

export function updateMediaHouse(world, houseId, changes) {
  const house = ensureV130(world).mediaHouses.find((item) => item.id === houseId);
  if (!house) throw new Error('Media organisation not found');
  for (const field of ['leaning', 'governmentStance', 'ownership', 'editorialPolicy']) if (changes[field] !== undefined) house[field] = String(changes[field]);
  for (const field of ['credibility', 'reach', 'influence', 'sensationalism']) if (changes[field] !== undefined) house[field] = clamp(changes[field]);
  return house;
}

export function publishMediaReport(world, { houseId, headline, body, topic = 'Politics', targetPartyId = null, sentiment = 0, factuality = 70 }) {
  const institutions = ensureV130(world);
  const house = institutions.mediaHouses.find((item) => item.id === houseId);
  if (!house) throw new Error('Select a valid media organisation');
  if (!String(headline || '').trim() || !String(body || '').trim()) throw new Error('Headline and report body are required');
  const report = { id: nextId(world, 'NEWS'), houseId, headline: String(headline).trim(), body: String(body).trim(), topic, targetPartyId, sentiment: clamp(sentiment, -100, 100), factuality: clamp(factuality), publishedAt: world.time.date, credibilityAtPublication: house.credibility, reachAtPublication: house.reach };
  institutions.mediaReports.unshift(report);
  const impact = (house.influence / 100) * (house.reach / 100) * (report.factuality / 100) * (report.sentiment / 10);
  world.publicMood = clamp((world.publicMood || 50) + impact);
  if (targetPartyId) {
    const party = world.parties.find((item) => item.party_id === targetPartyId);
    if (party) party.public_support = clamp((party.public_support || 0) + impact * 0.7);
  }
  addNotification(world, { id: `MEDIA-${report.id}`, title: `Media report: ${report.headline}`, body: `${house.name} published a report on ${topic}.`, type: 'Media', target: 'Media' });
  return { report, impact };
}

export function applyMediaResponse(world, { reportId, response }) {
  const institutions = ensureV130(world);
  const report = institutions.mediaReports.find((item) => item.id === reportId);
  if (!report) throw new Error('Media report not found');
  if (!['Clarify', 'Fact Check', 'Public Statement', 'No Response'].includes(response)) throw new Error('Invalid media response');
  const house = institutions.mediaHouses.find((item) => item.id === report.houseId);
  const result = { id: nextId(world, 'RESPONSE'), reportId, response, date: world.time.date };
  report.responses ??= [];
  report.responses.push(result);
  if (response === 'Fact Check') house.credibility = clamp(house.credibility + 1);
  if (response === 'Public Statement') world.player.media = clamp((world.player.media || 0) + 1);
  if (response === 'Clarify') world.player.reputation = clamp((world.player.reputation || 0) + (report.factuality >= 60 ? 1 : -1));
  return result;
}

export function publishWorldNews(world, topic, headline, body) {
  const ranked = ensureV130(world).mediaHouses.slice().sort((a, b) => b.reach * b.credibility - a.reach * a.credibility);
  const house = ranked[0];
  return publishMediaReport(world, { houseId: house.id, headline, body, topic, factuality: Math.max(40, house.credibility), sentiment: 0 });
}
