import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wand2,
  Palette,
  Video,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Maximize2,
  Film,
  Zap,
  CheckCircle2,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';
import Navbar from '../components/navigation/Navbar';
import ComparisonSlider from '../components/comparison/ComparisonSlider';

export default function LandingPage() {
  const navigate = useNavigate();

  // Authentic archival photograph pairs for showcase (100% genuine DDColor inference output)
  const showcaseStreetGray = '/storage/samples/showcase_street_original_gray.jpg';
  const showcaseStreetColor = '/storage/samples/showcase_street_ai_colorized.jpg';
  const showcasePortraitGray = '/storage/samples/showcase_portrait_original_gray.jpg';
  const showcasePortraitColor = '/storage/samples/showcase_portrait_ai_colorized.jpg';

  const [activeShowcase, setActiveShowcase] = React.useState('street'); // 'street' or 'portrait'

  // 4 Core Studios metadata
  const studios = [
    {
      id: 'image-colorization',
      title: 'Image Colorization',
      description: 'Bring black-and-white photographs to life with AI colorization.',
      to: '/app/image-colorization',
      icon: Palette,
      image: '/storage/samples/studio_thumb_image_color.jpg',
      badge: 'Photos',
    },
    {
      id: 'image-sr',
      title: 'Image Super-Resolution',
      description: 'Upscale low-resolution photographs and reconstruct visual details.',
      to: '/app/image-sr',
      icon: Maximize2,
      image: '/storage/samples/studio_thumb_image_sr.jpg',
      badge: '2× & 4× Upscaling',
    },
    {
      id: 'video-colorization',
      title: 'Video Colorization',
      description: 'Restore grayscale videos with natural-looking color.',
      to: '/app/video-colorization',
      icon: Video,
      image: '/storage/samples/studio_thumb_video_color.jpg',
      badge: 'Video Clips',
    },
    {
      id: 'video-enhancement',
      title: 'Video Super-Resolution',
      description: 'Improve video resolution and visual clarity.',
      to: '/app/video-enhancement',
      icon: Sparkles,
      image: '/storage/samples/studio_thumb_video_sr.jpg',
      badge: 'HD Video',
    },
  ];

  return (
    <div className="min-h-screen bg-[#05070B] text-[#F5F8FC] selection:bg-[#1769D2] selection:text-white">
      {/* Navigation */}
      <Navbar />

      {/* SECTION 1 — HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-20 md:py-24 px-6 max-w-6xl mx-auto overflow-hidden">
        {/* Subtle Static Radial Gradient (No distracting animations) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#268BFF]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0C1421] border border-[#1A2B40] text-xs font-semibold text-[#80BCFF] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#268BFF]" />
            <span>AI-POWERED VISUAL RESTORATION</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F8FC] leading-[1.12]">
            Bring Your Images and Videos <span className="text-[#268BFF]">Back to Life.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-[#98A9BD] max-w-2xl mx-auto font-normal leading-relaxed">
            Colorize memories, enhance image quality and restore videos with intelligent AI-powered tools.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <Link
              to="/app/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white font-bold text-sm shadow-[0_0_20px_rgba(38,139,255,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Explore VISION AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#showcase"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] font-medium text-sm transition-colors flex items-center justify-center"
            >
              Discover Features
            </a>
          </div>
        </div>

        {/* Hero Visual Preview Card */}
        <div className="relative z-10 mt-14 max-w-4xl mx-auto rounded-2xl p-2 bg-[#0C1421]/80 border border-[#1A2B40] shadow-2xl">
          <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B]">
            <ComparisonSlider
              originalSrc={showcaseStreetGray}
              processedSrc={showcaseStreetColor}
              originalLabel="Original"
              processedLabel="AI Colorized"
              className="max-h-[520px]"
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs font-mono text-[#64758A]">
            <span>Drag slider horizontally to preview colorization</span>
            <span className="hidden sm:inline">Historical Street Scene (1941, Library of Congress)</span>
          </div>
        </div>
      </section>

      {/* SECTION 2 — AI COLORIZATION SHOWCASE */}
      <section id="showcase" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-widest text-[#80BCFF] uppercase">
              ORIGINAL ARCHIVAL BASE VS RESTORED
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#F5F8FC]">
              Original Archival Base vs Restored
            </h2>
            <p className="text-sm text-[#98A9BD]">
              See how AI brings black-and-white photographs back to life.
            </p>
          </div>

          {/* Interactive Subject Switcher */}
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#0C1421] border border-[#1A2B40] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveShowcase('street')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeShowcase === 'street'
                  ? 'bg-[#101D2E] text-[#80BCFF] border border-[#268BFF]/40 shadow-sm'
                  : 'text-[#98A9BD] hover:text-[#F5F8FC]'
              }`}
            >
              Street Scene (1941)
            </button>
            <button
              type="button"
              onClick={() => setActiveShowcase('portrait')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeShowcase === 'portrait'
                  ? 'bg-[#101D2E] text-[#80BCFF] border border-[#268BFF]/40 shadow-sm'
                  : 'text-[#98A9BD] hover:text-[#F5F8FC]'
              }`}
            >
              Historical Portrait (1911)
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] shadow-xl space-y-3">
          <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B]">
            <ComparisonSlider
              originalSrc={activeShowcase === 'street' ? showcaseStreetGray : showcasePortraitGray}
              processedSrc={activeShowcase === 'street' ? showcaseStreetColor : showcasePortraitColor}
              originalLabel="Original"
              processedLabel="AI Colorized"
              className="max-h-[580px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64758A] px-2 pt-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25C98A]" />
              <span className="text-[#98A9BD]">
                {activeShowcase === 'street'
                  ? 'Calle de Rafael Cordero, San Juan (1941) — Jack Delano, Library of Congress (Public Domain)'
                  : 'Alim Khan, Emir of Bukhara (1911) — Sergey Prokudin-Gorsky, Library of Congress (Public Domain)'}
              </span>
            </div>
            <span>Genuine neural colorization generated by DDColor</span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — SMART RESTORE GUIDED RESTORATION SPOTLIGHT */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0C1421] via-[#101D2E] to-[#080D16] border border-[#268BFF]/40 shadow-[0_0_30px_rgba(38,139,255,0.12)] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#80BCFF] bg-[#101D2E] px-3 py-1 rounded-full border border-[#1A2B40]">
              <Wand2 className="w-3.5 h-3.5 text-[#268BFF]" />
              <span>GUIDED RESTORATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">
              One-Click Automated Smart Restore
            </h2>
            <p className="text-sm text-[#98A9BD] leading-relaxed">
              Upload any vintage photograph for instant automated diagnosis. Smart Restore evaluates color and resolution, then automatically applies colorization and upscaling in a single guided flow.
            </p>
          </div>

          <Link
            to="/app/smart-restore"
            className="px-7 py-3.5 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white font-bold text-xs tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(38,139,255,0.3)] transition-all shrink-0"
          >
            <span>Launch Smart Restore</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SECTION 4 — FOUR RESTORATION STUDIOS */}
      <section id="studios" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-mono tracking-widest text-[#80BCFF] uppercase">
            RESTORATION STUDIOS
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#F5F8FC]">
            Four Dedicated Restoration Tools
          </h2>
          <p className="text-sm text-[#98A9BD]">
            Engineered specifically for restoring photographs, archives, and historical videos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {studios.map((studio) => {
            const Icon = studio.icon;
            return (
              <div
                key={studio.id}
                onClick={() => navigate(studio.to)}
                className="rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF]/60 hover:bg-[#101D2E] transition-all cursor-pointer group shadow-lg flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-[#05070B]">
                  <img
                    src={studio.image}
                    alt={studio.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#080D16]/85 backdrop-blur border border-[#1A2B40] text-[11px] font-medium text-[#80BCFF]">
                    {studio.badge}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 text-[#268BFF] mb-2">
                      <Icon className="w-4 h-4" />
                      <h3 className="text-sm font-bold text-[#F5F8FC] tracking-tight">{studio.title}</h3>
                    </div>
                    <p className="text-xs text-[#98A9BD] leading-relaxed">
                      {studio.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-medium text-[#268BFF] group-hover:text-[#80BCFF]">
                    <span>Open Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5 — TECHNOLOGY OVERVIEW */}
      <section id="technology" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-mono tracking-widest text-[#80BCFF] uppercase">
            INTELLIGENT RESTORATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F8FC]">
            Deep-Learning Visual Restoration
          </h2>
          <p className="text-sm text-[#98A9BD]">
            How VISION AI reconstructs authentic color and resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF]">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F8FC]">Perceptual Color Synthesis</h3>
            <p className="text-xs text-[#98A9BD] leading-relaxed">
              Learns natural color associations across sky, skin, fabric, and landscapes, applying colors in perceptual color space to preserve original shading and lighting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF]">
              <Maximize2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F8FC]">Deep Super-Resolution</h3>
            <p className="text-xs text-[#98A9BD] leading-relaxed">
              Reconstructs realistic sub-pixel visual details up to 4× resolution without blurry bicubic artifacts, restoring sharp architectural edges and fine texture.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF]">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F8FC]">Temporal Video Stability</h3>
            <p className="text-xs text-[#98A9BD] leading-relaxed">
              Maintains smooth color transitions across consecutive video frames to prevent flickering, while automatically synchronizing and preserving audio tracks.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — ABOUT & FOOTER */}
      <footer id="about" className="border-t border-[#1A2B40] bg-[#080D16] py-14 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 pb-10 border-b border-[#1A2B40]">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1769D2] to-[#268BFF] flex items-center justify-center shadow-md">
                <Eye className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-extrabold text-sm tracking-wider text-[#F5F8FC]">VISION AI</span>
            </div>
            <p className="text-xs text-[#98A9BD] leading-relaxed">
              AI-powered image and video colorization and super-resolution platform designed for authentic visual restoration and archival preservation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div className="space-y-2.5">
              <span className="font-semibold text-[#F5F8FC] block">Platform</span>
              <ul className="space-y-2 text-[#98A9BD]">
                <li><Link to="/app/dashboard" className="hover:text-[#F5F8FC] transition-colors">Dashboard</Link></li>
                <li><Link to="/app/smart-restore" className="hover:text-[#F5F8FC] transition-colors">Smart Restore</Link></li>
                <li><Link to="/app/history" className="hover:text-[#F5F8FC] transition-colors">History</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-semibold text-[#F5F8FC] block">Studios</span>
              <ul className="space-y-2 text-[#98A9BD]">
                <li><Link to="/app/image-colorization" className="hover:text-[#F5F8FC] transition-colors">Image Colorization</Link></li>
                <li><Link to="/app/image-sr" className="hover:text-[#F5F8FC] transition-colors">Image Super-Resolution</Link></li>
                <li><Link to="/app/video-colorization" className="hover:text-[#F5F8FC] transition-colors">Video Colorization</Link></li>
                <li><Link to="/app/video-enhancement" className="hover:text-[#F5F8FC] transition-colors">Video Super-Resolution</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5 col-span-2 sm:col-span-1">
              <span className="font-semibold text-[#F5F8FC] block">Documentation</span>
              <ul className="space-y-2 text-[#98A9BD]">
                <li><Link to="/app/about" className="hover:text-[#F5F8FC] transition-colors">About Project</Link></li>
                <li><a href="#showcase" className="hover:text-[#F5F8FC] transition-colors">Archival Showcase</a></li>
                <li><a href="#technology" className="hover:text-[#F5F8FC] transition-colors">Restoration Tech</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64758A] gap-3">
          <span>&copy; {new Date().getFullYear()} VISION AI Platform. All rights reserved.</span>
          <span>Engineered for photo-realistic media restoration and archival preservation.</span>
        </div>
      </footer>
    </div>
  );
}
