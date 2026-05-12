import type { DawTrack } from "../../types/daw";
import { AudioClip } from "./AudioClip";
import { TRACK_HEIGHT } from "../../theme";
import { useProjectStore } from "../../store/projectStore";
import { useUIStore } from "../../store/uiStore";
import { getBeatsPerBar, secondsPerBeat } from "../../utils/musicalTime";

export function TrackLane({ track, width }: { track: DawTrack; width: number }) {
  const bpm = useProjectStore((s) => s.project.bpm);
  const pixelsPerSecond = useUIStore((s) => s.pixelsPerSecond);
  const pixelsPerBeat = pixelsPerSecond * secondsPerBeat(bpm);
  const pixelsPerBar = pixelsPerBeat * getBeatsPerBar();

  return (
    <div
      className="relative min-w-0 flex-1 overflow-hidden border-b border-daw-border bg-daw-bg"
      style={{ height: TRACK_HEIGHT, minWidth: width }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(86,97,110,0.34) 1px, transparent 1px), linear-gradient(to right, rgba(86,97,110,0.12) 1px, transparent 1px)",
          backgroundSize: `${pixelsPerBar}px 100%, ${pixelsPerBeat}px 100%`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 h-px bg-daw-surface-high" style={{ top: TRACK_HEIGHT / 2 }} />
      {track.clips.map((clip) => (
        <AudioClip key={clip.id} clip={clip} track={track} />
      ))}
    </div>
  );
}
