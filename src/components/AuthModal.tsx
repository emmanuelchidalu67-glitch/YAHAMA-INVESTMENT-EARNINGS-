import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Lock,
  Phone,
  Mail,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Check,
  Key,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: User) => void;
  adminSettings?: AdminSettings;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
  adminSettings,
}) => {
  const { language, setLanguage, currentLanguage, languages } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const welcomeAmount = adminSettings?.welcomeBonusAmount || 700;

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Password Visibility State
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Send Simulated OTP
  const handleSendOtp = () => {
    soundService.playClick();
    if (!phone || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid phone number before requesting OTP.');
      return;
    }

    setErrorMsg('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSentNotice(`OTP Sent to ${phone}! Verification Code: ${code}`);
    setOtpCountdown(60);

    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setErrorMsg('');

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required sign up fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match! Please check and try again.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (generatedOtp && otpCode.trim() !== generatedOtp) {
      setErrorMsg(`Invalid Phone Verification Code. Enter ${generatedOtp}`);
      return;
    }

    setLoading(true);

    try {
      const res = await ApiService.register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });

      soundService.playInvest();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setErrorMsg('');

    if (!loginIdentifier || !loginPassword) {
      setErrorMsg('Please fill in both phone/email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await ApiService.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      soundService.playInvest();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      {/* Milky Diamond, Sky Blue & Gold Theme Modal */}
      <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden border-2 border-sky-200 max-h-[92vh] flex flex-col">
        {/* Top Sky Blue & Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-sky-500 via-amber-400 to-blue-600"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Toggle Header */}
        <div className="text-center mb-3 mt-1">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400/20 via-sky-400/20 to-violet-400/20 text-slate-900 px-3 py-1 rounded-full text-xs font-black mb-2 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> YAMAHA OFFICIAL PORTAL
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'signup' ? 'Create Investment Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            {mode === 'signup'
              ? `Register now & receive ₦${welcomeAmount} instant welcome bonus!`
              : 'Sign in to access your portfolio & 24h yields'}
          </p>

          <div className="flex bg-sky-50 p-1 rounded-2xl mt-3 border border-sky-200">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setMode('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up (₦{welcomeAmount} Bonus)
            </button>
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs font-black text-rose-800 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {otpSentNotice && mode === 'signup' && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 flex items-center gap-2 shrink-0 font-black">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{otpSentNotice}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1">
          {mode === 'signup' ? (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Emmanuel Chidalu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Phone Number (PalmPay / Bank) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08149021882"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCountdown > 0}
                    className="px-3 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {otpCountdown > 0 ? `${otpCountdown}s` : 'Get OTP'}
                  </button>
                </div>
              </div>

              {generatedOtp && (
                <div>
                  <label className="block text-[11px] font-black text-slate-800 mb-1">
                    Verification Code (OTP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-sky-300 bg-white text-xs font-mono font-black text-center text-slate-900 focus:border-sky-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-9 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-9 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="e.g. MOTO-8890"
                  className="w-full px-3 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-200 disabled:opacity-50 cursor-pointer border border-amber-400 transition-all active:scale-95"
              >
                {loading ? 'Registering...' : `Complete Registration & Get ₦${welcomeAmount}`}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter phone or email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-9 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 focus:bg-white focus:border-sky-500 text-xs text-slate-900 font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-200 disabled:opacity-50 cursor-pointer border border-sky-400 transition-all active:scale-95"
              >
                {loading ? 'Signing In...' : 'Sign In to Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
