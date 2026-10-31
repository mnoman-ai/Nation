import{scheduleOpeningElections}from'./candidates.js';import{formGovernment}from'./coalitions.js';import{setBudget}from'./government.js';import{resolveEvent}from'./events.js';import{serializeWorld,deserializeWorld}from'./save.js';
export function prepareScenario(world,constituencies){scheduleOpeningElections(world,constituencies);return world;}
export function formFromElection(world,result){const gov=formGovernment(result.seatTally,result.results.length,world.alliances);world.government={...world.government,status:gov.majority?'Formed':'Minority trial',members:gov.members,leader:gov.leader,stability:gov.majority?70:35,formationDeadline:gov.deadline||null};return gov;}
export function configureBudget(world,settings){return setBudget(world,settings);}
export function resolvePending(world,choiceId){if(!world.pendingDecision)throw new Error('No pending decision');return resolveEvent(world,world.pendingDecision.id,choiceId);}
export function saveReload(world){return deserializeWorld(serializeWorld(world));}
