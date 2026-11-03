import React from 'react';
import { SAMPLE_LIVE_TICKER } from '../data/initialData';
import { ArrowUpRight, ArrowDownLeft, Gift, Sparkles } from 'lucide-react';

export const MarqueeTicker: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-sky-100 via-white to-amber-50 text-slate-800 text-xs py-1.5 px-3 overflow-hidden border-b border-sky-200 shadow-xs flex items-center gap-2">
      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[9px] shrink-0 flex items-center gap-1 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        Live Activity
      </span>

      <div className="overflow-hidden relative w-full whitespace-nowrap">
        <div className="inline-block animate-marquee hover:pause flex items-center gap-4">
          {SAMPLE_LIVE_TICKER.concat(SAMPLE_LIVE_TICKER).map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full border border-sky-200 text-slate-800 shrink-0 shadow-xs text-[11px]"
            >
              {item.action.includes('withdrawn') ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 font-black" />
              ) : item.action.includes('deposited') ? (
                <ArrowDownLeft className="w-3.5 h-3.5 text-sky-600 font-black" />
              ) : (
                <Gift className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className="font-black text-slate-900">{item.phone}</span>
              <span className="text-slate-600 font-semibold">{item.action}</span>
              <span className="font-black text-amber-700">₦{item.amount.toLocaleString()}</span>
              <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                {item.status}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">({item.time})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
