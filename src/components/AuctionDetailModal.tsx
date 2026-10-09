import React, { useState, useEffect, useMemo } from 'react';
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
  Phone,
  Search,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { Auction, Bid, SuperAdminLiveGameDetail } from '../types.js';
import { playBidChime, playVictoryChime } from '../utils/audio.js';
import { useTranslation } from '../utils/i18n.js';
import confetti from 'canvas-confetti';
import { SuperAdminEditAuctionModal } from './SuperAdminEditAuctionModal.js';

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
  rank?: number;
  fee_paid?: number;
  duplicate_count?: number;
  duplicate_bidders?: { username: string; phone: string; user_id: string; created_at?: string }[];
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
  const { language, t } = useTranslation();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [userBids, setUserBids] = useState<Bid[]>([]);
  const [concludedBids, setConcludedBids] = useState<ConcludedBid[]>([]);
  const [superadminBids, setSuperadminBids] = useState<SuperAdminBid[] | null>(null);
  const [superadminLiveGame, setSuperadminLiveGame] = useState<SuperAdminLiveGameDetail | null>(null);
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

  // Super Admin Control Deck Table controls
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'winning' | 'unique' | 'duplicate'>('all');
  const [adminSort, setAdminSort] = useState<'amount_asc' | 'amount_desc' | 'time_desc'>('amount_asc');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  // Concluded Public Bids Table pagination & filters
  const [concludedSearch, setConcludedSearch] = useState('');
  const [concludedFilter, setConcludedFilter] = useState<'all' | 'winner' | 'unique' | 'duplicate'>('all');
  const [concludedPage, setConcludedPage] = useState(1);
  const [concludedPageSize, setConcludedPageSize] = useState(50);

  const filteredConcludedBids = useMemo(() => {
    let list = concludedBids;
    if (concludedFilter === 'winner') {
      list = list.filter(b => b.status === 'unique_lowest');
    } else if (concludedFilter === 'unique') {
      list = list.filter(b => b.status === 'unique_lowest' || b.status === 'unique_not_lowest');
    } else if (concludedFilter === 'duplicate') {
      list = list.filter(b => b.status === 'not_unique');
    }

    if (concludedSearch.trim()) {
      const q = concludedSearch.toLowerCase().trim();
      list = list.filter(
        b =>
          b.username.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.bid_amount.toFixed(2).includes(q)
      );
    }
    return list;
  }, [concludedBids, concludedFilter, concludedSearch]);

  const totalConcludedPages = Math.max(1, Math.ceil(filteredConcludedBids.length / concludedPageSize));
  const paginatedConcludedBids = useMemo(() => {
    const start = (concludedPage - 1) * concludedPageSize;
    return filteredConcludedBids.slice(start, start + concludedPageSize);
  }, [filteredConcludedBids, concludedPage, concludedPageSize]);

  const handleJumpToWinner = () => {
    setConcludedFilter('all');
    setConcludedSearch('');
    const winnerIdx = concludedBids.findIndex(b => b.status === 'unique_lowest');
    if (winnerIdx !== -1) {
      const targetPage = Math.floor(winnerIdx / concludedPageSize) + 1;
      setConcludedPage(targetPage);
    }
  };

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
          if (data.superadmin_live_game) setSuperadminLiveGame(data.superadmin_live_game);
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

  const copyAdminText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const adminFilteredBids = useMemo(() => {
    if (!superadminBids) return [];
    let list = [...superadminBids];

    if (adminFilter === 'winning') {
      list = list.filter(b => b.status === 'unique_lowest');
    } else if (adminFilter === 'unique') {
      list = list.filter(b => b.status === 'unique_lowest' || b.status === 'unique_not_lowest');
    } else if (adminFilter === 'duplicate') {
      list = list.filter(b => b.status === 'not_unique');
    }

    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase().trim();
      list = list.filter(
        b =>
          b.username.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.bid_amount.toFixed(2).includes(q)
      );
    }

    if (adminSort === 'amount_asc') {
      list.sort((a, b) => a.bid_amount - b.bid_amount);
    } else if (adminSort === 'amount_desc') {
      list.sort((a, b) => b.bid_amount - a.bid_amount);
    } else if (adminSort === 'time_desc') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [superadminBids, adminFilter, adminSearch, adminSort]);

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
            <span>{t('back_to_auctions_btn', 'Back to Auctions')}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
              {language === 'am' ? 'የጨረታ መለያ፦' : 'Auction ID:'} #{auction.id.substring(0, 8)}
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
                  {getCategoryLabel(auction.category)}
                </span>
                {isEnded ? (
                  <span className="px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 text-[10px] font-mono uppercase font-semibold">
                    {t('ended', 'Concluded')}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1 font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {language === 'am' ? 'የቀጥታ ጨረታ' : 'Live Auction'}
                  </span>
                )}
              </div>
            </div>

            {/* Countdown Box */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] shadow-inner">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#E5B842]" /> {language === 'am' ? 'የጨረታው ቆጣሪ' : 'Auction Countdown'}
                </span>
                <span className="font-mono text-zinc-500">
                  {isEnded
                    ? t('ended', 'Concluded')
                    : `${t('ends_in', 'Ends in')} ${new Date(auction.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>

              {isEnded ? (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                  <div className="text-emerald-400 font-serif font-bold text-sm">
                    {language === 'am' ? 'ጨረታው በይፋ ተዘግቷል' : 'Official Auction Closed'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {language === 'am'
                      ? 'ዝቅተኛው ያልተደገመ ዋጋ ተረጋግጦ ተሸልሟል'
                      : 'Lowest unique bid has been verified and awarded'}
                  </div>
                </div>
              ) : timeLeft ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#09090b] border border-zinc-800">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                      {language === 'am' ? 'ሰዓታት' : 'Hours'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#09090b] border border-zinc-800">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                      {language === 'am' ? 'ደቂቃዎች' : 'Minutes'}
                    </div>
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
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                      {language === 'am' ? 'ሰከንዶች' : 'Seconds'}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Description & Rules */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] text-xs space-y-2">
              <span className="font-semibold text-zinc-200 block uppercase tracking-wider text-[11px]">
                {t('product_specs', 'Product Specification & Certified Origin')}
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">{auction.description}</p>
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t('genuine_guarantee', '100% Genuine Ethiopian Guarantee')}
                </span>
                <span>{t('audit_lock_active', 'Audit Lock: Active')}</span>
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
                  {t('participation_fee', 'Participation Fee')}: <strong className="text-[#E5B842] font-mono">{auction.participation_fee} ETB</strong>
                </span>
                <span>•</span>
                <span>
                  {t('total_bids_placed', 'Total Bids Placed')}: <strong className="text-white font-mono">{auction.total_bids}</strong>
                </span>
                {(isEnded || isSuperAdmin) && stats?.unique_bids_count !== undefined && !adminStatsLocked && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400">
                      {language === 'am' ? 'ያልተደገሙ ጨረታዎች:' : 'Unique Bids:'} <strong className="font-mono">{stats.unique_bids_count}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-zinc-400">
                      {language === 'am' ? 'የተደገሙ ጨረታዎች:' : 'Duplicate Bids:'} <strong className="font-mono">{stats.duplicate_bids_count}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Winner Banner if Ended */}
            {isEnded && auction.winner_username && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#E5B842]/20 to-amber-600/20 border border-[#E5B842] shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E5B842] uppercase tracking-wider mb-1">
                  <Trophy className="w-4 h-4 text-[#E5B842]" /> {t('winner_banner_title', 'Auction Concluded — Winning Lowest Unique Bid')}
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <div>
                    <span className="text-zinc-400">{t('winner_label', 'Winner')}: </span>
                    <strong className="text-white font-serif font-bold text-sm">@{auction.winner_username}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">{t('won_at_label', 'Won at')}: </span>
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
                {isEnded ? (language === 'am' ? 'የጨረታው ማጠቃለያ' : 'Auction Overview') : t('auction_overview_tab', 'Live Game & Secret Bids')}
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
                    ? `${t('bid_history_tab', 'Full Bid History')} (${(auction?.total_bids || concludedBids.length).toLocaleString()})`
                    : isSuperAdmin
                    ? `${t('live_bid_ledger_tab', 'Live Bid Ledger')} (${superadminBids?.length || 0})`
                    : t('bid_history_tab', 'Final Bid History')}
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
                      {t('join_auction_title', 'Join the Auction to Place Secret Bids!')}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      {t('join_auction_desc', 'Participate in this lowest unique reverse auction. Create a free account or sign in to deposit funds and place your unique bids.')}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={onOpenAuth}
                        className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        {t('sign_in_register_btn', 'Sign In / Register')}
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        {t('cancel_btn', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. If Admin (Admins CANNOT bid and CANNOT see game stats until auction ends!) */}
                {isAdmin && (
                  <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-800/60 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-300 uppercase tracking-wider">
                      <Lock className="w-4 h-4 text-blue-400" />
                      {t('staff_security_policy', 'Staff Admin Security Policy')}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      {t('staff_security_desc', 'Administrative staff and operational moderators are strictly prohibited from participating in bids to ensure complete algorithmic fairness.')}
                    </p>
                    {!isEnded ? (
                      <div className="p-3 rounded-xl bg-[#09090b]/60 border border-zinc-800 text-zinc-400 text-[11px]">
                        🔒 {t('staff_locked_stats_msg', 'Live game statistics, uniqueness ratios, and player bid amounts remain strictly confidential until this auction concludes.')}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px]">
                        ✓ {t('staff_ended_stats_msg', 'Auction concluded. You may inspect the complete ranked bid history in the "Full Bid History" tab.')}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. If Super Admin (Full Live Game Control Room & Currently Winning Bid) */}
                {isSuperAdmin && (
                  <div className="space-y-4">
                    {/* Executive Control Header */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#18181b] to-purple-950/30 border border-purple-800/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-purple-300 uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                          <span>{language === 'am' ? 'የሱፐር አድሚን የቀጥታ ጨዋታ ቁጥጥር ዴስክ' : 'Super Admin Live Game Control Deck'}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          {language === 'am'
                            ? 'የቀጥታ ጨረታዎች፣ አሸናፊ ዋጋ እና የፋይናንስ ገቢ በቅጽበት ይከታተሉ።'
                            : 'Live telemetry: Winning bid, unmasked phones, and realtime margin tracking.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-[11px] font-mono shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          title="Edit live item name, description, retail price, and bid closing time"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'ጨረታውን አርም' : 'Edit Item & Schedule'}</span>
                        </button>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>{language === 'am' ? 'የቀጥታ ስርጭት (3s)' : 'Live Feed (3s)'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40">
                          {t('superadmin_bid_disabled', 'Bidding disabled')}
                        </span>
                      </div>
                    </div>

                    {/* BIG CURRENTLY WINNING BID HUD */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#18181b] to-emerald-950/20 border-2 border-emerald-500/50 shadow-xl space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-emerald-800/40 pb-2.5">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider">
                          <Crown className="w-4 h-4 text-emerald-400 animate-bounce" />
                          <span>
                            {language === 'am'
                              ? 'በአሁኑ ሰዓት አሸናፊ የሆነው ዋጋ (Lowest Unique Bid)'
                              : 'Currently Winning Bid (Lowest Unique)'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-700">
                          {isEnded ? 'FINAL AUDITED' : 'LIVE LEADING'}
                        </span>
                      </div>

                      {superadminLiveGame?.currently_winning_bid ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                          <div>
                            <div className="text-[10px] uppercase font-mono text-zinc-400">
                              {language === 'am' ? 'አሸናፊ ዋጋ' : 'Winning Amount'}
                            </div>
                            <div className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">
                              {superadminLiveGame.currently_winning_bid.bid_amount.toFixed(2)}{' '}
                              <span className="text-xs text-emerald-200">ETB</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400">
                              ✓ {language === 'am' ? 'ብቸኛና ዝቅተኛ' : 'Solitary lowest'}
                            </span>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase font-mono text-zinc-400">
                              {language === 'am' ? 'ተጫዋች' : 'Leading Bidder'}
                            </div>
                            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                              <span>@{superadminLiveGame.currently_winning_bid.username}</span>
                              <button
                                onClick={() =>
                                  copyAdminText(
                                    superadminLiveGame.currently_winning_bid!.username,
                                    'win_user'
                                  )
                                }
                                className="text-zinc-500 hover:text-white"
                                title="Copy username"
                              >
                                {copiedKey === 'win_user' ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              UID: {superadminLiveGame.currently_winning_bid.user_id.slice(0, 8)}...
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase font-mono text-zinc-400">
                              {language === 'am' ? 'ያልተሸፈነ ስልክ' : 'Unmasked Phone'}
                            </div>
                            <div className="text-sm font-mono font-bold text-[#E5B842] mt-0.5 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                              <span>{superadminLiveGame.currently_winning_bid.phone || 'N/A'}</span>
                              {superadminLiveGame.currently_winning_bid.phone && (
                                <button
                                  onClick={() =>
                                    copyAdminText(
                                      superadminLiveGame.currently_winning_bid!.phone,
                                      'win_phone'
                                    )
                                  }
                                  className="text-zinc-500 hover:text-white"
                                  title="Copy phone"
                                >
                                  {copiedKey === 'win_phone' ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">Ethiopia</div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase font-mono text-zinc-400">
                              {language === 'am' ? 'የገባበት ሰዓት' : 'Placed Time'}
                            </div>
                            <div className="text-xs font-mono text-zinc-200 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>
                                {new Date(
                                  superadminLiveGame.currently_winning_bid.created_at
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {language === 'am' ? 'ክፍያ:' : 'Fee:'}{' '}
                              {superadminLiveGame.currently_winning_bid.fee_paid} ETB
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center space-y-1.5">
                          <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                          <div className="text-xs font-bold text-white">
                            {language === 'am'
                              ? 'እስካሁን ምንም ያልተደገመ አሸናፊ ዋጋ የለም (ሁሉም ተደግመዋል)'
                              : 'No Unique Bid Yet — All Placed Bids Are Currently Duplicated!'}
                          </div>
                          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                            {language === 'am'
                              ? 'በዚህ ጨዋታ የገቡት ሁሉም ዋጋዎች ተደጋግመዋል። ተጫዋቾች አዲስ ያልተደገመ ዋጋ ሲያስገቡ አሸናፊው እዚህ ይታያል።'
                              : 'All placed amounts have collisions. The leading bidder will immediately show as soon as a unique bid is entered.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Financial & Game Telemetry Summary */}
                    {superadminLiveGame && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                          <div className="text-[10px] uppercase font-mono text-zinc-400">
                            {language === 'am' ? 'ጠቅላላ ጨረታዎች' : 'Total Bids'}
                          </div>
                          <div className="font-mono font-bold text-white text-base mt-0.5">
                            {superadminLiveGame.total_bids}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {superadminLiveGame.unique_bids_count} unique / {superadminLiveGame.duplicate_bids_count} dup
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                          <div className="text-[10px] uppercase font-mono text-zinc-400">
                            {language === 'am' ? 'የተሰበሰበ ክፍያ' : 'Gross Fees'}
                          </div>
                          <div className="font-mono font-bold text-amber-400 text-base mt-0.5">
                            {superadminLiveGame.gross_fees_collected.toFixed(2)} ETB
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {auction.participation_fee} ETB / bid
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                          <div className="text-[10px] uppercase font-mono text-zinc-400">
                            {language === 'am' ? 'የዕቃው ወጪ' : 'Item Cost'}
                          </div>
                          <div className="font-mono font-bold text-zinc-300 text-base mt-0.5">
                            {superadminLiveGame.internal_cost.toFixed(2)} ETB
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Wholesale base
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
                          <div className="text-[10px] uppercase font-mono text-zinc-400">
                            {language === 'am' ? 'የተገመተ ትርፍ' : 'Projected Margin'}
                          </div>
                          <div
                            className={`font-mono font-bold text-base mt-0.5 ${
                              superadminLiveGame.projected_net_margin >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {superadminLiveGame.projected_net_margin >= 0 ? '+' : ''}
                            {superadminLiveGame.projected_net_margin.toFixed(2)} ETB
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">Net platform profit</div>
                        </div>
                      </div>
                    )}

                    {/* Duplicate Clusters Strip */}
                    {superadminLiveGame?.duplicate_clusters && superadminLiveGame.duplicate_clusters.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                          <span className="flex items-center gap-1.5 uppercase">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            {language === 'am' ? 'የተደገሙ ዋጋዎች ስብስቦች' : 'Duplicate Price Points'} (
                            {superadminLiveGame.duplicate_clusters.length})
                          </span>
                          <span className="font-mono text-zinc-400 text-[10px]">
                            {language === 'am' ? 'ለዝርዝር ዋጋውን ይጫኑ' : 'Click amount for details'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {superadminLiveGame.duplicate_clusters.map(cl => (
                            <button
                              key={cl.amount}
                              onClick={() => {
                                setAdminSearch(cl.amount.toFixed(2));
                                setActiveTab('history');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-[11px] font-mono text-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                              title="Filter bids by this amount"
                            >
                              <span className="font-bold">{cl.amount.toFixed(2)} ETB</span>
                              <span className="text-[10px] opacity-80">({cl.count}x)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Button to View Full Live Ledger */}
                    <button
                      onClick={() => setActiveTab('history')}
                      className="w-full py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-600 text-purple-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Eye className="w-4 h-4 text-purple-300" />
                      <span>
                        {language === 'am'
                          ? `ሙሉውን የቀጥታ ጨረታዎች መዝገብ እይ (${superadminBids?.length || 0})`
                          : `View Full Unmasked Live Bid Ledger (${superadminBids?.length || 0})`}
                      </span>
                    </button>
                  </div>
                )}

                {/* 4. Customer Bidding Card (Active only for customer when auction is active) */}
                {!isEnded && isCustomer && (
                  <div className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a] space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" /> {t('secret_reverse_bid', 'Place Secret Reverse Bid')}
                      </span>
                      <span className="text-[11px] text-[#E5B842] font-mono font-medium">
                        {t('lowest_unique_formula_note', 'Lowest Unique Wins')}
                      </span>
                    </div>

                    <form onSubmit={handlePlaceBid} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] text-zinc-400 uppercase tracking-wider">
                            {t('secret_bid_amount', 'Secret Bid Amount (ETB)')}
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {t('bid_input_sub', 'Any decimal starting from 1.00 ETB')}
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
                          <span className="text-[10px] text-zinc-500 font-mono uppercase mr-1">{t('presets_label', 'Presets')}:</span>
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
                            {t('fee_label', 'Fee')}: <strong>{auction.participation_fee} ETB</strong> + {t('bid_label', 'Bid')}: <strong>{(parseFloat(bidInput.replace(',', '.')) || 0).toFixed(2)} ETB</strong>
                          </span>
                          <span>
                            {t('total_deduction_label', 'Total')}: <strong className="text-[#E5B842]">{totalDeduction.toFixed(2)} ETB</strong>
                          </span>
                        </div>
                      </div>

                      {/* Insufficient balance prompt */}
                      {hasInsufficientBalance && (
                        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{t('insufficient_balance_msg', 'Insufficient wallet balance')} ({user?.wallet_balance.toFixed(2)} ETB).</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenDeposit();
                            }}
                            className="text-[11px] underline text-[#E5B842] font-semibold shrink-0 cursor-pointer"
                          >
                            {t('deposit_now_btn', 'Deposit Now')}
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
                          {t('cancel_btn', 'Cancel')}
                        </button>
                        <button
                          type="submit"
                          id="submit-bid-btn"
                          disabled={isBidding || hasInsufficientBalance}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E5B842] via-[#d4af37] to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(229,184,66,0.3)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isBidding
                            ? t('submitting_bid_btn', 'Submitting Sealed Bid...')
                            : `${t('confirm_place_bid_btn', 'Confirm & Place Bid')} (${totalDeduction.toFixed(2)} ETB)`}
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
                                ? `👑 ${language === 'am' ? `እንኳን ደስ አለዎት! ይህንን ጨረታ በ ${auction.winning_bid_amount?.toFixed(2)} ብር አሸንፈዋል!` : `CONGRATULATIONS! You won this auction at ${auction.winning_bid_amount?.toFixed(2)} ETB!`}`
                                : (language === 'am' ? 'ጨረታው ተጠናቋል፦ የመጨረሻ ውጤቶች ከታች ተዘርዝረዋል።' : 'Auction Concluded: Final results revealed below.')
                              : t('blind_vault_title', '🔒 Blind Reverse Auction (Confidential Vault)')}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {isEnded
                              ? (language === 'am' ? 'ሁሉም ጨረታዎች ተገምግመው በሙሉ የጨረታ ታሪክ ገጽ ላይ ከዝቅተኛ ወደ ከፍተኛ ተደርድረዋል።' : 'All bids have been audited and sorted lowest-to-highest in the Full Bid History tab.')
                              : t('blind_vault_desc', 'To protect strategic integrity, no player is informed whether their bid is unique, duplicate, or lowest while the auction is active.')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer's Individual Bids */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        {isEnded ? t('your_evaluated_bids', 'Your Final Evaluated Bids') : t('your_sealed_bids', 'Your Sealed Bids')} ({userBids.length})
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {isEnded ? t('audited_results', 'Audited Results') : t('vault_encrypted', 'Vault Encrypted')}
                      </span>
                    </div>

                    {userBids.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-[#18181b]/50 border border-zinc-800 text-center text-xs text-zinc-500">
                        {t('no_user_bids_yet', 'You have not placed any bids on this auction yet.')}
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
                                    <Lock className="w-3 h-3 text-[#E5B842]" /> {t('sealed_tag', 'Sealed & Recorded')}
                                  </span>
                                ) : (
                                  <>
                                    {isWinning && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> {t('unique_lowest_tag', 'Winning Lowest Unique!')}
                                      </span>
                                    )}
                                    {isUniqueNotLowest && (
                                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold text-[10px]">
                                        {t('unique_higher_tag', 'Unique (Higher)')}
                                      </span>
                                    )}
                                    {isDuplicate && (
                                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {t('duplicate_tag', 'Duplicate (Shared)')}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          {language === 'am' ? 'የሱፐር አድሚን የቀጥታ ጨረታዎች መዝገብ' : 'Confidential Live Bid History'} ({adminFilteredBids.length})
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px]">Unmasked Super Admin View • Real-time Stream</span>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-zinc-800 text-[11px]">
                        <button
                          onClick={() => setAdminFilter('all')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            adminFilter === 'all'
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {language === 'am' ? 'ሁሉም' : 'All'} ({superadminBids.length})
                        </button>
                        <button
                          onClick={() => setAdminFilter('winning')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            adminFilter === 'winning'
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          👑 {language === 'am' ? 'አሸናፊ' : 'Winning'}
                        </button>
                        <button
                          onClick={() => setAdminFilter('unique')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            adminFilter === 'unique'
                              ? 'bg-amber-600 text-white font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ⚡ {language === 'am' ? 'ያልተደገመ' : 'Unique'}
                        </button>
                        <button
                          onClick={() => setAdminFilter('duplicate')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            adminFilter === 'duplicate'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ⚠️ {language === 'am' ? 'የተደገመ' : 'Duplicate'}
                        </button>
                      </div>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder={
                            language === 'am'
                              ? 'በተጠቃሚ ስም፣ ስልክ፣ ወይም ዋጋ ፈልግ...'
                              : 'Filter by user, phone, or bid...'
                          }
                          value={adminSearch}
                          onChange={e => setAdminSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <select
                        value={adminSort}
                        onChange={e => setAdminSort(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#09090b] border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-purple-500"
                      >
                        <option value="amount_asc">Lowest to Highest (Rank)</option>
                        <option value="amount_desc">Highest to Lowest</option>
                        <option value="time_desc">Newest First</option>
                      </select>
                    </div>

                    <div className="border border-purple-800/40 rounded-2xl overflow-hidden bg-[#18181b]">
                      <div className="max-h-80 overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left text-xs min-w-[620px]">
                          <thead className="bg-purple-950/40 text-purple-200 border-b border-purple-800/40 font-mono text-[10px] uppercase sticky top-0 z-20">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">{t('bidder_col', 'Bidder')}</th>
                              <th className="py-2.5 px-3">{language === 'am' ? 'ያልተሸፈነ ስልክ' : 'Unmasked Phone'}</th>
                              <th className="py-2.5 px-3">{t('bid_amount_col', 'Amount')}</th>
                              <th className="py-2.5 px-3">{t('status_col', 'Status')}</th>
                              <th className="py-2.5 px-3">{language === 'am' ? 'የተጋጩ' : 'Collisions'}</th>
                              <th className="py-2.5 px-3">{t('time_col', 'Time')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                            {adminFilteredBids.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-zinc-500">
                                  {language === 'am' ? 'ምንም የሚስማማ ጨረታ አልተገኘም።' : 'No matching bids found.'}
                                </td>
                              </tr>
                            ) : (
                              adminFilteredBids.map((b, idx) => {
                                const isWinner = b.status === 'unique_lowest';
                                const isUniqueHigher = b.status === 'unique_not_lowest';

                                return (
                                  <tr
                                    key={b.id}
                                    className={`transition-colors ${
                                      isWinner
                                        ? 'bg-emerald-950/40 text-emerald-200 font-bold'
                                        : isUniqueHigher
                                        ? 'hover:bg-amber-950/20 text-zinc-200'
                                        : 'hover:bg-zinc-800/40 text-zinc-400'
                                    }`}
                                  >
                                    <td className="py-2 px-3 font-mono">
                                      {isWinner ? (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                          #1 👑
                                        </span>
                                      ) : (
                                        `#${b.rank || idx + 1}`
                                      )}
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-1.5 font-bold text-white">
                                        <span>@{b.username}</span>
                                        <button
                                          onClick={() => copyAdminText(b.username, `tab2_user_${b.id}`)}
                                          className="text-zinc-500 hover:text-white"
                                          title="Copy username"
                                        >
                                          {copiedKey === `tab2_user_${b.id}` ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-zinc-300">
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-[#E5B842] shrink-0" />
                                        <span>{b.phone}</span>
                                        <button
                                          onClick={() => copyAdminText(b.phone, `tab2_phone_${b.id}`)}
                                          className="text-zinc-500 hover:text-white"
                                          title="Copy phone"
                                        >
                                          {copiedKey === `tab2_phone_${b.id}` ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 font-bold text-sm">
                                      <span
                                        className={
                                          isWinner
                                            ? 'text-emerald-300'
                                            : isUniqueHigher
                                            ? 'text-amber-400'
                                            : 'text-zinc-300'
                                        }
                                      >
                                        {b.bid_amount.toFixed(2)} ETB
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      {isWinner ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-emerald-400" />
                                          {t('unique_lowest_tag', 'Unique Lowest')}
                                        </span>
                                      ) : isUniqueHigher ? (
                                        <span className="text-amber-400">{t('unique_higher_tag', 'Unique (Higher)')}</span>
                                      ) : (
                                        <span className="text-rose-400 text-[10px]">
                                          ⚠️ {t('duplicate_tag', 'Duplicate')} ({b.duplicate_count || 2}x)
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-zinc-400 text-[10px]">
                                      {b.duplicate_bidders && b.duplicate_bidders.length > 1 ? (
                                        <span className="text-rose-400">
                                          {b.duplicate_bidders.map(d => `@${d.username}`).join(', ')}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-400/80">—</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-zinc-400">
                                      {new Date(b.created_at).toLocaleTimeString()}
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
                ) : isEnded ? (
                  /* Case B: Concluded Auction — Organized Table sorted lowest to highest with masked information! (Requirement 6) */
                  <div className="space-y-4">
                    {/* Header & Quick Navigation */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#E5B842] shrink-0" />
                        <span className="font-bold text-[#E5B842] uppercase tracking-wider">
                          {language === 'am' ? 'ይፋዊ የተረጋገጡ ጨረታዎች (ከዝቅተኛ ወደ ከፍተኛ)' : 'Official Concluded Bids (Lowest to Highest)'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] border border-amber-500/20 font-bold">
                          {(auction?.total_bids || concludedBids.length).toLocaleString()} {language === 'am' ? 'ጠቅላላ ጨረታዎች' : 'Audited Bids'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleJumpToWinner}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
                      >
                        <span>👑 {language === 'am' ? 'ወደ አሸናፊው ዝለል' : 'Jump to Winning Bid'}</span>
                        <span className="text-emerald-400 font-extrabold">({auction?.winning_bid_amount?.toFixed(2)} ETB)</span>
                      </button>
                    </div>

                    {/* Statistical Breakdown HUD */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <div className="text-[10px] uppercase font-mono text-zinc-500">
                          {language === 'am' ? 'ጠቅላላ የተገመገሙ' : 'Total Evaluated'}
                        </div>
                        <div className="font-mono font-bold text-white text-sm mt-0.5">
                          {(auction?.total_bids || concludedBids.length).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <div className="text-[10px] uppercase font-mono text-emerald-400">
                          {language === 'am' ? 'አሸናፊ ዋጋ (ያልተደገመ)' : 'Winning Lowest Unique'}
                        </div>
                        <div className="font-mono font-bold text-emerald-300 text-sm mt-0.5">
                          {auction?.winning_bid_amount?.toFixed(2)} ETB 👑
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30">
                        <div className="text-[10px] uppercase font-mono text-amber-400">
                          {language === 'am' ? 'ያልተደገሙ (ከፍተኛ)' : 'Unique (Higher)'}
                        </div>
                        <div className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                          {concludedBids.filter(b => b.status === 'unique_not_lowest').length.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30">
                        <div className="text-[10px] uppercase font-mono text-red-400">
                          {language === 'am' ? 'የተጋጩ (የተደገሙ)' : 'Collided Duplicates'}
                        </div>
                        <div className="font-mono font-bold text-red-300 text-sm mt-0.5">
                          {concludedBids.filter(b => b.status === 'not_unique').length.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder={
                            language === 'am'
                              ? 'በተጠቃሚ ስም፣ ስልክ፣ ወይም ዋጋ ፈልግ (ምሳሌ፦ 14.85)...'
                              : 'Search by player, masked phone, or bid amount (e.g. 14.85)...'
                          }
                          value={concludedSearch}
                          onChange={e => {
                            setConcludedSearch(e.target.value);
                            setConcludedPage(1);
                          }}
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E5B842] font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-zinc-800 text-[11px] overflow-x-auto scrollbar-none">
                        <button
                          type="button"
                          onClick={() => { setConcludedFilter('all'); setConcludedPage(1); }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                            concludedFilter === 'all'
                              ? 'bg-[#E5B842] text-black font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {language === 'am' ? 'ሁሉም' : 'All'} ({filteredConcludedBids.length.toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConcludedFilter('winner'); setConcludedPage(1); }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                            concludedFilter === 'winner'
                              ? 'bg-emerald-500 text-black font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          👑 {language === 'am' ? 'አሸናፊ' : 'Winner'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConcludedFilter('unique'); setConcludedPage(1); }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                            concludedFilter === 'unique'
                              ? 'bg-amber-500 text-black font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ⚡ {language === 'am' ? 'ያልተደገመ' : 'Unique'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConcludedFilter('duplicate'); setConcludedPage(1); }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                            concludedFilter === 'duplicate'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ⚠️ {language === 'am' ? 'የተደገመ' : 'Duplicate'}
                        </button>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="border border-[#27272a] rounded-2xl overflow-hidden bg-[#18181b]">
                      <div className="max-h-80 overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead className="bg-[#09090b] text-zinc-400 border-b border-[#27272a] font-mono text-[10px] uppercase sticky top-0 z-10">
                            <tr>
                              <th className="py-2.5 px-3">{t('rank_col', 'Rank')}</th>
                              <th className="py-2.5 px-3">{t('bid_amount_col', 'Bid Amount')}</th>
                              <th className="py-2.5 px-3">{t('status_col', 'Result / Status')}</th>
                              <th className="py-2.5 px-3">{t('bidder_col', 'Player (Masked)')}</th>
                              <th className="py-2.5 px-3">{language === 'am' ? 'ስልክ (የተሸፈነ)' : 'Phone (Masked)'}</th>
                              <th className="py-2.5 px-3">{t('time_col', 'Time')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                            {paginatedConcludedBids.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-zinc-500">
                                  {language === 'am' ? 'ለዚህ ፍለጋ ምንም የሚስማማ ጨረታ አልተገኘም።' : 'No bids match the filter or search criteria.'}
                                </td>
                              </tr>
                            ) : (
                              paginatedConcludedBids.map(b => {
                                const isWinner = b.status === 'unique_lowest';
                                return (
                                  <tr
                                    key={b.id}
                                    className={`transition-colors ${
                                      isWinner
                                        ? 'bg-emerald-950/40 text-emerald-200 font-bold border-y-2 border-emerald-500/50'
                                        : 'hover:bg-zinc-800/30 text-zinc-300'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-mono">
                                      {isWinner ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 inline-flex items-center gap-1">
                                          #1 👑
                                        </span>
                                      ) : (
                                        `#${b.rank}`
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-white">
                                      <span className={isWinner ? 'text-emerald-300 text-sm font-extrabold' : ''}>
                                        {b.bid_amount.toFixed(2)} ETB
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {isWinner ? (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                          <Trophy className="w-3 h-3 text-emerald-400" /> {t('unique_lowest_tag', 'Winner (Lowest Unique)')}
                                        </span>
                                      ) : b.status === 'unique_not_lowest' ? (
                                        <span className="text-amber-400 flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-amber-400" />
                                          {t('unique_higher_tag', 'Unique (Higher)')}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-500">{t('duplicate_tag', 'Duplicate')}</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-zinc-300 font-medium">
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

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400 pt-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span>
                          {filteredConcludedBids.length === 0
                            ? '0 bids'
                            : language === 'am'
                            ? `ከ${filteredConcludedBids.length.toLocaleString()} ውስጥ ${(concludedPage - 1) * concludedPageSize + 1} - ${Math.min(concludedPage * concludedPageSize, filteredConcludedBids.length)} በማሳየት ላይ`
                            : `Showing ${(concludedPage - 1) * concludedPageSize + 1} - ${Math.min(concludedPage * concludedPageSize, filteredConcludedBids.length)} of ${filteredConcludedBids.length.toLocaleString()} audited bids`}
                        </span>
                        <span className="text-zinc-600 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-zinc-500">{language === 'am' ? 'በገጽ:' : 'Per page:'}</span>
                          <select
                            value={concludedPageSize}
                            onChange={e => {
                              setConcludedPageSize(Number(e.target.value));
                              setConcludedPage(1);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px] focus:outline-none focus:border-[#E5B842] cursor-pointer"
                          >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <button
                          type="button"
                          disabled={concludedPage === 1}
                          onClick={() => setConcludedPage(1)}
                          className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:border-zinc-700 cursor-pointer disabled:cursor-not-allowed"
                          title="First page"
                        >
                          «
                        </button>
                        <button
                          type="button"
                          disabled={concludedPage === 1}
                          onClick={() => setConcludedPage(p => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:border-zinc-700 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {language === 'am' ? 'ቀዳሚ' : 'Prev'}
                        </button>
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-white font-bold">
                          {concludedPage} / {totalConcludedPages}
                        </span>
                        <button
                          type="button"
                          disabled={concludedPage >= totalConcludedPages}
                          onClick={() => setConcludedPage(p => Math.min(totalConcludedPages, p + 1))}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:border-zinc-700 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {language === 'am' ? 'ቀጣይ' : 'Next'}
                        </button>
                        <button
                          type="button"
                          disabled={concludedPage >= totalConcludedPages}
                          onClick={() => setConcludedPage(totalConcludedPages)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:border-zinc-700 cursor-pointer disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          »
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case C: Active auction for customer or guest */
                  <div className="p-8 rounded-2xl bg-[#18181b] border border-[#27272a] text-center space-y-2">
                    <Lock className="w-8 h-8 text-[#E5B842] mx-auto opacity-70" />
                    <h3 className="font-serif font-bold text-white text-sm">
                      {language === 'am' ? 'የጨረታው ሚስጥራዊነት ነቅቷል' : 'Reverse Auction Confidentiality Active'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      {language === 'am'
                        ? 'የተጫዋቾችን የጨረታ ስልት ለመጠበቅ ጨዋታው እስኪያበቃ ድረስ የሌሎች ሰዎች ዋጋ በሚስጥር ይቆያል። ቆጣሪው 00:00 ሲደርስ ሙሉው የጨረታ ታሪክ ከዝቅተኛ ወደ ከፍተኛ በይፋ ይፋ ይሆናል!'
                        : 'To safeguard competitive bidding strategy, other players\' bids remain secret while the auction is live. The complete ranked table from lowest to highest bidder will be revealed automatically when the timer reaches 00:00!'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Strategic Insight Footer */}
            <div className="p-3 rounded-2xl bg-[#18181b]/50 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#E5B842]" />
                <span>
                  {language === 'am'
                    ? 'ምክር፦ ዝቅተኛውን ያልተደገመ ዋጋ ለማግኘት በተለያዩ አነስተኛ ልዩነቶች በርካታ ሚስጥራዊ ጨረታዎችን ያስገቡ!'
                    : 'Tip: Place multiple bids across small intervals to uncover the lowest unique figure!'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
