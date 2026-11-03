import React, { useState, useEffect, useMemo } from 'react';
import { Investment, User, Transaction } from '../types';
import { ApiService } from '../services/api';
import { TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from 'recharts';

interface DailyEarningsSparklineProps {
  user: User;
  investments: Investment[];
}

interface DayEarningsPoint {
  day: string;
  date: string;
  fullDate: string;
  earnings: number;
  isToday: boolean;
  status: 'active' | 'paused' | 'zero';
}

export const DailyEarningsSparkline: React.FC<DailyEarningsSparklineProps> = ({
  user,
  investments,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTxHistory = async () => {
      try {
        setLoading(true);
        const res = await ApiService.getTransactionHistory(user.id);
        if (isMounted && res && Array.isArray(res.transactions)) {
          setTransactions(res.transactions);
        }
      } catch (err) {
        // Silently fallback if offline or no transactions yet
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadTxHistory();
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const isWithdrawalLocked = Boolean(user.withdrawalBanned || user.isBanned);

  // Compute 7-day daily earnings data
  const chartData: DayEarningsPoint[] = useMemo(() => {
    const points: DayEarningsPoint[] = [];
    const now = new Date();
    const activeInvs = investments.filter((i) => i.status === 'active');
    const totalActiveDailyYield = activeInvs.reduce((sum, i) => sum + (i.dailyEarning || 0), 0);

    // Build array for past 7 days (day 6 down to 0)
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dateNum = String(targetDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dateNum}`;

      const dayShort = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isToday = i === 0;

      // Match actual daily_earning transactions on this date
      const dayEarningsFromTx = transactions
        .filter((tx) => {
          if (tx.type !== 'daily_earning' || tx.status !== 'approved') return false;
          const txDate = new Date(tx.createdAt);
          const txYear = txDate.getFullYear();
          const txMonth = String(txDate.getMonth() + 1).padStart(2, '0');
          const txDateNum = String(txDate.getDate()).padStart(2, '0');
          return `${txYear}-${txMonth}-${txDateNum}` === dateKey;
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      let dayEarnings = dayEarningsFromTx;

      // If no stored transactions for this day yet, but user has active investments running
      if (dayEarnings === 0 && totalActiveDailyYield > 0) {
        // Check if any active investment was purchased on or before this date
        const eligibleInvs = activeInvs.filter((inv) => {
          const pTime = new Date(inv.purchasedAt).getTime();
          return pTime <= targetDate.getTime() + 24 * 60 * 60 * 1000;
        });
        const theoreticalYield = eligibleInvs.reduce((sum, inv) => sum + inv.dailyEarning, 0);

        // If today and withdrawal is locked, earnings are paused
        if (isToday && isWithdrawalLocked) {
          dayEarnings = 0;
        } else if (theoreticalYield > 0) {
          // If contract has completed days covering this period
          const minDaysCompleted = Math.max(...eligibleInvs.map((inv) => inv.daysCompleted || 0));
          if (minDaysCompleted >= 7 - i || isToday) {
            dayEarnings = theoreticalYield;
          }
        }
      }

      const status: 'active' | 'paused' | 'zero' =
        isToday && isWithdrawalLocked && totalActiveDailyYield > 0
          ? 'paused'
          : dayEarnings > 0
          ? 'active'
          : 'zero';

      points.push({
        day: isToday ? 'Today' : dayShort,
        date: dateLabel,
        fullDate: targetDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        earnings: dayEarnings,
        isToday,
        status,
      });
    }

    return points;
  }, [investments, transactions, isWithdrawalLocked]);

  const total7Days = chartData.reduce((sum, p) => sum + p.earnings, 0);
  const avgDaily = Math.round(total7Days / 7);
  const peakDaily = Math.max(...chartData.map((p) => p.earnings), 0);

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayEarningsPoint;
      return (
        <div className="p-2.5 rounded-xl bg-slate-900/95 text-white shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[140px]">
          <p className="text-[10px] text-slate-400 font-bold uppercase">{data.fullDate}</p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-slate-300 text-[11px]">Daily Yield:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              ₦{data.earnings.toLocaleString()}
            </span>
          </div>
          {data.status === 'paused' && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-300 font-bold">
              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Yield Paused (Withdrawal Locked)</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 rounded-3xl bg-white border-2 border-sky-100 hover:border-sky-200 shadow-md shadow-sky-100/50 space-y-3 transition-all">
      {/* Top Header & Stat Chips */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sky-800 text-xs font-black uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>Daily Earnings Progress</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Past 7-Day Performance • 24h Yield Engine
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {isWithdrawalLocked ? (
            <span className="bg-rose-100 text-rose-800 border border-rose-300 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Yield Paused
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Sync
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-sky-100/80">
        <div className="bg-sky-50/50 p-2 rounded-2xl border border-sky-100">
          <p className="text-[9px] font-black text-slate-500 uppercase">7-Day Total</p>
          <p className="font-black text-xs sm:text-sm text-emerald-700 font-mono mt-0.5">
            ₦{total7Days.toLocaleString()}
          </p>
        </div>
        <div className="bg-sky-50/50 p-2 rounded-2xl border border-sky-100">
          <p className="text-[9px] font-black text-slate-500 uppercase">Daily Avg</p>
          <p className="font-black text-xs sm:text-sm text-sky-800 font-mono mt-0.5">
            ₦{avgDaily.toLocaleString()}
          </p>
        </div>
        <div className="bg-sky-50/50 p-2 rounded-2xl border border-sky-100">
          <p className="text-[9px] font-black text-slate-500 uppercase">Peak Day</p>
          <p className="font-black text-xs sm:text-sm text-amber-700 font-mono mt-0.5">
            ₦{peakDaily.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recharts Mini Sparkline Area Chart */}
      <div className="w-full h-28 min-h-[110px] pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="earningsSparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#0284c7"
              strokeWidth={2.5}
              fill="url(#earningsSparklineGradient)"
              dot={{ r: 3, fill: '#0284c7', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 5, fill: '#0369a1', strokeWidth: 2, stroke: '#ffffff' }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Automatic 24-hour yield compounding</span>
        </span>
        <span className="text-slate-400">7-Day Rolling Window</span>
      </div>
    </div>
  );
};
