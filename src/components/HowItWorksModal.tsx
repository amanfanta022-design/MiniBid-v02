import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useTranslation } from '../utils/i18n.js';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit?: () => void;
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
}) => {
  const { language, t } = useTranslation();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

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

  // Auto-play steps
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen, isAutoPlaying]);

  if (!isOpen) return null;

  // Calculate uniqueness in simulator
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

  const steps = [
    {
      id: 0,
      icon: <Coins className="w-5 h-5 text-[#E5B842]" />,
      badge: language === 'am' ? 'ደረጃ 1' : 'STEP 1',
      title: language === 'am' ? 'ሒሳብዎን ይሙሉ (Deposit ETB)' : 'Deposit ETB to Your Wallet',
      subtitle:
        language === 'am'
          ? 'በCBE Birr፣ Telebirr፣ ወይም Awash Bank ገንዘብ ያስገቡ። ጥያቄዎ ካልፀደቀ እስከ 3 ጊዜ ድረስ በድጋሚ መጠቀም ይችላሉ።'
          : 'Top up using CBE Birr, Telebirr, or Awash Bank. If unapproved, retry up to 3 times with full safety.',
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#18181b] border border-amber-500/30 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-[#E5B842] mb-2 font-black font-mono">
                CBE
              </div>
              <span className="text-xs font-bold text-white">Commercial Bank</span>
              <span className="text-[10px] text-zinc-400 mt-1">Mobile Banking & CBE Birr</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#18181b] border border-blue-500/30 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2 font-black font-mono">
                TB
              </div>
              <span className="text-xs font-bold text-white">Telebirr SuperApp</span>
              <span className="text-[10px] text-zinc-400 mt-1">Instant SMS & Ref Code</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#18181b] border border-emerald-500/30 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 font-black font-mono">
                AWB
              </div>
              <span className="text-xs font-bold text-white">Awash & Dashen</span>
              <span className="text-[10px] text-zinc-400 mt-1">Bank Branch / Internet</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#E5B842] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {language === 'am'
                ? 'የግብይት ቁጥር ጥበቃ፦ ጥያቄዎ በአስተዳዳሪው ገና ካልፀደቀ እስከ 3 ጊዜ ድረስ ማስገባት ይችላሉ። አስተዳዳሪው ካፀደቀው ግን ያ የግብይት ቁጥር በማንም ዳግም ጥቅም ላይ ሊውል አይችልም!'
                : 'Transaction Integrity Rule: If your deposit is not yet approved, you can retry using the transaction code up to 3 times. Once approved, it is locked permanently and cannot be reused by anyone!'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      icon: <Lock className="w-5 h-5 text-blue-400" />,
      badge: language === 'am' ? 'ደረጃ 2' : 'STEP 2',
      title: language === 'am' ? 'ሚስጥራዊ ጨረታ ይጫረቱ (Secret Bids)' : 'Place Sealed, Secret Bids',
      subtitle:
        language === 'am'
          ? 'እያንዳንዱ ጨረታ አነስተኛ የመሳተፊያ ክፍያ (ለምሳሌ 30 ብር) አለው። የጨረታው ዋጋ ከ 1.00 ብር ጀምሮ ማንኛውም ቁጥር ሊሆን ይችላል።'
          : 'Each bid incurs a nominal fixed participation fee (e.g. 30 ETB). Your bid amount can be any decimal starting from 1.00 ETB.',
      details: (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#18181b] border border-blue-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-300">
                {language === 'am' ? 'የጨረታ ምስጢራዊነት' : 'Sealed Vault Architecture'}
              </span>
              <p className="text-[11px] text-zinc-400">
                {language === 'am'
                  ? 'ጨረታው እስከሚጠናቀቅ ድረስ ማንም ሰው የሌሎችን ተወዳዳሪዎች የዋጋ መጠን ማየት አይችልም። አስተዳዳሪዎችም ቢሆኑ ጨዋታው እስኪያበቃ ድረስ ማየት አይችሉም!'
                  : 'Bids remain cryptographically sealed. Even admins cannot view bidder distribution until countdown expires.'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-mono font-bold text-xs">
              SEALED
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] font-mono uppercase">Starting Bid</span>
              <strong className="text-white font-mono text-sm">1.00 ETB +</strong>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] font-mono uppercase">Precision</span>
              <strong className="text-[#E5B842] font-mono text-sm">0.01 Cents</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      badge: language === 'am' ? 'ደረጃ 3' : 'STEP 3',
      title: language === 'am' ? 'ያልተደገመ ዝቅተኛው ያሸንፋል (The Golden Rule)' : 'The Lowest Unique Bid Formula',
      subtitle:
        language === 'am'
          ? 'ሁለት ወይም ከዚያ በላይ ሰዎች አንድ አይነት ዋጋ ከሰጡ ውድቅ ይሆናሉ! ዝቅተኛ ሆኖ በአንድ ሰው ብቻ የተሰጠው ዋጋ ያሸንፋል።'
          : 'If two or more bidders offer the identical value, they cancel each other out! The lowest bid placed by exactly ONE bidder wins.',
      details: (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#18181b] border border-amber-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-xs font-mono">
              <span className="text-zinc-400">Sample Scenario Comparison</span>
              <span className="text-[#E5B842]">Live Formula</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/20 border border-red-800/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px]">
                    ✕
                  </span>
                  <span className="font-mono text-white">1.01 ETB</span>
                  <span className="text-zinc-400 text-[11px]">(2 Bidders: Abebe & Selam)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px]">
                  DUPLICATE - CANNOT WIN
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/60 text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">1.04 ETB</span>
                  <span className="text-zinc-300 text-[11px]">(1 Bidder: Dawit)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold font-mono text-[10px] flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> WINNER!
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-[10px]">
                    •
                  </span>
                  <span className="font-mono text-zinc-300">1.09 ETB</span>
                  <span className="text-zinc-400 text-[11px]">(1 Bidder: Almaz)</span>
                </div>
                <span className="text-amber-400 text-[10px] font-mono">Unique but higher than 1.04</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      badge: language === 'am' ? 'ደረጃ 4' : 'STEP 4',
      title: language === 'am' ? 'የጨረታ ማስመሰያ (Interactive Simulator)' : 'Live Strategy Simulator',
      subtitle:
        language === 'am'
          ? 'ከዚህ በታች አዳዲስ ዋጋዎችን በማስገባት ማን እንደሚያሸንፍ እና ውድቅ እንደሚሆን በቀጥታ ይሞክሩ!'
          : 'Test real-time uniqueness calculations by adding custom bids in our sandbox engine below.',
      details: null, // Will render the interactive sandbox
    },
    {
      id: 4,
      icon: <Trophy className="w-5 h-5 text-[#E5B842]" />,
      badge: language === 'am' ? 'ደረጃ 5' : 'STEP 5',
      title: language === 'am' ? 'ዕቃዎን መረከብ እና ማረጋገጫ' : 'Winning Notification & Claim',
      subtitle:
        language === 'am'
          ? 'ሲያሸንፉ በዳሽቦርድዎ ላይ ወዲያውኑ የዋንጫ አርማ ይታያል! ኦፕሬሽኖቻችን በስልክዎ አድራሻ በመደወል ዕቃዎን ያስረክቡዎታል።'
          : 'When you win, a prominent gold Trophy banner instantly appears on your dashboard. Operations contacts your phone for instant item dispatch.',
      details: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-[#E5B842]/20 border border-[#E5B842] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E5B842] text-black flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-sm">
                {language === 'am' ? 'እንኳን ደስ አለዎት! አሸንፈዋል' : 'Instant Winner Dashboard Banner'}
              </h4>
              <p className="text-xs text-amber-200 mt-0.5">
                {language === 'am'
                  ? 'ያሸነፏቸውን ዕቃዎች ዝርዝር፣ የከፈሉትን አነስተኛ ዋጋ እና የርክክብ ሁኔታ በዳሽቦርድዎ "ያሸነፏቸው" ገጽ ላይ መከታተል ይችላሉ።'
                  : 'Your dashboard prominently displays all won items, settled tiny prices, and official delivery verification codes.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Location</span>
              <strong className="text-white">Addis Ababa & Nationwide</strong>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Warranty</span>
              <strong className="text-emerald-400">100% Factory Sealed</strong>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-zinc-100 my-auto sm:my-8 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#121215] rounded-[9px] flex items-center justify-center text-[#E5B842]">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>{language === 'am' ? 'ጨዋታው እንዴት ይሰራል?' : 'How MiniBid Reverse Auctions Work'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40">
                  {language === 'am' ? 'የተሟላ መመሪያ' : 'Official Guide'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                {language === 'am'
                  ? 'የኢትዮጵያ የመጀመሪያው በሒሳባዊ ያልተደገመ ዝቅተኛ ዋጋ የሚሰራ የጨረታ ፕላትፎርም'
                  : 'Ethiopia’s lowest unique price reverse-auction platform with ACID auditability'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                isAutoPlaying
                  ? 'bg-amber-500/20 text-[#E5B842] border-[#E5B842]'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
              }`}
              title="Toggle Auto-Play Walkthrough"
            >
              {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isAutoPlaying ? 'Auto' : 'Play'}</span>
            </button>

            <button
              id="close-how-it-works-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-6">
          {steps.map(s => {
            const isActive = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveStep(s.id);
                  setIsAutoPlaying(false);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isActive
                    ? 'bg-[#E5B842] text-black border-[#E5B842] font-bold shadow-md'
                    : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="text-[10px] font-mono tracking-wider">{s.badge}</span>
                <span className="text-[11px] truncate max-w-full font-serif hidden sm:block">
                  {s.id === 0
                    ? language === 'am' ? 'መሙላት' : 'Deposit'
                    : s.id === 1
                    ? language === 'am' ? 'ሚስጥር' : 'Sealed'
                    : s.id === 2
                    ? language === 'am' ? 'ቀመር' : 'Formula'
                    : s.id === 3
                    ? language === 'am' ? 'ሞካሪ' : 'Simulator'
                    : language === 'am' ? 'ማሸነፍ' : 'Claim'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Content */}
        <div className="bg-[#151518] border border-[#27272a] rounded-2xl p-4 sm:p-6 mb-6 relative overflow-hidden transition-all animate-fadeIn">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 shrink-0">
              {steps[activeStep].icon}
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#E5B842] uppercase tracking-wider block">
                {steps[activeStep].badge}
              </span>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                {steps[activeStep].title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                {steps[activeStep].subtitle}
              </p>
            </div>
          </div>

          {/* Render Step Details or Simulator */}
          {activeStep !== 3 ? (
            steps[activeStep].details
          ) : (
            /* Step 3: Interactive Sandbox Simulator */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  {language === 'am' ? 'የቀጥታ ስሌት ሞካሪ (Sandbox Engine)' : 'Real-Time Dynamic Uniqueness Engine'}
                </span>
                <button
                  onClick={handleResetSim}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{language === 'am' ? 'እንደገና ጀምር' : 'Reset'}</span>
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleAddSimBid} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Bidder Name (ስም)"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842]"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Bid Amount (ETB, e.g. 1.02)"
                  value={testAmount}
                  onChange={e => setTestAmount(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842] font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {language === 'am' ? 'ጨረታ አስገባ' : 'Test Bid'}
                </button>
              </form>

              {/* Feed of Bids */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {simBids.map(b => {
                  const amt = Number(b.amount.toFixed(2));
                  const count = amountCounts[amt];
                  const isUnique = count === 1;
                  const isWinner = isUnique && amt === winningAmount;

                  return (
                    <div
                      key={b.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all ${
                        isWinner
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold'
                          : !isUnique
                          ? 'bg-red-950/20 border-red-900/40 text-zinc-400'
                          : 'bg-[#18181b] border-[#27272a] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{b.name}</span>
                        <span className="font-mono text-zinc-400">{b.amount.toFixed(2)} ETB</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isWinner ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'am' ? 'ያልተደገመ ዝቅተኛ (አሸናፊ!)' : 'Unique & Lowest (Winning!)'}
                          </span>
                        ) : !isUnique ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3 h-3" />
                            {language === 'am' ? `ተደግሟል (${count} ሰዎች)` : `Duplicate (${count} bidders)`}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                            {language === 'am' ? 'ያልተደገመ ግን ከፍተኛ' : 'Unique but not lowest'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#27272a]">
                <span className="text-zinc-400">
                  {language === 'am' ? 'አሸናፊው ዋጋ፦' : 'Current Winning Price:'}{' '}
                  <strong className="text-[#E5B842]">
                    {winningAmount !== null ? `${winningAmount.toFixed(2)} ETB` : 'No unique bids'}
                  </strong>
                </span>
                <span className="text-zinc-500">{simBids.length} Total simulated bids</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={activeStep === 0}
              onClick={() => {
                setActiveStep(prev => Math.max(0, prev - 1));
                setIsAutoPlaying(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'am' ? 'ወደኋላ' : 'Previous'}</span>
            </button>

            <button
              disabled={activeStep === steps.length - 1}
              onClick={() => {
                setActiveStep(prev => Math.min(steps.length - 1, prev + 1));
                setIsAutoPlaying(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{language === 'am' ? 'ቀጣይ' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDeposit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#E5B842] border border-[#E5B842]/40 text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'am' ? 'ሒሳብ ይሙሉ' : 'Deposit Now'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            >
              {language === 'am' ? 'ጨረታዎችን ይመልከቱ' : 'Explore Live Auctions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
