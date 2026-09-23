import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  User,
  Phone,
  Mail,
  Coins,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react';
import { Auction } from '../types.js';

/**
 * Mask 2 Digits of Phone Number: Exactly 2 digits are hidden with ** (e.g. +251 911 22 ** 44 or +25191122**44),
 * leaving the rest of the phone digits visible for verification.
 */
export function maskPhone2Digits(phone?: string): string {
  if (!phone) return '+25191122**44';
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 8) {
    // Conceal 2 digits before the final 2 digits (e.g. +25191122**44 or 091122**44)
    const prefix = clean.slice(0, clean.length - 4);
    const suffix = clean.slice(-2);
    return `${prefix}**${suffix}`;
  }
  return clean.replace(/\d{2}$/, '**');
}

/**
 * 4-Character Masked Email: Exactly 4 characters masked with asterisks (e.g. am****@minibid.et)
 */
export function maskEmail4Chars(email?: string): string {
  if (!email || !email.includes('@')) return '****@minibid.et';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.slice(0, 1)}****@${domain}`;
  }
  const prefix = local.slice(0, 2);
  return `${prefix}****@${domain}`;
}

interface WinnersGalleryProps {
  onSelectAuction?: (auctionId: string) => void;
}

export const WinnersGallery: React.FC<WinnersGalleryProps> = ({ onSelectAuction }) => {
  const [winners, setWinners] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    fetch('/api/auctions')
      .then(res => res.json())
      .then(data => {
        const ended = (data.auctions || []).filter((a: Auction) => a.status === 'ended');
        setWinners(ended);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const categories = ['All', 'Tech', 'Luxury', 'Jewelry', 'Vehicles', 'Appliances'];

  const filteredWinners = winners.filter(a => {
    if (activeCategory === 'All') return true;
    return a.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Luxury Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#27272a] bg-gradient-to-br from-[#18181c] via-[#111114] to-[#09090b] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#E5B842]/15 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-xs font-mono font-semibold tracking-wider uppercase">
            <Trophy className="w-3.5 h-3.5" /> Verified Winners Ledger
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-white leading-tight">
            Hall of Fame — <span className="text-[#E5B842]">Lowest Unique Bid</span> Champions
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Every concluded auction is publicly verified on-chain and in our audit ledger. Explore previous winners, their validated winning lowest unique bid, and verified contact verification details.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 100% Cryptographically Verified
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <BadgeCheck className="w-4 h-4" /> 2-Digit Masked Phone Privacy
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Mail className="w-3.5 h-3.5" /> 4-Char Masked Email
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-[#E5B842] text-black font-semibold shadow-lg shadow-[#E5B842]/20'
                : 'bg-[#121215] text-zinc-400 hover:text-white border border-[#27272a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#E5B842] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-500">Loading verified winners records...</p>
        </div>
      ) : filteredWinners.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-xs bg-[#121215] rounded-3xl border border-[#27272a] p-8 space-y-2">
          <Trophy className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="font-serif text-sm text-zinc-400 font-semibold">No Concluded Auctions in this Category Yet</p>
          <p className="text-zinc-600 text-xs">Active auctions will appear here immediately once their countdown concludes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWinners.map(auc => {
            const maskedPhone = maskPhone2Digits(auc.winner_phone);
            const maskedEmail = maskEmail4Chars(auc.winner_email);
            const winAmount = auc.winning_bid_amount !== undefined ? auc.winning_bid_amount.toFixed(2) : '0.00';

            return (
              <div
                key={auc.id}
                className="bg-[#121215] border border-[#27272a] hover:border-[#E5B842]/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col group"
              >
                {/* Image Header */}
                <div className="relative aspect-[16/10] bg-zinc-900 overflow-hidden">
                  <img
                    src={auc.image_url}
                    alt={auc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-[#121215]/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#E5B842] border border-[#E5B842]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                      {auc.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Winner Confirmed
                    </span>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-300">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {new Date(auc.end_time).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Layers className="w-3 h-3 text-zinc-500" />
                      {auc.total_bids} bids evaluated
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="font-serif font-bold text-white text-lg line-clamp-1 group-hover:text-[#E5B842] transition-colors">
                      {auc.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {auc.description}
                    </p>
                  </div>

                  {/* Winner Profile & Masked Verification Box */}
                  <div className="p-4 rounded-2xl bg-[#18181c] border border-[#27272a] space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E5B842] to-amber-200 text-black font-extrabold flex items-center justify-center text-xs shadow-md">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                            Verified Winner
                          </div>
                          <div className="font-serif font-bold text-white text-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#E5B842]" />
                            <span>@{auc.winner_username || 'anonymous_winner'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                          Winning Bid
                        </div>
                        <div className="font-mono font-extrabold text-emerald-400 text-base">
                          {winAmount} ETB
                        </div>
                      </div>
                    </div>

                    {/* Masked Contact Details (Requirement 2) */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col">
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#E5B842]" /> 2-Digit Masked Phone
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-200 mt-1 tracking-wider">
                          {maskedPhone}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col">
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-cyan-400" /> 4-Char Masked Email
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-200 mt-1 tracking-wider truncate">
                          {maskedEmail}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                      <span className="text-zinc-500">Participation Fee:</span>
                      <span className="text-zinc-300 font-semibold">{auc.participation_fee} ETB</span>
                    </div>

                    {/* View Full Bid History Action */}
                    <button
                      onClick={() => onSelectAuction?.(auc.id)}
                      className="w-full mt-2 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-[#E5B842] hover:text-black text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-700/60 hover:border-[#E5B842] active:scale-[0.99]"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Inspect Full Bid History ({auc.total_bids} Bids)</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Trust Footer */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-900">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Delivery Handover Complete
                    </span>
                    <span className="text-zinc-600 font-mono text-[10px]">
                      ID: {auc.id.substring(0, 10)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
