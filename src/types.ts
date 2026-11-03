export type VIPLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  isPhoneVerified: boolean;
  passwordHash?: string;
  referralCode: string;
  referredBy?: string;
  role: 'user' | 'admin';
  vipLevel: VIPLevel;
  
  // Balances
  balance: number;               // Main wallet balance
  totalInvested: number;         // Total active capital invested
  totalEarned: number;           // Total daily earnings collected
  totalReferralBonus: number;    // Referral earnings
  totalWithdrawn: number;        // Total approved withdrawals
  
  // Bonuses & Timers
  welcomeBonusClaimed: boolean;
  lastDailyClaimTimestamp?: number; // Last 24hr claim time
  spinsAvailable: number;        // Available spin wheel turns
  
  // Bank Account Details & Withdrawal PIN
  withdrawalPin?: string;        // 4-digit secret security PIN for withdrawals
  bankAccount?: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    withdrawalPin?: string;
    updatedAt: string;
  };
  
  avatarUrl?: string;
  isBanned?: boolean;
  withdrawalBanned?: boolean;
  withdrawalBanReason?: string;
  createdAt: string;
}

export interface VIPPlan {
  id: string;
  level: VIPLevel;
  name: string;
  capital: number;         // Minimum capital in Naira
  dailyEarning: number;    // Daily profit in Naira
  durationDays: number;    // Total contract duration
  totalInvestment: number; // Total ROI (Capital + Profit or Profit)
  badgeColor: string;
  description: string;
  popular?: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  userPhone: string;
  planLevel: VIPLevel;
  planName: string;
  capital: number;
  dailyEarning: number;
  totalInvestment: number;
  durationDays: number;
  daysCompleted: number;
  totalEarnedSoFar: number;
  lastSettlementTimestamp: number; // Timestamp of last 24h payout
  nextSettlementTimestamp: number; // Timestamp of next 24h payout
  status: 'active' | 'completed';
  purchasedAt: string;
  createdAt?: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'daily_earning' | 'referral_bonus' | 'spin_win' | 'welcome_bonus' | 'investment_completed' | 'vtu_airtime' | 'vtu_data';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  userPhone: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  netAmount?: number;
  status: TransactionStatus;
  
  // Deposit specific
  paymentMethod?: string;
  proofReference?: string;
  paymentProofUrl?: string;
  
  // Withdrawal specific
  bankName?: string;
  accountNumber?: string;
  accountName?: string;

  // VTU specific (Airtime & Cheap Data)
  vtuNetwork?: 'MTN' | 'Airtel' | 'Glo' | '9mobile' | string;
  vtuPhone?: string;
  vtuPlan?: string; // e.g. "1GB Direct 30 Days" or "₦1,000 Airtime"
  vtuDataAmount?: string; // e.g. "500MB", "1GB", "2GB", "5GB", "10GB", "20GB", "40GB"
  vtuDiscountSaved?: number; // e.g. 30
  senderBankName?: string;
  senderAccountName?: string;
  
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
  creditedAt?: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  slug?: string;
  category?: string;
}

export interface AdminSettings {
  adminBankName: string;
  adminAccountNumber: string;
  adminAccountName: string;
  adminUssdCode?: string;
  // Aliases for compatibility
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  supportWhatsApp: string;
  supportTelegramGroup: string;
  whatsappChannelLink?: string; // Admin-controlled WhatsApp Channel/Group URL
  telegramGroupLink?: string; // Admin-controlled Telegram Group URL
  supportLiveChatUrl: string;
  supportPhone?: string;
  supportEmail?: string;
  welcomeBonusAmount: number; // e.g. 500
  dailyClaimAmount: number;   // e.g. 50
  minDepositAmount: number;   // e.g. 3000
  minWithdrawalAmount: number; // e.g. 700 or 1000
  maxWithdrawalAmount?: number; // e.g. 1000000
  withdrawalFeePercent: number; // e.g. 15%
  withdrawalOpenHour: number; // 9 AM
  withdrawalCloseHour: number; // 18 (6 PM)
  withdrawalDropTime?: string; // e.g. "8:00 PM"
  withdrawalDisallowedDays?: number[]; // [0, 3] = Sunday (0) & Wednesday (3)
  tier1BonusPercent: number;  // 20%
  tier2BonusPercent: number;  // 3%
  tier3BonusPercent: number;  // 2%
  tier4BonusPercent: number;  // 1%
  tier5BonusPercent: number;  // 1%
  customReferralLink?: string; // Custom referral link or domain configured by admin
  adminForcedSpinRewardId?: string; // Admin override: forced spin wheel reward outcome
  announcementMessage?: string; // Custom admin broadcast announcement message
  announcementEnabled?: boolean; // Toggle announcement banner visibility
  // VTU Telecommunications (Airtime & Data)
  vtuEnabled?: boolean;
  vtuAirtimeDiscountPercent?: number; // default 3%
  vtuAnnouncement?: string;
}

export interface SpinReward {
  id: string;
  label: string;
  amount: number;
  color: string;
  textColor: string;
  probability: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert' | 'promo';
  timestamp: string;
  read?: boolean;
}

export interface TopUpCode {
  id: string;
  code: string;
  amount: number;
  maxRedemptions: number;
  timesRedeemed: number;
  redeemedUserIds: string[];
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
}

export interface ReferralMember {
  userId: string;
  fullName: string;
  phone: string;
  tier: 1 | 2 | 3 | 4 | 5;
  registeredAt: string;
  totalInvested: number;
  commissionEarned: number;
}

export interface TopInvestor {
  id: string;
  phone: string;
  name: string;
  totalInvested: number;
  vipLevel: VIPLevel;
  payoutEarned: number;
  avatar: string;
}
