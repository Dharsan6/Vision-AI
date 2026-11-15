import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Layers, Video, Image as ImageIcon } from 'lucide-react';

export default function CircularCarousel({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full py-8 select-none">
      <div className="relative h-[480px] w-full flex items-center justify-center perspective-[1200px] overflow-hidden">
        {items.map((item, index) => {
          // Calculate offset relative to currentIndex
          let offset = index - currentIndex;
          if (offset < -Math.floor(items.length / 2)) offset += items.length;
          if (offset > Math.floor(items.length / 2)) offset -= items.length;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * 280;
          const translateZ = -Math.abs(offset) * 220;
          const rotateY = offset * -25;
          const opacity = Math.max(0.2, 1 - Math.abs(offset) * 0.35);

          return (
            <div
              key={item.id || index}
              onClick={() => setCurrentIndex(index)}
              className="absolute w-[320px] md:w-[380px] h-[400px] rounded-2xl bg-[#0C1421] border border-[#1A2B40] overflow-hidden cursor-pointer shadow-2xl transition-all duration-500 ease-out flex flex-col justify-between"
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                opacity,
                zIndex: 100 - Math.abs(offset),
                boxShadow: isActive ? '0 20px 50px -10px rgba(38, 139, 255, 0.3)' : 'none',
                borderColor: isActive ? '#268BFF' : '#1A2B40',
              }}
            >
              <div className="relative w-full h-[260px] overflow-hidden bg-[#05070B]">
                {item.type === 'video' ? (
                  <video
                    src={item.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#080D16]/90 backdrop-blur border border-[#1A2B40] text-[11px] font-mono text-[#80BCFF] flex items-center space-x-1.5">
                  {item.badgeIcon === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <span>{item.badge}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0C1421] to-[#101D2E]">
                <div>
                  <h4 className="text-base font-semibold text-[#F5F8FC] leading-snug">{item.title}</h4>
                  <p className="text-xs text-[#98A9BD] mt-1.5 line-clamp-2">{item.description}</p>
                </div>
                <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-[11px] font-mono text-[#64758A]">
                  <span>{item.model}</span>
                  <span className="text-[#268BFF] font-medium">{item.tag}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center space-x-4 mt-6">
        <button
          onClick={prevSlide}
          className="p-3 rounded-full bg-[#0C1421] border border-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] hover:border-[#268BFF] hover:bg-[#101D2E] transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex space-x-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-[#268BFF]' : 'w-2 bg-[#1A2B40] hover:bg-[#64758A]'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-3 rounded-full bg-[#0C1421] border border-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] hover:border-[#268BFF] hover:bg-[#101D2E] transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

