import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Coins,
  Radio,
  Send,
  ShieldAlert,
  Server,
  Zap,
  HelpCircle,
  Clock,
  ArrowRight,
  Sliders,
} from 'lucide-react';

interface SmsConfig {
  provider: 'simulation' | 'africastalking' | 'twilio' | 'ethiotelecom';
  sender_id: string;
  api_key?: string;
  username?: string;
  account_sid?: string;
  auth_token?: string;
  from_phone?: string;
  ethio_client_id?: string;
  ethio_client_secret?: string;
  prepaid_balance_etb: number;
  cost_per_sms_etb: number;
  is_live: boolean;
}

interface SmsDispatchRecord {
  id: string;
  phone: string;
  code: string;
  purpose: string;
  status: 'DELIVERED_CELLULAR' | 'SIMULATED_SANDBOX' | 'FAILED';
  provider: string;
  sender_id: string;
  cost_etb: number;
  created_at: string;
  gateway_response?: string;
}

export const AdminSmsGateway: React.FC = () => {
  const [config, setConfig] = useState<SmsConfig | null>(null);
  const [logs, setLogs] = useState<SmsDispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  // Edit fields
  const [selectedProvider, setSelectedProvider] = useState<'simulation' | 'africastalking' | 'twilio' | 'ethiotelecom'>('simulation');
  const [senderId, setSenderId] = useState('MINIBID');
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromPhone, setFromPhone] = useState('');
  const [costPerSms, setCostPerSms] = useState(0.25);

  // Top up modal/input
  const [topupAmount, setTopupAmount] = useState('500');
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Search filter
  const [searchPhone, setSearchPhone] = useState('');

  const fetchGatewayData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/admin/sms/gateway', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Portal': 'admin',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load SMS gateway settings');
      setConfig(data.config);
      setLogs(data.logs || []);
      setSelectedProvider(data.config.provider);
      setSenderId(data.config.sender_id || 'MINIBID');
      setCostPerSms(data.config.cost_per_sms_etb || 0.25);
    } catch (err: any) {
      setError(err.message || 'Error fetching gateway status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSaveSuccess('');
    try {
      const token = localStorage.getItem('minibid_token');
      const payload: any = {
        provider: selectedProvider,
        sender_id: senderId,
        cost_per_sms_etb: costPerSms,
      };
      if (selectedProvider === 'africastalking') {
        payload.username = username;
        if (apiKey) payload.api_key = apiKey;
      } else if (selectedProvider === 'twilio') {
        payload.account_sid = accountSid;
        if (authToken) payload.auth_token = authToken;
        payload.from_phone = fromPhone;
      }

      const res = await fetch('/api/admin/sms/gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Portal': 'admin',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save configuration');
      setConfig(data.config);
      setSaveSuccess('SMS Gateway settings updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsToppingUp(true);
    setError('');
    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/admin/sms/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Portal': 'admin',
        },
        body: JSON.stringify({ amount_etb: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to top up SMS balance');
      setSaveSuccess(`Recharged ${amount.toFixed(2)} ETB to SMS gateway reserve!`);
      setTimeout(() => setSaveSuccess(''), 4000);
      fetchGatewayData();
    } catch (err: any) {
      setError(err.message || 'Failed to recharge');
    } finally {
      setIsToppingUp(false);
    }
  };

  const filteredLogs = logs.filter(l =>
    searchPhone ? l.phone.includes(searchPhone) : true
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Status */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Telecom SMS Gateway & Carrier Activation</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                      config?.is_live
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                        : 'bg-amber-950 border border-amber-600 text-amber-300'
                    }`}
                  >
                    {config?.is_live ? 'LIVE CARRIER BROADCAST' : 'SANDBOX SIMULATION MODE'}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Manage outbound cellular OTP verification for Ethiopian mobile numbers (+251 9... / +251 7...)
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchGatewayData}
            disabled={isLoading}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-4 rounded-xl bg-[#18181f] border border-zinc-800/80">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>SMS Prepaid Reserve</span>
              <Coins className="w-4 h-4 text-[#E5B842]" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {config ? `${config.prepaid_balance_etb.toLocaleString()} ETB` : '...'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              ~{config ? Math.floor(config.prepaid_balance_etb / (config.cost_per_sms_etb || 0.25)).toLocaleString() : 0} SMS credits available
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18181f] border border-zinc-800/80">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Gateway</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1 uppercase">
              {config?.provider === 'africastalking'
                ? "Africa's Talking"
                : config?.provider === 'twilio'
                ? 'Twilio SMS'
                : config?.provider === 'ethiotelecom'
                ? 'Ethio Telecom'
                : 'Sandbox Mode'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Sender ID: <span className="text-zinc-300 font-bold">{config?.sender_id || 'MINIBID'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18181f] border border-zinc-800/80">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Unit Cost / Rate</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {config ? `${config.cost_per_sms_etb.toFixed(2)} ETB` : '0.25 ETB'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Per 160-char OTP text message
            </div>
          </div>
        </div>
      </div>

      {/* Guide: How Payment & SMS Delivery Works in Ethiopia */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-emerald-950/20 border border-amber-800/40">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-[#E5B842] shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-zinc-300">
            <h3 className="font-bold text-[#E5B842] text-sm">
              How Physical Cellular SMS Delivery Works in Ethiopia (+251)
            </h3>
            <p className="leading-relaxed">
              In a cloud web environment, mobile phones cannot receive physical cellular SMS without an active external **SMS Gateway Provider**. The provider translates HTTP API calls from MiniBid into cellular SMS radio signals dispatched to Ethio Telecom and Safaricom Ethiopia handsets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <div className="font-bold text-amber-400">1. Ethio Telecom Bulk SMS (Local)</div>
                <div className="text-zinc-400">Paid via Telebirr or CBE Bank Transfer (~0.15–0.30 ETB/SMS). Requires business contract and Sender ID approval.</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <div className="font-bold text-emerald-400">2. Africa's Talking (East Africa)</div>
                <div className="text-zinc-400">Prepaid balance loaded with card or bank wire. Instant setup with API key, delivering to all +251 numbers (~$0.018 USD/SMS).</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <div className="font-bold text-blue-400">3. Twilio / Infobip (Global)</div>
                <div className="text-zinc-400">International payment via card/PayPal. Uses Twilio Account SID and Auth Token to broadcast global SMS.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500 text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Section: Configuration & Top-up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Provider Settings */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#141418] border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#E5B842]" />
            <span>Carrier Gateway Provider Configuration</span>
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Select Active Gateway Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'simulation', name: 'Sandbox Mode' },
                  { id: 'africastalking', name: "Africa's Talking" },
                  { id: 'twilio', name: 'Twilio' },
                  { id: 'ethiotelecom', name: 'Ethio Telecom' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                      selectedProvider === p.id
                        ? 'bg-[#E5B842] text-black border-[#E5B842] font-bold'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Sender ID (Alphanumeric Mask)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={senderId}
                  onChange={e => setSenderId(e.target.value.toUpperCase())}
                  placeholder="MINIBID"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-[#E5B842] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Cost Deduction per SMS (ETB)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={costPerSms}
                  onChange={e => setCostPerSms(parseFloat(e.target.value) || 0.25)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#E5B842] focus:outline-none"
                />
              </div>
            </div>

            {/* Provider specific credential inputs */}
            {selectedProvider === 'africastalking' && (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-700 space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Africa's Talking API Credentials</span>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="sandbox or your_account_username"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedProvider === 'twilio' && (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-700 space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Twilio Programmable Messaging Credentials</span>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Account SID</label>
                  <input
                    type="text"
                    value={accountSid}
                    onChange={e => setAccountSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={e => setAuthToken(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Twilio Phone / Sender Number</label>
                  <input
                    type="text"
                    value={fromPhone}
                    onChange={e => setFromPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedProvider === 'simulation' && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sandbox Simulation Active</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Verification OTP codes are registered in the secure vault and displayed in the Outbox below without triggering external telecom fees. When ready for physical cellular broadcast to real Ethiopian phones, switch provider to Africa's Talking or Twilio.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 rounded-xl bg-[#E5B842] hover:bg-[#d4a836] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow disabled:opacity-50"
            >
              {isSaving ? 'Saving Carrier Configuration...' : 'Save Carrier Gateway Settings'}
            </button>
          </form>
        </div>

        {/* Right Column: Prepaid Top-up */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>SMS Balance Top-Up</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maintain adequate prepaid balance so users never face SMS dispatch delays during high-traffic auction clearances.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Recharge Amount (ETB)
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {['500', '1500', '3000'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      topupAmount === amt
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    +{amt} ETB
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                placeholder="500"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleTopup}
            disabled={isToppingUp}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow disabled:opacity-50 mt-4 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isToppingUp ? 'Processing Top-Up...' : 'Top-Up Prepaid SMS Pool'}</span>
          </button>
        </div>
      </div>

      {/* Outbound SMS Dispatch Log / Outbox */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141418] border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E5B842]" />
              <span>Outbound SMS Dispatch Outbox ({logs.length} total dispatches)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Live audit trail of every SMS dispatched to Ethiopian phone numbers
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search phone number (+251...)"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 font-mono w-64 focus:border-[#E5B842] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#18181f] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Phone Number</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Carrier / Gateway</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Code (Vault)</th>
                <th className="py-2.5 px-3">Cost (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans text-xs">
                    No SMS dispatches found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{l.phone}</td>
                    <td className="py-2.5 px-3 uppercase text-[11px] text-zinc-400">{l.purpose}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{l.provider}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'DELIVERED_CELLULAR'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : l.status === 'SIMULATED_SANDBOX'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600'
                            : 'bg-red-950 text-red-300 border border-red-500'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-300">{l.code}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{l.cost_etb.toFixed(2)} ETB</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
