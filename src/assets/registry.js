import registry from './registry.json';
export {registry};
export function assetUrl(slot){const path=registry[slot];return path||null;}
export function requireAsset(slot){const path=assetUrl(slot);if(!path)throw new Error(`Missing asset slot: ${slot}`);return path;}
export function partyEmblemSlot(partyId){return `emblem.${partyId}`;}
