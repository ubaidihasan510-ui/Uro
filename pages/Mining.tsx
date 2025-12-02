
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { GoldPrice, MiningSubscription, MiningPackageConfig } from '../types';
import { Button } from '../components/Button';
import { Pickaxe, Lock, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export const Mining = () => {
    const { user, refreshUser } = useAuth();
    const [price, setPrice] = useState<GoldPrice | null>(null);
    const [packages, setPackages] = useState<MiningPackageConfig[]>([]);
    const [subscriptions, setSubscriptions] = useState<MiningSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const p = await mockBackend.getPrice();
            setPrice(p);
            const pkgs = await mockBackend.getMiningPackages();
            setPackages(pkgs);
            const subs = await mockBackend.getMiningSubscriptions(user.id);
            setSubscriptions(subs);
            await refreshUser(); // To ensure lockedGold and balanceFiat are up to date
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (pkg: MiningPackageConfig) => {
        if (!user || !price) return;
        
        if (!window.confirm(`Activate ${pkg.name}? ৳${pkg.cost.toLocaleString()} worth of gold will be locked for 30 days.`)) {
            return;
        }

        setActivating(pkg.id);
        try {
            await mockBackend.activateMiningPackage(user.id, pkg.id);
            await loadData();
            alert('Mining package activated successfully! Gold locked for 30 days.');
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActivating(null);
        }
    };

    if (!user || !price || loading) return <div className="text-gold-500 animate-pulse">Loading mining data...</div>;

    const availableGold = user.balanceGold - (user.lockedGold || 0);
    const availableValue = availableGold * price.sell;

    return (
        <div className="space-y-8 pb-32">
            <header>
                <h2 className="text-3xl font-serif text-zinc-100 mb-2">Gold Mining</h2>
                <p className="text-zinc-400">Lock your gold assets to generate daily revenue.</p>
            </header>

            {/* Status Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div>
                    <div className="text-sm text-zinc-500 mb-1">Available for Mining</div>
                    <div className="text-3xl font-bold text-gold-400 font-serif">
                        ৳{availableValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">
                        ≈ {availableGold.toFixed(2)}g Available (unlocked)
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center gap-3">
                         <div className="p-2 bg-zinc-900 rounded-lg text-gold-500">
                            <Lock size={20} />
                         </div>
                         <div>
                             <div className="text-xs text-zinc-500 uppercase">Locked Value</div>
                             <div className="text-lg font-bold text-zinc-200">
                                 ৳{((user.lockedGold || 0) * price.sell).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                             </div>
                         </div>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center gap-3">
                         <div className="p-2 bg-zinc-900 rounded-lg text-green-500">
                            <TrendingUp size={20} />
                         </div>
                         <div>
                             <div className="text-xs text-zinc-500 uppercase">Cash Balance</div>
                             <div className="text-lg font-bold text-zinc-200">
                                 ৳{(user.balanceFiat || 0).toLocaleString()}
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map(pkg => {
                    const canAfford = availableValue >= pkg.cost;
                    return (
                        <div key={pkg.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 relative group overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <h3 className="text-xl font-serif text-zinc-200 mb-1 relative z-10">{pkg.name}</h3>
                             <p className="text-3xl font-bold text-gold-500 mb-4 relative z-10">৳{pkg.cost.toLocaleString()}</p>
                             
                             <div className="space-y-3 mb-6 relative z-10">
                                 <div className="flex items-center gap-2 text-sm text-zinc-400">
                                     <TrendingUp size={14} className="text-green-500"/>
                                     <span>Daily Profit: <span className="text-green-400 font-bold">৳{pkg.dailyProfit}</span></span>
                                 </div>
                                 <div className="flex items-center gap-2 text-sm text-zinc-400">
                                     <Lock size={14} />
                                     <span>Lock Period: <span className="text-zinc-200">30 Days</span></span>
                                 </div>
                                 <div className="flex items-center gap-2 text-sm text-zinc-400">
                                     <Pickaxe size={14} />
                                     <span>Req. Gold: <span className="text-zinc-200">~{(pkg.cost / price.sell).toFixed(2)}g</span></span>
                                 </div>
                             </div>

                             <Button 
                                onClick={() => handleActivate(pkg)}
                                disabled={!canAfford || activating !== null}
                                isLoading={activating === pkg.id}
                                className={`w-full relative z-10 ${!canAfford ? 'opacity-50' : ''}`}
                                variant={canAfford ? 'primary' : 'secondary'}
                             >
                                {canAfford ? 'Activate' : 'Insufficient Balance'}
                             </Button>
                        </div>
                    );
                })}
            </div>

            {/* Active Subscriptions */}
            <div className="space-y-4">
                <h3 className="text-xl text-zinc-200">Active Operations</h3>
                {subscriptions.filter(s => s.status === 'ACTIVE').length === 0 ? (
                    <div className="text-zinc-500 text-sm bg-zinc-900/30 p-8 rounded-xl text-center border border-zinc-800/50">
                        No active mining operations.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {subscriptions.filter(s => s.status === 'ACTIVE').map(sub => (
                            <div key={sub.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gold-900/20 rounded-lg text-gold-500 border border-gold-900/30">
                                        <Pickaxe size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="text-zinc-200 font-medium">{sub.packageName} (৳{sub.packageCost.toLocaleString()})</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                            <TrendingUp size={10} className="text-green-500"/>
                                            Earning ৳{sub.dailyProfit}/day
                                            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                            <Lock size={10} />
                                            {sub.lockedGoldAmount.toFixed(2)}g Locked
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Unlocks In</div>
                                    <div className="text-gold-400 font-mono text-sm flex items-center gap-1 justify-end">
                                        <Clock size={14} />
                                        {format(new Date(sub.endDate), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* History */}
            {subscriptions.some(s => s.status === 'COMPLETED') && (
                 <div className="space-y-4 opacity-60">
                    <h3 className="text-lg text-zinc-400">Completed Operations</h3>
                    <div className="grid gap-4">
                        {subscriptions.filter(s => s.status === 'COMPLETED').map(sub => (
                            <div key={sub.id} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500">
                                        <CheckCircle size={16} />
                                    </div>
                                    <div>
                                        <div className="text-zinc-400 text-sm">{sub.packageName} (৳{sub.packageCost.toLocaleString()})</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-zinc-600 uppercase">Unlocked</div>
                                    <div className="text-zinc-500 text-sm">
                                        {format(new Date(sub.endDate), 'MMM dd')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
