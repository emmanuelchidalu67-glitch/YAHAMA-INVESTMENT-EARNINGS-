import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Star,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowDownToLine,
  Zap,
  Check,
} from 'lucide-react';
import yamahaBrandLogo from '../assets/images/yamaha_brand_logo_1793646961486.jpg';
import { soundService } from '../utils/sound';
import { downloadMotorolaApk, triggerHomeScreenInstall } from '../utils/apkDownloader';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'instant'>('android');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativePwaInstall = async () => {
    soundService.playClick();
    const prompted = await triggerHomeScreenInstall();
    if (!prompted) {
      handleRealApkDownload();
    }
  };

  const handleDownloadAndInstall = async () => {
    soundService.playClick();
    // 1. Trigger native home screen install prompt so icon is placed on phone background
    try {
      await triggerHomeScreenInstall();
    } catch (_) {}
    // 2. Also start direct APK download
    handleRealApkDownload();
  };

  const handleRealApkDownload = () => {
    soundService.playClick();
    setIsDownloadingApk(true);
    setDownloadProgress(25);
    setDownloadCompleted(false);

    downloadMotorolaApk({
      onProgress: (p) => {
        setDownloadProgress(p);
      },
      onComplete: () => {
        setIsDownloadingApk(false);
        setDownloadCompleted(true);
        soundService.playInvest();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      {/* Milky Diamond, Sky Blue & Gold Luxury Modal */}
      <div className="bg-gradient-to-b from-white via-sky-50/50 to-white border-2 border-sky-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-900 relative overflow-hidden">
        {/* Diamond Crystalline Glow Decor */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-sky-200/40 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-amber-200/40 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-sky-400 to-amber-300 p-0.5 shadow-md shadow-sky-200 shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={yamahaBrandLogo}
                  alt="YAMAHA Investment App"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">YAMAHA INVESTMENT</h3>
                <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[8px] font-black px-1.5 py-0.5 rounded-full">
                  Official APK
                </span>
              </div>
              <p className="text-[10px] text-amber-700 font-black">
                EARNINGS INCOME • v3.8.4
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security & Verification Badges */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-white border border-sky-200 shadow-sm text-center text-[9px] font-bold text-slate-700">
          <div className="flex flex-col items-center justify-center p-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
            <span className="text-slate-900 font-extrabold">Play Protect</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1 border-x border-sky-100">
            <Lock className="w-4 h-4 text-amber-600 mb-0.5" />
            <span className="text-slate-900 font-extrabold">256-Bit SSL</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1">
            <Zap className="w-4 h-4 text-sky-600 mb-0.5" />
            <span className="text-slate-900 font-extrabold">Instant Yields</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 rounded-2xl bg-sky-100/70 border border-sky-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Android APK
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === 'instant'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Instant Web App
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            iOS (iPhone)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'android' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] font-black text-sky-900">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                  Direct Android Package (APK)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded-md">
                  100% Free
                </span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                Install the high-speed YAMAHA APK directly onto your phone's storage for 1-tap biometric logins, automatic 24-hour yield alerts, and background updates.
              </p>
            </div>

            {/* Download Progress or Completed Notice */}
            {isDownloadingApk && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-white border-2 border-sky-300 shadow-sm">
                <div className="flex justify-between text-xs font-black text-sky-900">
                  <span>Downloading to Phone Storage...</span>
                  <span className="text-blue-600">{downloadProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Saving Yamaha_Investment_Earnings_Income_v3.8.4.apk to /Downloads folder
                </p>
              </div>
            )}

            {downloadCompleted && (
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-emerald-950">APK Downloaded to Storage!</p>
                  <p className="text-[10.5px] text-emerald-800 font-medium">
                    Check your browser or phone downloads to tap and install.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadAndInstall}
              disabled={isDownloadingApk}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border border-amber-400"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{isDownloadingApk ? 'Downloading APK (14.8 MB)...' : 'Download APK & Add Icon to Phone Background'}</span>
            </button>
            <p className="text-[10px] text-center font-bold text-slate-500">
              ⚡ Places the official YAMAHA app icon directly onto your phone's home screen
            </p>
          </div>
        )}

        {activeTab === 'instant' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 space-y-1.5 text-xs text-slate-700">
              <p className="font-black text-sky-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Instant Progressive Web App (PWA)
              </p>
              <p className="text-[11px] leading-relaxed font-medium">
                Add YAMAHA directly to your phone background/home screen with zero storage space required. Runs as a standalone app with the official YAMAHA icon.
              </p>
            </div>

            <button
              type="button"
              onClick={handleNativePwaInstall}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Add Icon to Phone Background (Instant)</span>
            </button>
            <p className="text-[10px] text-center font-bold text-slate-500">
              ⚡ Instant 1-tap launch directly from your mobile background
            </p>
          </div>
        )}

        {activeTab === 'ios' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2 text-xs text-slate-800">
              <p className="font-black text-sky-900 text-xs">How to Install on iPhone (Safari):</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-sky-600 mx-0.5" /> at the bottom of Safari
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>'Add to Home Screen'</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600 mx-0.5" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>Tap <strong>Add</strong> in the top-right corner</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200 transition-colors"
            >
              Got it, Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
