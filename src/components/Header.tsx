import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
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
  const { logoUrl, isCustom, uploadCustomLogo, resetToDefault } = useBrandLogo();
  const [audioOn, setAudioOn] = useState(true);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [pendingDepositsCount, setPendingDepositsCount] = useState<number>(0);

  useEffect(() => {
    setAudioOn(isAudioEnabled());
  }, []);

  const handleAudioToggle = () => {
    const newState = toggleAudio();
    setAudioOn(newState);
  };

  // Poll notifications & pending deposits
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
    <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('auctions')}>
            <div className="relative group/logo w-11 h-11 rounded-xl bg-gradient-to-br from-[#E5B842] via-[#F3C34F] to-[#997920] p-0.5 shadow-[0_0_18px_rgba(229,184,66,0.35)] shrink-0 overflow-hidden">
              <div className="w-full h-full bg-[#09090b] rounded-[10px] overflow-hidden flex items-center justify-center relative">
                <img
                  src={logoUrl}
                  alt="Sunfyre General Trading Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {user?.role === 'superadmin' && (
                  <label
                    onClick={e => e.stopPropagation()}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xs opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center text-[7px] text-[#E5B842] font-mono font-semibold transition-opacity cursor-pointer text-center p-0.5"
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
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-xl tracking-wide text-white">MINIBID</span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/30">
                  {user?.role || 'Guest'}
                </span>
              </div>
              <p className="text-[10px] text-[#E5B842] -mt-0.5 font-mono tracking-wider font-medium flex items-center gap-1.5">
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

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-[#121214] p-1 rounded-xl border border-[#27272a]">
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
              Live Auctions
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
              Winners
            </button>

            <button
              id="nav-tab-how-it-works"
              onClick={onOpenHowItWorks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#1c1c20] transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How It Works
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
                Deposit Requests
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
                Active Users
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
                Staff & Audit
              </button>
            )}
          </nav>

          {/* Right Action Stack */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle */}
            <button
              id="audio-toggle-btn"
              onClick={handleAudioToggle}
              title={audioOn ? 'Mute sound effects' : 'Enable sound effects'}
              className="w-9 h-9 rounded-lg border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              {audioOn ? <Volume2 className="w-4 h-4 text-[#E5B842]" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifsDropdown(!showNotifsDropdown)}
                className="w-9 h-9 rounded-lg border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-zinc-100 flex items-center justify-center relative transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl z-50 p-3 max-h-96 overflow-y-auto">
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

            {/* If Authenticated: Role-tailored Balance / Treasury Status & Actions */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* 1. Super Admin: Supreme Treasury Authority (No personal balance & cannot request deposits) */}
                {isSuperAdmin ? (
                  <div
                    title="Super Administrator: Platform Liquidity & Treasury Authority"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#E5B842]" />
                    <div className="text-left leading-tight">
                      <div className="text-[9px] text-purple-400 font-mono uppercase tracking-wider">Supreme Authority</div>
                      <div className="text-xs font-bold font-serif text-[#E5B842]">Executive Treasury</div>
                    </div>
                  </div>
                ) : user.role === 'admin' ? (
                  /* 2. Operations Admin: Operational Float & Request Float from Super Admin */
                  <div className="flex items-center gap-2">
                    <div
                      onClick={onOpenLedger}
                      title="Admin Operational Float Balance"
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/50 cursor-pointer hover:border-blue-600 transition-all"
                    >
                      <Coins className="w-4 h-4 text-blue-400" />
                      <div className="text-right leading-tight">
                        <div className="text-[10px] text-blue-400 font-mono uppercase tracking-wider">Ops Float</div>
                        <div className="text-xs font-bold font-mono text-blue-200">
                          {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          <span className="text-[10px] text-blue-400">ETB</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="topbar-admin-request-float-btn"
                      onClick={() => onSelectTab('admin-deposits')}
                      title="Request operational float replenishment from Super Admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Request Float</span>
                    </button>
                  </div>
                ) : (
                  /* 3. Customer: Wallet Balance Pill & Bank Deposit Button */
                  <div className="flex items-center gap-2">
                    <div
                      onClick={onOpenLedger}
                      title="View wallet ledger & transactions"
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-[#E5B842]/10 border border-[#E5B842]/30 cursor-pointer hover:border-[#E5B842] transition-all"
                    >
                      <Coins className="w-4 h-4 text-[#E5B842]" />
                      <div className="text-right leading-tight">
                        <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Balance</div>
                        <div className="text-xs font-bold font-mono text-[#E5B842]">
                          {user.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          <span className="text-[10px] text-zinc-400">ETB</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="topbar-deposit-btn"
                      onClick={onOpenDeposit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E5B842] to-[#c99f30] text-black font-semibold text-xs shadow-[0_0_12px_rgba(229,184,66,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </button>
                  </div>
                )}

                {/* Admin Quick Action: New Auction */}
                {isAdmin && (
                  <button
                    id="topbar-new-auction-btn"
                    onClick={onOpenCreateAuction}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs shadow-md border border-zinc-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <PlusSquare className="w-3.5 h-3.5" />
                    <span>New Auction</span>
                  </button>
                )}

                {/* User Profile Pill */}
                <div
                  onClick={onOpenLedger}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#27272a] bg-[#121214] hover:border-zinc-600 cursor-pointer transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-zinc-200">@{user.username}</span>
                </div>

                {/* Explicit Logout Button */}
                <button
                  id="header-logout-btn"
                  onClick={logout}
                  title="Sign out of account"
                  className="w-9 h-9 rounded-xl border border-[#27272a] bg-[#121214] text-zinc-400 hover:text-red-400 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="topbar-login-btn"
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs shadow-md transition-all"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center gap-1.5 py-2 overflow-x-auto border-t border-[#27272a]/50 text-xs">
          <button
            onClick={() => onSelectTab('auctions')}
            className={`px-3 py-1 rounded-lg shrink-0 font-medium ${
              currentTab === 'auctions' ? 'bg-[#E5B842] text-black' : 'text-zinc-400 bg-[#121214]'
            }`}
          >
            Live Auctions
          </button>
          <button
            onClick={() => onSelectTab('winners')}
            className={`px-3 py-1 rounded-lg shrink-0 font-medium ${
              currentTab === 'winners' ? 'bg-[#E5B842] text-black' : 'text-zinc-400 bg-[#121214]'
            }`}
          >
            Winners
          </button>
          <button onClick={onOpenHowItWorks} className="px-3 py-1 rounded-lg shrink-0 font-medium text-zinc-400 bg-[#121214]">
            How It Works
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin-deposits')}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium ${
                currentTab === 'admin-deposits' ? 'bg-blue-600 text-white' : 'text-blue-400 bg-blue-950/40'
              }`}
            >
              Deposits ({pendingDepositsCount})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin-users')}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium ${
                currentTab === 'admin-users' ? 'bg-blue-600 text-white' : 'text-zinc-400 bg-[#121214]'
              }`}
            >
              Users
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => onSelectTab('super-financials')}
              className={`px-3 py-1 rounded-lg shrink-0 font-semibold ${
                currentTab === 'super-financials' ? 'bg-[#E5B842] text-black' : 'text-[#E5B842] bg-[#121214]'
              }`}
            >
              P&L Reports
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => onSelectTab('super-governance')}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium ${
                currentTab === 'super-governance' ? 'bg-purple-600 text-white' : 'text-purple-300 bg-[#121214]'
              }`}
            >
              Staff & Audit
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
