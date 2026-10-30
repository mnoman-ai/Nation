/** Small deterministic PRNG helpers. The stateful variant stores its cursor in serializable game state. */
export function seededRng(seed = 241024) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nextRandom(state) {
  let cursor = (Number(state.rngState) + 0x6D2B79F5) >>> 0;
  state.rngState = cursor;
  let t = cursor;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomBetween(state, min, max) {
  return min + nextRandom(state) * (max - min);
}
