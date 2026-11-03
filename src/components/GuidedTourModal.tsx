import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Wallet,
  TrendingUp,
  UserCheck,
  Building2,
  Check,
  ShieldCheck,
  Award,
  Crown,
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'home' | 'plans' | 'invest' | 'team' | 'profile') => void;
  onOpenDeposit?: () => void;
}

interface TourStep {
  title: string;
  badge: string;
  subtitle: string;
  icon: React.ReactNode;
  highlights: string[];
  tabTarget?: 'home' | 'plans' | 'invest' | 'team' | 'profile';
  actionButtonText?: string;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenDeposit,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps: TourStep[] = [
    {
      title: 'Welcome to YAMAHA Investment!',
      badge: 'Step 1 of 4 • Overview',
      subtitle: 'Your high-yield YAMAHA investment and daily return platform.',
      icon: <Sparkles className="w-8 h-8 text-amber-300" />,
      highlights: [
        'Get ₦700 instantly on registration as welcome bonus',
        'Claim free ₦50 daily check-in rewards every 24 hours',
        'Spin the YAMAHA Fortune Wheel to win cash up to ₦10,000',
      ],
      tabTarget: 'home',
    },
    {
      title: 'How to Deposit Funds',
      badge: 'Step 2 of 4 • Account Funding',
      subtitle: 'Fund your wallet easily via direct bank transfer or voucher codes.',
      icon: <Wallet className="w-8 h-8 text-emerald-300" />,
      highlights: [
        'Click the circular "Deposit" button on your balance card',
        'Copy the verified Admin PalmPay Bank Account details',
        'Transfer minimum ₦3,500 and enter your transaction reference',
        'Or redeem instant Free Top-Up Voucher Codes!',
      ],
      tabTarget: 'home',
    },
    {
      title: 'VIP Investment Packages',
      badge: 'Step 3 of 4 • Daily Returns',
      subtitle: 'Earn guaranteed daily payouts directly credited to your wallet balance.',
      icon: <TrendingUp className="w-8 h-8 text-amber-300" />,
      highlights: [
        'Choose from YAMAHA VIP 1 (₦3,500) up to VIP 10 (₦2,000,000)',
        'Earn daily returns (e.g. VIP 1 pays ₦800 daily for 30 days = ₦24,000)',
        'Track active investments and countdown settlement timer live',
      ],
      tabTarget: 'plans',
    },
    {
      title: 'Profile & Bank Account Setup',
      badge: 'Step 4 of 4 • Withdrawals & Referrals',
      subtitle: 'Bind your Nigerian bank account for instant 24/7 withdrawals.',
      icon: <UserCheck className="w-8 h-8 text-purple-300" />,
      highlights: [
        'Bind your 10-digit PalmPay or bank account in Profile',
        'Withdraw minimum ₦800 anytime during withdrawal hours',
        'Invite friends to earn 20% Tier 1 commission across 3 team tiers!',
      ],
      tabTarget: 'profile',
    },
  ];

  const current = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      if (tourSteps[nextIndex].tabTarget && onNavigateTab) {
        onNavigateTab(tourSteps[nextIndex].tabTarget!);
      }
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      if (tourSteps[prevIndex].tabTarget && onNavigateTab) {
        onNavigateTab(tourSteps[prevIndex].tabTarget!);
      }
    }
  };

  const handleFinish = () => {
    localStorage.setItem('yamaha_tour_completed', 'true');
    localStorage.setItem('motorola_tour_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-200 relative animate-scaleUp">
        {/* Skip Header Button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all"
          title="Skip Tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Banner Top */}
        <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-6 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-purple-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 shadow">
            <Sparkles className="w-3 h-3" /> {current.badge}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur shrink-0">
              {current.icon}
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{current.title}</h2>
              <p className="text-xs text-purple-200 mt-0.5">{current.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Step Content & Highlights */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Key Feature Highlights:
          </p>

          <div className="space-y-2.5">
            {current.highlights.map((item, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-purple-900 text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-snug">{item}</span>
              </div>
            ))}
          </div>

          {/* Action trigger if step 2 */}
          {currentStep === 1 && onOpenDeposit && (
            <button
              onClick={() => {
                handleFinish();
                onOpenDeposit();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Wallet className="w-4 h-4" /> Open Deposit Modal Now
            </button>
          )}

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  if (tourSteps[idx].tabTarget && onNavigateTab) {
                    onNavigateTab(tourSteps[idx].tabTarget!);
                  }
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-purple-900' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-purple-900/20 flex items-center gap-1.5"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
