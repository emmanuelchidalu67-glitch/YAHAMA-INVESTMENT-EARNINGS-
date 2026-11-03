import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Lock,
  Phone,
  Mail,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  User as UserIcon,
  Award,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
  X,
  BadgeCheck,
  Stamp,
  Globe,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';
import cacCertImg from '../assets/images/cac_certificate_bg_1787077584316.jpg';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../utils/sound';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: User) => void;
  adminSettings?: AdminSettings;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'signup',
  onAuthSuccess,
  adminSettings,
}) => {
  const { language, setLanguage, currentLanguage, languages, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showCacModal, setShowCacModal] = useState(false);
  const welcomeAmount = adminSettings?.welcomeBonusAmount || 700;

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Password Visibility
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);

  // Auto-fill referral code from URL if present
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let ref = searchParams.get('ref');
      if (!ref && window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          ref = hashParams.get('ref');
        }
      }
      if (ref) {
        setReferralCode(ref.trim());
        setMode('signup');
      }
    } catch (e) {
      console.error('Failed to parse url ref:', e);
    }
  }, []);

  // Handle Send Simulated OTP
  const handleSendOtp = () => {
    soundService.playClick();
    if (!phone || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid phone number before requesting verification code.');
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
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match! Please check and try again.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (generatedOtp && otpCode.trim() !== generatedOtp) {
      setErrorMsg(`Invalid verification code. Enter ${generatedOtp}`);
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details and try again.');
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
      setErrorMsg('Please provide your phone/email and account password.');
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Invalid phone/email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4 px-2 max-w-md mx-auto">
      {/* CUTE MILKY DIAMOND, SKY BLUE & GOLD AUTH CARD */}
      <div className="bg-white rounded-3xl border-2 border-sky-200 shadow-2xl shadow-sky-100/80 overflow-hidden relative">
        {/* Top Floating Diamond Accents */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* TOP BAR: Language Selector & Official Seal */}
        <div className="p-3 bg-gradient-to-r from-slate-950 via-[#0B0F17] to-slate-950 border-b border-amber-400/40 flex items-center justify-between gap-2 relative z-20">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="tracking-tight">YAMAHA OFFICIAL PORTAL</span>
          </div>

          {/* Prominent Language Selector for Registration/Login */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setLangDropdownOpen(!langDropdownOpen);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-amber-400/50 shadow-xs text-xs font-black transition-all cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentLanguage.flag}</span>
              <span className="uppercase text-[11px] font-black text-amber-200">{currentLanguage.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-2xl bg-white border-2 border-sky-200 shadow-2xl p-2 z-50 animate-fadeIn max-h-60 overflow-y-auto">
                <div className="text-[10px] font-black text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Select Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      soundService.playClick();
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      l.code === language
                        ? 'bg-sky-100 text-sky-950 font-black'
                        : 'text-slate-700 hover:bg-sky-50 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </div>
                    {l.code === language && <Check className="w-3.5 h-3.5 text-sky-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HERO SECTION - Divine Luxury Brand Header (Silver, Gold, Diamond, White, Blue, Milky, Dark Red, Black, Light Violet) */}
        <div className="p-6 bg-gradient-to-br from-slate-950 via-[#0B0F17] to-slate-900 text-white text-center relative overflow-hidden shadow-inner border-b-2 border-amber-400/30">
          {/* Diamond and Violet ambient glows */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-slate-100 to-sky-300 p-0.5 mx-auto shadow-xl shadow-amber-500/20 ring-2 ring-violet-400/40 mb-3">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={yamahaBrandLogo}
                alt="YAMAHA Official Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-sky-200 drop-shadow-md uppercase">
            {mode === 'signup' ? 'YAMAHA INVESTMENT EARNINGS INCOME' : 'YAMAHA Member Sign In'}
          </h1>
          <p className="text-xs text-amber-100/90 font-medium max-w-xs mx-auto mt-1">
            {mode === 'signup'
              ? `Claim your instant ₦${welcomeAmount} Welcome Bonus & start earning daily ₦800 yields.`
              : 'Sign in to access your wallet, active VIP machines, and instant withdrawals.'}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCacModal(true)}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-amber-300 border border-amber-300/40 px-3 py-1 rounded-full text-[10.5px] font-black transition-all cursor-pointer"
            >
              <BadgeCheck className="w-3.5 h-3.5 text-amber-400" /> CAC Nigeria Verified (RC-1849204)
            </button>
          </div>
        </div>

        {/* AUTH MODE TOGGLE TABS */}
        <div className="p-2 bg-sky-50/80 border-b-2 border-sky-100 flex gap-2">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-200'
                : 'bg-white text-slate-700 hover:text-sky-900 border border-sky-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Create Account / Register
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-200'
                : 'bg-white text-slate-700 hover:text-sky-900 border border-sky-200'
            }`}
          >
            <Lock className="w-4 h-4" /> Sign In / Login
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 text-rose-900 border-2 border-rose-200 text-xs font-black flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Full Legal Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chukwuma Obi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Phone Number (PalmPay / OPay / Bank)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08149021882"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-24 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCountdown > 0}
                    className="absolute right-2 top-2 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {otpCountdown > 0 ? `${otpCountdown}s` : 'Get OTP'}
                  </button>
                </div>
              </div>

              {otpSentNotice && (
                <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-black flex items-center justify-between animate-fadeIn">
                  <span>{otpSentNotice}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (generatedOtp) setOtpCode(generatedOtp);
                    }}
                    className="underline text-sky-800 text-[11px] font-black cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {generatedOtp && (
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-sky-300 bg-white font-mono text-center font-black tracking-widest text-sm text-slate-900 focus:border-sky-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter inviter code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none uppercase font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border border-amber-400"
              >
                <span>{loading ? 'Creating Your Account...' : `Register & Claim ₦${welcomeAmount} Bonus`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SIGN IN / LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter phone or email"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Account Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-sky-100 bg-sky-50/40 font-bold text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-sky-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border border-sky-400"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* CAC CERTIFICATE MODAL */}
      {showCacModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border-2 border-sky-200 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900">Official CAC Certificate</h3>
              </div>
              <button
                onClick={() => setShowCacModal(false)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img
                src={cacCertImg}
                alt="YAMAHA CAC Certificate"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <p className="font-black text-slate-900">YAMAHA INVESTMENT EARNINGS INCOME LTD.</p>
              <p className="font-mono text-[11px] text-slate-600">RC Number: RC-1849204</p>
              <p className="text-[10px] text-emerald-700 font-bold">
                ✓ Fully verified and licensed for PalmPay Yield Engines in Nigeria.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
