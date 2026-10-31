export function createSession(date, kind = 'Budget') {
  return { id: `SESSION-${date}`, kind, startDate: date, status: 'Scheduled', bills: [], votes: [] };
}

export function startSession(world, sessionId) {
  const session = world.sessions?.find((item) => item.id === sessionId);
  if (!session) throw new Error('Session not found');
  if (world.time.date.slice(0, 10) !== session.startDate) throw new Error('A session can only start on its scheduled date');
  session.status = 'In Session';
  session.startedAt = world.time.date;
  return session;
}

export function endSession(world, sessionId) {
  const session = world.sessions?.find((item) => item.id === sessionId);
  if (!session || session.status !== 'In Session') throw new Error('No active session found');
  session.status = 'Completed';
  session.endedAt = world.time.date;
  return session;
}

function activeSession(world) {
  return (world.sessions || []).find((session) =>
    session.status === 'In Session' && session.startDate === world.time.date.slice(0, 10));
}

export function introduceBill(world, billId) {
  const bill = world.bills.find((item) => item.id === billId);
  if (!bill) throw new Error('Bill not found');
  const session = activeSession(world);
  if (!session) throw new Error('A legislative session must be in progress to introduce a bill');
  if (bill.status !== 'Draft') throw new Error('Only Draft bills can be introduced');
  bill.status = 'Introduced';
  bill.introducedAt = world.time.date;
  bill.sessionId = session.id;
  session.bills.push(bill.id);
  return bill;
}

export function proposeBill(world, bill) {
  if (!activeSession(world)) throw new Error('A legislative session must be in progress to propose a bill');
  if (!bill?.name) throw new Error('Bill name required');
  const item = {
    id: bill.id || `USR-${world.bills.length + 1}`,
    name: bill.name,
    ministry: bill.ministry || 'General',
    status: 'Introduced',
    support: 50,
    proposedBy: world.player.name,
    createdAt: world.time.date,
    sessionId: activeSession(world).id,
    votes: [],
  };
  world.bills.push(item);
  activeSession(world).bills.push(item.id);
  return item;
}

export function voteBill(world, billId, vote, { whip = null } = {}) {
  const bill = world.bills.find((item) => item.id === billId);
  if (!bill) throw new Error('Bill not found');
  if (!activeSession(world)) throw new Error('Voting is available only during an active legislative session');
  if (!['Introduced', 'Debating'].includes(bill.status)) throw new Error('The bill must be introduced before voting');
  if (!['yes', 'no', 'abstain'].includes(vote)) throw new Error('Invalid vote');
  const defied = Boolean(whip && whip !== vote);
  if (defied) {
    world.player.reputation = Math.max(0, world.player.reputation - 4);
    world.player.partyDiscipline = (world.player.partyDiscipline || 0) + 1;
  }
  bill.votes ||= [];
  bill.votes.push({ voter: 'PLAYER', vote, defied, date: world.time.date });
  bill.status = 'Voted';
  const session = activeSession(world);
  session.votes.push({ billId, vote, date: world.time.date });
  return { billId, vote, defied };
}

export function confidenceMotion(world, { support = 0, opposition = 0 } = {}) {
  const passed = opposition > support;
  if (passed) {
    world.government.status = 'Fallen';
    world.government.fallReason = 'Lost confidence motion';
  }
  return { passed, support, opposition };
}

export function committeeWork(world, committee = 'Finance') {
  world.player.skills.committeeWork = (world.player.skills.committeeWork || 0) + 1;
  world.player.influence = Math.min(100, world.player.influence + 1);
  world.committees[committee] = (world.committees[committee] || 0) + 1;
  return { committee, progress: world.committees[committee] };
}
