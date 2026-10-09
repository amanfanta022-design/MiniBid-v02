import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import { usePortal } from '../utils/portal.js';
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
  ShieldAlert,
  Smartphone,
  KeyRound,
  Send,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithOtp, sendOtp, register } = useAuth();
  const { language, setLanguage } = useTranslation();
  const { switchPortal } = usePortal();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');

  // Login inputs (Password)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Login inputs (OTP)
  const [otpPhone, setOtpPhone] = useState('+2519');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Register inputs
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('+2519');
  const [regPassword, setRegPassword] = useState('');
  const [regOtpCode, setRegOtpCode] = useState('');
  const [isRegOtpSent, setIsRegOtpSent] = useState(false);
  const [regOtpCooldown, setRegOtpCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Cooldown timers
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  useEffect(() => {
    if (regOtpCooldown > 0) {
      const timer = setTimeout(() => setRegOtpCooldown(regOtpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [regOtpCooldown]);

  if (!isOpen) return null;

  // Handle Send OTP for Login
  const handleSendLoginOtp = async () => {
    setErrorMessage('');
    setSuccessNotice('');
    const cleanPhone = otpPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(\+251[79]\d{8}|0[79]\d{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage(
        language === 'am'
          ? 'እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (+2519..., +2517..., 09..., ወይም 07...)'
          : 'Please enter a valid Ethiopian phone number (+2519..., +2517..., 09..., or 07...).'
      );
      return;
    }

    setIsLoading(true);
    const res = await sendOtp(cleanPhone, 'login');
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to send SMS code');
      return;
    }

    setIsOtpSent(true);
    setOtpCooldown(60);
    setSuccessNotice(
      language === 'am'
        ? `የማረጋገጫ 6-ዲጂት ኮድ በኤስኤምኤስ (SMS) ወደ ${cleanPhone} ተልኳል። እባክዎ በስልክዎ የደረሰዎትን ኮድ ያስገቡ።`
        : `A 6-digit verification code has been sent via SMS to ${cleanPhone}. Please enter the code received on your phone.`
    );
  };

  // Handle Login via OTP
  const handleOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode('');
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setErrorMessage(
        language === 'am' ? 'እባክዎ የደረሰዎትን 6-ዲጂት ኮድ ያስገቡ።' : 'Please enter the 6-digit code received via SMS.'
      );
      return;
    }

    setIsLoading(true);
    const res = await loginWithOtp(otpPhone.trim(), otpCode.trim());
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || (language === 'am' ? 'ኮዱ የተሳሳተ ወይም ጊዜው ያለፈበት ነው።' : 'Invalid or expired code.'));
      setErrorCode(res.code || '');
    } else {
      onClose();
    }
  };

  // Handle Standard Password Login
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode('');
    setIsLoading(true);

    // Strictly enforce customer portal context
    const res = await login(loginIdentifier.trim(), loginPassword, 'player');
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(
        res.error || (language === 'am' ? 'መግባት አልተቻለም። እባክዎ መረጃዎን ያረጋግጡ።' : 'Failed to sign in. Please verify credentials.')
      );
      setErrorCode(res.code || '');
    } else {
      onClose();
    }
  };

  // Handle Send OTP for Registration
  const handleSendRegOtp = async () => {
    setErrorMessage('');
    const cleanPhone = regPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(\+251[79]\d{8}|0[79]\d{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage(
        language === 'am'
          ? 'እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (+2519..., +2517..., 09..., ወይም 07...)'
          : 'Please enter a valid Ethiopian phone number (+2519..., +2517..., 09..., or 07...).'
      );
      return;
    }

    setIsLoading(true);
    const res = await sendOtp(cleanPhone, 'register');
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to send SMS code');
      return;
    }

    setIsRegOtpSent(true);
    setRegOtpCooldown(60);
    setSuccessNotice(
      language === 'am'
        ? `የማረጋገጫ ኮድ ወደ ${cleanPhone} ተልኳል። እባክዎ በስልክዎ የደረሰዎትን ኮድ ያስገቡ።`
        : `A verification code has been sent via SMS to ${cleanPhone}. Please enter the code received on your phone.`
    );
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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

    setIsLoading(true);
    const res = await register({
      username: cleanUsername,
      phone: cleanPhone,
      password: regPassword,
      otp_code: regOtpCode.trim() || undefined,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || (language === 'am' ? 'አካውንት መክፈት አልተቻለም።' : 'Failed to create account'));
    } else {
      onClose();
    }
  };

  return (
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
              tab === 'login' ? 'bg-[#E5B842] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'am' ? 'ግባ' : 'Sign In'}
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
              tab === 'register' ? 'bg-[#E5B842] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'am' ? 'አካውንት ክፈት' : 'Create Account'}
          </button>
        </div>

        {tab === 'login' ? (
          <div className="space-y-4">
            {/* Login Method Toggle: Real-time Phone OTP vs Password */}
            <div className="grid grid-cols-2 gap-2 bg-[#141418] p-1 rounded-xl border border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setErrorMessage('');
                  setErrorCode('');
                }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'bg-emerald-600 text-white font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'በስልክ SMS ኮድ' : 'Phone SMS OTP'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setErrorMessage('');
                  setErrorCode('');
                }}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-[#E5B842] text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'በይለፍ ቃል' : 'Password Login'}</span>
              </button>
            </div>

            {loginMethod === 'otp' ? (
              /* Phone Number SMS OTP Form */
              <form onSubmit={handleOtpLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {language === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር (+251)' : 'Ethiopian Phone Number (+251)'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="+251911223344 or 0911223344"
                        value={otpPhone}
                        onChange={e => setOtpPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={isLoading || otpCooldown > 0}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1 shadow-md shadow-emerald-950/40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{otpCooldown > 0 ? `${otpCooldown}s` : language === 'am' ? 'ኮድ ላክ' : 'Send SMS'}</span>
                    </button>
                  </div>
                </div>

                {isOtpSent && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
                      <span>{language === 'am' ? 'የደረሰዎት 6-ዲጂት ኮድ' : 'Enter 6-Digit SMS Code'}</span>
                      <span className="text-emerald-400 text-[10px] font-mono">SMS Dispatched</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 482915"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-emerald-500/70 text-center text-lg font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {errorMessage && (
                  errorCode === 'ADMIN_PORTAL_REQUIRED' ? (
                    /* Strict Staff Blocking Alert */
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-red-950/95 to-zinc-950 border border-red-500/80 text-xs text-red-200 space-y-2 shadow-2xl animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5 animate-pulse" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase tracking-wider text-rose-300 font-mono text-[11px]">
                              {language === 'am' ? 'የአስተዳዳሪ መግቢያ እዚህ ተከልክሏል' : 'Staff Access Prohibited on Player Site'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-900 text-white font-mono font-bold tracking-wider">
                              PORTAL ISOLATED
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-zinc-300">
                            {language === 'am'
                              ? 'የአስተዳዳሪ አካውንቶች (Admin እና Super Admin) በተጫዋቾች ገጽ ላይ መግባት በጥብቅ የተከለከሉ ናቸው። እባክዎ በልዩ የአስተዳዳሪ ፖርታል (admin.minibid.et) በኩል ይግቡ።'
                              : 'Staff and Super Admin accounts cannot log into the public customer gaming portal. Administrative personnel must authenticate strictly via the isolated Executive Terminal (admin.minibid.et).'}
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                switchPortal('admin');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Go to Staff Executive Terminal →</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )
                )}

                {successNotice && !errorMessage && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successNotice}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !isOtpSent}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>{language === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying OTP...'}</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'am' ? 'ኮዱን አረጋግጥና ግባ' : 'Verify SMS & Enter MiniBid'}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Customer Password Login Form */
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {language === 'am' ? 'የተጠቃሚ ስም ወይም ስልክ ቁጥር' : 'Customer Username or Phone'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={language === 'am' ? 'ምሳሌ፦ amanuel_f ወይም 0911223344' : 'e.g. amanuel_f or +251911223344'}
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    {language === 'am' ? 'የይለፍ ቃል (Password)' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  errorCode === 'ADMIN_PORTAL_REQUIRED' ? (
                    /* Strict Staff Blocking Alert */
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-red-950/95 to-zinc-950 border border-red-500/80 text-xs text-red-200 space-y-2 shadow-2xl animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5 animate-pulse" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase tracking-wider text-rose-300 font-mono text-[11px]">
                              {language === 'am' ? 'የአስተዳዳሪ መግቢያ እዚህ ተከልክሏል' : 'Staff Access Prohibited on Player Site'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-900 text-white font-mono font-bold tracking-wider">
                              PORTAL ISOLATED
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-zinc-300">
                            {language === 'am'
                              ? 'የአስተዳዳሪ አካውንቶች (Admin እና Super Admin) በተጫዋቾች ገጽ ላይ መግባት በጥብቅ የተከለከሉ ናቸው። እባክዎ በልዩ የአስተዳዳሪ ፖርታል (admin.minibid.et) በኩል ይግቡ።'
                              : 'Staff and Super Admin accounts cannot log into the public customer gaming portal. Administrative personnel must authenticate strictly via the isolated Executive Terminal (admin.minibid.et).'}
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                switchPortal('admin');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Go to Staff Executive Terminal →</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {isLoading
                    ? language === 'am' ? 'በመግባት ላይ...' : 'Signing In...'
                    : language === 'am' ? 'ወደ ሚኒቢድ ግባ' : 'Sign In to MiniBid'}
                </button>
              </form>
            )}

            {/* Clear Staff Portal Isolation Notice */}
            <div className="pt-3 border-t border-zinc-800/80 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  {language === 'am' ? 'የአስተዳዳሪ (Staff) አካውንት አለዎት?' : 'Are you Staff or Super Admin?'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  switchPortal('admin');
                }}
                className="text-rose-400 hover:text-rose-300 font-mono font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>admin.minibid.et →</span>
              </button>
            </div>
          </div>
        ) : (
          /* Register Form with Real-Time Phone OTP Verification */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {language === 'am' ? 'የተጠቃሚ ስም (Username) *' : 'Username *'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={language === 'am' ? 'ምሳሌ፦ dawit_bidder (ከ5 ቁምፊ በላይ)' : 'e.g. dawit_bidder (min 6 chars)'}
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {language === 'am' ? 'ስልክ ቁጥር (+251) *' : 'Ethiopian Phone Number *'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="+251911223344 or 0911223344"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none focus:border-[#E5B842]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendRegOtp}
                  disabled={isLoading || regOtpCooldown > 0}
                  className="px-3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  title="Verify Phone Number with SMS OTP"
                >
                  {regOtpCooldown > 0 ? `${regOtpCooldown}s` : language === 'am' ? 'ኮድ ላክ' : 'Verify SMS'}
                </button>
              </div>
            </div>

            {isRegOtpSent && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-700/50 space-y-1">
                <label className="block text-[11px] font-mono text-emerald-300">
                  {language === 'am' ? 'የኤስኤምኤስ ማረጋገጫ ኮድ (SMS Code)' : 'SMS Verification Code (Optional for instant badge)'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit OTP code"
                  value={regOtpCode}
                  onChange={e => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-sm tracking-widest focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {language === 'am' ? 'የይለፍ ቃል (Password) *' : 'Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="•••••••• (min 6 characters)"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successNotice && !errorMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>{language === 'am' ? 'በመመዝገብ ላይ...' : 'Creating Account...'}</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'am' ? 'አካውንት ፍጠርና ጀምር' : 'Register & Start Bidding'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
