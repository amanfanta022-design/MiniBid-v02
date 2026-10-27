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
import { AdminSmsGateway } from './AdminSmsGateway.js';
import { AdminEmailSmtpDesk } from './AdminEmailSmtpDesk.js';
import { GoldenParticleBackground } from './GoldenParticleBackground.js';
import { SponsorProposalDeck } from './SponsorProposalDeck.js';
import { User, PlatformNotification } from '../types.js';
import {
  Briefcase,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Activity,
  Laptop,
  Smartphone,
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
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { isAudioEnabled, toggleAudio, playSlaBreachAlarm, playUrgentAdminWarningBeep } from '../utils/audio.js';

export const AdminWorkstation: React.FC = () => {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { switchPortal, isDedicatedSubdomain } = usePortal();

  // Selected administrative tab
  const [currentTab, setCurrentTab] = useState<string>('super-live-games');
  const [governanceSubTab, setGovernanceSubTab] = useState<'staff' | 'audit'>('staff');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & inspect targets
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [isCreateAuctionOpen, setIsCreateAuctionOpen] = useState(false);
  const [targetUserForAdjust, setTargetUserForAdjust] = useState<User | null>(null);
  const [isSponsorDeckOpen, setIsSponsorDeckOpen] = useState(false);

  // Sound and notifications
  const [audioOn, setAudioOn] = useState(true);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [pendingDepositsCount, setPendingDepositsCount] = useState<number>(0);
  const [slaBreachesCount, setSlaBreachesCount] = useState<number>(0);
  const [hasAdminUrgentWarning, setHasAdminUrgentWarning] = useState<boolean>(false);
  const prevSlaBreachesRef = React.useRef<number>(0);
  const prevUrgentNotifsRef = React.useRef<number>(0);

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

  // Polling for admin notifications, SLA breaches & pending deposit requests
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

          if (user.role === 'admin') {
            const myDelayed = (data.deposits || []).filter(
              (d: any) => d.status === 'pending' && (d.is_sla_breached || (d.warning_count || 0) > 0)
            );
            setHasAdminUrgentWarning(myDelayed.length > 0);
          }
        }

        // Super Admin SLA breaches check
        if (user.role === 'superadmin') {
          const slaRes = await fetch('/api/superadmin/deposits/sla-breaches', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (slaRes.ok) {
            const slaData = await slaRes.json();
            const count = slaData.count || 0;
            setSlaBreachesCount(count);
            if (count > 0 && count > prevSlaBreachesRef.current) {
              playSlaBreachAlarm();
            }
            prevSlaBreachesRef.current = count;
          }
        }

        // Notifications
        const notifRes = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          const notifs = notifData.notifications || [];
          setNotifications(notifs);

          if (user.role === 'admin') {
            const urgentCount = notifs.filter((n: any) => n.type === 'urgent').length;
            if (urgentCount > prevUrgentNotifsRef.current) {
              playUrgentAdminWarningBeep();
            }
            prevUrgentNotifsRef.current = urgentCount;
          }
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
                  placeholder="Administrative Username or ID"
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
  interface AdminNavItem {
    id: string;
    label: string;
    labelAm: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badge?: React.ReactNode;
    superAdminOnly?: boolean;
  }

  interface AdminCategory {
    title: string;
    titleAm: string;
    items: AdminNavItem[];
  }

  const adminCategories: AdminCategory[] = [
    {
      title: 'Operations Desk',
      titleAm: 'የቀጥታ ኦፕሬሽን',
      items: [
        {
          id: 'super-live-games',
          label: 'Live Game Radar & Full Bids',
          labelAm: 'የቀጥታ ጨዋታዎች ራዳር',
          icon: Activity,
          color: 'text-rose-400',
          superAdminOnly: true,
        },
        {
          id: 'admin-deposits',
          label: 'Deposit Verification Desk',
          labelAm: 'የተቀማጭ ገንዘብ ማረጋገጫ',
          icon: Inbox,
          color: 'text-blue-400',
          badge: isSuperAdmin && slaBreachesCount > 0 ? (
            <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold text-[9px] rounded-full animate-pulse border border-red-300">
              ⚠️ {slaBreachesCount}
            </span>
          ) : pendingDepositsCount > 0 ? (
            <span className="px-1.5 py-0.5 bg-amber-400 text-black font-bold text-[9px] rounded-full">
              {pendingDepositsCount}
            </span>
          ) : null,
        },
        {
          id: 'super-activity',
          label: 'Activity Control Room',
          labelAm: 'የእንቅስቃሴ መቆጣጠሪያ',
          icon: Activity,
          color: 'text-amber-400',
          superAdminOnly: true,
        },
        {
          id: 'auctions-inspector',
          label: 'All Games Catalog',
          labelAm: 'የጨረታዎች ካታሎግ',
          icon: Layers,
          color: 'text-zinc-400',
        },
      ],
    },
    {
      title: 'Financials & Governance',
      titleAm: 'ፋይናንስ እና ኦዲት',
      items: [
        {
          id: 'super-financials',
          label: 'Financial P&L & Margins',
          labelAm: 'የፋይናንስ ገቢ እና ትርፍ',
          icon: BarChart3,
          color: 'text-amber-400',
          superAdminOnly: true,
        },
        {
          id: 'super-governance',
          label: 'Staff Floats & Governance',
          labelAm: 'የሰራተኞች ቁጥጥር እና ፍሎት',
          icon: ShieldCheck,
          color: 'text-purple-400',
          superAdminOnly: true,
        },
      ],
    },
    {
      title: 'Security & Infrastructure',
      titleAm: 'ደህንነት እና ኔትወርክ',
      items: [
        {
          id: 'admin-users',
          label: isSuperAdmin ? 'System Users & Staff' : 'Customer Participants',
          labelAm: isSuperAdmin ? 'ተጠቃሚዎች እና ሰራተኞች' : 'ተሳታፊዎች',
          icon: Users,
          color: 'text-blue-400',
        },
        {
          id: 'super-devices',
          label: 'Device & Session Monitor',
          labelAm: 'የመሳሪያዎች ደህንነት',
          icon: Laptop,
          color: 'text-emerald-400',
          superAdminOnly: true,
        },
        {
          id: 'sms-gateway',
          label: 'Telecom SMS Gateway',
          labelAm: 'የቴሌኮም SMS ጌትዌይ',
          icon: Smartphone,
          color: 'text-blue-400',
          superAdminOnly: true,
        },
        {
          id: 'email-gateway',
          label: 'Email & SMTP Gateway',
          labelAm: 'የኢሜይል SMTP ጌትዌይ',
          icon: Mail,
          color: 'text-amber-400',
          superAdminOnly: true,
        },
      ],
    },
  ];

  const getCurrentTabLabel = () => {
    for (const cat of adminCategories) {
      const match = cat.items.find(i => i.id === currentTab);
      if (match) return language === 'am' ? match.labelAm : match.label;
    }
    return language === 'am' ? 'ዳሽቦርድ' : 'Workstation';
  };

  const renderNavList = (onSelect?: () => void) => {
    return (
      <div className="space-y-4">
        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'am' ? 'ማውጫ ፈልግ...' : 'Filter desks...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {adminCategories.map(cat => {
          const visibleItems = cat.items.filter(item => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (!searchQuery) return true;
            return (
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.labelAm.toLowerCase().includes(searchQuery.toLowerCase())
            );
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.title} className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 py-1 font-bold">
                {language === 'am' ? cat.titleAm : cat.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        if (onSelect) onSelect();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-red-950/80 via-[#221015] to-amber-950/80 border border-red-500/50 text-white shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E5B842]' : item.color}`} />
                        <span className="truncate">{language === 'am' ? item.labelAm : item.label}</span>
                      </div>
                      {item.badge}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col selection:bg-rose-500/30 selection:text-rose-200 font-sans relative overflow-x-hidden">
      <GoldenParticleBackground />

      {/* MOBILE & TABLET SLIDING DRAWER BACKDROP & DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
          />

          {/* Sliding Drawer Panel */}
          <div className="relative w-72 sm:w-80 bg-[#0c0c12] border-r border-zinc-800 h-full p-4 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 animate-slideInLeft">
            <div className="space-y-4">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 p-0.5 shadow flex items-center justify-center">
                    <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-bold text-rose-400 text-xs">
                      MB
                    </div>
                  </div>
                  <div>
                    <span className="font-serif font-black text-white text-sm">MINIBID</span>
                    <span className="block text-[9px] font-mono text-zinc-500 uppercase">Executive Navigation</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation List */}
              {renderNavList(() => setIsSidebarOpen(false))}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsCreateAuctionOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                <PlusSquare className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'አዲስ ጨረታ ፍጠር' : 'Post Auction'}</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsSponsorDeckOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{language === 'am' ? 'የስፖንሰርሺፕ ጥሪ (4 ገጽ)' : 'Sponsor Deck (4-Page)'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  switchPortal('player');
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'am' ? 'የተጫዋቾች ገፅ' : 'Player Site'}</span>
              </button>

              <button
                onClick={() => logout()}
                className="w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-900/50 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">
        {/* Executive Workstation Header - Clean Single Row */}
        <header className="sticky top-0 z-40 bg-[#0a0a0e]/95 backdrop-blur-md border-b border-red-950/60 shadow-xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between gap-3">
              {/* Brand, Drawer Button and active desk breadcrumb */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile / Tablet Sliding Drawer Toggle Button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-white font-bold text-xs shadow cursor-pointer transition-all active:scale-95"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-4 h-4 text-[#E5B842]" />
                  <span className="hidden xs:inline font-mono">{language === 'am' ? 'ማውጫ' : 'Desks'}</span>
                </button>

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 p-0.5 shadow-lg shadow-red-950/60 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#0a0a0e] rounded-[10px] flex items-center justify-center font-mono font-black text-rose-400 text-xs sm:text-sm">
                    MB
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-serif font-black tracking-wider text-white text-sm sm:text-base">MINIBID</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-rose-300 border border-red-800/60 font-mono font-bold uppercase tracking-wider hidden xs:inline-block">
                      Executive Desk
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <span className="text-zinc-500 hidden sm:inline">Active Desk:</span>
                    <strong className="text-[#E5B842] truncate max-w-[140px] sm:max-w-none">
                      {getCurrentTabLabel()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Create Auction button */}
                <button
                  onClick={() => setIsCreateAuctionOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer transition-all"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'አዲስ ጨረታ' : 'Post Auction'}</span>
                </button>

                {/* Executive 4-Page Sponsor Proposal Deck (Super Admin Exclusive) */}
                {isSuperAdmin && (
                  <button
                    onClick={() => setIsSponsorDeckOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-600/25 to-blue-500/20 hover:from-amber-500/35 hover:to-blue-500/35 border border-amber-500/50 text-amber-300 hover:text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                    title="Open and print the 4-Page Executive Sponsorship & Investor Proposal Deck"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#E5B842]" />
                    <span>{language === 'am' ? 'ስፖንሰርሺፕ (4 ገጽ)' : 'Sponsor Deck'}</span>
                  </button>
                )}

                {/* Return/View Player Site */}
                <button
                  onClick={() => switchPortal('player')}
                  title="Open the player gaming view"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">{language === 'am' ? 'የተጫዋቾች ገፅ' : 'Player Site'}</span>
                </button>

                {/* Audio Toggle */}
                <button
                  onClick={handleAudioToggle}
                  className="w-8 h-8 rounded-lg border border-zinc-800 bg-[#121217] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
                  title={audioOn ? 'Audio alerts active' : 'Audio alerts muted'}
                >
                  {audioOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
                </button>

                {/* Super Admin Glowing SLA Breach Alert Badge */}
                {isSuperAdmin && slaBreachesCount > 0 && (
                  <button
                    onClick={() => setCurrentTab('admin-deposits')}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-red-950/70 border border-red-400/80 animate-pulse cursor-pointer transition-all"
                    title="15-Minute SLA breached on pending customer deposits."
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-white animate-spin" />
                    <span className="tracking-wide text-[11px]">⚠️ {slaBreachesCount} SLA</span>
                  </button>
                )}

                {/* Operations Admin Urgent Warning Alert Badge */}
                {!isSuperAdmin && hasAdminUrgentWarning && (
                  <button
                    onClick={() => setCurrentTab('admin-deposits')}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-black font-extrabold text-xs shadow-lg shadow-amber-950/70 border border-amber-300 animate-bounce cursor-pointer transition-all"
                    title="Super Admin has issued an urgent speed escalation warning!"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-black" />
                    <span className="text-[11px]">🚨 URGENT</span>
                  </button>
                )}

                {/* Notifications Bell */}
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
                <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-zinc-800">
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
          </div>
        </header>

        {/* WORKSPACE DUAL-PANEL BODY: FIXED DESKTOP SIDEBAR + RESPONSIVE MAIN VIEWPORT */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] relative">
          
          {/* DESKTOP PERMANENT SIDEBAR */}
          <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-zinc-800/80 bg-[#09090e] shrink-0 p-3.5 justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-4">
              {renderNavList()}
            </div>

            {/* Desktop Sidebar Bottom Shortcuts */}
            <div className="pt-3 border-t border-zinc-800 space-y-1.5">
              <button
                onClick={() => setIsCreateAuctionOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
              >
                <PlusSquare className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'አዲስ ጨረታ ፍጠር' : 'Post Auction'}</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => setIsSponsorDeckOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{language === 'am' ? 'የስፖንሰርሺፕ ጥሪ (4 ገጽ)' : 'Sponsor Deck (4-Page)'}</span>
                </button>
              )}
            </div>
          </aside>

          {/* MAIN RESPONSIVE WORKSTATION CONTENT AREA */}
          <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {currentTab === 'super-live-games' && isSuperAdmin && (
            <SuperAdminLiveGameDesk onSelectAuction={id => setSelectedAuctionId(id)} />
          )}

          {currentTab === 'super-financials' && isSuperAdmin && <SuperAdminFinancials />}

          {currentTab === 'super-activity' && isSuperAdmin && <SuperAdminActivityController />}

          {currentTab === 'super-devices' && isSuperAdmin && <SuperAdminDeviceSecurity />}

          {currentTab === 'sms-gateway' && isSuperAdmin && <AdminSmsGateway />}

          {currentTab === 'email-gateway' && isSuperAdmin && <AdminEmailSmtpDesk />}

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
      </div>

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

        <SponsorProposalDeck
          isOpen={isSponsorDeckOpen}
          onClose={() => setIsSponsorDeckOpen(false)}
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
