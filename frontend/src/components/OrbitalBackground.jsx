import React, { useEffect, useRef } from 'react';

/**
 * Signature ALTIQ AI orbital background.
 * intensity: 1 = landing, ~0.28 = authenticated app (calmer).
 * Fixed to viewport. Dark particles on light page for subtle depth.
 */
export default function OrbitalBackground({ intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let orbits = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Reduce density on mobile / low intensity
    const isMobile = window.innerWidth < 768;
    const count = Math.floor((isMobile ? 34 : 62) * intensity);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.15 + 0.25,
        alpha: Math.random() * 0.5 + 0.18,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 3; i++) {
      orbits.push({
        cx: canvas.width * (0.2 + i * 0.28),
        cy: canvas.height * (0.3 + i * 0.18),
        radius: 70 + i * 55,
        angle: Math.random() * Math.PI * 2,
        speed: 0.00035 + i * 0.00015,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbits.forEach((o) => {
        o.angle += o.speed;
        ctx.beginPath();
        ctx.arc(o.cx, o.cy, o.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(167, 167, 167, ${0.2 * intensity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const ox = o.cx + Math.cos(o.angle) * o.radius;
        const oy = o.cy + Math.sin(o.angle) * o.radius;
        ctx.beginPath();
        ctx.arc(ox, oy, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(35, 35, 35, ${0.55 * intensity})`;
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.015;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const a = p.alpha * (0.65 + 0.35 * Math.sin(p.twinkle)) * intensity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(17, 17, 17, ${a})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
      aria-hidden="true"
    />
  );
}
