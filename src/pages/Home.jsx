import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { localDataService } from '@/services/localDataService';
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
  Activity
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

        await localDataService.setCurrentUser(user);
        navigate(createPageUrl('Dashboard'));
      } else {
        // Login - in production, this would verify credentials
        const user = await localDataService.getCurrentUser();
        if (user && user.email === authForm.email) {
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
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
                <Star size={20} />
                Start Your Journey
              </button>
              <Link to={createPageUrl('Leaderboard')}>
                <button className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3">
                  <Eye size={20} />
                  View Leaderboard
                </button>
              </Link>
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
              src="https://i.postimg.cc/5Nd0vd5v/ALPHA-EDGE-LOGO-black.png"
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