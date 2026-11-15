import React, { useState } from 'react';
import {
  Palette,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Columns,
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ComparisonSlider from '../components/comparison/ComparisonSlider';
import { api } from '../services/api';

export default function ImageColorization() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [preferredFormat, setPreferredFormat] = useState('png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [viewMode, setViewMode] = useState('slider');
  const [showFullModal, setShowFullModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showRefUpload, setShowRefUpload] = useState(false);

  const verifyImagePreload = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Colorized image could not be loaded from server.'));
      img.src = src;
    });
  };

  const handleColorize = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.colorizeImage(selectedFile, referenceFile, preferredFormat);

      const activeUrl = preferredFormat === 'png' ? data.png_url : data.jpg_url;
      await verifyImagePreload(activeUrl);

      data.active_output_url = activeUrl;
      data.active_download_name = `colorized_${selectedFile.name.replace(/\.[^/.]+$/, '')}.${preferredFormat}`;
      data.active_download_url = `/api/media/download/${preferredFormat === 'png' ? data.png_filename : data.jpg_filename}?name=${data.active_download_name}`;

      setResult(data);
    } catch (err) {
      console.error('Colorization error:', err);
      setError(err.response?.data?.detail || err.message || 'Image colorization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setReferenceFile(null);
    setResult(null);
    setError(null);
    setViewMode('slider');
    setShowFullModal(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">
            Image Colorization
          </h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Transform black-and-white photographs into natural, vibrant full-color images.
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
            <span className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Source Photograph
            </span>

            <FileDropzone
              file={selectedFile}
              onFileSelect={setSelectedFile}
              accept="image/png,image/jpeg,image/webp,image/bmp"
              acceptType="image"
              maxSizeMB={50}
              sampleUrl="/storage/samples/sample_portrait_gray.jpg"
              sampleLabel="Load Test Sample (Portrait 512×512)"
            />
          </div>

          {/* 2. Settings Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-5">
            <div className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Output Options
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#F5F8FC]">Preferred Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPreferredFormat('png')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      preferredFormat === 'png'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-xs font-bold">PNG</div>
                    <div className="text-[10px] text-[#64758A]">Lossless</div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPreferredFormat('jpg')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      preferredFormat === 'jpg'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF] shadow-sm'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    <div className="text-xs font-bold">JPG</div>
                    <div className="text-[10px] text-[#64758A]">Optimized</div>
                  </button>
                </div>
              </div>

              {/* Optional Ground Truth Reference Accordion */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#F5F8FC]">
                  Benchmark Reference (Optional)
                </label>
                <div className="rounded-xl border border-[#1A2B40] bg-[#080D16] p-2 text-xs">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-[#98A9BD] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#1A2B40] file:text-[11px] file:bg-[#101D2E] file:text-[#80BCFF] hover:file:bg-[#1A2B40] cursor-pointer"
                  />
                  {referenceFile && (
                    <div className="text-[11px] text-[#25C98A] mt-1 truncate">
                      Attached: {referenceFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleColorize}
                className="w-full py-4 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.3)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Colorizing Image...</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4" />
                    <span>Colorize Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 space-y-2 text-xs text-[#F06464]">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Colorization Notice</span>
                </div>
                <p className="text-[#F5F8FC]/90">{error}</p>
                <button
                  type="button"
                  onClick={handleColorize}
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
          {/* Controls Header */}
          <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-[#101D2E] border border-[#268BFF]/40 text-xs font-semibold text-[#80BCFF]">
                Color Restored
              </span>
              <span className="text-xs font-mono text-[#98A9BD]">
                {result.output_resolution} px
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
                <span>Full Color</span>
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
                  originalLabel="Original Monochrome"
                  processedLabel="AI Colorized"
                  onViewFull={() => setShowFullModal(true)}
                />
              </div>
            )}

            {viewMode === 'sideBySide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#98A9BD] px-1">ORIGINAL MONOCHROME</div>
                  <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B] p-2 flex items-center justify-center min-h-[300px]">
                    <img
                      src={result.original_image_url}
                      alt="Original monochrome"
                      className="max-h-[480px] w-auto max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#80BCFF] px-1">COLORIZED OUTPUT</div>
                  <div className="rounded-xl overflow-hidden border border-[#268BFF]/40 bg-[#05070B] p-2 flex items-center justify-center min-h-[300px]">
                    <img
                      src={result.active_output_url}
                      alt="Colorized output"
                      className="max-h-[480px] w-auto max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'enhanced' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#80BCFF] px-1">
                  <span>COLORIZED PHOTOGRAPH</span>
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
                    alt="Colorized output"
                    className="max-h-[600px] w-auto max-w-full object-contain mx-auto rounded-lg cursor-zoom-in"
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
              <h3 className="text-sm font-bold text-[#F5F8FC]">Colorization Succeeded</h3>
              <p className="text-xs text-[#98A9BD] mt-0.5">
                Saved at original {result.output_resolution} resolution in {preferredFormat.toUpperCase()} format.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={result.active_download_url}
                download={result.active_download_name}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(38,139,255,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Download Colorized Image</span>
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
              {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDiagnostics && (
              <div className="p-4 border-t border-[#1A2B40] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#98A9BD]">
                <div>
                  <div className="text-[#64758A] text-[10px]">PROCESSING TIME</div>
                  <div className="text-[#F5F8FC] font-bold">{result.elapsed_seconds}s</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">DEVICE</div>
                  <div className="text-[#F5F8FC] font-bold truncate">{result.device}</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">RESOLUTION</div>
                  <div className="text-[#F5F8FC] font-bold">{result.output_resolution}</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">BENCHMARK METRICS</div>
                  <div className="text-[#F5F8FC] font-bold">
                    {result.metrics?.has_reference ? `PSNR: ${result.metrics.psnr}dB` : 'Natural Inference'}
                  </div>
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
              alt="Colorized Full Resolution"
              className="max-h-[88vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
