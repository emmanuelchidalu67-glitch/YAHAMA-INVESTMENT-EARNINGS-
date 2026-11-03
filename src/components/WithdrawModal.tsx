import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Wallet,
  Users,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  Unlock,
  Clock,
  Calendar,
} from 'lucide-react';
import { AdminSettings, User, Transaction } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';
import { AnimatedCounter } from './AnimatedCounter';
import { AgentFeeModal } from './AgentFeeModal';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  adminSettings: AdminSettings;
  onWithdrawSuccess: (tx: Transaction, updatedUser: User) => void;
  onOpenAddBank: () => void;
  onRequireAuth: () => void;
  onOpenReferral?: () => void;
}

const QUICK_WITHDRAW_AMOUNTS = [800, 1500, 3000, 5000, 10000, 20000, 50000, 100000];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  onWithdrawSuccess,
  onOpenAddBank,
  onRequireAuth,
  onOpenReferral,
}) => {
  const [amount, setAmount] = useState<number>(800);
  const [customAmount, setCustomAmount] = useState<string>('800');
  const [withdrawalPin, setWithdrawalPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);
  const [showAgentFeeModal, setShowAgentFeeModal] = useState(false);

  // Operational Schedule & Limits Configuration
  const minWth = adminSettings.minWithdrawalAmount || 800;
  const maxWth = adminSettings.maxWithdrawalAmount || 1000000;
  const openHour = adminSettings.withdrawalOpenHour ?? 9;
  const closeHour = adminSettings.withdrawalCloseHour ?? 18;
  const dropTimeStr = adminSettings.withdrawalDropTime || '8:00 PM';
  const disallowedDays = adminSettings.withdrawalDisallowedDays ?? [0, 3]; // 0: Sunday, 3: Wednesday

  // Calculate current West Africa Time (WAT = UTC+1)
  const getWatNow = () => {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wat = new Date(utcMs + (3600000 * 1));
    return {
      day: wat.getDay(),
      hour: wat.getHours(),
      minute: wat.getMinutes(),
      timeStr: wat.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  const [watInfo, setWatInfo] = useState(getWatNow);

  useEffect(() => {
    const timer = setInterval(() => {
      setWatInfo(getWatNow());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isDisallowedDay = disallowedDays.includes(watInfo.day);
  const isWithinHours = watInfo.hour >= openHour && watInfo.hour < closeHour;
  const isScheduleOpen = !isDisallowedDay && isWithinHours;
  const dayName = watInfo.day === 0 ? 'Sunday' : watInfo.day === 3 ? 'Wednesday' : '';

  if (!isOpen) return null;

  const handleSelectQuick = (val: number) => {
    soundService.playClick();
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setAmount(Number(val) || 0);
  };

  const feePercent = adminSettings.withdrawalFeePercent || 15;
  const feeAmount = (amount * feePercent) / 100;
  const netPayable = Math.max(0, amount - feeAmount);

  const handleCopyRef = () => {
    if (!user) return;
    const refLink = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(refLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleWithdraw = async () => {
    soundService.playClick();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (user.withdrawalBanned) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg('you cannot withdraw at the moment refer friends to be able to unlock withdrawal');
      return;
    }

    if (!user.bankAccount || !user.bankAccount.accountNumber) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg('Please add your 10-digit Nigerian bank account details before requesting a withdrawal.');
      return;
    }

    // Schedule Enforcement: Closed on Wednesday & Sunday
    if (isDisallowedDay) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(`Withdrawals are closed today (${dayName}). Operational days are Monday, Tuesday, Thursday, Friday, and Saturday from 9:00 AM to 6:00 PM. Approved withdrawals drop daily at 8:00 PM.`);
      return;
    }

    // Schedule Enforcement: 9:00 AM to 6:00 PM (WAT)
    if (!isWithinHours) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(`Withdrawals are only accepted between 9:00 AM and 6:00 PM (WAT). Current system time is ${watInfo.timeStr} WAT. Approved withdrawals drop daily at 8:00 PM.`);
      return;
    }

    const savedPin = user.withdrawalPin || user.bankAccount?.withdrawalPin;
    if (savedPin) {
      if (!withdrawalPin || withdrawalPin.trim().length !== 4) {
        triggerHaptic(HapticPattern.INVEST_ERROR);
        setErrorMsg('Please enter your 4-digit withdrawal security PIN.');
        return;
      }
      if (withdrawalPin.trim() !== savedPin) {
        triggerHaptic(HapticPattern.INVEST_ERROR);
        setErrorMsg('Incorrect 4-digit withdrawal PIN. Please enter the PIN you created when linking your bank account.');
        return;
      }
    } else if (withdrawalPin && withdrawalPin.trim().length !== 4) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg('Withdrawal PIN must be exactly 4 digits.');
      return;
    }

    if ((user.totalInvested || 0) <= 0) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg('You cannot withdraw daily bonus or account balance without an active investment on YAMAHA platform. Please purchase a VIP investment plan first to unlock withdrawals.');
      return;
    }

    if (amount < minWth) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(`Minimum withdrawal amount is ₦${minWth.toLocaleString()}`);
      return;
    }

    if (amount > maxWth) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(`Maximum withdrawal limit is ₦${maxWth.toLocaleString()} per transaction.`);
      return;
    }

    if (user.balance < amount) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(`Insufficient balance! Your current balance is ₦${user.balance.toLocaleString()}`);
      return;
    }

    triggerHaptic(HapticPattern.INVEST_CONFIRM);
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await ApiService.requestWithdrawal({
        userId: user.id,
        amount,
        withdrawalPin: withdrawalPin.trim(),
      });

      triggerHaptic(HapticPattern.INVEST_SUCCESS);
      setSuccessTx(res.transaction);
      onWithdrawSuccess(res.transaction, res.user);
      soundService.playWithdraw();
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(err.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    soundService.playClick();
    setSuccessTx(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden border-2 border-sky-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900">Withdraw Funds</h3>
              <p className="text-[11px] text-slate-500 font-semibold">Instant Payout to Nigerian Bank Account</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successTx ? (
          <div className="py-5 text-center space-y-3.5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-black text-base sm:text-lg text-slate-900">Withdrawal Request Submitted!</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Net payout of <span className="font-black text-emerald-700">₦{successTx.netAmount?.toLocaleString()}</span> will be sent to your bank account upon approval.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Bank Name:</span>
                <span className="font-black text-sky-900">{successTx.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Account Number:</span>
                <span className="font-mono font-black text-slate-900">{successTx.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Account Name:</span>
                <span className="font-bold text-slate-800 uppercase">{successTx.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Gross Amount:</span>
                <span className="font-black text-slate-900">₦{successTx.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Handling Fee ({feePercent}%):</span>
                <span className="text-rose-600 font-black">-₦{successTx.fee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-sky-200 font-black text-xs sm:text-sm">
                <span className="text-slate-800">Net Bank Payout:</span>
                <span className="text-emerald-700">₦{successTx.netAmount?.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-200 cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Form View */
          <div className="mt-3.5 space-y-3">
            {/* Withdrawal Ban Notice (If User is Withdrawal Banned) */}
            {user?.withdrawalBanned && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-200 text-rose-800 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-rose-900">Withdrawal Notice</h4>
                    <p className="text-xs font-bold text-rose-800 mt-0.5 leading-snug">
                      You cannot withdraw or receive daily earnings. You must refer friends (and the friend must invest first), or pay the ₦2,100 withdrawal agent fee via bank transfer only (home balance is not eligible).
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenReferral) {
                          onClose();
                          onOpenReferral();
                        } else {
                          handleCopyRef();
                        }
                      }}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-100/70 text-rose-900 font-black text-xs flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-rose-600" /> Refer (Must Invest)
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="py-2 px-2.5 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Copy Invitation Link"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Link
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      triggerHaptic(HapticPattern.BUTTON_CLICK);
                      setShowAgentFeeModal(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Pay ₦2,100 Fee (Transfer Only)
                  </button>
                </div>
              </div>
            )}

            {/* Withdrawal Schedule & Operating Hours Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border-2 border-sky-400 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    <Clock className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-white flex items-center gap-1.5">
                      Withdrawal Schedule
                    </h4>
                    <p className="text-[10px] text-sky-200/90 font-medium">
                      Current WAT Time: <span className="font-mono font-bold text-white">{watInfo.timeStr}</span>
                    </p>
                  </div>
                </div>

                {isScheduleOpen ? (
                  <span className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Open Now
                  </span>
                ) : isDisallowedDay ? (
                  <span className="bg-rose-500/20 border border-rose-400 text-rose-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Closed Today ({dayName})
                  </span>
                ) : (
                  <span className="bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Closed Now
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-sky-800/70 text-[10px]">
                <div className="bg-sky-950/60 p-2 rounded-xl border border-sky-700/50">
                  <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Daily Hours</p>
                  <p className="font-black text-sky-200 mt-0.5">9:00 AM – 6:00 PM</p>
                </div>
                <div className="bg-sky-950/60 p-2 rounded-xl border border-sky-700/50">
                  <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">No Withdrawals</p>
                  <p className="font-black text-rose-300 mt-0.5">Wed & Sun</p>
                </div>
                <div className="bg-sky-950/60 p-2 rounded-xl border border-sky-700/50">
                  <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Payout Drops</p>
                  <p className="font-black text-amber-300 mt-0.5">Every 8:00 PM</p>
                </div>
              </div>

              <div className="bg-sky-900/40 px-2.5 py-1.5 rounded-xl border border-sky-700/40 flex items-center justify-between text-[10px]">
                <span className="text-sky-200">
                  ⚡ All approved withdrawals drop daily at <strong className="text-amber-300 font-black">{dropTimeStr}</strong>
                </span>
                <span className="text-sky-300 font-bold">
                  Min ₦{minWth.toLocaleString()} • Max ₦{maxWth.toLocaleString()}
                </span>
              </div>
            </div>

            {/* User Wallet Balance */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-amber-50 text-slate-900 flex items-center justify-between border-2 border-sky-200 shadow-xs">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Available Balance</p>
                  <AnimatedCounter
                    value={user ? user.balance : 0}
                    decimals={2}
                    startFromZero={true}
                    duration={1200}
                    className="font-mono font-black text-lg sm:text-xl text-slate-900"
                  />
                </div>
              </div>
              <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-black px-2.5 py-1 rounded-full">
                Withdrawable
              </span>
            </div>

            {/* Target Bank Account Card */}
            <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-700" /> Destination Bank Account
                </span>
                <button
                  type="button"
                  onClick={onOpenAddBank}
                  className="text-xs text-sky-700 hover:underline font-black cursor-pointer"
                >
                  {user?.bankAccount ? 'Change' : '+ Add Bank'}
                </button>
              </div>

              {user?.bankAccount ? (
                <div className="text-xs text-slate-800 pt-0.5">
                  <p className="font-black text-sky-950">{user.bankAccount.bankName}</p>
                  <p className="font-mono text-slate-600 font-bold text-[11px]">
                    {user.bankAccount.accountNumber} — {user.bankAccount.accountName}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-rose-700 font-bold pt-1">
                  ⚠️ No bank account added yet! Click "Add Bank" above to link your Nigerian bank account.
                </p>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-semibold leading-tight">{errorMsg}</span>
              </div>
            )}

            {/* Quick Amounts */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                Quick Amount Selector (₦)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_WITHDRAW_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectQuick(val)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all border-2 cursor-pointer ${
                      amount === val
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-800 border-sky-100 hover:bg-sky-50'
                    }`}
                  >
                    ₦{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Amount to Withdraw (₦)
                </label>
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200">
                  Limit: ₦{minWth.toLocaleString()} – ₦{maxWth.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs sm:text-sm">
                  ₦
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="1000"
                  className="w-full pl-7 pr-3 py-2 sm:py-2.5 rounded-xl border-2 border-sky-100 bg-sky-50/40 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 font-black text-sm sm:text-base text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Requested Amount:</span>
                <span className="font-black text-slate-900">₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-semibold text-slate-600">Handling Fee ({feePercent}%):</span>
                <span className="text-rose-600 font-bold">-₦{feeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-sky-200 font-black text-xs sm:text-sm">
                <span className="text-slate-900">Net Bank Payout:</span>
                <span className="text-emerald-700 font-black">₦{netPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* 4-Digit Withdrawal PIN Authorization */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border-2 border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Enter 4-Digit Withdrawal PIN *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-amber-800 hover:text-amber-950 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                >
                  {showPin ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Show
                    </>
                  )}
                </button>
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={4}
                value={withdrawalPin}
                onChange={(e) => setWithdrawalPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 font-mono font-black text-lg tracking-[0.4em] text-center text-slate-950 outline-none placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-slate-400"
              />
              <p className="text-[10px] text-amber-900 font-semibold">
                Authorization PIN configured in your linked bank account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleWithdraw}
              disabled={loading || !user?.bankAccount || Boolean(user?.withdrawalBanned)}
              className={`w-full py-3.5 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                user?.withdrawalBanned
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : isDisallowedDay
                  ? 'bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 shadow-rose-200 border border-rose-400'
                  : !isWithinHours
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-200 border border-amber-400'
                  : 'bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-200 border border-sky-400'
              } disabled:opacity-60`}
            >
              {loading
                ? 'Processing Withdrawal...'
                : user?.withdrawalBanned
                ? 'Withdrawal Locked — Refer (Must Invest) or Pay ₦2,100'
                : isDisallowedDay
                ? `Closed Today (${dayName}) • Drops at 8:00 PM`
                : !isWithinHours
                ? 'Withdrawal Window Closed (9:00 AM – 6:00 PM)'
                : 'Confirm Instant Withdrawal'}
            </button>
          </div>
        )}

        {/* Agent Fee Modal for unlocking withdrawal & daily returns */}
        <AgentFeeModal
          isOpen={showAgentFeeModal}
          onClose={() => setShowAgentFeeModal(false)}
          user={user}
          adminSettings={adminSettings}
          onSuccess={(updatedUser) => {
            onWithdrawSuccess(null as any, updatedUser);
          }}
          onOpenReferral={onOpenReferral}
        />
      </div>
    </div>
  );
};
