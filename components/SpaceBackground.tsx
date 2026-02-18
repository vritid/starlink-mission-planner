"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number; // depth (0..1)
  r: number; // radius
  tw: number; // twinkle phase
  twSpd: number; // twinkle speed
};

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initStars();
    }

    function rand(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    function initStars() {
      const count = Math.floor((w * h) / 9000); // density
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random(), // depth
          r: rand(0.6, 2.0),
          tw: Math.random() * Math.PI * 2,
          twSpd: rand(0.004, 0.02),
        });
      }
      starsRef.current = stars;
    }

    function onMouseMove(e: MouseEvent) {
      // normalize to -1..1
      mouseRef.current = {
        x: (e.clientX / w) * 2 - 1,
        y: (e.clientY / h) * 2 - 1,
      };
    }

    function drawNebula() {
      // subtle gradient glow layers
      const g1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, Math.max(w, h) * 0.7);
      g1.addColorStop(0, "rgba(120, 80, 255, 0.14)");
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, Math.max(w, h) * 0.8);
      g2.addColorStop(0, "rgba(0, 200, 255, 0.10)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    }

    function step() {
      const stars = starsRef.current;
      const m = mouseRef.current;

      // background base
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgb(3, 6, 18)"; // deep space
      ctx.fillRect(0, 0, w, h);

      drawNebula();

      // tiny parallax drift + mouse parallax
      const driftX = 0.08;
      const driftY = 0.04;

      for (const s of stars) {
        // stars closer (higher z) move more
        const px = (m.x * 18 + driftX) * (0.2 + s.z);
        const py = (m.y * 12 + driftY) * (0.2 + s.z);

        // slow downward drift, wrap around
        s.y += 0.06 * (0.2 + s.z);
        if (s.y > h + 2) {
          s.y = -2;
          s.x = Math.random() * w;
          s.z = Math.random();
        }

        s.tw += s.twSpd;
        const twinkle = 0.65 + 0.35 * Math.sin(s.tw);

        // brightness by depth
        const a = (0.25 + 0.75 * s.z) * twinkle;

        // occasional slightly colored stars
        const huePick = s.z > 0.85 ? "rgba(180, 220, 255," : "rgba(255, 255, 255,";
        ctx.fillStyle = `${huePick}${a.toFixed(3)})`;

        const r = s.r * (0.6 + 0.9 * s.z);
        ctx.beginPath();
        ctx.arc(s.x + px, s.y + py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // subtle vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.max(w, h) * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}
