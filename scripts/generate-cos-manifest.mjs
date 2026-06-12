import { createHash } from 'node:crypto';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const workspaceRoot = resolve(projectRoot, '..');

const assetBaseUrl = normalizeBaseUrl(
  process.env.ASSET_BASE_URL ||
    process.env.VITE_ASSET_BASE_URL ||
    process.env.OSS_ASSET_BASE_URL ||
    process.env.VITE_OSS_ASSET_BASE_URL ||
    process.env.ALI_OSS_ASSET_BASE_URL ||
    process.env.VITE_ALI_OSS_ASSET_BASE_URL ||
    process.env.COS_ASSET_BASE_URL ||
    process.env.VITE_COS_ASSET_BASE_URL ||
    'https://scripter.oss-cn-shanghai.aliyuncs.com/taro'
);
const outputPath = resolve(projectRoot, process.env.COS_MANIFEST_OUTPUT || 'public/cos-assets.json');
const cardExtension = normalizeExtension(process.env.ASSET_CARD_EXTENSION || '.jpg');

const decks = [
  {
    key: 'eastern',
    cosDir: process.env.ASSET_EASTERN_CARD_DIR || 'cards/eastern',
    cardBackDir: process.env.ASSET_EASTERN_BACK_DIR || 'cards/eastern-mystic-tarot',
    localCandidates: [
      resolve(workspaceRoot, 'card/eastern-mystic-tarot'),
      resolve(workspaceRoot, 'eastern-mystic-tarot'),
    ],
  },
  {
    key: 'chinese-ink',
    cosDir: process.env.ASSET_CHINESE_INK_CARD_DIR || 'cards/chinese-ink',
    cardBackDir: process.env.ASSET_CHINESE_INK_BACK_DIR || 'cards/chinese-ink-tarot',
    localCandidates: [
      resolve(workspaceRoot, 'card/chinese-ink-tarot'),
      resolve(workspaceRoot, 'chinese-ink-tarot'),
    ],
  },
];

const mentorIds = ['luna', 'sol', 'mira', 'orion', 'seren', 'kai'];
const mentorDir = firstExistingDir([
  resolve(workspaceRoot, 'mentors'),
  resolve(projectRoot, 'public/mentors'),
]);

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function normalizeExtension(value) {
  if (!value) return '';
  return value.startsWith('.') ? value : `.${value}`;
}

function firstExistingDir(candidates) {
  return candidates.find((candidate) => existsSync(candidate));
}

function listImages(dir) {
  if (!dir) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function stripExt(filename) {
  return filename.replace(/\.(png|jpe?g|webp|avif)$/i, '');
}

function assetUrl(...parts) {
  return `${assetBaseUrl}/${parts.map((part) => encodeURIComponent(part).replace(/%2F/g, '/')).join('/')}`;
}

const manifest = {
  cardBacks: {},
  cards: {},
  mentors: {},
};

for (const deck of decks) {
  const localDir = firstExistingDir(deck.localCandidates);
  const files = listImages(localDir);
  const cardBack = files.find((file) => /^card-back\./i.test(file));

  if (cardBack) {
    manifest.cardBacks[deck.key] = assetUrl(deck.cardBackDir, cardBack);
  }

  for (const file of files) {
    if (/^card-back\./i.test(file)) continue;
    const base = stripExt(file);
    manifest.cards[`${deck.key}/${base}`] = assetUrl(deck.cosDir, cardExtension ? `${base}${cardExtension}` : file);
  }
}

if (manifest.cardBacks['chinese-ink']) {
  manifest.cardBack = manifest.cardBacks['chinese-ink'];
} else if (manifest.cardBacks.eastern) {
  manifest.cardBack = manifest.cardBacks.eastern;
}

for (const id of mentorIds) {
  const localFile = listImages(mentorDir).find((file) => stripExt(file) === id);
  const file = localFile || `${id}.jpg`;
  manifest.mentors[id] = assetUrl('mentors', file);
}

const unsignedText = JSON.stringify(manifest, null, 2);
manifest.integrity = fnv1aHash(unsignedText);

writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Cards: ${Object.keys(manifest.cards).length}`);
console.log(`Card backs: ${Object.keys(manifest.cardBacks).length}`);
console.log(`Mentors: ${Object.keys(manifest.mentors).length}`);

function fnv1aHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}
