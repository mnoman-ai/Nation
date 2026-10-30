import {TIME_MODE,MONTHS_PER_TURN} from './config.js';
/** Simulation time boundary. v1.0.0 only advances the monthly calendar counter. */
export function tick(state,monthDelta=MONTHS_PER_TURN){
  if(!Number.isInteger(monthDelta)||monthDelta<0)throw new RangeError('monthDelta must be a non-negative integer');
  if(TIME_MODE==='turn-based')return {...state,turn:(state.turn||0)+monthDelta};
  throw new Error(`Unsupported time mode: ${TIME_MODE}`);
}
export function seededRandom(seed=241024){
  let x=seed>>>0;
  return ()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
