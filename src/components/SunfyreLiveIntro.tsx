import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight, Volume2, VolumeX, Shield, Play, Upload, RotateCcw } from 'lucide-react';
import { useBrandLogo } from '../utils/brandLogo.js';
import { useAuth } from '../context/AuthContext.js';

interface SunfyreLiveIntroProps {
  onComplete: () => void;
}

export const SunfyreLiveIntro: React.FC<SunfyreLiveIntroProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const { logoUrl, isCustom, uploadCustomLogo, resetToDefault } = useBrandLogo();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [stage, setStage] = useState<'vortex' | 'crest' | 'text' | 'ready'>('vortex');
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Web Audio Synth for luxury golden reveal sound
  const playGoldenChime = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Deep atmospheric drone
      const oscDrone = ctx.createOscillator();
      const gainDrone = ctx.createGain();
      oscDrone.type = 'sine';
      oscDrone.frequency.setValueAtTime(110, ctx.currentTime); // A2
      oscDrone.frequency.exponentialRampToValueAtTime(146.83, ctx.currentTime + 2.5); // D3
      gainDrone.gain.setValueAtTime(0.01, ctx.currentTime);
      gainDrone.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2);
      gainDrone.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
      oscDrone.connect(gainDrone);
      gainDrone.connect(ctx.destination);
      oscDrone.start();
      oscDrone.stop(ctx.currentTime + 3.2);

      // Shimmering harmonic chimes (Pentatonic Ethiopian / Celtic gold harmonics)
      const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime + 0.3 + idx * 0.15);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime + 0.3 + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.08 / (idx * 0.4 + 1), ctx.currentTime + 0.35 + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2 + idx * 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + 0.3 + idx * 0.15);
        osc.stop(ctx.currentTime + 2.4 + idx * 0.15);
      });
    } catch {
      // AudioContext blocked by browser autoplay policy until interaction
    }
  };

  // Staged timeline
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStage('crest');
      playGoldenChime();
    }, 600);

    const timer2 = setTimeout(() => {
      setStage('text');
    }, 1600);

    const timer3 = setTimeout(() => {
      setStage('ready');
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isMuted]);

  // Handle ESC key to quickly exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3D Mouse & Touch Parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 18, y: -y * 18 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width - 0.5;
    const y = (touch.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 18, y: -y * 18 });
  };

  // 3D Particle Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle structure
    interface Particle3D {
      x: number;
      y: number;
      z: number;
      radius: number;
      angle: number;
      speed: number;
      color: string;
      alpha: number;
      decay: number;
    }

    const particles: Particle3D[] = [];
    const particleCount = 240;

    const goldColors = [
      '#FFDF73',
      '#E5B842',
      '#D4AF37',
      '#F3C34F',
      '#AA7C11',
      '#FFFFFF',
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100,
        radius: Math.random() * 2.5 + 0.6,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.005,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        alpha: Math.random() * 0.7 + 0.3,
        decay: Math.random() * 0.005 + 0.002,
      });
    }

    let vortexSpeed = 0.01;

    const render = () => {
      ctx.fillStyle = 'rgba(7, 7, 9, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 400;

      vortexSpeed += 0.0001;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.angle += p.speed;

        // Swirl dynamics
        const dist = Math.sqrt(p.x * p.x + p.y * p.y);
        const nextDist = dist * 0.996;
        p.x = Math.cos(p.angle) * nextDist;
        p.y = Math.sin(p.angle) * nextDist;
        p.z -= 1.8;

        if (p.z <= 20 || nextDist < 20) {
          p.z = 800;
          const radius = Math.random() * (Math.min(width, height) * 0.7) + 100;
          p.x = Math.cos(p.angle) * radius;
          p.y = Math.sin(p.angle) * radius;
        }

        const scale = fov / (fov + p.z);
        const projX = cx + p.x * scale;
        const projY = cy + p.y * scale;
        const projR = Math.max(0.5, p.radius * scale * 2);

        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(projX, projY, projR, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * Math.min(1, (800 - p.z) / 400);
          ctx.shadowColor = '#E5B842';
          ctx.shadowBlur = projR * 3;
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw subtle central gold core pulse
      const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260 + pulse * 40);
      gradient.addColorStop(0, 'rgba(229, 184, 66, 0.12)');
      gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.04)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 300, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleEnter = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 650);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className={`fixed inset-0 z-[9999] bg-[#070709] flex flex-col items-center justify-center overflow-y-auto py-10 px-3 select-none transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
    >
      {/* 3D Particle Starfield & Vortex Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Utility Bar: Audio Toggle, Logo Control & Skip Button */}
      <div className="absolute top-4 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              if (!next) playGoldenChime();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-[#E5B842] text-[11px] sm:text-xs font-mono transition-all backdrop-blur-md cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5B842]" />}
            <span className="hidden xs:inline">{isMuted ? 'Sound Off' : 'Sound On'}</span>
          </button>

          {/* Super Admin Only: Custom Brand Logo Upload & Reset */}
          {isSuperAdmin && (
            <>
              <label className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#E5B842]/20 border border-white/10 hover:border-[#E5B842]/50 text-zinc-300 hover:text-[#E5B842] text-[11px] sm:text-xs font-mono transition-all backdrop-blur-md cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#E5B842]" />
                <span className="hidden sm:inline">Use My Own Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadCustomLogo(file);
                  }}
                />
              </label>

              {isCustom && (
                <button
                  onClick={resetToDefault}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 text-zinc-400 hover:text-red-300 text-[11px] sm:text-xs font-mono transition-all backdrop-blur-md cursor-pointer"
                  title="Reset to Sunfyre Luxury Crest"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden md:inline">Reset Crest</span>
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleEnter}
          className="px-3 sm:px-4 py-1.5 rounded-full bg-white/5 hover:bg-[#E5B842]/20 border border-white/10 hover:border-[#E5B842]/40 text-zinc-300 hover:text-white text-[11px] sm:text-xs font-mono tracking-wider uppercase transition-all backdrop-blur-md cursor-pointer flex items-center gap-1.5"
        >
          <span>Skip</span>
          <span className="hidden xs:inline text-[9px] text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded font-mono">ESC</span>
        </button>
      </div>

      {/* Center 3D Stage with Interactive Perspective Tilt */}
      <div
        style={{
          transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="relative z-20 flex flex-col items-center text-center px-4 max-w-2xl my-auto py-14 sm:py-10"
      >
        {/* Modern Sunfyre Golden Dragon 3D Crest */}
        <div
          className={`relative group mb-4 sm:mb-8 transition-all duration-1000 ${
            stage !== 'vortex' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          {/* Ambient Rotating Gold Glow Halo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#E5B842] via-[#F3C34F] to-[#AA7C11] rounded-full blur-2xl opacity-40 group-hover:opacity-70 animate-pulse transition-opacity duration-1000 pointer-events-none" />

          {/* Precision 3D Ring with Metallic Bevel */}
          <div className="relative w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full p-1.5 bg-gradient-to-tr from-[#946e1a] via-[#f7d779] to-[#80590a] shadow-[0_0_40px_rgba(229,184,66,0.35)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-black p-1 relative">
              {/* Inner Metallic Emblem */}
              <img
                src={logoUrl}
                alt="Sunfyre General Trading - Golden Crest Emblem"
                className="w-full h-full object-cover rounded-full filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] transform group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />

              {/* Dynamic Shimmer Light Sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-full" />
            </div>
          </div>

          {/* Super Admin Only: Subtle logo upload helper */}
          {isSuperAdmin && (
            <div className="mt-2 sm:mt-3 flex items-center justify-center">
              <label className="text-[9px] sm:text-[10px] font-mono text-zinc-400 hover:text-[#E5B842] cursor-pointer flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-white/10 hover:border-[#E5B842]/40 transition-all">
                <Upload className="w-3 h-3 text-[#E5B842]" />
                <span className="truncate max-w-[220px] sm:max-w-none">
                  {isCustom ? 'Custom logo active • Click to change' : 'Super Admin: Click to upload your custom logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadCustomLogo(file);
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Cinematic Title & Corporate Branding */}
        <div
          className={`space-y-2 sm:space-y-3 transition-all duration-1000 transform ${
            stage === 'text' || stage === 'ready'
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0'
          }`}
        >
          {/* Main Brand Lettermark */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D1] via-[#E5B842] to-[#A87B19] drop-shadow-[0_4px_24px_rgba(229,184,66,0.3)]">
            MiniBid
          </h1>

          {/* Sunfyre Corporate Signature */}
          <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.15em] sm:tracking-[0.25em] text-[#E5B842]">
            <span className="w-6 sm:w-8 h-[1px] bg-gradient-to-r from-transparent to-[#E5B842]" />
            <span className="font-bold drop-shadow-[0_2px_8px_rgba(229,184,66,0.4)]">
              Powered by Sunfyre General Trading
            </span>
            <span className="w-6 sm:w-8 h-[1px] bg-gradient-to-l from-transparent to-[#E5B842]" />
          </div>

          <p className="text-[11px] sm:text-xs text-zinc-400 font-sans tracking-wide max-w-md mx-auto pt-0.5 sm:pt-1 leading-relaxed">
            Ethiopia's Premier Reverse Auction & Digital Liquidity Platform
          </p>
        </div>

        {/* Enter Platform Action Button */}
        <div
          className={`mt-6 sm:mt-9 transition-all duration-700 transform ${
            stage === 'ready' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
          }`}
        >
          <button
            onClick={handleEnter}
            className="group relative inline-flex items-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#E5B842] via-[#F3C34F] to-[#D4AF37] hover:from-[#f0c451] hover:to-[#e0b73c] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(229,184,66,0.45)] hover:shadow-[0_0_45px_rgba(229,184,66,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Bottom Subtle Trust Badges */}
      <div className="relative mt-6 sm:mt-0 sm:absolute sm:bottom-6 flex items-center justify-center flex-wrap gap-2 sm:gap-6 text-[10px] sm:text-[11px] font-mono text-zinc-500 z-30 px-3 text-center">
        <span className="flex items-center gap-1 sm:gap-1.5">
          <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#E5B842]" /> Zero Double-Spend Protected
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">Certified Reverse Auction Architecture</span>
        <span>•</span>
        <span className="text-zinc-600">Addis Ababa, Ethiopia</span>
      </div>
    </div>
  );
};
