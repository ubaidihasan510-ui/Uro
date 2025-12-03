
import React, { useEffect, useState } from 'react';
import { mockBackend } from '../services/mockBackend';
import { GoldPrice, Transaction, PaymentMethodInfo, MiningPackageConfig } from '../types';
import { Button } from '../components/Button';
import { ArrowUp, ArrowDown, Check, X, FileText, Settings, CreditCard, User as UserIcon, Send, Pickaxe, Users, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboard = () => {
  const [price, setPrice] = useState<GoldPrice | null>(null);
  const [newBuy, setNewBuy] = useState('');
  const [newSell, setNewSell] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Tabs: 'MARKET', 'APPROVALS', 'SETTINGS', 'MINING'
  const [activeTab, setActiveTab] = useState('MARKET');
  
  // Approval Data
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Settings Data
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [editDetails, setEditDetails] = useState<{[key: string]: string}>({});
  const [referralRate, setReferralRate] = useState<number>(0.05);

  // Mining Data
  const [miningPackages, setMiningPackages] = useState<MiningPackageConfig[]>([]);
  const [editMining, setEditMining] = useState<{[key: string]: MiningPackageConfig}>({});

  useEffect(() => {
    loadData();
    const interval = setInterval(loadPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const p = await mockBackend.getPrice();
    setPrice(p);
    setNewBuy(p.buy.toString());
    setNewSell(p.sell.toString());
    await loadPending();
    await loadSettings();
    await loadMining();
  };

  const loadPending = async () => {
    const all = await mockBackend.getTransactions();
    setPendingTxs(all.filter(t => t.status === 'PENDING'));
  };

  const loadSettings = async () => {
    const pm = await mockBackend.getPaymentMethods();
    setPaymentMethods(pm);
    const initialDetails: any = {};
    pm.forEach(p => initialDetails[p.id] = p.details);
    setEditDetails(initialDetails);

    const config = await mockBackend.getSystemConfig();
    setReferralRate(config.referralCommissionRate);
  };

  const loadMining = async () => {
    const pkgs = await mockBackend.getMiningPackages();
    setMiningPackages(pkgs);
    const initialMining: any = {};
    pkgs.forEach(p => initialMining[p.id] = {...p});
    setEditMining(initialMining);
  };

  const handleUpdatePrice = async () => {
    try {
      setUpdating(true);
      await mockBackend.setPrice(parseFloat(newBuy), parseFloat(newSell));
      alert('Market Price Updated');
      await loadData();
    } catch (e) {
      alert('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async (tx: Transaction) => {
    let msg = '';
    if (tx.type === 'BUY') {
        msg = `Approve BUY for ${tx.userName}? Gold will be credited to their account.`;
    } else if (tx.type === 'ACTIVATION') {
        msg = `Approve Account Activation for ${tx.userName}? 4 Referral codes will be generated for them.`;
    } else {
        msg = `Confirm SELL approval for ${tx.userName}?\n\nThe system will AUTOMATICALLY credit ৳${tx.amountFiat.toLocaleString()} to their internal Cash Balance.\n\n(No manual bank transfer required at this step).`;
    }
    
    if (!window.confirm(msg)) return;
    
    setProcessingId(tx.id);
    try {
        await mockBackend.approveTransaction(tx.id);
        await loadPending();
    } catch (e: any) {
        alert(e.message);
    } finally {
        setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this transaction?")) return;
    setProcessingId(id);
    try {
        await mockBackend.rejectTransaction(id);
        await loadPending();
    } catch (e: any) {
        alert(e.message);
    } finally {
        setProcessingId(null);
    }
  };

  const handleSaveSettings = async (id: string) => {
      await mockBackend.updatePaymentMethod(id, editDetails[id]);
      alert("Instructions updated");
  };

  const handleUpdateReferralRate = async () => {
      await mockBackend.updateReferralRate(referralRate);
      alert("Referral rate updated");
  }

  const handleSaveMining = async (id: string) => {
      const pkg = editMining[id];
      if (!pkg) return;
      await mockBackend.updateMiningPackage(pkg);
      alert("Mining Package Updated");
      await loadMining();
  };

  if (!price) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-3xl font-serif text-zinc-100">Administration Console</h2>
         <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 overflow-x-auto">
            {[
                { id: 'MARKET', icon: Settings, label: 'Market' },
                { id: 'APPROVALS', icon: FileText, label: 'Approvals', count: pendingTxs.length },
                { id: 'SETTINGS', icon: CreditCard, label: 'Payment' },
                { id: 'MINING', icon: Pickaxe, label: 'Mining' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                            ? 'bg-gold-600 text-zinc-900 shadow-lg' 
                            : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{tab.count}</span>
                    )}
                </button>
            ))}
         </div>
      </div>

      {activeTab === 'MARKET' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
                <h3 className="text-xl text-zinc-200 mb-6 flex items-center gap-2">
                    Market Control
                    <span className="text-xs bg-gold-900/30 text-gold-400 px-2 py-1 rounded">Live</span>
                </h3>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Buy Price (৳/g)</label>
                            <input 
                                type="number"
                                value={newBuy}
                                onChange={(e) => setNewBuy(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Sell Price (৳/g)</label>
                            <input 
                                type="number"
                                value={newSell}
                                onChange={(e) => setNewSell(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-100"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                        <span className="text-zinc-500">Current Trend</span>
                        <span className={`flex items-center gap-2 font-bold ${price.trend === 'UP' ? 'text-green-500' : price.trend === 'DOWN' ? 'text-red-500' : 'text-zinc-400'}`}>
                            {price.trend}
                            {price.trend === 'UP' ? <ArrowUp size={16}/> : price.trend === 'DOWN' ? <ArrowDown size={16}/> : null}
                        </span>
                    </div>

                    <Button onClick={handleUpdatePrice} isLoading={updating} className="w-full">
                        Update Market Prices
                    </Button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col justify-center text-center">
                <h3 className="text-xl text-zinc-200 mb-2">System Status</h3>
                <div className="text-5xl font-serif text-gold-500 mb-4">Active</div>
                <p className="text-zinc-500">Simulation Engine Running</p>
                <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                    <div className="p-4 bg-zinc-950 rounded">
                        <div className="text-xs text-zinc-500 uppercase">Latency</div>
                        <div className="text-lg text-zinc-300">24ms</div>
                    </div>
                    <div className="p-4 bg-zinc-950 rounded">
                        <div className="text-xs text-zinc-500 uppercase">Users</div>
                        <div className="text-lg text-zinc-300">{(mockBackend as any).users?.length || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'APPROVALS' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              {pendingTxs.length === 0 ? (
                  <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                      No pending approvals.
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {pendingTxs.map(tx => (
                          <div key={tx.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-start md:items-center">
                              <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-amber-900/30 text-amber-500 text-xs px-2 py-0.5 rounded font-medium border border-amber-900/50">PENDING REVIEW</span>
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                                        tx.type === 'BUY' ? 'bg-gold-900/30 border-gold-900/50 text-gold-400' : 
                                        tx.type === 'SELL' ? 'bg-red-900/30 border-red-900/50 text-red-400' :
                                        'bg-blue-900/30 border-blue-900/50 text-blue-400'
                                    }`}>
                                        {tx.type}
                                    </span>
                                    <span className="text-zinc-500 text-xs">{format(new Date(tx.timestamp), 'MMM dd, HH:mm')}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                                        <UserIcon size={16} />
                                     </div>
                                     <div>
                                        <p className="text-zinc-200 font-medium">{tx.userName}</p>
                                        <p className="text-zinc-500 text-xs font-mono">{tx.userId}</p>
                                     </div>
                                  </div>
                                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                      {tx.type === 'ACTIVATION' ? (
                                          <div className="col-span-2">
                                              <span className="text-zinc-500 block">Activation Fee</span>
                                              <span className="text-zinc-200 font-bold">৳{tx.amountFiat.toLocaleString()}</span>
                                          </div>
                                      ) : (
                                          <>
                                              <div>
                                                  <span className="text-zinc-500 block">
                                                    {tx.type === 'BUY' ? 'Requested Gold' : 'Gold To Sell'}
                                                  </span>
                                                  <span className="text-gold-400 font-bold">{tx.amountGold?.toFixed(2)}g</span>
                                              </div>
                                              <div>
                                                  <span className="text-zinc-500 block">
                                                    {tx.type === 'BUY' ? 'Amount Paid' : 'Amount To Pay'}
                                                  </span>
                                                  <span className="text-zinc-200 font-bold">৳{tx.amountFiat.toLocaleString()}</span>
                                              </div>
                                          </>
                                      )}
                                      
                                      {tx.type === 'SELL' ? (
                                         <div className="col-span-2 bg-red-900/10 border border-red-900/30 p-2 rounded text-red-200">
                                            <span className="text-red-500 block text-xs uppercase mb-1">User's Details:</span>
                                            <p className="font-mono text-xs">{tx.userPaymentDetails}</p>
                                        </div>
                                      ) : (
                                        <div>
                                            <span className="text-zinc-500 block">Payment Method</span>
                                            <span className="text-zinc-300">{tx.paymentMethod}</span>
                                        </div>
                                      )}
                                  </div>
                              </div>

                              {(tx.type === 'BUY' || tx.type === 'ACTIVATION') && (
                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div className="w-32 h-20 bg-zinc-950 border border-dashed border-zinc-700 rounded flex flex-col items-center justify-center text-zinc-600 text-xs p-2">
                                        <FileText size={16} className="mb-1" />
                                        {tx.screenshotUrl ? 'Screenshot.jpg' : 'No Image'}
                                    </div>
                                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-gold-500 hover:underline">View Proof</a>
                                </div>
                              )}

                              {tx.type === 'SELL' && (
                                <div className="flex-shrink-0 flex flex-col items-center gap-2 justify-center w-32 text-center text-xs text-zinc-500">
                                    <Send size={24} className="text-green-500 mb-2"/>
                                    Auto-credits Cash Balance.
                                </div>
                              )}

                              <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 w-full md:w-auto">
                                  <Button 
                                    className="!py-2 !px-4 text-sm w-full" 
                                    onClick={() => handleApprove(tx)}
                                    isLoading={processingId === tx.id}
                                    disabled={!!processingId}
                                  >
                                      <Check size={16} /> Approve
                                  </Button>
                                  <Button 
                                    variant="danger" 
                                    className="!py-2 !px-4 text-sm w-full"
                                    onClick={() => handleReject(tx.id)}
                                    isLoading={processingId === tx.id}
                                    disabled={!!processingId}
                                  >
                                      <X size={16} /> Reject
                                  </Button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Referral Settings */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                  <h4 className="text-lg text-gold-400 font-serif mb-4 flex items-center gap-2">
                      <Users size={20} />
                      Referral Configuration
                  </h4>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm text-zinc-500 mb-2">Referral Commission Rate (0.05 = 5%)</label>
                          <input 
                              type="number"
                              step="0.01"
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 outline-none focus:border-gold-500"
                              value={referralRate}
                              onChange={(e) => setReferralRate(parseFloat(e.target.value))}
                          />
                      </div>
                      <div className="flex justify-end">
                          <Button variant="secondary" onClick={handleUpdateReferralRate}>
                              Update Rate
                          </Button>
                      </div>
                  </div>
              </div>

              {/* Payment Settings */}
              {paymentMethods.map(pm => (
                  <div key={pm.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                      <h4 className="text-lg text-gold-400 font-serif mb-4 flex items-center gap-2">
                          <CreditCard size={20} />
                          {pm.name}
                      </h4>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm text-zinc-500 mb-2">Instructions shown to user</label>
                              <textarea 
                                  className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 text-sm font-mono focus:border-gold-500 outline-none"
                                  value={editDetails[pm.id] || ''}
                                  onChange={(e) => setEditDetails({...editDetails, [pm.id]: e.target.value})}
                              />
                          </div>
                          <div className="flex justify-end">
                              <Button variant="secondary" onClick={() => handleSaveSettings(pm.id)}>
                                  Save Instructions
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'MINING' && (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {miningPackages.map(pkg => (
                  <div key={pkg.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                      <h4 className="text-lg text-gold-400 font-serif mb-4 flex items-center gap-2">
                          <Pickaxe size={20} />
                          {pkg.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                              <label className="block text-sm text-zinc-500 mb-2">Package Cost (BDT)</label>
                              <input 
                                  type="number"
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 outline-none focus:border-gold-500"
                                  value={editMining[pkg.id]?.cost || 0}
                                  onChange={(e) => setEditMining({
                                      ...editMining, 
                                      [pkg.id]: { ...editMining[pkg.id], cost: parseFloat(e.target.value) }
                                  })}
                              />
                          </div>
                          <div>
                              <label className="block text-sm text-zinc-500 mb-2">Daily Profit (BDT)</label>
                              <input 
                                  type="number"
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 outline-none focus:border-gold-500"
                                  value={editMining[pkg.id]?.dailyProfit || 0}
                                  onChange={(e) => setEditMining({
                                      ...editMining, 
                                      [pkg.id]: { ...editMining[pkg.id], dailyProfit: parseFloat(e.target.value) }
                                  })}
                              />
                          </div>
                      </div>
                      <div className="flex justify-end">
                          <Button variant="secondary" onClick={() => handleSaveMining(pkg.id)}>
                              Update Package
                          </Button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};