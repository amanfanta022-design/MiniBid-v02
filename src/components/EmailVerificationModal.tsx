import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  initialEmail,
  onSuccess,
}) => {
  const { user, sendEmailOtp, verifyEmailOtp } = useAuth();
  const { language } = useTranslation();

  const [emailInput, setEmailInput] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Sandbox preview helper
  const [sandboxInfo, setSandboxInfo] = useState<{
    email: string;
    code: string;
    notice: string;
    is_live: boolean;
  } | null>(null);
  const [isFetchingSandbox, setIsFetchingSandbox] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const emailToUse = (initialEmail || user?.email || '').trim();
      setEmailInput(emailToUse);
      setCode('');
      setErrorMsg('');
      setSuccessMsg('');
      setSandboxInfo(null);
      // If opened with an email, mark code as sent if cooldown or auto
      if (emailToUse) {
        setIsCodeSent(true);
      }
    }
  }, [isOpen, initialEmail, user?.email]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg(
        language === 'am'
          ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setIsSending(true);
    const res = await sendEmailOtp(cleanEmail);
    setIsSending(false);

    if (!res.success) {
      setErrorMsg(res.error || (language === 'am' ? 'የማረጋገጫ ኮድ መላክ አልተቻለም' : 'Failed to send verification code'));
      return;
    }

    setIsCodeSent(true);
    setCooldown(60);

    if (res.code) {
      setSandboxInfo({
        email: cleanEmail,
        code: res.code,
        notice: res.is_live
          ? 'Live email dispatched to your inbox. Backup code displayed for testing.'
          : 'Testing Sandbox Active. Live SMTP/Resend keys not configured in .env. Click Auto-Fill Code below.',
        is_live: Boolean(res.is_live),
      });
    }

    setSuccessMsg(
      res.is_live
        ? (language === 'am'
            ? `የ6-ዲጂት ማረጋገጫ ኮድ ወደ ${cleanEmail} ተልኳል። እባክዎ ኢንቦክስዎን ወይም አይፈለጌ መልዕክት (Spam) ይመልከቱ።`
            : `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox or spam folder.`)
        : (language === 'am'
            ? `የማረጋገጫ ኮድ ለ ${cleanEmail} ተዘጋጅቷል (Dev Sandbox)። ከታች ያለውን "ኮዱን አስገባ" በመጫን በቀጥታ ማረጋገጥ ይችላሉ።`
            : `Verification code generated for ${cleanEmail} (Dev Sandbox Mode). You can click "Auto-Fill Code" below or enter it manually.`)
    );
  };

  const fetchSandboxCode = async () => {
    setIsFetchingSandbox(true);
    setErrorMsg('');
    try {
      const target = emailInput.trim().toLowerCase();
      const res = await fetch(`/api/auth/email-otp/sandbox-preview?email=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (res.ok && data.code) {
        setSandboxInfo({
          email: data.email,
          code: data.code,
          notice: data.notice,
          is_live: data.is_live,
        });
      } else {
        // Fallback default dev pin
        setSandboxInfo({
          email: target,
          code: '123456',
          notice: 'Test sandbox active. Use test code 123456 or request a code above.',
          is_live: false,
        });
      }
    } catch {
      setErrorMsg(language === 'am' ? 'የማረጋገጫ ሁኔታ ማግኘት አልተቻለም' : 'Could not query email dispatch status');
    } finally {
      setIsFetchingSandbox(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg(
        language === 'am'
          ? 'እባክዎ ባለ 6-ዲጂት የማረጋገጫ ኮድ ያስገቡ።'
          : 'Please enter the 6-digit code sent to your email.'
      );
      return;
    }

    setIsVerifying(true);
    const res = await verifyEmailOtp(emailInput.trim().toLowerCase(), cleanCode);
    setIsVerifying(false);

    if (!res.success) {
      setErrorMsg(
        res.error ||
          (language === 'am'
            ? 'ኮዱ የተሳሳተ ወይም ጊዜው ያለፈበት ነው። እባክዎ እንደገና ይሞክሩ።'
            : 'Invalid or expired verification code. Please try again.')
      );
      return;
    }

    setSuccessMsg(
      language === 'am'
        ? '🎉 እንኳን ደስ አለዎት! ኢሜይልዎ ተረጋግጧል፤ የተረጋገጠ ባጅ (Verified Badge) ተሰጥቶዎታል!'
        : '🎉 Congratulations! Your email is verified and the Verified Profile Badge has been unlocked!'
    );

    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#121215] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 text-zinc-100 my-auto max-h-[96vh] overflow-y-auto">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-all absolute top-4 right-4"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Monogram & Badge */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-[#E5B842] to-amber-600 p-0.5 mx-auto mb-3 shadow-xl">
            <div className="w-full h-full bg-[#0a0a0c] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            {language === 'am' ? 'የኢሜይል ማረጋገጫ እና ባጅ' : 'Email Verification'}
          </h2>
          <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
            <span>{language === 'am' ? 'የተረጋገጠ አባል ባጅ ይውሰዱ' : 'Unlock Verified Member Badge'}</span>
          </div>
        </div>

        {/* Benefits Note */}
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 mb-5 leading-relaxed">
          {language === 'am'
            ? 'ኢሜይልዎን ሲያረጋግጡ በመገለጫዎ (Profile) እና በጨረታዎች ላይ ወርቃማና አረንጓዴ የተረጋገጠ ባጅ ይታያል፤ እንዲሁም የጨረታ ማሳወቂያዎች ይደርስዎታል።'
            : 'Verifying your email grants an emerald & gold Verified Badge on your profile and unlocks instant email auction win receipts.'}
        </div>

        <form onSubmit={handleVerifySubmit} className="space-y-4">
          {/* Target Email Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              {language === 'am' ? 'የኢሜይል አድራሻ' : 'Email Address'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white font-mono focus:outline-none focus:border-[#E5B842]"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || cooldown > 0}
                className="px-3.5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-mono text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1 shadow"
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {cooldown > 0
                    ? `${cooldown}s`
                    : isCodeSent
                    ? language === 'am' ? 'እንደገና ላክ' : 'Resend'
                    : language === 'am' ? 'ኮድ ላክ' : 'Send Code'}
                </span>
              </button>
            </div>
          </div>

          {/* 6-Digit Code Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>{language === 'am' ? 'የደረሰዎት 6-ዲጂት ኮድ' : 'Enter 6-Digit Email Code'}</span>
              {isCodeSent && (
                sandboxInfo?.is_live ? (
                  <span className="text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Dispatched to Inbox</span>
                  </span>
                ) : (
                  <span className="text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Dev Sandbox Active</span>
                  </span>
                )
              )}
            </label>
            <input
              type="text"
              maxLength={6}
              required
              placeholder="------"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#E5B842]/70 text-center text-xl font-mono font-black tracking-widest text-[#E5B842] focus:outline-none focus:ring-1 focus:ring-[#E5B842]"
            />

            {/* Sandbox Notice & 1-Click Auto-Fill (Shown prominently when Live SMTP is not connected) */}
            {isCodeSent && !sandboxInfo?.is_live && sandboxInfo?.code && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/70 text-xs text-amber-200 space-y-2 animate-fadeIn shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sandbox Notice (No Live SMTP Connected)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCode(sandboxInfo.code)}
                    className="px-2.5 py-1 rounded-lg bg-[#E5B842] hover:bg-amber-400 text-black font-mono font-black text-xs cursor-pointer shadow flex items-center gap-1 transition-all"
                  >
                    <span>{language === 'am' ? 'ኮዱን አስገባ' : 'Auto-Fill Code'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {language === 'am'
                    ? 'የቀጥታ SMTP ሜይል ሰርቨር እስካሁን አልተገናኘም። የእርስዎ የማረጋገጫ ኮድ ከታች ተዘጋጅቷል፤ "ኮዱን አስገባ" በመጫን ወዲያውኑ ማረጋገጥ ይችላሉ፦'
                    : 'Outbound mail server is not yet configured in Admin settings. Your verification code is displayed below:'}
                </p>

                <div className="text-center font-mono text-2xl font-black text-[#E5B842] py-2 bg-black/70 rounded-xl border border-amber-600/50 tracking-widest shadow-inner">
                  {sandboxInfo.code}
                </div>
              </div>
            )}

            {/* Live Email Confirmation (Shown when live SMTP is active) */}
            {isCodeSent && sandboxInfo?.is_live && (
              <div className="mt-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/60 text-xs text-emerald-200 space-y-1 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real Email Sent to Inbox</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Please check your inbox or spam folder for <span className="text-white font-mono">{emailInput}</span>.
                </p>
              </div>
            )}

            {/* Optional Sandbox query for debugging */}
            {!isCodeSent && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={fetchSandboxCode}
                  disabled={isFetchingSandbox}
                  className="text-[11px] text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>
                    {language === 'am'
                      ? 'የሙከራ ኮድ ሳጥን / Sandbox Preview'
                      : 'Testing Sandbox Preview'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer transition-all"
            >
              {language === 'am' ? 'ለጊዜው ይቅር' : 'Later'}
            </button>
            <button
              type="submit"
              disabled={isVerifying || code.trim().length < 4}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'አረጋግጥና ባጅ ውሰድ' : 'Verify & Unlock'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
