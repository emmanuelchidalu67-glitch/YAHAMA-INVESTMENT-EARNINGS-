import { User, Investment, Transaction } from '../types';

/**
 * Root permanent administrative accounts.
 * Registered users are dynamically appended and persisted in permanent database storage (db.json, permanent_registered_users.json, etc.).
 * Strict Zero-Deletion Policy: Real registered user accounts are permanently retained in storage and never purged.
 */
export const PERMANENT_REGISTERED_USERS: User[] = [
  {
    id: 'usr_admin_emmanuel',
    fullName: 'Emmanuel Chidalu (Super Admin)',
    phone: '08149021882',
    email: 'emmanuelchidalu67@gmail.com',
    isPhoneVerified: true,
    passwordHash: '241166',
    referralCode: 'MOTO777',
    role: 'admin',
    vipLevel: 10,
    balance: 1500000,
    totalInvested: 2000000,
    totalEarned: 1800000,
    totalReferralBonus: 450000,
    totalWithdrawn: 600000,
    welcomeBonusClaimed: true,
    spinsAvailable: 25,
    createdAt: '2026-06-01T08:00:00.000Z',
    bankAccount: {
      bankName: 'PalmPay (PalmPay Limited)',
      bankCode: '999991',
      accountNumber: '8149021882',
      accountName: 'EMMANUEL CHIDALU ADMIN',
      updatedAt: '2026-06-01T08:00:00.000Z',
    },
  },
];

export const PERMANENT_INVESTMENTS: Investment[] = [];

export const PERMANENT_TRANSACTIONS: Transaction[] = [];
