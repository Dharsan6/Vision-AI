import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Columns,
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Palette,
} from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ComparisonSlider from '../components/comparison/ComparisonSlider';
import { api } from '../services/api';

export default function SmartRestore() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const [mode, setMode] = useState('quick'); // 'quick' or 'advanced'
  const [enableColorize, setEnableColorize] = useState(true);
  const [scale, setScale] = useState(4);
  const [preferredFormat, setPreferredFormat] = useState('png');

  const [executing, setExecuting] = useState(false);
  const [currentStageText, setCurrentStageText] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [viewMode, setViewMode] = useState('slider');
  const [showFullModal, setShowFullModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setAnalysis(null);
    setResult(null);
    setError(null);
    setAnalysisError(null);

    if (!file) return;

    setAnalyzing(true);
    try {
      const data = await api.analyzeMedia(file);
      setAnalysis(data);
      setEnableColorize(data.recommendation.needs_colorization);
      setScale(data.recommendation.recommended_scale > 0 ? data.recommendation.recommended_scale : 4);
    } catch (err) {
      console.error('Media diagnostic failed:', err);
      setAnalysisError(err.response?.data?.detail || err.message || 'Diagnostic inspection failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const verifyImagePreload = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Restored image could not be loaded from server.'));
      img.src = src;
    });
  };

  const handleExecuteRestore = async () => {
    if (!selectedFile) return;

    setExecuting(true);
    setError(null);
    setResult(null);
    setCurrentStageText('Analyzing image structure and applying restoration...');

    try {
      const res = await api.executeSmartRestore(
        selectedFile,
        mode,
        enableColorize,
        scale,
        preferredFormat
      );

      const activeUrl = res.final_output_url || res.png_url || res.output_url;
      await verifyImagePreload(activeUrl);

      res.active_output_url = activeUrl;
      res.active_download_name = `smart_restored_${selectedFile.name.replace(/\.[^/.]+$/, '')}.${preferredFormat}`;
      res.active_download_url = `/api/media/download/${preferredFormat === 'png' ? res.png_filename : res.jpg_filename}?name=${res.active_download_name}`;

      setResult(res);
    } catch (err) {
      console.error('Smart restore execution failed:', err);
      setError(err.response?.data?.detail || err.message || 'Restoration failed. Please try again.');
    } finally {
      setExecuting(false);
      setCurrentStageText('');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setResult(null);
    setError(null);
    setAnalysisError(null);
    setViewMode('slider');
    setShowFullModal(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">
            Smart Restore Studio
          </h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Automated image diagnosis and guided multi-stage restoration in a single step.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Another Image</span>
          </button>
        )}
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* 1. Upload Card */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            <span className="text-xs font-semibold text-[#80BCFF] uppercase tracking-wider font-mono">
              Source Photograph
            </span>

            <FileDropzone
              file={selectedFile}
              onFileSelect={handleFileSelect}
              accept="image/png,image/jpeg,image/webp,image/bmp"
              acceptType="image"
              maxSizeMB={50}
              sampleUrl="/storage/samples/sample_portrait_gray.jpg"
              sampleLabel="Load Test Sample (Portrait 512×512)"
            />
          </div>

          {/* 2. Analysis & Guided Plan Card */}
          {analyzing && (
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex items-center space-x-3 text-xs text-[#80BCFF]">
              <span className="w-4 h-4 border-2 border-[#268BFF]/30 border-t-[#268BFF] rounded-full animate-spin" />
              <span>Diagnosing photo color, clarity, and resolution...</span>
            </div>
          )}

          {analysisError && (
            <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 text-xs text-[#F06464] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {analysis && (
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#268BFF]/30 space-y-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#25C98A]" />
                  <h3 className="text-sm font-bold text-[#F5F8FC]">Automated Condition Diagnosis</h3>
                </div>
                <span className="text-[11px] font-medium text-[#80BCFF] bg-[#101D2E] px-2.5 py-0.5 rounded-full border border-[#1A2B40]">
                  Analyzed
                </span>
              </div>

              {/* Consumer condition findings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                  <span className="text-[11px] text-[#64758A] block">Color Profile</span>
                  <span className="font-semibold text-[#F5F8FC] block">
                    {analysis.color_profile.is_grayscale ? 'Monochrome (Black & White)' : 'Full Color'}
                  </span>
                  <span className="text-[11px] text-[#80BCFF]">
                    {analysis.color_profile.is_grayscale ? 'Colorization needed' : 'Colors preserved'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                  <span className="text-[11px] text-[#64758A] block">Image Clarity</span>
                  <span className="font-semibold text-[#F5F8FC] block">
                    {analysis.sharpness.grade || 'Standard Print'}
                  </span>
                  <span className="text-[11px] text-[#80BCFF]">Detail reconstruction recommended</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                  <span className="text-[11px] text-[#64758A] block">Dimensions</span>
                  <span className="font-semibold text-[#F5F8FC] block font-mono">
                    {analysis.dimensions.width} × {analysis.dimensions.height} px
                  </span>
                  <span className="text-[11px] text-[#80BCFF]">
                    Target: ~{analysis.dimensions.width * scale} × {analysis.dimensions.height * scale} px
                  </span>
                </div>
              </div>

              {/* Recommended Plan */}
              <div className="p-4 rounded-xl bg-[#101D2E] border border-[#1A2B40] space-y-1">
                <div className="text-xs font-bold text-[#80BCFF]">
                  Recommended Plan: {analysis.recommendation.summary}
                </div>
                <p className="text-xs text-[#98A9BD] leading-relaxed">
                  {analysis.recommendation.explanation}
                </p>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                disabled={executing}
                onClick={handleExecuteRestore}
                className="w-full py-4 rounded-xl bg-[#268BFF] hover:bg-[#1769D2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.3)] transition-all flex items-center justify-center space-x-2"
              >
                {executing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{currentStageText || 'Restoring photograph...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Execute Smart Restore</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 space-y-2 text-xs text-[#F06464]">
                  <div className="flex items-center space-x-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Restoration Notice</span>
                  </div>
                  <p className="text-[#F5F8FC]/90">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-[#101D2E] border border-[#268BFF]/40 text-xs font-semibold text-[#80BCFF]">
                Smart Restored ({result.scale_factor})
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
                <span>Full Restored</span>
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
                  processedLabel={`Restored (${result.output_resolution})`}
                  onViewFull={() => setShowFullModal(true)}
                />
              </div>
            )}

            {viewMode === 'sideBySide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#98A9BD] px-1">ORIGINAL ({result.input_resolution})</div>
                  <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B] p-2 flex items-center justify-center min-h-[300px]">
                    <img
                      src={result.original_image_url}
                      alt="Original photograph"
                      className="max-h-[480px] w-auto max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-[#80BCFF] px-1">RESTORED ({result.output_resolution})</div>
                  <div className="rounded-xl overflow-hidden border border-[#268BFF]/40 bg-[#05070B] p-2 flex items-center justify-center min-h-[300px]">
                    <img
                      src={result.active_output_url}
                      alt="Restored output"
                      className="max-h-[480px] w-auto max-w-full object-contain mx-auto rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'enhanced' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#80BCFF] px-1">
                  <span>RESTORED PHOTOGRAPH</span>
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
                    alt="Restored output"
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
              <h3 className="text-sm font-bold text-[#F5F8FC]">Smart Restoration Complete</h3>
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
                <span>Download Restored Image</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-xs font-medium text-[#98A9BD] hover:text-[#F5F8FC] transition-colors"
                title="Restore another image"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Technical Diagnostics */}
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
                  <div className="text-[#F5F8FC] font-bold">{result.total_elapsed_seconds}s</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">STAGES EXECUTED</div>
                  <div className="text-[#F5F8FC] font-bold">{result.stages_executed?.length || 2} stages</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">DEVICE</div>
                  <div className="text-[#F5F8FC] font-bold truncate">{result.device}</div>
                </div>
                <div>
                  <div className="text-[#64758A] text-[10px]">RESOLUTION BOOST</div>
                  <div className="text-[#F5F8FC] font-bold">{result.output_resolution}</div>
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
              alt="Restored Full Resolution"
              className="max-h-[88vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
