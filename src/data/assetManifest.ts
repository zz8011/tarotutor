type AssetManifest = {
  cardBack?: string;
  cards?: Record<string, string>;
  mentors?: Record<string, string>;
};

let manifest: AssetManifest | null = null;
const localFallbackImage = new URL('../assets/hero.png', import.meta.url).href;

export async function loadAssetManifest() {
  try {
    const response = await fetch('./oss-assets-v2.json', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json() as AssetManifest;
    manifest = data;
  } catch {
    manifest = null;
  }
}

function fallbackCardPath() {
  return localFallbackImage;
}

export function resolveCardAsset(deck: 'eastern' | 'chinese-ink', base: string) {
  return manifest?.cards?.[`${deck}/${base}`] || fallbackCardPath();
}

export function resolveMentorAsset(mentorId: string) {
  return manifest?.mentors?.[mentorId] || localFallbackImage;
}

export function resolveCardBackAsset() {
  return manifest?.cardBack || localFallbackImage;
}
