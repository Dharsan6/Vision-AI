import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Play,
  Maximize2,
  FileVideo,
  Volume2,
  Film,
  Zap,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ProgressBar from '../components/progress/ProgressBar';
import SynchronizedVideoPlayer from '../components/video/SynchronizedVideoPlayer';
import { api } from '../services/api';

export default function VideoEnhancement() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [scale, setScale] = useState(4); // 2 or 4
  const [maxFrames, setMaxFrames] = useState(0); // 0 = entire video
  const [loading, setLoading] = useState(false);
  const [jobProgress, setJobProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState(null);

  const supportedFormats = [
    'MP4', 'MOV', 'AVI', '3GP', '3G2', 'MKV', 'WEBM', 'FLV', 'WMV', 'M4V', 'MPG', 'TS', 'MTS'
  ];

  const handleStartEnhancement = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setJobProgress({
      progress: 5.0,
      current_frame: 0,
      total_frames: 0,
      current_step: 'Inspecting video stream codec and extracting source frames...',
    });

    try {
      const response = await api.enhanceVideo(selectedFile, scale, maxFrames);
      const jobId = response.job_id;
      setOriginalVideoUrl(response.original_video_url);

      const finalResult = await api.pollJob(jobId, (job) => {
        setJobProgress({
          progress: job.progress,
          current_frame: job.current_frame,
          total_frames: job.total_frames,
          current_step: job.current_step,
          elapsed_seconds: job.elapsed_seconds,
        });
      });

      setResult(finalResult);
    } catch (err) {
      console.error('Super-resolution error:', err);
      setError(err.response?.data?.detail || err.message || 'Video super-resolution pipeline failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setJobProgress(null);
    setError(null);
    setOriginalVideoUrl(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#80BCFF] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#268BFF]" />
            <span>SUB-PIXEL DEEP RESIDUAL RESTORATION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F8FC] tracking-tight">Video Super-Resolution Studio</h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Upscale low-resolution videos by 2x or 4x with Real-ESRGAN x4plus using tiled inference for memory efficiency.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Process Another Video</span>
          </button>
        )}
      </div>

      {/* Main Workflow: Upload & Controls */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Uploader */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                  1. Select Source Video
                </h2>
                <span className="text-[11px] font-mono text-[#80BCFF] bg-[#101D2E] px-2.5 py-0.5 rounded-full border border-[#1A2B40]">
                  FFmpeg Broad Codec Engine
                </span>
              </div>

              <FileDropzone
                file={selectedFile}
                onFileSelect={setSelectedFile}
                accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.3gp,.3g2,.m4v,.mpg,.mpeg,.ts,.mts"
                acceptType="video"
                maxSizeMB={300}
                sampleUrl="/storage/samples/sample_motion_gray.mp4"
                sampleLabel="Load Benchmark Video Clip"
              />

              {/* Supported Formats Badge Grid */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-[#64758A] mb-2 flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5 text-[#268BFF]" />
                  <span>DECODABLE CONTAINERS & CODECS:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {supportedFormats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded-md bg-[#080D16] border border-[#1A2B40] text-[10px] font-mono text-[#98A9BD]"
                    >
                      {fmt}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-md bg-[#101D2E] border border-[#1A2B40] text-[10px] font-mono text-[#25C98A]">
                    + Any FFmpeg Stream
                  </span>
                </div>
              </div>
            </div>

            {/* Active Progress Bar */}
            {loading && jobProgress && (
              <ProgressBar
                progress={jobProgress.progress}
                currentFrame={jobProgress.current_frame}
                totalFrames={jobProgress.total_frames}
                currentStep={jobProgress.current_step}
                elapsedSeconds={jobProgress.elapsed_seconds}
                module={`Real-ESRGAN ${scale}x Pipeline`}
              />
            )}
          </div>

          {/* Configuration Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-5">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                2. Upscaling Options
              </h2>

              {/* Scale Selector */}
              <div>
                <label className="block text-xs font-mono text-[#98A9BD] mb-2">SCALING FACTOR</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setScale(2)}
                    className={`py-3 px-3 rounded-xl border text-xs font-mono transition-all flex flex-col items-center justify-center space-y-1 ${
                      scale === 2
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-[0_0_15px_rgba(38,139,255,0.2)]'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <span className="text-base font-bold">2x Factor</span>
                    <span className="text-[10px] text-[#64758A]">Fast 200% Upscale</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setScale(4)}
                    className={`py-3 px-3 rounded-xl border text-xs font-mono transition-all flex flex-col items-center justify-center space-y-1 ${
                      scale === 4
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-[0_0_15px_rgba(38,139,255,0.2)]'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <span className="text-base font-bold">4x Factor</span>
                    <span className="text-[10px] text-[#64758A]">Ultra 400% Super-Res</span>
                  </button>
                </div>
              </div>

              {/* Frame limit selector */}
              <div>
                <label className="block text-xs font-mono text-[#98A9BD] mb-1">
                  FRAME LIMIT (BENCHMARK TEST)
                </label>
                <select
                  value={maxFrames}
                  disabled={loading}
                  onChange={(e) => setMaxFrames(Number(e.target.value))}
                  aria-label="Select benchmark frame count"
                  className="w-full py-2.5 px-3 rounded-xl border border-[#1A2B40] bg-[#080D16] text-xs font-mono text-[#F5F8FC] focus:outline-none focus:border-[#268BFF]"
                >
                  <option value={0}>Process Entire Video</option>
                  <option value={6}>First 6 Frames (~0.25s test)</option>
                  <option value={12}>First 12 Frames (~0.5s test)</option>
                  <option value={24}>First 24 Frames (~1.0s test)</option>
                </select>
              </div>

              {/* Audio & Codec specs */}
              <div className="p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-2 text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-[#25C98A]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">Audio Remuxing Enabled</span>
                </div>
                <div className="text-[11px] text-[#64758A] leading-relaxed">
                  Original audio streams (AAC, AMR-NB, MP3, etc.) are automatically preserved and transcoded to high-fidelity AAC during reconstruction.
                </div>
                <div className="pt-2 border-t border-[#1A2B40]/60 space-y-1 text-[#64758A] text-[11px]">
                  <div>• RRDBNet 23 Residual Dense Blocks</div>
                  <div>• 512px tile inference with 10px overlap</div>
                  <div>• Universal H.264 / yuv420p web MP4 output</div>
                </div>
              </div>

              {/* Run Button */}
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleStartEnhancement}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] hover:from-[#268BFF] hover:to-[#80BCFF] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Upscaling frames...</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span>Upscale Video ({scale}x)</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 text-xs font-mono text-[#F06464] flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Result View with Synchronized Dual Video Player */
        <div className="space-y-6">
          <SynchronizedVideoPlayer
            originalUrl={originalVideoUrl}
            enhancedUrl={result.output_url}
            originalLabel={`Original Video (${result.input_resolution})`}
            enhancedLabel={`Real-ESRGAN ${result.scale_factor} (${result.output_resolution})`}
            fps={result.fps}
          />

          {/* Operational Metrics Telemetry Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>INFERENCE DURATION</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.metrics?.elapsed_seconds}s
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Maximize2 className="w-3.5 h-3.5 text-[#25C98A]" />
                <span>SCALING MULTIPLIER</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.scale_factor}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Layers className="w-3.5 h-3.5 text-[#80BCFF]" />
                <span>PROCESSED FRAMES</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.metrics?.frame_count} frames
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Zap className="w-3.5 h-3.5 text-[#F0B44C]" />
                <span>THROUGHPUT (FPS)</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.metrics?.processing_throughput_fps || (1 / (result.metrics?.average_frame_time_sec || 1)).toFixed(2)} fps
              </div>
            </div>
          </div>

          {/* Download Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[#F5F8FC]">Download Enhanced High-Definition MP4</div>
              <div className="text-xs text-[#98A9BD] font-mono mt-0.5">
                Resolution: {result.output_resolution} • File size: {result.metrics?.output_size_mb} MB • Hardware: {result.device}
              </div>
            </div>

            <a
              href={result.download_url}
              className="px-6 py-3 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download Enhanced MP4</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
