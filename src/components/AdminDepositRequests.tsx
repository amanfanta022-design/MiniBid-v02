import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ShieldAlert,
  Coins,
  Send,
  Building2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ArrowLeft,
  X,
} from 'lucide-react';
import { DepositRequest, AdminFloatRequest } from '../types.js';
import { playDepositApprovalChime } from '../utils/audio.js';

interface AdminDepositRequestsProps {
  onBackToAuctions?: () => void;
}

export const AdminDepositRequests: React.FC<AdminDepositRequestsProps> = ({ onBackToAuctions }) => {
  const { token, user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'user_deposits' | 'float_requests'>('user_deposits');
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [floatRequests, setFloatRequests] = useState<AdminFloatRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Inspection modal
  const [inspectDeposit, setInspectDeposit] = useState<DepositRequest | null>(null);

  // Reject modal
  const [rejectingDeposit, setRejectingDeposit] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');

  // Float Request Modal state
  const [showFloatModal, setShowFloatModal] = useState(false);
  const [floatAmount, setFloatAmount] = useState('5000');
  const [floatNotes, setFloatNotes] = useState('Operational float liquidity to approve participant bank deposits');
  const [floatBankRef, setFloatBankRef] = useState('');
  const [floatSubmitting, setFloatSubmitting] = useState(false);
  const [floatSuccess, setFloatSuccess] = useState('');
  const [floatError, setFloatError] = useState('');

  const fetchDeposits = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
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
      const res = await fetch('/api/admin/my-float-requests', {
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
    fetchDeposits();
    fetchFloatRequests();
    const interval = setInterval(() => {
      fetchDeposits();
      fetchFloatRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleApprove = async (depId: string) => {
    setActionError('');
    const target = deposits.find(d => d.id === depId);
    if (user?.role === 'admin' && target && (user.wallet_balance || 0) < target.amount) {
      setActionError(
        `Insufficient Admin operational balance! Your balance is ${(user.wallet_balance || 0).toFixed(2)} ETB, but approving this customer deposit requires ${target.amount.toFixed(2)} ETB. Please submit a Float Request to Super Admin first.`
      );
      return;
    }

    try {
      const idempotencyKey = `appr_${depId}_${Date.now()}`;
      const res = await fetch(`/api/admin/deposits/${depId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey,
        },
      });
      const data = await res.json();
      if (res.ok) {
        playDepositApprovalChime();
        setInspectDeposit(null);
        await refreshUser();
        fetchDeposits();
      } else {
        if (res.status === 409 || data.is_conflict) {
          setActionError('Already processed by another administrator.');
        } else {
          setActionError(data.error || 'Failed to approve deposit');
        }
        fetchDeposits();
      }
    } catch {
      setActionError('Network error while processing approval.');
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDeposit || !rejectReason.trim()) return;

    setActionError('');
    try {
      const res = await fetch(`/api/admin/deposits/${rejectingDeposit.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRejectingDeposit(null);
        setRejectReason('');
        setInspectDeposit(null);
        fetchDeposits();
      } else {
        if (res.status === 409 || data.is_conflict) {
          setActionError('Already processed by another administrator.');
        } else {
          setActionError(data.error || 'Failed to reject deposit');
        }
        fetchDeposits();
      }
    } catch {
      setActionError('Network error while rejecting deposit.');
    }
  };

  const handleSubmitFloatRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFloatError('');
    setFloatSuccess('');
    const num = parseFloat(floatAmount);
    if (isNaN(num) || num <= 0) {
      setFloatError('Please enter a valid positive float amount in ETB.');
      return;
    }

    setFloatSubmitting(true);
    try {
      const res = await fetch('/api/admin/request-float', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: num,
          notes: floatNotes,
          bank_reference: floatBankRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFloatError(data.error || 'Failed to submit float request');
      } else {
        setFloatSuccess(`Float request of ${num.toLocaleString()} ETB submitted to Super Admin!`);
        fetchFloatRequests();
        setTimeout(() => {
          setShowFloatModal(false);
          setFloatSuccess('');
        }, 1500);
      }
    } catch {
      setFloatError('Network error while submitting float request.');
    } finally {
      setFloatSubmitting(false);
    }
  };

  const filteredDeposits = deposits.filter(d => {
    const matchesFilter = filterStatus === 'all' || d.status === filterStatus;
    const matchesSearch =
      d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reference_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.payment_channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user_phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = deposits.filter(d => d.status === 'pending').length;
  const adminBalance = user?.wallet_balance || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Quick Navigation Bar with Back button */}
      {onBackToAuctions && (
        <div className="flex items-center justify-between pb-1">
          <button
            id="admin-deposits-back-btn"
            type="button"
            onClick={onBackToAuctions}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-[#E5B842]/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5B842]" />
            <span>← Back to Live Auctions</span>
          </button>
        </div>
      )}

      {/* Header Operations Center Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#121215] to-[#121215] border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Inbox className="w-4 h-4" />
            <span>Admin Liquidity & Operations Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">Deposit Approvals & Float</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Verify Ethiopian bank payment slips and disburse participant balances. Each approval automatically deducts from your Admin operational float. When low on balance, request a float deposit from Super Admin.
          </p>
        </div>

        {/* Admin Operational Float Card */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-4 rounded-2xl bg-[#18181c] border border-blue-500/30 text-right min-w-[200px]">
            <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider flex items-center justify-end gap-1">
              <Wallet className="w-3.5 h-3.5 text-[#E5B842]" /> Your Operational Float
            </div>
            <div className={`text-2xl font-mono font-extrabold mt-0.5 ${adminBalance > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {adminBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-zinc-400 font-normal">ETB</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              {adminBalance === 0 ? '⚠️ Zero float. Request from Super Admin.' : 'Ready for customer disbursements'}
            </div>
          </div>

          <button
            onClick={() => setShowFloatModal(true)}
            className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs font-mono tracking-wide flex items-center gap-2 transition-all shadow-lg shadow-[#E5B842]/20 cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>Request Float from Super Admin</span>
          </button>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
        <button
          onClick={() => setActiveSection('user_deposits')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSection === 'user_deposits'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#121215] text-zinc-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Customer Deposit Requests</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('float_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSection === 'float_requests'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#121215] text-zinc-400 hover:text-white border border-[#27272a]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>My Float Requests to Super Admin</span>
          {floatRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-400 text-black text-[10px] font-bold">
              {floatRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <div className="font-bold text-red-200">Action Blocked</div>
            <div className="mt-0.5 leading-relaxed">{actionError}</div>
          </div>
        </div>
      )}

      {activeSection === 'user_deposits' ? (
        <>
          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] text-xs">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                    filterStatus === tab
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab} {tab === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                </button>
              ))}
            </div>

            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search username, phone, or bank ref..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* User Deposits Table */}
          {isLoading ? (
            <div className="py-20 text-center text-xs text-zinc-500">Loading deposit requests...</div>
          ) : filteredDeposits.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-3xl border border-[#27272a] p-8">
              No deposit requests found matching the current filters.
            </div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181c] text-zinc-400 font-mono text-[11px] border-b border-[#27272a]">
                    <tr>
                      <th className="p-4">Customer & Account</th>
                      <th className="p-4">Payment Channel</th>
                      <th className="p-4">Deposit Amount</th>
                      <th className="p-4">Bank Ref Code</th>
                      <th className="p-4">Status & Reviewer</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {filteredDeposits.map(dep => {
                      const canAfford = adminBalance >= dep.amount;
                      return (
                        <tr key={dep.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white">@{dep.username}</div>
                            <div className="text-[11px] font-mono text-zinc-500">{dep.user_phone}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 font-mono font-medium text-[11px]">
                              {dep.payment_channel}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-mono font-bold text-emerald-400 text-sm">
                              {dep.amount.toLocaleString()} ETB
                            </div>
                            {dep.status === 'pending' && !canAfford && (
                              <div className="text-[10px] text-red-400 font-mono flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" /> Exceeds float ({adminBalance} ETB)
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-zinc-300">
                            <div className="font-bold text-white tracking-wider">{dep.reference_code}</div>
                            <div className="text-[10px] text-zinc-500">{new Date(dep.created_at).toLocaleString()}</div>
                          </td>
                          <td className="p-4">
                            {dep.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                                Pending Approval
                              </span>
                            )}
                            {dep.status === 'approved' && (
                              <div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                                  Approved & Disbursed
                                </span>
                                {dep.reviewed_by && (
                                  <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                    by @{dep.reviewed_by}
                                  </div>
                                )}
                              </div>
                            )}
                            {dep.status === 'rejected' && (
                              <div>
                                <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                                  Rejected
                                </span>
                                {dep.rejection_reason && (
                                  <div className="text-[10px] text-red-400/80 mt-1 max-w-xs truncate" title={dep.rejection_reason}>
                                    {dep.rejection_reason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInspectDeposit(dep)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
                                title="Inspect Slip & Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {dep.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(dep.id)}
                                    className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] font-mono transition-all flex items-center gap-1 ${
                                      canAfford
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    }`}
                                    title={canAfford ? 'Approve and deduct from your float' : 'Insufficient operational float'}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Disburse</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setRejectingDeposit(dep);
                                      setRejectReason('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-300 hover:text-white font-semibold text-[11px] font-mono transition-all"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
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
          )}
        </>
      ) : (
        /* Float Requests Section */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-serif">Your Operational Float Requests to Super Admin</h3>
            <button
              onClick={() => setShowFloatModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#E5B842] text-black font-semibold text-xs font-mono flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" /> Submit New Request
            </button>
          </div>

          {floatRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-3xl border border-[#27272a] p-8">
              You have not submitted any float requests yet. Click "Submit New Request" to ask Super Admin for operational balance.
            </div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181c] text-zinc-400 font-mono text-[11px] border-b border-[#27272a]">
                  <tr>
                    <th className="p-4">Requested Amount</th>
                    <th className="p-4">Purpose / Operational Notes</th>
                    <th className="p-4">Bank Ref</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4">Super Admin Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {floatRequests.map(req => (
                    <tr key={req.id} className="hover:bg-zinc-900/40">
                      <td className="p-4 font-mono font-bold text-[#E5B842] text-sm">
                        {req.amount.toLocaleString()} ETB
                      </td>
                      <td className="p-4 text-zinc-300 max-w-sm">
                        {req.notes}
                      </td>
                      <td className="p-4 font-mono text-zinc-400">
                        {req.bank_reference || 'N/A'}
                      </td>
                      <td className="p-4">
                        {req.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                            Awaiting Super Admin
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Credited to Float
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-zinc-500 text-[11px]">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-zinc-400">
                        {req.reviewed_by ? `@${req.reviewed_by}` : 'Pending'}
                        {req.rejection_reason && (
                          <div className="text-red-400 text-[10px] mt-0.5">{req.rejection_reason}</div>
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

      {/* Float Request Submission Modal */}
      {showFloatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center text-[#E5B842]">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">Request Float from Super Admin</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Ask Executive Treasury to replenish your liquidity</p>
                </div>
              </div>
              <button onClick={() => setShowFloatModal(false)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {floatError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                {floatError}
              </div>
            )}
            {floatSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
                {floatSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitFloatRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Float Amount (ETB) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="100"
                    value={floatAmount}
                    onChange={e => setFloatAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono font-bold focus:border-[#E5B842] focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-zinc-500 font-mono">ETB</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[2000, 5000, 10000, 25000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFloatAmount(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] font-mono"
                    >
                      +{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Operational Purpose / Notes *</label>
                <textarea
                  rows={2}
                  value={floatNotes}
                  onChange={e => setFloatNotes(e.target.value)}
                  required
                  placeholder="e.g. Daily CBE and Telebirr user deposit approvals buffer"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Optional Bank Reference / Slip</label>
                <input
                  type="text"
                  value={floatBankRef}
                  onChange={e => setFloatBankRef(e.target.value)}
                  placeholder="e.g. CBE-TX-987654"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white font-mono focus:border-[#E5B842] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Once approved by Super Admin, this balance will be instantly credited to your Admin wallet to allow user deposit disbursements.</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFloatModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={floatSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-semibold font-mono flex items-center justify-center gap-1"
                >
                  {floatSubmitting ? 'Submitting...' : 'Submit to Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Slip Modal */}
      {inspectDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 max-w-lg w-full shadow-2xl space-y-4 my-auto max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-serif font-bold text-white text-base">Deposit Receipt Slip & Audit</h3>
              <button onClick={() => setInspectDeposit(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 text-[10px] font-mono uppercase">User</span>
                  <div className="font-bold text-white">@{inspectDeposit.username}</div>
                  <div className="text-zinc-400 font-mono text-[11px]">{inspectDeposit.user_phone}</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] font-mono uppercase">Channel</span>
                  <div className="font-bold text-white">{inspectDeposit.payment_channel}</div>
                  <div className="text-emerald-400 font-mono font-extrabold text-sm">{inspectDeposit.amount.toLocaleString()} ETB</div>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Bank Reference Code</span>
                <div className="font-mono font-bold text-white text-sm bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 tracking-wider">
                  {inspectDeposit.reference_code}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">Uploaded Slip Attachment</span>
                {inspectDeposit.receipt_url ? (
                  <div className="mt-1 rounded-2xl overflow-hidden border border-zinc-700 bg-black aspect-video flex items-center justify-center">
                    <img
                      src={inspectDeposit.receipt_url}
                      alt="Deposit Receipt"
                      className="max-h-56 object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-900 text-zinc-500 text-center font-mono text-xs">
                    No image slip attached (Reference verified via bank API)
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-zinc-800">
              {inspectDeposit.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(inspectDeposit.id)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-mono flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Disburse
                  </button>
                  <button
                    onClick={() => {
                      setRejectingDeposit(inspectDeposit);
                      setRejectReason('');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white font-semibold font-mono cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setInspectDeposit(null)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border border-red-900/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-white text-base">Reject Customer Deposit</h3>
            <p className="text-xs text-zinc-400">
              Please enter a clear audit reason. This will be transmitted to @{rejectingDeposit.username} and stored in the immutable platform log.
            </p>

            <form onSubmit={handleRejectConfirm} className="space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                required
                placeholder="e.g. Reference code not found on CBE statement; invalid transfer screenshot"
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs font-mono"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
