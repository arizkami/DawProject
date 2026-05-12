import { useRef, useState } from "react";
import type { DawClip, DawTrack } from "../../types/daw";
import { useProjectStore } from "../../store/projectStore";
import { useUIStore } from "../../store/uiStore";
import { WaveformCanvas } from "./WaveformCanvas";
import { TRACK_HEIGHT } from "../../theme";
import { formatBeatLength } from "../../utils/musicalTime";

const LABEL_H = 14;
const PAD = 7;

function hex2rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type Props = { clip: DawClip; track: DawTrack };

export function AudioClip({ clip, track }: Props) {
  const { pixelsPerSecond, selectedClipId, setSelectedClipId, setSelectedTrackId } = useUIStore();
  const { peakCache, moveClip, project } = useProjectStore();
  const peaks = peakCache.get(clip.fileId);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const [dragging, setDragging] = useState(false);

  const left = clip.startTime * pixelsPerSecond;
  const width = Math.max(4, clip.duration * pixelsPerSecond);
  const clipH = TRACK_HEIGHT - PAD * 2;
  const waveH = clipH - LABEL_H;
  const selected = selectedClipId === clip.id;
  const color = track.color;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedClipId(clip.id);
    setSelectedTrackId(track.id);
    dragStartX.current = e.clientX;
    dragStartTime.current = clip.startTime;
    setDragging(true);

    const onMove = (ev: MouseEvent) => moveClip(clip.id, clip.trackId, Math.max(0, dragStartTime.current + (ev.clientX - dragStartX.current) / pixelsPerSecond));
    const onUp = () => { setDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute select-none overflow-hidden  border shadow-lg"
      style={{
        left,
        top: PAD,
        width,
        height: clipH,
        cursor: dragging ? "grabbing" : "grab",
        borderColor: selected ? color : "rgba(238,242,245,0.14)",
        boxShadow: selected ? `0 0 0 1px ${color}, 0 14px 26px rgba(0,0,0,0.26)` : "0 10px 22px rgba(0,0,0,0.2)",
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden px-2" style={{ height: LABEL_H, background: color }}>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black/50" />
        <span className="truncate text-[9px] -mt-[2px] font-bold leading-none text-black/80">
          {clip.name}
        </span>
        <span className="ml-auto shrink-0 text-[9px] tabular-nums text-black/60">
          {formatBeatLength(clip.duration, project.bpm)}
        </span>
      </div>

      <div className="relative overflow-hidden" style={{ height: waveH, background: hex2rgba(color, 0.19) }}>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-white/20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1.5 bg-black/20" />
        {peaks
          ? <WaveformCanvas peaks={peaks} width={width} height={waveH} color={hex2rgba(color, 0.95)} />
          : <div className="flex h-full items-center justify-center text-[9px]" style={{ color: hex2rgba(color, 0.55) }}>Generating peaks</div>
        }
      </div>
    </div>
  );
}
