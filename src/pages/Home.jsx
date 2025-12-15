import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { localDataService } from '@/services/localDataService';
import { googleAuthService } from '@/services/googleAuthService';
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
  Star,
  ArrowRight,
  LogIn,
  UserPlus,
  Eye,
  Lock,
  Activity,
  Mail
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const user = await localDataService.getCurrentUser();
        console.log('Auth check result:', user);

        if (user && user.email) {
          console.log('User authenticated:', user.email);
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          console.log('User not authenticated');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setAuthCheckComplete(true);
      }
    };

    checkAuth();

    // Check if we need to show login modal (from protected route redirect)
    if (location.state?.showLogin && !isAuthenticated) {
      setAuthMode('login');
    }
  }, [location.state]);

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      console.log('Starting Google sign-in...');
      const userData = await googleAuthService.signIn();

      if (userData) {
        console.log('Google sign-in successful, updating state...');
        setIsAuthenticated(true);
        setCurrentUser(userData);
        setAuthMode(null); // Close modal
        console.log('Redirecting to dashboard after Google sign-in...');
        navigate(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'register') {
        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const user = {
          email: authForm.email,
          full_name: authForm.fullName,
          password: authForm.password // In production, this would be hashed
        };

        console.log('Registering user:', user);
        await localDataService.setCurrentUser(user);
        console.log('User saved to storage, updating state...');
        setIsAuthenticated(true);
        setCurrentUser(user);
        setAuthMode(null); // Close modal
        console.log('Navigating to dashboard...');
        navigate(createPageUrl('Dashboard'));
      } else {
        // Login - in production, this would verify credentials
        console.log('Login attempt for email:', authForm.email);
        const user = await localDataService.getCurrentUser();
        console.log('Stored user for login:', user);
        if (user && user.email === authForm.email) {
          console.log('Login successful, updating state...');
          setIsAuthenticated(true);
          setCurrentUser(user);
          setAuthMode(null); // Close modal
          console.log('Navigating to dashboard after login...');
          navigate(createPageUrl('Dashboard'));
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (err) {
      setError(err.message);
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

  // Show loading state while checking authentication
  if (!authCheckComplete) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#e0e5ec] rounded-full shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
            {isAuthenticated && currentUser ? (
              <>
                <p className="text-xl md:text-2xl text-green-600 mb-4 max-w-3xl mx-auto">
                  Welcome back, {currentUser.full_name || currentUser.email}!
                </p>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Continue your journey as an Elite Trader
                </p>
                <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                  Access your dashboard to track performance, connect new accounts, and compete on the global leaderboard.
                </p>
              </>
            ) : (
              <>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  The Global Leaderboard for Elite Traders
                </p>
                <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                  Join the world's most prestigious trading community. Only those who consistently prove their skills
                  will unlock capital management opportunities and access exclusive trading opportunities.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isAuthenticated ? (
              <>
                <Link to={createPageUrl('Dashboard')}>
                  <button className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3">
                    <Activity size={20} />
                    Go to Dashboard
                  </button>
                </Link>
                <button
                  onClick={async () => {
                    await localDataService.logout();
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                  }}
                  className="px-8 py-4 bg-red-50 rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-red-600 font-semibold flex items-center justify-center gap-3"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthMode('register')}
                  className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3"
                >
                  <UserPlus size={20} />
                  Join Elite Traders
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3"
                >
                  <LogIn size={20} />
                  Access Dashboard
                </button>
              </>
            )}
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
              {isAuthenticated ? (
                <>
                  <Link to={createPageUrl('Dashboard')}>
                    <button className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3">
                      <Activity size={20} />
                      Access Your Dashboard
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAuthMode('register')}
                    className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3"
                  >
                    <Star size={20} />
                    Start Your Journey
                  </button>
                </>
              )}
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
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})}
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
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
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
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
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
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {authMode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                    </span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

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

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 bg-white/30">
        <div className="max-w-6xl mx-auto text-center">
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
          <p className="text-sm text-gray-500">
            © 2024 Alpha Edge. Identifying the world's best traders through verified performance.
          </p>
        </div>
      </footer>
    </div>
  );
}