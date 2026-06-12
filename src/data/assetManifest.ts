type AssetDeck = 'eastern' | 'chinese-ink';

type AssetManifest = {
  cardBack?: string;
  cardBacks?: Partial<Record<AssetDeck, string>>;
  cards?: Record<string, string>;
  mentors?: Record<string, string>;
  /** 资源清单的 SHA-256 哈希，用于完整性校验 */
  integrity?: string;
};

let manifest: AssetManifest | null = null;
const localFallbackImage = new URL('../assets/hero.png', import.meta.url).href;
const localCardBackFallback = new URL('../assets/card-back-fallback.svg', import.meta.url).href;
const defaultManifestUrl = './cos-assets.json';

function getEnvValue(key: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[key];
  return value && value.trim() ? value.trim() : undefined;
}

/** 计算字符串的简单哈希（FNV-1a），用于资源清单完整性校验 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

/** 校验资源清单完整性 */
function verifyManifestIntegrity(data: AssetManifest, rawText: string): boolean {
  void rawText;
  if (!data.integrity) {
    // 无 integrity 字段时跳过校验（向后兼容）
    return true;
  }
  const { integrity, ...unsignedData } = data;
  void integrity;
  const computed = fnv1aHash(JSON.stringify(unsignedData, null, 2));
  if (computed !== data.integrity) {
    console.error(`[AssetManifest] 完整性校验失败: expected=${data.integrity}, computed=${computed}`);
    return false;
  }
  return true;
}

/** 校验资源 URL 是否来自可信域名 */
function isTrustedAssetURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    const configuredHosts = [
      getEnvValue('VITE_COS_ASSET_BASE_URL'),
      getEnvValue('VITE_OSS_ASSET_BASE_URL'),
      getEnvValue('VITE_ALI_OSS_ASSET_BASE_URL'),
      getEnvValue('VITE_ASSET_BASE_URL'),
    ]
      .filter(Boolean)
      .map((value) => new URL(value as string).hostname);
    const extraHosts = (getEnvValue('VITE_TRUSTED_ASSET_HOSTS') || '')
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean);
    const trustedDomains = [
      'localhost',
      '127.0.0.1',
      'myqcloud.com',
      'qcloudcdn.com',
      'aliyuncs.com',
      'alicdn.com',
      'tarot-assets.oss-cn-beijing.aliyuncs.com',
      'tarot-assets.oss.aliyuncs.com',
      ...configuredHosts,
      ...extraHosts,
    ];
    return trustedDomains.some((d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

export async function loadAssetManifest(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const manifestUrl = getEnvValue('VITE_ASSET_MANIFEST_URL') || defaultManifestUrl;
    const response = await fetch(manifestUrl, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`[AssetManifest] 加载失败: HTTP ${response.status}`);
      manifest = null;
      return;
    }
    const rawText = await response.text();
    const data = JSON.parse(rawText) as AssetManifest;

    // 完整性校验
    if (!verifyManifestIntegrity(data, rawText)) {
      manifest = null;
      return;
    }

    // URL 安全校验：过滤不可信域名的资源
    if (data.cards) {
      for (const [key, url] of Object.entries(data.cards)) {
        if (!isTrustedAssetURL(url)) {
          console.warn(`[AssetManifest] 拒绝不可信卡片资源: ${key} = ${url}`);
          delete data.cards[key];
        }
      }
    }
    if (data.mentors) {
      for (const [key, url] of Object.entries(data.mentors)) {
        if (!isTrustedAssetURL(url)) {
          console.warn(`[AssetManifest] 拒绝不可信导师资源: ${key} = ${url}`);
          delete data.mentors[key];
        }
      }
    }

    manifest = data;
    console.log('[AssetManifest] 加载成功');
  } catch (err) {
    console.warn('[AssetManifest] 加载失败:', err instanceof Error ? err.message : String(err));
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
