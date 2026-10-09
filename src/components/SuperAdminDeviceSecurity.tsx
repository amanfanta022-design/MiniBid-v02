import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Laptop,
  Smartphone,
  Tablet,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Globe,
  Clock,
  Wifi,
  WifiOff,
  User,
  CheckCircle2,
} from 'lucide-react';
import { AdminDeviceOverview, AdminDeviceSession } from '../types.js';

export const SuperAdminDeviceSecurity: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [deviceOverviews, setDeviceOverviews] = useState<AdminDeviceOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const fetchDevices = async (showRefreshIndicator = false) => {
    if (!token) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/superadmin/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeviceOverviews(data.devices || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(() => fetchDevices(false), 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRevokeSession = async (session: AdminDeviceSession) => {
    if (!token) return;
    setRevokingSessionId(session.id);
    try {
      const res = await fetch('/api/superadmin/devices/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: session.id }),
      });
      if (res.ok) {
        setActionFeedback(`Terminated ${session.browser} session on ${session.os} for @${session.username}.`);
        setTimeout(() => setActionFeedback(''), 4500);
        fetchDevices(false);
      }
    } catch {
      // ignore
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOthers = async (adminUserId: string, username: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/superadmin/devices/revoke-all-others', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: adminUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActionFeedback(`Disconnected ${data.count} secondary sessions for Admin @${username}.`);
        setTimeout(() => setActionFeedback(''), 4500);
        fetchDevices(false);
      }
    } catch {
      // ignore
    }
  };

  const multiDeviceAlerts = deviceOverviews.filter(d => d.has_multi_device_alert);
  const totalOnline = deviceOverviews.filter(d => d.is_online).length;
  const totalOffline = deviceOverviews.filter(d => !d.is_online).length;

  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4 text-amber-400" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4 text-blue-400" />;
    return <Laptop className="w-4 h-4 text-emerald-400" />;
  };

  const formatRelativeHeartbeat = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Active just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#E5B842] font-mono text-xs uppercase tracking-wider mb-1">
            <Laptop className="w-4 h-4" />
            <span>Staff Hardware & Concurrent Session Security</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">Admin Device & Session Monitor</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time active devices across all administrator accounts. Automatically detects if an admin logs into two or more devices simultaneously using one account, and provides instant remote session revocation.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            onClick={() => fetchDevices(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E5B842]' : ''}`} />
            <span>Refresh Presence</span>
          </button>
        </div>
      </div>

      {/* Multi-Device Security Alert Banner */}
      {multiDeviceAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-300">
              Simultaneous Multi-Device Usage Detected ({multiDeviceAlerts.length} Staff Member{multiDeviceAlerts.length > 1 ? 's' : ''})
            </h3>
            <p className="text-xs text-amber-200/80 mt-0.5">
              The following staff accounts currently have active logins from 2 or more devices concurrently:
              {' '}
              {multiDeviceAlerts.map(a => `@${a.username} (${a.device_count} devices)`).join(', ')}.
              Review active hardware sessions below to revoke unauthorized or secondary logins.
            </p>
          </div>
        </div>
      )}

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Staff Monitored</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block tabular-nums">
            {deviceOverviews.length} Accounts
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Currently Online</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2 tabular-nums">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalOnline} Active
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Offline Staff</span>
          <span className="text-xl font-bold font-mono text-zinc-400 mt-1 block tabular-nums">
            {totalOffline} Offline
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Multi-Device Alerts</span>
          <span className={`text-xl font-bold font-mono mt-1 block tabular-nums ${multiDeviceAlerts.length > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
            {multiDeviceAlerts.length} Flagged
          </span>
        </div>
      </div>

      {/* Admin Device Overviews List */}
      {isLoading ? (
        <div className="py-24 text-center text-xs text-zinc-500 font-mono">
          Scanning administrative network heartbeats and device tokens...
        </div>
      ) : (
        <div className="space-y-4">
          {deviceOverviews.map(admin => {
            const isRootSuper = admin.role === 'superadmin';

            return (
              <div
                key={admin.user_id}
                className={`bg-[#121215] rounded-2xl border transition-all overflow-hidden ${
                  admin.has_multi_device_alert
                    ? 'border-amber-600/70 shadow-lg shadow-amber-950/20'
                    : 'border-[#27272a]'
                }`}
              >
                {/* Admin Header Bar */}
                <div className="p-4 sm:p-5 bg-[#18181b]/50 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-200">
                        {admin.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121215] ${
                          admin.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                        }`}
                        title={admin.is_online ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">@{admin.username}</span>
                        {admin.admin_code_prefix && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[#E5B842] font-mono text-[10px] font-bold uppercase">
                            D.Code: {admin.admin_code_prefix}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {isRootSuper ? 'Super Administrator' : 'Operations Admin'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          {admin.is_online ? (
                            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span className={admin.is_online ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                            {admin.is_online ? 'Online' : 'Offline'}
                          </span>
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="font-mono text-[11px] tabular-nums">
                          {admin.device_count} {admin.device_count === 1 ? 'device session' : 'device sessions'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header Status / Bulk Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {admin.has_multi_device_alert ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-600/70 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>2+ Active Devices</span>
                        </span>

                        <button
                          onClick={() => handleRevokeAllOthers(admin.user_id, admin.username)}
                          className="px-3 py-1 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 font-mono text-[11px] font-bold transition-all cursor-pointer"
                          title="Disconnect secondary sessions"
                        >
                          Revoke Secondary Devices
                        </button>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[11px]">
                        Single Device OK
                      </span>
                    )}
                  </div>
                </div>

                {/* Connected Hardware Sessions Table */}
                {admin.sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                    No active hardware sessions currently recorded for this account.
                  </div>
                ) : (
                  <div className="divide-y divide-[#27272a]/60 font-mono text-xs">
                    {admin.sessions.map((sess, idx) => {
                      const isCurrentRevoking = revokingSessionId === sess.id;

                      return (
                        <div
                          key={sess.id}
                          className="p-4 hover:bg-zinc-900/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                              {getDeviceIcon(sess.device_type)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {sess.browser} on {sess.os}
                                </span>
                                <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                  {sess.device_type}
                                </span>
                                {sess.is_online ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">Idle</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-zinc-600" />
                                  <span>IP: {sess.ip_address}</span>
                                </span>
                                <span>·</span>
                                <span>First Connected: {new Date(sess.login_at).toLocaleTimeString()}</span>
                                <span>·</span>
                                <span className="text-zinc-400 font-medium">
                                  {formatRelativeHeartbeat(sess.last_active_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                            <button
                              onClick={() => handleRevokeSession(sess)}
                              disabled={isCurrentRevoking}
                              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Immediately disconnect and invalidate session token"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>{isCurrentRevoking ? 'Revoking...' : 'Disconnect Device'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
