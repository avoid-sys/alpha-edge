import React from 'react';
import { Link } from 'react-router-dom';
import { NeumorphicCard } from '@/components/NeumorphicUI';
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
  Star,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function Home() {
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
    }
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
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3">
              <UserPlus size={20} />
              Join Elite Traders
            </button>
            <Link to="/dashboard">
              <button className="px-8 py-4 bg-[#e0e5ec] rounded-xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] transition-all duration-200 text-gray-700 font-semibold flex items-center justify-center gap-3">
                <LogIn size={20} />
                Access Dashboard
              </button>
            </Link>
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
    </div>
  );
}
