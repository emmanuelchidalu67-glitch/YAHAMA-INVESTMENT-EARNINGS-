import React from 'react';
import { Crown, Sparkles, TrendingUp, Check, ShieldCheck, ArrowRight, Lock, Calendar } from 'lucide-react';
import { VIPPlan, User } from '../types';

interface PlanViewProps {
  vipPlans: VIPPlan[];
  user: User | null;
  onSelectPlan: (plan: VIPPlan) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  vipPlans,
  user,
  onSelectPlan,
}) => {
  return (
    <div className="space-y-4 pb-12 text-slate-900">
      {/* Top Banner - Milky Diamond & Sky Blue with Gold Accents */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-sky-50 to-amber-50/60 text-slate-900 shadow-xl shadow-sky-100/70 border-2 border-sky-200 relative overflow-hidden">
        <div className="flex items-center gap-2 text-sky-800 text-xs font-black uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-amber-500" /> YAMAHA Official VIP Packages
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Guaranteed Daily Income Plans</h2>
        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
          Select from VIP 1 to VIP 10. Each investment remains active for a <strong className="text-amber-800 font-black">30-day contract term</strong> with automated daily yields credited directly to your balance <strong className="text-emerald-700 font-black">every 24 hours</strong>.
        </p>
      </div>

      {/* 30-Day Permanent Policy Badge */}
      <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 flex items-center gap-2.5 text-xs font-bold shadow-xs">
        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        <span>30-Day Contract Protection: Active products earn guaranteed returns around the clock.</span>
      </div>

      {/* Plan Cards List (VIP 1 to VIP 10) */}
      <div className="space-y-3.5">
        {vipPlans.map((plan) => {
          const isUserLevel = user && user.vipLevel === plan.level;

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-3xl bg-white border-2 shadow-md shadow-sky-100/60 hover:shadow-xl transition-all relative overflow-hidden text-slate-900 ${
                isUserLevel ? 'border-2 border-emerald-400' : 'border-sky-100 hover:border-sky-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-2xl shadow-xs">
                  🔥 Best ROI Value
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${plan.badgeColor} text-white font-black text-base flex items-center justify-center shadow-md shrink-0`}>
                  V{plan.level}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">{plan.name}</h3>
                    {isUserLevel && (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Active Tier
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">{plan.description}</p>
                </div>
              </div>

              {/* 4 Core Plan Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 my-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Capital Investment</p>
                  <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                    ₦{plan.capital.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Daily Income (24h)</p>
                  <p className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                    +₦{plan.dailyEarning.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Contract Term</p>
                  <p className="font-black text-amber-800 text-xs flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-amber-600" /> 30 Days Locked
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Total 30D Revenue</p>
                  <p className="font-mono font-black text-amber-700 text-xs mt-0.5">
                    ₦{plan.totalInvestment.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>24h Auto Settlement</span>
                </div>

                <button
                  onClick={() => onSelectPlan(plan)}
                  className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-sky-200 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer border border-sky-400"
                >
                  Invest Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
