export function joinParty(world,partyId,application={}){const party=world.parties.find(p=>p.party_id===partyId);if(!party)throw new Error('Unknown party');if(world.player.partyId===partyId)return world;if(world.player.partyId&&world.player.partyId!=='NONE')world.player.reputation=Math.max(0,world.player.reputation-5);world.partyApplications??=[];world.partyApplications.push({partyId,applicant:world.player.name,category:application.category||'General Member',statement:application.statement||'',submittedAt:world.time.date,status:'Accepted'});world.player.partyId=partyId;world.player.members=(world.player.members||0)+1;world.player.status='Party Worker';world.partyMembershipSince=world.time.date;party.members=(party.members||0)+1;return world;}
export function resignParty(world){if(!world.player.partyId||world.player.partyId==='NONE')throw new Error('You are not currently a party member');const party=world.parties.find(item=>item.party_id===world.player.partyId);if(party?.leaderId==='PLAYER'){const successor=(world.partyMembers||[]).filter(item=>item.initial_party_id===party.party_id).sort((a,b)=>Number(party.memberLoyalty?.[b.candidate_id]??b.loyalty??50)-Number(party.memberLoyalty?.[a.candidate_id]??a.loyalty??50))[0];party.leaderId=successor?.candidate_id||null;if(party.officeBearers?.['Party President']==='PLAYER')party.officeBearers['Party President']=party.leaderId;}if(party)party.members=Math.max(0,Number(party.members||0)-1);world.player.partyId='NONE';world.player.partyOffice=null;world.player.partyPresident=false;world.player.status='Citizen';world.player.reputation=Math.max(0,world.player.reputation-3);world.partyResignationDate=world.time.date;return world.player;}
import { submitPartyRegistration } from './v130/partyRegistry.js';
export function createParty(world,details={}){return submitPartyRegistration(world,details);}

export function setMembershipFee(world, amount) {
  const fee = Math.floor(Number(amount));
  if (!Number.isFinite(fee) || fee < 1 || fee > 50000) throw new Error('Membership fee must be between ₹1 and ₹50,000');
  const party = world.parties.find((item) => item.party_id === world.player.partyId);
  if (!party) throw new Error('Join or create a party first');
  const leader = party.leaderId === 'PLAYER' || world.player.partyOffice === 'Party President' || world.player.partyPresident === true;
  if (!leader) throw new Error('Only the party president may set the membership fee');
  party.membershipFee = fee;
  const penalty = fee > 10000 ? Math.ceil((fee - 10000) / 10000) : 0;
  party.membershipFeeAffordabilityPenalty = penalty;
  if (penalty) { party.public_support = Math.max(0, Number(party.public_support || 0) - penalty); world.player.reputation = Math.max(0, Number(world.player.reputation || 0) - penalty); }
  return fee;
}

export function collectMembershipFees(world) {
  if (world.partyFundingFrozen) return 0;
  let total = 0;
  for (const party of world.parties || []) {
    const fee = Math.floor(Number(party.membershipFee || 0));
    if (fee < 1 || fee > 50000) continue;
    const members = Math.max(0, Number(party.members || 0));
    const isPlayerMember = world.player.partyId === party.party_id;
    const playerPays = isPlayerMember && Number(world.player.money || 0) >= fee;
    if (playerPays) world.player.money -= fee;
    const payingMembers = Math.max(0, members - (isPlayerMember ? 1 : 0)) + (playerPays ? 1 : 0);
    const income = payingMembers * fee;
    party.lastMembershipFeeCollection = { date: world.time.date, feePerMember: fee, membersCharged: payingMembers, playerCharged: playerPays, income };
    party.funds = Number(party.funds || 0) + income;
    party.membershipFeeRevenue = (party.membershipFeeRevenue || 0) + income;
    if (party.party_id === world.player.partyId) world.partyFunds = Number(world.partyFunds || 0) + income;
    total += income;
  }
  return total;
}

export function performAction(world,actionId,payload={}){const cost=world.actions.find(a=>a.id===actionId);if(!cost)throw new Error('Unknown action');if(actionId==='fundraise'||actionId==='donate')throw new Error('Donation-based fundraising and donor contributions are disabled by the v1.3.0 finance rules');if(world.player.money<(payload.moneyCost||0))throw new Error('Insufficient funds');world.player.money-=(payload.moneyCost||0);const p=world.player;switch(actionId){case'rally':p.support=Math.min(100,p.support+2);p.media=Math.min(100,p.media+1);world.partyCampaigns??={};world.partyCampaigns[p.partyId]=(world.partyCampaigns[p.partyId]||0)+4;break;case'outreach':p.influence=Math.min(100,p.influence+2);p.support=Math.min(100,p.support+1);break;case'speech':p.communication=Math.min(100,p.communication+1);p.media=Math.min(100,p.media+1);break;case'fundraise':break;case'allianceTalk':world.diplomacyTalks++;break;case'pressRelease':p.media=Math.min(100,p.media+1);break;case'campaign':p.support=Math.min(100,p.support+3);world.partyCampaigns??={};world.partyCampaigns[p.partyId]=(world.partyCampaigns[p.partyId]||0)+8;break;case'committeeWork':p.influence=Math.min(100,p.influence+1);p.skills.committeeWork=(p.skills.committeeWork||0)+1;break;}return{actionId,date:world.time.iso,player:p};}
export function updatePartyLeadership(world,partyId){const party=world.parties.find(p=>p.party_id===partyId);if(!party)throw new Error('Unknown party');const score=world.player.influence+world.player.reputation+world.player.communication;if(score>Number(party.leadership_strength||0)){party.leaderId='PLAYER';world.player.partyPresident=true;return'PLAYER';}return party.leaderId||party.initial_leader_id||null;}

export function autoFillCandidates(world,seats,candidates,{partyId=world.player.partyId,filters={}}={}){if(!partyId||partyId==='NONE')throw new Error('Join or create a party first');const assigned=[];const used=new Set();for(const seat of seats){const eligible=candidates.filter(c=>c.state_id===(seat.state_id||seat.state_ut_id)&&c.initial_party_id===partyId&&!used.has(c.candidate_id)&&Number(c.age)>=world.rules.minCandidateAge);eligible.sort((a,b)=>Number(b.campaign_skill||b.candidate_quality||0)-Number(a.campaign_skill||a.candidate_quality||0));const candidate=eligible[0];if(candidate){used.add(candidate.candidate_id);assigned.push({seatId:seat.constituency_id,candidateId:candidate.candidate_id,partyId});}}return assigned;}
export function nominateCandidate(world,{seatId,candidateId,partyId=world.player.partyId,contestId}){if(partyId!==world.player.partyId)throw new Error('You may nominate candidates only for your own political party');const party=world.parties.find(item=>item.party_id===partyId);if(!(party?.leaderId==='PLAYER'||world.player.partyOffice==='Party President'||world.player.partyPresident===true))throw new Error('Only the party president or authorised party leader may select candidates');world.nominations??=[];if(candidateId==='PLAYER'&&world.nominations.filter(n=>n.contestId===contestId&&n.candidateId==='PLAYER').length>=world.rules.maxPlayerSeats)throw new Error(`Maximum ${world.rules.maxPlayerSeats} candidacies per election`);if(world.nominations.some(n=>n.contestId===contestId&&n.seatId===seatId))throw new Error('Seat already has a nomination');if(world.nominations.filter(n=>n.contestId===contestId&&n.candidateId===candidateId).length)throw new Error('Candidate already nominated in this election');const partyFunded=partyId&&partyId!=='NONE';const available=partyFunded?Number(world.partyFunds||0):Number(world.player.money||0);if(available<5000)throw new Error('Candidate filing fee of ₹5,000 requires sufficient funds');if(partyFunded)world.partyFunds-=5000;else world.player.money-=5000;const n={seatId,candidateId,partyId,contestId,status:'Submitted',filingFee:5000,date:world.time.date};world.nominations.push(n);return n;}

export function recruitMembers(world,count=25){if(!Number.isInteger(count)||count<1)throw new Error('Member count must be positive');world.player.members=(world.player.members||0)+count;return world.player.members;}
export function recruitPlayerPoolCandidates(world,pool,count=10){if(world.player.partyId==='NONE')throw new Error('Join or create a party first');const party=world.parties.find(p=>p.party_id===world.player.partyId);const used=new Set(world.recruitedCandidates||[]);const available=pool.filter(c=>c.control_type==='PLAYER_CONTROLLED'&&!used.has(c.candidate_id));const ranked=available.map(c=>({c,score:Number(c.political_reputation||0)*.25+Number(c.local_influence||0)*.35+Number(c.leadership_skill||0)*.2+Number(party.organisation_strength||0)*.2})).sort((a,b)=>b.score-a.score);const selected=ranked.slice(0,count).map(x=>({...x.c,initial_party_id:party.party_id,initial_membership_status:'MEMBER'}));world.recruitedCandidates??=[];world.recruitedCandidates.push(...selected.map(c=>c.candidate_id));world.partyMembers??=[];world.partyMembers.push(...selected);party.members=(party.members||0)+selected.length;return selected;}
export function manageFunding(world, type, amount) {
  if (type === 'donation' || type === 'supporter' || type === 'business' || type === 'sponsor' || type === 'risky' || type === 'memberFees') {
    throw new Error('This funding source is not permitted. Allowed sources are member fees, elected-office salary share, bank loans and personal-account transfers.');
  }
  throw new Error('Manual funding is disabled. Use the specific approved finance action.');
}
