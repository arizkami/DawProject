export type FB2AMode = "compress" | "limit";
export type FB2AMeterMode = "gr" | "output" | "input";

export type FB2AParams = {
  power: boolean;
  peakReduction: number;     // 0..100
  gainDb: number;            // -12..24
  mode: FB2AMode;
  emphasis: number;          // 0..100
  mix: number;               // 0..100
  noise: boolean;
  color: number;             // 0..100
  stereoLink: number;        // 0..100
  meter: FB2AMeterMode;
  sidechainLowCutHz: number; // 20..500
  outputTrimDb: number;      // -12..12
};

export const FB2A_DEFAULT_PARAMS: FB2AParams = {
  power: true,
  peakReduction: 35,
  gainDb: 0,
  mode: "compress",
  emphasis: 45,
  mix: 100,
  noise: false,
  color: 12,
  stereoLink: 100,
  meter: "gr",
  sidechainLowCutHz: 90,
  outputTrimDb: 0,
};

const VALID_MODES: FB2AMode[] = ["compress", "limit"];
const VALID_METERS: FB2AMeterMode[] = ["gr", "output", "input"];

export function normalizeFB2AParams(
  raw: Record<string, number | string | boolean> | undefined
): FB2AParams {
  const d = FB2A_DEFAULT_PARAMS;
  const mode  = raw?.mode;
  const meter = raw?.meter;
  return {
    power:             asBool(raw?.power, d.power),
    peakReduction:     clamp(asNum(raw?.peakReduction, d.peakReduction), 0, 100),
    gainDb:            clamp(asNum(raw?.gainDb, d.gainDb), -12, 24),
    mode:              VALID_MODES.includes(mode as FB2AMode) ? (mode as FB2AMode) : d.mode,
    emphasis:          clamp(asNum(raw?.emphasis, d.emphasis), 0, 100),
    mix:               clamp(asNum(raw?.mix, d.mix), 0, 100),
    noise:             asBool(raw?.noise, d.noise),
    color:             clamp(asNum(raw?.color, d.color), 0, 100),
    stereoLink:        clamp(asNum(raw?.stereoLink, d.stereoLink), 0, 100),
    meter:             VALID_METERS.includes(meter as FB2AMeterMode) ? (meter as FB2AMeterMode) : d.meter,
    sidechainLowCutHz: clamp(asNum(raw?.sidechainLowCutHz, d.sidechainLowCutHz), 20, 500),
    outputTrimDb:      clamp(asNum(raw?.outputTrimDb, d.outputTrimDb), -12, 12),
  };
}

export function serializeFB2AParams(
  p: FB2AParams
): Record<string, number | string | boolean> {
  return {
    power: p.power, peakReduction: p.peakReduction, gainDb: p.gainDb,
    mode: p.mode, emphasis: p.emphasis, mix: p.mix, noise: p.noise,
    color: p.color, stereoLink: p.stereoLink, meter: p.meter,
    sidechainLowCutHz: p.sidechainLowCutHz, outputTrimDb: p.outputTrimDb,
  };
}

export function peakReductionToThresholdDb(peakReduction: number): number {
  return -6 - (peakReduction / 100) * 42;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function asNum(v: number | string | boolean | undefined, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asBool(v: number | string | boolean | undefined, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
