import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wand2,
  Palette,
  Video,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  Activity,
  History,
  CheckCircle2,
  HardDrive,
  Clock,
  ExternalLink,
  Maximize2,
  ZoomIn,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ systemStatus }) {
  const [modelsStatus, setModelsStatus] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [models, hist] = await Promise.all([
          api.getModelsStatus(),
          api.getHistory(6),
        ]);
        setModelsStatus(models);
        setHistoryRecords(hist.records || []);
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isMps = systemStatus?.device === 'mps';

  return (
    <div className="space-y-8">
      {/* 1. Top Enterprise Control Center Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0C1421] via-[#101D2E] to-[#080D16] border border-[#1A2B40] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#268BFF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#80BCFF]">
            <span className="w-2 h-2 rounded-full bg-[#25C98A] animate-pulse" />
            <span>DLCV SYSTEM ONLINE • APPLE SILICON ACCELERATED</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F8FC] tracking-tight">
            VISION AI Command Center
          </h1>
          <p className="text-sm sm:text-base text-[#98A9BD] leading-relaxed">
            Enterprise deep learning platform for photo-realistic image colorization, video chrominance stabilization, and sub-pixel super-resolution.
          </p>
        </div>
      </div>

      {/* 2. Featured Smart Restore Spotlight Banner */}
      <div className="p-7 rounded-3xl bg-gradient-to-r from-[#101D2E] via-[#0C1421] to-[#080D16] border border-[#268BFF]/40 shadow-[0_0_30px_rgba(38,139,255,0.12)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#80BCFF]">
            <Wand2 className="w-4 h-4 text-[#268BFF]" />
            <span className="font-bold tracking-wider uppercase">Featured Intelligent Capability</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F5F8FC] tracking-tight">
            VISION AI Smart Restore
          </h2>
          <p className="text-xs sm:text-sm text-[#98A9BD] leading-relaxed">
            Upload any vintage photograph for instant automated diagnosis. Smart Restore evaluates chromaticity, sharpness, noise, and pixel density, then orchestrates DDColor and Real-ESRGAN in a single guided pipeline.
          </p>
        </div>

        <Link
          to="/app/smart-restore"
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] hover:from-[#268BFF] hover:to-[#80BCFF] text-white font-bold text-xs font-mono tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(38,139,255,0.4)] transition-all shrink-0"
        >
          <span>Launch Smart Restore</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 3. Hardware & Models Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Status */}
        <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#268BFF]" />
              <span>COMPUTE ACCELERATOR</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#101D2E] text-[#25C98A] border border-[#1A2B40]">
              {systemStatus?.device?.toUpperCase() || 'MPS'}
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-[#F5F8FC]">{systemStatus?.device_name || 'Apple Silicon'}</div>
            <div className="text-xs font-mono text-[#64758A] mt-1">{systemStatus?.platform || 'Darwin ARM64'}</div>
          </div>
          <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span>Unified Memory</span>
            <span className="text-[#80BCFF] font-semibold">{systemStatus?.memory?.used_gb || 0} / {systemStatus?.memory?.total_gb || 16} GB</span>
          </div>
        </div>

        {/* DDColor Status */}
        <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-[#268BFF]" />
              <span>COLORIZATION MODEL</span>
            </span>
            <span className="flex items-center space-x-1 text-[#25C98A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready</span>
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-[#F5F8FC]">DDColor Tiny</div>
            <div className="text-xs font-mono text-[#64758A] mt-1">ConvNeXt-T + Dual Color Decoder</div>
          </div>
          <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span>Weights File Size</span>
            <span className="text-[#80BCFF] font-semibold">{modelsStatus?.ddcolor?.file_size_mb || 210.18} MB</span>
          </div>
        </div>

        {/* Real-ESRGAN Status */}
        <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#268BFF]" />
              <span>SUPER-RESOLUTION</span>
            </span>
            <span className="flex items-center space-x-1 text-[#25C98A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready</span>
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-[#F5F8FC]">Real-ESRGAN x4plus</div>
            <div className="text-xs font-mono text-[#64758A] mt-1">23-Block RRDBNet Architecture</div>
          </div>
          <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#98A9BD]">
            <span>Weights File Size</span>
            <span className="text-[#80BCFF] font-semibold">{modelsStatus?.realesrgan?.file_size_mb || 63.94} MB</span>
          </div>
        </div>
      </div>

      {/* 4. Four Deep Learning Studio Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#F5F8FC] tracking-tight">Active Restoration Studios</h2>
          <span className="text-xs font-mono text-[#64758A]">Dedicated Workflows</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Image Colorization */}
          <Link
            to="/app/image-colorization"
            className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF] hover:bg-[#101D2E] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF] mb-5 group-hover:scale-105 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">Image Colorization</h3>
              <p className="text-xs text-[#98A9BD] leading-relaxed">
                Colorize grayscale photos with DDColor in CIE Lab space, preserving native edge resolution.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#268BFF]">
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Image Super-Resolution */}
          <Link
            to="/app/image-sr"
            className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF] hover:bg-[#101D2E] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF] mb-5 group-hover:scale-105 transition-transform">
                <ZoomIn className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">Image Super-Res</h3>
              <p className="text-xs text-[#98A9BD] leading-relaxed">
                Upscale still photos by 2x or 4x with Real-ESRGAN x4plus. Tiled deep inference for memory safety.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#268BFF]">
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Video Colorization */}
          <Link
            to="/app/video-colorization"
            className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF] hover:bg-[#101D2E] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF] mb-5 group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">Video Colorization</h3>
              <p className="text-xs text-[#98A9BD] leading-relaxed">
                Frame-wise deep inference with Farnebäck optical flow stabilization and audio preservation.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#268BFF]">
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Video Super-Resolution */}
          <Link
            to="/app/video-enhancement"
            className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] hover:border-[#268BFF] hover:bg-[#101D2E] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF] mb-5 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F8FC] mb-2">Video Super-Res</h3>
              <p className="text-xs text-[#98A9BD] leading-relaxed">
                Sub-pixel video upscaling (2x / 4x) supporting 3GP, MP4, MOV, MKV, AVI with AAC audio remux.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono text-[#268BFF]">
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Activity & Telemetry Audit Table */}
      <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#268BFF]" />
            <h2 className="text-lg font-bold text-[#F5F8FC]">Recent Verification Telemetry</h2>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/api/history/export"
              download="vision_ai_history.csv"
              className="text-xs font-mono text-[#80BCFF] hover:text-white px-3 py-1.5 rounded-lg bg-[#101D2E] border border-[#1A2B40] flex items-center space-x-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#25C98A]" />
              <span>Export CSV</span>
            </a>
            <Link
              to="/app/history"
              className="text-xs font-mono text-[#80BCFF] hover:text-white transition-colors"
            >
              View Full History →
            </Link>
          </div>
        </div>

        {historyRecords.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-[#64758A]">
            No processing history yet. Run a colorization, super-resolution, or Smart Restore job to populate records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1A2B40] text-[#64758A]">
                  <th className="py-2.5 px-3">SOURCE FILE</th>
                  <th className="py-2.5 px-3">MODULE</th>
                  <th className="py-2.5 px-3">RESOLUTION</th>
                  <th className="py-2.5 px-3">DEVICE</th>
                  <th className="py-2.5 px-3">DURATION</th>
                  <th className="py-2.5 px-3">OUTPUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2B40]/50 text-[#98A9BD]">
                {historyRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#101D2E]/50 transition-colors">
                    <td className="py-3 px-3 text-[#F5F8FC] font-medium truncate max-w-[180px]">
                      {rec.file_name}
                    </td>
                    <td className="py-3 px-3 text-[#80BCFF]">{rec.module}</td>
                    <td className="py-3 px-3">{rec.input_resolution} → {rec.output_resolution}</td>
                    <td className="py-3 px-3 truncate max-w-[140px]">{rec.device}</td>
                    <td className="py-3 px-3">{rec.duration_sec}s</td>
                    <td className="py-3 px-3">
                      <a
                        href={rec.output_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#268BFF] hover:underline flex items-center space-x-1"
                      >
                        <span>Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
