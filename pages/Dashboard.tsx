
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { GoldPrice, Transaction, PaymentMethodInfo } from '../types';
import { Button } from '../components/Button';
import { ArrowUpRight, ArrowDownRight, CheckCircle, X, UploadCloud, Clock, Coins, Lock, TrendingUp, Copy, Users, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [price, setPrice] = useState<GoldPrice | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{date: string, price: number}[]>([]);
  const [successTxn, setSuccessTxn] = useState<Transaction | null>(null);
  
  // Payment States
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [sellPaymentDetails, setSellPaymentDetails] = useState('');

  // UI States
  const [copied, setCopied] = useState(false);
  const [minSellLimit, setMinSellLimit] = useState(0.05);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const p = await mockBackend.getPrice();
    setPrice(p);
    const h = await mockBackend.getPriceHistory();
    setHistory(h);
    const pm = await mockBackend.getPaymentMethods();
    setPaymentMethods(pm);
    if(pm.length > 0 && !selectedMethod) setSelectedMethod(pm[0].id);
    await refreshUser();

    // Determine min sell limit
    if (user) {
        const txs = await mockBackend.getTransactions(user.id);
        const previousSells = txs.filter(t => t.type === 'SELL' && (t.status === 'COMPLETED' || t.status === 'PENDING'));
        setMinSellLimit(previousSells.length === 0 ? 0.05 : 1.00);
    }
  };

  const handleTrade = async () => {
    if (!user || !price || !tradeAmount) return;
    try {
      setLoading(true);
      let txn;
      if (tradeType === 'BUY') {
        if (!screenshot) {
            alert("Please upload a payment screenshot.");
            setLoading(false);
            return;
        }
        // Simulate file upload by just passing name/fake url
        const fakeFileUrl = `uploaded_ss_${Date.now()}.jpg`;
        txn = await mockBackend.buyGold(user.id, parseFloat(tradeAmount), selectedMethod, fakeFileUrl);
      } else {
        if (!sellPaymentDetails) {
            alert("Please enter your payment details to receive funds.");
            setLoading(false);
            return;
        }
        txn = await mockBackend.sellGold(user.id, parseFloat(tradeAmount), sellPaymentDetails);
      }
      setTradeAmount('');
      setScreenshot(null);
      setSellPaymentDetails('');
      setSuccessTxn(txn); 
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setSuccessTxn(null);
  };

  const copyReferral = () => {
      if (user?.referralCode) {
          navigator.clipboard.writeText(user.referralCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  if (!user || !price) return <div className="text-gold-400 animate-pulse">Loading market data...</div>;

  const currentPaymentInfo = paymentMethods.find(p => p.id === selectedMethod);

  // Calculate Current Value in BDT
  // Logic: (Gold Holdings * Sell Price) + Cash Balance (balanceFiat)
  const goldValue = user.balanceGold * price.sell;
  const cashBalance = user.balanceFiat || 0;
  const totalValue = goldValue + cashBalance;
  
  const lockedGold = user.lockedGold || 0;
  const availableGold = user.balanceGold - lockedGold;

  return (
    <div className="space-y-8 relative pb-40 md:pb-0">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-zinc-100">Welcome, {user.name.split(' ')[0]}</h2>
          <p className="text-zinc-400 mt-1">Your portfolio overview</p>
        </div>
        <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Live Gold Price (1g)</p>
            <div className={`text-2xl font-bold flex items-center justify-end gap-2 ${price.trend === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                ৳{price.buy.toLocaleString()}
                {price.trend === 'UP' ? <ArrowUpRight size={24}/> : <ArrowDownRight size={24}/>}
            </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Current Value Card */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-zinc-800 rounded-lg text-gold-400">
                <Coins size={24} />
            </div>
            <div>
                <p className="text-sm text-zinc-500">Current Value</p>
                <p className="text-3xl font-bold text-zinc-100 font-serif">
                   ৳{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex gap-2 text-xs text-zinc-600 mt-1">
                   <span>Gold: ৳{goldValue.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                   {cashBalance > 0 && (
                       <>
                        <span>•</span>
                        <span className="text-green-500/80 flex items-center gap-1">
                            <TrendingUp size={10} /> 
                            Cash Balance: ৳{cashBalance.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </span>
                       </>
                   )}
                </div>
            </div>
          </div>
        </div>

        {/* Gold Holdings with 3D Coin */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-gold-500/10 blur-[50px] rounded-full group-hover:bg-gold-500/20 transition-all duration-700" />
          <div className="flex justify-between items-center relative z-10 h-full">
            <div className="flex flex-col justify-center">
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Gold Holdings</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-bold text-gold-400 font-serif">{user.balanceGold.toFixed(2)}</p>
                  <p className="text-sm text-zinc-600 font-medium">g</p>
                </div>
                {lockedGold > 0 && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                        <Lock size={10} />
                        <span>{lockedGold.toFixed(2)}g Locked in Mining</span>
                    </div>
                )}
            </div>
            <div className="relative w-16 h-16 group-hover:scale-110 transition-transform duration-500 ease-out select-none">
                <div className="absolute inset-0 rounded-full bg-gold-800 transform translate-y-1 shadow-lg"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-200 via-gold-500 to-gold-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center border border-gold-400/50">
                    <div className="absolute inset-1 rounded-full border border-dashed border-gold-900/40"></div>
                    <span className="font-serif font-bold text-2xl text-gold-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">Au</span>
                    <div className="absolute top-2 left-3 w-4 h-3 bg-gradient-to-br from-white/70 to-transparent rounded-full blur-[2px] transform -rotate-12"></div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-zinc-200">Price Trend (BDT/g)</h3>
                    <span className="text-xs text-zinc-500">Last 7 Days</span>
                 </div>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D9A406" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#D9A406" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                itemStyle={{ color: '#F5C02E' }}
                                formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Price']}
                            />
                            <Area type="monotone" dataKey="price" stroke="#F5C02E" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
            </div>

            {/* Referral Card */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-gold-500/5 to-transparent pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-gold-400">
                            <Users size={20} />
                            <span className="text-sm font-medium uppercase tracking-wider">Refer & Earn</span>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-sm mb-4">
                            Invite friends to Auro. You get 50 BDT when they sign up, plus 5% of all their gold purchases forever.
                        </p>
                        <div className="flex items-center gap-2 bg-zinc-950/80 p-1.5 pl-3 rounded-lg border border-zinc-800 w-fit">
                            <span className="font-mono text-zinc-200 tracking-wider">{user.referralCode}</span>
                            <button 
                                onClick={copyReferral}
                                className={`p-1.5 rounded-md transition-colors ${
                                    copied 
                                        ? 'bg-gold-500/20 text-gold-400' 
                                        : 'hover:bg-zinc-800 text-zinc-500 hover:text-gold-400'
                                }`}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Trade Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-gold-500/20 p-6 rounded-2xl shadow-xl shadow-black/50 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-gold-400">Trade Gold</h3>
              <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                <button 
                  onClick={() => { setTradeType('BUY'); setTradeAmount(''); }}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    tradeType === 'BUY' 
                      ? 'bg-gold-500 text-zinc-900 shadow-lg' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Buy
                </button>
                <button 
                  onClick={() => { setTradeType('SELL'); setTradeAmount(''); }}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    tradeType === 'SELL' 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-zinc-400">Amount (Grams)</label>
                    <span className="text-xs text-zinc-500">
                      Price: <span className={tradeType === 'BUY' ? 'text-gold-400' : 'text-red-400'}>
                        ৳{tradeType === 'BUY' ? price.buy.toLocaleString() : price.sell.toLocaleString()}
                      </span> /g
                    </span>
                  </div>
                    <div className="relative">
                        <input 
                            type="number"
                            min={tradeType === 'SELL' ? minSellLimit : 0.1}
                            step="0.01"
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                            className={`w-full bg-zinc-950 border rounded-lg py-3 px-4 text-zinc-100 outline-none transition-all ${
                              tradeType === 'BUY' 
                                ? 'border-zinc-700 focus:border-gold-500 focus:ring-1 focus:ring-gold-500' 
                                : 'border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            }`}
                            placeholder="0.00"
                        />
                        <span className="absolute right-4 top-3 text-zinc-500 text-sm">g</span>
                    </div>
                    
                    {tradeType === 'SELL' && (
                        <>
                            <div className="text-xs text-zinc-500 mt-1 flex justify-between">
                                <span>Minimum Sell: {minSellLimit.toFixed(2)}g</span>
                                {lockedGold > 0 && (
                                    <span className="text-red-400 flex items-center gap-1">
                                        <Lock size={10} />
                                        Avail: {availableGold.toFixed(2)}g
                                    </span>
                                )}
                            </div>
                        </>
                    )}

                    <div className="flex justify-between text-sm py-2 border-t border-zinc-800 mt-4">
                        <span className="text-zinc-500">
                          {tradeType === 'BUY' ? 'Amount to Pay' : 'Estimated Value'}
                        </span>
                        <span className="text-zinc-200 font-mono font-bold">
                            ৳{tradeAmount 
                              ? (parseFloat(tradeAmount) * (tradeType === 'BUY' ? price.buy : price.sell)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                              : '0.00'}
                        </span>
                    </div>

                    {tradeType === 'BUY' && (
                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wide">Payment Method</label>
                                <select 
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value)}
                                    className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-zinc-300 text-sm outline-none focus:border-gold-500"
                                >
                                    {paymentMethods.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {currentPaymentInfo && (
                                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 whitespace-pre-line leading-relaxed">
                                    <span className="text-gold-500 font-bold block mb-1">Instructions:</span>
                                    {currentPaymentInfo.details}
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Proof of Payment</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                        className="hidden" 
                                        id="ss-upload"
                                    />
                                    <label htmlFor="ss-upload" className="flex items-center justify-center gap-2 w-full p-3 bg-zinc-950 border border-dashed border-zinc-700 rounded-lg text-zinc-400 text-sm cursor-pointer hover:border-gold-500/50 hover:text-gold-400 transition-all">
                                        <UploadCloud size={16} />
                                        {screenshot ? screenshot.name : "Upload Screenshot"}
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {tradeType === 'SELL' && (
                        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                             <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Your Payment Details</label>
                             <textarea
                                value={sellPaymentDetails}
                                onChange={(e) => setSellPaymentDetails(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-zinc-300 text-sm outline-none focus:border-red-500"
                                placeholder="E.g. Bkash Personal 017..."
                                rows={2}
                             />
                        </div>
                    )}
                </div>

                <Button 
                  onClick={handleTrade} 
                  disabled={loading || !tradeAmount}
                  isLoading={loading}
                  variant={tradeType === 'BUY' ? 'primary' : 'danger'}
                  className="w-full mt-6"
                >
                  {tradeType === 'BUY' ? 'Confirm Purchase' : 'Request Sell'}
                </Button>
            </div>
        </div>
      </div>
      
      {/* Footer Mobile Spacer is handled by padding-bottom on wrapper */}

      {/* Success Modal */}
      {successTxn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-8 relative shadow-2xl shadow-gold-900/20 transform animate-in zoom-in-95 duration-300">
                <button onClick={closeSuccessModal} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"><X size={20}/></button>
                
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-500 mb-2">
                        {successTxn.status === 'COMPLETED' ? <CheckCircle size={32} /> : <Clock size={32} />}
                    </div>
                    
                    <h3 className="text-2xl font-serif text-zinc-100">
                        {successTxn.status === 'PENDING' ? 'Submission Received' : 'Transaction Successful'}
                    </h3>
                    
                    <p className="text-zinc-400 text-sm">
                        {successTxn.type === 'BUY' && successTxn.status === 'PENDING' && "Your purchase request is under review. Gold will be credited upon approval."}
                        {successTxn.type === 'SELL' && successTxn.status === 'PENDING' && "Your sell request is processing. Funds will be sent to your account shortly."}
                    </p>

                    <div className="w-full bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-3 mt-4">
                         <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Transaction ID</span>
                            <span className="text-zinc-300 font-mono text-xs">{successTxn.id.slice(0,8)}...</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Type</span>
                            <span className={`font-medium ${successTxn.type === 'BUY' ? 'text-gold-400' : 'text-red-400'}`}>{successTxn.type}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">{successTxn.type === 'BUY' ? 'Amount Paid' : 'Value Sold'}</span>
                            <span className="text-zinc-200 font-bold">৳{successTxn.amountFiat.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Gold Amount</span>
                            <span className="text-zinc-200 font-bold">{successTxn.amountGold?.toFixed(2)}g</span>
                         </div>
                    </div>

                    <Button onClick={closeSuccessModal} className="w-full mt-4">
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
