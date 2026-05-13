import type { DawTrack } from "../types/daw";
import { useProjectStore } from "../store/projectStore";
import { useUIStore } from "../store/uiStore";
import { useTransportStore } from "../store/transportStore";
import { useMetronomeStore } from "../store/metronomeStore";
import { useHistoryStore } from "../store/historyStore";
import { transport } from "../engine/Transport";
import { getTrackColor } from "../theme";
import {
  AddTrackCommand,
  DeleteTrackCommand,
  DeleteClipsCommand,
  DuplicateClipsCommand,
  DuplicateTrackCommand,
  RenameTrackCommand,
  SetTrackColorCommand,
  SetTrackMuteCommand,
  SetTrackSoloCommand,
} from "../commands";

export function runAction(actionId: string) {
  // Close command palette if open
  const uiStore = useUIStore.getState();
  if (uiStore.commandPaletteOpen) uiStore.setCommandPaletteOpen(false);

  const projectStore = useProjectStore.getState();
  const transportStore = useTransportStore.getState();
  const metronomeStore = useMetronomeStore.getState();
  const history = useHistoryStore.getState();

  switch (actionId) {
    // ── Tools ──────────────────────────────────────────────────────────────
    case "tools:command-palette":
    case "tools:quick-search":
      uiStore.toggleCommandPalette();
      break;

    case "command:close":
      uiStore.setCommandPaletteOpen(false);
      break;

    // ── Transport ──────────────────────────────────────────────────────────
    case "transport:play-pause":
      if (transportStore.isPlaying) {
        transport.pause();
        transportStore.setIsPlaying(false);
      } else {
        void transport.play().then(() => transportStore.setIsPlaying(true));
      }
      break;

    case "transport:stop":
      transport.stop();
      transportStore.setIsPlaying(false);
      break;

    case "transport:go-to-start":
      transport.seek(0);
      break;

    case "transport:toggle-loop":
      uiStore.toggleLoop();
      break;

    case "transport:toggle-metronome":
      metronomeStore.toggle();
      break;

    case "transport:toggle-count-in":
      metronomeStore.toggleCountIn();
      break;

    // ── Edit ───────────────────────────────────────────────────────────────
    case "edit:undo":
      history.undo();
      break;

    case "edit:redo":
      history.redo();
      break;

    case "edit:delete": {
      const { selectedClipIds, selectedTrackId, focusedPanel } = uiStore;
      if (focusedPanel === "timeline" && selectedClipIds.length > 0) {
        history.execute(new DeleteClipsCommand(selectedClipIds));
        uiStore.setSelectedClipIds([]);
      } else if (selectedTrackId) {
        history.execute(new DeleteTrackCommand(selectedTrackId));
        uiStore.setSelectedTrackId(null);
        uiStore.setSelectedMixerTrackId(null);
      }
      break;
    }

    case "edit:delete-track": {
      const { selectedTrackId } = uiStore;
      if (selectedTrackId) {
        history.execute(new DeleteTrackCommand(selectedTrackId));
        uiStore.setSelectedTrackId(null);
        uiStore.setSelectedMixerTrackId(null);
      }
      break;
    }

    case "edit:duplicate": {
      const { selectedClipIds } = uiStore;
      if (selectedClipIds.length > 0) history.execute(new DuplicateClipsCommand(selectedClipIds));
      break;
    }

    case "edit:deselect-all":
      uiStore.setSelectedClipIds([]);
      uiStore.setSelectedTrackId(null);
      break;

    case "timeline:toggle-snap":
      uiStore.toggleSnapToGrid();
      break;

    // ── Track context-menu actions ─────────────────────────────────────────
    case "track:rename": {
      const { selectedTrackId } = uiStore;
      if (!selectedTrackId) break;
      const track = projectStore.project.tracks.find((t) => t.id === selectedTrackId);
      if (!track) break;
      const newName = window.prompt("Rename track:", track.name)?.trim();
      if (newName && newName !== track.name) {
        history.execute(new RenameTrackCommand(selectedTrackId, newName, track.name));
      }
      break;
    }

    case "track:duplicate": {
      const { selectedTrackId } = uiStore;
      if (selectedTrackId) history.execute(new DuplicateTrackCommand(selectedTrackId));
      break;
    }

    case "track:toggle-mute": {
      const { selectedTrackId } = uiStore;
      if (!selectedTrackId) break;
      const track = projectStore.project.tracks.find((t) => t.id === selectedTrackId);
      if (track) history.execute(new SetTrackMuteCommand(selectedTrackId, !track.muted));
      break;
    }

    case "track:toggle-solo": {
      const { selectedTrackId } = uiStore;
      if (!selectedTrackId) break;
      const track = projectStore.project.tracks.find((t) => t.id === selectedTrackId);
      if (track) history.execute(new SetTrackSoloCommand(selectedTrackId, !track.solo));
      break;
    }

    case "track:toggle-arm": {
      const { selectedTrackId } = uiStore;
      if (!selectedTrackId) break;
      const track = projectStore.project.tracks.find((t) => t.id === selectedTrackId);
      if (track) projectStore.setTrackArmed(selectedTrackId, !track.armed);
      break;
    }

    case "track:add-audio": {
      const tracks = projectStore.project.tracks;
      const newId = crypto.randomUUID();
      const newTrack: DawTrack = {
        id: newId,
        name: `Audio Track ${tracks.length + 1}`,
        type: "audio",
        color: getTrackColor(tracks.length),
        channelCount: 2,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        armed: false,
        clips: [],
      };
      history.execute(new AddTrackCommand(newTrack));
      uiStore.setSelectedTrackId(newId);
      break;
    }

    // Stubs — not yet implemented
    case "track:add-midi":
    case "track:add-plugin":
    case "track:add-bus":
    case "track:freeze":
    case "track:flatten":
    case "track:route-to":
    case "track:settings":
      break;

    // ── View ───────────────────────────────────────────────────────────────
    case "panel:toggle-mixer":
    case "view:toggle-mixer":
    case "window.show_mixer":
      uiStore.togglePanel("mixer");
      break;

    case "panel:toggle-inspector":
    case "view:toggle-inspector":
    case "window.show_inspector":
      uiStore.togglePanel("inspector");
      break;

    // ── Project ────────────────────────────────────────────────────────────
    case "project:save":
      projectStore.saveLocal();
      break;

    case "noop":
      break;

    default:
      // track:color:#RRGGBB
      if (actionId.startsWith("track:color:")) {
        const color = actionId.slice("track:color:".length);
        const { selectedTrackId } = uiStore;
        if (selectedTrackId) {
          const track = projectStore.project.tracks.find((t) => t.id === selectedTrackId);
          if (track) history.execute(new SetTrackColorCommand(selectedTrackId, color, track.color));
        }
        break;
      }
      console.warn(`[ActionRunner] Unhandled action: ${actionId}`);
  }
}
