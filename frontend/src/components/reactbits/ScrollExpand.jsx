import React, { useEffect, useRef, useState } from 'react';

export default function ScrollExpand({
  mediaSrc,
  mediaType = 'image', // 'image' or 'video'
  title = 'Full-Spectrum Deep Learning Synthesis',
  subtitle = 'Sequential inference with sub-pixel reconstruction',
  className = '',
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress of element through viewport (0.0 when entering bottom, 1.0 when near center)
      const visibleAmount = (windowHeight - rect.top) / (windowHeight + rect.height * 0.5);
      const progress = Math.max(0, Math.min(1, visibleAmount));

      // Scale between 0.82 and 1.0
      setScale(0.82 + progress * 0.18);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className={`w-full py-12 overflow-hidden flex flex-col items-center ${className}`}>
      <div
        className="w-full max-w-5xl rounded-3xl overflow-hidden border border-[#1A2B40] bg-[#0C1421] shadow-2xl transition-transform duration-300 ease-out relative group"
        style={{
          transform: `scale(${scale})`,
          boxShadow: '0 25px 60px -15px rgba(23, 105, 210, 0.25)',
        }}
      >
        <div className="aspect-[16/9] w-full overflow-hidden relative bg-[#05070B]">
          {mediaType === 'video' ? (
            <video
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaSrc}
              alt="Deep Learning Model Inference Output"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}

          {/* Elegant dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-transparent opacity-90 pointer-events-none" />

          {/* Text Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between pointer-events-none">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101D2E]/80 backdrop-blur border border-[#1A2B40] text-xs font-mono text-[#80BCFF] mb-2">
                <span className="w-2 h-2 rounded-full bg-[#268BFF]" />
                <span>DYNAMIC VIEWPORT EXPANSION</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#F5F8FC] tracking-tight">{title}</h3>
              <p className="text-sm text-[#98A9BD] mt-1">{subtitle}</p>
            </div>
            <div className="mt-4 md:mt-0 text-xs font-mono text-[#64758A]">
              DDColor + Real-ESRGAN Pipeline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

