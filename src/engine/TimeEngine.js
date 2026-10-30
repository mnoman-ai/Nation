export const TIME_CONFIG={mode:'turn-based'};
export class TimeEngine{constructor(onTick){this.month=0;this.onTick=onTick;}tick(monthDelta=1){if(!Number.isInteger(monthDelta)||monthDelta<1)throw new Error('monthDelta must be a positive integer');this.month+=monthDelta;this.onTick?.(this.month);return this.month;}}
