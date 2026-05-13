// Ultra-lean sandboxed preload. Avoid heavy imports and any work beyond
// declaring + freezing the bridge object. Everything here runs on the
// renderer's hot startup path.
import { contextBridge, ipcRenderer } from "electron";
import {
  IpcChannels,
  type MessageBoxOptions,
  type MessageBoxResult,
  type OpenDialogResult,
  type PickedAudioFile,
  type SaveDialogResult,
} from "./ipc/channels.js";

const invoke = ipcRenderer.invoke.bind(ipcRenderer);
const isMac = process.platform === "darwin";

const fsBridge = Object.freeze({
  pickAudioFiles: (): Promise<PickedAudioFile[]> =>
    invoke(IpcChannels.FsPickAudioFiles),
  revealInFileManager: (filePath: string): Promise<void> =>
    invoke(IpcChannels.FsRevealInFileManager, filePath),
});

const projectBridge = Object.freeze({
  showSaveDialog: (suggestedName?: string): Promise<SaveDialogResult> =>
    invoke(IpcChannels.ProjectSaveDialog, suggestedName),
  showOpenDialog: (): Promise<OpenDialogResult> =>
    invoke(IpcChannels.ProjectOpenDialog),
  read: (filePath: string): Promise<string | null> =>
    invoke(IpcChannels.ProjectRead, filePath),
  write: (filePath: string, contents: string): Promise<boolean> =>
    invoke(IpcChannels.ProjectWrite, filePath, contents),
});

const dialogBridge = Object.freeze({
  showMessageBox: (options: MessageBoxOptions): Promise<MessageBoxResult> =>
    invoke(IpcChannels.DialogMessageBox, options),
  showErrorBox: (title: string, message: string): Promise<void> =>
    invoke(IpcChannels.DialogErrorBox, title, message),
});

const windowBridge = Object.freeze({
  minimize: (): Promise<void> => invoke(IpcChannels.WindowMinimize),
  toggleMaximize: (): Promise<void> => invoke(IpcChannels.WindowToggleMaximize),
  close: (): Promise<void> => invoke(IpcChannels.WindowClose),
});

const dawElectron = Object.freeze({
  platform: process.platform,
  frameless: true,
  transparentWindow: true,
  // `titleBarOverlay` in main enables Chromium Window Controls Overlay on
  // Windows / Linux. Hidden titlebar on macOS uses the native traffic lights.
  windowControlsOverlayEnabled: !isMac,
  fs: fsBridge,
  project: projectBridge,
  dialog: dialogBridge,
  window: windowBridge,
});

contextBridge.exposeInMainWorld("dawElectron", dawElectron);

export type DawElectronBridge = typeof dawElectron;
