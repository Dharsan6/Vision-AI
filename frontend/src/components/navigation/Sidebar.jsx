import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Palette,
  Video,
  Sparkles,
  History,
  Info,
  ArrowUpRight,
  Eye,
  Maximize2,
  Wand2,
} from 'lucide-react';

export default function Sidebar() {
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

  return (
    <aside className="w-64 border-r border-[#1A2B40] bg-[#080D16] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1A2B40]">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1769D2] to-[#268BFF] flex items-center justify-center shadow-[0_0_15px_rgba(38,139,255,0.4)] group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-[#F5F8FC]">VISION AI</span>
              <span className="block text-[10px] font-medium tracking-wider text-[#80BCFF]">STUDIO PLATFORM</span>
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#101D2E] text-[#80BCFF] border border-[#268BFF]/40 shrink-0">
                    Auto
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Status & Overview Link */}
      <div className="p-4 border-t border-[#1A2B40] space-y-2">
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0C1421] border border-[#1A2B40] text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#25C98A]" />
            <span className="text-[#98A9BD]">Status:</span>
            <span className="font-medium text-[#F5F8FC]">Ready</span>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#98A9BD] hover:text-[#268BFF] hover:bg-[#0C1421] transition-colors"
        >
          <span>Return to Overview</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
