import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  FileImage,
  ZoomIn,
  XCircle,
  AlertTriangle,
  Gauge,
  Activity,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ComparisonSlider from '../components/comparison/ComparisonSlider';
import { api } from '../services/api';

export default function ImageSuperResolution() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [scale, setScale] = useState(4); // 2 or 4
  const [preferredFormat, setPreferredFormat] = useState('png');
  const [maxDimension, setMaxDimension] = useState(0); // 0 = unconstrained / original
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Background Job tracking state
  const [jobState, setJobState] = useState({
    jobId: null,
    status: 'idle', // idle, queued, processing, completed, failed, cancelled
    progress: 0,
    currentStep: '',
    currentFrame: 0,
    totalFrames: 0,
    elapsedSeconds: 0,
    device: 'Apple Silicon (MPS)',
    inputResolution: '',
    fileSizeMB: 0,
  });

  const timerRef = useRef(null);

  // When a file is selected, inspect dimensions locally
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    setImageMeta(null);

    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const mp = (w * h) / 1000000;
        const tilesX = Math.ceil(w / 512);
        const tilesY = Math.ceil(h / 512);
        setImageMeta({
          width: w,
          height: h,
          aspectRatio: (w / h).toFixed(2),
          megapixels: mp.toFixed(2),
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          estTiles: tilesX * tilesY,
          isLarge: w > 2000 || h > 2000 || mp > 4.0,
        });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }
  };

  const handleSuperResolve = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();
    setJobState({
      jobId: null,
      status: 'queued',
      progress: 2,
      currentStep: 'Uploading source image to background inference pipeline...',
      currentFrame: 0,
      totalFrames: imageMeta?.estTiles || 1,
      elapsedSeconds: 0,
      device: 'Apple Silicon (MPS Acceleration)',
      inputResolution: imageMeta ? `${imageMeta.width}x${imageMeta.height}` : '',
      fileSizeMB: imageMeta ? imageMeta.sizeMB : (selectedFile.size / (1024 * 1024)).toFixed(2),
    });

    // Start local elapsed timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setJobState((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 500);

    try {
      const res = await api.enhanceImage(
        selectedFile,
        scale,
        preferredFormat,
        maxDimension,
        (job) => {
          // On progress callback from background job poller
          setJobState((prev) => ({
            ...prev,
            jobId: job.job_id || prev.jobId,
            status: job.status,
            progress: job.progress || prev.progress,
            currentStep: job.current_step || prev.currentStep,
            currentFrame: job.current_frame || prev.currentFrame,
            totalFrames: job.total_frames || prev.totalFrames,
            device: job.device || prev.device,
            inputResolution: job.input_resolution || prev.inputResolution,
            fileSizeMB: job.file_size_mb || prev.fileSizeMB,
          }));
        }
      );

      setResult(res);
      setJobState((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        currentStep: 'Enhancement complete.',
      }));
    } catch (err) {
      console.error('Image super-resolution error:', err);
      const isCancelled = err.message?.includes('cancelled');
      if (isCancelled) {
        setJobState((prev) => ({
          ...prev,
          status: 'cancelled',
          currentStep: 'Job was cancelled by user.',
        }));
      } else {
        setError(err.response?.data?.detail || err.message || 'Image super-resolution failed');
        setJobState((prev) => ({
          ...prev,
          status: 'failed',
          currentStep: err.response?.data?.detail || err.message || 'Job failed',
        }));
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!jobState.jobId) {
      setLoading(false);
      return;
    }
    try {
      await api.cancelJob(jobState.jobId);
    } catch (e) {
      console.warn('Failed to send cancel signal:', e);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedFile(null);
    setImageMeta(null);
    setResult(null);
    setError(null);
    setJobState({
      jobId: null,
      status: 'idle',
      progress: 0,
      currentStep: '',
      currentFrame: 0,
      totalFrames: 0,
      elapsedSeconds: 0,
      device: 'Apple Silicon (MPS)',
      inputResolution: '',
      fileSizeMB: 0,
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#80BCFF] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#268BFF]" />
            <span>REAL-ESRGAN RRDBNET ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F8FC] tracking-tight">Image Super-Resolution Studio</h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Reconstruct sub-pixel high-frequency textures and upscale images by 2x or 4x with asynchronous streaming inference.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Process Another Image</span>
          </button>
        )}
      </div>

      {/* Main Workflow: Upload & Controls */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                  1. Select Source Image
                </h2>
                {imageMeta && (
                  <span className="text-xs font-mono text-[#80BCFF] bg-[#101D2E] px-2.5 py-0.5 rounded-full border border-[#1A2B40]">
                    {imageMeta.width} × {imageMeta.height} ({imageMeta.megapixels} MP)
                  </span>
                )}
              </div>

              <FileDropzone
                file={selectedFile}
                onFileSelect={handleFileSelect}
                accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                acceptType="image"
                maxSizeMB={50}
                sampleUrl="/storage/samples/sample_portrait_gray.jpg"
                sampleLabel="Load Benchmark Sample Image"
              />

              {/* Large Image Adaptive Notification */}
              {imageMeta?.isLarge && (
                <div className="p-4 rounded-xl bg-[#101D2E]/80 border border-[#268BFF]/30 space-y-2 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-[#80BCFF] font-semibold">
                    <AlertTriangle className="w-4 h-4 text-[#268BFF] shrink-0" />
                    <span>High-Resolution Source Detected ({imageMeta.width} × {imageMeta.height}, {imageMeta.megapixels} MP)</span>
                  </div>
                  <p className="text-[#98A9BD]">
                    At {scale}x scaling, the output will reach ~{imageMeta.width * scale} × {imageMeta.height * scale} (
                    {(imageMeta.megapixels * scale * scale).toFixed(1)} MP) across ~{imageMeta.estTiles} feature tiles. Processing runs
                    asynchronously with live progress tracking and zero OOM memory guarantees.
                  </p>
                </div>
              )}
            </div>

            {/* Active Live Progress Card (Shown while processing) */}
            {loading && (
              <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#268BFF]/40 shadow-[0_0_30px_rgba(38,139,255,0.15)] space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#1A2B40] pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#268BFF] animate-ping" />
                    <span className="text-sm font-bold font-mono text-[#F5F8FC]">
                      BACKGROUND INFERENCE RUNNING
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-[#80BCFF] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{jobState.elapsedSeconds}s elapsed</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelJob}
                      className="px-2.5 py-1 rounded-lg bg-[#F06464]/10 hover:bg-[#F06464]/20 border border-[#F06464]/30 text-[#F06464] text-xs font-mono transition-colors flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#80BCFF] font-medium">{jobState.currentStep || 'Processing neural tiles...'}</span>
                    <span className="text-[#F5F8FC] font-bold">{Math.round(jobState.progress)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#080D16] border border-[#1A2B40] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1769D2] via-[#268BFF] to-[#80BCFF] transition-all duration-300 shadow-[0_0_12px_rgba(38,139,255,0.6)]"
                      style={{ width: `${Math.max(5, jobState.progress)}%` }}
                    />
                  </div>
                </div>

                {/* Stage checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <div className="text-[#64758A] text-[10px]">STAGE 1</div>
                    <div className="text-[#80BCFF] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#25C98A]" />
                      <span>Upload & Check</span>
                    </div>
                    <div className="text-[11px] text-[#98A9BD]">{jobState.fileSizeMB} MB ({jobState.inputResolution})</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <div className="text-[#64758A] text-[10px]">STAGE 2</div>
                    <div className="text-[#80BCFF] font-semibold flex items-center space-x-1">
                      {jobState.progress >= 5 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25C98A]" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-[#268BFF] animate-spin" />
                      )}
                      <span>Model Prep</span>
                    </div>
                    <div className="text-[11px] text-[#98A9BD]">RRDBNet 23-Block</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <div className="text-[#64758A] text-[10px]">STAGE 3</div>
                    <div className="text-[#80BCFF] font-semibold flex items-center space-x-1">
                      {jobState.progress >= 92 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25C98A]" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-[#268BFF] animate-spin" />
                      )}
                      <span>Tiled Inference</span>
                    </div>
                    <div className="text-[11px] text-[#98A9BD]">
                      Tile {jobState.currentFrame} / {jobState.totalFrames || 1}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <div className="text-[#64758A] text-[10px]">STAGE 4</div>
                    <div className="text-[#80BCFF] font-semibold flex items-center space-x-1">
                      {jobState.progress >= 98 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25C98A]" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-[#268BFF] animate-spin" />
                      )}
                      <span>Encoding</span>
                    </div>
                    <div className="text-[11px] text-[#98A9BD]">PNG & JPG outputs</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#64758A] pt-2 border-t border-[#1A2B40]">
                  <span className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#268BFF]" />
                    <span>{jobState.device}</span>
                  </span>
                  <span>512px Streaming Tiles (Zero Memory OOM)</span>
                </div>
              </div>
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

              {/* Optional Processing Resolution Limit */}
              {imageMeta?.isLarge && (
                <div>
                  <label className="block text-xs font-mono text-[#98A9BD] mb-2">PROCESSING RESOLUTION</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setMaxDimension(0)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        maxDimension === 0
                          ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                          : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                      }`}
                    >
                      <div className="font-bold">Original Resolution</div>
                      <div className="text-[10px] text-[#64758A]">Full quality (unlimited)</div>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setMaxDimension(2048)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        maxDimension === 2048
                          ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                          : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                      }`}
                    >
                      <div className="font-bold">Cap at 2048px</div>
                      <div className="text-[10px] text-[#64758A]">Faster processing</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Preferred Format */}
              <div>
                <label className="block text-xs font-mono text-[#98A9BD] mb-2">OUTPUT FORMAT</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPreferredFormat('png')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all text-center ${
                      preferredFormat === 'png'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPreferredFormat('jpg')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all text-center ${
                      preferredFormat === 'jpg'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    JPG (Optimized)
                  </button>
                </div>
              </div>

              {/* AI Architecture Info */}
              <div className="p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1.5 text-xs font-mono text-[#64758A]">
                <div className="text-[#80BCFF] font-medium">Model Specifications:</div>
                <div>• Architecture: RRDBNet (23 blocks)</div>
                <div>• Feature tiles: 512px with 10px overlap</div>
                <div>• Background job polling with cancellation</div>
                <div>• Apple Silicon MPS Acceleration</div>
              </div>

              {/* Run Button */}
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleSuperResolve}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] hover:from-[#268BFF] hover:to-[#80BCFF] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Inference in Progress ({jobState.progress}%)...</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4" />
                    <span>Upscale Image ({scale}x)</span>
                  </>
                )}
              </button>

              {/* Error Banner with Retry */}
              {error && (
                <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 space-y-2 text-xs font-mono text-[#F06464]">
                  <div className="flex items-center space-x-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Inference Error</span>
                  </div>
                  <p className="text-xs text-[#F06464]/90">{error}</p>
                  <button
                    type="button"
                    onClick={handleSuperResolve}
                    className="mt-1 px-3 py-1 rounded-lg bg-[#F06464]/20 hover:bg-[#F06464]/30 border border-[#F06464]/40 text-white font-semibold transition-colors"
                  >
                    Retry Enhancement
                  </button>
                </div>
              )}

              {/* Cancelled Banner */}
              {jobState.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-[#F0B44C]/10 border border-[#F0B44C]/30 space-y-2 text-xs font-mono text-[#F0B44C]">
                  <div className="flex items-center space-x-2 font-semibold">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Job Cancelled</span>
                  </div>
                  <p className="text-xs text-[#F0B44C]/90">The super-resolution process was stopped by user request.</p>
                  <button
                    type="button"
                    onClick={handleSuperResolve}
                    className="mt-1 px-3 py-1 rounded-lg bg-[#F0B44C]/20 hover:bg-[#F0B44C]/30 border border-[#F0B44C]/40 text-white font-semibold transition-colors"
                  >
                    Restart Job
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Result View with Interactive Comparison Slider */
        <div className="space-y-6">
          {/* Comparison Slider */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#80BCFF] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>INTERACTIVE BEFORE / AFTER COMPARISON</span>
              </span>
              <span className="text-[#98A9BD]">
                {result.input_resolution} → {result.output_resolution} ({result.scale_factor})
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B]">
              <ComparisonSlider
                originalUrl={result.original_image_url}
                processedUrl={result.png_url}
                originalLabel={`Original (${result.input_resolution})`}
                processedLabel={`Real-ESRGAN ${result.scale_factor} (${result.output_resolution})`}
              />
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>INFERENCE TIME</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.elapsed_seconds}s
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Maximize2 className="w-3.5 h-3.5 text-[#25C98A]" />
                <span>SCALING MULTIPLIER</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.scale_factor} ({result.metrics?.pixel_count_increase} pixels)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Layers className="w-3.5 h-3.5 text-[#80BCFF]" />
                <span>RESOLUTION BOOST</span>
              </div>
              <div className="text-sm font-bold text-[#F5F8FC] font-mono">
                {result.input_resolution} → {result.output_resolution}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#F0B44C]" />
                <span>COMPUTE ENGINE</span>
              </div>
              <div className="text-sm font-bold text-[#F5F8FC] font-mono truncate">
                {result.device}
              </div>
            </div>
          </div>

          {/* Model Method & Download Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[#F5F8FC]">Download Super-Resolved Output</div>
              <div className="text-xs text-[#98A9BD] font-mono mt-0.5">
                {result.metrics?.upscaling_method}
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={result.png_url}
                download={result.png_filename}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG (Lossless)</span>
              </a>
              <a
                href={result.jpg_url}
                download={result.jpg_filename}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-[#80BCFF] text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download JPG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
