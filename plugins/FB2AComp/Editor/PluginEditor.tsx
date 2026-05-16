import { useRef } from "react";
import {
  clamp,
  normalizeFB2AParams,
  serializeFB2AParams,
  type FB2AMode,
  type FB2AMeterMode,
  type FB2AParams,
} from "../Core";

type Props = {
  params: Record<string, number | string | boolean>;
  enabled: boolean;
  onParamsChange: (patch: Record<string, number | string | boolean>) => void;
  onToggleEnabled: () => void;
  onReset: () => void;
};

const ACCENT = "#e8a84a";
const ACCENT_DIM = "rgba(232,168,74,0.12)";
const ACCENT_BORDER = "rgba(232,168,74,0.38)";

export function FB2ACompEditor({ params, enabled, onParamsChange, onToggleEnabled, onReset }: Props) {
  const model = normalizeFB2AParams(params);

  const update = (patch: Partial<FB2AParams>) => {
    onParamsChange(serializeFB2AParams({ ...model, ...patch }));
  };

  return (
    <div
      className="flex h-full max-h-[380px] min-h-[260px] w-[700px] max-w-[1100px] flex-col overflow-hidden rounded-[6px] text-[11px] text-daw-text"
      style={{
        background: "#18171a",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 4px 28px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Header */}
      <div
        className="flex h-8 shrink-0 items-center gap-3 px-3"
        style={{
          background: "linear-gradient(180deg,#201e24 0%,#1b191f 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          type="button"
          onClick={onToggleEnabled}
          title={enabled ? "Bypass" : "Enable"}
          className="h-[13px] w-[13px] shrink-0 rounded-full transition-all"
          style={
            enabled
              ? { background: ACCENT, boxShadow: `0 0 8px rgba(232,168,74,0.75)`, border: `1px solid rgba(232,168,74,0.5)` }
              : { background: "#252025", border: "1px solid rgba(255,255,255,0.12)" }
          }
        />
        <span className="font-semibold tracking-[0.07em]" style={{ color: "#d8d0c8", fontSize: "11.5px" }}>FB-2A COMP</span>
        <span className="text-[8.5px] uppercase tracking-[0.18em]" style={{ color: "rgba(200,185,160,0.4)" }}>Optical Compressor</span>

        {/* Mode */}
        {(["compress", "limit"] as FB2AMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => update({ mode: m })}
            className="rounded px-2 py-[3px] capitalize"
            style={{
              fontSize: "9px",
              fontWeight: model.mode === m ? 600 : 400,
              color: model.mode === m ? ACCENT : "rgba(180,160,130,0.5)",
              background: model.mode === m ? ACCENT_DIM : "transparent",
              border: `1px solid ${model.mode === m ? ACCENT_BORDER : "transparent"}`,
            }}
          >
            {m === "compress" ? "Compress" : "Limit"}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={onReset} className="rounded px-2 py-[3px]"
            style={{ fontSize: "10px", color: "#8888a0", background: "#201e24", border: "1px solid rgba(255,255,255,0.07)" }}>
            Reset
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">

        {/* Left: Main knobs */}
        <div
          className="flex w-[200px] shrink-0 flex-col items-center justify-center gap-4 p-4"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "#131117" }}
        >
          <BigKnob
            label="Peak Reduction"
            display={`${model.peakReduction.toFixed(0)}`}
            unit="%"
            onDrag={(d) => update({ peakReduction: clamp(model.peakReduction + d * 0.6, 0, 100) })}
            accent={ACCENT}
            value={model.peakReduction / 100}
          />
          <BigKnob
            label="Gain"
            display={`${model.gainDb >= 0 ? "+" : ""}${model.gainDb.toFixed(1)}`}
            unit="dB"
            onDrag={(d) => update({ gainDb: clamp(model.gainDb + d * 0.2, -12, 24) })}
            accent={ACCENT}
            value={(model.gainDb + 12) / 36}
          />
        </div>

        {/* Center: GR meter */}
        <div
          className="flex w-[160px] shrink-0 flex-col items-center justify-between gap-2 p-3"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "#0f0e12" }}
        >
          <span className="text-[8.5px] uppercase tracking-widest" style={{ color: "#3a3040" }}>Meter</span>
          <GainReductionMeter peakReduction={model.peakReduction} mode={model.meter} enabled={enabled && model.power} />
          <div className="flex gap-1">
            {(["gr", "in", "out"] as const).map((m) => {
              const key = m === "in" ? "input" : m === "out" ? "output" : "gr";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update({ meter: key as FB2AMeterMode })}
                  className="rounded px-1.5 py-[2px] uppercase"
                  style={{
                    fontSize: "7.5px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: model.meter === key ? ACCENT : "#2a2030",
                    background: model.meter === key ? ACCENT_DIM : "#0c0b10",
                    border: `1px solid ${model.meter === key ? ACCENT_BORDER : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Secondary controls */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-3">
          <span className="mb-1 text-[8.5px] uppercase tracking-widest" style={{ color: "#3a3040" }}>Secondary</span>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
            <SecondaryKnob label="Emphasis"  display={`${model.emphasis.toFixed(0)}%`}         onDrag={(d) => update({ emphasis: clamp(model.emphasis + d * 0.6, 0, 100) })} />
            <SecondaryKnob label="Mix"       display={`${model.mix.toFixed(0)}%`}               onDrag={(d) => update({ mix: clamp(model.mix + d * 0.6, 0, 100) })} />
            <SecondaryKnob label="Color"     display={`${model.color.toFixed(0)}%`}             onDrag={(d) => update({ color: clamp(model.color + d * 0.6, 0, 100) })} />
            <SecondaryKnob label="St. Link"  display={`${model.stereoLink.toFixed(0)}%`}        onDrag={(d) => update({ stereoLink: clamp(model.stereoLink + d * 0.6, 0, 100) })} />
            <SecondaryKnob label="SC Cut"    display={`${Math.round(model.sidechainLowCutHz)}Hz`} onDrag={(d) => update({ sidechainLowCutHz: clamp(model.sidechainLowCutHz + d * 2, 20, 500) })} />
            <SecondaryKnob label="Trim"      display={`${model.outputTrimDb >= 0 ? "+" : ""}${model.outputTrimDb.toFixed(1)}dB`} onDrag={(d) => update({ outputTrimDb: clamp(model.outputTrimDb + d * 0.12, -12, 12) })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BigKnob ─────────────────────────────────────────────────────────────────

function BigKnob({ label, display, unit, onDrag, accent, value }: {
  label: string; display: string; unit: string;
  onDrag: (d: number) => void; accent: string; value: number;
}) {
  const ref = useRef<{ y: number } | null>(null);
  const r = 26;
  const startAngle = 220;
  const sweepAngle = 280;
  const angle = startAngle + value * sweepAngle;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 36, cy = 36;
  const trackPath = describeArc(cx, cy, r, startAngle, startAngle + sweepAngle);
  const valuePath = describeArc(cx, cy, r, startAngle, angle);

  return (
    <div
      className="flex cursor-ns-resize flex-col items-center gap-1"
      onPointerDown={(e) => { ref.current = { y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const s = ref.current; if (!s) return; onDrag(s.y - e.clientY); ref.current = { y: e.clientY }; }}
      onPointerUp={(e) => { ref.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }}
    >
      <svg width={72} height={72} viewBox="0 0 72 72">
        {/* Track */}
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
        {/* Value arc */}
        <path d={valuePath} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${accent}60)` }} />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="10" fill="#1a1820" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Indicator line */}
        <line
          x1={cx} y1={cy}
          x2={cx + 7 * Math.cos(toRad(angle - 90))}
          y2={cy + 7 * Math.sin(toRad(angle - 90))}
          stroke={accent} strokeWidth="2" strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <div className="tabular-nums" style={{ fontSize: "13px", color: "#c8c0b8", fontWeight: 600 }}>{display}</div>
        <div style={{ fontSize: "8px", color: "#5a5060" }}>{unit}</div>
      </div>
      <div style={{ fontSize: "8.5px", color: "#4a4050", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ── GR Meter ─────────────────────────────────────────────────────────────────

function GainReductionMeter({ peakReduction, mode, enabled }: {
  peakReduction: number; mode: FB2AMeterMode; enabled: boolean;
}) {
  const simulatedGr = enabled ? (peakReduction / 100) * 14 : 0;
  const fill = Math.min(1, simulatedGr / 20);
  const h = 100;
  const barH = fill * h;
  const accent = "#e8a84a";

  return (
    <div className="flex flex-col items-center gap-1" style={{ height: `${h + 28}px`, width: "80px" }}>
      {/* Scale labels */}
      <div className="flex h-full w-full flex-col" style={{ position: "relative" }}>
        <div className="relative flex-1 overflow-hidden rounded-sm" style={{ background: "#0a0910", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Bar */}
          <div
            className="absolute bottom-0 w-full rounded-sm transition-all duration-150"
            style={{
              height: `${barH}px`,
              background: fill > 0.7
                ? `linear-gradient(to top, ${accent}, rgba(232,100,74,0.8))`
                : `linear-gradient(to top, ${accent}aa, ${accent}44)`,
              boxShadow: fill > 0 ? `0 0 8px ${accent}40` : "none",
            }}
          />
          {/* Tick marks */}
          {[0, 3, 6, 10, 14, 20].map((db) => {
            const y = (1 - db / 20) * h;
            return (
              <div key={db} className="absolute right-0 flex items-center gap-0.5" style={{ top: `${y - 5}px` }}>
                <span style={{ fontSize: "6px", color: "#3a3040", lineHeight: 1 }}>{db}</span>
                <div style={{ width: "6px", height: "1px", background: "rgba(255,255,255,0.08)" }} />
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-center" style={{ fontSize: "7px", color: "#3a3040", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {mode === "gr" ? "GR dB" : mode === "input" ? "Input" : "Output"}
        </div>
      </div>
    </div>
  );
}

// ── SecondaryKnob ─────────────────────────────────────────────────────────────

function SecondaryKnob({ label, display, onDrag }: { label: string; display: string; onDrag: (d: number) => void }) {
  const ref = useRef<{ y: number } | null>(null);
  return (
    <div
      className="flex cursor-ns-resize flex-col gap-[4px]"
      onPointerDown={(e) => { ref.current = { y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const s = ref.current; if (!s) return; onDrag(s.y - e.clientY); ref.current = { y: e.clientY }; }}
      onPointerUp={(e) => { ref.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }}
    >
      <span className="uppercase tracking-wide" style={{ fontSize: "8px", color: "#4a4050" }}>{label}</span>
      <div className="flex items-center justify-between rounded px-2"
        style={{ height: "22px", background: "#0e0c12", border: "1px solid rgba(255,255,255,0.07)", fontSize: "11px", color: "#bbb0a8" }}>
        <span className="tabular-nums">{display}</span>
      </div>
    </div>
  );
}
