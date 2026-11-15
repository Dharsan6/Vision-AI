import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleStartEnhancement = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setJobProgress({
      progress: 5.0,
      current_frame: 0,
      total_frames: 0,
      current_step: 'Extracting video frames for neural upscaling...',
    });

    try {
      const response = await api.enhanceVideo(selectedFile, scale, maxFrames);
      const jobId = response.job_id;
      setOriginalVideoUrl(response.original_video_url);

      const finalResult = await api.pollJob(jobId, (job) => {
        setJobProgress({
          progress: Math.round(job.progress),
          current_frame: job.current_frame,
          total_frames: job.total_frames,
          current_step: job.current_step,
          elapsed_seconds: job.elapsed_seconds,
        });
      });

      setResult(finalResult);
    } catch (err) {
      console.error('Video super-resolution error:', err);
      setError(err.response?.data?.detail || err.message || 'Video enhancement failed. Please try again.');
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">
            Video Super-Resolution
          </h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Upscale low-resolution video clips by 2× or 4× with deep neural detail reconstruction.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Process Another Video</span>
          </button>
        )}
      </div>

      {/* Main Workflow: Upload & Controls */}
      {!result ? (
        <div className="space-y-6">
          {/* 1. File Uploader Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            <span className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Source Video
            </span>

            <FileDropzone
              file={selectedFile}
              onFileSelect={setSelectedFile}
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.3gp,.3g2,.m4v,.mpg,.mpeg,.ts,.mts"
              acceptType="video"
              maxSizeMB={300}
              sampleUrl="/storage/samples/sample_motion_gray.mp4"
              sampleLabel="Load Test Sample (Motion Clip)"
            />

            <p className="text-[11px] text-[#64758A]">
              Supports standard and mobile video containers (MP4, MOV, AVI, 3GP, MKV, etc.) with automatic audio preservation.
            </p>
          </div>

          {/* 2. Enhancement Settings Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-5">
            <div className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Enhancement Factor
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setScale(2)}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  scale === 2
                    ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                    : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                }`}
              >
                <div className="text-sm font-bold">2× Upscale</div>
                <div className="text-[11px] text-[#64758A]">Fast 200% resolution boost</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setScale(4)}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  scale === 4
                    ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                    : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                }`}
              >
                <div className="text-sm font-bold">4× Upscale</div>
                <div className="text-[11px] text-[#64758A]">Ultra 400% high-definition recovery</div>
              </button>
            </div>

            {/* Collapsible Advanced Settings */}
            <div className="rounded-xl border border-[#1A2B40] bg-[#080D16] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 text-left text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-[#268BFF]" />
                  <span>Advanced Parameters</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="p-4 border-t border-[#1A2B40] space-y-2 text-xs">
                  <label className="block text-xs font-medium text-[#F5F8FC]">Preview Frame Limit</label>
                  <select
                    value={maxFrames}
                    disabled={loading}
                    onChange={(e) => setMaxFrames(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-lg border border-[#1A2B40] bg-[#0C1421] text-xs text-[#F5F8FC] focus:outline-none focus:border-[#268BFF]"
                  >
                    <option value={0}>Process Entire Video</option>
                    <option value={12}>First 12 Frames (~0.5s preview)</option>
                    <option value={24}>First 24 Frames (~1s preview)</option>
                    <option value={48}>First 48 Frames (~2s preview)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleStartEnhancement}
                className="w-full py-4 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.3)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Upscaling video frames ({jobProgress?.progress || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enhance Video ({scale}×)</span>
                  </>
                )}
              </button>
            </div>

            {/* Clean Progress Indicator */}
            {loading && jobProgress && (
              <div className="p-4 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#80BCFF] font-medium truncate max-w-xs sm:max-w-md">
                    {jobProgress.current_step || 'Upscaling video frames...'}
                  </span>
                  <span className="text-[#F5F8FC] font-bold font-mono">
                    {jobProgress.progress}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[#101D2E] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#268BFF] transition-all duration-300"
                    style={{ width: `${Math.max(5, jobProgress.progress)}%` }}
                  />
                </div>

                {jobProgress.total_frames > 0 && (
                  <div className="flex justify-between text-[11px] font-mono text-[#64758A]">
                    <span>Frame {jobProgress.current_frame} of {jobProgress.total_frames}</span>
                    <span>{jobProgress.elapsed_seconds || 0}s elapsed</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 space-y-2 text-xs text-[#F06464]">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Processing Notice</span>
                </div>
                <p className="text-[#F5F8FC]/90">{error}</p>
                <button
                  type="button"
                  onClick={handleStartEnhancement}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-[#F06464]/20 hover:bg-[#F06464]/30 border border-[#F06464]/40 text-white font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            <div className="flex items-center justify-between text-xs text-[#98A9BD]">
              <span className="font-semibold text-[#80BCFF]">SYNCHRONIZED VIDEO COMPARISON</span>
              <span className="font-mono">{result.input_resolution} → {result.output_resolution} ({result.scale_factor})</span>
            </div>

            <SynchronizedVideoPlayer
              originalUrl={originalVideoUrl}
              enhancedUrl={result.output_url}
              originalLabel="Original Video"
              enhancedLabel={`Enhanced ${result.scale_factor}`}
              fps={result.fps}
            />
          </div>

          {/* Action & Download Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold text-[#F5F8FC]">Video Enhancement Complete</h3>
              <p className="text-xs text-[#98A9BD] mt-0.5">
                Upscaled to {result.output_resolution} resolution with audio remuxed.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={result.download_url}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(38,139,255,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Download Enhanced Video</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] transition-colors"
                title="Process another video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Diagnostics */}
          <div className="rounded-xl border border-[#1A2B40] bg-[#080D16] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full px-4 py-3 text-left text-xs font-mono text-[#64758A] hover:text-[#98A9BD] flex items-center justify-between transition-colors"
            >
              <span>Technical Diagnostics & Metadata</span>
              {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDiagnostics && (
              <div className="p-4 border-t border-[#1A2B40] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#98A9BD]">
                <div>
                  <div className="text-[#64758A] text-[10px]">TOTAL TIME</div>
                  <div className="text-[#F5F8FC] font-bold">{result.metrics?.elapsed_seconds}s</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">THROUGHPUT</div>
                  <div className="text-[#F5F8FC] font-bold">{result.metrics?.processing_throughput_fps} FPS</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">FRAMES PROCESSED</div>
                  <div className="text-[#F5F8FC] font-bold">{result.metrics?.frame_count}</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">FILE SIZE</div>
                  <div className="text-[#F5F8FC] font-bold">{result.metrics?.output_size_mb} MB</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
