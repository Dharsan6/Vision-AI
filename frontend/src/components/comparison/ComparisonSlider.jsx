import React, { useState, useRef, useCallback } from 'react';
import { MoveHorizontal, Maximize2 } from 'lucide-react';

export default function ComparisonSlider({
  originalSrc,
  processedSrc,
  originalLabel = 'ORIGINAL',
  processedLabel = 'AI COLORIZED',
  className = '',
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      className={`relative w-full overflow-hidden select-none rounded-2xl border border-[#1A2B40] bg-[#05070B] shadow-2xl cursor-ew-resize group ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Background: Processed Image (Right / Bottom layer) */}
      <img
        src={processedSrc}
        alt={processedLabel}
        className="w-full h-auto max-h-[640px] object-contain block mx-auto"
        draggable={false}
      />

      {/* Foreground: Original Image clipped to slider position */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={originalSrc}
          alt={originalLabel}
          className="w-full h-auto max-h-[640px] object-contain block mx-auto pointer-events-none"
          style={{
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
            maxWidth: 'none',
          }}
          draggable={false}
        />
      </div>

      {/* Split Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#268BFF] shadow-[0_0_12px_rgba(38,139,255,0.8)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#101D2E] border-2 border-[#268BFF] shadow-lg flex items-center justify-center text-[#268BFF]">
          <MoveHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 pointer-events-none px-3 py-1 rounded-full bg-[#080D16]/80 backdrop-blur border border-[#1A2B40] text-xs font-mono text-[#98A9BD]">
        {originalLabel}
      </div>
      <div className="absolute top-4 right-4 pointer-events-none px-3 py-1 rounded-full bg-[#080D16]/80 backdrop-blur border border-[#1A2B40] text-xs font-mono text-[#268BFF]">
        {processedLabel}
      </div>
    </div>
  );
}

