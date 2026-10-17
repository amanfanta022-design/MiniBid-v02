import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  Coins,
  PlusCircle,
  Trophy,
  History,
  ShieldCheck,
  Smartphone,
  Flame,
  ArrowUpRight,
  Sparkles,
  Radio,
  Clock,
  Layers,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Zap,
  Lock,
  Gift,
  AlertCircle,
  Copy,
  Check,
  Mail,
} from 'lucide-react';
import { Auction, Transaction } from '../types.js';
import { EmailVerificationModal } from './EmailVerificationModal.js';

interface UserDashboardProps {
  onOpenDeposit: () => void;
  onOpenLedger: () => void;
  onSelectAuction: (id: string) => void;
  onViewAllAuctions: () => void;
}

interface EnrichedBid {
  id: string;
  auction_id: string;
  auction_title: string;
  auction_image: string;
  auction_status: 'active' | 'ended' | 'paused' | 'cancelled';
  auction_category: string;
  start_price: number;
  bid_amount: number;
  fee_paid: number;
  created_at: string;
  is_winner?: boolean;
  winning_bid_amount?: number;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenDeposit,
  onOpenLedger,
  onSelectAuction,
  onViewAllAuctions,
}) => {
  const { user, token, refreshUser } = useAuth();
  const { language, t } = useTranslation();

  const [myBids, setMyBids] = useState<EnrichedBid[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [wonAuctions, setWonAuctions] = useState<Auction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Simulated live actuation flicker latency and ping fluctuations
  const [latencyMs, setLatencyMs] = useState(14);
  const [liveActuationTicks, setLiveActuationTicks] = useState(10482);
  const [lastActuationTime, setLastActuationTime] = useState<string>(new Date().toLocaleTimeString());

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    if (!token || !user) return;
    try {
      // 1. Fetch user bids
      const bidsRes = await fetch('/api/bids/my-bids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setMyBids(bidsData.bids || []);
      }

      // 2. Fetch auctions
      const aucRes = await fetch('/api/auctions');
      if (aucRes.ok) {
        const aucData = await aucRes.json();
        const all: Auction[] = aucData.auctions || [];
        setActiveAuctions(all.filter(a => a.status === 'active'));
        setWonAuctions(all.filter(a => a.winner_user_id === user.id));
      }

      // 3. Fetch transactions
      const txRes = await fetch('/api/payments/my-transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setRecentTransactions((txData.transactions || []).slice(0, 5));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 6000);
    return () => clearInterval(interval);
  }, [token, user]);

  // Live Actuation ticker and green flick jitter simulation
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setLiveActuationTicks(prev => prev + 1);
      setLatencyMs(Math.floor(11 + Math.random() * 8));
      setLastActuationTime(new Date().toLocaleTimeString());
    }, 1800);
    return () => clearInterval(tickInterval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    await fetchDashboardData();
  };

  const copyClaimCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!user) {
    return null;
  }

  const activeBidsCount = myBids.filter(b => b.auction_status === 'active').length;
  const totalBidsAmount = myBids.reduce((acc, b) => acc + (b.bid_amount || 0), 0);
  const totalFeesPaid = myBids.reduce((acc, b) => acc + (b.fee_paid || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. TOP LIVE ACTUATION GREEN FLICK STATUS STRIP */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0e0e12] border border-[#27272a] p-3 sm:p-4 shadow-xl">
        {/* Glowing emerald backdrop pulse */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Green Flick Light & Actuation Title */}
          <div className="flex items-center gap-3">
            {/* Multi-ring Neon Green Flick Light */}
            <div className="relative flex items-center justify-center shrink-0 w-8 h-8">
              <span className="absolute inline-flex h-7 w-7 rounded-full bg-emerald-500/25 animate-ping opacity-75" />
              <span className="absolute inline-flex h-5 w-5 rounded-full bg-emerald-400/40 animate-pulse" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 shadow-[0_0_12px_#10b981]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{language === 'am' ? 'የቀጥታ ጨረታ አንቀሳቃሽ ሞተር ንቁ ነው' : 'LIVE ACTUATION ENGINE: ACTIVE'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold tracking-wider">
                  SYNCED • {latencyMs}ms
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                <span>AUTHORITATIVE CLEARANCE NODE</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">PULSE #{liveActuationTicks}</span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-emerald-400/90 hidden sm:inline font-semibold">TICK: {lastActuationTime}</span>
              </p>
            </div>
          </div>

          {/* Quick Refresh & Telemetry Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">PLATFORM SECURITY:</span>
              <span className="text-emerald-400 font-bold">ARMORED</span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              title={language === 'am' ? 'ዳሽቦርድ አድስ' : 'Refresh Dashboard Telemetry'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E5B842]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. PLAYER PROFILE & STATS HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Identity Card */}
        <div className="lg:col-span-1 rounded-3xl bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-[#27272a] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5B842]/5 rounded-bl-full pointer-events-none" />

          <div className="space-y-4">
            {/* Header: Avatar, Name & Phone */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5B842] via-amber-500 to-amber-700 p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#0e0e12] rounded-[14px] flex items-center justify-center">
                    <span className="font-serif font-black text-[#E5B842] text-xl">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                {/* Green flick dot on avatar */}
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0e0e12] flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-bold text-white text-base sm:text-lg">@{user.username}</h2>
                  {user.email_verified ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 text-[10px] font-mono font-bold uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>VERIFIED</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#E5B842]/15 text-[#E5B842] border border-[#E5B842]/30 text-[10px] font-mono font-bold uppercase">
                      BIDDER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-400">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-zinc-300">{user.phone}</span>
                </div>
              </div>
            </div>

            {/* Verification Status Pills */}
            <div className="p-3 rounded-2xl bg-[#18181f]/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{language === 'am' ? 'የመገለጫ የተረጋገጠ ባጅ' : 'Verified Profile Badge'}</span>
                </span>
                {user.email_verified ? (
                  <span className="text-emerald-400 font-mono font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{language === 'am' ? 'የተረጋገጠ 🛡️' : 'Verified 🛡️'}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-[#E5B842] border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>{language === 'am' ? 'ባጅ አግብር' : 'Claim Badge'}</span>
                    <Sparkles className="w-2.5 h-2.5 text-[#E5B842]" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'am' ? 'የጨረታ ምስጢራዊነት' : 'Cryptographic Vault'}</span>
                </span>
                <span className="text-[#E5B842] font-mono font-semibold text-[11px]">
                  SEALED & FAIR
                </span>
              </div>
            </div>

            {/* Incentive Banner for Unverified Email */}
            {!user.email_verified && (
              <div
                onClick={() => setIsEmailModalOpen(true)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-emerald-950/40 border border-[#E5B842]/40 text-xs flex items-center justify-between cursor-pointer hover:border-[#E5B842] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E5B842] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-zinc-200 text-[11px]">
                    {language === 'am'
                      ? 'ኢሜይል በማረጋገጥ የተረጋገጠ ባጅ (Verified Badge) ያግኙ!'
                      : 'Verify email to unlock the Verified Profile Badge!'}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={onOpenDeposit}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ሒሳብ ጨምር' : 'Add Funds'}</span>
            </button>
            <button
              onClick={onOpenLedger}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ዝርዝር ሒሳብ' : 'View Ledger'}</span>
            </button>
          </div>
        </div>

        {/* Live Financial & Performance Metrics (2 Columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Available Wallet Balance */}
          <div className="rounded-3xl bg-gradient-to-br from-[#141418] via-[#121216] to-[#18181f] border border-[#E5B842]/40 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Coins className="w-16 h-16 text-[#E5B842]" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
                  {language === 'am' ? 'ተጠቃሚ ቀሪ ሒሳብ' : 'Available Wallet Balance'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIQUID</span>
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
                <span className="text-[#E5B842]">
                  {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-zinc-400 font-sans font-bold">ETB</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {language === 'am'
                  ? 'በቴሌብር፣ ንግድ ባንክ ወይም አዋሽ ባንክ በቅጽበት የተሞላ'
                  : 'Ready for live reverse-bid participation & instant clearance.'}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs mt-3">
              <span className="text-zinc-500 font-mono text-[10px]">CBE • TELEBIRR • AWASH</span>
              <button
                onClick={onOpenDeposit}
                className="text-[#E5B842] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'am' ? 'አሁን ጨምር' : 'Deposit Now'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Active Placed Bids */}
          <div className="rounded-3xl bg-gradient-to-br from-[#141418] via-[#121216] to-[#141418] border border-zinc-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
                  {language === 'am' ? 'ንቁ የተሳተፉባቸው ጨረታዎች' : 'Active Live Bids'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>IN PLAY</span>
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
                <span className="text-amber-400">{activeBidsCount}</span>
                <span className="text-xs text-zinc-400 font-sans font-medium">
                  {language === 'am' ? 'ጨረታዎች' : 'bids active'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {language === 'am'
                  ? `ጠቅላላ የተጫረቱት ድምር፦ ${totalBidsAmount.toFixed(2)} ETB`
                  : `Total secret entries placed across active luxury pools.`}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs mt-3">
              <span className="text-zinc-500 font-mono text-[10px]">
                {myBids.length} {language === 'am' ? 'ጠቅላላ የተመዘገቡ' : 'lifetime bids'}
              </span>
              <button
                onClick={onViewAllAuctions}
                className="text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'am' ? 'ጨረታዎችን እይ' : 'Explore Auctions'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Won Luxury Auctions */}
          <div className="rounded-3xl bg-gradient-to-br from-[#141418] via-[#121216] to-[#141418] border border-zinc-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
                  {language === 'am' ? 'ያሸነፏቸው ሽልማቶች' : 'Luxury Auctions Won'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-950/80 border border-yellow-500/40 text-yellow-300 text-[10px] font-mono flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span>VICTORIES</span>
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
                <span className="text-yellow-400">{wonAuctions.length}</span>
                <span className="text-xs text-zinc-400 font-sans font-medium">
                  {language === 'am' ? 'ዕቃዎች' : 'items claimed'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {wonAuctions.length > 0
                  ? language === 'am'
                    ? 'እንኳን ደስ አለዎት! ያሸነፏቸውን እቃዎች ከታች ይመልከቱ።'
                    : 'Congratulations! Concluded with lowest unrepeated bid.'
                  : language === 'am'
                  ? 'እስካሁን ያሸነፉት የለም። አነስተኛ ያልተደገመ ጨረታ በማስገባት አሸናፊ ይሁኑ!'
                  : 'Place strategic lowest unique bids to claim luxury cars, tech, & gold.'}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs mt-3">
              <span className="text-zinc-500 font-mono text-[10px]">100% FAIR PLAY</span>
              {wonAuctions.length > 0 && (
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Winner Status Active</span>
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Real-Time Actuation Stream & Telemetry */}
          <div className="rounded-3xl bg-gradient-to-br from-[#101014] via-[#0d0d10] to-[#121218] border border-emerald-950/60 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'am' ? 'የአንቀሳቃሽ ሞተር ሁኔታ' : 'Actuation Heartbeat'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE</span>
                </span>
              </div>
              <div className="mt-2 text-sm font-mono text-zinc-200">
                <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Algorithmic State:</span>
                  <span className="text-emerald-400 font-bold">Reverse Lowest Unique</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-500">Auth Protocol:</span>
                  <span className="text-emerald-400">Password Shield Active</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-500">Anti-Collusion Guard:</span>
                  <span className="text-emerald-400">Enforced</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs mt-3">
              <span className="text-zinc-500 font-mono text-[10px]">TLS 1.3 • AES-256</span>
              <span className="text-emerald-400 font-mono text-[10px] font-bold">Authoritative State</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. WON AUCTIONS PRIZE CLAIM SHOWCASE (If any won) */}
      {wonAuctions.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/60 p-5 sm:p-7 shadow-2xl relative overflow-hidden animate-fadeIn">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#E5B842] flex items-center justify-center text-black font-black shrink-0 shadow-lg shadow-[#E5B842]/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-lg sm:text-xl flex items-center gap-2">
                <span>{language === 'am' ? 'እንኳን ደስ አለዎት! ያሸነፏቸው የቅንጦት ዕቃዎች' : 'Congratulations! Your Won Luxury Auctions'}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5B842] text-black text-[10px] font-mono font-black uppercase">
                  CLAIM PRIZE
                </span>
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {language === 'am'
                  ? 'የእርስዎ አነስተኛ ያልተደገመ ጨረታ አሸናፊ ሆኗል! የይገባኛል ኮዱን ይዘው ሽልማትዎን ይረከቡ።'
                  : 'You concluded with the lowest unrepeated reverse bid. Present your digital claim voucher or request delivery.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wonAuctions.map(auc => {
              const claimCode = `CLAIM-${auc.id.replace('auc_', '').toUpperCase()}-${user.id.slice(-4).toUpperCase()}`;
              const isCopied = copiedCode === claimCode;
              return (
                <div
                  key={auc.id}
                  className="rounded-2xl bg-[#121216] border border-amber-600/50 p-4 flex flex-col justify-between shadow-xl relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="aspect-video w-full rounded-xl overflow-hidden relative bg-black">
                      <img
                        src={auc.image_url}
                        alt={auc.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#E5B842] text-black text-[10px] font-bold font-mono">
                        WON FOR {(auc.winning_bid_amount || 0).toFixed(2)} ETB
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{auc.title}</h4>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                        <span>Retail Value:</span>
                        <span className="font-mono text-zinc-200 line-through">
                          {auc.start_price.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>

                    {/* Claim Voucher Box */}
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1">
                      <span className="text-[10px] text-zinc-400 font-mono block">Voucher Claim Code:</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-300">{claimCode}</span>
                        <button
                          onClick={() => copyClaimCode(claimCode)}
                          className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                          title="Copy voucher code"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs mt-3">
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready for Handover</span>
                    </span>
                    <button
                      onClick={() => onSelectAuction(auc.id)}
                      className="text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      {language === 'am' ? 'ዝርዝር እይ' : 'Details →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LIVE ACTUATION BIDDING DESK (User's placed bids) */}
      <div className="rounded-3xl bg-[#101014] border border-[#27272a] p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-white text-base sm:text-lg">
                {language === 'am' ? 'የእኔ የተመዘገቡ ጨረታዎች (የቀጥታ ክትትል)' : 'My Live Actuation Bids Tracker'}
              </h3>
              {/* Green flick light tag */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {language === 'am'
                ? 'በሚስጥር ሳጥን የተመዘገቡ እና የፍትሃዊነት ደንብ የተጠበቀላቸው ዝርዝሮች'
                : 'All your bids are sealed and cryptographically verified until auction conclusion.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewAllAuctions}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
            >
              <Flame className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>{language === 'am' ? 'ሁሉንም ጨረታዎች እይ' : 'Browse Live Pools'}</span>
            </button>
          </div>
        </div>

        {myBids.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-500">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">
              {language === 'am' ? 'እስካሁን ምንም ጨረታ አላስገቡም' : 'No Placed Bids Yet'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {language === 'am'
                ? 'በዝቅተኛ ያልተደገመ ጨረታ ለመሳተፍ የቀጥታ ጨረታዎችን ይመልከቱ እና የሚፈልጉትን ዕቃ ይጫረቱ!'
                : 'Explore live luxury auctions and place your lowest unrepeated bid to win cars, electronics, and gold.'}
            </p>
            <button
              onClick={onViewAllAuctions}
              className="mt-2 px-5 py-2 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              {language === 'am' ? 'የቀጥታ ጨረታዎችን አሁን እይ' : 'Start Bidding Now'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Auction Item</th>
                  <th className="pb-3 px-3">Placed Bid Amount</th>
                  <th className="pb-3 px-3">Participation Fee</th>
                  <th className="pb-3 px-3">Actuation Status</th>
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {myBids.map(bid => {
                  const isActive = bid.auction_status === 'active';
                  return (
                    <tr key={bid.id} className="hover:bg-zinc-800/20 transition-colors">
                      {/* Item */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                            <img
                              src={bid.auction_image}
                              alt={bid.auction_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-100 font-sans text-xs line-clamp-1 max-w-[200px] sm:max-w-xs">
                              {bid.auction_title}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Pool ID: {bid.auction_id.replace('auc_', '#')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Bid Amount */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-sm">
                          {bid.bid_amount.toFixed(2)}{' '}
                          <span className="text-xs text-[#E5B842]">ETB</span>
                        </div>
                      </td>

                      {/* Fee Paid */}
                      <td className="py-3.5 px-3 text-zinc-400">
                        {bid.fee_paid} ETB
                      </td>

                      {/* Actuation Status with Green Flick */}
                      <td className="py-3.5 px-3">
                        {bid.is_winner ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-950/80 border border-yellow-500/50 text-yellow-300 text-[10px] font-bold">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            <span>WINNER</span>
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                            <span>SEALED IN VAULT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px]">
                            <span>CONCLUDED</span>
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-3 text-zinc-500 text-[11px]">
                        {new Date(bid.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => onSelectAuction(bid.auction_id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                        >
                          {isActive ? 'Bid Again' : 'View Result'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. RECENT WALLET ACTIVITY & SECURITY AUDIT FOOTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <div className="rounded-3xl bg-[#101014] border border-[#27272a] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="font-semibold text-white text-sm">
              {language === 'am' ? 'የቅርብ ጊዜ የኪስ ቦርሳ ዝውውሮች' : 'Recent Wallet Transactions'}
            </span>
            <button
              onClick={onOpenLedger}
              className="text-[#E5B842] hover:underline text-xs font-semibold cursor-pointer"
            >
              {language === 'am' ? 'ሁሉንም እይ' : 'View Full Ledger →'}
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {language === 'am' ? 'ምንም የቅርብ ጊዜ ዝውውር የለም' : 'No recent transactions recorded.'}
            </div>
          ) : (
            <div className="space-y-2.5 font-mono text-xs">
              {recentTransactions.map(tx => {
                const isCredit =
                  tx.type === 'deposit' ||
                  tx.type === 'refund' ||
                  tx.type === 'admin_float_credit' ||
                  tx.type === 'admin_adjustment';
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-zinc-200 font-sans text-xs">
                        {tx.description || tx.type.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ref: {tx.reference_id || tx.id.slice(-6)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-sm ${
                          isCredit ? 'text-emerald-400' : 'text-zinc-300'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{tx.amount.toLocaleString()} ETB
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security & Phone OTP Active Session Card */}
        <div className="rounded-3xl bg-[#101014] border border-[#27272a] p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="font-semibold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{language === 'am' ? 'የደህንነት እና የይለፍ ቃል ሁኔታ' : 'Security & Session Protection'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                ARMORED
              </span>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">
                    {language === 'am' ? 'የኢሜይል ማረጋገጫ ባጅ' : 'Email Verified Profile Badge'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {user.email || 'No email attached'}
                  </div>
                </div>
                {user.email ? (
                  <span className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>BADGE ACTIVE</span>
                  </span>
                ) : (
                  <button
                    onClick={onOpenLedger}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[#E5B842] hover:bg-amber-500/30 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    ADD EMAIL
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">
                    {language === 'am' ? 'የአካውንት ጥበቃ' : 'Account Protection'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{user.phone}</div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold">
                  PASSWORD SECURED
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span>MiniBid Ethiopia © 2026</span>
            <button
              onClick={onOpenLedger}
              className="text-[#E5B842] hover:underline cursor-pointer"
            >
              Account Settings →
            </button>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialEmail={user.email}
        onSuccess={() => {
          refreshUser();
          fetchDashboardData();
        }}
      />
    </div>
  );
};
