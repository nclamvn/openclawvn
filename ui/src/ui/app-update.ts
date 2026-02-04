// Update checker - fetches latest version from GitHub releases

const GITHUB_API_URL = "https://api.github.com/repos/openclaw/openclaw/releases/latest";
const CURRENT_VERSION = "2026.2.3"; // Should match package.json

export interface UpdateCheckResult {
  available: boolean;
  latestVersion: string | null;
  currentVersion: string;
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, "").split(".").map(Number);
  const parts2 = v2.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Check for updates from GitHub releases
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to check for updates:", response.status);
      return {
        available: false,
        latestVersion: null,
        currentVersion: CURRENT_VERSION,
      };
    }

    const data = await response.json();
    const latestVersion = data.tag_name?.replace(/^v/, "") || null;

    if (!latestVersion) {
      return {
        available: false,
        latestVersion: null,
        currentVersion: CURRENT_VERSION,
      };
    }

    const available = compareVersions(latestVersion, CURRENT_VERSION) > 0;

    return {
      available,
      latestVersion,
      currentVersion: CURRENT_VERSION,
    };
  } catch (error) {
    console.warn("Error checking for updates:", error);
    return {
      available: false,
      latestVersion: null,
      currentVersion: CURRENT_VERSION,
    };
  }
}

export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}
