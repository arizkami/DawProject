const BEATS_PER_BAR = 4;
const TICKS_PER_BEAT = 100;

export function secondsPerBeat(bpm: number): number {
  return 60 / Math.max(1, bpm);
}

export function secondsToBeats(seconds: number, bpm: number): number {
  return seconds / secondsPerBeat(bpm);
}

export function beatsToSeconds(beats: number, bpm: number): number {
  return beats * secondsPerBeat(bpm);
}

export function formatBarBeat(seconds: number, bpm: number): string {
  const totalBeats = Math.max(0, secondsToBeats(seconds, bpm));
  const wholeBeats = Math.floor(totalBeats);
  const bar = Math.floor(wholeBeats / BEATS_PER_BAR) + 1;
  const beat = (wholeBeats % BEATS_PER_BAR) + 1;

  return `${bar}.${beat}`;
}

export function formatBarBeatTick(seconds: number, bpm: number): string {
  const totalBeats = Math.max(0, secondsToBeats(seconds, bpm));
  const wholeBeats = Math.floor(totalBeats);
  const bar = Math.floor(wholeBeats / BEATS_PER_BAR) + 1;
  const beat = (wholeBeats % BEATS_PER_BAR) + 1;
  const tick = Math.floor((totalBeats - wholeBeats) * TICKS_PER_BEAT);

  return `${String(bar).padStart(3, "0")}.${beat}.${String(tick).padStart(2, "0")}`;
}

export function formatBeatLength(seconds: number, bpm: number): string {
  const totalBeats = secondsToBeats(seconds, bpm);
  if (totalBeats < BEATS_PER_BAR) {
    return `${Math.round(totalBeats * 10) / 10} bt`;
  }

  const bars = totalBeats / BEATS_PER_BAR;
  return `${Math.round(bars * 10) / 10} bar`;
}

export function getBeatsPerBar(): number {
  return BEATS_PER_BAR;
}
