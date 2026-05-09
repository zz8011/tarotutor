type AssetDeck = 'eastern' | 'chinese-ink';

type AssetManifest = {
  cardBack?: string;
  cardBacks?: Partial<Record<AssetDeck, string>>;
  cards?: Record<string, string>;
  mentors?: Record<string, string>;
};

let manifest: AssetManifest | null = null;
const localFallbackImage = new URL('../assets/hero.png', import.meta.url).href;
const localCardBackAssets: Record<AssetDeck, string> = {
  eastern: getPublicAssetPath('assets/card-backs/eastern-mystic-tarot/card-back.png'),
  'chinese-ink': getPublicAssetPath('assets/card-backs/chinese-ink-tarot/card-back.png'),
};

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

function getPublicAssetPath(path: string) {
  if (typeof window === 'undefined') return `/${path.replace(/^\/+/, '')}`;

  const pathname = window.location.pathname || '/';
  const basePath = pathname.endsWith('/') ? pathname : `${pathname.slice(0, pathname.lastIndexOf('/') + 1)}`;
  const normalizedPath = path.replace(/^\/+/, '');

  return `${basePath}${normalizedPath}`.replace(/\/{2,}/g, '/');
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
    localCardBackAssets[deck]
  );
}
