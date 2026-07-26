import React, { useEffect, useRef } from 'react';

/**
 * Signature ALTIQ AI orbital background.
 *
 * Per explicit direction: identical everywhere in the app — landing
 * page, auth screens, dashboard, every workspace tab. No "calmer"
 * dialed-down version anywhere. Color is dark-ash (#5E5E5E territory),
 * particles and orbits are spread across the whole viewport (not
 * clustered around a couple of fixed points), and everything moves
 * at a speed that's actually noticeable, not just technically animating.
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

    const isMobile = window.innerWidth < 768;

    // Drifting dust particles, spread across the entire viewport —
    // not concentrated near the orbit centers.
    const particleCount = Math.floor((isMobile ? 55 : 95) * intensity);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3 + 0.4,
        alpha: Math.random() * 0.55 + 0.3,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Orbit rings, scattered across the whole screen (randomized
    // positions, not a fixed diagonal formula) so motion reads as
    // spread throughout the page instead of stuck in one corner.
    const orbitCount = isMobile ? 5 : 8;
    for (let i = 0; i < orbitCount; i++) {
      orbits.push({
        cx: Math.random() * canvas.width,
        cy: Math.random() * canvas.height,
        radius: 50 + Math.random() * 130,
        angle: Math.random() * Math.PI * 2,
        speed: (0.0009 + Math.random() * 0.0011) * (Math.random() < 0.5 ? 1 : -1),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark-ash orbit rings + orbiting dot
      orbits.forEach((o) => {
        o.angle += o.speed;
        ctx.beginPath();
        ctx.arc(o.cx, o.cy, o.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(94, 94, 94, ${0.32 * intensity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const ox = o.cx + Math.cos(o.angle) * o.radius;
        const oy = o.cy + Math.sin(o.angle) * o.radius;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 94, 94, ${0.85 * intensity})`;
        ctx.fill();
      });

      // Dark-ash drifting particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle)) * intensity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 94, 94, ${a})`;
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
