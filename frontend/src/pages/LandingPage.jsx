import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wand2,
  Palette,
  Video,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  ChevronDown,
  Eye,
  CheckCircle2,
  Film,
  Zap,
  ZoomIn,
  ShieldCheck,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

import PhotonKnot from '../components/reactbits/PhotonKnot';
import ShinyText from '../components/reactbits/ShinyText';
import DitherVeil from '../components/reactbits/DitherVeil';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import ScrollExpand from '../components/reactbits/ScrollExpand';
import CircularCarousel from '../components/reactbits/CircularCarousel';
import Navbar from '../components/navigation/Navbar';

export default function LandingPage({ systemStatus }) {
  // Sample assets served directly via backend /storage/samples/
  const grayscaleSample = '/storage/samples/sample_portrait_gray.jpg';
  const colorizedSample = '/storage/samples/sample_portrait_colorized.png';
  const videoSample = '/storage/samples/sample_motion_gray.mp4';

  const carouselItems = [
    {
      id: 1,
      title: 'Monochrome Archival Scan Base',
      description: 'Original high-contrast monochrome scan with film grain and optical luminance preserved without degradation.',
      badge: 'ARCHIVAL BASE',
      badgeIcon: 'image',
      type: 'image',
      mediaUrl: grayscaleSample,
      model: 'Grayscale Reference',
      tag: '512x512 Baseline',
    },
    {
      id: 2,
      title: 'DDColor Semantic Chrominance Restoration',
      description: 'Learned dual-query color decoder in CIE Lab space synthesizing authentic skin tones, fabric, and textures.',
      badge: 'IMAGE COLORIZATION',
      badgeIcon: 'image',
      type: 'image',
      mediaUrl: colorizedSample,
      model: 'DDColor ConvNeXt-T',
      tag: 'CIE Lab Space',
    },
    {
      id: 3,
      title: 'Sequential Video Motion Colorization',
      description: 'Real-time frame extraction with scene-cut detection and optical-flow temporal chrominance stabilization.',
      badge: 'VIDEO INFERENCE',
      badgeIcon: 'video',
      type: 'video',
      mediaUrl: videoSample,
      model: 'DDColor + Stabilizer',
      tag: 'H.264 Playable',
    },
    {
      id: 4,
      title: 'Deep Super-Resolution 4x Upscaling',
      description: 'Sub-pixel RRDBNet 23-block residual feature aggregation restoring crisp architectural edges and fine details.',
      badge: 'SUPER-RESOLUTION',
      badgeIcon: 'image',
      type: 'image',
      mediaUrl: colorizedSample,
      model: 'Real-ESRGAN x4plus',
      tag: 'RRDBNet 4x',
    },
  ];

  return (
    <div className="min-h-screen bg-[#05070B] text-[#F5F8FC] selection:bg-[#1769D2] selection:text-white">
      <Navbar systemStatus={systemStatus} />

      {/* SECTION 1 — CINEMATIC HERO */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Photon Knot Background */}
        <PhotonKnot />

        <div className="relative z-10 max-w-4xl text-center flex flex-col items-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0C1421]/90 backdrop-blur border border-[#1A2B40] text-xs font-mono text-[#80BCFF] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#268BFF] animate-ping" />
            <span>AI-POWERED COMPUTER VISION • DLCV PLATFORM</span>
          </div>

          {/* Main Headline with ShinyText */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-mono tracking-widest text-[#268BFF] uppercase font-bold">
              VISION AI
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
              <ShinyText text="BEYOND RESTORATION." speed={4} />
              <br />
              <span className="text-[#F5F8FC]">REIMAGINING VISUAL HISTORY.</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-[#98A9BD] max-w-2xl font-normal leading-relaxed">
            An intelligent deep-learning platform for restoring, colorizing and enhancing images and videos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link
              to="/app/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] text-white font-semibold text-sm shadow-[0_0_25px_rgba(38,139,255,0.4)] hover:shadow-[0_0_35px_rgba(38,139,255,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Explore VISION AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#technology"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] font-medium text-sm transition-colors flex items-center justify-center"
            >
              Discover the Technology
            </a>
          </div>

          {/* Hardware Detection Tag */}
          <div className="pt-8 flex items-center space-x-2 text-xs font-mono text-[#64758A]">
            <Cpu className="w-4 h-4 text-[#268BFF]" />
            <span>ACCELERATED FOR:</span>
            <span className="text-[#80BCFF] font-semibold">{systemStatus?.device_name || 'Apple Silicon MPS'}</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <a
          href="#showcase"
          className="absolute bottom-6 flex flex-col items-center space-y-1 text-xs font-mono text-[#64758A] hover:text-[#268BFF] transition-colors"
        >
          <span>SCROLL TO DISCOVER</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </section>

      {/* SECTION 2 — ORIGINAL VS RESTORED SHOWCASE */}
      <section id="showcase" className="py-24 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-mono tracking-widest text-[#80BCFF] uppercase">
                INTERACTIVE CHROMINANCE REVEAL
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FC] mt-1">
                ORIGINAL ARCHIVAL BASE VS RESTORED
              </h2>
            </div>
            <p className="text-xs font-mono text-[#64758A] max-w-xs">
              Interact below to wipe away the monochrome archival scan and reveal genuine DDColor deep learning chrominance.
            </p>
          </div>

          {/* DitherVeil Component */}
          <DitherVeil
            grayscaleSrc={grayscaleSample}
            colorizedSrc={colorizedSample}
            src={colorizedSample}
            pattern="floyd"
            palette="duotone"
            pixelSize={2}
            inkColor="#05070B"
            paperColor="#EAF3FF"
            revealRadius={200}
            softness={0.6}
            linger={1.0}
            rimColor="#268BFF"
            rim={1.0}
            clickBurst={true}
          />
        </ScrollReveal>
      </section>

      {/* SECTION 3 — SMART RESTORE INTRODUCTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <ScrollReveal>
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#101D2E] via-[#0C1421] to-[#080D16] border border-[#268BFF]/40 shadow-[0_0_35px_rgba(38,139,255,0.15)] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#80BCFF] bg-[#101D2E] px-3 py-1 rounded-full border border-[#1A2B40]">
                <Wand2 className="w-3.5 h-3.5 text-[#268BFF]" />
                <span className="font-bold tracking-wider uppercase">INTRODUCING SMART RESTORE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F8FC] tracking-tight">
                One-Click Multi-Stage AI Restoration
              </h2>
              <p className="text-sm text-[#98A9BD] leading-relaxed">
                Smart Restore inspects your media for monochrome vs natural color, sharpness, noise levels, and resolution. It automatically decides whether colorization, 2x upscaling, or 4x super-resolution is required, executing the combined pipeline with verified audit telemetry.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-xs font-mono text-[#80BCFF]">
                <span className="px-2.5 py-1 rounded-md bg-[#080D16] border border-[#1A2B40]">
                  • Automated Diagnosis
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#080D16] border border-[#1A2B40]">
                  • DDColor Semantic Pass
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#080D16] border border-[#1A2B40]">
                  • Real-ESRGAN Tiled Upscale
                </span>
              </div>
            </div>

            <Link
              to="/app/smart-restore"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] text-white font-bold text-sm shadow-[0_0_25px_rgba(38,139,255,0.4)] hover:scale-105 transition-all flex items-center space-x-2 shrink-0"
            >
              <span>Launch Smart Restore</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 4 — FOUR CORE CAPABILITIES */}
      <section className="py-24 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-widest text-[#268BFF] uppercase">
              DEEP LEARNING CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FC]">
              FOUR RESTORATION STUDIOS
            </h2>
            <p className="text-sm text-[#98A9BD]">
              Specialized neural pipelines engineered for images, videos, and multi-format archives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Image Colorization */}
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF]/60 hover:bg-[#101D2E] transition-all group shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] group-hover:border-[#268BFF] flex items-center justify-center text-[#268BFF] mb-5 transition-colors">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">IMAGE COLORIZATION</h3>
                <p className="text-xs text-[#98A9BD] leading-relaxed mb-4">
                  Predicts dual-query chrominance in CIE Lab space, fusing color with native $L^*$ lightness for 100% edge retention.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#64758A]">
                <span>DDColor Tiny</span>
                <span className="text-[#80BCFF]">CIE Lab Space</span>
              </div>
            </div>

            {/* Card 2: Image Super-Resolution */}
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF]/60 hover:bg-[#101D2E] transition-all group shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] group-hover:border-[#268BFF] flex items-center justify-center text-[#268BFF] mb-5 transition-colors">
                  <ZoomIn className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">IMAGE SUPER-RES</h3>
                <p className="text-xs text-[#98A9BD] leading-relaxed mb-4">
                  Sub-pixel 2x and 4x neural reconstruction using 23-block RRDBNet with memory-bounded 512px tiled processing.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#64758A]">
                <span>Real-ESRGAN x4plus</span>
                <span className="text-[#80BCFF]">2x / 4x Tiled</span>
              </div>
            </div>

            {/* Card 3: Video Colorization */}
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF]/60 hover:bg-[#101D2E] transition-all group shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] group-hover:border-[#268BFF] flex items-center justify-center text-[#268BFF] mb-5 transition-colors">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">VIDEO COLORIZATION</h3>
                <p className="text-xs text-[#98A9BD] leading-relaxed mb-4">
                  Sequential frame inference with Farnebäck optical flow stabilization and automated scene-cut detection.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#64758A]">
                <span>Optical Flow</span>
                <span className="text-[#80BCFF]">H.264 MP4</span>
              </div>
            </div>

            {/* Card 4: Video Super-Resolution */}
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF]/60 hover:bg-[#101D2E] transition-all group shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] group-hover:border-[#268BFF] flex items-center justify-center text-[#268BFF] mb-5 transition-colors">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">VIDEO SUPER-RES</h3>
                <p className="text-xs text-[#98A9BD] leading-relaxed mb-4">
                  Upscale 3GP, MP4, MOV, MKV, and AVI clips by 2x or 4x with automatic AMR-NB to AAC audio remuxing.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#64758A]">
                <span>Broad Decoders</span>
                <span className="text-[#80BCFF]">AAC Remux</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 5 — AI MODEL ARCHITECTURE & CITATIONS */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono tracking-widest text-[#80BCFF] uppercase">
              DEEP LEARNING ARCHITECTURE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#F5F8FC]">
              STATE-OF-THE-ART COMPUTER VISION MODELS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <div className="flex items-center space-x-2 text-[#80BCFF]">
                <Palette className="w-5 h-5 text-[#268BFF]" />
                <h3 className="text-base font-bold text-[#F5F8FC]">DDColor Architecture (ICCV 2023)</h3>
              </div>
              <p className="text-xs text-[#98A9BD] leading-relaxed">
                DDColor employs a ConvNeXt-Tiny encoder to construct hierarchical feature pyramids. The transformer decoder cross-attends coarse and fine color queries with spatial features, predicting chrominance in CIE Lab space.
              </p>
              <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#64758A]">
                <span>Weights: 210.18 MB</span>
                <span className="text-[#25C98A]">Apple MPS Accelerated</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <div className="flex items-center space-x-2 text-[#80BCFF]">
                <Sparkles className="w-5 h-5 text-[#268BFF]" />
                <h3 className="text-base font-bold text-[#F5F8FC]">Real-ESRGAN x4plus (ICCVW 2021)</h3>
              </div>
              <p className="text-xs text-[#98A9BD] leading-relaxed">
                Built on a 23-block Residual-in-Residual Dense Network (RRDBNet) without batch normalization. Trained on synthetic high-order degradation modeling to eliminate blur, compression noise, and sensor artifacts.
              </p>
              <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#64758A]">
                <span>Weights: 63.94 MB</span>
                <span className="text-[#25C98A]">512px Tiled Memory Safe</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 6 — BENCHMARK SHOWCASE CAROUSEL */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-xs font-mono tracking-widest text-[#268BFF] uppercase">
              BENCHMARK SHOWCASE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8FC]">
              EXPLORE AUTHENTIC RESTORATION SAMPLES
            </h2>
            <p className="text-sm text-[#98A9BD]">
              Real model outputs generated by DDColor and Real-ESRGAN running on Apple Silicon.
            </p>
          </div>

          <CircularCarousel items={carouselItems} />
        </ScrollReveal>
      </section>

      {/* SECTION 7 — TECHNOLOGY STACK */}
      <section id="technology" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#1A2B40]">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono tracking-widest text-[#80BCFF] uppercase">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#F5F8FC]">
              ENTERPRISE COMPUTER VISION STACK
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'PyTorch 2.6', role: 'Metal Performance Shaders (MPS)' },
              { name: 'DDColor', role: 'Dual-Decoder Colorization' },
              { name: 'Real-ESRGAN', role: '23-Block RRDBNet Super-Res' },
              { name: 'FastAPI', role: 'Async Job Orchestration' },
              { name: 'FFmpeg 9.0', role: 'H.264 & Audio Remuxing' },
              { name: 'OpenCV 4.10', role: 'Frame Extraction & Vision' },
              { name: 'React 18 + Vite', role: 'Ultra-Fast Web Platform' },
              { name: 'Tailwind CSS', role: 'Deep Navy Design System' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="p-5 rounded-xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF]/50 transition-colors"
              >
                <div className="text-sm font-semibold text-[#F5F8FC]">{tech.name}</div>
                <div className="text-xs font-mono text-[#64758A] mt-1">{tech.role}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section className="py-24 px-6 text-center border-t border-[#1A2B40] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#101D2E]/20 to-[#05070B] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F8FC]">
            READY TO SEE BEYOND PIXELS?
          </h2>
          <p className="text-base text-[#98A9BD]">
            Experience genuine deep learning colorization and super-resolution on your local hardware.
          </p>
          <div className="pt-2">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center space-x-2 px-9 py-4 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] text-white font-bold text-sm shadow-[0_0_30px_rgba(38,139,255,0.4)] hover:shadow-[0_0_45px_rgba(38,139,255,0.7)] hover:scale-105 transition-all"
            >
              <span>Explore VISION AI</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-[#1A2B40] bg-[#05070B] text-center text-xs font-mono text-[#64758A]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-[#268BFF]" />
            <span className="text-[#F5F8FC] font-semibold">VISION AI</span>
            <span>• AI-Powered Image & Video Colorization and Enhancement</span>
          </div>
          <div>Academic & Professional DLCV Deep Learning Platform</div>
        </div>
      </footer>
    </div>
  );
}
