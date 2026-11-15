import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProgressBar({
  progress = 0,
  currentFrame = 0,
  totalFrames = 0,
  currentStep = 'Processing...',
  elapsedSeconds = 0,
  module = 'Deep Learning Pipeline',
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="w-full p-5 rounded-2xl bg-[#0C1421] border border-[#1A2B40] shadow-xl space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 text-[#F5F8FC]">
          <Loader2 className="w-4 h-4 text-[#268BFF] animate-spin" />
          <span className="font-semibold uppercase tracking-wider">{module}</span>
        </div>
        <div className="text-[#80BCFF] font-semibold">{pct}%</div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 rounded-full bg-[#05070B] overflow-hidden border border-[#1A2B40] relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1769D2] via-[#268BFF] to-[#80BCFF] transition-all duration-300 ease-out shadow-[0_0_12px_rgba(38,139,255,0.7)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Details Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#98A9BD] pt-1 border-t border-[#1A2B40]/60 gap-1 font-mono">
        <span className="truncate text-[#F5F8FC]">{currentStep}</span>
        <div className="flex items-center space-x-3 shrink-0 text-[#64758A]">
          {totalFrames > 0 && (
            <span>
              Frame: <strong className="text-[#80BCFF]">{currentFrame}</strong> / {totalFrames}
            </span>
          )}
          {elapsedSeconds > 0 && (
            <span>Time: <strong className="text-[#F5F8FC]">{elapsedSeconds}s</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}

