
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { Transactions } from './pages/Transactions';
import { Mining } from './pages/Mining';

const PrivateRoute = ({ children }: { children: React.ReactNode }): React.ReactElement | null => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-500 animate-pulse font-serif text-xl">Loading Auro...</div>
      </div>
    );
  }
  
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }): React.ReactElement | null => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (user?.role !== 'ADMIN') return <Navigate to="/" />;
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* User Routes */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/mining" element={<PrivateRoute><Mining /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/transactions" element={<AdminRoute><Transactions adminView /></AdminRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
