import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Star,
  Sparkles,
  ChevronRight,
  ArrowDownToLine,
} from 'lucide-react';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';
import { InstallAppModal } from './InstallAppModal';
import { downloadMotorolaApk, triggerHomeScreenInstall } from '../utils/apkDownloader';
import { soundService } from '../utils/sound';

interface InstallAppButtonProps {
  variant?: 'card' | 'compact' | 'list-item';
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'card',
  className = '',
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = async () => {
    soundService.playClick();
    try {
      await triggerHomeScreenInstall();
    } catch (_) {}
    downloadMotorolaApk().catch(() => {});
    setModalOpen(true);
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-md shadow-sky-200 font-black text-xs transition-all active:scale-95 cursor-pointer border border-sky-400 ${className}`}
          title="Install YAMAHA Investment App"
        >
          <div className="w-5 h-5 rounded-lg overflow-hidden shrink-0 border border-white/50 bg-white">
            <img src={yamahaBrandLogo} alt="App" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-[11px] tracking-tight">Install App</span>
          <Download className="w-3.5 h-3.5" />
        </button>

        <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'list-item') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`w-full p-3.5 flex items-center justify-between bg-gradient-to-r from-sky-50 via-white to-amber-50/60 hover:from-sky-100 hover:to-amber-100/70 border border-sky-200 rounded-2xl transition-all text-xs cursor-pointer group shadow-xs ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-sky-300 to-amber-300 p-0.5 shadow-md shadow-sky-200 shrink-0">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                <img src={yamahaBrandLogo} alt="YAMAHA Investment App Icon" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-xs">YAMAHA INVESTMENT</span>
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-md">
                  v3.8.4
                </span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold">
                EARNINGS INCOME • 14.8 MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black text-[11px] shadow-sm flex items-center gap-1">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Install
            </span>
            <ChevronRight className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Default: Milky Diamond Card Banner
  return (
    <>
      <div
        className={`p-3.5 rounded-3xl bg-gradient-to-r from-white via-sky-50 to-amber-50/50 border-2 border-sky-200 shadow-md shadow-sky-100 flex items-center justify-between gap-2.5 relative overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-sky-300 to-amber-300 p-0.5 shadow-md shadow-sky-200">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                <img
                  src={yamahaBrandLogo}
                  alt="YAMAHA Investment App Icon"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
              ✓
            </span>
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-black text-xs text-slate-900 truncate">YAMAHA INVESTMENT</h4>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-black px-1.5 py-0.2 rounded-full">
                Official
              </span>
            </div>
            <p className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> 4.9
              </span>
              <span>• 14.8 MB • Android APK</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-sky-200 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer border border-sky-400"
          title="Install YAMAHA Investment App"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      </div>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
