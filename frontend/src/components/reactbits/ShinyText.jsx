import React from 'react';

export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#F5F8FC] via-[#268BFF] to-[#80BCFF] bg-[200%_auto] ${
        disabled ? '' : 'animate-shine'
      } ${className}`}
      style={{
        animationDuration,
        backgroundImage:
          'linear-gradient(120deg, rgba(245,248,252,0.85) 0%, rgba(38,139,255,1) 45%, rgba(128,188,255,1) 55%, rgba(245,248,252,0.85) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {text}
    </span>
  );
}

