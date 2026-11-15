import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Download,
  RotateCcw,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  FileText,
  Sliders,
  Zap,
  Activity,
  Eye,
  ArrowRight,
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

  // Mode & configuration
  const [mode, setMode] = useState('quick'); // 'quick' or 'advanced'
  const [enableColorize, setEnableColorize] = useState(true);
  const [scale, setScale] = useState(4);
  const [preferredFormat, setPreferredFormat] = useState('png');

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [currentStageText, setCurrentStageText] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setAnalysis(null);
    setResult(null);
    setError(null);
    setAnalysisError(null);

    if (!file) return;

    // Run diagnostic analysis
    setAnalyzing(true);
    try {
      const data = await api.analyzeMedia(file);
      setAnalysis(data);
      // Auto-configure advanced defaults from recommendation
      setEnableColorize(data.recommendation.needs_colorization);
      setScale(data.recommendation.recommended_scale > 0 ? data.recommendation.recommended_scale : 4);
    } catch (err) {
      console.error('Media diagnostic failed:', err);
      setAnalysisError(err.response?.data?.detail || err.message || 'Diagnostic inspection failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedFile) return;

    setExecuting(true);
    setError(null);
    setResult(null);
    setCurrentStageText('Initializing deep neural networks...');

    try {
      if (mode === 'quick') {
        setCurrentStageText('Running automated multi-stage restoration...');
      } else {
        const stageList = [];
        if (enableColorize) stageList.push('DDColor');
        if (scale > 0) stageList.push(`Real-ESRGAN ${scale}x`);
        setCurrentStageText(`Executing ${stageList.join(' + ')} pipeline...`);
      }

      const res = await api.executeSmartRestore(
        selectedFile,
        mode,
        enableColorize,
        scale,
        preferredFormat
      );
      setResult(res);
    } catch (err) {
      console.error('Smart restore execution failed:', err);
      setError(err.response?.data?.detail || err.message || 'Restoration pipeline execution failed');
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
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#80BCFF] mb-2">
            <Wand2 className="w-3.5 h-3.5 text-[#268BFF]" />
            <span>INTELLIGENT MULTI-STAGE RESTORATION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F8FC] tracking-tight">VISION AI Smart Restore</h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Automatic media diagnosis and multi-stage orchestration combining DDColor and Real-ESRGAN into a single pipeline.
          </p>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-xs font-mono text-[#98A9BD] hover:text-[#F5F8FC] flex items-center space-x-2 transition-colors self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Another Image</span>
          </button>
        )}
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Uploader & Diagnostic Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                1. Select Source Photograph
              </h2>
              <FileDropzone
                file={selectedFile}
                onFileSelect={handleFileSelect}
                accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                acceptType="image"
                maxSizeMB={50}
                sampleUrl="/storage/samples/sample_portrait_gray.jpg"
                sampleLabel="Load Benchmark Vintage Portrait"
              />
            </div>

            {/* Diagnostic Analysis Panel */}
            {analyzing && (
              <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex items-center space-x-3 text-xs font-mono text-[#80BCFF]">
                <span className="w-4 h-4 border-2 border-[#268BFF]/30 border-t-[#268BFF] rounded-full animate-spin" />
                <span>Scanning chromaticity, sharpness, noise residuals, and pixel density...</span>
              </div>
            )}

            {analysisError && (
              <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 text-xs font-mono text-[#F06464] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {analysis && (
              <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#268BFF]/40 space-y-5 shadow-[0_0_20px_rgba(38,139,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#268BFF]" />
                    <h3 className="text-sm font-bold text-[#F5F8FC] tracking-wide">
                      AUTOMATED MEDIA DIAGNOSTIC
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#80BCFF] bg-[#101D2E] px-2.5 py-0.5 rounded-full border border-[#1A2B40]">
                    Confidence Verified
                  </span>
                </div>

                {/* 4 Diagnostic Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <span className="text-[10px] font-mono text-[#64758A] block">PALETTE TYPE</span>
                    <span className={`text-xs font-bold font-mono ${analysis.color_profile.is_grayscale ? 'text-[#80BCFF]' : 'text-[#25C98A]'}`}>
                      {analysis.color_profile.palette_type}
                    </span>
                    <span className="text-[10px] font-mono text-[#64758A] block">
                      Sat: {analysis.color_profile.mean_saturation}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <span className="text-[10px] font-mono text-[#64758A] block">SHARPNESS</span>
                    <span className="text-xs font-bold font-mono text-[#F5F8FC]">
                      {analysis.sharpness.grade}
                    </span>
                    <span className="text-[10px] font-mono text-[#64758A] block">
                      Var: {analysis.sharpness.laplacian_variance}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <span className="text-[10px] font-mono text-[#64758A] block">RESOLUTION</span>
                    <span className="text-xs font-bold font-mono text-[#F5F8FC]">
                      {analysis.dimensions.width}×{analysis.dimensions.height}
                    </span>
                    <span className="text-[10px] font-mono text-[#64758A] block truncate">
                      {analysis.resolution_category}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080D16] border border-[#1A2B40] space-y-1">
                    <span className="text-[10px] font-mono text-[#64758A] block">NOISE & CONTRAST</span>
                    <span className="text-xs font-bold font-mono text-[#F5F8FC]">
                      {analysis.contrast.grade}
                    </span>
                    <span className="text-[10px] font-mono text-[#64758A] block truncate">
                      {analysis.noise.grade}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Banner */}
                <div className="p-4 rounded-xl bg-[#101D2E] border border-[#1A2B40] space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#80BCFF]">
                    <ShieldCheck className="w-4 h-4 text-[#25C98A]" />
                    <span>RECOMMENDED WORKFLOW: {analysis.recommendation.summary}</span>
                  </div>
                  <p className="text-xs text-[#98A9BD] leading-relaxed">
                    {analysis.recommendation.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Execution Configuration */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-5">
              <h2 className="text-sm font-semibold text-[#F5F8FC] uppercase tracking-wider font-mono">
                2. Restoration Strategy
              </h2>

              {/* Mode Tabs: Quick vs Advanced */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#080D16] border border-[#1A2B40]">
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                    mode === 'quick'
                      ? 'bg-[#101D2E] text-[#268BFF] border border-[#1A2B40] shadow-sm'
                      : 'text-[#98A9BD] hover:text-[#F5F8FC]'
                  }`}
                >
                  Quick Restore
                </button>
                <button
                  type="button"
                  onClick={() => setMode('advanced')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                    mode === 'advanced'
                      ? 'bg-[#101D2E] text-[#268BFF] border border-[#1A2B40] shadow-sm'
                      : 'text-[#98A9BD] hover:text-[#F5F8FC]'
                  }`}
                >
                  Advanced Controls
                </button>
              </div>

              {/* Mode 1: Quick Restore Rationale */}
              {mode === 'quick' ? (
                <div className="space-y-3">
                  <div className="text-xs text-[#98A9BD] leading-relaxed">
                    Automated one-click restoration based on diagnostic findings:
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[#080D16] border border-[#1A2B40] flex items-center justify-between">
                      <span className="text-[#F5F8FC]">Stage 1: DDColor Colorization</span>
                      <span className={analysis?.recommendation.needs_colorization ? 'text-[#25C98A]' : 'text-[#64758A]'}>
                        {analysis?.recommendation.needs_colorization ? 'Auto-Enabled' : 'Skipped'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#080D16] border border-[#1A2B40] flex items-center justify-between">
                      <span className="text-[#F5F8FC]">Stage 2: Real-ESRGAN Upscaling</span>
                      <span className="text-[#25C98A]">
                        {analysis?.recommendation.recommended_scale ? `${analysis.recommendation.recommended_scale}x Mode` : '4x Mode'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Advanced Controls */
                <div className="space-y-4">
                  {/* Colorization Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#080D16] border border-[#1A2B40]">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4 text-[#268BFF]" />
                      <span className="text-xs font-mono text-[#F5F8FC]">DDColor Colorization</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableColorize(!enableColorize)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        enableColorize ? 'bg-[#1769D2]' : 'bg-[#1A2B40]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          enableColorize ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Super-Resolution Selector */}
                  <div>
                    <label className="block text-xs font-mono text-[#98A9BD] mb-1.5">
                      SUPER-RESOLUTION UPSCALE
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 2, 4].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setScale(s)}
                          className={`py-2 px-2 rounded-xl border text-xs font-mono transition-all text-center ${
                            scale === s
                              ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                              : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                          }`}
                        >
                          {s === 0 ? 'None (1x)' : `${s}x Scale`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div>
                    <label className="block text-xs font-mono text-[#98A9BD] mb-1.5">
                      OUTPUT FORMAT
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['png', 'jpg'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setPreferredFormat(fmt)}
                          className={`py-2 px-2 rounded-xl border text-xs font-mono transition-all text-center uppercase ${
                            preferredFormat === fmt
                              ? 'border-[#268BFF] bg-[#101D2E] text-[#80BCFF]'
                              : 'border-[#1A2B40] bg-[#080D16] text-[#98A9BD] hover:bg-[#101D2E]'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Button */}
              <button
                type="button"
                disabled={!selectedFile || analyzing || executing}
                onClick={handleExecuteRestore}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1769D2] to-[#268BFF] hover:from-[#268BFF] hover:to-[#80BCFF] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(38,139,255,0.4)] transition-all flex items-center justify-center space-x-2"
              >
                {executing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{currentStageText || 'Executing Restoration...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Execute Smart Restore</span>
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
        /* Results Section */
        <div className="space-y-6">
          {/* Comparison Slider */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#80BCFF] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>INTERACTIVE COMPARISON (ORIGINAL VS SMART RESTORED)</span>
              </span>
              <span className="text-[#98A9BD]">
                {result.input_resolution} → {result.output_resolution}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B]">
              <ComparisonSlider
                originalUrl={result.original_image_url}
                processedUrl={result.final_output_url}
                originalLabel={`Original (${result.input_resolution})`}
                processedLabel={`Smart Restored (${result.output_resolution})`}
              />
            </div>
          </div>

          {/* Multi-Stage Audit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>TOTAL ELAPSED TIME</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.total_elapsed_seconds}s
              </div>
              <div className="text-[11px] font-mono text-[#64758A] mt-1 truncate">
                {result.device}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Layers className="w-3.5 h-3.5 text-[#25C98A]" />
                <span>PIPELINE STAGES EXECUTED</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.stages_executed.length} Stages
              </div>
              <div className="text-[11px] font-mono text-[#25C98A] mt-1">
                {result.stages_executed.map((s) => s.stage).join(' → ')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-[#64758A] mb-1">
                <Maximize2 className="w-3.5 h-3.5 text-[#80BCFF]" />
                <span>RESOLUTION BOOST</span>
              </div>
              <div className="text-lg font-bold text-[#F5F8FC] font-mono">
                {result.input_resolution} → {result.output_resolution}
              </div>
              <div className="text-[11px] font-mono text-[#80BCFF] mt-1">
                Mode: {result.mode.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Action & Download Bar */}
          <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[#F5F8FC]">Download Smart Restored Output</div>
              <div className="text-xs text-[#98A9BD] font-mono mt-0.5">
                High-definition restored image with verified audit summary
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <a
                href={result.final_output_url}
                download={result.png_filename}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </a>

              <a
                href={result.summary_url}
                target="_blank"
                rel="noreferrer"
                download
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-[#80BCFF] text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Report (.txt)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

