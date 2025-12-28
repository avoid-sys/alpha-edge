import React, { useEffect, useState, useCallback } from 'react';
import _ from 'lodash';
import { NeumorphicCard } from '@/components/NeumorphicUI';
import { Trophy, TrendingUp, Users, Award, RefreshCw, X, Eye, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { localDataService } from '@/services/localDataService';
import { useAuth } from '@/components/AuthProvider';

// Import metric calculation functions
const normalizeScore = (value, minThresh, excellentThresh, isPositive = true, capValue = null) => {
  if (value === null || value === undefined || isNaN(value)) return 50.0;

  if (capValue !== null) {
    if (isPositive) {
      value = Math.min(value, capValue);
    } else {
      value = Math.max(value, capValue);
    }
  }

  const range = excellentThresh - minThresh;
  let score;

  if (isPositive) {
    if (value <= minThresh) return 0.0;
    if (value >= excellentThresh) return 100.0;
    score = ((value - minThresh) / range) * 100;
  } else {
    if (value >= minThresh) return 0.0;
    if (value <= excellentThresh) return 100.0;
    score = 100 - ((value - excellentThresh) / range) * 100;
  }

  return Math.max(0, Math.min(100, score));
};

// Calculate comprehensive trading metrics
const calculateMetricsFromData = (trades, profile) => {
  if (!trades || trades.length === 0) return null;

  // Sort trades by close time ascending
  const sortedTrades = [...trades].sort((a, b) => new Date(a.close_time) - new Date(b.close_time));

  const totalTrades = sortedTrades.length;
  const profitableTrades = sortedTrades.filter(t => t.net_profit > 0);
  const losingTrades = sortedTrades.filter(t => t.net_profit <= 0);

  const profitableTradesCount = profitableTrades.length;
  const losingTradesCount = losingTrades.length;

  const winRate = totalTrades > 0 ? (profitableTradesCount / totalTrades) * 100 : 0;

  const totalProfit = _.sumBy(sortedTrades, 'net_profit');
  const grossProfit = _.sumBy(profitableTrades, 'net_profit');
  const grossLoss = Math.abs(_.sumBy(losingTrades, 'net_profit'));

  let profitFactor = 0;
  if (grossLoss > 0) {
    profitFactor = grossProfit / grossLoss;
  } else if (grossProfit > 0) {
    profitFactor = grossProfit > 0 ? 999 : 0;
  }

  if (!isFinite(profitFactor) || isNaN(profitFactor)) {
    profitFactor = 0;
  }

  let startBalance = 10000;
  const validBalances = sortedTrades.filter(t => t.balance != null && t.balance > 0);
  if (validBalances.length > 0) {
    const firstTrade = sortedTrades[0];
    startBalance = parseFloat(firstTrade.balance) - parseFloat(firstTrade.net_profit || firstTrade.profit_loss || 0);
    if (isNaN(startBalance) || startBalance <= 0) startBalance = 10000;
  }

  // Calculate equity progression
  let currentBalance = startBalance;
  const balanceSeries = [];
  const tradeReturns = [];

  sortedTrades.forEach(trade => {
    const pnl = parseFloat(trade.net_profit || trade.profit_loss || 0);
    const prevBalance = currentBalance;
    const tradeReturn = prevBalance > 0 ? pnl / prevBalance : 0;
    currentBalance = prevBalance * (1 + tradeReturn);

    balanceSeries.push(currentBalance);
    tradeReturns.push(tradeReturn);
  });

  const equityFinal = balanceSeries[balanceSeries.length - 1];
  const equityPeak = Math.max(...balanceSeries);

  const totalReturn = startBalance > 0 ? ((equityFinal - startBalance) / startBalance) * 100 : 0;

  // Calculate max drawdown
  let runningMax = startBalance;
  let maxDrawdown = 0;

  balanceSeries.forEach(balance => {
    if (balance > runningMax) {
      runningMax = balance;
    }
    const drawdown = ((runningMax - balance) / runningMax) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  // Calculate annualized return
  const startDate = new Date(sortedTrades[0].close_time || sortedTrades[0].time);
  const endDate = new Date(sortedTrades[sortedTrades.length - 1].close_time || sortedTrades[sortedTrades.length - 1].time);
  const daysDiff = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
  const yearsDiff = daysDiff / 365;
  let annualizedReturn = yearsDiff > 0 ? (Math.pow(1 + totalReturn / 100, 1 / yearsDiff) - 1) * 100 : 0;

  // Cap annualized return at 500% to prevent unrealistic values for short periods
  annualizedReturn = Math.min(annualizedReturn, 500);

  // Calculate expectancy
  const avgWin = profitableTradesCount > 0 ? grossProfit / profitableTradesCount : 0;
  const avgLoss = losingTradesCount > 0 ? grossLoss / losingTradesCount : 0;
  const expectancy = winRate * avgWin - (100 - winRate) * avgLoss;

  // Calculate volatility (standard deviation of returns)
  const meanReturn = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
  const variance = tradeReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / tradeReturns.length;
  const volatility = Math.sqrt(variance) * 100; // As percentage

  // Calculate Sharpe ratio (annualized)
  const riskFreeRate = 0.02; // 2% annual risk-free rate
  const excessReturns = tradeReturns.map(ret => ret - riskFreeRate / 365);
  const avgExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
  const sharpeRatio = volatility > 0 ? (avgExcessReturn / (volatility / 100)) * Math.sqrt(365) : 0;

  // Calculate Sortino ratio
  const downsideReturns = tradeReturns.filter(ret => ret < 0);
  const downsideDeviation = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((sum, ret) => sum + ret * ret, 0) / downsideReturns.length)
    : 0.0001;
  const sortinoRatio = downsideDeviation > 0 ? meanReturn / downsideDeviation : 0;

  // Risk per trade
  const riskPerTrade = tradeReturns.length > 0
    ? (tradeReturns.reduce((sum, ret) => sum + Math.abs(ret), 0) / tradeReturns.length) * 100
    : 0;

  // Recovery factor
  const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  // Calculate scores
  const performanceScore = normalizeScore(totalReturn, 0, 50, true) * 0.4 +
                          normalizeScore(annualizedReturn, 10, 100, true, 500) * 0.3 +
                          normalizeScore(winRate, 50, 80, true) * 0.3;

  const riskScore = normalizeScore(maxDrawdown, 30, 5, false) * 0.5 +
                   normalizeScore(volatility, 50, 20, false) * 0.3 +
                   normalizeScore(riskPerTrade, 5, 1, false) * 0.2;

  const consistencyScore = normalizeScore(volatility, 50, 10, false) * 0.5 +
                          (profitableTradesCount / Math.max(1, losingTradesCount + profitableTradesCount)) * 50;

  const accountHealthScore = normalizeScore(daysDiff, 30, 365, true) * 0.4 +
                           normalizeScore(totalTrades, 10, 100, true) * 0.3 +
                           normalizeScore(recoveryFactor, 1, 5, true) * 0.3;

  return {
    profit_percentage: parseFloat(totalReturn.toFixed(2)),
    win_rate: parseFloat(winRate.toFixed(2)),
    profit_factor: parseFloat(profitFactor.toFixed(2)),
    trading_days: Math.floor(daysDiff),
    current_win_streak: 0, // Simplified
    current_loss_streak: 0, // Simplified
    max_win_streak: 0, // Simplified
    max_loss_streak: 0, // Simplified
    total_trades: totalTrades,
    profitable_trades_count: profitableTradesCount,
    losing_trades_count: losingTradesCount,
    sharpe_ratio: parseFloat(sharpeRatio.toFixed(2)),
    sortino_ratio: parseFloat(sortinoRatio.toFixed(2)),
    max_drawdown: parseFloat(maxDrawdown.toFixed(2)),
    annualized_return: parseFloat(annualizedReturn.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(2)),
    risk_per_trade: parseFloat(riskPerTrade.toFixed(2)),
    recovery_factor: parseFloat(recoveryFactor.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    accountAge: Math.floor(daysDiff),
    trades: sortedTrades, // Include trades for account age calculation
    // Scores
    performance_score: Math.round(performanceScore),
    risk_score: Math.round(riskScore),
    consistency_score: Math.round(consistencyScore),
    account_health_score: Math.round(accountHealthScore)
  };
};

// Calculate ELO scores based on generalized benchmark normalization (same as Dashboard.jsx)
const calculateELOScores = (metrics) => {
  if (!metrics || !metrics.total_trades || metrics.total_trades === 0) {
    return {
      performance_score: 0,
      risk_score: 0,
      consistency_score: 0,
      account_health_score: 0,
      elo_score: 1000
    };
  }

  // Get account context for scaling and dynamic benchmarks
  const startEquity = 10000; // Default, should come from profile or trades
  const durationDays = metrics.accountAge || 30; // Use account age as proxy for duration
  const totalTrades = metrics.total_trades;

  // Detect asset type (crypto vs other) - simplified detection
  // In real implementation, this should come from trade symbols
  const isCrypto = false; // Placeholder - would detect from symbols like BTC, ETH, etc.

  // Scale dollar metrics to percentages relative to start equity
  const expectancyPct = metrics.expectancy ? (metrics.expectancy / startEquity) * 100 : 0;
  const bestTradePct = metrics.bestTrade ? (metrics.bestTrade / startEquity) * 100 : 0;
  const worstTradePct = metrics.worstTrade ? Math.abs(metrics.worstTrade / startEquity) * 100 : 0;

  // PERFORMANCE SCORE (0-100) with corrected benchmarks for strong profitability
  const perfSubs = {
    totalReturn: normalizeScore(metrics.profit_percentage, 0, 50, true), // 0% poor, 50% excellent
    annReturn: normalizeScore(metrics.annualized_return, 10, 100, true, 500), // 10% poor, 100% excellent, cap at 500%
    winRate: normalizeScore(metrics.win_rate, 50, 80, true), // 50% poor, 80% excellent
    profitFactor: normalizeScore(metrics.profit_factor, 1.0, 3.0, true, 10), // 1.0 poor, 3.0 excellent, cap at 10
    expectancy: normalizeScore(expectancyPct, 0, 0.5, true), // 0% poor, 0.5% excellent (scaled)
    bestTrade: normalizeScore(bestTradePct, 0, 5, true, 10) // 0% poor, 5% excellent, cap at 10%
  };
  const perfWeights = [0.15, 0.25, 0.20, 0.20, 0.10, 0.10];
  let performanceScore = perfWeights.reduce((sum, weight, i) =>
    sum + Object.values(perfSubs)[i] * weight, 0);

  // Penalize insufficient data
  if (totalTrades < 10) {
    performanceScore = Math.min(performanceScore, 70);
  }

  // RISK CONTROL SCORE (0-100) - corrected benchmarks for low DD/risk scenario
  const riskSubs = {
    maxDrawdown: normalizeScore(metrics.max_drawdown, 30, 5, false), // 30% poor, 5% excellent (negative)
    avgDrawdown: normalizeScore(metrics.avgDrawdown || 0, 10, 1, false), // 10% poor, 1% excellent (negative)
    recoveryFactor: normalizeScore(metrics.recovery_factor, 1, 10, true), // 1 poor, 10 excellent
    volatility: normalizeScore(metrics.volatility, 50, 20, false), // 50% poor, 20% excellent (negative)
    sharpeRatio: normalizeScore(metrics.sharpe_ratio, 0.5, 2.0, true, 5), // 0.5 poor, 2.0 excellent, cap at 5
    avgRiskTrade: normalizeScore(metrics.risk_per_trade, 5, 1, false) // 5% poor, 1% excellent (negative)
  };

  const riskWeights = [0.25, 0.15, 0.15, 0.15, 0.20, 0.10];
  const riskScore = riskWeights.reduce((sum, weight, i) =>
    sum + Object.values(riskSubs)[i] * weight, 0);

  // CONSISTENCY SCORE (0-100) with data sufficiency penalties
  const totalMonths = Math.max(1, Math.ceil(durationDays / 30));
  const positiveMonthsExcellent = totalMonths; // All months positive

  const consistencySubs = {
    roughness: normalizeScore(metrics.roughness, 5, 0.5, false), // 5% poor, 0.5% excellent
    positiveMonths: normalizeScore(metrics.positiveMonths, 3, 6, true), // 3 min, 6 excellent (fixed)
    freqStd: normalizeScore(metrics.freqStd, 2.0, 0.5, false), // 2.0 poor, 0.5 excellent
    sortinoRatio: normalizeScore(metrics.sortino_ratio, 1.0, 4.0, true, 10), // 1.0 min, 4.0 excellent, cap at 10
    calmarRatio: normalizeScore(metrics.calmarRatio, 1.0, 5.0, true), // 1.0 min, 5.0 excellent
    sqn: normalizeScore(metrics.sqn, 1.6, 3.0, true, 5) // 1.6 min, 3.0 excellent, cap at 5
  };
  const consistencyWeights = [0.10, 0.15, 0.10, 0.20, 0.20, 0.25];
  let consistencyScore = consistencyWeights.reduce((sum, weight, i) =>
    sum + Object.values(consistencySubs)[i] * weight, 0);

  // Penalize insufficient data
  if (totalTrades < 50) {
    consistencyScore *= Math.min(1, totalTrades / 50);
  }

  // ACCOUNT HEALTH SCORE (0-100) with maturity considerations
  const currentDate = new Date(2025, 11, 23); // Dec 23, 2025
  const firstTradeDate = new Date(Math.min(...(metrics.trades || []).map(t => new Date(t.close_time || t.time))));
  const actualAccountAge = Math.max(1, Math.ceil((currentDate - firstTradeDate) / (1000 * 60 * 60 * 24)));

  // Handle missing exposure time
  const exposureTime = metrics.exposureTime || 50; // Default to 50% if missing

  // Cap activity rate to prevent overtrading penalty
  const activityRate = Math.min(metrics.activityRate || 0, 100);

  const healthSubs = {
    accountAge: normalizeScore(actualAccountAge, 90, 365, true),
    tradingDays: normalizeScore(metrics.trading_days, 20, 100, true),
    activityRate: normalizeScore(activityRate, 10, 50, true), // Cap at 100
    exposureTime: normalizeScore(exposureTime, 100, 50, false),
    totalTrades: normalizeScore(totalTrades, 30, 200, true),
    worstTrade: normalizeScore(worstTradePct, 10, 1, false) // 10% poor, 1% excellent (scaled)
  };

  const healthWeights = [0.20, 0.15, 0.15, 0.15, 0.20, 0.10];
  const accountHealthScore = healthWeights.reduce((sum, weight, i) =>
    sum + Object.values(healthSubs)[i] * weight, 0);

  // TRADER ELO CALCULATION (Generalized formula)
  // ELO = 1000 + (Performance * 4 + Risk * 3 + Consistency * 2 + Health * 1) * 3
  let eloScore = 1000 + (performanceScore * 4 + riskScore * 3 + consistencyScore * 2 + accountHealthScore * 1) * 3;

  return {
    performance_score: Math.round(Math.max(0, Math.min(100, performanceScore))),
    risk_score: Math.round(Math.max(0, Math.min(100, riskScore))),
    consistency_score: Math.round(Math.max(0, Math.min(100, consistencyScore))),
    account_health_score: Math.round(Math.max(0, Math.min(100, accountHealthScore))),
    elo_score: Math.round(Math.max(1000, Math.min(4000, eloScore))) // Cap between 1000-4000
  };
};


export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchLeaderboard = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      // Get all trader profiles sorted by elo_score (ELO rating)
      const allProfiles = await localDataService.entities.TraderProfile.list('-elo_score');

      // Transform to leaderboard format
      const leaderboardData = allProfiles
        .filter(profile => profile.trader_score || profile.elo_score) // Accept either field
        .map((profile, index) => ({
          traderId: profile.id,
          traderName: profile.nickname || profile.id,
          tradingType: getTradingType(profile),
          winRate: profile.win_rate || profile.winRate || 0,
          elo: {
            eloScore: profile.elo_score || profile.trader_score || 1000,
            rawScore: profile.elo_score || profile.trader_score || 1000,
            reliability: {
              totalTrades: profile.total_trades || profile.totalTrades || 0,
              confidenceCoefficient: 0.8,
              dataCoverage: 0.9,
              reliabilityMultiplier: 1.0
            },
            category: getELOCategory(profile.elo_score || profile.trader_score || 1000),
            tradingType: getTradingType(profile),
            calculatedAt: profile.updated_at || new Date()
          }
        }));

      setLeaderboard(leaderboardData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback to empty leaderboard
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchLeaderboard();

    // Auto-refresh every 10 seconds for more responsive data
    const interval = setInterval(() => {
      fetchLeaderboard(false); // Don't show loading for auto-refresh
    }, 10000);

    // Refresh when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing leaderboard');
        fetchLeaderboard(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLeaderboard]);

  // Helper function to determine ELO category
  const getELOCategory = (eloScore) => {
    if (eloScore >= 3500) return 'Elite';
    if (eloScore >= 3000) return 'Professional';
    if (eloScore >= 2500) return 'Consistent';
    if (eloScore >= 2200) return 'Unstable';
    if (eloScore >= 1800) return 'Developing';
    if (eloScore >= 1400) return 'Intermediate';
    return 'Beginner';
  };

  // Helper function to determine trading type
  const getTradingType = (profile) => {
    // Check if profile already has trading_type saved
    if (profile.trading_type) {
      return profile.trading_type;
    }

    // Check if this is a crypto exchange connection
    if (profile.broker === 'Binance' || profile.broker === 'Bybit') {
      return 'Crypto';
    }

    // Check if this is a live cTrader account
    if (profile.is_live_account === true) {
      return 'Forex';
    }

    // For imported files without explicit trading_type, default to Forex
    if (profile.broker === 'Imported') {
      return 'Forex';
    }

    // Default fallback
    return 'Forex';
  };

  // Function to open profile modal
  const openProfileModal = async (traderId) => {
    try {
      console.log('🔍 Opening profile modal for trader:', traderId);

      // Load fresh profile data from database with pre-calculated metrics
      const freshProfile = await localDataService.entities.TraderProfile.get(traderId);
      console.log('📋 Fresh profile data:', freshProfile);

      if (freshProfile) {
        // Use pre-calculated metrics from profile (saved by Dashboard.jsx)
        const metrics = {
          win_rate: freshProfile.win_rate || 0,
          total_trades: freshProfile.total_trades || 0,
          profit_percentage: freshProfile.profit_percentage || freshProfile.totalReturn || 0,
          annualized_return: freshProfile.annualized_return || 0,
          max_drawdown: freshProfile.max_drawdown || 0,
          sharpe_ratio: freshProfile.sharpe_ratio || 0,
          trading_days: freshProfile.trading_days || 0,
          performance_score: freshProfile.performance_score || 0,
          risk_score: freshProfile.risk_score || 0,
          consistency_score: freshProfile.consistency_score || 0,
          account_health_score: freshProfile.account_health_score || 0
        };

        console.log('🧮 Using pre-calculated metrics from profile:', metrics);

        // Use pre-calculated ELO scores from profile
        const eloScores = {
          performance_score: freshProfile.performance_score || 0,
          risk_score: freshProfile.risk_score || 0,
          consistency_score: freshProfile.consistency_score || 0,
          account_health_score: freshProfile.account_health_score || 0,
          elo_score: freshProfile.elo_score || freshProfile.trader_score || 1000
        };

        console.log('🎯 Using pre-calculated ELO scores from profile:', eloScores);

        // Calculate global rank by comparing with all profiles
        const allProfiles = await localDataService.entities.TraderProfile.list('-elo_score');
        const userRank = allProfiles.findIndex(p => p.id === traderId) + 1;
        console.log('🏆 User rank calculation:', { traderId, allProfilesCount: allProfiles.length, userRank });

        // Get ELO category
        const category = getELOCategory(eloScores.elo_score);

        setSelectedProfile({
          ...freshProfile,
          metrics,
          eloScores,
          category,
          rank: userRank
        });
        setProfileModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Error loading profile for modal:', error);
    }
  };

  // Function to close profile modal
  const closeProfileModal = () => {
    setSelectedProfile(null);
    setProfileModalOpen(false);
  };

  const TopTraderPodium = ({ traderData, rank }) => {
    if (!traderData) return null;
    const { traderId, traderName, elo } = traderData;

    const height = rank === 1 ? 'h-48' : rank === 2 ? 'h-40' : 'h-32';
    const color = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-400';

    return (
      <div
        className="flex flex-col items-center justify-end cursor-pointer transition-transform hover:-translate-y-2 duration-300"
        onClick={() => openProfileModal(traderId)}
      >
        <div className="mb-4 relative">
          <div className={`w-20 h-20 rounded-full p-1 bg-[#e0e5ec] shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#a3b1c6] z-10 relative`}>
             <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
               <Users size={24} className="text-gray-600" />
             </div>
          </div>
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#e0e5ec] flex items-center justify-center text-xs font-bold shadow-[2px_2px_4px_#a3b1c6,-2px_-2px_4px_#ffffff] ${color}`}>
            {rank}
          </div>
        </div>
        <div className="mb-2 text-center">
           <p className="font-bold text-gray-700">{traderName || traderId}</p>
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-1">
               <Award size={16} style={{ color: getELOColor(elo.eloScore) }} />
               <p className="font-bold text-xl" style={{ color: getELOColor(elo.eloScore) }}>
                 {elo.eloScore.toFixed(1)}
               </p>
             </div>
             <p className="text-xs text-gray-600">{elo.category} • {tradingType}</p>
           </div>
           </div>
        <div className={`${height} w-24 bg-[#e0e5ec] rounded-t-2xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#a3b1c6] mx-2 flex items-end justify-center pb-4`}>
           <Trophy className={`${color}`} size={24} />
        </div>
      </div>
    );
  };

  // Helper function to get ELO color
  const getELOColor = (score) => {
    if (score >= 3500) return '#FFD700'; // Gold
    if (score >= 3000) return '#C0C0C0'; // Silver
    if (score >= 2500) return '#CD7F32'; // Bronze
    if (score >= 2200) return '#EF4444'; // Red
    if (score >= 1800) return '#06B6D4'; // Cyan
    if (score >= 1400) return '#3B82F6'; // Blue
    return '#6B7280'; // Gray
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-800">Global ELO Leaderboard</h1>
          <button
            onClick={() => fetchLeaderboard()}
            disabled={refreshing}
            className="p-2 rounded-full bg-[#e0e5ec] shadow-[-3px_-3px_6px_#ffffff,3px_3px_6px_#a3b1c6] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#a3b1c6] transition-all disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw size={20} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-gray-500 mb-2">Top performing traders ranked by Trader ELO score</p>
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Podium for Top 3 */}
      {!loading && leaderboard.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-16">
          <TopTraderPodium traderData={leaderboard[1]} rank={2} />
          <TopTraderPodium traderData={leaderboard[0]} rank={1} />
          <TopTraderPodium traderData={leaderboard[2]} rank={3} />
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Trader</div>
          <div className="col-span-2 text-right">ELO Score</div>
          <div className="col-span-1 text-right">Type</div>
          <div className="col-span-2 text-right">WinRate</div>
          <div className="col-span-2 text-right">Trades</div>
          </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading leaderboard...</div>
        ) : (
          leaderboard.map((item, index) => {
            const { traderId, traderName, elo, tradingType } = item;
            return (
            <NeumorphicCard
                key={traderId}
              className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:scale-[1.01] transition-transform cursor-pointer"
                onClick={() => openProfileModal(traderId)}
            >
              {/* Rank */}
              <div className="col-span-1 hidden md:block">
                <span className={`
                  font-bold text-lg
                  ${index < 3 ? 'text-gray-800' : 'text-gray-500'}
                `}>
                  #{index + 1}
                </span>
              </div>

              {/* Trader Info */}
              <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-inner flex-shrink-0 flex items-center justify-center">
                    <Users size={20} className="text-gray-500" />
                </div>
                <div>
                    <p className="font-bold text-gray-700">{traderName || traderId}</p>
                    <p className="text-xs text-gray-400 md:hidden">#{index + 1}</p>
                </div>
              </div>

                {/* ELO Score */}
              <div className="col-span-2 text-right">
                 <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <Award size={14} style={{ color: getELOColor(elo.eloScore) }} />
                        <span className="font-bold text-lg" style={{ color: getELOColor(elo.eloScore) }}>
                          {elo.eloScore.toFixed(1)}
                    </span>
                      </div>
                      <span className="text-xs text-gray-400 block md:hidden">ELO</span>
                 </div>
              </div>

              {/* Trading Type */}
              <div className="hidden md:block col-span-1 text-right">
                   <span className="text-sm font-medium" style={{
                     color: tradingType === 'Crypto' ? '#f97316' : '#3b82f6'
                   }}>
                     {tradingType}
                   </span>
              </div>

                {/* WinRate */}
              <div className="hidden md:block col-span-2 text-right">
                  <span className="font-medium text-gray-600">{item.winRate ? item.winRate.toFixed(1) + '%' : '0.0%'}</span>
              </div>

              {/* Total Trades */}
              <div className="hidden md:block col-span-2 text-right">
                  <span className="font-medium text-gray-600">{elo.reliability.totalTrades || 0}</span>
              </div>
            </NeumorphicCard>
            );
          })
        )}
      </div>

      {/* Profile Modal */}
      {profileModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#e0e5ec] p-1 shadow-[-6px_-6px_12px_#ffffff,6px_6px_12px_#a3b1c6]">
                  <img src={selectedProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProfile.traderId}`} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedProfile.traderName || selectedProfile.traderId}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedProfile.tradingType === 'Crypto'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {selectedProfile.tradingType === 'Crypto' ? (
                        <>
                          <BarChart3 size={12} className="mr-1" />
                          Crypto Trading
                        </>
                      ) : (
                        <>
                          <TrendingUp size={12} className="mr-1" />
                          Forex Trading
                        </>
                      )}
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <Eye size={12} className="mr-1" />
                      Public View
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={closeProfileModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* ELO Score */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Award size={20} style={{ color: getELOColor(selectedProfile.eloScores?.elo_score || selectedProfile.elo.eloScore) }} />
                  <span className="text-2xl font-bold" style={{ color: getELOColor(selectedProfile.eloScores?.elo_score || selectedProfile.elo.eloScore) }}>
                    {(selectedProfile.eloScores?.elo_score || selectedProfile.elo.eloScore || 1000).toFixed(1)}
                  </span>
                  <span className="text-gray-600">ELO</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedProfile.category || selectedProfile.elo.category}</p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-700">{selectedProfile.eloScores?.performance_score || selectedProfile.elo.performance_score || 0}</div>
                  <div className="text-sm text-blue-600">Performance</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-700">{selectedProfile.eloScores?.risk_score || selectedProfile.elo.risk_score || 0}</div>
                  <div className="text-sm text-green-600">Risk Control</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-700">{selectedProfile.eloScores?.consistency_score || selectedProfile.elo.consistency_score || 0}</div>
                  <div className="text-sm text-yellow-600">Consistency</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-700">{selectedProfile.eloScores?.account_health_score || selectedProfile.elo.account_health_score || 0}</div>
                  <div className="text-sm text-purple-600">Health</div>
                </div>
              </div>

              {/* Trading Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.win_rate ? selectedProfile.metrics.win_rate.toFixed(1) + '%' : '0.0%'}</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.total_trades || 0}</div>
                  <div className="text-sm text-gray-600">Total Trades</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.profit_percentage ? selectedProfile.metrics.profit_percentage.toFixed(2) + '%' : '0.00%'}</div>
                  <div className="text-sm text-gray-600">Total Return</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.annualized_return ? selectedProfile.metrics.annualized_return.toFixed(2) + '%' : '0.00%'}</div>
                  <div className="text-sm text-gray-600">Annual Return</div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.max_drawdown ? selectedProfile.metrics.max_drawdown.toFixed(2) + '%' : '0.00%'}</div>
                  <div className="text-sm text-gray-600">Max DD</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.profit_factor ? selectedProfile.metrics.profit_factor.toFixed(2) : '0.00'}</div>
                  <div className="text-sm text-gray-600">Profit Factor</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.sharpe_ratio ? selectedProfile.metrics.sharpe_ratio.toFixed(2) : '0.00'}</div>
                  <div className="text-sm text-gray-600">Sharpe Ratio</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.metrics?.trading_days || 0}</div>
                  <div className="text-sm text-gray-600">Trading Days</div>
                </div>
              </div>

              {/* Rank Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl text-center">
                <div className="text-lg font-semibold text-gray-800">
                  Global Rank: #{leaderboard.findIndex(p => p.traderId === selectedProfile.traderId) + 1}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Out of {leaderboard.length} traders
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}