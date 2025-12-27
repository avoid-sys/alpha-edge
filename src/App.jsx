import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './Layout.jsx';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Connect from './pages/Connect';
import ImportTrades from './pages/ImportTrades';
import Login from './pages/Login';
import Register from './pages/Register';
import TestAuth from './pages/TestAuth';
import CTraderCallback from './pages/CTraderCallback';
import TermsOfService from './pages/TermsOfService';
import InvestorForm from './pages/InvestorForm';
import Support from './pages/Support';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = ['/login', '/register', '/test-auth'].includes(location.pathname);
  const isCallbackPage = location.pathname === '/auth/ctrader/callback';

  return (
    <>
      {isLandingPage ? (
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      ) : isAuthPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/test-auth" element={<TestAuth />} />
        </Routes>
      ) : isCallbackPage ? (
        <Routes>
          <Route path="/auth/ctrader/callback" element={<CTraderCallback />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard key={new URLSearchParams(location.search).get('profileId') || 'own'} /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
            <Route path="/importtrades" element={<ProtectedRoute><ImportTrades /></ProtectedRoute>} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/investor-form" element={<InvestorForm />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
    <Router>
      <AppContent />
    </Router>
    </AuthProvider>
  );
}

export default App;
