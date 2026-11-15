import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, Eye, Terminal } from 'lucide-react';

export default function Navbar({ systemStatus }) {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');

  return (
    <header className="h-16 border-b border-[#1A2B40] bg-[#05070B]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {!isApp && (
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1769D2] to-[#268BFF] flex items-center justify-center shadow-[0_0_10px_rgba(38,139,255,0.4)]">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-wider text-[#F5F8FC]">VISION AI</span>
          </Link>
        )}
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-[#64758A]">
          <span className="px-2 py-0.5 rounded bg-[#0C1421] border border-[#1A2B40] text-[#80BCFF]">
            v1.0.0
          </span>
          <span>•</span>
          <span className="text-[#98A9BD]">DLCV Deep Learning Suite</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Hardware badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0C1421] border border-[#1A2B40] text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-[#25C98A] animate-pulse" />
          <span className="text-[#98A9BD]">MPS:</span>
          <span className="text-[#F5F8FC] font-medium">
            {systemStatus?.device === 'mps' ? 'Apple Silicon' : 'CPU'}
          </span>
        </div>

        {/* CTA Button */}
        {isApp ? (
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-xl border border-[#1A2B40] bg-[#080D16] hover:bg-[#101D2E] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] transition-colors"
          >
            Product Tour
          </Link>
        ) : (
          <Link
            to="/app/dashboard"
            className="px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(38,139,255,0.4)] transition-all flex items-center space-x-2"
          >
            <span>Launch Platform</span>
          </Link>
        )}
      </div>
    </header>
  );
}

