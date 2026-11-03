import React from 'react';
import { X, Bell, CheckCircle2, Sparkles, AlertTriangle, ChevronRight, Gift, Zap } from 'lucide-react';
import { soundService } from '../utils/sound';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const NOTIFICATIONS = [
    {
      id: '1',
      title: '₦700 Welcome Bonus Credited',
      message: 'Welcome to YAMAHA INVESTMENT EARNINGS INCOME! ₦700 has been credited to your wallet balance automatically.',
      time: 'Just now',
      type: 'success',
      tag: 'Bonus',
    },
    {
      id: '2',
      title: 'Spin & Win Wheel Unlocked',
      message: 'You have 1 free turn on the YAMAHA Fortune Wheel. Win up to ₦10,000 instant cash reward!',
      time: '10m ago',
      type: 'promo',
      tag: 'Lucky Wheel',
    },
    {
      id: '3',
      title: '24-Hour Daily Return Engine',
      message: 'All active YAMAHA VIP investments yield automatic daily returns credited directly every 24 hours (₦800 daily on VIP 1).',
      time: '1h ago',
      type: 'info',
      tag: 'Yield',
    },
    {
      id: '4',
      title: '20% Direct Referral Commission',
      message: 'Share your referral code to earn instant 20% commission on direct downlines + 3 tiers team rewards!',
      time: '2h ago',
      type: 'promo',
      tag: 'Referral',
    },
    {
      id: '5',
      title: 'PalmPay Instant Settlement',
      message: 'Withdrawals are processed instantly via automated PalmPay & NIP banking channels.',
      time: '5h ago',
      type: 'success',
      tag: 'Payout',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      {/* Milky Diamond, Sky Blue & Gold Container */}
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-4 shadow-2xl relative overflow-hidden border-2 border-sky-200 max-h-[80vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-sky-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 leading-tight">System Alerts</h3>
              <p className="text-[10px] text-slate-500 font-semibold">{NOTIFICATIONS.length} Platform Updates</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Small Compact Notification List */}
        <div className="mt-2.5 space-y-2 overflow-y-auto pr-1">
          {NOTIFICATIONS.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-sky-50/60 via-white to-amber-50/40 border border-sky-100 hover:border-sky-300 transition-all shadow-xs"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">
                  {item.type === 'success' ? (
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : item.type === 'promo' ? (
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-black text-[11.5px] text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[8px] font-black px-1.5 py-0.2 rounded-md shrink-0">
                        {item.tag}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 font-medium leading-snug mt-0.5">
                    {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-2.5 pt-2 border-t border-sky-100 text-center shrink-0">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="text-[11px] font-black text-sky-700 hover:text-sky-800 cursor-pointer"
          >
            Mark All as Read
          </button>
        </div>
      </div>
    </div>
  );
};
