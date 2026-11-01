import { addNotification, ensureV130, nextId, addDays } from './shared.js';

const CASE_TYPES = ['Election Petition', 'Constitutional Dispute', 'Corruption', 'Government Action', 'Defamation', 'Public Interest', 'Administrative Appeal', 'Loan Default'];

export function fileCourtCase(world, payload) {
  if (!CASE_TYPES.includes(payload.category)) throw new Error('Select a valid case category');
  const title = String(payload.title || '').trim();
  const facts = String(payload.facts || '').trim();
  if (!title || !facts) throw new Error('Case title and supporting facts are required');
  const court = payload.court || (payload.category === 'Constitutional Dispute' ? 'Supreme Court' : payload.category === 'Loan Default' ? 'Lower Court' : 'High Court');
  if (!['Supreme Court', 'High Court', 'Lower Court'].includes(court)) throw new Error('Invalid court jurisdiction');
  const caseRecord = { id: nextId(world, 'CASE'), category: payload.category, title, facts, evidence: Array.isArray(payload.evidence) ? payload.evidence.map(String) : [], petitioner: payload.petitioner || world.player.name, respondent: payload.respondent || 'Government of India', court, status: 'Filed', filedAt: world.time.date, hearingDate: addDays(world.time.date, Number(world.balance?.v130?.courtFirstHearingDays || 14)), hearings: [], verdict: null, appealOf: payload.appealOf || null };
  ensureV130(world).courtCases.push(caseRecord);
  addNotification(world, { id: `COURT-FILED-${caseRecord.id}`, title: 'Court case registered', body: `${caseRecord.id}: ${title}. First hearing: ${caseRecord.hearingDate}.`, type: 'Court', priority: 'high', target: 'Courts' });
  return caseRecord;
}

export function recordCourtHearing(world, caseId, hearing) {
  const record = ensureV130(world).courtCases.find((item) => item.id === caseId);
  if (!record || !['Filed', 'Hearing'].includes(record.status)) throw new Error('Case is not available for a hearing');
  if (world.time.date.slice(0, 10) < record.hearingDate) throw new Error(`Hearing is scheduled for ${record.hearingDate}`);
  const entry = { date: world.time.date, summary: String(hearing?.summary || '').trim(), evidenceReviewed: (hearing?.evidenceReviewed || []).map(String), nextHearingDate: hearing?.nextHearingDate || null };
  if (!entry.summary) throw new Error('Hearing summary is required');
  record.hearings.push(entry);
  record.status = 'Hearing';
  if (entry.nextHearingDate) record.hearingDate = entry.nextHearingDate;
  return record;
}

export function issueCourtVerdict(world, caseId, { outcome, rationale, remedy = '' }) {
  const record = ensureV130(world).courtCases.find((item) => item.id === caseId);
  if (!record || !['Filed', 'Hearing'].includes(record.status)) throw new Error('Case cannot receive a verdict');
  if (!['Petition Allowed', 'Petition Dismissed', 'Partly Allowed', 'Referred'].includes(outcome)) throw new Error('Invalid court outcome');
  const reasoning = String(rationale || '').trim();
  if (reasoning.length < 30) throw new Error('A reasoned verdict of at least 30 characters is required');
  record.status = outcome === 'Referred' ? 'Referred' : 'Decided';
  record.verdict = { outcome, rationale: reasoning, remedy: String(remedy || ''), issuedAt: world.time.date, appealDeadline: addDays(world.time.date, Number(world.balance?.v130?.courtAppealWindowDays || 30)) };
  if (record.category === 'Election Petition' && outcome === 'Petition Allowed' && record.electionId) {
    const election = world.elections?.find((item) => item.id === record.electionId);
    if (election) election.legalReview = { caseId, status: 'Petition Allowed', remedy };
  }
  addNotification(world, { id: `COURT-VERDICT-${record.id}`, title: 'Court verdict issued', body: `${record.title}: ${outcome}. ${reasoning}`, type: 'Court', priority: 'high', target: 'Courts' });
  return record.verdict;
}

export function appealCourtVerdict(world, caseId, grounds) {
  const record = ensureV130(world).courtCases.find((item) => item.id === caseId);
  if (!record?.verdict) throw new Error('Only decided cases can be appealed');
  if (world.time.date.slice(0, 10) > record.verdict.appealDeadline) throw new Error('The appeal deadline has passed');
  return fileCourtCase(world, { category: 'Administrative Appeal', title: `Appeal: ${record.title}`, facts: String(grounds || '').trim(), court: record.court === 'Lower Court' ? 'High Court' : 'Supreme Court', appealOf: caseId, petitioner: world.player.name, respondent: record.respondent });
}

export { CASE_TYPES };

export function adjudicateCourtCase(world, caseId) {
  const record = ensureV130(world).courtCases.find((item) => item.id === caseId);
  if (!record || !['Filed', 'Hearing'].includes(record.status)) throw new Error('Case is not ready for adjudication');
  const evidenceCount = record.evidence.length + record.hearings.reduce((sum, hearing) => sum + hearing.evidenceReviewed.length, 0);
  const hearingCount = record.hearings.length;
  const factualDetail = Math.min(20, Math.floor(record.facts.length / 80));
  const strength = Math.min(100, evidenceCount * 18 + hearingCount * 12 + factualDetail);
  const outcome = strength >= 65 ? 'Petition Allowed' : strength >= 40 ? 'Partly Allowed' : 'Petition Dismissed';
  const rationale = `The court applied the published evidence standard. Evidence weight ${evidenceCount * 18}, hearing weight ${hearingCount * 12}, factual-detail weight ${factualDetail}; total case strength ${strength}/100. The decision is based on the filed record, not party affiliation.`;
  const verdict = issueCourtVerdict(world, caseId, { outcome, rationale, remedy: outcome === 'Petition Allowed' ? 'Relief granted as specified in the court order.' : outcome === 'Partly Allowed' ? 'Limited relief granted; remaining claims dismissed.' : 'No relief granted.' });
  return { outcome, strength, verdict };
}
