import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  Coins,
  PlusCircle,
  Volume2,
  VolumeX,
  Bell,
  User as UserIcon,
  LogOut,
  Flame,
  Trophy,
  HelpCircle,
  CreditCard,
  History,
  ShieldCheck,
  BarChart3,
  Users,
  Inbox,
  Lock,
  PlusSquare,
  FileSpreadsheet,
  Sparkles,
  Upload,
  RotateCcw,
  Menu,
  X,
  ChevronRight,
  Shield,
  Wallet,
  Languages,
  Settings,
} from 'lucide-react';
import { isAudioEnabled, toggleAudio } from '../utils/audio.js';
import { PlatformNotification } from '../types.js';
import { useBrandLogo } from '../utils/brandLogo.js';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenLedger: () => void;
  onOpenHowItWorks: () => void;
  onOpenAuth: () => void;
  onOpenCreateAuction: () => void;
  onReplayIntro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenDeposit,
  onOpenLedger,
  onOpenHowItWorks,
  onOpenAuth,
  onOpenCreateAuction,
  onReplayIntro,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { logoUrl, isCustom, uploadCustomLogo, resetToDefault } = useBrandLogo();
  const [audioOn, setAudioOn] = useState(true);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [pendingDepositsCount, setPendingDepositsCount] = useState<number>(0);
  const [wonCount, setWonCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAudioOn(isAudioEnabled());
  }, []);

  const handleAudioToggle = () => {
    const newState = toggleAudio();
    setAudioOn(newState);
  };

  // Poll notifications, won auctions & pending deposits
  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('minibid_token');
        if (!token) return;

        // Fetch notifications
        const notifRes = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications || []);
        }

        // Fetch auctions to check won status for Requirement 8
        const aucRes = await fetch('/api/auctions');
        if (aucRes.ok) {
          const aucData = await aucRes.json();
          const userWon = (aucData.auctions || []).filter(
            (a: { winner_user_id?: string }) => a.winner_user_id === user.id
          );
          setWonCount(userWon.length);
        }

        // If admin/superadmin, fetch pending deposits count
        if (user.role === 'admin' || user.role === 'superadmin') {
          const depRes = await fetch('/api/admin/deposits', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (depRes.ok) {
            const data = await depRes.json();
            const pending = (data.deposits || []).filter((d: { status: string }) => d.status === 'pending');
            setPendingDepositsCount(pending.length);
          }
        }
      } catch {
        // ignore
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadNotifs = notifications.filter(n => !n.read_by?.includes(user?.id || ''));

  const markNotifRead = async (notifId: string) => {
    try {
      const token = localStorage.getItem('minibid_token');
      if (!token) return;
      await fetch(`/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, read_by: [...(n.read_by || []), user?.id || ''] } : n))
      );
    } catch {
      // ignore
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
              onClick={() => {
                onSelectTab('auctions');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="relative group/logo w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#E5B842] via-[#F3C34F] to-[#997920] p-0.5 shadow-[0_0_15px_rgba(229,184,66,0.3)] shrink-0 overflow-hidden">
                <div className="w-full h-full bg-[#09090b] rounded-[9px] sm:rounded-[10px] overflow-hidden flex items-center justify-center relative">
                  <img
                    src={logoUrl}
                    alt="Sunfyre Brand Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {user?.role === 'superadmin' && (
                    <label
                      onClick={e => e.stopPropagation()}
                      className="absolute inset-0 bg-black/85 backdrop-blur-xs opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center text-[7px] text-[#E5B842] font-mono font-semibold transition-opacity cursor-pointer text-center p-0.5"
                      title="Super Admin: Upload your custom logo"
                    >
                      <Upload className="w-3 h-3 text-[#E5B842] mb-0.5" />
                      <span>CUSTOM</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) uploadCustomLogo(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-serif font-bold text-lg sm:text-xl tracking-wide text-white">MINIBID</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/30">
                    {user?.role || 'Guest'}
                  </span>
                </div>
                <p className="hidden md:flex text-[10px] text-[#E5B842] -mt-0.5 font-mono tracking-wider font-medium items-center gap-1.5">
                  <span>Powered by Sunfyre General Trading</span>
                  {isCustom && user?.role === 'superadmin' && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        resetToDefault();
                      }}
                      className="text-[9px] text-zinc-400 hover:text-red-400 underline cursor-pointer"
                      title="Reset to default luxury crest"
                    >
                      (Reset)
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Bar (Visible on lg screens 1024px+) */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#121214] p-1 rounded-xl border border-[#27272a]">
              {onReplayIntro && (
                <button
                  onClick={onReplayIntro}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#E5B842] hover:bg-[#E5B842]/10 transition-all border border-[#E5B842]/30"
                  title="Replay 3D Live Intro"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3D Intro</span>
                </button>
              )}

              <button
                id="nav-tab-auctions"
                onClick={() => onSelectTab('auctions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'auctions'
                    ? 'bg-[#E5B842] text-black shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1c1c20]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                {t('live_auctions')}
              </button>

              <button
                id="nav-tab-winners"
                onClick={() => onSelectTab('winners')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'winners'
                    ? 'bg-[#E5B842] text-black shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1c1c20]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                {t('winners')}
              </button>

              <button
                id="nav-tab-how-it-works"
                onClick={onOpenHowItWorks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#1c1c20] transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {t('how_it_works')}
              </button>

              {/* Admin Management Links */}
              {isAdmin && (
                <button
                  id="nav-tab-admin-deposits"
                  onClick={() => onSelectTab('admin-deposits')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                    currentTab === 'admin-deposits'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-blue-400 hover:text-blue-300 hover:bg-blue-950/40'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  {t('admin_deposits')}
                  {pendingDepositsCount > 0 && (
                    <span className="w-4 h-4 bg-amber-500 text-black font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                      {pendingDepositsCount}
                    </span>
                  )}
                </button>
              )}

              {isAdmin && (
                <button
                  id="nav-tab-admin-users"
                  onClick={() => onSelectTab('admin-users')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTab === 'admin-users'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1c1c20]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {t('users_ledger')}
                </button>
              )}

              {/* Super Admin Links */}
              {isSuperAdmin && (
                <button
                  id="nav-tab-super-financials"
                  onClick={() => onSelectTab('super-financials')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'super-financials'
                      ? 'bg-gradient-to-r from-[#E5B842] to-amber-600 text-black shadow-md'
                      : 'text-[#E5B842] hover:bg-[#E5B842]/10'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  P&L Reports
                </button>
              )}

              {isSuperAdmin && (
                <button
                  id="nav-tab-super-governance"
                  onClick={() => onSelectTab('super-governance')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentTab === 'super-governance'
                      ? 'bg-purple-600 text-white shadow-sm font-semibold'
                      : 'text-purple-300 hover:bg-purple-950/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t('staff_audit')}
                </button>
              )}
            </nav>

            {/* Right Action Stack */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Requirement 8: When user wins an item, notify clearly with visible icons on their dashboard / header */}
              {wonCount > 0 && (
                <button
                  id="header-won-alert-btn"
                  onClick={onOpenLedger}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-yellow-400/30 to-[#E5B842]/40 border border-[#E5B842] text-[#E5B842] font-bold text-xs shadow-[0_0_15px_rgba(229,184,66,0.35)] animate-pulse cursor-pointer hover:brightness-125 transition-all"
                  title={language === 'am' ? 'እንኳን ደስ አለዎት! ያሸነፉት ጨረታ አለ። ለማየት እዚህ ይጫኑ' : 'Congratulations! You won auctions. Click to claim.'}
                >
                  <Trophy className="w-4 h-4 text-[#E5B842] shrink-0" />
                  <span className="hidden xs:inline">{language === 'am' ? 'ያሸነፉት' : 'Won!'}</span>
                  <span className="w-4 h-4 rounded-full bg-[#E5B842] text-black text-[10px] font-black flex items-center justify-center">
                    {wonCount}
                  </span>
                </button>
              )}

              {/* Requirement 2: Language Toggle (EN / አማርኛ) */}
              <button
                id="header-language-toggle-btn"
                onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                title={language === 'en' ? 'ወደ አማርኛ ቀይር' : 'Switch to English'}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#27272a] bg-[#121214] text-xs font-semibold text-[#E5B842] hover:border-[#E5B842]/50 hover:bg-[#18181c] transition-all cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-[#E5B842]" />
                <span className="font-mono">{language === 'en' ? 'አማርኛ' : 'EN'}</span>
              </button>

              {/* Audio Toggle */}
              <button
                id="audio-toggle-btn"
                onClick={handleAudioToggle}
                title={audioOn ? 'Mute sound effects' : 'Enable sound effects'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all cursor-pointer"
              >
                {audioOn ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5B842]" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-600" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  id="notifications-bell-btn"
                  onClick={() => setShowNotifsDropdown(!showNotifsDropdown)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-zinc-100 flex items-center justify-center relative transition-all cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifsDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-[#121214] border border-[#27272a] rounded-2xl shadow-2xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-[#27272a] mb-2">
                      <span className="font-semibold text-xs text-zinc-200">Notifications</span>
                      <span className="text-[11px] text-zinc-500">{notifications.length} total</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-500">No notifications at this time.</div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map(n => {
                          const isRead = n.read_by?.includes(user?.id || '');
                          return (
                            <div
                              key={n.id}
                              onClick={() => markNotifRead(n.id)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isRead
                                  ? 'bg-[#18181b]/50 border-zinc-800/50 text-zinc-400'
                                  : 'bg-[#1e1e24] border-[#E5B842]/40 text-zinc-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-semibold text-zinc-200">{n.title}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] mt-1 text-zinc-400">{n.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Authenticated User Status */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* 1. Super Admin: Treasury Authority */}
                  {isSuperAdmin ? (
                    <div
                      title="Super Administrator: Platform Liquidity Authority"
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 shadow-sm text-left leading-tight"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#E5B842]" />
                      <div>
                        <div className="text-[8px] text-purple-400 font-mono uppercase">Authority</div>
                        <div className="text-[11px] font-bold font-serif text-[#E5B842]">Treasury</div>
                      </div>
                    </div>
                  ) : user.role === 'admin' ? (
                    /* 2. Admin Operational Float */
                    <div className="flex items-center gap-1.5">
                      <div
                        onClick={onOpenLedger}
                        title="Admin Operational Float"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/50 cursor-pointer hover:border-blue-600 transition-all text-right leading-tight"
                      >
                        <Coins className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div>
                          <div className="text-[9px] text-blue-400 font-mono uppercase hidden xs:block">Float</div>
                          <div className="text-[11px] font-bold font-mono text-blue-200">
                            {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{' '}
                            <span className="text-[9px] text-blue-400">ETB</span>
                          </div>
                        </div>
                      </div>

                      <button
                        id="topbar-admin-request-float-btn"
                        onClick={() => onSelectTab('admin-deposits')}
                        title="Request float from Super Admin"
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Float</span>
                      </button>
                    </div>
                  ) : (
                    /* 3. Customer: Wallet Balance & Deposit */
                    <div className="flex items-center gap-1.5">
                      <div
                        onClick={onOpenLedger}
                        title="View wallet ledger & transactions"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-[#E5B842]/10 border border-[#E5B842]/30 cursor-pointer hover:border-[#E5B842] transition-all text-right leading-tight"
                      >
                        <Coins className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                        <div>
                          <div className="text-[8px] text-zinc-400 font-mono uppercase hidden xs:block">Balance</div>
                          <div className="text-[11px] sm:text-xs font-bold font-mono text-[#E5B842]">
                            {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{' '}
                            <span className="text-[9px] text-zinc-400">ETB</span>
                          </div>
                        </div>
                      </div>

                      <button
                        id="topbar-deposit-btn"
                        onClick={onOpenDeposit}
                        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E5B842] to-[#c99f30] text-black font-semibold text-xs shadow-[0_0_12px_rgba(229,184,66,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Deposit</span>
                      </button>
                    </div>
                  )}

                  {/* Admin Quick Action: New Auction (Desktop Only) */}
                  {isAdmin && (
                    <button
                      id="topbar-new-auction-btn"
                      onClick={onOpenCreateAuction}
                      className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs shadow-md border border-zinc-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <PlusSquare className="w-3.5 h-3.5" />
                      <span>New Auction</span>
                    </button>
                  )}

                  {/* Requirement 8: Visible Won Items Notification Badge on dashboard */}
                  {wonCount > 0 && (
                    <button
                      id="header-won-trophy-badge"
                      onClick={onOpenLedger}
                      title={
                        language === 'am'
                          ? `እንኳን ደስ አለዎት! ${wonCount} ዕቃዎችን አሸንፈዋል`
                          : `Congratulations! You won ${wonCount} items! Click to view.`
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/35 border-2 border-[#E5B842] text-[#E5B842] hover:brightness-110 shadow-[0_0_20px_rgba(229,184,66,0.4)] animate-pulse transition-all cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-[#E5B842] shrink-0" />
                      <span className="text-xs font-black font-mono text-white">
                        {wonCount} {language === 'am' ? 'አሸንፈዋል!' : 'Won!'}
                      </span>
                    </button>
                  )}

                  {/* User Profile Trigger */}
                  <div
                    onClick={onOpenLedger}
                    className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#27272a] bg-[#121214] hover:border-zinc-600 cursor-pointer transition-all"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-zinc-200 max-w-[100px] truncate">@{user.username}</span>
                  </div>

                  {/* Desktop Logout Button */}
                  <button
                    id="header-logout-btn"
                    onClick={logout}
                    title="Sign out"
                    className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-red-400 hover:border-red-500/40 items-center justify-center transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="topbar-login-btn"
                  onClick={onOpenAuth}
                  className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}

              {/* Mobile & Tablet Hamburger Menu Toggle Button (Visible below lg) */}
              <button
                id="mobile-hamburger-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#27272a] bg-[#121214] text-zinc-300 hover:text-white flex items-center justify-center transition-all relative cursor-pointer"
                title="Open Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                {pendingDepositsCount > 0 && isAdmin && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fadeIn">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#121215] border-l border-[#27272a] p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-50">
            <div className="space-y-6">
              {/* Drawer Top Row */}
              <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E5B842] to-[#997920] p-0.5 overflow-hidden">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[6px]" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-white text-base">MINIBID</span>
                    <span className="block text-[9px] text-[#E5B842] font-mono">
                      {language === 'am' ? 'የኢትዮጵያ ጨረታ' : 'Ethiopia Reverse Auctions'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language switch button in Drawer */}
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                    className="px-2 py-1 rounded-lg bg-zinc-800 text-[#E5B842] border border-[#27272a] text-[11px] font-mono font-bold flex items-center gap-1"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'አማርኛ' : 'EN'}</span>
                  </button>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Winner Alert Banner in Mobile Drawer (Requirement 8) */}
              {wonCount > 0 && (
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLedger();
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-[#E5B842]/30 border border-[#E5B842] flex items-center justify-between cursor-pointer animate-pulse"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-[#E5B842] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {language === 'am' ? '🎉 እንኳን ደስ አለዎት!' : '🏆 Auction Won!'}
                      </div>
                      <div className="text-[10px] text-[#E5B842]">
                        {language === 'am'
                          ? `${wonCount} ጨረታ አሸንፈዋል! ለመረከብ ይጫኑ`
                          : `You won ${wonCount} item(s)! Tap to claim.`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#E5B842]" />
                </div>
              )}

              {/* User Profile Card in Drawer */}
              {user ? (
                <div className="p-3.5 rounded-2xl bg-[#18181c] border border-[#27272a] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-[#E5B842]">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">@{user.username}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{user.phone}</div>
                      </div>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/30">
                      {user.role}
                    </span>
                  </div>

                  {/* Balance / Float details */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase">
                        {user.role === 'admin'
                          ? language === 'am' ? 'የአስተዳዳሪ ቀሪ' : 'Operational Float'
                          : isSuperAdmin
                          ? language === 'am' ? 'የገንዘብ ባለስልጣን' : 'Treasury Status'
                          : language === 'am' ? 'ቀሪ ሒሳብ' : 'Wallet Balance'}
                      </div>
                      <div className="font-mono font-bold text-sm text-[#E5B842]">
                        {isSuperAdmin
                          ? 'Supreme Authority'
                          : `${user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`}
                      </div>
                    </div>

                    {!isSuperAdmin && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (user.role === 'admin') onSelectTab('admin-deposits');
                          else onOpenDeposit();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#E5B842] text-black font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{user.role === 'admin' ? (language === 'am' ? 'ተጨማሪ' : 'Float') : (language === 'am' ? 'አስገባ' : 'Deposit')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-[#E5B842]/10 border border-[#E5B842]/30 space-y-2">
                  <div className="font-serif font-bold text-white text-sm">
                    {language === 'am' ? 'ወደ ሚኒቢድ እንኳን ደህና መጡ' : 'Join MiniBid Ethiopia'}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {language === 'am' ? 'በቀጥታ ዝቅተኛ ያልተደገመ ጨረታዎች ላይ ለመሳተፍ ይግቡ።' : 'Sign in to participate in live lowest unique reverse auctions.'}
                  </p>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#E5B842] text-black font-extrabold text-xs shadow-md"
                  >
                    {language === 'am' ? 'ግባ / ተመዝገብ' : 'Sign In / Register'}
                  </button>
                </div>
              )}

              {/* Main Navigation Links in Drawer */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 pb-1">
                  {language === 'am' ? 'ማውጫ' : 'Navigation'}
                </div>

                <button
                  onClick={() => {
                    onSelectTab('auctions');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'auctions' ? 'bg-[#E5B842] text-black' : 'text-zinc-300 hover:bg-[#18181c]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4" /> {t('live_auctions')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => {
                    onSelectTab('winners');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'winners' ? 'bg-[#E5B842] text-black' : 'text-zinc-300 hover:bg-[#18181c]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4" /> {t('winners')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenHowItWorks();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-[#18181c] transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4" /> {t('how_it_works')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {user && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenLedger();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-[#18181c] transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <History className="w-4 h-4" /> {language === 'am' ? 'የእኔ አካውንት እና ታሪክ' : 'My Account & Ledger'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
              </div>

              {/* Admin Management Links in Drawer */}
              {isAdmin && (
                <div className="space-y-1 pt-2 border-t border-[#27272a]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 px-2 pb-1">
                    Administration
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('admin-deposits');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'admin-deposits' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-blue-950/30'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Inbox className="w-4 h-4" /> Deposit Requests
                    </span>
                    {pendingDepositsCount > 0 ? (
                      <span className="w-5 h-5 bg-amber-400 text-black font-bold text-[10px] rounded-full flex items-center justify-center">
                        {pendingDepositsCount}
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('admin-users');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'admin-users' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-[#18181c]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" /> Active Users Directory
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCreateAuction();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/30 transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <PlusSquare className="w-4 h-4" /> Create New Auction
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              )}

              {/* Super Admin Financial Oversight */}
              {isSuperAdmin && (
                <div className="space-y-1 pt-2 border-t border-[#27272a]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#E5B842] px-2 pb-1">
                    Super Admin Controls
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('super-financials');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'super-financials' ? 'bg-amber-500 text-black' : 'text-[#E5B842] hover:bg-[#E5B842]/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4" /> P&L Financial Ledger
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('super-governance');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'super-governance' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:bg-purple-950/30'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4" /> Staff Floats & Audit Logs
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions inside Drawer */}
            <div className="pt-4 border-t border-[#27272a] space-y-2">
              {onReplayIntro && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onReplayIntro();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5B842]/40 bg-[#E5B842]/10 text-[#E5B842] text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replay 3D Intro</span>
                </button>
              )}

              {user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar for Smart Phones (< md screens, < 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-t border-[#27272a] h-16 flex items-center justify-around px-2 shadow-2xl">
        <button
          onClick={() => onSelectTab('auctions')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-mono transition-colors ${
            currentTab === 'auctions' ? 'text-[#E5B842] font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Flame className={`w-5 h-5 mb-0.5 ${currentTab === 'auctions' ? 'text-[#E5B842]' : 'text-zinc-400'}`} />
          <span>Auctions</span>
        </button>

        <button
          onClick={() => onSelectTab('winners')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-mono transition-colors ${
            currentTab === 'winners' ? 'text-[#E5B842] font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className={`w-5 h-5 mb-0.5 ${currentTab === 'winners' ? 'text-[#E5B842]' : 'text-zinc-400'}`} />
          <span>Winners</span>
        </button>

        {/* Center Primary Action: Deposit for Customer, Float for Admin */}
        <button
          onClick={() => {
            if (!user) onOpenAuth();
            else if (user.role === 'admin') onSelectTab('admin-deposits');
            else if (user.role === 'superadmin') onSelectTab('super-financials');
            else onOpenDeposit();
          }}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-mono"
        >
          <div className="w-10 h-10 -mt-3 rounded-full bg-gradient-to-tr from-[#E5B842] via-[#F3C34F] to-[#997920] p-0.5 shadow-[0_0_15px_rgba(229,184,66,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#121215] rounded-full flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-[#E5B842]" />
            </div>
          </div>
          <span className="text-[#E5B842] font-bold mt-0.5">
            {user?.role === 'admin' ? 'Float' : user?.role === 'superadmin' ? 'Treasury' : 'Deposit'}
          </span>
        </button>

        <button
          onClick={onOpenHowItWorks}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
        >
          <HelpCircle className="w-5 h-5 mb-0.5 text-zinc-400" />
          <span>Guide</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-mono relative transition-colors ${
            isMobileMenuOpen ? 'text-[#E5B842]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5 text-zinc-400" />
          <span>Menu</span>
          {pendingDepositsCount > 0 && isAdmin && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
          )}
        </button>
      </div>
    </>
  );
};
