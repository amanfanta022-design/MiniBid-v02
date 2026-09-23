import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldCheck,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  UserCheck,
  Ban,
  Coins,
  Wallet,
  ArrowUpRight,
  XCircle,
} from 'lucide-react';
import { User, UserRole, AdminFloatRequest } from '../types.js';

export const SuperAdminAdmins: React.FC = () => {
  const { token, user: currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'float_requests'>('directory');
  const [admins, setAdmins] = useState<User[]>([]);
  const [floatRequests, setFloatRequests] = useState<AdminFloatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New admin form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('admin');
  const [initialDeposit, setInitialDeposit] = useState('0');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct deposit modal for existing admin
  const [depositModalAdmin, setDepositModalAdmin] = useState<User | null>(null);
  const [depositAmount, setDepositAmount] = useState('5000');
  const [depositNote, setDepositNote] = useState('Super Admin Executive Float Allocation');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');

  // Reject float modal
  const [rejectingRequest, setRejectingRequest] = useState<AdminFloatRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [floatActionError, setFloatActionError] = useState('');

  const fetchAdmins = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/superadmin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFloatRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/superadmin/float-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFloatRequests(data.requests || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchFloatRequests();
    const interval = setInterval(() => {
      fetchAdmins();
      fetchFloatRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!username || !phone || !password) {
      setFormError('Username, phone number, and password are required.');
      return;
    }

    const initDep = parseFloat(initialDeposit) || 0;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/superadmin/admins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          role,
          initial_deposit: initDep,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create staff account');
      } else {
        setFormSuccess(`Administrator @${username} provisioned successfully!${initDep > 0 ? ` Initial float of ${initDep.toLocaleString()} ETB deposited.` : ''}`);
        setUsername('');
        setPhone('');
        setEmail('');
        setPassword('');
        setInitialDeposit('0');
        fetchAdmins();
        setTimeout(() => {
          setShowAddModal(false);
          setFormSuccess('');
        }, 1500);
      }
    } catch {
      setFormError('Network error while provisioning admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalAdmin) return;

    setDepositError('');
    setDepositSuccess('');
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError('Please enter a valid positive amount.');
      return;
    }

    setDepositSubmitting(true);
    try {
      const res = await fetch(`/api/superadmin/admins/${depositModalAdmin.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amt,
          note: depositNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDepositError(data.error || 'Failed to deposit float');
      } else {
        setDepositSuccess(`Successfully deposited ${amt.toLocaleString()} ETB to @${depositModalAdmin.username}!`);
        fetchAdmins();
        await refreshUser();
        setTimeout(() => {
          setDepositModalAdmin(null);
          setDepositSuccess('');
        }, 1200);
      }
    } catch {
      setDepositError('Network error while processing deposit.');
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleApproveFloat = async (reqId: string) => {
    setFloatActionError('');
    try {
      const res = await fetch(`/api/superadmin/float-requests/${reqId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setFloatActionError(data.error || 'Failed to approve float request');
      } else {
        fetchFloatRequests();
        fetchAdmins();
      }
    } catch {
      setFloatActionError('Network error while approving request');
    }
  };

  const handleRejectFloatConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest || !rejectReason.trim()) return;

    setFloatActionError('');
    try {
      const res = await fetch(`/api/superadmin/float-requests/${rejectingRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFloatActionError(data.error || 'Failed to reject float request');
      } else {
        setRejectingRequest(null);
        setRejectReason('');
        fetchFloatRequests();
      }
    } catch {
      setFloatActionError('Network error while rejecting request');
    }
  };

  const handleToggleStaffStatus = async (adminUser: User) => {
    const nextStatus = adminUser.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${adminUser.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch {
      // ignore
    }
  };

  const pendingFloatCount = floatRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#121215] to-[#121215] border border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Executive Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">Administrators & Operational Floats</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Provision staff with role-based access control. In accordance with platform governance, all admins start with 0.00 ETB. Super Admin deposits initial float when creating staff or approves periodic float requests to empower admins to approve user deposits.
          </p>
        </div>

        <button
          id="add-admin-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer w-max"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Admin</span>
        </button>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'directory'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#121215] text-zinc-400 hover:text-white border border-[#27272a]'
          }`}
        >
          Staff Directory & Float Balances ({admins.length})
        </button>

        <button
          onClick={() => setActiveTab('float_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'float_requests'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#121215] text-zinc-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Admin Float Requests</span>
          {pendingFloatCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold">
              {pendingFloatCount} Pending
            </span>
          )}
        </button>
      </div>

      {floatActionError && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{floatActionError}</span>
        </div>
      )}

      {activeTab === 'directory' ? (
        /* Staff Directory Table */
        isLoading ? (
          <div className="py-20 text-center text-xs text-zinc-500">Loading administrators list...</div>
        ) : (
          <div className="bg-[#121215] border border-[#27272a] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#18181c]/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="p-4 pl-6">Staff Member</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Operational Float Balance</th>
                    <th className="p-4">Contact Credentials</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 pr-6 text-right">Liquidity & Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/60">
                  {admins.map(staff => {
                    const isActive = staff.status === 'active';
                    const isCurrent = staff.id === currentUser?.id;
                    const balance = staff.wallet_balance || 0;

                    return (
                      <tr key={staff.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-semibold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-300 font-bold">
                              {staff.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>@{staff.username}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px]">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">{staff.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              staff.role === 'superadmin'
                                ? 'bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {staff.role}
                          </span>
                        </td>

                        {/* Operational Float Balance */}
                        <td className="p-4">
                          <div className={`font-mono font-bold text-sm ${balance > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {balance === 0 ? 'Zero float (Cannot disburse)' : 'Active disbursement buffer'}
                          </div>
                        </td>

                        <td className="p-4 font-mono text-zinc-400 space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{staff.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Mail className="w-3 h-3 text-zinc-600" />
                            <span>{staff.email}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" /> SUSPENDED
                              </>
                            )}
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Super Admin Direct Deposit Float Button */}
                            <button
                              onClick={() => {
                                setDepositModalAdmin(staff);
                                setDepositAmount('5000');
                                setDepositNote('Executive Float Provisioning');
                                setDepositError('');
                                setDepositSuccess('');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#E5B842]/10 hover:bg-[#E5B842] text-[#E5B842] hover:text-black border border-[#E5B842]/30 font-semibold font-mono text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                              title="Deposit operational float to this Admin"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Deposit Float</span>
                            </button>

                            {!isCurrent && (
                              <button
                                onClick={() => handleToggleStaffStatus(staff)}
                                className={`px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-bold border transition-all ${
                                  isActive
                                    ? 'bg-red-950/30 border-red-800 text-red-400 hover:bg-red-900/50'
                                    : 'bg-emerald-950/30 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50'
                                }`}
                              >
                                {isActive ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Admin Float Requests List */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#18181c] border border-zinc-800 flex items-center justify-between">
            <div className="text-xs text-zinc-300">
              <span className="font-bold text-white font-serif">Float Requests Queue: </span>
              Admins submit these requests when their operational balance is depleted. Approving will credit their wallet immediately.
            </div>
          </div>

          {floatRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-3xl border border-[#27272a] p-8">
              No float requests received from staff yet.
            </div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181c] text-zinc-400 font-mono text-[11px] border-b border-[#27272a]">
                  <tr>
                    <th className="p-4">Admin Requester</th>
                    <th className="p-4">Requested Float Amount</th>
                    <th className="p-4">Operational Purpose / Notes</th>
                    <th className="p-4">Bank Ref</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {floatRequests.map(req => (
                    <tr key={req.id} className="hover:bg-zinc-900/40">
                      <td className="p-4">
                        <div className="font-bold text-white">@{req.admin_username}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{new Date(req.created_at).toLocaleString()}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#E5B842] text-sm">
                        {req.amount.toLocaleString()} ETB
                      </td>
                      <td className="p-4 text-zinc-300 max-w-xs">
                        {req.notes}
                      </td>
                      <td className="p-4 font-mono text-zinc-400">
                        {req.bank_reference || 'N/A'}
                      </td>
                      <td className="p-4">
                        {req.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                            Pending Your Review
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Approved by @{req.reviewed_by}
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveFloat(req.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-mono text-[11px] flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Credit Float
                            </button>
                            <button
                              onClick={() => {
                                setRejectingRequest(req);
                                setRejectReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-600/40 font-mono text-[11px] transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Direct Deposit Float Modal */}
      {depositModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121215] border border-[#27272a] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center text-[#E5B842]">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">Deposit Operational Float</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">For Admin @{depositModalAdmin.username}</p>
                </div>
              </div>
              <button onClick={() => setDepositModalAdmin(null)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {depositError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                {depositError}
              </div>
            )}
            {depositSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
                {depositSuccess}
              </div>
            )}

            <form onSubmit={handleDirectDeposit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">Current Float Balance:</span>
                <span className="font-mono font-bold text-white">{(depositModalAdmin.wallet_balance || 0).toLocaleString()} ETB</span>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Deposit Amount (ETB) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="100"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono font-bold focus:border-[#E5B842] focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-zinc-500 font-mono">ETB</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[2500, 5000, 10000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] font-mono"
                    >
                      +{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Executive Audit Note *</label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                  required
                  placeholder="e.g. Weekly operational float provisioning"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalAdmin(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-semibold font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  {depositSubmitting ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Float Request Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121215] border border-red-900/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-white text-base">Reject Admin Float Request</h3>
            <p className="text-xs text-zinc-400">
              Rejecting request of {rejectingRequest.amount.toLocaleString()} ETB for @{rejectingRequest.admin_username}. Specify an audit reason.
            </p>

            <form onSubmit={handleRejectFloatConfirm} className="space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                required
                placeholder="e.g. Treasury reconciliation in progress; please request smaller tranche"
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs font-mono cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121215] border border-[#27272a] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center text-purple-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">Provision New Staff Account</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Create an Administrator with operational float</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="e.g. admin_dawit"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Phone (+251) *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    placeholder="+251911000000"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="staff@minibid.et"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Strong password"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono focus:border-purple-500 focus:outline-none"
                >
                  <option value="admin">Operations Admin</option>
                  <option value="superadmin">Super Admin (Full Platform Control)</option>
                </select>
              </div>

              {/* Requirement 3: Super Admin Can Deposite for Admins initaly when Adding Admins */}
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Initial Float Deposit (ETB) — <span className="text-[#E5B842]">Optional</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={initialDeposit}
                    onChange={e => setInitialDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono font-bold focus:border-[#E5B842] focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-zinc-500 font-mono">ETB</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  Default is 0.00 ETB. If specified, this amount will be immediately credited as operational liquidity.
                </p>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
