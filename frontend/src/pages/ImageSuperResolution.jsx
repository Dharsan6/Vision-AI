import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  ZoomIn,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Sliders,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Columns,
  Layers,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ComparisonSlider from '../components/comparison/ComparisonSlider';
import { api } from '../services/api';

export default function ImageSuperResolution() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [scale, setScale] = useState(4); // 2 or 4
  const [strength, setStrength] = useState('strong'); // 'balanced' or 'strong'
  const [preferredFormat, setPreferredFormat] = useState('png'); // 'png' or 'jpg'
  const [maxDimension, setMaxDimension] = useState(0);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Results View Mode: 'slider' | 'sideBySide' | 'enhanced'
  const [viewMode, setViewMode] = useState('slider');
  const [showFullModal, setShowFullModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Inspect dimensions when file is selected
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
        setImageMeta({
          width: w,
          height: h,
          aspectRatio: (w / h).toFixed(2),
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          isLarge: w > 2400 || h > 2400,
        });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }
  };

  // Pre-verify that the generated image loads in the browser before displaying
  const verifyImagePreload = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Enhanced image could not be loaded from server.'));
      img.src = src;
    });
  };

  const handleSuperResolve = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(5);
    setCurrentStep('Preparing source image for enhancement...');

    try {
      const res = await api.enhanceImage(
        selectedFile,
        scale,
        strength,
        preferredFormat,
        maxDimension,
        (job) => {
          if (job.job_id) setJobId(job.job_id);
          if (job.progress !== undefined) setProgress(Math.round(job.progress));
          if (job.current_step) setCurrentStep(job.current_step);
        }
      );

      // Verify that output file exists and can be decoded by the browser
      const outputUrl =
        res.enhanced_url ||
        res.output_url ||
        (preferredFormat === 'png' ? res.png_url : res.jpg_url);

      if (!outputUrl) {
        throw new Error('Server completed processing but returned an invalid output URL.');
      }

      setCurrentStep('Verifying generated high-resolution image...');
      setProgress(98);

      await verifyImagePreload(outputUrl);

      // Normalise output properties
      res.active_output_url = outputUrl;
      res.active_download_url =
        res.download_url ||
        `/api/media/download/${preferredFormat === 'png' ? res.png_filename : res.jpg_filename}`;
      res.active_download_name =
        res.download_name ||
        `enhanced_${scale}x_${selectedFile.name.replace(/\.[^/.]+$/, '')}.${preferredFormat}`;

      setResult(res);
      setProgress(100);
      setCurrentStep('Enhancement complete.');
    } catch (err) {
      console.error('Image super-resolution error:', err);
      const isCancelled = err.message?.includes('cancelled');
      if (isCancelled) {
        setError('The enhancement process was cancelled.');
      } else {
        setError(
          err.response?.data?.detail ||
            err.message ||
            'Super-resolution failed. Please check your image and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    try {
      await api.cancelJob(jobId);
    } catch (e) {
      console.warn('Failed to send cancel signal:', e);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImageMeta(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setCurrentStep('');
    setJobId(null);
    setViewMode('slider');
    setShowFullModal(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">
            Image Super-Resolution
          </h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Upscale low-resolution photographs and reconstruct fine texture details with deep learning.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Process Another Image</span>
          </button>
        )}
      </div>

      {/* Main Workflow: Upload & Controls */}
      {!result ? (
        <div className="space-y-6">
          {/* 1. Upload Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
                Source Image
              </span>
              {imageMeta && (
                <span className="text-xs font-mono text-[#98A9BD] bg-[#080D16] px-2.5 py-1 rounded-full border border-[#1A2B40]">
                  {imageMeta.width} × {imageMeta.height} px · {imageMeta.sizeMB} MB
                </span>
              )}
            </div>

            <FileDropzone
              file={selectedFile}
              onFileSelect={handleFileSelect}
              accept="image/jpeg,image/png,image/webp,image/bmp"
              acceptType="image"
              maxSizeMB={50}
              sampleUrl="/storage/samples/sample_portrait_gray.jpg"
              sampleLabel="Load Test Sample (Portrait 512×512)"
            />

            {imageMeta?.isLarge && (
              <p className="text-xs text-[#98A9BD] bg-[#080D16] p-3 rounded-xl border border-[#1A2B40]">
                High-resolution image detected ({imageMeta.width} × {imageMeta.height} px). The image will be processed seamlessly in memory-safe tiles.
              </p>
            )}
          </div>

          {/* 2. Enhancement Settings Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-6">
            <div className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Enhancement Settings
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upscaling Factor */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#F5F8FC]">Upscaling Factor</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setScale(2)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      scale === 2
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-sm font-bold">2× Upscale</div>
                    <div className="text-[11px] text-[#64758A]">200% resolution</div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setScale(4)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      scale === 4
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-sm font-bold">4× Upscale</div>
                    <div className="text-[11px] text-[#64758A]">400% resolution</div>
                  </button>
                </div>
              </div>

              {/* Detail Strength */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#F5F8FC]">Detail Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setStrength('balanced')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      strength === 'balanced'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-sm font-bold">Balanced</div>
                    <div className="text-[11px] text-[#64758A]">Natural clarity</div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setStrength('strong')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      strength === 'strong'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-sm font-bold">Strong</div>
                    <div className="text-[11px] text-[#64758A]">Maximum detail</div>
                  </button>
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#F5F8FC]">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPreferredFormat('png')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      preferredFormat === 'png'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-sm font-bold">PNG</div>
                    <div className="text-[11px] text-[#64758A]">Lossless quality</div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPreferredFormat('jpg')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      preferredFormat === 'jpg'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-sm font-bold">JPG</div>
                    <div className="text-[11px] text-[#64758A]">Optimized size</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleSuperResolve}
                className="w-full py-4 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.3)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enhancing Image ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enhance Image ({scale}×)</span>
                  </>
                )}
              </button>
            </div>

            {/* Clean Progress Indicator */}
            {loading && (
              <div className="p-4 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#80BCFF] font-medium">{currentStep || 'Processing image...'}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-[#F5F8FC] font-bold font-mono">{progress}%</span>
                    <button
                      type="button"
                      onClick={handleCancelJob}
                      className="text-[#98A9BD] hover:text-[#F06464] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-[#101D2E] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#268BFF] transition-all duration-300"
                    style={{ width: `${Math.max(5, progress)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {error && (
              <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 space-y-2 text-xs text-[#F06464]">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Enhancement Notice</span>
                </div>
                <p className="text-[#F5F8FC]/90">{error}</p>
                <button
                  type="button"
                  onClick={handleSuperResolve}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-[#F06464]/20 hover:bg-[#F06464]/30 border border-[#F06464]/40 text-white font-medium transition-colors"
                >
                  Retry Enhancement
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Result Controls Header */}
          <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-wrap items-center justify-between gap-3">
            {/* Resolution & Scale Badge */}
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-[#101D2E] border border-[#268BFF]/40 text-xs font-semibold text-[#80BCFF]">
                {result.scale_factor} Upscaled
              </span>
              <span className="text-xs font-mono text-[#98A9BD]">
                {result.input_resolution} → {result.output_resolution} px
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#080D16] border border-[#1A2B40]">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  viewMode === 'slider'
                    ? 'bg-[#101D2E] text-[#80BCFF] border border-[#268BFF]/30'
                    : 'text-[#98A9BD] hover:text-[#F5F8FC]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Comparison Slider</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('sideBySide')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  viewMode === 'sideBySide'
                    ? 'bg-[#101D2E] text-[#80BCFF] border border-[#268BFF]/30'
                    : 'text-[#98A9BD] hover:text-[#F5F8FC]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('enhanced')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  viewMode === 'enhanced'
                    ? 'bg-[#101D2E] text-[#80BCFF] border border-[#268BFF]/30'
                    : 'text-[#98A9BD] hover:text-[#F5F8FC]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Enhanced Full</span>
              </button>
            </div>
          </div>

          {/* Main Visual Display */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            {viewMode === 'slider' && (
              <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B]">
                <ComparisonSlider
                  originalSrc={result.original_image_url}
                  processedSrc={result.active_output_url}
                  originalLabel={`Original (${result.input_resolution})`}
                  processedLabel={`Enhanced ${result.scale_factor} (${result.output_resolution})`}
                  onViewFull={() => setShowFullModal(true)}
                />
              </div>
            )}

            {viewMode === 'sideBySide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD] px-1">
                    <span>ORIGINAL</span>
                    <span>{result.input_resolution}</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B] p-2 flex items-center justify-center min-h-[320px]">
                    <img
                      src={result.original_image_url}
                      alt="Original photograph"
                      className="max-h-[500px] w-auto max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#80BCFF] px-1">
                    <span>ENHANCED ({result.scale_factor})</span>
                    <span>{result.output_resolution}</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[#268BFF]/40 bg-[#05070B] p-2 flex items-center justify-center min-h-[320px]">
                    <img
                      src={result.active_output_url}
                      alt="Enhanced high resolution"
                      className="max-h-[500px] w-auto max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'enhanced' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#80BCFF] px-1">
                  <span>ENHANCED IMAGE ({result.output_resolution})</span>
                  <button
                    type="button"
                    onClick={() => setShowFullModal(true)}
                    className="text-xs text-[#80BCFF] hover:underline flex items-center space-x-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Fullscreen</span>
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B] p-3 flex items-center justify-center">
                  <img
                    src={result.active_output_url}
                    alt="Enhanced high resolution"
                    className="max-h-[620px] w-auto max-w-full object-contain mx-auto rounded-lg cursor-zoom-in"
                    onClick={() => setShowFullModal(true)}
                    title="Click to view full size"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action & Download Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold text-[#F5F8FC]">Enhancement Complete</h3>
              <p className="text-xs text-[#98A9BD] mt-0.5">
                Saved at {result.output_resolution} in {preferredFormat.toUpperCase()} format.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={result.active_download_url}
                download={result.active_download_name}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(38,139,255,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Download Enhanced Image</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] transition-colors"
                title="Process another image"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Technical Diagnostics (Cleanly hidden for ordinary users) */}
          <div className="rounded-xl border border-[#1A2B40] bg-[#080D16] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full px-4 py-3 text-left text-xs font-mono text-[#64758A] hover:text-[#98A9BD] flex items-center justify-between transition-colors"
            >
              <span>Technical Diagnostics & Metadata</span>
              {showDiagnostics ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showDiagnostics && (
              <div className="p-4 border-t border-[#1A2B40] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#98A9BD]">
                <div>
                  <div className="text-[#64758A] text-[10px]">INFERENCE TIME</div>
                  <div className="text-[#F5F8FC] font-bold">{result.elapsed_seconds}s</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">PIXEL INCREASE</div>
                  <div className="text-[#F5F8FC] font-bold">{result.metrics?.pixel_count_increase || `${scale * scale}x`}</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">COMPUTE ACCELERATOR</div>
                  <div className="text-[#F5F8FC] font-bold truncate">{result.device}</div>
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

      {/* Fullscreen Lightbox Modal */}
      {showFullModal && result && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setShowFullModal(false)}
        >
          <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
            <a
              href={result.active_download_url}
              download={result.active_download_name}
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-1.5 rounded-xl bg-[#268BFF] text-white text-xs font-medium flex items-center space-x-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={() => setShowFullModal(false)}
              className="p-2 rounded-xl bg-[#101D2E] text-[#98A9BD] hover:text-[#F5F8FC] border border-[#1A2B40] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="max-w-[95vw] max-h-[90vh] overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={result.active_output_url}
              alt="Enhanced Full Resolution"
              className="max-h-[88vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div className="absolute bottom-4 text-xs font-mono text-[#98A9BD] bg-[#080D16]/80 px-3 py-1 rounded-full border border-[#1A2B40]">
            Enhanced Resolution: {result.output_resolution} px ({result.scale_factor})
          </div>
        </div>
      )}
    </div>
  );
}
