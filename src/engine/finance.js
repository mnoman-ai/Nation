import { addNotification } from './v130/shared.js';
export function monthlySalaryFor(player, finance) {
  if (player.office === 'MP' || player.status === 'MP') return finance.mpMonthlySalary;
  if (player.office === 'MLA' || player.status === 'MLA') return finance.mlaMonthlySalary;
  return finance.citizenMonthlySalary;
}

export function payMonthlySalary(world) {
  const finance = world.finance || world.balance?.career || {};
  const salary = monthlySalaryFor(world.player, finance);
  world.player.money = Number(world.player.money || 0) + salary;
  world.player.monthlySalary = salary;
  if (['MLA', 'MP'].includes(world.player.office || world.player.status) && world.player.partyId && world.player.partyId !== 'NONE') {
    const share = Math.round(salary * (finance.partyMemberSalaryShare ?? 0.65));
    world.partyFunds = Number(world.partyFunds || 0) + share;
    world.player.partySalaryContribution = (world.player.partySalaryContribution || 0) + share;
  }
  const electedShare = payOtherPartyElectedSalaries(world, finance);
  return { salary, personalBalance: world.player.money, partyContribution: (world.player.partySalaryContribution || 0) + electedShare, otherPartyContribution: electedShare };
}

export function payOtherPartyElectedSalaries(world, finance = world.finance || {}) {
  const shareRate = Number(finance.partyMemberSalaryShare ?? 0.65);
  let total = 0;
  for (const party of world.parties || []) {
    const officials = party.electedOfficials || party.electedMembers || [];
    for (const official of officials) {
      if (official.memberId === 'PLAYER' || official.player === true) continue;
      const office = String(official.office || official.status || '').toUpperCase();
      const salary = office === 'MP' ? Number(finance.mpMonthlySalary || 700000) : office === 'MLA' ? Number(finance.mlaMonthlySalary || 300000) : 0;
      if (!salary) continue;
      const contribution = Math.round(salary * shareRate);
      party.funds = Number(party.funds || 0) + contribution;
      if (party.party_id === world.player.partyId) world.partyFunds = Number(world.partyFunds || 0) + contribution;
      total += contribution;
    }
  }
  return total;
}

export function transferPersonalToParty(world, amount) {
  if (world.partyFundingFrozen) throw new Error('Party funding is frozen by Election Commission enforcement');
  const value = Math.floor(Number(amount));
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid transfer amount');
  if (world.player.money < value) throw new Error('Insufficient personal funds');
  world.player.money -= value;
  world.partyFunds = Number(world.partyFunds || 0) + value;
  return { amount: value, personalBalance: world.player.money, partyBalance: world.partyFunds };
}

export function transferPartyToPersonal(world, amount) {
  const party = world.parties?.find((item) => item.party_id === world.player.partyId);
  if (!(party?.leaderId === 'PLAYER' || world.player.partyPresident === true || ['Party President', 'National General Secretary', 'Treasurer'].includes(world.player.partyOffice))) throw new Error('Only an authorised party finance officer may withdraw party funds');
  if (world.partyFundingFrozen) throw new Error('Party funding is frozen by Election Commission enforcement');
  const value = Math.floor(Number(amount));
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid transfer amount');
  if (world.partyFunds < value) throw new Error('Insufficient party funds');
  world.partyFunds -= value;
  world.player.money += value;
  return { amount: value, personalBalance: world.player.money, partyBalance: world.partyFunds };
}

export function setPlayerOffice(world, office) {
  if (!['Citizen', 'MLA', 'MP'].includes(office)) throw new Error('Unknown public office');
  world.player.office = office === 'Citizen' ? null : office;
  world.player.status = office;
  return office;
}

export function requestPartyLoan(world, amount) {
  const party = world.parties?.find((item) => item.party_id === world.player.partyId);
  if (!(party?.leaderId === 'PLAYER' || world.player.partyPresident === true || ['Party President', 'National General Secretary', 'Treasurer'].includes(world.player.partyOffice))) throw new Error('Only an authorised party finance officer may apply for a party loan');
  const config = world.finance?.partyLoan || {};
  const value = Math.floor(Number(amount));
  if (!Number.isFinite(value) || value < (config.minimum || 1000000) || value > (config.maximum || 10000000)) {
    throw new Error('Party loan must be between ₹10 lakh and ₹1 crore');
  }
  if (!world.player.partyId || world.player.partyId === 'NONE') throw new Error('Join or create a party before applying for a party loan');
  if (world.partyFundingFrozen) throw new Error('Party funding is frozen by Election Commission enforcement');
  world.partyLoans ||= [];
  if (world.partyLoans.some((loan) => loan.status === 'Active' || loan.status === 'Court Notice')) throw new Error('The party already has an unpaid loan');
  const years = config.termYears || 2;
  const rate = config.annualInterestRate || 0.24;
  const loan = {
    id: `LOAN-${world.partyLoans.length + 1}`,
    principal: value,
    annualInterestRate: rate,
    dueAmount: Math.round(value * (1 + rate) ** years),
    monthsElapsed: 0,
    warnings: 0,
    status: 'Active',
    issuedAt: world.time.date,
    dueAt: addMonths(world.time.date, years * 12),
    hearingDate: null,
  };
  world.partyLoans.push(loan);
  world.partyFunds += value;
  world.notifications.unshift({ id: `N-${loan.id}`, title: 'Party loan approved', body: `₹${value.toLocaleString('en-IN')} has been credited to the party account. Full repayment is due in two years.`, type: 'Finance', read: false });
  return loan;
}

export function payPartyLoan(world, loanId) {
  const loan = world.partyLoans?.find((item) => item.id === loanId);
  if (!loan || !['Active', 'Court Notice'].includes(loan.status)) throw new Error('No repayable loan found');
  const total = loan.dueAmount;
  if (world.partyFunds + world.player.money < total) throw new Error('Combined party and personal funds are insufficient to clear the loan');
  const fromParty = Math.min(world.partyFunds, total);
  world.partyFunds -= fromParty;
  world.player.money -= total - fromParty;
  loan.status = 'Repaid';
  loan.repaidAt = world.time.date;
  const courtCase = world.institutions?.courtCases?.find((item) => item.id === loan.courtCaseId);
  if (courtCase && courtCase.status === 'Filed') { courtCase.status = 'Settled'; courtCase.settledAt = world.time.date; }
  return { paid: total, fromParty, fromPersonal: total - fromParty };
}

export function tickPartyLoans(world) {
  const config = world.finance?.partyLoan || {};
  for (const loan of world.partyLoans || []) {
    if (!['Active', 'Court Notice'].includes(loan.status)) continue;
    loan.monthsElapsed += 1;
    if (loan.monthsElapsed < (config.termYears || 2) * 12) continue;
    if (world.time.date.slice(0, 10) < loan.dueAt.slice(0, 10)) continue;

    const available = world.partyFunds + world.player.money;
    if (available >= loan.dueAmount) {
      payPartyLoan(world, loan.id);
      continue;
    }
    if (!loan.firstDefaultAt) {
      const fromParty = Math.min(world.partyFunds, loan.dueAmount);
      world.partyFunds -= fromParty;
      const fromPersonal = Math.min(world.player.money, loan.dueAmount - fromParty);
      world.player.money -= fromPersonal;
      loan.dueAmount -= fromParty + fromPersonal;
      loan.firstDefaultAt = world.time.date;
    }
    const interval = config.warningsEveryMonths || 3;
    if (loan.monthsElapsed > (config.termYears || 2) * 12 && (loan.monthsElapsed - (config.termYears || 2) * 12) % interval === 0) {
      // Interest continues compounding every quarter after default. The
      // statutory warning count is capped at three; later quarters do not
      // create duplicate warnings while the court/last-chance process runs.
      loan.dueAmount = Math.ceil(loan.dueAmount * (1 + (loan.annualInterestRate || 0.24) / 12 * interval));
      if (loan.warnings < (config.warningLimit || 3)) {
        loan.warnings += 1;
        world.notifications.unshift({
          id: `N-${loan.id}-W${loan.warnings}-${loan.monthsElapsed}`,
          title: `Party loan repayment warning ${loan.warnings}`,
          body: `The unpaid balance is ₹${loan.dueAmount.toLocaleString('en-IN')}. Clear it from party and personal funds.`,
          type: 'Finance', read: false,
        });
      }
      if (loan.warnings >= (config.warningLimit || 3) && loan.status !== 'Court Notice') {
        loan.status = 'Court Notice';
        loan.hearingDate = addDays(world.time.date, 30);
        world.institutions ??= {}; world.institutions.courtCases ??= [];
        loan.courtCaseId = `CASE-LOAN-${loan.id}`;
        world.institutions.courtCases.push({ id: loan.courtCaseId, category: 'Loan Default', title: `Party loan default — ${loan.id}`, facts: `The party loan of ₹${loan.principal.toLocaleString('en-IN')} remains unpaid after three quarterly warnings. Outstanding amount: ₹${loan.dueAmount.toLocaleString('en-IN')}.`, evidence: [`Loan agreement ${loan.id}`, 'Three quarterly repayment warnings'], petitioner: 'Lending institution', respondent: world.player.partyId, court: 'Lower Court', status: 'Filed', filedAt: world.time.date, hearingDate: loan.hearingDate, hearings: [], verdict: null, loanId: loan.id });
        world.notifications.unshift({ id: `N-${loan.id}-COURT`, title: 'Court notice — party loan default', body: `A Lower Court hearing is scheduled for ${loan.hearingDate.slice(0, 10)}. This is the final chance to repay the outstanding amount before enforcement.`, type: 'Court', read: false, target: 'Courts' });
      }
    }
  }
}

function enforcePartyLoan(world, loan, config = world.finance?.partyLoan || {}) {
  if (loan.status !== 'Court Notice') return false;
  loan.status = 'Election Commission Action';
  const fine = Number(config.enforcementFine || 500000);
  const finePaid = Math.min(Number(world.partyFunds || 0), fine);
  world.partyFunds = Math.max(0, Number(world.partyFunds || 0) - finePaid);
  world.partyFine = Math.max(0, Number(world.partyFine || 0) + fine - finePaid);
  world.partyFundingFrozen = true;
  world.electionCommissionAction = { loanId: loan.id, date: world.time.date, status: 'Funding frozen', fine, finePaid };
  const courtCase = world.institutions?.courtCases?.find((item) => item.id === loan.courtCaseId);
  if (courtCase) { courtCase.status = 'Decided'; courtCase.verdict = { outcome: 'Petition Allowed', rationale: 'The recorded loan agreement, missed repayment date and three issued warnings establish the default.', remedy: 'Outstanding balance remains payable; Election Commission enforcement is authorised.', issuedAt: world.time.date, appealDeadline: addDays(world.time.date, 30) }; }
  world.notifications.unshift({ id: `N-${loan.id}-EC`, title: 'Election Commission action — enforcement', body: `A ₹${fine.toLocaleString('en-IN')} fine was imposed (₹${finePaid.toLocaleString('en-IN')} recovered). Party funding is frozen until enforcement is resolved.`, type: 'Election Commission', priority: 'high', target: 'Election Commission', read: false });
  return true;
}

export function processPartyLoanDeadlines(world) {
  const today = world.time.date.slice(0, 10);
  let count = 0;
  for (const loan of world.partyLoans || []) {
    if (loan.status !== 'Court Notice' || !loan.hearingDate) continue;
    const courtCase = world.institutions?.courtCases?.find((item) => item.id === loan.courtCaseId);
    if (!loan.hearingHeldAt && today >= loan.hearingDate.slice(0, 10)) {
      loan.lastChanceDate ||= addDays(loan.hearingDate, Number(world.finance?.partyLoan?.lastChanceDays || 7));
      loan.hearingHeldAt = world.time.date;
      if (courtCase && courtCase.status === 'Filed') {
        courtCase.status = 'Hearing';
        courtCase.hearings ??= [];
        courtCase.hearings.push({ date: world.time.date, summary: 'The scheduled loan-default hearing reviewed the signed loan terms, repayment ledger and three recorded warnings.', evidenceReviewed: ['Signed party loan agreement', 'Repayment ledger', 'Three statutory default warnings'], nextHearingDate: loan.lastChanceDate || null });
        courtCase.hearingDate = loan.lastChanceDate || courtCase.hearingDate;
      }
      world.notifications.unshift({ id: `N-${loan.id}-HEARING`, title: 'Party loan court hearing held', body: `The hearing for party loan ${loan.id} is recorded. The final opportunity to repay the outstanding amount is ${loan.lastChanceDate || addDays(world.time.date, 7)}.`, type: 'Court', priority: 'high', target: 'Courts', read: false });
      count += 1;
      continue;
    }
    if (loan.hearingHeldAt && loan.lastChanceDate && today >= loan.lastChanceDate.slice(0, 10)) {
      if (enforcePartyLoan(world, loan)) count += 1;
    }
  }
  return count;
}

export function startCampaign(world, campaignId, months = 1) {
  const party = world.parties?.find((item) => item.party_id === world.player.partyId);
  if (!(party?.leaderId === 'PLAYER' || world.player.partyPresident === true || ['Party President', 'National General Secretary', 'Campaign Manager'].includes(world.player.partyOffice))) throw new Error('Only an authorised party campaign officer may approve campaign expenditure');
  if (world.partyFundingFrozen) throw new Error('Party funding is frozen by Election Commission enforcement');
  const campaign = (world.finance?.campaigns || []).find((item) => item.id === campaignId);
  if (!campaign) throw new Error('Unknown campaign type');
  const duration = Math.floor(Number(months));
  if (campaign.maxMonths && (duration < campaign.minMonths || duration > campaign.maxMonths)) throw new Error('Campaign contract duration is outside the allowed range');
  if (campaign.billing === 'monthly' && world.activeCampaigns?.some((item) => item.id === campaignId && item.active)) throw new Error('This monthly campaign is already active');
  const activeElection = (world.elections || []).find((item) => !['Results', 'Completed'].includes(item.status) && item.pollDate >= world.time.date.slice(0, 10));
  if (activeElection?.campaignStartDate && world.time.date.slice(0, 10) < activeElection.campaignStartDate) throw new Error(`Official campaign period opens on ${activeElection.campaignStartDate}`);
  if (activeElection?.campaignEndDate && world.time.date.slice(0, 10) > activeElection.campaignEndDate) throw new Error('The Election Commission campaign period has closed');
  const electionKey = activeElection?.id || 'open-cycle';
  world.campaignUsage ??= {}; world.campaignUsage[electionKey] ??= {};
  if (campaign.maxUsesPerElection && (world.campaignUsage[electionKey][campaignId] || 0) >= campaign.maxUsesPerElection) throw new Error(`${campaign.label} can only be used once per election`);
  const startsOnFirst = world.time.date.slice(8, 10) === '01';
  const cost = campaign.billing === 'contract-monthly-prepaid' ? campaign.fee * duration : campaign.billing === 'monthly' ? (startsOnFirst ? campaign.fee : 0) : campaign.fee;
  if (world.partyFunds < cost) throw new Error('Insufficient party funds for this campaign');
  world.partyFunds -= cost;
  world.activeCampaigns ||= [];
  const record = { id: campaignId, label: campaign.label, partyId: world.player.partyId, billing: campaign.billing, monthsRemaining: campaign.billing === 'contract-monthly-prepaid' ? duration : campaign.billing === 'monthly' ? null : 0, startedAt: world.time.date, prepaid: cost, active: campaign.billing === 'monthly' || campaign.billing === 'contract-monthly-prepaid', benefit: structuredClone(campaign.benefit || {}), electionId: activeElection?.id || null, lastBilledMonth: campaign.billing === 'monthly' && startsOnFirst ? world.time.date.slice(0,7) : null };
  world.activeCampaigns.push(record);
  if (campaign.maxUsesPerElection) world.campaignUsage[electionKey][campaignId] = (world.campaignUsage[electionKey][campaignId] || 0) + 1;
  world.partyCampaignMetrics ??= {}; world.partyCampaignMetrics[record.partyId] ??= {};
  const metric = record.benefit.name || campaignId;
  const scale = campaign.billing === 'contract-monthly-prepaid' ? duration : campaign.billing === 'monthly' ? (startsOnFirst ? 1 : 0) : 1;
  if (scale) { world.partyCampaignMetrics[record.partyId][metric] = (world.partyCampaignMetrics[record.partyId][metric] || 0) + Number(record.benefit.value || 0) * scale; world.partyCampaigns ??= {}; world.partyCampaigns[record.partyId] = (world.partyCampaigns[record.partyId] || 0) + Number(record.benefit.value || 0) * scale; }
  return record;
}

export function stopCampaign(world, campaignId) {
  const item = world.activeCampaigns?.find((campaign) => campaign.id === campaignId && campaign.active);
  if (!item) throw new Error('No active campaign found');
  item.active = false;
  item.stoppedAt = world.time.date;
  return item;
}

export function processCampaignDeadlines(world) {
  const today = world.time.date.slice(0, 10);
  let stopped = 0;
  for (const campaign of world.activeCampaigns || []) {
    if (!campaign.active) continue;
    const election = campaign.electionId && world.elections?.find((item) => item.id === campaign.electionId);
    const endDate = election?.campaignEndDate || election?.pollDate;
    if (endDate && today >= endDate) {
      campaign.active = false;
      campaign.stoppedAt = world.time.date;
      addNotification(world, { id: `CAMPAIGN-END-${campaign.id}-${campaign.electionId || 'cycle'}`, title: 'Election campaign period closed', body: `${campaign.label} stopped on the Election Commission campaign end date (${endDate}).`, type: 'Election Commission', target: 'Elections' });
      stopped += 1;
    }
  }
  return stopped;
}

export function tickCampaigns(world) {
  for (const campaign of world.activeCampaigns || []) {
    if (!campaign.active) continue;
    const election = campaign.electionId && world.elections?.find((item) => item.id === campaign.electionId);
    if (election && (election.campaignEndDate || election.pollDate) && world.time.date.slice(0, 10) >= (election.campaignEndDate || election.pollDate)) { campaign.active = false; campaign.stoppedAt = world.time.date; continue; }
    if (campaign.billing === 'monthly') {
      const definition = world.finance.campaigns.find((item) => item.id === campaign.id);
      const monthKey = world.time.date.slice(0, 7);
      if (campaign.lastBilledMonth === monthKey) continue;
      if (world.partyFundingFrozen || world.partyFunds < definition.fee) {
        campaign.active = false;
        campaign.stoppedAt = world.time.date;
        world.notifications.unshift({ id: `N-CAMPAIGN-${campaign.id}-${world.time.date}`, title: 'Campaign paused', body: `${campaign.label} stopped because the party account could not cover its monthly fee.`, type: 'Finance', read: false });
      } else {
        world.partyFunds -= definition.fee;
        campaign.lastBilledMonth = monthKey;
        const metric = campaign.benefit?.name || campaign.id;
        const value = Number(campaign.benefit?.value || 0);
        world.partyCampaignMetrics ??= {}; world.partyCampaignMetrics[campaign.partyId] ??= {};
        world.partyCampaignMetrics[campaign.partyId][metric] = (world.partyCampaignMetrics[campaign.partyId][metric] || 0) + value;
        world.partyCampaigns ??= {}; world.partyCampaigns[campaign.partyId] = (world.partyCampaigns[campaign.partyId] || 0) + value;
      }
    } else if (campaign.billing === 'contract-monthly-prepaid') {
      campaign.monthsRemaining -= 1;
      if (campaign.monthsRemaining <= 0) campaign.active = false;
    }
  }
}

function addMonths(date, count) {
  const value = new Date(date);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + count);
  const lastDay = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, lastDay));
  return value.toISOString();
}
function addDays(date, count) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString();
}
