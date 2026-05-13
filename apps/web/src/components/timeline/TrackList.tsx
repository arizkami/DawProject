import { useProjectStore } from "../../store/projectStore";
import { TrackHeader } from "./TrackHeader";
import { TrackLane } from "./TrackLane";
import { HEADER_WIDTH, TRACK_HEIGHT } from "../../theme";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DawTrack } from "../../types/daw";

function SortableTrackRow({
  track,
  index,
  allTracks,
  timelineWidth,
  minTimelineWidth,
}: {
  track: DawTrack;
  index: number;
  allTracks: DawTrack[];
  timelineWidth: number;
  minTimelineWidth: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style: React.CSSProperties = {
    minWidth: minTimelineWidth,
    top: index * TRACK_HEIGHT,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 60 : undefined,
    outline: isDragging ? "1px solid rgba(120,170,255,0.55)" : undefined,
    outlineOffset: isDragging ? "-1px" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className="absolute left-0 right-0 flex min-w-full"
      style={style}
    >
      <TrackHeader
        track={track}
        index={index}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
      <TrackLane
        track={track}
        allTracks={allTracks}
        trackIndex={index}
        width={timelineWidth}
      />
    </div>
  );
}

export function TrackList({ timelineWidth }: { timelineWidth: number }) {
  const tracks = useProjectStore((s) => s.project.tracks);
  const reorderTracks = useProjectStore((s) => s.reorderTracks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  if (tracks.length === 0) {
    return (
      <div className="flex h-full min-h-96 flex-col items-center justify-center gap-3" style={{ paddingLeft: HEADER_WIDTH }}>

      </div>
    );
  }

  const minTimelineWidth = HEADER_WIDTH + timelineWidth;
  const contentHeight = tracks.length * TRACK_HEIGHT;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderTracks(String(active.id), String(over.id));
  }

  return (
    <div
      className="relative flex h-full min-h-full min-w-full flex-col"
      style={{ minWidth: minTimelineWidth, minHeight: `max(100%, ${contentHeight}px)` }}
    >
      <div
        className="sticky left-0 z-40 h-full shrink-0 border-r border-daw-border bg-daw-surface shadow-[8px_0_18px_rgba(0,0,0,0.22)]"
        style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tracks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tracks.map((track, i) => (
            <SortableTrackRow
              key={track.id}
              track={track}
              index={i}
              allTracks={tracks}
              timelineWidth={timelineWidth}
              minTimelineWidth={minTimelineWidth}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
