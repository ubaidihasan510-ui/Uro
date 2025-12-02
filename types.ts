
export type Role = 'USER' | 'ADMIN';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  balanceFiat: number; // Used for accumulating Mining Profits (BDT) + Referral Earnings
  balanceGold: number; // Total Grams
  lockedGold: number; // Grams locked in mining
  referralCode: string; // Unique code to share
  referredBy?: string; // ID of the user who referred this user
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT';
  status: TransactionStatus;
  amountGold?: number; // Grams
  amountFiat: number; // BDT
  pricePerGram: number; // At time of transaction
  timestamp: string;
  screenshotUrl?: string;
  paymentMethod?: string;
  userPaymentDetails?: string; // For SELL: User provides where they want money
}

export interface GoldPrice {
  buy: number; // Price to buy 1g
  sell: number; // Price to sell 1g
  lastUpdated: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface PaymentMethodInfo {
  id: string;
  name: string;
  details: string;
}

export interface MiningPackageConfig {
  id: string;
  name: string;
  cost: number; // BDT
  dailyProfit: number; // BDT
}

export interface MiningSubscription {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  packageCost: number; // BDT (at time of purchase)
  dailyProfit: number; // BDT (at time of purchase)
  lockedGoldAmount: number; // Grams locked
  startDate: string;
  endDate: string;
  lastPayout: string; // Timestamp of last daily credit
  status: 'ACTIVE' | 'COMPLETED';
}

export interface SystemConfig {
  referralCommissionRate: number; // e.g. 0.05 for 5%
}
