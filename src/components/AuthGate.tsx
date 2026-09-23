import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { GoldenParticleBackground } from './GoldenParticleBackground.js';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Coins,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { login, register, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('+251911');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await login(loginIdentifier.trim(), loginPassword);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const res = await register({
      username: regUsername.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      password: regPassword,
    });
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to register account.');
    } else {
      setSuccessMessage('Account created successfully with 0.00 ETB starting balance. Accessing platform...');
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col justify-between selection:bg-[#E5B842]/30 selection:text-[#E5B842] relative overflow-hidden">
      {/* Tiny glowing golden lines and dots background animation */}
      <GoldenParticleBackground />
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#E5B842]/10 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5B842] via-[#D4AF37] to-[#997920] p-0.5 shadow-[0_0_15px_rgba(229,184,66,0.25)]">
              <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
                <span className="font-serif font-black text-[#E5B842] text-xl tracking-tighter">MB</span>
              </div>
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-wider text-white">MINIBID</span>
              <span className="ml-2 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/30">
                Secure Gateway
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Role-Gated Access</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-lg bg-[#121215] border border-[#27272a] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>Authentication Required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
              Sign In to MiniBid
            </h1>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Access the reverse-auction trading floor, liquidity management, or administrative console.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-2xl border border-[#27272a]">
            <button
              onClick={() => {
                setTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'login'
                  ? 'bg-[#E5B842] text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'register'
                  ? 'bg-[#E5B842] text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab 1: Login Form */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Username, Phone, or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="e.g. abebe_k or Phone / Email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-[#E5B842] hover:bg-amber-400 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E5B842]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Tab 2: Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Desired Username *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    required
                    placeholder="e.g. solomon_bids"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Phone (+251) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      required
                      placeholder="+251911223344"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono focus:border-[#E5B842] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                      placeholder="user@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    placeholder="Create strong password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirement 3 Disclosure */}
              <div className="p-3 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/20 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
                <Coins className="w-4 h-4 shrink-0 text-[#E5B842] mt-0.5" />
                <span>
                  <strong>Zero-Balance Policy:</strong> All registered participants start with <strong>0.00 ETB</strong>. You can submit bank deposits via CBE, Telebirr, or Awash once logged in.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-[#E5B842] hover:bg-amber-400 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E5B842]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#27272a] text-center text-[11px] text-zinc-500 font-mono relative z-10">
        MiniBid © 2026 • Lowest Unique Bid Reverse Auction Platform • All Rights Reserved
      </footer>
    </div>
  );
};
