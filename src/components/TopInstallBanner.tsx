import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Sparkles,
  Smartphone,
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowDownToLine,
  ExternalLink,
} from 'lucide-react';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';
import { downloadMotorolaApk, triggerHomeScreenInstall } from '../utils/apkDownloader';
import { soundService } from '../utils/sound';
import { InstallAppModal } from './InstallAppModal';

export const TopInstallBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem('yamaha_top_banner_dismissed') === 'true';
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playClick();
    setDismissed(true);
    localStorage.setItem('yamaha_top_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    soundService.playClick();
    try {
      await triggerHomeScreenInstall();
    } catch (_) {}
    setDownloading(true);
    downloadMotorolaApk({
      onProgress: (p) => {},
      onComplete: () => {
        setDownloading(false);
        setDownloadSuccess(true);
        soundService.playInvest();
        setTimeout(() => setDownloadSuccess(false), 6000);
      },
    });
    setModalOpen(true);
  };

  if (dismissed) {
    return (
      <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50 border-b border-sky-200/70 py-1 px-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-sky-900 font-bold">
          <Smartphone className="w-3.5 h-3.5 text-sky-600" />
          <span>Official Android APK & Web App v3.8.4</span>
        </div>
        <button
          onClick={() => {
            setDismissed(false);
            localStorage.removeItem('yamaha_top_banner_dismissed');
          }}
          className="text-[10px] font-black text-amber-700 hover:text-amber-800 underline cursor-pointer flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" /> Show App Banner
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-to-r from-white via-sky-50 to-amber-50/70 border-b-2 border-sky-300 shadow-md transition-all">
        <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {/* App Icon + Bold Written Text Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              {/* Milky Diamond & Gold Bordered Icon */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-sky-300 to-amber-300 p-0.5 shadow-md shadow-sky-200">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={yamahaBrandLogo}
                    alt="YAMAHA Investment App"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black shadow-sm">
                ✓
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-black text-xs sm:text-[13px] text-slate-900 tracking-tight truncate leading-none">
                  YAMAHA INVESTMENT
                </h2>
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                  Official APK
                </span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1.5 mt-0.5 truncate">
                <span className="text-amber-600 font-black flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> 4.9
                </span>
                <span>• 14.8 MB • Download to Phone Storage</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Install & Dismiss */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              disabled={downloading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-[11px] shadow-md shadow-sky-300/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-sky-400/60"
              title="Download APK directly to your phone storage"
            >
              <ArrowDownToLine className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Downloading...' : 'Install App'}</span>
            </button>

            {/* Remove / Dismiss (X) Button */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="Hide top banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-600 text-white px-3 py-1 text-center text-[10px] font-black flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Yamaha_Investment_Earnings_Income_v3.8.4.apk downloaded to phone storage! Tap to open.</span>
          </div>
        )}
      </div>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
