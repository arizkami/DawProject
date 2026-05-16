import { normalizeFB2AParams, peakReductionToThresholdDb } from "../../../../../../plugins/FB2AComp/Core";
import { dbToGain, smoothParam, equalPowerMix, clamp } from "../audioMath";
import type { InsertAudioNode, InsertNodeFactory } from "../types";

export const createFB2ACompNode: InsertNodeFactory = (audioCtx, device, _updateCtx) => {
  const input    = audioCtx.createGain();
  const output   = audioCtx.createGain();
  const dryGain  = audioCtx.createGain();
  const wetGain  = audioCtx.createGain();

  const comp     = audioCtx.createDynamicsCompressor();
  const makeup   = audioCtx.createGain();
  const trim     = audioCtx.createGain();

  // Sidechain high-pass (emphasis / low-cut for detector — approximated via filter before comp)
  const scFilter = audioCtx.createBiquadFilter();
  scFilter.type  = "highpass";

  // Routing:
  // input → dryGain → output                       (dry path)
  // input → scFilter → comp → makeup → trim → wetGain → output   (wet path)
  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(scFilter);
  scFilter.connect(comp);
  comp.connect(makeup);
  makeup.connect(trim);
  trim.connect(wetGain);
  wetGain.connect(output);

  // Defaults
  comp.knee.value    = 6;
  comp.attack.value  = 0.03;
  comp.release.value = 0.25;

  dryGain.gain.value = 0;
  wetGain.gain.value = 1;

  let lastDry = 0;
  let lastWet = 1;

  function applyParams(params: Record<string, number | string | boolean>): void {
    const m   = normalizeFB2AParams(params);
    const now = audioCtx.currentTime;

    const threshold = peakReductionToThresholdDb(m.peakReduction);
    smoothParam(comp.threshold, threshold, now, 0.02);

    // LA-2A optical ratios: compress ~3:1, limit ~∞:1 (use 20:1 as ceiling)
    const ratio = m.mode === "limit" ? 20 : 3;
    smoothParam(comp.ratio, ratio, now, 0.05);

    // Optical timing: slower attack/release curves
    const attackSec  = 0.005 + (1 - m.peakReduction / 100) * 0.04;
    const releaseSec = 0.06  + (1 - m.peakReduction / 100) * 0.45;
    smoothParam(comp.attack,  clamp(attackSec, 0.001, 0.1), now, 0.05);
    smoothParam(comp.release, clamp(releaseSec, 0.05, 0.5), now, 0.05);

    // Knee widens in limit mode
    smoothParam(comp.knee, m.mode === "limit" ? 2 : 8, now, 0.05);

    // Makeup gain: gainDb + outputTrimDb
    smoothParam(makeup.gain, dbToGain(m.gainDb), now);
    smoothParam(trim.gain,   dbToGain(m.outputTrimDb), now);

    // Sidechain low-cut (emphasis filter)
    smoothParam(scFilter.frequency, m.sidechainLowCutHz, now);

    // Parallel mix
    const { dry, wet } = equalPowerMix(m.mix);
    lastDry = dry;
    lastWet = wet;
    smoothParam(dryGain.gain, dry, now);
    smoothParam(wetGain.gain, wet, now);
  }

  applyParams(device.params);

  const node: InsertAudioNode = {
    id: device.id,
    input,
    output,

    update(params) {
      applyParams(params);
    },

    setEnabled(enabled, now) {
      dryGain.gain.setTargetAtTime(enabled ? lastDry : 1, now, 0.015);
      wetGain.gain.setTargetAtTime(enabled ? lastWet : 0, now, 0.015);
    },

    dispose() {
      input.disconnect();
      dryGain.disconnect();
      scFilter.disconnect();
      comp.disconnect();
      makeup.disconnect();
      trim.disconnect();
      wetGain.disconnect();
      output.disconnect();
    },
  };

  return node;
};
