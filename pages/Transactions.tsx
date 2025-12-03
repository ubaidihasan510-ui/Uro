
import React, { useEffect, useState } from 'react';
import { mockBackend } from '../services/mockBackend';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export const Transactions = ({ adminView = false }: { adminView?: boolean }) => {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const data = await mockBackend.getTransactions(adminView ? undefined : user.id);
        setTxs(data);
        setLoading(false);
      }
    };
    load();
  }, [user, adminView]);

  if (loading) return <div>Loading records...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif text-zinc-100">{adminView ? 'Global Ledger' : 'Transaction History'}</h2>
      
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Type</th>
              {adminView && <th className="px-6 py-4">User</th>}
              <th className="px-6 py-4 text-right">Gold Amount</th>
              <th className="px-6 py-4 text-right">Price / g</th>
              <th className="px-6 py-4 text-right">Total (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
            {txs.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No transactions found.</td>
                </tr>
            ) : txs.map((tx) => (
              <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 text-zinc-300 text-sm">
                  {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                    tx.status === 'COMPLETED' ? 'bg-green-900/20 border-green-900/50 text-green-400' :
                    tx.status === 'PENDING' ? 'bg-amber-900/20 border-amber-900/50 text-amber-400' :
                    'bg-red-900/20 border-red-900/50 text-red-400'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium ${
                    tx.type === 'BUY' ? 'text-gold-400' : 
                    tx.type === 'SELL' ? 'text-red-400' :
                    tx.type === 'ACTIVATION' ? 'text-blue-400' :
                    'text-zinc-400'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                {adminView && <td className="px-6 py-4 text-zinc-300 text-sm">{tx.userName}</td>}
                <td className="px-6 py-4 text-right text-gold-400 font-medium">
                  {tx.amountGold ? `${tx.amountGold.toFixed(2)}g` : '-'}
                </td>
                <td className="px-6 py-4 text-right text-zinc-400 text-sm">
                  {tx.pricePerGram ? `৳${tx.pricePerGram.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-right text-zinc-200">
                  ৳{tx.amountFiat.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};