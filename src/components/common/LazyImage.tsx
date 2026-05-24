import { useState, useCallback } from 'react';
import './LazyImage.scss';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: 'skeleton' | 'card-back' | 'none';
}

export default function LazyImage({ src, alt, className = '', placeholder = 'skeleton' }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={`lazy-image-wrapper ${className}`}>
      {!loaded && placeholder !== 'none' && (
        <div className={`lazy-image-placeholder ${placeholder}`} aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        className={`lazy-image ${loaded ? 'lazy-image--loaded' : 'lazy-image--hidden'}`}
      />
    </div>
  );
}
