import React, { useState } from 'react';
import {
  Video,
  Download,
  RotateCcw,
  Sparkles,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Play,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ProgressBar from '../components/progress/ProgressBar';
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

  const handleStartColorization = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setJobProgress({
      progress: 5.0,
      current_frame: 0,
      total_frames: 0,
      current_step: 'Uploading video and initiating background pipeline...',
    });

    try {
      const response = await api.colorizeVideo(selectedFile, resolution, stabilization, maxFrames);
      const jobId = response.job_id;
      setOriginalVideoUrl(response.original_video_url);

      // Poll until complete
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
      console.error('Video colorization error:', err);
      setError(err.message || 'Video colorization pipeline failed');
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
            <Video className="w-3.5 h-3.5 text-[#268BFF]" />
            <span>SEQUENTIAL FRAME DEEP INFERENCE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F8FC] tracking-tight">Video Colorization Studio</h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Colorize grayscale videos sequentially with scene-cut detection, temporal chrominance stabilization, and audio preservation.
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

      {/* Upload and Controls view */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Uploader */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                1. Select Grayscale Source Video
              </h2>
              <FileDropzone
                file={selectedFile}
                onFileSelect={setSelectedFile}
                accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.3gp,.3g2,.m4v,.mpg,.mpeg,.ts,.mts"
                acceptType="video"
                maxSizeMB={300}
                sampleUrl="/storage/samples/sample_motion_gray.mp4"
                sampleLabel="Load Grayscale Benchmark Video Clip"
              />
            </div>

            {/* Active Progress Bar (when running) */}
            {loading && jobProgress && (
              <ProgressBar
                progress={jobProgress.progress}
                currentFrame={jobProgress.current_frame}
                totalFrames={jobProgress.total_frames}
                currentStep={jobProgress.current_step}
                elapsedSeconds={jobProgress.elapsed_seconds}
                module="DDColor Video Pipeline"
              />
            )}
          </div>

          {/* Settings & Execution Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-5">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                2. Pipeline Parameters
              </h2>

              {/* Processing Resolution */}
              <div>
                <label className="block text-xs font-mono text-[#98A9BD] mb-2">TARGET RESOLUTION</label>
                <div className="grid grid-cols-3 gap-2">
                  {['original', '720p', '480p'].map((res) => (
                    <button
                      key={res}
                      type="button"
                      disabled={loading}
                      onClick={() => setResolution(res)}
                      className={`py-2 px-2 rounded-xl border text-xs font-mono capitalize transition-colors ${
                        resolution === res
                          ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                          : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temporal Stabilization Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40]">
                <div>
                  <div className="text-xs font-semibold text-[#F5F8FC]">Temporal Stabilization</div>
                  <div className="text-[11px] font-mono text-[#64758A]">Scene-cut optical flow smoothing</div>
                </div>
                <input
                  type="checkbox"
                  checked={stabilization}
                  disabled={loading}
                  onChange={(e) => setStabilization(e.target.checked)}
                  aria-label="Enable temporal stabilization"
                  className="w-4 h-4 accent-[#268BFF] rounded cursor-pointer"
                />
              </div>

              {/* Max Frames selector (for benchmark testing) */}
              <div>
                <label className="block text-xs font-mono text-[#98A9BD] mb-1">
                  FRAME LIMIT (FOR QUICK BENCHMARK)
                </label>
                <select
                  value={maxFrames}
                  disabled={loading}
                  onChange={(e) => setMaxFrames(Number(e.target.value))}
                  aria-label="Select frame limit for benchmark"
                  className="w-full py-2.5 px-3 rounded-xl border border-[#1A2B40] bg-[#080D16] text-xs font-mono text-[#F5F8FC] focus:outline-none focus:border-[#268BFF]"
                >
                  <option value={0}>Process Entire Video</option>
                  <option value={12}>First 12 Frames (~0.5s test)</option>
                  <option value={24}>First 24 Frames (~1.0s test)</option>
                  <option value={48}>First 48 Frames (~2.0s test)</option>
                </select>
              </div>

              {/* Pipeline summary */}
              <div className="p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1.5 text-xs font-mono text-[#64758A]">
                <div className="text-[#80BCFF] font-medium">Pipeline:</div>
                <div>• FFmpeg frame demux</div>
                <div>• DDColor Lab inference</div>
                <div>• Chrominance EMA smoothing</div>
                <div>• H.264 MP4 encode + audio remux</div>
              </div>

              {/* Run Button */}
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleStartColorization}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] hover:from-[#268BFF] hover:to-[#80BCFF] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing video frames...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Colorize Video</span>
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
        /* Results View: Synchronized Dual Video Comparison */
        <div className="space-y-6">
          <SynchronizedVideoPlayer
            originalUrl={originalVideoUrl}
            enhancedUrl={result.output_url}
            originalLabel={`Input Video (${result.input_resolution})`}
            enhancedLabel={`Colorized Video (${result.output_resolution})`}
            fps={result.fps}
          />

          {/* Operational Metrics Telemetry Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>ELAPSED TIME</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.metrics?.elapsed_seconds}s
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#25C98A]" />
                <span>FRAME THROUGHPUT</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.metrics?.processing_throughput_fps} FPS
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
                <Sparkles className="w-3.5 h-3.5 text-[#F0B44C]" />
                <span>AVG FRAME TIME</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.metrics?.average_frame_time_sec}s
              </div>
            </div>
          </div>

          {/* Download Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[#F5F8FC]">Download Colorized MP4 Video</div>
              <div className="text-xs text-[#98A9BD] font-mono mt-0.5">
                H.264 encode (yuv420p), FPS: {result.fps}, File size: {result.metrics?.output_size_mb} MB
              </div>
            </div>

            <a
              href={result.download_url}
              className="px-6 py-3 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4 Video</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

