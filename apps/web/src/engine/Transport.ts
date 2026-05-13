import { audioEngine } from "./AudioEngine";
import { metronomeScheduler } from "./MetronomeScheduler";
import { clipScheduler } from "./ClipScheduler";
import { useProjectStore } from "../store/projectStore";

export type PlayState = "stopped" | "playing" | "paused";

class Transport {
  private _state: PlayState = "stopped";
  private transportStartAudioTime = 0;
  private transportStartProjectTime = 0;
  private _playheadTime = 0;

  get state(): PlayState {
    return this._state;
  }

  get isPlaying(): boolean {
    return this._state === "playing";
  }

  get projectTime(): number {
    if (this._state !== "playing") return this._playheadTime;
    return (
      this.transportStartProjectTime +
      (audioEngine.currentTime - this.transportStartAudioTime)
    );
  }

  async play(onPlay?: () => void) {
    if (this._state === "playing") return;
    await audioEngine.resume();
    this.transportStartAudioTime = audioEngine.currentTime;
    this.transportStartProjectTime = this._playheadTime;
    this._state = "playing";
    metronomeScheduler.start();
    onPlay?.();
  }

  pause() {
    if (this._state !== "playing") return;
    this._playheadTime = this.projectTime;
    this._state = "paused";
    metronomeScheduler.stop();
  }

  stop(onStop?: () => void) {
    this._playheadTime = 0;
    this._state = "stopped";
    metronomeScheduler.stop();
    onStop?.();
  }

  seek(time: number) {
    const wasPlaying = this._state === "playing";
    if (wasPlaying) {
      this._state = "paused";
      clipScheduler.cancelAll();
    }
    this._playheadTime = Math.max(0, time);
    if (wasPlaying) {
      this.transportStartAudioTime = audioEngine.currentTime;
      this.transportStartProjectTime = this._playheadTime;
      this._state = "playing";
      const { project } = useProjectStore.getState();
      clipScheduler.schedule(project.tracks);
      metronomeScheduler.seek();
    }
  }
}

export const transport = new Transport();
