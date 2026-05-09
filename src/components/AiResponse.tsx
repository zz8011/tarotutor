import type { ReactNode } from 'react';
import { splitAiBlocks } from '../utils/aiText';

interface AiResponseProps {
  text: string;
  className?: string;
}

function renderLineBreaks(block: string): ReactNode[] {
  return block.split('\n').flatMap((line, index) => {
    const nodes: ReactNode[] = [];
    if (index > 0) nodes.push(<br key={`br-${index}`} />);
    nodes.push(line);
    return nodes;
  });
}

export default function AiResponse({ text, className }: AiResponseProps) {
  const blocks = splitAiBlocks(text);

  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 12)}`}>{renderLineBreaks(block)}</p>
      ))}
    </div>
  );
}
