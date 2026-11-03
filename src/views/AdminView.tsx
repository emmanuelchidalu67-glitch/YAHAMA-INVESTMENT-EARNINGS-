import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Building2,
  Building,
  Edit,
  Save,
  Check,
  Gift,
  Layers,
  FileText,
  DollarSign,
  Plus,
  Tag,
  Trash2,
  Sparkles,
  Megaphone,
  Database,
  Download,
  Upload,
  History,
  AlertCircle,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  Phone,
  Mail,
  UserCheck,
  Ban,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  CreditCard,
  Wallet,
  Award,
  Clock,
  Zap,
  Radio,
} from 'lucide-react';
import { User, Transaction, AdminSettings, Investment, VIPPlan, SpinReward, TopUpCode } from '../types';
import { ApiService, removeUserFromLocalRegistry } from '../services/api';
import { triggerHaptic, HapticPattern } from '../utils/haptics';

interface AdminViewProps {
  user: User | null;
  onRequireAuth: () => void;
  onCloseAdmin: () => void;
  onUpdateSettings?: (settings: AdminSettings) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, onRequireAuth, onCloseAdmin, onUpdateSettings }) => {
  const [tab, setTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'vtu' | 'users' | 'plans' | 'spins' | 'topup' | 'investments' | 'history' | 'settings'
  >('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [vtuOrders, setVtuOrders] = useState<Transaction[]>([]);
  const [vtuSearch, setVtuSearch] = useState('');
  const [vtuTypeFilter, setVtuTypeFilter] = useState<'all' | 'airtime' | 'data'>('all');
  const [vtuStatusFilter, setVtuStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userVipFilter, setUserVipFilter] = useState<'all' | number>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned' | 'withdrawal_banned' | 'investors' | 'funded' | 'bank_bound' | 'admins'>('all');
  const [userSortBy, setUserSortBy] = useState<'newest' | 'oldest' | 'balance_desc' | 'invested_desc' | 'earned_desc' | 'ref_desc' | 'name_asc' | 'vip_desc'>('newest');
  const [userPage, setUserPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState<number>(20);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [depositSearch, setDepositSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'investment' | 'daily_earning' | 'referral_bonus' | 'welcome_bonus' | 'spin_win'>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [dbHealth, setDbHealth] = useState<any>(null);

  // Plans & Spins & Investments & Top-Up Codes
  const [plans, setPlans] = useState<VIPPlan[]>([]);
  const [spinRewards, setSpinRewards] = useState<SpinReward[]>([]);
  const [allInvestments, setAllInvestments] = useState<Investment[]>([]);
  const [investmentSearch, setInvestmentSearch] = useState('');
  const [investmentStatusFilter, setInvestmentStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [settlingInvestments, setSettlingInvestments] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [deleteRefundCapital, setDeleteRefundCapital] = useState<boolean>(false);
  const [isDeletingInvestment, setIsDeletingInvestment] = useState<boolean>(false);
  const [topUpCodes, setTopUpCodes] = useState<TopUpCode[]>([]);

  // Create Code Form State
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState('');
  const [newCodeMax, setNewCodeMax] = useState('100');

  // Create VIP Plan Form State
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanLevel, setNewPlanLevel] = useState<number>(11);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCapital, setNewPlanCapital] = useState('');
  const [newPlanDaily, setNewPlanDaily] = useState('');
  const [newPlanDays, setNewPlanDays] = useState('60');

  // Editing Settings State
  const [settingsForm, setSettingsForm] = useState<AdminSettings | null>(null);

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState('');
  const [editInvestedInput, setEditInvestedInput] = useState('');
  const [editEarnedInput, setEditEarnedInput] = useState('');
  const [editVipInput, setEditVipInput] = useState<number>(1);
  const [editRoleInput, setEditRoleInput] = useState<'user' | 'admin'>('user');
  const [editSpinsInput, setEditSpinsInput] = useState<number>(0);
  const [editIsBanned, setEditIsBanned] = useState<boolean>(false);
  const [editWithdrawalBanned, setEditWithdrawalBanned] = useState<boolean>(false);

  // File Upload Ref for DB Restore
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const [ovRes, depRes, wthRes, usrRes, plansRes, invRes, codesRes, txRes, healthRes, vtuRes] =
        await Promise.allSettled([
          ApiService.getAdminOverview(user.id),
          ApiService.getAdminDeposits(user.id),
          ApiService.getAdminWithdrawals(user.id),
          ApiService.getAdminUsers(user.id),
          ApiService.getPlans(),
          ApiService.getAdminInvestments(user.id),
          ApiService.getAdminTopUpCodes(user.id),
          ApiService.getAdminTransactions(user.id),
          ApiService.getDbHealth(user.id),
          ApiService.getAdminVtuOrders(user.id),
        ]);

      if (ovRes.status === 'fulfilled' && ovRes.value) {
        setOverview(ovRes.value);
        if (ovRes.value.adminSettings) setSettingsForm(ovRes.value.adminSettings);
        if (ovRes.value.spinRewards) setSpinRewards(ovRes.value.spinRewards);
      }
      if (depRes.status === 'fulfilled' && depRes.value?.deposits) {
        setDeposits(depRes.value.deposits);
      }
      if (wthRes.status === 'fulfilled' && wthRes.value?.withdrawals) {
        setWithdrawals(wthRes.value.withdrawals);
      }
      if (usrRes.status === 'fulfilled' && usrRes.value?.users) {
        setUsersList(usrRes.value.users);
      }
      if (plansRes.status === 'fulfilled' && plansRes.value?.plans) {
        setPlans(plansRes.value.plans);
      }
      if (invRes.status === 'fulfilled' && invRes.value?.investments) {
        setAllInvestments(invRes.value.investments);
      }
      if (codesRes.status === 'fulfilled' && codesRes.value?.topUpCodes) {
        setTopUpCodes(codesRes.value.topUpCodes);
      }
      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        setAllTransactions(txRes.value.transactions);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setDbHealth(healthRes.value);
      }
      if (vtuRes.status === 'fulfilled' && vtuRes.value?.orders) {
        setVtuOrders(vtuRes.value.orders);
      }
    } catch (err: any) {
      console.error('Admin data fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    if (!user) return;
    try {
      await ApiService.exportDbBackup(user.id);
      setActionSuccessMsg('Database JSON backup successfully downloaded to your device!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Export failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const text = await file.text();
      const backupJson = JSON.parse(text);
      if (!confirm(`Restore database from file "${file.name}"? This will overwrite the current live database!`)) {
        return;
      }
      const res = await ApiService.restoreDbBackup(user.id, backupJson);
      setActionSuccessMsg(res.message || 'Database successfully restored from JSON!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchAdminData();
    } catch (err: any) {
      alert('Restore failed: ' + (err.message || 'Invalid JSON file'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchAdminData();
    // Fast 1.5s interval so new deposits and withdrawals show up immediately
    const interval = setInterval(fetchAdminData, 1500);

    const handleLiveEvent = () => {
      fetchAdminData();
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.includes('motorola')) {
        fetchAdminData();
      }
    };

    window.addEventListener('motorola_live_update', handleLiveEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('motorola_live_update', handleLiveEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-12 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="font-extrabold text-base text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Admin privileges are strictly restricted to authorized platform administrators.
        </p>
        <button
          onClick={onCloseAdmin}
          className="py-3 px-6 rounded-2xl bg-purple-900 text-white font-extrabold text-xs shadow-lg"
        >
          Return to App
        </button>
      </div>
    );
  }

  // Export Data to CSV
  const handleExportCsv = (exportType: 'deposits' | 'withdrawals' | 'transactions' | 'investments') => {
    let rows: any[] = [];
    let filename = '';
    if (exportType === 'deposits') {
      rows = deposits.map((d) => ({
        Transaction_ID: d.id,
        User_Phone: d.userPhone,
        Amount_NGN: d.amount,
        Status: d.status,
        Payment_Method: d.paymentMethod || 'Manual Bank Transfer',
        Reference_Proof: d.proofReference || '',
        Admin_Note: d.adminNote || '',
        Date: new Date(d.createdAt).toLocaleString(),
      }));
      filename = `motorola_deposits_ledger_${Date.now()}.csv`;
    } else if (exportType === 'withdrawals') {
      rows = withdrawals.map((w) => ({
        Transaction_ID: w.id,
        User_Phone: w.userPhone,
        Gross_Amount_NGN: w.amount,
        Net_Payout_NGN: w.netAmount || w.amount,
        Bank_Name: w.bankName || '',
        Account_Number: w.accountNumber || '',
        Account_Name: w.accountName || '',
        Status: w.status,
        Admin_Note: w.adminNote || '',
        Date: new Date(w.createdAt).toLocaleString(),
      }));
      filename = `motorola_withdrawals_ledger_${Date.now()}.csv`;
    } else if (exportType === 'investments') {
      rows = allInvestments.map((i) => ({
        Investment_ID: i.id,
        User_Phone: i.userPhone,
        Plan_Name: i.planName,
        Plan_Level: i.planLevel,
        Capital_NGN: i.capital,
        Daily_Return_NGN: i.dailyEarning,
        Total_Investment_ROI_NGN: i.totalInvestment,
        Duration_Days: i.durationDays || 30,
        Days_Completed: i.daysCompleted,
        Total_Earned_So_Far_NGN: i.totalEarnedSoFar,
        Status: i.status,
        Purchased_At: new Date(i.purchasedAt).toLocaleString(),
        Next_Settlement: new Date(i.nextSettlementTimestamp).toLocaleString(),
      }));
      filename = `motorola_30day_investments_ledger_${Date.now()}.csv`;
    } else {
      rows = allTransactions.map((t) => ({
        Transaction_ID: t.id,
        User_Phone: t.userPhone,
        Type: t.type,
        Amount_NGN: t.amount,
        Status: t.status,
        Admin_Note: t.adminNote || '',
        Date: new Date(t.createdAt).toLocaleString(),
      }));
      filename = `motorola_complete_financial_ledger_${Date.now()}.csv`;
    }

    if (!rows.length) {
      alert('No transaction records available to export.');
      return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row: any) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
              cell = cell.replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionSuccessMsg(`Financial CSV Ledger exported successfully!`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  // Filtered Deposits
  const filteredDeposits = React.useMemo(() => {
    return deposits.filter((d) => {
      if (depositFilter !== 'all' && d.status !== depositFilter) return false;
      if (!depositSearch.trim()) return true;
      const q = depositSearch.trim().toLowerCase();
      return (
        d.userPhone?.toLowerCase().includes(q) ||
        d.id?.toLowerCase().includes(q) ||
        d.proofReference?.toLowerCase().includes(q) ||
        d.paymentMethod?.toLowerCase().includes(q) ||
        d.amount?.toString().includes(q)
      );
    });
  }, [deposits, depositFilter, depositSearch]);

  // Filtered Withdrawals
  const filteredWithdrawals = React.useMemo(() => {
    return withdrawals.filter((w) => {
      if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
      if (!withdrawalSearch.trim()) return true;
      const q = withdrawalSearch.trim().toLowerCase();
      return (
        w.userPhone?.toLowerCase().includes(q) ||
        w.id?.toLowerCase().includes(q) ||
        w.accountNumber?.toLowerCase().includes(q) ||
        w.accountName?.toLowerCase().includes(q) ||
        w.bankName?.toLowerCase().includes(q) ||
        w.amount?.toString().includes(q)
      );
    });
  }, [withdrawals, withdrawalFilter, withdrawalSearch]);

  // Handle Deposit Action (Approve / Reject)
  const handleDepositAction = async (txId: string, action: 'approve' | 'reject') => {
    try {
      // Optimistic instant UI update so admin sees immediate response
      setDeposits((prev) =>
        prev.map((d) =>
          d.id === txId
            ? {
                ...d,
                status: action === 'approve' ? 'approved' : 'rejected',
                adminNote: action === 'approve' ? 'Deposit Verified and Credited by Admin' : 'Deposit Rejected',
                creditedAt: action === 'approve' ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );

      const res = await ApiService.handleAdminDeposit(user.id, txId, action);
      triggerHaptic(action === 'approve' ? HapticPattern.DEPOSIT_APPROVED : HapticPattern.INVEST_ERROR);
      if (action === 'approve') {
        setActionSuccessMsg(`✅ ${res?.message || 'Deposit approved & credited instantly! User balance updated immediately.'}`);
      } else {
        setActionSuccessMsg(`Deposit rejected.`);
      }
      setTimeout(() => setActionSuccessMsg(''), 4500);
      await fetchAdminData();
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      alert(err.message);
      await fetchAdminData();
    }
  };

  // Handle Withdrawal Action (Approve / Reject)
  const handleWithdrawalAction = async (txId: string, action: 'approve' | 'reject') => {
    try {
      // Optimistic instant UI update
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === txId
            ? {
                ...w,
                status: action === 'approve' ? 'approved' : 'rejected',
                adminNote: action === 'approve' ? 'Withdrawal Approved & Paid by Admin' : 'Withdrawal Rejected and Refunded',
                updatedAt: new Date().toISOString(),
              }
            : w
        )
      );

      const res = await ApiService.handleAdminWithdrawal(user.id, txId, action);
      triggerHaptic(action === 'approve' ? HapticPattern.DEPOSIT_APPROVED : HapticPattern.INVEST_ERROR);
      if (action === 'approve') {
        setActionSuccessMsg(`✅ ${res?.message || 'Withdrawal approved & paid to bank! Transaction is sealed & permanent.'}`);
      } else {
        setActionSuccessMsg(`Withdrawal rejected and amount refunded to user balance.`);
      }
      setTimeout(() => setActionSuccessMsg(''), 4500);
      await fetchAdminData();
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      alert(err.message);
      await fetchAdminData();
    }
  };

  // Handle VTU Airtime & Data Order Action (Approve / Reject)
  const handleVtuAction = async (txId: string, action: 'approve' | 'reject') => {
    try {
      setVtuOrders((prev) =>
        prev.map((o) =>
          o.id === txId
            ? {
                ...o,
                status: action === 'approve' ? 'approved' : 'rejected',
                adminNote: action === 'approve' ? 'VTU Order Approved & Dispatched by Admin' : 'VTU Order Rejected',
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      const res = await ApiService.adminVtuAction(user.id, txId, action);
      triggerHaptic(action === 'approve' ? HapticPattern.DEPOSIT_APPROVED : HapticPattern.INVEST_ERROR);
      setActionSuccessMsg(
        action === 'approve'
          ? `✅ ${res?.message || 'VTU order approved and marked delivered!'}`
          : 'VTU order rejected.'
      );
      setTimeout(() => setActionSuccessMsg(''), 4500);
      await fetchAdminData();
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      alert(err.message || 'Failed to update VTU order');
      await fetchAdminData();
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;

    try {
      const res = await ApiService.saveAdminSettings(user.id, settingsForm);
      if (res?.adminSettings) {
        setSettingsForm(res.adminSettings);
        if (onUpdateSettings) onUpdateSettings(res.adminSettings);
      } else {
        if (onUpdateSettings) onUpdateSettings(settingsForm);
      }
      try {
        localStorage.setItem('motorola_admin_settings_cache', JSON.stringify(settingsForm));
      } catch (e) {}

      setActionSuccessMsg('✅ Deposit bank, WhatsApp & Telegram links, and bonuses saved permanently to disk!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save VIP Plan
  const handleSavePlan = async (updatedPlan: VIPPlan) => {
    try {
      const newPlans = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
      await ApiService.updateAdminPlans(user.id, newPlans);
      setPlans(newPlans);
      setActionSuccessMsg(`VIP Plan "${updatedPlan.name}" updated permanently!`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete VIP Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to remove this VIP plan from the platform?')) return;
    try {
      const newPlans = plans.filter((p) => p.id !== planId);
      await ApiService.updateAdminPlans(user.id, newPlans);
      setPlans(newPlans);
      setActionSuccessMsg('VIP Plan removed successfully!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add New VIP Plan
  const handleCreateNewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanCapital || !newPlanDaily) {
      alert('Please fill in all plan details');
      return;
    }

    const capital = Number(newPlanCapital);
    const daily = Number(newPlanDaily);
    const days = Number(newPlanDays) || 60;

    const newPlan: VIPPlan = {
      id: `plan_vip_${newPlanLevel}_${Date.now()}`,
      name: newPlanName.trim(),
      level: Number(newPlanLevel) as any,
      capital,
      dailyEarning: daily,
      totalInvestment: capital + daily * days,
      durationDays: days,
      badgeColor: 'from-purple-600 to-indigo-600',
      description: `High-yield Yamaha VIP ${newPlanLevel} investment contract.`,
    };

    try {
      const newPlans = [...plans, newPlan].sort((a, b) => a.level - b.level);
      await ApiService.updateAdminPlans(user.id, newPlans);
      setPlans(newPlans);
      setShowAddPlanModal(false);
      setNewPlanName('');
      setNewPlanCapital('');
      setNewPlanDaily('');
      setActionSuccessMsg(`New VIP ${newPlan.level} plan created successfully!`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save User Edit
  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      await ApiService.updateAdminUser(user.id, {
        targetUserId: editingUser.id,
        newBalance: Number(editBalanceInput),
        newInvestedBalance: Number(editInvestedInput),
        newEarnedBalance: Number(editEarnedInput),
        vipLevel: editVipInput,
        role: editRoleInput,
        spinsAvailable: editSpinsInput,
        isBanned: editIsBanned,
        withdrawalBanned: editWithdrawalBanned,
      });

      setActionSuccessMsg(`User ${editingUser.phone} (${editingUser.fullName}) balances and profile updated successfully!`);
      setEditingUser(null);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Toggle Withdrawal Ban
  const handleToggleWithdrawalBan = async (targetUser: User) => {
    if (targetUser.email.toLowerCase() === 'emmanuelchidalu67@gmail.com') {
      alert('Cannot restrict super admin withdrawal!');
      return;
    }

    try {
      const res = await ApiService.toggleWithdrawalBan(user.id, targetUser.id);
      setActionSuccessMsg(res.message || 'Withdrawal restriction updated successfully');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update withdrawal status');
    }
  };

  // Suspend / Unsuspend User Account
  const handleToggleSuspendUser = async (targetUser: User) => {
    if (targetUser.email.toLowerCase() === 'emmanuelchidalu67@gmail.com' || targetUser.id === 'usr_admin_emmanuel') {
      alert('Cannot suspend the super admin root account!');
      return;
    }

    const actionText = targetUser.isBanned ? 'Unsuspend/Activate' : 'Suspend';
    if (!confirm(`Do you want to ${actionText} user ${targetUser.fullName} (${targetUser.phone})?`)) {
      return;
    }

    try {
      const res = await ApiService.toggleBanAdminUser(user.id, targetUser.id);
      if (res.users) setUsersList(res.users);
      setActionSuccessMsg(res.message || `User status updated successfully.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Permanently Remove User from System
  const handlePermanentDeleteUser = async (targetUser: User) => {
    if (
      targetUser.email.toLowerCase() === 'emmanuelchidalu67@gmail.com' ||
      targetUser.id === 'usr_admin_emmanuel' ||
      targetUser.phone === '08149021882'
    ) {
      alert('Cannot delete the Super Admin root account!');
      return;
    }

    const warningPrompt = `⚠️ PERMANENT USER REMOVAL:\n\nAre you sure you want to PERMANENTLY REMOVE this user?\n\n• Name: ${targetUser.fullName}\n• Phone: ${targetUser.phone}\n• Email: ${targetUser.email}\n• Wallet Balance: ₦${targetUser.balance.toLocaleString()}\n\nThis will completely ERASE the user, their investments, balance, and transaction history permanently from the system database.\n\nClick OK to permanently delete.`;

    if (!confirm(warningPrompt)) {
      return;
    }

    try {
      const res = await ApiService.deleteAdminUser(user.id, targetUser.id);
      if (res.overview) setOverview(res.overview);
      if (res.users) setUsersList(res.users);
      removeUserFromLocalRegistry(targetUser.id);
      if (targetUser.phone) removeUserFromLocalRegistry(targetUser.phone);
      triggerHaptic(HapticPattern.INVEST_SUCCESS);
      setActionSuccessMsg(res.message || `User ${targetUser.fullName} (${targetUser.phone}) has been PERMANENTLY REMOVED from the platform & system info.`);
      setTimeout(() => setActionSuccessMsg(''), 4500);
      await fetchAdminData();
    } catch (err: any) {
      triggerHaptic(HapticPattern.INVEST_ERROR);
      alert(err.message || 'Failed to remove user permanently');
    }
  };

  // Trigger 24-Hour Settlement Recalculation Engine
  const handleTriggerSettlementEngine = async () => {
    if (!user) return;
    setSettlingInvestments(true);
    try {
      const res = await ApiService.triggerAdminSettlement(user.id);
      if (res && res.investments) {
        setAllInvestments(res.investments);
      }
      setActionSuccessMsg('24-Hour investment settlement engine processed successfully! All accrued daily dividends, user balances, and contract timelines are up to date.');
      setTimeout(() => setActionSuccessMsg(''), 5000);
      fetchAdminData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to trigger settlement engine');
      setTimeout(() => setActionErrorMsg(''), 5000);
    } finally {
      setSettlingInvestments(false);
    }
  };

  // Permanently Delete User Investment Contract
  const handleConfirmDeleteInvestment = async () => {
    if (!user || !investmentToDelete) return;
    setIsDeletingInvestment(true);
    try {
      const res = await ApiService.deleteAdminInvestment(
        user.id,
        investmentToDelete.id,
        deleteRefundCapital
      );

      setActionSuccessMsg(
        res.message ||
          `Investment product ${investmentToDelete.planName} for ${investmentToDelete.userPhone} deleted permanently.`
      );
      setTimeout(() => setActionSuccessMsg(''), 5000);

      if (res.investments) {
        setAllInvestments(res.investments);
      } else {
        setAllInvestments((prev) => prev.filter((i) => i.id !== investmentToDelete.id));
      }

      if (res.users) {
        setUsersList(res.users);
      }

      setInvestmentToDelete(null);
      setDeleteRefundCapital(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete investment');
    } finally {
      setIsDeletingInvestment(false);
    }
  };

  // Save Spin Wheel Control
  const handleSaveSpins = async () => {
    try {
      await ApiService.updateAdminSpins(user.id, spinRewards);
      if (settingsForm) {
        await ApiService.saveAdminSettings(user.id, settingsForm);
      }
      setActionSuccessMsg('Yamaha Fortune Wheel rewards & rig controls saved permanently!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Top-Up Voucher Code
  const handleCreateTopUpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') return;
    if (!newCodeName || !newCodeAmount) {
      alert('Please fill in code name and amount');
      return;
    }

    try {
      const res = await ApiService.createAdminTopUpCode(
        user.id,
        newCodeName,
        Number(newCodeAmount),
        Number(newCodeMax) || 100
      );
      setTopUpCodes(res.topUpCodes);
      setNewCodeName('');
      setNewCodeAmount('');
      setActionSuccessMsg(`Voucher code "${newCodeName.toUpperCase()}" created and saved permanently!`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Top-Up Voucher Code
  const handleDeleteTopUpCode = async (codeId: string) => {
    if (!user || user.role !== 'admin') return;
    if (!confirm('Are you sure you want to delete this top-up code?')) return;

    try {
      const res = await ApiService.deleteAdminTopUpCode(user.id, codeId);
      setTopUpCodes(res.topUpCodes);
      setActionSuccessMsg('Top-up code deleted successfully');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    let list = usersList.filter((u) => {
      // Search across all identifying fields
      if (q) {
        const matchName = u.fullName?.toLowerCase().includes(q);
        const matchPhone = u.phone?.includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchRef = u.referralCode?.toLowerCase().includes(q);
        const matchId = u.id?.toLowerCase().includes(q);
        const matchBankNum = u.bankAccount?.accountNumber?.includes(q);
        const matchBankName = u.bankAccount?.bankName?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchRef && !matchId && !matchBankNum && !matchBankName) {
          return false;
        }
      }

      // VIP filter
      if (userVipFilter !== 'all' && u.vipLevel !== userVipFilter) {
        return false;
      }

      // Status filter
      if (userStatusFilter === 'active' && u.isBanned) return false;
      if (userStatusFilter === 'banned' && !u.isBanned) return false;
      if (userStatusFilter === 'withdrawal_banned' && !u.withdrawalBanned) return false;
      if (userStatusFilter === 'investors' && (u.totalInvested || 0) <= 0) return false;
      if (userStatusFilter === 'funded' && (u.balance || 0) <= 0) return false;
      if (userStatusFilter === 'bank_bound' && !u.bankAccount?.accountNumber) return false;
      if (userStatusFilter === 'admins' && u.role !== 'admin') return false;

      return true;
    });

    // Sort users
    list = [...list].sort((a, b) => {
      switch (userSortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'balance_desc':
          return (b.balance || 0) - (a.balance || 0);
        case 'invested_desc':
          return (b.totalInvested || 0) - (a.totalInvested || 0);
        case 'earned_desc':
          return (b.totalEarned || 0) - (a.totalEarned || 0);
        case 'ref_desc':
          return (b.totalReferralBonus || 0) - (a.totalReferralBonus || 0);
        case 'vip_desc':
          return (b.vipLevel || 0) - (a.vipLevel || 0);
        case 'name_asc':
          return (a.fullName || '').localeCompare(b.fullName || '');
        default:
          return 0;
      }
    });

    return list;
  }, [usersList, userSearch, userVipFilter, userStatusFilter, userSortBy]);

  const totalUserPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / usersPerPage));
  const currentPageSafe = Math.min(userPage, totalUserPages);
  const paginatedUsers = filteredAndSortedUsers.slice((currentPageSafe - 1) * usersPerPage, currentPageSafe * usersPerPage);

  const totalFilteredBalance = filteredAndSortedUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalFilteredInvested = filteredAndSortedUsers.reduce((sum, u) => sum + (u.totalInvested || 0), 0);

  const handleExportUsersCSV = () => {
    const headers = [
      'User ID',
      'Full Name',
      'Phone',
      'Email',
      'Role',
      'VIP Level',
      'Balance (NGN)',
      'Total Invested (NGN)',
      'Total Earned (NGN)',
      'Referral Bonus (NGN)',
      'Total Withdrawn (NGN)',
      'Bank Name',
      'Account Number',
      'Account Name',
      'Referral Code',
      'Status',
      'Registered Date',
    ];
    const rows = filteredAndSortedUsers.map((u) => [
      u.id,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${u.phone}"`,
      `"${u.email}"`,
      u.role,
      u.vipLevel,
      u.balance,
      u.totalInvested,
      u.totalEarned,
      u.totalReferralBonus,
      u.totalWithdrawn,
      `"${u.bankAccount?.bankName || ''}"`,
      `"${u.bankAccount?.accountNumber || ''}"`,
      `"${(u.bankAccount?.accountName || '').replace(/"/g, '""')}"`,
      u.referralCode,
      u.isBanned ? 'Suspended/Banned' : 'Active',
      u.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `motorola_users_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = Boolean(userSearch || userVipFilter !== 'all' || userStatusFilter !== 'all' || userSortBy !== 'newest');

  const handleResetUserFilters = () => {
    setUserSearch('');
    setUserVipFilter('all');
    setUserStatusFilter('all');
    setUserSortBy('newest');
    setUserPage(1);
  };

  const filteredUsers = filteredAndSortedUsers;

  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesSearch =
      tx.userPhone.includes(historySearch) ||
      tx.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      (tx.proofReference && tx.proofReference.toLowerCase().includes(historySearch.toLowerCase())) ||
      (tx.adminNote && tx.adminNote.toLowerCase().includes(historySearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (historyFilter === 'all') return true;
    return tx.type === historyFilter;
  });

  return (
    <div className="space-y-5 pb-16 text-slate-900">
      {/* Top Admin Header Bar - Milky Diamond, Sky Blue & Warm Gold */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-950 via-blue-900 to-sky-900 text-white shadow-2xl border-2 border-amber-400/80 flex flex-wrap items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-400/30">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-amber-300">Super Admin Command Center</h2>
              <span className="bg-emerald-500 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                <ShieldCheck className="w-3 h-3" /> Permanent Storage Live
              </span>
            </div>
            <p className="text-xs text-sky-200">emmanuelchidalu67@gmail.com • Master Database Controller</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {/* Backup Database */}
          <button
            onClick={handleExportBackup}
            className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-amber-300"
            title="Download full JSON database backup"
          >
            <Download className="w-3.5 h-3.5" /> Backup DB (.json)
          </button>

          {/* Restore Database */}
          <label className="py-2 px-3.5 rounded-2xl bg-sky-800 hover:bg-sky-700 text-sky-100 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer border border-sky-600 transition-all active:scale-95">
            <Upload className="w-3.5 h-3.5 text-amber-300" /> Restore DB
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>

          {/* Refresh Data */}
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-2xl bg-sky-800 hover:bg-sky-700 text-amber-300 shadow transition-colors border border-sky-600 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold text-xs flex items-center gap-2 shadow animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-100 border border-red-300 text-red-900 font-extrabold text-xs flex items-center gap-2 shadow animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Admin Sub-Tabs Navigation Pills - Diamond & Gold Styled */}
      <div className="flex bg-white p-1.5 rounded-2xl border-2 border-sky-200 shadow-md overflow-x-auto gap-1">
        {(
          [
            { id: 'overview', label: 'Overview' },
            {
              id: 'deposits',
              label: `Deposits (${deposits.filter((d) => d.status === 'pending').length} pending)`,
            },
            {
              id: 'withdrawals',
              label: `Withdrawals (${withdrawals.filter((w) => w.status === 'pending').length} pending)`,
            },
            {
              id: 'vtu',
              label: `VTU Orders (${vtuOrders.filter((o) => o.status === 'pending').length} pending)`,
            },
            { id: 'users', label: `Users (${usersList.length})` },
            { id: 'history', label: `History & Logs (${allTransactions.length})` },
            { id: 'plans', label: `VIP Plans (${plans.length})` },
            { id: 'spins', label: 'Fortune Wheel' },
            { id: 'topup', label: `Top-Up Codes (${topUpCodes.length})` },
            { id: 'investments', label: `Investments (${allInvestments.length})` },
            { id: 'settings', label: 'Config & Bonuses' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`py-2 px-3.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white shadow-md border border-sky-400 scale-100'
                : 'text-slate-700 hover:text-sky-900 hover:bg-sky-50 font-bold'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SUB TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {tab === 'overview' && overview && (
        <div className="space-y-4">
          {/* Permanent Database Health & Durability Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-950 via-blue-950 to-slate-900 text-white shadow-xl border-2 border-sky-300/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-amber-300">100% Indestructible Multi-Tier Database Storage</h3>
              </div>
              <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                PERMANENT IMMUNITY
              </span>
            </div>

            <p className="text-xs text-sky-200 leading-relaxed">
              Every single user record, bank account, VIP plan, wheel spin result, deposit, withdrawal, and voucher code is preserved permanently in atomic persistent files with real-time backups. Even if users or administrators log out or leave the platform for 20 days or months, no information will ever be reset or removed without manual Super Admin action.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 text-center">
              <div className="p-2 rounded-2xl bg-sky-900/60 border border-sky-500/40">
                <p className="text-[9px] font-bold text-sky-200 uppercase">Total Users</p>
                <p className="text-base font-black text-amber-300">{usersList.length}</p>
              </div>
              <div className="p-2 rounded-2xl bg-sky-900/60 border border-sky-500/40">
                <p className="text-[9px] font-bold text-sky-200 uppercase">VIP Plans</p>
                <p className="text-base font-black text-amber-300">{plans.length}</p>
              </div>
              <div className="p-2 rounded-2xl bg-sky-900/60 border border-sky-500/40">
                <p className="text-[9px] font-bold text-sky-200 uppercase">Investments</p>
                <p className="text-base font-black text-amber-300">{allInvestments.length}</p>
              </div>
              <div className="p-2 rounded-2xl bg-sky-900/60 border border-sky-500/40">
                <p className="text-[9px] font-bold text-sky-200 uppercase">Deposits</p>
                <p className="text-base font-black text-amber-300">{deposits.length}</p>
              </div>
              <div className="p-2 rounded-2xl bg-sky-900/60 border border-sky-500/40">
                <p className="text-[9px] font-bold text-sky-200 uppercase">Withdrawals</p>
                <p className="text-base font-black text-amber-300">{withdrawals.length}</p>
              </div>
              <div className="p-2 rounded-2xl bg-sky-900/60 border border-sky-500/40">
                <p className="text-[9px] font-bold text-sky-200 uppercase">Voucher Codes</p>
                <p className="text-base font-black text-amber-300">{topUpCodes.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-white border-2 border-sky-100 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Registered Users</p>
              <p className="font-black text-2xl text-sky-950 mt-1">{overview.totalUsers}</p>
            </div>
            <div className="p-4 rounded-3xl bg-white border-2 border-sky-100 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Active VIP Contracts</p>
              <p className="font-black text-2xl text-sky-950 mt-1">{overview.activeInvestments}</p>
            </div>
            <div className="p-4 rounded-3xl bg-white border-2 border-sky-100 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Approved Deposits</p>
              <p className="font-black text-2xl text-emerald-600 mt-1">
                ₦{overview.totalDepositsApproved.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Approved Withdrawals</p>
              <p className="font-black text-2xl text-amber-600 mt-1">
                ₦{overview.totalWithdrawalsApproved.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setTab('deposits')}
              className="p-4 rounded-3xl bg-emerald-600 text-white font-black cursor-pointer hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-between"
            >
              <div>
                <p className="text-xs uppercase opacity-90">Deposit Approvals</p>
                <p className="text-2xl mt-1">{overview.pendingDepositsCount} Pending</p>
              </div>
              <ArrowDownLeft className="w-8 h-8 opacity-80" />
            </div>

            <div
              onClick={() => setTab('withdrawals')}
              className="p-4 rounded-3xl bg-purple-950 text-amber-300 font-black cursor-pointer hover:bg-purple-900 transition-colors shadow-md flex items-center justify-between border border-purple-800"
            >
              <div>
                <p className="text-xs uppercase text-purple-200">Withdrawal Approvals</p>
                <p className="text-2xl mt-1">{overview.pendingWithdrawalsCount} Pending</p>
              </div>
              <ArrowUpRight className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 2: DEPOSIT APPROVALS */}
      {/* ========================================================================= */}
      {tab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                Permanent Deposit Ledger ({deposits.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {deposits.filter((d) => d.status === 'pending').length} Pending Review • {deposits.filter((d) => d.status === 'approved').length} Permanently Credited
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => handleExportCsv('deposits')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Admin Confirmation Protocol:</strong> All user deposit requests require your explicit verification. Click <strong>Approve & Credit</strong> once you verify payment in your bank app.
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deposits by phone, ID, payment method, reference..."
                value={depositSearch}
                onChange={(e) => setDepositSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => setDepositFilter(filterOpt)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors shrink-0 ${
                    depositFilter === filterOpt
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterOpt === 'all' ? `All (${deposits.length})` : `${filterOpt} (${deposits.filter((d) => d.status === filterOpt).length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredDeposits.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No deposit records match the current filter.
              </div>
            ) : (
              filteredDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-purple-900">{dep.userPhone}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{dep.id}</p>
                    </div>

                    <span className="font-black text-base text-emerald-600">
                      ₦{dep.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sender / Reference:</span>
                      <span className="font-bold text-slate-800">{dep.proofReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Method:</span>
                      <span className="font-medium text-slate-700">{dep.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted Time:</span>
                      <span className="text-slate-600">{new Date(dep.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {dep.status === 'pending' ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleDepositAction(dep.id, 'approve')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Credit User
                      </button>
                      <button
                        onClick={() => handleDepositAction(dep.id, 'reject')}
                        className="py-2.5 px-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span
                          className={`font-black px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1 ${
                            dep.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          {dep.status === 'approved' ? (
                            <>
                              <Lock className="w-3 h-3 text-emerald-700" />
                              PERMANENTLY APPROVED & CREDITED
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-700" />
                              REJECTED
                            </>
                          )}
                        </span>
                        <span className="text-slate-500 text-[10px] font-medium">{dep.adminNote || 'System verified'}</span>
                      </div>
                      {dep.status === 'approved' && (
                        <p className="text-[10px] text-emerald-800/80 font-medium">
                          🔒 This deposit record is permanently sealed in the system ledger and cannot be deleted or reversed.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 3: WITHDRAWAL APPROVALS */}
      {/* ========================================================================= */}
      {tab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                Permanent Withdrawal Ledger ({withdrawals.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {withdrawals.filter((w) => w.status === 'pending').length} Pending Payout • {withdrawals.filter((w) => w.status === 'approved').length} Paid & Sealed
              </p>
            </div>

            <button
              onClick={() => handleExportCsv('withdrawals')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Export Withdrawals CSV
            </button>
          </div>

          {/* Permanent Withdrawal Ledger Notice */}
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-amber-950">
                Permanent Financial Payout Policy &amp; Non-Refundable Approved Withdrawals
              </p>
              <p className="font-normal text-[11px] leading-relaxed text-amber-900">
                All withdrawal history is stored permanently in system memory and files with a <strong>Zero-Deletion Guarantee</strong>. Once an administrator approves a withdrawal as paid to the user's bank account, <strong>the money cannot be refunded backward or reversed</strong>. The record becomes permanently locked and immutable.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search withdrawals by phone, ID, bank, account number, name..."
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => setWithdrawalFilter(filterOpt)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors shrink-0 ${
                    withdrawalFilter === filterOpt
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterOpt === 'all' ? `All (${withdrawals.length})` : `${filterOpt} (${withdrawals.filter((w) => w.status === filterOpt).length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No withdrawal records match the current filter.
              </div>
            ) : (
              filteredWithdrawals.map((wth) => (
                <div
                  key={wth.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-purple-900">{wth.userPhone}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{wth.id}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-base text-slate-900">
                        ₦{wth.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        Net Transfer: ₦{wth.netAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                    <p className="font-extrabold text-amber-950 text-sm">{wth.bankName}</p>
                    <p className="font-mono font-bold text-slate-900 text-base">{wth.accountNumber}</p>
                    <p className="font-semibold text-slate-700 uppercase">{wth.accountName}</p>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Submitted: {new Date(wth.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {wth.status === 'pending' ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleWithdrawalAction(wth.id, 'approve')}
                        className="flex-1 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-extrabold text-xs shadow flex items-center justify-center gap-1 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirm Paid to Bank
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(wth.id, 'reject')}
                        className="py-2.5 px-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition-all"
                      >
                        Reject & Refund
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span
                          className={`font-black px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1 ${
                            wth.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          {wth.status === 'approved' ? (
                            <>
                              <Lock className="w-3 h-3 text-emerald-700" />
                              APPROVED &amp; PAID TO BANK (IMMUTABLE)
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-700" />
                              REJECTED &amp; REFUNDED
                            </>
                          )}
                        </span>
                        <span className="text-slate-500 text-[10px] font-medium">{wth.adminNote || 'Processed'}</span>
                      </div>

                      {wth.status === 'approved' && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            <strong>Non-Refundable &amp; Permanent:</strong> This payout has been approved and cannot be refunded backward. Recorded permanently in financial system info.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB: VTU AIRTIME & DATA ORDERS (PENDING ADMIN APPROVAL) */}
      {/* ========================================================================= */}
      {tab === 'vtu' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950 text-white shadow-xl border-2 border-amber-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-md shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-sm sm:text-base text-amber-300">
                    VTU Airtime &amp; Data Orders
                  </h4>
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full shadow-xs">
                    {vtuOrders.filter((o) => o.status === 'pending').length} PENDING VERIFICATION
                  </span>
                </div>
                <p className="text-xs text-sky-200 mt-0.5 leading-relaxed">
                  Verify user bank transfer receipts (Session ID / Sender Name) and click <strong>Approve</strong> to deliver Airtime or Data directly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-sky-900/60 px-3 py-1.5 rounded-2xl border border-sky-400/30 text-sky-200 font-bold">
                Total Orders: {vtuOrders.length}
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={vtuSearch}
                  onChange={(e) => setVtuSearch(e.target.value)}
                  placeholder="Search by recipient phone, sender name, session ID, or network..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'airtime', label: 'Airtime' },
                  { id: 'data', label: 'Data Bundles' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setVtuTypeFilter(tf.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      vtuTypeFilter === tf.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All Status' },
                  { id: 'pending', label: 'Pending Only' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' },
                ].map((sf) => (
                  <button
                    key={sf.id}
                    onClick={() => setVtuStatusFilter(sf.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      vtuStatusFilter === sf.id
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {vtuOrders
              .filter((o) => {
                if (vtuTypeFilter === 'airtime' && o.type !== 'vtu_airtime') return false;
                if (vtuTypeFilter === 'data' && o.type !== 'vtu_data') return false;
                if (vtuStatusFilter !== 'all' && o.status !== vtuStatusFilter) return false;
                if (vtuSearch) {
                  const q = vtuSearch.toLowerCase();
                  const matchPhone = o.vtuPhone?.includes(q) || o.userPhone?.includes(q);
                  const matchSender = o.senderAccountName?.toLowerCase().includes(q) || o.senderBankName?.toLowerCase().includes(q);
                  const matchRef = o.proofReference?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
                  const matchNet = o.vtuNetwork?.toLowerCase().includes(q);
                  if (!matchPhone && !matchSender && !matchRef && !matchNet) return false;
                }
                return true;
              })
              .map((order) => {
                const isAirtime = order.type === 'vtu_airtime';
                const net = order.vtuNetwork || 'MTN';
                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-sky-300 shadow-sm transition-all space-y-3"
                  >
                    {/* Top Row: Badges & Status */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xs px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                            net === 'MTN'
                              ? 'bg-amber-400 text-slate-950'
                              : net === 'Airtel'
                              ? 'bg-rose-600 text-white'
                              : net === 'Glo'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-teal-700 text-white'
                          }`}
                        >
                          {net}
                        </span>

                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                            isAirtime ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}
                        >
                          {isAirtime ? '📱 Airtime Recharge' : '🌐 Data Bundle'}
                        </span>

                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          ID: {order.id}
                        </span>
                      </div>

                      <div>
                        {order.status === 'pending' && (
                          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1 shadow-xs">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> Pending Admin Approval
                          </span>
                        )}
                        {order.status === 'approved' && (
                          <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved &amp; Delivered
                          </span>
                        )}
                        {order.status === 'rejected' && (
                          <span className="bg-rose-100 text-rose-900 text-xs font-black px-3 py-1 rounded-full border border-rose-300 flex items-center gap-1 shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Key Order Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Recipient Phone
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-base font-black text-slate-900">
                            {order.vtuPhone || order.userPhone}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(order.vtuPhone || order.userPhone, `phone_${order.id}`)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                            title="Copy Phone Number"
                          >
                            {copiedKey === `phone_${order.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Package / Plan
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 mt-0.5 block truncate">
                          {order.vtuPlan || (isAirtime ? `₦${order.amount} Airtime` : `${net} Data Bundle`)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Transfer Amount Paid
                        </span>
                        <span className="font-mono text-base font-black text-amber-700 mt-0.5 block">
                          ₦{order.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Proof / Bank Transfer Verification Box */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sky-950 flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-sky-600" />
                          Bank Transfer Proof Verification (Transfer Only)
                        </span>
                        <span className="text-[10.5px] text-slate-500 font-bold">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded-xl border border-sky-100">
                          <span className="text-[10px] font-bold text-slate-400 block">Sender Bank</span>
                          <span className="font-black text-slate-900 truncate block">
                            {order.senderBankName || 'Bank Transfer'}
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-sky-100">
                          <span className="text-[10px] font-bold text-slate-400 block">Sender Account Name</span>
                          <span className="font-black text-slate-900 truncate block">
                            {order.senderAccountName || 'Depositor'}
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-sky-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Session ID / Reference</span>
                            <span className="font-mono font-black text-slate-900 truncate max-w-[140px] block">
                              {order.proofReference || 'N/A'}
                            </span>
                          </div>
                          {order.proofReference && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(order.proofReference || '', `ref_${order.id}`)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-sky-700 cursor-pointer"
                              title="Copy Session ID"
                            >
                              {copiedKey === `ref_${order.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {order.adminNote && (
                        <p className="text-[11px] font-semibold text-slate-600 italic">
                          Note: {order.adminNote}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons for Pending Orders */}
                    {order.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleVtuAction(order.id, 'reject')}
                          className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 cursor-pointer active:scale-95 transition-all"
                        >
                          Reject Order
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVtuAction(order.id, 'approve')}
                          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-200 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Mark Delivered</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {vtuOrders.length === 0 && (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
                <Radio className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-black text-base text-slate-700">No VTU Recharge Orders Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When users submit airtime or data orders via direct bank transfer, they will appear here pending your approval.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 4: USERS MANAGEMENT */}
      {/* ========================================================================= */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Permanent Registry Guarantee Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-sm sm:text-base text-emerald-200">
                    Permanent User Registry • {usersList.length} Registered Accounts
                  </h4>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2.5 py-0.5 rounded-full">
                    IMMUTABLE STORAGE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  All registered accounts are permanently secured in multi-tiered storage. User accounts and login credentials remain permanently valid with zero deletion even during extended admin inactivity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleExportUsersCSV}
                className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
                title="Export Filtered User List as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV ({filteredAndSortedUsers.length})</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Quick Filter Toggles */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Search by name, phone (0814...), email, referral code (MOTO...), bank account, or user ID..."
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
                {userSearch && (
                  <button
                    onClick={() => {
                      setUserSearch('');
                      setUserPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={userSortBy}
                    onChange={(e: any) => {
                      setUserSortBy(e.target.value);
                      setUserPage(1);
                    }}
                    className="w-full pl-8 pr-7 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-600 appearance-none cursor-pointer"
                  >
                    <option value="newest">Sort: Newest Registered</option>
                    <option value="oldest">Sort: Oldest Registered</option>
                    <option value="balance_desc">Sort: Highest Balance</option>
                    <option value="invested_desc">Sort: Highest Invested</option>
                    <option value="earned_desc">Sort: Highest Earned</option>
                    <option value="ref_desc">Sort: Highest Ref Bonus</option>
                    <option value="vip_desc">Sort: VIP Tier (High-Low)</option>
                    <option value="name_asc">Sort: Name (A-Z)</option>
                  </select>
                </div>

                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showAdvancedFilters || userVipFilter !== 'all' || userStatusFilter !== 'all'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {(userVipFilter !== 'all' || userStatusFilter !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Pills / Advanced Controls */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {/* Status Filter Chips */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Account Status Filter:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All Accounts' },
                      { id: 'active', label: 'Active Only' },
                      { id: 'investors', label: 'VIP Investors (>₦0)' },
                      { id: 'funded', label: 'Funded Balance (>₦0)' },
                      { id: 'bank_bound', label: 'Bank Account Set' },
                      { id: 'withdrawal_banned', label: '🚫 Withdrawal Restricted' },
                      { id: 'admins', label: 'Admins' },
                      { id: 'banned', label: 'Suspended/Banned' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setUserStatusFilter(st.id as any);
                          setUserPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          userStatusFilter === st.id
                            ? 'bg-purple-900 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* VIP Level Filter Chips */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">VIP Tier Level:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setUserVipFilter('all');
                        setUserPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userVipFilter === 'all'
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      All VIP Levels
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setUserVipFilter(lvl);
                          setUserPage(1);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          userVipFilter === lvl
                            ? 'bg-amber-500 text-purple-950 font-black shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        VIP {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Per Page */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Show per page:</span>
                    {[10, 20, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setUsersPerPage(size);
                          setUserPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          usersPerPage === size
                            ? 'bg-purple-100 text-purple-950 border border-purple-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={handleResetUserFilters}
                      className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Results Summary Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-slate-700">
                  Showing <strong className="text-purple-900">{filteredAndSortedUsers.length}</strong> of{' '}
                  <strong className="text-slate-900">{usersList.length}</strong> users
                </span>
                <span>•</span>
                <span>
                  Total Filtered Balances:{' '}
                  <strong className="text-emerald-600 font-extrabold">₦{totalFilteredBalance.toLocaleString()}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Filtered Invested:{' '}
                  <strong className="text-purple-900 font-extrabold">₦{totalFilteredInvested.toLocaleString()}</strong>
                </span>
              </div>

              {hasActiveFilters && !showAdvancedFilters && (
                <button
                  onClick={handleResetUserFilters}
                  className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* User List Cards */}
          <div className="space-y-3">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">No user accounts found matching your search</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your search terms, clearing status filters, or resetting the filter controls.
                </p>
                <button
                  onClick={handleResetUserFilters}
                  className="px-4 py-2 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold hover:bg-purple-200 transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              paginatedUsers.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 sm:p-5 rounded-3xl bg-white border transition-all shadow-sm space-y-3.5 ${
                    u.isBanned ? 'border-red-200 bg-red-50/20' : 'border-slate-200 hover:border-purple-200'
                  }`}
                >
                  {/* User Top Identity Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm sm:text-base text-slate-900">{u.fullName}</h4>
                        {u.role === 'admin' ? (
                          <span className="bg-amber-400 text-purple-950 font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Crown className="w-2.5 h-2.5" /> SUPER ADMIN
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-900 font-bold text-[9px] px-2.5 py-0.5 rounded-full">
                            MEMBER
                          </span>
                        )}
                        <span className="bg-amber-500/15 text-amber-900 font-black text-[9px] px-2 py-0.5 rounded-full border border-amber-400/30">
                          VIP {u.vipLevel}
                        </span>
                        {u.withdrawalBanned && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" /> WITHDRAWAL RESTRICTED
                          </span>
                        )}
                        {u.isBanned ? (
                          <span className="bg-red-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Ban className="w-2.5 h-2.5" /> SUSPENDED / BANNED
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Contact & Identifiers with One-Click Copy */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {u.phone}
                          <button
                            onClick={() => handleCopyText(u.phone, `phone_${u.id}`)}
                            className="p-1 rounded text-slate-400 hover:text-purple-700 transition-colors"
                            title="Copy Phone Number"
                          >
                            {copiedKey === `phone_${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {u.email}
                          <button
                            onClick={() => handleCopyText(u.email, `email_${u.id}`)}
                            className="p-1 rounded text-slate-400 hover:text-purple-700 transition-colors"
                            title="Copy Email"
                          >
                            {copiedKey === `email_${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="flex items-center gap-1">
                          Ref: <strong className="text-purple-900 font-mono">{u.referralCode}</strong>
                          <button
                            onClick={() => handleCopyText(u.referralCode, `ref_${u.id}`)}
                            className="p-1 rounded text-slate-400 hover:text-purple-700 transition-colors"
                            title="Copy Referral Code"
                          >
                            {copiedKey === `ref_${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>ID: <code className="text-slate-500 font-mono">{u.id}</code></span>
                        <span>•</span>
                        <span>Registered: {new Date(u.createdAt).toLocaleDateString()} at {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          🔒 Permanently Retained
                        </span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-center">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditBalanceInput(u.balance.toString());
                          setEditInvestedInput((u.totalInvested || 0).toString());
                          setEditEarnedInput((u.totalEarned || 0).toString());
                          setEditVipInput(u.vipLevel);
                          setEditRoleInput(u.role);
                          setEditSpinsInput(u.spinsAvailable || 0);
                          setEditIsBanned(Boolean(u.isBanned));
                          setEditWithdrawalBanned(Boolean(u.withdrawalBanned));
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Edit User Balance, Invested Capital, VIP Level, or Role"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit User</span>
                      </button>

                      {u.email.toLowerCase() !== 'emmanuelchidalu67@gmail.com' && (
                        <>
                          <button
                            onClick={() => handleToggleWithdrawalBan(u)}
                            className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                              u.withdrawalBanned
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                            title={
                              u.withdrawalBanned
                                ? 'Unlock withdrawals for this user'
                                : 'Ban user from withdrawing (Prompts them to refer friends to unlock)'
                            }
                          >
                            {u.withdrawalBanned ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Unlock Withdrawal</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Ban Withdrawal</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleToggleSuspendUser(u)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                              u.isBanned
                                ? 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                            title={u.isBanned ? 'Lift suspension and activate account' : 'Temporarily suspend account without deleting records'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{u.isBanned ? 'Lift Suspension' : 'Suspend Account'}</span>
                          </button>

                          <button
                            onClick={() => handlePermanentDeleteUser(u)}
                            className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-rose-600 hover:bg-rose-700 text-white border border-rose-700"
                            title="Permanently remove user, wallet balance, investments, and transactions from the platform"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Permanently</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Wallet Balance</p>
                      <p className="font-black text-emerald-600 text-sm">₦{u.balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">VIP Tier</p>
                      <p className="font-bold text-purple-950 text-sm">VIP {u.vipLevel}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Total Invested</p>
                      <p className="font-extrabold text-slate-800 text-sm">₦{u.totalInvested.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Total Earned</p>
                      <p className="font-extrabold text-indigo-700 text-sm">₦{u.totalEarned.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Ref Commissions</p>
                      <p className="font-extrabold text-amber-700 text-sm">₦{u.totalReferralBonus.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Fortune Spins</p>
                      <p className="font-extrabold text-purple-700 text-sm">{u.spinsAvailable || 0} Turns</p>
                    </div>
                  </div>

                  {/* User's Active Investments Section on User Card */}
                  {(() => {
                    const userInvs = allInvestments.filter((inv) => inv.userId === u.id);
                    if (userInvs.length === 0) return null;

                    return (
                      <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-900" />
                            <span>Active Investments ({userInvs.length})</span>
                          </span>
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-100/90 px-2 py-0.5 rounded-full">
                            Total Capital: ₦{userInvs.reduce((sum, i) => sum + (i.capital || 0), 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {userInvs.map((inv) => (
                            <div
                              key={inv.id}
                              className="p-2.5 rounded-xl bg-white border border-purple-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-purple-950 text-xs">{inv.planName}</span>
                                  <span className="text-[9px] bg-purple-100 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                                    VIP {inv.planLevel}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      inv.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {inv.status === 'active' ? '● ACTIVE 30D' : '✓ COMPLETED'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-slate-600 font-medium">
                                  <span>Capital: <strong className="text-slate-900">₦{inv.capital.toLocaleString()}</strong></span>
                                  <span>Yield: <strong className="text-emerald-600">+₦{inv.dailyEarning.toLocaleString()}/24h</strong></span>
                                  <span>Timeline: <strong>Day {inv.daysCompleted}/{inv.durationDays || 30}</strong></span>
                                  <span>Earned: <strong className="text-indigo-700">₦{inv.totalEarnedSoFar.toLocaleString()}</strong></span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setInvestmentToDelete(inv);
                                  setDeleteRefundCapital(false);
                                }}
                                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 self-start sm:self-center"
                                title="Permanently delete this active investment product"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete Investment</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bound Bank Account Display */}
                  {u.bankAccount?.accountNumber ? (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-200/60 text-purple-900">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-black text-purple-950">{u.bankAccount.bankName}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="font-mono font-bold text-slate-800">{u.bankAccount.accountNumber}</span>
                          <button
                            onClick={() => handleCopyText(u.bankAccount?.accountNumber || '', `acct_${u.id}`)}
                            className="p-1 text-slate-400 hover:text-purple-700 transition-colors inline-flex"
                            title="Copy Account Number"
                          >
                            {copiedKey === `acct_${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] self-start sm:self-auto bg-white/80 px-2.5 py-1 rounded-xl border border-purple-100">
                        {u.bankAccount.accountName}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>No bank account bound yet</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalUserPages > 1 && (
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-600 font-semibold">
                Page <strong className="text-purple-900">{currentPageSafe}</strong> of{' '}
                <strong className="text-slate-900">{totalUserPages}</strong> (
                {filteredAndSortedUsers.length} total filtered results)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={currentPageSafe <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                {/* Page Number Chips */}
                {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalUserPages > 5 && currentPageSafe > 3) {
                    pageNum = currentPageSafe - 2 + i;
                    if (pageNum > totalUserPages) pageNum = totalUserPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setUserPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPageSafe === pageNum
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  disabled={currentPageSafe >= totalUserPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-all cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Edit User Modal (Compact Small Window) */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl border border-slate-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 leading-tight">Edit User Account</h3>
                    <p className="text-[11px] text-purple-900 font-bold mt-0.5">
                      {editingUser.fullName} • <span className="font-mono text-slate-600">{editingUser.phone}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 2-Column Compact Input Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Wallet Balance (₦)</label>
                    <input
                      type="number"
                      value={editBalanceInput}
                      onChange={(e) => setEditBalanceInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Invested Capital (₦)</label>
                    <input
                      type="number"
                      value={editInvestedInput}
                      onChange={(e) => setEditInvestedInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-xs text-purple-950 outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Earned (₦)</label>
                    <input
                      type="number"
                      value={editEarnedInput}
                      onChange={(e) => setEditEarnedInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-xs text-indigo-700 outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Available Spins</label>
                    <input
                      type="number"
                      min={0}
                      value={editSpinsInput}
                      onChange={(e) => setEditSpinsInput(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-xs text-amber-600 outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">VIP Level (1-20)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editVipInput}
                      onChange={(e) => setEditVipInput(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Role</label>
                    <select
                      value={editRoleInput}
                      onChange={(e) => setEditRoleInput(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-xs outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 focus:bg-white"
                    >
                      <option value="user">Standard User</option>
                      <option value="admin">Platform Admin</option>
                    </select>
                  </div>
                </div>

                {/* Status Restriction Toggles */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 border border-rose-200">
                    <input
                      type="checkbox"
                      id="withdrawalBanCheck"
                      checked={editWithdrawalBanned}
                      onChange={(e) => setEditWithdrawalBanned(e.target.checked)}
                      className="w-3.5 h-3.5 accent-rose-600 rounded"
                    />
                    <label htmlFor="withdrawalBanCheck" className="text-[11px] font-bold text-rose-900 cursor-pointer select-none leading-tight">
                      Restrict Withdrawal (prompts user to refer friends to unlock)
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200">
                    <input
                      type="checkbox"
                      id="banCheck"
                      checked={editIsBanned}
                      onChange={(e) => setEditIsBanned(e.target.checked)}
                      className="w-3.5 h-3.5 accent-red-600 rounded"
                    />
                    <label htmlFor="banCheck" className="text-[11px] font-bold text-amber-950 cursor-pointer select-none leading-tight">
                      Suspend User Account (blocks login access)
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUserEdit}
                    className="w-1/2 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 5: GLOBAL HISTORY & TRANSACTION AUDIT LOG */}
      {/* ========================================================================= */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-900" />
                Permanent Financial Activity &amp; Audit Log ({allTransactions.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                System ledger • Fully immutable financial history with Zero-Deletion
              </p>
            </div>

            <button
              onClick={() => handleExportCsv('transactions')}
              className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full Ledger CSV
            </button>
          </div>

          {/* Immutability Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 border border-slate-700 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] leading-relaxed text-slate-300">
              <strong>System Core Ledger:</strong> All deposits, approved withdrawals, daily investment dividends, referral earnings, and spin wins are permanently etched into disk files (<code className="text-emerald-300 font-mono">db.json</code>, <code className="text-emerald-300 font-mono">persistedTransactions.json</code>) and client storage. No record can be purged or deleted.
            </p>
          </div>

          {/* Search and Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search transactions by user phone, ID, reference..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {(
                [
                  { id: 'all', label: 'All Logs' },
                  { id: 'deposit', label: 'Deposits' },
                  { id: 'withdrawal', label: 'Withdrawals' },
                  { id: 'investment', label: 'Investments' },
                  { id: 'daily_earning', label: 'Daily Earnings' },
                  { id: 'referral_bonus', label: 'Referral Bonuses' },
                  { id: 'welcome_bonus', label: 'Welcome Bonuses' },
                  { id: 'spin_win', label: 'Spin Wins' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    historyFilter === f.id
                      ? 'bg-purple-900 text-amber-300 shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                No transaction records match the selected filter.
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-purple-950">{tx.userPhone}</span>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          tx.type === 'deposit' || tx.type === 'welcome_bonus' || tx.type === 'spin_win'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'withdrawal'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-900'
                        }`}
                      >
                        {tx.type.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          tx.status === 'approved'
                            ? 'text-emerald-700'
                            : tx.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        • {tx.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">{tx.adminNote || 'Platform transaction record'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm font-mono ${
                        tx.type === 'withdrawal' || tx.type === 'investment'
                          ? 'text-slate-800'
                          : 'text-emerald-600'
                      }`}
                    >
                      {tx.type === 'withdrawal' || tx.type === 'investment' ? '-' : '+'}₦{tx.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 6: VIP PLANS MANAGEMENT */}
      {/* ========================================================================= */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-800" />
              VIP Investment Packages Editor (VIP 1 - VIP {plans.length})
            </h3>
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add VIP Plan
            </button>
          </div>

          <div className="space-y-3">
            {plans.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-purple-950">{p.name} (VIP {p.level})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-emerald-600">
                      Total Return: ₦{(p.dailyEarning * p.durationDays).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                      title="Remove Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Capital (₦)</label>
                    <input
                      type="number"
                      value={p.capital}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const copy = [...plans];
                        copy[idx].capital = val;
                        copy[idx].totalInvestment = val + copy[idx].dailyEarning * copy[idx].durationDays;
                        setPlans(copy);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Daily Return (₦)</label>
                    <input
                      type="number"
                      value={p.dailyEarning}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const copy = [...plans];
                        copy[idx].dailyEarning = val;
                        copy[idx].totalInvestment = copy[idx].capital + val * copy[idx].durationDays;
                        setPlans(copy);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Duration (Days)</label>
                    <input
                      type="number"
                      value={p.durationDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const copy = [...plans];
                        copy[idx].durationDays = val;
                        copy[idx].totalInvestment = copy[idx].capital + copy[idx].dailyEarning * val;
                        setPlans(copy);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSavePlan(p)}
                  className="w-full py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save VIP {p.level} Settings
                </button>
              </div>
            ))}
          </div>

          {/* Add VIP Plan Modal */}
          {showAddPlanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <form
                onSubmit={handleCreateNewPlan}
                className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-sm text-slate-900">Create New VIP Investment Plan</h3>
                  <button type="button" onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">VIP Level</label>
                  <input
                    type="number"
                    min={1}
                    value={newPlanLevel}
                    onChange={(e) => setNewPlanLevel(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Yamaha Diamond Pro"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Required Capital (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={newPlanCapital}
                    onChange={(e) => setNewPlanCapital(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daily Return (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 35000"
                    value={newPlanDaily}
                    onChange={(e) => setNewPlanDaily(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={newPlanDays}
                    onChange={(e) => setNewPlanDays(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddPlanModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs shadow"
                  >
                    Create Plan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 7: FORTUNE WHEEL CONTROL & RIG MASTER */}
      {/* ========================================================================= */}
      {tab === 'spins' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="bg-amber-400 text-purple-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Master Override
                </span>
                <h3 className="text-base font-black mt-1 text-amber-300">
                  Yamaha Fortune Wheel Settings & Rig Control
                </h3>
                <p className="text-xs text-purple-200">
                  Configure slice values, weights, or force guaranteed winning slice outcomes.
                </p>
              </div>
            </div>

            {/* Forced Outcome Override */}
            {settingsForm && (
              <div className="p-3.5 rounded-2xl bg-purple-950/80 border border-amber-400/40 space-y-2">
                <label className="block text-xs font-black text-amber-300">
                  🎯 Guaranteed Spin Outcome (Rig Control)
                </label>
                <select
                  value={settingsForm.adminForcedSpinRewardId || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      adminForcedSpinRewardId: e.target.value || undefined,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-purple-900 border border-purple-700 text-white font-bold text-xs outline-none"
                >
                  <option value="">🎲 Normal Random Mode (Use Weighted Probabilities)</option>
                  {spinRewards.map((r) => (
                    <option key={r.id} value={r.id}>
                      🔒 Force Next Win: {r.label} ({r.amount > 0 ? `₦${r.amount.toLocaleString()}` : 'Try Again'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-purple-300">
                  * If forced win is set, ALL user wheel spins will land on that slice regardless of probability!
                </p>
              </div>
            )}

            <button
              onClick={handleSaveSpins}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-purple-950 font-black text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Wheel Configuration
            </button>
          </div>

          {/* Slice Customization Grid */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-900" /> Wheel Slices ({spinRewards.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {spinRewards.map((slice, idx) => (
                <div
                  key={slice.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                        style={{ backgroundColor: slice.color }}
                      ></span>
                      <span className="font-black text-xs text-purple-900">Slice #{idx + 1}</span>
                    </div>
                    {slice.amount === 200 || slice.id === '1' ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-2 py-0.5 rounded-md">
                        🔒 SYSTEM CORE INFO (₦200 FIXED)
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Slice Label</label>
                      <input
                        type="text"
                        value={slice.label}
                        onChange={(e) => {
                          const copy = [...spinRewards];
                          copy[idx].label = e.target.value;
                          setSpinRewards(copy);
                        }}
                        className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Cash Win (₦)</label>
                      <input
                        type="number"
                        value={slice.amount}
                        onChange={(e) => {
                          const copy = [...spinRewards];
                          copy[idx].amount = Number(e.target.value);
                          setSpinRewards(copy);
                        }}
                        className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Probability Weight (0.0 to 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={slice.probability}
                      onChange={(e) => {
                        const copy = [...spinRewards];
                        copy[idx].probability = Number(e.target.value);
                        setSpinRewards(copy);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 8: TOP-UP VOUCHER CODES */}
      {/* ========================================================================= */}
      {tab === 'topup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              Free Top-Up Voucher Codes Manager
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{topUpCodes.length} Codes Active</span>
          </div>

          {/* Form to create top-up code */}
          <form onSubmit={handleCreateTopUpCode} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-xs text-purple-950 uppercase tracking-wider">Generate New Top-Up Voucher Code</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Voucher Code Name</label>
                <input
                  type="text"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                  placeholder="e.g. FREE5000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-purple-950 uppercase outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Top-Up Amount (₦)</label>
                <input
                  type="number"
                  value={newCodeAmount}
                  onChange={(e) => setNewCodeAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Max Redemptions Limit</label>
                <input
                  type="number"
                  value={newCodeMax}
                  onChange={(e) => setNewCodeMax(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Voucher Top-Up Code
            </button>
          </form>

          {/* List of active top up codes */}
          <div className="space-y-2.5">
            {topUpCodes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold bg-white rounded-3xl border border-slate-200">
                No top-up codes created yet. Use the form above to generate one!
              </div>
            ) : (
              topUpCodes.map((codeItem) => (
                <div
                  key={codeItem.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-purple-950 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200">
                        {codeItem.code}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        +₦{codeItem.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>Redeemed: <strong>{codeItem.timesRedeemed} / {codeItem.maxRedemptions}</strong> users</span>
                      <span>•</span>
                      <span>Created: {new Date(codeItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTopUpCode(codeItem.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Code"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 9: GLOBAL INVESTMENTS (30-DAY PERMANENT SYSTEM GUARANTEE) */}
      {/* ========================================================================= */}
      {tab === 'investments' && (() => {
        const filteredInvestments = allInvestments.filter((inv) => {
          if (investmentStatusFilter !== 'all' && inv.status !== investmentStatusFilter) return false;
          if (investmentSearch.trim()) {
            const q = investmentSearch.toLowerCase();
            const matchPhone = (inv.userPhone || '').toLowerCase().includes(q);
            const matchName = (inv.planName || '').toLowerCase().includes(q);
            const matchId = (inv.id || '').toLowerCase().includes(q);
            const matchUserId = (inv.userId || '').toLowerCase().includes(q);
            return matchPhone || matchName || matchId || matchUserId;
          }
          return true;
        });

        const activeCount = allInvestments.filter((i) => i.status === 'active').length;
        const completedCount = allInvestments.filter((i) => i.status === 'completed').length;
        const totalCapital = allInvestments.reduce((sum, i) => sum + i.capital, 0);
        const totalYield = allInvestments.reduce((sum, i) => sum + i.totalEarnedSoFar, 0);

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-900" />
                  Permanent 30-Day Investment Contracts ({allInvestments.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Autonomous 24-Hour Yield Engine • 30-Day Permanent Contract Lifetime
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleTriggerSettlementEngine}
                  disabled={settlingInvestments}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer"
                  title="Recalculate and catch up all 24h dividends across active user investments"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${settlingInvestments ? 'animate-spin' : ''}`} />
                  <span>{settlingInvestments ? 'Settling Dividends...' : 'Run Settlement Engine'}</span>
                </button>

                <button
                  onClick={() => handleExportCsv('investments')}
                  className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Strict 30-Day Permanent Contract System Policy Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border-2 border-amber-400 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Permanent 30-Day Contract &amp; Zero-Deletion System Policy</span>
                </div>
                <span className="bg-amber-400 text-purple-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Permanent • Auto Catch-Up
                </span>
              </div>
              <p className="text-xs text-purple-200 leading-relaxed">
                Every investment purchased is permanently registered in the financial database. Even if the administrator is offline or inactive for <strong>20 days, 30 days, or longer</strong>, the automated background engine calculates exact elapsed days and credits daily dividends without losing any progress or record. <strong>Investments are never purged or deleted.</strong>
              </p>
            </div>

            {/* Investment Portfolio Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Contracts</p>
                <p className="font-black text-xl text-purple-900 mt-1">{activeCount}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Completed (30 Days)</p>
                <p className="font-black text-xl text-emerald-600 mt-1">{completedCount}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Capital Invested</p>
                <p className="font-black text-xl text-indigo-900 mt-1">₦{totalCapital.toLocaleString()}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Yield Credited</p>
                <p className="font-black text-xl text-amber-600 mt-1">₦{totalYield.toLocaleString()}</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={investmentSearch}
                    onChange={(e) => setInvestmentSearch(e.target.value)}
                    placeholder="Search by phone, plan name, or user ID..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  {investmentSearch && (
                    <button
                      onClick={() => setInvestmentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  {(['all', 'active', 'completed'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setInvestmentStatusFilter(filterOpt)}
                      className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                        investmentStatusFilter === filterOpt
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {filterOpt === 'all' ? `All (${allInvestments.length})` : filterOpt === 'active' ? `Active (${activeCount})` : `Completed (${completedCount})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Investments List */}
            <div className="space-y-3">
              {filteredInvestments.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800">
                    {allInvestments.length === 0 ? 'No user investments in system' : 'No investments match your search criteria'}
                  </p>
                  <p className="text-slate-400">All purchased user investments remain stored here permanently for life.</p>
                </div>
              ) : (
                filteredInvestments.map((inv) => {
                  const duration = inv.durationDays || 30;
                  const progressPct = Math.min(100, Math.round((inv.daysCompleted / duration) * 100));
                  const nextPayoutDate = new Date(inv.nextSettlementTimestamp);
                  const purchaseDate = new Date(inv.purchasedAt);

                  return (
                    <div key={inv.id} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 font-black text-xs flex items-center justify-center shadow">
                            V{inv.planLevel}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-purple-950">{inv.planName}</span>
                              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                {inv.userPhone}
                              </span>
                              <span className="bg-purple-100 text-purple-900 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 30D Permanent
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              ID: <code className="font-mono text-slate-500">{inv.id}</code> • Purchased: {purchaseDate.toLocaleDateString()} at {purchaseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Next 24h Payout: {nextPayoutDate.toLocaleDateString()} at {nextPayoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                            inv.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {inv.status === 'active' ? '● Active 30-Day Contract' : '✓ Completed (30/30 Days)'}
                        </span>
                      </div>

                      {/* Progress Bar for 30-Day Term */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>30-Day Progress: <strong>Day {inv.daysCompleted} of {duration}</strong></span>
                          <span className="text-purple-900">{progressPct}% Completed</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-700 to-emerald-500 transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Capital Invested</p>
                          <p className="font-extrabold text-slate-900">₦{inv.capital.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Daily Return (24h)</p>
                          <p className="font-extrabold text-emerald-600">+₦{inv.dailyEarning.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Total Earned So Far</p>
                          <p className="font-extrabold text-indigo-700">₦{inv.totalEarnedSoFar.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Total 30-Day Yield</p>
                          <p className="font-extrabold text-purple-900">₦{inv.totalInvestment.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Admin Controls: Delete Investment Permanently */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          <span>Admin Contract Management</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setInvestmentToDelete(inv);
                            setDeleteRefundCapital(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Permanently remove this investment product from database"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Investment Permanently</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* SUB TAB 10: ADMIN SETTINGS, BONUSES & BANK ACCOUNTS */}
      {/* ========================================================================= */}
      {tab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-xs">Permanent Storage Active</h4>
                <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                  Your deposit bank account, WhatsApp links, Telegram group, and bonuses are written permanently to disk (<code className="bg-emerald-100 px-1 rounded font-mono">db.json</code> &amp; <code className="bg-emerald-100 px-1 rounded font-mono">admin_settings.json</code>). They remain stored permanently without deletion even if the admin is inactive.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold shrink-0 flex items-center gap-1"
              title="Reload from disk"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </button>
          </div>

          {/* Permanent Protected Core Bank Account & Official Telegram Community Info */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white border-2 border-amber-400 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-sm text-amber-300">Permanent System Core Information (Protected)</h4>
              </div>
              <span className="bg-amber-400 text-purple-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                System Core • Immutable
              </span>
            </div>
            
            <p className="text-xs text-purple-200 leading-relaxed">
              This deposit account and official Telegram community group are permanently recorded in the platform's core infrastructure. They remain active and immutable across all sessions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Core Deposit Bank</p>
                <p className="text-sm font-black text-white">KOLOMONI</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Deposit Account Number</p>
                <p className="text-base font-mono font-black text-amber-300">1100088701</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1 sm:col-span-2">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Deposit Account Name</p>
                <p className="text-xs font-black text-white uppercase">YAMAHA INVESTMENT EARNINGS INCOME OR EMEKA EMMANUEL CHIMDALU</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1 sm:col-span-2">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Permanent Referral Base Domain</p>
                <p className="text-xs font-mono font-bold text-amber-300">
                  https://yamaha-investment-earnings.ai.studio/?ref=&#123;CODE&#125;
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1 sm:col-span-2">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Official Telegram Community Group</p>
                <a
                  href="https://t.me/yamahainvestmentearnings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono font-bold text-cyan-300 hover:underline flex items-center gap-1 break-all"
                >
                  https://t.me/yamahainvestmentearnings
                </a>
              </div>
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Fortune Spin Fixed Reward</p>
                <p className="text-xs font-black text-emerald-300">₦200 Fixed Forced Outcome (System Cap)</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-900/60 border border-purple-700/80 space-y-1">
                <p className="text-[10px] uppercase font-extrabold text-amber-400">Daily Bonus Eligibility</p>
                <p className="text-xs font-black text-amber-300">Active VIP Investment Required for All</p>
              </div>
            </div>
          </div>

          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-800" />
            Platform Customization &amp; System Bonuses
          </h3>

          {/* Custom Admin Broadcast Announcement Message */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-600" />
                Platform Announcement Banner Message
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.announcementEnabled ?? true}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-900"></div>
                <span className="ml-2 text-[10px] font-bold text-amber-900">
                  {settingsForm.announcementEnabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>
            <textarea
              rows={3}
              value={settingsForm.announcementMessage || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, announcementMessage: e.target.value })}
              placeholder="Enter custom announcement message to display at the top of the app for all users..."
              className="w-full p-2.5 rounded-xl border border-amber-300/80 bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-amber-800 font-medium">
              This message will be recorded permanently in the backend database and displayed live to all visitors and registered users.
            </p>
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setSettingsForm({
                    ...settingsForm,
                    announcementMessage:
                      '📢 NEW UPDATE: Cheap Airtime & Data VTU Hub is now LIVE! Buy cheap data bundles (500MB, 1GB, 2GB, 5GB, 10GB, 20GB) and discounted airtime across MTN, Airtel, Glo & 9mobile directly with your wallet balance with instant delivery!',
                    announcementEnabled: true,
                  })
                }
                className="py-1 px-3 rounded-lg bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-[10px] shadow-xs cursor-pointer active:scale-95"
              >
                Set Cheap Airtime &amp; Data Announcement Template
              </button>
            </div>
          </div>

          {/* Cheap Airtime & Data VTU Hub Control Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-amber-50 border-2 border-sky-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                <Radio className="w-4 h-4 text-sky-600" />
                <span>Cheap Airtime &amp; Data VTU Hub Control</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.vtuEnabled ?? true}
                  onChange={(e) => setSettingsForm({ ...settingsForm, vtuEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-[10px] font-bold text-slate-800">
                  {settingsForm.vtuEnabled ?? true ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Airtime Recharge Discount Percent (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={settingsForm.vtuAirtimeDiscountPercent ?? 3}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, vtuAirtimeDiscountPercent: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Users receive this instant discount off face value when recharging airtime.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  VTU Hub Promo Subtitle / Headline
                </label>
                <input
                  type="text"
                  value={settingsForm.vtuAnnouncement ?? '⚡ Cheap Data & Airtime Hub: Instant MB/GB Delivery at Discounted Rates!'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, vtuAnnouncement: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Deposit Bank Name</label>
            <input
              type="text"
              value={settingsForm.adminBankName}
              onChange={(e) => setSettingsForm({ ...settingsForm, adminBankName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Deposit Account Number</label>
            <input
              type="text"
              value={settingsForm.adminAccountNumber}
              onChange={(e) => setSettingsForm({ ...settingsForm, adminAccountNumber: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Deposit Account Name</label>
            <input
              type="text"
              value={settingsForm.adminAccountName}
              onChange={(e) => setSettingsForm({ ...settingsForm, adminAccountName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Explicit Synchronization Note between Deposit Account and Withdrawal Fee Account */}
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-sky-900">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Withdrawal Fee Account Synchronization</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sky-800">
              This official deposit account is automatically applied as the platform's Withdrawal Agent Fee account (₦2,100). Whenever you update this depository, both deposit and withdrawal fee accounts remain 100% identical.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Custom Referral Domain / Invitation Link Format
            </label>
            <input
              type="text"
              value={settingsForm.customReferralLink || ''}
              placeholder="e.g. https://yamaha.vip/#signup?ref={CODE}"
              onChange={(e) => setSettingsForm({ ...settingsForm, customReferralLink: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-purple-900 outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Use <strong>&#123;CODE&#125;</strong> placeholder which will automatically be replaced by each user's unique referral code.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900">Support & Community Links</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600">WhatsApp Official Channel / Group URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://chat.whatsapp.com/..."
                  value={settingsForm.whatsappChannelLink || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappChannelLink: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium outline-none text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600">Telegram Community Group URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://t.me/yamahainvestment_official"
                  value={settingsForm.telegramGroupLink || settingsForm.supportTelegramGroup || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      telegramGroupLink: e.target.value,
                      supportTelegramGroup: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium outline-none text-sky-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600">WhatsApp Direct Support Number</label>
                <input
                  type="text"
                  placeholder="e.g. +2348149021882"
                  value={settingsForm.supportWhatsApp || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportWhatsApp: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600">Live Chat Support Agent URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://t.me/yamaha_support_agent"
                  value={settingsForm.supportLiveChatUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportLiveChatUrl: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Welcome Registration Bonus (₦)</label>
              <input
                type="number"
                value={settingsForm.welcomeBonusAmount}
                onChange={(e) => setSettingsForm({ ...settingsForm, welcomeBonusAmount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Daily Cleaning Claim (₦)</label>
              <input
                type="number"
                value={settingsForm.dailyClaimAmount}
                onChange={(e) => setSettingsForm({ ...settingsForm, dailyClaimAmount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-700" />
                <h4 className="font-black text-xs text-sky-950 uppercase tracking-wide">
                  Withdrawal Limits & Operational Schedule
                </h4>
              </div>
              <span className="bg-sky-200 text-sky-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                Strict Policy Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Deposit (₦)</label>
                <input
                  type="number"
                  value={settingsForm.minDepositAmount}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minDepositAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Withdrawal Limit (₦)</label>
                <input
                  type="number"
                  value={settingsForm.minWithdrawalAmount}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minWithdrawalAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Withdrawal Limit (₦)</label>
                <input
                  type="number"
                  value={settingsForm.maxWithdrawalAmount || 1000000}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxWithdrawalAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-sky-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Withdrawal Open Hour (WAT, 24h)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settingsForm.withdrawalOpenHour ?? 9}
                  onChange={(e) => setSettingsForm({ ...settingsForm, withdrawalOpenHour: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">e.g. 9 = 9:00 AM WAT</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Withdrawal Close Hour (WAT, 24h)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settingsForm.withdrawalCloseHour ?? 18}
                  onChange={(e) => setSettingsForm({ ...settingsForm, withdrawalCloseHour: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">e.g. 18 = 6:00 PM WAT</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Daily Payout Drop Time</label>
                <input
                  type="text"
                  value={settingsForm.withdrawalDropTime || '8:00 PM'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, withdrawalDropTime: e.target.value })}
                  placeholder="8:00 PM"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Visible to users on withdrawal modal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Withdrawal Handling Fee (%)</label>
                <input
                  type="number"
                  value={settingsForm.withdrawalFeePercent || 15}
                  onChange={(e) => setSettingsForm({ ...settingsForm, withdrawalFeePercent: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex flex-col justify-center">
                <span className="font-bold flex items-center gap-1">
                  🚫 Blocked Days: Wednesday & Sunday
                </span>
                <span className="text-[10px] text-amber-800">
                  Withdrawals are automatically closed on Wednesdays & Sundays and allowed from 9am to 6pm on other days. Approved payouts drop at 8:00 PM.
                </span>
              </div>
            </div>
          </div>

          {/* 3-Tier Referral Commissions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-black text-purple-950">3-Tier Referral Commission Percentages (%)</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500">Tier 1 (%) - Direct</label>
                <input
                  type="number"
                  step="0.1"
                  value={settingsForm.tier1BonusPercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tier1BonusPercent: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold text-center outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500">Tier 2 (%) - Secondary</label>
                <input
                  type="number"
                  step="0.1"
                  value={settingsForm.tier2BonusPercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tier2BonusPercent: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold text-center outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500">Tier 3 (%) - Tertiary</label>
                <input
                  type="number"
                  step="0.1"
                  value={settingsForm.tier3BonusPercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tier3BonusPercent: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold text-center outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-black text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" /> Save All Admin Settings to Permanent Database
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PERMANENTLY DELETE USER INVESTMENT PRODUCT */}
      {/* ========================================================================= */}
      {investmentToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <div className="p-2 rounded-2xl bg-rose-100">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Permanently Delete Investment</h3>
                  <p className="text-[10px] text-slate-400">Irreversible database contract removal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvestmentToDelete(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
              <p className="font-bold text-xs flex items-center gap-1.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Confirm Permanent Removal of Invested Product
              </p>
              <p className="text-[11px] leading-relaxed text-rose-800">
                Are you sure you want to permanently delete the <strong>{investmentToDelete.planName}</strong> investment for user <strong>{investmentToDelete.userPhone}</strong>? This contract will be permanently purged from the system database.
              </p>
            </div>

            {/* Investment Details Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Contract ID:</span>
                <span className="font-mono text-slate-800 text-[11px]">{investmentToDelete.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User Phone / ID:</span>
                <span className="font-bold text-slate-900">{investmentToDelete.userPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VIP Package:</span>
                <span className="font-bold text-purple-900">VIP {investmentToDelete.planLevel} ({investmentToDelete.planName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Capital Invested:</span>
                <span className="font-extrabold text-slate-900">₦{investmentToDelete.capital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Return (24h):</span>
                <span className="font-bold text-emerald-600">+₦{investmentToDelete.dailyEarning.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Earned So Far:</span>
                <span className="font-bold text-indigo-700">₦{investmentToDelete.totalEarnedSoFar.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">30-Day Timeline:</span>
                <span className="font-bold text-slate-700">Day {investmentToDelete.daysCompleted} of {investmentToDelete.durationDays || 30}</span>
              </div>
            </div>

            {/* Optional Capital Refund Checkbox */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="refundCapitalCheck"
                checked={deleteRefundCapital}
                onChange={(e) => setDeleteRefundCapital(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded mt-0.5"
              />
              <label htmlFor="refundCapitalCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                <strong>Refund capital (₦{investmentToDelete.capital.toLocaleString()})</strong> back to user's wallet balance
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInvestmentToDelete(null)}
                disabled={isDeletingInvestment}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInvestment}
                disabled={isDeletingInvestment}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingInvestment ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
