import React, { useState, useEffect } from 'react';
import { Investment, User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Lock,
  Calendar,
  AlertCircle,
  Users,
  Unlock,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';
import { DailyEarningsSparkline } from '../components/DailyEarningsSparkline';
import { AgentFeeModal } from '../components/AgentFeeModal';

interface InvestViewProps {
  user: User | null;
  adminSettings?: AdminSettings;
  onRequireAuth: () => void;
  onOpenReferral?: () => void;
  onUserUpdate?: (user: User) => void;
}

export const InvestView: React.FC<InvestViewProps> = ({
  user,
  adminSettings,
  onRequireAuth,
  onOpenReferral,
  onUserUpdate,
}) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showAgentFeeModal, setShowAgentFeeModal] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchInvestments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await ApiService.getUserInvestments(user.id);
      setInvestments(res.investments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen to external user update broadcasts
  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      if (e.detail && onUserUpdate) {
        onUserUpdate(e.detail);
      }
      fetchInvestments();
    };
    window.addEventListener('motorola_user_updated', handleUserUpdate);
    return () => window.removeEventListener('motorola_user_updated', handleUserUpdate);
  }, []);

  const handleCopyLink = () => {
    if (!user) return;
    soundService.playClick();
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/#ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4 bg-white border-2 border-sky-100 rounded-3xl shadow-lg max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-amber-400 p-1 mx-auto shadow-md">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-sky-600" />
          </div>
        </div>
        <h3 className="font-black text-base text-slate-900">Sign In Required</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
          Please sign in to inspect your active YAMAHA investment packages and 24-hour yield logs.
        </p>
        <button
          onClick={onRequireAuth}
          className="py-3 px-8 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white font-black text-xs shadow-lg shadow-sky-200 cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const completedInvestments = investments.filter((i) => i.status === 'completed');
  const isWithdrawalLocked = Boolean(user.withdrawalBanned || user.isBanned);

  return (
    <div className="space-y-4 pb-12 text-slate-900">
      {/* Header - Milky Diamond & Sky Blue */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-sky-50 to-amber-50/60 text-slate-900 shadow-xl shadow-sky-100/70 border-2 border-sky-200 flex items-center justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 text-sky-800 text-xs font-black uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-sky-600" /> My Active Portfolio
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Investment Records</h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            24-Hour Settlement Engine • 30-Day Permanent Term
          </p>
        </div>

        <button
          onClick={() => {
            soundService.playClick();
            fetchInvestments();
          }}
          className="p-3 rounded-2xl bg-white hover:bg-sky-50 text-sky-700 border-2 border-sky-200 shadow-md transition-all active:scale-95 cursor-pointer"
          title="Refresh Investments"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
        </button>
      </div>

      {/* USER REQUIREMENT: Withdrawal Lock / Suspended Alert Banner */}
      {isWithdrawalLocked && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/90 border-2 border-rose-300 text-rose-950 shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-200 text-rose-800 shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-rose-950">
                  Daily Earnings Paused (Withdrawal Locked)
                </h4>
                <span className="bg-rose-200 text-rose-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Payout On Hold
                </span>
              </div>
              <p className="text-xs font-semibold text-rose-900/90 mt-1 leading-relaxed">
                Your withdrawal is currently locked or suspended. Under YAMAHA security policy, <strong>you cannot receive daily dividend earnings</strong> from your active investments until you <strong>refer friends (and the friend must invest first)</strong> or <strong>pay the withdrawal agent fee of ₦2,100 via bank transfer only</strong> (home balance is not eligible).
              </p>
            </div>
          </div>

          {/* Action Buttons to Unlock */}
          <div className="pt-2 border-t border-rose-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenReferral) {
                  onOpenReferral();
                } else {
                  handleCopyLink();
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-100/70 border border-rose-300 text-rose-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {copiedRef ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Referral Link Copied!</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-rose-700" />
                  <span>Refer Friends (Must Invest)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                triggerHaptic(HapticPattern.BUTTON_CLICK);
                setShowAgentFeeModal(true);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-200 transition-transform active:scale-98 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Pay ₦2,100 Fee (Transfer Only)</span>
            </button>
          </div>
        </div>
      )}

      {/* 30-Day Permanent Contract System Policy Banner */}
      <div className="p-3.5 rounded-2xl bg-white border-2 border-sky-200 text-slate-900 shadow-xs text-xs space-y-1">
        <div className="flex items-center gap-2 text-amber-800 font-black">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Permanent 30-Day Investment Term & 24h Payout Guarantee</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
          Every investment product on YAMAHA is locked in the system financial engine for its full <strong className="text-amber-800 font-black">30-day duration</strong>. Daily dividend earnings are automatically credited to your wallet <strong className="text-emerald-700 font-black">every 24 hours</strong>.
        </p>
      </div>

      {/* Summary Box (Diamond & Gold Styled) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white border-2 border-sky-100 shadow-md shadow-sky-100/50 text-slate-900">
          <p className="text-[10px] font-black text-slate-500 uppercase">Active 30-Day Contracts</p>
          <p className="font-black text-xl text-amber-700 mt-0.5">{activeInvestments.length}</p>
        </div>
        <div className="p-4 rounded-3xl bg-white border-2 border-sky-100 shadow-md shadow-sky-100/50 text-slate-900">
          <p className="text-[10px] font-black text-slate-500 uppercase">Yield Earned So Far</p>
          <p className="font-black text-xl text-emerald-700 mt-0.5">
            ₦{investments.reduce((sum, i) => sum + i.totalEarnedSoFar, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* USER REQUIREMENT: Mini Sparkline Chart using Recharts for 7-Day Daily Earnings */}
      <DailyEarningsSparkline user={user} investments={investments} />

      {/* Active Investments List */}
      <div className="space-y-3">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" /> Active 30-Day Investments ({activeInvestments.length})
        </h3>

        {activeInvestments.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border-2 border-sky-100 text-center space-y-2 text-slate-900 shadow-sm">
            <Clock className="w-8 h-8 text-sky-500 mx-auto" />
            <p className="font-black text-sm text-slate-900">No Active Investment</p>
            <p className="text-xs text-slate-600 font-medium">
              Go to the <span className="font-black text-sky-700">Plan</span> tab to choose a VIP package and start earning daily for 30 days!
            </p>
          </div>
        ) : (
          activeInvestments.map((inv) => {
            const nextTime = inv.nextSettlementTimestamp;
            const remainingMs = Math.max(0, nextTime - now);
            const hours = Math.floor(remainingMs / (1000 * 60 * 60));
            const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

            const pad = (num: number) => String(num).padStart(2, '0');

            const cycleProgressPct = Math.min(
              100,
              Math.max(0, Math.round(((24 * 60 * 60 * 1000 - remainingMs) / (24 * 60 * 60 * 1000)) * 100))
            );

            const durationDays = inv.durationDays || 30;
            const overallProgressPct = Math.min(100, Math.round((inv.daysCompleted / durationDays) * 100));

            const payoutDate = new Date(nextTime);
            const formattedPayoutTime = payoutDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isPayoutDue = remainingMs <= 0;

            return (
              <div
                key={inv.id}
                className="p-4 rounded-3xl bg-white border-2 border-sky-100 hover:border-sky-300 shadow-md shadow-sky-100/60 space-y-3 text-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                      V{inv.planLevel}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-sm text-slate-900">{inv.planName}</h4>
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> 30D Lock
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">
                        Purchased: {new Date(inv.purchasedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isWithdrawalLocked ? (
                    <span className="bg-rose-100 text-rose-800 border border-rose-300 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-rose-600" />
                      Yield Paused (Withdrawal Locked)
                    </span>
                  ) : isPayoutDue ? (
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                      <Sparkles className="w-3 h-3 text-slate-950" />
                      Crediting 24h Yield...
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      24h Payout Active
                    </span>
                  )}
                </div>

                {/* 30-Day Overall Contract Lifetime Progress */}
                <div className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span className="flex items-center gap-1 font-black">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Contract Progress: {inv.daysCompleted} / {durationDays} Days Completed
                    </span>
                    <span className="text-emerald-700 font-mono font-black">
                      {overallProgressPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${overallProgressPct}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                    <span>Day {inv.daysCompleted} Payouts Received</span>
                    <span>{Math.max(0, durationDays - inv.daysCompleted)} Days Remaining</span>
                  </div>
                </div>

                {/* Digital Countdown Timer Box (24-Hour Cycle) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white via-sky-50 to-amber-50/40 text-slate-900 border-2 border-sky-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 flex items-center gap-1.5 font-black">
                      <Clock className="w-4 h-4 text-sky-600 animate-spin" style={{ animationDuration: '4s' }} />
                      Next 24h Daily Yield Payout:
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${
                      isWithdrawalLocked
                        ? 'text-rose-800 bg-rose-100 border-rose-300'
                        : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                    }`}>
                      {isWithdrawalLocked ? 'Paused' : `+₦${inv.dailyEarning.toLocaleString()}`}
                    </span>
                  </div>

                  {/* If withdrawal is locked notice */}
                  {isWithdrawalLocked && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Daily payout on hold. Refer friends or pay ₦1,600 agent fee to unlock.</span>
                    </div>
                  )}

                  {/* Countdown Digital Cards */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="flex flex-col items-center">
                      <div className="bg-white border-2 border-sky-200 rounded-xl px-2.5 py-1.5 min-w-[42px] text-center shadow-xs">
                        <span className="font-mono text-lg font-black text-sky-900 tracking-wider">
                          {pad(hours)}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Hours</span>
                    </div>

                    <span className="font-mono text-lg font-black text-sky-600 -mt-3">:</span>

                    <div className="flex flex-col items-center">
                      <div className="bg-white border-2 border-sky-200 rounded-xl px-2.5 py-1.5 min-w-[42px] text-center shadow-xs">
                        <span className="font-mono text-lg font-black text-sky-900 tracking-wider">
                          {pad(mins)}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Mins</span>
                    </div>

                    <span className="font-mono text-lg font-black text-sky-600 -mt-3">:</span>

                    <div className="flex flex-col items-center">
                      <div className="bg-white border-2 border-sky-200 rounded-xl px-2.5 py-1.5 min-w-[42px] text-center shadow-xs">
                        <span className="font-mono text-lg font-black text-sky-900 tracking-wider">
                          {pad(secs)}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Secs</span>
                    </div>
                  </div>

                  {/* Progress Bar & Target Time */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-500 transition-all duration-1000 shadow-sm"
                        style={{ width: `${cycleProgressPct}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                      <span>24h Cycle: {cycleProgressPct}%</span>
                      <span>Target: {formattedPayoutTime}</span>
                    </div>
                  </div>
                </div>

                {/* Investment Metrics Details */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-sky-50/50 p-2.5 rounded-2xl border border-sky-200">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black">Capital</p>
                    <p className="font-black text-slate-900">₦{inv.capital.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black">Daily Return</p>
                    <p className="font-black text-emerald-700">+₦{inv.dailyEarning.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black">Total 30D Return</p>
                    <p className="font-black text-amber-700 font-mono">
                      ₦{inv.totalInvestment.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Permanent Contract Policy Notice */}
                <div className="px-2 pt-1 flex items-center justify-between text-[10px] text-slate-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" /> 30-Day Protected Contract
                  </span>
                  <span className="text-emerald-700 font-black">
                    Earned: ₦{inv.totalEarnedSoFar.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Investments */}
      {completedInvestments.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed 30-Day Contracts ({completedInvestments.length})
          </h3>

          <div className="space-y-2">
            {completedInvestments.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl bg-white border-2 border-sky-100 flex items-center justify-between text-xs text-slate-900 shadow-xs"
              >
                <div>
                  <p className="font-black text-slate-900">{inv.planName}</p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Earned total: ₦{inv.totalEarnedSoFar.toLocaleString()} (Full 30-Day Yield Paid)
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matured (30 Days)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Fee Payment Modal */}
      <AgentFeeModal
        isOpen={showAgentFeeModal}
        onClose={() => setShowAgentFeeModal(false)}
        user={user}
        adminSettings={adminSettings}
        onSuccess={(updatedUser) => {
          if (onUserUpdate) onUserUpdate(updatedUser);
          fetchInvestments();
        }}
        onOpenReferral={onOpenReferral}
      />
    </div>
  );
};
