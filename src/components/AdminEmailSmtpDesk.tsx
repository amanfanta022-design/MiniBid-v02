import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Key,
  ExternalLink,
  Info,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  Terminal,
  Zap,
  Check,
  Wifi,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmailSettings {
  provider: 'gmail_smtp' | 'custom_smtp' | 'resend_api' | 'sandbox';
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  resend_api_key?: string;
  is_enabled: boolean;
  has_password?: boolean;
  last_tested_at?: string;
  last_test_status?: 'success' | 'failed' | 'pending';
  last_test_message?: string;
  last_test_latency_ms?: number;
  last_test_diagnostic_code?: string;
  runtime_status?: {
    is_live: boolean;
    provider: string;
    sender_address: string;
  };
}

interface DispatchRecord {
  id: string;
  email: string;
  code: string;
  subject: string;
  timestamp: number;
  provider: string;
  status: 'DELIVERED_INBOX' | 'QUEUED_SANDBOX' | 'FAILED';
  error_message?: string;
}

interface TestResultState {
  success: boolean;
  provider: string;
  message: string;
  diagnosticCode?: string;
  latencyMs?: number;
  diagnosticDetails?: string;
  actionableRemedy?: string;
  normalizedUser?: string;
  dualPortDiagnostics?: {
    port465: { open: boolean; latencyMs?: number; error?: string };
    port587: { open: boolean; latencyMs?: number; error?: string };
  };
}

export const AdminEmailSmtpDesk: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmailSettings>({
    provider: 'gmail_smtp',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    from_name: 'MiniBid Ethiopia',
    from_email: '',
    resend_api_key: '',
    is_enabled: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Test dispatcher
  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResultState | null>(null);

  // Real-time TCP port reachability
  const [portProbe, setPortProbe] = useState<{
    port465: { open: boolean; latencyMs?: number; error?: string };
    port587: { open: boolean; latencyMs?: number; error?: string };
  } | null>(null);
  const [isProbingPorts, setIsProbingPorts] = useState(false);

  // Troubleshooting Accordion
  const [showTroubleshooter, setShowTroubleshooter] = useState(true);

  // Dispatch history
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [isLoadingDispatches, setIsLoadingDispatches] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/superadmin/email-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          if (!testRecipient && user?.email) {
            setTestRecipient(user.email);
          }
        }
      } else {
        const err = await res.json();
        setSaveError(err.error || 'Failed to load email configuration.');
      }
    } catch {
      setSaveError('Network error connecting to email configuration service.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPortProbe = async (host?: string) => {
    setIsProbingPorts(true);
    try {
      const token = localStorage.getItem('minibid_token');
      const targetHost = host || settings.smtp_host || 'smtp.gmail.com';
      const res = await fetch(`/api/superadmin/email-settings/probe-ports?host=${encodeURIComponent(targetHost)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPortProbe(data.ports);
      }
    } catch {
      // silent
    } finally {
      setIsProbingPorts(false);
    }
  };

  const fetchDispatches = async () => {
    setIsLoadingDispatches(true);
    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/superadmin/email-settings/dispatches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDispatches(data.dispatches || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingDispatches(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchPortProbe();
    fetchDispatches();
  }, []);

  const handleProviderChange = (newProvider: 'gmail_smtp' | 'custom_smtp' | 'resend_api' | 'sandbox') => {
    if (newProvider === 'gmail_smtp') {
      setSettings(prev => ({
        ...prev,
        provider: 'gmail_smtp',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 465,
        smtp_secure: true,
      }));
      fetchPortProbe('smtp.gmail.com');
    } else if (newProvider === 'custom_smtp') {
      setSettings(prev => ({
        ...prev,
        provider: 'custom_smtp',
        smtp_host: prev.smtp_host === 'smtp.gmail.com' ? 'mail.yourdomain.com' : prev.smtp_host,
        smtp_port: 587,
        smtp_secure: false,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        provider: newProvider,
      }));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/superadmin/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(data.message || 'Email & SMTP Gateway settings updated and live!');
        if (data.settings) {
          setSettings(data.settings);
        }
      } else {
        setSaveError(data.error || 'Failed to save email settings.');
      }
    } catch {
      setSaveError('Network error while committing email settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      setTestResult({
        success: false,
        provider: settings.provider,
        message: 'Please enter a valid recipient email address to test deliverability.',
        diagnosticCode: 'CONFIG_ERROR',
        latencyMs: 0,
        actionableRemedy: 'Provide a valid email address such as amanfanta022@gmail.com.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/superadmin/email-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_email: testRecipient.trim().toLowerCase(),
          ...settings,
        }),
      });

      const data = await res.json();
      setTestResult({
        success: Boolean(data.success),
        provider: data.provider || settings.provider,
        message: data.message || (data.success ? 'Test handshake successful!' : 'Test handshake failed.'),
        diagnosticCode: data.diagnosticCode,
        latencyMs: data.latencyMs,
        diagnosticDetails: data.diagnosticDetails,
        actionableRemedy: data.actionableRemedy,
        normalizedUser: data.normalizedUser,
        dualPortDiagnostics: data.dualPortDiagnostics,
      });

      // Also update portProbe if provided
      if (data.dualPortDiagnostics) {
        setPortProbe(data.dualPortDiagnostics);
      }

      // Refresh settings & dispatch log
      fetchSettings();
      fetchDispatches();
    } catch {
      setTestResult({
        success: false,
        provider: settings.provider,
        message: 'Network error connecting to test delivery service.',
        diagnosticCode: 'NET_TIMEOUT',
        latencyMs: 5000,
        actionableRemedy: 'The backend did not receive a response in time. Check network stability.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mr-3" />
        <span>Loading Email & SMTP Gateway Configuration...</span>
      </div>
    );
  }

  const isLive = settings.runtime_status?.is_live;

  return (
    <div className="space-y-6">
      {/* Top Banner & Gateway Telemetry */}
      <div className="bg-[#101014] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-serif text-white">
                  Email & SMTP Delivery Gateway
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isLive
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                      : 'bg-amber-950 border border-amber-500 text-amber-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isLive ? 'Live Inbox Delivery Active' : 'Sandbox Fallback Active'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Sub-3s Fast Handshake
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Connect your real Google / Gmail account or SMTP relay. When configured, 6-digit OTP verification codes are delivered straight to players' inboxes. When unconfigured, codes are safely shown on-screen in sandbox mode.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchSettings();
                fetchPortProbe();
                fetchDispatches();
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Desk</span>
            </button>
          </div>
        </div>

        {/* Runtime Diagnostics Strip */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Active Transport</div>
            <div className="text-zinc-200 font-semibold font-mono mt-0.5">
              {settings.runtime_status?.provider || 'Developer Sandbox'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Sender Address</div>
            <div className="text-zinc-200 font-semibold font-mono mt-0.5 truncate" title={settings.runtime_status?.sender_address}>
              {settings.runtime_status?.sender_address || 'noreply@minibid.et'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider flex items-center justify-between">
              <span>Port Reachability</span>
              <button
                type="button"
                onClick={() => fetchPortProbe()}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                title="Re-probe ports"
              >
                {isProbingPorts ? 'Probing...' : 'Re-check'}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
              <span className={`flex items-center gap-1 ${portProbe?.port465.open ? 'text-emerald-400' : 'text-red-400'}`}>
                <Wifi className="w-3 h-3" /> 465: {portProbe?.port465.open ? `${portProbe.port465.latencyMs}ms` : 'Closed'}
              </span>
              <span className="text-zinc-600">|</span>
              <span className={`flex items-center gap-1 ${portProbe?.port587.open ? 'text-emerald-400' : 'text-red-400'}`}>
                <Wifi className="w-3 h-3" /> 587: {portProbe?.port587.open ? `${portProbe.port587.latencyMs}ms` : 'Closed'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Last Test Telemetry</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {settings.last_test_status === 'success' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Verified ({settings.last_test_latency_ms || 320}ms)
                </span>
              ) : settings.last_test_status === 'failed' ? (
                <span className="text-red-400 font-bold flex items-center gap-1 truncate" title={settings.last_test_message}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {settings.last_test_diagnostic_code || 'Handshake Error'}
                </span>
              ) : (
                <span className="text-zinc-400 font-mono">Not Tested Yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Credentials & Setup Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-[#121217] border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Mail Server Credentials & Provider
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-zinc-400 font-semibold">Enable Live Gateway</span>
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={e => setSettings(prev => ({ ...prev, is_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Provider Chooser */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Select Outbound Delivery Engine
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'gmail_smtp',
                    title: 'Gmail / Google',
                    sub: 'Recommended (Port 465)',
                    badge: 'POPULAR',
                  },
                  {
                    id: 'custom_smtp',
                    title: 'Custom SMTP',
                    sub: 'Postfix / Sendgrid',
                  },
                  {
                    id: 'resend_api',
                    title: 'Resend API',
                    sub: 'HTTP REST Token',
                  },
                  {
                    id: 'sandbox',
                    title: 'Dev Sandbox',
                    sub: 'On-Screen Pins',
                  },
                ].map(p => {
                  const isSelected = settings.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id as any)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-lg shadow-amber-950/40'
                          : 'bg-[#18181f] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                          {p.badge}
                        </span>
                      )}
                      <div className="font-bold text-xs">{p.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{p.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gmail App Passwords Interactive 4-Point Checklist */}
            {settings.provider === 'gmail_smtp' && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/30 text-xs text-amber-200 space-y-3 leading-relaxed">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTroubleshooter(!showTroubleshooter)}>
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Google SMTP 4-Point Checklist (Fix 535 BadCredentials)</span>
                  </div>
                  <button type="button" className="text-zinc-400 hover:text-white">
                    {showTroubleshooter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showTroubleshooter && (
                  <div className="space-y-2.5 pt-1 border-t border-amber-500/20 text-zinc-300 text-xs">
                    <p className="text-zinc-400">
                      Google strictly rejects standard account passwords with <code className="text-amber-400 font-mono">535-5.7.8 BadCredentials</code>. Follow these exact 4 steps:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
                          <span>Sign into Target Google Account</span>
                        </div>
                        <p className="text-zinc-400 leading-normal">
                          If you use multiple Google accounts in Chrome, ensure your active tab is signed into the exact account you enter below.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
                          <span>2-Step Verification Active</span>
                        </div>
                        <p className="text-zinc-400 leading-normal">
                          Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold hover:text-amber-300 inline-flex items-center gap-0.5">myaccount.google.com/security <ExternalLink className="w-2.5 h-2.5" /></a> and confirm 2FA is turned ON.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
                          <span>Generate 16-Letter App Password</span>
                        </div>
                        <p className="text-zinc-400 leading-normal">
                          Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold hover:text-amber-300 inline-flex items-center gap-0.5">myaccount.google.com/apppasswords <ExternalLink className="w-2.5 h-2.5" /></a>, name it "MiniBid", and copy the yellow 16-letter code.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">4</span>
                          <span>Full Email Address Format</span>
                        </div>
                        <p className="text-zinc-400 leading-normal">
                          Always use your full address ending in <code className="text-amber-300 font-mono">@gmail.com</code> (not just your username handle).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SMTP Fields */}
            {(settings.provider === 'gmail_smtp' || settings.provider === 'custom_smtp') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      SMTP Host
                    </label>
                    <div className="relative">
                      <Server className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="smtp.gmail.com"
                        value={settings.smtp_host}
                        onChange={e => {
                          const val = e.target.value;
                          setSettings(prev => ({ ...prev, smtp_host: val }));
                          if (val.includes('.')) fetchPortProbe(val);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Port & Security
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, smtp_port: 465, smtp_secure: true }))}
                        className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          settings.smtp_port === 465 && settings.smtp_secure
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-950'
                            : 'bg-[#16161c] border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        465 (SSL)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, smtp_port: 587, smtp_secure: false }))}
                        className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          settings.smtp_port === 587 && !settings.smtp_secure
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-950'
                            : 'bg-[#16161c] border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        587 (TLS)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      {settings.provider === 'gmail_smtp' ? 'Gmail Address (Full Account)' : 'SMTP Username'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="yourname@gmail.com"
                        value={settings.smtp_user}
                        onChange={e => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    {/* Username helper if missing @gmail.com */}
                    {settings.provider === 'gmail_smtp' && settings.smtp_user && !settings.smtp_user.includes('@') && (
                      <div className="mt-1.5 flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-300">
                        <span>💡 Needs full address: {settings.smtp_user}@gmail.com</span>
                        <button
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, smtp_user: `${prev.smtp_user.trim()}@gmail.com` }))}
                          className="underline font-bold text-amber-400 hover:text-amber-200 cursor-pointer ml-2 shrink-0"
                        >
                          Append @gmail.com
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      {settings.provider === 'gmail_smtp' ? 'Google 16-Char App Password' : 'SMTP Password'}
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={settings.has_password ? '•••••••••••••••• (Saved In Database)' : 'abcd efgh ijkl mnop'}
                        value={settings.smtp_pass}
                        onChange={e => setSettings(prev => ({ ...prev, smtp_pass: e.target.value }))}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {settings.provider === 'gmail_smtp' && settings.smtp_pass && settings.smtp_pass.includes(' ') && (
                      <div className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Spaces detected: will be stripped automatically on save and test.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      placeholder="MiniBid Ethiopia"
                      value={settings.from_name}
                      onChange={e => setSettings(prev => ({ ...prev, from_name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      From Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="noreply@minibid.et or your Gmail address"
                      value={settings.from_email}
                      onChange={e => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resend API Fields */}
            {settings.provider === 'resend_api' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Resend API Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="re_1234567890abcdef..."
                      value={settings.resend_api_key}
                      onChange={e => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    From Address
                  </label>
                  <input
                    type="email"
                    placeholder="onboarding@resend.dev or verified domain"
                    value={settings.from_email}
                    onChange={e => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Sandbox Notice */}
            {settings.provider === 'sandbox' && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800 text-amber-200 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>Developer Sandbox Mode Active</span>
                </div>
                <p className="text-zinc-400 text-xs">
                  In Sandbox mode, OTP verification codes are safely captured in memory and displayed directly in the user verification popup with a 1-click Auto-Fill button. No external emails are sent.
                </p>
              </div>
            )}

            {/* Status alerts */}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/60 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{isSaving ? 'Applying Transport...' : 'Save & Activate Email Gateway'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Handshake Tester & Diagnostics */}
        <div className="space-y-6">
          {/* Test Dispatcher Card */}
          <div className="bg-[#121217] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Live Handshake Tester
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Max 5s timeout</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Test your credentials against Google mail servers with instant diagnostic telemetry and latency measurement:
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Recipient Test Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="amanfanta022@gmail.com"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#16161c] border border-zinc-700 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestDispatch}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Probing Handshake (sub-3s)...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Test Email to Inbox</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-3 animate-fadeIn ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-200'
                    : 'bg-red-950/40 border-red-700/80 text-red-200'
                }`}
              >
                {/* Header row with status & latency badge */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{testResult.success ? 'Handshake Confirmed' : 'Handshake Rejected'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {testResult.latencyMs !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-black/60 border border-zinc-700 font-mono text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {testResult.latencyMs}ms
                      </span>
                    )}

                    {testResult.diagnosticCode && (
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                          testResult.success
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-red-900 border-red-500 text-red-200'
                        }`}
                      >
                        {testResult.diagnosticCode}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-sans">{testResult.message}</p>

                {/* Actionable Remedy Banner */}
                {testResult.actionableRemedy && (
                  <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-[11px] text-zinc-300 space-y-1 leading-relaxed">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Diagnostic Recommendation:</span>
                    </div>
                    <div>{testResult.actionableRemedy}</div>
                  </div>
                )}

                {/* Dual Port Telemetry */}
                {testResult.dualPortDiagnostics && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>
                      Port 465 (SSL):{' '}
                      <strong className={testResult.dualPortDiagnostics.port465.open ? 'text-emerald-400' : 'text-red-400'}>
                        {testResult.dualPortDiagnostics.port465.open ? `OPEN (${testResult.dualPortDiagnostics.port465.latencyMs}ms)` : 'CLOSED'}
                      </strong>
                    </span>
                    <span>
                      Port 587 (TLS):{' '}
                      <strong className={testResult.dualPortDiagnostics.port587.open ? 'text-emerald-400' : 'text-red-400'}>
                        {testResult.dualPortDiagnostics.port587.open ? `OPEN (${testResult.dualPortDiagnostics.port587.latencyMs}ms)` : 'CLOSED'}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Raw command / code */}
                {testResult.diagnosticDetails && (
                  <div className="font-mono text-[10px] p-2 bg-black/60 rounded-lg text-zinc-400 overflow-x-auto">
                    {testResult.diagnosticDetails}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Troubleshooting Card */}
          <div className="bg-[#121217] border border-zinc-800 rounded-3xl p-5 text-xs text-zinc-400 space-y-3">
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Diagnostic Reference</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-semibold text-zinc-300 flex items-center justify-between">
                  <span>535-5.7.8 BadCredentials</span>
                  <span className="text-[10px] text-rose-400 font-mono">AUTH ERROR</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 leading-normal">
                  Google rejected the login. Ensure 2FA is active and use a 16-letter App Password, not your standard Google account password.
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-semibold text-zinc-300 flex items-center justify-between">
                  <span>ETIMEDOUT / Sub-5s Bounds</span>
                  <span className="text-[10px] text-amber-400 font-mono">NETWORK BOUND</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 leading-normal">
                  Nodemailer no longer hangs for 2 minutes. Timeouts are bounded to 5 seconds so you receive instant feedback.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dispatch History Audit Log */}
      <div className="bg-[#101014] border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Email Dispatch Activity Audit
            </h3>
          </div>
          <button
            onClick={fetchDispatches}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingDispatches ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        </div>

        {dispatches.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No email OTP dispatches recorded in this session yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase">
                  <th className="pb-2">Recipient</th>
                  <th className="pb-2">OTP Code</th>
                  <th className="pb-2">Provider</th>
                  <th className="pb-2">Delivery Status</th>
                  <th className="pb-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {dispatches.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-white">{d.email}</td>
                    <td className="py-2.5 text-[#E5B842] font-black tracking-widest">{d.code}</td>
                    <td className="py-2.5 text-zinc-400">{d.provider}</td>
                    <td className="py-2.5">
                      {d.status === 'DELIVERED_INBOX' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                          DELIVERED TO INBOX
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                          SANDBOX CAPTURED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-zinc-500 text-[11px]">
                      {new Date(d.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
