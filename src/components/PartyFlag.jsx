import React from 'react';
import { assetUrl, partyEmblemSlot } from '../assets/registry.js';
import colours from '../assets/partyColours.json';

const customEmblem = {
  sun: '☀', star: '★', wheel: '☸', lotus: '✿', tree: '♣', torch: '♨',
  book: '▤', hand: '✋', bird: '◈', mountain: '▲', plough: '⚒', 'rising-sun': '☼',
};

export default function PartyFlag({ partyId, colour, size = 42, emblem }) {
  const source = emblem ? null : assetUrl(partyEmblemSlot(partyId));
  return <span className="party-flag" style={{ background: colour || colours[partyId] || '#9b793a', width: size, height: size }}>
    {source ? <img src={source} alt={`${partyId} emblem`}/> : <span role="img" aria-label={`${emblem || partyId} emblem`}>{customEmblem[emblem] || '✦'}</span>}
  </span>;
}
