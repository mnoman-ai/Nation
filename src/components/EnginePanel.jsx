import React, { useEffect, useState } from 'react';
import { useGame } from '../state/store.js';
import { assetUrl } from '../assets/registry.js';
import { formatRupees } from '../engine/format.js';

function ActionButton({ children, onClick, disabled = false, reason = '' }) {
  return <span className="action-control">
    <button className="btn small" disabled={disabled} title={disabled ? reason : undefined} onClick={onClick}>{children}</button>
    {disabled && reason && <small className="disabled-reason">{reason}</small>}
  </span>;
}
function Box({ title, children }) {
  return <section className="panel engine-panel"><header className="panel-head">{title}</header><div className="panel-body">{children}</div></section>;
}
const partySections = ['Overview', 'Leadership', 'Members', 'People', 'Funding', 'Manifesto', 'Alliances', 'Campaigns', 'Meetings', 'Internal Elections', 'Party Registration'];
const money = formatRupees;

export default function EnginePanel({ screen, section = 'Overview' }) {
  const game = useGame();
  const world = game.world;
  const [budget, setBudget] = useState('1000000');
  const [amount, setAmount] = useState('1000');
  const [loanAmount, setLoanAmount] = useState('1000000');
  const [membershipFee, setMembershipFee] = useState('100');
  const [contractMonths, setContractMonths] = useState('1');
  const [people, setPeople] = useState([]);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [peopleState, setPeopleState] = useState('All');
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyIdeology, setNewPartyIdeology] = useState('Centrist');
  const [newPartyColour, setNewPartyColour] = useState('#d6a23a');
  const [newPartyEmblem, setNewPartyEmblem] = useState('sun');
  const [newPartyManifesto, setNewPartyManifesto] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const act = (fn) => {
    try { setError(''); fn(); }
    catch (cause) { setError(cause.message); }
  };
  useEffect(() => {
    if (screen !== 'Party HQ' || section !== 'People' || people.length) return;
    setBusy(true);
    fetch('/data/player-candidates.json')
      .then((response) => { if (!response.ok) throw new Error('Player candidate pool could not be loaded'); return response.json(); })
      .then(setPeople)
      .catch((cause) => setError(cause.message))
      .finally(() => setBusy(false));
  }, [screen, section, people.length]);
  if (!world) return <Box title="Simulation engine">Loading offline game data…</Box>;
  const upcoming = world.elections.filter((election) => election.status !== 'Results');
  const party = world.parties.find((item) => item.party_id === world.player.partyId);
  const activeSession = world.sessions.some((session) => session.status === 'In Session' && session.startDate === world.time.date.slice(0, 10));
  const visiblePeople = people.filter((person) => {
    const matchesQuery = `${person.full_name} ${person.profession} ${person.home_district}`.toLowerCase().includes(peopleQuery.toLowerCase());
    return matchesQuery && (peopleState === 'All' || person.state_id === peopleState);
  }).slice(0, 30);

  return <div className="engine-live-grid">
    {screen === 'Dashboard' && <Box title="Live political status">
      <div className="stats-row">
        <div className="stat"><small>Political position</small><strong>{world.player.status}</strong></div>
        <div className="stat"><small>Public mood</small><strong>{world.publicMood}/100</strong></div>
        <div className="stat"><small>Party</small><strong>{party?.short_name || 'Independent'}</strong></div>
        <div className="stat"><small>Legacy score</small><strong>{world.career.legacyScore}</strong></div>
      </div>
      <p>GDP growth {world.economy.national.growth.toFixed(1)}% · Inflation {world.economy.national.inflation.toFixed(1)}% · Unemployment {world.economy.national.unemployment.toFixed(1)}%</p>
      <ActionButton onClick={() => act(() => game.performAction('outreach'))}>Community outreach · 4h</ActionButton>
      <ActionButton onClick={() => act(() => game.performAction('speech'))}>Public speech · 2h</ActionButton>
    </Box>}

    {screen === 'Party HQ' && <>
      <div className="section-tabs">{partySections.map((name) => <button key={name} className={section === name ? 'active' : ''} onClick={() => game.go('Party HQ', name)}>{name}</button>)}</div>
      {section === 'People' && <Box title="People — 12,000 player-pool profiles">
        <p>{busy ? 'Loading candidate profiles…' : `${people.length.toLocaleString('en-IN')} player-pool profiles loaded. Recruited profiles are not assigned election tickets automatically.`}</p>
        <div className="people-filters"><input aria-label="Filter people" placeholder="Filter by name, profession or district" value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)}/><select aria-label="Filter by home state" value={peopleState} onChange={(event) => setPeopleState(event.target.value)}><option value="All">All states / UTs</option>{world.states.map((state) => <option key={state.state_ut_id} value={state.state_ut_id}>{state.state_ut_name}</option>)}</select></div>
        {visiblePeople.map((person) => <div className="slot" key={person.candidate_id}><div><b>{person.full_name}</b><small>{person.profession} · {person.home_district} · Age {person.age}</small></div><ActionButton disabled={!party || (world.recruitedCandidates || []).includes(person.candidate_id)} reason={!party ? 'Join a party first' : 'Already recruited'} onClick={() => act(() => game.recruitPeople([person], 1))}>Recruit</ActionButton></div>)}
      </Box>}
      {section === 'Funding' && <Box title="Party accounts and funding">
        <div className="stats-row"><div className="stat"><small>Party account</small><strong>{money(world.partyFunds)}</strong></div><div className="stat"><small>Personal account</small><strong>{money(world.player.money)}</strong></div></div><p>Monthly membership fee: {money(party?.membershipFee||0)} per member.</p>
        <label>Transfer amount (₹)<input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)}/></label>
        <ActionButton onClick={() => act(() => game.transferToParty(Number(amount)))}>Personal → Party</ActionButton>
        <ActionButton onClick={() => act(() => game.transferToPersonal(Number(amount)))}>Party → Personal</ActionButton>
        <label>Monthly membership fee per member (₹1–₹50,000)<input type="number" min="1" max="50000" value={membershipFee} onChange={(event) => setMembershipFee(event.target.value)}/></label>
        <ActionButton disabled={!party} reason="Join or create a party first" onClick={() => act(() => game.setMembershipFee(Number(membershipFee)))}>Set membership fee</ActionButton>
        <ActionButton disabled={!party} reason="Join or create a party first" onClick={() => act(() => game.fundParty('supporter', 10000))}>Record supporter donation · ₹10,000</ActionButton>
        <label>Party loan amount (₹10 lakh – ₹1 crore)<input type="number" min="1000000" max="10000000" step="100000" value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)}/></label>
        <ActionButton disabled={!party} reason="Join or create a party first" onClick={() => act(() => game.requestPartyLoan(Number(loanAmount)))}>Apply for party loan</ActionButton>
        {(world.partyLoans || []).map((loan) => <div className="slot" key={loan.id}><div><b>{loan.id} · {loan.status}</b><small>Outstanding {money(loan.dueAmount)} · Warnings {loan.warnings}/3</small></div><ActionButton onClick={() => act(() => game.payPartyLoan(loan.id))}>Repay in full</ActionButton></div>)}
      </Box>}
      {section === 'Campaigns' && <Box title="Campaign operations">
        <label>Broadcast contract duration (1–6 months)<select value={contractMonths} onChange={(event) => setContractMonths(event.target.value)}>{[1, 2, 3, 4, 5, 6].map((month) => <option key={month}>{month}</option>)}</select></label>
        {(world.finance.campaigns || []).map((campaign) => <div className="slot" key={campaign.id}><div><b>{campaign.label}</b><small>{campaign.billing === 'contract-monthly-prepaid' ? `${money(campaign.fee)} per month · prepaid contract` : `${money(campaign.fee)} · ${campaign.billing}`}</small></div><ActionButton disabled={!party || (campaign.billing === 'monthly' && world.activeCampaigns.some((item) => item.id === campaign.id && item.active))} reason={!party ? 'Join or create a party first' : 'Already active'} onClick={() => act(() => game.startCampaign(campaign.id, Number(contractMonths)))}>Start</ActionButton></div>)}
        {(world.activeCampaigns || []).filter((item) => item.active).map((campaign) => <div className="slot" key={`${campaign.id}-active`}><div><b>{campaign.label}</b><small>{campaign.monthsRemaining === null ? 'Monthly, ongoing' : `${campaign.monthsRemaining} months remaining`}</small></div><ActionButton onClick={() => act(() => game.stopCampaign(campaign.id))}>Stop</ActionButton></div>)}
      </Box>}
      {section === 'Leadership' && <Box title="Party leadership"><p>Current party: {party?.party_name || 'No party selected'}</p><p>President: {party?.leaderId || party?.initial_leader_id || 'Not recorded'}</p><ActionButton disabled={!party} reason="Join a party first" onClick={() => act(() => game.updatePartyLeadership())}>Contest party leadership</ActionButton></Box>}
      {section === 'Members' && <Box title="Party membership"><p>Player membership status: {world.player.status}</p><p>Recorded members: {world.player.members || party?.members || 0}</p><p>Member fees: ₹1 to ₹50,000 per member. Membership-fee collection workflow remains incomplete.</p></Box>}
      {section === 'Alliances' && <Box title="Party alliances">{world.alliances.length ? world.alliances.map((alliance) => <p key={alliance.id}>{alliance.id}: {alliance.partyIds.join(', ')}</p>) : <p>No alliance record is active.</p>}</Box>}
      {section === 'Manifesto' && <Box title="Party manifesto"><p>{party?.manifesto || 'No manifesto has been registered for this party.'}</p><p>Manifesto editing and registration remain incomplete.</p></Box>}
      {section === 'Meetings' && <Box title="Party meetings"><p>Party meetings recorded: {(world.partyMeetings || []).length}</p><p>Meeting scheduling and deal-signing workflow remains incomplete.</p></Box>}
      {section === 'Internal Elections' && <Box title="Internal party elections"><p>Leadership score is based on current player influence, reputation and communication.</p><ActionButton disabled={!party} reason="Join a party first" onClick={() => act(() => game.updatePartyLeadership())}>Submit leadership challenge</ActionButton></Box>}
      {section === 'Party Registration' && <Box title="Register a new party"><p>Registration fee: ₹10,000 from your personal account · Minimum influence: 25 · Minimum members: 100.</p><label>Party name<input value={newPartyName} onChange={(event) => setNewPartyName(event.target.value)} maxLength={48}/></label><label>Ideology<select value={newPartyIdeology} onChange={(event) => setNewPartyIdeology(event.target.value)}>{['Centrist','Centre-left','Centre-right','Social democratic','Conservative','Green','Regionalist','Progressive'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Party colour<select value={newPartyColour} onChange={(event) => setNewPartyColour(event.target.value)}>{['#d6a23a','#176b55','#234c91','#8c2c42','#6d4a91','#267d8a','#8a6b32','#343a40','#9b4b22','#547a35','#b15c8b','#d1b7a1'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Emblem shape<select value={newPartyEmblem} onChange={(event) => setNewPartyEmblem(event.target.value)}>{['sun','star','wheel','lotus','tree','torch','book','hand','bird','mountain','plough','rising-sun'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Party manifesto<textarea rows="4" value={newPartyManifesto} onChange={(event) => setNewPartyManifesto(event.target.value)}/></label><ActionButton disabled={newPartyName.trim().length < 3 || world.player.influence < 25 || (world.player.members || 0) < 100 || world.player.money < 10000} reason={newPartyName.trim().length < 3 ? 'Enter a party name of at least 3 characters' : world.player.influence < 25 ? 'Reach 25 political influence' : (world.player.members || 0) < 100 ? 'Recruit at least 100 members' : 'You need ₹10,000 in your personal account'} onClick={() => act(() => game.createParty({ name: newPartyName, ideology: newPartyIdeology, colour: newPartyColour, emblem: newPartyEmblem, manifesto: newPartyManifesto }))}>Register Party · ₹10,000</ActionButton></Box>}
      {section === 'Overview' && <Box title="Party overview"><p>{party?.party_name || 'You are currently an unaffiliated citizen.'}</p><p>Members: {world.player.members || party?.members || 0} · Party funds: {money(world.partyFunds)}</p><p>Public support: {party?.public_support ?? 0} · Organisation: {party?.organisation_strength ?? 0}</p><ActionButton disabled={!party} reason="Join or create a party first" onClick={() => game.go('Parties')}>Browse parties</ActionButton></Box>}
    </>}

    {screen === 'Elections' && <Box title="Election Commission — scheduled contests">
      <div className="engine-art-row"><img src={assetUrl('thumb.elections.counting')} alt="Counting"/><img src={assetUrl('thumb.elections.courts')} alt="Courts"/></div>
      {upcoming.map((election) => <div className="slot" key={election.id}><div><b>{election.stateName || 'Lok Sabha'} — {election.type}</b><small>Poll {election.pollDate} · Results {election.resultsDate} · {election.totalSeats} seats · {election.status}</small></div><ActionButton disabled={world.time.date.slice(0, 10) !== election.pollDate || !!game.electionProgress} reason={world.time.date.slice(0, 10) !== election.pollDate ? `Available on ${election.pollDate}` : 'Election simulation is already running'} onClick={() => game.runElection(election.id).catch((cause) => setError(cause.message))}>Start election count</ActionButton></div>)}
      {game.electionProgress && <p>Simulation progress: {game.electionProgress.done.toLocaleString()} / {game.electionProgress.total.toLocaleString()}</p>}
      {world.elections.filter((election) => election.status === 'Results' && election.resultPublished).map((election) => <div key={election.id}><b>{election.stateName || 'Lok Sabha'} results</b><p>{Object.entries(election.result?.seatTally || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => `${id}: ${count}`).join(' · ')}</p></div>)}
    </Box>}

    {screen === 'Events' && <Box title="Event timeline and decisions">
      <p>Recorded events: {world.events.length} · Major events this month: {world.events.filter((event) => event.month === world.time.monthIndex && event.major).length}</p>
      {world.pendingDecision ? <><div className="event-art">{world.pendingDecision.art && assetUrl(`event.${world.pendingDecision.art}`) ? <img src={assetUrl(`event.${world.pendingDecision.art}`)} alt={world.pendingDecision.title}/> : <span className="gold-icon">✦</span>}</div><h3>{world.pendingDecision.title}</h3><p>{world.pendingDecision.description}</p>{world.pendingDecision.choices.map((choice) => <p key={choice.id}><ActionButton onClick={() => act(() => game.resolveDecision(choice.id))}>{choice.label}</ActionButton></p>)}</> : <p>No pending event decision. Events are generated by the monthly simulation tick.</p>}
      {world.pendingShock && <><h3>Economic warning: {world.pendingShock.name}</h3><ActionButton onClick={() => act(() => game.resolveShock('prepare'))}>Prepare response</ActionButton><ActionButton onClick={() => act(() => game.resolveShock('absorb'))}>Absorb shock</ActionButton></>}
    </Box>}

    {(screen === 'Government' || screen === 'National Budget') && <Box title="Balanced public budget">
      <p>Revenue: {money(world.economy.budget.revenue)} · Reserve: {money(world.economy.budget.reserveFund)}</p>
      <label>Revenue (₹)<input value={budget} onChange={(event) => setBudget(event.target.value)}/></label>
      <ActionButton onClick={() => act(() => game.setBudget({ revenue: Number(budget), allocations: { Home: 100000, Finance: 100000, Education: 150000, Health: 150000, Agriculture: 100000, Infrastructure: 150000, Rural: 100000, Environment: 50000, Defence: 50000, Other: 50000 } }))}>Set balanced budget</ActionButton>
      <p>Surplus: {money(world.economy.budget.surplus)}</p>
    </Box>}

    {screen === 'Parliament' && <Box title="Lok Sabha — legislative business">
      <p>{world.bills.length} bills in the register · {world.sessions.length} scheduled sessions · No Rajya Sabha.</p>
      {world.sessions.map((session) => <div className="slot" key={session.id}><div><b>{session.kind} Session</b><small>{session.startDate} · {session.status}</small></div><ActionButton disabled={world.time.date.slice(0, 10) !== session.startDate || session.status !== 'Scheduled'} reason={world.time.date.slice(0, 10) !== session.startDate ? 'Available on the scheduled session date' : 'Session already started'} onClick={() => act(() => game.startSession(session.id))}>Start Session</ActionButton></div>)}
      {world.bills.slice(0, 12).map((bill) => <div className="slot" key={bill.id}><div><b>{bill.name}</b><small>{bill.ministry} · {bill.status}</small></div><ActionButton disabled={bill.status !== 'Draft' || !activeSession} reason={bill.status !== 'Draft' ? 'Only Draft bills can be introduced' : 'Start a legislative session first'} onClick={() => act(() => game.introduceBill(bill.id))}>Introduce</ActionButton><ActionButton disabled={!['Introduced', 'Debating'].includes(bill.status) || !activeSession} reason={bill.status === 'Draft' ? 'Introduce this bill first' : 'Voting requires an active session'} onClick={() => act(() => game.voteBill(bill.id, 'yes'))}>Vote Yes</ActionButton></div>)}
    </Box>}

    {screen === 'State Assembly' && <Box title="State Assembly">
      <p>31 Assembly jurisdictions · 4,123 seats. The 5 no-Assembly UTs are not listed.</p>
      {world.states.filter((state) => Number(world.seatCounts.find((row) => row.state_ut_id === state.state_ut_id)?.assembly_seats || 0) > 0).map((state) => {
        const seats = world.seatCounts.find((row) => row.state_ut_id === state.state_ut_id);
        return <div className="slot" key={state.state_ut_id}><div><b>{state.state_ut_name}</b><small>{seats.assembly_seats} seats · Assembly jurisdiction</small></div><ActionButton onClick={() => game.go('State Details', state.state_ut_name)}>View Assembly</ActionButton></div>;
      })}
    </Box>}

    {screen === 'Media' && <Box title="Public communication">
      <p>Media recognition: {world.player.media}/100 · Public mood: {world.publicMood}/100</p>
      {[{ id: 'pressRelease', label: 'Press Release' }, { id: 'publicSpeech', label: 'Public Speech' }, { id: 'mediaCampaign', label: 'Media Campaign' }, { id: 'crisisCommunication', label: 'Crisis Communication' }, { id: 'factCheck', label: 'Fact Check' }, { id: 'poll', label: 'Opinion Poll' }].map((item) => <ActionButton key={item.id} onClick={() => act(() => game.mediaAction(item.id))}>{item.label}</ActionButton>)}
    </Box>}

    {screen === 'Economy' && <Box title="National economy — single source of truth">
      <div className="stats-row">{[['GDP', money(world.economy.national.gdp)], ['Growth', `${world.economy.national.growth.toFixed(1)}%`], ['Inflation', `${world.economy.national.inflation.toFixed(1)}%`], ['Unemployment', `${world.economy.national.unemployment.toFixed(1)}%`]].map(([label, value]) => <div className="stat" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className="engine-art-row"><img src={assetUrl('thumb.economy.agriculture')} alt="Agriculture"/><img src={assetUrl('thumb.economy.manufacturing')} alt="Manufacturing"/><img src={assetUrl('thumb.economy.trade')} alt="Trade and exports"/><img src={assetUrl('thumb.economy.infrastructure')} alt="Infrastructure"/></div>
      <p>State economies: {Object.keys(world.economy.states).length}</p>
    </Box>}

    {screen === 'Projects' && <Box title="Project register">
      <div className="engine-art-row"><img src={assetUrl('thumb.projects.greenEnergy')} alt="Green energy"/><img src={assetUrl('thumb.projects.ruralHealthcare')} alt="Rural healthcare"/><img src={assetUrl('thumb.projects.metro')} alt="Metro infrastructure"/></div>
      {world.projects.slice(0, 8).map((project) => <div className="slot" key={project.id}><div><b>{project.name}</b><small>{project.sector} · {project.status} · {money(project.cost)}</small></div><ActionButton disabled={project.status !== 'Proposed'} reason="Only proposed projects can be funded" onClick={() => act(() => game.startProject(project.id))}>Fund</ActionButton></div>)}
    </Box>}
    {error && <p role="alert" className="engine-error">{error}</p>}
  </div>;
}
