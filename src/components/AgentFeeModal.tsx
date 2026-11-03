import React, { useState } from 'react';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';
import {
  X,
  ShieldAlert,
  Building2,
  Users,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Lock,
  Unlock,
  AlertCircle,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface AgentFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  adminSettings?: AdminSettings;
  onSuccess: (updatedUser: User) => void;
  onOpenReferral?: () => void;
}

export const AgentFeeModal: React.FC<AgentFeeModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  onSuccess,
  onOpenReferral,
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [transferRef, setTransferRef] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const AGENT_FEE = 2100;
  const agentBankName = adminSettings?.adminBankName || adminSettings?.bankName || 'PalmPay (PalmPay Limited)';
  const agentAccountNumber = adminSettings?.adminAccountNumber || adminSettings?.accountNumber || '8149021882';
  const agentAccountName = adminSettings?.adminAccountName || adminSettings?.accountName || 'EMMANUEL CHIDALU';
  const agentUssdCode = adminSettings?.adminUssdCode || '';

  const handleSubmitTransferProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferRef.trim()) {
      setErrorMsg('Please enter your bank transfer reference or sender name.');
      return;
    }
    setErrorMsg('');
    setTransferSubmitting(true);
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    try {
      const res = await ApiService.payWithdrawalAgentFee({
        userId: user.id,
        paymentMethod: 'transfer',
        proofReference: transferRef.trim(),
      });
      if (res && res.success) {
        soundService.playSuccess();
        triggerHaptic(HapticPattern.CONFIRM);
        setSuccessMsg(res.message || '₦2,100 Agent Fee bank transfer proof submitted for admin verification.');
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error submitting transfer proof. Please try again.');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    soundService.playClick();
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/#ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleCopyAccount = () => {
    soundService.playClick();
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    navigator.clipboard.writeText(agentAccountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border-2 border-sky-100 max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-200 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900">
              Unlock Withdrawal & Daily Yield
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Withdrawal Agent Fee: <strong className="text-amber-600 font-black">₦2,100</strong> (Bank Transfer Only)
            </p>
          </div>
        </div>

        {/* Notice Info */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 text-amber-950 text-xs space-y-1.5 mb-4">
          <div className="flex items-center gap-1.5 font-black text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Withdrawal Lock Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
            Your withdrawal is currently locked. Daily investment returns are paused until you <strong className="font-black text-amber-950">refer friends who invest in a plan</strong> or pay the <strong className="font-black text-amber-950">₦2,100 withdrawal agent fee via bank transfer</strong>.
          </p>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Option 1: Refer Friends & Friend Must Invest First (FREE) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-900 font-black text-xs">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Option A: Refer Friends (100% Free)</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-300">
              Free Unlock
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-sky-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-black text-sky-950 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Friend Must Invest First</span>
            </div>
            <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
              Invite a friend to register. As soon as your invited friend purchases and activates any Motorola VIP plan, your withdrawal lock is lifted automatically and your 24h daily investment earnings resume!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-sky-300 hover:bg-sky-50 text-sky-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-transform"
            >
              {copiedRef ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Copied Link!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-600" /> Copy Referral Link
                </>
              )}
            </button>
            {onOpenReferral && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReferral();
                }}
                className="py-2.5 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer active:scale-98 transition-transform"
              >
                <span>Referral Team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Option 2: Pay ₦2,100 Agent Fee via Bank Transfer Only */}
        <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
              <Unlock className="w-4 h-4 text-amber-500" />
              <span>Option B: Pay ₦2,100 Agent Fee</span>
            </div>
            <span className="font-mono font-black text-xs text-amber-700">₦2,100.00</span>
          </div>

          {/* Explicit Home Balance Not Eligible Warning Banner */}
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2 text-[11px]">
            <Ban className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold leading-tight">
              Bank Transfer Only — Home balance is <u>not eligible</u> to pay this fee.
            </span>
          </div>

          <form onSubmit={handleSubmitTransferProof} className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50/60 border-2 border-sky-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  Official Depository Account
                </p>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black px-2 py-0.5 rounded-md">
                  Same as Deposit Account
                </span>
              </div>
              <div className="font-bold text-slate-800 space-y-1 bg-white p-2.5 rounded-lg border border-sky-100 shadow-xs">
                <p className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Bank:</span>
                  <span className="font-black text-slate-900">{agentBankName}</span>
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Account Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sky-700 text-sm">
                      {agentAccountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="px-2 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedAccount ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Account Name:</span>
                  <span className="font-black text-slate-900 text-right text-[11px] uppercase">{agentAccountName}</span>
                </p>
                {agentUssdCode && (
                  <p className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 text-[11px]">USSD Code:</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">{agentUssdCode}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Bank Transfer Session ID / Reference / Sender Name
              </label>
              <input
                type="text"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="e.g. Session ID or Sender Account Name"
                className="w-full px-3 py-2.5 text-xs border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={transferSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-200 cursor-pointer disabled:opacity-50 active:scale-98 transition-transform"
            >
              <Building2 className="w-4 h-4" />
              <span>{transferSubmitting ? 'Submitting Transfer Proof...' : 'Submit ₦2,100 Transfer Proof'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
