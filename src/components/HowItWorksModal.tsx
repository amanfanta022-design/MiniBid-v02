import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Trophy,
  Coins,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  Crown,
  Lock,
  Layers,
  Award,
  Users,
  Video,
  UserPlus,
  LogIn,
  CreditCard,
  Target,
  Clock,
  Smartphone,
  Eye,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit?: () => void;
  onOpenAuth?: (tab: 'login' | 'register') => void;
}

interface SimBid {
  id: string;
  name: string;
  amount: number;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const { language, t } = useTranslation();
  const [viewMode, setViewMode] = useState<'video' | 'steps' | 'simulator'>('video');
  const [activeStep, setActiveStep] = useState<number>(0);

  // Video guide state
  const [videoChapter, setVideoChapter] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Interactive test simulator state
  const [simBids, setSimBids] = useState<SimBid[]>([
    { id: '1', name: 'Abebe (Bidder 1)', amount: 1.01 },
    { id: '2', name: 'Selam (Bidder 2)', amount: 1.01 }, // duplicate!
    { id: '3', name: 'Dawit (Bidder 3)', amount: 1.04 }, // unique & lowest unique!
    { id: '4', name: 'Almaz (Bidder 4)', amount: 1.07 },
    { id: '5', name: 'Kassahun (Bidder 5)', amount: 1.07 }, // duplicate!
    { id: '6', name: 'Tewodros (Bidder 6)', amount: 2.15 },
  ]);

  const [testAmount, setTestAmount] = useState('1.02');
  const [testName, setTestName] = useState('You (አንተ)');

  const CHAPTER_DURATION = 6500; // ms per chapter in animated video

  // Animated video player loop
  useEffect(() => {
    if (!isOpen || viewMode !== 'video' || !isPlaying) return;

    const interval = 100;
    const increment = (interval / CHAPTER_DURATION) * 100;

    const timer = setInterval(() => {
      setVideoProgress(prev => {
        if (prev >= 100) {
          setVideoChapter(c => (c + 1) % 5);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, viewMode, isPlaying, videoChapter]);

  if (!isOpen) return null;

  // Simulator computations
  const amountCounts: Record<number, number> = {};
  simBids.forEach(b => {
    const amt = Number(b.amount.toFixed(2));
    amountCounts[amt] = (amountCounts[amt] || 0) + 1;
  });

  const uniqueAmounts = Object.keys(amountCounts)
    .map(Number)
    .filter(amt => amountCounts[amt] === 1)
    .sort((a, b) => a - b);

  const winningAmount = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;

  const handleAddSimBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(testAmount);
    if (isNaN(val) || val <= 0) return;

    setSimBids(prev => [
      ...prev,
      {
        id: `sim_${Date.now()}`,
        name: testName || 'You',
        amount: Number(val.toFixed(2)),
      },
    ]);
    setTestAmount('');
  };

  const handleResetSim = () => {
    setSimBids([
      { id: '1', name: 'Abebe (Bidder 1)', amount: 1.01 },
      { id: '2', name: 'Selam (Bidder 2)', amount: 1.01 },
      { id: '3', name: 'Dawit (Bidder 3)', amount: 1.04 },
      { id: '4', name: 'Almaz (Bidder 4)', amount: 1.07 },
      { id: '5', name: 'Kassahun (Bidder 5)', amount: 1.07 },
      { id: '6', name: 'Tewodros (Bidder 6)', amount: 2.15 },
    ]);
  };

  const videoChapters = [
    {
      id: 0,
      title: language === 'am' ? '1. መመዝገብ (Registration)' : '1. Register Account',
      tag: 'REGISTER',
      summary:
        language === 'am'
          ? 'በስም እና በኢትዮጵያ ስልክ ቁጥር (+251...) ፈጣን ምዝገባ ያድርጉ። ምንም የ OTP መጠበቅ ሳይኖር ወዲያውኑ ይጀምሩ!'
          : 'Register using Username & Ethiopian phone (+251 9... / 09...). Instant onboarding with zero OTP delay!',
    },
    {
      id: 1,
      title: language === 'am' ? '2. መግባት (Login)' : '2. Login Seamlessly',
      tag: 'LOGIN',
      summary:
        language === 'am'
          ? 'በስልክ ቁጥርዎ ወይም በዩዘርኔምዎ እና በይለፍ ቃልዎ ወዲያውኑ ወደ ሒሳብዎ ይግቡ።'
          : 'Log into your account using either your Ethiopian Phone Number or Username with your secure password.',
    },
    {
      id: 2,
      title: language === 'am' ? '3. ገንዘብ መሙላት (Deposit)' : '3. Deposit ETB',
      tag: 'DEPOSIT',
      summary:
        language === 'am'
          ? 'በCBE Birr፣ Telebirr ወይም ባንክ ገንዘብ ያስገቡ። የደረሰኝ ስክሪንሾት በማያያዝ ጥያቄ ያቅርቡ፤ ኦፕሬተሮች ወዲያውኑ ያረጋግጡልዎታል።'
          : 'Top up wallet balance via CBE, Telebirr, or Awash. Upload transfer screenshot; assigned operator verifies and credits your balance.',
    },
    {
      id: 3,
      title: language === 'am' ? '4. እንዴት መጫረት እንደሚቻል (How to Bid)' : '4. How to Bid (Reverse Strategy)',
      tag: 'BIDDING',
      summary:
        language === 'am'
          ? 'ሚስጥራዊ የጨረታ ዋጋ ይስጡ። ሁለት ሰዎች አንድ አይነት ዋጋ ከሰጡ ውድቅ ይሆናሉ፤ በአንድ ሰው ብቻ የተሰጠው ዝቅተኛ ዋጋ ያሸንፋል!'
          : 'Place sealed bids from 1.00 ETB. Duplicated amounts cancel out! The lowest unique bid placed by exactly ONE bidder wins.',
    },
    {
      id: 4,
      title: language === 'am' ? '5. ውጤት እና ሽልማት (Results & Winners)' : '5. See Results & Claim Prize',
      tag: 'RESULTS',
      summary:
        language === 'am'
          ? 'ቆጣሪው 00:00:00 ሲደርስ ሙሉው የጨረታ ዝርዝር በይፋ ይገለጻል! አሸናፊው በስልክ ተጠርቶ አዲሱን ዕቃ ይረከባል።'
          : 'When the live timer hits 00:00:00, all bids are published publicly for 100% transparency. Winner receives direct delivery dispatch!',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#101014] border border-[#E5B842]/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#E5B842]/10 p-4 sm:p-6 md:p-8 text-zinc-100 my-auto sm:my-6 max-h-[96vh] overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E5B842] via-amber-500 to-amber-700 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-[#101014] rounded-[14px] flex items-center justify-center text-[#E5B842]">
                <HelpCircle className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold font-serif text-white tracking-wide">
                  {language === 'am' ? 'የጨዋታው የተሟላ መመሪያ' : 'Platform Guide & How It Works'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                  {language === 'am' ? 'ቪዲዮ እና መመሪያ' : 'Video & Visual Guide'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'am'
                  ? 'መመዝገብ፣ መግባት፣ ገንዘብ መሙላት፣ መጫረት እና ውጤት ማየት የሚችሉበት የተሟላ ማብራሪያ'
                  : 'Learn Registration, Login, Wallet Top-up, Reverse Bidding tactics, and Prize Claiming.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#18181b] p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode('video')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'video'
                    ? 'bg-[#E5B842] text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ተንቀሳቃሽ ቪዲዮ' : 'Animated Video'}</span>
              </button>

              <button
                onClick={() => setViewMode('steps')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'steps'
                    ? 'bg-[#E5B842] text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ደረጃ በደረጃ' : 'Step-by-Step'}</span>
              </button>

              <button
                onClick={() => setViewMode('simulator')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'simulator'
                    ? 'bg-[#E5B842] text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ቀመር ሞካሪ' : 'Simulator'}</span>
              </button>
            </div>

            <button
              id="close-how-it-works-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW MODE 1: ANIMATED VIDEO GUIDE SIMULATION */}
        {/* ======================================================== */}
        {viewMode === 'video' && (
          <div className="space-y-4">
            {/* Simulated Animated Video Player Screen */}
            <div className="relative aspect-video sm:aspect-[16/9] md:aspect-[21/9] max-h-[380px] w-full rounded-2xl bg-gradient-to-br from-[#0c0c0e] via-[#14141a] to-[#0a0a0d] border border-amber-500/40 overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-6 group">
              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#E5B842]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Video Top Bar */}
              <div className="relative z-10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>REC GUIDE • 1080P HD</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
                    MiniBid Official Video Walkthrough
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg bg-black/60 border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                    title={soundEnabled ? 'Mute' : 'Unmute'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <span className="px-2 py-0.5 rounded bg-black/60 font-mono text-[10px] text-amber-300 border border-amber-500/30">
                    Chapter {videoChapter + 1} / 5
                  </span>
                </div>
              </div>

              {/* Video Dynamic Animated Scene Display */}
              <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center text-center">
                {videoChapter === 0 && (
                  /* Scene 0: Registration */
                  <div className="space-y-3 animate-fadeIn max-w-lg">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                      <UserPlus className="w-7 h-7" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ደረጃ 1፦ መመዝገብ እና የባጅ ማረጋገጫ' : 'Step 1: Register & Verified Badge'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-left text-xs font-mono space-y-2 max-w-sm mx-auto shadow-inner">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Username:</span>
                        <span className="text-white font-bold">@abebe_bidder</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Phone (Ethiopia):</span>
                        <span className="text-emerald-400 font-bold">+251 91 123 4567</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-zinc-800">
                        <span>Email (Optional):</span>
                        <span className="text-amber-300">abebe@gmail.com</span>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] flex items-center justify-between">
                        <span>Verification Status:</span>
                        <span className="font-bold tracking-widest">🛡️ VERIFIED BADGE</span>
                      </div>
                    </div>
                  </div>
                )}

                {videoChapter === 1 && (
                  /* Scene 1: Login */
                  <div className="space-y-3 animate-fadeIn max-w-lg">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mx-auto shadow-lg shadow-blue-500/20">
                      <LogIn className="w-7 h-7" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-500/50 text-blue-300 font-mono text-xs font-bold">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ደረጃ 2፦ በስልክ ወይም ዩዘርኔም መግባት' : 'Step 2: Login With Phone or Username'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-left text-xs font-mono space-y-2 max-w-sm mx-auto shadow-inner">
                      <div className="p-2 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-between text-zinc-300">
                        <span>Login Identifier:</span>
                        <span className="text-[#E5B842] font-bold">0911234567 / @abebe</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-between text-zinc-300">
                        <span>Password:</span>
                        <span className="text-zinc-500">••••••••••••</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold text-center">
                        ✓ 2-Way Login Active (Phone or Username)
                      </div>
                    </div>
                  </div>
                )}

                {videoChapter === 2 && (
                  /* Scene 2: Deposit */
                  <div className="space-y-3 animate-fadeIn max-w-lg">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-[#E5B842] mx-auto shadow-lg shadow-amber-500/20">
                      <CreditCard className="w-7 h-7" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold">
                      <Coins className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span>{language === 'am' ? 'ደረጃ 3፦ በCBE / Telebirr ሒሳብ መሙላት' : 'Step 3: Deposit ETB Wallet Balance'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-left text-xs font-mono max-w-sm mx-auto">
                      <div className="p-2.5 rounded-xl bg-black/80 border border-amber-500/30">
                        <span className="text-[10px] text-zinc-400 block">Method:</span>
                        <span className="text-white font-bold">CBE / Telebirr</span>
                        <span className="text-[9px] text-emerald-400 block mt-1">Ref: ax28491</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/80 border border-emerald-500/30">
                        <span className="text-[10px] text-zinc-400 block">Receipt:</span>
                        <span className="text-emerald-300 font-bold">Uploaded (Slip)</span>
                        <span className="text-[9px] text-[#E5B842] block mt-1">Credited Instantly</span>
                      </div>
                    </div>
                  </div>
                )}

                {videoChapter === 3 && (
                  /* Scene 3: How to Bid */
                  <div className="space-y-3 animate-fadeIn max-w-lg">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 mx-auto shadow-lg shadow-purple-500/20">
                      <Target className="w-7 h-7" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 font-mono text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ደረጃ 4፦ ሚስጥራዊና ያልተደገመ ዋጋ መጫረት' : 'Step 4: Sealed Lowest Unique Reverse Bid'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/80 border border-zinc-800 text-xs font-mono space-y-1.5 max-w-sm mx-auto text-left shadow-inner">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Abebe & Selam bid:</span>
                        <span className="text-red-400 line-through">1.01 ETB (Duplicate ✕)</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-300 font-bold bg-emerald-950/60 p-1.5 rounded border border-emerald-500/40">
                        <span>Dawit bids:</span>
                        <span>1.04 ETB (Unique & Lowest ✓)</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Almaz bids:</span>
                        <span className="text-amber-400">1.09 ETB (Unique, higher)</span>
                      </div>
                    </div>
                  </div>
                )}

                {videoChapter === 4 && (
                  /* Scene 4: See Results & Win */
                  <div className="space-y-3 animate-fadeIn max-w-lg">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-[#E5B842] flex items-center justify-center text-[#E5B842] mx-auto shadow-xl shadow-[#E5B842]/20 animate-bounce">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-emerald-500/30 border border-[#E5B842] text-amber-300 font-mono text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span>{language === 'am' ? 'ደረጃ 5፦ 00:00:00 ቆጣሪ፣ ውጤት እና አሸናፊ!' : 'Step 5: 00:00:00 Countdown & Prize Delivery'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/60 via-black to-emerald-950/60 border border-[#E5B842]/60 text-xs max-w-sm mx-auto font-mono text-center">
                      <div className="text-white font-bold text-sm">
                        🎉 Dawit Won iPhone 16 Pro Max for 1.04 ETB!
                      </div>
                      <div className="text-[11px] text-emerald-300 mt-1">
                        100% Transparent Public Bid Ledger Revealed
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Bottom Playback HUD Bar */}
              <div className="relative z-10 pt-2 border-t border-zinc-800/80 space-y-2">
                {/* Progress bar */}
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="bg-gradient-to-r from-[#E5B842] via-amber-400 to-emerald-400 h-full transition-all duration-100 rounded-full"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>

                {/* Controls & Chapter Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-7 h-7 rounded-lg bg-[#E5B842] text-black font-bold flex items-center justify-center hover:bg-amber-400 transition-all cursor-pointer shadow"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setVideoProgress(0);
                        setVideoChapter(c => (c > 0 ? c - 1 : 4));
                      }}
                      className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                      title="Previous Chapter"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setVideoProgress(0);
                        setVideoChapter(c => (c + 1) % 5);
                      }}
                      className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                      title="Next Chapter"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-white font-serif ml-1">
                      {videoChapters[videoChapter].title}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 max-w-md truncate">
                    {videoChapters[videoChapter].summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Chapter Selection Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {videoChapters.map(chap => {
                const isSelected = videoChapter === chap.id;
                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      setVideoChapter(chap.id);
                      setVideoProgress(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#E5B842] text-black border-[#E5B842] font-bold shadow-lg'
                        : 'bg-[#151518] border-zinc-800 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase tracking-wider block opacity-75">
                      {chap.tag}
                    </span>
                    <span className="text-xs font-serif font-bold mt-1 line-clamp-1">
                      {chap.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 2: STEP BY STEP GUIDE */}
        {/* ======================================================== */}
        {viewMode === 'steps' && (
          <div className="space-y-4">
            {/* Steps Pills */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {videoChapters.map(s => {
                const isActive = activeStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isActive
                        ? 'bg-[#E5B842] text-black border-[#E5B842] font-bold shadow'
                        : 'bg-[#18181b] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono">Step {s.id + 1}</span>
                    <span className="text-[11px] truncate max-w-full font-serif hidden sm:block">
                      {s.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Content Box */}
            <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-4">
              {activeStep === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">
                        {language === 'am' ? '1. መመዝገብ እና የተረጋገጠ ባጅ ማግኘት' : '1. Register & Unlock Verified Profile Badge'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'ቀላል እና ፈጣን ምዝገባ በስልክ ቁጥር ወይም ዩዘርኔም'
                          : 'Simple and certified signup using Ethiopian telephone or username'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <span className="text-amber-400 font-bold block mb-1">1. Username & Password</span>
                      <p className="text-zinc-400 text-[11px]">
                        Choose any unique username to identify yourself in auctions.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <span className="text-emerald-400 font-bold block mb-1">2. Ethiopian Phone Number</span>
                      <p className="text-zinc-400 text-[11px]">
                        Enter +251 9... / 09... format to receive winner SMS & calls.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <span className="text-[#E5B842] font-bold block mb-1">3. Optional Email (Badge)</span>
                      <p className="text-zinc-400 text-[11px]">
                        Add email to automatically unlock the Gold & Emerald Verified badge on your profile.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <LogIn className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">
                        {language === 'am' ? '2. በስልክ ወይም በዩዘርኔም መግባት' : '2. Dual-Identifier Login (Username or Phone)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'በስልክ ቁጥርዎም ሆነ በዩዘርኔምዎ በቀላሉ መግባት ይችላሉ'
                          : 'Flexible login input allows username or Ethiopian phone interchangeably'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
                    {language === 'am'
                      ? 'ዩዘርኔምዎን ከረሱ እንኳን በሞባይል ስልክዎ (ለምሳሌ 0911234567 ወይም +251911234567) እና በይለፍ ቃልዎ ወዲያውኑ ወደ ሒሳብዎ መግባት ይችላሉ።'
                      : 'Never worry about forgetting your username! You can log in using either your Ethiopian mobile number (e.g. 0911234567 or +251911234567) or your username along with your password.'}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#E5B842]">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">
                        {language === 'am' ? '3. ሒሳብዎን በኢትዮጵያ ባንኮች ይሙሉ (Deposit)' : '3. Top Up Balance (CBE Birr & Telebirr)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'የግብይት ቁጥር ጥበቃ እና የደረሰኝ ስክሪንሾት ማረጋገጫ'
                          : 'Transaction reference verification and receipt upload'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                    <p>
                      {language === 'am'
                        ? '1. በCBE Birr ወይም Telebirr ወደተሰጠው የፕላትፎርም አካውንት ገንዘብ ያስተላልፉ።'
                        : '1. Transfer via CBE Birr, Telebirr, or Awash to our certified merchant account.'}
                    </p>
                    <p>
                      {language === 'am'
                        ? '2. የግብይት ቁጥርዎን (Ref Code) እና የደረሰኝ ስክሪንሾት በማያያዝ ያስገቡ።'
                        : '2. Enter the transaction code and attach your receipt screenshot.'}
                    </p>
                    <p className="text-amber-300 font-bold">
                      {language === 'am'
                        ? '3. ማሳሰቢያ፦ አንድ የግብይት ቁጥር ከ3 ጊዜ በላይ በስህተት እንዳይደገም ጥንቃቄ ያድርጉ (3 ጊዜ ተደግሞ ከገባ ሲስተሙ ለደህንነት ሲባል አካውንቱን ያግዳል)!'
                        : '3. Fraud Protection Notice: Submitting used or duplicate transaction references 3 times triggers an automatic fraud flag and alerts the Super Admin!'}
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">
                        {language === 'am' ? '4. ሚስጥራዊ የጨረታ ቀመር (Reverse Auction Formula)' : '4. How to Win (The Lowest Unique Bid)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'ያልተደገመና ዝቅተኛ የሆነ ዋጋ የሰጠ ሰው ያሸንፋል'
                          : 'The unique lowest bid placed by exactly one player claims the item'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                    <p>
                      {language === 'am'
                        ? '• ጨረታው በሚካሄድበት ወቅት የሌሎች ሰዎች ዋጋ አይታይም (ሙሉ ምስጢራዊነት)።'
                        : '• Reverse Auction Confidentiality: Bids remain strictly secret until the closing countdown.'}
                    </p>
                    <p>
                      {language === 'am'
                        ? '• ብልህ ስልት፦ የተለያዩ አነስተኛ ሳንቲሞችን (ለምሳሌ 1.03፣ 1.07፣ 1.12 ብር) በመስጠት ያልተደገመውን ዋጋ ያግኙ!'
                        : '• Smart Strategy: Place multiple bids across decimal intervals to reveal the sweet solitary spot!'}
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-[#E5B842] flex items-center justify-center text-[#E5B842]">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">
                        {language === 'am' ? '5. ውጤት ማየት እና ዕቃውን መረከብ' : '5. See Results & Claim Delivery'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'ቆጣሪው 00:00:00 ሲደርስ ሙሉው የጨረታ ሰንጠረዥ በይፋ ይፋ ይሆናል'
                          : 'Full transparent bid ladder revealed automatically when timer hits 00:00:00'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-xs text-emerald-200 space-y-2">
                    <p>
                      {language === 'am'
                        ? '1. ጨረታው ሲያልቅ የሁሉም ተጫዋቾች ዋጋ ከዝቅተኛ ወደ ከፍተኛ በይፋ ይዘረዘራል። ማን በምን ያህል ዋጋ እንዳሸነፈ በግልጽ ማየት ይቻላል።'
                        : '1. Instant public ladder: All bids are ranked from lowest to highest so anyone can independently audit the outcome.'}
                    </p>
                    <p>
                      {language === 'am'
                        ? '2. አሸናፊው በዳሽቦርዱ ላይ የዋንጫ አርማ ያገኛል፤ ኦፕሬተሮችም በስልክ ደውለው ዕቃውን በአዲስ አበባ ወይም በክልል ያስረክባሉ።'
                        : '2. The winning bidder sees a gold trophy badge on their dashboard and is contacted by operations for factory-sealed item dispatch.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 3: INTERACTIVE SANDBOX SIMULATOR */}
        {/* ======================================================== */}
        {viewMode === 'simulator' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141418] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#E5B842]" />
                    <span>{language === 'am' ? 'የቀጥታ ስሌት ሞካሪ (Real-Time Sandbox)' : 'Live Uniqueness Calculation Simulator'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {language === 'am'
                      ? 'የተለያዩ ዋጋዎችን አስገብተው የትኛው እንደሚደገም እና እንደሚያሸንፍ በቀጥታ ይሞክሩ'
                      : 'Experiment with decimal bid values to see how duplicates and lowest unique logic work in real time.'}
                  </p>
                </div>
                <button
                  onClick={handleResetSim}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{language === 'am' ? 'እንደገና ጀምር' : 'Reset'}</span>
                </button>
              </div>

              {/* Form to add test bid */}
              <form onSubmit={handleAddSimBid} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Bidder Name (ስም)"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842]"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Bid Amount in ETB (e.g. 1.02)"
                  value={testAmount}
                  onChange={e => setTestAmount(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842] font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
                >
                  {language === 'am' ? 'ጨረታ አስገባ' : 'Place Test Bid'}
                </button>
              </form>

              {/* Bids List */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {simBids.map(b => {
                  const amt = Number(b.amount.toFixed(2));
                  const count = amountCounts[amt];
                  const isUnique = count === 1;
                  const isWinner = isUnique && amt === winningAmount;

                  return (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                        isWinner
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold'
                          : !isUnique
                          ? 'bg-red-950/20 border-red-900/40 text-zinc-400'
                          : 'bg-black/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{b.name}</span>
                        <span className="font-mono text-zinc-400">{b.amount.toFixed(2)} ETB</span>
                      </div>

                      <div>
                        {isWinner ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'am' ? 'ያልተደገመ ዝቅተኛ (አሸናፊ!)' : 'Unique & Lowest (WINNER!)'}
                          </span>
                        ) : !isUnique ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3 h-3" />
                            {language === 'am' ? `ተደግሟል (${count} ሰዎች)` : `Duplicate (${count} bids)`}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                            {language === 'am' ? 'ያልተደገመ ግን ከፍተኛ' : 'Unique but higher'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">
                  {language === 'am' ? 'በአሁኑ ሰዓት አሸናፊ የሆነው ዋጋ፦' : 'Currently Winning Bid:'}{' '}
                  <strong className="text-emerald-400 text-sm">
                    {winningAmount !== null ? `${winningAmount.toFixed(2)} ETB` : 'No solitary bids'}
                  </strong>
                </span>
                <span className="text-zinc-500">{simBids.length} Total simulated bids</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('register');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#E5B842]" />
                <span>{language === 'am' ? 'አሁን ይመዝገቡ' : 'Register Now'}</span>
              </button>
            )}

            {onOpenDeposit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#E5B842] border border-[#E5B842]/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ሒሳብ ይሙሉ' : 'Deposit Balance'}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
          >
            {language === 'am' ? 'ጨረታዎችን ይመልከቱ' : 'Explore Live Auctions'}
          </button>
        </div>
      </div>
    </div>
  );
};
