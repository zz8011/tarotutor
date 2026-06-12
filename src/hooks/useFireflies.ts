import { useMemo } from 'react';

interface FireflyOptions {
  count?: number;
  color?: string;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function useFireflies(options: FireflyOptions = {}) {
  const { count = 15, color = 'var(--accent-gold)' } = options;
  const fireflies = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${pseudoRandom(i + 1) * 100}%`,
      top: `${pseudoRandom(i + 11) * 100}%`,
      delay: `${pseudoRandom(i + 21) * 4}s`,
      duration: `${3 + pseudoRandom(i + 31) * 3}s`,
      moveX: `${(pseudoRandom(i + 41) - 0.5) * 100}px`,
      moveY: `${(pseudoRandom(i + 51) - 0.5) * 100}px`,
    }));
  }, [count]);

  return { fireflies, color };
}

export default useFireflies;
