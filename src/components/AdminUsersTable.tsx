import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../utils/i18n.js';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Coins,
  Phone,
  PhoneCall,
  Copy,
  Check,
  Send,
  MessageSquare,
  AlertTriangle,
  ShieldOff,
  X,
} from 'lucide-react';
import { User } from '../types.js';

interface AdminUsersTableProps {
  onOpenBalanceAdjust?: (user: User) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ onOpenBalanceAdjust }) => {
  const { token, user: currentUser } = useAuth();
  const { language, t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>('');

  // Contact / Message Modal state (Requirement 7)
  const [contactUser, setContactUser] = useState<User | null>(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<string>('');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

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

  const handleCopyPhone = (phone: string, userId: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(userId);
    setFeedback(`${phone} ${language === 'am' ? 'ተቀድቷል' : 'copied to clipboard'}`);
    setTimeout(() => {
      setCopiedPhoneId(null);
      setFeedback('');
    }, 3000);
  };

  // Requirement 7: Admin / Super Admin send direct in-app message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactUser || !messageTitle.trim() || !messageBody.trim()) return;

    setIsSendingMessage(true);
    setMessageStatus('');
    try {
      const res = await fetch(`/api/admin/users/${contactUser.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: messageTitle.trim(),
          message: messageBody.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessageStatus(language === 'am' ? 'መልእክቱ ለተጠቃሚው ተልኳል!' : 'Message delivered to user dashboard!');
        setTimeout(() => {
          setContactUser(null);
          setMessageTitle('');
          setMessageBody('');
          setMessageStatus('');
        }, 1500);
      } else {
        setMessageStatus(data.error || 'Failed to send message.');
      }
    } catch {
      setMessageStatus('Network error while delivering message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Requirement 7: Search users by profile info (username, phone, id, role)
  const filtered = users
    .filter(u => u.role !== 'superadmin')
    .filter(u => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
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
            <span>{language === 'am' ? 'የተጠቃሚዎች ማውጫ እና አስተዳደር' : 'Customer Directory & Governance'}</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">
            {language === 'am' ? 'የተመዘገቡ ተጠቃሚዎች ዝርዝር' : 'Active Users Ledger'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'am'
              ? 'ተጠቃሚዎችን በስልክ ቁጥር ወይም በተጠቃሚ ስም ይፈልጉ፣ በቀጥታ ያነጋግሩ ወይም የኪስ ቦርሳቸውን ይቆጣጠሩ።'
              : 'Search registered platform participants by phone or username, contact directly, and monitor account access.'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">
            {language === 'am' ? 'ጠቅላላ ተጠቃሚዎች' : 'Total Registered'}
          </div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{users.length} Users</div>
        </div>
      </div>

      {/* Search & Actions (Requirement 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={
              language === 'am'
                ? 'በተጠቃሚ ስም፣ በስልክ ቁጥር (+251/09/07) ወይም በID ፈልግ...'
                : 'Search by username, phone (+251/09/07), or user ID...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121215] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
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
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">
                {flaggedUsersCount} {language === 'am' ? 'ተጠቃሚዎች በደህንነት ቁጥጥር ሥር ናቸው' : 'Account(s) Flagged for Security Auditing'}
              </span>
              <p className="text-[11px] text-red-300/80 mt-0.5">
                {language === 'am'
                  ? 'ተጠቃሚዎች የፀደቁ የትራንዛክሽን ቁጥሮችን ዳግም ለመጠቀም ሲሞክሩ ተለይተዋል።'
                  : 'Accounts triggered audit review for submitted duplicate transaction reference attempts.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">
          {language === 'am' ? 'የተጠቃሚዎች ዝርዝር በመጫን ላይ...' : 'Loading user directory...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#27272a]">
          {language === 'am' ? 'ምንም የሚመሳሰል ተጠቃሚ አልተገኘም' : 'No users found matching query.'}
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">{language === 'am' ? 'ተጠቃሚ' : 'User'}</th>
                  <th className="p-3.5">{language === 'am' ? 'ሚና' : 'Role'}</th>
                  <th className="p-3.5">{language === 'am' ? 'ስልክ / አድራሻ' : 'Contact Details'}</th>
                  <th className="p-3.5">{language === 'am' ? 'ቀሪ ሒሳብ' : 'Wallet Balance'}</th>
                  <th className="p-3.5">{language === 'am' ? 'ሁኔታ' : 'Status'}</th>
                  <th className="p-3.5">{language === 'am' ? 'የተመዘገበበት' : 'Registered'}</th>
                  <th className="p-3.5 pr-5 text-right">{language === 'am' ? 'እርምጃዎች' : 'Actions & Contact'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60">
                {filtered.map(u => {
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>@{u.username}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3.5 space-y-1 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-200 font-medium">{u.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(u.phone, u.id)}
                            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Copy Phone"
                          >
                            {copiedPhoneId === u.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
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
                            title={u.flag_reason || 'Flagged for attempting to reuse transaction reference'}
                          >
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                            <span>Flagged ({u.duplicate_txn_attempts || 3}x)</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-zinc-400 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-3.5 pr-5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Requirement 7: Contact / Message User Trigger */}
                        <button
                          type="button"
                          onClick={() => setContactUser(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all"
                          title="Contact or Send Message to User"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'መልእክት / አግኝ' : 'Contact'}</span>
                        </button>

                        <a
                          href={`tel:${u.phone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                          title="Call User"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'ደውል' : 'Call'}</span>
                        </a>

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
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#E5B842] border border-[#E5B842]/30 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Float</span>
                          </button>
                        )}

                        {/* Toggle active / suspended */}
                        {u.role !== 'superadmin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all ${
                              isActive
                                ? 'bg-zinc-800 hover:bg-red-950/40 text-zinc-300 hover:text-red-400'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400'
                            }`}
                          >
                            {isActive ? (
                              language === 'am' ? 'አግድ' : 'Suspend'
                            ) : (
                              language === 'am' ? 'አንሳ' : 'Activate'
                            )}
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

      {/* Requirement 7: Contact / Direct In-App Message Modal */}
      {contactUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-zinc-100 shadow-2xl">
            <button
              onClick={() => {
                setContactUser(null);
                setMessageStatus('');
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-white text-lg">
                  {language === 'am' ? `ተጠቃሚ @${contactUser.username} ማነጋገሪያ` : `Contact User @${contactUser.username}`}
                </h3>
                <p className="text-xs text-zinc-400">
                  {language === 'am' ? 'በስልክ ይደውሉ ወይም ቀጥታ መልእክት ወደ ዳሽቦርዳቸው ይላኩ' : 'Call via phone or send an in-app message to their dashboard'}
                </p>
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase">
                  {language === 'am' ? 'የተጠቃሚው ስልክ ቁጥር' : 'Phone Number'}
                </div>
                <div className="font-mono font-bold text-sm text-[#E5B842] mt-0.5">{contactUser.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPhone(contactUser.phone, contactUser.id)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'ቅዳ' : 'Copy'}</span>
                </button>
                <a
                  href={`tel:${contactUser.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold flex items-center gap-1.5 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'ደውል' : 'Call'}</span>
                </a>
              </div>
            </div>

            {/* In-App Direct Message Form */}
            <form onSubmit={handleSendMessage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  {language === 'am' ? 'የመልእክቱ ርዕስ *' : 'Message Subject *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'am' ? 'ምሳሌ፦ ስለ ጨረታ ማብራሪያ' : 'e.g. Winner Prize Claim Instructions or Account Verification'}
                  value={messageTitle}
                  onChange={e => setMessageTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  {language === 'am' ? 'የመልእክቱ ዝርዝር *' : 'Message Body *'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    language === 'am'
                      ? 'የሚልኩትን መልእክት እዚህ ይፃፉ። ይሄ መልእክት በቀጥታ በተጠቃሚው ዳሽቦርድ ላይ ይታያል።'
                      : 'Write your message here. It will immediately appear in the user’s dashboard notifications.'
                  }
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#18181b] border border-[#27272a] text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {messageStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    messageStatus.includes('delivered') || messageStatus.includes('ተልኳል')
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/40 border border-red-500/40 text-red-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{messageStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  {language === 'am' ? 'ዝጋ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingMessage ? (language === 'am' ? 'በመላክ ላይ...' : 'Sending...') : (language === 'am' ? 'መልእክት ላክ' : 'Send Message')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
