import React, { useEffect, useRef } from 'react';

/**
 * ALTIQ AI background — glowing drifting particles only, no orbit
 * rings. Each particle moves in a straight random direction; when it
 * drifts off any edge of the screen it's gone for good and a fresh
 * particle spawns at a random point along a random edge with its own
 * random direction — a real one-way exit/entry flow, not a wrap-
 * around loop. Kept deliberately soft (moderate opacity + a gentle
 * glow), not bold or busy.
 */
export default function OrbitalBackground({ intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const isMobile = window.innerWidth < 768;
    const MARGIN = 15;

    function spawnAtEdge() {
      const edge = Math.floor(Math.random() * 4); // 0 top, 1 right, 2 bottom, 3 left
      let x, y;
      if (edge === 0) { x = Math.random() * canvas.width; y = -MARGIN; }
      else if (edge === 1) { x = canvas.width + MARGIN; y = Math.random() * canvas.height; }
      else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + MARGIN; }
      else { x = -MARGIN; y = Math.random() * canvas.height; }
      return spawnParticle(x, y);
    }

    function spawnParticle(x, y) {
      const angle = Math.random() * Math.PI * 2; // fully random direction
      const speed = 0.14 + Math.random() * 0.22;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 1.2 + 0.5,
        alpha: Math.random() * 0.35 + 0.22, // kept soft, not bold
        twinkle: Math.random() * Math.PI * 2,
      };
    }

    // Fill the screen immediately on load (random positions anywhere),
    // rather than starting empty and waiting for edge-spawned particles
    // to drift in.
    const particleCount = Math.floor((isMobile ? 60 : 100) * intensity);
    for (let i = 0; i < particleCount; i++) {
      particles.push(spawnParticle(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;

        // Truly exits the screen — replaced by a fresh particle
        // entering from a random edge, not wrapped/teleported.
        if (p.x < -MARGIN || p.x > canvas.width + MARGIN || p.y < -MARGIN || p.y > canvas.height + MARGIN) {
          particles[i] = spawnAtEdge();
          return;
        }

        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle)) * intensity;

        ctx.save();
        ctx.shadowColor = `rgba(94, 94, 94, ${a})`;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 94, 94, ${a})`;
        ctx.fill();
        ctx.restore();
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
