import React, { useState } from 'react';
import {
  Palette,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileImage,
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

  const handleColorize = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.colorizeImage(selectedFile, referenceFile, preferredFormat);
      setResult(data);
    } catch (err) {
      console.error('Colorization error:', err);
      setError(err.response?.data?.detail || err.message || 'Image colorization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setReferenceFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#80BCFF] mb-2">
            <Palette className="w-3.5 h-3.5 text-[#268BFF]" />
            <span>DEEP LEARNING COLOR RESTORATION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F8FC] tracking-tight">Image Colorization Studio</h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Restores photo-realistic colors in grayscale images via DDColor with dual color query transformer decoders.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Canvas</span>
          </button>
        )}
      </div>

      {/* Main Workflow: Upload & Controls */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                1. Select Grayscale Source Image
              </h2>
              <FileDropzone
                file={selectedFile}
                onFileSelect={setSelectedFile}
                accept="image/png,image/jpeg,image/webp,image/bmp"
                acceptType="image"
                maxSizeMB={25}
                sampleUrl="/storage/samples/sample_portrait_gray.jpg"
                sampleLabel="Load Grayscale Benchmark Sample"
              />
            </div>

            {/* Optional Reference Image for PSNR / SSIM */}
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
                  Optional Ground-Truth Reference Image (for PSNR & SSIM)
                </h2>
                <span className="text-[11px] font-mono text-[#64758A]">Optional Benchmark</span>
              </div>
              <p className="text-xs text-[#98A9BD]">
                If you have the original color ground truth, upload it here to calculate honest PSNR and SSIM metrics.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                aria-label="Upload ground truth reference image"
                className="block w-full text-xs text-[#98A9BD] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-[#1A2B40] file:text-xs file:font-mono file:bg-[#101D2E] file:text-[#80BCFF] hover:file:bg-[#1A2B40] cursor-pointer"
              />
              {referenceFile && (
                <div className="text-xs font-mono text-[#25C98A]">
                  Attached Reference: {referenceFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Configuration & Action Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-6">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                2. Inference Settings
              </h2>

              {/* Format selection */}
              <div>
                <label className="block text-xs font-mono text-[#98A9BD] mb-2">OUTPUT FORMAT</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredFormat('png')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-colors ${
                      preferredFormat === 'png'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredFormat('jpg')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-colors ${
                      preferredFormat === 'jpg'
                        ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                        : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                    }`}
                  >
                    JPG (Compact)
                  </button>
                </div>
              </div>

              {/* Model Info */}
              <div className="p-4 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-2 text-xs font-mono">
                <div className="text-[#80BCFF] font-semibold">DDColor Tiny</div>
                <div className="text-[#64758A]">Architecture: ConvNeXt-T</div>
                <div className="text-[#64758A]">Color Space: CIE Lab (ab channels)</div>
                <div className="text-[#64758A]">Resolution: Exact Dimension Preserved</div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={!selectedFile || loading}
                onClick={handleColorize}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] hover:from-[#268BFF] hover:to-[#80BCFF] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Inference in progress...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Colorize Image</span>
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
        /* Result View with Interactive Comparison Slider */
        <div className="space-y-6">
          {/* Before / After Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#98A9BD]">
              <span className="text-[#80BCFF]">INTERACTIVE COMPARISON SLIDER</span>
              <span>Drag handle horizontally to compare</span>
            </div>
            <ComparisonSlider
              originalSrc={result.original_image_url}
              processedSrc={preferredFormat === 'png' ? result.png_url : result.jpg_url}
              originalLabel="INPUT (GRAYSCALE)"
              processedLabel="DDCOLOR (RESTORED)"
            />
          </div>

          {/* Telemetry and Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>INFERENCE TIME</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">{result.elapsed_seconds}s</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#25C98A]" />
                <span>DEVICE</span>
              </div>
              <div className="text-sm font-semibold text-[#F5F8FC] truncate">{result.device}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <FileImage className="w-3.5 h-3.5 text-[#80BCFF]" />
                <span>RESOLUTION</span>
              </div>
              <div className="text-sm font-semibold text-[#F5F8FC] font-mono">{result.output_resolution}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Zap className="w-3.5 h-3.5 text-[#F0B44C]" />
                <span>METRICS</span>
              </div>
              <div className="text-xs font-mono text-[#98A9BD]">
                {result.metrics?.has_reference ? (
                  <>PSNR: {result.metrics.psnr}dB | SSIM: {result.metrics.ssim}</>
                ) : (
                  <span>N/A (No Ground-Truth)</span>
                )}
              </div>
            </div>
          </div>

          {/* Download Controls */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[#F5F8FC]">Download Colorized Asset</div>
              <div className="text-xs text-[#98A9BD] font-mono mt-0.5">
                Exact resolution preserved: {result.output_resolution}
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={`/api/media/download/${result.png_filename}`}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
              <a
                href={`/api/media/download/${result.jpg_filename}`}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-[#F5F8FC] text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JPG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

