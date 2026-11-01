export * from './shared.js';
export * from './partyRegistry.js';
export * from './manifesto.js';
export * from './meetings.js';
export * from './judiciary.js';
export * from './media.js';
export * from './electionCommission.js';

import { processPartyRegistrationDeadlines, processPartyMembershipDeadlines } from './partyRegistry.js';
import { processMeetingDeadlines } from './meetings.js';
import { processCandidateNominationDeadlines } from './electionCommission.js';

export function processV130Deadlines(world) {
  return {
    registrations: processPartyRegistrationDeadlines(world),
    memberships: processPartyMembershipDeadlines(world),
    meetings: processMeetingDeadlines(world),
    nominations: processCandidateNominationDeadlines(world),
  };
}
export * from './partyGovernance.js';

export * from './partyArt.js';
