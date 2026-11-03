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
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto select-none bg-[#070B09]/95 backdrop-blur-lg border-t-2 border-emerald-900/80 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] transition-all duration-200"
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
                  ? 'text-[#D4AF37] font-black scale-105'
                  : 'text-[#FFFDF7]/60 hover:text-[#FFFDF7] font-semibold'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#991B1B] text-[#FFFDF7] font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-[#D4AF37] shadow-xs">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] tracking-tight leading-tight mt-0.5 ${
                  isActive ? 'font-black text-[#D4AF37]' : 'font-semibold text-[#FFFDF7]/70'
                }`}
              >
                {tab.label}
              </span>

              {/* Glowing Indicator for active tab */}
              {isActive ? (
                <span className="w-4 sm:w-5 h-1 rounded-full bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-[#991B1B] mt-0.5 shadow-sm transition-all" />
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
