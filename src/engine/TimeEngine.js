export const TIME_CONFIG = {
  mode: 'real-time',
  startDate: '2025-01-01T08:00:00.000Z',
  secondsPerGameDay: 30,
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export class TimeEngine {
  constructor({ date = TIME_CONFIG.startDate, mode = TIME_CONFIG.mode, onTick = null, autoPause = null, secondsPerGameDay = TIME_CONFIG.secondsPerGameDay } = {}) {
    this.date = new Date(date);
    if (Number.isNaN(this.date.getTime())) throw new Error('Invalid game date');
    this.mode = mode;
    this.onTick = onTick;
    this.autoPause = autoPause;
    this.paused = true;
    this.speed = 1;
    this.elapsedReal = 0;
    this.pendingPause = null;
    this.secondsPerGameDay = Number.isFinite(Number(secondsPerGameDay)) && Number(secondsPerGameDay) > 0 ? Number(secondsPerGameDay) : TIME_CONFIG.secondsPerGameDay;
  }

  get month() { return this.date.getUTCFullYear() * 12 + this.date.getUTCMonth(); }
  get iso() { return this.date.toISOString(); }

  advanceHours(hours, context = {}) {
    if (!Number.isFinite(hours) || hours <= 0) throw new Error('hours must be positive');
    let remaining = hours;
    let advancedHours = 0;
    while (remaining > 0) {
      const step = Math.min(1, remaining);
      const previous = this.date.getTime();
      this.date = new Date(previous + step * HOUR);
      advancedHours += step;
      remaining -= step;
      this.onTick?.(this.date, step / 24, context);
      const stop = this.autoPause?.(this.date, context);
      if (stop) {
        this.paused = true;
        this.pendingPause = stop;
        break;
      }
      if (this.paused && this.pendingPause) break;
    }
    return { date: this.iso, advancedHours, paused: this.paused, pauseReason: this.pendingPause };
  }

  tick(dayDelta = 1, context = {}) {
    if (!Number.isInteger(dayDelta) || dayDelta < 1) throw new Error('dayDelta must be a positive integer');
    let advanced = 0;
    const wasPaused = this.paused;
    this.paused = false;
    this.pendingPause = null;
    for (let index = 0; index < dayDelta; index += 1) {
      this.date = new Date(this.date.getTime() + DAY);
      advanced += 1;
      this.onTick?.(this.date, 1, context);
      const stop = this.autoPause?.(this.date, context);
      if (stop) {
        this.paused = true;
        this.pendingPause = stop;
        break;
      }
      if (this.paused && this.pendingPause) break;
    }
    if (this.mode === 'turn-based' && !this.pendingPause) this.paused = true;
    if (wasPaused && advanced === 0) this.paused = true;
    return { date: this.iso, advanced, paused: this.paused, pauseReason: this.pendingPause };
  }

  setMode(mode) {
    if (!['turn-based', 'real-time'].includes(mode)) throw new Error('Invalid time mode');
    this.mode = mode;
    this.paused = true;
    this.pendingPause = null;
  }

  setSpeed(speed) {
    if (![1, 2, 4].includes(speed)) throw new Error('Speed must be 1, 2 or 4');
    this.speed = speed;
  }

  pause() { this.paused = true; }

  stop() { this.paused = true; this.elapsedReal = 0; this.pendingPause = null; return this.snapshot(); }

  resume() {
    if (this.mode !== 'real-time') return false;
    this.paused = false;
    this.pendingPause = null;
    return true;
  }

  consumeRealSeconds(seconds, context = {}) {
    if (this.mode !== 'real-time' || this.paused) return { advanced: 0, date: this.iso };
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid elapsed seconds');
    this.elapsedReal += seconds * this.speed;
    const days = Math.floor(this.elapsedReal / this.secondsPerGameDay);
    this.elapsedReal -= days * this.secondsPerGameDay;
    if (!days) return { advanced: 0, date: this.iso };
    const result = this.tick(days, context);
    const unprocessedDays = days - result.advanced;
    if (unprocessedDays > 0) this.elapsedReal += unprocessedDays * this.secondsPerGameDay;
    return result;
  }

  clearPause() { this.pendingPause = null; this.paused = false; }

  snapshot() {
    return { date: this.iso, mode: this.mode, speed: this.speed, paused: this.paused, elapsedReal: this.elapsedReal, pendingPause: this.pendingPause, secondsPerGameDay: this.secondsPerGameDay };
  }

  restore(snapshot) {
    this.date = new Date(snapshot.date);
    if (Number.isNaN(this.date.getTime())) throw new Error('Invalid saved game date');
    this.setMode(snapshot.mode);
    this.setSpeed(snapshot.speed || 1);
    this.paused = snapshot.paused !== false;
    this.elapsedReal = snapshot.elapsedReal || 0;
    this.secondsPerGameDay = Number(snapshot.secondsPerGameDay) > 0 ? Number(snapshot.secondsPerGameDay) : TIME_CONFIG.secondsPerGameDay;
    this.pendingPause = snapshot.pendingPause || null;
  }
}
