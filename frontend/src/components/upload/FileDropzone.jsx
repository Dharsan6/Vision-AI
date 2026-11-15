import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FileDropzone({
  file,
  onFileSelect,
  accept = 'image/*',
  acceptType = 'image', // 'image' or 'video'
  maxSizeMB = 50,
  sampleUrl = null,
  sampleLabel = 'Load Benchmark Sample',
  className = '',
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = (selectedFile) => {
    if (!selectedFile) return;

    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum allowed ${maxSizeMB}MB.`);
      return;
    }

    setError(null);
    onFileSelect(selectedFile);

    // Create local object URL for preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleLoadSample = async (e) => {
    e.stopPropagation();
    if (!sampleUrl) return;
    try {
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const fileName = sampleUrl.split('/').pop();
      const sampleFile = new File([blob], fileName, { type: blob.type });
      handleFiles(sampleFile);
    } catch (err) {
      setError('Failed to fetch benchmark sample file.');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-full rounded-2xl border-2 border-dashed p-6 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragOver
            ? 'border-[#268BFF] bg-[#101D2E]/80 shadow-[0_0_20px_rgba(38,139,255,0.2)]'
            : file
            ? 'border-[#25C98A]/50 bg-[#0C1421]'
            : 'border-[#1A2B40] bg-[#080D16] hover:border-[#268BFF]/60 hover:bg-[#0C1421]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFiles(e.target.files?.[0])}
          className="hidden"
        />

        {file ? (
          <div className="w-full flex flex-col items-center">
            {/* Media Preview */}
            <div className="relative max-h-56 w-full max-w-md rounded-xl overflow-hidden border border-[#1A2B40] bg-[#05070B] mb-4">
              {acceptType === 'video' ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-auto max-h-56 object-contain mx-auto"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="w-full h-auto max-h-56 object-contain mx-auto"
                />
              )}
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-[#05070B]/80 text-[#98A9BD] hover:text-[#F06464] border border-[#1A2B40] transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-[#F5F8FC]">
              <CheckCircle2 className="w-4 h-4 text-[#25C98A]" />
              <span className="font-semibold">{file.name}</span>
              <span className="text-[#64758A]">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-[#101D2E] border border-[#1A2B40] flex items-center justify-center text-[#268BFF] mb-4 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-[#F5F8FC]">
              Drag and drop your {acceptType} here, or <span className="text-[#268BFF]">browse</span>
            </h4>
            <p className="text-xs text-[#64758A] mt-1 font-mono">
              Supports {acceptType === 'video' ? 'MP4, MOV, AVI, 3GP, MKV, WEBM, FLV, WMV' : 'JPG, PNG, WEBP, BMP'} up to {maxSizeMB}MB
            </p>

            {sampleUrl && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-xs font-mono text-[#80BCFF] flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#268BFF]" />
                <span>{sampleLabel}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-[#F06464] font-mono flex items-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

