import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Palette,
  Video,
  Sparkles,
  History,
  Info,
  Cpu,
  ArrowUpRight,
  Eye,
  Maximize2,
  Wand2,
} from 'lucide-react';

export default function Sidebar({ systemStatus }) {
  const navItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/smart-restore', label: 'Smart Restore', icon: Wand2, highlight: true },
    { to: '/app/image-colorization', label: 'Image Colorization', icon: Palette },
    { to: '/app/image-sr', label: 'Image Super-Resolution', icon: Maximize2 },
    { to: '/app/video-colorization', label: 'Video Colorization', icon: Video },
    { to: '/app/video-enhancement', label: 'Video Super-Resolution', icon: Sparkles },
    { to: '/app/history', label: 'Processing History', icon: History },
    { to: '/app/about', label: 'About Project', icon: Info },
  ];

  const isMps = systemStatus?.device === 'mps';

  return (
    <aside className="w-64 border-r border-[#1A2B40] bg-[#080D16] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1A2B40]">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1769D2] to-[#268BFF] flex items-center justify-center shadow-[0_0_15px_rgba(38,139,255,0.4)] group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-[#F5F8FC]">VISION AI</span>
              <span className="block text-[10px] font-mono tracking-widest text-[#80BCFF]">DEEP LEARNING</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#101D2E] text-[#268BFF] border border-[#1A2B40] shadow-sm'
                      : 'text-[#98A9BD] hover:text-[#F5F8FC] hover:bg-[#0C1421]'
                  }`
                }
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#1769D2]/30 text-[#80BCFF] border border-[#268BFF]/30 shrink-0">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Hardware Telemetry */}
      <div className="p-4 border-t border-[#1A2B40] space-y-3">
        {/* Device Status Card */}
        <div className="p-3 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
          <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD] mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#268BFF]" />
              <span>COMPUTE ENGINE</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${isMps ? 'bg-[#25C98A]' : 'bg-[#F0B44C]'}`} />
          </div>
          <div className="text-xs font-medium text-[#F5F8FC] truncate">
            {systemStatus?.device_name || 'Detecting hardware...'}
          </div>
          <div className="text-[11px] font-mono text-[#64758A] mt-1 flex justify-between">
            <span>RAM: {systemStatus?.memory?.used_gb || 0} / {systemStatus?.memory?.total_gb || 16} GB</span>
            <span>{systemStatus?.memory?.percent_used || 0}%</span>
          </div>
        </div>

        {/* Back to Landing Link */}
        <Link
          to="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-mono text-[#98A9BD] hover:text-[#268BFF] hover:bg-[#0C1421] transition-colors"
        >
          <span>Landing Page</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}

