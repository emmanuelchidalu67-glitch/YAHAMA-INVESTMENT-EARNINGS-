import React, { useState } from 'react';
import {
  X,
  Wifi,
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
  Flame,
} from 'lucide-react';
import { User, AdminSettings, Transaction } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';

export type TelecomNetwork = 'MTN' | 'Airtel' | 'Glo' | '9mobile';

export interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  adminSettings?: AdminSettings;
  onSuccess: (updatedUser: User, tx: Transaction) => void;
  onRequireAuth: () => void;
}

interface DataBundle {
  id: string;
  size: string; // e.g. "500MB", "1GB", "2GB"
  name: string;
  validity: string;
  price: number;
  normalPrice: number;
  category: 'popular' | 'sme' | 'monthly' | 'mega';
  discountTag: string;
}

const NETWORKS: {
  id: TelecomNetwork;
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentColor: string;
  prefixes: string[];
}[] = [
  {
    id: 'MTN',
    name: 'MTN Nigeria',
    badgeBg: 'bg-amber-400',
    badgeBorder: 'border-amber-500',
    badgeText: 'text-slate-950',
    accentColor: '#FFCC00',
    prefixes: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'],
  },
  {
    id: 'Airtel',
    name: 'Airtel Nigeria',
    badgeBg: 'bg-rose-600',
    badgeBorder: 'border-rose-700',
    badgeText: 'text-white',
    accentColor: '#E60000',
    prefixes: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'],
  },
  {
    id: 'Glo',
    name: 'Glo Nigeria',
    badgeBg: 'bg-emerald-600',
    badgeBorder: 'border-emerald-700',
    badgeText: 'text-white',
    accentColor: '#008751',
    prefixes: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'],
  },
  {
    id: '9mobile',
    name: '9mobile Nigeria',
    badgeBg: 'bg-teal-700',
    badgeBorder: 'border-teal-800',
    badgeText: 'text-white',
    accentColor: '#005C2B',
    prefixes: ['0809', '0817', '0818', '0909', '0908'],
  },
];

const DATA_BUNDLES: Record<TelecomNetwork, DataBundle[]> = {
  MTN: [
    { id: 'mtn-500mb', size: '500MB', name: '500MB SME Direct', validity: '30 Days', price: 380, normalPrice: 500, category: 'sme', discountTag: 'SAVE 24%' },
    { id: 'mtn-1gb', size: '1GB', name: '1GB Direct Data', validity: '30 Days', price: 750, normalPrice: 1000, category: 'popular', discountTag: 'HOT • ₦750/GB' },
    { id: 'mtn-2gb', size: '2GB', name: '2GB High Speed', validity: '30 Days', price: 1500, normalPrice: 2000, category: 'popular', discountTag: 'BESTSELLER' },
    { id: 'mtn-3gb', size: '3GB', name: '3GB Direct High Speed', validity: '30 Days', price: 2250, normalPrice: 3000, category: 'monthly', discountTag: 'VALUE' },
    { id: 'mtn-5gb', size: '5GB', name: '5GB Mega Bundle', validity: '30 Days', price: 3750, normalPrice: 5000, category: 'popular', discountTag: 'TOP VALUE' },
    { id: 'mtn-10gb', size: '10GB', name: '10GB Ultra Speed', validity: '30 Days', price: 7500, normalPrice: 10000, category: 'monthly', discountTag: 'CHEAP RATE' },
    { id: 'mtn-20gb', size: '20GB', name: '20GB Heavy Data', validity: '30 Days', price: 15000, normalPrice: 20000, category: 'mega', discountTag: 'MEGA BUNDLE' },
    { id: 'mtn-40gb', size: '40GB', name: '40GB Streamer Pack', validity: '30 Days', price: 30000, normalPrice: 40000, category: 'mega', discountTag: 'MAX VALUE' },
  ],
  Airtel: [
    { id: 'airtel-500mb', size: '500MB', name: '500MB Direct SME', validity: '30 Days', price: 380, normalPrice: 500, category: 'sme', discountTag: 'SAVE 24%' },
    { id: 'airtel-1gb', size: '1GB', name: '1GB Direct Data', validity: '30 Days', price: 750, normalPrice: 1000, category: 'popular', discountTag: 'HOT • ₦750/GB' },
    { id: 'airtel-2gb', size: '2GB', name: '2GB High Speed', validity: '30 Days', price: 1500, normalPrice: 2000, category: 'popular', discountTag: 'BESTSELLER' },
    { id: 'airtel-3gb', size: '3GB', name: '3GB Direct High Speed', validity: '30 Days', price: 2250, normalPrice: 3000, category: 'monthly', discountTag: 'VALUE' },
    { id: 'airtel-5gb', size: '5GB', name: '5GB Mega Bundle', validity: '30 Days', price: 3750, normalPrice: 5000, category: 'popular', discountTag: 'TOP VALUE' },
    { id: 'airtel-10gb', size: '10GB', name: '10GB Ultra Speed', validity: '30 Days', price: 7500, normalPrice: 10000, category: 'monthly', discountTag: 'CHEAP RATE' },
    { id: 'airtel-20gb', size: '20GB', name: '20GB Heavy Data', validity: '30 Days', price: 15000, normalPrice: 20000, category: 'mega', discountTag: 'MEGA BUNDLE' },
  ],
  Glo: [
    { id: 'glo-500mb', size: '500MB', name: '500MB Direct Data', validity: '30 Days', price: 380, normalPrice: 500, category: 'sme', discountTag: 'SAVE 24%' },
    { id: 'glo-1gb', size: '1GB', name: '1GB Direct Data', validity: '30 Days', price: 750, normalPrice: 1000, category: 'popular', discountTag: 'HOT • ₦750/GB' },
    { id: 'glo-2gb', size: '2GB', name: '2GB High Speed', validity: '30 Days', price: 1500, normalPrice: 2000, category: 'popular', discountTag: 'BESTSELLER' },
    { id: 'glo-3gb', size: '3GB', name: '3GB Direct Data', validity: '30 Days', price: 2250, normalPrice: 3000, category: 'monthly', discountTag: 'VALUE' },
    { id: 'glo-5gb', size: '5GB', name: '5GB Mega Bundle', validity: '30 Days', price: 3750, normalPrice: 5000, category: 'popular', discountTag: 'TOP VALUE' },
    { id: 'glo-10gb', size: '10GB', name: '10GB Ultra Speed', validity: '30 Days', price: 7500, normalPrice: 10000, category: 'monthly', discountTag: 'CHEAP RATE' },
    { id: 'glo-20gb', size: '20GB', name: '20GB Heavy Data', validity: '30 Days', price: 15000, normalPrice: 20000, category: 'mega', discountTag: 'MEGA BUNDLE' },
  ],
  '9mobile': [
    { id: '9mob-500mb', size: '500MB', name: '500MB Direct Data', validity: '30 Days', price: 380, normalPrice: 500, category: 'sme', discountTag: 'SAVE 24%' },
    { id: '9mob-1gb', size: '1GB', name: '1GB Direct Data', validity: '30 Days', price: 750, normalPrice: 1000, category: 'popular', discountTag: 'HOT • ₦750/GB' },
    { id: '9mob-2gb', size: '2GB', name: '2GB High Speed', validity: '30 Days', price: 1500, normalPrice: 2000, category: 'popular', discountTag: 'BESTSELLER' },
    { id: '9mob-3gb', size: '3GB', name: '3GB High Speed', validity: '30 Days', price: 2250, normalPrice: 3000, category: 'monthly', discountTag: 'VALUE' },
    { id: '9mob-5gb', size: '5GB', name: '5GB Mega Bundle', validity: '30 Days', price: 3750, normalPrice: 5000, category: 'popular', discountTag: 'TOP VALUE' },
    { id: '9mob-10gb', size: '10GB', name: '10GB Ultra Speed', validity: '30 Days', price: 7500, normalPrice: 10000, category: 'monthly', discountTag: 'CHEAP RATE' },
  ],
};

export const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  onSuccess,
  onRequireAuth,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Network, Phone, Plan; 2 = Bank Transfer; 3 = Pending Receipt
  const [network, setNetwork] = useState<TelecomNetwork>('MTN');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [selectedBundle, setSelectedBundle] = useState<DataBundle>(DATA_BUNDLES.MTN[1]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'popular' | 'sme' | 'monthly' | 'mega'>('all');

  // Bank Transfer Proof Fields
  const [senderBankName, setSenderBankName] = useState<string>('');
  const [senderAccountName, setSenderAccountName] = useState<string>('');
  const [proofReference, setProofReference] = useState<string>('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  // Depository Account (Same as Deposit and Withdrawal Fee)
  const depositBank = adminSettings?.adminBankName || adminSettings?.bankName || 'PalmPay (PalmPay Limited)';
  const depositAccount = adminSettings?.adminAccountNumber || adminSettings?.accountNumber || '8149021882';
  const depositName = adminSettings?.adminAccountName || adminSettings?.accountName || 'EMMANUEL CHIDALU';

  const bundles = DATA_BUNDLES[network] || DATA_BUNDLES.MTN;
  const filteredBundles = categoryFilter === 'all' ? bundles : bundles.filter((b) => b.category === categoryFilter);

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
            setSelectedBundle(DATA_BUNDLES[net.id][1] || DATA_BUNDLES[net.id][0]);
            break;
          }
        }
      }
    }
  };

  const handleSelectNetwork = (netId: TelecomNetwork) => {
    soundService.playClick();
    triggerHaptic(HapticPattern.BUTTON_CLICK);
    setNetwork(netId);
    const netBundles = DATA_BUNDLES[netId];
    setSelectedBundle(netBundles[1] || netBundles[0]);
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
    if (!selectedBundle) {
      setErrorMsg('Please select a data bundle plan.');
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
        type: 'data',
        network,
        phone,
        planName: `${network} ${selectedBundle.name} (${selectedBundle.size})`,
        amount: selectedBundle.price,
        dataAmount: selectedBundle.size,
        discountSaved: selectedBundle.normalPrice - selectedBundle.price,
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
      setErrorMsg(err?.message || 'Failed to submit data bundle order. Please try again.');
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
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border-2 border-sky-200 max-h-[94vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-200 shrink-0 font-black">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-tight">
                Buy Cheap Data
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                CHEAP RATE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              High-Speed 4G/5G Bundles • Real MB/GB at Cheap Direct Rates
            </p>
          </div>
        </div>

        {/* Step Progress Pill */}
        <div className="flex items-center justify-between mb-4 bg-slate-100 p-1.5 rounded-2xl text-[11px] font-bold">
          <div
            className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
              step === 1 ? 'bg-sky-600 text-white font-black shadow-xs' : 'text-slate-500'
            }`}
          >
            1. Plan &amp; Recipient
          </div>
          <div
            className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
              step === 2 ? 'bg-sky-600 text-white font-black shadow-xs' : 'text-slate-500'
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

        {/* Step 1: Select Network, Phone, and Data Plan */}
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
                      onClick={() => handleSelectNetwork(net.id)}
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
                        Direct 4G/5G
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
                    className="text-[10.5px] font-extrabold text-sky-700 hover:text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 cursor-pointer"
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
                  className="w-full pl-24 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white text-slate-900 font-mono font-bold text-sm tracking-wider focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Step 3: Select Data Plan */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Step 3: Select Data Bundle
                </label>
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1">
                  {(['all', 'popular', 'sme', 'monthly'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        categoryFilter === cat
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Bundles Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                {filteredBundles.map((b) => {
                  const isSelected = selectedBundle?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        triggerHaptic(HapticPattern.BUTTON_CLICK);
                        setSelectedBundle(b);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-500 shadow-md ring-1 ring-sky-400'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-mono font-black text-base text-slate-900 leading-tight">
                          {b.size}
                        </span>
                        <span className="text-[9px] font-black bg-amber-300 text-slate-950 px-1.5 py-0.5 rounded">
                          {b.discountTag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold truncate mb-1">
                        {b.name}
                      </p>
                      <div className="flex items-baseline justify-between">
                        <span className="font-black text-sm text-sky-700 font-mono">
                          ₦{b.price.toLocaleString()}
                        </span>
                        <span className="text-[9.5px] text-slate-400 line-through">
                          ₦{b.normalPrice.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Plan Cost & Savings Box */}
            {selectedBundle && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {network} {selectedBundle.size} ({selectedBundle.validity})
                  </p>
                  <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Save ₦{(selectedBundle.normalPrice - selectedBundle.price).toLocaleString()} off normal rate
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Amount to Pay
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    ₦{selectedBundle.price.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Policy Notice: Bank Transfer Only */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black">Direct Bank Transfer Only:</span> Data bundles are paid via direct bank transfer to the depository account and activated upon admin confirmation.
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-200 cursor-pointer active:scale-98 transition-transform border border-sky-500"
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
            <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-50 via-blue-50/70 to-white border-2 border-sky-300 text-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 bg-sky-200 px-2 py-0.5 rounded-md">
                  Official Depository Account
                </span>
                <span className="text-xs font-black text-slate-900 font-mono">
                  Exact Pay: ₦{selectedBundle.price.toLocaleString()}
                </span>
              </div>

              {/* Account Number with Copy */}
              <div className="bg-white p-3 rounded-2xl border border-sky-200 flex items-center justify-between">
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
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  {copiedKey === 'account' ? (
                    <>
                      <Check className="w-4 h-4" />
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
                <div className="bg-white p-2.5 rounded-2xl border border-sky-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Bank Name</span>
                  <span className="font-black text-slate-900 truncate block">{depositBank}</span>
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-sky-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Account Name</span>
                  <span className="font-black text-slate-900 truncate block">{depositName}</span>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-black text-slate-800">
                👉 Transfer exactly ₦{selectedBundle.price.toLocaleString()} to the account above via your bank app or USSD.
              </p>
              <p className="text-[11px]">
                Bundle: <strong>{network} {selectedBundle.size}</strong> for <strong>{phone}</strong>. Status will remain <strong>Pending</strong> until approved by admin.
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white text-slate-900 text-xs font-bold focus:outline-none"
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
                    placeholder="e.g. Account Name on your Bank App"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white text-slate-900 text-xs font-bold focus:outline-none"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white text-slate-900 text-xs font-mono font-bold focus:outline-none"
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
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-200 cursor-pointer active:scale-98 transition-transform border border-sky-500"
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
            <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100/60 border-2 border-sky-300 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-200 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-slate-900">
                Data Order Pending
              </h4>
              <p className="text-xs text-sky-900 font-bold max-w-sm mx-auto leading-relaxed">
                Your bank transfer proof has been submitted. It is now <strong>PENDING ADMIN APPROVAL</strong>. Your {network} {selectedBundle.size} data bundle will be dispatched to {phone} immediately once verified!
              </p>
            </div>

            {/* Receipt Summary Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Order ID</span>
                <span className="font-mono font-black text-slate-800">{receiptTx.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Network &amp; Bundle</span>
                <span className="font-black text-slate-900">{network} • {selectedBundle.size} ({selectedBundle.validity})</span>
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
                <span className="font-mono font-black text-sky-700">₦{selectedBundle.price.toLocaleString()}</span>
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
                Another Bundle
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs cursor-pointer shadow-sm"
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
