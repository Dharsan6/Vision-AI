import React, { useState } from 'react';
import {
  Video,
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

export default function VideoColorization() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resolution, setResolution] = useState('original');
  const [stabilization, setStabilization] = useState(true);
  const [maxFrames, setMaxFrames] = useState(0); // 0 = entire video
  const [loading, setLoading] = useState(false);
  const [jobProgress, setJobProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleStartColorization = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setJobProgress({
      progress: 5.0,
      current_frame: 0,
      total_frames: 0,
      current_step: 'Preparing video frames for colorization...',
    });

    try {
      const response = await api.colorizeVideo(selectedFile, resolution, stabilization, maxFrames);
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
      console.error('Video colorization error:', err);
      setError(err.message || 'Video colorization failed. Please check the video format and try again.');
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
            Video Colorization
          </h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Restore natural colors across historical and monochrome video footage with temporal stability.
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

      {/* Upload and Controls view */}
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
          </div>

          {/* 2. Settings Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-5">
            <div className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Processing Options
            </div>

            {/* Target Resolution */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#F5F8FC]">Target Resolution</label>
              <div className="grid grid-cols-3 gap-3">
                {['original', '720p', '480p'].map((res) => (
                  <button
                    key={res}
                    type="button"
                    disabled={loading}
                    onClick={() => setResolution(res)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      resolution === res
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-xs font-bold capitalize">{res}</div>
                    <div className="text-[10px] text-[#64758A]">
                      {res === 'original' ? 'Native dimensions' : `${res} output`}
                    </div>
                  </button>
                ))}
              </div>
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
                <div className="p-4 border-t border-[#1A2B40] space-y-4 text-xs">
                  {/* Temporal Stabilization Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#F5F8FC]">Temporal Stabilization</div>
                      <div className="text-[11px] text-[#64758A]">Smooths color flicker across consecutive frames</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={stabilization}
                      disabled={loading}
                      onChange={(e) => setStabilization(e.target.checked)}
                      className="w-4 h-4 accent-[#268BFF] rounded cursor-pointer"
                    />
                  </div>

                  {/* Frame limit for quick preview testing */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1A2B40]">
                    <label className="block text-xs font-medium text-[#F5F8FC]">Preview Frame Limit</label>
                    <select
                      value={maxFrames}
                      disabled={loading}
                      onChange={(e) => setMaxFrames(Number(e.target.value))}
                      className="w-full py-2 px-3 rounded-lg border border-[#1A2B40] bg-[#0C1421] text-xs text-[#F5F8FC] focus:outline-none focus:border-[#268BFF]"
                    >
                      <option value={0}>Process Entire Video</option>
                      <option value={24}>First 24 Frames (~1s preview)</option>
                      <option value={48}>First 48 Frames (~2s preview)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleStartColorization}
                className="w-full py-4 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.3)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing video ({jobProgress?.progress || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Colorize Video</span>
                  </>
                )}
              </button>
            </div>

            {/* Clean Progress Indicator */}
            {loading && jobProgress && (
              <div className="p-4 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#80BCFF] font-medium truncate max-w-xs sm:max-w-md">
                    {jobProgress.current_step || 'Colorizing frames...'}
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
                  onClick={handleStartColorization}
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
              <span className="font-semibold text-[#80BCFF]">SYNCHRONIZED VIDEO PREVIEW</span>
              <span className="font-mono">{result.output_resolution} · {result.fps} FPS</span>
            </div>

            <SynchronizedVideoPlayer
              originalUrl={originalVideoUrl}
              enhancedUrl={result.output_url}
              originalLabel="Original Video"
              enhancedLabel="Colorized Video"
              fps={result.fps}
            />
          </div>

          {/* Download & Reset Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold text-[#F5F8FC]">Video Colorization Complete</h3>
              <p className="text-xs text-[#98A9BD] mt-0.5">
                Processed at {result.output_resolution} resolution with preserved audio.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={result.download_url}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(38,139,255,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 Video</span>
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
