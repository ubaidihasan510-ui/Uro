
import { v4 as uuidv4 } from "uuid";
import { User, Transaction, GoldPrice, Role, PaymentMethodInfo, MiningSubscription, MiningPackageConfig, SystemConfig, ReferralCode } from '../types';

// --- CONFIGURATION ---
// Set this to true when deploying to cPanel with the provided PHP API
const USE_LIVE_API = false;
const API_BASE = '/api/index.php'; // Path to PHP API relative to domain root

// ==========================================
// REMOTE BACKEND (REAL PHP/MYSQL)
// ==========================================

const RemoteBackend = {
    async request(action: string, method: string = 'GET', body?: any) {
        const url = `${API_BASE}?action=${action}` + (method === 'GET' && body ? '&' + new URLSearchParams(body) : '');
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify(body) : undefined
        };
        const res = await fetch(url, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API Request Failed');
        return data;
    },

    async login(email: string, password: string): Promise<User> {
        return this.request('login', 'POST', { email, password });
    },
    async register(name: string, email: string, password: string, referralCode?: string): Promise<User> {
        return this.request('register', 'POST', { name, email, password, referralCode });
    },
    async getUser(id: string): Promise<User | undefined> {
        try { return await this.request('get_user', 'GET', { id }); } catch { return undefined; }
    },
    async getPrice(): Promise<GoldPrice> {
        return this.request('get_price');
    },
    async setPrice(buy: number, sell: number): Promise<GoldPrice> {
        return this.request('set_price', 'POST', { buy, sell });
    },
    async getPriceHistory(): Promise<{date: string, price: number}[]> {
        return this.request('get_history');
    },
    async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
        return this.request('get_payment_methods');
    },
    async updatePaymentMethod(id: string, details: string): Promise<void> {
        // Not implemented in simple PHP demo for update, assuming DB edit
        // But for completeness:
        // return this.request('update_payment', 'POST', {id, details});
    },
    async requestActivation(userId: string, paymentMethodId: string, screenshotFile: string): Promise<Transaction> {
        return this.request('transaction', 'POST', {
            userId, type: 'ACTIVATION', amountFiat: 100, paymentMethod: paymentMethodId, screenshotUrl: screenshotFile
        });
    },
    async buyGold(userId: string, grams: number, paymentMethodId: string, screenshotFile: string): Promise<Transaction> {
        const price = await this.getPrice();
        return this.request('transaction', 'POST', {
            userId, type: 'BUY', amountGold: grams, amountFiat: grams * price.buy, pricePerGram: price.buy,
            paymentMethod: paymentMethodId, screenshotUrl: screenshotFile
        });
    },
    async sellGold(userId: string, grams: number, userPaymentDetails: string): Promise<Transaction> {
        const price = await this.getPrice();
        return this.request('transaction', 'POST', {
            userId, type: 'SELL', amountGold: grams, amountFiat: grams * price.sell, pricePerGram: price.sell,
            userPaymentDetails
        });
    },
    async approveTransaction(txId: string): Promise<Transaction> {
        await this.request('approve_transaction', 'POST', { txId });
        return { id: txId, status: 'COMPLETED' } as any; // Partial return OK for UI refresh
    },
    async rejectTransaction(txId: string): Promise<Transaction> {
        await this.request('reject_transaction', 'POST', { txId });
        return { id: txId, status: 'REJECTED' } as any;
    },
    async getTransactions(userId?: string): Promise<Transaction[]> {
        return this.request('get_transactions', 'GET', { userId });
    },
    async getMiningPackages(): Promise<MiningPackageConfig[]> {
        return this.request('get_mining_packages');
    },
    async updateMiningPackage(pkg: MiningPackageConfig): Promise<void> {
        // Not implemented in PHP shim
    },
    async activateMiningPackage(userId: string, pkgId: string): Promise<MiningSubscription> {
        return this.request('activate_mining', 'POST', { userId, packageId: pkgId });
    },
    async getMiningSubscriptions(userId: string): Promise<MiningSubscription[]> {
        return this.request('get_mining_subscriptions', 'GET', { userId });
    },
    async checkMiningStatus(userId: string): Promise<void> {
        // Handled server side on get_user
    },
    async getSystemConfig(): Promise<SystemConfig> {
        return this.request('get_config');
    },
    async updateReferralRate(rate: number): Promise<void> {
        // Not implemented in PHP shim
    }
};


// ==========================================
// LOCAL MOCK BACKEND (SIMULATION)
// ==========================================

const DB_KEY = 'AURO_DB_V8';

interface DB {
  users: User[];
  transactions: Transaction[];
  price: GoldPrice;
  priceHistory: { date: string; price: number }[];
  paymentMethods: PaymentMethodInfo[];
  miningPackages: MiningPackageConfig[];
  miningSubscriptions: MiningSubscription[];
  systemConfig: SystemConfig;
}

// Updated to realistic BDT prices per gram
const INITIAL_PRICE: GoldPrice = {
  buy: 16468.90,
  sell: 15800.00,
  lastUpdated: new Date().toISOString(),
  trend: 'UP'
};

const INITIAL_DB: DB = {
  users: [
    {
      id: 'admin-001',
      name: 'Auro Administrator',
      email: 'ubaidihasan510@gmail.com',
      role: 'ADMIN',
      balanceFiat: 0,
      balanceGold: 0,
      lockedGold: 0,
      referralStatus: 'ACTIVE',
      referralCodes: [
          { code: 'ADMIN-01', isUsed: false },
          { code: 'ADMIN-02', isUsed: false },
          { code: 'ADMIN-03', isUsed: false },
          { code: 'ADMIN-04', isUsed: false }
      ],
      avatarUrl: 'https://picsum.photos/200'
    }
  ],
  transactions: [],
  price: INITIAL_PRICE,
  priceHistory: [
     { date: '2025-10-20', price: 15900.00 },
     { date: '2025-10-21', price: 16100.00 },
     { date: '2025-10-22', price: 16050.00 },
     { date: '2025-10-23', price: 16250.00 },
     { date: '2025-10-24', price: 16380.00 },
     { date: '2025-10-25', price: 16468.90 },
  ],
  paymentMethods: [
    { 
      id: 'bank', 
      name: 'Bank Transfer', 
      details: 'Bank: City Bank\nAccount: 123456789\nName: Auro Gold Ltd.\nRef: Your User ID' 
    },
    { 
      id: 'bkash', 
      name: 'Bkash / Nagad', 
      details: 'Send Money to: 01700000000 (Personal)\nReference: Your User ID' 
    }
  ],
  miningPackages: [
    { id: 'p1', name: 'Starter Rig', cost: 1000, dailyProfit: 5 },
    { id: 'p2', name: 'Advanced Operation', cost: 10000, dailyProfit: 70 },
    { id: 'p3', name: 'Industrial Complex', cost: 100000, dailyProfit: 900 }
  ],
  miningSubscriptions: [],
  systemConfig: {
    referralCommissionRate: 0.05 // 5% default
  }
};

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getDB = (): DB => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
    return INITIAL_DB;
  }
  const db = JSON.parse(stored);
  // Migration for old DBs
  if (!db.miningSubscriptions) db.miningSubscriptions = [];
  if (!db.miningPackages) db.miningPackages = INITIAL_DB.miningPackages;
  if (!db.systemConfig) db.systemConfig = INITIAL_DB.systemConfig;
  
  db.users.forEach((u: any) => { 
      if (u.lockedGold === undefined) u.lockedGold = 0; 
      // Migrate old referralCode string to new array structure if needed
      if (!u.referralCodes) {
          u.referralStatus = 'INACTIVE';
          u.referralCodes = [];
      }
      // Ensure admin is always active
      if (u.role === 'ADMIN' && u.referralStatus !== 'ACTIVE') {
          u.referralStatus = 'ACTIVE';
          if(u.referralCodes.length === 0) {
              u.referralCodes = [
                { code: 'ADMIN-01', isUsed: false },
                { code: 'ADMIN-02', isUsed: false },
                { code: 'ADMIN-03', isUsed: false },
                { code: 'ADMIN-04', isUsed: false }
              ];
          }
      }
  });
  return db;
};

const saveDB = (db: DB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const LocalBackend = {
  async login(email: string, password: string): Promise<User> {
    await delay(800);
    const db = getDB();
    
    if (email === 'ubaidihasan510@gmail.com' && password === '558510') {
      return db.users.find(u => u.email === email)!;
    }

    const user = db.users.find(u => u.email === email);
    if (user) {
      // Check for mining updates on login
      await LocalBackend.checkMiningStatus(user.id);
      return getDB().users.find(u => u.id === user.id)!;
    }
    throw new Error('Invalid credentials');
  },

  async register(name: string, email: string, password: string, referralCode?: string): Promise<User> {
    await delay(800);
    const db = getDB();
    if (db.users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    let referredBy: string | undefined;
    
    // Referral Logic
    if (referralCode) {
        // Find user who owns this specific code AND it is unused
        let referrerIndex = -1;
        let codeIndex = -1;

        for (let i = 0; i < db.users.length; i++) {
            const u = db.users[i];
            const cIdx = u.referralCodes.findIndex(rc => rc.code === referralCode && !rc.isUsed);
            if (cIdx !== -1) {
                referrerIndex = i;
                codeIndex = cIdx;
                break;
            }
        }

        if (referrerIndex !== -1) {
            const referrer = db.users[referrerIndex];
            referredBy = referrer.id;
            
            // Mark code as used
            referrer.referralCodes[codeIndex].isUsed = true;

            // Signup Bonus: 50 BDT converted to GOLD instantly
            const bonusFiat = 50;
            const conversionRate = db.price.buy;
            const bonusGold = bonusFiat / conversionRate;
            
            referrer.balanceGold = (referrer.balanceGold || 0) + bonusGold;
            db.users[referrerIndex] = referrer;
        } else {
            // Code provided but invalid or used
             throw new Error("Invalid or expired referral code.");
        }
    }

    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      role: 'USER',
      balanceFiat: 0, 
      balanceGold: 0,
      lockedGold: 0,
      referralStatus: 'INACTIVE',
      referralCodes: [],
      referredBy,
      avatarUrl: `https://picsum.photos/seed/${email}/200`
    };

    db.users.push(newUser);
    saveDB(db);
    return newUser;
  },

  async getUser(id: string): Promise<User | undefined> {
    await delay(300);
    // Check for mining updates whenever user data is refreshed
    await LocalBackend.checkMiningStatus(id);
    const db = getDB();
    return db.users.find(u => u.id === id);
  },

  async getPrice(): Promise<GoldPrice> {
    await delay(200);
    return getDB().price;
  },

  async setPrice(buy: number, sell: number): Promise<GoldPrice> {
    await delay(500);
    const db = getDB();
    const oldPrice = db.price.buy;
    
    db.price = {
      buy,
      sell,
      lastUpdated: new Date().toISOString(),
      trend: buy > oldPrice ? 'UP' : buy < oldPrice ? 'DOWN' : 'STABLE'
    };
    
    db.priceHistory.push({
      date: new Date().toISOString().split('T')[0],
      price: buy
    });
    if(db.priceHistory.length > 30) db.priceHistory.shift();

    saveDB(db);
    return db.price;
  },

  async getPriceHistory(): Promise<{date: string, price: number}[]> {
      await delay(300);
      return getDB().priceHistory;
  },

  async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
    await delay(200);
    return getDB().paymentMethods;
  },

  async updatePaymentMethod(id: string, details: string): Promise<void> {
    await delay(500);
    const db = getDB();
    const idx = db.paymentMethods.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.paymentMethods[idx].details = details;
      saveDB(db);
    }
  },

  async requestActivation(userId: string, paymentMethodId: string, screenshotFile: string): Promise<Transaction> {
      await delay(1200);
      const db = getDB();
      const userIndex = db.users.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error('User not found');
      
      const user = db.users[userIndex];
      // Check if already active or pending
      if (user.referralStatus === 'ACTIVE') throw new Error('Account already active.');
      if (user.referralStatus === 'PENDING') throw new Error('Activation already pending.');

      const paymentMethod = db.paymentMethods.find(p => p.id === paymentMethodId);
      
      // Activation Fee
      const amountFiat = 100;

      const tx: Transaction = {
          id: uuidv4(),
          userId,
          userName: user.name,
          type: 'ACTIVATION',
          status: 'PENDING',
          amountFiat,
          timestamp: new Date().toISOString(),
          paymentMethod: paymentMethod?.name || 'External',
          screenshotUrl: screenshotFile
      };

      // Set user to pending status immediately? Or wait for approve?
      // Usually good to show PENDING status on user profile
      user.referralStatus = 'PENDING';
      
      db.users[userIndex] = user;
      db.transactions.unshift(tx);
      saveDB(db);
      return tx;
  },

  async buyGold(userId: string, grams: number, paymentMethodId: string, screenshotFile: string): Promise<Transaction> {
    await delay(1500);
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = db.users[userIndex];
    const cost = grams * db.price.buy;
    const paymentMethod = db.paymentMethods.find(p => p.id === paymentMethodId);

    const tx: Transaction = {
      id: uuidv4(),
      userId,
      userName: user.name,
      type: 'BUY',
      status: 'PENDING',
      amountGold: grams,
      amountFiat: cost, 
      pricePerGram: db.price.buy,
      timestamp: new Date().toISOString(),
      paymentMethod: paymentMethod?.name || 'External',
      screenshotUrl: screenshotFile 
    };

    db.transactions.unshift(tx);
    saveDB(db);
    return tx;
  },

  async approveTransaction(txId: string): Promise<Transaction> {
    await delay(1000);
    const db = getDB();
    const txIndex = db.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) throw new Error('Transaction not found');
    const tx = db.transactions[txIndex];
    
    if (tx.status !== 'PENDING') throw new Error('Transaction is not pending');
    
    const userIndex = db.users.findIndex(u => u.id === tx.userId);
    if (userIndex !== -1) {
        const user = db.users[userIndex];

        if (tx.type === 'ACTIVATION') {
            // Activate User Referral
            user.referralStatus = 'ACTIVE';
            
            // Generate 4 Unique Codes
            const baseCode = 'REF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            user.referralCodes = [
                { code: `${baseCode}-01`, isUsed: false },
                { code: `${baseCode}-02`, isUsed: false },
                { code: `${baseCode}-03`, isUsed: false },
                { code: `${baseCode}-04`, isUsed: false }
            ];
            db.users[userIndex] = user;
        } 
        else if (tx.type === 'BUY') {
            const finalGoldAmount = tx.amountGold || 0;
            user.balanceGold += finalGoldAmount;
           
            // Referral Commission Logic
            if (user.referredBy) {
               const referrerIndex = db.users.findIndex(r => r.id === user.referredBy);
               if (referrerIndex !== -1) {
                   const referrer = db.users[referrerIndex];
                   const commissionRate = db.systemConfig.referralCommissionRate;
                   const commissionFiat = tx.amountFiat * commissionRate;
                   
                   // Convert commission to Gold at current Buy Price
                   const currentBuyPrice = db.price.buy;
                   const commissionGold = commissionFiat / currentBuyPrice;

                   referrer.balanceGold = (referrer.balanceGold || 0) + commissionGold;
                   db.users[referrerIndex] = referrer;
               }
            }
            db.users[userIndex] = user;
        } 
        else if (tx.type === 'SELL') {
            // Credit the user's fiat balance with the sale proceeds
            user.balanceFiat = (user.balanceFiat || 0) + tx.amountFiat;
            db.users[userIndex] = user;
        }
    }

    tx.status = 'COMPLETED';
    db.transactions[txIndex] = tx;
    saveDB(db);
    return tx;
  },

  async rejectTransaction(txId: string): Promise<Transaction> {
    await delay(500);
    const db = getDB();
    const txIndex = db.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) throw new Error('Transaction not found');
    
    const tx = db.transactions[txIndex];
    const userIndex = db.users.findIndex(u => u.id === tx.userId);

    // If SELL, refund the gold (note: refund to available balance)
    if (tx.type === 'SELL' && tx.status === 'PENDING') {
         if (userIndex !== -1) {
             db.users[userIndex].balanceGold += tx.amountGold!;
         }
    }
    
    // If Activation Rejected, reset status to INACTIVE so they can try again
    if (tx.type === 'ACTIVATION' && tx.status === 'PENDING') {
        if (userIndex !== -1) {
            db.users[userIndex].referralStatus = 'INACTIVE';
        }
    }

    tx.status = 'REJECTED';
    db.transactions[txIndex] = tx;
    saveDB(db);
    return tx;
  },

  async sellGold(userId: string, grams: number, userPaymentDetails: string): Promise<Transaction> {
    await delay(1000);
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = db.users[userIndex];
    
    // Check previous sells to determine minimum amount
    const previousSells = db.transactions.filter(t => 
        t.userId === userId && 
        t.type === 'SELL' && 
        (t.status === 'COMPLETED' || t.status === 'PENDING')
    );
    
    const isFirstSell = previousSells.length === 0;
    const minAmount = isFirstSell ? 0.05 : 1.00;

    if (grams < minAmount) {
        throw new Error(`Minimum sell amount is ${minAmount.toFixed(2)}g (${isFirstSell ? 'First time offer' : 'Standard limit'}).`);
    }
    
    const availableGold = user.balanceGold - (user.lockedGold || 0);

    if (availableGold < grams) {
        throw new Error(`Insufficient available gold. You have ${availableGold.toFixed(2)}g available.`);
    }

    const value = grams * db.price.sell;

    // Deduct gold immediately
    user.balanceGold -= grams;
    
    const tx: Transaction = {
      id: uuidv4(),
      userId,
      userName: user.name,
      type: 'SELL',
      status: 'PENDING',
      amountGold: grams,
      amountFiat: value,
      pricePerGram: db.price.sell,
      timestamp: new Date().toISOString(),
      userPaymentDetails
    };

    db.transactions.unshift(tx);
    db.users[userIndex] = user;
    saveDB(db);
    return tx;
  },

  async getTransactions(userId?: string): Promise<Transaction[]> {
    await delay(500);
    const db = getDB();
    if (userId) {
      return db.transactions.filter(t => t.userId === userId);
    }
    return db.transactions;
  },

  // --- MINING / STAKING LOGIC ---

  async getMiningPackages(): Promise<MiningPackageConfig[]> {
    await delay(300);
    return getDB().miningPackages;
  },

  async updateMiningPackage(pkg: MiningPackageConfig): Promise<void> {
    await delay(500);
    const db = getDB();
    const idx = db.miningPackages.findIndex(p => p.id === pkg.id);
    if (idx !== -1) {
      db.miningPackages[idx] = pkg;
      saveDB(db);
    }
  },

  async activateMiningPackage(userId: string, pkgId: string): Promise<MiningSubscription> {
    await delay(1000);
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    
    const pkg = db.miningPackages.find(p => p.id === pkgId);
    if (!pkg) throw new Error('Package not found');

    const user = db.users[userIndex];
    const sellPrice = db.price.sell;
    
    const requiredGold = pkg.cost / sellPrice;
    const availableGold = user.balanceGold - (user.lockedGold || 0);

    if (availableGold < requiredGold) {
        throw new Error(`Insufficient gold value. You need approx ${requiredGold.toFixed(2)}g available.`);
    }

    user.lockedGold = (user.lockedGold || 0) + requiredGold;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); 

    const sub: MiningSubscription = {
      id: uuidv4(),
      userId,
      packageId: pkg.id,
      packageName: pkg.name,
      packageCost: pkg.cost,
      dailyProfit: pkg.dailyProfit,
      lockedGoldAmount: requiredGold,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      lastPayout: now.toISOString(),
      status: 'ACTIVE'
    };

    db.miningSubscriptions.unshift(sub);
    db.users[userIndex] = user;
    saveDB(db);
    return sub;
  },

  async getMiningSubscriptions(userId: string): Promise<MiningSubscription[]> {
      await delay(500);
      const db = getDB();
      return db.miningSubscriptions.filter(s => s.userId === userId);
  },

  async checkMiningStatus(userId: string): Promise<void> {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    let userUpdated = false;
    const now = new Date();

    db.miningSubscriptions.forEach(sub => {
        if (sub.userId === userId && sub.status === 'ACTIVE') {
            const end = new Date(sub.endDate);
            const lastPay = new Date(sub.lastPayout);
            
            const diffMs = now.getTime() - lastPay.getTime();
            const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (daysElapsed >= 1) {
                const profit = daysElapsed * sub.dailyProfit;
                db.users[userIndex].balanceFiat = (db.users[userIndex].balanceFiat || 0) + profit;
                
                const newLastPayout = new Date(lastPay);
                newLastPayout.setDate(newLastPayout.getDate() + daysElapsed);
                sub.lastPayout = newLastPayout.toISOString();
                userUpdated = true;
            }

            if (now >= end) {
                db.users[userIndex].lockedGold = Math.max(0, (db.users[userIndex].lockedGold || 0) - sub.lockedGoldAmount);
                sub.status = 'COMPLETED';
                userUpdated = true;
            }
        }
    });

    if (userUpdated) {
        saveDB(db);
    }
  },

  async getSystemConfig(): Promise<SystemConfig> {
      await delay(200);
      return getDB().systemConfig;
  },

  async updateReferralRate(rate: number): Promise<void> {
      await delay(500);
      const db = getDB();
      db.systemConfig.referralCommissionRate = rate;
      saveDB(db);
  }
};

// Export the selected backend
export const mockBackend = USE_LIVE_API ? RemoteBackend : LocalBackend;
