import React, { useState, useMemo } from 'react';
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
  Lock,
  Layers,
  Award,
  Users,
  UserPlus,
  LogIn,
  CreditCard,
  Target,
  Clock,
  Check,
  ChevronRight,
  CheckCheck,
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
  const { language } = useTranslation();
  const [viewMode, setViewMode] = useState<'steps' | 'simulator'>('steps');
  const [activeStep, setActiveStep] = useState<number>(0);

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

  const handleAddSimBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(testAmount);
    if (isNaN(val) || val <= 0) return;
    const newBid: SimBid = {
      id: Date.now().toString(),
      name: testName.trim() || 'You (አንተ)',
      amount: Math.round(val * 100) / 100,
    };
    setSimBids(prev => [...prev, newBid]);
  };

  const amountCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    simBids.forEach(b => {
      const amt = Number(b.amount.toFixed(2));
      counts[amt] = (counts[amt] || 0) + 1;
    });
    return counts;
  }, [simBids]);

  const winningAmount = useMemo(() => {
    const uniqueAmounts = Object.keys(amountCounts)
      .map(Number)
      .filter(amt => amountCounts[amt] === 1);
    if (uniqueAmounts.length === 0) return null;
    return Math.min(...uniqueAmounts);
  }, [amountCounts]);

  const stepsList = [
    {
      id: 0,
      tag: language === 'am' ? 'ምዝገባ' : 'REGISTER',
      title: language === 'am' ? '1. ፈጣን ምዝገባ እና የተረጋገጠ ፕሮፋይል' : '1. Instant Registration & Verified Profile',
      icon: UserPlus,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      summary:
        language === 'am'
          ? 'በስም እና በስልክ ቁጥር (+251 9...) ፈጣን ምዝገባ። 100% ነፃ እና ደህንነቱ የተጠበቀ!'
          : 'Register in seconds using Username and Ethiopian Phone (+251 9...). Instant verified badge unlocked.',
    },
    {
      id: 1,
      tag: language === 'am' ? 'መግቢያ' : 'LOGIN',
      title: language === 'am' ? '2. በስልክ ወይም በዩዘርኔም መግባት' : '2. Dual Login (Phone or Username)',
      icon: LogIn,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      summary:
        language === 'am'
          ? 'ዩዘርኔም ቢረሱም እንኳን በስልክ ቁጥርዎ እና በይለፍ ቃልዎ ወዲያውኑ መግባት ይችላሉ።'
          : 'Login seamlessly using either your Ethiopian mobile number or your unique username.',
    },
    {
      id: 2,
      tag: language === 'am' ? 'ተቀማጭ' : 'DEPOSIT',
      title: language === 'am' ? '3. በቴሌብር እና CBE ገንዘብ መሙላት' : '3. Deposit via Telebirr & CBE Birr',
      icon: Coins,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      summary:
        language === 'am'
          ? 'በቴሌብር ወይም በንግድ ባንክ ያስገቡ፤ የደረሰኝ ስክሪንሾት በማያያዝ በ2 ደቂቃ ውስጥ ሒሳብዎ ይሞላል።'
          : 'Top up via Telebirr, CBE Birr or Awash. Attach transfer screenshot and get credited in under 2 minutes.',
    },
    {
      id: 3,
      tag: language === 'am' ? 'ጨረታ' : 'BIDDING',
      title: language === 'am' ? '4. ሚስጥራዊ ዝቅተኛ ያልተደገመ ጨረታ' : '4. Lowest Unique Reverse Bidding',
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      summary:
        language === 'am'
          ? 'የተደገሙ ዋጋዎች ውድቅ ይሆናሉ! በአንድ ሰው ብቻ የተሰጠው ዝቅተኛው ሚስጥራዊ ዋጋ (ምሳሌ 1.04 ብር) ያሸንፋል።'
          : 'Duplicated bids cancel out! The single lowest bid placed by exactly one player claims the luxury prize.',
    },
    {
      id: 4,
      tag: language === 'am' ? 'ርክክብ' : 'VICTORY',
      title: language === 'am' ? '5. 00:00:00 ቆጣሪ እና የድል ርክክብ' : '5. Timer Expiry, Audit Ledger & Delivery',
      icon: Trophy,
      color: 'text-[#E5B842]',
      bgColor: 'bg-amber-500/15 border-[#E5B842]/40',
      summary:
        language === 'am'
          ? 'ቆጣሪው ሲያበቃ ሙሉው የጨረታ መዝገብ በይፋ ይገለጻል፤ አሸናፊው በስልክ ተጠርቶ አዲሱን ዕቃ በአድራሻው ይረከባል!'
          : 'When the timer hits 00:00:00, 100% transparent audit ledger is revealed and prize is dispatched!',
    },
  ];

  if (!isOpen) return null;

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
                  {language === 'am' ? 'የሚኒቢድ የተሟላ የአሠራር መመሪያ' : 'MiniBid Platform Guide & Mechanics'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-[#E5B842]/40 text-[#E5B842] text-[10px] font-mono font-bold uppercase">
                  {language === 'am' ? 'ይፋዊ መመሪያ' : 'Official Guide'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'am'
                  ? 'መመዝገብ፣ መግባት፣ ገንዘብ መሙላት፣ ሚስጥራዊ ጨረታ መስጠት እና ውጤት ማየት የሚችሉበት ግልጽ ማብራሪያ'
                  : 'Master registration, account login, wallet deposits, reverse auction tactics, and prize handover.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* View Mode Switcher: Step-by-Step & Sandbox Simulator */}
            <div className="flex items-center bg-[#18181b] p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
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
                <span>{language === 'am' ? 'የቀመር ሞካሪ' : 'Simulator'}</span>
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
        {/* VIEW MODE 1: STEP BY STEP COMPREHENSIVE VISUAL GUIDE */}
        {/* ======================================================== */}
        {viewMode === 'steps' && (
          <div className="space-y-5">
            {/* Steps Progress Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {stepsList.map(s => {
                const isActive = activeStep === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`py-2.5 px-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-[#E5B842] shadow-lg shadow-amber-950/40 text-white'
                        : 'bg-[#151518] border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#E5B842] text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-mono block opacity-75 leading-none">
                        Step {s.id + 1}
                      </span>
                      <span className="text-xs font-semibold truncate block mt-0.5">
                        {s.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Content Container */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-zinc-800 space-y-5 shadow-inner">
              {/* Step 0: Registration */}
              {activeStep === 0 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                        {language === 'am' ? 'ደረጃ 1፦ ፈጣን ምዝገባ እና የተረጋገጠ ፕሮፋይል ማግኘት' : 'Step 1: Instant Registration & Verified Account'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'ምንም ውስብስብ ፎርም ሳይሞሉ በስም እና በስልክ ቁጥር ብቻ በ30 ሰከንድ ውስጥ ይመዝገቡ'
                          : 'Simple, streamlined signup using your preferred username and Ethiopian mobile number'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/30 transition-all">
                      <span className="text-emerald-400 font-bold block mb-1">1. Username (መለያ ስም)</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {language === 'am'
                          ? 'በጨረታዎች ላይ እርስዎን የሚወክል ልዩ ስም ይምረጡ።'
                          : 'Choose any unique username to identify your account across live auctions.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/30 transition-all">
                      <span className="text-amber-400 font-bold block mb-1">2. Ethiopian Phone (+251)</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {language === 'am'
                          ? 'ሲያሸንፉ ኦፕሬተሮች በቀጥታ ደውለው እንዲያስረክቡዎት ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ።'
                          : 'Enter +251 9... / 09... format to receive winner SMS alerts and direct dispatch calls.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/30 transition-all">
                      <span className="text-[#E5B842] font-bold block mb-1">3. Instant Verified Badge</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {language === 'am'
                          ? 'ኢሜይል በማስገባት የተረጋገጠ የፕሮፋይል ባጅ ያግኙ፤ የደህንነት ማረጋገጫ ኮድ በቀጥታ ይደርስዎታል።'
                          : 'Optionally link your email to immediately unlock the gold & emerald verified user badge.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Dual Login */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                      <LogIn className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                        {language === 'am' ? 'ደረጃ 2፦ ተለዋዋጭ መግቢያ (በስልክ ወይም በዩዘርኔም)' : 'Step 2: Dual Login (Username or Mobile Phone)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'ዩዘርኔምዎን ቢረሱ እንኳን በሞባይል ስልክ ቁጥርዎ እና በይለፍ ቃልዎ ወዲያውኑ መግባት ይችላሉ'
                          : 'Never worry about forgetting your username — access your wallet from any device effortlessly'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200 leading-relaxed space-y-2">
                    <p className="font-semibold">
                      {language === 'am'
                        ? 'የመግቢያ ሳጥን ውስጥ ዩዘርኔምዎን (ምሳሌ፦ abe123) ወይም ስልክ ቁጥርዎን (ምሳሌ፦ 0911234567 ወይም +251911234567) ማስገባት ይችላሉ።'
                        : 'The login input automatically detects whether you typed an Ethiopian phone number or a username.'}
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      {language === 'am'
                        ? 'በዚህም ምክንያት ሁልጊዜም ወደ ሒሳብዎ በቀላሉ በመግባት ጨረታዎችን መከታተል እና ማሸነፍ ይችላሉ።'
                        : 'This guarantees 100% accessible authentication without being locked out.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Deposit via Telebirr & CBE */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#E5B842] shrink-0">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                        {language === 'am' ? 'ደረጃ 3፦ በቴሌብር እና በኢትዮጵያ ንግድ ባንክ ሒሳብ መሙላት' : 'Step 3: Instant Wallet Deposit (CBE Birr & Telebirr)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'የባንክ ማስተላለፊያ ደረሰኝ ስክሪንሾት በማያያዝ በኦፕሬተሮች ፈጣን ማረጋገጫ ያግኙ'
                          : 'Direct bank clearance with transfer reference verification and receipt audit'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>{language === 'am' ? 'የክፍያ መንገዶች' : 'Approved Payment Rails'}</span>
                      </div>
                      <ul className="space-y-1.5 text-zinc-300 text-[11px]">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Telebirr (ቴሌብር) — Instant Mobile Money</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Commercial Bank of Ethiopia (CBE / CBE Birr)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Awash Bank & Dashen Bank</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{language === 'am' ? 'የደህንነት እና የደረሰኝ ቁጥጥር' : 'Anti-Fraud Verification'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-300">
                        {language === 'am'
                          ? 'ገንዘቡን ካስተላለፉ በኋላ የግብይት ቁጥር (Transaction Ref) እና የደረሰኝ ስክሪንሾት ያስገቡ። ኦፕሬተሮች በ2 ደቂቃ ውስጥ አረጋግጠው ሒሳብዎን ይሞላሉ።'
                          : 'Enter your transaction code and upload the payment slip. Finance operators approve and credit your balance within 2 minutes.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Reverse Bidding Formula */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                        {language === 'am' ? 'ደረጃ 4፦ ሚስጥራዊ ዝቅተኛ ያልተደገመ ጨረታ ቀመር' : 'Step 4: The Lowest Unique Reverse Bidding Formula'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'የተደገሙ ዋጋዎች ውድቅ ይሆናሉ፤ በአንድ ሰው ብቻ የተሰጠው ዝቅተኛው ሚስጥራዊ ዋጋ ያሸንፋል!'
                          : 'Secret decimal bids: Duplicated amounts cancel out, solitary lowest bid takes the prize.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-2.5 rounded-lg bg-black/60 border border-red-500/40 text-red-300">
                        <strong className="block text-white font-mono text-xs">1.01 ETB</strong>
                        <span>2 ተጫዋቾች ሰጡ ❌ (ተደግሟል/ውድቅ)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 font-bold">
                        <strong className="block text-emerald-300 font-mono text-xs">1.04 ETB</strong>
                        <span>1 ተጫዋች ብቻ ሰጠ ✅ (ያልተደገመ ዝቅተኛ / አሸናፊ!)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/40 text-amber-300">
                        <strong className="block text-white font-mono text-xs">2.15 ETB</strong>
                        <span>1 ተጫዋች ሰጠ ⚠️ (ያልተደገመ ግን ከ1.04 የበለጠ)</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed pt-1">
                      {language === 'am'
                        ? 'ብልህ ስልት፦ ጨረታው በሚካሄድበት ወቅት የሌሎች ተጫዋቾች ዋጋ በሙሉ ሚስጥር ነው! ስለዚህ የተለያዩ አነስተኛ ሳንቲሞችን (ለምሳሌ 1.02፣ 1.04፣ 1.08 ብር) በመስጠት ያልተደገመውን የብቸኝነት ነጥብ ያግኙ።'
                        : 'Winning Strategy: Bids remain strictly encrypted until the closing countdown. Placing multiple decimal bids across intervals guarantees you discover solitary winning pockets!'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: 00:00:00 Timer & Victory */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-[#E5B842] flex items-center justify-center text-[#E5B842] shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                        {language === 'am' ? 'ደረጃ 5፦ 00:00:00 ቆጣሪ፣ ይፋዊ መዝገብ እና የዕቃ ርክክብ' : 'Step 5: Timer Expiry, Public Ledger & Official Handover'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {language === 'am'
                          ? 'ቆጣሪው ሲያበቃ የጨረታው ሙሉ መዝገብ ለህዝብ ይፋ ይሆናል፤ አሸናፊውም ዕቃውን ይረከባል'
                          : 'Auditable public bid ladder revealed automatically and items dispatched immediately'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-xs text-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCheck className="w-4 h-4" />
                      <span>{language === 'am' ? '100% ግልጽ እና ፍትሃዊ ውሳኔ' : '100% Transparent Proof'}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {language === 'am'
                        ? 'ጨረታው 00:00:00 ሲደርስ የሁሉም ተወዳዳሪዎች ዋጋ ከዝቅተኛ ወደ ከፍተኛ ተዘርዝሮ ይፋ ይሆናል። አሸናፊው በስልክ ተጠርቶ አዲሱን እቃ በቦታው ይረከባል ወይም ወደሚፈልጉት የኢትዮጵያ ክልል በነፃ ይላካል።'
                        : 'The second countdown ends, the complete encrypted bid record unlocks publicly. Every participant can verify the uniqueness count. The winner is contacted for factory-sealed prize delivery.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step Navigation Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'ወደኋላ' : 'Previous Step'}</span>
                </button>

                <div className="text-[11px] font-mono text-zinc-400">
                  {activeStep + 1} / {stepsList.length}
                </div>

                <button
                  disabled={activeStep === stepsList.length - 1}
                  onClick={() => setActiveStep(s => Math.min(stepsList.length - 1, s + 1))}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-black text-xs font-bold cursor-pointer transition-all shadow"
                >
                  <span>{language === 'am' ? 'ቀጣይ' : 'Next Step'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 2: INTERACTIVE LIVE FORMULA SIMULATOR */}
        {/* ======================================================== */}
        {viewMode === 'simulator' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-serif flex items-center gap-2">
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
                  className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{language === 'am' ? 'እንደገና ጀምር' : 'Reset Simulator'}</span>
                </button>
              </div>

              {/* Form to add test bid */}
              <form onSubmit={handleAddSimBid} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Bidder Name (ስም)"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842]"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Bid Amount in ETB (e.g. 1.02)"
                  value={testAmount}
                  onChange={e => setTestAmount(e.target.value)}
                  className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842] font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  {language === 'am' ? 'ጨረታ አስገባ' : 'Place Test Bid'}
                </button>
              </form>

              {/* Simulated Bids Ladder */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {simBids.map(b => {
                  const amt = Number(b.amount.toFixed(2));
                  const count = amountCounts[amt];
                  const isUnique = count === 1;
                  const isWinner = isUnique && amt === winningAmount;

                  return (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs transition-all ${
                        isWinner
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold shadow-md shadow-emerald-950/50'
                          : !isUnique
                          ? 'bg-red-950/20 border-red-900/40 text-zinc-400'
                          : 'bg-black/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white">{b.name}</span>
                        <span className="font-mono text-zinc-400 font-bold">{b.amount.toFixed(2)} ETB</span>
                      </div>

                      <div>
                        {isWinner ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shadow">
                            <CheckCircle2 className="w-3.5 h-3.5" />
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono pt-3 border-t border-zinc-800">
                <span className="text-zinc-400">
                  {language === 'am' ? 'በአሁኑ ሰዓት አሸናፊ የሆነው ዋጋ፦' : 'Currently Winning Bid:'}{' '}
                  <strong className="text-emerald-400 text-sm ml-1">
                    {winningAmount !== null ? `${winningAmount.toFixed(2)} ETB` : 'No solitary bids'}
                  </strong>
                </span>
                <span className="text-zinc-500">{simBids.length} Total simulated test bids</span>
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
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
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
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#E5B842] border border-[#E5B842]/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ሒሳብ ይሙሉ' : 'Deposit Balance'}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5B842] via-amber-400 to-[#D4AF37] hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/50"
          >
            {language === 'am' ? 'ጨረታዎችን ይመልከቱ' : 'Explore Live Auctions'}
          </button>
        </div>
      </div>
    </div>
  );
};
