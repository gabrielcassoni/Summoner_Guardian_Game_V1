import React, { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackIcon = '🌿',
  fallbackGradient = 'from-emerald-950 via-slate-900 to-teal-950',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${fallbackGradient} text-emerald-400 border border-emerald-900/60 select-none shadow-inner ${className}`}
        title={alt}
      >
        <span className="text-xl sm:text-2xl filter drop-shadow animate-pulse">
          {fallbackIcon}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${className}`}
    />
  );
};
