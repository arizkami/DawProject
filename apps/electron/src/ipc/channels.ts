/**
 * IPC channel constants + request/response types.
 * Shared between Electron main (`main.ts`) and renderer preload (`preload.ts`).
 */

export const IpcChannels = {
  FsPickAudioFiles: "daw:fs:pickAudioFiles",
  FsRevealInFileManager: "daw:fs:revealInFileManager",

  ProjectSaveDialog: "daw:project:saveDialog",
  ProjectOpenDialog: "daw:project:openDialog",
  ProjectRead: "daw:project:read",
  ProjectWrite: "daw:project:write",

  DialogMessageBox: "daw:dialog:messageBox",
  DialogErrorBox: "daw:dialog:errorBox",

  WindowMinimize: "daw:window:minimize",
  WindowToggleMaximize: "daw:window:toggleMaximize",
  WindowClose: "daw:window:close",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export type PickedAudioFile = {
  name: string;
  mimeType: string;
  bytes: ArrayBuffer;
  path: string;
};

export type MessageBoxOptions = {
  type?: "none" | "info" | "error" | "question" | "warning";
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
};

export type MessageBoxResult = {
  response: number;
};

export type SaveDialogResult = {
  canceled: boolean;
  path?: string;
};

export type OpenDialogResult = {
  canceled: boolean;
  path?: string;
};
