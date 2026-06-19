import { Linking, Platform } from "react-native";

export const APP_VERSION = "1.2.6";
export const BUILD_NUMBER = "7";
export const VERSION_DATE = "2026-06-19";

const GITHUB_REPO = "Thomas-guo007/simcard-reminder";
const UPDATE_MANIFEST_URL =
  `https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json`;
const FALLBACK_APK_URL =
  `https://github.com/${GITHUB_REPO}/raw/main/releases/android/simcard-reminder-android-release-v${APP_VERSION}.apk`;

export type VersionInfo = {
  version: string;
  buildNumber: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  hasUpdate: boolean;
};

type VersionManifest = {
  latestVersion?: string;
  version?: string;
  buildNumber?: string | number;
  releaseDate?: string;
  releaseNotes?: string | string[];
  downloadUrl?: string;
};

function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/i, "").split(".").map((part) => Number(part) || 0);
  const partsB = b.replace(/^v/i, "").split(".").map((part) => Number(part) || 0);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

function currentVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    releaseDate: VERSION_DATE,
    releaseNotes: "",
    downloadUrl: FALLBACK_APK_URL,
    hasUpdate: false,
  };
}

function formatReleaseNotes(notes: VersionManifest["releaseNotes"]): string {
  if (Array.isArray(notes)) return notes.join("\n");
  return notes || "";
}

export async function checkForUpdate(): Promise<VersionInfo> {
  try {
    const response = await fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return currentVersionInfo();
    }

    const data = (await response.json()) as VersionManifest;
    const latestVersion = (data.latestVersion || data.version || APP_VERSION).replace(/^v/i, "");
    const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;

    return {
      version: latestVersion,
      buildNumber: String(data.buildNumber || BUILD_NUMBER),
      releaseDate: data.releaseDate || VERSION_DATE,
      releaseNotes: formatReleaseNotes(data.releaseNotes),
      downloadUrl: data.downloadUrl || FALLBACK_APK_URL,
      hasUpdate,
    };
  } catch (error) {
    console.error("[Version] Check failed:", error);
    return currentVersionInfo();
  }
}

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

function getStoreUrl(): string {
  if (Platform.OS === "ios") {
    return `https://github.com/${GITHUB_REPO}`;
  } else if (Platform.OS === "android") {
    return FALLBACK_APK_URL;
  }
  return `https://github.com/${GITHUB_REPO}`;
}
