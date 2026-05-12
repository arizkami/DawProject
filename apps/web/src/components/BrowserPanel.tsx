import { FileAudio2, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useProjectStore } from "../store/projectStore";
import { BROWSER_WIDTH } from "../theme";
import type { DawFile } from "../types/daw";

function fileBadge(file: DawFile) {
  if (file.mimeType.includes("mpeg") || file.name.toLowerCase().endsWith(".mp3")) return "MP3";
  if (file.mimeType.includes("wav") || file.name.toLowerCase().endsWith(".wav")) return "WAV";
  return "Audio";
}

export function BrowserPanel({ onImport }: { onImport?: () => void }) {
  const files = useProjectStore((s) => s.project.files);
  const [query, setQuery] = useState("");
  const visibleFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;
    return files.filter((file) => file.name.toLowerCase().includes(normalized));
  }, [files, query]);

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden  border border-daw-border bg-daw-panel shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      style={{ width: BROWSER_WIDTH, minWidth: BROWSER_WIDTH }}
    >
      <div className="border-b border-daw-border bg-daw-surface px-2 py-0 pb-2">
        <div className="mb-3 flex items-center justify-between gap-2 py-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-daw-text">Browser</div>
            </div>
          </div>
          <button
            onClick={onImport}
            title="Import audio"
            className="flex h-4 w-4 items-center justify-center rounded-lg text-daw-dim transition-colors hover:border-daw-border-light hover:text-daw-text"
          >
            <Upload size={14} />
          </button>
        </div>

        <label className="flex h-6 items-center gap-2 rounded-lg border border-daw-border bg-daw-bg px-2.5 text-daw-faint focus-within:border-daw-accent">
          <Search size={12} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search audio"
            className="min-w-0 flex-1  bg-transparent text-[11px] text-daw-text outline-none placeholder:text-daw-faint"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visibleFiles.length === 0 ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center  border border-dashed border-daw-border bg-daw-surface/60 px-5 py-7 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-daw-surface-high text-daw-faint">
              <FileAudio2 size={25} />
            </div>
            <div className="text-[11px] font-semibold text-daw-text">
              {files.length === 0 ? "No audio imported" : "No matching audio"}
            </div>
            <div className="mt-1.5 max-w-44 text-[12px] leading-5 text-daw-faint">
              {files.length === 0 ? "Import WAV or MP3 files to build the arrangement." : "Adjust the search term."}
            </div>
            {files.length === 0 && (
              <button
                onClick={onImport}
                className="mt-4 h-9 rounded-lg bg-daw-accent px-4 text-[11px] font-semibold text-daw-ink transition-colors hover:bg-daw-accent-h"
              >
                Import Audio
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {visibleFiles.map((file) => (
              <button
                key={file.id}
                className="group flex w-full items-center gap-1 border-y border-daw-border bg-daw-bg px-1 py-1 text-left transition-colors hover:border-daw-border hover:bg-daw-surface-high"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center text-daw-cyan group-hover:text-daw-text">
                  <FileAudio2 size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-daw-text">{file.name}</div>
                </div>
                <span className="rounded-md border border-daw-border bg-daw-bg px-1.5 py-0.5 text-[10px] text-daw-faint">
                  {fileBadge(file)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
