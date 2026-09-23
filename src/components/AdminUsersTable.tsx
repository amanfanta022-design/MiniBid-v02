import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Users, Search, ShieldCheck, ShieldAlert, CheckCircle2, Ban, Coins, Phone, Mail, AlertTriangle, ShieldOff } from 'lucide-react';
import { User } from '../types.js';

interface AdminUsersTableProps {
  onOpenBalanceAdjust?: (user: User) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ onOpenBalanceAdjust }) => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>('');

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Super admin should not be visible to anyone on the active users site, including admins
        const nonSuperUsers = (data.users || []).filter((u: User) => u.role !== 'superadmin');
        setUsers(nonSuperUsers);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleToggleStatus = async (targetUser: User) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setFeedback(`User @${targetUser.username} status updated to ${nextStatus}.`);
        setTimeout(() => setFeedback(''), 4000);
        fetchUsers();
      }
    } catch {
      // ignore
    }
  };

  const handleClearFlag = async (targetUser: User) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/superadmin/users/${targetUser.id}/clear-flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setFeedback(`Security flag and duplicate attempt counter cleared for @${targetUser.username}.`);
        setTimeout(() => setFeedback(''), 4000);
        fetchUsers();
      }
    } catch {
      // ignore
    }
  };

  const filtered = users
    .filter(u => u.role !== 'superadmin')
    .filter(u => {
      const q = searchQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const flaggedUsersCount = users.filter(u => u.is_flagged).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Customer Directory & Governance</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">Active Users Ledger</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor registered platform participants, contact credentials, real-time ETB wallet balances, and account access.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Total Registered</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{users.length} Users</div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by username, phone, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {feedback && (
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Flagged Users Security Notice */}
      {flaggedUsersCount > 0 && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-200">Security Warning: {flaggedUsersCount} account(s) flagged for fraudulent transaction reuse</p>
              <p className="text-zinc-400 text-[11px] mt-0.5">These users attempted to submit already-verified deposit transaction numbers multiple times (more than 2 attempts).</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading user directory...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#27272a]">
          No users found matching query.
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Wallet Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5 pr-5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60">
                {filtered.map(u => {
                  const isActive = u.status === 'active';
                  const isStaff = u.role === 'admin' || u.role === 'superadmin';

                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'superadmin'
                              ? 'bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40'
                              : u.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3.5 space-y-0.5 text-[11px]">
                        <div className="text-zinc-300 font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{u.phone}</span>
                        </div>
                        <div className="text-zinc-500 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          <span>{u.email}</span>
                          {u.email_verified && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-white text-sm">
                        {u.wallet_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                        <span className="text-[10px] text-zinc-400">ETB</span>
                      </td>

                      <td className="p-3.5 space-y-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          <span className="capitalize">{u.status}</span>
                        </span>

                        {u.is_flagged && (
                          <div
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/50 flex items-center gap-1 w-max shadow-sm"
                            title={u.flag_reason || 'Flagged for attempting to reuse approved transaction reference'}
                          >
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                            <span>Flagged: Txn Reuse ({u.duplicate_txn_attempts || 3}x)</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-zinc-400 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3.5 pr-5 text-right space-x-2">
                        {/* Clear Fraud Flag for Super Admin */}
                        {isSuperAdmin && u.is_flagged && (
                          <button
                            type="button"
                            onClick={() => handleClearFlag(u)}
                            className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all"
                            title="Reset attempt counter and clear fraud flag"
                          >
                            <ShieldOff className="w-3 h-3" /> Clear Flag
                          </button>
                        )}

                        {/* If Super Admin, show emergency balance adjustment trigger */}
                        {isSuperAdmin && onOpenBalanceAdjust && (
                          <button
                            type="button"
                            onClick={() => onOpenBalanceAdjust(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#E5B842] border border-[#E5B842]/30 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Coins className="w-3 h-3" /> Adjust Balance
                          </button>
                        )}

                        {/* Toggle active / suspended */}
                        {u.role !== 'superadmin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all ${
                              isActive
                                ? 'bg-zinc-800 hover:bg-red-950/40 text-zinc-300 hover:text-red-400'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400'
                            }`}
                          >
                            {isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
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
