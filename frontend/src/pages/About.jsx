import React from 'react';
import {
  Info,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  Palette,
  ExternalLink,
  ShieldCheck,
  Code,
} from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#1A2B40] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">About VISION AI</h1>
        <p className="text-sm text-[#98A9BD] mt-1">
          Deep Learning platform designed for authentic image colorization, video restoration, and sub-pixel super-resolution.
        </p>
      </div>

      {/* Problem Statement & Objective */}
      <div className="p-8 rounded-3xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
        <h2 className="text-lg font-bold text-[#F5F8FC] flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-[#268BFF]" />
          <span>Objective & Problem Statement</span>
        </h2>
        <p className="text-sm text-[#98A9BD] leading-relaxed">
          Historical photographs and legacy video archives often suffer from the absence of color and low spatial resolution. Colorization is an inherently under-constrained ill-posed inverse problem, as a single grayscale luminance value can correspond to myriad plausible chromatic shades.
        </p>
        <p className="text-sm text-[#98A9BD] leading-relaxed">
          VISION AI resolves this ambiguity by leveraging semantically-aware deep neural networks that understand contextual scene semantics, object boundaries, and spatial textures to synthesize natural colors in CIE Lab space and restore missing high-frequency details.
        </p>
      </div>

      {/* Deep Learning Models Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DDColor Architecture */}
        <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
          <div className="flex items-center space-x-2 text-[#80BCFF]">
            <Palette className="w-5 h-5 text-[#268BFF]" />
            <h3 className="text-base font-bold text-[#F5F8FC]">DDColor Architecture</h3>
          </div>
          <p className="text-xs text-[#98A9BD] leading-relaxed">
            DDColor introduces a dual-decoder framework with learned color queries. The image encoder (ConvNeXt-Tiny) extracts rich multi-scale hierarchical feature maps. The pixel decoder restores spatial resolution while the transformer color decoder applies coarse and fine color queries to generate accurate chrominance <code className="text-[#80BCFF]">ab</code> channels.
          </p>
          <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono">
            <span className="text-[#64758A]">Paper: ICCV 2023</span>
            <a
              href="https://github.com/piddnad/DDColor"
              target="_blank"
              rel="noreferrer"
              className="text-[#268BFF] hover:underline flex items-center space-x-1"
            >
              <span>Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Real-ESRGAN Architecture */}
        <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
          <div className="flex items-center space-x-2 text-[#80BCFF]">
            <Sparkles className="w-5 h-5 text-[#268BFF]" />
            <h3 className="text-base font-bold text-[#F5F8FC]">Real-ESRGAN Architecture</h3>
          </div>
          <p className="text-xs text-[#98A9BD] leading-relaxed">
            Real-ESRGAN uses a Residual-in-Residual Dense Block Network (RRDBNet) composed of 23 dense residual blocks without batch normalization. It is trained with a high-order degradation modeling process that mimics real-world sensor noise, blur, and compression artifacts, delivering photo-realistic 2x and 4x upscaling.
          </p>
          <div className="pt-3 border-t border-[#1A2B40] flex items-center justify-between text-xs font-mono">
            <span className="text-[#64758A]">Paper: ICCVW 2021</span>
            <a
              href="https://github.com/xinntao/Real-ESRGAN"
              target="_blank"
              rel="noreferrer"
              className="text-[#268BFF] hover:underline flex items-center space-x-1"
            >
              <span>Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Hardware Acceleration Guidance */}
      <div className="p-8 rounded-3xl bg-[#0C1421] border border-[#1A2B40] space-y-4">
        <h2 className="text-lg font-bold text-[#F5F8FC] flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-[#25C98A]" />
          <span>Apple Silicon M3 Hardware Optimization</span>
        </h2>
        <div className="space-y-3 text-xs font-mono text-[#98A9BD] leading-relaxed">
          <p>
            • <strong>Metal Performance Shaders (MPS):</strong> PyTorch tensors are dispatched directly to the Apple Silicon GPU via MPS acceleration, eliminating host-device memory copying bottlenecks.
          </p>
          <p>
            • <strong>Sequential Frame Processing:</strong> Video frames are processed in tight generator streams with periodic garbage collection and cache flushing (<code className="text-[#80BCFF]">torch.mps.empty_cache()</code>) to guarantee memory stability on 16GB unified memory.
          </p>
          <p>
            • <strong>Tiled Super-Resolution:</strong> Large frames are segmented into overlapping 512px tiles to avoid VRAM exhaustion during RRDBNet deep tensor evaluations.
          </p>
        </div>
      </div>

      {/* System Integrity & Open Source Attribution */}
      <div className="p-6 rounded-2xl bg-[#080D16] border border-[#1A2B40] text-xs font-mono text-[#64758A] space-y-2">
        <div className="text-[#F5F8FC] font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#268BFF]" />
          <span>Model Attribution & Licensing</span>
        </div>
        <div>• DDColor model and weights developed by Xiaoyang Kang et al. (Apache 2.0 License).</div>
        <div>• Real-ESRGAN developed by Xintao Wang et al. (BSD 3-Clause License).</div>
        <div>• OpenCV and FFmpeg libraries utilized for computer vision and H.264 stream encoding.</div>
      </div>
    </div>
  );
}

