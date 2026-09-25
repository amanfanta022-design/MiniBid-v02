import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  PlusSquare,
  Upload,
  Lock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';

interface AdminCreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AdminCreateAuctionModal: React.FC<AdminCreateAuctionModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tech');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');

  const [participationFee, setParticipationFee] = useState('30');
  const [internalCost, setInternalCost] = useState('95000'); // CONFIDENTIAL!

  // Times (default: start now, end in 2 hours)
  const nowStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const endStr = new Date(Date.now() + 2 * 60 * 60 * 1000 - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [startTime, setStartTime] = useState(nowStr);
  const [endTime, setEndTime] = useState(endStr);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  if (!isOpen) return null;

  const handleImageSelection = (file: File) => {
    setImageError('');
    const MAX_BYTES = 5 * 1024 * 1024; // Strict 5MB limit
    if (file.size > MAX_BYTES) {
      setImageError(`Image exceeds strict 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select an image under 5.0 MB.`);
      setImageFile(null);
      setImagePreview('');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const finalImage = imagePreview || imageUrl.trim();
    if (!finalImage) {
      setFormError('Please upload an item image or supply a valid image URL.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setFormError('Item title and specifications description are required.');
      return;
    }

    const numInternalCost = parseFloat(internalCost);
    if (isNaN(numInternalCost) || numInternalCost < 0) {
      setFormError('Confidential wholesale Item Cost must be a valid number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        image_url: finalImage,
        start_price: 0,
        starting_price: 0,
        bid_increment: 0.01,
        participation_fee: parseFloat(participationFee) || 30,
        internal_cost: numInternalCost,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      };

      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setFormError(data.error || `Server returned error (${res.status}). Please check all required fields.`);
      } else {
        setFormSuccess('New auction created successfully and deployed to catalog!');
        setTimeout(() => {
          onCreated();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setFormError(`Connection error while posting auction: ${err?.message || 'Network request failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-zinc-100 my-auto sm:my-8 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#27272a] pb-4 mb-6 pr-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <PlusSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif text-white">Add New Item / Create Auction</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400">Catalog entry, item description, participation fees, and confidential item valuation</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Item Name / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MacBook Pro 16 M3 Max 1TB"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Accessories">Accessories</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Electronics">Electronics</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Luxury">Luxury</option>
                <option value="Tech">Tech</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Gaming">Gaming</option>
                <option value="Fashion">Fashion</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Appliances">Appliances</option>
                <option value="Collectibles">Collectibles</option>
              </select>
            </div>
          </div>

          {/* Item Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Item Description & Specifications *
              </label>
              <span className="text-[11px] text-zinc-500">
                {description.length} characters
              </span>
            </div>
            <textarea
              rows={3}
              required
              placeholder="e.g. Factory-sealed Brand New Apple iPhone 16 Pro Max 256GB with 1-Year Official Warranty, original accessories, and packaging included. Available for instant claim in Addis Ababa upon winning."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Provide complete product details, condition, specs, and warranty information visible to bidders on the auction page.
            </span>
          </div>

          {/* Image Upload / URL with <= 5MB validation */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Item Picture (Strictly ≤ 5.0 MB) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div
                className="sm:col-span-2 border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-[#18181b]/50 transition-all"
                onClick={() => document.getElementById('auction-image-upload')?.click()}
              >
                <input
                  type="file"
                  id="auction-image-upload"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageSelection(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex items-center justify-center gap-3">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-zinc-300">
                    {imageFile ? imageFile.name : 'Upload item photo (drag & drop or browse)'}
                  </span>
                </div>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL"
                  value={imageUrl}
                  onChange={e => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {imageError && <div className="text-xs text-red-400 mt-1">{imageError}</div>}

            {imagePreview && (
              <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Image attached successfully
                </span>
              </div>
            )}
          </div>

          {/* Pricing: Fee & Confidential Internal Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Participation Fee */}
            <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-200 mb-1">
                  Participation Fee (ETB) *
                </label>
                <span className="text-[11px] text-zinc-400 block mb-2 leading-relaxed">
                  Ticket entry fee deducted from bidder's wallet for each bid submission (e.g. 30 ETB).
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={participationFee}
                onChange={e => setParticipationFee(e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-zinc-700 text-sm text-white font-mono font-bold focus:outline-none focus:border-[#E5B842]"
              />
            </div>

            {/* CONFIDENTIAL ITEM AMOUNT */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#E5B842] mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#E5B842]" /> Confidential Item Cost (ETB) *
                </label>
                <span className="text-[11px] text-amber-300/80 block mb-2 leading-relaxed">
                  Wholesale procurement cost used strictly for Super Admin P&L margin reports. Hidden from bidders.
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={internalCost}
                onChange={e => setInternalCost(e.target.value)}
                placeholder="95000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-amber-500/50 text-sm text-[#E5B842] font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Confidentiality Security Warning */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-transparent border border-[#E5B842]/30 text-xs text-zinc-300 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#E5B842] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#E5B842] font-semibold block">
                Confidentiality Enforcement:
              </strong>
              <span className="text-zinc-400 text-[11px]">
                The Item Amount is stripped from all public customer endpoints by backend RBAC filter middleware. Only the Super Admin can review this cost for financial P&L calculations.
              </span>
            </div>
          </div>

          {/* Schedule Start & End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="order-1 sm:order-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              {isSubmitting ? 'Publishing Auction...' : 'Publish Auction to Live Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
