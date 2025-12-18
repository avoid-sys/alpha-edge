import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { authService } from '@/services/authService';
import { supabase } from '@/utils/supabase';
import {
  Trophy,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  Award,
  Target,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Eye,
  Lock,
  Activity,
  FileText,
  Mail,
  MessageCircle,
  Send,
  X
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null); // 'login' or 'register'

  // Отдельные state для каждого поля (решение №1 - useState)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showInvestorForm, setShowInvestorForm] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [investorForm, setInvestorForm] = useState({
    name: '',
    email: '',
    company: '',
    investmentAmount: '',
    message: ''
  });
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      // First check Supabase auth
    if (authService.isAuthenticated()) {
      navigate(createPageUrl('Dashboard'));
        return;
      }

      // Then check local storage for demo users
      const currentUser = localStorage.getItem('current_user');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          // Set the demo user in auth service
          authService.currentUser = user;
          authService.session = { user };
          navigate(createPageUrl('Dashboard'));
        } catch (error) {
          console.warn('Error parsing demo user from localStorage:', error);
          localStorage.removeItem('current_user');
        }
      }
    };

    checkAuth();
  }, [navigate]);


  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      // For now, we'll create mock data since the Supabase tables might not be set up yet
      // In production, this would fetch from Supabase
      const mockData = [
        { id: 1, full_name: 'Alex Thompson', trader_score: 95.2, total_trades: 1250, win_rate: 68.5 },
        { id: 2, full_name: 'Sarah Chen', trader_score: 92.8, total_trades: 980, win_rate: 71.2 },
        { id: 3, full_name: 'Marcus Rodriguez', trader_score: 89.5, total_trades: 1450, win_rate: 65.8 },
        { id: 4, full_name: 'Emma Johnson', trader_score: 87.3, total_trades: 890, win_rate: 69.7 },
        { id: 5, full_name: 'David Kim', trader_score: 85.9, total_trades: 720, win_rate: 72.1 },
        { id: 6, full_name: 'Lisa Wang', trader_score: 83.4, total_trades: 1100, win_rate: 66.9 },
        { id: 7, full_name: 'James Wilson', trader_score: 81.7, total_trades: 650, win_rate: 70.3 },
        { id: 8, full_name: 'Maria Garcia', trader_score: 79.8, total_trades: 920, win_rate: 68.2 },
        { id: 9, full_name: 'Robert Lee', trader_score: 77.5, total_trades: 580, win_rate: 73.4 },
        { id: 10, full_name: 'Anna Petrov', trader_score: 75.9, total_trades: 780, win_rate: 67.8 },
      ];
      setLeaderboardData(mockData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback to empty array
      setLeaderboardData([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Handle leaderboard modal open
  const handleViewLeaderboard = () => {
    setShowLeaderboard(true);
    if (leaderboardData.length === 0) {
      fetchLeaderboard();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (authMode === 'register') {
        // Validate form
        if (!email || !password || !fullName) {
          throw new Error('Please fill in all required fields');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        // ✅ РЕШЕНИЕ №1: Отдельные useState - значения уже готовы
        const finalEmail = email.trim();
        const finalPassword = password.trim();
        const finalFullName = fullName.trim();

        // Basic validation
        if (!email) {
          throw new Error('Please enter your email address');
        }
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }



        // ✅ Регистрация через Supabase Auth
        const { user, error } = await authService.signUp(
          finalEmail,
          finalPassword,
          finalFullName
        );

        if (error) {
          console.error('Signup error:', error);
          throw new Error(error.message || 'Failed to create account. Please try again.');
        }

        if (user) {
          console.log('Signup successful for user:', user.email);
          setSuccessMessage('Account created successfully! Please check your email to verify your account.');
          setAuthMode('login');
          setEmail(finalEmail); // Keep email for login
          setPassword('');
          setConfirmPassword('');
          setFullName('');
        } else {
          throw new Error('Account creation failed. Please try again.');
        }
      } else {
        // Login
        const loginEmail = email.trim();
        const loginPassword = password.trim();

        if (!loginEmail || !loginPassword) {
          throw new Error('Please enter your email and password');
        }

        console.log('Attempting login for:', loginEmail);
        console.log('Login data types:', {
          email: typeof loginEmail,
          password: typeof loginPassword
        });

        const { user, error } = await authService.signIn(
          loginEmail,
          loginPassword
        );

        if (error) {
          console.error('Login error:', error);
          throw new Error(error.message || 'Login failed. Please check your credentials.');
        }

        if (user) {
          console.log('Login successful for user:', user.email);
          navigate(createPageUrl('Dashboard'));
        } else {
          throw new Error('Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Trophy className="text-yellow-600" size={32} />,
      title: "Global Leaderboard",
      description: "Compete with the world's top traders in our prestigious global rankings."
    },
    {
      icon: <BarChart3 className="text-blue-600" size={32} />,
      title: "Advanced Analytics",
      description: "Comprehensive performance metrics, risk analysis, and trading insights."
    },
    {
      icon: <Shield className="text-green-600" size={32} />,
      title: "Verified Performance",
      description: "Only live trading accounts qualify for rankings and capital opportunities."
    },
    {
      icon: <Target className="text-purple-600" size={32} />,
      title: "Capital Access",
      description: "Prove your skills to unlock capital management opportunities."
    },
    {
      icon: <TrendingUp className="text-orange-600" size={32} />,
      title: "Real-time Tracking",
      description: "Monitor your performance with live updates and detailed statistics."
    },
    {
      icon: <Users className="text-indigo-600" size={32} />,
      title: "Elite Community",
      description: "Join a community of professional traders and market experts."
    }
  ];

  const stats = [
    { number: "14+", label: "Trading Platforms" },
    { number: "1000+", label: "Active Traders" },
    { number: "$50M+", label: "Capital Managed" },
    { number: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#e0e5ec] p-1 shadow-[-6px_-6px_12px_#ffffff,6px_6px_12px_#aeaec040]">
              <img
                src="/logo.png"
                alt="Alpha Edge"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              Alpha Edge
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The Global Leaderboard for Elite Traders
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Join the world's most prestigious trading community. Only those who consistently prove their skills
              will unlock capital management opportunities and access exclusive trading opportunities.
            </p>
          </div>

          <div className="flex justify-center mb-16">
            <button
              onClick={() => setAuthMode('register')}
              className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3"
            >
              <UserPlus size={20} />
              Get Started
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Why Choose Alpha Edge?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides the tools and recognition that serious traders need to excel in the global markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <NeumorphicCard key={index} className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </NeumorphicCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Your journey to becoming a recognized elite trader
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#e0e5ec] rounded-full shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Connect Your Account</h3>
              <p className="text-gray-600">
                Link your live trading account through our secure API integrations or upload verified trading statements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#e0e5ec] rounded-full shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Prove Your Skills</h3>
              <p className="text-gray-600">
                Demonstrate consistent performance through our comprehensive analytics and risk management metrics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#e0e5ec] rounded-full shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Unlock Opportunities</h3>
              <p className="text-gray-600">
                Top performers gain access to capital management opportunities and exclusive trading opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <NeumorphicCard className="p-8 md:p-12">
            <Globe className="mx-auto mb-6 text-blue-600" size={48} />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Join the Global Elite
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Are you ready to prove you're among the world's best traders?
              Join Alpha Edge and compete for recognition, capital, and exclusive opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAuthMode('register')}
                className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3"
              >
                <UserPlus size={20} />
                Get Started
              </button>
              <button
                onClick={handleViewLeaderboard}
                className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3"
              >
                <Eye size={20} />
                View Leaderboard
              </button>
            </div>
          </NeumorphicCard>
        </div>
      </section>

      {/* Authentication Modal */}
      {authMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <NeumorphicCard className="w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {authMode === 'login' ? 'Welcome Back' : 'Join Alpha Edge'}
              </h3>
              <button
                onClick={() => setAuthMode(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>


            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {successMessage}
                </div>
              )}

              <NeumorphicButton
                type="submit"
                variant="action"
                className="w-full flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    {authMode === 'login' ? <LogIn size={18} className="mr-2" /> : <UserPlus size={18} className="mr-2" />}
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </NeumorphicButton>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </NeumorphicCard>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <NeumorphicCard className="w-full max-w-3xl p-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Global Leaderboard</h3>
                <p className="text-sm text-gray-600">Top 10 elite traders</p>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div>
              {leaderboardLoading ? (
                <div className="text-center py-6">
                  <div className="animate-pulse text-gray-500">Loading leaderboard...</div>
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="space-y-1">
                  {leaderboardData.map((trader, index) => (
                    <div
                      key={trader.id}
                      className="flex items-center justify-between p-2 bg-[#e0e5ec] rounded-xl shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#aeaec040] transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#aeaec040] ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900' :
                          'bg-[#e0e5ec] text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 text-sm">{trader.full_name}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Activity size={10} className="text-blue-500" />
                              {trader.total_trades}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target size={10} className="text-green-500" />
                              {trader.win_rate}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                          {trader.trader_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No leaderboard data available yet.</div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">
                  Want to see your name on this leaderboard?
                </p>
                <NeumorphicButton
                  onClick={() => {
                    setShowLeaderboard(false);
                    setAuthMode('register');
                  }}
                  className="flex items-center justify-center gap-2 mx-auto px-4 py-2 text-sm"
                >
                  <UserPlus size={16} />
                  Join Now
                </NeumorphicButton>
              </div>
            </div>
          </NeumorphicCard>
        </div>
      )}

      {/* Terms & Rules Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <NeumorphicCard className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Terms & Rules</h3>
              <button
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Platform Terms of Service</h4>
                <div className="text-gray-600 space-y-3 text-sm">
                  <p><strong>1. Acceptance of Terms</strong><br />
                  By accessing and using Alpha Edge, you accept and agree to be bound by the terms and provision of this agreement.</p>

                  <p><strong>2. Trading Performance Verification</strong><br />
                  All traders must provide verifiable live trading account data. We reserve the right to verify performance claims through secure API integrations or uploaded statements.</p>

                  <p><strong>3. Eligibility Requirements</strong><br />
                  Only traders with live, funded accounts demonstrating consistent profitability over a minimum 3-month period are eligible for leaderboard ranking.</p>

                  <p><strong>4. Capital Management Opportunities</strong><br />
                  Top-ranked traders may be offered capital management opportunities. All such arrangements are subject to legal agreements and regulatory compliance.</p>

                  <p><strong>5. Data Privacy</strong><br />
                  We collect and process trading performance data solely for leaderboard ranking and verification purposes. Personal information is protected under our privacy policy.</p>

                  <p><strong>6. Account Termination</strong><br />
                  We reserve the right to suspend or terminate accounts that violate our terms, demonstrate fraudulent activity, or fail verification processes.</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Trading Rules & Guidelines</h4>
                <div className="text-gray-600 space-y-3 text-sm">
                  <p><strong>Performance Metrics</strong><br />
                  Rankings are calculated based on risk-adjusted returns, win rate, profit factor, and consistency over time.</p>

                  <p><strong>Live Trading Requirement</strong><br />
                  Only live, funded accounts qualify for rankings. Demo or simulated trading results are not accepted.</p>

                  <p><strong>Ethical Trading</strong><br />
                  All participants must adhere to ethical trading practices. Any form of manipulation or fraudulent activity will result in immediate disqualification.</p>

                  <p><strong>Data Accuracy</strong><br />
                  Traders are responsible for ensuring the accuracy of submitted performance data. False or misleading information may result in account suspension.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <button
                onClick={() => setShowTerms(false)}
                className="px-6 py-2 bg-[#e0e5ec] rounded-lg shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#aeaec040] transition-all duration-200 text-gray-700 font-medium"
              >
                I Understand
              </button>
            </div>
          </NeumorphicCard>
        </div>
      )}

      {/* Investor Contact Form Modal */}
      {showInvestorForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <NeumorphicCard className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Investor Contact</h3>
              <button
                onClick={() => setShowInvestorForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Enter your full name"
                  value={investorForm.name}
                  onChange={(e) => setInvestorForm({...investorForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Enter your email"
                  value={investorForm.email}
                  onChange={(e) => setInvestorForm({...investorForm, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company/Organization
                </label>
                <input
                  type="text"
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Enter your company name"
                  value={investorForm.company}
                  onChange={(e) => setInvestorForm({...investorForm, company: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Amount Range
                </label>
                <select
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  value={investorForm.investmentAmount}
                  onChange={(e) => setInvestorForm({...investorForm, investmentAmount: e.target.value})}
                >
                  <option value="">Select investment range</option>
                  <option value="$10K-$50K">$10K - $50K</option>
                  <option value="$50K-$100K">$50K - $100K</option>
                  <option value="$100K-$250K">$100K - $250K</option>
                  <option value="$250K-$500K">$250K - $500K</option>
                  <option value="$500K-$1M">$500K - $1M</option>
                  <option value="$1M+">$1M+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] resize-none"
                  placeholder="Tell us about your investment goals and requirements..."
                  value={investorForm.message}
                  onChange={(e) => setInvestorForm({...investorForm, message: e.target.value})}
                />
              </div>

              <NeumorphicButton
                type="submit"
                className="w-full flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Send Inquiry
              </NeumorphicButton>
            </form>
          </NeumorphicCard>
        </div>
      )}

      {/* Support Contact Modal */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <NeumorphicCard className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Contact Support</h3>
              <button
                onClick={() => setShowSupport(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
                </button>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Get in Touch</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Our support team is here to help. Choose how you'd like to contact us:
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#e0e5ec] rounded-lg shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040]">
                    <Mail className="text-blue-600" size={20} />
                    <div>
                      <div className="font-medium text-gray-800">Email Support</div>
                      <div className="text-sm text-gray-600">support@alphaedge.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#e0e5ec] rounded-lg shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040]">
                    <MessageCircle className="text-green-600" size={20} />
                    <div>
                      <div className="font-medium text-gray-800">Live Chat</div>
                      <div className="text-sm text-gray-600">Available 24/7 for premium users</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Send us a Message</h4>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#e0e5ec] rounded-lg px-3 py-2 border-none outline-none shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-sm"
                        placeholder="Your name"
                        value={supportForm.name}
                        onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full bg-[#e0e5ec] rounded-lg px-3 py-2 border-none outline-none shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-sm"
                        placeholder="your@email.com"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      required
                      className="w-full bg-[#e0e5ec] rounded-lg px-3 py-2 border-none outline-none shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] text-sm"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                    >
                      <option value="">Select a subject</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Problem</option>
                      <option value="trading">Trading Performance</option>
                      <option value="verification">Account Verification</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={3}
                      required
                      className="w-full bg-[#e0e5ec] rounded-lg px-3 py-2 border-none outline-none shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] resize-none text-sm"
                      placeholder="Describe your issue or question..."
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                    />
                  </div>

                  <NeumorphicButton
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Send Message
                  </NeumorphicButton>
                </form>
              </div>
            </div>
          </NeumorphicCard>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 bg-white/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src="/logo.png"
              alt="Alpha Edge"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-gray-800">Alpha Edge</span>
          </div>
          <p className="text-gray-600 mb-4">
            The Global Leaderboard for Elite Traders
          </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setShowTerms(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#e0e5ec] rounded-lg shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#aeaec040] transition-all duration-200 text-gray-700 text-sm font-medium"
            >
              <FileText size={16} />
              Terms & Rules
            </button>
            <button
              onClick={() => setShowInvestorForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#e0e5ec] rounded-lg shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#aeaec040] transition-all duration-200 text-gray-700 text-sm font-medium"
            >
              <Mail size={16} />
              Investor Contact
            </button>
            <button
              onClick={() => setShowSupport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#e0e5ec] rounded-lg shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#aeaec040] transition-all duration-200 text-gray-700 text-sm font-medium"
            >
              <MessageCircle size={16} />
              Support
            </button>
          </div>

          <div className="text-center">
          <p className="text-sm text-gray-500">
            © 2024 Alpha Edge. Identifying the world's best traders through verified performance.
          </p>
          </div>
        </div>
      </footer>
    </div>
  );
}