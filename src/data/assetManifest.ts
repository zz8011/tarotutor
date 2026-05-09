type AssetDeck = 'eastern' | 'chinese-ink';

type AssetManifest = {
  cardBack?: string;
  cardBacks?: Partial<Record<AssetDeck, string>>;
  cards?: Record<string, string>;
  mentors?: Record<string, string>;
};

let manifest: AssetManifest | null = null;
const localFallbackImage = new URL('../assets/hero.png', import.meta.url).href;
const localCardBackFallback = new URL('../assets/card-back-fallback.svg', import.meta.url).href;

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

export function resolveCardBackAsset(deck: AssetDeck = 'eastern') {
  return (
    manifest?.cardBacks?.[deck] ||
    (deck === 'chinese-ink' ? manifest?.cardBack : undefined) ||
    localCardBackFallback
  );
}
