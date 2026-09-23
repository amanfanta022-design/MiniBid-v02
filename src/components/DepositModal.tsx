import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  ArrowLeft,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Smartphone,
  Copy,
  Check,
  FileText,
  History,
  ShieldCheck,
} from 'lucide-react';
import { DepositRequest } from '../types.js';
import { playDepositApprovalChime } from '../utils/audio.js';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentChannel {
  id: string;
  name: string;
  account_name: string;
  account_number: string;
  branch?: string;
  instructions: string;
  badge: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('cbe');
  const [amount, setAmount] = useState<string>('500');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // File upload state with strict <= 5MB validation
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [receiptError, setReceiptError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  // Deposit history
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load channels
    fetch('/api/payments/channels')
      .then(res => res.json())
      .then(data => {
        if (data.channels) {
          setChannels(data.channels);
        }
      })
      .catch(() => {});

    loadDepositHistory();
  }, [isOpen]);

  const loadDepositHistory = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/payments/my-deposits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const currentChannelObj = channels.find(c => c.id === selectedChannel) || channels[0];

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelection = (file: File) => {
    setReceiptError('');

    // Strict 5MB limit check (5 * 1024 * 1024 bytes)
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setReceiptError(`File exceeds strict 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 5.0 MB.`);
      setReceiptFile(null);
      setReceiptPreview('');
      return;
    }

    setReceiptFile(file);

    // Read as Base64 Data URL for upload and immediate thumbnail preview
    const reader = new FileReader();
    reader.onload = e => {
      setReceiptPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!amount || parseFloat(amount) < 50) {
      setSubmitError('Minimum deposit is 50 ETB.');
      return;
    }

    if (!referenceCode.trim()) {
      setSubmitError('Bank transaction reference number / confirmation code is mandatory.');
      return;
    }

    if (!receiptPreview) {
      setSubmitError('Please attach a bank transfer receipt screenshot or PDF slip (max 5MB).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_channel: currentChannelObj?.name || selectedChannel,
          reference_code: referenceCode.trim(),
          receipt_url: receiptPreview,
          receipt_name: receiptFile?.name || 'bank_receipt.jpg',
          receipt_mime: receiptFile?.type || 'image/jpeg',
          receipt_size_bytes: receiptFile?.size || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit deposit request');
        if (data.is_flagged) {
          refreshUser();
        }
      } else {
        setSubmitSuccess('Deposit request submitted! Operations team will verify your receipt shortly.');
        playDepositApprovalChime();
        setReferenceCode('');
        setReceiptFile(null);
        setReceiptPreview('');
        refreshUser();
        loadDepositHistory();
      }
    } catch {
      setSubmitError('Network error while submitting deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-6 sm:p-8 text-zinc-100 my-8">
        {/* Top Navigation Row with Explicit Back Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272a]/60">
          <button
            id="deposit-back-btn"
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5B842]" />
            <span>← Back to Auctions</span>
          </button>

          <button
            id="close-deposit-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header & Tabs */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#121215] rounded-[10px] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#E5B842]" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-white tracking-wide">Wallet Deposit (Top-Up)</h2>
              <p className="text-xs text-zinc-400">Direct Ethiopian bank transfer & Telebirr integration</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
            <button
              id="deposit-tab-new"
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'new' ? 'bg-[#E5B842] text-black font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              New Deposit
            </button>
            <button
              id="deposit-tab-history"
              onClick={() => {
                setActiveTab('history');
                loadDepositHistory();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                activeTab === 'history' ? 'bg-[#E5B842] text-black font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Status Tracker ({deposits.length})
            </button>
          </div>
        </div>

        {activeTab === 'new' ? (
          <div>
            {/* Account Flagged Warning Banner */}
            {user?.is_flagged && (
              <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-500/70 text-xs text-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-300">Account Security Warning: Flagged for Duplicate Reference Reuse</p>
                  <p className="text-zinc-300 mt-1">
                    Your account has been flagged for multiple attempts to reuse verified transaction numbers.
                    Please submit only genuine, unsubmitted transaction receipts. Further unauthorized reuse will result in account suspension.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Select Channel */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                1. Select Payment Channel
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {channels.map(c => {
                  const isSelected = selectedChannel === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      id={`channel-btn-${c.id}`}
                      onClick={() => setSelectedChannel(c.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E5B842]/10 border-[#E5B842] text-white shadow-[0_0_12px_rgba(229,184,66,0.15)]'
                          : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {c.id === 'telebirr' ? (
                          <Smartphone className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Building2 className="w-4 h-4 text-[#E5B842]" />
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {c.id.toUpperCase()}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-zinc-200 line-clamp-1">{c.name.split('(')[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Official Account Information Banner */}
            {currentChannelObj && (
              <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-200">{currentChannelObj.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {currentChannelObj.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#09090b] border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Account Number / Merchant ID</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-white text-sm tracking-wide">
                        {currentChannelObj.account_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentChannelObj.account_number, 'acc_num')}
                        className="text-zinc-400 hover:text-white p-1"
                        title="Copy account number"
                      >
                        {copiedField === 'acc_num' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#09090b] border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Beneficiary Name</div>
                    <div className="font-semibold text-zinc-200 mt-1">{currentChannelObj.account_name}</div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 mt-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                  <span>{currentChannelObj.instructions}</span>
                </p>
              </div>
            )}

            {/* Step 2: Deposit Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Deposit Amount (ETB)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      step="50"
                      id="deposit-amount-input"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      placeholder="e.g. 500"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-[#E5B842]"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-mono text-zinc-500">ETB</span>
                  </div>
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-1.5 mt-2">
                    {['200', '500', '1000', '2500'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmount(p)}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer"
                      >
                        +{p} ETB
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    id="deposit-reference-input"
                    value={referenceCode}
                    onChange={e => setReferenceCode(e.target.value)}
                    required
                    placeholder="e.g. FT2426458921 or TB99401"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-[#E5B842]"
                  />
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Found on your bank SMS or mobile banking receipt slip
                  </span>
                </div>
              </div>

              {/* Strict <= 5MB Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Proof of Payment (Max 5.0 MB) *
                </label>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    receiptError
                      ? 'border-red-500/60 bg-red-950/10'
                      : receiptPreview
                      ? 'border-emerald-500/60 bg-emerald-950/10'
                      : 'border-zinc-700 hover:border-zinc-500 bg-[#18181b]/50'
                  }`}
                  onClick={() => document.getElementById('receipt-upload-input')?.click()}
                >
                  <input
                    type="file"
                    id="receipt-upload-input"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelection(e.target.files[0]);
                      }
                    }}
                  />

                  {receiptPreview ? (
                    <div className="flex items-center justify-center gap-4">
                      {receiptFile?.type?.includes('pdf') ? (
                        <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-red-400">
                          <FileText className="w-8 h-8" />
                        </div>
                      ) : (
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="w-16 h-16 object-cover rounded-lg border border-zinc-700 shadow-md"
                        />
                      )}
                      <div className="text-left">
                        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Receipt Attached</span>
                        </div>
                        <div className="text-[11px] text-zinc-300 max-w-[200px] truncate">{receiptFile?.name || 'Attached file'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {receiptFile ? `${(receiptFile.size / (1024 * 1024)).toFixed(2)} MB (Within 5MB limit)` : ''}
                        </div>
                        <span className="text-[10px] text-zinc-400 underline mt-1 block">Click to change file</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                      <div className="text-xs font-medium text-zinc-300">
                        Drag and drop your bank receipt image or <span className="text-[#E5B842]">browse files</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">PNG, JPG, or PDF (Strictly ≤ 5MB)</div>
                    </div>
                  )}
                </div>

                {receiptError && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{receiptError}</span>
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {submitError && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    submitError.includes('already used') || submitError.includes('FLAGGED')
                      ? 'bg-red-950/70 border-red-500/80 text-red-200 shadow-lg'
                      : 'bg-red-950/40 border-red-800/60 text-red-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span className="leading-relaxed font-medium">{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Action Buttons: Cancel/Back and Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  id="cancel-deposit-btn"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancel / Back
                </button>
                <button
                  type="submit"
                  id="submit-deposit-btn"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-[#E5B842] via-[#d4af37] to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Verifying & Submitting...' : 'Submit Deposit for Verification'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 3: Status Tracker */
          <div>
            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-zinc-500">Loading deposit transactions...</div>
            ) : deposits.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                <CreditCard className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                No deposit requests initiated yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {deposits.map(d => {
                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-mono">
                            {d.amount.toLocaleString()} ETB
                          </span>
                          <span className="text-zinc-400 text-[11px]">via {d.payment_channel}</span>
                        </div>

                        {d.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3 animate-spin" /> Pending Approval
                          </span>
                        )}

                        {d.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Approved & Credited
                          </span>
                        )}

                        {d.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold flex items-center gap-1 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                        <div>
                          <span className="text-zinc-500">Reference:</span>{' '}
                          <span className="font-mono text-zinc-300">{d.reference_code}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500">Date:</span>{' '}
                          <span>{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {d.status === 'rejected' && d.rejection_reason && (
                        <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-[11px] text-red-300">
                          <strong className="font-semibold text-red-400">Rejection Reason:</strong>{' '}
                          {d.rejection_reason}
                        </div>
                      )}

                      {d.status === 'approved' && d.reviewed_by && (
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Verified by operations agent: {d.reviewed_by} on{' '}
                          {d.reviewed_at ? new Date(d.reviewed_at).toLocaleDateString() : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back button on status tracker */}
            <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
              <button
                type="button"
                id="tracker-back-to-auctions-btn"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#E5B842]" />
                <span>Return to Auctions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
