import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Search, FileText, Clock, User, Filter, Layers } from 'lucide-react';
import { AuditLog } from '../types.js';

export const SuperAdminAuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/superadmin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.audit_logs || data.logs || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const actions = ['ALL', 'CREATE_AUCTION', 'APPROVE_DEPOSIT', 'REJECT_DEPOSIT', 'ADJUST_BALANCE', 'UPDATE_USER_STATUS'];

  const filtered = logs.filter(l => {
    const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      l.actor_username.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.ip_reference.includes(q) ||
      l.details.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#E5B842] font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Immutable Governance Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">Platform Security & Audit Logs</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete cryptographic audit trail recording all staff decisions, balance adjustments, and approvals.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Logged Events</div>
          <div className="text-xl font-bold font-mono text-[#E5B842] mt-0.5">{logs.length} Actions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {actions.map(act => (
            <button
              key={act}
              onClick={() => setSelectedAction(act)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                selectedAction === act
                  ? 'bg-[#E5B842] text-black font-bold shadow-sm'
                  : 'bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search actor, action, IP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842]"
          />
        </div>
      </div>

      {/* Logs Feed */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading audit records...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#27272a]">
          No audit records found matching criteria.
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Audit Details</th>
                  <th className="p-3.5 pr-5 text-right">IP Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 font-mono">
                {filtered.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 pl-5 text-zinc-400 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-white font-sans">{log.actor_username}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{log.actor_role}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[#E5B842] text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>

                      <td className="p-3.5 text-zinc-300 text-[11px] font-mono">
                        {log.actor_id}
                      </td>

                      <td className="p-3.5 text-zinc-400 text-[11px] max-w-xs truncate">
                        {log.details}
                      </td>

                      <td className="p-3.5 pr-5 text-right text-zinc-500 text-[10px]">
                        {log.ip_reference}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
