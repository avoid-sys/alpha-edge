import React, { useEffect, useState } from 'react';
import { localDataService } from '@/services/localDataService';
import { securityService } from '@/services/securityService';
import { createPageUrl } from '@/utils';
import { Link, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Award,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  HelpCircle,
  X,
  Edit2,
  Check,
  Trash2,
  Share2
} from 'lucide-react';
import { NeumorphicCard, StatBox, NeumorphicButton } from '@/components/NeumorphicUI';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [trades, setTrades] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('1W'); // '1W', '1M', 'ALL'
  const [dataVersion, setDataVersion] = useState(0); // Force refresh counter
  const [helpPopup, setHelpPopup] = useState(null); // Current help popup
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profileId');
  const refreshParam = searchParams.get('refresh');

  // Check if user is viewing their own profile or someone else's
  const isOwnProfile = !profileId; // No profileId means viewing own profile

  // Check authentication

  // Force data refresh when refresh parameter is detected
  useEffect(() => {
    if (refreshParam) {
      setDataVersion(prev => prev + 1);
    }
  }, [refreshParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let fetchedProfile = null;
        let fetchedTrades = [];
        
        if (profileId) {
          fetchedProfile = await localDataService.entities.TraderProfile.get(profileId);
          fetchedTrades = await localDataService.entities.Trade.filter({ trader_profile_id: profileId });
        } else {
          try {
            const user = await localDataService.getCurrentUser();
            if (user) {
              const profiles = await localDataService.entities.TraderProfile.filter({
                created_by: user.email
              });
              if (profiles.length > 0) {
                fetchedProfile = profiles[0];
                fetchedTrades = await localDataService.entities.Trade.filter({ trader_profile_id: fetchedProfile.id });
              }
            }
          } catch (e) {
            // Not logged in or no profile
          }
        }
        
        // Calculate rank based on trader score - only for live connected accounts
        if (fetchedProfile && fetchedProfile.is_live_account) {
          const allProfiles = await localDataService.entities.TraderProfile.list('-trader_score');
          // Filter to only live accounts
          const liveProfiles = allProfiles.filter(p => p.is_live_account);
          const userRank = liveProfiles.findIndex(p => p.id === fetchedProfile.id) + 1;
          setRank(userRank);
        } else {
          setRank(null); // No rank for demo/file-only accounts
        }

        if (fetchedProfile && fetchedTrades.length > 0) {
          // Use real data from uploaded files
        setProfile(fetchedProfile);
          setTrades(fetchedTrades);
        } else {
          // Show empty state - no data uploaded yet
          setProfile(null);
          setTrades([]);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profileId, dataVersion]);

  // Initialize security and load connected platforms on component mount
  useEffect(() => {
    securityService.startSession();
    securityService.logSecurityEvent('dashboard_accessed', { profileId });
  }, []);

  // Calculate comprehensive trading metrics based on Python implementation
  const calculateMetricsFromData = (trades, profile) => {

    if (!trades || trades.length === 0 || !profile) {
      return {
        totalReturn: 0,
        winRate: 0,
        profitFactor: 0,
        expectancy: 0,
        bestTrade: 0,
        worstTrade: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        maxDrawdown: 0,
        avgDrawdown: 0,
        volatility: 0,
        annualizedReturn: 0,
        totalTrades: 0,
        avgRiskTrade: 0,
        roughness: 0,
        positiveMonths: 0,
        freqStd: 0,
        exposureTime: 0,
        sqn: 0,
        recoveryFactor: 0,
        accountAge: 0,
        tradingDays: 0,
        activityRate: 0
      };
    }

    try {
      // Sort trades by close time
      const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.close_time || a.time || 0) - new Date(b.close_time || b.time || 0)
      );

      // Calculate initial balance from first trade
      const firstTrade = sortedTrades[0];
      const initialBalance = parseFloat(firstTrade.balance || 10000) - parseFloat(firstTrade.net_profit || firstTrade.profit_loss || 0);

      // Build equity curve with PROPER COMPOUNDING (like Python)
      let currentBalance = initialBalance;
      const balanceSeries = [];
      const tradeDates = [];
      const tradeReturns = [];

      sortedTrades.forEach(trade => {
        const pnl = parseFloat(trade.net_profit || trade.profit_loss || 0);
        const prevBalance = currentBalance;
        // Compounding: multiply by (1 + return), not add PnL
        const tradeReturn = prevBalance > 0 ? pnl / prevBalance : 0;
        currentBalance = prevBalance * (1 + tradeReturn);

        balanceSeries.push(currentBalance);
        tradeDates.push(new Date(trade.close_time || trade.time));
        tradeReturns.push(tradeReturn);
      });

      // Start and End dates (more precise duration calculation)
      const startDate = tradeDates[0];
      const endDate = tradeDates[tradeDates.length - 1];
      const durationMs = endDate - startDate;
      const durationDays = Math.max(0.001, durationMs / (1000 * 60 * 60 * 24)); // More precise, avoid division by zero
      const durationYears = durationDays / 365;

      // Equity Final and Peak
      const equityFinal = balanceSeries[balanceSeries.length - 1];
      const equityPeak = Math.max(...balanceSeries);

      // Return %
      const totalReturn = initialBalance > 0 ? ((equityFinal - initialBalance) / initialBalance) * 100 : 0;

      // Build daily equity curve (forward-fill like Python)
      const dailyEquity = new Map();
      sortedTrades.forEach((trade, index) => {
        const dateKey = new Date(trade.close_time || trade.time).toDateString();
        dailyEquity.set(dateKey, balanceSeries[index]);
      });

      // Add initial balance at start
      const startDateKey = new Date(startDate.getTime() - 60 * 60 * 1000).toDateString(); // 1 hour before first trade
      dailyEquity.set(startDateKey, initialBalance);

      // Daily returns
      const dailyReturns = [];
      const dates = Array.from(dailyEquity.keys()).sort((a, b) => new Date(a) - new Date(b));
      for (let i = 1; i < dates.length; i++) {
        const prevEquity = dailyEquity.get(dates[i-1]);
        const currEquity = dailyEquity.get(dates[i]);
        if (prevEquity > 0) {
          dailyReturns.push((currEquity - prevEquity) / prevEquity);
        }
      }

      // Annualized Return (more precise compounded calculation)
      const annReturn = durationDays > 0 ? Math.pow(1 + totalReturn / 100, 365 / durationDays) - 1 : 0;
      const annReturnPct = annReturn * 100;

      // Volatility (Annualized with 252 trading days - more precise)
      const avgReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
      const variance = dailyReturns.length > 0 ?
        dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length : 0;
      const stdDev = Math.sqrt(variance);
      const annVol = dailyReturns.length > 1 ? stdDev * Math.sqrt(252) * 100 : 0;

      // Roughness (daily volatility proxy)
      const roughness = stdDev;

      // Sharpe Ratio (add risk-free rate = 0)
      const riskFreeRate = 0.04; // 4% annual
      const sharpeRatio = annVol > 0 ? (annReturn - riskFreeRate) / (annVol / 100) : 0;

      // Max Drawdown (using daily equity like Python)
      const cumMax = [];
      let runningMax = initialBalance;

      // Create daily equity array from map
      const dailyEquityArray = dates.map(date => dailyEquity.get(date));

      dailyEquityArray.forEach(equity => {
        runningMax = Math.max(runningMax, equity);
        cumMax.push(runningMax);
      });

      const drawdowns = dailyEquityArray.map((equity, i) => (equity - cumMax[i]) / cumMax[i]);
      const maxDrawdownPct = Math.min(...drawdowns) * -100; // Positive value

      // Trade metrics
      const totalTrades = sortedTrades.length;
      const winningTrades = sortedTrades.filter(t => parseFloat(t.net_profit || t.profit_loss || 0) > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      const tradePnls = sortedTrades.map(t => parseFloat(t.net_profit || t.profit_loss || 0));
      const bestTrade = Math.max(...tradePnls);
      const worstTrade = Math.min(...tradePnls);
      const avgTrade = tradePnls.reduce((a, b) => a + b, 0) / totalTrades;

      // Calculate winning and losing streaks
      let maxWinStreak = 0;
      let maxLoseStreak = 0;
      let currentWinStreak = 0;
      let currentLoseStreak = 0;

      for (let i = 0; i < tradePnls.length; i++) {
        const pnl = tradePnls[i];
        const isWin = pnl > 0;
        const isLoss = pnl < 0;

        if (isWin) {
          currentWinStreak++;
          currentLoseStreak = 0;
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else if (isLoss) {
          currentLoseStreak++;
          currentWinStreak = 0;
          maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
        } else {
          // Break streak on neutral trades
          currentWinStreak = 0;
          currentLoseStreak = 0;
        }
      }

      // Risk/Trade % (average |PnL| / Prev_Balance * 100 for all trades)
      const prevBalances = [initialBalance, ...balanceSeries.slice(0, -1)];
      const riskPcts = tradePnls.map((pnl, i) => {
        const prevBalance = parseFloat(prevBalances[i] || initialBalance);
        return prevBalance > 0 ? Math.abs(pnl) / prevBalance * 100 : 0;
      });
      const avgRiskTradePct = riskPcts.length > 0 ? riskPcts.reduce((a, b) => a + b, 0) / riskPcts.length : 0;

      // Exposure Time [%]
      const tradeDurations = sortedTrades.map(trade => {
        const openTime = new Date(trade.open_time || trade.time);
        const closeTime = new Date(trade.close_time || trade.time);
        return closeTime - openTime;
      });
      const totalExposureMs = tradeDurations.reduce((a, b) => a + b, 0);
      const exposureTime = durationMs > 0 ? (totalExposureMs / durationMs) * 100 : 0;

      // Profit Factor
      const grossProfit = tradePnls.filter(pnl => pnl > 0).reduce((a, b) => a + b, 0);
      const grossLoss = Math.abs(tradePnls.filter(pnl => pnl < 0).reduce((a, b) => a + b, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;

      // Expectancy
      const expectancy = avgTrade;

      // Positive Months
      const monthlyEquity = new Map();
      dailyEquityArray.forEach((equity, index) => {
        const date = new Date(dates[index]);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyEquity.has(monthKey)) {
          monthlyEquity.set(monthKey, []);
        }
        monthlyEquity.get(monthKey).push(equity);
      });

      let positiveMonths = 0;
      monthlyEquity.forEach(equityValues => {
        if (equityValues.length >= 2) {
          const monthReturn = (equityValues[equityValues.length - 1] - equityValues[0]) / equityValues[0];
          if (monthReturn > 0) positiveMonths++;
        }
      });

      // Freq Std (frequency standard deviation - std of daily trade counts)
      const dailyTradeCounts = new Map();
      sortedTrades.forEach(trade => {
        const dateKey = new Date(trade.close_time || trade.time).toDateString();
        dailyTradeCounts.set(dateKey, (dailyTradeCounts.get(dateKey) || 0) + 1);
      });

      const tradeCounts = Array.from(dailyTradeCounts.values());
      const avgTradeCount = tradeCounts.length > 0 ? tradeCounts.reduce((a, b) => a + b, 0) / tradeCounts.length : 0;
      const tradeCountVariance = tradeCounts.length > 0 ?
        tradeCounts.reduce((sum, count) => sum + Math.pow(count - avgTradeCount, 2), 0) / tradeCounts.length : 0;
      const freqStd = Math.sqrt(tradeCountVariance);

      // Sortino Ratio (downside volatility only)
      const downReturns = dailyReturns.filter(r => r < 0);
      const downAvg = downReturns.length > 0 ? downReturns.reduce((a, b) => a + b, 0) / downReturns.length : 0;
      const downVariance = downReturns.length > 0 ?
        downReturns.reduce((sum, ret) => sum + Math.pow(ret - downAvg, 2), 0) / downReturns.length : 0;
      const downStdDev = Math.sqrt(downVariance);
      const annDownVol = downReturns.length > 0 ? downStdDev * Math.sqrt(252) * 100 : 0;
      const sortinoRatio = annDownVol > 0 ? (annReturn - riskFreeRate) / (annDownVol / 100) : 0;

      // Calmar Ratio
      const calmarRatio = maxDrawdownPct > 0 ? (annReturnPct / 100) / (maxDrawdownPct / 100) : 0;

      // SQN (System Quality Number) - fixed with safeguard
      const tradeMean = tradeReturns.length > 0 ? tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length : 0;
      let tradeStdDev = 0;
      if (tradeReturns.length > 1) {
        const variance = tradeReturns.reduce((sum, ret) => sum + Math.pow(ret - tradeMean, 2), 0) / tradeReturns.length;
        tradeStdDev = Math.sqrt(variance);
      }
      // Safeguard against division by zero or near-zero
      tradeStdDev = Math.max(tradeStdDev, 1e-6);
      const sqn = tradeStdDev > 0 ? Math.sqrt(totalTrades) * (tradeMean / tradeStdDev) : 0;


      // Recovery Factor - net profit divided by max drawdown amount
      const maxDDAmount = Math.abs(maxDrawdownPct / 100) * equityPeak;
      const recoveryFactor = maxDDAmount > 0 ? totalReturn / maxDrawdownPct : 0;

      // Average Drawdown - calculate properly
      const drawdownPeriods = [];
      let currentDD = 0;
      let ddStart = null;

      dailyEquityArray.forEach((equity, i) => {
        const dd = (equity - cumMax[i]) / cumMax[i];
        if (dd < 0) {
          if (ddStart === null) ddStart = i;
          currentDD = Math.min(currentDD, dd);
        } else if (ddStart !== null) {
          drawdownPeriods.push(Math.abs(currentDD));
          currentDD = 0;
          ddStart = null;
        }
      });

      const avgDrawdownPct = drawdownPeriods.length > 0 ?
        (drawdownPeriods.reduce((a, b) => a + b, 0) / drawdownPeriods.length) * 100 : 0;

      // Account Age (days)
      const accountAge = Math.ceil(durationDays);

      // Trading Days (unique days with trades)
      const tradingDays = new Set(sortedTrades.map(trade => new Date(trade.close_time || trade.time).toDateString())).size;

      // Activity Rate
      const activityRate = accountAge > 0 ? (tradingDays / accountAge) * 100 : 0;

      const result = {
        totalReturn: totalReturn,
        winRate: winRate,
        profitFactor: profitFactor,
        expectancy: expectancy,
        bestTrade: bestTrade,
        worstTrade: worstTrade,
        sharpeRatio: sharpeRatio,
        sortinoRatio: sortinoRatio,
        calmarRatio: calmarRatio,
        maxDrawdown: maxDrawdownPct,
        avgDrawdown: avgDrawdownPct,
        volatility: annVol,
        annualizedReturn: annReturnPct,
        totalTrades: totalTrades,
        avgRiskTrade: avgRiskTradePct,
        roughness: roughness,
        positiveMonths: positiveMonths,
        freqStd: freqStd,
        exposureTime: exposureTime,
        sqn: sqn,
        recoveryFactor: recoveryFactor,
        accountAge: accountAge,
        tradingDays: tradingDays,
        activityRate: activityRate,
        maxWinStreak: maxWinStreak,
        maxLoseStreak: maxLoseStreak,
        currentStreak: currentWinStreak > 0 ? currentWinStreak : -currentLoseStreak
      };

      return result;

    } catch (error) {
      console.error('Error calculating metrics:', error);
        return {
          totalReturn: 0,
          winRate: 0,
          profitFactor: 0,
          expectancy: 0,
          bestTrade: 0,
          worstTrade: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          calmarRatio: 0,
          maxDrawdown: 0,
          avgDrawdown: 0,
          volatility: 0,
          annualizedReturn: 0,
          totalTrades: 0,
          avgRiskTrade: 0,
          roughness: 0,
          positiveMonths: 0,
          freqStd: 0,
          exposureTime: 0,
          sqn: 0,
          recoveryFactor: 0,
          accountAge: 0,
          tradingDays: 0,
          activityRate: 0,
          maxWinStreak: 0,
          maxLoseStreak: 0,
          currentStreak: 0
        };
    }
  };

  // Enhanced normalize score helper with cap and edge case handling
  const normalizeScore = (value, minThresh, excellentThresh, isPositive = true, capValue = null) => {
    if (value === null || value === undefined || isNaN(value)) return 50.0; // Neutral for missing data

    if (capValue !== null) {
      if (isPositive) {
        value = Math.min(value, capValue); // Cap maximum values
      } else {
        value = Math.max(value, capValue); // Cap minimum values for negative metrics
      }
    }

    if (isPositive) {
      // For positive metrics: higher value = higher score
      if (value <= minThresh) return 0;
      if (value >= excellentThresh) return 100;
      return (value - minThresh) / (excellentThresh - minThresh) * 100;
    } else {
      // For negative metrics: lower value = higher score
      if (value >= minThresh) return 0; // Worse than poor threshold
      if (value <= excellentThresh) return 100; // Better than excellent threshold
      return (minThresh - value) / (minThresh - excellentThresh) * 100;
    }
  };

  // Calculate ELO scores based on generalized benchmark normalization
  const calculateELOScores = (metrics) => {
    if (!metrics || !metrics.totalTrades || metrics.totalTrades === 0) {
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
    const totalTrades = metrics.totalTrades;

    // Detect asset type (crypto vs other) - simplified detection
    // In real implementation, this should come from trade symbols
    const isCrypto = false; // Placeholder - would detect from symbols like BTC, ETH, etc.

    // Scale dollar metrics to percentages relative to start equity
    const expectancyPct = metrics.expectancy ? (metrics.expectancy / startEquity) * 100 : 0;
    const bestTradePct = metrics.bestTrade ? (metrics.bestTrade / startEquity) * 100 : 0;
    const worstTradePct = metrics.worstTrade ? Math.abs(metrics.worstTrade / startEquity) * 100 : 0;

    // PERFORMANCE SCORE (0-100) with corrected benchmarks for strong profitability
    const perfSubs = {
      totalReturn: normalizeScore(metrics.totalReturn, 0, 50, true), // 0% poor, 50% excellent
      annReturn: normalizeScore(metrics.annualizedReturn, 10, 100, true, 500), // 10% poor, 100% excellent, cap at 500%
      winRate: normalizeScore(metrics.winRate, 50, 80, true), // 50% poor, 80% excellent
      profitFactor: normalizeScore(metrics.profitFactor, 1.0, 3.0, true, 10), // 1.0 poor, 3.0 excellent, cap at 10
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
      maxDrawdown: normalizeScore(metrics.maxDrawdown, 30, 5, false), // 30% poor, 5% excellent (negative)
      avgDrawdown: normalizeScore(metrics.avgDrawdown || 0, 10, 1, false), // 10% poor, 1% excellent (negative)
      recoveryFactor: normalizeScore(metrics.recoveryFactor, 1, 10, true), // 1 poor, 10 excellent
      volatility: normalizeScore(metrics.volatility, 50, 20, false), // 50% poor, 20% excellent (negative)
      sharpeRatio: normalizeScore(metrics.sharpeRatio, 0.5, 2.0, true, 5), // 0.5 poor, 2.0 excellent, cap at 5
      avgRiskTrade: normalizeScore(metrics.avgRiskTrade, 5, 1, false) // 5% poor, 1% excellent (negative)
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
      sortinoRatio: normalizeScore(metrics.sortinoRatio, 1.0, 4.0, true, 10), // 1.0 min, 4.0 excellent, cap at 10
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
    const firstTradeDate = new Date(Math.min(...trades.map(t => new Date(t.close_time || t.time))));
    const actualAccountAge = Math.max(1, Math.ceil((currentDate - firstTradeDate) / (1000 * 60 * 60 * 24)));

    // Handle missing exposure time
    const exposureTime = metrics.exposureTime || 50; // Default to 50% if missing

    // Cap activity rate to prevent overtrading penalty
    const activityRate = Math.min(metrics.activityRate || 0, 100);

    const healthSubs = {
      accountAge: normalizeScore(actualAccountAge, 90, 365, true),
      tradingDays: normalizeScore(metrics.tradingDays, 20, 100, true),
      activityRate: normalizeScore(activityRate, 10, 50, true), // Cap at 100
      exposureTime: normalizeScore(exposureTime, 100, 50, false),
      totalTrades: normalizeScore(totalTrades, 30, 200, true),
      worstTrade: normalizeScore(worstTradePct, 10, 1, false) // 10% poor, 1% excellent (scaled)
    };

    const healthWeights = [0.20, 0.15, 0.15, 0.15, 0.20, 0.10];
    const accountHealthScore = healthWeights.reduce((sum, weight, i) =>
      sum + Object.values(healthSubs)[i] * weight, 0);

    // No additional penalty for young accounts in corrected calculation

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

  // Calculate metrics when data is available
  const metrics = React.useMemo(() => {
    return calculateMetricsFromData(trades, profile);
  }, [trades, profile]);

  // Calculate ELO scores based on metrics
  const eloScores = React.useMemo(() => {
    return calculateELOScores(metrics);
  }, [metrics]);

  // Get ELO color based on generalized score ranges
  const getELOColor = (eloScore) => {
    if (eloScore >= 3500) return '#FFD700'; // Gold - Elite
    if (eloScore >= 3000) return '#C0C0C0'; // Silver - Professional
    if (eloScore >= 2500) return '#CD7F32'; // Bronze - Consistent
    if (eloScore >= 2200) return '#EF4444'; // Red - Unstable (более насыщенный)
    if (eloScore >= 1800) return '#06B6D4'; // Cyan - Developing (более насыщенный)
    if (eloScore >= 1400) return '#3B82F6'; // Blue - Intermediate (более насыщенный)
    if (eloScore >= 1200) return '#10B981'; // Green - Beginner (более насыщенный)
    return '#6B7280'; // Gray - Insufficient Data (более насыщенный)
  };

  // Handle name editing
  const handleEditName = () => {
    setEditedName(profile.nickname);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;

    try {
      await localDataService.entities.TraderProfile.update(profile.id, {
        nickname: editedName.trim()
      });
      setProfile({ ...profile, nickname: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Generate social media share image
  const handleGenerateShareImage = async () => {
    try {
      // Create a temporary div with the share content
      const shareDiv = document.createElement('div');
      shareDiv.style.position = 'absolute';
      shareDiv.style.left = '-9999px';
      shareDiv.style.top = '-9999px';
      shareDiv.style.width = '1400px';
      shareDiv.style.minHeight = '2000px';
      shareDiv.style.backgroundColor = '#ffffff';
      shareDiv.style.padding = '0px';
      shareDiv.style.borderRadius = '0px';
      shareDiv.style.border = '2px solid #1f2937';
      shareDiv.style.fontFamily = '"Times New Roman", serif';
      shareDiv.style.position = 'relative';
      shareDiv.style.overflow = 'visible';
      shareDiv.style.boxShadow = '0 0 30px rgba(0,0,0,0.15)';

      // Determine data source
      const dataSource = profile.is_live_account ? `${profile.broker} (Live Account)` : 'File Upload';

      // Professional hedge fund report header
      shareDiv.innerHTML = `
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(0,0,0,0.03); font-weight: bold; z-index: 0; pointer-events: none; user-select: none; font-family: 'Times New Roman', serif;">ALPHA EDGE</div>

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 50px; position: relative; z-index: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center;">
              <img src="/logo.png" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 20px; border: 3px solid rgba(255,255,255,0.2);" />
              <div>
                <h1 style="font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 1px;">ALPHA EDGE</h1>
                <p style="font-size: 14px; margin: 2px 0 0 0; opacity: 0.9;">Trading Analytics Platform</p>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; opacity: 0.8;">Report Generated</div>
              <div style="font-size: 14px; font-weight: 600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
            <h2 style="font-size: 24px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">TRADER PERFORMANCE REPORT</h2>
            <p style="font-size: 16px; margin: 5px 0 0 0; opacity: 0.9;">Comprehensive Analytics & Risk Assessment</p>
          </div>
        </div>

        <!-- Main Report Content -->
        <div style="padding: 50px; background: #ffffff; position: relative; z-index: 1;">
          <!-- Executive Summary -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">EXECUTIVE SUMMARY</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
              <div>
                <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px;">Trader Profile</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Name:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${profile.nickname}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Data Source:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${dataSource}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Account Age:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${metrics?.accountAge !== undefined ? metrics.accountAge + ' days' : '0 days'}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Global Rank:</td><td style="padding: 8px 0; color: #1f2937; font-weight: bold; color: #d97706;">#${rank || 'N/A'}</td></tr>
                </table>
              </div>
              <div>
                <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px;">Performance Overview</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 5px;">${metrics?.winRate !== undefined ? metrics.winRate.toFixed(1) + '%' : '0.0%'}</div>
                    <div style="font-size: 12px; color: #6b7280;">Win Rate</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 18px; font-weight: bold; color: #7c3aed; margin-bottom: 5px;">${metrics?.profitFactor !== undefined ? metrics.profitFactor.toFixed(2) : '0.00'}</div>
                    <div style="font-size: 12px; color: #6b7280;">Profit Factor</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 5px; filter: blur(4px);">****</div>
                    <div style="font-size: 12px; color: #6b7280;">Total Profit</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 5px;">${metrics?.totalTrades !== undefined ? metrics.totalTrades : '0'}</div>
                    <div style="font-size: 12px; color: #6b7280;">Total Trades</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Analytics Section -->
          <div style="margin-bottom: 40px; page-break-before: always;">
            <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">PERFORMANCE ANALYTICS</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 35px;">
              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Return Metrics</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Total Return:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.totalReturn !== undefined ? (metrics.totalReturn * 100).toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Annualized Return:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.annualizedReturn !== undefined ? (metrics.annualizedReturn * 100).toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Expectancy:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.expectancy !== undefined ? '$' + metrics.expectancy.toFixed(2) : '$0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">SQN:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.sqn !== undefined ? metrics.sqn.toFixed(2) : '0.00'}</td></tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Efficiency Metrics</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Profit Factor:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #7c3aed;">${metrics?.profitFactor !== undefined ? metrics.profitFactor.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Win Rate:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.winRate !== undefined ? metrics.winRate.toFixed(1) + '%' : '0.0%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Avg Win/Loss:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; filter: blur(3px);">**** / ****</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Best Trade:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669; filter: blur(3px);">****</td></tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Alpha Edge Score</h4>
                <div style="text-align: center; margin-bottom: 15px;">
                  <div style="font-size: 36px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">${eloScores?.elo_score || 1000}</div>
                  <div style="font-size: 14px; color: #6b7280;">Trader ELO Rating</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #059669;">${eloScores?.performance_score || 0}</div>
                    <div style="color: #6b7280;">Performance</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #d97706;">${eloScores?.risk_score || 0}</div>
                    <div style="color: #6b7280;">Risk</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #7c3aed;">${eloScores?.consistency_score || 0}</div>
                    <div style="color: #6b7280;">Consistency</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #0891b2;">${eloScores?.account_health_score || 0}</div>
                    <div style="color: #6b7280;">Health</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Assessment Section -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">RISK ASSESSMENT</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
              <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Risk Metrics</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Sharpe Ratio:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.sharpeRatio !== undefined ? metrics.sharpeRatio.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Sortino Ratio:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.sortinoRatio !== undefined ? metrics.sortinoRatio.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Max Drawdown:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #dc2626;">${metrics?.maxDrawdown !== undefined ? metrics.maxDrawdown.toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Avg Drawdown:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.avgDrawdown !== undefined ? metrics.avgDrawdown.toFixed(2) + '%' : '0.00%'}</td></tr>
                </table>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Trading Risk</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Risk per Trade:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; filter: blur(3px);">****</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Volatility:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.volatility !== undefined ? (metrics.volatility * 100).toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Recovery Factor:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.recoveryFactor !== undefined ? metrics.recoveryFactor.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Calmar Ratio:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.calmarRatio !== undefined ? metrics.calmarRatio.toFixed(2) : '0.00'}</td></tr>
                </table>
              </div>
            </div>
          </div>

          <!-- Trading Statistics Section -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">TRADING STATISTICS</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
              <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Trade Analysis</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Total Trades:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.totalTrades !== undefined ? metrics.totalTrades : '0'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Winning Trades:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.winRate !== undefined && metrics?.totalTrades !== undefined ? Math.round(metrics.winRate * metrics.totalTrades / 100) : '0'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Losing Trades:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #dc2626;">${metrics?.winRate !== undefined && metrics?.totalTrades !== undefined ? Math.round((100 - metrics.winRate) * metrics.totalTrades / 100) : '0'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Trade Frequency:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.totalTrades !== undefined && metrics?.accountAge !== undefined ? (metrics.totalTrades / metrics.accountAge).toFixed(1) + '/day' : '0.0/day'}</td></tr>
                </table>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Streak Analysis</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Max Win Streak:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.maxWinStreak || 0} trades</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Max Loss Streak:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #dc2626;">${metrics?.maxLoseStreak || 0} trades</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Current Streak:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.currentStreak !== undefined ? (metrics.currentStreak > 0 ? '+' + metrics.currentStreak : metrics.currentStreak) + ' trades' : '0 trades'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Avg Trade Duration:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.avgTradeDuration !== undefined ? Math.round(metrics.avgTradeDuration / 60) + 'min' : '0min'}</td></tr>
                </table>
              </div>
            </div>
          </div>

          <!-- Global Rank Showcase -->
          <div style="text-align: center; margin-top: 50px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 20px; padding: 30px; margin-bottom: 20px; border: 3px solid #f59e0b;">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px;">
                  <span style="color: white; font-size: 24px;">🏆</span>
                </div>
                <div>
                  <div style="font-size: 48px; font-weight: bold; color: white; line-height: 1;">#${rank || 'N/A'}</div>
                  <div style="font-size: 12px; color: #fbbf24; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">GLOBAL LEADERBOARD</div>
                </div>
              </div>
              <div style="font-size: 18px; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Elite Trading Community</div>
            </div>

            <div style="background: #f8fafc; border-radius: 15px; padding: 20px; border: 2px solid #e5e7eb; display: inline-block;">
              <div style="font-size: 16px; color: #374151; font-weight: 600;">Professional Trader Certification</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Alpha Edge Capital Management</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 50px; border-top: 1px solid #e5e7eb; text-align: center;">
          <div style="font-size: 12px; color: #9ca3af; margin-bottom: 10px;">This report is confidential and intended solely for the recipient. Generated by Alpha Edge Trading Analytics Platform.</div>
          <div style="font-size: 10px; color: #9ca3af;">© 2024 Alpha Edge. All rights reserved. | Share your achievements #AlphaEdge</div>
        </div>

          <!-- Risk Assessment Section -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">RISK ASSESSMENT</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
              <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Risk Metrics</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Sharpe Ratio:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.sharpeRatio !== undefined ? metrics.sharpeRatio.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Sortino Ratio:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.sortinoRatio !== undefined ? metrics.sortinoRatio.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Max Drawdown:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #dc2626;">${metrics?.maxDrawdown !== undefined ? metrics.maxDrawdown.toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Avg Drawdown:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.avgDrawdown !== undefined ? metrics.avgDrawdown.toFixed(2) + '%' : '0.00%'}</td></tr>
                </table>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Trading Risk</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Risk per Trade:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; filter: blur(3px);">****</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Volatility:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.volatility !== undefined ? (metrics.volatility * 100).toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Recovery Factor:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.recoveryFactor !== undefined ? metrics.recoveryFactor.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Calmar Ratio:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.calmarRatio !== undefined ? metrics.calmarRatio.toFixed(2) : '0.00'}</td></tr>
                </table>
              </div>
            </div>
          </div>

          <!-- Performance Analytics Section -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">PERFORMANCE ANALYTICS</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 35px;">
              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Return Metrics</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Total Return:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.totalReturn !== undefined ? (metrics.totalReturn * 100).toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Annualized Return:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.annualizedReturn !== undefined ? (metrics.annualizedReturn * 100).toFixed(2) + '%' : '0.00%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Expectancy:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.expectancy !== undefined ? '$' + metrics.expectancy.toFixed(2) : '$0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">SQN:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${metrics?.sqn !== undefined ? metrics.sqn.toFixed(2) : '0.00'}</td></tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Efficiency Metrics</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Profit Factor:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #7c3aed;">${metrics?.profitFactor !== undefined ? metrics.profitFactor.toFixed(2) : '0.00'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Win Rate:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">${metrics?.winRate !== undefined ? metrics.winRate.toFixed(1) + '%' : '0.0%'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Avg Win/Loss:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; filter: blur(3px);">**** / ****</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Best Trade:</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669; filter: blur(3px);">****</td></tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 15px; text-transform: uppercase;">Alpha Edge Score</h4>
                <div style="text-align: center; margin-bottom: 15px;">
                  <div style="font-size: 36px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">${eloScores?.elo_score || 1000}</div>
                  <div style="font-size: 14px; color: #6b7280;">Trader ELO Rating</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #059669;">${eloScores?.performance_score || 0}</div>
                    <div style="color: #6b7280;">Performance</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #d97706;">${eloScores?.risk_score || 0}</div>
                    <div style="color: #6b7280;">Risk</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #7c3aed;">${eloScores?.consistency_score || 0}</div>
                    <div style="color: #6b7280;">Consistency</div>
                  </div>
                  <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                    <div style="font-weight: 600; color: #0891b2;">${eloScores?.account_health_score || 0}</div>
                    <div style="color: #6b7280;">Health</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Performance Indicators -->
          <div style="margin-bottom: 35px;">
            <h3 style="text-align: center; font-size: 24px; font-weight: bold; color: #374151; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px;">Key Performance Indicators</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <!-- Win Rate Card -->
              <div style="background: #e0e5ec; border-radius: 20px; padding: 20px; text-align: center; box-shadow: -6px -6px 12px #ffffff, 6px 6px 12px #aeaec040; border: 2px solid rgba(255,255,255,0.4);">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #059669, #047857); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);">
                  <span style="color: white; font-size: 20px;">🎯</span>
                </div>
                <div style="font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 5px;">${metrics?.winRate !== undefined ? metrics.winRate.toFixed(1) + '%' : '0.0%'}</div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Win Rate</div>
              </div>

              <!-- Profit Factor Card -->
              <div style="background: #e0e5ec; border-radius: 20px; padding: 20px; text-align: center; box-shadow: -6px -6px 12px #ffffff, 6px 6px 12px #aeaec040; border: 2px solid rgba(255,255,255,0.4);">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);">
                  <span style="color: white; font-size: 20px;">💰</span>
                </div>
                <div style="font-size: 28px; font-weight: bold; color: #7c3aed; margin-bottom: 5px;">${metrics?.profitFactor !== undefined ? (metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)) : '0.00'}</div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Profit Factor</div>
              </div>

              <!-- Total Profit Card -->
              <div style="background: #e0e5ec; border-radius: 20px; padding: 20px; text-align: center; box-shadow: -6px -6px 12px #ffffff, 6px 6px 12px #aeaec040; border: 2px solid rgba(255,255,255,0.4);">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #374151, #1f2937); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 8px rgba(55, 65, 81, 0.3);">
                  <span style="color: white; font-size: 20px;">📊</span>
                </div>
                <div style="font-size: 28px; font-weight: bold; color: #374151; filter: blur(4px); margin-bottom: 5px;">****</div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Total Profit</div>
              </div>
            </div>
          </div>

          <!-- Advanced Metrics Section -->
          <div style="margin-bottom: 35px;">
            <h3 style="text-align: center; font-size: 20px; font-weight: bold; color: #6b7280; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Advanced Analytics</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <!-- Left Column -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div style="background: #e0e5ec; border-radius: 15px; padding: 15px; text-align: center; box-shadow: -4px -4px 8px #ffffff, 4px 4px 8px #aeaec040; border: 1px solid rgba(255,255,255,0.4);">
                  <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #4f46e5, #3730a3); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 0 3px 6px rgba(79, 70, 229, 0.3);">
                    <span style="color: white; font-size: 14px;">📅</span>
                  </div>
                  <div style="font-size: 20px; font-weight: bold; color: #4f46e5; margin-bottom: 3px;">${metrics?.accountAge !== undefined ? metrics.accountAge + 'd' : '0d'}</div>
                  <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Account Age</div>
                </div>

                <div style="background: #e0e5ec; border-radius: 15px; padding: 15px; text-align: center; box-shadow: -4px -4px 8px #ffffff, 4px 4px 8px #aeaec040; border: 1px solid rgba(255,255,255,0.4);">
                  <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 0 3px 6px rgba(220, 38, 38, 0.3);">
                    <span style="color: white; font-size: 14px;">📊</span>
                  </div>
                  <div style="font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 3px;">${metrics?.sharpeRatio !== undefined ? metrics.sharpeRatio.toFixed(2) : '0.00'}</div>
                  <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Sharpe Ratio</div>
                </div>
              </div>

              <!-- Right Column -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div style="background: #e0e5ec; border-radius: 15px; padding: 15px; text-align: center; box-shadow: -4px -4px 8px #ffffff, 4px 4px 8px #aeaec040; border: 1px solid rgba(255,255,255,0.4);">
                  <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #ea580c, #c2410c); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 0 3px 6px rgba(234, 88, 12, 0.3);">
                    <span style="color: white; font-size: 14px;">🎯</span>
                  </div>
                  <div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 3px;">${metrics?.sqn !== undefined ? metrics.sqn.toFixed(2) : '0.00'}</div>
                  <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase;">SQN</div>
                </div>

                <div style="background: #e0e5ec; border-radius: 15px; padding: 15px; text-align: center; box-shadow: -4px -4px 8px #ffffff, 4px 4px 8px #aeaec040; border: 1px solid rgba(255,255,255,0.4);">
                  <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #374151, #1f2937); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 0 3px 6px rgba(55, 65, 81, 0.3);">
                    <span style="color: white; font-size: 14px;">⚠️</span>
                  </div>
                  <div style="font-size: 20px; font-weight: bold; color: #374151; filter: blur(4px); margin-bottom: 3px;">****</div>
                  <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Risk/Trade</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trading Streaks & Volume -->
          <div style="margin-bottom: 35px;">
            <h3 style="text-align: center; font-size: 20px; font-weight: bold; color: #6b7280; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Trading Performance</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <!-- Winning Streak -->
              <div style="background: #e0e5ec; border-radius: 20px; padding: 20px; text-align: center; box-shadow: -6px -6px 12px #ffffff, 6px 6px 12px #aeaec040; border: 2px solid rgba(255,255,255,0.4);">
                <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #16a34a, #15803d); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 8px rgba(22, 163, 74, 0.3);">
                  <span style="color: white; font-size: 18px;">🔥</span>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 5px;">+${metrics?.maxWinStreak || 0}</div>
                <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Winning Streak</div>
              </div>

              <!-- Losing Streak -->
              <div style="background: #e0e5ec; border-radius: 20px; padding: 20px; text-align: center; box-shadow: -6px -6px 12px #ffffff, 6px 6px 12px #aeaec040; border: 2px solid rgba(255,255,255,0.4);">
                <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);">
                  <span style="color: white; font-size: 18px;">❌</span>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">-${metrics?.maxLoseStreak || 0}</div>
                <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Losing Streak</div>
              </div>

              <!-- Volume -->
              <div style="background: #e0e5ec; border-radius: 20px; padding: 20px; text-align: center; box-shadow: -6px -6px 12px #ffffff, 6px 6px 12px #aeaec040; border: 2px solid rgba(255,255,255,0.4);">
                <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);">
                  <span style="color: white; font-size: 18px;">📊</span>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #7c3aed; margin-bottom: 5px;">${metrics?.totalTrades !== undefined ? metrics.totalTrades : '0'}</div>
                <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Total Trades</div>
              </div>
            </div>
          </div>

          <!-- Global Rank Showcase -->
          <div style="text-align: center;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 25px; padding: 30px; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(30, 41, 59, 0.3); border: 3px solid #f59e0b;">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; box-shadow: 0 6px 12px rgba(245, 158, 11, 0.4);">
                  <span style="color: white; font-size: 24px;">🏆</span>
                </div>
                <div>
                  <div style="font-size: 48px; font-weight: bold; color: white; text-shadow: 0 3px 6px rgba(0,0,0,0.3); line-height: 1;">#${rank || 'N/A'}</div>
                  <div style="font-size: 12px; color: #fbbf24; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">RANK</div>
                </div>
              </div>
              <div style="font-size: 18px; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Global Leaderboard</div>
              <div style="font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500;">Elite Trading Community</div>
            </div>

            <!-- Achievement Badge -->
            <div style="background: #e0e5ec; border-radius: 15px; padding: 15px; box-shadow: inset -3px -3px 6px #ffffff, inset 3px 3px 6px #aeaec040; border: 2px solid rgba(255,255,255,0.4); display: inline-block;">
              <div style="font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Professional Trader</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #9ca3af;">
          Generated by Alpha Edge • Share your achievements #AlphaEdge
        </div>
      `;

      document.body.appendChild(shareDiv);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Wait for images and styles to load completely
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate canvas with ultra high quality
      const canvas = await html2canvas(shareDiv, {
        backgroundColor: '#ffffff',
        scale: 2, // Good quality for report rendering
        width: 1400,
        height: 2000,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 20000,
        removeContainer: true,
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1000,
        windowHeight: 800,
        onclone: async (clonedDoc) => {
          // Ensure all images are loaded in cloned document
          const images = clonedDoc.querySelectorAll('img');
          const promises = Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve;
                // Force reload image
                const src = img.src;
                img.src = '';
                img.src = src;
              }
            });
          });

          // Wait for fonts to load
          await document.fonts.ready;

          return Promise.all(promises);
        }
      });

      // Convert to blob and download with high quality
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alpha-edge-${profile.nickname}-trading-stats.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0); // Maximum quality

      // Remove temporary element
      document.body.removeChild(shareDiv);

      alert('High-quality share image generated! Check your downloads.');

    } catch (error) {
      console.error('Error generating share image:', error);
      alert('Error generating share image. Please try again.');
    }
  };

  // Handle data unlinking
  const handleUnlinkData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to unlink all trading data from your account?\n\n' +
      'This will permanently delete:\n' +
      '• All trade records\n' +
      '• Performance metrics\n' +
      '• Account statistics\n\n' +
      'You can upload new data afterwards, but the current data will be lost forever.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      // Delete all trades associated with this profile
      const trades = await localDataService.entities.Trade.filter({
        trader_profile_id: profile.id
      });

      for (const trade of trades) {
        await localDataService.entities.Trade.delete(trade.id);
      }

      // Reset profile metrics and data
      await localDataService.entities.TraderProfile.update(profile.id, {
        initial_balance: 1000,
        trader_score: 0,
        total_trades: 0,
        win_rate: 0,
        total_pnl: 0,
        // Keep other profile info like nickname, broker, etc.
      });

      // Refresh the page to show empty state
      window.location.reload();

    } catch (error) {
      console.error('Error unlinking data:', error);
      alert('Error unlinking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[50vh] text-gray-400">Loading statistics...</div>;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-24 h-24 bg-[#e0e5ec] rounded-full shadow-[-8px_-8px_16px_#ffffff,8px_8px_16px_#a3b1c6] flex items-center justify-center mb-8">
          <Activity size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{profileId ? 'Trader Not Found' : 'No Trading Account Found'}</h2>
        <p className="text-gray-500 mb-8">{profileId ? 'The requested trader profile does not exist.' : 'Connect your live trading account to view your dashboard.'}</p>
        {!profileId && (
          <Link to={createPageUrl('Connect')}>
            <NeumorphicButton variant="action">Connect Account</NeumorphicButton>
          </Link>
        )}
        {profileId && (
          <Link to={createPageUrl('Leaderboard')}>
             <NeumorphicButton>Back to Leaderboard</NeumorphicButton>
          </Link>
        )}
      </div>
    );
  }


  // Get current balance from last trade or account data
  const getCurrentBalance = (tradeList) => {
    if (tradeList.length > 0) {
      // Sort trades by date and get the latest balance
      const sortedTrades = [...tradeList].sort((a, b) => new Date(b.close_time) - new Date(a.close_time));
      const latestTrade = sortedTrades[0];
      return parseFloat(latestTrade.balance || 0).toFixed(2);
    }
    return '0.00'; // No trades yet
  };

  // Calculate equity curve data as percentages from initial balance
  const getEquityData = () => {
    if (trades.length === 0) return [];

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.close_time) - new Date(b.close_time));

    // Calculate initial balance
    let initialBalance = 10000; // Default
    if (sortedTrades.length > 0 && sortedTrades[0].balance) {
      // Use actual balance data if available
      initialBalance = sortedTrades[0].balance - sortedTrades[0].net_profit;
    }

    const equityPoints = sortedTrades.map((trade) => ({
      name: new Date(trade.close_time).toLocaleDateString(),
      value: initialBalance > 0 ? ((parseFloat(trade.balance || 0) - initialBalance) / initialBalance) * 100 : 0
    }));

    // Filter based on selected period
    let filteredPoints = equityPoints;
    const now = new Date();

    switch (chartPeriod) {
      case '1W':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredPoints = equityPoints.filter(point => {
          const pointDate = new Date(point.name);
          return pointDate >= oneWeekAgo;
        });
        break;
      case '1M':
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredPoints = equityPoints.filter(point => {
          const pointDate = new Date(point.name);
          return pointDate >= oneMonthAgo;
        });
        break;
      case 'ALL':
        // Keep all points
        break;
      default:
        filteredPoints = equityPoints.slice(-7);
    }

    return filteredPoints;
  };

  const equityData = profile ? getEquityData() : [];

  // Help content for each metric
  const helpContent = {
    performance: {
      title: "Performance Score",
      description: "Overall profitability rating combining total returns, annualized returns, win rate, profit factor, expectancy, and best trade. Higher scores indicate better trading performance and profit generation.",
      metrics: {
        "Total Return": "Total percentage return since account inception",
        "Ann. Return": "Annualized return percentage using compound growth formula",
        "Win Rate": "Percentage of profitable trades out of total trades executed",
        "Profit Factor": "Ratio of gross profits to gross losses (values >1 indicate profitability)",
        "Expectancy": "Average profit per trade scaled by account size (higher = better)",
        "Best Trade": "Largest single profitable trade scaled by account size"
      }
    },
    risk: {
      title: "Risk Control Score",
      description: "Risk management effectiveness combining drawdowns, volatility, Sharpe ratio, Sortino ratio, recovery factor, and risk per trade. Higher scores indicate better risk-adjusted performance.",
      metrics: {
        "Max DD": "Maximum Drawdown - largest peak-to-trough decline in account equity",
        "Avg DD": "Average Drawdown - mean of all drawdown periods",
        "Recovery Factor": "Net profit divided by maximum drawdown (higher = better recovery)",
        "Volatility": "Annualized standard deviation of daily returns (lower = more stable)",
        "Sharpe Ratio": "Risk-adjusted return using total volatility (higher = better risk-adjusted performance)",
        "Risk/Trade": "Average risk exposure per trade as percentage of account balance"
      }
    },
    consistency: {
      title: "Consistency Score",
      description: "Trading consistency measuring equity curve smoothness, monthly profitability, trade frequency stability, Sortino ratio, Calmar ratio, and System Quality Number. Higher scores indicate more predictable and stable performance.",
      metrics: {
        "Roughness": "Standard deviation of daily returns (lower = smoother equity curve)",
        "Positive Mos": "Number of months with positive returns (higher = more consistent)",
        "Freq Std": "Standard deviation of trades per day (lower = more regular trading)",
        "Sortino Ratio": "Risk-adjusted return using only downside volatility (higher = better)",
        "Calmar Ratio": "Annual return divided by maximum drawdown (higher = better risk-adjusted return)",
        "SQN": "System Quality Number - statistical measure of strategy quality (higher = better)"
      }
    },
    health: {
      title: "Account Health Score",
      description: "Overall account sustainability considering account age, trading activity, exposure time, and trade statistics. Higher scores indicate healthier and more established trading accounts.",
      metrics: {
        "Account Age": "Number of days since first trade (older accounts = more established)",
        "Trading Days": "Total number of days with trading activity",
        "Activity Rate": "Percentage of account age spent actively trading",
        "Exposure Time": "Percentage of time account had open positions (lower = more conservative)",
        "Total Trades": "Total number of closed trades executed",
        "Worst Trade": "Largest single loss scaled by account size (smaller losses = better)"
      }
    }
  };

  // Help popup component
  const HelpPopup = ({ metric, onClose }) => {
    if (!helpContent[metric]) return null;

    const content = helpContent[metric];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{content.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{content.description}</p>

          {content.metrics && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Component Metrics:</h4>
              <div className="space-y-2">
                {Object.entries(content.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start text-sm">
                    <span className="font-medium text-gray-700 min-w-0 flex-1">{key}:</span>
                    <span className="text-gray-600 ml-2 flex-1">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#e0e5ec] p-1 shadow-[-6px_-6px_12px_#ffffff,6px_6px_12px_#a3b1c6] mx-auto sm:mx-0">
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div className="text-center sm:text-left">
            {isEditingName ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl sm:text-3xl font-bold text-gray-800 bg-[#e0e5ec] rounded-lg px-3 py-1 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] w-full max-w-xs"
                  placeholder="Enter your name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 bg-green-100 rounded-lg text-green-600 hover:bg-green-200 transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 bg-red-100 rounded-lg text-red-600 hover:bg-red-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">{profile.nickname}</h1>
                {isOwnProfile && (
                  <div className="flex gap-2">
                  <button
                    onClick={handleEditName}
                    className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Edit name"
                  >
                    <Edit2 size={16} />
                  </button>
                    <button
                      onClick={handleGenerateShareImage}
                      className="p-2 bg-blue-100 rounded-lg text-blue-600 hover:bg-blue-200 transition-colors"
                      title="Generate share image"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={handleUnlinkData}
                      disabled={loading}
                      className="p-2 bg-red-100 rounded-lg text-red-600 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-400 transition-colors"
                      title="Unlink all trading data"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-gray-500">
              <span className="flex items-center gap-1"><Target size={14} /> {profile.broker}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                File Imported
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <NeumorphicCard className="px-6 py-3 flex items-center gap-3">
             <div className="p-2 bg-gray-200 rounded-lg text-gray-700">
                <Award size={20} />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Rank</p>
                <p className="text-lg font-bold text-gray-800">#{rank || 'N/A'}</p>
             </div>
          </NeumorphicCard>

          {isOwnProfile && (
            <NeumorphicCard className="px-6 py-3 flex items-center gap-3">
               <div className="p-2 bg-green-100 rounded-lg text-green-700">
                  <TrendingUp size={20} />
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Balance</p>
                  <p className="text-lg font-bold text-gray-800">${getCurrentBalance(trades)}</p>
               </div>
            </NeumorphicCard>
          )}

          <NeumorphicCard className="px-6 py-3 flex items-center gap-3">
             <div className="p-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: getELOColor(eloScores?.elo_score || 1000) + '20', color: getELOColor(eloScores?.elo_score || 1000) }}>
                <Award size={20} />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Trader ELO</p>
                <p className="text-lg font-bold text-gray-800">{eloScores?.elo_score || 1000}</p>
             </div>
          </NeumorphicCard>
        </div>
      </div>


      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
          <StatBox 
          title="Total Profit"
            value={metrics?.totalReturn !== undefined ? `${Math.abs(metrics.totalReturn) > 1000 ? (Number((metrics.totalReturn / 1000).toFixed(1))) + 'K%' : Number(metrics.totalReturn).toFixed(2) + '%'}` : '0.00%'}
          />

          <StatBox 
          title="Win Rate"
            value={metrics?.winRate !== undefined ? `${metrics.winRate.toFixed(1)}%` : '0.0%'}
            subValue={metrics?.winRate !== undefined && metrics?.totalTrades !== undefined ? `${Math.round(metrics.winRate * metrics.totalTrades / 100)}/${metrics.totalTrades > 999 ? (metrics.totalTrades / 1000).toFixed(1) + 'K' : metrics.totalTrades} trades` : '0/0 trades'}
          />

          <StatBox 
          title="Profit Factor"
            value={metrics?.profitFactor !== undefined ? (isFinite(metrics.profitFactor) ? (metrics.profitFactor > 999 ? '999+' : metrics.profitFactor.toFixed(2)) : '∞') : '0.00'}
            trend={metrics?.profitFactor !== undefined ? (metrics.profitFactor > 1.5 ? 12 : -5) : 0}
          />

          <StatBox 
          title="Account Age"
            value={metrics?.accountAge !== undefined ? `${metrics.accountAge} days` : '0 days'}
        />

        <StatBox
          title="Sharpe Ratio"
          value={metrics?.sharpeRatio !== undefined ? (Math.abs(metrics.sharpeRatio) > 99 ? '99+' : metrics.sharpeRatio.toFixed(2)) : '0.00'}
        />

        {isOwnProfile ? (
          <StatBox
            title="Expectancy"
            value={metrics?.expectancy !== undefined ? (Math.abs(metrics.expectancy) > 999999 ? '$999K+' : `$${Math.abs(metrics.expectancy) > 999 ? (metrics.expectancy / 1000).toFixed(1) + 'K' : metrics.expectancy.toFixed(2)}`) : '$0.00'}
          />
        ) : (
          <StatBox 
            title="Total Trades"
            value={metrics?.totalTrades > 999 ? (metrics.totalTrades / 1000).toFixed(1) + 'K' : (metrics?.totalTrades || 0).toString()}
            trend={metrics?.totalTrades || 0}
          />
        )}
      </div>

      {/* Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">

        {/* Left Column: Chart & Detailed Stats */}
        <div className="lg:col-span-3 space-y-4 lg:space-y-8">
          {/* Chart Section */}
          <NeumorphicCard className="p-6 min-h-[350px]">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-700">Equity Curve</h3>
                <div className="flex gap-2">
                   <button
                     onClick={() => setChartPeriod('1W')}
                     className={`px-4 py-1 rounded-lg text-xs font-bold shadow-inner transition-colors ${
                       chartPeriod === '1W'
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     1W
                   </button>
                   <button
                     onClick={() => setChartPeriod('1M')}
                     className={`px-4 py-1 rounded-lg text-xs font-bold shadow-inner transition-colors ${
                       chartPeriod === '1M'
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     1M
                   </button>
                   <button
                     onClick={() => setChartPeriod('ALL')}
                     className={`px-4 py-1 rounded-lg text-xs font-bold shadow-inner transition-colors ${
                       chartPeriod === 'ALL'
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     ALL
                   </button>
                </div>
             </div>
             
             <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff' }}
                      formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </NeumorphicCard>

          {/* Detailed Streaks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <NeumorphicCard className="p-6">
                <h4 className="text-gray-500 font-bold text-sm uppercase mb-4 tracking-wider">Winning Streaks</h4>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Streak</p>
                      <p className="text-lg font-bold text-green-600">+{metrics?.maxWinStreak || 0}</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Streak</p>
                      <p className="text-lg font-bold text-green-600">+0</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                </div>
             </NeumorphicCard>

             <NeumorphicCard className="p-6">
                <h4 className="text-gray-500 font-bold text-sm uppercase mb-4 tracking-wider">Losing Streaks</h4>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Max Streak</p>
                      <p className="text-lg font-bold text-red-500">-{metrics?.maxLoseStreak || 0}</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Streak</p>
                      <p className="text-lg font-bold text-red-500">-0</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                </div>
             </NeumorphicCard>
          </div>

          {/* Capital Under Management - Coming Soon */}
          <NeumorphicCard className="p-6">
             <h4 className="text-gray-500 font-bold text-sm uppercase mb-4 tracking-wider">Capital Under Management</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ filter: 'blur(2px)', opacity: 0.6 }}>
                <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-inner border border-white/50">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Total Capital</p>
                   <p className="text-xl font-bold text-blue-600">$1,250,000</p>
                   <p className="text-[10px] text-gray-400">under management</p>
                </div>
                <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-inner border border-white/50">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Active Accounts</p>
                   <p className="text-xl font-bold text-green-600">247</p>
                   <p className="text-[10px] text-gray-400">managed accounts</p>
                </div>
                <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-inner border border-white/50">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Avg Account Size</p>
                   <p className="text-xl font-bold text-purple-600">$5,060</p>
                   <p className="text-[10px] text-gray-400">per account</p>
                </div>
                <div className="bg-[#e0e5ec] p-4 rounded-xl shadow-inner border border-white/50">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Performance Fee</p>
                   <p className="text-xl font-bold text-orange-600">15%</p>
                   <p className="text-[10px] text-gray-400">of profits</p>
                </div>
             </div>
             <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 italic">Coming Soon - Feature Under Development</p>
             </div>
          </NeumorphicCard>

        </div>

        {/* Right Column: Score Analysis */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
           <NeumorphicCard className="p-6 min-h-[955px] flex flex-col">
              <h3 className="text-xl font-bold text-gray-700 mb-6">Score Analysis</h3>

              <div className="flex-1 flex flex-col justify-center gap-8">
                 <div className="space-y-6">
                   {/* Performance */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</p>
                             <button
                               onClick={() => setHelpPopup('performance')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{eloScores.performance_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${eloScores.performance_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] sm:text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Total Return:</span> <span className="font-medium text-gray-700">{metrics?.totalReturn !== undefined ? metrics.totalReturn.toFixed(2) + '%' : '0.00%'}</span></div>
                          <div className="flex justify-between"><span>Ann. Return:</span> <span className="font-medium text-gray-700">{metrics?.annualizedReturn !== undefined ? metrics.annualizedReturn.toFixed(2) + '%' : '0.00%'}</span></div>
                          <div className="flex justify-between"><span>Win Rate:</span> <span className="font-medium text-gray-700">{metrics?.winRate !== undefined ? metrics.winRate.toFixed(1) + '%' : '0.0%'}</span></div>
                          <div className="flex justify-between"><span>Profit Factor:</span> <span className="font-medium text-gray-700">{metrics?.profitFactor !== undefined ? (metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>Expectancy:</span> <span className="font-medium text-gray-700">${metrics?.expectancy !== undefined ? (Math.abs(metrics.expectancy) > 999 ? (metrics.expectancy / 1000).toFixed(1) + 'K' : metrics.expectancy.toFixed(2)) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>Best Trade:</span> <span className="font-medium text-gray-700">${metrics?.bestTrade !== undefined ? (Math.abs(metrics.bestTrade) > 999 ? (metrics.bestTrade / 1000).toFixed(1) + 'K' : metrics.bestTrade.toFixed(2)) : '0.00'}</span></div>
                       </div>
                   </div>

                   {/* Risk Control */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Control</p>
                             <button
                               onClick={() => setHelpPopup('risk')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{eloScores.risk_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${eloScores.risk_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] sm:text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Max DD:</span> <span className="font-medium text-gray-700">{metrics?.maxDrawdown !== undefined ? metrics.maxDrawdown.toFixed(2) + '%' : '0.00%'}</span></div>
                          <div className="flex justify-between"><span>Avg DD:</span> <span className="font-medium text-gray-700">{metrics?.avgDrawdown !== undefined ? metrics.avgDrawdown.toFixed(2) + '%' : '0.00%'}</span></div>
                          <div className="flex justify-between"><span>Recovery Factor:</span> <span className="font-medium text-gray-700">{metrics?.recoveryFactor !== undefined ? (metrics.recoveryFactor === Infinity ? '∞' : metrics.recoveryFactor.toFixed(2)) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>Volatility:</span> <span className="font-medium text-gray-700">{metrics?.volatility !== undefined ? metrics.volatility.toFixed(2) + '%' : '0.00%'}</span></div>
                          <div className="flex justify-between"><span>Sharpe Ratio:</span> <span className="font-medium text-gray-700">{metrics?.sharpeRatio !== undefined ? metrics.sharpeRatio.toFixed(2) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>Risk/Trade:</span> <span className="font-medium text-gray-700">{metrics?.avgRiskTrade !== undefined ? metrics.avgRiskTrade.toFixed(2) + '%' : '0.00%'}</span></div>
                       </div>
                   </div>

                   {/* Consistency */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consistency</p>
                             <button
                               onClick={() => setHelpPopup('consistency')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{eloScores.consistency_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${eloScores.consistency_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] sm:text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Roughness:</span> <span className="font-medium text-gray-700">{metrics?.roughness !== undefined ? metrics.roughness.toFixed(2) + '%' : '0.00%'}</span></div>
                          <div className="flex justify-between"><span>Positive Mos:</span> <span className="font-medium text-gray-700">{metrics?.positiveMonths !== undefined ? metrics.positiveMonths : '0'}</span></div>
                          <div className="flex justify-between"><span>Freq Std:</span> <span className="font-medium text-gray-700">{metrics?.freqStd !== undefined ? metrics.freqStd.toFixed(2) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>Sortino Ratio:</span> <span className="font-medium text-gray-700">{metrics?.sortinoRatio !== undefined ? metrics.sortinoRatio.toFixed(2) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>Calmar Ratio:</span> <span className="font-medium text-gray-700">{metrics?.calmarRatio !== undefined ? metrics.calmarRatio.toFixed(2) : '0.00'}</span></div>
                          <div className="flex justify-between"><span>SQN:</span> <span className="font-medium text-gray-700">{metrics?.sqn !== undefined ? metrics.sqn.toFixed(2) : '0.00'}</span></div>
                       </div>
                   </div>

                   {/* Account Health */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Health</p>
                             <button
                               onClick={() => setHelpPopup('health')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{eloScores.account_health_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${eloScores.account_health_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] sm:text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Account Age:</span> <span className="font-medium text-gray-700">{metrics?.accountAge !== undefined ? metrics.accountAge + ' days' : '0 days'}</span></div>
                          <div className="flex justify-between"><span>Trading Days:</span> <span className="font-medium text-gray-700">{metrics?.tradingDays !== undefined ? metrics.tradingDays : '0'}</span></div>
                          <div className="flex justify-between"><span>Activity Rate:</span> <span className="font-medium text-gray-700">{metrics?.activityRate !== undefined ? metrics.activityRate.toFixed(1) + '%' : '0.0%'}</span></div>
                          <div className="flex justify-between"><span>Exposure Time:</span> <span className="font-medium text-gray-700">{metrics?.exposureTime !== undefined ? metrics.exposureTime.toFixed(1) + '%' : '0.0%'}</span></div>
                          <div className="flex justify-between"><span>Total Trades:</span> <span className="font-medium text-gray-700">{metrics?.totalTrades !== undefined ? metrics.totalTrades : '0'}</span></div>
                          <div className="flex justify-between"><span>Worst Trade:</span> <span className="font-medium text-gray-700">${metrics?.worstTrade !== undefined ? (Math.abs(metrics.worstTrade) > 999 ? (metrics.worstTrade / 1000).toFixed(1) + 'K' : metrics.worstTrade.toFixed(2)) : '0.00'}</span></div>
                       </div>
                   </div>
                 </div>


                 <div className="pt-6 border-t border-gray-300/50 space-y-4">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-2">Volume Breakdown</p>
                        <div className="flex justify-between items-baseline mb-1">
                           <span className="text-2xl font-bold text-gray-800">{metrics?.totalTrades !== undefined ? (metrics.totalTrades > 999 ? (metrics.totalTrades / 1000).toFixed(1) + 'K' : metrics.totalTrades) : 0} <span className="text-sm font-normal text-gray-500">trades</span></span>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                           <span className="flex items-center gap-1 text-green-600"><ArrowUpRight size={14} /> {metrics?.winRate !== undefined && metrics?.totalTrades !== undefined ? Math.round(metrics.winRate * metrics.totalTrades / 100) : 0} Won</span>
                           <span className="flex items-center gap-1 text-red-500"><ArrowDownRight size={14} /> {metrics?.winRate !== undefined && metrics?.totalTrades !== undefined ? (metrics.totalTrades - Math.round(metrics.winRate * metrics.totalTrades / 100)) : 0} Lost</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Buy Orders</p>
                           <p className="text-lg font-bold text-green-600">{trades.filter(t => t.direction === 'Buy').length}</p>
                           <p className="text-[10px] text-gray-400">trades</p>
                           <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-green-600">Won:</span>
                                 <span className="font-semibold text-green-600">{trades.filter(t => t.direction === 'Buy' && parseFloat(t.net_profit) > 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-red-500">Lost:</span>
                                 <span className="font-semibold text-red-500">{trades.filter(t => t.direction === 'Buy' && parseFloat(t.net_profit) <= 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px] pt-1 border-t border-gray-200">
                                 <span>Win Rate:</span>
                                 <span className="font-semibold">{trades.filter(t => t.direction === 'Buy').length > 0 ? ((trades.filter(t => t.direction === 'Buy' && parseFloat(t.net_profit) > 0).length / trades.filter(t => t.direction === 'Buy').length) * 100).toFixed(1) : 0}%</span>
                              </div>
                           </div>
                        </div>
                        <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sell Orders</p>
                           <p className="text-lg font-bold text-red-600">{trades.filter(t => t.direction === 'Sell').length}</p>
                           <p className="text-[10px] text-gray-400">trades</p>
                           <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-green-600">Won:</span>
                                 <span className="font-semibold text-green-600">{trades.filter(t => t.direction === 'Sell' && parseFloat(t.net_profit) > 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-red-500">Lost:</span>
                                 <span className="font-semibold text-red-500">{trades.filter(t => t.direction === 'Sell' && parseFloat(t.net_profit) <= 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px] pt-1 border-t border-gray-200">
                                 <span>Win Rate:</span>
                                 <span className="font-semibold">{trades.filter(t => t.direction === 'Sell').length > 0 ? ((trades.filter(t => t.direction === 'Sell' && parseFloat(t.net_profit) > 0).length / trades.filter(t => t.direction === 'Sell').length) * 100).toFixed(1) : 0}%</span>
                              </div>
                           </div>
                        </div>
                        {isOwnProfile && (
                          <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Volume</p>
                             <p className="text-lg font-bold text-blue-600">{trades.reduce((sum, t) => sum + (parseFloat(t.volume) || 0), 0).toFixed(2)}</p>
                             <p className="text-[10px] text-gray-400">lots</p>
                          </div>
                        )}
                    </div>
                 </div>
              </div>
           </NeumorphicCard>

        </div>

      </div>

      {/* Help Popup */}
      {helpPopup && <HelpPopup metric={helpPopup} onClose={() => setHelpPopup(null)} />}
    </div>
  );
}