import { ZoomIn, ZoomOut } from "lucide-react";
import { TimelineRuler } from "./TimelineRuler";
import { TrackList } from "./TrackList";
import { Playhead } from "./Playhead";
import { useUIStore } from "../../store/uiStore";
import { useProjectStore } from "../../store/projectStore";
import { secondsPerBeat } from "../../utils/musicalTime";

export function Timeline() {
  const { pixelsPerSecond, setPixelsPerSecond, setScrollX } = useUIStore();
  const { tracks, bpm } = useProjectStore((s) => s.project);
  const zoom = (f: number) => setPixelsPerSecond(Math.min(800, Math.max(10, pixelsPerSecond * f)));
  const pixelsPerBeat = pixelsPerSecond * secondsPerBeat(bpm);
  const timelineSeconds = Math.max(
    16,
    ...tracks.flatMap((track) => track.clips.map((clip) => clip.startTime + clip.duration + 4))
  );
  const timelineWidth = Math.max(1200, Math.ceil(timelineSeconds * pixelsPerSecond));

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden  border border-daw-border bg-daw-sunken shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <TimelineRuler width={timelineWidth} />

      <div
        className="relative flex-1 overflow-auto bg-daw-bg"
        onScroll={(event) => setScrollX(event.currentTarget.scrollLeft)}
      >
        <TrackList timelineWidth={timelineWidth} />
        <Playhead />
      </div>

      <div className="absolute bottom-4 rounded-full right-4 z-30 flex items-center gap-1  border border-daw-border bg-daw-surface px-2 py-1.5 shadow-xl">
        <button onClick={() => zoom(0.75)} title="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent text-daw-faint transition-colors hover:bg-daw-surface-high hover:text-daw-text">
          <ZoomOut size={12} />
        </button>
        <span className="min-w-12 text-center text-[9px] tabular-nums text-daw-dim">
          {Math.round(pixelsPerBeat)}px/bt
        </span>
        <button onClick={() => zoom(1.33)} title="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent text-daw-faint transition-colors hover:bg-daw-surface-high hover:text-daw-text">
          <ZoomIn size={12} />
        </button>
      </div>
    </div>
  );
}
