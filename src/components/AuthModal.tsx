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
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs (No email required per user instruction)
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('+2519');
  const [regPassword, setRegPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await login(loginIdentifier.trim(), loginPassword);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || (language === 'am' ? 'መግባት አልተቻለም። እባክዎ መረጃዎን ያረጋግጡ።' : 'Failed to sign in. Please verify credentials.'));
    } else {
      onClose();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = regUsername.trim();
    // Requirement 1: Username must be more than 5 characters
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

    // Requirement 1: Phone must strictly match (+2519******** or +2517******** or 09******** or 07********)
    const cleanPhone = regPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(\+251[79]\d{8}|0[79]\d{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage(
        language === 'am'
          ? 'ስልክ ቁጥር ትክክለኛ የኢትዮጵያ ቅርጸት (+2519..., +2517..., 09..., ወይም 07...) እና ትክክለኛ የዲጂት ብዛት ብቻ መሆን አለበት።'
          : 'Phone number must match Ethiopian format (+2519..., +2517..., 09..., or 07...) with the exact digit count.'
      );
      return;
    }

    // Requirement 1: Password at least 6 digits
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
        <div className="flex items-center justify-between absolute top-4 sm:top-5 right-4 sm:right-5 gap-2 z-10">
          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono font-semibold text-[#E5B842] border border-[#27272a] flex items-center gap-1 transition-all"
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
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 mx-auto mb-2 shadow-lg">
            <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
              <span className="font-serif font-black text-[#E5B842] text-2xl">MB</span>
            </div>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">MINIBID ETHIOPIA</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {language === 'am' ? 'ዝቅተኛው ያልተደገመ ጨረታ ፕላትፎርም' : 'Lowest Unique Reverse Auction Platform'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] mb-6">
          <button
            id="auth-tab-login"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
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
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'register' ? 'bg-[#E5B842] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'am' ? 'አካውንት ክፈት' : 'Create Account'}
          </button>
        </div>

        {tab === 'login' ? (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                {language === 'am' ? 'የተጠቃሚ ስም ወይም ስልክ ቁጥር' : 'Username or Phone Number'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={language === 'am' ? 'ምሳሌ፦ abebe_k ወይም 0911223344' : 'e.g. dawit_bidder or +251911223344'}
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
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white"
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
        ) : (
          /* Register Form - Email removed, strict phone & username > 5 chars */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {language === 'am' ? 'የተጠቃሚ ስም (ከ5 ፊደላት በላይ) *' : 'Username (> 5 characters) *'}
                </label>
                <span className={`text-[10px] font-mono ${regUsername.trim().length > 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {regUsername.trim().length}/6+
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. dawit_bidder (min 6 chars)"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                {language === 'am'
                  ? 'የተጠቃሚ ስም ቢያንስ 6 ፊደላት ወይም ቁጥሮች መሆን አለበት'
                  : 'Username must be more than 5 characters (letters, numbers, underscores)'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {language === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር *' : 'Ethiopian Phone Number *'}
                </label>
                <span className="text-[10px] font-mono text-[#E5B842]">
                  +2519 / +2517 / 09 / 07
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="+251911223344 or 0911223344"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none focus:border-[#E5B842]"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                {language === 'am'
                  ? 'ተቀባይነት ያላቸው ቅርጸቶች፦ +2519********፣ +2517********፣ 09********፣ ወይም 07********'
                  : 'Accepted formats: +2519********, +2517********, 09********, or 07******** (exact digits)'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {language === 'am' ? 'የይለፍ ቃል (ቢያንስ 6 ቁምፊዎች) *' : 'Password (Min 6 digits) *'}
                </label>
                <span className={`text-[10px] font-mono ${regPassword.length >= 6 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {regPassword.length}/6+
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={language === 'am' ? 'ቢያንስ 6 ቁምፊዎች' : 'Min 6 characters'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-[#E5B842]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg mt-2"
            >
              {isLoading
                ? language === 'am' ? 'በመመዝገብ ላይ...' : 'Creating Account...'
                : language === 'am' ? 'ምዝገባውን አጠናቅቅ' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
