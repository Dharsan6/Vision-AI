import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MoveHorizontal, AlertCircle, Eye } from 'lucide-react';

export default function ComparisonSlider({
  originalSrc,
  processedSrc,
  originalUrl,
  processedUrl,
  originalLabel = 'ORIGINAL',
  processedLabel = 'ENHANCED',
  className = '',
  onViewFull = null,
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({ orig: false, proc: false });
  const containerRef = useRef(null);

  const orig = originalSrc || originalUrl;
  const proc = processedSrc || processedUrl;

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updatePosition(e.clientX || (e.touches && e.touches[0]?.clientX));
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      if (clientX !== undefined) {
        updatePosition(clientX);
      }
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  if (!orig || !proc) {
    return (
      <div className={`p-8 rounded-2xl border border-[#1A2B40] bg-[#05070B] text-center text-[#98A9BD] space-y-2 ${className}`}>
        <AlertCircle className="w-6 h-6 text-[#F0B44C] mx-auto" />
        <p className="text-sm font-medium text-[#F5F8FC]">Comparison images unavailable</p>
        <p className="text-xs text-[#64758A]">Both source and enhanced images are required for comparison.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`p-8 rounded-2xl border border-[#F06464]/30 bg-[#0C1421] text-center text-[#F06464] space-y-2 ${className}`}>
        <AlertCircle className="w-6 h-6 text-[#F06464] mx-auto" />
        <p className="text-sm font-semibold text-[#F5F8FC]">Failed to render image comparison</p>
        <p className="text-xs text-[#98A9BD]">The enhanced or original image could not be loaded by the browser.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      className={`relative w-full overflow-hidden select-none rounded-2xl border border-[#1A2B40] bg-[#05070B] shadow-2xl cursor-ew-resize group ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Background layer: Processed Image (Right half exposed) */}
      <img
        src={proc}
        alt={processedLabel}
        onLoad={() => setImagesLoaded((prev) => ({ ...prev, proc: true }))}
        onError={() => setLoadError(true)}
        className="w-full h-auto max-h-[640px] object-contain block mx-auto select-none pointer-events-none"
        draggable={false}
      />

      {/* Foreground layer: Original Image (Clipped with hardware-accelerated clipPath) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      >
        <img
          src={orig}
          alt={originalLabel}
          onLoad={() => setImagesLoaded((prev) => ({ ...prev, orig: true }))}
          onError={() => setLoadError(true)}
          className="w-full h-auto max-h-[640px] object-contain block mx-auto select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Split Divider Line & Draggable Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#268BFF] shadow-[0_0_14px_rgba(38,139,255,0.9)] pointer-events-none transition-shadow"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0C1421] border-2 border-[#268BFF] shadow-[0_0_15px_rgba(38,139,255,0.5)] flex items-center justify-center text-[#268BFF] transition-transform group-hover:scale-110">
          <MoveHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Top Left Label: Original */}
      <div className="absolute top-3 left-3 pointer-events-none px-3 py-1 rounded-full bg-[#080D16]/85 backdrop-blur-md border border-[#1A2B40] text-xs font-mono text-[#98A9BD] shadow-md">
        {originalLabel}
      </div>

      {/* Top Right Label: Enhanced */}
      <div className="absolute top-3 right-3 pointer-events-none px-3 py-1 rounded-full bg-[#080D16]/85 backdrop-blur-md border border-[#268BFF]/40 text-xs font-mono text-[#80BCFF] shadow-md">
        {processedLabel}
      </div>

      {/* Optional Fullscreen view action */}
      {onViewFull && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewFull();
          }}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-[#080D16]/85 hover:bg-[#101D2E] backdrop-blur-md border border-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] text-xs transition-colors shadow-md flex items-center space-x-1.5"
          title="View enhanced image full size"
        >
          <Eye className="w-3.5 h-3.5 text-[#268BFF]" />
          <span className="font-mono text-[11px]">View Full</span>
        </button>
      )}
    </div>
  );
}
