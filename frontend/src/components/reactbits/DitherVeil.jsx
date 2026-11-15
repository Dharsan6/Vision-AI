import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import { MoveHorizontal, Sparkles } from 'lucide-react';

export default function DitherVeil({
  grayscaleSrc,
  colorizedSrc,
  src, // fallback alias
  pattern = 'floyd',
  palette = 'duotone',
  pixelSize = 2,
  inkColor = '#05070B',
  paperColor = '#EAF3FF',
  revealRadius = 200,
  softness = 0.6,
  linger = 1.0,
  rimColor = '#268BFF',
  rim = 1.0,
  clickBurst = true,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [webGLFailed, setWebGLFailed] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isLoaded, setIsLoaded] = useState(false);

  const colorSrc = colorizedSrc || src || '/storage/samples/sample_portrait_colorized.png';
  const graySrc = grayscaleSrc || colorSrc || '/storage/samples/sample_portrait_gray.jpg';

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer;
    let gl;
    let program;
    let animationFrameId;
    let isCancelled = false;

    try {
      renderer = new Renderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
      gl = renderer.gl;
      if (!gl) {
        throw new Error('WebGL context not available');
      }
    } catch (e) {
      console.warn('[DitherVeil] WebGL unavailable, activating interactive fallback:', e);
      setWebGLFailed(true);
      return;
    }

    const mousePos = {
      x: (container.clientWidth || 600) / 2,
      y: (container.clientHeight || 450) / 2,
    };
    let burstTime = 0.0;

    const resize = () => {
      if (!container || !renderer || isCancelled) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 450;
      renderer.setSize(w, h);
      if (program && program.uniforms && program.uniforms.uResolution) {
        program.uniforms.uResolution.value[0] = w;
        program.uniforms.uResolution.value[1] = h;
      }
    };

    window.addEventListener('resize', resize);

    const onPointerMove = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = rect.height - (e.clientY - rect.top);
    };

    const onClick = () => {
      if (clickBurst) {
        burstTime = 1.0;
      }
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onClick);

    // Textures
    const imgGray = new Image();
    imgGray.crossOrigin = 'anonymous';
    const texGray = new Texture(gl);

    const imgColor = new Image();
    imgColor.crossOrigin = 'anonymous';
    const texColor = new Texture(gl);

    let loadCount = 0;
    const onLoad = () => {
      if (isCancelled) return;
      loadCount++;
      if (loadCount === 2) {
        try {
          texGray.image = imgGray;
          texColor.image = imgColor;
          setIsLoaded(true);
          resize();
        } catch (err) {
          console.warn('[DitherVeil] Texture upload failed, falling back:', err);
          setWebGLFailed(true);
        }
      }
    };

    imgGray.onerror = () => {
      console.warn('[DitherVeil] Grayscale texture failed to load');
      setWebGLFailed(true);
    };
    imgColor.onerror = () => {
      console.warn('[DitherVeil] Color texture failed to load');
      setWebGLFailed(true);
    };

    imgGray.onload = onLoad;
    imgColor.onload = onLoad;
    imgGray.src = graySrc;
    imgColor.src = colorSrc;

    // Shader Definitions
    const vertex = /* glsl */ `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      uniform sampler2D uTexGray;
      uniform sampler2D uTexColor;
      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uRadius;
      uniform float uSoftness;
      uniform float uBurst;
      uniform vec3 uRimColor;
      uniform float uPixelSize;
      varying vec2 vUv;

      float bayer4(vec2 p) {
        int x = int(mod(p.x, 4.0));
        int y = int(mod(p.y, 4.0));
        if (x == 0 && y == 0) return 0.0 / 16.0;
        if (x == 2 && y == 0) return 8.0 / 16.0;
        if (x == 0 && y == 2) return 12.0 / 16.0;
        if (x == 2 && y == 2) return 4.0 / 16.0;
        if (x == 1 && y == 0) return 2.0 / 16.0;
        if (x == 3 && y == 0) return 10.0 / 16.0;
        if (x == 1 && y == 2) return 14.0 / 16.0;
        if (x == 3 && y == 2) return 6.0 / 16.0;
        if (x == 0 && y == 1) return 3.0 / 16.0;
        if (x == 2 && y == 1) return 11.0 / 16.0;
        if (x == 0 && y == 3) return 15.0 / 16.0;
        if (x == 2 && y == 3) return 7.0 / 16.0;
        if (x == 1 && y == 1) return 1.0 / 16.0;
        if (x == 3 && y == 1) return 9.0 / 16.0;
        if (x == 1 && y == 3) return 13.0 / 16.0;
        return 5.0 / 16.0;
      }

      void main() {
        vec2 pixelCoord = gl_FragCoord.xy;
        vec2 ditherCoord = floor(pixelCoord / max(1.0, uPixelSize));

        vec4 grayColor = texture2D(uTexGray, vUv);
        vec4 vividColor = texture2D(uTexColor, vUv);

        float luma = dot(grayColor.rgb, vec3(0.299, 0.587, 0.114));
        float threshold = bayer4(ditherCoord);
        float dithered = step(threshold, luma);
        vec3 ditherBase = mix(vec3(0.02, 0.03, 0.05), vec3(0.92, 0.95, 1.0), dithered);

        float dist = distance(pixelCoord, uPointer);
        float effectiveRadius = uRadius + uBurst * 120.0;
        float innerRadius = effectiveRadius * (1.0 - uSoftness);

        float reveal = 1.0 - smoothstep(innerRadius, effectiveRadius, dist);

        float rimWidth = 14.0;
        float rimMask = smoothstep(effectiveRadius - rimWidth, effectiveRadius, dist) *
                        (1.0 - smoothstep(effectiveRadius, effectiveRadius + rimWidth, dist));

        vec3 finalColor = mix(ditherBase, vividColor.rgb, reveal);
        finalColor += uRimColor * rimMask * 1.6;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    try {
      const geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTexGray: { value: texGray },
          uTexColor: { value: texColor },
          uResolution: { value: new Float32Array([container.clientWidth || 600, container.clientHeight || 450]) },
          uPointer: { value: new Float32Array([mousePos.x, mousePos.y]) },
          uRadius: { value: revealRadius },
          uSoftness: { value: softness },
          uBurst: { value: 0.0 },
          uRimColor: { value: new Float32Array([38 / 255, 139 / 255, 255 / 255]) },
          uPixelSize: { value: pixelSize },
        },
      });

      const mesh = new Mesh(gl, { geometry, program });

      const render = () => {
        if (isCancelled) return;
        if (burstTime > 0.0) {
          burstTime = Math.max(0.0, burstTime - 0.03);
        }
        program.uniforms.uPointer.value[0] += (mousePos.x - program.uniforms.uPointer.value[0]) * 0.15;
        program.uniforms.uPointer.value[1] += (mousePos.y - program.uniforms.uPointer.value[1]) * 0.15;
        program.uniforms.uBurst.value = burstTime;

        renderer.render({ scene: mesh });
        animationFrameId = requestAnimationFrame(render);
      };

      resize();
      render();
    } catch (e) {
      console.warn('[DitherVeil] Program initialization error:', e);
      setWebGLFailed(true);
    }

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', resize);
      if (container) {
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('click', onClick);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [graySrc, colorSrc, revealRadius, softness, pixelSize, clickBurst]);

  // Fallback interactive comparison slider if WebGL fails or on mobile devices
  if (webGLFailed) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl border border-[#1A2B40] bg-[#05070B] shadow-2xl select-none ${className}`}>
        <div className="relative aspect-[16/10] max-h-[520px] w-full">
          <img
            src={colorSrc}
            alt="Colorized DDColor output"
            className="w-full h-full object-cover block"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={graySrc}
              alt="Grayscale Base"
              className="w-full h-full object-cover block filter grayscale contrast-125"
              style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%', maxWidth: 'none' }}
            />
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#268BFF] shadow-[0_0_12px_rgba(38,139,255,0.9)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#101D2E] border-2 border-[#268BFF] text-[#268BFF] flex items-center justify-center shadow-lg">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#080D16] border-t border-[#1A2B40] flex items-center justify-between">
          <span className="text-xs font-mono text-[#98A9BD]">Drag slider to reveal DDColor restoration</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Comparison slider"
            className="w-48 accent-[#268BFF] cursor-ew-resize"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[420px] md:h-[520px] rounded-2xl overflow-hidden border border-[#1A2B40] bg-[#05070B] shadow-2xl cursor-crosshair group ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-4 left-4 pointer-events-none px-3 py-1.5 rounded-full bg-[#080D16]/90 backdrop-blur border border-[#1A2B40] text-xs font-mono text-[#98A9BD] flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-[#268BFF] animate-ping" />
        <span>MOVE POINTER / CLICK TO REVEAL REAL DDCOLOR CHROMINANCE</span>
      </div>
    </div>
  );
}
