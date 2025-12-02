
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  LogOut, 
  Menu,
  X,
  CreditCard,
  Pickaxe
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-gradient-to-r from-gold-600/20 to-transparent text-gold-400 border-l-2 border-gold-500' 
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
        }`
      }
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  const MobileNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'text-gold-400' 
            : 'text-zinc-500'
        }`
      }
    >
      <Icon size={24} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-gold-500/30">
      {/* Sidebar for Desktop */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 hidden md:flex flex-col z-50">
        <div className="p-8">
          <h1 className="font-serif text-3xl font-bold bg-gradient-to-br from-gold-300 to-gold-600 bg-clip-text text-transparent">
            AURO
          </h1>
          <p className="text-xs text-zinc-500 mt-1 tracking-widest uppercase">Premium Gold</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {user?.role === 'ADMIN' ? (
            <>
              <NavItem to="/admin" icon={LayoutDashboard} label="Admin Dashboard" />
              <NavItem to="/transactions" icon={Wallet} label="All Transactions" />
            </>
          ) : (
            <>
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/mining" icon={Pickaxe} label="Gold Mining" />
              <NavItem to="/history" icon={Wallet} label="Transaction History" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img src={user?.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-gold-500/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-zinc-200">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-50">
         <h1 className="font-serif text-xl font-bold bg-gradient-to-br from-gold-300 to-gold-600 bg-clip-text text-transparent">
            AURO
          </h1>
          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400">
            <LogOut size={20} />
          </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-start pt-4 z-50 pb-safe">
         {user?.role === 'ADMIN' ? (
            <>
              <MobileNavItem to="/admin" icon={LayoutDashboard} label="Admin" />
              <MobileNavItem to="/transactions" icon={Wallet} label="Transactions" />
            </>
          ) : (
            <>
              <MobileNavItem to="/" icon={LayoutDashboard} label="Home" />
              <MobileNavItem to="/mining" icon={Pickaxe} label="Mining" />
              <MobileNavItem to="/history" icon={Wallet} label="History" />
            </>
          )}
      </div>

      {/* Main Content */}
      <main className="md:pl-64 pt-20 pb-28 md:pt-0 md:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};
