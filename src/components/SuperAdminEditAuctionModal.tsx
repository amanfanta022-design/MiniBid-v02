import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import { Auction } from '../types.js';
import {
  X,
  Edit3,
  Calendar,
  Clock,
  Coins,
  Shield,
  Tag,
  FileText,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Trophy,
  Hash,
} from 'lucide-react';

interface SuperAdminEditAuctionModalProps {
  auction: Auction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedAuction: Auction) => void;
  onDeleted?: (deletedAuctionId: string) => void;
}

export const SuperAdminEditAuctionModal: React.FC<SuperAdminEditAuctionModalProps> = ({
  auction,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const { token } = useAuth();
  const { language } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startPrice, setStartPrice] = useState<number>(0);
  const [participationFee, setParticipationFee] = useState<number>(0);
  const [internalCost, setInternalCost] = useState<number>(0);
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [totalBids, setTotalBids] = useState<number>(0);
  const [winningPrice, setWinningPrice] = useState<number>(0);
  const [winnerUsername, setWinnerUsername] = useState<string>('');
  const [winnerPhone, setWinnerPhone] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Format date to local datetime-local format: YYYY-MM-DDTHH:mm
  const formatForDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (auction) {
      setTitle(auction.title || '');
      setDescription(auction.description || '');
      setCategory(auction.category || 'Tech');
      setImageUrl(auction.image_url || '');
      setStartPrice(auction.start_price || 0);
      setParticipationFee(auction.participation_fee || 0);
      setInternalCost(auction.internal_cost || 0);
      setEndTime(formatForDateTimeLocal(auction.end_time));
      setStatus(auction.status || 'active');
      setTotalBids(auction.total_bids || 0);
      setWinningPrice(auction.winning_bid_amount ?? auction.start_price ?? 0);
      setWinnerUsername(auction.winner_username || '');
      setWinnerPhone(auction.winner_phone || '');
      setErrorMsg('');
      setSuccessMsg('');
      setConfirmDelete(false);
    }
  }, [auction, isOpen]);

  if (!isOpen || !auction) return null;

  // Quick adjust time buttons
  const addHoursToEndTime = (hoursToAdd: number) => {
    const baseDate = endTime ? new Date(endTime) : new Date();
    const newDate = new Date(baseDate.getTime() + hoursToAdd * 3600000);
    setEndTime(formatForDateTimeLocal(newDate.toISOString()));
  };

  const handleDelete = async () => {
    if (!token || !auction) return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/superadmin/auctions/${auction.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setIsDeleting(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to delete game.');
        return;
      }

      setSuccessMsg('Game successfully deleted from platform history.');
      if (onDeleted) {
        onDeleted(auction.id);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setIsDeleting(false);
      setErrorMsg(err.message || 'Error occurred while deleting game.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Item title cannot be empty.');
      return;
    }

    if (!endTime) {
      setErrorMsg('Please specify a valid bid closing date and time.');
      return;
    }

    const selectedClosing = new Date(endTime);
    if (isNaN(selectedClosing.getTime())) {
      setErrorMsg('Invalid closing datetime.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        image_url: imageUrl.trim(),
        start_price: Number(startPrice),
        participation_fee: Number(participationFee),
        internal_cost: Number(internalCost),
        end_time: selectedClosing.toISOString(),
        status,
        total_bids: Number(totalBids),
        winning_bid_amount: Number(winningPrice),
        winning_price: Number(winningPrice),
        winner_username: winnerUsername.trim() || undefined,
        winner_phone: winnerPhone.trim() || undefined,
      };

      const res = await fetch(`/api/superadmin/auctions/${auction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update auction.');
        return;
      }

      setSuccessMsg('Game details, stats, and schedule successfully updated!');
      if (onUpdated && data.auction) {
        onUpdated(data.auction);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Network error occurred while saving.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0f0f14] border border-[#E5B842]/40 rounded-3xl shadow-2xl shadow-[#E5B842]/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#14141a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Super Admin Live Auction Editor</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-mono text-[9px] font-bold uppercase">
                  Executive Override
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Item ID: #{auction.id} • Status: <span className="uppercase text-amber-400 font-bold">{auction.status}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Item Name / Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Item Name / Auction Title</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Apple iPhone 16 Pro Max 256GB"
              className="w-full bg-[#16161c] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
            />
          </div>

          {/* 2. Category & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#16161c] border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="Tech">Tech & Computing</option>
                <option value="Smartphones">Smartphones & Tablets</option>
                <option value="Gaming">Gaming & Consoles</option>
                <option value="Luxury">Luxury & Timepieces</option>
                <option value="Vehicles">Vehicles & Automotive</option>
                <option value="Jewelry">Jewelry & Gold</option>
                <option value="Appliances">Home Appliances</option>
                <option value="Kitchen">Kitchen & Dining</option>
                <option value="Fashion">Fashion & Apparel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Image Web URL</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#16161c] border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* 3. Item Description / Details */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Item Full Details / Specifications</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed description of auction item condition, features, warranties..."
              className="w-full bg-[#16161c] border border-zinc-700 focus:border-amber-400 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* 4. Pricing & Fee Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#131318] p-3.5 rounded-2xl border border-zinc-800">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Retail Value (ETB)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={startPrice}
                onChange={e => setStartPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Fee per Bid (ETB)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={participationFee}
                onChange={e => setParticipationFee(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-rose-300 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-rose-400" />
                <span>Internal Wholesale (ETB)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={internalCost}
                onChange={e => setInternalCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1a1a22] border border-rose-900/60 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono font-bold"
                title="Strictly confidential wholesale cost visible only to Super Admin for P&L tracking"
              />
            </div>
          </div>

          {/* 5. GAME STATUS & PREVIOUS GAME STATS OVERRIDE (Super Admin Control) */}
          <div className="bg-[#131318] border border-purple-500/40 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>Game State & Results Management (Direct Stats Override)</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Super Admin Power
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Game Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-[#1a1a22] border border-purple-500/40 focus:border-purple-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase font-bold"
                >
                  <option value="active">Active (Live)</option>
                  <option value="ended">Ended (Concluded)</option>
                  <option value="cancelled">Cancelled (Aborted)</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-[#E5B842]" />
                  <span>Total Bids Count</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={totalBids}
                  onChange={e => setTotalBids(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-[#E5B842] font-mono font-bold"
                  placeholder="e.g. 142"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-emerald-400 mb-1 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-400" />
                  <span>Winning Price (ETB)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={winningPrice}
                  onChange={e => setWinningPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#1a1a22] border border-emerald-700/60 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold"
                  placeholder="e.g. 12.50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Winner Username (Optional)
                </label>
                <input
                  type="text"
                  value={winnerUsername}
                  onChange={e => setWinnerUsername(e.target.value)}
                  placeholder="e.g. amanuel_f"
                  className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                  Winner Phone (Optional)
                </label>
                <input
                  type="text"
                  value={winnerPhone}
                  onChange={e => setWinnerPhone(e.target.value)}
                  placeholder="+251911..."
                  className="w-full bg-[#1a1a22] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 6. BID CLOSING TIME & QUICK EXTENSION (Core Feature Request) */}
          <div className="bg-gradient-to-br from-amber-500/10 via-[#181820] to-rose-500/10 border border-amber-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Bid Closing Date & Time (Schedule Override)</span>
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                Current: {new Date(auction.end_time).toLocaleString()}
              </span>
            </div>

            <div>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-[#16161c] border border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
              />
            </div>

            {/* Quick Extension Buttons */}
            <div>
              <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">
                Quick Schedule Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addHoursToEndTime(1)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => addHoursToEndTime(6)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  +6 Hours
                </button>
                <button
                  type="button"
                  onClick={() => addHoursToEndTime(24)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  +24 Hours (1 Day)
                </button>
                <button
                  type="button"
                  onClick={() => addHoursToEndTime(72)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => addHoursToEndTime(168)}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  +1 Week
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-800">
            {/* Delete Previous/Unsuccessful Game */}
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Delete this game and its bids permanently"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Game</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-950/60 border border-rose-600">
                  <span className="text-[11px] font-bold text-rose-200 pl-1">
                    Permanently delete game?
                  </span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Live Changes...' : 'Save Auction Updates'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
