import registry from './registry.json';
export {registry};
export function assetUrl(slot){if(['player.B03','player.B05','event.G12'].includes(slot))return null;const path=registry[slot];return path||null;}
export function requireAsset(slot){const path=assetUrl(slot);if(!path)throw new Error(`Missing asset slot: ${slot}`);return path;}
export function partyEmblemSlot(partyId){return `emblem.${partyId}`;}
