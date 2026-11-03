import React from 'react';
import { X, MessageCircle, Send, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { AdminSettings } from '../types';

interface CommunityWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
}

export const CommunityWelcomeModal: React.FC<CommunityWelcomeModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
}) => {
  if (!isOpen) return null;

  const whatsappUrl =
    adminSettings.whatsappChannelLink || 'https://chat.whatsapp.com/yamaha_official_channel';
  const telegramUrl =
    adminSettings.telegramGroupLink ||
    adminSettings.supportTelegramGroup ||
    'https://t.me/yamahainvestment_official';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative overflow-hidden border border-purple-100/80 my-auto">
        {/* Close / Remove Sign Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact Header Banner */}
        <div className="text-center mb-4 pt-1">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-900 text-amber-300 mb-2.5 shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight uppercase">
            YAMAHA INVESTMENT EARNINGS INCOME
          </h3>
          <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider mt-0.5">
            Official Community & Daily Updates
          </p>
        </div>

        {/* Yamaha Description */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-snug mb-4 space-y-1">
          <p className="font-semibold text-slate-800">
            Welcome to YAMAHA INVESTMENT EARNINGS INCOME high-yield network!
          </p>
          <p className="text-[10.5px]">
            Earn guaranteed ₦800 daily income, instant bank withdrawals, and daily login bonuses by joining Nigeria's official YAMAHA investment community.
          </p>
        </div>

        {/* Action Buttons: Join WhatsApp & Telegram */}
        <div className="space-y-2.5">
          {/* Join WhatsApp Channel */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-md transition-all group active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/15 text-emerald-100">
                <MessageCircle className="w-4 h-4 fill-emerald-200 text-emerald-800" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-xs leading-tight">Join WhatsApp Channel</p>
                <p className="text-[9.5px] text-emerald-100 font-medium">Payment proofs & daily notices</p>
              </div>
            </div>
            <div className="p-1 rounded-lg bg-white/20 text-white group-hover:translate-x-0.5 transition-transform">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Join Telegram Group */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 text-white hover:from-sky-500 hover:to-blue-600 shadow-md transition-all group active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/15 text-sky-100">
                <Send className="w-4 h-4 fill-sky-100 text-sky-800" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-xs leading-tight">Join Telegram Group</p>
                <p className="text-[9.5px] text-sky-100 font-medium">Connect with active investors</p>
              </div>
            </div>
            <div className="p-1 rounded-lg bg-white/20 text-white group-hover:translate-x-0.5 transition-transform">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>

        {/* Security & Dismiss note */}
        <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Official Links
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-purple-900 underline font-bold"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
