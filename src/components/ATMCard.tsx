import React, { useState } from 'react';
import { Wifi, Copy, Check, Lock, Edit3 } from 'lucide-react';
import { User } from '../types';
import { soundService } from '../utils/sound';

interface ATMCardProps {
  user: User;
  onEditBank: () => void;
}

export const ATMCard: React.FC<ATMCardProps> = ({ user, onEditBank }) => {
  const [copied, setCopied] = useState(false);
  const bank = user.bankAccount;

  if (!bank) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playClick();
    navigator.clipboard.writeText(bank.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format account number nicely for ATM card display (e.g., 1234  5678  90)
  const rawNum = bank.accountNumber || '0000000000';
  const formattedCardNum =
    rawNum.length >= 10
      ? `${rawNum.slice(0, 4)}  ${rawNum.slice(4, 7)}  ${rawNum.slice(7)}`
      : rawNum;

  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      {/* Compact Authentic ATM Debit Card (Standard ISO 7810 Credit Card Ratio ~ 1.586) */}
      <div className="relative w-full max-w-[290px] sm:max-w-[300px] h-[172px] sm:h-[180px] rounded-2xl p-3.5 sm:p-4 text-white shadow-xl shadow-sky-950/20 bg-gradient-to-br from-[#0b1329] via-[#0f2347] to-[#041124] border border-amber-400/40 overflow-hidden flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02] select-none">
        {/* Realistic Metallic Sheen & Foil Overlays */}
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-gradient-to-br from-amber-300/15 via-sky-400/10 to-transparent rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-gradient-to-tr from-sky-400/15 via-transparent to-transparent rounded-full blur-xl pointer-events-none" />
        
        {/* Diagonal Brushed Reflection Ribbon */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -rotate-45 pointer-events-none translate-x-4" />

        {/* Top Section: Yamaha Logo & Bank Name */}
        <div className="relative z-10 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
              Y
            </div>
            <div>
              <p className="font-black text-[10px] tracking-wider text-amber-300 uppercase leading-none">
                YAMAHA
              </p>
              <p className="text-[7.5px] text-sky-200 font-bold uppercase tracking-widest leading-tight">
                EARNINGS DEBIT
              </p>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-white/10 border border-sky-300/30 backdrop-blur-xs max-w-[120px] truncate">
            <span className="font-black text-[9.5px] text-sky-100 uppercase tracking-wide truncate block">
              {bank.bankName}
            </span>
          </div>
        </div>

        {/* Middle Section: Authentic EMV Gold Smart Chip + Contactless Wave */}
        <div className="relative z-10 flex items-center justify-between -my-1">
          <div className="flex items-center gap-2">
            {/* Real EMV Microchip with 6 Contact Terminals */}
            <div className="w-9 h-6.5 rounded-md bg-gradient-to-br from-[#ffd875] via-[#e5a824] to-[#b37d0d] p-0.5 border border-amber-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="w-full h-px bg-amber-900/40" />
              <div className="w-full h-px bg-amber-900/40" />
              <div className="w-full h-px bg-amber-900/40" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-900/40 -translate-x-1/2" />
            </div>

            {/* Contactless Wave Icon */}
            <Wifi className="w-3.5 h-3.5 text-sky-200/70 rotate-90" />
          </div>

          {/* Secure 4-Digit PIN Lock Indicator */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[8px] font-black text-amber-300">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
            <span>PIN LOCKED</span>
          </div>
        </div>

        {/* Account / Card Number (Embossed Silver Foil Look) */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="font-mono font-black text-sm sm:text-base tracking-[0.18em] text-slate-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {formattedCardNum}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy Account Number"
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-sky-200 transition-colors cursor-pointer border border-white/15 active:scale-95"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Bottom Section: Cardholder Name, Expiry & Verve/Mastercard Holographic Emblem */}
        <div className="relative z-10 flex items-end justify-between pt-1 border-t border-sky-400/15">
          <div className="min-w-0 max-w-[150px]">
            <p className="text-[7px] font-bold text-sky-300/80 uppercase tracking-widest leading-none mb-0.5">
              CARDHOLDER
            </p>
            <p className="font-mono font-bold text-[10px] text-slate-100 uppercase tracking-wider truncate drop-shadow-xs">
              {bank.accountName || user.fullName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[7px] font-bold text-sky-300/80 uppercase tracking-widest leading-none mb-0.5">
                EXPIRES
              </p>
              <p className="font-mono font-bold text-[9px] text-amber-300">12/30</p>
            </div>

            {/* Hologram Card Network Emblem (Interlocking Dual Rings) */}
            <div className="flex -space-x-1.5 opacity-90">
              <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 shadow-xs" />
              <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 shadow-xs opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Controls / Change Account */}
      <div className="flex items-center justify-between w-full max-w-[290px] sm:max-w-[300px] px-1 text-[11px]">
        <span className="text-emerald-700 font-black flex items-center gap-1 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active for Payouts
        </span>
        <button
          type="button"
          onClick={onEditBank}
          className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-black text-[11px] cursor-pointer hover:underline"
        >
          <Edit3 className="w-3 h-3" />
          <span>Change Account / PIN</span>
        </button>
      </div>
    </div>
  );
};
