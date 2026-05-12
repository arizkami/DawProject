import { Circle, FolderOpen, PanelBottom, PanelRight, Pause, Play, Redo2, Save, Share2, SkipBack, Square, Undo2 } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import { useTransportStore } from "../store/transportStore";
import { useUIStore } from "../store/uiStore";
import { transport } from "../engine/Transport";
import { clipScheduler } from "../engine/ClipScheduler";
import { formatBarBeatTick } from "../utils/musicalTime";

function Divider() {
  return <div className="mx-1 h-7 w-px shrink-0 bg-daw-border" />;
}

function IconBtn({
  icon: Icon, label, onClick, active = false, accent = false, danger = false, disabled = false, size = 14,
}: {
  icon: React.ElementType; label: string; onClick?: () => void;
  active?: boolean; accent?: boolean; danger?: boolean; disabled?: boolean; size?: number;
}) {
  const cls = [
    "flex h-4 w-4 shrink-0 items-center justify-center rounded-lg  transition-colors disabled:opacity-30",
    danger && active   ? "  text-daw-ink hover:bg-daw-red"
    : accent && active ? " text-daw-ink hover:bg-daw-accent-h"
    : active           ? "  text-daw-text hover:bg-daw-border"
    :                    " text-daw-dim hover:border-daw-border-light hover:bg-daw-surface-high hover:text-daw-text",
  ].join(" ");
  return (
    <button onClick={onClick} disabled={disabled} title={label} className={cls}>
      <Icon size={size} />
    </button>
  );
}

export function TransportBar({ onImport, onSave }: { onImport?: () => void; onSave?: () => void }) {
  const { isPlaying, playheadTime, setIsPlaying } = useTransportStore();
  const { project, setBpm } = useProjectStore();
  const { inspectorOpen, toggleInspector, mixerOpen, toggleMixer } = useUIStore();

  const handlePlay = async () => {
    await transport.play(() => { clipScheduler.schedule(project.tracks); setIsPlaying(true); });
  };
  const handlePause = () => { transport.pause(); clipScheduler.cancelAll(); setIsPlaying(false); };
  const handleStop  = () => { transport.stop(() => { clipScheduler.cancelAll(); setIsPlaying(false); }); };

  return (
    <div className="flex h-8 shrink-0 select-none items-center gap-2  border border-daw-border bg-daw-sunken px-3 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
      <div className="mr-1 flex min-w-56 shrink-0 items-center gap-2 border-r border-daw-border pr-3">
        <div className="min-w-0 flex items-center space-x-2">
          <div className="truncate text-[11px] font-semibold text-daw-text">{project.name}</div>
          <div className="text-[9px] text-daw-faint">Saved locally</div>
        </div>
      </div>

      <IconBtn icon={Undo2} label="Undo" disabled />
      <IconBtn icon={Redo2} label="Redo" disabled />

      <Divider />

      <IconBtn icon={PanelBottom} label="Toggle Mixer" active={mixerOpen} onClick={toggleMixer} />
      <IconBtn icon={PanelRight} label="Toggle Inspector" active={inspectorOpen} onClick={toggleInspector} />

      <Divider />

      <IconBtn icon={SkipBack} label="Return to start" onClick={() => { transport.seek(0); clipScheduler.cancelAll(); }} />
      {isPlaying
        ? <IconBtn icon={Pause}  label="Pause" active onClick={handlePause} />
        : <IconBtn icon={Play}   label="Play"         onClick={handlePlay}  size={15} />
      }
      <IconBtn icon={Square} label="Stop"   onClick={handleStop} disabled={!isPlaying && playheadTime === 0} />
      <IconBtn icon={Circle} label="Record" accent danger size={12} />

      <Divider />

      <div className="flex h-9 min-w-[7.75rem] items-center justify-center px-3 text-[14px] font-semibold tabular-nums text-daw-text">
        {formatBarBeatTick(playheadTime, project.bpm)}
      </div>

      <Divider />

      <div className="flex h-9 items-center gap-2 px-2.5">
        <span className="text-[9px] font-medium text-daw-faint">BPM</span>
        <input
          type="number" min={20} max={300} value={project.bpm}
          onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
          className="w-11 border-none bg-transparent text-center text-[11px] font-semibold text-daw-text outline-none"
        />
      </div>

      <div className="flex h-9 items-center gap-1 px-2.5">
        <span className="text-[11px] font-semibold text-daw-dim">4</span>
        <span className="opacity-20">/</span>
        <span className="text-[11px] font-semibold text-daw-dim">4</span>
      </div>

      <div className="flex-1" />

      <IconBtn icon={FolderOpen} label="Import Audio" onClick={onImport} />
      <IconBtn icon={Save}       label="Save Project" onClick={onSave} />
      <IconBtn icon={Share2} label="Share" disabled />
    </div>
  );
}
