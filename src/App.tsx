import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { I18nProvider, useTranslation } from './utils/i18n.js';
import { Header } from './components/Header.js';
import { AuctionsList } from './components/AuctionsList.js';
import { AuctionDetailModal } from './components/AuctionDetailModal.js';
import { HowItWorksModal } from './components/HowItWorksModal.js';
import { DepositModal } from './components/DepositModal.js';
import { CustomerLedgerModal } from './components/CustomerLedgerModal.js';
import { WinnersGallery } from './components/WinnersGallery.js';
import { AuthModal } from './components/AuthModal.js';
import { GoldenParticleBackground } from './components/GoldenParticleBackground.js';
import { SunfyreLiveIntro } from './components/SunfyreLiveIntro.js';
import { AdminWorkstation } from './components/AdminWorkstation.js';
import { UserDashboard } from './components/UserDashboard.js';
import { usePortal } from './utils/portal.js';
import { initKeepAliveEngine } from './utils/keepAlive.js';
import { ShieldCheck, Lock, Sparkles, Shield, ChevronRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { language, t } = useTranslation();
  const { switchPortal } = usePortal();

  // Initialize Render anti-sleep keep-alive engine
  useEffect(() => {
    const cleanup = initKeepAliveEngine();
    return cleanup;
  }, []);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return !sessionStorage.getItem('sunfyre_intro_dismissed');
  });

  const [currentTab, setCurrentTab] = useState<string>('auctions');
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  // Modal triggers
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // If auth is verifying token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 animate-pulse shadow-xl">
          <div className="w-full h-full bg-[#09090b] rounded-[14px] flex items-center justify-center font-serif font-black text-[#E5B842] text-xl">
            MB
          </div>
        </div>
        <div className="text-xs font-mono tracking-wider text-zinc-500">
          {language === 'am' ? 'የደህንነት ማስረጃዎች በመረጋገጥ ላይ...' : 'Verifying cryptographic credentials...'}
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col selection:bg-[#E5B842]/30 selection:text-[#E5B842] font-sans relative overflow-x-hidden">
      {/* 3D Live Sunfyre Intro Animation */}
      {showIntro && (
        <SunfyreLiveIntro
          onComplete={() => {
            sessionStorage.setItem('sunfyre_intro_dismissed', 'true');
            setShowIntro(false);
          }}
          onOpenHowItWorks={() => {
            sessionStorage.setItem('sunfyre_intro_dismissed', 'true');
            setShowIntro(false);
            setIsHowItWorksOpen(true);
          }}
        />
      )}

      {/* Glowing golden lines & dots animated background */}
      <GoldenParticleBackground />

      {/* Discrete administrative banner when Staff/Superadmin is browsing player site */}
      {isAdmin && (
        <div className="relative z-30 bg-gradient-to-r from-red-950/90 via-[#18181f] to-amber-950/90 border-b border-red-800/50 px-3 sm:px-6 py-2 text-xs flex items-center justify-between text-zinc-300 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-rose-300 font-bold">
              {isSuperAdmin ? 'Super Admin Mode' : 'Staff Admin Mode'}:
            </span>
            <span className="hidden sm:inline text-zinc-400">
              You are currently viewing the customer gaming site.
            </span>
          </div>
          <button
            onClick={() => switchPortal('admin')}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Shield className="w-3 h-3 text-white" />
            <span>Open Executive Workstation</span>
            <ChevronRight className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">
        {/* 1. Header with Authenticated Profile / Sign In, Notification Bell & Actions */}
        <Header
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          onOpenDeposit={() => {
            if (!user) setIsAuthOpen(true);
            else setIsDepositOpen(true);
          }}
          onOpenLedger={() => {
            if (!user) setIsAuthOpen(true);
            else setIsLedgerOpen(true);
          }}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCreateAuction={() => switchPortal('admin')}
          onReplayIntro={() => setShowIntro(true)}
        />

        {/* 2. Main Workspace / Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 md:pb-12">
          {/* Welcome announcement banner for guest visitors */}
          {!user && (
            <div className="relative mb-6 rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500/15 via-[#E5B842]/10 to-amber-600/10 border border-[#E5B842]/40 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E5B842]/20 border border-[#E5B842]/50 flex items-center justify-center text-[#E5B842] shrink-0 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-serif font-bold text-white text-base sm:text-lg flex items-center gap-2">
                    <span>{language === 'am' ? 'እንኳን ወደ ሚኒቢድ ኢትዮጵያ በደህና መጡ' : 'Welcome to MiniBid Ethiopia'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#E5B842]/20 text-[#E5B842] text-[10px] font-mono font-bold uppercase tracking-wider">
                      {language === 'am' ? 'ይፋዊ' : 'Official'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                    {language === 'am'
                      ? 'የቀጥታ የቅንጦት ጨረታዎቻችንን እና ያለፉ አሸናፊዎችን ከዚህ በታች ይመልከቱ! በዝቅተኛ ያልተደገመ ጨረታ ለመሳተፍ አካውንት ይክፈቱ ወይም ይግቡ።'
                      : 'Explore our live luxury auctions and previous winners below! Create your account or sign in to participate in lowest unique reverse bidding.'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-[#E5B842]/20 transition-all cursor-pointer"
                >
                  {language === 'am' ? 'ግባ / ተመዝገብ' : 'Sign In / Register'}
                </button>
                <button
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer border border-zinc-700"
                >
                  {language === 'am' ? 'አሠራሩን እይ' : 'How It Works'}
                </button>
              </div>
            </div>
          )}

          {currentTab === 'auctions' && (
            <AuctionsList
              onSelectAuction={id => setSelectedAuctionId(id)}
              onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
              onViewWinners={() => setCurrentTab('winners')}
              onOpenDeposit={() => {
                if (!user) setIsAuthOpen(true);
                else setIsDepositOpen(true);
              }}
            />
          )}

          {currentTab === 'winners' && (
            <WinnersGallery onSelectAuction={id => setSelectedAuctionId(id)} />
          )}

          {currentTab === 'dashboard' && (
            <UserDashboard
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenLedger={() => setIsLedgerOpen(true)}
              onSelectAuction={id => setSelectedAuctionId(id)}
              onViewAllAuctions={() => setCurrentTab('auctions')}
            />
          )}
        </main>

        {/* 3. Player Modals Stack */}
        <AuctionDetailModal
          auctionId={selectedAuctionId}
          onClose={() => setSelectedAuctionId(null)}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <HowItWorksModal
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
          onOpenDeposit={() => {
            setIsHowItWorksOpen(false);
            if (!user) setIsAuthOpen(true);
            else setIsDepositOpen(true);
          }}
          onOpenAuth={tab => {
            setIsHowItWorksOpen(false);
            setIsAuthOpen(true);
          }}
        />

        <DepositModal
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
        />

        <CustomerLedgerModal
          isOpen={isLedgerOpen}
          onClose={() => setIsLedgerOpen(false)}
          onOpenDeposit={() => setIsDepositOpen(true)}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />

        {/* 4. Luxury FinTech Player Footer */}
        <footer className="border-t border-[#27272a] bg-[#0c0c0e] text-xs text-zinc-400 pt-10 pb-28 md:pb-10 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#27272a]/60">
              {/* Brand column */}
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E5B842] flex items-center justify-center font-serif font-black text-black">
                    MB
                  </div>
                  <span className="font-serif font-bold text-white text-base tracking-wide">MINIBID</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Ethiopia's premier Lowest Unique Bid reverse auction platform. Transparent algorithms, verified fairness, and real-time bank clearance.
                </p>
              </div>

              {/* Payment Rails */}
              <div className="space-y-2">
                <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                  Integrated Rails
                </span>
                <ul className="space-y-1 text-[11px] text-zinc-400">
                  <li>• Commercial Bank of Ethiopia (CBE)</li>
                  <li>• Telebirr Mobile Money</li>
                  <li>• Awash Bank S.C.</li>
                  <li>• Dashen Bank SuperApp</li>
                </ul>
              </div>

              {/* Architectural Security */}
              <div className="space-y-2">
                <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                  Security & Verification
                </span>
                <ul className="space-y-1 text-[11px] text-zinc-400">
                  <li className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ACID-Compliant Transactions</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-amber-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confidential Item Costs</span>
                  </li>
                  <li>• 5MB Proof Receipt Enforcement</li>
                  <li>• Cryptographic Audit Trail</li>
                </ul>
              </div>

              {/* Platform Access */}
              <div className="space-y-2">
                <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                  Platform Navigation
                </span>
                <div className="flex flex-col space-y-1 text-[11px]">
                  <button
                    onClick={() => setCurrentTab('auctions')}
                    className="text-left text-zinc-400 hover:text-[#E5B842] transition-colors"
                  >
                    Live Auction Grid
                  </button>
                  <button
                    onClick={() => setCurrentTab('winners')}
                    className="text-left text-zinc-400 hover:text-[#E5B842] transition-colors"
                  >
                    Concluded Winners
                  </button>
                  <button
                    onClick={() => setIsHowItWorksOpen(true)}
                    className="text-left text-zinc-400 hover:text-[#E5B842] transition-colors"
                  >
                    How It Works & Simulator
                  </button>
                  <button
                    onClick={() => setIsDepositOpen(true)}
                    className="text-left text-zinc-400 hover:text-[#E5B842] transition-colors"
                  >
                    Top Up Wallet Balance
                  </button>
                  <button
                    onClick={() => switchPortal('admin')}
                    className="text-left text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1 pt-2 font-mono text-[10px]"
                  >
                    <Lock className="w-3 h-3 text-zinc-600" />
                    <span>Admin Workstation</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
              <div>
                © {new Date().getFullYear()} MiniBid Technologies Inc. All rights reserved. Registered in Ethiopia.
              </div>
              <div className="flex items-center gap-4">
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms of Participation</span>
                <span>•</span>
                <span className="font-mono text-zinc-400">v2.4.0 Production</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const PortalRouter: React.FC = () => {
  const { portal } = usePortal();

  if (portal === 'admin') {
    return <AdminWorkstation />;
  }

  return <MainAppContent />;
};

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <PortalRouter />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
