import type { GatewayBrowserClient } from "../gateway";

// ─── Types ───────────────────────────────────────────────────

export type DeployPlatform = "fly" | "railway" | "vercel" | "docker" | "custom";

export type DeployStatus =
  | "pending"
  | "building"
  | "deploying"
  | "success"
  | "failed"
  | "cancelled";

export type ProjectInfo = {
  id: string;
  name: string;
  path: string;
  platform: DeployPlatform | null;
  branch: string;
  health: "healthy" | "warning" | "error" | "unknown";
  envValid: boolean;
  envMissing: string[];
  lastDeployAt: string | null;
  lastDeployStatus: DeployStatus | null;
};

export type DeployRecord = {
  id: string;
  projectId: string;
  projectName: string;
  platform: DeployPlatform;
  target: "production" | "staging" | "preview";
  branch: string;
  status: DeployStatus;
  startedAt: string;
  finishedAt: string | null;
  logLines: string[];
  url: string | null;
};

export type PreviewRecord = {
  id: string;
  projectId: string;
  projectName: string;
  branch: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  status: "active" | "expired" | "promoting" | "deleted";
};

// ─── State ───────────────────────────────────────────────────

export type DeployState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  // Projects
  projectsLoading: boolean;
  projectsList: ProjectInfo[];
  projectsError: string | null;
  projectsScanning: boolean;
  projectsScanStatus: "idle" | "scanning" | "scanned";
  // Deploy
  deployLoading: boolean;
  deployHistory: DeployRecord[];
  deployError: string | null;
  deployActiveId: string | null;
  deployStatus: DeployStatus | null;
  deployLogLines: string[];
  deploySelectedProject: string | null;
  deploySelectedPlatform: DeployPlatform | null;
  deploySelectedTarget: "production" | "staging" | "preview";
  deploySelectedBranch: string;
  deployRunning: boolean;
  // Preview
  previewLoading: boolean;
  previewList: PreviewRecord[];
  previewError: string | null;
  previewCreating: boolean;
  previewDeleting: string | null;
  previewPromoting: string | null;
  previewSelectedProject: string | null;
  previewBranch: string;
  previewIframeUrl: string | null;
};

// ─── Project Operations ──────────────────────────────────────

export async function loadProjects(state: DeployState) {
  if (!state.client || !state.connected) return;
  if (state.projectsLoading) return;
  state.projectsLoading = true;
  state.projectsError = null;
  try {
    const res = (await state.client.request("copilot.projects.list", {})) as {
      projects?: ProjectInfo[];
    };
    state.projectsList = res.projects ?? [];
  } catch (err) {
    state.projectsError = String(err);
  } finally {
    state.projectsLoading = false;
  }
}

export async function scanProject(state: DeployState, projectId: string) {
  if (!state.client || !state.connected) return;
  if (state.projectsScanning) return;
  state.projectsScanning = true;
  state.projectsScanStatus = "scanning";
  state.projectsError = null;
  try {
    await state.client.request("copilot.projects.rescan", { id: projectId });
    state.projectsScanStatus = "scanned";
    setTimeout(() => {
      state.projectsScanStatus = "idle";
    }, 2000);
  } catch (err) {
    state.projectsError = String(err);
    state.projectsScanStatus = "idle";
  } finally {
    state.projectsScanning = false;
  }
}

// ─── Deploy Operations ──────────────────────────────────────

export async function deployProject(state: DeployState) {
  if (!state.client || !state.connected) return;
  if (state.deployRunning) return;
  if (!state.deploySelectedProject || !state.deploySelectedPlatform) return;
  state.deployRunning = true;
  state.deployError = null;
  state.deployLogLines = [];
  state.deployStatus = "building";
  try {
    const res = (await state.client.request("copilot.deploy.start", {
      projectId: state.deploySelectedProject,
      platform: state.deploySelectedPlatform,
      target: state.deploySelectedTarget,
      branch: state.deploySelectedBranch || undefined,
    })) as { deploymentId?: string };
    state.deployActiveId = res.deploymentId ?? null;
    state.deployStatus = "deploying";
  } catch (err) {
    state.deployError = String(err);
    state.deployStatus = "failed";
  } finally {
    state.deployRunning = false;
  }
}

export async function loadDeployHistory(state: DeployState) {
  if (!state.client || !state.connected) return;
  if (state.deployLoading) return;
  state.deployLoading = true;
  state.deployError = null;
  try {
    const res = (await state.client.request("copilot.deploy.history", {})) as {
      deploys?: DeployRecord[];
    };
    state.deployHistory = res.deploys ?? [];
  } catch (err) {
    state.deployError = String(err);
  } finally {
    state.deployLoading = false;
  }
}

// ─── Preview Operations ─────────────────────────────────────

export async function loadPreviews(state: DeployState) {
  if (!state.client || !state.connected) return;
  if (state.previewLoading) return;
  state.previewLoading = true;
  state.previewError = null;
  try {
    const res = (await state.client.request("copilot.preview.list", {})) as {
      previews?: PreviewRecord[];
    };
    state.previewList = res.previews ?? [];
  } catch (err) {
    state.previewError = String(err);
  } finally {
    state.previewLoading = false;
  }
}

export async function createPreview(state: DeployState) {
  if (!state.client || !state.connected) return;
  if (state.previewCreating) return;
  if (!state.previewSelectedProject) return;
  state.previewCreating = true;
  state.previewError = null;
  try {
    const res = (await state.client.request("copilot.preview.create", {
      projectId: state.previewSelectedProject,
      branch: state.previewBranch || undefined,
    })) as { preview?: PreviewRecord };
    if (res.preview) {
      state.previewList = [res.preview, ...state.previewList];
    }
  } catch (err) {
    state.previewError = String(err);
  } finally {
    state.previewCreating = false;
  }
}

export async function deletePreview(state: DeployState, previewId: string) {
  if (!state.client || !state.connected) return;
  state.previewDeleting = previewId;
  state.previewError = null;
  try {
    await state.client.request("copilot.preview.delete", {
      projectId: state.previewSelectedProject,
      url: state.previewList.find((p) => p.id === previewId)?.url,
    });
    state.previewList = state.previewList.filter((p) => p.id !== previewId);
  } catch (err) {
    state.previewError = String(err);
  } finally {
    state.previewDeleting = null;
  }
}

export async function promotePreview(state: DeployState, previewId: string) {
  if (!state.client || !state.connected) return;
  state.previewPromoting = previewId;
  state.previewError = null;
  try {
    const previewEntry = state.previewList.find((p) => p.id === previewId);
    await state.client.request("copilot.preview.promote", {
      projectId: state.previewSelectedProject,
      url: previewEntry?.url,
    });
    state.previewList = state.previewList.map((p) =>
      p.id === previewId ? { ...p, status: "promoting" as const } : p,
    );
  } catch (err) {
    state.previewError = String(err);
  } finally {
    state.previewPromoting = null;
  }
}
