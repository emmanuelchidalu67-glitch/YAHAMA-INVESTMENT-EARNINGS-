import React, { useState } from 'react';
import { X, Building2, Search, Check, AlertCircle, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { NIGERIAN_BANKS } from '../data/nigerianBanks';
import { Bank, User } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onBankSaved: (updatedUser: User) => void;
  onRequireAuth: () => void;
}

export const AddBankModal: React.FC<AddBankModalProps> = ({
  isOpen,
  onClose,
  user,
  onBankSaved,
  onRequireAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(
    user?.bankAccount ? NIGERIAN_BANKS.find((b) => b.name === user.bankAccount?.bankName) || NIGERIAN_BANKS[0] : NIGERIAN_BANKS[0]
  );
  const [accountNumber, setAccountNumber] = useState(user?.bankAccount?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.bankAccount?.accountName || '');
  const [withdrawalPin, setWithdrawalPin] = useState(user?.withdrawalPin || user?.bankAccount?.withdrawalPin || '');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const filteredBanks = NIGERIAN_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.includes(searchQuery) ||
      (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!selectedBank) {
      setErrorMsg('Please select a bank');
      return;
    }

    if (!accountNumber || accountNumber.trim().length !== 10 || !/^\d+$/.test(accountNumber)) {
      setErrorMsg('Please enter a valid 10-digit Nigerian account number');
      return;
    }

    if (!accountName || accountName.trim().length < 3) {
      setErrorMsg('Please enter the full account name as registered with your bank');
      return;
    }

    if (!withdrawalPin || withdrawalPin.trim().length !== 4 || !/^\d{4}$/.test(withdrawalPin.trim())) {
      setErrorMsg('Please create a 4-digit numeric withdrawal security PIN (e.g. 1234)');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await ApiService.updateBankAccount({
        userId: user.id,
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        withdrawalPin: withdrawalPin.trim(),
      });

      setSuccessMsg('Bank account details & withdrawal PIN saved successfully!');
      soundService.playCoin();
      onBankSaved(res.user);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save bank account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden border-2 border-sky-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sky-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Add Bank Account</h3>
              <p className="text-xs text-slate-500 font-semibold">Select from 70+ Nigerian Banks</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shrink-0 font-black">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
              Select Nigerian Bank ({NIGERIAN_BANKS.length} available)
            </label>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bank name (e.g. PalmPay, OPay, GTBank)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-sky-100 bg-sky-50/40 text-xs font-bold text-slate-900 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="max-h-40 overflow-y-auto border-2 border-sky-100 rounded-2xl divide-y divide-sky-50 bg-sky-50/30">
              {filteredBanks.map((bank) => (
                <button
                  type="button"
                  key={bank.id}
                  onClick={() => {
                    soundService.playClick();
                    setSelectedBank(bank);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedBank?.id === bank.id
                      ? 'bg-sky-600 text-white font-black'
                      : 'hover:bg-sky-50 text-slate-800 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-3.5 h-3.5 ${selectedBank?.id === bank.id ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{bank.name}</span>
                  </div>
                  {bank.category && (
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        selectedBank?.id === bank.id
                          ? 'bg-sky-800 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {bank.category}
                    </span>
                  )}
                </button>
              ))}
              {filteredBanks.length === 0 && (
                <p className="p-3 text-xs text-slate-400 text-center font-medium">No matching bank found</p>
              )}
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
              10-Digit Account Number *
            </label>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 8149021882"
              className="w-full px-4 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 font-mono font-black text-base tracking-widest text-slate-900 outline-none"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
              Account Name (Full Name) *
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Emmanuel Chidalu"
              className="w-full px-4 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm font-black text-slate-900 outline-none uppercase"
            />
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Ensure this name matches your bank registration exactly for successful payouts.
            </p>
          </div>

          {/* 4-Digit Withdrawal Security PIN */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Create 4-Digit Withdrawal PIN *
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
              className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 font-mono font-black text-xl tracking-[0.4em] text-center text-slate-950 outline-none placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-400"
            />
            <p className="text-[10px] text-amber-900 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-700 shrink-0" />
              This secret 4-digit PIN is strictly required to authorize and verify every withdrawal request.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm shadow-md shadow-sky-200 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 mt-2 cursor-pointer border border-sky-400"
          >
            {loading ? 'Saving Details...' : 'Save Bank Account & PIN'}
          </button>
        </form>
      </div>
    </div>
  );
};
