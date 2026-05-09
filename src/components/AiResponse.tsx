import type { ReactNode } from 'react';
import { splitAiBlocks } from '../utils/aiText';
import './AiResponse.scss';

interface AiResponseProps {
  text: string;
  className?: string;
}

const ACTION_PATTERN = /[（(]([^（）()]{1,36})[）)]/g;

function stripWrappingParens(text: string) {
  const trimmed = text.trim();
  if (/^[（(].+[）)]$/.test(trimmed)) {
    return trimmed.slice(1, -1).trim();
  }
  return text;
}

function renderInlineActions(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchCount = 0;

  for (const match of text.matchAll(ACTION_PATTERN)) {
    const [full, content] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <span className="ai-action" key={`action-${matchCount++}`}>
        {content}
      </span>
    );

    lastIndex = index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  if (!nodes.length) nodes.push(text);
  return nodes;
}

function wrapParagraphLines(block: string): string[] {
  const explicitLines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (explicitLines.length > 1) {
    return explicitLines;
  }

  const paragraph = block.trim();
  if (paragraph.length <= 84) {
    return [paragraph];
  }

  const sentences = paragraph.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [paragraph];
  const wrapped: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current}${sentence}` : sentence;
    if (current && next.length > 42) {
      wrapped.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current.trim()) {
    wrapped.push(current.trim());
  }

  return wrapped.length ? wrapped : [paragraph];
}

function renderParagraph(block: string): ReactNode {
  const lines = wrapParagraphLines(block);
  const isActionOnly = lines.length === 1 && /^[（(].+[）)]$/.test(lines[0].trim());
  const paragraphClass = isActionOnly ? 'ai-paragraph ai-paragraph--action' : 'ai-paragraph';

  return (
    <p className={paragraphClass}>
      {lines.flatMap((line, index) => {
        const parts = renderInlineActions(stripWrappingParens(line));
        const nodes: ReactNode[] = [];
        if (index > 0) nodes.push(<br key={`br-${index}`} />);
        nodes.push(...parts);
        return nodes;
      })}
    </p>
  );
}

export default function AiResponse({ text, className }: AiResponseProps) {
  const blocks = splitAiBlocks(text);

  if (!blocks.length) return null;

  return (
    <div className={['ai-response', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index) => (
        <div className="ai-response__block" key={`${index}-${block.slice(0, 12)}`}>
          {renderParagraph(block)}
        </div>
      ))}
    </div>
  );
}
