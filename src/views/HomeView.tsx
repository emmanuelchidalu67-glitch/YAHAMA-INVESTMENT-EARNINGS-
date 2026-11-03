import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  History,
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  ChevronRight,
  Clock,
  ShieldCheck,
  Gift,
  Check,
  Megaphone,
  BellRing,
  Wifi,
  Smartphone,
  PhoneCall,
  Zap,
  Radio,
  Lock,
} from 'lucide-react';
import { User, VIPPlan, AdminSettings, TopInvestor } from '../types';
import { INITIAL_TOP_INVESTORS } from '../data/initialData';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';
import { InstallAppButton } from '../components/InstallAppButton';
import { AnimatedCounter } from '../components/AnimatedCounter';

interface HomeViewProps {
  user: User | null;
  vipPlans: VIPPlan[];
  adminSettings: AdminSettings;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTeam: () => void;
  onOpenHistory: () => void;
  onOpenSpin: () => void;
  onOpenVtu?: (tab?: 'airtime' | 'data') => void;
  onOpenAirtime?: () => void;
  onOpenData?: () => void;
  onSelectPlan: (plan: VIPPlan) => void;
  onUpdateUser: (updatedUser: User) => void;
  onRequireAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  vipPlans,
  adminSettings,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTeam,
  onOpenHistory,
  onOpenSpin,
  onOpenVtu,
  onOpenAirtime,
  onOpenData,
  onSelectPlan,
  onUpdateUser,
  onRequireAuth,
}) => {
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimStatusMsg, setClaimStatusMsg] = useState<string | null>(null);
  const [nextClaimTimer, setNextClaimTimer] = useState<string>('');
  const [canClaimNow, setCanClaimNow] = useState<boolean>(false);

  const dailyClaimReward = adminSettings?.dailyClaimAmount || 50;

  useEffect(() => {
    const checkClaimStatus = () => {
      if (!user || !user.lastDailyClaimTimestamp) {
        setNextClaimTimer(`Ready to claim ₦${dailyClaimReward}!`);
        setCanClaimNow(true);
        return;
      }

      const now = Date.now();
      const elapsed = now - user.lastDailyClaimTimestamp!;
      const remainingMs = 24 * 60 * 60 * 1000 - elapsed;

      if (remainingMs <= 0) {
        setNextClaimTimer(`Ready to claim ₦${dailyClaimReward}!`);
        setCanClaimNow(true);

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              new Notification('🎁 YAMAHA Daily Reward Ready!', {
                body: `Your free ₦${dailyClaimReward} daily bonus is ready. Claim now!`,
                icon: '/favicon.ico',
              });
            } catch (e) {}
          }
        }
      } else {
        setCanClaimNow(false);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setNextClaimTimer(`${hours}h ${mins}m ${secs}s`);
      }
    };

    checkClaimStatus();
    const interval = setInterval(checkClaimStatus, 1000);
    return () => clearInterval(interval);
  }, [user, dailyClaimReward]);

  const handleClaimDaily = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    setClaimLoading(true);
    setClaimStatusMsg(null);

    try {
      const res = await ApiService.claimDailyBonus(user.id);
      onUpdateUser(res.user);
      soundService.playCoin();
      setClaimStatusMsg(`Success: ${res.message}`);
    } catch (err: any) {
      setClaimStatusMsg(`Error: ${err.message}`);
    } finally {
      setClaimLoading(false);
    }
  };

  const dashboardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.03,
      },
    },
  };

  const popInVariant = {
    hidden: { opacity: 0, scale: 0.94, y: 12 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.38,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      variants={dashboardContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 text-slate-900"
    >
      {/* 24-Hour Daily Bonus Ready Banner */}
      {canClaimNow && (
        <motion.div
          variants={popInVariant}
          className="p-3 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-200/50 border-2 border-emerald-300 flex items-center justify-between gap-2 animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-2xl bg-white/20 text-white shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="font-black text-xs text-white">Daily Bonus Reminder</h4>
              <p className="text-[10.5px] text-emerald-100 font-medium">
                Your 24h ₦{dailyClaimReward} reward is ready to claim!
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimDaily}
            disabled={claimLoading}
            className="bg-amber-300 hover:bg-amber-200 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-2xl shadow active:scale-95 shrink-0 cursor-pointer"
          >
            Claim ₦{dailyClaimReward}
          </button>
        </motion.div>
      )}

      {/* Admin Broadcast Announcement Banner */}
      {(adminSettings.announcementEnabled ?? true) && adminSettings.announcementMessage && (
        <motion.div
          variants={popInVariant}
          className="p-3.5 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-sky-50 border-2 border-amber-200 text-slate-900 text-xs shadow-sm flex items-start gap-2.5"
        >
          <div className="p-1.5 rounded-2xl bg-amber-400 text-slate-950 font-black shrink-0 mt-0.5 shadow-xs">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-black text-[9px] uppercase tracking-wider text-slate-950 bg-amber-300 px-2 py-0.5 rounded-md">
                Official Broadcast
              </span>
            </div>
            <p className="font-bold text-slate-800 leading-snug text-xs">
              {adminSettings.announcementMessage}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Balance Card: Milky Ivory Surface with Dark Green and Gold Trim */}
      <motion.div
        variants={popInVariant}
        className="relative overflow-hidden rounded-3xl bg-[#FFFDF7] text-slate-950 p-5 shadow-2xl shadow-black/30 border-2 border-emerald-900 ring-2 ring-[#D4AF37]/50"
      >
        {/* Subtle Ambient Diamond & Color Halos */}
        <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-14 -left-14 w-40 h-40 rounded-full bg-rose-100/50 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-32 h-32 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        {/* Card Header Info */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#064E3B] via-emerald-800 to-[#7F1D1D] p-0.5 border border-[#D4AF37] shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0A0E0C] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                Total Wallet Balance
              </p>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter
                  value={user ? user.balance : 0}
                  decimals={2}
                  startFromZero={true}
                  duration={1400}
                  className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-slate-950"
                />
              </div>
            </div>
          </div>

          {/* VIP Badge & Verified Seal */}
          <div className="flex flex-col items-end">
            <span className="bg-gradient-to-r from-emerald-800 to-[#7F1D1D] text-[#FFFDF7] font-black text-[10.5px] px-3.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-[#D4AF37]">
              <Crown className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" /> VIP {user ? user.vipLevel : 1}
            </span>
            <span className="text-[9.5px] text-[#7F1D1D] font-extrabold mt-1.5 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <ShieldCheck className="w-3 h-3 text-emerald-700" /> PalmPay Verified
            </span>
          </div>
        </div>

        {/* Sub Metrics Row (Milky Surface with Dark Green and Dark Red Borders) */}
        <div className="grid grid-cols-2 gap-2.5 my-3 p-3 rounded-2xl bg-white border-2 border-emerald-900/30 text-xs shadow-sm relative z-10">
          <div className="border-r border-slate-200 pr-2">
            <p className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider">Active Capital</p>
            <p className="font-black text-slate-950 text-sm mt-0.5">
              ₦{user ? user.totalInvested.toLocaleString() : '0.00'}
            </p>
          </div>
          <div className="pl-1">
            <p className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider">Total Earned Yields</p>
            <p className="font-black text-emerald-800 text-sm mt-0.5">
              ₦{user ? user.totalEarned.toLocaleString() : '0.00'}
            </p>
          </div>
        </div>

        {/* 24h Daily Check-in Claim Bar */}
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#064E3B] to-[#7F1D1D] border-2 border-[#D4AF37] text-[#FFFDF7] flex items-center justify-between relative z-10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-xs border border-white">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-[#D4AF37]">Daily ₦{dailyClaimReward} Yield Reward</p>
              <p className="text-[10px] text-[#FFFDF7]/80 font-bold flex items-center gap-1">
                {user && user.totalInvested > 0 ? (
                  <>
                    <Clock className="w-3 h-3 text-[#D4AF37]" /> {nextClaimTimer}
                  </>
                ) : (
                  <span className="text-rose-200 font-extrabold">🔒 Requires Active VIP Investment</span>
                )}
              </p>
            </div>
          </div>
          {user && user.totalInvested > 0 ? (
            <button
              onClick={handleClaimDaily}
              disabled={claimLoading || !canClaimNow}
              className="bg-[#D4AF37] hover:bg-amber-300 text-black font-black text-xs px-3.5 py-2 rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer border border-white"
            >
              {claimLoading ? 'Claiming...' : `Claim ₦${dailyClaimReward}`}
            </button>
          ) : (
            <button
              onClick={() => {
                if (vipPlans.length > 0) {
                  onSelectPlan(vipPlans[0]);
                }
              }}
              className="bg-emerald-800 hover:bg-emerald-700 text-[#FFFDF7] font-black text-[11px] px-3.5 py-2 rounded-full shadow-sm transition-transform active:scale-95 shrink-0 cursor-pointer border border-[#D4AF37]"
            >
              Unlock VIP
            </button>
          )}
        </div>

        {claimStatusMsg && (
          <p className="text-[11px] text-center font-black text-amber-800 my-1">
            {claimStatusMsg}
          </p>
        )}

        {/* 4 Circular Quick Action Buttons (Circular in Form) */}
        <div className="grid grid-cols-4 gap-2 pt-3 relative z-10 border-t border-slate-200 mt-2">
          {/* Circular Button: Deposit (Dark Green & Gold) */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <button
              onClick={onOpenDeposit}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0A0E0C] p-0.5 border-2 border-[#D4AF37] shadow-lg shadow-emerald-950/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
              title="Deposit Funds"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                <ArrowDownLeft className="w-6 h-6 text-[#D4AF37] stroke-[2.5]" />
              </div>
            </button>
            <span className="font-black text-xs text-slate-900 tracking-tight">Deposit</span>
          </div>

          {/* Circular Button: Withdraw (Dark Red & Gold) */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <button
              onClick={onOpenWithdraw}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0A0E0C] p-0.5 border-2 border-[#D4AF37] shadow-lg shadow-rose-950/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
              title="Withdraw Funds"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#7F1D1D] via-[#991B1B] to-[#450A0A] flex items-center justify-center shadow-inner group-hover:-rotate-6 transition-transform">
                <ArrowUpRight className="w-6 h-6 text-[#FFFDF7] stroke-[2.5]" />
              </div>
            </button>
            <span className="font-black text-xs text-slate-900 tracking-tight">Withdraw</span>
          </div>

          {/* Circular Button: Team (Gold & Dark Green) */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <button
              onClick={onOpenTeam}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0A0E0C] p-0.5 border-2 border-[#FFFDF7] shadow-lg shadow-black/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
              title="Referral Team"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D4AF37] via-[#B45309] to-[#064E3B] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-black stroke-[2.5]" />
              </div>
            </button>
            <span className="font-black text-xs text-slate-900 tracking-tight">Team</span>
          </div>

          {/* Circular Button: History (Black Obsidian & Dark Red) */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <button
              onClick={onOpenHistory}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0A0E0C] p-0.5 border-2 border-[#D4AF37] shadow-lg shadow-black/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
              title="Transaction History"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-black via-[#18231D] to-[#7F1D1D] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                <History className="w-6 h-6 text-[#D4AF37] stroke-[2.5]" />
              </div>
            </button>
            <span className="font-black text-xs text-slate-900 tracking-tight">History</span>
          </div>
        </div>
      </motion.div>

      {/* Bill Payment & Recharge Hub */}
      <motion.div
        variants={popInVariant}
        className="p-4 rounded-3xl bg-[#FFFDF7] border-2 border-emerald-900 text-slate-900 shadow-md space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-950 text-[#D4AF37] font-black border border-emerald-700 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-950 leading-tight">
                Bill Payment &amp; Recharge
              </h3>
              <p className="text-[10px] text-slate-600 font-semibold">
                MTN • Airtel • Glo • 9mobile (Transfer Only)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400">
            Official PalmPay Service
          </span>
        </div>

        {/* Buy Airtime & Buy Data Boxes (Dark Green and Dark Red Boxes) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Box 1: Buy Airtime (Dark Green) */}
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              triggerHaptic(HapticPattern.BUTTON_CLICK);
              if (onOpenAirtime) onOpenAirtime();
              else if (onOpenVtu) onOpenVtu('airtime');
            }}
            className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#064E3B] hover:brightness-110 border-2 border-[#D4AF37] text-[#FFFDF7] flex flex-col justify-between items-start transition-all cursor-pointer shadow-md active:scale-97 group text-left relative overflow-hidden"
          >
            <div className="absolute top-2.5 right-2.5 bg-[#D4AF37] text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
              ₦2 Off
            </div>
            <div className="p-3 rounded-2xl bg-black/60 text-[#D4AF37] border border-emerald-800 shadow-md group-hover:scale-110 transition-transform mb-3">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-[#FFFDF7]">Buy Airtime</h4>
              <p className="text-[10.5px] text-[#D4AF37] font-semibold mt-0.5">
                Instant Recharge
              </p>
            </div>
          </button>

          {/* Box 2: Buy Data (Dark Red) */}
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              triggerHaptic(HapticPattern.BUTTON_CLICK);
              if (onOpenData) onOpenData();
              else if (onOpenVtu) onOpenVtu('data');
            }}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#7F1D1D] via-[#991B1B] to-[#450A0A] hover:brightness-110 border-2 border-[#D4AF37] text-[#FFFDF7] flex flex-col justify-between items-start transition-all cursor-pointer shadow-md active:scale-97 group text-left relative overflow-hidden"
          >
            <div className="absolute top-2.5 right-2.5 bg-[#D4AF37] text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
              Best Rates
            </div>
            <div className="p-3 rounded-2xl bg-black/60 text-[#FFFDF7] border border-rose-900 shadow-md group-hover:scale-110 transition-transform mb-3">
              <Wifi className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h4 className="font-black text-sm text-[#FFFDF7]">Buy Data</h4>
              <p className="text-[10.5px] text-[#D4AF37] font-semibold mt-0.5">
                Fast Bundles
              </p>
            </div>
          </button>
        </div>
      </motion.div>


      {/* Official Mobile App Install Button Card */}
      <motion.div variants={popInVariant}>
        <InstallAppButton variant="card" />
      </motion.div>

      {/* Spin & Win Promo Card Banner */}
      <motion.div
        variants={popInVariant}
        className="p-4 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-xl shadow-amber-200/60 border-2 border-amber-400 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-950 leading-tight">
              Fortune Wheel Spin & Win
            </h3>
            <p className="text-xs text-slate-900 font-bold">
              Win ₦200, ₦500, ₦900 up to ₦10,000!
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSpin}
          className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          Spin Now
        </button>
      </motion.div>

      {/* YAMAHA VIP Investment Plans Carousel / Showcase */}
      <motion.div variants={popInVariant} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-[#D4AF37] flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              YAMAHA VIP Investment Packages
            </h3>
            <p className="text-xs text-[#FFFDF7]/70 font-semibold">Daily ROI from VIP 1 (₦3,500) to VIP 10</p>
          </div>
        </div>

        {/* VIP Grid - Milky & Dark Green / Dark Red Palette */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {vipPlans.slice(0, 6).map((plan) => (
            <motion.div
              variants={popInVariant}
              key={plan.id}
              className="p-4 rounded-3xl bg-[#FFFDF7] border-2 border-emerald-900/80 hover:border-[#D4AF37] shadow-lg transition-all relative overflow-hidden group text-slate-900"
            >
              {plan.popular && (
                <span className="absolute top-0 right-0 bg-gradient-to-r from-emerald-800 to-[#7F1D1D] text-[#FFFDF7] font-black text-[9px] uppercase px-3 py-1 rounded-bl-2xl shadow-xs border-b border-l border-[#D4AF37]">
                  🔥 Popular
                </span>
              )}

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-950 via-emerald-800 to-[#7F1D1D] text-[#D4AF37] font-black text-sm flex items-center justify-center shadow-md border border-[#D4AF37]">
                  V{plan.level}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-950">{plan.name}</h4>
                  <p className="text-[11px] text-slate-600 font-semibold">{plan.durationDays} Days Contract</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2 p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Capital</p>
                  <p className="font-black text-slate-950 text-sm">₦{plan.capital.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Daily Return</p>
                  <p className="font-black text-emerald-800 text-sm">+₦{plan.dailyEarning.toLocaleString()}</p>
                </div>
                <div className="col-span-2 pt-1 border-t border-emerald-200 flex justify-between">
                  <span className="text-[10px] text-slate-600 font-bold">Total Revenue:</span>
                  <span className="font-black text-[#7F1D1D]">₦{plan.totalInvestment.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => onSelectPlan(plan)}
                className="w-full mt-1 py-2.5 rounded-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#7F1D1D] hover:from-emerald-700 hover:to-[#991B1B] text-[#FFFDF7] font-black text-xs shadow-md border border-[#D4AF37] flex items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                Invest Now (₦{plan.capital.toLocaleString()})
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Top Investors Leaderboard - Milky & Dark Green / Dark Red */}
      <motion.div
        variants={popInVariant}
        className="p-4 rounded-3xl bg-[#FFFDF7] border-2 border-emerald-900 shadow-xl space-y-3 text-slate-900"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/20">
          <div className="p-2 rounded-2xl bg-emerald-950 text-[#D4AF37] font-black border border-emerald-800 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-950">Top Yamaha Investors Leaderboard</h3>
            <p className="text-xs text-slate-600 font-semibold">Highest daily payout earners</p>
          </div>
        </div>

        <div className="space-y-2">
          {INITIAL_TOP_INVESTORS.map((inv, idx) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-emerald-900/20 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-xs ${
                    idx === 0
                      ? 'bg-[#D4AF37] text-black border border-black'
                      : idx === 1
                      ? 'bg-slate-200 text-slate-900'
                      : idx === 2
                      ? 'bg-[#7F1D1D] text-white'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="font-black text-slate-900">{inv.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{inv.phone} • VIP {inv.vipLevel}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-emerald-800">+₦{inv.payoutEarned.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 font-bold">Total: ₦{inv.totalInvested.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
