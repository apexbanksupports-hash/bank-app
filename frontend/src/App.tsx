import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import SplashScreen from './components/SplashScreen';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AccountsPage from './pages/AccountsPage';
import TransferPage from './pages/TransferPage';
import TransactionsPage from './pages/TransactionsPage';
import KycPage from './pages/KycPage';
import TwoFactorPage from './pages/TwoFactorPage';
import AdminPage from './pages/AdminPage';
import CategoriesPage from './pages/CategoriesPage';
import ScheduledTransfersPage from './pages/ScheduledTransfersPage';
import StatementsPage from './pages/StatementsPage';
import SafeBoxPage from './pages/SafeBoxPage';
import EntertainmentPage from './pages/EntertainmentPage';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { theme } = useTheme();
  const [splashDone, setSplashDone] = useState(() => {
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('apex-splash-seen');
      if (seen) return true;
    }
    return false;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('apex-splash-seen', '1');
    setSplashDone(true);
  };

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="transfer" element={<TransferPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="kyc" element={<KycPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="scheduled" element={<ScheduledTransfersPage />} />
          <Route path="statements" element={<StatementsPage />} />
          <Route path="safebox" element={<SafeBoxPage />} />
          <Route path="entertainment" element={<EntertainmentPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
