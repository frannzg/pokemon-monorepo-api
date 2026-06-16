'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function PokemonSprite({ src, alt, width, height, className, priority }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className="no-sprite"
        style={{ width, height, lineHeight: `${height}px`, fontSize: Math.min(width, height) * 0.5 }}
      >
        ?
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
    />
  );
}
