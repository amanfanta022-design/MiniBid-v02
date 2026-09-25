import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Trophy,
  ArrowLeft,
  TrendingUp,
  Lock,
  Eye,
  Crown,
  Share2,
  Layers,
  History,
  Info,
} from 'lucide-react';
import { Auction, Bid } from '../types.js';
import { playBidChime, playVictoryChime } from '../utils/audio.js';
import confetti from 'canvas-confetti';

interface ConcludedBid {
  id: string;
  rank: number;
  bid_amount: number;
  status: 'unique_lowest' | 'unique_not_lowest' | 'not_unique';
  username: string;
  phone: string;
  created_at: string;
}

interface SuperAdminBid {
  id: string;
  user_id: string;
  username: string;
  phone: string;
  bid_amount: number;
  status: 'unique_lowest' | 'unique_not_lowest' | 'not_unique';
  created_at: string;
}

interface AuctionDetailModalProps {
  auctionId: string | null;
  onClose: () => void;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
}

export const AuctionDetailModal: React.FC<AuctionDetailModalProps> = ({
  auctionId,
  onClose,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const { user, token, updateUserBalance } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [concludedBids, setConcludedBids] = useState<ConcludedBid[]>([]);
  const [superadminBids, setSuperadminBids] = useState<SuperAdminBid[] | null>(null);
  const [adminStatsLocked, setAdminStatsLocked] = useState(false);
  const [stats, setStats] = useState<{
    total_bids: number;
    unique_bids_count: number;
    duplicate_bids_count: number;
  } | null>(null);

  const [bidInput, setBidInput] = useState<string>('1.00');
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<string>('');
  const [bidSuccess, setBidSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bidding' | 'history'>('bidding');
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!auctionId) return;

    const fetchDetail = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`/api/auctions/${auctionId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setAuction(data.auction);
          if (data.auction?.status === 'ended') {
            setActiveTab('history');
          }
          setUserBids(data.user_bids || []);
          setConcludedBids(data.concluded_bids || []);
          if (data.superadmin_bids) setSuperadminBids(data.superadmin_bids);
          setAdminStatsLocked(!!data.admin_stats_locked);
          setStats(data.stats || null);
        }
      } catch {
        // silent catch
      }
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 3000);
    return () => clearInterval(interval);
  }, [auctionId, token]);

  // Countdown timer
  useEffect(() => {
    if (!auction?.end_time) return;

    const calculateTime = () => {
      const diff = new Date(auction.end_time).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [auction?.end_time]);

  if (!auctionId || !auction) return null;

  const isEnded = auction.status === 'ended';
  const totalDeduction = auction.participation_fee + (parseFloat(bidInput.replace(',', '.')) || 0);
  const hasInsufficientBalance = user && isCustomer ? user.wallet_balance < totalDeduction : false;

  const leadingBid = userBids.find(b => b.status === 'unique_lowest');

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    if (!user) {
      onOpenAuth();
      return;
    }

    if (isAdmin || isSuperAdmin) {
      setBidError('Administrators and platform managers are prohibited from participating in bids.');
      return;
    }

    const cleanInput = bidInput.replace(',', '.').trim();
    const numAmount = parseFloat(cleanInput);
    if (isNaN(numAmount) || numAmount < 1.00) {
      setBidError('Bid amount must be at least 1.00 ETB. Any decimal amount starting from 1.00 ETB is accepted (e.g. 1.05, 1.25, 2.50 ETB).');
      return;
    }

    setIsBidding(true);
    try {
      const res = await fetch('/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auction_id: auction.id,
          bid_amount: numAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBidError(data.error || 'Failed to place bid');
      } else {
        playBidChime();
        if (data.new_balance !== undefined) {
          updateUserBalance(data.new_balance);
        }

        const newBid: Bid = data.bid;
        setUserBids(prev => [newBid, ...prev]);

        // Sealed Auction Rule: System does NOT reveal game status or uniqueness upon bid submission!
        setBidSuccess(`✓ Secret bid of ${newBid.bid_amount.toFixed(2)} ETB successfully recorded and sealed in the vault!`);

        // Suggest next decimal increment (preserving 2 decimals)
        const nextSuggested = Math.max(1.00, Number((numAmount + 0.01).toFixed(2)));
        setBidInput(nextSuggested.toFixed(2));
      }
    } catch {
      setBidError('Network error while submitting bid.');
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-zinc-100 my-auto sm:my-6 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        {/* Navigation Bar inside modal: Back Button + Close X Button */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272a]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Auctions</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
              Auction ID: #{auction.id.substring(0, 8)}
            </span>
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Image, Badges, Countdown & Verification */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-[#27272a] aspect-square group shadow-lg">
              <img
                src={auction.image_url}
                alt={auction.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[#E5B842] border border-[#E5B842]/40 text-[10px] font-mono uppercase tracking-wider font-bold">
                  {auction.category}
                </span>
                {isEnded ? (
                  <span className="px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 text-[10px] font-mono uppercase font-semibold">
                    Concluded
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1 font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Auction
                  </span>
                )}
              </div>
            </div>

            {/* Countdown Box */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] shadow-inner">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#E5B842]" /> Auction Countdown
                </span>
                <span className="font-mono text-zinc-500">
                  {isEnded
                    ? 'Concluded'
                    : `Ends ${new Date(auction.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>

              {isEnded ? (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <div className="text-emerald-400 font-serif font-bold text-sm">Official Auction Closed</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Lowest unique bid has been verified and awarded
                  </div>
                </div>
              ) : timeLeft ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#09090b] border border-zinc-800">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">Hours</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#09090b] border border-zinc-800">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">Minutes</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#09090b] border border-zinc-800">
                    <div
                      className={`text-xl sm:text-2xl font-black font-mono ${
                        timeLeft.hours === 0 && timeLeft.minutes < 5
                          ? 'text-red-400 animate-pulse'
                          : 'text-[#E5B842]'
                      }`}
                    >
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">Seconds</div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Description & Rules */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] text-xs space-y-2">
              <span className="font-semibold text-zinc-200 block uppercase tracking-wider text-[11px]">
                Product Specification & Certified Origin
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">{auction.description}</p>
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine Ethiopian Guarantee
                </span>
                <span>Audit Lock: Active</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Role-Based Actions, Game Status & Bid History */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide leading-tight">
                {auction.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-400">
                <span>
                  Participation Fee: <strong className="text-[#E5B842] font-mono">{auction.participation_fee} ETB</strong>
                </span>
                <span>•</span>
                <span>
                  Total Bids Placed: <strong className="text-white font-mono">{auction.total_bids}</strong>
                </span>
                {(isEnded || isSuperAdmin) && stats?.unique_bids_count !== undefined && !adminStatsLocked && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400">
                      Unique Bids: <strong className="font-mono">{stats.unique_bids_count}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-zinc-400">
                      Duplicate Bids: <strong className="font-mono">{stats.duplicate_bids_count}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Winner Banner if Ended */}
            {isEnded && auction.winner_username && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#E5B842]/20 to-amber-600/20 border border-[#E5B842] shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E5B842] uppercase tracking-wider mb-1">
                  <Trophy className="w-4 h-4 text-[#E5B842]" /> Auction Concluded — Winning Lowest Unique Bid
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <div>
                    <span className="text-zinc-400">Winner: </span>
                    <strong className="text-white font-serif font-bold text-sm">@{auction.winner_username}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Won at: </span>
                    <strong className="text-emerald-400 font-mono text-base font-extrabold">
                      {auction.winning_bid_amount?.toFixed(2)} ETB
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB SELECTOR: Bidding / Game Status vs Full Players Bid History */}
            <div className="flex items-center gap-2 p-1 bg-[#18181b] border border-[#27272a] rounded-2xl">
              <button
                onClick={() => setActiveTab('bidding')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'bidding'
                    ? 'bg-[#E5B842] text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isEnded ? 'Auction Overview' : 'Live Game & Secret Bids'}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-[#E5B842] text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>
                  {isEnded
                    ? `Full Bid History (${concludedBids.length})`
                    : isSuperAdmin
                    ? `Live Bid Ledger (${superadminBids?.length || 0})`
                    : 'Final Bid History'}
                </span>
              </button>
            </div>

            {/* TAB 1: Bidding & Live Status View */}
            {activeTab === 'bidding' && (
              <div className="space-y-4">
                {/* 1. If not logged in */}
                {!user && !isEnded && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#18181b] to-zinc-900 border border-amber-500/30 text-center space-y-3 shadow-xl">
                    <Crown className="w-8 h-8 text-[#E5B842] mx-auto animate-bounce" />
                    <h3 className="font-serif font-bold text-white text-base">
                      Join the Auction to Place Secret Bids!
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Participate in this lowest unique reverse auction. Create a free account or sign in to deposit funds and place your unique bids.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={onOpenAuth}
                        className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Sign In / Register
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. If Admin (Admins CANNOT bid and CANNOT see game stats until auction ends!) */}
                {isAdmin && (
                  <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-800/60 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-300 uppercase tracking-wider">
                      <Lock className="w-4 h-4 text-blue-400" />
                      Staff Admin Security Policy
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      Administrative staff and operational moderators are strictly prohibited from participating in bids to ensure complete algorithmic fairness.
                    </p>
                    {!isEnded ? (
                      <div className="p-3 rounded-xl bg-[#09090b]/60 border border-zinc-800 text-zinc-400 text-[11px]">
                        🔒 Live game statistics, uniqueness ratios, and player bid amounts remain strictly confidential until this auction concludes.
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px]">
                        ✓ Auction concluded. You may inspect the complete ranked bid history in the "Full Bid History" tab.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. If Super Admin (Can view everything, but prohibited from bidding) */}
                {isSuperAdmin && (
                  <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-800/50 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-purple-300 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Super Admin Auction Inspector
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      Super Admin privileges active. You have full transparency to view all active bids, evaluated uniqueness statuses, and bidder identities in real time via the "Live Bid Ledger" tab.
                    </p>
                    <span className="inline-block text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      Bidding disabled for administrative integrity
                    </span>
                  </div>
                )}

                {/* 4. Customer Bidding Card (Active only for customer when auction is active) */}
                {!isEnded && isCustomer && (
                  <div className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a] space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" /> Place Secret Reverse Bid
                      </span>
                      <span className="text-[11px] text-[#E5B842] font-mono font-medium">
                        Lowest Unique Wins
                      </span>
                    </div>

                    <form onSubmit={handlePlaceBid} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] text-zinc-400 uppercase tracking-wider">
                            Secret Bid Amount (ETB)
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Any decimal starting from 1.00 ETB
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="1.00"
                            placeholder="1.00"
                            value={bidInput}
                            onChange={e => {
                              const val = e.target.value.replace(',', '.');
                              setBidInput(val);
                            }}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#09090b] border border-zinc-700 text-lg font-bold font-mono text-white focus:outline-none focus:border-[#E5B842]"
                          />
                          <span className="absolute right-4 top-3.5 text-xs font-mono text-[#E5B842] font-semibold">
                            ETB
                          </span>
                        </div>

                        {/* Quick Presets & Decimal Increments */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase mr-1">Presets:</span>
                          {[
                            { label: '1.00', val: '1.00' },
                            { label: '1.25', val: '1.25' },
                            { label: '1.50', val: '1.50' },
                            { label: '2.00', val: '2.00' },
                          ].map(preset => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setBidInput(preset.val)}
                              className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
                                bidInput === preset.val
                                  ? 'bg-[#E5B842] text-black font-bold border-[#E5B842]'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                              }`}
                            >
                              {preset.label} ETB
                            </button>
                          ))}

                          <span className="text-[10px] text-zinc-500 font-mono mx-1">|</span>

                          {[0.05, 0.10, 0.25, 1.00].map(nudge => (
                            <button
                              key={nudge}
                              type="button"
                              onClick={() => {
                                const cur = parseFloat(bidInput.replace(',', '.')) || 1.00;
                                const updated = Math.max(1.00, Number((cur + nudge).toFixed(2)));
                                setBidInput(updated.toFixed(2));
                              }}
                              className="px-2 py-1 rounded-md text-[10px] font-mono bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-[#E5B842] transition-all cursor-pointer"
                            >
                              +{nudge.toFixed(2)}
                            </button>
                          ))}
                        </div>

                        {/* Financial summary breakdown */}
                        <div className="flex items-center justify-between mt-2.5 text-[11px] text-zinc-400 font-mono bg-[#09090b]/50 p-2.5 rounded-xl border border-zinc-800">
                          <span>
                            Fee: <strong>{auction.participation_fee} ETB</strong> + Bid: <strong>{(parseFloat(bidInput.replace(',', '.')) || 0).toFixed(2)} ETB</strong>
                          </span>
                          <span>
                            Total: <strong className="text-[#E5B842]">{totalDeduction.toFixed(2)} ETB</strong>
                          </span>
                        </div>
                      </div>

                      {/* Insufficient balance prompt */}
                      {hasInsufficientBalance && (
                        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>Insufficient wallet balance ({user?.wallet_balance.toFixed(2)} ETB).</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenDeposit();
                            }}
                            className="text-[11px] underline text-[#E5B842] font-semibold shrink-0 cursor-pointer"
                          >
                            Deposit Now
                          </button>
                        </div>
                      )}

                      {bidError && (
                        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                          {bidError}
                        </div>
                      )}

                      {bidSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500 text-xs text-emerald-300 flex items-center gap-2 font-medium animate-fadeIn">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>{bidSuccess}</span>
                        </div>
                      )}

                      {/* Explicit Action Buttons: Confirm Bid & Cancel Button */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          id="submit-bid-btn"
                          disabled={isBidding || hasInsufficientBalance}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E5B842] via-[#d4af37] to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(229,184,66,0.3)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isBidding
                            ? 'Submitting Sealed Bid...'
                            : `Confirm & Place Bid (${totalDeduction.toFixed(2)} ETB)`}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 5. SEALED GAME STATUS FOR CUSTOMER (Zero-Knowledge Rule) */}
                {isCustomer && (
                  <div className="space-y-3">
                    {/* Confidentiality & Integrity Banner */}
                    <div
                      className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                        isEnded && auction.winner_user_id === user?.id
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-[#18181b] border-[#27272a] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isEnded && auction.winner_user_id === user?.id ? (
                          <Crown className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#E5B842] shrink-0" />
                        )}
                        <div>
                          <div className="font-bold">
                            {isEnded
                              ? auction.winner_user_id === user?.id
                                ? `👑 CONGRATULATIONS! You won this auction at ${auction.winning_bid_amount?.toFixed(2)} ETB!`
                                : 'Auction Concluded: Final results revealed below.'
                              : '🔒 Blind Reverse Auction (Confidential Vault)'}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {isEnded
                              ? 'All bids have been audited and sorted lowest-to-highest in the Full Bid History tab.'
                              : 'To protect strategic integrity, no player is informed whether their bid is unique, duplicate, or lowest while the auction is active.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer's Individual Bids */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        {isEnded ? 'Your Final Evaluated Bids' : 'Your Sealed Bids'} ({userBids.length})
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {isEnded ? 'Audited Results' : 'Vault Encrypted'}
                      </span>
                    </div>

                    {userBids.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-[#18181b]/50 border border-zinc-800 text-center text-xs text-zinc-500">
                        You have not placed any bids on this auction yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {userBids.map(b => {
                          const isWinning = isEnded && b.status === 'unique_lowest';
                          const isUniqueNotLowest = isEnded && b.status === 'unique_not_lowest';
                          const isDuplicate = isEnded && b.status === 'not_unique';

                          return (
                            <div
                              key={b.id}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                isWinning
                                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                  : isUniqueNotLowest
                                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                                  : isDuplicate
                                  ? 'bg-red-950/20 border-red-500/30 text-zinc-300'
                                  : 'bg-[#18181b] border-[#27272a] text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-white">
                                  {b.bid_amount.toFixed(2)} ETB
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {new Date(b.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <div>
                                {!isEnded ? (
                                  <span className="px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 font-medium text-[10px] flex items-center gap-1.5">
                                    <Lock className="w-3 h-3 text-[#E5B842]" /> Sealed & Recorded
                                  </span>
                                ) : (
                                  <>
                                    {isWinning && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Winning Lowest Unique!
                                      </span>
                                    )}
                                    {isUniqueNotLowest && (
                                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold text-[10px]">
                                        Unique (Higher)
                                      </span>
                                    )}
                                    {isDuplicate && (
                                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Duplicate (Shared)
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FULL CONCLUDED PLAYERS BID HISTORY TABLE (Requirement 6) & SUPER ADMIN LIVE INSPECTOR */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Case A: Super Admin view during Active or Concluded */}
                {isSuperAdmin && superadminBids ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        Confidential Live Bid History ({superadminBids.length})
                      </span>
                      <span className="text-zinc-500 font-mono text-[11px]">Unmasked Super Admin View</span>
                    </div>

                    <div className="border border-purple-800/40 rounded-2xl overflow-hidden bg-[#18181b]">
                      <div className="max-h-72 overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead className="bg-purple-950/30 text-purple-200 border-b border-purple-800/40 font-mono text-[10px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Bidder</th>
                              <th className="py-2.5 px-3">Phone</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                            {superadminBids.map((b, idx) => (
                              <tr key={b.id} className="hover:bg-zinc-800/40">
                                <td className="py-2 px-3 text-zinc-400">#{idx + 1}</td>
                                <td className="py-2 px-3 text-white font-bold">@{b.username}</td>
                                <td className="py-2 px-3 text-zinc-300">{b.phone}</td>
                                <td className="py-2 px-3 text-[#E5B842] font-bold">{b.bid_amount.toFixed(2)} ETB</td>
                                <td className="py-2 px-3">
                                  {b.status === 'unique_lowest' ? (
                                    <span className="text-emerald-400 font-bold">✓ Unique Lowest</span>
                                  ) : b.status === 'unique_not_lowest' ? (
                                    <span className="text-amber-400">Unique (Higher)</span>
                                  ) : (
                                    <span className="text-zinc-500">Duplicate</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-zinc-400">
                                  {new Date(b.created_at).toLocaleTimeString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : isEnded ? (
                  /* Case B: Concluded Auction — Organized Table sorted lowest to highest with masked information! (Requirement 6) */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#E5B842] uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-[#E5B842]" />
                        Official Concluded Bids (Lowest to Highest)
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {concludedBids.length} Total Verified Bids
                      </span>
                    </div>

                    <div className="border border-[#27272a] rounded-2xl overflow-hidden bg-[#18181b]">
                      <div className="max-h-72 overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead className="bg-[#09090b] text-zinc-400 border-b border-[#27272a] font-mono text-[10px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Rank</th>
                              <th className="py-2.5 px-3">Bid Amount</th>
                              <th className="py-2.5 px-3">Result / Status</th>
                              <th className="py-2.5 px-3">Player (Masked)</th>
                              <th className="py-2.5 px-3">Phone (Masked)</th>
                              <th className="py-2.5 px-3">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                            {concludedBids.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-zinc-500">
                                  No bids recorded for this auction.
                                </td>
                              </tr>
                            ) : (
                              concludedBids.map(b => {
                                const isWinner = b.status === 'unique_lowest';
                                return (
                                  <tr
                                    key={b.id}
                                    className={`transition-colors ${
                                      isWinner
                                        ? 'bg-emerald-950/30 text-emerald-200 font-bold'
                                        : 'hover:bg-zinc-800/30 text-zinc-300'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-mono">
                                      {isWinner ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                          #1 👑
                                        </span>
                                      ) : (
                                        `#${b.rank}`
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-white">
                                      {b.bid_amount.toFixed(2)} ETB
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {isWinner ? (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                          <Trophy className="w-3 h-3 text-emerald-400" /> Winner (Lowest Unique)
                                        </span>
                                      ) : b.status === 'unique_not_lowest' ? (
                                        <span className="text-amber-400">Unique (Higher)</span>
                                      ) : (
                                        <span className="text-zinc-500">Duplicate</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-zinc-300">
                                      @{b.username}
                                    </td>
                                    <td className="py-2.5 px-3 text-zinc-400 tracking-wider">
                                      {b.phone}
                                    </td>
                                    <td className="py-2.5 px-3 text-zinc-500">
                                      {new Date(b.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case C: Active auction for customer or guest */
                  <div className="p-8 rounded-2xl bg-[#18181b] border border-[#27272a] text-center space-y-2">
                    <Lock className="w-8 h-8 text-[#E5B842] mx-auto opacity-70" />
                    <h3 className="font-serif font-bold text-white text-sm">
                      Reverse Auction Confidentiality Active
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      To safeguard competitive bidding strategy, other players' bids remain secret while the auction is live.
                      The complete ranked table from lowest to highest bidder will be revealed automatically when the timer reaches 00:00!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Strategic Insight Footer */}
            <div className="p-3 rounded-2xl bg-[#18181b]/50 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#E5B842]" />
                <span>Tip: Place multiple bids across small intervals to uncover the lowest unique figure!</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
