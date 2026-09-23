import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseAngle: number;
  color: string;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  speed: number;
}

export const GoldenParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Warm, eye-comfortable Ethiopian luxury golds
    const goldHues = [
      'rgba(245, 197, 66, ',   // Vibrant Amber Gold
      'rgba(229, 184, 66, ',   // Signature Gold #E5B842
      'rgba(255, 223, 115, ',  // Bright Warm Gold
      'rgba(212, 175, 55, ',   // Classic Gold #D4AF37
      'rgba(255, 215, 0, ',    // Pure Gold
    ];

    const isMobile = width < 768;
    const particleCount = isMobile ? 48 : 88;
    const connectionDistance = isMobile ? 100 : 135;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1.2, // 1.2px to 3.0px: crisp and visibly distinct
        baseAlpha: Math.random() * 0.4 + 0.45, // 0.45 to 0.85
        pulseSpeed: Math.random() * 0.025 + 0.01,
        pulseAngle: Math.random() * Math.PI * 2,
        color: goldHues[Math.floor(Math.random() * goldHues.length)],
      });
    }

    // Gentle luxury golden embers that drift diagonally across the view
    const emberCount = isMobile ? 3 : 6;
    const embers: Ember[] = [];
    for (let i = 0; i < emberCount; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() * 0.3 + 0.2) * -1,
        vy: Math.random() * 0.4 + 0.25,
        length: Math.random() * 25 + 15,
        alpha: Math.random() * 0.3 + 0.2,
        speed: Math.random() * 0.5 + 0.3,
      });
    }

    let mouse = { x: -2000, y: -2000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -2000;
      mouse.y = -2000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    const render = () => {
      // Clear previous frame
      ctx.clearRect(0, 0, width, height);

      // 1. Deep obsidian ambient gradient base with rich vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        150,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#0f0f14');
      bgGrad.addColorStop(0.6, '#09090c');
      bgGrad.addColorStop(1, '#050507');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Interactive golden cursor aura
      if (mouse.x > 0 && mouse.y > 0) {
        const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 140);
        cursorGlow.addColorStop(0, 'rgba(229, 184, 66, 0.12)');
        cursorGlow.addColorStop(0.5, 'rgba(229, 184, 66, 0.04)');
        cursorGlow.addColorStop(1, 'rgba(229, 184, 66, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Gentle drifting golden shooting embers
      for (let i = 0; i < embers.length; i++) {
        const emb = embers[i];
        emb.x += emb.vx * emb.speed;
        emb.y += emb.vy * emb.speed;

        if (emb.y > height + 50 || emb.x < -50) {
          emb.x = Math.random() * width + 100;
          emb.y = -40;
        }

        ctx.save();
        ctx.beginPath();
        const grad = ctx.createLinearGradient(
          emb.x,
          emb.y,
          emb.x - emb.vx * emb.length,
          emb.y - emb.vy * emb.length
        );
        grad.addColorStop(0, `rgba(245, 197, 66, ${emb.alpha})`);
        grad.addColorStop(1, 'rgba(229, 184, 66, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.moveTo(emb.x, emb.y);
        ctx.lineTo(emb.x - emb.vx * emb.length, emb.y - emb.vy * emb.length);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw delicate connecting golden lines between nearby particles
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            // Elegant, eye-comfortable opacity
            const lineAlpha = (1 - dist / connectionDistance) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(229, 184, 66, ${lineAlpha})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Also connect nearby particles to mouse cursor for subtle tactile delight
        const mdx = mouse.x - particles[i].x;
        const mdy = mouse.y - particles[i].y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 120) {
          const mouseLineAlpha = (1 - mdist / 120) * 0.28;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 215, 0, ${mouseLineAlpha})`;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // 5. Draw and animate glowing golden dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Pulse oscillation
        p.pulseAngle += p.pulseSpeed;
        const currentAlpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.25;
        const clampedAlpha = Math.max(0.2, Math.min(0.95, currentAlpha));

        // Gentle interactive mouse influence
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 90 && mdist > 0) {
          const force = (90 - mdist) / 90;
          p.x -= (mdx / mdist) * force * 0.8;
          p.y -= (mdy / mdist) * force * 0.8;
        }

        // Particle motion
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < -15) p.x = width + 15;
        else if (p.x > width + 15) p.x = -15;

        if (p.y < -15) p.y = height + 15;
        else if (p.y > height + 15) p.y = -15;

        // Draw particle with glowing aura
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${clampedAlpha})`;
        ctx.shadowColor = '#E5B842';
        ctx.shadowBlur = p.radius * 4;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};
