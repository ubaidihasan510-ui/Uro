
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, pass, referralCode);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-zinc-950 to-zinc-950"></div>
        
        <div className="w-full max-w-md p-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl relative z-10 shadow-2xl">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-gold-500 mb-2">Begin Your Legacy</h1>
                <p className="text-zinc-400 text-sm">Join the elite circle of Auro investors.</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Full Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-gold-500 outline-none transition-colors"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-gold-500 outline-none transition-colors"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Password</label>
                    <input 
                        type="password" 
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-gold-500 outline-none transition-colors"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Referral Code (Optional)</label>
                    <input 
                        type="text" 
                        value={referralCode}
                        onChange={e => setReferralCode(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-gold-500 outline-none transition-colors placeholder-zinc-700"
                        placeholder="Ex: REF-AB123"
                    />
                </div>
                
                <Button type="submit" className="w-full !mt-6" isLoading={loading}>
                    Create Portfolio
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
                Already have an account? <Link to="/login" className="text-gold-500 hover:text-gold-400">Sign in</Link>
            </div>
        </div>
    </div>
  );
};
