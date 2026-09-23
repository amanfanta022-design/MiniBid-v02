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
} from 'lucide-react';
import { Auction } from '../types.js';

interface AuctionsListProps {
  onSelectAuction: (id: string) => void;
  onOpenHowItWorks: () => void;
  onOpenDeposit: () => void;
}

export const AuctionsList: React.FC<AuctionsListProps> = ({
  onSelectAuction,
  onOpenHowItWorks,
  onOpenDeposit,
}) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'Tech', 'Luxury', 'Jewelry', 'Vehicles', 'Appliances'];

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
      <div className="relative rounded-3xl overflow-hidden border border-[#27272a] bg-gradient-to-br from-[#121215] via-[#0d0d10] to-[#09090b] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E5B842]/10 via-[#d4af37]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-xs font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Lowest Unique Bid Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight text-white leading-tight">
            Win Luxury Tech, Gold & Watches for <span className="text-[#E5B842] underline decoration-[#E5B842]/40">Pocket Change</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            MiniBid turns ordinary auction dynamics upside down: hidden bids, mathematical uniqueness, and guaranteed financial auditability.
            Submit the lowest bid that nobody else duplicated to claim the prize.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-how-it-works-btn"
              onClick={onOpenHowItWorks}
              className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(229,184,66,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="hero-deposit-btn"
              onClick={onOpenDeposit}
              className="px-5 py-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 font-semibold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              <Coins className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>Top Up Wallet</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[#27272a]/70 text-xs">
          <div>
            <div className="text-zinc-500 font-mono text-[11px] uppercase">Live Auctions</div>
            <div className="font-bold text-lg text-white font-mono mt-0.5">{activeAuctions.length} Active</div>
          </div>
          <div>
            <div className="text-zinc-500 font-mono text-[11px] uppercase">Total Bids Placed</div>
            <div className="font-bold text-lg text-[#E5B842] font-mono mt-0.5">
              {activeAuctions.reduce((acc, a) => acc + a.total_bids, 0)} Bids
            </div>
          </div>
          <div>
            <div className="text-zinc-500 font-mono text-[11px] uppercase">Payment Rails</div>
            <div className="font-bold text-lg text-white font-mono mt-0.5">CBE & Telebirr</div>
          </div>
          <div>
            <div className="text-zinc-500 font-mono text-[11px] uppercase">Security Standard</div>
            <div className="font-bold text-lg text-emerald-400 font-mono mt-0.5">ACID Encrypted</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search items, specs, luxury..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#E5B842]"
          />
        </div>
      </div>

      {/* Live Auctions Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading live auction catalog...</div>
      ) : filteredAuctions.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-xs bg-[#121215] rounded-2xl border border-[#27272a]">
          No active auctions found matching "{searchQuery}".
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
                      {auc.category}
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
                      {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m remaining`}
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
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Participation Fee</div>
                      <div className="font-mono font-bold text-[#E5B842] mt-0.5">
                        {auc.participation_fee} <span className="text-[10px] text-zinc-400">ETB</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Total Bids</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {auc.total_bids} bids
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[#18181b] group-hover:bg-[#E5B842] border border-[#27272a] group-hover:border-[#E5B842] text-zinc-200 group-hover:text-black font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Place Lowest Unique Bid</span>
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
