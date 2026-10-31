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
  return { salary, personalBalance: world.player.money, partyContribution: world.player.partySalaryContribution || 0 };
}

export function transferPersonalToParty(world, amount) {
  const value = Math.floor(Number(amount));
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid transfer amount');
  if (world.player.money < value) throw new Error('Insufficient personal funds');
  world.player.money -= value;
  world.partyFunds = Number(world.partyFunds || 0) + value;
  return { amount: value, personalBalance: world.player.money, partyBalance: world.partyFunds };
}

export function transferPartyToPersonal(world, amount) {
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
  const config = world.finance?.partyLoan || {};
  const value = Math.floor(Number(amount));
  if (!Number.isFinite(value) || value < (config.minimum || 1000000) || value > (config.maximum || 10000000)) {
    throw new Error('Party loan must be between ₹10 lakh and ₹1 crore');
  }
  if (!world.player.partyId || world.player.partyId === 'NONE') throw new Error('Join or create a party before applying for a party loan');
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
    if ((loan.monthsElapsed - (config.termYears || 2) * 12) % interval === 0) {
      loan.warnings += 1;
      loan.dueAmount = Math.ceil(loan.dueAmount * (1 + (loan.annualInterestRate || 0.24) / 12 * interval));
      world.notifications.unshift({
        id: `N-${loan.id}-W${loan.warnings}-${loan.monthsElapsed}`,
        title: `Party loan repayment warning ${loan.warnings}`,
        body: `The unpaid balance is ₹${loan.dueAmount.toLocaleString('en-IN')}. Clear it from party and personal funds.`,
        type: 'Finance', read: false,
      });
      if (loan.warnings >= (config.warningLimit || 3) && loan.status !== 'Court Notice') {
        loan.status = 'Court Notice';
        loan.hearingDate = addDays(world.time.date, 30);
        world.notifications.unshift({ id: `N-${loan.id}-COURT`, title: 'Court notice — party loan default', body: `A hearing is scheduled for ${loan.hearingDate.slice(0, 10)}. The full outstanding balance may be paid before the hearing.`, type: 'Legal', read: false });
      }
    }
    if (loan.status === 'Court Notice' && world.time.date.slice(0, 10) >= loan.hearingDate.slice(0, 10)) {
      loan.status = 'Election Commission Action';
      world.electionCommissionAction = { loanId: loan.id, date: world.time.date, status: 'Strict action pending' };
      world.notifications.unshift({ id: `N-${loan.id}-EC`, title: 'Election Commission action', body: 'The loan remained unpaid after the court hearing. Strict action has been initiated.', type: 'Legal', read: false });
    }
  }
}

export function startCampaign(world, campaignId, months = 1) {
  const campaign = (world.finance?.campaigns || []).find((item) => item.id === campaignId);
  if (!campaign) throw new Error('Unknown campaign type');
  const duration = Math.floor(Number(months));
  if (campaign.maxMonths && (duration < campaign.minMonths || duration > campaign.maxMonths)) throw new Error('Campaign contract duration is outside the allowed range');
  if (campaign.billing === 'monthly' && world.activeCampaigns?.some((item) => item.id === campaignId)) throw new Error('This monthly campaign is already active');
  const cost = campaign.billing === 'contract-monthly-prepaid' ? campaign.fee * duration : campaign.fee;
  if (world.partyFunds < cost) throw new Error('Insufficient party funds for this campaign');
  world.partyFunds -= cost;
  world.activeCampaigns ||= [];
  const record = { id: campaignId, label: campaign.label, billing: campaign.billing, monthsRemaining: campaign.billing === 'contract-monthly-prepaid' ? duration : campaign.billing === 'monthly' ? null : 0, startedAt: world.time.date, prepaid: cost, active: campaign.billing === 'monthly' || campaign.billing === 'contract-monthly-prepaid' };
  world.activeCampaigns.push(record);
  return record;
}

export function stopCampaign(world, campaignId) {
  const item = world.activeCampaigns?.find((campaign) => campaign.id === campaignId && campaign.active);
  if (!item) throw new Error('No active campaign found');
  item.active = false;
  item.stoppedAt = world.time.date;
  return item;
}

export function tickCampaigns(world) {
  for (const campaign of world.activeCampaigns || []) {
    if (!campaign.active) continue;
    if (campaign.billing === 'monthly') {
      const definition = world.finance.campaigns.find((item) => item.id === campaign.id);
      if (world.partyFunds < definition.fee) {
        campaign.active = false;
        campaign.stoppedAt = world.time.date;
        world.notifications.unshift({ id: `N-CAMPAIGN-${campaign.id}-${world.time.date}`, title: 'Campaign paused', body: `${campaign.label} stopped because the party account could not cover its monthly fee.`, type: 'Finance', read: false });
      } else world.partyFunds -= definition.fee;
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
