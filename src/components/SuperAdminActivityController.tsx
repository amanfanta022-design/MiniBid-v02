import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Activity,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  UserCheck,
  CreditCard,
  Package,
  KeyRound,
  Bell,
  Crown,
  Laptop,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { SystemMovement, MovementCategory } from '../types.js';

export const SuperAdminActivityController: React.FC = () => {
  const { token } = useAuth();
  const [movements, setMovements] = useState<SystemMovement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchMovements = async (showRefreshIndicator = false) => {
    if (!token) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const res = await fetch(`/api/superadmin/activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovements();
    const interval = setInterval(() => fetchMovements(false), 8000);
    return () => clearInterval(interval);
  }, [token, selectedCategory]);

  const categories: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All Movements', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'USER_LIFECYCLE', label: 'User Registrations', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { key: 'DEPOSIT_LIFECYCLE', label: 'Deposit Lifecycle', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'AUCTIONS_ITEMS', label: 'Items & Catalog', icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'SECURITY_AUTH', label: 'Logins & Passwords', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { key: 'STAFF_NOTIFICATIONS', label: 'Staff Notifications', icon: <Bell className="w-3.5 h-3.5" /> },
    { key: 'SUPERADMIN_ACTION', label: 'Superadmin Actions', icon: <Crown className="w-3.5 h-3.5" /> },
  ];

  // Apply date classifier
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 7 * 86400000;

  const filteredMovements = movements.filter(m => {
    const time = new Date(m.created_at).getTime();
    if (dateFilter === 'today' && time < startOfToday) return false;
    if (dateFilter === 'yesterday' && (time < startOfYesterday || time >= startOfToday)) return false;
    if (dateFilter === 'week' && time < startOfWeek) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        m.actor_username.toLowerCase().includes(q) ||
        m.action.toLowerCase().includes(q) ||
        m.details.toLowerCase().includes(q) ||
        (m.target_username && m.target_username.toLowerCase().includes(q)) ||
        m.ip_address.includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Group by date bucket
  const groupDateKey = (isoString: string): string => {
    const date = new Date(isoString);
    const dayTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (dayTimestamp === startOfToday) return 'Today';
    if (dayTimestamp === startOfYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupedMovements: Record<string, SystemMovement[]> = {};
  for (const m of filteredMovements) {
    const key = groupDateKey(m.created_at);
    if (!groupedMovements[key]) groupedMovements[key] = [];
    groupedMovements[key].push(m);
  }

  const getActionBadgeColor = (action: string, category: MovementCategory) => {
    if (action.includes('APPROVED') || action.includes('SUCCESS')) {
      return 'text-emerald-400 border-emerald-800/40 bg-emerald-950/30';
    }
    if (action.includes('REJECTED') || action.includes('REVOKED') || action.includes('PURGED') || action.includes('BLOCKED')) {
      return 'text-rose-400 border-rose-800/40 bg-rose-950/30';
    }
    if (action.includes('REQUESTED') || action.includes('PASSWORD')) {
      return 'text-amber-400 border-amber-800/40 bg-amber-950/30';
    }
    if (category === 'SUPERADMIN_ACTION') {
      return 'text-purple-400 border-purple-800/40 bg-purple-950/30';
    }
    return 'text-blue-400 border-blue-800/40 bg-blue-950/30';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#E5B842] font-mono text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Executive Movement Command</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">System Activity Control Room</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Real-time chronological timeline tracking every system movement: registrations, customer deposit requests, admin approvals, notifications, catalog items, password changes, admin logins/logouts, and executive actions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-mono uppercase">Logged Movements</div>
            <div className="text-xl font-bold font-mono text-[#E5B842] mt-0.5 tabular-nums">
              {filteredMovements.length} Events
            </div>
            {lastRefreshedAt && (
              <div className="text-[10px] text-zinc-500 font-mono">Updated {lastRefreshedAt}</div>
            )}
          </div>

          <button
            onClick={() => fetchMovements(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#E5B842]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-[#E5B842] text-black shadow-md font-bold'
                  : 'bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-white'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Date Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#121215] border border-[#27272a] p-1 rounded-xl">
            <span className="text-[11px] font-mono text-zinc-500 px-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Period:</span>
            </span>
            {(['all', 'today', 'yesterday', 'week'] as const).map(p => (
              <button
                key={p}
                onClick={() => setDateFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer capitalize ${
                  dateFilter === p
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'week' ? 'Past 7 Days' : p}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, action, IP, details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842]"
            />
          </div>
        </div>
      </div>

      {/* Movements Chronological Feed */}
      {isLoading ? (
        <div className="py-24 text-center text-xs text-zinc-500 font-mono">
          Loading system movements and activity streams...
        </div>
      ) : Object.keys(groupedMovements).length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#27272a]">
          No system movements recorded matching selected filters.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMovements).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#E5B842] uppercase tracking-wider">
                  {dateLabel}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  ({items.length} {items.length === 1 ? 'event' : 'events'})
                </span>
                <div className="flex-1 h-px bg-[#27272a]" />
              </div>

              {/* Event Cards Table */}
              <div className="bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl divide-y divide-[#27272a]/70">
                {items.map(m => {
                  const timeStr = new Date(m.created_at).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={m.id}
                      className="p-4 hover:bg-zinc-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Time + Actor + Action */}
                      <div className="flex items-start md:items-center gap-3 min-w-0">
                        <div className="flex flex-col shrink-0">
                          <span className="font-mono text-zinc-400 tabular-nums text-[11px] font-bold">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {new Date(m.created_at).toISOString().split('T')[0]}
                          </span>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${getActionBadgeColor(
                              m.action,
                              m.category
                            )}`}
                          >
                            {m.action.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white">@{m.actor_username}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({m.actor_role})
                            </span>
                            {m.target_username && (
                              <>
                                <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                                <span className="text-zinc-300 font-medium">
                                  @{m.target_username}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed break-words">
                            {m.details}
                          </p>
                        </div>
                      </div>

                      {/* Right: Technical Metadata (IP, Device) */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-[11px] font-mono text-zinc-500">
                        <span title="IP Reference">{m.ip_address}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-zinc-400 font-medium">
                          {m.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
