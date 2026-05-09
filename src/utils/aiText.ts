export function sanitizeAiText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-•]\s+/gm, '• ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function splitAiBlocks(text: string): string[] {
  const cleaned = sanitizeAiText(text);
  if (!cleaned) return [];

  return cleaned
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}
