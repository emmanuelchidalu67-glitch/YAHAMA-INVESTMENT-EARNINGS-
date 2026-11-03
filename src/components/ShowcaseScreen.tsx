import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Zap,
  Award,
  Lock,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';
import { soundService } from '../utils/sound';

interface ShowcaseScreenProps {
  onComplete: () => void;
}

export const ShowcaseScreen: React.FC<ShowcaseScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(true);

  useEffect(() => {
    // Sound chime on showcase mount
    try {
      soundService.playCoin();
    } catch (_) {}

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    soundService.playInvest();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-5 bg-gradient-to-b from-[#070B09] via-[#0D1410] to-[#0A0708] text-[#FFFDF7] select-none overflow-y-auto animate-fadeIn font-sans">
      {/* Top Ambient Diamond & Dark Green/Dark Red Halos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-4 w-72 h-72 bg-rose-950/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Tag */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2 relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[#D4AF37] text-[11px] font-black tracking-wider uppercase shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>CAC Nigeria RC-1849204</span>
        </div>
        <button
          onClick={handleEnter}
          className="text-xs font-bold text-[#FFFDF7]/70 hover:text-[#D4AF37] px-3 py-1 rounded-full bg-black/40 border border-emerald-900/50 cursor-pointer transition-colors"
        >
          Skip Intro →
        </button>
      </div>

      {/* Main Showcase Centerpiece */}
      <div className="w-full max-w-sm my-auto py-6 flex flex-col items-center text-center relative z-10 space-y-5">
        {/* Animated App Showcase Icon */}
        <div className="relative group">
          {/* Pulsing Outer Gold & Dark Green/Dark Red Halos */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#D4AF37] via-emerald-600 to-[#991B1B] opacity-75 blur-md animate-pulse" />
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-b from-[#D4AF37] via-emerald-800 to-[#7F1D1D] shadow-2xl shadow-emerald-950/80 ring-4 ring-[#FFFDF7]/20">
            <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center p-0.5">
              <img
                src={yamahaBrandLogo}
                alt="YAMAHA INVESTMENT EARNINGS INCOME"
                className="w-full h-full object-cover rounded-full transform transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-black font-black text-[10px] tracking-widest uppercase shadow-md border border-[#FFFDF7]">
            Official App
          </span>
        </div>

        {/* Platform Name */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFFDF7] to-[#D4AF37] uppercase drop-shadow-lg">
            YAMAHA INVESTMENT EARNINGS INCOME
          </h1>
          <p className="text-xs font-extrabold text-[#D4AF37] tracking-wider uppercase">
            Guaranteed Daily VIP Financial Yields
          </p>
        </div>

        {/* Platform Description Box (Milky with Dark Green and Dark Red Borders) */}
        <div className="w-full p-4 rounded-3xl bg-[#FFFDF7] border-2 border-emerald-800 shadow-xl text-black space-y-2 text-left relative overflow-hidden">
          <div className="flex items-center gap-2 pb-1 border-b border-emerald-900/10">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wide">
              Official Platform Overview
            </span>
          </div>

          <p className="text-[11.5px] leading-relaxed text-slate-800 font-medium">
            Welcome to <strong className="font-black text-emerald-950">YAMAHA INVESTMENT EARNINGS INCOME</strong> — Nigeria’s licensed high-yield wealth engine.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-emerald-50 text-emerald-950 border border-emerald-200">
              <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Min Invest ₦3,500</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-rose-50 text-rose-950 border border-rose-200">
              <Zap className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Daily Yield ₦800</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-amber-50 text-amber-950 border border-amber-200">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Min Withdraw ₦800</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-emerald-50 text-emerald-950 border border-emerald-200">
              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>3-Tier Rewards (20%)</span>
            </div>
          </div>
        </div>

        {/* Progress Loading Bar */}
        <div className="w-full space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-black text-[#D4AF37]">
            <span>System Initialization</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/60 border border-emerald-800/80 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-[#991B1B] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="w-full max-w-sm pb-3 relative z-10">
        <button
          onClick={handleEnter}
          className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#7F1D1D] hover:from-emerald-700 hover:to-[#991B1B] text-[#FFFDF7] font-black text-sm tracking-wide shadow-xl shadow-black/80 border-2 border-[#D4AF37] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <span>ENTER YAMAHA PLATFORM</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
        </button>
        <p className="text-[10px] text-center text-[#FFFDF7]/60 mt-2 font-medium">
          Instant ₦700 Registration Bonus Credited on Sign Up
        </p>
      </div>
    </div>
  );
};
