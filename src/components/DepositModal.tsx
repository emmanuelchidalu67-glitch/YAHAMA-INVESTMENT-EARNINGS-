import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Building2,
  Sparkles,
  CheckCircle2,
  Zap,
  Clock,
} from 'lucide-react';
import { AdminSettings, User, Transaction } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  adminSettings: AdminSettings;
  onDepositSuccess: (tx: Transaction) => void;
  onRequireAuth: () => void;
}

const QUICK_AMOUNTS = [3500, 7000, 15000, 30000, 60000, 120000, 250000, 500000, 1000000];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  onDepositSuccess,
  onRequireAuth,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState<number>(3500);
  const [customAmount, setCustomAmount] = useState<string>('3500');
  const [proofReference, setProofReference] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedUssd, setCopiedUssd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);

  // Watch for instant live approval while on confirmation screen (must be declared before any conditional return)
  useEffect(() => {
    if (!isOpen || !successTx || successTx.status === 'approved' || !user?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await ApiService.getTransactionHistory(user.id);
        const match = res.transactions.find((t) => t.id === successTx.id);
        if (match && match.status === 'approved') {
          setSuccessTx(match);
          soundService.playCoin();
          triggerHaptic(HapticPattern.DEPOSIT_APPROVED);
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen, successTx?.id, successTx?.status, user?.id]);

  if (!isOpen) return null;

  const minDeposit = adminSettings.minDepositAmount || 3500;
  const bankName = adminSettings.adminBankName || 'PalmPay / Commercial Bank Transfer';
  const accountNumber = adminSettings.adminAccountNumber || '';
  const accountName = adminSettings.adminAccountName || 'YAMAHA INVESTMENT EARNINGS INCOME OR EMEKA EMMANUEL CHIMDALU';
  const ussdCode = adminSettings.adminUssdCode || '';

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

  const handleCopy = (text: string, type: 'acc' | 'ussd') => {
    soundService.playClick();
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedUssd(true);
      setTimeout(() => setCopiedUssd(false), 2000);
    }
  };

  const handleSubmitDeposit = async () => {
    soundService.playClick();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (amount < minDeposit) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(`Minimum deposit amount is ₦${minDeposit.toLocaleString()}`);
      return;
    }

    if (!proofReference || proofReference.trim().length < 3) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg('Please enter your transfer sender name or payment reference');
      return;
    }

    triggerHaptic(HapticPattern.INVEST_CONFIRM);
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await ApiService.requestDeposit({
        userId: user.id,
        amount,
        paymentMethod: bankName,
        proofReference: proofReference.trim(),
      });

      triggerHaptic(HapticPattern.INVEST_SUCCESS);
      setSuccessTx(res.transaction);
      onDepositSuccess(res.transaction);
      soundService.playDeposit();
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(err.message || 'Deposit request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    soundService.playClick();
    setStep(1);
    setSuccessTx(null);
    setProofReference('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden border border-slate-700/80 max-h-[92vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">Deposit Funds</h3>
              <p className="text-xs text-slate-400 font-medium">Bank Transfer & Admin Verification</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {successTx ? (
          <div className="py-6 text-center space-y-4 relative z-10">
            <div
              className={`w-16 h-16 ${
                successTx.status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              } rounded-3xl border-2 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-90`}
            >
              {successTx.status === 'approved' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              ) : (
                <Clock className="w-10 h-10 text-sky-400 animate-pulse" />
              )}
            </div>

            <div>
              <h4 className="font-black text-lg text-white">
                {successTx.status === 'approved'
                  ? '🎉 Deposit Approved & Credited!'
                  : 'Deposit Request Submitted!'}
              </h4>
              <p className="text-xs text-slate-300 font-semibold mt-1">
                {successTx.status === 'approved' ? (
                  <>
                    Your deposit of{' '}
                    <span className="font-black text-emerald-400">
                      ₦{successTx.amount.toLocaleString()}
                    </span>{' '}
                    has been verified by Admin and credited to your balance!
                  </>
                ) : (
                  <>
                    Your deposit request of{' '}
                    <span className="font-black text-sky-400">
                      ₦{successTx.amount.toLocaleString()}
                    </span>{' '}
                    has been logged and is awaiting Admin confirmation. Once confirmed by the administrator, your wallet will be credited immediately.
                  </>
                )}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl ${
                successTx.status === 'approved'
                  ? 'bg-emerald-950/40 border-emerald-800/60'
                  : 'bg-slate-800/80 border-slate-700/80'
              } border text-left text-xs space-y-2.5 shadow-inner`}
            >
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Transaction ID:</span>
                <span className="font-mono font-black text-slate-200">{successTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Amount:</span>
                <span className="font-mono font-black text-emerald-400">
                  ₦{successTx.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Status:</span>
                <span
                  className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] ${
                    successTx.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {successTx.status === 'approved' ? 'Credited (Active)' : 'Awaiting Admin Confirmation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Payment Method:</span>
                <span className="font-bold text-slate-200">{successTx.paymentMethod}</span>
              </div>
              {successTx.proofReference && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Reference / Sender:</span>
                  <span className="font-mono font-bold text-slate-200">{successTx.proofReference}</span>
                </div>
              )}
            </div>

            {successTx.status !== 'approved' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-[11px] text-amber-300 font-medium text-left">
                <strong>Admin Confirmation Protocol:</strong> Automatic system credits are disabled. The platform admin must confirm and approve your transfer in the depository bank account before your balance will be credited. You can monitor the status under History.
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95 transition-all"
            >
              Done & Return to App
            </button>
          </div>
        ) : (
          /* Step Flow */
          <div className="mt-4 space-y-5 relative z-10">
            {/* Step Indicator */}
            <div className="flex items-center justify-between text-xs font-black text-slate-400 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
              <div
                className={`flex items-center gap-1.5 ${
                  step === 1 ? 'text-sky-400 font-black' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 1 ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  1
                </span>
                <span>Select Amount</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <div
                className={`flex items-center gap-1.5 ${
                  step === 2 ? 'text-sky-400 font-black' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 2 ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  2
                </span>
                <span>Payment & Proof</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 1 ? (
              /* STEP 1: Amount Selection */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                    Quick Amount Selector (₦)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectQuick(val)}
                        className={`py-2.5 px-1 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                          amount === val
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 border-amber-300 shadow-md scale-102'
                            : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                        }`}
                      >
                        ₦{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Or Enter Custom Amount (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                      ₦
                    </span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomChange}
                      placeholder="3000"
                      className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-700 bg-slate-800/90 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-black text-base text-white outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                    Minimum deposit: <span className="font-black text-amber-400">₦{minDeposit.toLocaleString()}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    if (amount < minDeposit) {
                      setErrorMsg(`Minimum deposit is ₦${minDeposit.toLocaleString()}`);
                      return;
                    }
                    setErrorMsg('');
                    setStep(2);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer border border-sky-300"
                >
                  Proceed to Bank Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* STEP 2: Bank Details & Proof Submission */
              <div className="space-y-4">
                <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700 text-slate-100 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-sky-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      Official Deposit Account
                    </span>
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                      Verified Channel
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Bank Name</p>
                    <p className="font-black text-base text-white">{bankName}</p>
                  </div>

                  {accountNumber ? (
                    <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-700/80 shadow-inner">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Account Number
                        </p>
                        <p className="font-mono font-black text-xl text-amber-400 tracking-wider">
                          {accountNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(accountNumber, 'acc')}
                        className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                      >
                        {copiedAccount ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                        {copiedAccount ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700 text-xs text-slate-300">
                      Please contact Customer Support or check back shortly for the active collection account details.
                    </div>
                  )}

                  {accountName && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Account Name</p>
                      <p className="font-black text-sm text-slate-200 uppercase">{accountName}</p>
                    </div>
                  )}

                  {ussdCode && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                      <span className="text-slate-400 font-medium">Quick USSD:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(ussdCode, 'ussd')}
                        className="font-mono text-amber-400 underline font-black cursor-pointer"
                      >
                        {copiedUssd ? 'USSD Copied!' : ussdCode}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 font-medium">
                  <strong>Transfer Amount:</strong> Transfer exactly{' '}
                  <span className="font-black text-white underline">₦{amount.toLocaleString()}</span> to the
                  account above, then input your sender name or transaction reference below.
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    Sender Name / Payment Reference *
                  </label>
                  <input
                    type="text"
                    value={proofReference}
                    onChange={(e) => setProofReference(e.target.value)}
                    placeholder="e.g. John Doe / PalmPay Ref: 981240"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800/90 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Enter the name on your bank account or payment reference for instant credit confirmation.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setStep(1);
                    }}
                    className="w-1/3 py-3 rounded-2xl border border-slate-700 text-slate-300 font-black text-xs hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitDeposit}
                    disabled={loading}
                    className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                  >
                    {loading ? (
                      'Submitting...'
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        I Have Paid (Submit for Admin Approval)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
