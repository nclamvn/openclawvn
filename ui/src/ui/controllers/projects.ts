import {
  loadProjects as loadProjectsFromDeploys,
  scanProject as scanProjectFromDeploys,
  type DeployState,
} from "./deploys";

// Re-export from deploys controller for convenience.
// projects.ts is a thin shim — all types and logic live in deploys.ts.

export async function loadProjects(state: DeployState) {
  return loadProjectsFromDeploys(state);
}

export async function scanProject(state: DeployState, projectId: string) {
  return scanProjectFromDeploys(state, projectId);
}
