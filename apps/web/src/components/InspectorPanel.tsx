import { Mic2, Volume2, Sliders, X } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import { useUIStore } from "../store/uiStore";
import { mixer } from "../engine/Mixer";
import { INSPECTOR_WIDTH } from "../theme";
import { Knob } from "./ui/Knob";
import { formatBeatLength } from "../utils/musicalTime";

export function InspectorPanel() {
  const { selectedTrackId, toggleInspector } = useUIStore();
  const { project, setTrackVolume, setTrackPan } = useProjectStore();
  const track = project.tracks.find((t) => t.id === selectedTrackId) ?? null;

  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden  border border-daw-border bg-daw-panel shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      style={{ width: INSPECTOR_WIDTH, minWidth: INSPECTOR_WIDTH }}
    >
      <div className="flex h-6 shrink-0 items-center justify-between border-b border-daw-border bg-daw-surface px-2">
        <span className="text-[11px] font-semibold text-daw-text">Inspector</span>
        <button onClick={toggleInspector} className="rounded-lg p-1.5 text-daw-faint transition-colors hover:bg-daw-surface-high hover:text-daw-text">
          <X size={13} />
        </button>
      </div>

      {!track ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-[11px] leading-6 text-daw-faint">
          Select a track or clip to inspect channel settings.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <Section label="Track">
            <div className="flex items-center gap-3">
              <div className="h-12 w-2 shrink-0 rounded-full" style={{ background: track.color }} />
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-daw-text">{track.name}</div>
                <div className="mt-1 flex items-center gap-1 text-[9px] text-daw-faint">
                  <Mic2 size={9} /> Audio Track
                </div>
              </div>
            </div>
          </Section>

          <Section label="Channel">
            <div className="flex justify-center gap-8 pb-1 pt-2">
              <Knob value={track.volume} min={0} max={1} label="Vol"
                onChange={(v) => { setTrackVolume(track.id, v); mixer.setVolume(track.id, v); }} />
              <Knob value={track.pan} min={-1} max={1} label="Pan" color="#b995ff"
                onChange={(v) => { setTrackPan(track.id, v); mixer.setPan(track.id, v); }} />
            </div>
            <div className="mt-3 flex justify-center gap-8">
              <Stat label="Vol" value={`${Math.round(track.volume * 100)}%`} />
              <Stat label="Pan" value={track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.round(-track.pan * 100)}` : `R${Math.round(track.pan * 100)}`} />
            </div>
          </Section>

          <Section label="Inserts">
            <div className="flex flex-col gap-1">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex h-8 items-center justify-center gap-2 rounded-lg border border-dashed border-daw-border bg-daw-bg text-[9px] text-daw-faint">
                  <Sliders size={9} /> Empty Slot
                </div>
              ))}
            </div>
          </Section>

          <Section label={`Clips (${track.clips.length})`}>
            {track.clips.length === 0 ? (
              <div className="text-daw-faint text-[10px] py-1">No clips on this track</div>
            ) : (
              <div className="flex flex-col gap-1">
                {track.clips.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border border-daw-border bg-daw-bg px-2.5 py-2">
                    <Volume2 size={10} className="shrink-0 text-daw-faint" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-daw-dim truncate">{c.name}</div>
                      <div className="text-[9px] text-daw-faint">{formatBeatLength(c.duration, project.bpm)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-daw-border">
      <div className="px-3 pb-2 pt-4 text-[9px] font-semibold uppercase tracking-wide text-daw-faint">{label}</div>
      <div className="px-3 pb-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="mb-1 text-[10px] text-daw-faint">{label}</div>
      <div className="text-[12px] tabular-nums text-daw-dim">{value}</div>
    </div>
  );
}
