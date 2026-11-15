import React, { useEffect, useRef } from 'react';

export default function PhotonKnot({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const getDimensions = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.offsetWidth || window.innerWidth : window.innerWidth;
      const h = parent ? parent.offsetHeight || window.innerHeight : window.innerHeight;
      return { w: Math.max(w, 320), h: Math.max(h, 320) };
    };

    let { w: width, h: height } = getDimensions();
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      if (!canvas) return;
      const dims = getDimensions();
      width = canvas.width = dims.w;
      height = canvas.height = dims.h;
    };

    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Torus knot parameters (p=2, q=3) trefoil knot
    const p = 2;
    const q = 3;
    const numPoints = 180;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.28;

      ctx.save();
      ctx.translate(centerX, centerY);

      const step = (Math.PI * 2) / numPoints;
      const points = [];

      for (let i = 0; i < numPoints; i++) {
        const u = i * step + angle;
        const r = baseRadius * (0.6 + 0.4 * Math.sin(q * u));
        const x = r * Math.cos(p * u);
        const y = r * Math.sin(p * u);
        const z = baseRadius * 0.4 * Math.cos(q * u);

        const focalLength = 400;
        const scale = focalLength / (focalLength + z);
        points.push({
          x: x * scale,
          y: y * scale,
          scale,
          z,
        });
      }

      points.sort((a, b) => a.z - b.z);

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const alpha = Math.max(0.15, Math.min(0.85, (pt.z + 150) / 300));
        const radius = Math.max(1.2, 3.0 * pt.scale);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(38, 139, 255, ${alpha})`;
        ctx.fill();

        if (pt.scale > 1.0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(23, 105, 210, ${alpha * 0.25})`;
          ctx.fill();
        }
      }

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const next = points[(i + 1) % points.length];
        if (Math.abs(points[i].x - next.x) < 80 && Math.abs(points[i].y - next.y) < 80) {
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(next.x, next.y);
        }
      }
      ctx.strokeStyle = 'rgba(38, 139, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      if (!prefersReducedMotion) {
        angle += 0.006;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block opacity-75" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, #05070B 85%)',
        }}
      />
    </div>
  );
}
