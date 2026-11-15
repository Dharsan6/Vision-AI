import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, ArrowRight, Menu, X, LayoutDashboard, Sparkles } from 'lucide-react';

export default function Navbar({ systemStatus }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isApp = location.pathname.startsWith('/app');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/#hero' },
    { label: 'Showcase', href: '/#showcase' },
    { label: 'Studios', href: '/#studios' },
    { label: 'Technology', href: '/#technology' },
    { label: 'About', href: '/#about' },
  ];

  const handleNavClick = (href) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector(href.substring(1));
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.querySelector(href.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="h-16 border-b border-[#1A2B40] bg-[#05070B]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1769D2] to-[#268BFF] flex items-center justify-center shadow-[0_0_12px_rgba(38,139,255,0.4)] group-hover:scale-105 transition-transform">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wider text-[#F5F8FC]">VISION AI</span>
        </Link>
      </div>

      {/* Navigation Links (Desktop) */}
      {!isApp && (
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-[#98A9BD]">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="hover:text-[#F5F8FC] transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {isApp ? (
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl border border-[#1A2B40] bg-[#080D16] hover:bg-[#101D2E] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] transition-colors hidden sm:inline-flex"
            >
              Back to Overview
            </Link>
          </div>
        ) : (
          <Link
            to="/app/dashboard"
            className="px-4 py-2 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(38,139,255,0.3)] transition-all flex items-center space-x-1.5"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Mobile Menu Button (on Landing Page) */}
        {!isApp && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#0C1421] text-[#98A9BD] hover:text-[#F5F8FC] border border-[#1A2B40]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && !isApp && (
        <div className="absolute top-16 left-0 right-0 bg-[#080D16] border-b border-[#1A2B40] p-6 space-y-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-sm font-medium text-[#98A9BD] hover:text-[#268BFF] py-1 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-[#1A2B40]">
            <Link
              to="/app/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#268BFF] text-white text-xs font-bold flex items-center justify-center space-x-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
