import { useEffect, useCallback } from 'react';

interface ParticleOptions {
  color?: string;
  count?: number;
  spread?: number;
}

export function useMagicParticles(options: ParticleOptions = {}) {
  const { color = 'var(--accent-gold)', count = 8, spread = 60 } = options;

  const createParticles = useCallback((e: MouseEvent | TouchEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'magic-particle';

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = spread * (0.5 + Math.random() * 0.5);
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        --tx: ${tx}px;
        --ty: ${ty}px;
        background: radial-gradient(circle, ${color} 0%, transparent 70%);
      `;

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1000);
    }
  }, [color, count, spread]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => createParticles(e);
    const handleTouch = (e: TouchEvent) => createParticles(e);

    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouch);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [createParticles]);
}
