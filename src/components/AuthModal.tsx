import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  X,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Languages,
  ShieldCheck,
  KeyRound,
  Mail,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { EmailVerificationModal } from './EmailVerificationModal.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const { language, setLanguage } = useTranslation();

  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login inputs (Unified Username or Phone + Password)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs (Username, Phone, Password, Optional Email)
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('+2519');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Email verification prompt modal
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  if (!isOpen && !showEmailVerifyModal) return null;

  // Handle Unified Login (Username or Phone + Password)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage(
        language === 'am'
          ? 'እባክዎ የተጠቃሚ ስም/ስልክ እና የይለፍ ቃል ያስገቡ።'
          : 'Please enter your username or phone number and password.'
      );
      return;
    }

    setIsLoading(true);
    const res = await login(loginIdentifier.trim(), loginPassword, 'player');
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(
        res.error ||
          (language === 'am'
            ? 'መግባት አልተቻለም። እባክዎ መረጃዎን ያረጋግጡ።'
            : 'Failed to sign in. Please check your credentials.')
      );
      setErrorCode(res.code || '');
    } else {
      onClose();
    }
  };

  // Handle Direct Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanUsername = regUsername.trim();
    if (cleanUsername.length <= 5) {
      setErrorMessage(
        language === 'am'
          ? 'የተጠቃሚ ስም ከ5 ፊደላት በላይ መሆን አለበት (ቢያንስ 6 ቁምፊዎች)።'
          : 'Username must be more than 5 characters (at least 6 characters).'
      );
      return;
    }

    if (!/^[a-zA-Z0-9_]{6,30}$/.test(cleanUsername)) {
      setErrorMessage(
        language === 'am'
          ? 'የተጠቃሚ ስም ፊደላት፣ ቁጥሮች እና (_) ብቻ መያዝ አለበት።'
          : 'Username may only contain letters, numbers, and underscores.'
      );
      return;
    }

    const cleanPhone = regPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(\+251[79]\d{8}|0[79]\d{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage(
        language === 'am'
          ? 'ስልክ ቁጥር ትክክለኛ የኢትዮጵያ ቅርጸት (+2519..., +2517..., 09..., ወይም 07...) መሆን አለበት።'
          : 'Phone number must match Ethiopian format (+2519..., +2517..., 09..., or 07...).'
      );
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage(
        language === 'am'
          ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    const cleanEmail = regEmail.trim();
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setErrorMessage(
          language === 'am'
            ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ ወይም ባዶ ይተዉት።'
            : 'Please enter a valid email address or leave it empty.'
        );
        return;
      }
    }

    setIsLoading(true);
    const res = await register({
      username: cleanUsername,
      phone: cleanPhone,
      password: regPassword,
      email: cleanEmail || undefined,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || (language === 'am' ? 'አካውንት መክፈት አልተቻለም።' : 'Failed to create account'));
    } else {
      if (cleanEmail && res.email_otp_dispatched) {
        // Open Email Verification Modal to let user claim their Verified Badge immediately!
        setRegisteredEmail(cleanEmail);
        setShowEmailVerifyModal(true);
      } else {
        onClose();
      }
    }
  };

  return (
    <>
      {isOpen && !showEmailVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 md:p-8 text-zinc-100 my-auto sm:my-8 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
            {/* Top Action Header */}
            <div className="flex items-center justify-between absolute top-4 sm:top-5 right-4 sm:right-5 gap-2 z-10">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono font-semibold text-[#E5B842] border border-[#27272a] flex items-center gap-1 transition-all cursor-pointer"
                title="Toggle Language"
              >
                <Languages className="w-3 h-3" />
                <span>{language === 'en' ? 'አማርኛ' : 'EN'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Brand Monogram */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 mx-auto mb-2 shadow-lg">
                <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
                  <span className="font-serif font-black text-[#E5B842] text-2xl">MB</span>
                </div>
              </div>
              <h2 className="text-xl font-bold font-serif text-white">MINIBID ETHIOPIA</h2>
              <div className="flex items-center justify-center gap-1.5 mt-0.5 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'am' ? 'የተጫዋቾች መግቢያ ፖርታል' : 'Player Gaming Portal'}</span>
              </div>
            </div>

            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] mb-5">
              <button
                id="auth-tab-login"
                onClick={() => {
                  setTab('login');
                  setErrorMessage('');
                  setErrorCode('');
                  setSuccessNotice('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-[#E5B842] text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'am' ? 'ግባ (Sign In)' : 'Sign In'}
              </button>
              <button
                id="auth-tab-register"
                onClick={() => {
                  setTab('register');
                  setErrorMessage('');
                  setErrorCode('');
                  setSuccessNotice('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-[#E5B842] text-black shadow-sm font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'am' ? 'አካውንት ክፈት (Register)' : 'Create Account'}
              </button>
            </div>

            {/* ==================== 1. SIGN IN TAB ==================== */}
            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {language === 'am' ? 'የተጠቃሚ ስም ወይም ስልክ ቁጥር' : 'Username or Phone Number'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={language === 'am' ? 'የተጠቃሚ ስም ወይም 09... / +251...' : 'Username or 09... / +251...'}
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {language === 'am'
                      ? 'በተጠቃሚ ስምዎ ወይም በኢትዮጵያ ስልክ ቁጥርዎ መግባት ይችላሉ።'
                      : 'You can sign in using your username or registered Ethiopian phone number.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {language === 'am' ? 'የይለፍ ቃል' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 mt-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? language === 'am' ? 'በመግባት ላይ...' : 'Signing in...'
                      : language === 'am' ? 'ወደ አካውንት ግባ' : 'Sign In to Account'}
                  </span>
                </button>
              </form>
            ) : (
              /* ==================== 2. CREATE ACCOUNT TAB ==================== */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {language === 'am' ? 'የተጠቃሚ ስም *' : 'Username *'}
                    </label>
                    <span className={`text-[10px] font-mono ${regUsername.trim().length > 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {regUsername.trim().length > 5 ? 'Valid (>5 chars)' : 'Min 6 characters'}
                    </span>
                  </div>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={language === 'am' ? 'ለምሳሌ፡ amanuel_21' : 'e.g. amanuel_21'}
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                    />
                  </div>
                </div>

                {/* Ethiopian Phone Number (Direct, no phone OTP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {language === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር *' : 'Ethiopian Phone Number *'}
                    </label>
                    <span className="text-[10px] font-mono text-[#E5B842]">
                      +2519 / +2517 / 09 / 07
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="+251 9... or 09..."
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none focus:border-[#E5B842]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    {language === 'am' ? 'የይለፍ ቃል * (ቢያንስ 6 ቁምፊዎች)' : 'Password * (Min 6 characters)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Optional Email Address with Verified Badge Incentive */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span>{language === 'am' ? 'ኢሜይል አድራሻ (አማራጭ)' : 'Email Address (Optional)'}</span>
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#E5B842]" />
                      <span>{language === 'am' ? 'ባጅ ለማግኘት' : 'For Verified Badge'}</span>
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="name@example.com (Optional)"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-amber-500/30 text-xs text-white font-mono focus:outline-none focus:border-[#E5B842]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {language === 'am'
                      ? 'ኢሜይል ካስገቡ የማረጋገጫ ኮድ ይላክሎታል፤ ሲያረጋግጡ የተረጋገጠ ባጅ (Verified Badge) ይሰጥዎታል!'
                      : 'Adding an email sends an instant OTP to unlock the Verified Profile Badge on your account.'}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? language === 'am' ? 'በመመዝገብ ላይ...' : 'Creating Account...'
                      : language === 'am' ? 'አካውንት ክፈት (ወዲያው ጀምር)' : 'Create Account'}
                  </span>
                </button>
              </form>
            )}

            {/* Footer Trust Guarantee */}
            <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {language === 'am'
                  ? 'የኢትዮጵያ ፍትሃዊ እና ምስጢራዊ የዝቅተኛ ነጠላ ዋጋ ጨረታ መድረክ'
                  : 'MiniBid Ethiopia • Cryptographically Sealed Reverse Bid Engine'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Post-Registration Email Verification Prompt */}
      {showEmailVerifyModal && (
        <EmailVerificationModal
          isOpen={showEmailVerifyModal}
          initialEmail={registeredEmail}
          onClose={() => {
            setShowEmailVerifyModal(false);
            onClose();
          }}
          onSuccess={() => {
            setShowEmailVerifyModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};
