import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './Layout.jsx';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Connect from './pages/Connect';
import ImportTrades from './pages/ImportTrades';
import BrokerExchangeConnect from './pages/BrokerExchangeConnect';
import AuthCTraderCallback from './pages/AuthCTraderCallback';
import Auth from './pages/Auth';

// Simple error boundary to avoid full white-screen crashes in production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console so we can see the exact stack in production as well
    // (Vercel will also capture this if you have logging/monitoring set up)
    console.error('UI ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state && this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-4">
              An unexpected error occurred while rendering the dashboard. Please refresh the page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-600 bg-red-50 p-3 rounded-lg text-left overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {isLandingPage ? (
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/importtrades" element={<ImportTrades />} />
            <Route path="/broker-exchange-connect" element={<BrokerExchangeConnect />} />
            <Route path="/auth/ctrader/callback" element={<AuthCTraderCallback />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
      <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
