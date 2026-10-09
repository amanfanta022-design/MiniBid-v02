import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import { usePortal } from '../utils/portal.js';
import { AdminDepositRequests } from './AdminDepositRequests.js';
import { AdminUsersTable } from './AdminUsersTable.js';
import { AdminCreateAuctionModal } from './AdminCreateAuctionModal.js';
import { SuperAdminFinancials } from './SuperAdminFinancials.js';
import { SuperAdminAdmins } from './SuperAdminAdmins.js';
import { SuperAdminAuditLogs } from './SuperAdminAuditLogs.js';
import { SuperAdminBalanceAdjuster } from './SuperAdminBalanceAdjuster.js';
import { SuperAdminLiveGameDesk } from './SuperAdminLiveGameDesk.js';
import { SuperAdminActivityController } from './SuperAdminActivityController.js';
import { SuperAdminDeviceSecurity } from './SuperAdminDeviceSecurity.js';
import { AuctionsList } from './AuctionsList.js';
import { AuctionDetailModal } from './AuctionDetailModal.js';
import { GoldenParticleBackground } from './GoldenParticleBackground.js';
import { User, PlatformNotification } from '../types.js';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Activity,
  Laptop,
  BarChart3,
  Inbox,
  Users,
  KeyRound,
  FileSpreadsheet,
  PlusSquare,
  LogOut,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Coins,
  AlertCircle,
  Bell,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { isAudioEnabled, toggleAudio } from '../utils/audio.js';

export const AdminWorkstation: React.FC = () => {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { switchPortal, isDedicatedSubdomain } = usePortal();

  // Selected administrative tab
  const [currentTab, setCurrentTab] = useState<string>('super-live-games');
  const [governanceSubTab, setGovernanceSubTab] = useState<'staff' | 'audit'>('staff');

  // Modals & inspect targets
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [isCreateAuctionOpen, setIsCreateAuctionOpen] = useState(false);
  const [targetUserForAdjust, setTargetUserForAdjust] = useState<User | null>(null);

  // Sound and notifications
  const [audioOn, setAudioOn] = useState(true);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [pendingDepositsCount, setPendingDepositsCount] = useState<number>(0);

  // Login form state (for non-authenticated visitors to /admin or admin.minibid.et)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setAudioOn(isAudioEnabled());
  }, []);

  const handleAudioToggle = () => {
    const newState = toggleAudio();
    setAudioOn(newState);
  };

  // Set default view depending on user role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'superadmin') {
      setCurrentTab('super-live-games');
    } else if (user.role === 'admin') {
      setCurrentTab('admin-deposits');
    }
  }, [user?.role]);

  // Polling for admin notifications & pending deposit requests
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return;

    const fetchAdminTelemetry = async () => {
      try {
        const token = localStorage.getItem('minibid_token');
        if (!token) return;

        // Pending deposits count
        const depRes = await fetch('/api/admin/deposits', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (depRes.ok) {
          const data = await depRes.json();
          const pending = (data.deposits || []).filter((d: { status: string }) => d.status === 'pending');
          setPendingDepositsCount(pending.length);
        }

        // Notifications
        const notifRes = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }
      } catch {
        // silent
      }
    };

    fetchAdminTelemetry();
    const interval = setInterval(fetchAdminTelemetry, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const res = await login(loginIdentifier.trim(), loginPassword, 'admin');
    setIsLoggingIn(false);

    if (!res.success) {
      setLoginError(res.error || 'Authentication rejected. Verify admin credentials.');
      return;
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isCustomer = user && user.role === 'customer';

  // =========================================================================
  // VIEW 1: RESTRICTED LOGIN TERMINAL (When visitor is not authenticated)
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between selection:bg-rose-500/30 selection:text-rose-200 font-sans relative overflow-hidden">
        <GoldenParticleBackground />

        {/* Security watermark header */}
        <header className="relative z-10 border-b border-zinc-800/80 bg-[#0c0c10]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-amber-600 p-0.5 shadow-lg shadow-red-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c0c10] rounded-[10px] flex items-center justify-center font-mono font-black text-rose-400 text-sm">
                MB
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wider text-white text-sm">MINIBID</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-rose-400 border border-red-800/50 font-mono font-bold uppercase tracking-wider">
                  Internal Terminal
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                {isDedicatedSubdomain ? 'admin.minibid.et' : 'Dedicated Executive Gateway'}
              </p>
            </div>
          </div>

          <button
            onClick={() => switchPortal('player')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'ወደ ዋናው የተጫዋቾች ገፅ ተመለስ' : 'Go to Public Gaming Site'}</span>
          </button>
        </header>

        {/* Login Form Container */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-[#0f0f14]/95 border border-red-950/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/30 backdrop-blur-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-900/80 border border-red-500/40 rounded-full text-[10px] font-mono font-bold text-red-200 tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-red-400" />
              <span>ACID AUDIT ENFORCED</span>
            </div>

            <div className="text-center mt-3 mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-600/20 to-amber-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-serif font-black text-white tracking-wide">
                Executive Command Center
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Authorized Staff & Super Administrator authentication terminal. All attempts are cryptographically recorded.
              </p>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{loginError}</span>
                </div>
                {(loginError.includes('Customer') || loginError.includes('gaming site')) && (
                  <button
                    type="button"
                    onClick={() => switchPortal('player')}
                    className="w-full mt-2 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
                  >
                    <span>Go to Public Gaming Site (minibid.et)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Administrative Username / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. superadmin, alex, or email"
                  className="w-full bg-[#16161c] border border-zinc-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#16161c] border border-zinc-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <span>Verifying Cryptographic Session...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate & Access Workstation</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="font-mono">TLS 1.3 / HMAC-SHA256</span>
              <button
                onClick={() => switchPortal('player')}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
              >
                Public Player Site →
              </button>
            </div>
          </div>
        </main>

        <footer className="relative z-10 border-t border-zinc-900 bg-[#0a0a0c] px-4 py-3 text-center text-[10px] text-zinc-600 font-mono">
          MiniBid Ethiopia Financial Gateway • Segregated Administrative Network • ISO/IEC 27001 Controls
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACCESS DENIED (When logged in as a normal player)
  // =========================================================================
  if (isCustomer) {
    return (
      <div className="min-h-screen bg-[#09090c] text-zinc-100 flex flex-col items-center justify-center p-4 relative font-sans">
        <GoldenParticleBackground />

        <div className="relative z-10 max-w-md w-full bg-[#121217] border border-amber-900/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-serif font-black text-white">
            Administrative Clearance Required
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Your account (<span className="text-amber-300 font-mono font-bold">@{user.username}</span>) is a player account. This portal is strictly isolated for staff and Super Administrator operations.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => switchPortal('player')}
              className="w-full py-3 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-extrabold text-xs tracking-wide shadow-lg cursor-pointer transition-all"
            >
              🎮 Return to MiniBid Player Gaming Site
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Switch to Staff Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: FULL EXECUTIVE WORKSTATION (Admin & Super Admin)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col selection:bg-rose-500/30 selection:text-rose-200 font-sans relative overflow-x-hidden">
      <GoldenParticleBackground />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Executive Workstation Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0e]/95 backdrop-blur-md border-b border-red-950/60 shadow-xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between gap-3">
              {/* Brand and security posture */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 p-0.5 shadow-lg shadow-red-950/60 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0a0a0e] rounded-[10px] flex items-center justify-center font-mono font-black text-rose-400 text-sm">
                    MB
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black tracking-wider text-white text-base">MINIBID</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-rose-300 border border-red-800/60 font-mono font-bold uppercase tracking-wider">
                      Executive Desk
                    </span>
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACID Safe
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                    <span>{isDedicatedSubdomain ? 'admin.minibid.et' : 'Isolated Admin Portal'}</span>
                    <span>•</span>
                    <span className="text-zinc-500">Node: Addis-Central-01</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Create Auction button */}
                <button
                  onClick={() => setIsCreateAuctionOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer transition-all"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'አዲስ ጨረታ ፍጠር' : 'Post Auction'}</span>
                </button>

                {/* Return/View Player Site */}
                <button
                  onClick={() => switchPortal('player')}
                  title="Open the player gaming view"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">{language === 'am' ? 'የተጫዋቾች ገፅ' : 'Player Site'}</span>
                </button>

                {/* Audio Toggle */}
                <button
                  onClick={handleAudioToggle}
                  className="w-8 h-8 rounded-lg border border-zinc-800 bg-[#121217] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
                >
                  {audioOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifsDropdown(!showNotifsDropdown)}
                    className="w-8 h-8 rounded-lg border border-zinc-800 bg-[#121217] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all relative"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {pendingDepositsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                        {pendingDepositsCount}
                      </span>
                    )}
                  </button>

                  {showNotifsDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#121217] border border-zinc-800 rounded-2xl shadow-2xl z-50 p-3 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                        <span className="font-semibold text-xs text-zinc-200">Admin Telemetry Feed</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{notifications.length} logged</span>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-500">No operational alerts.</div>
                      ) : (
                        <div className="space-y-2">
                          {notifications.slice(0, 10).map(n => (
                            <div key={n.id} className="p-2 rounded-lg bg-[#18181f] border border-zinc-800 text-xs">
                              <div className="font-semibold text-zinc-200">{n.title}</div>
                              <div className="text-[11px] text-zinc-400 mt-0.5">{n.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Staff User Capsule */}
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                      <span>@{user.username}</span>
                      {isSuperAdmin ? (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-mono font-bold uppercase">
                          SUPER
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] font-mono font-bold uppercase">
                          STAFF
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Float: {user.wallet_balance.toLocaleString()} ETB
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    title="Sign Out of Workstation"
                    className="w-8 h-8 rounded-lg border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-300 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-zinc-800/80 no-scrollbar">
              {isSuperAdmin && (
                <button
                  onClick={() => setCurrentTab('super-live-games')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    currentTab === 'super-live-games'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                      : 'text-rose-400 hover:bg-rose-950/30 border border-rose-900/40'
                  }`}
                >
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Live Game Radar & Full Bids</span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => setCurrentTab('super-financials')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    currentTab === 'super-financials'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-950/50'
                      : 'text-amber-400 hover:bg-amber-950/30 border border-amber-900/40'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Financial P&L & Margins</span>
                </button>
              )}

              <button
                onClick={() => setCurrentTab('admin-deposits')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer relative ${
                  currentTab === 'admin-deposits'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
                    : 'text-blue-300 hover:bg-blue-950/30 border border-blue-900/40'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Deposit Verification Desk</span>
                {pendingDepositsCount > 0 && (
                  <span className="w-4 h-4 bg-amber-400 text-black font-black text-[10px] rounded-full flex items-center justify-center animate-bounce">
                    {pendingDepositsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('admin-users')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  currentTab === 'admin-users'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
                    : 'text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{isSuperAdmin ? 'All System Users & Staff' : 'Customer Participants'}</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => setCurrentTab('super-governance')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    currentTab === 'super-governance'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                      : 'text-purple-300 hover:bg-purple-950/30 border border-purple-900/40'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Staff Floats & Governance</span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => setCurrentTab('super-activity')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    currentTab === 'super-activity'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 font-bold'
                      : 'text-amber-300 hover:bg-amber-950/30 border border-amber-900/40'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Activity Control Room</span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => setCurrentTab('super-devices')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    currentTab === 'super-devices'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 font-bold'
                      : 'text-emerald-300 hover:bg-emerald-950/30 border border-emerald-900/40'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                  <span>Device & Session Monitor</span>
                </button>
              )}

              <button
                onClick={() => setCurrentTab('auctions-inspector')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  currentTab === 'auctions-inspector'
                    ? 'bg-zinc-700 text-white shadow-lg'
                    : 'text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Games Catalog</span>
              </button>
            </div>
          </div>
        </header>

        {/* Workstation Main Display Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
          {currentTab === 'super-live-games' && isSuperAdmin && (
            <SuperAdminLiveGameDesk onSelectAuction={id => setSelectedAuctionId(id)} />
          )}

          {currentTab === 'super-financials' && isSuperAdmin && <SuperAdminFinancials />}

          {currentTab === 'super-activity' && isSuperAdmin && <SuperAdminActivityController />}

          {currentTab === 'super-devices' && isSuperAdmin && <SuperAdminDeviceSecurity />}

          {currentTab === 'admin-deposits' && (
            <AdminDepositRequests onBackToAuctions={() => setCurrentTab('super-live-games')} />
          )}

          {currentTab === 'admin-users' && (
            <AdminUsersTable
              onOpenBalanceAdjust={targetUser => setTargetUserForAdjust(targetUser)}
            />
          )}

          {currentTab === 'super-governance' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 bg-[#121217] p-1.5 rounded-2xl border border-zinc-800 w-max">
                <button
                  onClick={() => setGovernanceSubTab('staff')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    governanceSubTab === 'staff'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Staff Credentials & Float Caps
                </button>
                <button
                  onClick={() => setGovernanceSubTab('audit')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    governanceSubTab === 'audit'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Cryptographic Audit Trail
                </button>
              </div>

              {governanceSubTab === 'staff' ? (
                <SuperAdminAdmins />
              ) : (
                <SuperAdminAuditLogs />
              )}
            </div>
          )}

          {currentTab === 'auctions-inspector' && (
            <div className="space-y-6">
              <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Full Platform Catalog Oversight</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Click any auction card to open the administrative control desk and live bid ledger.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateAuctionOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <PlusSquare className="w-4 h-4" />
                  <span>Create Item</span>
                </button>
              </div>

              <AuctionsList
                onSelectAuction={id => setSelectedAuctionId(id)}
                onOpenHowItWorks={() => {}}
                onViewWinners={() => {}}
                onOpenDeposit={() => {}}
              />
            </div>
          )}
        </main>

        {/* Administrative Modals */}
        <AdminCreateAuctionModal
          isOpen={isCreateAuctionOpen}
          onClose={() => setIsCreateAuctionOpen(false)}
          onCreated={() => {
            setCurrentTab('super-live-games');
          }}
        />

        <SuperAdminBalanceAdjuster
          targetUser={targetUserForAdjust}
          onClose={() => setTargetUserForAdjust(null)}
          onAdjusted={() => setTargetUserForAdjust(null)}
        />

        <AuctionDetailModal
          auctionId={selectedAuctionId}
          onClose={() => setSelectedAuctionId(null)}
          onOpenDeposit={() => {}}
          onOpenAuth={() => {}}
        />

        {/* Dedicated Admin Footer */}
        <footer className="border-t border-zinc-900 bg-[#08080b] py-6 px-4 text-center text-xs text-zinc-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>MiniBid Super Admin & Operational Control Workstation</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => switchPortal('player')}
                className="text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                🎮 Switch to Player Gaming View
              </button>
              <span>•</span>
              <span>TLS 1.3 Certified</span>
              <span>•</span>
              <span>Version 2.4.0 Production</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
