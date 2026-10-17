import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  Activity,
  Eye,
  Crown,
  Trophy,
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Clock,
  Coins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Edit3,
  Trash2,
  Archive,
  Hash,
} from 'lucide-react';
import type { AuctionStatus, Auction } from '../types.js';
import { SuperAdminEditAuctionModal } from './SuperAdminEditAuctionModal.js';
import { calculateTimeRemaining } from '../utils/timer.js';

interface DuplicateBidder {
  username: string;
  phone: string;
  user_id: string;
  created_at?: string;
}

interface LiveBidItem {
  id: string;
  rank: number;
  bid_amount: number;
  status: 'unique_lowest' | 'unique_not_lowest' | 'not_unique';
  user_id: string;
  username: string;
  phone: string;
  created_at: string;
  fee_paid: number;
  duplicate_count: number;
  duplicate_bidders?: DuplicateBidder[];
}

interface CurrentlyWinningBid {
  id: string;
  bid_amount: number;
  user_id: string;
  username: string;
  phone: string;
  created_at: string;
  fee_paid: number;
}

interface DuplicateCluster {
  amount: number;
  count: number;
  bidders: DuplicateBidder[];
}

interface LiveGameAuction {
  id: string;
  title: string;
  category: string;
  image_url: string;
  participation_fee: number;
  internal_cost: number;
  start_price: number;
  end_time: string;
  status: AuctionStatus;
  total_bids: number;
  unique_bids_count: number;
  duplicate_bids_count: number;
  gross_fees_collected: number;
  projected_net_margin: number;
  currently_winning_bid: CurrentlyWinningBid | null;
  duplicate_clusters: DuplicateCluster[];
  bids: LiveBidItem[];
}

export interface PreviousGameAuction {
  id: string;
  title: string;
  category: string;
  image_url: string;
  status: AuctionStatus;
  total_bids: number;
  start_price: number;
  winning_bid_amount: number;
  winner_username: string | null;
  winner_phone: string | null;
  end_time: string;
  created_at: string;
  description?: string;
  participation_fee: number;
  internal_cost: number;
}

interface SuperAdminLiveGameDeskProps {
  onSelectAuction?: (auctionId: string) => void;
}

export const SuperAdminLiveGameDesk: React.FC<SuperAdminLiveGameDeskProps> = ({
  onSelectAuction,
}) => {
  const { token, user } = useAuth();
  const { language, t } = useTranslation();

  const [deskView, setDeskView] = useState<'live' | 'previous'>('live');
  const [games, setGames] = useState<LiveGameAuction[]>([]);
  const [previousGames, setPreviousGames] = useState<PreviousGameAuction[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');

  // Table filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'winning' | 'unique' | 'duplicate'>('all');
  const [sortBy, setSortBy] = useState<'amount_asc' | 'amount_desc' | 'time_desc'>('amount_asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClusterAmount, setExpandedClusterAmount] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PreviousGameAuction | null>(null);
  const [prevGameSearch, setPrevGameSearch] = useState<string>('');
  const [prevStatusFilter, setPrevStatusFilter] = useState<'all' | 'ended' | 'cancelled'>('all');
  const [, setClockTick] = useState(0);

  // 1-second live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => setClockTick(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchLiveGames = async (manual = false) => {
    if (!token) return;
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/superadmin/live-game-monitor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const auctionsList: LiveGameAuction[] = data.auctions || [];
        setGames(auctionsList);
        if (data.previous_auctions) {
          setPreviousGames(data.previous_auctions);
        }
        setLastUpdated(new Date());
        setError('');

        // Preserve active selection
        setSelectedGameId(prevId => {
          if (auctionsList.length === 0) return null;
          if (prevId && auctionsList.some(g => g.id === prevId)) {
            return prevId;
          }
          return auctionsList[0].id;
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to fetch live game telemetry');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching live telemetry');
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!token) return;
    setDeletingId(gameId);
    try {
      const res = await fetch(`/api/superadmin/auctions/${gameId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirmTarget(null);
        fetchLiveGames(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to delete game');
      }
    } catch (err: any) {
      setError(err.message || 'Network error deleting game');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchLiveGames();
    const interval = setInterval(() => fetchLiveGames(false), 3000);
    return () => clearInterval(interval);
  }, [token]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Selected active game
  const activeGame = games.find(g => g.id === selectedGameId) || games[0] || null;

  // Platform-wide live totals
  const totalActiveGames = games.length;
  const totalPlatformLiveBids = games.reduce((sum, g) => sum + g.total_bids, 0);
  const totalGrossCollected = games.reduce((sum, g) => sum + g.gross_fees_collected, 0);
  const totalInternalCosts = games.reduce((sum, g) => sum + (g.internal_cost || 0), 0);
  const totalNetMargin = totalGrossCollected - totalInternalCosts;
  const totalUniqueBids = games.reduce((sum, g) => sum + g.unique_bids_count, 0);
  const totalDuplicateBids = games.reduce((sum, g) => sum + g.duplicate_bids_count, 0);

  // Filtered & sorted bids for selected game
  const filteredBids = useMemo(() => {
    if (!activeGame || !activeGame.bids) return [];
    let list = [...activeGame.bids];

    // Status filter
    if (statusFilter === 'winning') {
      list = list.filter(b => b.status === 'unique_lowest');
    } else if (statusFilter === 'unique') {
      list = list.filter(b => b.status === 'unique_lowest' || b.status === 'unique_not_lowest');
    } else if (statusFilter === 'duplicate') {
      list = list.filter(b => b.status === 'not_unique');
    }

    // Search query (username, phone, amount)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        b =>
          b.username.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.bid_amount.toFixed(2).includes(q)
      );
    }

    // Sorting
    if (sortBy === 'amount_asc') {
      list.sort((a, b) => a.bid_amount - b.bid_amount);
    } else if (sortBy === 'amount_desc') {
      list.sort((a, b) => b.bid_amount - a.bid_amount);
    } else if (sortBy === 'time_desc') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [activeGame, statusFilter, searchQuery, sortBy]);

  // Filtered Previous & Concluded Games
  const filteredPreviousGames = useMemo(() => {
    return previousGames.filter(g => {
      const q = prevGameSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.winner_username && g.winner_username.toLowerCase().includes(q)) ||
        (g.winner_phone && g.winner_phone.includes(q)) ||
        g.id.toLowerCase().includes(q);
      const matchesStatus =
        prevStatusFilter === 'all' || g.status === prevStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [previousGames, prevGameSearch, prevStatusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#121215] to-[#121215] border border-purple-800/60 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              {language === 'am' ? 'ሱፐር አድሚን ብቻ' : 'Super Admin Only'}
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'am' ? 'የቀጥታ ስርጭት ነቅቷል (በየ3 ሰከንዱ ይታደሳል)' : 'Live Feed Active (3s polling)'}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide mt-3 flex items-center gap-3">
            <Activity className="w-7 h-7 text-[#E5B842] animate-pulse" />
            <span>
              {language === 'am'
                ? 'የቀጥታ ጨረታዎች እና አሸናፊ ዋጋዎች ቁጥጥር'
                : 'Live Game Control & Bid Radar'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-3xl leading-relaxed">
            {language === 'am'
              ? 'ለቁጥጥር እና ለኦዲት ዓላማዎች፦ የሁሉንም ተጠቃሚዎች የቀጥታ ጨረታ ዋጋ፣ ያልተሸፈነ ስልክ፣ እና በአሁኑ ሰዓት አሸናፊ የሆነውን ዝቅተኛ ያልተደገመ ዋጋ በቅጽበት ይከታተሉ። ይህ መረጃ ለሱፐር አድሚን ብቻ የተወሰነ ሲሆን መደበኛ ተጠቃሚዎች ማየት አይችሉም።'
              : 'Dedicated executive control deck: Monitor every user live bid amount, currently winning lowest unique bid, and full financial telemetry in real time. Strictly confidential to Super Admin.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => fetchLiveGames(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-300' : ''}`} />
            <span>{language === 'am' ? 'አሁን አድስ' : 'Refresh Now'}</span>
          </button>
          <div className="text-[11px] font-mono text-zinc-400 text-center sm:text-right">
            <div>{language === 'am' ? 'የመጨረሻ ዝመና' : 'Last Synced'}</div>
            <div className="text-zinc-200 font-bold">{lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top View Mode Switcher: Live Radar vs Previous Games */}
      <div className="flex items-center gap-2 bg-[#121215] p-1.5 rounded-2xl border border-[#27272a] w-fit">
        <button
          type="button"
          onClick={() => setDeskView('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            deskView === 'live'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/50'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{language === 'am' ? 'የቀጥታ ጨዋታዎች ራዳር' : 'Live Games Radar'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-mono text-[10px]">
            {games.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDeskView('previous')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            deskView === 'previous'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-950/50'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{language === 'am' ? 'ያለፉ ጨዋታዎች ቁጥጥርና ማረም' : 'Previous Games & State Override'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 font-mono text-[10px]">
            {previousGames.length}
          </span>
        </button>
      </div>

      {/* 2. LIVE RADAR VIEW */}
      {deskView === 'live' && (
        <div className="space-y-6">
          {/* Platform Live Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono text-zinc-400">
            {language === 'am' ? 'የቀጥታ ጨዋታዎች' : 'Active Games'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalActiveGames}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {language === 'am' ? 'በአሁኑ ሰዓት ክፍት' : 'Live on platform'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono text-zinc-400">
            {language === 'am' ? 'ጠቅላላ የቀጥታ ጨረታዎች' : 'Live Bids Count'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#E5B842]">
            {totalPlatformLiveBids}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {language === 'am' ? 'በሁሉም ጨዋታዎች' : 'Across all games'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-emerald-900/40 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono text-emerald-400">
            {language === 'am' ? 'ያልተደገሙ ጨረታዎች' : 'Unique Bids'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {totalUniqueBids}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {totalPlatformLiveBids > 0
              ? `${Math.round((totalUniqueBids / totalPlatformLiveBids) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-rose-900/40 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono text-rose-400">
            {language === 'am' ? 'የተደገሙ ጨረታዎች' : 'Duplicate Bids'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {totalDuplicateBids}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {totalPlatformLiveBids > 0
              ? `${Math.round((totalDuplicateBids / totalPlatformLiveBids) * 100)}% collided`
              : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-amber-900/40 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono text-amber-400">
            {language === 'am' ? 'የተሰበሰበ ክፍያ (Gross)' : 'Gross Fees'}
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {totalGrossCollected.toFixed(2)} <span className="text-xs text-zinc-400">ETB</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {language === 'am' ? 'የመሳተፊያ ገቢ' : 'Participation fees'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121215] border border-purple-900/40 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono text-purple-400">
            {language === 'am' ? 'የተገመተ ትርፍ' : 'Projected Margin'}
          </div>
          <div
            className={`text-lg sm:text-xl font-bold font-mono ${
              totalNetMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalNetMargin >= 0 ? '+' : ''}
            {totalNetMargin.toFixed(2)} <span className="text-xs text-zinc-400">ETB</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {language === 'am' ? 'ከወጪ በኋላ' : 'After item costs'}
          </div>
        </div>
      </div>

      {/* 3. Live Games Selector / Carousel */}
      {games.length === 0 && !isLoading ? (
        <div className="p-12 rounded-3xl bg-[#121215] border border-[#27272a] text-center space-y-3">
          <Activity className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-white">
            {language === 'am' ? 'በአሁኑ ሰዓት ምንም ንቁ የቀጥታ ጨረታ የለም' : 'No Active Live Auctions At This Moment'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {language === 'am'
              ? 'ሁሉም ጨረታዎች ተጠናቅቀዋል ወይም በአስተዳዳሪው አልተከፈቱም። አዲስ ጨረታ ለመጀመር የጨረታ መፍጠሪያውን ይጠቀሙ።'
              : 'All auctions have concluded or are awaiting launch. Create or resume an auction to track real-time bids.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#E5B842]" />
              {language === 'am' ? 'የቀጥታ ጨዋታዎች መምረጫ' : 'Select Live Game to Track'} ({games.length})
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              {language === 'am' ? 'ዝርዝሩን ለማየት ጨዋታውን ይምረጡ' : 'Click card to focus telemetry'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(g => {
              const isSelected = selectedGameId === g.id;
              const winning = g.currently_winning_bid;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGameId(g.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-purple-500'
                      : 'bg-[#121215] border-[#27272a] hover:border-zinc-600'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={g.image_url}
                        alt={g.title}
                        className="w-14 h-14 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-800 text-[#E5B842] border border-[#E5B842]/30">
                            {g.category}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm truncate mt-1">
                          {g.title}
                        </h4>
                        <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between mt-1">
                          <span>{g.total_bids} {language === 'am' ? 'ጨረታዎች' : 'live bids'}</span>
                          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                            <Clock className="w-2.5 h-2.5 text-[#E5B842]" />
                            {calculateTimeRemaining(g.end_time).formatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CURRENTLY WINNING BID CALLOUT */}
                    <div
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        winning
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                          : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-mono flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          {winning ? (
                            <>
                              <Crown className="w-3.5 h-3.5 text-emerald-400" />
                              {language === 'am' ? 'አሸናፊ ዋጋ (ዝቅተኛ ያልተደገመ)' : 'Current Winning Bid'}
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              {language === 'am' ? 'ያልተደገመ ዋጋ የለም (ሁሉም ተደግመዋል)' : 'No Unique Bid Yet'}
                            </>
                          )}
                        </span>
                      </div>

                      {winning ? (
                        <div className="mt-1.5 flex items-baseline justify-between">
                          <div>
                            <span className="text-lg font-bold font-mono text-emerald-300">
                              {winning.bid_amount.toFixed(2)} ETB
                            </span>
                            <span className="text-[11px] text-zinc-400 ml-2">
                              @{winning.username}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                            {winning.phone}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 text-[11px] text-amber-300/80">
                          {language === 'am'
                            ? 'ሁሉም የገቡ ዋጋዎች ተደግመዋል ወይም ጨረታ አልገባም።'
                            : 'All current bids are duplicated or tied.'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>
                      {language === 'am' ? 'ገቢ:' : 'Gross:'}{' '}
                      <strong className="text-white">{g.gross_fees_collected.toFixed(2)} ETB</strong>
                    </span>
                    <span className={g.projected_net_margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {language === 'am' ? 'ትርፍ:' : 'Net:'}{' '}
                      <strong>{g.projected_net_margin >= 0 ? '+' : ''}{g.projected_net_margin.toFixed(2)} ETB</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Active Game Deep Live Inspection Dashboard */}
      {activeGame && (
        <div className="space-y-6 pt-4 border-t border-[#27272a]">
          {/* Active Game Header & Currently Winning HUD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#18181b] via-[#121215] to-[#09090b] border border-purple-500/40 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={activeGame.image_url}
                  alt={activeGame.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-500/50 shrink-0 shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 text-[10px] font-mono uppercase font-bold">
                      {activeGame.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                    {activeGame.title}
                  </h2>
                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      {language === 'am' ? 'የመሳተፊያ ክፍያ:' : 'Fee per bid:'}{' '}
                      <strong className="text-[#E5B842] font-mono">{activeGame.participation_fee} ETB</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {language === 'am' ? 'የዕቃው ወጪ:' : 'Item Wholesale Cost:'}{' '}
                      <strong className="text-zinc-300 font-mono">{activeGame.internal_cost.toFixed(2)} ETB</strong>
                    </span>
                  </div>

                  {/* Requirement 2: Live Auction Timer as Days, Hours, Minutes, and Seconds */}
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/80 border border-amber-500/50 shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-[#E5B842] animate-pulse" />
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      {language === 'am' ? 'የሚቀረው ጊዜ፦' : 'Closing In:'}{' '}
                      <span className="text-white tracking-wide">
                        {calculateTimeRemaining(activeGame.end_time).formatted}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Requirement 4: Super Admin Edit Live Auction */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg"
                  title="Edit title, description, category, images, retail, fee, and closing schedule"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'ጨረታውን አርም' : 'Edit Live Item'}</span>
                </button>

                {onSelectAuction && (
                  <button
                    onClick={() => onSelectAuction(activeGame.id)}
                    className="px-4 py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{language === 'am' ? 'በጨዋታ ሞዳል ክፈት' : 'Inspect in Full Modal'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* BIG PROMINENT CURRENTLY WINNING BID HUD */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#18181b] to-purple-950/40 border-2 border-emerald-500/60 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/40 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Crown className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span>
                    {language === 'am'
                      ? 'የጨዋታው የቀጥታ አሸናፊ ዋጋ (ዝቅተኛ ያልተደገመ ጨረታ)'
                      : 'Live Game Currently Winning Bid (Lowest Unique Bid)'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                  <span>{language === 'am' ? 'የጨረታ ሁኔታ:' : 'Evaluation Engine:'}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/60 font-bold">
                    REAL-TIME ACID
                  </span>
                </div>
              </div>

              {activeGame.currently_winning_bid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-zinc-400">
                      {language === 'am' ? 'አሸናፊ ዋጋ (Winning Bid)' : 'Winning Bid Amount'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-1">
                      {activeGame.currently_winning_bid.bid_amount.toFixed(2)}{' '}
                      <span className="text-sm font-sans text-emerald-200">ETB</span>
                    </div>
                    <span className="inline-block mt-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ✓ {language === 'am' ? 'ብቸኛና ዝቅተኛ' : 'Lowest & Exactly Unique'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-mono text-zinc-400">
                      {language === 'am' ? 'አሸናፊ ተጫዋች' : 'Winning Bidder'}
                    </div>
                    <div className="text-base font-bold text-white mt-1 flex items-center gap-2">
                      <span>@{activeGame.currently_winning_bid.username}</span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            activeGame.currently_winning_bid!.username,
                            'winning_user'
                          )
                        }
                        className="text-zinc-500 hover:text-white"
                        title="Copy username"
                      >
                        {copiedId === 'winning_user' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      UID: {activeGame.currently_winning_bid.user_id.slice(0, 8)}...
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-mono text-zinc-400">
                      {language === 'am' ? 'ያልተሸፈነ ስልክ' : 'Unmasked Phone'}
                    </div>
                    <div className="text-base font-mono font-bold text-[#E5B842] mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#E5B842] shrink-0" />
                      <span>{activeGame.currently_winning_bid.phone || 'N/A'}</span>
                      {activeGame.currently_winning_bid.phone && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              activeGame.currently_winning_bid!.phone,
                              'winning_phone'
                            )
                          }
                          className="text-zinc-500 hover:text-white"
                          title="Copy phone"
                        >
                          {copiedId === 'winning_phone' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {language === 'am' ? 'የኢትዮጵያ ስልክ መስመር' : 'Verified Ethiopian Line'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-mono text-zinc-400">
                      {language === 'am' ? 'የገባበት ሰዓት' : 'Placed Timestamp'}
                    </div>
                    <div className="text-base font-mono text-zinc-200 mt-1 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{new Date(activeGame.currently_winning_bid.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {language === 'am' ? 'የተከፈለ ክፍያ:' : 'Fee paid:'}{' '}
                      {activeGame.currently_winning_bid.fee_paid} ETB
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="font-serif font-bold text-white text-base">
                    {language === 'am'
                      ? 'እስካሁን ምንም ያልተደገመ አሸናፊ ዋጋ የለም'
                      : 'No Unique Bid Yet — All Current Bids Are Duplicated or Tied!'}
                  </div>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    {language === 'am'
                      ? 'በዚህ ጨዋታ ላይ የገቡት ሁሉም ዋጋዎች ቢያንስ በሁለት ተጫዋቾች ተደጋግመዋል ወይም ምንም ጨረታ አልገባም። አዲስ ተጫዋች ያልተደገመ ቁጥር እስኪያገኝ ድረስ ጨዋታው ክፍት ነው።'
                      : 'Every price point placed so far has been bid on by 2 or more players, neutralizing uniqueness. The game is active until a player places a solitary unique bid!'}
                  </p>
                </div>
              )}
            </div>

            {/* DUPLICATE CLUSTERS BREAKDOWN */}
            {activeGame.duplicate_clusters && activeGame.duplicate_clusters.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#121215] border border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {language === 'am'
                      ? 'የተደገሙ ዋጋዎች ስብስቦች (Duplicate Clusters)'
                      : 'Contested Duplicate Price Points'} ({activeGame.duplicate_clusters.length})
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {language === 'am' ? 'የተጋጩ ተጫዋቾችን ለማየት ይጫኑ' : 'Click price to see colliding bidders'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeGame.duplicate_clusters.map(cluster => {
                    const isExpanded = expandedClusterAmount === cluster.amount;
                    return (
                      <div key={cluster.amount} className="relative">
                        <button
                          onClick={() =>
                            setExpandedClusterAmount(isExpanded ? null : cluster.amount)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/60'
                          }`}
                        >
                          <span>{cluster.amount.toFixed(2)} ETB</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px]">
                            {cluster.count} {language === 'am' ? 'ተጫዋቾች' : 'bidders'}
                          </span>
                        </button>

                        {/* Dropdown popup of colliding bidders */}
                        {isExpanded && (
                          <div className="absolute z-30 left-0 top-full mt-2 w-72 p-3 rounded-2xl bg-[#18181b] border border-rose-600 shadow-2xl text-xs space-y-2 animate-fadeIn">
                            <div className="font-bold text-rose-300 text-[11px] uppercase flex items-center justify-between">
                              <span>{cluster.amount.toFixed(2)} ETB Collisions</span>
                              <span className="font-mono text-zinc-400">{cluster.count} total</span>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {cluster.bidders.map((b, bIdx) => (
                                <div
                                  key={bIdx}
                                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]"
                                >
                                  <div>
                                    <div className="font-bold text-white">@{b.username}</div>
                                    <div className="text-zinc-400 font-mono text-[10px]">{b.phone}</div>
                                  </div>
                                  {b.created_at && (
                                    <div className="text-[10px] text-zinc-500 font-mono">
                                      {new Date(b.created_at).toLocaleTimeString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Complete Live Bid Ledger Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span>
                    {language === 'am'
                      ? 'የቀጥታ ጨረታዎች ሙሉ ዝርዝር (Live Unmasked Ledger)'
                      : 'Live Unmasked Bid Ledger'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">({filteredBids.length})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {language === 'am'
                    ? 'የእያንዳንዱን ተጠቃሚ ትክክለኛ ዋጋ፣ ስልክ፣ እና ሁኔታ በቀጥታ ይከታተሉ።'
                    : 'Track every user live bid amount, unmasked phone, and uniqueness evaluation.'}
                </p>
              </div>

              {/* Status Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'all'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {language === 'am' ? 'ሁሉም' : 'All'} ({activeGame.bids.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('winning')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'winning'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    👑 {language === 'am' ? 'አሸናፊ' : 'Winning'} (
                    {activeGame.currently_winning_bid ? 1 : 0})
                  </button>
                  <button
                    onClick={() => setStatusFilter('unique')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'unique'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ⚡ {language === 'am' ? 'ያልተደገመ' : 'Unique'} ({activeGame.unique_bids_count})
                  </button>
                  <button
                    onClick={() => setStatusFilter('duplicate')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'duplicate'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ⚠️ {language === 'am' ? 'የተደገመ' : 'Duplicate'} ({activeGame.duplicate_bids_count})
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={
                    language === 'am'
                      ? 'በተጠቃሚ ስም፣ ስልክ፣ ወይም ዋጋ ፈልግ...'
                      : 'Search by username, phone, or bid amount...'
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 font-mono uppercase">
                  {language === 'am' ? 'ቅደም ተከተል:' : 'Sort:'}
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-300 font-mono focus:outline-none focus:border-purple-500"
                >
                  <option value="amount_asc">
                    {language === 'am' ? 'ከዝቅተኛ ወደ ከፍተኛ ዋጋ (Rank #1...)' : 'Lowest to Highest Bid (Rank #1...)'}
                  </option>
                  <option value="amount_desc">
                    {language === 'am' ? 'ከከፍተኛ ወደ ዝቅተኛ ዋጋ' : 'Highest to Lowest Bid'}
                  </option>
                  <option value="time_desc">
                    {language === 'am' ? 'የቅርብ ጊዜ ጨረታ አስቀድም' : 'Newest Bids First'}
                  </option>
                </select>
              </div>
            </div>

            {/* Unmasked Live Table */}
            <div className="border border-[#27272a] rounded-2xl overflow-hidden bg-[#121215] shadow-xl">
              <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a] font-mono text-[10px] uppercase sticky top-0 z-20">
                    <tr>
                      <th className="py-3 px-4">{language === 'am' ? 'ደረጃ' : 'Rank'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'ተጫዋች' : 'Bidder'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'ያልተሸፈነ ስልክ' : 'Unmasked Phone'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'የጨረታ ዋጋ' : 'Live Bid Amount'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'የጨረታ ሁኔታ' : 'Evaluation Status'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'የተጋጩ ተጫዋቾች' : 'Duplicate Collisions'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'ክፍያ' : 'Fee'}</th>
                      <th className="py-3 px-4">{language === 'am' ? 'ሰዓት' : 'Time'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                    {filteredBids.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-zinc-500">
                          {language === 'am'
                            ? 'የተፈለገው መስፈርት ጋር የሚስማማ ምንም ጨረታ አልተገኘም።'
                            : 'No bids match the specified filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredBids.map(b => {
                        const isWinning = b.status === 'unique_lowest';
                        const isUniqueHigher = b.status === 'unique_not_lowest';
                        const isDuplicate = b.status === 'not_unique';

                        return (
                          <tr
                            key={b.id}
                            className={`transition-colors ${
                              isWinning
                                ? 'bg-emerald-950/40 text-emerald-200 font-bold'
                                : isUniqueHigher
                                ? 'hover:bg-amber-950/20 text-zinc-200'
                                : 'hover:bg-zinc-800/40 text-zinc-400'
                            }`}
                          >
                            <td className="py-2.5 px-4 font-mono font-bold">
                              {isWinning ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  #1 👑
                                </span>
                              ) : (
                                `#${b.rank}`
                              )}
                            </td>

                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span>@{b.username}</span>
                                <button
                                  onClick={() => copyToClipboard(b.username, `user_${b.id}`)}
                                  className="text-zinc-500 hover:text-white"
                                  title="Copy username"
                                >
                                  {copiedId === `user_${b.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5 text-zinc-300">
                                <Phone className="w-3 h-3 text-[#E5B842] shrink-0" />
                                <span>{b.phone}</span>
                                <button
                                  onClick={() => copyToClipboard(b.phone, `phone_${b.id}`)}
                                  className="text-zinc-500 hover:text-white"
                                  title="Copy phone"
                                >
                                  {copiedId === `phone_${b.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-4 font-bold text-sm">
                              <span
                                className={
                                  isWinning
                                    ? 'text-emerald-400'
                                    : isUniqueHigher
                                    ? 'text-amber-400'
                                    : 'text-zinc-300'
                                }
                              >
                                {b.bid_amount.toFixed(2)} ETB
                              </span>
                            </td>

                            <td className="py-2.5 px-4">
                              {isWinning ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold flex items-center gap-1 w-max">
                                  <Sparkles className="w-3 h-3" />
                                  {language === 'am' ? 'አሸናፊ (ዝቅተኛ ያልተደገመ)' : 'Winning (Lowest Unique)'}
                                </span>
                              ) : isUniqueHigher ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold w-max block">
                                  {language === 'am' ? 'ያልተደገመ (ከፍ ያለ)' : 'Unique (Higher)'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max">
                                  <AlertTriangle className="w-3 h-3" />
                                  {language === 'am'
                                    ? `ተደግሟል (${b.duplicate_count} ተጫዋች)`
                                    : `Duplicate (${b.duplicate_count} bids)`}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-zinc-400">
                              {b.duplicate_bidders && b.duplicate_bidders.length > 1 ? (
                                <div className="text-[10px] space-y-0.5">
                                  <span className="text-rose-400 font-bold">
                                    {b.duplicate_bidders.length} {language === 'am' ? 'ተጋጭተዋል:' : 'collided:'}
                                  </span>{' '}
                                  <span className="text-zinc-400">
                                    {b.duplicate_bidders
                                      .map(other => `@${other.username} (${other.phone})`)
                                      .join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-emerald-400/80 text-[10px]">
                                  — {language === 'am' ? 'ብቸኛ ዋጋ' : 'Solitary price'}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-zinc-400">
                              {b.fee_paid.toFixed(2)} ETB
                            </td>

                            <td className="py-2.5 px-4 text-zinc-400">
                              {new Date(b.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
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
        </div>
      )}
    </div>
  )}

      {/* 3. PREVIOUS & CONCLUDED GAMES MANAGEMENT VIEW */}
      {deskView === 'previous' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Super Admin Control Bar */}
          <div className="p-5 rounded-2xl bg-[#121215] border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {language === 'am' ? 'ያለፉና የተጠናቀቁ ጨዋታዎች ቁጥጥር' : 'Previous & Concluded Games Management'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  {filteredPreviousGames.length} GAMES
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {language === 'am'
                  ? 'የተጠናቀቁ ወይም ያልተሳኩ ጨዋታዎችን የጨረታ ብዛት፣ የዕቃውን ስም፣ የአሸናፊ ዋጋውን ያስተካክሉ ወይም ሙሉ በሙሉ ይሰርዙ።'
                  : 'Directly modify previous game parameters (item title, total bids count, winning price, winner details) or permanently delete unsuccessful/ended games from the platform history.'}
              </p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={language === 'am' ? 'በስም ወይም አሸናፊ ፈልግ...' : 'Search title, winner, category...'}
                  value={prevGameSearch}
                  onChange={e => setPrevGameSearch(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <select
                value={prevStatusFilter}
                onChange={e => setPrevStatusFilter(e.target.value as any)}
                className="bg-[#18181b] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono"
              >
                <option value="all">All States</option>
                <option value="ended">Ended Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
            </div>
          </div>

          {/* Previous Games Table / Cards */}
          {filteredPreviousGames.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#121215] border border-[#27272a] text-center space-y-3">
              <Archive className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                {language === 'am' ? 'ምንም የተጠናቀቀ ጨዋታ አልተገኘም' : 'No Previous Games Found'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {language === 'am'
                  ? 'ከፍለጋዎ ጋር የሚዛመድ ወይም የተጠናቀቀ ጨዋታ በሲስተሙ ውስጥ የለም።'
                  : 'There are currently no concluded or cancelled games matching your criteria.'}
              </p>
            </div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#16161c] text-[10px] font-mono uppercase text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">Item & ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Total Bids</th>
                      <th className="py-3 px-4">Winning Price</th>
                      <th className="py-3 px-4">Winning Bidder</th>
                      <th className="py-3 px-4">Closing Date</th>
                      <th className="py-3 px-4 text-right">Super Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {filteredPreviousGames.map(g => (
                      <tr key={g.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 font-sans">
                            <img
                              src={g.image_url}
                              alt={g.title}
                              className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate max-w-xs">{g.title}</div>
                              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span className="text-[#E5B842]">#{g.id}</span>
                                <span>•</span>
                                <span className="uppercase">{g.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              g.status === 'ended'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-[#E5B842] text-sm flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-zinc-500" />
                            {g.total_bids}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-400 text-sm">
                            {(g.winning_bid_amount ?? g.start_price).toFixed(2)} ETB
                          </span>
                        </td>

                        <td className="py-3 px-4 font-sans">
                          {g.winner_username ? (
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-emerald-400" />
                                <span>@{g.winner_username}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{g.winner_phone || 'No phone'}</div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px] italic">No winner recorded</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-zinc-400">
                          {new Date(g.end_time).toLocaleDateString()} {new Date(g.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAuction(g as unknown as Auction);
                                setIsEditModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[#E5B842] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Edit item title, bids count, winning price, winner info"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget(g)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Delete game from platform history"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Super Admin Edit Auction Modal (Works for both active and previous games) */}
      {isEditModalOpen && (
        <SuperAdminEditAuctionModal
          isOpen={isEditModalOpen}
          auction={editingAuction || (activeGame as unknown as Auction)}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAuction(null);
          }}
          onUpdated={() => {
            fetchLiveGames(true);
          }}
          onDeleted={() => {
            fetchLiveGames(true);
          }}
        />
      )}

      {/* Confirmation Dialog for Deleting Game */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#121215] border border-rose-600/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Permanently Delete Game?</h3>
              <p className="text-xs text-zinc-300">
                You are about to delete <span className="font-bold text-rose-300">"{deleteConfirmTarget.title}"</span> (#{deleteConfirmTarget.id}). This will permanently remove its record and all associated bids from platform history.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmTarget.id}
                onClick={() => handleDeleteGame(deleteConfirmTarget.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-950/50 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {deletingId === deleteConfirmTarget.id ? 'Deleting...' : 'Yes, Delete Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
