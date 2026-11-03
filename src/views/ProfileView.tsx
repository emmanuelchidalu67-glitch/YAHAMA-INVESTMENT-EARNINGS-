import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  History,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Crown,
  Lock,
  Headset,
  Camera,
  X,
  Check,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { InstallAppButton } from '../components/InstallAppButton';
import { ATMCard } from '../components/ATMCard';
import { AnimatedCounter } from '../components/AnimatedCounter';

interface ProfileViewProps {
  user: User | null;
  adminSettings: AdminSettings;
  onOpenAddBank: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTeam: () => void;
  onOpenHistory: () => void;
  onOpenSupport: () => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
  onRequireAuth: () => void;
  onUpdateUser?: (updatedUser: User) => void;
  onReplayTour?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  adminSettings,
  onOpenAddBank,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTeam,
  onOpenHistory,
  onOpenSupport,
  onOpenAdmin,
  onSignOut,
  onRequireAuth,
  onUpdateUser,
  onReplayTour,
}) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const [topUpCodeInput, setTopUpCodeInput] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!topUpCodeInput.trim()) {
      setTopUpMsg({ text: 'Please enter a valid top-up code', isError: true });
      return;
    }

    setTopUpLoading(true);
    setTopUpMsg(null);

    try {
      const res = await ApiService.redeemTopUpCode(user.id, topUpCodeInput.trim());
      if (onUpdateUser) {
        onUpdateUser(res.user);
      }
      setTopUpMsg({ text: res.message, isError: false });
      setTopUpCodeInput('');
      soundService.playCoin();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#f59e0b', '#10b981', '#38bdf8'],
      });
    } catch (err: any) {
      setTopUpMsg({ text: err.message || 'Failed to redeem code', isError: true });
    } finally {
      setTopUpLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4 bg-white border-2 border-sky-100 rounded-3xl shadow-lg max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-amber-400 p-1 mx-auto shadow-md">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-sky-600" />
          </div>
        </div>
        <h3 className="font-black text-base text-slate-900">Sign In Required</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
          Sign in to manage your YAMAHA profile, add Nigerian bank account details, and view transactions.
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

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSelectAvatar = async (url: string) => {
    try {
      setUpdatingAvatar(true);
      setSelectedAvatar(url);
      const res = await ApiService.updateAvatar(user.id, url);
      if (onUpdateUser) {
        onUpdateUser(res.user);
      }
      setShowAvatarModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update avatar');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 text-slate-900">
      {/* User Header Profile Card - Milky Diamond & Sky Blue */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-sky-50 to-amber-50/60 text-slate-900 shadow-xl shadow-sky-100/70 border-2 border-sky-200 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 via-blue-500 to-amber-400 p-0.5 shadow-md shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover rounded-[22px]"
                />
              ) : (
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center font-black text-xl text-sky-800 tracking-wider">
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow hover:bg-amber-300 transition-transform active:scale-95 cursor-pointer border border-white"
              title="Change Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-slate-900">{user.fullName}</h2>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-amber-400">
                <Crown className="w-3 h-3 fill-slate-950" /> VIP {user.vipLevel}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold">{user.phone} • {user.email}</p>
            <p className="text-[10.5px] text-emerald-700 font-extrabold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PalmPay Verified Account
            </p>
          </div>
        </div>

        {/* User Balance Overview */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 p-3 rounded-2xl bg-white border-2 border-sky-100 text-xs shadow-xs">
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase">Wallet Balance</p>
            <div className="mt-0.5">
              <AnimatedCounter
                value={user.balance}
                decimals={2}
                startFromZero={true}
                duration={1200}
                className="font-mono font-black text-slate-900 text-base"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase">Total Withdrawn</p>
            <p className="font-mono font-black text-emerald-700 text-base mt-0.5">
              ₦{user.totalWithdrawn.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border-2 border-sky-200 animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm">Select Profile Avatar</h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Choose an avatar to represent your profile on YAMAHA INVESTMENT EARNINGS INCOME:
            </p>

            <div className="grid grid-cols-4 gap-3">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAvatar(url)}
                  disabled={updatingAvatar}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    user.avatarUrl === url ? 'border-amber-500 ring-2 ring-amber-400' : 'border-sky-100 hover:border-sky-400'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  {user.avatarUrl === url && (
                    <div className="absolute inset-0 bg-sky-900/40 flex items-center justify-center">
                      <Check className="w-5 h-5 text-amber-300 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Official Mobile App Install Card */}
      <InstallAppButton variant="card" />

      {/* Free Top-Up Code Voucher Section */}
      <div className="p-4 rounded-3xl bg-white border-2 border-sky-200 shadow-xl shadow-sky-100/60 space-y-3 text-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                Free Top-Up Voucher Code
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Instant Credit
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">Enter promotional voucher code to credit wallet instantly</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRedeemCode} className="flex gap-2">
          <input
            type="text"
            value={topUpCodeInput}
            onChange={(e) => setTopUpCodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. FREE5000"
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-sky-50/60 border-2 border-sky-100 text-xs font-mono font-black text-sky-900 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={topUpLoading}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black text-xs shadow-md hover:from-amber-300 hover:to-yellow-300 transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer border border-amber-400"
          >
            {topUpLoading ? (
              'Redeeming...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Redeem
              </>
            )}
          </button>
        </form>

        {topUpMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 ${
              topUpMsg.isError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {topUpMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{topUpMsg.text}</span>
          </div>
        )}
      </div>

      {/* Nigerian Bank Account & ATM Card Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-700" />
            <h3 className="font-black text-sm text-slate-900">Registered Withdrawal Account</h3>
          </div>
          {!user.bankAccount && (
            <button
              onClick={onOpenAddBank}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              + Add Bank Account
            </button>
          )}
        </div>

        {user.bankAccount ? (
          <ATMCard user={user} onEditBank={onOpenAddBank} />
        ) : (
          <div className="p-4 rounded-3xl bg-white border-2 border-sky-200 shadow-xl shadow-sky-100/60 text-slate-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">No ATM Account Linked</h4>
                <p className="text-xs text-slate-500 font-semibold">Link your Nigerian bank account to generate your ATM debit card</p>
              </div>
            </div>
            <button
              onClick={onOpenAddBank}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-sky-200 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer border border-sky-400"
            >
              <Building2 className="w-4 h-4" /> Link Nigerian Bank Account & Set PIN
            </button>
          </div>
        )}
      </div>

      {/* Shortcuts Menu List */}
      <div className="p-2 rounded-3xl bg-white border-2 border-sky-200 shadow-xl shadow-sky-100/60 divide-y divide-sky-100">
        <button
          onClick={onOpenDeposit}
          className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50/70 transition-colors text-xs cursor-pointer rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900">Deposit Funds</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenWithdraw}
          className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50/70 transition-colors text-xs cursor-pointer rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900">Withdraw Funds</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenTeam}
          className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50/70 transition-colors text-xs cursor-pointer rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-800 border border-sky-200">
              <Users className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900">Team & Referral Bonus</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenHistory}
          className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50/70 transition-colors text-xs cursor-pointer rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800 border border-blue-200">
              <History className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900">Deposit & Withdrawal History</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenSupport}
          className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50/70 transition-colors text-xs cursor-pointer rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Headset className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900">Customer Support & Groups</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Install Mobile App shortcut */}
        <InstallAppButton variant="list-item" />

        {/* STRICT ADMIN PANEL BUTTON - ONLY FOR ADMIN ROLE */}
        {user.role === 'admin' && (
          <button
            onClick={onOpenAdmin}
            className="w-full p-3.5 flex items-center justify-between bg-amber-50 hover:bg-amber-100/70 border border-amber-300 rounded-2xl transition-colors text-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                <Crown className="w-4 h-4" />
              </div>
              <span className="font-black text-amber-950 uppercase tracking-wider">
                Admin Control Panel
              </span>
            </div>
            <span className="bg-amber-200 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-full border border-amber-300">
              Full Access
            </span>
          </button>
        )}
      </div>

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        className="w-full py-3.5 rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-700 font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        Sign Out of Account
      </button>
    </div>
  );
};
