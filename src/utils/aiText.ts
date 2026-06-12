import DOMPurify from 'dompurify';

function createPurifier() {
  // 在浏览器环境中使用 DOMPurify
  if (typeof window !== 'undefined' && window.document) {
    return {
      sanitize: (text: string) => DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }),
    };
  }
  // 在非浏览器环境（WeChat/SSR）中回退到简单的 HTML 标签移除
  return {
    sanitize: (text: string) => text.replace(/<[^\u003e]*>/g, ''),
  };
}

const purifier = createPurifier();

export function sanitizeAiText(text: string): string {
  const sanitized = purifier.sanitize(text);
  return sanitized
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
