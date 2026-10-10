import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Coins,
  Search,
  Sparkles,
  ArrowRight,
  Trophy,
  ShieldCheck,
  TrendingDown,
  Layers,
  Crown,
  Activity,
  Zap,
  Radio,
  CheckCircle2,
  Wallet,
  Smartphone,
  Tag,
} from 'lucide-react';
import { Auction } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import { calculateTimeRemaining } from '../utils/timer.js';

interface AuctionsListProps {
  onSelectAuction: (id: string) => void;
  onOpenHowItWorks: () => void;
  onOpenDeposit: () => void;
  onViewWinners?: () => void;
}

export const AuctionsList: React.FC<AuctionsListProps> = ({
  onSelectAuction,
  onOpenHowItWorks,
  onOpenDeposit,
  onViewWinners,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isCustomer = user && user.role === 'customer';
  const { language } = useTranslation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Expanded categories
  const categories = [
    'All',
    'Accessories',
    'Kitchen',
    'Electronics',
    'Vehicles',
    'Luxury',
    'Tech',
    'Smartphones',
    'Jewelry',
    'Appliances',
  ];

  const fetchAuctions = async () => {
    try {
      const res = await fetch('/api/auctions');
      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const [, setClockTick] = useState(0);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 5000);
    const clockInterval = setInterval(() => setClockTick(p => p + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const activeAuctions = auctions.filter(a => a.status === 'active');

  const getCategoryLabel = (cat: string) => {
    if (language !== 'am') return cat;
    const amMap: Record<string, string> = {
      All: 'ሁሉም',
      Accessories: 'መለዋወጫዎች',
      Kitchen: 'የወጥ ቤት ዕቃዎች',
      Electronics: 'ኤሌክትሮኒክስ',
      Vehicles: 'ተሽከርካሪዎች',
      Luxury: 'የቅንጦት ዕቃዎች',
      Tech: 'ቴክኖሎጂ',
      Smartphones: 'ስልኮች',
      Gaming: 'ጌሚንግ',
      Fashion: 'ፋሽን',
      Jewelry: 'ወርቅና ጌጣጌጥ',
      Appliances: 'የቤት ዕቃዎች',
      Collectibles: 'ስብስቦች',
    };
    return amMap[cat] || cat;
  };

  const filteredAuctions = activeAuctions.filter(a => {
    const matchesCat = selectedCategory === 'All' || a.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 1. Real-time Live Actuation Ticker Ribbon */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#101014] to-emerald-950/80 border border-emerald-500/40 p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20 overflow-hidden">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{language === 'am' ? 'የቀጥታ ስራ ላይ ያለ ዙር (Live Actuation)' : 'Live Actuation Active'}</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-zinc-300 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-emerald-200">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>0.01 ETB Unique Bid Increments</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">
            {language === 'am' ? 'ፈጣን የቴሌብር እና ንግድ ባንክ ተቀማጭ ክፍት ነው' : 'CBE & Telebirr Instant Deposits Active'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[#E5B842] font-semibold">
            {language === 'am' ? 'በሂሳብ የተረጋገጠ ብቸኛ አሸናፊ' : 'Mathematically Proven Lowest Unique Winner'}
          </span>
        </div>

        <button
          onClick={onOpenHowItWorks}
          className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0 cursor-pointer"
        >
          {language === 'am' ? 'ህጎችን እይ →' : 'Game Rules →'}
        </button>
      </div>

      {/* 2. Customer VIP Dashboard Hub (Shown when user is authenticated) */}
      {isCustomer && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#16161c] via-[#121217] to-[#16161c] border border-amber-500/30 shadow-xl shadow-amber-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#E5B842]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  {language === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome Back'},
                </span>
                <span className="font-serif font-black text-white text-base sm:text-lg">
                  @{user.username}
                </span>
                {user.email_verified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Badge</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#E5B842]" />
                    <span>Player</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {language === 'am'
                  ? 'ዝቅተኛ ያልተደገመ ዋጋ በማስገባት የቅንጦት ዕቃዎችን ያሸንፉ።'
                  : 'Submit mathematical lowest unique bids to win high-end electronics, luxury watches, and gold.'}
              </p>
            </div>

            {/* Wallet & Quick Top-Up HUD */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 px-4 rounded-2xl bg-black/60 border border-[#27272a] flex items-center gap-3 shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center text-[#E5B842]">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono text-zinc-500">
                    {language === 'am' ? 'የኪስ ቀሪ ሒሳብ' : 'Gaming Wallet'}
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-[#E5B842] tabular-nums">
                    {(user.wallet_balance || 0).toLocaleString()} <span className="text-xs text-zinc-400">ETB</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenDeposit}
                className="px-4 py-3 rounded-2xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/40 flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                <span>{language === 'am' ? 'ተቀማጭ ጨምር' : 'Deposit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Luxury Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#27272a] bg-gradient-to-br from-[#121215] via-[#0d0d10] to-[#09090b] p-5 sm:p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E5B842]/10 via-[#d4af37]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-[11px] sm:text-xs font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'ዝቅተኛ ያልተደገመ የጨረታ ሥርዓት' : 'Lowest Unique Bid Architecture'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-white leading-tight">
            {language === 'am' ? (
              <>
                የቅንጦት ዕቃዎችን፣ ወርቅ እና ስልኮችን{' '}
                <span className="text-[#E5B842] underline decoration-[#E5B842]/40">በጥቂት ሳንቲሞች</span> ያሸንፉ!
              </>
            ) : (
              <>
                Win Luxury Tech, Gold & Watches for{' '}
                <span className="text-[#E5B842] underline decoration-[#E5B842]/40">Pocket Change</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
            {language === 'am'
              ? 'ሚኒቢድ የተለመደውን የጨረታ አሠራር ይለውጣል፦ ሚስጥራዊ ጨረታዎች፣ በሂሳብ የተረጋገጠ ልዩነት እና የተረጋገጠ ደህንነት። ማንም ያልደገመውን ዝቅተኛ ዋጋ ያስገቡና ዕቃውን ያሸንፉ!'
              : 'MiniBid turns ordinary auction dynamics upside down: hidden bids, mathematical uniqueness, and guaranteed financial auditability. Submit the lowest bid that nobody else duplicated to claim the prize.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
            <button
              id="hero-how-it-works-btn"
              onClick={onOpenHowItWorks}
              className="px-5 py-3 sm:py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(229,184,66,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{language === 'am' ? 'እንዴት እንደሚሰራ ይመልከቱ' : 'See How It Works'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="hero-deposit-btn"
              onClick={onOpenDeposit}
              className="px-5 py-3 sm:py-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 font-semibold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Coins className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>{language === 'am' ? 'ቀሪ ሒሳብ ጨምር' : 'Top Up Wallet'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#27272a]/70 text-xs">
          <div>
            <div className="text-zinc-500 font-mono text-[10px] sm:text-[11px] uppercase">
              {language === 'am' ? 'ቀጥታ ጨረታዎች' : 'Live Auctions'}
            </div>
            <div className="font-bold text-base sm:text-lg text-white font-mono mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeAuctions.length} {language === 'am' ? 'በሂደት ላይ' : 'Active'}</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-500 font-mono text-[10px] sm:text-[11px] uppercase">
              {language === 'am' ? 'ጠቅላላ ጨረታዎች' : 'Total Bids Placed'}
            </div>
            <div className="font-bold text-base sm:text-lg text-[#E5B842] font-mono mt-0.5">
              {activeAuctions.reduce((acc, a) => acc + a.total_bids, 0)} {language === 'am' ? 'ጨረታዎች' : 'Bids'}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 font-mono text-[10px] sm:text-[11px] uppercase">
              {language === 'am' ? 'የክፍያ መንገዶች' : 'Payment Rails'}
            </div>
            <div className="font-bold text-base sm:text-lg text-white font-mono mt-0.5">
              {language === 'am' ? 'ንግድ ባንክ እና ቴሌብር' : 'CBE & Telebirr'}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 font-mono text-[10px] sm:text-[11px] uppercase">
              {language === 'am' ? 'የደህንነት ደረጃ' : 'Security Standard'}
            </div>
            <div className="font-bold text-base sm:text-lg text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'am' ? 'በኦዲት የተጠበቀ' : 'ACID Audited'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`cat-filter-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E5B842] text-black font-semibold shadow-sm'
                    : 'bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={language === 'am' ? 'ዕቃዎችን፣ ሞዴሎችን ፈልግ...' : 'Search items, luxury specs...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#E5B842]"
          />
        </div>
      </div>

      {/* 5. Live Auctions Grid with Green Flick Actuation Lights */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-mono">
          {language === 'am' ? 'የቀጥታ ጨረታዎች ዝርዝር በመጫን ላይ...' : 'Loading live auction catalog...'}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="py-16 px-6 text-center bg-gradient-to-b from-[#18181b]/80 to-[#121215] rounded-3xl border border-[#27272a] space-y-5 max-w-xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center mx-auto text-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.2)]">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-white text-lg">
              {language === 'am' ? 'አሁን ምንም ንቁ ጨረታ የለም' : 'No Active Auctions In Round'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              {language === 'am'
                ? 'የዚህ ዙር ጨረታዎች ተጠናቀዋል። ቀደም ሲል ያለቁ ጨረታዎችንና አሸናፊዎችን ይመልከቱ።'
                : 'Our active auction round has completed. Explore our Concluded Auctions Showcase to inspect previous winning bids, audited uniqueness rankings, and player logs.'}
            </p>
          </div>
          {onViewWinners && (
            <button
              onClick={onViewWinners}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              <span>{language === 'am' ? 'ያለፉ ጨረታዎችንና አሸናፊዎችን ይመልከቱ' : 'View Concluded Auctions & Winners'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map(auc => {
            const timer = calculateTimeRemaining(auc.end_time);

            return (
              <div
                key={auc.id}
                id={`auction-card-${auc.id}`}
                onClick={() => onSelectAuction(auc.id)}
                className="group relative bg-[#121215] border border-[#27272a] hover:border-emerald-500/70 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Container with Visual Overlays */}
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                  <img
                    src={auc.image_url}
                    alt={auc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />

                  {/* GREEN FLICK LIVE ACTUATION INDICATOR (Pulsing Beacon) */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider uppercase">
                      Live Actuation
                    </span>
                  </div>

                  {/* Requirement 2: Countdown Badge with Live Days, Hours, Minutes, and Seconds */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
                        timer.isUrgent
                          ? 'bg-red-950/90 text-red-300 border border-red-500/70 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                          : 'bg-black/85 text-amber-300 border border-amber-500/40'
                      }`}
                      title={language === 'am' ? 'የጨረታው ማብቂያ ቆጣሪ' : 'Live Auction Countdown Timer'}
                    >
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{timer.formatted}</span>
                    </span>
                  </div>

                  {/* Category Pill Tag */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#E5B842] border border-[#E5B842]/30 text-[10px] font-mono font-semibold uppercase">
                      {getCategoryLabel(auc.category)}
                    </span>
                  </div>

                  {/* Retail Value Discount Hint */}
                  {auc.start_price > 0 && (
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono text-[9px] font-bold">
                        Retail: {auc.start_price.toLocaleString()} ETB
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-white text-base line-clamp-1 group-hover:text-[#E5B842] transition-colors">
                      {auc.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {auc.description}
                    </p>
                  </div>

                  {/* Pricing and Participation Fee Bar */}
                  <div className="p-3 rounded-2xl bg-[#16161b] border border-[#27272a] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#E5B842]" />
                        <span>{language === 'am' ? 'የመሳተፊያ ክፍያ' : 'Fee per Bid'}</span>
                      </div>
                      <div className="font-mono font-bold text-[#E5B842] text-sm mt-0.5">
                        {auc.participation_fee} <span className="text-[10px] text-zinc-400">ETB</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-zinc-500 flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{language === 'am' ? 'የገቡ ጨረታዎች' : 'Total Bids'}</span>
                      </div>
                      <div className="font-mono font-bold text-white text-sm mt-0.5">
                        {auc.total_bids} <span className="text-[10px] text-zinc-400">{language === 'am' ? 'ጨረታ' : 'bids'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Super Admin Live Tracking Strip (Super Admin Only) */}
                  {isSuperAdmin && auc.superadmin_live_overview && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-purple-300 font-bold flex items-center gap-1 uppercase">
                          <Crown className="w-3 h-3 text-emerald-400" />
                          {language === 'am' ? 'የቀጥታ አሸናፊ ዋጋ:' : 'Live Leading:'}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {auc.superadmin_live_overview.currently_winning_bid_amount !== null
                            ? `${auc.superadmin_live_overview.currently_winning_bid_amount.toFixed(2)} ETB`
                            : language === 'am'
                            ? 'የለም (ተደግሟል)'
                            : 'None (Tied)'}
                        </span>
                      </div>
                      {auc.superadmin_live_overview.currently_winning_username && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5 border-t border-purple-900/40">
                          <span className="text-white">@{auc.superadmin_live_overview.currently_winning_username}</span>
                          <span className="text-[#E5B842]">{auc.superadmin_live_overview.currently_winning_phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action CTA Button with Live Actuation Flare */}
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm font-bold cursor-pointer ${
                      isSuperAdmin
                        ? 'bg-purple-950/70 group-hover:bg-purple-600 border border-purple-800/60 text-purple-200 group-hover:text-white'
                        : 'bg-[#18181b] group-hover:bg-emerald-600 border border-[#27272a] group-hover:border-emerald-500 text-zinc-200 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    }`}
                  >
                    <span>
                      {isSuperAdmin
                        ? language === 'am'
                          ? 'የቀጥታ ጨዋታውንና ዋጋዎችን ተቆጣጠር'
                          : 'Inspect Live Game & Track Bids'
                        : language === 'am'
                        ? 'ዝቅተኛ ያልተደገመ ዋጋ አስገባ'
                        : 'Place Lowest Unique Bid'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
