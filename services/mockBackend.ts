
import { User, Transaction, GoldPrice, Role, PaymentMethodInfo, MiningSubscription, MiningPackageConfig, SystemConfig } from '../types';

const DB_KEY = 'AURO_DB_V5';

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
  buy: 13500.00,
  sell: 12800.00,
  lastUpdated: new Date().toISOString(),
  trend: 'UP'
};

const INITIAL_DB: DB = {
  users: [
    {
      id: 'admin-001',
      name: 'Auro Administrator',
      email: 'admin@auro.com',
      role: 'ADMIN',
      balanceFiat: 0,
      balanceGold: 0,
      lockedGold: 0,
      referralCode: 'ADMIN',
      avatarUrl: 'https://picsum.photos/200'
    }
  ],
  transactions: [],
  price: INITIAL_PRICE,
  priceHistory: [
     { date: '2023-10-20', price: 12100.00 },
     { date: '2023-10-21', price: 12250.00 },
     { date: '2023-10-22', price: 12200.00 },
     { date: '2023-10-23', price: 12800.00 },
     { date: '2023-10-24', price: 13100.00 },
     { date: '2023-10-25', price: 13500.00 },
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
      if (!u.referralCode) u.referralCode = 'REF-' + u.id.slice(0,6).toUpperCase();
  });
  return db;
};

const saveDB = (db: DB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const mockBackend = {
  async login(email: string, password: string): Promise<User> {
    await delay(800);
    const db = getDB();
    
    if (email === 'admin@auro.com' && password === 'admin123') {
      return db.users.find(u => u.email === email)!;
    }

    const user = db.users.find(u => u.email === email);
    if (user) {
      // Check for mining updates on login
      await mockBackend.checkMiningStatus(user.id);
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
    if (referralCode) {
        const referrerIndex = db.users.findIndex(u => u.referralCode === referralCode);
        if (referrerIndex !== -1) {
            const referrer = db.users[referrerIndex];
            referredBy = referrer.id;
            
            // Signup Bonus: 50 BDT converted to GOLD instantly
            // We use the Buy Price because that is the cost to acquire gold
            const bonusFiat = 50;
            const conversionRate = db.price.buy;
            const bonusGold = bonusFiat / conversionRate;
            
            referrer.balanceGold = (referrer.balanceGold || 0) + bonusGold;
            db.users[referrerIndex] = referrer;
        }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role: 'USER',
      balanceFiat: 0, 
      balanceGold: 0,
      lockedGold: 0,
      referralCode: 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
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
    await mockBackend.checkMiningStatus(id);
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

  async buyGold(userId: string, grams: number, paymentMethodId: string, screenshotFile: string): Promise<Transaction> {
    await delay(1500);
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = db.users[userIndex];
    const cost = grams * db.price.buy;
    const paymentMethod = db.paymentMethods.find(p => p.id === paymentMethodId);

    const tx: Transaction = {
      id: crypto.randomUUID(),
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
    
    if (tx.type === 'BUY') {
         const finalGoldAmount = tx.amountGold || 0;
         const userIndex = db.users.findIndex(u => u.id === tx.userId);
         if (userIndex !== -1) {
           const user = db.users[userIndex];
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
         }
        tx.status = 'COMPLETED';
    } else if (tx.type === 'SELL') {
        // Credit the user's fiat balance with the sale proceeds
        const userIndex = db.users.findIndex(u => u.id === tx.userId);
        if (userIndex !== -1) {
            db.users[userIndex].balanceFiat = (db.users[userIndex].balanceFiat || 0) + tx.amountFiat;
        }
        tx.status = 'COMPLETED';
    }

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
    
    // If SELL, refund the gold (note: refund to available balance)
    if (tx.type === 'SELL' && tx.status === 'PENDING') {
         const userIndex = db.users.findIndex(u => u.id === tx.userId);
         if (userIndex !== -1) {
             db.users[userIndex].balanceGold += tx.amountGold!;
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
    // We count both COMPLETED and PENDING as attempts
    const previousSells = db.transactions.filter(t => 
        t.userId === userId && 
        t.type === 'SELL' && 
        (t.status === 'COMPLETED' || t.status === 'PENDING')
    );
    
    // Logic: First time sell min 0.05g, next sells min 1.00g
    const isFirstSell = previousSells.length === 0;
    const minAmount = isFirstSell ? 0.05 : 1.00;

    if (grams < minAmount) {
        throw new Error(`Minimum sell amount is ${minAmount.toFixed(2)}g (${isFirstSell ? 'First time offer' : 'Standard limit'}).`);
    }
    
    // Validate against AVAILABLE gold (Total - Locked)
    const availableGold = user.balanceGold - (user.lockedGold || 0);

    if (availableGold < grams) {
        throw new Error(`Insufficient available gold. You have ${availableGold.toFixed(2)}g available (some may be locked in mining).`);
    }

    const value = grams * db.price.sell;

    // Deduct gold immediately
    user.balanceGold -= grams;
    
    const tx: Transaction = {
      id: crypto.randomUUID(),
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
    
    // Calculate gold required based on sell price (Current Value logic)
    const requiredGold = pkg.cost / sellPrice;
    const availableGold = user.balanceGold - (user.lockedGold || 0);

    if (availableGold < requiredGold) {
        throw new Error(`Insufficient gold value. You need approx ${requiredGold.toFixed(2)}g available to lock ৳${pkg.cost.toLocaleString()}.`);
    }

    // Lock the gold
    user.lockedGold = (user.lockedGold || 0) + requiredGold;

    // Create Subscription
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // 30 Days from now

    const sub: MiningSubscription = {
      id: crypto.randomUUID(),
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
            
            // Check for payout
            // Calculate days elapsed since last payout
            const diffMs = now.getTime() - lastPay.getTime();
            const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (daysElapsed >= 1) {
                // Credit User
                const profit = daysElapsed * sub.dailyProfit;
                db.users[userIndex].balanceFiat = (db.users[userIndex].balanceFiat || 0) + profit;
                
                // Update lastPayout pointer
                const newLastPayout = new Date(lastPay);
                newLastPayout.setDate(newLastPayout.getDate() + daysElapsed);
                sub.lastPayout = newLastPayout.toISOString();
                userUpdated = true;
            }

            // Check for expiration
            if (now >= end) {
                // Unlock Gold
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
