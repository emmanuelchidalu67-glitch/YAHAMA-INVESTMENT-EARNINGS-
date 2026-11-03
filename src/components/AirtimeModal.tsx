import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  Building,
  UserCheck,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { User, AdminSettings, Transaction } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';

export type TelecomNetwork = 'MTN' | 'Airtel' | 'Glo' | '9mobile';

export interface AirtimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  adminSettings?: AdminSettings;
  onSuccess: (updatedUser: User, tx: Transaction) => void;
  onRequireAuth: () => void;
}

const NETWORKS: {
  id: TelecomNetwork;
  name: string;
  tagline: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentColor: string;
  prefixes: string[];
}[] = [
  {
    id: 'MTN',
    name: 'MTN Nigeria',
    tagline: 'Everywhere you go',
    badgeBg: 'bg-amber-400',
    badgeBorder: 'border-amber-500',
    badgeText: 'text-slate-950',
    accentColor: '#FFCC00',
    prefixes: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'],
  },
  {
    id: 'Airtel',
    name: 'Airtel Nigeria',
    tagline: 'A reason to imagine',
    badgeBg: 'bg-rose-600',
    badgeBorder: 'border-rose-700',
    badgeText: 'text-white',
    accentColor: '#E60000',
    prefixes: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'],
  },
  {
    id: 'Glo',
    name: 'Glo Nigeria',
    tagline: 'Grandmasters of data',
    badgeBg: 'bg-emerald-600',
    badgeBorder: 'border-emerald-700',
    badgeText: 'text-white',
    accentColor: '#008751',
    prefixes: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'],
  },
  {
    id: '9mobile',
    name: '9mobile Nigeria',
    tagline: 'Here for you',
    badgeBg: 'bg-teal-700',
    badgeBorder: 'border-teal-800',
    badgeText: 'text-white',
    accentColor: '#005C2B',
    prefixes: ['0809', '0817', '0818', '0909', '0908'],
  },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export const AirtimeModal: React.FC<AirtimeModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  onSuccess,
  onRequireAuth,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Network & Phone & Amount, 2 = Bank Transfer Details, 3 = Pending Receipt
  const [network, setNetwork] = useState<TelecomNetwork>('MTN');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  
  // Bank Transfer Proof Fields
  const [senderBankName, setSenderBankName] = useState<string>('');
  const [senderAccountName, setSenderAccountName] = useState<string>('');
  const [proofReference, setProofReference] = useState<string>('');
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  const discountPercent = adminSettings?.vtuAirtimeDiscountPercent ?? 3;
  const currentNetworkMeta = NETWORKS.find((n) => n.id === network) || NETWORKS[0];

  // Official Depository Account (Same as Deposit and Withdrawal Fee)
  const depositBank = adminSettings?.adminBankName || adminSettings?.bankName || 'PalmPay (PalmPay Limited)';
  const depositAccount = adminSettings?.adminAccountNumber || adminSettings?.accountNumber || '8149021882';
  const depositName = adminSettings?.adminAccountName || adminSettings?.accountName || 'EMMANUEL CHIDALU';

  // USER INSTRUCTION: "only give 2 naria away discount from the airtime only"
  const discountAmount = 2;
  const payableAmount = Math.max(1, amount - discountAmount);

  const handleCopy = (text: string, key: string) => {
    soundService.playClick();
    triggerHaptic(HapticPattern.LIGHT_TAP);
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[^\d]/g, '');
    if (cleaned.length <= 11) {
      setPhone(cleaned);
      if (cleaned.length >= 4) {
        const prefix = cleaned.substring(0, 4);
        for (const net of NETWORKS) {
          if (net.prefixes.includes(prefix)) {
            setNetwork(net.id);
            break;
          }
        }
      }
    }
  };

  const handleSelectQuickAmount = (val: number) => {
    soundService.playClick();
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleProceedToPayment = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    if (!cleanPhone || cleanPhone.length !== 11 || !/^0[789][01]\d{8}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678).');
      return;
    }
    if (amount < 50 || isNaN(amount)) {
      setErrorMsg('Minimum airtime recharge amount is ₦50.');
      return;
    }
    setErrorMsg('');
    soundService.playClick();
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    setStep(2);
  };

  const handleSubmitBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!proofReference || proofReference.trim().length < 3) {
      setErrorMsg('Please enter your Bank Transfer Reference, Session ID, or Transaction ID.');
      return;
    }

    if (!senderAccountName || senderAccountName.trim().length < 3) {
      setErrorMsg('Please enter the Sender / Depositor Account Name used for the transfer.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    triggerHaptic(HapticPattern.BUTTON_CLICK);

    try {
      const res = await ApiService.purchaseVtu({
        userId: user.id,
        type: 'airtime',
        network,
        phone,
        planName: `₦${amount.toLocaleString()} ${network} Airtime`,
        amount: payableAmount,
        discountSaved: discountAmount,
        paymentMethod: 'Bank Transfer (Transfer Only)',
        proofReference: proofReference.trim(),
        senderBankName: senderBankName.trim() || undefined,
        senderAccountName: senderAccountName.trim(),
      });

      if (res && res.success) {
        soundService.playSuccess();
        triggerHaptic(HapticPattern.CONFIRM);
        setReceiptTx(res.transaction);
        setStep(3);
        onSuccess(res.user, res.transaction);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit airtime recharge order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setReceiptTx(null);
    setProofReference('');
    setSenderBankName('');
    setSenderAccountName('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border-2 border-amber-200 max-h-[94vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-200 shrink-0 font-black">
            <PhoneCall className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                Buy Airtime
              </h3>
              <span className="bg-amber-300 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400">
                SAVE ₦2 FLAT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Recharge MTN, Airtel, Glo &amp; 9mobile • Instant Dispatch upon Transfer Approval
            </p>
          </div>
        </div>

        {/* Step Progress Pill */}
        <div className="flex items-center justify-between mb-4 bg-slate-100 p-1.5 rounded-2xl text-[11px] font-bold">
          <div
            className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
              step === 1 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-500'
            }`}
          >
            1. Select &amp; Amount
          </div>
          <div
            className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
              step === 2 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-500'
            }`}
          >
            2. Bank Transfer
          </div>
          <div
            className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
              step === 3 ? 'bg-emerald-500 text-white font-black shadow-xs' : 'text-slate-500'
            }`}
          >
            3. Order Status
          </div>
        </div>

        {/* Step 1: Select Network, Enter Phone, Pick Amount */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Step 1: Choose Network */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Step 1: Choose Network
              </label>
              <div className="grid grid-cols-4 gap-2">
                {NETWORKS.map((net) => {
                  const isSelected = network === net.id;
                  return (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        triggerHaptic(HapticPattern.BUTTON_CLICK);
                        setNetwork(net.id);
                      }}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? `${net.badgeBg} ${net.badgeBorder} shadow-md scale-102`
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`font-black text-sm ${
                          isSelected ? net.badgeText : 'text-slate-700'
                        }`}
                      >
                        {net.id}
                      </span>
                      <span
                        className={`text-[9px] font-bold ${
                          isSelected ? net.badgeText : 'text-slate-400'
                        }`}
                      >
                        ₦2 Off
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Recipient Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Step 2: Recipient Phone Number
                </label>
                {user?.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      handlePhoneChange(user.phone);
                    }}
                    className="text-[10.5px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 cursor-pointer"
                  >
                    Use My Number ({user.phone.slice(0, 4)}...)
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    🇳🇬 +234
                  </span>
                </div>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="08012345678"
                  className="w-full pl-24 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-400 focus:bg-white text-slate-900 font-mono font-bold text-sm tracking-wider focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Step 3: Select or Enter Amount */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Step 3: Select Airtime Amount
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {QUICK_AMOUNTS.map((val) => {
                  const isSelected = amount === val;
                  const itemPayable = Math.max(1, val - 2);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectQuickAmount(val)}
                      className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="block font-black text-sm">₦{val.toLocaleString()}</span>
                      <span className="block text-[10px] text-emerald-600 font-extrabold">
                        Pay ₦{itemPayable.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-black text-slate-500 pointer-events-none">
                  ₦
                </span>
                <input
                  type="number"
                  min={50}
                  max={50000}
                  value={customAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomAmount(val);
                    const n = parseInt(val, 10);
                    if (!isNaN(n)) setAmount(n);
                  }}
                  placeholder="Or enter custom amount (e.g. 1000)"
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-400 focus:bg-white text-slate-900 font-mono font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Price & Discount Summary Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/60 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">Airtime Value: ₦{amount.toLocaleString()}</p>
                <p className="text-xs font-black text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Instant Discount: -₦2.00 Flat Off
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Amount to Pay
                </span>
                <span className="text-xl font-black text-slate-950 font-mono">
                  ₦{payableAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Policy Notice: Bank Transfer Only */}
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black">Direct Bank Transfer Only:</span> In line with platform rules, airtime is paid via bank transfer to the official depository and delivered upon admin confirmation.
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Proceed to Payment Button */}
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-200 cursor-pointer active:scale-98 transition-transform border border-amber-400"
            >
              <span>Continue to Bank Transfer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Pay Via Bank Transfer (Transfer Only) */}
        {step === 2 && (
          <form onSubmit={handleSubmitBankTransfer} className="space-y-4 animate-in fade-in">
            {/* Depository Bank Account Details Box */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50/70 to-white border-2 border-amber-300 text-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                  Official Depository Account
                </span>
                <span className="text-xs font-black text-slate-900 font-mono">
                  Exact Pay: ₦{payableAmount.toLocaleString()}
                </span>
              </div>

              {/* Account Number with Copy */}
              <div className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Account Number
                  </span>
                  <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                    {depositAccount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(depositAccount, 'account')}
                  className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  {copiedKey === 'account' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-800" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bank Name & Account Name */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Bank Name</span>
                  <span className="font-black text-slate-900 truncate block">{depositBank}</span>
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Account Name</span>
                  <span className="font-black text-slate-900 truncate block">{depositName}</span>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-black text-slate-800">
                👉 Transfer exactly ₦{payableAmount.toLocaleString()} to the account above via your bank app or USSD.
              </p>
              <p className="text-[11px]">
                After making the transfer, fill in your sender details below and submit. The recharge will show as <strong>Pending</strong> until approved by admin.
              </p>
            </div>

            {/* Sender Bank Transfer Input Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Your Bank Name (Sender Bank)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={senderBankName}
                    onChange={(e) => setSenderBankName(e.target.value)}
                    placeholder="e.g. PalmPay, OPay, GTBank, Zenith, Kuda"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-400 focus:bg-white text-slate-900 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Sender Account Name (Depositor Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={senderAccountName}
                    onChange={(e) => setSenderAccountName(e.target.value)}
                    placeholder="e.g. John Doe / Account Name on your Bank App"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-400 focus:bg-white text-slate-900 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Session ID / Bank Transfer Reference
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={proofReference}
                    onChange={(e) => setProofReference(e.target.value)}
                    placeholder="e.g. 100004241004123456 or Receipt Session ID"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-400 focus:bg-white text-slate-900 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Buttons: Back and Submit */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer transition-colors"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-200 cursor-pointer active:scale-98 transition-transform border border-amber-400"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Paid (Submit)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Pending Admin Approval Receipt */}
        {step === 3 && receiptTx && (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            {/* Status Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/60 border-2 border-amber-300 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md shadow-amber-200 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-slate-900">
                Airtime Recharge Pending
              </h4>
              <p className="text-xs text-amber-900 font-bold max-w-sm mx-auto leading-relaxed">
                Your bank transfer proof has been submitted. It is now <strong>PENDING ADMIN APPROVAL</strong>. Your ₦{amount.toLocaleString()} {network} airtime will be credited to {phone} immediately once verified!
              </p>
            </div>

            {/* Receipt Summary Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Order ID</span>
                <span className="font-mono font-black text-slate-800">{receiptTx.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Network &amp; Value</span>
                <span className="font-black text-slate-900">{network} • ₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Recipient Phone</span>
                <span className="font-mono font-black text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Payment Method</span>
                <span className="font-bold text-slate-900">Bank Transfer (Depository)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Amount Paid</span>
                <span className="font-mono font-black text-amber-700">₦{payableAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Transfer Ref / Session</span>
                <span className="font-mono font-black text-slate-900 truncate max-w-[180px]">
                  {proofReference || receiptTx.proofReference}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-bold">Status</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  ⏳ Awaiting Admin Approval
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
              >
                Another Recharge
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
