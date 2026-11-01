import registry from './registry.json';
export { registry };
export const missingAssetSlots = [
  'player.B03', 'player.B05', 'player.B11',
  ...Array.from({ length: 12 }, (_, index) => `event.G${String(index + 1).padStart(2, '0')}`),
  'banner.courts', 'banner.meetings', 'banner.electionCommission',
  'thumb.courts.supreme', 'thumb.courts.high', 'thumb.courts.lower',
  'thumb.party.registration', 'thumb.alliance.meeting',
  'banner.A11', 'banner.A12', 'banner.A13', 'thumb.D12', 'thumb.D13', 'thumb.D14', 'thumb.D15', 'thumb.D16',
];
export function assetUrl(slot) { return registry[slot] || null; }
export function requireAsset(slot) { const path = assetUrl(slot); if (!path) throw new Error(`Missing asset slot: ${slot}`); return path; }
export function partyEmblemSlot(partyId) { return `emblem.${partyId}`; }
