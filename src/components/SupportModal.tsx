import React from 'react';
import { X, Headset, MessageCircle, Send, Globe, Shield } from 'lucide-react';
import { AdminSettings } from '../types';
import { soundService } from '../utils/sound';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden border-2 border-sky-200">
        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-sky-50 text-sky-700 border-2 border-sky-200 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Headset className="w-8 h-8" />
          </div>
          <h3 className="font-black text-lg text-slate-900">YAMAHA Customer Support</h3>
          <p className="text-xs text-slate-500 font-semibold">24/7 Official Representative Assistance</p>
        </div>

        <div className="space-y-3">
          {/* Telegram Official Group */}
          <a
            href={adminSettings.supportTelegramGroup}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundService.playClick()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100 border-2 border-sky-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm text-slate-900 group-hover:text-sky-700">
                  Official Telegram Group
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">Join 15,000+ Active Investors</p>
              </div>
            </div>
          </a>

          {/* WhatsApp Support */}
          <a
            href={`https://wa.me/${adminSettings.supportWhatsApp.replace(/\D/g, '')}?text=Hello%20Yamaha%20Support,%20I%20need%20assistance.`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundService.playClick()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 border-2 border-emerald-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm text-slate-900 group-hover:text-emerald-700">
                  WhatsApp Support
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">{adminSettings.supportWhatsApp}</p>
              </div>
            </div>
          </a>

          {/* Live Chat */}
          <a
            href={adminSettings.supportLiveChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundService.playClick()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100 border-2 border-amber-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs font-black">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm text-slate-900 group-hover:text-amber-800">
                  Live Support Agent
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">Instant 1-on-1 Assistance</p>
              </div>
            </div>
          </a>
        </div>

        <div className="mt-5 p-3 rounded-2xl bg-sky-50/60 text-[11px] text-slate-600 font-medium flex items-center gap-2 border border-sky-100">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>YAMAHA Customer Service operates 24 hours daily. Beware of scammers offering unauthorized investment accounts.</span>
        </div>
      </div>
    </div>
  );
};
