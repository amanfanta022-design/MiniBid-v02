import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  X,
  ArrowLeft,
  User as UserIcon,
  Coins,
  History,
  CheckCircle2,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  PhoneCall,
  Crown,
  Gift,
} from 'lucide-react';
import { Transaction, Auction } from '../types.js';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
}) => {
  const { user, token, refreshUser, logout } = useAuth();
  const { language, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'wins' | 'transactions' | 'settings'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wonAuctions, setWonAuctions] = useState<Auction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Settings form (Requirement 5: username, phone, password - email removed)
  const [usernameInput, setUsernameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setUsernameInput(user.username || '');
    setPhoneInput(user.phone || '');
    setNewPasswordInput('');
    setSettingsMsg(null);

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

    // Fetch user won auctions for Requirement 8
    fetch('/api/auctions')
      .then(res => res.json())
      .then(data => {
        const all = (data.auctions || []) as Auction[];
        const userWins = all.filter(a => a.winner_user_id === user.id);
        setWonAuctions(userWins);
      })
      .catch(() => {});
  }, [isOpen, user, token]);

  if (!isOpen || !user) return null;

  // Requirement 5: Profile update (username, phone, password)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);

    const cleanUser = usernameInput.trim();
    if (cleanUser.length <= 5) {
      setSettingsMsg({
        type: 'error',
        text: language === 'am' ? 'የተጠቃሚ ስም ከ5 ፊደላት በላይ መሆን አለበት።' : 'Username must be more than 5 characters.',
      });
      return;
    }

    const cleanPhone = phoneInput.trim().replace(/\s+/g, '');
    const phoneRegex = /^(\+251[79]\d{8}|0[79]\d{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      setSettingsMsg({
        type: 'error',
        text:
          language === 'am'
            ? 'ስልክ ቁጥር ትክክለኛ የኢትዮጵያ ቅርጸት (+2519..., +2517..., 09..., ወይም 07...) እና ትክክለኛ የዲጂት ብዛት መሆን አለበት።'
            : 'Phone number must match Ethiopian format (+2519..., +2517..., 09..., or 07...) with the exact digit count.',
      });
      return;
    }

    if (newPasswordInput && newPasswordInput.length < 6) {
      setSettingsMsg({
        type: 'error',
        text: language === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።' : 'Password must be at least 6 characters.',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const payload: any = {
        username: cleanUser,
        phone: cleanPhone,
      };
      if (newPasswordInput) {
        payload.password = newPasswordInput;
      }

      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('minibid_token', data.token);
        }
        setSettingsMsg({
          type: 'success',
          text: language === 'am' ? 'መረጃዎ በተሳካ ሁኔታ ተቀይሯል!' : 'Profile updated successfully!',
        });
        setNewPasswordInput('');
        refreshUser();
      } else {
        setSettingsMsg({
          type: 'error',
          text: data.error || (language === 'am' ? 'መረጃ መቀየር አልተቻለም' : 'Failed to update profile'),
        });
      }
    } catch {
      setSettingsMsg({
        type: 'error',
        text: language === 'am' ? 'የኔትወርክ ግንኙነት ችግር ተፈጥሯል' : 'Network connection error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-zinc-100 my-auto sm:my-8 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        {/* Top Back and Close Row */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272a]/60">
          <button
            id="ledger-back-to-auctions-btn"
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5B842]" />
            <span>{language === 'am' ? '← ወደ ጨረታዎች ተመለስ' : '← Back to Auctions'}</span>
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 shadow-xl shrink-0">
            <div className="w-full h-full bg-[#121215] rounded-[14px] flex items-center justify-center">
              <span className="font-serif font-black text-[#E5B842] text-xl">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-white">@{user.username}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40 uppercase">
                {user.role}
              </span>
              {wonAuctions.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                  <Trophy className="w-3 h-3 text-[#E5B842]" />
                  {wonAuctions.length} {language === 'am' ? 'ያሸነፏቸው' : 'Won'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span className="font-mono text-zinc-300">{user.phone}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {language === 'am' ? 'የተረጋገጠ አባል' : 'Verified Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] mb-6 overflow-x-auto">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#E5B842] text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'am' ? 'አጠቃላይ እይታ' : 'Overview & Balance'}
          </button>

          {/* Dedicated Won Auctions Tab (Requirement 8) */}
          <button
            id="tab-btn-wins"
            onClick={() => setActiveTab('wins')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'wins'
                ? 'bg-[#E5B842] text-black font-semibold shadow-sm'
                : wonAuctions.length > 0
                ? 'text-[#E5B842] hover:text-white bg-amber-500/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#E5B842]" />
            <span>{language === 'am' ? 'ያሸነፏቸው' : 'Won Prizes'}</span>
            {wonAuctions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E5B842] text-black font-black text-[9px]">
                {wonAuctions.length}
              </span>
            )}
          </button>

          <button
            id="tab-btn-transactions"
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-[#E5B842] text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'am' ? 'የግብይት ታሪክ' : 'Transactions'} ({transactions.length})
          </button>

          <button
            id="tab-btn-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-[#E5B842] text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'am' ? 'የመለያ ቅንብሮች' : 'Profile Settings'}
          </button>
        </div>

        {/* Tab 1: Overview & Balance */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Requirement 8: When a user wins an item notify them clearly with visible icons on their own dashboard! */}
            {wonAuctions.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-[#E5B842]/30 border-2 border-[#E5B842] shadow-[0_0_30px_rgba(229,184,66,0.3)] animate-fadeIn space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E5B842] text-black flex items-center justify-center shadow-lg shrink-0">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-lg text-white flex items-center gap-2">
                        <span>{t('you_won_banner_title')}</span>
                        <Crown className="w-4 h-4 text-[#E5B842]" />
                      </h3>
                      <p className="text-xs text-amber-200 mt-0.5">
                        {t('you_won_banner_sub')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('wins')}
                    className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-[#E5B842] text-black font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 cursor-pointer"
                  >
                    {language === 'am' ? 'ዕቃዎቹን ይመልከቱ' : 'View Prizes'}
                  </button>
                </div>
              </div>
            )}

            {/* Role-Specific Financial Overview Card */}
            {user.role === 'superadmin' ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/60 via-[#121215] to-[#121215] border border-purple-800/60 relative overflow-hidden shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-700 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-[#E5B842]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-purple-400 font-mono">
                      {language === 'am' ? 'የበላይ ባለስልጣን' : 'Supreme Authority'}
                    </span>
                    <div className="text-2xl font-bold font-serif text-white mt-0.5">
                      {language === 'am' ? 'የፕላትፎርም ግምጃ ቤት' : 'Executive Platform Treasury'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-4 leading-relaxed bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/40">
                  {language === 'am'
                    ? 'እንደ ሱፐር አድሚን፣ የሙሉ ፕላትፎርም ፈሳሽ ገንዘብ የበላይ ነዎት። ለአስተዳዳሪዎች ፈሳሽ ገንዘብ ያፀድቃሉ፤ የግል የጨረታ ቦርሳ አይይዙም።'
                    : 'As Super Admin, you are at the apex of the platform liquidity hierarchy. You disburse liquidity to Admins upon request and manage platform governance.'}
                </p>
              </div>
            ) : user.role === 'admin' ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 to-[#121215] border border-blue-800/40 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-blue-400 font-mono">
                      {language === 'am' ? 'የአስተዳዳሪ ኦፕሬሽናል ቀሪ ሒሳብ' : 'Operations Float Balance'}
                    </span>
                    <div className="text-3xl font-black font-mono text-white mt-1">
                      {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-lg text-blue-400">ETB</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Customer Wallet Balance Card */
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1c1a14] to-[#121215] border border-[#E5B842]/30 relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-[#E5B842]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                      {language === 'am' ? 'ዝግጁ የኪስ ቦርሳ ቀሪ ሒሳብ' : 'Available Wallet Balance'}
                    </span>
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
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    + {language === 'am' ? 'ገንዘብ ጨምር' : 'Top Up Balance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Won Auctions Showcase (Requirement 8) */}
        {activeTab === 'wins' && (
          <div className="space-y-4">
            {wonAuctions.length === 0 ? (
              <div className="py-12 px-4 text-center bg-[#18181b]/60 rounded-2xl border border-[#27272a] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-white text-base">
                  {language === 'am' ? 'እስካሁን ያሸነፉት ጨረታ የለም' : 'No Won Auctions Yet'}
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {language === 'am'
                    ? 'በቀጥታ ጨረታዎች ላይ ይሳተፉ እና ማንም ያልደገመውን ዝቅተኛ ዋጋ በማስገባት ዕቃዎችን ያሸንፉ!'
                    : 'Place secret unique bids on live auctions. The lowest unique bid wins!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E5B842] shrink-0" />
                  <span>
                    {language === 'am'
                      ? 'የሚያሸንፉትን እቃ ለመረከብ በሚኒቢድ አስተዳደር ስልክ ይደውሉ ወይም በውስጥ መልእክት ያነጋግሩን።'
                      : 'To claim your won prize, contact MiniBid customer operations for collection or delivery.'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[420px] overflow-y-auto pr-1">
                  {wonAuctions.map(auc => (
                    <div
                      key={auc.id}
                      className="p-4 rounded-2xl bg-[#18181c] border-2 border-[#E5B842]/50 shadow-[0_0_20px_rgba(229,184,66,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-[#E5B842]/30">
                          <img src={auc.image_url} alt={auc.title} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#E5B842] text-black flex items-center justify-center font-bold text-[10px]">
                            🏆
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40 text-[10px] font-bold uppercase">
                              {language === 'am' ? 'አሸናፊ' : 'Winner'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {new Date(auc.end_time).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm mt-1">{auc.title}</h4>
                          <div className="text-xs text-zinc-300 mt-0.5 font-mono">
                            {language === 'am' ? 'ያሸነፉበት ዋጋ፦ ' : 'Winning Bid: '}
                            <span className="text-[#E5B842] font-black text-sm">
                              {auc.winning_bid_amount?.toFixed(2) || '1.00'} ETB
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'የፀደቀ አሸናፊ' : 'Verified Win'}</span>
                        </div>
                        <a
                          href="tel:+251911223344"
                          className="px-3.5 py-1.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'ሽልማቱን ውሰድ' : 'Claim Item'}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Transaction Ledger */}
        {activeTab === 'transactions' && (
          <div>
            {isLoadingTx ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                {language === 'am' ? 'መረጃዎች በመጫን ላይ...' : 'Loading ledger records...'}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                {language === 'am' ? 'እስካሁን የተመዘገበ ግብይት የለም።' : 'No transactions recorded yet.'}
              </div>
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
                            {new Date(t.created_at).toLocaleString()} • {language === 'am' ? 'ቀሪ፦' : 'Balance after:'} {t.balance_after.toFixed(2)} ETB
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

        {/* Tab 4: Account Settings (Requirement 5: change username, phone, password, check uniqueness across other persons) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {language === 'am' ? 'የተጠቃሚ ስም (ከ5 ፊደላት በላይ) *' : 'Username (> 5 characters) *'}
                </label>
                <span className={`text-[10px] font-mono ${usernameInput.trim().length > 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {usernameInput.trim().length}/6+
                </span>
              </div>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-[#E5B842]"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                {language === 'am'
                  ? 'የተጠቃሚ ስምዎን መቀየር ይችላሉ፤ ነገር ግን በሌላ ሰው ያልተያዘ መሆን አለበት።'
                  : 'You may update your username. It cannot be used if already taken by another person.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {language === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር *' : 'Ethiopian Phone Number *'}
                </label>
                <span className="text-[10px] font-mono text-[#E5B842]">
                  +2519 / +2517 / 09 / 07
                </span>
              </div>
              <input
                type="text"
                required
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-[#E5B842]"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                {language === 'am'
                  ? 'ስልክ ቁጥርዎን መቀየር ይችላሉ፤ ነገር ግን በሌላ ሰው ያልተመዘገበ መሆን አለበት።'
                  : 'You may update your phone number. It must be unique across all platform users.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                {language === 'am' ? 'አዲስ የይለፍ ቃል (የይለፍ ቃል ለመቀየር ካልፈለጉ ባዶ ይተዉት)' : 'New Password (Leave blank to keep current)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={language === 'am' ? 'ቢያንስ 6 ቁምፊዎች' : 'Min 6 characters'}
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-[#E5B842]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ውጣ (Sign Out)' : 'Sign Out'}</span>
              </button>

              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isUpdating
                  ? language === 'am' ? 'በመቀየር ላይ...' : 'Saving Changes...'
                  : language === 'am' ? 'መረጃዬን ቀይር' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
