import { Platform, Linking } from "react-native";

export const APP_VERSION = "1.2.0";
export const BUILD_NUMBER = "6";
export const VERSION_DATE = "2026-06-11";

// Version check API - uses GitHub releases as the source of truth
const GITHUB_REPO = "Thomas-guo007/simcard-reminder";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export type VersionInfo = {
  version: string;
  buildNumber: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  hasUpdate: boolean;
};

/**
 * Compare two semantic version strings
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Check for app updates from GitHub releases
 */
export async function checkForUpdate(): Promise<VersionInfo> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      // No releases found or API error - return current version as latest
      return {
        version: APP_VERSION,
        buildNumber: BUILD_NUMBER,
        releaseDate: VERSION_DATE,
        releaseNotes: "",
        downloadUrl: "",
        hasUpdate: false,
      };
    }

    const data = await response.json();
    const latestVersion = (data.tag_name || "").replace(/^v/, "");
    const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;

    // Find the appropriate download asset
    let downloadUrl = data.html_url || "";
    if (data.assets && data.assets.length > 0) {
      const apkAsset = data.assets.find((a: any) => a.name.endsWith(".apk"));
      if (apkAsset && Platform.OS === "android") {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    return {
      version: latestVersion || APP_VERSION,
      buildNumber: BUILD_NUMBER,
      releaseDate: data.published_at ? data.published_at.split("T")[0] : VERSION_DATE,
      releaseNotes: data.body || "",
      downloadUrl,
      hasUpdate,
    };
  } catch (error) {
    console.error("[Version] Check failed:", error);
    return {
      version: APP_VERSION,
      buildNumber: BUILD_NUMBER,
      releaseDate: VERSION_DATE,
      releaseNotes: "",
      downloadUrl: "",
      hasUpdate: false,
    };
  }
}

/**
 * Open the update URL (App Store / Play Store / GitHub release)
 */
export async function openUpdateUrl(url?: string): Promise<void> {
  const targetUrl = url || getStoreUrl();
  if (targetUrl) {
    try {
      await Linking.openURL(targetUrl);
    } catch (error) {
      console.error("[Version] Cannot open update URL:", error);
    }
  }
}

/**
 * Get the appropriate store URL based on platform
 */
function getStoreUrl(): string {
  if (Platform.OS === "ios") {
    // Replace with actual App Store URL when published
    return `https://apps.apple.com/app/sim-recharge-reminder/id0000000000`;
  } else if (Platform.OS === "android") {
    // Replace with actual Play Store URL when published
    return `https://play.google.com/store/apps/details?id=com.app.simcardreminder`;
  }
  // Fallback to GitHub releases
  return `https://github.com/${GITHUB_REPO}/releases/latest`;
}
