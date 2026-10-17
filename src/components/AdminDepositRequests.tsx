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
  Lock,
  UserCheck,
  Zap,
  UserPlus,
  RefreshCw,
  AlertOctagon,
  Flame,
} from 'lucide-react';
import { DepositRequest, AdminFloatRequest } from '../types.js';
import { playDepositApprovalChime, playSlaBreachAlarm, playUrgentAdminWarningBeep } from '../utils/audio.js';
import { useTranslation } from '../utils/i18n.js';

interface AdminDepositRequestsProps {
  onBackToAuctions?: () => void;
}

export const AdminDepositRequests: React.FC<AdminDepositRequestsProps> = ({ onBackToAuctions }) => {
  const { token, user, refreshUser } = useAuth();
  const { language, t } = useTranslation();
  const [activeSection, setActiveSection] = useState<'user_deposits' | 'float_requests'>('user_deposits');
  const isSuperAdmin = user?.role === 'superadmin';
  const [queueScope, setQueueScope] = useState<'my_queue' | 'all'>(isSuperAdmin ? 'all' : 'my_queue');
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [floatRequests, setFloatRequests] = useState<AdminFloatRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Live 1-second interval ticker for continuous SLA countdowns
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Inspection modal
  const [inspectDeposit, setInspectDeposit] = useState<DepositRequest | null>(null);

  // Reject modal (standard Operations Admin)
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

  // 15-Minute SLA Speed Warning Modal (Super Admin -> Assigned Admin)
  const [warningDeposit, setWarningDeposit] = useState<DepositRequest | null>(null);
  const [warningCustomMsg, setWarningCustomMsg] = useState('');
  const [isSendingWarning, setIsSendingWarning] = useState(false);
  const [warningSuccess, setWarningSuccess] = useState('');

  // Reassignment Modal (Super Admin -> Reassign ticket to another admin)
  const [reassignDeposit, setReassignDeposit] = useState<DepositRequest | null>(null);
  const [targetAdminId, setTargetAdminId] = useState('');
  const [reassignReason, setReassignReason] = useState('15-Minute SLA Breach Escalation');
  const [adminStaffList, setAdminStaffList] = useState<Array<{ id: string; username: string; admin_code_prefix?: string; role: string }>>([]);
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState('');

  // Direct Executive Action Modal (Super Admin Override for unresponsive admins)
  const [executiveActionDeposit, setExecutiveActionDeposit] = useState<DepositRequest | null>(null);
  const [executiveActionType, setExecutiveActionType] = useState<'approve' | 'reject'>('approve');
  const [executiveRejectReason, setExecutiveRejectReason] = useState('');
  const [isExecutingOverride, setIsExecutingOverride] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState('');

  // 1-second live ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = (createdAt: string) => {
    const elapsedMs = Math.max(0, currentTime - new Date(createdAt).getTime());
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const isSlaBreached = totalSeconds >= 900; // >= 15 minutes
    const isCritical = totalSeconds >= 1800; // >= 30 minutes
    return {
      totalSeconds,
      minutes,
      seconds,
      display: `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`,
      isSlaBreached,
      isCritical,
    };
  };

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

  const fetchAdminStaff = async () => {
    if (!token || !isSuperAdmin) return;
    try {
      const res = await fetch('/api/superadmin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminStaffList(data.admins || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDeposits();
    fetchFloatRequests();
    if (isSuperAdmin) {
      fetchAdminStaff();
    }
    const interval = setInterval(() => {
      fetchDeposits();
      fetchFloatRequests();
    }, 4000);
    return () => clearInterval(interval);
  }, [token, isSuperAdmin]);

  const handleApprove = async (depId: string) => {
    setActionError('');
    if (isSuperAdmin) {
      setActionError(
        'Super Admins are executive authorities and cannot approve customer deposit requests. Customer deposit verification and disbursement is exclusively handled by assigned Operations Administrators.'
      );
      return;
    }

    const target = deposits.find(d => d.id === depId);
    if (target?.assigned_admin_id && target.assigned_admin_id !== user?.id) {
      setActionError(
        `Routing Restriction: Deposit #${target.deposit_code || target.id} is assigned to Admin @${target.assigned_admin_username}. Only the assigned administrator can approve it.`
      );
      return;
    }

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

    if (isSuperAdmin) {
      setActionError(
        'Super Admins cannot reject customer deposit requests. Customer deposit verification is exclusively handled by assigned Operations Administrators.'
      );
      return;
    }

    if (rejectingDeposit.assigned_admin_id && rejectingDeposit.assigned_admin_id !== user?.id) {
      setActionError(
        `Routing Restriction: Deposit #${rejectingDeposit.deposit_code || rejectingDeposit.id} is assigned to Admin @${rejectingDeposit.assigned_admin_username}. Only the assigned administrator can reject it.`
      );
      return;
    }

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

  const handleSendSpeedWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningDeposit) return;
    setIsSendingWarning(true);
    setWarningSuccess('');
    setActionError('');
    try {
      const res = await fetch(`/api/superadmin/deposits/${warningDeposit.id}/warn-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: warningCustomMsg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to dispatch speed warning.');
      } else {
        setWarningSuccess(`Urgent speed warning dispatched to Admin @${warningDeposit.assigned_admin_username}!`);
        playSlaBreachAlarm();
        fetchDeposits();
        setTimeout(() => {
          setWarningDeposit(null);
          setWarningCustomMsg('');
          setWarningSuccess('');
        }, 1200);
      }
    } catch {
      setActionError('Network error while dispatching speed warning.');
    } finally {
      setIsSendingWarning(false);
    }
  };

  const handleReassignDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignDeposit || !targetAdminId) {
      setActionError('Please select a target operations administrator.');
      return;
    }
    setIsReassigning(true);
    setReassignSuccess('');
    setActionError('');
    try {
      const res = await fetch(`/api/superadmin/deposits/${reassignDeposit.id}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_admin_id: targetAdminId,
          reason: reassignReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to reassign deposit.');
      } else {
        setReassignSuccess(data.message || 'Deposit successfully reassigned.');
        fetchDeposits();
        setTimeout(() => {
          setReassignDeposit(null);
          setTargetAdminId('');
          setReassignSuccess('');
        }, 1200);
      }
    } catch {
      setActionError('Network error while reassigning deposit.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleExecutiveOverrideConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executiveActionDeposit) return;
    setIsExecutingOverride(true);
    setOverrideSuccess('');
    setActionError('');

    try {
      if (executiveActionType === 'approve') {
        const idempotencyKey = `exec_appr_${executiveActionDeposit.id}_${Date.now()}`;
        const res = await fetch(`/api/admin/deposits/${executiveActionDeposit.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ executive_override: true }),
        });
        const data = await res.json();
        if (!res.ok) {
          setActionError(data.error || 'Failed to execute direct approval.');
        } else {
          playDepositApprovalChime();
          setOverrideSuccess(`Executive override: Deposit #${executiveActionDeposit.deposit_code || executiveActionDeposit.id} directly approved and credited!`);
          fetchDeposits();
          setTimeout(() => {
            setExecutiveActionDeposit(null);
            setOverrideSuccess('');
          }, 1200);
        }
      } else {
        if (!executiveRejectReason.trim()) {
          setActionError('Please specify a valid audit rejection reason.');
          setIsExecutingOverride(false);
          return;
        }
        const res = await fetch(`/api/admin/deposits/${executiveActionDeposit.id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: executiveRejectReason,
            executive_override: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setActionError(data.error || 'Failed to execute direct rejection.');
        } else {
          setOverrideSuccess(`Executive override: Deposit #${executiveActionDeposit.deposit_code || executiveActionDeposit.id} rejected.`);
          fetchDeposits();
          setTimeout(() => {
            setExecutiveActionDeposit(null);
            setExecutiveRejectReason('');
            setOverrideSuccess('');
          }, 1200);
        }
      }
    } catch {
      setActionError('Network error while performing executive override.');
    } finally {
      setIsExecutingOverride(false);
    }
  };

  const isDepositAssignedToMe = (d: DepositRequest) => {
    if (!user || user.role === 'superadmin') return false;
    if (d.assigned_admin_id && d.assigned_admin_id === user.id) return true;
    if (d.assigned_admin_username && d.assigned_admin_username.toLowerCase() === user.username.toLowerCase()) return true;
    if (user.admin_code_prefix && d.deposit_code?.toLowerCase().startsWith(user.admin_code_prefix.toLowerCase())) return true;
    return false;
  };

  const filteredDeposits = deposits.filter(d => {
    // 1. Queue scope filter: if my_queue, only show deposits assigned to the logged-in admin
    if (queueScope === 'my_queue' && !isSuperAdmin) {
      if (!isDepositAssignedToMe(d)) return false;
    }

    // 2. Status filter
    const matchesFilter = filterStatus === 'all' || d.status.toLowerCase() === filterStatus.toLowerCase();

    // 3. Search query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.username.toLowerCase().includes(q) ||
      d.reference_code.toLowerCase().includes(q) ||
      (d.deposit_code && d.deposit_code.toLowerCase().includes(q)) ||
      (d.assigned_admin_username && d.assigned_admin_username.toLowerCase().includes(q)) ||
      (d.assigned_admin_prefix && d.assigned_admin_prefix.toLowerCase().includes(q)) ||
      d.payment_channel.toLowerCase().includes(q) ||
      d.amount.toString().includes(q) ||
      d.user_phone.includes(q);

    return matchesFilter && matchesSearch;
  });

  const pendingCount = deposits.filter(d => d.status === 'pending').length;
  const myPendingCount = deposits.filter(d => d.status === 'pending' && isDepositAssignedToMe(d)).length;
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
            <span>{language === 'am' ? '← ወደ ቀጥታ ጨረታዎች ተመለስ' : '← Back to Live Auctions'}</span>
          </button>
        </div>
      )}

      {/* Header Operations Center Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#121215] to-[#121215] border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Inbox className="w-4 h-4" />
            <span>
              {isSuperAdmin
                ? (language === 'am' ? 'የሱፐር አድሚን የበላይ የቁጥጥር ቢሮ' : 'Super Admin Supervisory Audit Desk')
                : (language === 'am' ? 'የአስተዳደር ፈሳሽ ገንዘብ እና ኦፕሬሽን' : 'Admin Liquidity & Operations Desk')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {isSuperAdmin
              ? (language === 'am' ? 'የተቀማጭ ገንዘቦች የበላይ ቁጥጥር' : 'Deposit Oversight & Audit')
              : (language === 'am' ? 'የተቀማጭ ገንዘቦች ማረጋገጫ እና ቀሪ' : 'Deposit Approvals & Float')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            {isSuperAdmin
              ? (language === 'am'
                  ? 'የተጠቃሚዎች ተቀማጭ ክፍያዎች የሚረጋገጡት እና የሚለቀቁት በተመደቡ ኦፕሬሽናል አስተዳዳሪዎች ብቻ ነው። ሱፐር አድሚን የበላይ ኦዲት እና የሰራተኞችን ፈሳሽ ገንዘብ ይቆጣጠራል።'
                  : 'Customer deposit slips and balance disbursements are strictly handled by assigned Operations Administrators. Super Admin oversees audit transparency, fraud detection, and staff float allocations.')
              : (language === 'am'
                  ? 'የኢትዮጵያ ንግድ ባንክ እና የቴሌብር ክፍያዎችን ያረጋግጡ እና ለተጠቃሚዎች ገንዘቡን ይልቀቁ። እያንዳንዱ ማጽደቅ ከአስተዳዳሪ ቀሪ ሒሳብዎ ይቀነሳል። ቀሪ ሲያልቅ ከሱፐር አድሚን ፈሳሽ ገንዘብ ይጠይቁ።'
                  : 'Verify Ethiopian bank payment slips and disburse participant balances. Each approval automatically deducts from your Admin operational float. When low on balance, request a float deposit from Super Admin.')}
          </p>
        </div>

        {/* Admin Operational Float or Super Admin Supervisory Card */}
        <div className="flex flex-wrap items-center gap-3">
          {!isSuperAdmin ? (
            <>
              <div className="p-4 rounded-2xl bg-[#18181c] border border-blue-500/30 text-right min-w-[200px]">
                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                  <Wallet className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{language === 'am' ? 'የእርስዎ ኦፕሬሽናል ቀሪ' : 'Your Operational Float'}</span>
                </div>
                <div className={`text-2xl font-mono font-extrabold mt-0.5 ${adminBalance > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {adminBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-zinc-400 font-normal">ETB</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {adminBalance === 0
                    ? (language === 'am' ? '⚠️ ቀሪ አልቋል። ከሱፐር አድሚን ይጠይቁ።' : '⚠️ Zero float. Request from Super Admin.')
                    : (language === 'am' ? 'ለደንበኞች ተቀማጭ ዝግጁ ነው' : 'Ready for customer disbursements')}
                </div>
              </div>

              <button
                onClick={() => setShowFloatModal(true)}
                className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs font-mono tracking-wide flex items-center gap-2 transition-all shadow-lg shadow-[#E5B842]/20 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>{language === 'am' ? 'ከሱፐር አድሚን ፈሳሽ ገንዘብ ጠይቅ' : 'Request Float from Super Admin'}</span>
              </button>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-[#18181c] border border-purple-500/30 text-right min-w-[220px]">
              <div className="text-[10px] text-purple-300 font-mono uppercase tracking-wider flex items-center justify-end gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E5B842]" />
                <span>Super Admin</span>
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1">
                Supreme Liquidity Authority
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Auditing All Team Queues
              </div>
            </div>
          )}
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
          <span>{language === 'am' ? 'የደንበኞች ተቀማጭ ጥያቄዎች' : 'Customer Deposit Requests'}</span>
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
          <span>{language === 'am' ? 'የፈሳሽ ገንዘብ ጥያቄዎች ወደ ሱፐር አድሚን' : 'My Float Requests to Super Admin'}</span>
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
            <div className="font-bold text-red-200">
              {language === 'am' ? 'እርምጃው ተከልክሏል' : 'Action Blocked'}
            </div>
            <div className="mt-0.5 leading-relaxed">{actionError}</div>
          </div>
        </div>
      )}

      {activeSection === 'user_deposits' ? (
        <>
          {/* Operations Admin Urgent Warning Banner */}
          {!isSuperAdmin && (
            (() => {
              const myDelayed = deposits.filter(
                d => d.status === 'pending' && isDepositAssignedToMe(d) && (formatElapsedTime(d.created_at).isSlaBreached || (d.warning_count || 0) > 0)
              );
              if (myDelayed.length === 0) return null;
              return (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950/80 via-amber-950/50 to-[#121215] border-2 border-red-500/80 shadow-2xl animate-pulse">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <AlertOctagon className="w-5 h-5 text-red-400 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                            High Priority Alert
                          </span>
                          <span className="text-sm font-extrabold text-white">
                            {language === 'am'
                              ? '🚨 የሱፐር አድሚን አስቸኳይ ማስጠንቀቂያ፦ የተቀማጭ ጥያቄ ከ15 ደቂቃ በላይ ቆይቷል!'
                              : '🚨 URGENT SPEED WARNING: Deposit Request Exceeds 15-Minute SLA!'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                          {language === 'am'
                            ? `በእርስዎ ወረፋ ውስጥ ${myDelayed.length} ተቀማጭ(ዎች) ከ15 ደቂቃ በላይ ሳይረጋገጥ ቆይቷል። ሱፐር አድሚን አስቸኳይ እርምጃ እንዲወሰድ ጠይቋል። እባክዎ አሁኑኑ አጽድቁ ወይም ውድቅ አድርጉ።`
                            : `You have ${myDelayed.length} deposit request(s) pending over 15 minutes in your queue. Super Admin executive oversight has dispatched an urgent escalation warning. Please verify and disburse or decline immediately.`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 font-mono text-xs font-bold border border-red-500/40">
                        {myDelayed.length} Delayed Ticket(s)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* Super Admin 15-Minute SLA Breach Escalation Radar */}
          {isSuperAdmin && (
            (() => {
              const slaBreaches = deposits.filter(
                d => d.status === 'pending' && (formatElapsedTime(d.created_at).isSlaBreached || (d.warning_count || 0) > 0)
              );
              return (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#18181f] to-[#121215] border-2 border-red-600/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Radar Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <Flame className="w-5 h-5 animate-pulse text-red-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-black text-[10px] uppercase tracking-wider animate-pulse">
                            15-Min SLA Radar
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Automated Financial Oversight Watchdog
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold font-serif text-white mt-0.5 flex items-center gap-2">
                          <span>{language === 'am' ? 'የተቀማጭ ገንዘቦች የ15 ደቂቃ መዘግየት ቁጥጥር ራዳር' : '15-Minute Deposit SLA Breach Escalation Radar'}</span>
                          {slaBreaches.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-black text-xs font-mono font-black animate-bounce">
                              {slaBreaches.length} Delayed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
                              ✓ All SLA Targets Met
                            </span>
                          )}
                        </h2>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>SLA Breach Threshold: <strong className="text-white font-mono">15m 00s</strong></span>
                    </div>
                  </div>

                  {/* Radar Explanatory Guide */}
                  <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                    {language === 'am'
                      ? 'ይህ ራዳር ከ15 ደቂቃ በላይ ሳይመለሱ የቆዩ ደንበኞች የተቀማጭ ጥያቄዎችን በቅጽበት ይለያል። ሱፐር አድሚን ለተመደበው አድሚን አስቸኳይ ማስጠንቀቂያ መላክ፣ ስራውን ለሌላ አድሚን ማስተላለፍ ወይም በቀጥታ ማጽደቅ/ውድቅ ማድረግ ይችላል።'
                      : 'Live engine flags pending deposit tickets unattended over 15 minutes. Super Admin can immediately dispatch urgent speed warnings to the assigned Admin, reassign the ticket to another active operations admin, or execute direct executive approval/decline.'}
                  </p>

                  {/* Delayed Deposit Cards Grid */}
                  {slaBreaches.length === 0 ? (
                    <div className="mt-4 p-6 rounded-2xl bg-[#121215]/80 border border-zinc-800 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <div className="text-sm font-bold text-white">All customer deposits are within the 15-minute SLA limit</div>
                      <div className="text-xs text-zinc-400 mt-1">Operations Administrators are responding swiftly. No tickets are currently breached.</div>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {slaBreaches.map(dep => {
                        const elapsed = formatElapsedTime(dep.created_at);
                        const hasWarning = (dep.warning_count || 0) > 0;
                        return (
                          <div
                            key={dep.id}
                            className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                              elapsed.isCritical
                                ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-950/40'
                                : 'bg-amber-950/30 border-amber-500/70 shadow-lg shadow-amber-950/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-lg bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/40 font-mono font-extrabold text-xs">
                                    D.Code: {dep.deposit_code || 'N/A'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs inline-flex items-center gap-1 ${
                                    elapsed.isCritical
                                      ? 'bg-red-600 text-white animate-pulse'
                                      : 'bg-amber-500 text-black'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    {elapsed.display} elapsed
                                  </span>
                                </div>
                                <div className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                                  <span>@{dep.username}</span>
                                  <span className="text-xs text-zinc-400 font-mono font-normal">({dep.user_phone})</span>
                                </div>
                                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                                  {dep.payment_channel} • Ref: <span className="text-zinc-200 font-bold">{dep.reference_code}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-mono font-black text-emerald-400">
                                  {dep.amount.toLocaleString()} <span className="text-xs text-zinc-400">ETB</span>
                                </div>
                                <div className="mt-1">
                                  <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-purple-300 font-mono text-[11px]">
                                    👤 Assigned: @<strong>{dep.assigned_admin_username || 'unassigned'}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Warning Status */}
                            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                              <div>
                                {hasWarning ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold inline-flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    Speed Warning Sent ({dep.warning_count}x) {dep.last_warned_by ? `by @${dep.last_warned_by}` : ''}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    No speed warning dispatched yet
                                  </span>
                                )}
                              </div>
                              {dep.reassigned_from_username && (
                                <span className="text-blue-300">
                                  Reassigned from @{dep.reassigned_from_username}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons for Super Admin */}
                            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {/* 1. Warn Assigned Admin */}
                              <button
                                type="button"
                                onClick={() => {
                                  setWarningDeposit(dep);
                                  setWarningCustomMsg('');
                                }}
                                className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Send urgent speed warning to assigned admin"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Warn Admin</span>
                              </button>

                              {/* 2. Reassign to another admin */}
                              <button
                                type="button"
                                onClick={() => {
                                  setReassignDeposit(dep);
                                  setTargetAdminId('');
                                  setReassignReason('15-Minute SLA Breach Escalation');
                                }}
                                className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Reassign to another active Operations Admin"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Reassign</span>
                              </button>

                              {/* 3. Direct Approve Override */}
                              <button
                                type="button"
                                onClick={() => {
                                  setExecutiveActionDeposit(dep);
                                  setExecutiveActionType('approve');
                                }}
                                className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Super Admin Direct Approval Override"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              {/* 4. Direct Reject Override */}
                              <button
                                type="button"
                                onClick={() => {
                                  setExecutiveActionDeposit(dep);
                                  setExecutiveActionType('reject');
                                  setExecutiveRejectReason('');
                                }}
                                className="py-2 px-2.5 rounded-xl bg-red-600/30 hover:bg-red-600 border border-red-500/50 text-red-200 hover:text-white font-bold text-[11px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer"
                                title="Super Admin Direct Reject Override"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          )}

          {/* Queue Scope Switcher: My Assigned Queue vs All Team Requests */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#18181c] border border-[#27272a]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E5B842]" />
                {language === 'am' ? 'የተቀማጭ ወረፋ መምረጫ፦' : 'Queue Assignment:'}
              </span>
              <div className="inline-flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setQueueScope('my_queue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    queueScope === 'my_queue'
                      ? 'bg-[#E5B842] text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'የእኔ የተመደቡ ጥያቄዎች' : 'My Allocated Queue'}</span>
                  {deposits.filter(d => d.status === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-black text-[#E5B842] text-[10px] font-extrabold">
                      {deposits.filter(d => d.status === 'pending').length}
                    </span>
                  )}
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setQueueScope('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      queueScope === 'all'
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ሁሉም የቡድን ጥያቄዎች' : 'All Platform Requests'}</span>
                    <span className="text-[10px] opacity-75 font-normal">({deposits.length})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-400">
              {!isSuperAdmin ? (
                <span className="text-amber-300 flex items-center gap-1">
                  🔒 {language === 'am' ? `ለእርስዎ (@${user?.username}) የተመደቡ የተቀማጭ ጥያቄዎች ብቻ (Allocated Only)` : `Allocated Queue Only: You (@${user?.username}) see your assigned deposit verification requests only.`}
                </span>
              ) : queueScope === 'my_queue' ? (
                <span className="text-amber-300">
                  ⚡ {language === 'am' ? `ለእርስዎ (@${user?.username}) በ D.Code የተመደቡ ብቻ በማሳየት ላይ` : `Showing requests assigned to you (@${user?.username}) via D.Code`}
                </span>
              ) : (
                <span className="text-zinc-400">
                  👥 {language === 'am' ? 'ሙሉ የቡድን የተቀማጭ ጥያቄዎች' : 'Showing all requests across all operational admins'}
                </span>
              )}
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] text-xs">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => {
                const tabLabels: Record<string, string> = {
                  pending: language === 'am' ? 'በመጠባበቅ ላይ' : 'pending',
                  approved: language === 'am' ? 'የፀደቁ' : 'approved',
                  rejected: language === 'am' ? 'ውድቅ የተደረጉ' : 'rejected',
                  all: language === 'am' ? 'ሁሉም' : 'all',
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                      filterStatus === tab
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tabLabels[tab]} {tab === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  language === 'am'
                    ? 'በ D.Code፣ ተጠቃሚ ስም፣ ስልክ ወይም የባንክ መለያ ፈልግ...'
                    : 'Search D.Code, username, phone, or bank ref...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* User Deposits Table */}
          {isLoading ? (
            <div className="py-20 text-center text-xs text-zinc-500">
              {language === 'am' ? 'የተቀማጭ ጥያቄዎች በመጫን ላይ...' : 'Loading deposit requests...'}
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-3xl border border-[#27272a] p-8">
              {language === 'am' ? 'ምንም የሚመሳሰል የተቀማጭ ጥያቄ አልተገኘም።' : 'No deposit requests found matching the current filters.'}
            </div>
          ) : (
            <div className="bg-[#121215] border border-[#27272a] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181c] text-zinc-400 font-mono text-[11px] border-b border-[#27272a]">
                    <tr>
                      <th className="p-4">{language === 'am' ? 'D.Code / የተመደበ አድሚን' : 'D.Code / Routing Desk'}</th>
                      <th className="p-4">{language === 'am' ? 'ተጠቃሚ እና አካውንት' : 'Customer & Account'}</th>
                      <th className="p-4">{language === 'am' ? 'የክፍያ ቻናል' : 'Payment Channel'}</th>
                      <th className="p-4">{language === 'am' ? 'የተቀማጭ መጠን' : 'Deposit Amount'}</th>
                      <th className="p-4">{language === 'am' ? 'የትራንዛክሽን ቁጥር' : 'Bank Ref Code'}</th>
                      <th className="p-4">{language === 'am' ? 'ሁኔታ እና አረጋጋጭ' : 'Status & Reviewer'}</th>
                      <th className="p-4 text-right">{language === 'am' ? 'እርምጃዎች' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {filteredDeposits.map(dep => {
                      const canAfford = adminBalance >= dep.amount;
                      const isMine = isDepositAssignedToMe(dep);
                      const elapsed = formatElapsedTime(dep.created_at);
                      const isSlaBreached = dep.status === 'pending' && elapsed.isSlaBreached;

                      return (
                        <tr
                          key={dep.id}
                          className={`hover:bg-zinc-900/40 transition-colors ${
                            isSlaBreached
                              ? 'border-l-4 border-l-red-500 bg-red-950/20'
                              : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg bg-[#E5B842]/15 text-[#E5B842] border border-[#E5B842]/40 font-mono font-extrabold text-xs tracking-wider">
                                D.Code: {dep.deposit_code || 'N/A'}
                              </span>
                            </div>
                            <div className="mt-1 font-mono text-[10px]">
                              {isMine ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
                                  ✓ {language === 'am' ? 'የእርስዎ ወረፋ' : 'Your Desk'}
                                </span>
                              ) : dep.assigned_admin_username ? (
                                <span className="text-zinc-400">
                                  👤 @<strong className="text-zinc-200">{dep.assigned_admin_username}</strong> <span className="text-zinc-500">({dep.assigned_admin_prefix || 'ad'})</span>
                                </span>
                              ) : (
                                <span className="text-zinc-500">General Pool</span>
                              )}
                            </div>
                          </td>
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
                                <AlertTriangle className="w-3 h-3" />
                                <span>{language === 'am' ? `ከቀሪ በላይ ነው (${adminBalance} ብር)` : `Exceeds float (${adminBalance} ETB)`}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-zinc-300">
                            <div className="font-bold text-white tracking-wider">{dep.reference_code}</div>
                            <div className="text-[10px] text-zinc-500">{new Date(dep.created_at).toLocaleString()}</div>
                          </td>
                          <td className="p-4">
                            {dep.status === 'pending' && (
                              <div className="space-y-1">
                                <span
                                  className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold inline-flex items-center gap-1 ${
                                    isSlaBreached
                                      ? elapsed.isCritical
                                        ? 'bg-red-600 text-white animate-pulse'
                                        : 'bg-amber-500 text-black animate-pulse'
                                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                                  }`}
                                >
                                  {isSlaBreached ? (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      <span>15m+ Delay ({elapsed.display})</span>
                                    </>
                                  ) : (
                                    <span>{language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending Approval'}</span>
                                  )}
                                </span>

                                {(dep.warning_count || 0) > 0 && (
                                  <div className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    <span>Warned ({dep.warning_count}x)</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {dep.status === 'approved' && (
                              <div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                                  {language === 'am' ? 'ፀድቋል እና ገብቷል' : 'Approved & Disbursed'}
                                </span>
                                {dep.reviewed_by && (
                                  <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                    {language === 'am' ? 'በ' : 'by'} @{dep.reviewed_by}
                                  </div>
                                )}
                              </div>
                            )}
                            {dep.status === 'rejected' && (
                              <div>
                                <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                                  {language === 'am' ? 'ውድቅ ተደርጓል' : 'Rejected'}
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
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                                title={language === 'am' ? 'ደረሰኙን እና ዝርዝሩን መርምር' : 'Inspect Slip & Details'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {dep.status === 'pending' && (
                                <>
                                  {isSuperAdmin ? (
                                    <div className="flex items-center gap-1.5">
                                      {/* Quick Speed Warning */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setWarningDeposit(dep);
                                          setWarningCustomMsg('');
                                        }}
                                        className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black transition-all cursor-pointer"
                                        title={`Warn Assigned Admin @${dep.assigned_admin_username || 'operations'} to speed up approval`}
                                      >
                                        <Zap className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Quick Reassign */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReassignDeposit(dep);
                                          setTargetAdminId('');
                                          setReassignReason('15-Minute SLA Breach Escalation');
                                        }}
                                        className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500 border border-blue-500/40 text-blue-300 hover:text-white transition-all cursor-pointer"
                                        title="Reassign ticket to another active operations admin"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Direct Executive Action (Approve / Reject) */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setExecutiveActionDeposit(dep);
                                          setExecutiveActionType('approve');
                                        }}
                                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-black transition-all cursor-pointer"
                                        title="Direct Executive Approve (Override)"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setExecutiveActionDeposit(dep);
                                          setExecutiveActionType('reject');
                                          setExecutiveRejectReason('');
                                        }}
                                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 border border-red-500/40 text-red-300 hover:text-white transition-all cursor-pointer"
                                        title="Direct Executive Reject (Override)"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : !isMine ? (
                                    <span
                                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] flex items-center gap-1"
                                      title={`Assigned to Admin @${dep.assigned_admin_username}`}
                                    >
                                      <Lock className="w-3 h-3 text-amber-500/80" />
                                      <span>@{dep.assigned_admin_username || 'other'}</span>
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleApprove(dep.id)}
                                        className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] font-mono transition-all flex items-center gap-1 ${
                                          canAfford
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        }`}
                                        title={canAfford ? (language === 'am' ? 'አጽድቅ እና ከቀሪው ይቁረጥ' : 'Approve and deduct from your float') : (language === 'am' ? 'በቂ ኦፕሬሽናል ቀሪ የለም' : 'Insufficient operational float')}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{language === 'am' ? 'አጽድቅ' : 'Approve & Disburse'}</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setRejectingDeposit(dep);
                                          setRejectReason('');
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-300 hover:text-white font-semibold text-[11px] font-mono transition-all cursor-pointer"
                                        title={language === 'am' ? 'ውድቅ አድርግ' : 'Reject'}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
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
            <h3 className="text-base font-bold text-white font-serif">
              {language === 'am' ? 'ወደ ሱፐር አድሚን የላኳቸው የፈሳሽ ገንዘብ ጥያቄዎች' : 'Your Operational Float Requests to Super Admin'}
            </h3>
            <button
              onClick={() => setShowFloatModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#E5B842] text-black font-semibold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'አዲስ ጥያቄ አስገባ' : 'Submit New Request'}</span>
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
                  <h3 className="font-serif font-bold text-white text-base">
                    {language === 'am' ? 'ከሱፐር አድሚን ፈሳሽ ገንዘብ ጠይቅ' : 'Request Float from Super Admin'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {language === 'am' ? 'የአስተዳዳሪ ኪስ ቦርሳዎን ለማሟላት ጥያቄ ያቅርቡ' : 'Ask Executive Treasury to replenish your liquidity'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFloatModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
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
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  {language === 'am' ? 'የፈሳሽ ገንዘብ መጠን (በብር) *' : 'Float Amount (ETB) *'}
                </label>
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
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] font-mono cursor-pointer"
                    >
                      +{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  {language === 'am' ? 'የጥያቄው ምክንያት / ማስታወሻ *' : 'Operational Purpose / Notes *'}
                </label>
                <textarea
                  rows={2}
                  value={floatNotes}
                  onChange={e => setFloatNotes(e.target.value)}
                  required
                  placeholder={language === 'am' ? 'ለምሳሌ፦ ለዕለቱ የደንበኞች ተቀማጭ ማጽደቂያ ፈሳሽ ገንዘብ' : 'e.g. Daily CBE and Telebirr user deposit approvals buffer'}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-[#27272a] text-white focus:border-[#E5B842] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  {language === 'am' ? 'የባንክ ትራንዛክሽን ቁጥር (አስፈላጊ ከሆነ)' : 'Optional Bank Reference / Slip'}
                </label>
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
                <span>
                  {language === 'am'
                    ? 'በሱፐር አድሚን ከፀደቀ በኋላ፣ ይህ ገንዘብ ወዲያውኑ ወደ አስተዳዳሪ ኪስ ቦርሳዎ ገቢ ይደረጋል።'
                    : 'Once approved by Super Admin, this balance will be instantly credited to your Admin wallet to allow user deposit disbursements.'}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFloatModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
                >
                  {language === 'am' ? 'ይቅር' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={floatSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black font-semibold font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  {floatSubmitting
                    ? language === 'am' ? 'በመላክ ላይ...' : 'Submitting...'
                    : language === 'am' ? 'ለሱፐር አድሚን ላክ' : 'Submit to Super Admin'}
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
              <h3 className="font-serif font-bold text-white text-base">
                {language === 'am' ? 'የተቀማጭ ደረሰኝ እና የኦዲት መረጃ' : 'Deposit Receipt Slip & Audit'}
              </h3>
              <button onClick={() => setInspectDeposit(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 text-[10px] font-mono uppercase">
                    {language === 'am' ? 'ተጠቃሚ' : 'User'}
                  </span>
                  <div className="font-bold text-white">@{inspectDeposit.username}</div>
                  <div className="text-zinc-400 font-mono text-[11px]">{inspectDeposit.user_phone}</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] font-mono uppercase">
                    {language === 'am' ? 'ቻናል' : 'Channel'}
                  </span>
                  <div className="font-bold text-white">{inspectDeposit.payment_channel}</div>
                  <div className="text-emerald-400 font-mono font-extrabold text-sm">{inspectDeposit.amount.toLocaleString()} ETB</div>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">
                  {language === 'am' ? 'የባንክ ትራንዛክሽን ቁጥር' : 'Bank Reference Code'}
                </span>
                <div className="font-mono font-bold text-white text-sm bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 tracking-wider">
                  {inspectDeposit.reference_code}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] font-mono uppercase">
                  {language === 'am' ? 'የተያያዘው የደረሰኝ ፎቶ' : 'Uploaded Slip Attachment'}
                </span>
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
                    {language === 'am' ? 'የደረሰኝ ፎቶ አልተያያዘም' : 'No image slip attached'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-zinc-800">
              {inspectDeposit.status === 'pending' && (
                isSuperAdmin ? (
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 font-mono text-center text-xs flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      {language === 'am'
                        ? `የሱፐር አድሚን ቁጥጥር፦ ይህ ተቀማጭ በአስተዳዳሪ @${inspectDeposit.assigned_admin_username || 'operations'} የሚረጋገጥ ነው`
                        : `Super Admin Supervisory Mode: Assigned to Operations Admin @${inspectDeposit.assigned_admin_username || 'operations'}`}
                    </span>
                  </div>
                ) : !isDepositAssignedToMe(inspectDeposit) ? (
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-center text-xs flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {language === 'am'
                        ? `ይህ ተቀማጭ ለ @${inspectDeposit.assigned_admin_username} የተመደበ ነው`
                        : `Assigned to Operations Desk @${inspectDeposit.assigned_admin_username}`}
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleApprove(inspectDeposit.id)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-mono flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'am' ? 'አጽድቅ እና ገንዘቡን ልቀቅ' : 'Approve & Disburse'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectingDeposit(inspectDeposit);
                        setRejectReason('');
                      }}
                      className="py-2.5 px-4 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white font-semibold font-mono cursor-pointer"
                    >
                      {language === 'am' ? 'ውድቅ አድርግ' : 'Reject'}
                    </button>
                  </>
                )
              )}
              <button
                onClick={() => setInspectDeposit(null)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
              >
                {language === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border border-red-900/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 max-w-md w-full shadow-2xl space-y-4 my-auto max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-white text-base">
              {language === 'am' ? 'የተጠቃሚ ተቀማጭ ጥያቄን ውድቅ አድርግ' : 'Reject Customer Deposit'}
            </h3>
            <p className="text-xs text-zinc-400">
              {language === 'am'
                ? `እባክዎ ግልጽ የሆነ ምክንያት ይጻፉ። ይህ ምክንያት ለ @${rejectingDeposit.username} የሚላክ ሲሆን በኦዲት መዝገብ ላይ ይቀመጣል።`
                : `Please enter a clear audit reason. This will be transmitted to @${rejectingDeposit.username} and stored in the immutable platform log.`}
            </p>

            <form onSubmit={handleRejectConfirm} className="space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                required
                placeholder={
                  language === 'am'
                    ? 'ለምሳሌ፦ የትራንዛክሽን ቁጥሩ በባንክ ስቴትመንት ላይ አልተገኘም፤ ወይም ደረሰኙ የተደገመ ነው'
                    : 'e.g. Reference code not found on CBE statement; invalid transfer screenshot'
                }
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  {language === 'am' ? 'ይቅር' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs font-mono cursor-pointer"
                >
                  {language === 'am' ? 'ውድቅ ማድረጉን አረጋግጥ' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Super Admin Speed Warning Modal */}
      {warningDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">
                    {language === 'am' ? 'ለአስተዳዳሪው አስቸኳይ የፍጥነት ማስጠንቀቂያ ላክ' : 'Send Urgent Speed Warning to Assigned Admin'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    High-Priority In-App Alert & Acoustic Chime
                  </p>
                </div>
              </div>
              <button onClick={() => setWarningDeposit(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Ticket Details */}
            <div className="p-3.5 rounded-2xl bg-[#18181f] border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Target Deposit:</span>
                <span className="font-mono font-bold text-white">
                  D.Code: {warningDeposit.deposit_code || warningDeposit.id} ({warningDeposit.amount.toLocaleString()} ETB)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Customer:</span>
                <span className="font-bold text-zinc-200">@{warningDeposit.username} ({warningDeposit.payment_channel})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Assigned Operations Admin:</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold">
                  @{warningDeposit.assigned_admin_username || 'operations'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Elapsed Waiting Time:</span>
                <span className="font-mono font-black text-red-400 animate-pulse">
                  {formatElapsedTime(warningDeposit.created_at).display} (&gt; 15m SLA breach)
                </span>
              </div>
              {(warningDeposit.warning_count || 0) > 0 && (
                <div className="text-[11px] font-mono text-amber-400 pt-1 border-t border-zinc-800">
                  ⚠️ This admin has already been warned {warningDeposit.warning_count} time(s).
                </div>
              )}
            </div>

            {warningSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                ✓ {warningSuccess}
              </div>
            )}

            <form onSubmit={handleSendSpeedWarning} className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-mono text-xs mb-1.5 font-bold">
                  Warning Message & Directive:
                </label>
                <textarea
                  rows={3}
                  value={warningCustomMsg}
                  onChange={e => setWarningCustomMsg(e.target.value)}
                  placeholder="Urgent 15-minute SLA breach: Customer is waiting for funds to place bids. Verify payment slip and approve or decline immediately!"
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Preset quick message chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-mono uppercase">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWarningCustomMsg('⚠️ 15-Minute SLA breached. Please approve or decline this customer request immediately!')}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                  >
                    15m SLA Breach
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarningCustomMsg('Customer is active on live auction and waiting for wallet balance. High priority!')}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                  >
                    Active Auction Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarningCustomMsg('Final SLA warning: If not processed in 5 minutes, ticket will be reassigned away from your desk.')}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                  >
                    Reassignment Notice
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingWarning}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isSendingWarning ? 'Transmitting...' : 'Dispatch Urgent Warning'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Super Admin Reassign Deposit Modal */}
      {reassignDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border-2 border-blue-500/70 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">
                    Reassign Delayed Deposit Request
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Transfer ticket from idle/unresponsive admin to an active staff member
                  </p>
                </div>
              </div>
              <button onClick={() => setReassignDeposit(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Ticket Details */}
            <div className="p-3.5 rounded-2xl bg-[#18181f] border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Deposit Ticket:</span>
                <span className="font-mono font-bold text-white">
                  D.Code: {reassignDeposit.deposit_code || reassignDeposit.id} ({reassignDeposit.amount.toLocaleString()} ETB)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Current Assigned Admin:</span>
                <span className="font-mono text-amber-300 font-bold">
                  @{reassignDeposit.assigned_admin_username || 'unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Elapsed Waiting Time:</span>
                <span className="font-mono font-black text-red-400 animate-pulse">
                  {formatElapsedTime(reassignDeposit.created_at).display} (&gt; 15m SLA breach)
                </span>
              </div>
            </div>

            {reassignSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                ✓ {reassignSuccess}
              </div>
            )}

            <form onSubmit={handleReassignDeposit} className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-mono text-xs mb-1.5 font-bold">
                  Select Target Operations Administrator:
                </label>
                <select
                  value={targetAdminId}
                  onChange={e => setTargetAdminId(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose active operations administrator --</option>
                  {adminStaffList
                    .filter(a => a.id !== reassignDeposit.assigned_admin_id)
                    .map(admin => (
                      <option key={admin.id} value={admin.id}>
                        @{admin.username} ({admin.role.toUpperCase()}) — Prefix: {admin.admin_code_prefix || 'ad'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-mono text-xs mb-1.5 font-bold">
                  Reason for Reassignment:
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={e => setReassignReason(e.target.value)}
                  placeholder="e.g. 15-Minute SLA Breach Escalation"
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] text-blue-300 flex items-start gap-2 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <span>
                  Reassigning will instantly update the deposit code routing, deliver high-urgency notifications to the new admin's desk, and log an audit movement.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/50"
                >
                  <RefreshCw className={`w-4 h-4 ${isReassigning ? 'animate-spin' : ''}`} />
                  <span>{isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Super Admin Direct Executive Action Modal (Override) */}
      {executiveActionDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-[#121215] border-2 border-purple-500/70 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  executiveActionType === 'approve'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {executiveActionType === 'approve' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">
                    {executiveActionType === 'approve'
                      ? 'Executive Override: Direct Approval & Disbursement'
                      : 'Executive Override: Direct Rejection'}
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono">
                    Super Admin Direct Executive Authority Intervention
                  </p>
                </div>
              </div>
              <button onClick={() => setExecutiveActionDeposit(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Ticket Details */}
            <div className="p-3.5 rounded-2xl bg-[#18181f] border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Customer Account:</span>
                <span className="font-bold text-white">@{executiveActionDeposit.username} ({executiveActionDeposit.user_phone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Deposit Amount:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {executiveActionDeposit.amount.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Bank Channel & Ref:</span>
                <span className="font-mono text-zinc-200">
                  {executiveActionDeposit.payment_channel} ({executiveActionDeposit.reference_code})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Assigned Operations Admin:</span>
                <span className="font-mono text-amber-300">
                  @{executiveActionDeposit.assigned_admin_username || 'unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Elapsed Inactive Time:</span>
                <span className="font-mono font-black text-red-400 animate-pulse">
                  {formatElapsedTime(executiveActionDeposit.created_at).display}
                </span>
              </div>
            </div>

            {overrideSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                ✓ {overrideSuccess}
              </div>
            )}

            <form onSubmit={handleExecutiveOverrideConfirm} className="space-y-4">
              {executiveActionType === 'approve' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Direct Executive Balance Crediting</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    Because the assigned Operations Admin has remained unresponsive over the 15-minute SLA, clicking confirm will immediately credit {executiveActionDeposit.amount.toLocaleString()} ETB to Customer @{executiveActionDeposit.username}'s playable wallet balance and generate a financial ledger audit record.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-zinc-300 font-mono text-xs font-bold">
                    Audit Rejection Reason:
                  </label>
                  <textarea
                    rows={3}
                    value={executiveRejectReason}
                    onChange={e => setExecutiveRejectReason(e.target.value)}
                    required
                    placeholder="e.g. Unresponsive admin SLA intervention: Bank reference verified invalid / duplicate transaction slip."
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExecutiveActionDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExecutingOverride}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                    executiveActionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                  }`}
                >
                  {isExecutingOverride
                    ? 'Processing...'
                    : executiveActionType === 'approve'
                    ? 'Execute Direct Approval'
                    : 'Execute Direct Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
