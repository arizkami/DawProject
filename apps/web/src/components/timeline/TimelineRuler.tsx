import { useEffect, useRef } from "react";
import { useUIStore } from "../../store/uiStore";
import { useProjectStore } from "../../store/projectStore";
import { C, HEADER_WIDTH, RULER_HEIGHT } from "../../theme";
import { formatBarBeat, getBeatsPerBar, secondsPerBeat } from "../../utils/musicalTime";

export function TimelineRuler({ width }: { width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const { pixelsPerSecond, scrollX } = useUIStore();
  const bpm = useProjectStore((s) => s.project.bpm);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const W = wrap.offsetWidth || 2000;
    canvas.width  = W;
    canvas.height = RULER_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = C.surface;
    ctx.fillRect(0, 0, W, RULER_HEIGHT);

    const spb = secondsPerBeat(bpm);
    const pixelsPerBeat = pixelsPerSecond * spb;
    const startBeat = scrollX / pixelsPerBeat;
    const endBeat = (scrollX + W) / pixelsPerBeat;
    const rawBeats = 80 / pixelsPerBeat;
    const niceList = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64];
    const intervalBeats = niceList.find((n) => n >= rawBeats) ?? 64;
    const subBeats = intervalBeats >= 4 ? 1 : intervalBeats / 2;
    const beatsPerBar = getBeatsPerBar();

    ctx.font = "11px Inter Variable, ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";

    // Sub-ticks
    ctx.strokeStyle = C.surfaceHigh;
    ctx.lineWidth   = 1;
    for (let beat = Math.floor(startBeat / subBeats) * subBeats; beat <= endBeat; beat += subBeats) {
      const x = Math.round(beat * pixelsPerBeat - scrollX);
      ctx.beginPath(); ctx.moveTo(x, RULER_HEIGHT - 5); ctx.lineTo(x, RULER_HEIGHT); ctx.stroke();
    }

    // Major ticks + labels
    ctx.strokeStyle = C.border;
    for (let beat = Math.floor(startBeat / intervalBeats) * intervalBeats; beat <= endBeat + intervalBeats; beat += intervalBeats) {
      const roundedBeat = Math.round(beat * 100) / 100;
      const x  = Math.round(roundedBeat * pixelsPerBeat - scrollX);
      const isBar = Math.abs(roundedBeat % beatsPerBar) < 0.001;
      ctx.strokeStyle = isBar ? C.borderHard : C.border;
      ctx.lineWidth = isBar ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, RULER_HEIGHT); ctx.stroke();
      ctx.fillStyle = C.dim;
      ctx.fillText(formatBarBeat(roundedBeat * spb, bpm), x + 5, RULER_HEIGHT / 2);
    }
  }, [bpm, pixelsPerSecond, scrollX, width]);

  return (
    <div className="flex shrink-0 border-b border-daw-border bg-daw-surface" style={{ height: RULER_HEIGHT }}>
      <div
        className="sticky left-0 z-30 flex shrink-0 items-center justify-between border-r border-daw-border bg-daw-surface px-2 shadow-[8px_0_18px_rgba(0,0,0,0.28)]"
        style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }}
      >
        <div className="pointer-events-none absolute bottom-0 right-[-12px] top-0 z-0 w-3 bg-gradient-to-r from-daw-surface to-transparent" />
        <span className="relative z-10 text-[11px] font-semibold text-daw-text">Arrangement</span>
        <span className="relative z-10 rounded-md border border-daw-border bg-daw-bg px-1.5 py-0.5 text-[10px] text-daw-faint">bar.beat</span>
      </div>
      <div ref={wrapRef} className="flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="block" />
      </div>
    </div>
  );
}
