import { useState } from 'react';

import { Icon } from '../Icon/Icon';
import './index.css';

interface ArtworkProps {
  src: string | null;
  size: 'small' | 'medium';
}

/** Cover art with a music-note fallback for missing or broken images. */
export const Artwork = ({ src, size }: ArtworkProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== failedSrc;

  return (
    <span className={`artwork artwork-${size}`}>
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Icon name="music" size={size === 'small' ? 18 : 26} />
      )}
    </span>
  );
};
