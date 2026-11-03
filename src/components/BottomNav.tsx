import React from 'react';
import { Home, TrendingUp, Briefcase, Users, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../utils/sound';

export type NavTab = 'home' | 'plan' | 'invest' | 'referral' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  investmentsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  investmentsCount = 0,
}) => {
  const { t } = useLanguage();

  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'home',
      label: t('nav.home', 'Home'),
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'plan',
      label: t('nav.plan', 'Plan'),
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'invest',
      label: t('nav.invest', 'Invest'),
      icon: <Briefcase className="w-5 h-5" />,
      badge: investmentsCount,
    },
    {
      id: 'referral',
      label: t('nav.referral', 'Referral'),
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: t('nav.profile', 'Profile'),
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto select-none bg-white/95 backdrop-blur-lg border-t-2 border-sky-200 shadow-[0_-4px_20px_rgba(14,165,233,0.15)] transition-all duration-200"
      style={{
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div className="max-w-md mx-auto px-1 sm:px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                soundService.playClick();
                onSelectTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-2xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-sky-700 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-400 text-slate-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] tracking-tight leading-tight mt-0.5 ${
                  isActive ? 'font-black text-sky-900' : 'font-semibold text-slate-600'
                }`}
              >
                {tab.label}
              </span>

              {/* Glowing Indicator for active tab */}
              {isActive ? (
                <span className="w-4 sm:w-5 h-1 rounded-full bg-gradient-to-r from-amber-400 via-sky-500 to-amber-400 mt-0.5 shadow-sm transition-all" />
              ) : (
                <span className="w-4 sm:w-5 h-1 mt-0.5 opacity-0" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
