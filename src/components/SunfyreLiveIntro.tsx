import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Shield,
  Upload,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useBrandLogo } from '../utils/brandLogo.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import { BrandLogoModal } from './BrandLogoModal.js';

interface SunfyreLiveIntroProps {
  onComplete: () => void;
  onOpenHowItWorks?: () => void;
}

export const SunfyreLiveIntro: React.FC<SunfyreLiveIntroProps> = ({ onComplete, onOpenHowItWorks }) => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const isSuperAdmin = user?.role === 'superadmin';
  const { logoUrl, isCustom } = useBrandLogo();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Handle ESC key to quickly exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLogoModalOpen) {
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoModalOpen]);

  // Subtle 3D mouse parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
  };

  // 3D Ambient Golden Dust & Particle Wave
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

    interface Particle {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(80, Math.floor(width / 15));
    const colors = ['#FFDF73', '#E5B842', '#D4AF37', '#F3C34F', '#ffffff'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const render = () => {
      ctx.fillStyle = 'rgba(6, 6, 8, 0.35)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Soft ambient golden breathing core behind the logo
      const time = Date.now() * 0.0015;
      const breathe = Math.sin(time) * 30;
      const radial = ctx.createRadialGradient(cx, cy, 10, cx, cy, 280 + breathe);
      radial.addColorStop(0, 'rgba(229, 184, 66, 0.14)');
      radial.addColorStop(0.4, 'rgba(212, 175, 55, 0.05)');
      radial.addColorStop(1, 'transparent');

      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(cx, cy, 320 + breathe, 0, Math.PI * 2);
      ctx.fill();

      // Render floating gold particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = '#E5B842';
        ctx.shadowBlur = p.radius * 3;
        ctx.fill();
        ctx.restore();
      }

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
    }, 500);
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`fixed inset-0 z-[9999] bg-[#060608] flex flex-col items-center justify-between overflow-y-auto py-6 sm:py-8 px-4 sm:px-6 select-none transition-opacity duration-500 ${
          isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
        }`}
      >
        {/* Background Particle Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Top Header Bar */}
        <div className="w-full max-w-5xl flex items-center justify-between relative z-30">
          {/* Subtle brand tag */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E5B842] shadow-[0_0_8px_#E5B842] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#E5B842]/90 font-bold">
              MiniBid Ethiopia • Live Auctions
            </span>
          </div>

          {/* Quick Skip Button */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-[#E5B842]/20 border border-[#E5B842]/40 hover:border-[#E5B842] text-amber-300 hover:text-white text-xs font-mono transition-all backdrop-blur-md cursor-pointer"
                title="Super Admin: Customize Website Logo"
              >
                <Crown className="w-3.5 h-3.5 text-[#E5B842]" />
                <span className="hidden sm:inline">
                  {language === 'am' ? 'የብራንድ ሎጎ ቀይር' : 'Change Brand Logo'}
                </span>
              </button>
            )}

            <button
              onClick={handleEnter}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-[#E5B842]/20 border border-white/10 hover:border-[#E5B842]/40 text-zinc-300 hover:text-white text-xs font-mono tracking-wider uppercase transition-all backdrop-blur-md cursor-pointer flex items-center gap-1.5"
            >
              <span>{language === 'am' ? 'እለፍ (Skip)' : 'Skip'}</span>
              <span className="hidden xs:inline text-[9px] text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded font-mono">
                ESC
              </span>
            </button>
          </div>
        </div>

        {/* Center Stage: Logo, Slogans & Action */}
        <div
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative z-20 flex flex-col items-center text-center max-w-2xl my-auto py-4"
        >
          {/* Gleaming Centerpiece Brand Logo */}
          <div className="relative group mb-5">
            {/* Ambient Radial Golden Aura */}
            <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-[#E5B842] via-[#F3C34F] to-[#AA7C11] rounded-full blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none" />

            {/* Precision 3D Luxury Ring */}
            <div className="relative w-36 h-36 xs:w-44 xs:h-44 sm:w-52 sm:h-52 rounded-full p-1.5 bg-gradient-to-tr from-[#946e1a] via-[#f7d779] to-[#80590a] shadow-[0_0_50px_rgba(229,184,66,0.45)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-black p-1 relative flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="MiniBid Ethiopia Official Brand Logo"
                  className="w-full h-full object-cover rounded-full filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] transform group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {/* Shimmer overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-full" />
              </div>
            </div>

            {/* Super Admin Quick Logo Badge */}
            {isSuperAdmin && (
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-black/90 hover:bg-[#E5B842] text-[#E5B842] hover:text-black border border-[#E5B842]/50 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                title="Super Admin: Click to change official logo"
              >
                <Upload className="w-3 h-3" />
                <span>{language === 'am' ? 'ሎጎ ቀይር' : 'Change Logo'}</span>
              </button>
            )}
          </div>

          {/* Brand Lettermark */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5D1] via-[#E5B842] to-[#A87B19] drop-shadow-[0_4px_30px_rgba(229,184,66,0.4)]">
            MiniBid
          </h1>

          {/* Corporate Backing Endorsement */}
          <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-[#E5B842]/30 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#E5B842]">
            <Sparkles className="w-3 h-3 text-[#E5B842]" />
            <span className="font-bold">Powered by Sunfyre General Trading</span>
            <Sparkles className="w-3 h-3 text-[#E5B842]" />
          </div>

          {/* Centerpiece Prominent Slogans */}
          <div className="mt-5 space-y-2 max-w-lg mx-auto">
            {/* Primary Catchphrase */}
            <div className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-amber-200 tracking-wide drop-shadow-[0_2px_14px_rgba(229,184,66,0.3)]">
              {language === 'am' ? (
                <span>«ዝቅተኛው ያልተደገመ ዋጋ ያሸንፋል!»</span>
              ) : (
                <span>«Lowest Unique Bid Wins»</span>
              )}
            </div>

            {/* Secondary Slogan */}
            <div className="text-sm sm:text-base font-semibold text-[#E5B842] tracking-wide">
              {language === 'am' ? (
                <span>በጥቂት ሳንቲሞች የቅንጦት ዕቃዎችን ያሸንፉ!</span>
              ) : (
                <span>Bid Smart. Win Luxury for Cents.</span>
              )}
            </div>

            {/* One-line Platform Mission */}
            <p className="text-xs sm:text-sm text-zinc-400 font-sans tracking-normal leading-relaxed pt-1">
              {language === 'am'
                ? 'የኢትዮጵያ ቀዳሚ 100% ግልጽና ፍትሃዊ የጨረታ ፕላትፎርም • በቴሌብር እና በኢትዮጵያ ንግድ ባንክ ፈጣን የክፍያ ማረጋገጫ'
                : "Ethiopia's Premier Reverse Auction & Digital Liquidity Platform • Telebirr & CBE Birr Instant Clearance"}
            </p>
          </div>

          {/* Action CTAs: Enter Auctions + Platform Guide */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
            <button
              onClick={handleEnter}
              className="w-full sm:w-auto flex-1 group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5B842] via-[#F3C34F] to-[#D4AF37] hover:brightness-110 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(229,184,66,0.5)] hover:shadow-[0_0_50px_rgba(229,184,66,0.75)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>{language === 'am' ? 'ወደ ጨረታዎች ይግቡ' : 'Enter Live Auctions'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                if (onOpenHowItWorks) {
                  onOpenHowItWorks();
                } else {
                  handleEnter();
                }
              }}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-black/60 hover:bg-white/10 text-amber-300 hover:text-white border border-[#E5B842]/50 hover:border-[#E5B842] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer shadow-lg"
            >
              <BookOpen className="w-4 h-4 text-[#E5B842]" />
              <span>{language === 'am' ? 'የጨዋታው መመሪያ' : 'Platform Guide'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Trust & Compliance Footnote */}
        <div className="w-full max-w-4xl flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-xs font-mono text-zinc-400 z-30 text-center relative pt-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Shield className="w-3.5 h-3.5 text-[#E5B842]" />
            <span>{language === 'am' ? 'ቴሌብር እና CBE Birr የተረጋገጠ' : 'Telebirr & CBE Integrated'}</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-300">
            {language === 'am' ? '100% ግልጽና ኦዲት የሚደረግ የጨረታ ቀመር' : '100% Auditable Reverse Auction Math'}
          </span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="hidden sm:inline text-zinc-300">
            {language === 'am' ? 'የብሔራዊ ባንክ ደንብ የተከተለ' : 'NBE Compliant'}
          </span>
        </div>
      </div>

      {/* Super Admin Brand Logo Modal */}
      {isLogoModalOpen && (
        <BrandLogoModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
        />
      )}
    </>
  );
};
