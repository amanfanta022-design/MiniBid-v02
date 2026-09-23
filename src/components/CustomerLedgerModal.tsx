import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  ArrowLeft,
  User as UserIcon,
  Coins,
  History,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  ShieldCheck,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
} from 'lucide-react';
import { Transaction } from '../types.js';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({ isOpen, onClose, onOpenDeposit }) => {
  const { user, token, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settings'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Settings form
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setEmailInput(user.email || '');
    setPhoneInput(user.phone || '');

    // Fetch transactions
    if (token) {
      setIsLoadingTx(true);
      fetch('/api/payments/my-transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setTransactions(data.transactions || []);
        })
        .catch(() => {})
        .finally(() => setIsLoadingTx(false));
    }
  }, [isOpen, user, token]);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (verifyEmail = false) => {
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: emailInput,
          phone: phoneInput,
          verify_email: verifyEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMsg({
          type: 'success',
          text: verifyEmail ? 'Email address verified and profile saved!' : 'Profile updated successfully!',
        });
        refreshUser();
      } else {
        setSettingsMsg({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setSettingsMsg({ type: 'error', text: 'Network connection error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-6 sm:p-8 text-zinc-100 my-8">
        {/* Top Back and Close Row */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272a]/60">
          <button
            id="ledger-back-to-auctions-btn"
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5B842]" />
            <span>← Back to Auctions</span>
          </button>

          <button
            id="close-ledger-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Header */}
        <div className="flex items-center gap-4 border-b border-[#27272a] pb-6 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 shadow-xl">
            <div className="w-full h-full bg-[#121215] rounded-[14px] flex items-center justify-center">
              <span className="font-serif font-black text-[#E5B842] text-xl">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-white">{user.username}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40 uppercase">
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span>{user.phone}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {user.email}
                {user.email_verified ? (
                  <span title="Email Verified">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                    Unverified
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] mb-6">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'overview' ? 'bg-[#E5B842] text-black font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview & Balance
          </button>
          <button
            id="tab-btn-transactions"
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'transactions' ? 'bg-[#E5B842] text-black font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Transaction Ledger ({transactions.length})
          </button>
          <button
            id="tab-btn-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'settings' ? 'bg-[#E5B842] text-black font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Account Settings
          </button>
        </div>

        {/* Tab 1: Overview & Balance */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Role-Specific Financial Overview Card */}
            {user.role === 'superadmin' ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/60 via-[#121215] to-[#121215] border border-purple-800/60 relative overflow-hidden shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-700 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-[#E5B842]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-purple-400 font-mono">Supreme Authority</span>
                    <div className="text-2xl font-bold font-serif text-white mt-0.5">
                      Executive Platform Treasury
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-4 leading-relaxed bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/40">
                  As Super Admin, you are at the apex of the platform liquidity hierarchy. There is no authority above you. You disburse liquidity to Admins upon request and manage platform governance; you do not hold personal customer wallet balances or submit deposit requests.
                </p>

                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-purple-900/40 text-xs">
                  <div>
                    <div className="text-zinc-500 text-[11px]">Role Mandate</div>
                    <div className="font-semibold text-[#E5B842] capitalize flex items-center gap-1 mt-0.5">
                      Supreme Treasury
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Deposit Requests</div>
                    <div className="font-medium text-zinc-300 mt-0.5">
                      Exempt (Issuer)
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Audit Level</div>
                    <div className="font-medium text-purple-300 mt-0.5">Full Immutable Log</div>
                  </div>
                </div>
              </div>
            ) : user.role === 'admin' ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 to-[#121215] border border-blue-800/40 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-blue-400 font-mono">Operations Float Balance</span>
                    <div className="text-3xl font-black font-mono text-white mt-1">
                      {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-lg text-blue-400">ETB</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-400 block mb-1">Liquidity Float</span>
                    <span className="px-3 py-1.5 rounded-xl bg-blue-900/40 text-blue-300 border border-blue-700/50 text-xs font-semibold">
                      Replenished by Super Admin
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
                  <div>
                    <div className="text-zinc-500 text-[11px]">Account Status</div>
                    <div className="font-semibold text-emerald-400 capitalize flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {user.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Member Since</div>
                    <div className="font-medium text-zinc-300 mt-0.5">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Disbursement Authority</div>
                    <div className="font-medium text-zinc-300 mt-0.5">Active Admin</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Customer Wallet Balance Card */
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1c1a14] to-[#121215] border border-[#E5B842]/30 relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-[#E5B842]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">Available Wallet Balance</span>
                    <div className="text-3xl font-black font-mono text-white mt-1">
                      {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-lg text-[#E5B842]">ETB</span>
                    </div>
                  </div>

                  <button
                    id="ledger-topup-btn"
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    + Top Up Balance
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
                  <div>
                    <div className="text-zinc-500 text-[11px]">Account Status</div>
                    <div className="font-semibold text-emerald-400 capitalize flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {user.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Member Since</div>
                    <div className="font-medium text-zinc-300 mt-0.5">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Secured Ledger</div>
                    <div className="font-medium text-zinc-300 mt-0.5">ACID Compliant</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick tips */}
            <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-zinc-400 space-y-2">
              <div className="font-semibold text-zinc-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E5B842]" />
                <span>Financial Ledger Guarantee</span>
              </div>
              <p className="leading-relaxed">
                Every bid fee and wallet deposit on MiniBid is processed through an immutable atomic transaction engine.
                When you win an auction, your winning bid is finalized at that lowest unique figure.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Transaction Ledger */}
        {activeTab === 'transactions' && (
          <div>
            {isLoadingTx ? (
              <div className="py-12 text-center text-xs text-zinc-500">Loading ledger records...</div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">No transactions recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {transactions.map(t => {
                  const isPositive = t.amount > 0;
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] text-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isPositive ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/30 text-red-400'
                          }`}
                        >
                          {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{t.description}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {new Date(t.created_at).toLocaleString()} • Balance after: {t.balance_after.toFixed(2)} ETB
                          </div>
                        </div>
                      </div>

                      <div
                        className={`font-mono font-bold text-sm shrink-0 ${
                          isPositive ? 'text-emerald-400' : 'text-zinc-300'
                        }`}
                      >
                        {isPositive ? `+${t.amount.toFixed(2)}` : `${t.amount.toFixed(2)}`} ETB
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Account Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-[#E5B842]"
                />
                {!user.email_verified && (
                  <button
                    type="button"
                    onClick={() => handleUpdateProfile(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all"
                  >
                    Verify Email Now
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Optional email verification. Unverified accounts can still bid and deposit without restrictions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Phone Number (Mandatory & Unique)
              </label>
              <input
                type="text"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-[#E5B842]"
              />
            </div>

            {settingsMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  settingsMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {settingsMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{settingsMsg.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-950/30 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateProfile(false)}
                className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
