export class CandidateRepository{constructor(base='/data/',maxCachedStates=2){this.base=base;this.maxCachedStates=maxCachedStates;this.cache=new Map();}async forState(stateId){if(!this.cache.has(stateId)){const r=await fetch(`${this.base}candidates-${stateId}.json`);if(!r.ok)throw new Error(`Candidate data missing for ${stateId}`);if(this.cache.size>=this.maxCachedStates){const first=this.cache.keys().next().value;this.cache.delete(first);}this.cache.set(stateId,await r.json());}const rows=this.cache.get(stateId);this.cache.delete(stateId);this.cache.set(stateId,rows);return rows;}clear(){this.cache.clear();}get loadedStates(){return[...this.cache.keys()];}}
export function makeElectionSeats(allConstituencies,type,stateId=null){return allConstituencies.filter(s=>s.legislature_type===(type==='lokSabha'?'LOK_SABHA':'ASSEMBLY')&&(!stateId||s.state_ut_id===stateId));}
const shiftDate = (date, days) => { const value = new Date(`${date}T00:00:00.000Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
export function scheduleOpeningElections(world, allConstituencies) {
  const assemblies = world.states.filter((state) => !['Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Ladakh', 'Lakshadweep'].includes(state.state_ut_name));
  const createSchedule = (election) => ({
    ...election,
    announcementDate: shiftDate(election.pollDate, -90),
    campaignStartDate: shiftDate(election.pollDate, -30),
    nominationOpenDate: shiftDate(election.pollDate, -21),
    nominationCloseDate: shiftDate(election.pollDate, -14),
    scrutinyDate: shiftDate(election.pollDate, -13),
    withdrawalDeadline: shiftDate(election.pollDate, -11),
    campaignEndDate: shiftDate(election.pollDate, -2),
  });
  const out = [];
  for (const state of assemblies) out.push(createSchedule({ id: `ASM-${state.state_ut_id}-2027`, type: 'assembly', stateId: state.state_ut_id, stateName: state.state_ut_name, pollDate: world.rules.firstAssemblyPoll, resultsDate: world.rules.firstAssemblyResults, status: 'Scheduled', totalSeats: makeElectionSeats(allConstituencies, 'assembly', state.state_ut_id).length }));
  out.push(createSchedule({ id: 'LS-2029', type: 'lokSabha', pollDate: world.rules.firstLokSabhaPoll, resultsDate: world.rules.firstLokSabhaResults, status: 'Scheduled', totalSeats: 543 }));
  world.elections = out;
  return out;
}
