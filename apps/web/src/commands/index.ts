/**
 * All concrete DAW commands.
 *
 * Each command captures the BEFORE and AFTER state it needs for perfect
 * undo / redo. Commands call the raw projectStore setters directly —
 * they do not go through historyStore again (no recursion).
 */

import type { DawClip, DawTrack } from "../types/daw";
import { useProjectStore } from "../store/projectStore";
import { mixer } from "../engine/Mixer";
import type { DawCommand } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function store() {
  return useProjectStore.getState();
}

// ─────────────────────────────────────────────────────────────────────────────
// Track commands
// ─────────────────────────────────────────────────────────────────────────────

export class AddTrackCommand implements DawCommand {
  readonly label: string;
  constructor(private track: DawTrack) {
    this.label = `Add Track "${track.name}"`;
  }
  execute() {
    store().addTrack(this.track);
    mixer.getOrCreateTrack(this.track.id, this.track.volume, this.track.pan);
  }
  undo() {
    store().removeTrack(this.track.id);
    // Note: mixer nodes intentionally stay alive — they are lightweight
  }
}

export class DeleteTrackCommand implements DawCommand {
  readonly label: string;
  private snapshot: DawTrack | undefined;

  constructor(private trackId: string) {
    const t = store().project.tracks.find((t) => t.id === trackId);
    this.snapshot = t ? { ...t, clips: [...t.clips] } : undefined;
    this.label = `Delete Track "${this.snapshot?.name ?? trackId}"`;
  }
  execute() {
    if (!this.snapshot) {
      this.snapshot = store().project.tracks.find((t) => t.id === this.trackId);
    }
    store().removeTrack(this.trackId);
  }
  undo() {
    if (this.snapshot) {
      store().addTrack(this.snapshot);
      mixer.getOrCreateTrack(this.snapshot.id, this.snapshot.volume, this.snapshot.pan);
    }
  }
}

export class RenameTrackCommand implements DawCommand {
  readonly label: string;
  constructor(
    private trackId: string,
    private newName: string,
    private oldName: string,
  ) {
    this.label = `Rename Track to "${newName}"`;
  }
  execute() { store().setTrackName(this.trackId, this.newName); }
  undo()    { store().setTrackName(this.trackId, this.oldName); }
}

export class SetTrackVolumeCommand implements DawCommand {
  readonly label = "Set Track Volume";
  constructor(
    private trackId: string,
    private newVolume: number,
    private oldVolume: number,
  ) {}
  execute() {
    store().setTrackVolume(this.trackId, this.newVolume);
    mixer.setVolume(this.trackId, this.newVolume);
  }
  undo() {
    store().setTrackVolume(this.trackId, this.oldVolume);
    mixer.setVolume(this.trackId, this.oldVolume);
  }
}

export class SetTrackPanCommand implements DawCommand {
  readonly label = "Set Track Pan";
  constructor(
    private trackId: string,
    private newPan: number,
    private oldPan: number,
  ) {}
  execute() {
    store().setTrackPan(this.trackId, this.newPan);
    mixer.setPan(this.trackId, this.newPan);
  }
  undo() {
    store().setTrackPan(this.trackId, this.oldPan);
    mixer.setPan(this.trackId, this.oldPan);
  }
}

export class SetTrackMuteCommand implements DawCommand {
  readonly label: string;
  constructor(
    private trackId: string,
    private newMuted: boolean,
  ) {
    this.label = newMuted ? "Mute Track" : "Unmute Track";
  }
  execute() {
    store().setTrackMute(this.trackId, this.newMuted);
    mixer.setMute(this.trackId, this.newMuted);
  }
  undo() {
    store().setTrackMute(this.trackId, !this.newMuted);
    mixer.setMute(this.trackId, !this.newMuted);
  }
}

export class SetTrackSoloCommand implements DawCommand {
  readonly label: string;
  constructor(
    private trackId: string,
    private newSolo: boolean,
  ) {
    this.label = newSolo ? "Solo Track" : "Unsolo Track";
  }
  execute() {
    store().setTrackSolo(this.trackId, this.newSolo);
    mixer.setSolo(this.trackId, this.newSolo);
  }
  undo() {
    store().setTrackSolo(this.trackId, !this.newSolo);
    mixer.setSolo(this.trackId, !this.newSolo);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clip commands
// ─────────────────────────────────────────────────────────────────────────────

export class AddClipCommand implements DawCommand {
  readonly label: string;
  constructor(
    private trackId: string,
    private clip: DawClip,
  ) {
    this.label = `Add Clip "${clip.name}"`;
  }
  execute() { store().addClip(this.trackId, this.clip); }
  undo()    { store().removeClip(this.clip.id); }
}

export class MoveClipCommand implements DawCommand {
  readonly label = "Move Clip";
  constructor(
    private clipId: string,
    private trackId: string,
    private newStartTime: number,
    private oldStartTime: number,
    /** Set when the clip moves to a different track */
    private newTrackId?: string,
    private oldTrackId?: string,
  ) {}

  execute() {
    if (this.newTrackId && this.newTrackId !== this.oldTrackId) {
      store().moveClipToTrack(this.clipId, this.newTrackId, this.newStartTime);
    } else {
      store().moveClip(this.clipId, this.trackId, this.newStartTime);
    }
  }
  undo() {
    if (this.oldTrackId && this.oldTrackId !== this.newTrackId) {
      store().moveClipToTrack(this.clipId, this.oldTrackId, this.oldStartTime);
    } else {
      store().moveClip(this.clipId, this.trackId, this.oldStartTime);
    }
  }
}

export class ResizeClipCommand implements DawCommand {
  readonly label = "Resize Clip";
  constructor(
    private clipId: string,
    private trackId: string,
    private newStartTime: number,
    private newOffset: number,
    private newDuration: number,
    private oldStartTime: number,
    private oldOffset: number,
    private oldDuration: number,
  ) {}
  execute() {
    store().resizeClip(this.clipId, this.trackId, this.newStartTime, this.newOffset, this.newDuration);
  }
  undo() {
    store().resizeClip(this.clipId, this.trackId, this.oldStartTime, this.oldOffset, this.oldDuration);
  }
}

export class SplitClipCommand implements DawCommand {
  readonly label = "Split Clip";
  /** The second clip created by the split — generated at execute() time */
  private splitClipId: string | null = null;
  private originalClip: DawClip | undefined;

  constructor(
    private clipId: string,
    private time: number,
  ) {
    this.originalClip = store().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);
  }

  execute() {
    // Snapshot the current clip so undo can restore it
    this.originalClip = store().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === this.clipId);

    store().splitClip(this.clipId, this.time);

    // Find the new clip that was created (the one with id !== this.clipId starting at this.time)
    this.splitClipId = store().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id !== this.clipId && c.startTime === this.time && c.fileId === this.originalClip?.fileId)
      ?.id ?? null;
  }

  undo() {
    // Remove the second half
    if (this.splitClipId) store().removeClip(this.splitClipId);
    // Restore original clip dimensions
    if (this.originalClip) {
      store().resizeClip(
        this.clipId,
        this.originalClip.trackId,
        this.originalClip.startTime,
        this.originalClip.offset,
        this.originalClip.duration,
      );
    }
  }
}

export class DeleteClipsCommand implements DawCommand {
  readonly label: string;
  /** Snapshots of all deleted clips (with their original trackIds) */
  private snapshots: Array<{ trackId: string; clip: DawClip }> = [];

  constructor(private clipIds: string[]) {
    this.label = clipIds.length === 1 ? "Delete Clip" : `Delete ${clipIds.length} Clips`;
    // Capture the clips now, before deletion
    this._captureSnapshots();
  }

  private _captureSnapshots() {
    const ids = new Set(this.clipIds);
    for (const track of store().project.tracks) {
      for (const clip of track.clips) {
        if (ids.has(clip.id)) {
          this.snapshots.push({ trackId: track.id, clip: { ...clip } });
        }
      }
    }
  }

  execute() {
    // Re-capture in case execute() is called after redo
    this.snapshots = [];
    this._captureSnapshots();
    store().deleteClips(this.clipIds);
  }
  undo() {
    for (const { trackId, clip } of this.snapshots) {
      store().addClip(trackId, clip);
    }
  }
}

export class DuplicateClipsCommand implements DawCommand {
  readonly label: string;
  /** IDs of the newly created duplicates — filled at execute() time */
  private newClipIds: string[] = [];

  constructor(private clipIds: string[]) {
    this.label = clipIds.length === 1 ? "Duplicate Clip" : `Duplicate ${clipIds.length} Clips`;
  }

  execute() {
    const before = new Set(
      store().project.tracks.flatMap((t) => t.clips.map((c) => c.id)),
    );
    store().duplicateClips(this.clipIds);
    this.newClipIds = store()
      .project.tracks.flatMap((t) => t.clips.map((c) => c.id))
      .filter((id) => !before.has(id));
  }
  undo() {
    if (this.newClipIds.length) store().deleteClips(this.newClipIds);
  }
}

export class UpdateClipCommand implements DawCommand {
  readonly label: string;
  private oldValues: Partial<DawClip>;

  constructor(
    private clipId: string,
    private updates: Partial<DawClip>,
    label?: string,
  ) {
    this.label = label ?? "Edit Clip";
    // Capture the current values for the keys we are about to change
    const clip = store().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);
    const old: Partial<DawClip> = {};
    for (const key of Object.keys(updates) as Array<keyof DawClip>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (old as any)[key] = clip?.[key];
    }
    this.oldValues = old;
  }
  execute() { store().updateClip(this.clipId, this.updates); }
  undo()    { store().updateClip(this.clipId, this.oldValues); }
}
