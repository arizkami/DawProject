import { useProjectStore } from "../../store/projectStore";
import { TrackHeader } from "./TrackHeader";
import { TrackLane } from "./TrackLane";
import { HEADER_WIDTH, TRACK_HEIGHT } from "../../theme";

export function TrackList({ timelineWidth }: { timelineWidth: number }) {
  const tracks = useProjectStore((s) => s.project.tracks);

  if (tracks.length === 0) {
    return (
      <div className="flex h-full min-h-96 flex-col items-center justify-center gap-3" style={{ paddingLeft: HEADER_WIDTH }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-daw-border bg-daw-surface text-daw-faint">
          <svg width={31} height={31} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-[15px] font-semibold text-daw-text">No arrangement yet</div>
          <div className="mt-1.5 text-[12px] text-daw-faint">Import audio to create tracks and clips.</div>
        </div>
      </div>
    );
  }

  const minTimelineWidth = HEADER_WIDTH + timelineWidth;
  const contentHeight = tracks.length * TRACK_HEIGHT;

  return (
    <div
      className="relative flex h-full min-h-full min-w-full flex-col"
      style={{ minWidth: minTimelineWidth, minHeight: `max(100%, ${contentHeight}px)` }}
    >
      <div
        className="sticky left-0 z-10 h-full shrink-0 border-r border-daw-border bg-daw-surface shadow-[8px_0_18px_rgba(0,0,0,0.22)]"
        style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }}
      />
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="absolute left-0 right-0 flex min-w-full"
          style={{ minWidth: minTimelineWidth, top: i * TRACK_HEIGHT }}
        >
          <TrackHeader track={track} index={i} />
          <TrackLane track={track} width={timelineWidth} />
        </div>
      ))}
    </div>
  );
}
