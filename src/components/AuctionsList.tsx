import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Coins,
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Trophy,
  ShieldCheck,
  TrendingDown,
  Layers,
  Crown,
  Activity,
} from 'lucide-react';
import { Auction } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';

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
  const { language, t } = useTranslation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Requirement 6: Expanded auction categories (Accessories, Kitchen, Electronics, Vehicles, Luxury, Tech, Smartphones, Jewelry, Appliances)
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

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 5000);
    return () => clearInterval(interval);
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
    <div className="space-y-8 pb-12">
      {/* Luxury Hero Banner */}
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
            <div className="font-bold text-base sm:text-lg text-white font-mono mt-0.5">
              {activeAuctions.length} {language === 'am' ? 'በሂደት ላይ' : 'Active'}
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
            <div className="font-bold text-base sm:text-lg text-emerald-400 font-mono mt-0.5">
              {language === 'am' ? 'በኦዲት የተጠበቀ' : 'ACID Encrypted'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Category Pills with smooth horizontal scrolling */}
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
            placeholder={language === 'am' ? 'ዕቃዎችን፣ ሞዴሎችን ወይም ዝርዝር መረጃ ፈልግ...' : 'Search items, specs, luxury...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#E5B842]"
          />
        </div>
      </div>

      {/* Live Auctions Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">
          {language === 'am' ? 'የቀጥታ ጨረታዎች ዝርዝር በመጫን ላይ...' : 'Loading live auction catalog...'}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="py-16 px-6 text-center bg-gradient-to-b from-[#18181b]/80 to-[#121215] rounded-3xl border border-[#27272a] space-y-5 max-w-xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center mx-auto text-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.2)]">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-white text-lg">
              {language === 'am' ? 'ሁሉም ያለፉ ጨረታዎች ተጠናቀዋል!' : 'All Previous Auctions Concluded & Settled!'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              {language === 'am'
                ? 'የአሁኑ ዙር ጨረታዎች ተጠናቀዋል። ያለፉ አሸናፊዎችን፣ ያሸነፉበትን ዝቅተኛ ዋጋ እና የኦዲት መዝገብ ለማየት ወደ ማጠቃለያ ገጽ ይሂዱ።'
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
            const timeDiff = new Date(auc.end_time).getTime() - Date.now();
            const isUrgent = timeDiff > 0 && timeDiff < 30 * 60 * 1000; // < 30 mins

            const hours = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));
            const minutes = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));

            return (
              <div
                key={auc.id}
                id={`auction-card-${auc.id}`}
                onClick={() => onSelectAuction(auc.id)}
                className="group relative bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden hover:border-[#E5B842]/60 hover:shadow-[0_0_25px_rgba(229,184,66,0.15)] transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                  <img
                    src={auc.image_url}
                    alt={auc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />

                  {/* Category & Status Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#E5B842] border border-[#E5B842]/30 text-[10px] font-mono font-semibold uppercase">
                      {getCategoryLabel(auc.category)}
                    </span>
                  </div>

                  {/* Countdown Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md ${
                        isUrgent
                          ? 'bg-red-950/80 text-red-300 border border-red-500/50 animate-pulse'
                          : 'bg-black/80 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {hours > 0
                        ? `${hours}h ${minutes}m`
                        : language === 'am'
                        ? `${minutes} ደቂቃ ይቀራል`
                        : `${minutes}m remaining`}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-white text-base line-clamp-1 group-hover:text-[#E5B842] transition-colors">
                      {auc.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {auc.description}
                    </p>
                  </div>

                  {/* Pricing and fee bar */}
                  <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-zinc-500">
                        {language === 'am' ? 'የመሳተፊያ ክፍያ' : 'Participation Fee'}
                      </div>
                      <div className="font-mono font-bold text-[#E5B842] mt-0.5">
                        {auc.participation_fee} <span className="text-[10px] text-zinc-400">ETB</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">
                        {language === 'am' ? 'የገቡ ጨረታዎች' : 'Total Bids'}
                      </div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {auc.total_bids} {language === 'am' ? 'ጨረታ' : 'bids'}
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

                  {/* Action Button */}
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl border text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm font-semibold ${
                      isSuperAdmin
                        ? 'bg-purple-950/60 group-hover:bg-purple-600 border-purple-800/60 text-purple-200 group-hover:text-white'
                        : 'bg-[#18181b] group-hover:bg-[#E5B842] border-[#27272a] group-hover:border-[#E5B842] text-zinc-200 group-hover:text-black'
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
                    <ArrowRight className="w-3.5 h-3.5" />
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
