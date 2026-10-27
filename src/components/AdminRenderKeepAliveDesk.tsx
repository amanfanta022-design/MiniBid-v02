import React, { useState, useEffect } from 'react';
import {
  Zap,
  RefreshCw,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  Flame,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useKeepAliveStatus } from '../utils/keepAlive.js';
import { useTranslation } from '../utils/i18n.js';

export const AdminRenderKeepAliveDesk: React.FC = () => {
  const { language } = useTranslation();
  const keepAlive = useKeepAliveStatus();

  const [isPinging, setIsPinging] = useState(false);
  const [lastServerResponse, setLastServerResponse] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const fetchServerKeepAliveStatus = async () => {
    try {
      const token = localStorage.getItem('minibid_token');
      const res = await fetch('/api/superadmin/keepalive-status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchServerKeepAliveStatus();
    const interval = setInterval(fetchServerKeepAliveStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Manual-Admin-Ping': 'superadmin-desk',
        },
      });
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      if (res.ok) {
        const data = await res.json();
        setLastServerResponse(data);
        fetchServerKeepAliveStatus();
      }
    } catch (err: any) {
      setLastServerResponse({ error: err?.message || 'Network error' });
    } finally {
      setIsPinging(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1712] via-[#102018] to-[#0b140f] border border-emerald-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shrink-0">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-black text-white">
                  {language === 'am' ? 'የሬንደር አንቲ-ስሊፕ እና አውቶ-ፒንግ ሞተር' : 'Render Anti-Sleep Auto-Ping & Refresh Engine'}
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>24/7 Awake</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                {language === 'am'
                  ? 'በየ 9 ደቂቃው አውቶማቲክ ፒንግ በማድረግ ድረ-ገጹ በ Render.com እንዳይዘጋና እንዳይተኛ ይከላከላል'
                  : 'Automated 9-minute dual-tier heartbeat prevents Render.com instances from idling or cold booting'}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualPing}
            disabled={isPinging}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Pinging Server...' : 'Test Heartbeat Now'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Interval Card */}
        <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Ping Frequency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-serif font-black text-white">Every 9 Mins</div>
          <p className="text-[10px] font-mono text-zinc-500">
            Render sleep threshold is 15 mins (Safely 6 mins ahead)
          </p>
        </div>

        {/* Server Uptime Card */}
        <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Node.js Uptime</span>
            <Activity className="w-4 h-4 text-[#E5B842]" />
          </div>
          <div className="text-2xl font-serif font-black text-white">
            {serverStatus?.server_uptime_seconds
              ? formatUptime(serverStatus.server_uptime_seconds)
              : keepAlive.serverUptimeSeconds
              ? formatUptime(keepAlive.serverUptimeSeconds)
              : 'Active'}
          </div>
          <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Process online & running</span>
          </p>
        </div>

        {/* Total Pings */}
        <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Total Keep-Alive Pings</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-serif font-black text-white">
            {serverStatus?.successful_pings ?? keepAlive.pingCount ?? 1}
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            {latencyMs !== null ? `Last response: ${latencyMs}ms` : 'Continuous auto-dispatch'}
          </p>
        </div>

        {/* Host Status */}
        <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Host Environment</span>
            <Globe className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-serif font-bold text-white truncate">
            {serverStatus?.render_external_url || 'Render / Cloud'}
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            Dual-Tier: Client + Server Heartbeat
          </p>
        </div>
      </div>

      {/* Deep Technical Explanation Card */}
      <div className="p-6 rounded-3xl bg-[#121217] border border-zinc-800 space-y-4">
        <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {language === 'am'
              ? 'ይህ ሞተር ድረ-ገጹን ከእንቅልፍ እንዴት እንደሚከላከል (How Render Anti-Sleep Works)'
              : 'How the Render 10-Minute Anti-Sleep Architecture Works'}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-zinc-300">
          <div className="p-4 rounded-2xl bg-black/50 border border-zinc-800/80 space-y-2">
            <div className="font-bold text-[#E5B842] flex items-center gap-1.5">
              <span>1. Server Self-Ping Cron (Internal Node Scheduler)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Inside <code className="text-amber-300">server.ts</code>, a dedicated background timer executes every <strong>9 minutes (540,000 ms)</strong>. It sends an inbound HTTP request to <code className="text-amber-300">/api/heartbeat</code> using Render's public URL (<code className="text-zinc-500">RENDER_EXTERNAL_URL</code>) or localhost. Because Render checks for inbound HTTP activity every 15 minutes, a 9-minute ping guarantees the service container never encounters inactivity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-zinc-800/80 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>2. Client Browser Keep-Alive & Auto-Sync</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Every client visiting MiniBid runs <code className="text-emerald-300">src/utils/keepAlive.ts</code>. It fires a silent background ping every <strong>8.5 minutes</strong> and immediately upon tab refocus. This ensures continuous user-driven traffic to Render, eliminates cold starts (which normally take 50–90 seconds), and guarantees live auction timers remain synchronized.
            </p>
          </div>
        </div>
      </div>

      {/* Live Server Heartbeat Telemetry Output */}
      {lastServerResponse && (
        <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Live Response from /api/heartbeat</span>
            </span>
            <span>{latencyMs !== null ? `${latencyMs}ms latency` : ''}</span>
          </div>
          <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-zinc-900">
            {JSON.stringify(lastServerResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
