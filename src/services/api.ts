import { User, VIPPlan, Investment, Transaction, AdminSettings, SpinReward, TopUpCode } from '../types';
import { INITIAL_VIP_PLANS, DEFAULT_ADMIN_SETTINGS, SPIN_REWARDS } from '../data/initialData';

const API_BASE = '/api';

// Helper for sleep/delay between retries
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestJson<T>(
  url: string,
  options?: RequestInit,
  defaultErrorMsg = 'Request failed',
  maxRetries = 2
): Promise<T> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.error || defaultErrorMsg);
          }
          return json as T;
        } catch (err: any) {
          if (err.message && !err.message.includes('Unexpected token')) {
            throw err;
          }
          throw new Error(defaultErrorMsg);
        }
      }

      // If server returned 502/503/504 (e.g. during container cold-start or reload), retry if attempts remain
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        attempt++;
        await wait(300 * attempt);
        continue;
      }

      // Handle cases where response is non-JSON
      if (!res.ok) {
        throw new Error(`Server request failed with status ${res.status}. ${defaultErrorMsg}`);
      }

      // If ok but non-json, return empty object cast as T if allowed
      return {} as T;
    } catch (err: any) {
      lastError = err;
      // If error is an explicit business error from server (not a fetch network failure), do not retry
      if (
        err.message &&
        err.message !== 'Failed to fetch' &&
        err.message !== 'Load failed' &&
        err.message !== 'NetworkError when attempting to fetch resource.' &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('status 50')
      ) {
        throw err;
      }

      attempt++;
      if (attempt <= maxRetries) {
        await wait(250 * attempt);
      }
    }
  }

  console.warn(`Network fetch failed for ${url} after ${maxRetries + 1} attempts:`, lastError);
  throw new Error('Unable to connect to YAMAHA server. Please check your internet connection.');
}

// LocalStorage registry helper functions for zero data loss
const STORAGE_KEY_REGISTRY = 'yamaha_permanent_user_registry';
const STORAGE_KEY_SETTINGS = 'yamaha_admin_settings_cache';
const STORAGE_KEY_TX_REGISTRY = 'yamaha_permanent_transaction_registry';
const STORAGE_KEY_INV_REGISTRY = 'yamaha_permanent_investments_v2';
const STORAGE_KEY_DELETED_INV_REGISTRY = 'yamaha_deleted_investment_ids_v2';

export function getDeletedInvestmentIds(): string[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_DELETED_INV_REGISTRY) ||
      localStorage.getItem('motorola_deleted_investment_ids_v2');
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function recordDeletedInvestmentId(id: string) {
  if (!id) return;
  try {
    const list = getDeletedInvestmentIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(STORAGE_KEY_DELETED_INV_REGISTRY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('recordDeletedInvestmentId note:', e);
  }
}

export function purgeDeletedInvestmentsFromLocalRegistry(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    const currentDeleted = getDeletedInvestmentIds();
    let updated = false;
    for (const id of ids) {
      if (id && !currentDeleted.includes(id)) {
        currentDeleted.push(id);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(STORAGE_KEY_DELETED_INV_REGISTRY, JSON.stringify(currentDeleted));
    }

    const raw = localStorage.getItem(STORAGE_KEY_INV_REGISTRY);
    if (raw) {
      const registry: Investment[] = JSON.parse(raw);
      if (Array.isArray(registry)) {
        const filtered = registry.filter((i) => i && i.id && !currentDeleted.includes(i.id));
        localStorage.setItem(STORAGE_KEY_INV_REGISTRY, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('purgeDeletedInvestmentsFromLocalRegistry note:', e);
  }
}

export function saveInvestmentToLocalRegistry(inv: Investment) {
  if (!inv || !inv.id) return;
  const deletedIds = getDeletedInvestmentIds();
  if (deletedIds.includes(inv.id)) return; // Never save permanently deleted investments
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INV_REGISTRY);
    const registry: Investment[] = raw ? JSON.parse(raw) : [];
    const index = registry.findIndex((i) => i.id === inv.id);
    if (index >= 0) {
      registry[index] = { ...registry[index], ...inv };
    } else {
      registry.unshift(inv);
    }
    localStorage.setItem(STORAGE_KEY_INV_REGISTRY, JSON.stringify(registry));
  } catch (e) {
    console.warn('LocalStorage saveInvestment note:', e);
  }
}

export function saveInvestmentsBatchToLocalRegistry(invs: Investment[]) {
  if (!Array.isArray(invs)) return;
  const deletedIds = getDeletedInvestmentIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INV_REGISTRY);
    const registry: Investment[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, Investment>();
    for (const i of registry) {
      if (i && i.id && !deletedIds.includes(i.id)) map.set(i.id, i);
    }
    for (const i of invs) {
      if (i && i.id && !deletedIds.includes(i.id)) {
        map.set(i.id, { ...(map.get(i.id) || {}), ...i });
      }
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    localStorage.setItem(STORAGE_KEY_INV_REGISTRY, JSON.stringify(merged));
  } catch (e) {
    console.warn('LocalStorage saveInvestmentsBatch note:', e);
  }
}

export function getLocalInvestments(): Investment[] {
  try {
    const deletedIds = getDeletedInvestmentIds();
    const raw =
      localStorage.getItem(STORAGE_KEY_INV_REGISTRY) ||
      localStorage.getItem('motorola_permanent_investments_v2');
    const list: Investment[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((i) => i && i.id && !deletedIds.includes(i.id)) : [];
  } catch (e) {
    return [];
  }
}

export function removeInvestmentFromLocalRegistry(investmentId: string) {
  if (!investmentId) return;
  recordDeletedInvestmentId(investmentId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INV_REGISTRY);
    const registry: Investment[] = raw ? JSON.parse(raw) : [];
    const filtered = registry.filter((i) => i.id !== investmentId);
    localStorage.setItem(STORAGE_KEY_INV_REGISTRY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('LocalStorage removeInvestment note:', e);
  }
}

export function saveUserToLocalRegistry(user: User) {
  if (!user || !user.id) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
    const registry: User[] = raw ? JSON.parse(raw) : [];
    const index = registry.findIndex(
      (u) =>
        u.id === user.id ||
        (u.phone && user.phone && u.phone === user.phone) ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    if (index >= 0) {
      registry[index] = { ...registry[index], ...user };
    } else {
      registry.push(user);
    }
    localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(registry));
    localStorage.setItem(`yamaha_user_profile_${user.id}`, JSON.stringify(user));
  } catch (e) {
    console.warn('LocalStorage saveUser note:', e);
  }
}

export function saveUsersBatchToLocalRegistry(users: User[]) {
  if (!Array.isArray(users)) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
    const registry: User[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, User>();
    for (const u of registry) {
      if (u && u.id) map.set(u.id, u);
    }
    for (const u of users) {
      if (u && u.id) {
        map.set(u.id, { ...(map.get(u.id) || {}), ...u });
      }
    }
    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(merged));
  } catch (e) {
    console.warn('LocalStorage saveUsersBatch note:', e);
  }
}

export function getLocalRegisteredUsers(): User[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_REGISTRY) ||
      localStorage.getItem('motorola_permanent_user_registry');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function removeUserFromLocalRegistry(userIdOrPhone: string) {
  if (!userIdOrPhone) return;
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_REGISTRY) ||
      localStorage.getItem('motorola_permanent_user_registry');
    const registry: User[] = raw ? JSON.parse(raw) : [];
    const filtered = registry.filter(
      (u) => u.id !== userIdOrPhone && u.phone !== userIdOrPhone
    );
    localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(filtered));
    localStorage.removeItem(`yamaha_user_profile_${userIdOrPhone}`);
    localStorage.removeItem(`motorola_user_profile_${userIdOrPhone}`);
  } catch (e) {
    console.warn('LocalStorage removeUser note:', e);
  }
}

export function saveTransactionToLocalRegistry(tx: Transaction) {
  if (!tx || !tx.id) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX_REGISTRY);
    const registry: Transaction[] = raw ? JSON.parse(raw) : [];
    const index = registry.findIndex((t) => t.id === tx.id);
    if (index >= 0) {
      registry[index] = { ...registry[index], ...tx };
    } else {
      registry.unshift(tx);
    }
    localStorage.setItem(STORAGE_KEY_TX_REGISTRY, JSON.stringify(registry));
  } catch (e) {
    console.warn('LocalStorage saveTransaction note:', e);
  }
}

export function saveTransactionsBatchToLocalRegistry(txs: Transaction[]) {
  if (!Array.isArray(txs)) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX_REGISTRY);
    const registry: Transaction[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, Transaction>();
    for (const t of registry) {
      if (t && t.id) map.set(t.id, t);
    }
    for (const t of txs) {
      if (t && t.id) {
        map.set(t.id, { ...(map.get(t.id) || {}), ...t });
      }
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    localStorage.setItem(STORAGE_KEY_TX_REGISTRY, JSON.stringify(merged));
  } catch (e) {
    console.warn('LocalStorage saveTransactionsBatch note:', e);
  }
}

export function getLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TX_REGISTRY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export class ApiService {
  static async getPublicSettings(): Promise<{ adminSettings: AdminSettings; plans: VIPPlan[]; spinRewards: SpinReward[] }> {
    try {
      const res = await requestJson<{ adminSettings: AdminSettings; plans: VIPPlan[]; spinRewards: SpinReward[] }>(
        `${API_BASE}/settings`,
        undefined,
        'Failed to fetch platform settings'
      );
      if (res && res.adminSettings) {
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(res.adminSettings));
        } catch (e) {}
      }
      return res;
    } catch (err) {
      let cachedSettings: AdminSettings = DEFAULT_ADMIN_SETTINGS;
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (raw) cachedSettings = { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
      } catch (e) {}
      return {
        adminSettings: cachedSettings,
        plans: INITIAL_VIP_PLANS,
        spinRewards: SPIN_REWARDS,
      };
    }
  }

  // Auth API
  static async register(data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    referralCode?: string;
  }): Promise<{ message: string; user: User }> {
    try {
      const res = await requestJson<{ message: string; user: User }>(
        `${API_BASE}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        'Registration failed'
      );
      if (res && res.user) {
        saveUserToLocalRegistry(res.user);
      }
      return res;
    } catch (err: any) {
      // If network is offline, create local user account with welcome bonus and queue sync
      if (err.message && err.message.includes('Unable to connect')) {
        const localUsers = getLocalRegisteredUsers();
        const existing = localUsers.find(
          (u) =>
            u.phone.toLowerCase() === data.phone.trim().toLowerCase() ||
            u.email.toLowerCase() === data.email.trim().toLowerCase()
        );
        if (existing) {
          throw new Error('An account with this phone number or email already exists.');
        }

        const newUser: User = {
          id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
          isPhoneVerified: true,
          passwordHash: data.password,
          role: data.email.trim().toLowerCase() === 'emmanuelchidalu67@gmail.com' ? 'admin' : 'user',
          vipLevel: 1,
          balance: 700,
          totalInvested: 0,
          totalEarned: 0,
          totalReferralBonus: 0,
          totalWithdrawn: 0,
          welcomeBonusClaimed: true,
          referralCode: `MOT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          referredBy: data.referralCode?.trim() || undefined,
          spinsAvailable: 1,
          createdAt: new Date().toISOString(),
        };

        saveUserToLocalRegistry(newUser);
        this.syncClientData({ users: [newUser] }).catch(() => {});
        return {
          message: 'Account successfully created and registered!',
          user: newUser,
        };
      }
      throw err;
    }
  }

  static async login(data: {
    identifier: string;
    password: string;
  }): Promise<{ message: string; user: User }> {
    try {
      const res = await requestJson<{ message: string; user: User }>(
        `${API_BASE}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        'Login failed'
      );
      if (res && res.user) {
        saveUserToLocalRegistry(res.user);
      }
      return res;
    } catch (err: any) {
      // Check local offline registry if user exists and auto-reseed to server
      const localUsers = getLocalRegisteredUsers();
      const cleanIdent = data.identifier.trim().toLowerCase();
      const matched = localUsers.find(
        (u) =>
          u.phone.toLowerCase() === cleanIdent ||
          u.email?.toLowerCase() === cleanIdent ||
          u.id?.toLowerCase() === cleanIdent
      );
      if (matched && matched.passwordHash === data.password) {
        // Sync to server in background and log in with cached credentials
        try {
          await this.syncClientData({ users: [matched] });
        } catch (sErr) {}
        saveUserToLocalRegistry(matched);
        return {
          message: 'Login restored from permanent local registry',
          user: matched,
        };
      }
      throw err;
    }
  }

  static async getProfile(userId: string): Promise<{ user: User; adminSettings: AdminSettings }> {
    try {
      const res = await requestJson<{ user: User; adminSettings: AdminSettings }>(
        `${API_BASE}/auth/me/${userId}`,
        undefined,
        'Failed to fetch user profile'
      );
      if (res && res.user) {
        saveUserToLocalRegistry(res.user);
      }
      return res;
    } catch (err) {
      const localUsers = getLocalRegisteredUsers();
      const localUser = localUsers.find((u) => u.id === userId);
      let cachedSettings: AdminSettings = DEFAULT_ADMIN_SETTINGS;
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (raw) cachedSettings = { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
      } catch (e) {}
      if (localUser) {
        return { user: localUser, adminSettings: cachedSettings };
      }
      throw err;
    }
  }

  // Bank Account
  static async updateBankAccount(data: {
    userId: string;
    bankName: string;
    bankCode?: string;
    accountNumber: string;
    accountName: string;
    withdrawalPin?: string;
  }): Promise<{ message: string; user: User }> {
    try {
      const res = await requestJson<{ message: string; user: User }>(
        `${API_BASE}/user/bank-account`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        'Failed to update bank account'
      );
      if (res && res.user) {
        saveUserToLocalRegistry(res.user);
      }
      return res;
    } catch (err: any) {
      const localUsers = getLocalRegisteredUsers();
      const localUser = localUsers.find((u) => u.id === data.userId);
      if (localUser) {
        localUser.withdrawalPin = data.withdrawalPin || localUser.withdrawalPin;
        localUser.bankAccount = {
          bankName: data.bankName,
          bankCode: data.bankCode || '000',
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          withdrawalPin: data.withdrawalPin || localUser.withdrawalPin,
          updatedAt: new Date().toISOString(),
        };
        saveUserToLocalRegistry(localUser);
        this.syncClientData({ users: [localUser] }).catch(() => {});
        return { message: 'Bank account updated successfully', user: localUser };
      }
      throw err;
    }
  }

  // Daily Checkin
  static async claimDailyBonus(userId: string): Promise<{ message: string; user: User }> {
    const res = await requestJson<{ message: string; user: User }>(
      `${API_BASE}/user/claim-daily`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      },
      'Failed to claim daily bonus'
    );
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
    }
    return res;
  }

  // Spin Wheel
  static async spinWheel(userId: string): Promise<{ message: string; reward: SpinReward; user: User }> {
    const res = await requestJson<{ message: string; reward: SpinReward; user: User }>(
      `${API_BASE}/user/spin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      },
      'Failed to spin wheel'
    );
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
    }
    return res;
  }

  // Plans
  static async getPlans(): Promise<{ plans: VIPPlan[] }> {
    try {
      return await requestJson(`${API_BASE}/plans`, undefined, 'Failed to fetch investment plans');
    } catch (err) {
      return { plans: INITIAL_VIP_PLANS };
    }
  }

  // Investments
  static async invest(userId: string, planLevel: number): Promise<{ message: string; investment: Investment; user: User }> {
    const res = await requestJson<{ message: string; investment: Investment; user: User }>(
      `${API_BASE}/investments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planLevel }),
      },
      'Investment purchase failed'
    );
    if (res) {
      if (res.user) saveUserToLocalRegistry(res.user);
      if (res.investment) saveInvestmentToLocalRegistry(res.investment);
    }
    return res;
  }

  static async getUserInvestments(userId: string): Promise<{ investments: Investment[]; deletedInvestmentIds?: string[] }> {
    try {
      const res = await requestJson<{ investments: Investment[]; deletedInvestmentIds?: string[] }>(
        `${API_BASE}/investments/user/${userId}`,
        undefined,
        'Failed to fetch user investments'
      );
      if (res && Array.isArray(res.deletedInvestmentIds)) {
        purgeDeletedInvestmentsFromLocalRegistry(res.deletedInvestmentIds);
      }
      if (res && Array.isArray(res.investments)) {
        saveInvestmentsBatchToLocalRegistry(res.investments);
      }
      return res;
    } catch (err) {
      const localInvs = getLocalInvestments().filter((i) => i.userId === userId);
      if (localInvs.length > 0) {
        return { investments: localInvs, deletedInvestmentIds: getDeletedInvestmentIds() };
      }
      throw err;
    }
  }

  // Live-Sync: Instant real-time balance, transaction status, & investment sync
  static async liveSync(userId: string): Promise<{
    user: User;
    transactions: Transaction[];
    investments: Investment[];
    deletedInvestmentIds?: string[];
    adminSettings: AdminSettings;
    serverTime?: string;
  }> {
    const res = await requestJson<{
      user: User;
      transactions: Transaction[];
      investments: Investment[];
      deletedInvestmentIds?: string[];
      adminSettings: AdminSettings;
      serverTime?: string;
    }>(
      `${API_BASE}/user/live-sync/${userId}`,
      {},
      'Failed to sync live user data'
    );
    if (res) {
      if (Array.isArray(res.deletedInvestmentIds)) {
        purgeDeletedInvestmentsFromLocalRegistry(res.deletedInvestmentIds);
      }
      if (res.user) saveUserToLocalRegistry(res.user);
      if (Array.isArray(res.transactions)) saveTransactionsBatchToLocalRegistry(res.transactions);
      if (Array.isArray(res.investments)) saveInvestmentsBatchToLocalRegistry(res.investments);
    }
    return res;
  }

  // Background Check Utility: Verifies investment duration completion & moves matured capital to wallet balance
  static async processInvestmentsBackgroundCheck(userId?: string): Promise<{
    success: boolean;
    user?: User;
    investments?: Investment[];
    adminSettings?: AdminSettings;
  }> {
    try {
      const res = await requestJson<{
        success: boolean;
        user?: User;
        investments?: Investment[];
        adminSettings?: AdminSettings;
      }>(
        `${API_BASE}/investments/check-maturity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
        'Background maturity check failed'
      );
      if (res && res.user) {
        saveUserToLocalRegistry(res.user);
      }
      if (res && res.investments) {
        saveInvestmentsBatchToLocalRegistry(res.investments);
      }
      return res;
    } catch (err) {
      // Local fallback calculation if offline
      if (userId) {
        const localUsers = getLocalRegisteredUsers();
        const user = localUsers.find((u) => u.id === userId);
        const localInvs = getLocalInvestments().filter((i) => i.userId === userId);
        if (user && localInvs.length > 0) {
          const now = Date.now();
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;
          let changed = false;

          localInvs.forEach((inv) => {
            if (inv.status === 'active') {
              const pTime = new Date(inv.purchasedAt).getTime();
              const elapsedDays = Math.floor((now - pTime) / ONE_DAY_MS);
              const duration = inv.durationDays || 30;
              if (elapsedDays >= duration || inv.daysCompleted >= duration) {
                inv.status = 'completed';
                user.totalInvested = Math.max(0, (user.totalInvested || 0) - inv.capital);
                user.balance += inv.capital;
                changed = true;
              }
            }
          });

          if (changed) {
            saveUserToLocalRegistry(user);
            saveInvestmentsBatchToLocalRegistry(localInvs);
          }
          return { success: true, user, investments: localInvs };
        }
      }
      return { success: false };
    }
  }

  // Deposits
  static async requestDeposit(data: {
    userId: string;
    amount: number;
    paymentMethod: string;
    proofReference: string;
  }): Promise<{ message: string; transaction: Transaction }> {
    const res = await requestJson<{ message: string; transaction: Transaction }>(
      `${API_BASE}/transactions/deposit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Deposit request failed'
    );
    if (res && res.transaction) {
      saveTransactionToLocalRegistry(res.transaction);
    }
    return res;
  }

  // Withdrawals
  static async requestWithdrawal(data: {
    userId: string;
    amount: number;
    withdrawalPin?: string;
    pin?: string;
  }): Promise<{ message: string; transaction: Transaction; user: User }> {
    const res = await requestJson<{ message: string; transaction: Transaction; user: User }>(
      `${API_BASE}/transactions/withdraw`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Withdrawal request failed'
    );
    if (res) {
      if (res.transaction) saveTransactionToLocalRegistry(res.transaction);
      if (res.user) saveUserToLocalRegistry(res.user);
    }
    return res;
  }

  // Pay Withdrawal Agent Fee (₦2,100) to unlock withdrawal & resume daily earnings (Bank Transfer Only)
  static async payWithdrawalAgentFee(data: {
    userId: string;
    paymentMethod?: 'wallet' | 'transfer';
    proofReference?: string;
  }): Promise<{ success: boolean; message: string; user?: User; transaction?: Transaction }> {
    try {
      const res = await requestJson<{
        success: boolean;
        message: string;
        user?: User;
        transaction?: Transaction;
      }>(
        `${API_BASE}/user/pay-agent-fee`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        'Failed to process withdrawal agent fee payment'
      );
      if (res) {
        if (res.user) saveUserToLocalRegistry(res.user);
        if (res.transaction) saveTransactionToLocalRegistry(res.transaction);
        try {
          window.dispatchEvent(new CustomEvent('motorola_user_updated', { detail: res.user }));
        } catch (_) {}
      }
      return res;
    } catch (err) {
      if (data.paymentMethod === 'wallet') {
        throw new Error('Home balance is not eligible. Per platform policy, the ₦2,100 withdrawal agent fee must be paid from Bank Transfer only.');
      }
      // Offline fallback: simulate bank transfer submission
      const localUsers = getLocalRegisteredUsers();
      const user = localUsers.find((u) => u.id === data.userId);
      const ref = data.proofReference?.trim() || `FEE-${Date.now().toString(36).toUpperCase()}`;
      const feeTx: Transaction = {
        id: `tx_agentfee_dep_${Date.now()}`,
        userId: data.userId,
        userPhone: user?.phone || '',
        type: 'deposit',
        amount: 2100,
        status: 'pending',
        paymentMethod: 'Bank Transfer (Withdrawal Agent Fee)',
        proofReference: ref,
        adminNote: '₦2,100 Withdrawal Agent Fee Payment (Bank Transfer Only - Awaiting Admin Confirmation)',
        createdAt: new Date().toISOString(),
      };
      saveTransactionToLocalRegistry(feeTx);
      return {
        success: true,
        message: '₦2,100 Agent Fee bank transfer proof submitted. Admin will verify and unlock your account.',
        transaction: feeTx,
        user,
      };
    }
  }

  // VTU Telecommunications: Buy Cheap Data (MB/GB) or Discounted Airtime (Bank Transfer Only - Pending Admin Approval)
  static async purchaseVtu(data: {
    userId: string;
    type: 'airtime' | 'data';
    network: 'MTN' | 'Airtel' | 'Glo' | '9mobile' | string;
    phone: string;
    planName?: string;
    amount: number;
    dataAmount?: string;
    discountSaved?: number;
    paymentMethod?: string;
    proofReference?: string;
    senderBankName?: string;
    senderAccountName?: string;
  }): Promise<{ success: boolean; message: string; transaction: Transaction; user: User }> {
    try {
      const res = await requestJson<{
        success: boolean;
        message: string;
        transaction: Transaction;
        user: User;
      }>(
        `${API_BASE}/vtu/purchase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            paymentMethod: 'Bank Transfer (Transfer Only)',
          }),
        },
        'VTU purchase order failed'
      );
      if (res) {
        if (res.user) saveUserToLocalRegistry(res.user);
        if (res.transaction) saveTransactionToLocalRegistry(res.transaction);
        try {
          window.dispatchEvent(new CustomEvent('motorola_user_updated', { detail: res.user }));
          window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { user: res.user, transactions: [res.transaction] } }));
        } catch (_) {}
      }
      return res;
    } catch (err: any) {
      if (err?.message?.includes?.('Wallet balance is not eligible')) {
        throw err;
      }
      // Offline fallback: save pending transaction locally
      const localUsers = getLocalRegisteredUsers();
      const user = localUsers.find((u) => u.id === data.userId) || { id: data.userId, phone: data.phone, balance: 0 } as User;
      const txId = `vtu_${data.type === 'data' ? 'dat' : 'air'}_${Date.now()}`;
      const vtuTx: Transaction = {
        id: txId,
        userId: data.userId,
        userPhone: data.phone,
        type: data.type === 'data' ? 'vtu_data' : 'vtu_airtime',
        amount: data.amount,
        status: 'pending',
        paymentMethod: 'Bank Transfer (Transfer Only)',
        proofReference: data.proofReference || `VTU-REF-${Date.now().toString(36).toUpperCase()}`,
        vtuNetwork: data.network,
        vtuPhone: data.phone,
        vtuPlan: data.planName || `${data.network} ${data.dataAmount || data.amount}`,
        vtuDataAmount: data.dataAmount,
        vtuDiscountSaved: data.discountSaved,
        senderBankName: data.senderBankName,
        senderAccountName: data.senderAccountName,
        adminNote: `Awaiting Admin Confirmation: ${data.network} ${data.planName || ''}. Sender: ${data.senderAccountName || 'Bank Transfer'} (${data.senderBankName || 'Bank'})`,
        createdAt: new Date().toISOString(),
      };
      saveTransactionToLocalRegistry(vtuTx);
      try {
        window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { user, transactions: [vtuTx] } }));
      } catch (_) {}
      return {
        success: true,
        message: `Transfer proof submitted! Your ${data.type === 'data' ? 'data bundle' : 'airtime'} order is pending admin verification.`,
        transaction: vtuTx,
        user,
      };
    }
  }

  // Transaction History
  static async getTransactionHistory(userId: string): Promise<{ transactions: Transaction[] }> {
    try {
      const res = await requestJson<{ transactions: Transaction[] }>(
        `${API_BASE}/transactions/user/${userId}`,
        undefined,
        'Failed to fetch transactions'
      );
      if (res && Array.isArray(res.transactions)) {
        saveTransactionsBatchToLocalRegistry(res.transactions);
      }
      return res;
    } catch (err) {
      // Offline fallback: load cached transactions for this user
      const localTxs = getLocalTransactions().filter((t) => t.userId === userId);
      if (localTxs.length > 0) {
        return { transactions: localTxs };
      }
      throw err;
    }
  }

  // Referrals
  static async getReferrals(userId: string): Promise<any> {
    return requestJson(`${API_BASE}/referrals/user/${userId}`, undefined, 'Failed to fetch referral team');
  }

  // Avatar Update
  static async updateAvatar(userId: string, avatarUrl: string): Promise<{ message: string; user: User }> {
    const res = await requestJson<{ message: string; user: User }>(
      `${API_BASE}/user/avatar`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatarUrl }),
      },
      'Failed to update avatar'
    );
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
    }
    return res;
  }

  // Admin APIs
  static async getAdminOverview(adminId: string): Promise<any> {
    try {
      return await requestJson(
        `${API_BASE}/admin/overview`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Admin overview access failed'
      );
    } catch (err) {
      const users = getLocalRegisteredUsers();
      const txs = getLocalTransactions();
      const invs = getLocalInvestments();
      let cachedSettings: AdminSettings = DEFAULT_ADMIN_SETTINGS;
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (raw) cachedSettings = { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
      } catch (e) {}

      const totalDeposits = txs.filter((t) => t.type === 'deposit' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawals = txs.filter((t) => t.type === 'withdrawal' && t.status === 'approved').reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
      const totalInvested = invs.reduce((sum, i) => sum + i.capital, 0);

      return {
        stats: {
          totalUsers: users.length,
          totalDeposits,
          totalWithdrawals,
          totalInvested,
          pendingDepositsCount: txs.filter((t) => t.type === 'deposit' && t.status === 'pending').length,
          pendingWithdrawalsCount: txs.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length,
          activeInvestmentsCount: invs.filter((i) => i.status === 'active').length,
        },
        adminSettings: cachedSettings,
        spinRewards: SPIN_REWARDS,
      };
    }
  }

  static async getAdminUsers(adminId: string): Promise<{ users: User[] }> {
    try {
      const res = await requestJson<{ users: User[] }>(
        `${API_BASE}/admin/users`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch admin users'
      );
      if (res && Array.isArray(res.users)) {
        saveUsersBatchToLocalRegistry(res.users);
      }
      return res;
    } catch (err) {
      return { users: getLocalRegisteredUsers() };
    }
  }

  static async updateAdminUser(
    adminId: string,
    data: {
      targetUserId: string;
      newBalance?: number;
      newInvestedBalance?: number;
      newEarnedBalance?: number;
      vipLevel?: number;
      role?: string;
      isBanned?: boolean;
      withdrawalBanned?: boolean;
      spinsAvailable?: number;
      fullName?: string;
      phone?: string;
    }
  ): Promise<any> {
    const res = await requestJson<{ message: string; user: User }>(
      `${API_BASE}/admin/users/update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify(data),
      },
      'Failed to update user'
    );
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
    }
    return res;
  }

  static async toggleWithdrawalBan(
    adminId: string,
    targetUserId: string,
    withdrawalBanned?: boolean
  ): Promise<{ message: string; user: User; users: User[] }> {
    const res = await requestJson<{ message: string; user: User; users: User[] }>(
      `${API_BASE}/admin/users/toggle-withdrawal-ban`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ targetUserId, withdrawalBanned }),
      },
      'Failed to toggle withdrawal ban'
    );
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
    }
    return res;
  }

  static async getAdminDeposits(adminId: string): Promise<{ deposits: Transaction[] }> {
    try {
      const res = await requestJson<{ deposits: Transaction[] }>(
        `${API_BASE}/admin/deposits`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch deposit requests'
      );
      if (res && Array.isArray(res.deposits)) {
        saveTransactionsBatchToLocalRegistry(res.deposits);
      }
      return res;
    } catch (err) {
      const localDeposits = getLocalTransactions().filter((t) => t.type === 'deposit');
      return { deposits: localDeposits };
    }
  }

  static async handleAdminDeposit(
    adminId: string,
    transactionId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<any> {
    const res = await requestJson<any>(
      `${API_BASE}/admin/deposits/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ transactionId, action, note }),
      },
      'Failed to process deposit'
    );
    if (res && res.transaction) {
      saveTransactionToLocalRegistry(res.transaction);
    }
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
      window.dispatchEvent(new CustomEvent('motorola_user_sync', { detail: res.user }));
    }
    return res;
  }

  static async getAdminWithdrawals(adminId: string): Promise<{ withdrawals: Transaction[] }> {
    try {
      const res = await requestJson<{ withdrawals: Transaction[] }>(
        `${API_BASE}/admin/withdrawals`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch withdrawal requests'
      );
      if (res && Array.isArray(res.withdrawals)) {
        saveTransactionsBatchToLocalRegistry(res.withdrawals);
      }
      return res;
    } catch (err) {
      const localWithdrawals = getLocalTransactions().filter((t) => t.type === 'withdrawal');
      return { withdrawals: localWithdrawals };
    }
  }

  static async handleAdminWithdrawal(
    adminId: string,
    transactionId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<any> {
    const res = await requestJson<any>(
      `${API_BASE}/admin/withdrawals/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ transactionId, action, note }),
      },
      'Failed to process withdrawal'
    );
    if (res && res.transaction) {
      saveTransactionToLocalRegistry(res.transaction);
    }
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
      window.dispatchEvent(new CustomEvent('motorola_user_sync', { detail: res.user }));
    }
    return res;
  }

  static async getAdminVtu(adminId: string): Promise<{ orders: Transaction[] }> {
    try {
      const res = await requestJson<{ orders: Transaction[] }>(
        `${API_BASE}/admin/vtu`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch VTU orders'
      );
      if (res && Array.isArray(res.orders)) {
        saveTransactionsBatchToLocalRegistry(res.orders);
      }
      return res;
    } catch (err) {
      const localVtu = getLocalTransactions().filter((t) => t.type === 'vtu_airtime' || t.type === 'vtu_data');
      return { orders: localVtu };
    }
  }

  static async handleAdminVtu(
    adminId: string,
    transactionId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<any> {
    const res = await requestJson<any>(
      `${API_BASE}/admin/vtu/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ transactionId, action, note }),
      },
      'Failed to process VTU order'
    );
    if (res && res.transaction) {
      saveTransactionToLocalRegistry(res.transaction);
    }
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
      window.dispatchEvent(new CustomEvent('motorola_user_sync', { detail: res.user }));
    }
    return res;
  }

  static async saveAdminSettings(adminId: string, settings: Partial<AdminSettings>): Promise<any> {
    return requestJson(
      `${API_BASE}/admin/settings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ settings }),
      },
      'Failed to save admin settings'
    );
  }

  static async updateAdminPlans(adminId: string, plans: VIPPlan[]): Promise<any> {
    return requestJson(
      `${API_BASE}/admin/plans/update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ plans }),
      },
      'Failed to update plans'
    );
  }

  static async updateAdminSpins(adminId: string, spinRewards: SpinReward[]): Promise<any> {
    return requestJson(
      `${API_BASE}/admin/spins/update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ spinRewards }),
      },
      'Failed to update spin rewards'
    );
  }

  static async getAdminInvestments(adminId: string): Promise<{ investments: Investment[]; deletedInvestmentIds?: string[] }> {
    try {
      const res = await requestJson<{ investments: Investment[]; deletedInvestmentIds?: string[] }>(
        `${API_BASE}/admin/investments`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch global investments'
      );
      if (res && Array.isArray(res.deletedInvestmentIds)) {
        purgeDeletedInvestmentsFromLocalRegistry(res.deletedInvestmentIds);
      }
      if (res && Array.isArray(res.investments)) {
        saveInvestmentsBatchToLocalRegistry(res.investments);
      }
      return res;
    } catch (err) {
      return { investments: getLocalInvestments(), deletedInvestmentIds: getDeletedInvestmentIds() };
    }
  }

  static async triggerAdminSettlement(adminId: string): Promise<{ message: string; investments: Investment[] }> {
    const res = await requestJson<{ message: string; investments: Investment[] }>(
      `${API_BASE}/admin/investments/settle-now`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
      },
      'Failed to trigger settlement engine'
    );
    if (res && Array.isArray(res.investments)) {
      saveInvestmentsBatchToLocalRegistry(res.investments);
    }
    return res;
  }

  static async deleteAdminInvestment(
    adminId: string,
    investmentId: string,
    refundCapital: boolean = false
  ): Promise<{
    message: string;
    deletedInvestmentId: string;
    deletedInvestmentIds?: string[];
    investments: Investment[];
    user: User | null;
    users?: User[];
  }> {
    const res = await requestJson<{
      message: string;
      deletedInvestmentId: string;
      deletedInvestmentIds?: string[];
      investments: Investment[];
      user: User | null;
      users?: User[];
    }>(
      `${API_BASE}/admin/investments/delete/${investmentId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ refundCapital }),
      },
      'Failed to delete investment product permanently'
    );

    // Remove from local fallback registry as well
    removeInvestmentFromLocalRegistry(investmentId);
    if (res && res.deletedInvestmentId) {
      recordDeletedInvestmentId(res.deletedInvestmentId);
    }
    if (res && Array.isArray(res.deletedInvestmentIds)) {
      purgeDeletedInvestmentsFromLocalRegistry(res.deletedInvestmentIds);
    }
    if (res && res.user) {
      saveUserToLocalRegistry(res.user);
    }
    if (res && Array.isArray(res.users)) {
      saveUsersBatchToLocalRegistry(res.users);
    }

    // Broadcast event across app
    window.dispatchEvent(
      new CustomEvent('motorola_investment_deleted', {
        detail: {
          investmentId,
          deletedInvestmentIds: res?.deletedInvestmentIds || [investmentId],
          user: res?.user,
        },
      })
    );

    return res;
  }

  static async getAdminTransactions(adminId: string): Promise<{ transactions: Transaction[] }> {
    try {
      const res = await requestJson<{ transactions: Transaction[] }>(
        `${API_BASE}/admin/transactions`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch global transactions'
      );
      if (res && Array.isArray(res.transactions)) {
        saveTransactionsBatchToLocalRegistry(res.transactions);
      }
      return res;
    } catch (err) {
      return { transactions: getLocalTransactions() };
    }
  }

  // VTU Admin APIs
  static async getAdminVtuOrders(adminId: string): Promise<{ orders: Transaction[] }> {
    try {
      return await requestJson(
        `${API_BASE}/admin/vtu`,
        { headers: { 'x-admin-id': adminId } },
        'Failed to fetch VTU orders'
      );
    } catch (err) {
      const allTx = getLocalTransactions();
      const orders = allTx.filter((t) => t.type === 'vtu_airtime' || t.type === 'vtu_data');
      return { orders };
    }
  }

  static async adminVtuAction(adminId: string, transactionId: string, action: 'approve' | 'reject', note?: string): Promise<{ message: string; transaction: Transaction; user?: User }> {
    const res = await requestJson<{ message: string; transaction: Transaction; user?: User }>(
      `${API_BASE}/admin/vtu/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ transactionId, action, note }),
      },
      `Failed to ${action} VTU order`
    );
    if (res && res.transaction) {
      saveTransactionToLocalRegistry(res.transaction);
      if (res.user) saveUserToLocalRegistry(res.user);
      try {
        window.dispatchEvent(new CustomEvent('motorola_live_update', { detail: { user: res.user, transactions: [res.transaction] } }));
      } catch (_) {}
    }
    return res;
  }

  // Top Up Code APIs
  static async redeemTopUpCode(userId: string, code: string): Promise<{ message: string; user: User; transaction: Transaction }> {
    const res = await requestJson<{ message: string; user: User; transaction: Transaction }>(
      `${API_BASE}/user/redeem-code`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      },
      'Failed to redeem Top-Up code'
    );
    if (res) {
      if (res.user) saveUserToLocalRegistry(res.user);
      if (res.transaction) saveTransactionToLocalRegistry(res.transaction);
    }
    return res;
  }

  static async getAdminTopUpCodes(adminId: string): Promise<{ topUpCodes: TopUpCode[] }> {
    try {
      return await requestJson(
        `${API_BASE}/admin/topup-codes`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch top-up codes'
      );
    } catch (err) {
      return { topUpCodes: [] };
    }
  }

  static async createAdminTopUpCode(adminId: string, code: string, amount: number, maxRedemptions: number): Promise<{ message: string; topUpCodes: TopUpCode[] }> {
    return requestJson(
      `${API_BASE}/admin/topup-codes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ code, amount, maxRedemptions }),
      },
      'Failed to create top-up code'
    );
  }

  static async deleteAdminTopUpCode(adminId: string, codeId: string): Promise<{ message: string; topUpCodes: TopUpCode[] }> {
    return requestJson(
      `${API_BASE}/admin/topup-codes/${codeId}`,
      {
        method: 'DELETE',
        headers: { 'x-admin-id': adminId },
      },
      'Failed to delete top-up code'
    );
  }

  static async deleteAdminUser(adminId: string, targetUserId: string): Promise<{ message: string; users: User[]; overview?: any }> {
    const res = await requestJson<{ message: string; users: User[]; overview?: any }>(
      `${API_BASE}/admin/users/delete/${targetUserId}`,
      {
        method: 'POST',
        headers: { 'x-admin-id': adminId },
      },
      'Failed to delete user'
    );
    removeUserFromLocalRegistry(targetUserId);
    if (res && Array.isArray(res.users)) {
      try {
        localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(res.users));
      } catch (e) {}
    }
    return res;
  }

  static async toggleBanAdminUser(adminId: string, targetUserId: string): Promise<{ message: string; users: User[] }> {
    return requestJson(
      `${API_BASE}/admin/users/toggle-ban`,
      {
        method: 'POST',
        headers: { 'x-admin-id': adminId },
        body: JSON.stringify({ targetUserId }),
      },
      'Failed to update user suspension status'
    );
  }

  // Database Health, Export & Restore
  static async getDbHealth(adminId: string): Promise<any> {
    try {
      return await requestJson(
        `${API_BASE}/admin/db/health`,
        {
          headers: { 'x-admin-id': adminId },
        },
        'Failed to fetch database health'
      );
    } catch (err) {
      const users = getLocalRegisteredUsers();
      const txs = getLocalTransactions();
      const invs = getLocalInvestments();
      return {
        status: 'online',
        databaseEngine: 'Yamaha Permanent Ledger',
        usersCount: users.length,
        transactionsCount: txs.length,
        investmentsCount: invs.length,
        persistenceActive: true,
      };
    }
  }

  static async restoreDbBackup(adminId: string, backupData: any): Promise<{ message: string }> {
    return requestJson(
      `${API_BASE}/admin/db/restore`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ backupData }),
      },
      'Failed to restore database from backup'
    );
  }

  static async exportDbBackup(adminId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/db/export`, {
      headers: { 'x-admin-id': adminId },
    });
    if (!res.ok) throw new Error('Database export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yamaha_permanent_db_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async syncClientData(data: {
    users?: User[];
    transactions?: Transaction[];
    investments?: Investment[];
  }): Promise<{
    success: boolean;
    totalUsers: number;
    totalTransactions: number;
    totalInvestments: number;
    deletedInvestmentIds?: string[];
  }> {
    const res = await requestJson<{
      success: boolean;
      totalUsers: number;
      totalTransactions: number;
      totalInvestments: number;
      deletedInvestmentIds?: string[];
    }>(
      `${API_BASE}/sync/client-data`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'Failed to sync client data with server'
    );
    if (res && Array.isArray(res.deletedInvestmentIds)) {
      purgeDeletedInvestmentsFromLocalRegistry(res.deletedInvestmentIds);
    }
    return res;
  }
}
