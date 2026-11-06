import React from 'react';
import { assetUrl } from '../assets/registry.js';

/** Interior scene banner. Artwork reserves its left third for one player portrait. */
export default function SceneBanner({ slot, portrait, alt = 'Player portrait' }) {
  const scene = assetUrl(slot);
  const player = assetUrl(`player.${portrait || 'B11'}`);
  if (!scene) return null;
  return <section className="scene-banner" aria-label="Section artwork">
    <img className="scene-banner-art" src={scene} alt="" />
    {player && <div className="scene-banner-portrait"><img src={player} alt={alt} /></div>}
  </section>;
}
