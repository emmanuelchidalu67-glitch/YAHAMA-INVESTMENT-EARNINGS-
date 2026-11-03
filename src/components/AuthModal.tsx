import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Lock,
  Phone,
  Mail,
  AlertCircle,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  User as UserIcon,
  ArrowRight,
  Globe,
  ChevronDown,
  Search,
} from 'lucide-react';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';
import { COUNTRIES, CountryCode, DEFAULT_COUNTRY } from '../data/countries';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';

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
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const welcomeAmount = adminSettings?.welcomeBonusAmount || 700;

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Password Visibility State
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Country code
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Sign Up Submit
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
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 350);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Login Submit
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
          onClose();
        }, 350);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-[390px] rounded-[32px] bg-[#0A0E0C] border-2 border-emerald-900/80 shadow-2xl shadow-black/90 p-5 sm:p-6 text-[#FFFDF7] relative overflow-hidden">
        {/* Ambient Halos */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-900/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-950/40 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-[#FFFDF7]/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Crest */}
        <div className="text-center space-y-1.5 mb-4 relative z-10">
          <div className="w-14 h-14 rounded-full p-0.5 mx-auto bg-gradient-to-tr from-[#D4AF37] via-emerald-700 to-[#7F1D1D] shadow-lg shadow-black/80">
            <img
              src={yamahaBrandLogo}
              alt="YAMAHA"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-base font-black text-[#D4AF37] uppercase">
            YAMAHA INVESTMENT
          </h2>
          <p className="text-[10px] text-[#FFFDF7]/70 font-bold uppercase tracking-wider">
            {mode === 'signup' ? 'Create Account & Claim ₦700' : 'Registered Member Sign In'}
          </p>
        </div>

        {/* Mode Toggle Table */}
        <div className="p-1 rounded-full bg-black/80 border-2 border-emerald-900/80 flex items-center mb-4 relative z-10">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-1.5 rounded-full text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-1.5 rounded-full text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-[#FFFDF7] shadow-md border border-[#D4AF37]'
                : 'text-[#FFFDF7]/60 hover:text-[#FFFDF7]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-2xl bg-rose-950/80 text-rose-200 border border-rose-800 text-[11px] font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-2xl bg-emerald-950/90 text-emerald-200 border border-emerald-600 text-[11px] font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-2.5 relative z-10">
            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Full Legal Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Emmanuel Chidalu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Country & Phone</label>
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#121B16] border-2 border-emerald-900 focus-within:border-[#D4AF37]">
                <button
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-[#FFFDF7] text-xs font-black shrink-0"
                >
                  <span>{selectedCountry.flag}</span>
                  <span className="text-[#D4AF37]">{selectedCountry.dialCode}</span>
                  <ChevronDown className="w-3 h-3 text-[#D4AF37]" />
                </button>
                <input
                  type="tel"
                  required
                  placeholder="8149021882"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 pr-3 py-1.5 bg-transparent text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-3 text-[#FFFDF7]/60"
                >
                  {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#FFFDF7]/60"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Invite Code (Optional)</label>
              <input
                type="text"
                placeholder="YAMA777"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-full bg-[#121B16] border-2 border-emerald-900 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-mono text-center font-black text-xs uppercase outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#7F1D1D] text-[#FFFDF7] font-black text-xs tracking-wider uppercase border-2 border-[#D4AF37] shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Registering...' : `REGISTER & CLAIM ₦${welcomeAmount}`}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 relative z-10">
            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Registered Phone or Email</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-rose-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Phone number or Email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[#121B16] border-2 border-rose-950/80 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-[#D4AF37] mb-1 pl-3">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-rose-400 absolute left-3.5 top-3" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-full bg-[#121B16] border-2 border-rose-950/80 text-[#FFFDF7] placeholder-[#FFFDF7]/40 font-bold text-xs focus:border-[#D4AF37] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-[#FFFDF7]/60"
                >
                  {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-full bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-emerald-800 text-[#FFFDF7] font-black text-xs tracking-wider uppercase border-2 border-[#D4AF37] shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'SIGN IN TO YAMAHA'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>
        )}
      </div>

      {/* Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xs rounded-3xl bg-[#0F1713] border-2 border-emerald-800 shadow-2xl p-4 text-[#FFFDF7] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900">
              <h3 className="font-black text-xs text-[#D4AF37] uppercase flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" /> Country Dial Code
              </h3>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-[#FFFDF7]/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search country..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-black/60 border border-emerald-800 text-[#FFFDF7] text-xs font-bold outline-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredCountries.map((c) => (
                <button
                  key={`${c.code}-${c.dialCode}`}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowCountryModal(false);
                  }}
                  className="w-full p-2 rounded-xl flex items-center justify-between text-xs font-bold hover:bg-emerald-950 text-[#FFFDF7]"
                >
                  <div className="flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </div>
                  <span className="text-[#D4AF37]">{c.dialCode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
