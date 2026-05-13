import { audioEngine } from "./AudioEngine";
import { mixer } from "./Mixer";
import { transport } from "./Transport";
import { useProjectStore } from "../store/projectStore";
import { useMetronomeStore } from "../store/metronomeStore";
import { secondsPerBeat, beatsPerBar } from "../utils/musicalTime";

class MetronomeScheduler {
  private intervalId: number | null = null;
  private nextNoteTime: number = 0;
  private currentBeat: number = 0;

  start() {
    this.stop();
    this.sync();
    this.intervalId = window.setInterval(() => this.scheduleNextNotes(), 25);
  }

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  seek() {
    if (this.intervalId !== null) {
      this.sync();
    }
  }

  private sync() {
    const { project } = useProjectStore.getState();
    const bpm = project.bpm || 120;
    const spb = secondsPerBeat(bpm);
    const pTime = transport.projectTime;
    
    // Find the next beat boundary on or after the playhead time
    this.currentBeat = Math.ceil(pTime / spb);
    
    // The exact project time of the next beat
    const nextBeatProjectTime = this.currentBeat * spb;
    const beatOffset = nextBeatProjectTime - pTime;
    
    this.nextNoteTime = audioEngine.currentTime + beatOffset;
  }

  private scheduleNextNotes() {
    const { enabled, volume, accentVolume, sound } = useMetronomeStore.getState();
    const { project } = useProjectStore.getState();
    const bpm = project.bpm || 120;
    const spb = secondsPerBeat(bpm);
    const timeSig = project.timeSignature || { numerator: 4, denominator: 4 };
    const bpb = beatsPerBar(timeSig);

    const lookahead = 0.1; // 100ms
    while (this.nextNoteTime < audioEngine.currentTime + lookahead) {
      if (enabled) {
        // Beats are 0-indexed internally, so beat 0 is the start of the bar
        const isAccent = (this.currentBeat % bpb) === 0;
        this.scheduleClick(isAccent, this.nextNoteTime, volume, accentVolume, sound);
      }
      this.nextNoteTime += spb;
      this.currentBeat++;
    }
  }

  private scheduleClick(
    isAccent: boolean,
    time: number,
    volume: number,
    accentVolume: number,
    sound: "classic" | "wood" | "digital" | "soft"
  ) {
    const ctx = audioEngine.ctx;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const panner = ctx.createStereoPanner();

    let highFreq = 1200;
    let lowFreq = 800;
    let type: OscillatorType = "sine";
    let decay = 0.05;

    switch (sound) {
      case "classic":
        type = "square";
        highFreq = 1500;
        lowFreq = 1000;
        decay = 0.03;
        break;
      case "wood":
        type = "triangle";
        highFreq = 800;
        lowFreq = 600;
        decay = 0.04;
        break;
      case "digital":
        type = "sine";
        highFreq = 1200;
        lowFreq = 800;
        decay = 0.05;
        break;
      case "soft":
        type = "sine";
        highFreq = 600;
        lowFreq = 400;
        decay = 0.08;
        break;
    }

    osc.frequency.value = isAccent ? highFreq : lowFreq;
    osc.type = type;

    // Base volume calculation
    const baseVol = (isAccent ? accentVolume : volume) * 0.5; // Scale down a bit so it isn't deafening

    // Ensure safe scheduling
    const scheduledTime = Math.max(ctx.currentTime, time);

    env.gain.value = 0;
    env.gain.setValueAtTime(baseVol, scheduledTime);
    env.gain.exponentialRampToValueAtTime(0.001, scheduledTime + decay);

    // Force stereo output so it shows on both L/R master meters
    panner.pan.value = 0;

    osc.connect(env);
    env.connect(panner);
    panner.connect(mixer.getMasterInput());

    osc.start(scheduledTime);
    osc.stop(scheduledTime + decay);
  }
}

export const metronomeScheduler = new MetronomeScheduler();
