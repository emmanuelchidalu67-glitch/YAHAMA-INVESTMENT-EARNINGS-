import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { PlanView } from './views/PlanView';
import { InvestView } from './views/InvestView';
import { ReferralView } from './views/ReferralView';
import { ProfileView } from './views/ProfileView';
import { HistoryView } from './views/HistoryView';
import { AdminView } from './views/AdminView';
import { AuthView } from './views/AuthView';

// Modals
import { SpinWheelModal, FloatingSpinButton } from './components/SpinWheelModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { AddBankModal } from './components/AddBankModal';
import { SupportModal } from './components/SupportModal';
import { NotificationModal } from './components/NotificationModal';
import { AuthModal } from './components/AuthModal';
import { GuidedTourModal } from './components/GuidedTourModal';
import { CommunityWelcomeModal } from './components/CommunityWelcomeModal';
import { VtuTelecomModal } from './components/VtuTelecomModal';
import { AirtimeModal } from './components/AirtimeModal';
import { DataModal } from './components/DataModal';

import { User, VIPPlan, AdminSettings, SpinReward, Transaction } from './types';
import { INITIAL_VIP_PLANS, DEFAULT_ADMIN_SETTINGS } from './data/initialData';
import { ApiService, getLocalRegisteredUsers, saveUserToLocalRegistry, getLocalTransactions, getLocalInvestments, saveTransactionToLocalRegistry } from './services/api';
import { soundService } from './utils/sound';
import { triggerHaptic, HapticPattern } from './utils/haptics';
import { Crown, Sparkles, Check, AlertCircle, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { TopInstallBanner } from './components/TopInstallBanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showHistory, setShowHistory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // User & Data State
  const [user, setUser] = useState<User | null>(null);
  const [vipPlans, setVipPlans] = useState<VIPPlan[]>(INITIAL_VIP_PLANS);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const cached = localStorage.getItem('motorola_admin_settings_cache');
      if (cached) {
        return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {}
    return DEFAULT_ADMIN_SETTINGS;
  });
  const [investmentsCount, setInvestmentsCount] = useState<number>(0);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('yamaha_theme') === 'dark' ||
      localStorage.getItem('motorola_theme') === 'dark'
    );
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('yamaha_theme', next ? 'dark' : 'light');
      localStorage.setItem('motorola_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Modals
  const [spinOpen, setSpinOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [tourOpen, setTourOpen] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [vtuOpen, setVtuOpen] = useState(false);
  const [vtuInitialTab, setVtuInitialTab] = useState<'airtime' | 'data'>('data');
  const [airtimeOpen, setAirtimeOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  // Plan Purchase Confirmation Modal
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<VIPPlan | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [instantDepositAlert, setInstantDepositAlert] = useState<{ amount: number; text: string } | null>(null);

  // Load permanent DB settings, plans, and session
  useEffect(() => {
    // 0. Proactively sync any offline/locally cached users, transactions, and investments to server
    const localUsers = getLocalRegisteredUsers();
    const localTransactions = getLocalTransactions();
    const localInvestments = getLocalInvestments();
    if (localUsers.length > 0 || localTransactions.length > 0 || localInvestments.length > 0) {
      ApiService.syncClientData({
        users: localUsers.length > 0 ? localUsers : undefined,
        transactions: localTransactions.length > 0 ? localTransactions : undefined,
        investments: localInvestments.length > 0 ? localInvestments : undefined,
      }).catch(() => {});
    }

    // 1. Always fetch public platform settings & plans from permanent DB
    ApiService.getPublicSettings()
      .then((data) => {
        if (data.adminSettings) {
          setAdminSettings(data.adminSettings);
          try {
            localStorage.setItem('yamaha_admin_settings_cache', JSON.stringify(data.adminSettings));
            localStorage.setItem('motorola_admin_settings_cache', JSON.stringify(data.adminSettings));
          } catch (e) {}
        }
        if (data.plans && data.plans.length > 0) setVipPlans(data.plans);
      })
      .catch((err) => console.error('Failed to load public settings:', err));

    // 2. Restore saved user session if logged in
    const savedUserId =
      localStorage.getItem('yamaha_user_id') || localStorage.getItem('motorola_user_id');
    if (savedUserId) {
      ApiService.getProfile(savedUserId)
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
            saveUserToLocalRegistry(res.user);
            if (res.adminSettings) {
              setAdminSettings(res.adminSettings);
              try {
                localStorage.setItem('yamaha_admin_settings_cache', JSON.stringify(res.adminSettings));
                localStorage.setItem('motorola_admin_settings_cache', JSON.stringify(res.adminSettings));
              } catch (e) {}
            }
            // Fetch active investments count
            ApiService.getUserInvestments(res.user.id)
              .then((iRes) => {
                if (iRes && iRes.investments) {
                  setInvestmentsCount(iRes.investments.filter((i) => i.status === 'active').length);
                }
              })
              .catch(() => {});
            // Show community popup if not dismissed in current session
            const hasDismissedCommunity =
              sessionStorage.getItem('yamaha_community_dismissed') ||
              sessionStorage.getItem('motorola_community_dismissed');
            if (!hasDismissedCommunity) {
              setCommunityModalOpen(true);
            }
          }
        })
        .catch(() => {
          // Check local registry backup before discarding session
          const localMatch = getLocalRegisteredUsers().find((u) => u.id === savedUserId);
          if (localMatch) {
            setUser(localMatch);
            ApiService.syncClientData({ users: [localMatch] }).catch(() => {});
          } else {
            localStorage.removeItem('yamaha_user_id');
            localStorage.removeItem('motorola_user_id');
            setUser(null);
          }
        });
    }

    // 3. Auto-trigger Guided Tour for first-time users
    const hasCompletedTour =
      localStorage.getItem('yamaha_tour_completed') ||
      localStorage.getItem('motorola_tour_completed');
    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        setTourOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Live Sync Engine: Instantly syncs admin deposit & withdrawal approvals, updates user balance immediately,
  // triggers tactile vibrations on balance changes, and processes investment duration checks.
  useEffect(() => {
    if (!user) return;

    let isPolling = false;

    const runLiveSync = async () => {
      if (isPolling || !user?.id) return;
      isPolling = true;

      try {
        const syncRes = await ApiService.liveSync(user.id);
        if (syncRes && syncRes.user) {
          const prevBalance = user.balance;
          const newBalance = syncRes.user.balance;

          // If balance increased due to deposit approval or dividend
          if (newBalance > prevBalance) {
            const diff = newBalance - prevBalance;
            soundService.playCoin();
            triggerHaptic(HapticPattern.DEPOSIT_APPROVED);
            setInstantDepositAlert({
              amount: diff,
              text: `🎉 ₦${diff.toLocaleString()} Credited! Admin has approved your deposit. Balance updated immediately.`,
            });
            setTimeout(() => setInstantDepositAlert(null), 5000);
          }

          setUser(syncRes.user);
          saveUserToLocalRegistry(syncRes.user);

          if (syncRes.investments) {
            setInvestmentsCount(syncRes.investments.filter((i) => i.status === 'active').length);
          }

          // Broadcast for sub-components (HistoryView, DepositModal, etc.)
          window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: syncRes }));
        }
      } catch (err: any) {
        if (err?.message?.includes('permanently removed') || err?.message?.includes('not found')) {
          handleSignOut();
          alert('This account has been permanently removed by the platform administrator.');
        }
      } finally {
        isPolling = false;
      }
    };

    // Run immediately upon user load / change
    runLiveSync();

    // Check periodically every 2.5 seconds in the background
    const interval = setInterval(runLiveSync, 2500);

    // Also check when browser tab regains focus or visibility
    const handleFocus = () => runLiveSync();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Listen to manual sync events
    const handleUserSyncEvent = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
      }
    };
    window.addEventListener('motorola_user_sync', handleUserSyncEvent);

    const handleInvestmentDeletedEvent = (e: any) => {
      if (user?.id) {
        if (e.detail?.user && e.detail.user.id === user.id) {
          setUser(e.detail.user);
        }
        ApiService.getUserInvestments(user.id)
          .then((iRes) => {
            if (iRes && iRes.investments) {
              setInvestmentsCount(iRes.investments.filter((i) => i.status === 'active').length);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('motorola_investment_deleted', handleInvestmentDeletedEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('motorola_user_sync', handleUserSyncEvent);
      window.removeEventListener('motorola_investment_deleted', handleInvestmentDeletedEvent);
    };
  }, [user?.id, user?.balance]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    saveUserToLocalRegistry(authenticatedUser);
    localStorage.setItem('yamaha_user_id', authenticatedUser.id);
    localStorage.setItem('motorola_user_id', authenticatedUser.id);
    setAuthOpen(false);

    // Refresh investments
    ApiService.getUserInvestments(authenticatedUser.id)
      .then((iRes) => {
        if (iRes && iRes.investments) {
          setInvestmentsCount(iRes.investments.filter((i) => i.status === 'active').length);
        }
      })
      .catch((err) => console.warn('Failed to load user investments:', err));

    // Auto-open Community Welcome Modal on login or signup
    setCommunityModalOpen(true);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('yamaha_user_id');
    localStorage.removeItem('motorola_user_id');
    setShowAdmin(false);
    setShowHistory(false);
    setActiveTab('home');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    saveUserToLocalRegistry(updatedUser);
  };

  const handleRequireAuth = () => {
    setAuthMode('login');
    setAuthOpen(true);
  };

  // Instant Purchase Plan Executer with tactile confirmation
  const handleConfirmInvestment = async () => {
    if (!selectedPlanForPurchase) return;
    if (!user) {
      setSelectedPlanForPurchase(null);
      handleRequireAuth();
      return;
    }

    triggerHaptic(HapticPattern.INVEST_CONFIRM);
    setPurchasing(true);
    setPurchaseMsg(null);

    try {
      const res = await ApiService.invest(user.id, selectedPlanForPurchase.level);
      setUser(res.user);
      soundService.playInvest();
      triggerHaptic(HapticPattern.INVEST_SUCCESS);
      setPurchaseMsg({
        type: 'success',
        text: `Successfully invested in ${selectedPlanForPurchase.name}! Daily returns activated.`,
      });

      // Update count
      const iRes = await ApiService.getUserInvestments(user.id);
      setInvestmentsCount(iRes.investments.filter((i) => i.status === 'active').length);

      setTimeout(() => {
        setSelectedPlanForPurchase(null);
        setPurchaseMsg(null);
        setActiveTab('invest'); // Navigate to Invest tab to see countdown!
      }, 1500);
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setPurchaseMsg({
        type: 'error',
        text: err.message || 'Investment failed. Please deposit funds.',
      });
    } finally {
      setPurchasing(false);
    }
  };

  // If user is not logged in, render the dedicated AuthView page for Sign In & Registration with Top Banner
  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-slate-900 font-sans flex flex-col antialiased selection:bg-sky-500 selection:text-white">
        <TopInstallBanner />
        <AuthView
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess}
          adminSettings={adminSettings}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-sans flex flex-col antialiased selection:bg-sky-500 selection:text-white transition-colors duration-300">
      {/* Removable Top Install Banner */}
      <TopInstallBanner />

      {/* Top PalmPay Header */}
      <Header
        user={user}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
        onOpenAuth={() => {
          setAuthMode('signup');
          setAuthOpen(true);
        }}
        onOpenVipPlans={() => {
          setShowAdmin(false);
          setShowHistory(false);
          setActiveTab('plan');
        }}
        onOpenProfile={() => {
          setShowAdmin(false);
          setShowHistory(false);
          setActiveTab('profile');
        }}
      />

      {/* Main Screen Container */}
      <main className={`flex-1 w-full mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-24 sm:pb-28 ${showAdmin ? 'max-w-4xl' : 'max-w-md'}`}>
        {/* Instant Deposit Approval Toast Notification */}
        {instantDepositAlert && (
          <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-200 border border-emerald-400 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-amber-300" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-amber-200">DEPOSIT APPROVED &amp; CREDITED INSTANTLY!</p>
                <p className="font-medium text-white/90">{instantDepositAlert.text}</p>
              </div>
            </div>
            <button
              onClick={() => setInstantDepositAlert(null)}
              className="p-1 text-white/70 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showAdmin ? (
          <AdminView
            user={user}
            onRequireAuth={handleRequireAuth}
            onCloseAdmin={() => setShowAdmin(false)}
            onUpdateSettings={(newSettings) => {
              setAdminSettings(newSettings);
              try {
                localStorage.setItem('yamaha_admin_settings_cache', JSON.stringify(newSettings));
                localStorage.setItem('motorola_admin_settings_cache', JSON.stringify(newSettings));
              } catch (e) {}
            }}
          />
        ) : showHistory ? (
          <HistoryView user={user} onRequireAuth={handleRequireAuth} />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                user={user}
                vipPlans={vipPlans}
                adminSettings={adminSettings}
                onOpenDeposit={() => setDepositOpen(true)}
                onOpenWithdraw={() => setWithdrawOpen(true)}
                onOpenTeam={() => setActiveTab('referral')}
                onOpenHistory={() => setShowHistory(true)}
                onOpenSpin={() => setSpinOpen(true)}
                onOpenVtu={(tab) => {
                  if (tab === 'airtime') {
                    setAirtimeOpen(true);
                  } else {
                    setDataOpen(true);
                  }
                }}
                onOpenAirtime={() => setAirtimeOpen(true)}
                onOpenData={() => setDataOpen(true)}
                onSelectPlan={(plan) => {
                  triggerHaptic(HapticPattern.PLAN_SELECT);
                  setSelectedPlanForPurchase(plan);
                }}
                onUpdateUser={handleUpdateUser}
                onRequireAuth={handleRequireAuth}
              />
            )}

            {activeTab === 'plan' && (
              <PlanView
                vipPlans={vipPlans}
                user={user}
                onSelectPlan={(plan) => {
                  triggerHaptic(HapticPattern.PLAN_SELECT);
                  setSelectedPlanForPurchase(plan);
                }}
              />
            )}

            {activeTab === 'invest' && (
              <InvestView
                user={user}
                adminSettings={adminSettings}
                onRequireAuth={handleRequireAuth}
                onOpenReferral={() => setActiveTab('referral')}
                onUserUpdate={(updated) => setUser(updated)}
              />
            )}

            {activeTab === 'referral' && (
              <ReferralView
                user={user}
                adminSettings={adminSettings}
                onRequireAuth={handleRequireAuth}
                onOpenSpin={() => setSpinOpen(true)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                adminSettings={adminSettings}
                onOpenAddBank={() => setAddBankOpen(true)}
                onOpenDeposit={() => setDepositOpen(true)}
                onOpenWithdraw={() => setWithdrawOpen(true)}
                onOpenTeam={() => setActiveTab('referral')}
                onOpenHistory={() => setShowHistory(true)}
                onOpenSupport={() => setSupportOpen(true)}
                onOpenAdmin={() => setShowAdmin(true)}
                onSignOut={handleSignOut}
                onRequireAuth={handleRequireAuth}
                onUpdateUser={handleUpdateUser}
                onReplayTour={() => setTourOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Movable Floating Spin Button */}
      <FloatingSpinButton
        onClick={() => setSpinOpen(true)}
        spinCount={user ? user.spinsAvailable || 0 : 1}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setShowAdmin(false);
          setShowHistory(false);
          setActiveTab(tab);
        }}
        investmentsCount={investmentsCount}
      />

      {/* MODALS */}
      <SpinWheelModal
        isOpen={spinOpen}
        onClose={() => setSpinOpen(false)}
        user={user}
        onSpinSuccess={(reward, updatedUser) => setUser(updatedUser)}
        onRequireAuth={handleRequireAuth}
      />

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        user={user}
        adminSettings={adminSettings}
        onDepositSuccess={(tx) => {
          saveTransactionToLocalRegistry(tx);
          if (user?.id) {
            ApiService.liveSync(user.id).catch(() => {});
          }
          window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { transactions: [tx] } }));
          window.dispatchEvent(new CustomEvent('motorola_transaction_created', { detail: tx }));
        }}
        onRequireAuth={handleRequireAuth}
      />

      <AirtimeModal
        isOpen={airtimeOpen}
        onClose={() => setAirtimeOpen(false)}
        user={user}
        adminSettings={adminSettings}
        onSuccess={(updatedUser, tx) => {
          setUser(updatedUser);
          saveTransactionToLocalRegistry(tx);
          window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { user: updatedUser, transactions: [tx] } }));
          window.dispatchEvent(new CustomEvent('motorola_transaction_created', { detail: tx }));
        }}
        onRequireAuth={handleRequireAuth}
      />

      <DataModal
        isOpen={dataOpen}
        onClose={() => setDataOpen(false)}
        user={user}
        adminSettings={adminSettings}
        onSuccess={(updatedUser, tx) => {
          setUser(updatedUser);
          saveTransactionToLocalRegistry(tx);
          window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { user: updatedUser, transactions: [tx] } }));
          window.dispatchEvent(new CustomEvent('motorola_transaction_created', { detail: tx }));
        }}
        onRequireAuth={handleRequireAuth}
      />

      <VtuTelecomModal
        isOpen={vtuOpen}
        onClose={() => setVtuOpen(false)}
        user={user}
        adminSettings={adminSettings}
        initialTab={vtuInitialTab}
        onSuccess={(updatedUser, tx) => {
          setUser(updatedUser);
          saveTransactionToLocalRegistry(tx);
          window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { user: updatedUser, transactions: [tx] } }));
        }}
        onRequireAuth={handleRequireAuth}
        onOpenDeposit={() => {
          setVtuOpen(false);
          setDepositOpen(true);
        }}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        user={user}
        adminSettings={adminSettings}
        onWithdrawSuccess={(tx, updatedUser) => setUser(updatedUser)}
        onOpenAddBank={() => {
          setWithdrawOpen(false);
          setAddBankOpen(true);
        }}
        onRequireAuth={handleRequireAuth}
        onOpenReferral={() => {
          setWithdrawOpen(false);
          setShowAdmin(false);
          setShowHistory(false);
          setActiveTab('referral');
        }}
      />

      <AddBankModal
        isOpen={addBankOpen}
        onClose={() => setAddBankOpen(false)}
        user={user}
        onBankSaved={(updatedUser) => setUser(updatedUser)}
        onRequireAuth={handleRequireAuth}
      />

      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        adminSettings={adminSettings}
      />

      <NotificationModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <GuidedTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigateTab={(tab) => {
          setShowAdmin(false);
          setShowHistory(false);
          setActiveTab(tab);
        }}
        onOpenDeposit={() => setDepositOpen(true)}
      />

      <CommunityWelcomeModal
        isOpen={communityModalOpen}
        onClose={() => {
          setCommunityModalOpen(false);
          sessionStorage.setItem('motorola_community_dismissed', 'true');
        }}
        adminSettings={adminSettings}
      />

      {/* VIP Plan Purchase Confirmation Modal */}
      {selectedPlanForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-purple-100 relative">
            <button
              onClick={() => {
                setSelectedPlanForPurchase(null);
                setPurchaseMsg(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedPlanForPurchase.badgeColor} text-white font-black text-base flex items-center justify-center shadow-lg shrink-0`}
              >
                V{selectedPlanForPurchase.level}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Confirm {selectedPlanForPurchase.name}
                </h3>
                <p className="text-xs text-purple-900 font-bold">
                  Capital: ₦{selectedPlanForPurchase.capital.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Daily Return (24h):</span>
                <span className="font-black text-emerald-600">
                  +₦{selectedPlanForPurchase.dailyEarning.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Duration:</span>
                <span className="font-bold text-slate-800">
                  {selectedPlanForPurchase.durationDays} Days
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-sky-200">
                <span className="font-bold text-slate-700">Total ROI:</span>
                <span className="font-black text-sky-950">
                  ₦{selectedPlanForPurchase.totalInvestment.toLocaleString()}
                </span>
              </div>
            </div>

            {purchaseMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  purchaseMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {purchaseMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{purchaseMsg.text}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForPurchase(null);
                  setPurchaseMsg(null);
                }}
                className="w-1/3 py-3 rounded-2xl border border-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInvestment}
                disabled={purchasing}
                className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-sky-300/40 disabled:opacity-50 cursor-pointer"
              >
                {purchasing ? 'Activating Plan...' : 'Confirm & Invest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
