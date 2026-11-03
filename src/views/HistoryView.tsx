import React, { useState, useEffect } from 'react';
import { Transaction, User } from '../types';
import { ApiService } from '../services/api';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Gift,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Zap,
  Info,
  Wifi,
  PhoneCall,
  Smartphone,
} from 'lucide-react';
import { soundService } from '../utils/sound';

interface HistoryViewProps {
  user: User | null;
  onRequireAuth: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user, onRequireAuth }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deposit' | 'withdrawal' | 'vtu'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await ApiService.getTransactionHistory(user.id);
      setTransactions(res.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const handleLiveSync = (e: any) => {
      if (e.detail?.transactions) {
        setTransactions(e.detail.transactions);
      }
    };
    const handleCreated = (e: any) => {
      if (e.detail && e.detail.id) {
        setTransactions((prev) => {
          if (prev.some((t) => t.id === e.detail.id)) return prev;
          return [e.detail, ...prev];
        });
      }
    };
    window.addEventListener('motorola_live_update', handleLiveSync);
    window.addEventListener('motorola_transaction_created', handleCreated);

    // Fast background refresh every 2.5s for instant status change
    const interval = setInterval(() => {
      if (user?.id) {
        ApiService.getTransactionHistory(user.id)
          .then((res) => {
            if (res && Array.isArray(res.transactions)) {
              setTransactions(res.transactions);
            }
          })
          .catch(() => {});
      }
    }, 2500);

    return () => {
      window.removeEventListener('motorola_live_update', handleLiveSync);
      window.removeEventListener('motorola_transaction_created', handleCreated);
      clearInterval(interval);
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4 bg-white border-2 border-sky-100 rounded-3xl shadow-lg shadow-sky-100/50 max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-amber-400 p-1 mx-auto shadow-md shadow-sky-200">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <History className="w-8 h-8 text-sky-600" />
          </div>
        </div>
        <h3 className="font-black text-lg text-slate-900">Sign In Required</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
          Sign in to inspect your live transaction progress, deposit confirmations, and instant withdrawal audits.
        </p>
        <button
          onClick={onRequireAuth}
          className="py-3 px-8 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white font-black text-xs shadow-lg shadow-sky-200 hover:from-sky-500 hover:to-blue-500 active:scale-95 transition-all cursor-pointer border border-sky-400"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'pending') if (tx.status !== 'pending') return false;
    if (filter === 'approved') if (tx.status !== 'approved') return false;
    if (filter === 'rejected') if (tx.status !== 'rejected') return false;
    if (filter === 'deposit') if (tx.type !== 'deposit') return false;
    if (filter === 'withdrawal') if (tx.type !== 'withdrawal') return false;
    if (filter === 'vtu') if (tx.type !== 'vtu_airtime' && tx.type !== 'vtu_data') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = tx.id.toLowerCase().includes(q);
      const matchType = tx.type.toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      const matchNote = tx.adminNote?.toLowerCase().includes(q) || false;
      return matchId || matchType || matchAmount || matchNote;
    }

    return true;
  });

  const toggleExpand = (id: string) => {
    soundService.playClick();
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  // Helper to render visual multi-step progress bar for each transaction
  const renderProgressBar = (tx: Transaction) => {
    const isApproved = tx.status === 'approved';
    const isPending = tx.status === 'pending';
    const isRejected = tx.status === 'rejected';

    let percent = isApproved ? 100 : isPending ? 65 : 100;
    let barColor = isApproved
      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
      : isPending
      ? 'bg-gradient-to-r from-amber-400 via-sky-400 to-amber-500 animate-pulse'
      : 'bg-gradient-to-r from-rose-500 to-red-600';

    return (
      <div className="space-y-2 mt-2 pt-2 border-t border-sky-100">
        <div className="flex items-center justify-between text-[10.5px]">
          <div className="flex items-center gap-1.5 font-bold">
            {isPending && (
              <span className="text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                Step 2 of 3: Bank & Gateway Audit in Progress
              </span>
            )}
            {isApproved && (
              <span className="text-emerald-700 flex items-center gap-1 font-black">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Step 3 of 3: Verified & Settled
              </span>
            )}
            {isRejected && (
              <span className="text-rose-700 flex items-center gap-1 font-black">
                <XCircle className="w-3 h-3 text-rose-600" />
                Verification Status: Rejected
              </span>
            )}
          </div>
          <span className="font-black text-slate-800">{percent}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-inner">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* 3 Step Visual Badges */}
        <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[9px] font-bold">
          {/* Step 1 */}
          <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✓ Submitted
          </div>
          {/* Step 2 */}
          <div
            className={`p-1 rounded-lg border ${
              isApproved
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isPending
                ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {isPending ? '⏳ Auditing...' : isApproved ? '✓ Verified' : '✗ Audit Failed'}
          </div>
          {/* Step 3 */}
          <div
            className={`p-1 rounded-lg border ${
              isApproved
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-black'
                : isPending
                ? 'bg-slate-50 text-slate-400 border-slate-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {isApproved ? '✓ Disbursed' : isPending ? '3. Settlement' : 'Declined'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-16 max-w-md mx-auto">
      {/* Top Banner - Milky Diamond White & Sky Blue & Gold Luxury Style */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-sky-50 to-amber-50/60 text-slate-900 shadow-xl shadow-sky-100/60 border-2 border-sky-200 relative overflow-hidden flex items-center justify-between">
        {/* Diamond Crystalline Glow Decor */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sky-800 text-xs font-black uppercase tracking-wider mb-1">
            <span className="p-1 rounded-lg bg-sky-100 border border-sky-300">
              <History className="w-3.5 h-3.5 text-sky-700" />
            </span>
            <span>Financial Statements</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Transaction Logs</h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Real-time visual progress & audit tracker
          </p>
        </div>

        <button
          onClick={() => {
            soundService.playClick();
            fetchHistory();
          }}
          className="relative z-10 p-3 rounded-2xl bg-white hover:bg-sky-50 text-sky-700 border-2 border-sky-200 shadow-md transition-all active:scale-95 cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by ID, amount, type, note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-sky-100 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 shadow-sm transition-colors"
        />
      </div>

      {/* Filter Tabs - Milky Diamond & Gold Pill Design */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white border-2 border-sky-100 shadow-xs">
        {(
          [
            { id: 'all', label: 'All Logs' },
            { id: 'pending', label: '⏳ Pending' },
            { id: 'approved', label: '✓ Verified' },
            { id: 'rejected', label: '✗ Rejected' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'vtu', label: 'Airtime & Data' },
          ] as const
        ).map((tab) => {
          const isSelected = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playClick();
                setFilter(tab.id as any);
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex-1 text-center min-w-[70px] ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* History Items - Diamond & Gold Styled Luxury Cards */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border-2 border-sky-100 text-center space-y-2 shadow-sm">
            <Info className="w-8 h-8 text-sky-500 mx-auto" />
            <h4 className="font-black text-sm text-slate-900">No Transactions Found</h4>
            <p className="text-xs text-slate-500 font-medium">
              No transaction history matched your selected filter.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isDeposit = tx.type === 'deposit';
            const isWithdrawal = tx.type === 'withdrawal';
            const isVtuData = tx.type === 'vtu_data';
            const isVtuAirtime = tx.type === 'vtu_airtime';
            const isEarning =
              tx.type === 'daily_earning' || tx.type === 'spin_win' || tx.type === 'welcome_bonus';
            const isExpanded = expandedTxId === tx.id;

            return (
              <div
                key={tx.id}
                className="p-4 rounded-3xl bg-white border-2 border-sky-100 shadow-md shadow-sky-100/60 hover:border-sky-300 transition-all text-slate-900 space-y-2 relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md ${
                        isDeposit
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-200'
                          : isWithdrawal
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 shadow-amber-200'
                          : isVtuData
                          ? 'bg-gradient-to-tr from-sky-600 to-blue-600 shadow-sky-200'
                          : isVtuAirtime
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-amber-200'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-200'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : isWithdrawal ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isVtuData ? (
                        <Wifi className="w-5 h-5" />
                      ) : isVtuAirtime ? (
                        <PhoneCall className="w-5 h-5 text-slate-950" />
                      ) : (
                        <Gift className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 capitalize tracking-tight">
                          {isVtuData ? 'Data Bundle' : isVtuAirtime ? 'Airtime Recharge' : tx.type.replace('_', ' ')}
                        </h4>
                        {/* Status Badge */}
                        {tx.status === 'approved' && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
                          </span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1 animate-pulse">
                            <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending
                          </span>
                        )}
                        {tx.status === 'rejected' && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 font-black px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                            <XCircle className="w-2.5 h-2.5 text-rose-600" /> Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                        REF: {tx.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-black text-sm sm:text-base ${
                        isDeposit || isEarning ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isWithdrawal ? '-' : '+'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {new Date(tx.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Visual Multi-Step Progress Bar */}
                {renderProgressBar(tx)}

                {/* Toggle Details Expand */}
                <div className="pt-2 flex items-center justify-between border-t border-sky-50 text-[10.5px]">
                  <span className="text-slate-600 font-semibold truncate max-w-[200px]">
                    {tx.adminNote ? `Note: ${tx.adminNote}` : 'PalmPay Gateway Verified'}
                  </span>

                  <button
                    onClick={() => toggleExpand(tx.id)}
                    className="flex items-center gap-1 font-black text-sky-700 hover:text-sky-800 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Audit'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded Detailed Audit Card */}
                {isExpanded && (
                  <div className="mt-2 p-3 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1.5 border-b border-sky-100 font-black text-[11px] text-sky-950">
                      <span>Transaction Audit Details</span>
                      <span className="text-amber-700">YAMAHA Engine</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-500 font-bold">Gateway:</span>
                        <p className="font-black text-slate-800">PalmPay Yield Engine v3</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Channel:</span>
                        <p className="font-black text-slate-800">Direct NIP / Bank Transfer</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Initiated:</span>
                        <p className="font-black text-slate-800">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Security Hash:</span>
                        <p className="font-mono text-slate-800 font-bold truncate">
                          sha256-{tx.id.replace('TX-', '')}09482
                        </p>
                      </div>
                    </div>

                    {/* VTU Specific Details if available */}
                    {(isVtuData || isVtuAirtime || tx.vtuPhone) && (
                      <div className="p-2.5 rounded-xl bg-white border border-sky-200 text-[10.5px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Network &amp; Plan:</span>
                          <span className="font-black text-slate-900">{tx.vtuNetwork || 'MTN'} • {tx.vtuPlan || 'Recharge'}</span>
                        </div>
                        {tx.vtuPhone && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Recipient Phone:</span>
                            <span className="font-mono font-black text-slate-900">{tx.vtuPhone}</span>
                          </div>
                        )}
                        {tx.senderAccountName && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Sender Name:</span>
                            <span className="font-bold text-slate-800">{tx.senderAccountName} ({tx.senderBankName || 'Bank'})</span>
                          </div>
                        )}
                        {tx.proofReference && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Transfer Ref:</span>
                            <span className="font-mono font-bold text-slate-800 truncate max-w-[170px]">{tx.proofReference}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {tx.adminNote && (
                      <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300 text-[10.5px] text-amber-950 font-bold">
                        Officer Memo: {tx.adminNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
