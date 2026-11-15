import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileVideo,
} from 'lucide-react';

export default function SynchronizedVideoPlayer({
  originalUrl,
  enhancedUrl,
  originalLabel = 'Original Video',
  enhancedLabel = 'Enhanced Video',
  fps = 24.0,
}) {
  const originalRef = useRef(null);
  const enhancedRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Sync duration on metadata load
  const handleLoadedMetadata = () => {
    const d1 = originalRef.current?.duration || 0;
    const d2 = enhancedRef.current?.duration || 0;
    setDuration(Math.max(d1, d2));
  };

  // Sync playback time update
  const handleTimeUpdate = () => {
    if (enhancedRef.current) {
      setCurrentTime(enhancedRef.current.currentTime);
    }
  };

  // Unified Play / Pause
  const togglePlay = () => {
    if (isPlaying) {
      originalRef.current?.pause();
      enhancedRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Sync positions before play
      if (originalRef.current && enhancedRef.current) {
        originalRef.current.currentTime = enhancedRef.current.currentTime;
      }
      originalRef.current?.play();
      enhancedRef.current?.play();
      setIsPlaying(true);
    }
  };

  // Unified Seek
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (originalRef.current) originalRef.current.currentTime = time;
    if (enhancedRef.current) enhancedRef.current.currentTime = time;
  };

  // Frame Stepping
  const stepFrame = (forward = true) => {
    const frameDuration = 1.0 / (fps || 24.0);
    const newTime = Math.max(
      0,
      Math.min(duration, currentTime + (forward ? frameDuration : -frameDuration))
    );
    setCurrentTime(newTime);
    if (originalRef.current) originalRef.current.currentTime = newTime;
    if (enhancedRef.current) enhancedRef.current.currentTime = newTime;
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (originalRef.current) originalRef.current.muted = nextMuted;
    if (enhancedRef.current) enhancedRef.current.muted = nextMuted;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="space-y-4">
      {/* Side-by-side Video Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span className="flex items-center space-x-1.5 text-[#80BCFF]">
              <FileVideo className="w-3.5 h-3.5" />
              <span>{originalLabel}</span>
            </span>
            <span>Input</span>
          </div>
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#05070B] border border-[#1A2B40] flex items-center justify-center">
            <video
              ref={originalRef}
              src={originalUrl}
              muted={isMuted}
              playsInline
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>

        {/* Enhanced */}
        <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#268BFF]/50 space-y-3 shadow-[0_0_25px_rgba(38,139,255,0.12)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-[#268BFF] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{enhancedLabel}</span>
            </span>
            <span className="text-[#25C98A]">Restored</span>
          </div>
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#05070B] border border-[#1A2B40] flex items-center justify-center">
            <video
              ref={enhancedRef}
              src={enhancedUrl}
              muted={isMuted}
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Unified Synchronized Controls Console */}
      <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-3">
        {/* Scrubber Timeline */}
        <div className="flex items-center space-x-3 text-xs font-mono text-[#98A9BD]">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={1 / (fps || 24)}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-[#101D2E] rounded-lg appearance-none cursor-pointer accent-[#268BFF]"
          />
          <span>{formatTime(duration)}</span>
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={togglePlay}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] text-white text-xs font-mono font-bold flex items-center space-x-1.5 shadow-[0_0_15px_rgba(38,139,255,0.3)] hover:scale-105 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Both</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Both</span>
                </>
              )}
            </button>

            {/* Frame Steppers */}
            <button
              type="button"
              onClick={() => stepFrame(false)}
              className="p-2 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] border border-[#1A2B40] transition-colors"
              title="Step Back 1 Frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stepFrame(true)}
              className="p-2 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] border border-[#1A2B40] transition-colors"
              title="Step Forward 1 Frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-[#64758A]">
            <span className="hidden sm:inline">FPS: {Number(fps || 24).toFixed(1)}</span>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] border border-[#1A2B40] transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#25C98A]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

