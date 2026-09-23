import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Sparkles, RefreshCw, Trophy } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimBid {
  id: string;
  name: string;
  amount: number;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  // Interactive test simulator state
  const [simBids, setSimBids] = useState<SimBid[]>([
    { id: '1', name: 'Bidder Alpha', amount: 1.01 },
    { id: '2', name: 'Bidder Beta', amount: 1.01 }, // duplicate!
    { id: '3', name: 'Bidder Gamma', amount: 1.04 }, // unique & lowest unique!
    { id: '4', name: 'Bidder Delta', amount: 1.07 },
    { id: '5', name: 'Bidder Epsilon', amount: 1.07 }, // duplicate!
    { id: '6', name: 'Bidder Zeta', amount: 2.15 },
  ]);

  const [testAmount, setTestAmount] = useState('1.02');
  const [testName, setTestName] = useState('You');

  if (!isOpen) return null;

  // Calculate uniqueness in simulator
  const amountCounts: Record<number, number> = {};
  simBids.forEach(b => {
    const amt = Number(b.amount.toFixed(2));
    amountCounts[amt] = (amountCounts[amt] || 0) + 1;
  });

  const uniqueAmounts = Object.keys(amountCounts)
    .map(Number)
    .filter(amt => amountCounts[amt] === 1)
    .sort((a, b) => a - b);

  const winningAmount = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;

  const handleAddSimBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(testAmount);
    if (isNaN(val) || val <= 0) return;

    setSimBids(prev => [
      ...prev,
      {
        id: `sim_${Date.now()}`,
        name: testName || 'You',
        amount: Number(val.toFixed(2)),
      },
    ]);
    setTestAmount('');
  };

  const handleResetSim = () => {
    setSimBids([
      { id: '1', name: 'Bidder Alpha', amount: 1.01 },
      { id: '2', name: 'Bidder Beta', amount: 1.01 },
      { id: '3', name: 'Bidder Gamma', amount: 1.04 },
      { id: '4', name: 'Bidder Delta', amount: 1.07 },
      { id: '5', name: 'Bidder Epsilon', amount: 1.07 },
      { id: '6', name: 'Bidder Zeta', amount: 2.15 },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-6 sm:p-8 text-zinc-100 my-8">
        <button
          id="close-how-it-works-btn"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E5B842]/20 border border-[#E5B842]/40 flex items-center justify-center text-[#E5B842]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-white tracking-wide">
              How the Lowest Unique Bid Mechanism Works
            </h2>
            <p className="text-xs text-zinc-400">Game-theory strategy, hidden bids, and verified fairness</p>
          </div>
        </div>

        {/* The 3 Core Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a]">
            <div className="text-[#E5B842] font-mono text-xs font-bold mb-1">RULE 1</div>
            <h3 className="font-semibold text-sm text-zinc-200 mb-1">Participation Fee</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every bid placed incurs a nominal fixed participation fee (e.g. 30 ETB) deducted from your wallet balance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a]">
            <div className="text-[#E5B842] font-mono text-xs font-bold mb-1">RULE 2</div>
            <h3 className="font-semibold text-sm text-zinc-200 mb-1">Strict Uniqueness</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If two or more bidders submit the exact same numerical bid amount (e.g. 1.01 ETB), that bid is disqualified from winning.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a]">
            <div className="text-[#E5B842] font-mono text-xs font-bold mb-1">RULE 3</div>
            <h3 className="font-semibold text-sm text-zinc-200 mb-1">The Lowest Survives</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When the countdown expires, the lowest bid placed by exactly ONE bidder wins the item at that tiny bid price!
            </p>
          </div>
        </div>

        {/* Visual Comparison Example */}
        <div className="p-5 rounded-xl bg-[#18181b] border border-amber-500/20 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#E5B842]" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Real Scenario Example: Why 1.04 ETB Beats 1.01 ETB
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-800/40 text-red-300">
              <div className="font-bold text-red-400">1.01 ETB (2 Bids)</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Aman & Selam both bid 1.01. Because 2 people bid this amount, it is <span className="text-red-400 font-semibold">DUPLICATE</span> and cannot win.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>1.04 ETB (1 Bid)</span>
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-zinc-300 mt-1">
                Dawit placed 1.04 ETB. It is unique and is the <span className="text-emerald-400 font-bold">LOWEST UNIQUE BID</span>. Dawit wins an iPhone for 1.04 ETB!
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300">
              <div className="font-bold text-zinc-300">1.09 ETB (1 Bid)</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Unique, but higher than Dawit's 1.04 ETB. Status: <span className="text-amber-400">Unique but not lowest</span>.
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Bid Simulator */}
        <div className="p-5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Interactive Strategy Simulator</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Live Engine
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Add test bids below to see how the status dynamically shifts</p>
            </div>
            <button
              onClick={handleResetSim}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-[#18181b] border border-[#27272a]"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Input form */}
          <form onSubmit={handleAddSimBid} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Bidder Name"
              value={testName}
              onChange={e => setTestName(e.target.value)}
              className="w-1/3 px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842]"
            />
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Bid ETB (e.g. 1.02)"
              value={testAmount}
              onChange={e => setTestAmount(e.target.value)}
              className="w-1/3 px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-[#E5B842] font-mono"
            />
            <button
              type="submit"
              className="w-1/3 px-3 py-2 rounded-lg bg-[#E5B842] hover:bg-[#d4a836] text-black font-semibold text-xs transition-all cursor-pointer"
            >
              Simulate Bid
            </button>
          </form>

          {/* Current simulation feed */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {simBids.map(b => {
              const amt = Number(b.amount.toFixed(2));
              const count = amountCounts[amt];
              const isUnique = count === 1;
              const isWinner = isUnique && amt === winningAmount;

              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                    isWinner
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold'
                      : !isUnique
                      ? 'bg-red-950/20 border-red-900/40 text-zinc-400'
                      : 'bg-[#18181b] border-[#27272a] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{b.name}</span>
                    <span className="font-mono text-zinc-400">{b.amount.toFixed(2)} ETB</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isWinner ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Unique & Lowest (Winning!)
                      </span>
                    ) : !isUnique ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center gap-1 font-mono">
                        <AlertCircle className="w-3 h-3" /> Duplicate ({count} bidders)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                        Unique but not lowest
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-zinc-400 flex items-center justify-between border-t border-[#27272a] pt-2">
            <span>
              Current Winning Price:{' '}
              <strong className="text-[#E5B842] font-mono">
                {winningAmount !== null ? `${winningAmount.toFixed(2)} ETB` : 'No unique bids yet'}
              </strong>
            </span>
            <span>Total simulated bids: {simBids.length}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Got It, Back to Auctions
          </button>
        </div>
      </div>
    </div>
  );
};
