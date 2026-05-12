import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import { useUIStore } from "../store/uiStore";
import { mixer } from "../engine/Mixer";
import { MIXER_HEIGHT } from "../theme";
import { VuMeter } from "./ui/VuMeter";

type MixerBtnProps = {
  label: string;
  active?: boolean;
  activeColor: string;
  onClick?: () => void;
  title?: string;
};

function MixerBtn({
  label,
  active = false,
  activeColor,
  onClick,
  title,
}: MixerBtnProps) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      aria-pressed={active}
      className={[
        "grid h-6 w-6 place-items-center rounded-md border text-[10px] font-black",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-white/10",
        active
          ? "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.28)]"
          : "hover:border-white/18 hover:bg-white/[0.045] active:scale-95",
      ].join(" ")}
      style={{
        background: active ? activeColor : "rgba(255,255,255,0.035)",
        borderColor: active ? activeColor : "rgba(255,255,255,0.09)",
        color: active ? "#0d1015" : "rgba(226,232,240,0.72)",
      }}
    >
      {label}
    </button>
  );
}

function volumeToDb(volume: number) {
  if (volume <= 0.001) return "-∞";
  const db = 20 * Math.log10(volume);
  return db >= 0 ? `+${db.toFixed(1)}` : db.toFixed(1);
}

type ChannelStripProps = {
  label: string;
  color?: string;
  volume: number;
  onVolume: (v: number) => void;
  muted?: boolean;
  solo?: boolean;
  onMute?: () => void;
  onSolo?: () => void;
  isMaster?: boolean;
};

function ChannelStrip({
  label,
  color = "#7c8a99",
  volume,
  onVolume,
  muted,
  solo,
  onMute,
  onSolo,
  isMaster = false,
}: ChannelStripProps) {
  const accent = isMaster ? "#48d1cc" : color;
  const volumePercent = Math.round(volume * 100);

  return (
    <section
      className={[
        "group relative flex h-full flex-col items-center overflow-hidden",
        "border-r border-white/[0.07]",
        "px-2 py-2",
        isMaster
          ? "w-[92px] min-w-[92px] bg-[linear-gradient(180deg,rgba(72,209,204,0.07),rgba(255,255,255,0.022))]"
          : "w-[88px] min-w-[88px] bg-[rgba(255,255,255,0.024)]",
      ].join(" ")}
    >
      <div
        className="absolute inset-x-2 top-0 h-[2px] rounded-full opacity-90"
        style={{ background: accent }}
      />

      <div className="w-full pt-0.5">
        <div
          className={[
            "relative overflow-hidden rounded-lg border px-2 py-1.5",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
          ].join(" ")}
          style={{
            background: `linear-gradient(180deg, ${accent}dd, ${accent}aa)`,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <span className="block truncate text-center text-[10.5px] font-bold leading-none text-[#0c1015]">
            {label}
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex h-6 items-center justify-center gap-1.5">
        {!isMaster ? (
          <>
            <MixerBtn
              label="M"
              active={!!muted}
              activeColor="#f3c969"
              onClick={onMute}
              title="Mute"
            />
            <MixerBtn
              label="S"
              active={!!solo}
              activeColor="#7bd88f"
              onClick={onSolo}
              title="Solo"
            />
          </>
        ) : (
          <span className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-white/45">
            Master
          </span>
        )}
      </div>

      <div
        className={[
          "mt-1.5 flex min-h-0 w-full flex-1 items-stretch justify-center gap-1.5",
          "rounded-xl border border-white/[0.08]",
          "bg-[linear-gradient(180deg,rgba(0,0,0,0.20),rgba(255,255,255,0.025))]",
          "px-2 py-2",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
        ].join(" ")}
      >
        <div className="relative flex min-h-[118px] flex-1 items-center justify-center">
          <div
            className="pointer-events-none absolute h-[112px] w-[3px] rounded-full bg-white/[0.07]"
          />
          <div
            className="pointer-events-none absolute bottom-1/2 h-px w-full bg-white/[0.06]"
          />
          <div
            className="pointer-events-none absolute bottom-[9px] w-[3px] rounded-full opacity-85"
            style={{
              height: `${Math.max(8, volume * 112)}px`,
              background: `linear-gradient(180deg, ${accent}ee, ${accent}66)`,
            }}
          />
          <div className="pointer-events-none absolute left-0 top-3 flex h-[96px] flex-col justify-between">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="block h-px w-2 bg-white/[0.09]" />
            ))}
          </div>

          <input
            aria-label={`${label} volume`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            className="daw-vertical-fader relative z-10"
            style={
              {
                "--fader-accent": accent,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="flex min-h-[118px] items-center">
          <VuMeter level={volume * 0.85} height={108} width={5} />
        </div>
      </div>

      <div className="mt-1.5 grid w-full grid-cols-1 gap-1">
        <div className="rounded-lg border border-white/[0.08] bg-black/20 px-1.5 py-1.5 text-center">
          <span className="block text-[10px] font-semibold tabular-nums text-white/72">
            {volumePercent}
          </span>
          <span className="block text-[8px] font-medium tabular-nums text-white/35">
            {volumeToDb(volume)} dB
          </span>
        </div>
      </div>
    </section>
  );
}
export function MixerPanel() {
  const tracks = useProjectStore((s) => s.project.tracks);
  const { setTrackVolume, setTrackMute, setTrackSolo } = useProjectStore();
  const { masterVolume, setMasterVolume, toggleMixer } = useUIStore();

  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden border border-daw-border bg-daw-surface-high shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      style={{ height: MIXER_HEIGHT, minHeight: MIXER_HEIGHT }}
    >
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-daw-border bg-daw-surface px-3">
        <SlidersHorizontal size={12} className="text-daw-faint" />
        <span className="text-[11px] font-semibold text-daw-text">Mixer</span>
        <span className="rounded-md border border-daw-border bg-daw-bg px-1.5 py-0.5 text-[9px] text-daw-faint">
          {tracks.length + 1} ch
        </span>
        <div className="flex-1" />
        <button onClick={toggleMixer} className="flex h-5 w-5 items-center justify-center rounded-md text-daw-faint transition-colors hover:bg-daw-surface-high hover:text-daw-text">
          <ChevronDown size={11} />
        </button>
      </div>

      <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
        {tracks.length === 0 && (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-[11px] leading-5 text-daw-faint">
            Import audio to add mixer channels.
          </div>
        )}
        {tracks.map((t) => (
          <ChannelStrip
            key={t.id} label={t.name} color={t.color}
            volume={t.volume} muted={t.muted} solo={t.solo}
            onVolume={(v) => { setTrackVolume(t.id, v); mixer.setVolume(t.id, v); }}
            onMute={() => { setTrackMute(t.id, !t.muted); mixer.setMute(t.id, !t.muted); }}
            onSolo={() => { setTrackSolo(t.id, !t.solo); mixer.setSolo(t.id, !t.solo); }}
          />
        ))}
        {tracks.length > 0 && <div className="min-w-4 flex-1" />}
        <ChannelStrip
          label="Master" isMaster volume={masterVolume}
          onVolume={(v) => { setMasterVolume(v); mixer.setMasterVolume(v); }}
        />
      </div>
    </div>
  );
}
