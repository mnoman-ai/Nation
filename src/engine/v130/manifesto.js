import { approvePolicy } from '../government.js';
import { ensureV130, requireParty, nextId } from './shared.js';

export const MANIFESTO_CATEGORIES = ['Economy', 'Employment', 'Education', 'Healthcare', 'Agriculture', 'Infrastructure', 'National Security', 'Social Welfare', 'Environment', 'Governance'];

export function createManifesto(world, partyId = world.player.partyId) {
  const party = requireParty(world, partyId);
  party.manifesto ??= { version: 1, status: 'Draft', categories: {}, promises: [], publishedAt: null };
  party.manifesto.categories ??= {};
  party.manifesto.promises ??= [];
  return party.manifesto;
}

export function setManifestoPolicy(world, category, policy) {
  if (!MANIFESTO_CATEGORIES.includes(category)) throw new Error('Unknown manifesto category');
  if (!policy || typeof policy !== 'object' || !String(policy.title || '').trim()) throw new Error('Policy title is required');
  if (!policy.policyId || !world.policies.some((item) => item.id === policy.policyId)) throw new Error('Select an executable policy from the policy catalogue');
  const manifesto = createManifesto(world);
  manifesto.categories[category] = { title: String(policy.title).trim(), description: String(policy.description || '').trim(), priority: Math.max(1, Math.min(5, Number(policy.priority) || 3)), fiscalCost: Math.max(0, Number(policy.fiscalCost) || 0), policyId: policy.policyId || null };
  manifesto.status = 'Draft';
  return manifesto.categories[category];
}

export function addManifestoPromise(world, promise) {
  const manifesto = createManifesto(world);
  const title = String(promise?.title || '').trim();
  if (!title) throw new Error('Promise title is required');
  if (!promise.linkedPolicyId || !world.policies.some((item) => item.id === promise.linkedPolicyId)) throw new Error('A custom manifesto promise must link to an executable policy');
  const item = { id: nextId(world, 'PROMISE'), title, details: String(promise.details || '').trim(), category: MANIFESTO_CATEGORIES.includes(promise.category) ? promise.category : 'Governance', priority: Math.max(1, Math.min(5, Number(promise.priority) || 3)), estimatedCost: Math.max(0, Number(promise.estimatedCost) || 0), linkedPolicyId: promise.linkedPolicyId || null, voterGroups: Array.isArray(promise.voterGroups) ? [...new Set(promise.voterGroups)] : [] };
  manifesto.promises.push(item);
  manifesto.status = 'Draft';
  return item;
}

export function publishManifesto(world) {
  const party = requireParty(world);
  const manifesto = createManifesto(world);
  const categories = Object.keys(manifesto.categories);
  for (const category of categories) {
    const policyId = manifesto.categories[category].policyId;
    if (policyId && !world.policies.some((item) => item.id === policyId)) throw new Error(`Manifesto policy ${policyId} is not in the active policy catalogue`);
  }
  if (!categories.length && !manifesto.promises.length) throw new Error('Add at least one policy or promise before publishing');
  for (const promise of manifesto.promises) {
    if (!promise.linkedPolicyId || !world.policies.some((item) => item.id === promise.linkedPolicyId)) throw new Error(`Promise ${promise.title} must link to an executable policy`);
  }
  const totalCost = categories.reduce((sum, key) => sum + manifesto.categories[key].fiscalCost, 0) + manifesto.promises.reduce((sum, item) => sum + item.estimatedCost, 0);
  manifesto.status = 'Published';
  manifesto.publishedAt = world.time.date;
  manifesto.version = (manifesto.version || 0) + 1;
  manifesto.estimatedTotalCost = totalCost;
  party.manifesto = structuredClone(manifesto);
  party.manifestoCommitments = categories.map((category) => manifesto.categories[category].policyId).filter(Boolean);
  party.manifestoPublishedAt = world.time.date;
  return { manifesto, totalCost };
}


export function implementManifestoPolicy(world, category) {
  const party = requireParty(world);
  const manifesto = party.manifesto;
  if (!manifesto || manifesto.status !== 'Published') throw new Error('Publish the party manifesto before implementation');
  const commitment = manifesto.categories?.[category];
  if (!commitment?.policyId) throw new Error('This manifesto category is not linked to an executable policy template');
  const policy = approvePolicy(world, commitment.policyId);
  commitment.status = 'Implementing';
  commitment.implementedAt = world.time.date;
  commitment.policyStatus = policy.status;
  return policy;
}

export function fulfilManifestoPromise(world, promiseId) {
  const party = requireParty(world);
  const promise = party.manifesto?.promises?.find((item) => item.id === promiseId);
  if (!promise) throw new Error('Manifesto promise not found');
  if (!promise.linkedPolicyId) throw new Error('This promise has no linked policy template and cannot be marked delivered');
  const policy = approvePolicy(world, promise.linkedPolicyId);
  promise.status = 'Implementing';
  promise.implementedAt = world.time.date;
  promise.policyStatus = policy.status;
  return policy;
}
