import React from 'react';
import { assetUrl, partyEmblemSlot } from '../assets/registry.js';
import { renderPartyLogoSVG } from '../engine/v130/partyArt.js';
import colours from '../assets/partyColours.json';
const customEmblem = { sun: '☀', star: '★', wheel: '☸', lotus: '✿', tree: '♣', torch: '♨', book: '▤', hand: '✋', bird: '◈', mountain: '▲', plough: '⚒', 'rising-sun': '☼' };
export default function PartyFlag({ partyId, colour, size = 42, emblem, secondaryColour }) {
  const source = emblem ? null : assetUrl(partyEmblemSlot(partyId));
  const generated = emblem ? `data:image/svg+xml,${encodeURIComponent(renderPartyLogoSVG(emblem, colour, secondaryColour))}` : null;
  return <span className="party-flag" style={{ background: colour || colours[partyId] || '#9b793a', width: size, height: size }}>
    {source ? <img src={source} alt={`${partyId} emblem`}/> : generated ? <img src={generated} alt={`${emblem} party emblem`}/> : <span role="img" aria-label={`${partyId} emblem`}>{customEmblem[emblem] || '✦'}</span>}
  </span>;
}
