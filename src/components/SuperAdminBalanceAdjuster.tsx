import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Coins,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { User } from '../types.js';

interface SuperAdminBalanceAdjusterProps {
  targetUser: User | null;
  onClose: () => void;
  onAdjusted: () => void;
}

export const SuperAdminBalanceAdjuster: React.FC<SuperAdminBalanceAdjusterProps> = ({
  targetUser,
  onClose,
  onAdjusted,
}) => {
  const { token } = useAuth();
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<string>('500');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please specify a positive adjustment amount.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Mandatory audit justification is required for balance adjustments.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/superadmin/users/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: targetUser.id,
          amount: numAmount,
          type: actionType,
          audit_note: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to adjust balance');
      } else {
        setSuccessMsg(`Wallet balance successfully adjusted for @${targetUser.username}.`);
        setTimeout(() => {
          onAdjusted();
          onClose();
        }, 1200);
      }
    } catch {
      setErrorMsg('Network error while processing balance adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#121215] border border-[#E5B842]/40 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 text-zinc-100 my-auto max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#E5B842]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-white">Manual Balance Adjustment</h2>
            <p className="text-xs text-zinc-400">Emergency credit or debit with mandatory audit trail</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 mb-4 text-xs font-mono flex items-center justify-between">
          <div>
            <span className="text-zinc-500 text-[10px] block">Target Account</span>
            <strong className="text-white font-sans text-sm">@{targetUser.username}</strong>
            <div className="text-zinc-500 text-[10px]">{targetUser.phone}</div>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-[10px] block">Current Balance</span>
            <strong className="text-emerald-400 text-sm">
              {targetUser.wallet_balance.toFixed(2)} ETB
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActionType('credit')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                actionType === 'credit'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-[#18181b] border-[#27272a] text-zinc-400'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Credit (+)</span>
            </button>

            <button
              type="button"
              onClick={() => setActionType('debit')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                actionType === 'debit'
                  ? 'bg-red-950/40 border-red-500 text-red-300'
                  : 'bg-[#18181b] border-[#27272a] text-zinc-400'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-red-400" />
              <span>Debit (−)</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Adjustment Amount (ETB) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-[#E5B842]"
              />
              <span className="absolute right-3.5 top-3 text-xs font-mono text-zinc-400">ETB</span>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Audit Justification (Required) *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Approved wire clearance exception; manual cash receipt verified."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? 'Adjusting...' : `Execute ${actionType.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
