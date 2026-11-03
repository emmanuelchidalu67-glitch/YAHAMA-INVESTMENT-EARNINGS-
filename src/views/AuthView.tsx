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
  ArrowRight,
  BadgeCheck,
  Globe,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';
import cacCertImg from '../assets/images/cac_certificate_bg_1787077584316.jpg';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../utils/sound';
import { COUNTRIES, CountryCode, DEFAULT_COUNTRY } from '../data/countries';

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
  const { language, setLanguage, languages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showCacModal, setShowCacModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);

  const welcomeAmount = adminSettings?.welcomeBonusAmount || 700;

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
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
  const [successMsg, setSuccessMsg] = useState('');

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

  // Filtered countries
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Sign Up Submit - Directly creates account and unlocks platform inside immediately
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please create an account password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both passwords.');
      return;
    }

    // Format phone: if user didn't type leading country code, prepend selected dial code
    let fullPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!fullPhone.startsWith('+')) {
      if (selectedCountry.code === 'NG' && fullPhone.startsWith('0')) {
        fullPhone = fullPhone.substring(1);
      }
      fullPhone = `${selectedCountry.dialCode}${fullPhone}`;
    }

    setLoading(true);

    try {
      const res = await ApiService.register({
        fullName: fullName.trim(),
        phone: fullPhone,
        email: email.trim().toLowerCase(),
        password,
        referralCode: referralCode.trim() || undefined,
      });

      if (res && res.user) {
        setSuccessMsg(`Welcome, ${res.user.fullName}! Entering platform...`);
        soundService.playInvest();
        // Immediately transition into the platform
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 400);
      } else {
        throw new Error('Registration did not return a valid user profile.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. An account with this phone or email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  // Login Submit - Strictly authenticated against registered database
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your registered phone number or email.');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const res = await ApiService.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });

      if (res && res.user) {
        setSuccessMsg(`Login successful! Entering platform...`);
        soundService.playInvest();
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 400);
      } else {
        throw new Error('Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Login failed. Only registered members can sign in. Please verify your phone/email or create a new account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-6 px-3 flex flex-col items-center justify-center font-sans antialiased">
      {/* COMPACT AUTH BOX - Strict Palette: Dark Green, Dark Red, Milky, Black, Diamond, Gold, Salt White */}
      <div className="w-full max-w-[390px] rounded-[32px] bg-[#0A0E0C] border-2 border-emerald-900/80 shadow-2xl shadow-black/90 p-5 sm:p-6 text-[#FFFDF7] relative overflow-hidden">
        {/* Subtle Ambient Diamond & Color Halos */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-900/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-rose-950/40 rounded-full blur-2xl pointer-events-none" />

        {/* TOP BAR: Language Capsule & CAC Verification */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-950 relative z-10">
          <button
            type="button"
            onClick={() => setShowCacModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-700/60 text-[#D4AF37] text-[10px] font-black cursor-pointer hover:bg-emerald-900 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>CAC RC-1849204</span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 border border-[#D4AF37]/50 text-[#FFFDF7] text-[10.5px] font-black cursor-pointer hover:border-[#D4AF37]"
            >
              <Globe className="w-3 h-3 text-[#D4AF37]" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-[#D4AF37]" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 top-8 z-50 w-36 rounded-2xl bg-[#0F1713] border-2 border-emerald-800 shadow-2xl py-1 max-h-48 overflow-y-auto">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-[11px] font-bold flex items-center gap-2 hover:bg-emerald-950/80 cursor-pointer ${
                      language === l.code ? 'text-[#D4AF37] bg-emerald-950' : 'text-[#FFFDF7]'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BRAND LOGO & HEADER */}
        <div className="text-center space-y-2 mb-4 relative z-10">
          <div className="w-16 h-16 rounded-full p-0.5 mx-auto bg-gradient-to-tr from-[#D4AF37] via-emerald-700 to-[#7F1D1D] shadow-lg shadow-black/80 ring-2 ring-[#FFFDF7]/10">
            <img
              src={yamahaBrandLogo}
              alt="YAMAHA"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#D4AF37] uppercase">
              YAMAHA INVESTMENT
            </h1>
            <p className="text-[10.5px] text-[#FFFDF7]/80 font-bold uppercase tracking-wider">
              {mode === 'signup' ? 'Claim ₦700 Welcome Bonus' : 'Registered Member Portal'}
            </p>
          </div>
        </div>

        {/* CIRCULAR MODE TOGGLE TABLE */}
        <div className="p-1 rounded-full bg-black/80 border-2 border-emerald-900/80 flex items-center mb-4 relative z-10">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-full text-[11.5px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-[#FFFDF7] shadow-md border border-[#D4AF37]'
                : 'text-[#FFFDF7]/60 hover:text-[#FFFDF7]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-full text-[11.5px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-[#FFFDF7] shadow-md border border-[#D4AF37]'
                : 'text-[#FFFDF7]/60 hover:text-[#FFFDF7]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sign In</span>
          </button>
        </div>

        {/* FEEDBACK NOTICES */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-950/80 text-rose-200 border border-rose-800 text-[11px] font-bold flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-950/90 text-emerald-200 border border-emerald-600 text-[11px] font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CIRCULAR FILLING TABLE FORM - SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3 relative z-10">
            {/* Full Legal Name */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Full Legal Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Emmanuel Chidalu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] focus:bg-[#18231D] outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Country Code & Phone Number Circular Filling Table */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Country & Phone Number
              </label>
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#121B16] border-2 border-emerald-900 focus-within:border-[#D4AF37] transition-all shadow-inner">
                {/* Country Code Selector Button */}
                <button
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-[#FFFDF7] text-xs font-black shrink-0 cursor-pointer transition-colors"
                  title="Select Country"
                >
                  <span className="text-sm">{selectedCountry.flag}</span>
                  <span className="text-[#D4AF37]">{selectedCountry.dialCode}</span>
                  <ChevronDown className="w-3 h-3 text-[#D4AF37]" />
                </button>

                {/* Phone Input */}
                <input
                  type="tel"
                  required
                  placeholder="8149021882"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 pr-4 py-2 bg-transparent text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs outline-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] focus:bg-[#18231D] outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] focus:bg-[#18231D] outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3.5 top-3.5 text-[#FFFDF7]/60 hover:text-[#FFFDF7]"
                >
                  {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] focus:bg-[#18231D] outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-[#FFFDF7]/60 hover:text-[#FFFDF7]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Invitation Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. YAMA777"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-mono text-center font-black text-xs uppercase focus:border-[#D4AF37] outline-none transition-all"
              />
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#7F1D1D] hover:from-emerald-700 hover:to-[#991B1B] text-[#FFFDF7] font-black text-xs tracking-wider uppercase border-2 border-[#D4AF37] shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Registering...' : `REGISTER & CLAIM ₦${welcomeAmount}`}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>
        )}

        {/* CIRCULAR FILLING TABLE FORM - LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 relative z-10">
            {/* Phone or Email */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Registered Phone or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Phone number or Email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-[#121B16] border-2 border-rose-950/80 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] focus:bg-[#18231D] outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-black text-[#D4AF37] mb-1 pl-3">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-full bg-[#121B16] border-2 border-rose-950/80 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] focus:bg-[#18231D] outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3.5 text-[#FFFDF7]/60 hover:text-[#FFFDF7]"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Tip for Admin */}
            <div className="p-2.5 rounded-2xl bg-black/60 border border-emerald-900/60 text-[10.5px] text-[#FFFDF7]/70 space-y-0.5">
              <p className="font-bold text-[#D4AF37]">Official Access Notice:</p>
              <p>Only registered accounts can log in. The verified admin portal is protected.</p>
            </div>

            {/* Submit Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-full bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-emerald-800 hover:from-[#991B1B] hover:to-emerald-700 text-[#FFFDF7] font-black text-xs tracking-wider uppercase border-2 border-[#D4AF37] shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'SIGN IN TO YAMAHA'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="mt-4 pt-3 border-t border-emerald-950 text-center">
          <p className="text-[10px] text-[#FFFDF7]/50 font-medium">
            256-Bit SSL Encrypted • Fast PalmPay Bank Payouts • Instant Access
          </p>
        </div>
      </div>

      {/* COUNTRY CODE SELECTOR MODAL */}
      {showCountryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F1713] border-2 border-emerald-800 shadow-2xl p-4 text-[#FFFDF7] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900">
              <h3 className="font-black text-xs text-[#D4AF37] uppercase flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" /> Select Country Code
              </h3>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-[#FFFDF7]/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search country or code..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full bg-black/60 border border-emerald-800 text-[#FFFDF7] text-xs font-bold outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Country List */}
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {filteredCountries.map((c) => (
                <button
                  key={`${c.code}-${c.dialCode}`}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowCountryModal(false);
                    soundService.playClick();
                  }}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                    selectedCountry.code === c.code
                      ? 'bg-emerald-950 text-[#D4AF37] border border-[#D4AF37]'
                      : 'hover:bg-emerald-950/60 text-[#FFFDF7]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span>{c.name}</span>
                  </div>
                  <span className="font-mono text-[#D4AF37] font-black">{c.dialCode}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p className="text-center text-xs text-[#FFFDF7]/50 py-4">No country matched search.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAC CERTIFICATE MODAL */}
      {showCacModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#FFFDF7] text-black border-2 border-emerald-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCacModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-black flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-800 font-black">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <h3 className="font-black text-sm text-emerald-950 uppercase">
                YAMAHA INVESTMENT EARNINGS INCOME LTD.
              </h3>
              <p className="text-[11px] font-bold text-emerald-800">
                Incorporated under Corporate Affairs Commission (CAC) Nigeria
              </p>
            </div>

            <div className="rounded-2xl border-2 border-emerald-800 overflow-hidden shadow-inner">
              <img
                src={cacCertImg}
                alt="CAC Registration"
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="text-[11px] text-slate-700 space-y-1 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200">
              <p><strong>RC Number:</strong> RC-1849204</p>
              <p><strong>Status:</strong> Active &amp; Fully Compliant</p>
              <p><strong>Licensed Operations:</strong> Financial Tech &amp; Daily Yield Investment Services</p>
            </div>

            <button
              onClick={() => setShowCacModal(false)}
              className="w-full py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-[#FFFDF7] font-black text-xs uppercase"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
