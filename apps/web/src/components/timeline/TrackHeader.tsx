import { Mic, Star, Volume2, VolumeX } from "lucide-react";
import type { DawTrack } from "../../types/daw";
import { useProjectStore } from "../../store/projectStore";
import { useUIStore } from "../../store/uiStore";
import { mixer } from "../../engine/Mixer";
import { HEADER_WIDTH, TRACK_HEIGHT } from "../../theme";

function TrackBtn({ icon: Icon, active, activeColor, label, onClick }: {
  icon: React.ElementType; active: boolean; activeColor: string; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      className="flex h-5 w-5 shrink-0 items-center justify-center transition-colors rounded-full"
      style={{ background: active ? activeColor : "#17191d", borderColor: active ? activeColor : "#3a424c", color: active ? "#101216" : "#b6c0ca" }}
    >
      <Icon size={10} />
    </button>
  );
}

export function TrackHeader({ track, index }: { track: DawTrack; index: number }) {
  const { setTrackVolume, setTrackMute, setTrackSolo, setTrackArmed } = useProjectStore();
  const { selectedTrackId, setSelectedTrackId } = useUIStore();
  const selected = selectedTrackId === track.id;
  const headerBg = selected ? "#292f36" : "#20242a";

  return (
    <div
      onClick={() => setSelectedTrackId(track.id)}
      className="sticky left-0 z-20 flex shrink-0 cursor-default overflow-visible border-r border-b border-daw-border transition-colors shadow-[8px_0_18px_rgba(0,0,0,0.28)]"
      style={{
        width: HEADER_WIDTH,
        minWidth: HEADER_WIDTH,
        height: TRACK_HEIGHT,
        background: headerBg,
      }}
    >
      <div
        className="pointer-events-none absolute bottom-0 right-[-12px] top-0 z-0 w-3"
        style={{ background: `linear-gradient(to right, ${headerBg}, transparent)` }}
      />
      <div className="w-1 shrink-0" style={{ background: track.color }} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between gap-2 overflow-hidden px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center  bg-daw-bg text-daw-faint">
            <Mic size={13} />
          </div>
          <span className={`flex-1 truncate text-[11px] font-semibold ${selected ? "text-daw-text" : "text-daw-dim"}`}>
            {track.name}
          </span>
          <div className="flex items-center gap-1">
            <TrackBtn icon={VolumeX} active={track.muted} activeColor="#e0b24d" label="Mute"
              onClick={() => { setTrackMute(track.id, !track.muted); mixer.setMute(track.id, !track.muted); }} />
            <TrackBtn icon={Star} active={track.solo} activeColor="#63c174" label="Solo"
              onClick={() => { setTrackSolo(track.id, !track.solo); mixer.setSolo(track.id, !track.solo); }} />
            <TrackBtn icon={Mic} active={track.armed} activeColor="#f06a61" label="Arm"
              onClick={() => setTrackArmed(track.id, !track.armed)} />

          </div>
          <span className="rounded-md border border-daw-border bg-daw-bg px-1.5 py-0.5 text-[10px] tabular-nums text-daw-faint">
            {String(index + 1).padStart(2, "0")}
          </span>

        </div>

        <div className="flex items-center gap-2">
          <Volume2 size={10} className="shrink-0 text-daw-faint" />
          <input
            type="range" min={0} max={1} step={0.01} value={track.volume}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); const v = parseFloat(e.target.value); setTrackVolume(track.id, v); mixer.setVolume(track.id, v); }}
            className="flex-1"
            style={{ accentColor: track.color }}
          />

          <span className="min-w-7 text-right text-[9px] tabular-nums text-daw-faint">
            {Math.round(track.volume * 100)}
          </span>
          <div className="ml-auto h-2 w-20 overflow-hidden rounded-full bg-daw-bg">
            <div className="h-full rounded-full" style={{ width: `${Math.max(4, track.volume * 100)}%`, background: track.color }} />
          </div>
        </div>


      </div>
    </div>
  );
}
