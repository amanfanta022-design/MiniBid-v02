import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Lock,
  Download,
  Coins,
  Receipt,
  Layers,
} from 'lucide-react';
import { FinancialReport, AuctionPnL } from '../types.js';

export const SuperAdminFinancials: React.FC = () => {
  const { token } = useAuth();
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinancials = async (range: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/superadmin/financials?filter=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials(dateRange);
  }, [dateRange, token]);

  const handleExportCSV = () => {
    if (!report || !report.auctions_pnl) return;

    const headers = [
      'Auction ID',
      'Title',
      'Category',
      'Status',
      'Confidential Cost (ETB)',
      'Total Bids',
      'Total Fees (ETB)',
      'Winning Bid (ETB)',
      'Gross Revenue (ETB)',
      'Net Profit/Loss (ETB)',
    ];

    const rows = report.auctions_pnl.map((item: AuctionPnL) => [
      item.auction_id,
      `"${item.title.replace(/"/g, '""')}"`,
      item.category,
      item.status,
      item.confidential_cost.toFixed(2),
      item.total_bids,
      item.total_fees_collected.toFixed(2),
      item.winning_bid_amount.toFixed(2),
      item.gross_revenue.toFixed(2),
      item.net_profit_loss.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `minibid_pnl_report_${dateRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#121215] to-[#121215] border border-[#E5B842]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#E5B842] font-mono text-xs uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Chief Executive & Financial Auditor Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            Platform Financials & P&L Reports
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Real-time reconciliation of user deposits, participation fee revenue, and confidential item acquisition costs.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a] text-xs">
            {(['all', 'today', 'week', 'month'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  dateRange === d
                    ? 'bg-[#E5B842] text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d === 'all' ? 'All Time' : d === 'today' ? 'Today' : d === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Approved Deposits */}
          <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Total Approved Deposits</span>
              <Receipt className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {report.total_approved_deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-zinc-400">ETB</span>
            </div>
            <p className="text-[11px] text-zinc-500">Total liquid capital credited via CBE & Telebirr</p>
          </div>

          {/* Card 2: Total Gross Bidding Revenue */}
          <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Bidding Gross Revenue</span>
              <Coins className="w-4 h-4 text-[#E5B842]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#E5B842]">
              {report.total_bidding_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-zinc-400">ETB</span>
            </div>
            <p className="text-[11px] text-zinc-500">Participation fees + winning bid amounts</p>
          </div>

          {/* Card 3: Confidential Item Acquisition Costs */}
          <div className="p-5 rounded-2xl bg-[#121215] border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Confidential Item Costs
              </span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-200">
              {report.total_confidential_costs.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-zinc-400">ETB</span>
            </div>
            <p className="text-[11px] text-zinc-500">Wholesale expenses (hidden from customers)</p>
          </div>

          {/* Card 4: Platform Net Profit / Loss */}
          <div
            className={`p-5 rounded-2xl border space-y-2 ${
              report.net_profit_loss >= 0
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-red-950/20 border-red-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                Platform Net Profit / Loss
              </span>
              {report.net_profit_loss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                report.net_profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {report.net_profit_loss >= 0 ? '+' : ''}
              {report.net_profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-zinc-400">ETB</span>
            </div>
            <p className="text-[11px] text-zinc-400">Total Bidding Revenue − Item Wholesale Costs</p>
          </div>
        </div>
      )}

      {/* Per-Auction P&L Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-serif text-white uppercase tracking-wider">
            Per-Auction Profit & Loss Breakdown
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {report?.auctions_pnl?.length || 0} Auctions Analyzed
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-zinc-500">Calculating financial audit...</div>
        ) : !report || report.auctions_pnl.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#27272a]">
            No auction activity recorded within selected date filter.
          </div>
        ) : (
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#18181b]/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Auction Item</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-amber-300">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Item Cost
                      </span>
                    </th>
                    <th className="p-3.5">Bids Placed</th>
                    <th className="p-3.5">Fee Revenue</th>
                    <th className="p-3.5">Winning Bid</th>
                    <th className="p-3.5">Gross Revenue</th>
                    <th className="p-3.5 pr-5 text-right">Net Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/60">
                  {report.auctions_pnl.map((item: AuctionPnL) => {
                    const isProfitable = item.net_profit_loss >= 0;

                    return (
                      <tr key={item.auction_id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3.5 pl-5 font-semibold text-white max-w-[200px] truncate">
                          {item.title}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                              item.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Confidential wholesale cost */}
                        <td className="p-3.5 font-mono text-amber-300 font-medium">
                          {item.confidential_cost.toLocaleString()} ETB
                        </td>

                        <td className="p-3.5 font-mono text-zinc-300">
                          {item.total_bids}
                        </td>

                        <td className="p-3.5 font-mono text-zinc-200">
                          {item.total_fees_collected.toLocaleString()} ETB
                        </td>

                        <td className="p-3.5 font-mono text-zinc-400">
                          {item.winning_bid_amount ? `${item.winning_bid_amount.toFixed(2)} ETB` : '—'}
                        </td>

                        <td className="p-3.5 font-mono font-semibold text-[#E5B842]">
                          {item.gross_revenue.toLocaleString()} ETB
                        </td>

                        <td className="p-3.5 pr-5 text-right font-mono font-bold text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-lg ${
                              isProfitable
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {isProfitable ? '+' : ''}
                            {item.net_profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            ETB
                          </span>
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
    </div>
  );
};
