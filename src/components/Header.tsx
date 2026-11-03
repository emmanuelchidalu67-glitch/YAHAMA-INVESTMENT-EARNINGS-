import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Headset,
  Shield,
  Moon,
  Sun,
  Crown,
  Sparkles,
  ShieldCheck,
  Wallet,
  ChevronRight,
  Globe,
  ChevronDown,
  Check,
  Search,
  X,
} from 'lucide-react';
import { MarqueeTicker } from './MarqueeTicker';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../utils/sound';
import { AnimatedCounter } from './AnimatedCounter';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';

interface HeaderProps {
  user: User | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNotifications: () => void;
  onOpenSupport: () => void;
  onOpenAuth: () => void;
  onOpenVipPlans?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDarkMode,
  onToggleDarkMode,
  onOpenNotifications,
  onOpenSupport,
  onOpenAuth,
  onOpenVipPlans,
  onOpenProfile,
}) => {
  const vipLevel = user?.vipLevel || 1;
  const { language, setLanguage, currentLanguage, languages, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [searchLang, setSearchLang] = useState('');
  const langRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangDropdownOpen(false);
    };

    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [langDropdownOpen]);

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.code.toLowerCase().includes(searchLang.toLowerCase()) ||
      l.region.toLowerCase().includes(searchLang.toLowerCase())
  );

  const handleSelectLanguage = (code: any) => {
    setLanguage(code);
    soundService.playClick();
    setLangDropdownOpen(false);
    setSearchLang('');
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-[#0B0F17] to-slate-950 text-white shadow-xl border-b-2 border-amber-400/40 transition-colors duration-300">
      {/* Top Header Main Bar with Divine Luxury Palette: Obsidian Black, Gold, Silver, Diamond, Milky, Royal Blue, Dark Red, Light Violet */}
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-between gap-1.5 sm:gap-2 relative">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-slate-100 to-sky-300 p-0.5 shadow-lg shadow-amber-500/20 ring-1 ring-violet-400/40">
            <div className="w-full h-full bg-slate-950 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src={yamahaBrandLogo}
                alt="YAMAHA"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-black text-xs sm:text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-sky-200 leading-none drop-shadow-sm">
                YAMAHA
              </h1>
              <span className="bg-gradient-to-r from-rose-950/80 to-red-900/80 text-rose-200 border border-rose-500/50 text-[7.5px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-xs">
                <ShieldCheck className="w-2.5 h-2.5 text-amber-400" /> OFFICIAL
              </span>
            </div>
            <p className="text-[8.5px] text-amber-200/90 font-bold leading-tight mt-0.5 tracking-tight">
              EARNINGS INCOME
            </p>
          </div>
        </div>

        {/* Persistent VIP Level Indicator (Milky Diamond & Gold Style) */}
        <button
          onClick={onOpenVipPlans || onOpenProfile}
          className="group relative flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-100/60 hover:from-amber-100 hover:to-amber-200 border-2 border-amber-300 shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          title={`Your Current Tier: VIP ${vipLevel} (Tap to view VIP Plans)`}
        >
          <div className="p-1 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-xs shrink-0">
            <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
          </div>
          <div className="text-left flex flex-col justify-center leading-none">
            <div className="flex items-center gap-1">
              <span className="font-black text-[11px] sm:text-xs text-amber-700 tracking-wide">
                VIP {vipLevel}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-[7.5px] font-black text-slate-600 uppercase tracking-tighter">
              {t('header.activeTier', 'Active Tier')}
            </span>
          </div>
          <ChevronRight className="w-2.5 h-2.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Action Icons: Language Toggle & Support & Notification & Dark Mode & Profile Auth */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Simple Language Toggle Dropdown Button */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => {
                soundService.playClick();
                setLangDropdownOpen(!langDropdownOpen);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-emerald-950 text-[#D4AF37] border border-emerald-800 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Change Platform Language"
            >
              <span className="text-sm leading-none">{currentLanguage.flag}</span>
              <span className="font-black text-[11px] uppercase tracking-wider text-[#FFFDF7]">
                {currentLanguage.code}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-[#D4AF37] transition-transform duration-200 ${
                  langDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Language Dropdown Menu (Diamond & Gold Styled) */}
            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-3xl bg-white border-2 border-sky-200 shadow-2xl p-3 z-50 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-sky-100 px-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span className="font-black text-xs text-slate-900">Select Language</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {languages.length} Languages
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative my-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search English, Hausa, Yoruba, Igbo..."
                    value={searchLang}
                    onChange={(e) => setSearchLang(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 rounded-2xl bg-sky-50/50 border border-sky-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors font-medium"
                    autoFocus
                  />
                  {searchLang && (
                    <button
                      onClick={() => setSearchLang('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Language Options List */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredLanguages.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      No language found matching "{searchLang}"
                    </div>
                  ) : (
                    filteredLanguages.map((opt) => {
                      const isSelected = opt.code === language;
                      return (
                        <button
                          key={opt.code}
                          onClick={() => handleSelectLanguage(opt.code)}
                          className={`w-full flex items-center justify-between p-2 rounded-2xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black shadow-md shadow-sky-200'
                              : 'hover:bg-sky-50 text-slate-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base leading-none shrink-0">{opt.flag}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs truncate ${
                                    isSelected ? 'font-black text-white' : 'font-bold text-slate-900'
                                  }`}
                                >
                                  {opt.nativeName}
                                </span>
                                {opt.nativeName !== opt.name && (
                                  <span
                                    className={`text-[10px] truncate ${
                                      isSelected ? 'text-sky-100 font-bold' : 'text-slate-500'
                                    }`}
                                  >
                                    ({opt.name})
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-[9px] truncate ${
                                  isSelected ? 'text-sky-100' : 'text-slate-500'
                                }`}
                              >
                                {opt.region}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span
                              className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                isSelected
                                  ? 'bg-white text-sky-900 font-black'
                                  : 'bg-sky-100 text-sky-800 border border-sky-200'
                              }`}
                            >
                              {opt.code}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer Tip */}
                <div className="pt-2 mt-1.5 border-t border-sky-100 text-[10px] text-slate-500 text-center font-bold">
                  Preference saved automatically in your browser storage
                </div>
              </div>
            )}
          </div>

          {/* Customer Support Icon */}
          <button
            onClick={() => {
              soundService.playClick();
              onOpenSupport();
            }}
            className="p-2 rounded-full bg-black/60 hover:bg-emerald-950 text-[#D4AF37] border border-emerald-800 transition-all cursor-pointer relative"
            title="Customer Support"
          >
            <Headset className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-black animate-pulse"></span>
          </button>

          {/* Notification Icon */}
          <button
            onClick={() => {
              soundService.playClick();
              onOpenNotifications();
            }}
            className="p-2 rounded-full bg-black/60 hover:bg-emerald-950 text-[#D4AF37] border border-emerald-800 transition-all cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#991B1B] rounded-full"></span>
          </button>

          {/* User Status / Login Button */}
          {!user ? (
            <button
              onClick={() => {
                soundService.playClick();
                onOpenAuth();
              }}
              className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#7F1D1D] hover:from-emerald-700 hover:to-[#991B1B] text-[#FFFDF7] font-black text-[11px] px-3.5 py-1.5 rounded-full shadow-md border border-[#D4AF37] transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {t('header.signIn', 'Sign In')}
            </button>
          ) : (
            <div
              onClick={() => {
                soundService.playClick();
                if (onOpenProfile) onOpenProfile();
              }}
              className="flex items-center gap-1.5 bg-emerald-950/90 hover:bg-emerald-900 px-3 py-1.5 rounded-full border border-[#D4AF37] text-[11px] shadow-xs cursor-pointer transition-all shrink-0"
              title="Click to view wallet & profile"
            >
              <Wallet className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <AnimatedCounter
                value={user.balance}
                decimals={2}
                startFromZero={true}
                duration={1200}
                className="font-mono font-black text-[#FFFDF7] text-[11px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Marquee Ticker */}
      <MarqueeTicker />
    </header>
  );
};
