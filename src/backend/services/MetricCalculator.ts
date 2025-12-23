import { TradeData, AccountData, MetricResult, MetricDependency } from '../types/elo';

/**
 * Metric Calculator - Strict Implementation
 * No assumptions, interpolations, or default values allowed
 */
export class MetricCalculator {
  private static instance: MetricCalculator;

  static getInstance(): MetricCalculator {
    if (!MetricCalculator.instance) {
      MetricCalculator.instance = new MetricCalculator();
    }
    return MetricCalculator.instance;
  }

  /**
   * Check if all required dependencies are available
   */
  private hasRequiredData(data: any, required: string[]): boolean {
    return required.every(field => {
      const value = data[field];
      return value !== undefined && value !== null;
    });
  }

  /**
   * Calculate confidence based on optional dependencies
   */
  private calculateConfidence(data: any, required: string[], optional: string[] = []): number {
    const totalDeps = required.length + optional.length;
    if (totalDeps === 0) return 1;

    const availableDeps = [...required, ...optional].filter(field => {
      const value = data[field];
      return value !== undefined && value !== null;
    });

    return availableDeps.length / totalDeps;
  }

  // PERFORMANCE METRICS

  /**
   * Annualized Return
   * Requires: initial_balance, final_balance, days_active
   */
  calculateAnnualizedReturn(trades: TradeData[], account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: ['initialBalance', 'finalBalance', 'daysActive']
    };

    // Get final balance from account data or calculate from trades
    let finalBalance = account.equityHistory?.[account.equityHistory.length - 1]?.equity;
    if (!finalBalance && account.balanceHistory?.length) {
      finalBalance = account.balanceHistory[account.balanceHistory.length - 1].balance;
    }

    const daysActive = account.accountAgeDays;

    if (!this.hasRequiredData({ initialBalance: account.initialBalance, finalBalance, daysActive }, dependencies.required)) {
      return {
        name: 'annualizedReturn',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Annualized Return requires initial balance, final balance, and account age'
      };
    }

    const yearsActive = daysActive! / 365;
    const totalReturn = (finalBalance! - account.initialBalance) / account.initialBalance;
    const annualizedReturn = (Math.pow(1 + totalReturn, 1 / yearsActive) - 1) * 100;

    return {
      name: 'annualizedReturn',
      value: Math.max(-100, Math.min(1000, annualizedReturn)), // Clamp to reasonable range
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Annualized Return (%)'
    };
  }

  /**
   * Win Rate
   * Requires: total_trades, winning_trades
   */
  calculateWinRate(trades: TradeData[]): MetricResult {
    const dependencies: MetricDependency = {
      required: ['totalTrades', 'winningTrades']
    };

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;

    if (!this.hasRequiredData({ totalTrades, winningTrades }, dependencies.required) || totalTrades === 0) {
      return {
        name: 'winRate',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Win Rate requires trade data'
      };
    }

    const winRate = (winningTrades / totalTrades) * 100;

    return {
      name: 'winRate',
      value: winRate,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Win Rate (%)'
    };
  }

  /**
   * Average Risk-Reward Ratio
   * Requires: stop_loss, take_profit OR realized_rr
   */
  calculateAverageRR(trades: TradeData[]): MetricResult {
    const dependencies: MetricDependency = {
      required: [], // Either realizedRR or (stopLoss + takeProfit)
      optional: ['realizedRR', 'stopLoss', 'takeProfit']
    };

    // Try to use realized RR first
    const realizedRRs = trades
      .map(t => t.realizedRR)
      .filter(rr => rr !== undefined && rr > 0);

    if (realizedRRs.length > 0) {
      const avgRR = realizedRRs.reduce((sum, rr) => sum + rr!, 0) / realizedRRs.length;
      return {
        name: 'averageRR',
        value: avgRR,
        status: 'available',
        confidence: this.calculateConfidence({ realizedRR: true }, [], ['realizedRR']),
        dependencies,
        description: 'Average Risk-Reward Ratio (from realized data)'
      };
    }

    // Try to calculate from stop loss and take profit
    const tradesWithSLTP = trades.filter(t =>
      t.stopLoss !== undefined &&
      t.takeProfit !== undefined &&
      t.entryPrice !== undefined &&
      t.stopLoss > 0 &&
      t.takeProfit > 0
    );

    if (tradesWithSLTP.length === 0) {
      return {
        name: 'averageRR',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Average RR requires either realized RR data or stop loss/take profit levels'
      };
    }

    const rrRatios = tradesWithSLTP.map(t => {
      const risk = Math.abs(t.entryPrice! - t.stopLoss!);
      const reward = Math.abs(t.takeProfit! - t.entryPrice!);
      return risk > 0 ? reward / risk : 0;
    });

    const avgRR = rrRatios.reduce((sum, rr) => sum + rr, 0) / rrRatios.length;

    return {
      name: 'averageRR',
      value: avgRR,
      status: 'available',
      confidence: this.calculateConfidence({ stopLoss: true, takeProfit: true }, [], ['stopLoss', 'takeProfit']),
      dependencies,
      description: 'Average Risk-Reward Ratio (calculated from SL/TP)'
    };
  }

  /**
   * Expectancy
   * Requires: win_rate, avg_win, avg_loss
   */
  calculateExpectancy(trades: TradeData[], winRate: number): MetricResult {
    const dependencies: MetricDependency = {
      required: ['winRate', 'avgWin', 'avgLoss']
    };

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);

    if (winningTrades.length === 0 || losingTrades.length === 0) {
      return {
        name: 'expectancy',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Expectancy requires both winning and losing trades'
      };
    }

    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length);

    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

    return {
      name: 'expectancy',
      value: expectancy,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Expectancy (expected profit per trade)'
    };
  }

  // RISK METRICS

  /**
   * Maximum Drawdown
   * Requires: equity_curve
   */
  calculateMaxDrawdown(account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: ['equityCurve']
    };

    const equityCurve = account.equityHistory;
    if (!equityCurve || equityCurve.length < 2) {
      return {
        name: 'maxDrawdown',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Max Drawdown requires equity history'
      };
    }

    let maxDrawdown = 0;
    let peak = equityCurve[0].equity;

    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = (peak - point.equity) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return {
      name: 'maxDrawdown',
      value: maxDrawdown * 100, // Convert to percentage
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Maximum Drawdown (%)'
    };
  }

  /**
   * Volatility (Standard Deviation of Returns)
   * Requires: daily_returns
   */
  calculateVolatility(account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: ['dailyReturns']
    };

    const dailyReturns = account.dailyReturns;
    if (!dailyReturns || dailyReturns.length < 2) {
      return {
        name: 'volatility',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Volatility requires daily returns data'
      };
    }

    // Calculate standard deviation
    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility

    return {
      name: 'volatility',
      value: volatility * 100, // Convert to percentage
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Annualized Volatility (%)'
    };
  }

  /**
   * Average Risk per Trade
   * Requires: risk_percent OR (stop_loss + position_size)
   */
  calculateAverageRiskPerTrade(trades: TradeData[], account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: [], // Either riskPercent or (stopLoss + positionSize)
      optional: ['riskPercent', 'stopLoss', 'positionSize']
    };

    // Try risk percent first
    const tradesWithRiskPercent = trades.filter(t => t.riskPercent !== undefined);
    if (tradesWithRiskPercent.length > 0) {
      const avgRisk = tradesWithRiskPercent.reduce((sum, t) => sum + t.riskPercent!, 0) / tradesWithRiskPercent.length;
      return {
        name: 'averageRiskPerTrade',
        value: avgRisk,
        status: 'available',
        confidence: this.calculateConfidence({ riskPercent: true }, [], ['riskPercent']),
        dependencies,
        description: 'Average Risk per Trade (%)'
      };
    }

    // Try to calculate from stop loss and position size
    const tradesWithSLAndSize = trades.filter(t =>
      t.stopLoss !== undefined &&
      t.positionSize !== undefined &&
      t.entryPrice !== undefined &&
      t.stopLoss > 0 &&
      t.positionSize > 0
    );

    if (tradesWithSLAndSize.length === 0) {
      return {
        name: 'averageRiskPerTrade',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Average Risk requires either risk percent or stop loss + position size data'
      };
    }

    const risks = tradesWithSLAndSize.map(t => {
      const riskAmount = Math.abs(t.entryPrice! - t.stopLoss!);
      const positionValue = t.positionSize! * t.entryPrice!;
      return (riskAmount * t.positionSize!) / positionValue;
    });

    const avgRisk = risks.reduce((sum, risk) => sum + risk, 0) / risks.length;

    return {
      name: 'averageRiskPerTrade',
      value: avgRisk * 100, // Convert to percentage
      status: 'available',
      confidence: this.calculateConfidence({ stopLoss: true, positionSize: true }, [], ['stopLoss', 'positionSize']),
      dependencies,
      description: 'Average Risk per Trade (%)'
    };
  }

  // CONSISTENCY METRICS

  /**
   * Equity Smoothness (1 / Coefficient of Variation of equity)
   * Requires: equity_curve
   */
  calculateEquitySmoothness(account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: ['equityCurve']
    };

    const equityCurve = account.equityHistory;
    if (!equityCurve || equityCurve.length < 10) { // Need minimum data points
      return {
        name: 'equitySmoothness',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Equity Smoothness requires sufficient equity history'
      };
    }

    const equities = equityCurve.map(p => p.equity);
    const mean = equities.reduce((sum, eq) => sum + eq, 0) / equities.length;
    const variance = equities.reduce((sum, eq) => sum + Math.pow(eq - mean, 2), 0) / equities.length;
    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    const smoothness = coefficientOfVariation > 0 ? 1 / coefficientOfVariation : 0;

    return {
      name: 'equitySmoothness',
      value: smoothness,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Equity Smoothness (higher = smoother growth)'
    };
  }

  /**
   * Monthly Positive Ratio
   * Requires: monthly_returns
   */
  calculateMonthlyPositiveRatio(account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: ['monthlyReturns']
    };

    const monthlyReturns = account.monthlyReturns;
    if (!monthlyReturns || monthlyReturns.length === 0) {
      return {
        name: 'monthlyPositiveRatio',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Monthly Positive Ratio requires monthly returns data'
      };
    }

    const positiveMonths = monthlyReturns.filter(ret => ret > 0).length;
    const ratio = positiveMonths / monthlyReturns.length;

    return {
      name: 'monthlyPositiveRatio',
      value: ratio * 100, // Convert to percentage
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Monthly Positive Ratio (%)'
    };
  }

  /**
   * Trade Frequency Stability
   * Requires: trades_per_week (consistency over time)
   */
  calculateTradeFrequencyStability(trades: TradeData[]): MetricResult {
    const dependencies: MetricDependency = {
      required: ['tradesPerWeek']
    };

    if (trades.length < 10) { // Need minimum trades for stability analysis
      return {
        name: 'tradeFrequencyStability',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Trade Frequency Stability requires sufficient trade history'
      };
    }

    // Group trades by week
    const tradesByWeek = new Map<string, number>();
    trades.forEach(trade => {
      const week = `${trade.openTime.getFullYear()}-${trade.openTime.getWeek()}`;
      tradesByWeek.set(week, (tradesByWeek.get(week) || 0) + 1);
    });

    const weeklyCounts = Array.from(tradesByWeek.values());
    if (weeklyCounts.length < 4) { // Need at least 4 weeks of data
      return {
        name: 'tradeFrequencyStability',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Trade Frequency Stability requires data from multiple weeks'
      };
    }

    // Calculate coefficient of variation of weekly trade counts
    const mean = weeklyCounts.reduce((sum, count) => sum + count, 0) / weeklyCounts.length;
    const variance = weeklyCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / weeklyCounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    // Lower coefficient = more stable (convert to 0-100 scale)
    const stability = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

    return {
      name: 'tradeFrequencyStability',
      value: stability,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Trade Frequency Stability (%)'
    };
  }

  // ANTI-MANIPULATION METRICS (ONLY IF DATA EXISTS)

  /**
   * Profit Concentration Index
   * Requires: pnl per trade
   */
  calculateProfitConcentration(trades: TradeData[]): MetricResult {
    const dependencies: MetricDependency = {
      required: ['pnlPerTrade']
    };

    if (trades.length < 10) {
      return {
        name: 'profitConcentrationIndex',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Profit Concentration requires sufficient trade data'
      };
    }

    // Sort trades by PnL descending
    const sortedTrades = [...trades].sort((a, b) => b.pnl - a.pnl);
    const top10PercentCount = Math.max(1, Math.floor(trades.length * 0.1));
    const top10Profit = sortedTrades.slice(0, top10PercentCount).reduce((sum, t) => sum + t.pnl, 0);
    const totalProfit = trades.reduce((sum, t) => sum + t.pnl, 0);

    if (totalProfit <= 0) {
      return {
        name: 'profitConcentrationIndex',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Profit Concentration requires positive total profit'
      };
    }

    const concentrationIndex = top10Profit / totalProfit;

    return {
      name: 'profitConcentrationIndex',
      value: concentrationIndex,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Profit Concentration Index (0-1, lower = better diversification)'
    };
  }

  /**
   * Risk Spike Detection
   * Requires: max_risk, avg_risk
   */
  calculateRiskSpike(trades: TradeData[]): MetricResult {
    const dependencies: MetricDependency = {
      required: ['maxRisk', 'avgRisk']
    };

    // Calculate risks per trade
    const risks = trades
      .map(trade => {
        if (trade.riskPercent) return trade.riskPercent;
        if (trade.stopLoss && trade.entryPrice && trade.positionSize) {
          const riskAmount = Math.abs(trade.entryPrice - trade.stopLoss);
          const positionValue = trade.positionSize * trade.entryPrice;
          return positionValue > 0 ? (riskAmount * trade.positionSize) / positionValue : 0;
        }
        return null;
      })
      .filter(risk => risk !== null && risk > 0) as number[];

    if (risks.length < 5) {
      return {
        name: 'riskSpike',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Risk Spike requires sufficient risk data from trades'
      };
    }

    const avgRisk = risks.reduce((sum, risk) => sum + risk, 0) / risks.length;
    const maxRisk = Math.max(...risks);
    const riskSpike = maxRisk / avgRisk;

    return {
      name: 'riskSpike',
      value: riskSpike,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Risk Spike (ratio of max risk to average risk)'
    };
  }

  /**
   * Human Variability Score
   * Requires: trade timestamps, position sizes, RR per trade
   */
  calculateHumanVariability(trades: TradeData[]): MetricResult {
    const dependencies: MetricDependency = {
      required: ['tradeTimestamps', 'positionSizes', 'rrPerTrade']
    };

    const validTrades = trades.filter(t =>
      t.openTime &&
      t.positionSize &&
      (t.realizedRR || (t.stopLoss && t.takeProfit))
    );

    if (validTrades.length < 10) {
      return {
        name: 'humanVariability',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Human Variability requires sufficient trade data with timestamps and sizing'
      };
    }

    // Analyze trading patterns for signs of automation
    let automationScore = 0;

    // 1. Check for identical position sizes
    const positionSizes = validTrades.map(t => t.positionSize);
    const uniqueSizes = new Set(positionSizes);
    const sizeRepetitionRatio = 1 - (uniqueSizes.size / positionSizes.length);
    automationScore += sizeRepetitionRatio * 25;

    // 2. Check for identical RR ratios
    const rrRatios = validTrades.map(t =>
      t.realizedRR ||
      (t.stopLoss && t.takeProfit && t.entryPrice ?
        Math.abs(t.takeProfit - t.entryPrice) / Math.abs(t.entryPrice - t.stopLoss) : 0)
    ).filter(rr => rr > 0);

    if (rrRatios.length > 0) {
      const uniqueRRs = new Set(rrRatios.map(rr => Math.round(rr * 100) / 100));
      const rrRepetitionRatio = 1 - (uniqueRRs.size / rrRatios.length);
      automationScore += rrRepetitionRatio * 25;
    }

    // 3. Check for regular timing patterns
    const hours = validTrades.map(t => t.openTime.getHours());
    const hourEntropy = this.calculateEntropy(hours);
    automationScore += (1 - hourEntropy) * 25; // Lower entropy = more regular = more automated

    // 4. Check for round number bias (common in automated systems)
    const roundNumberBias = positionSizes.filter(size =>
      size && size % 1000 === 0 // Round thousands
    ).length / positionSizes.length;
    automationScore += roundNumberBias * 25;

    // Convert to human variability score (0-100, higher = more human-like)
    const humanVariability = Math.max(0, Math.min(100, 100 - automationScore));

    return {
      name: 'humanVariability',
      value: humanVariability,
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Human Variability Score (higher = more human-like trading patterns)'
    };
  }

  /**
   * Market Regime Balance
   * Requires: trade timestamps + volatility data
   */
  calculateMarketRegimeBalance(trades: TradeData[], account: AccountData): MetricResult {
    const dependencies: MetricDependency = {
      required: ['tradeTimestamps', 'volatilityData']
    };

    const volatility = account.dailyReturns;
    if (!volatility || trades.length < 20) {
      return {
        name: 'marketRegimeBalance',
        value: null,
        status: 'missing_data',
        confidence: 0,
        dependencies,
        description: 'Market Regime Balance requires volatility data and sufficient trades'
      };
    }

    // Calculate volatility periods (high/low volatility)
    const avgVolatility = volatility.reduce((sum, ret) => sum + Math.abs(ret), 0) / volatility.length;
    const highVolatilityTrades = trades.filter(trade => {
      // Find trades during high volatility periods
      const tradeDate = trade.openTime;
      const recentVolatility = volatility
        .filter(v => Math.abs(v.date.getTime() - tradeDate.getTime()) < 7 * 24 * 60 * 60 * 1000) // Within 7 days
        .reduce((sum, v) => sum + Math.abs(v.return), 0) / 7;

      return recentVolatility > avgVolatility;
    });

    const balanceRatio = highVolatilityTrades.length / trades.length;
    const balanceScore = Math.min(balanceRatio, 1 - balanceRatio) * 2; // 0-1 scale, penalize extremes

    return {
      name: 'marketRegimeBalance',
      value: balanceScore * 100, // Convert to percentage
      status: 'available',
      confidence: 1,
      dependencies,
      description: 'Market Regime Balance (optimal trading across volatility conditions)'
    };
  }

  // UTILITY METHODS

  private calculateEntropy(values: number[]): number {
    const counts = new Map<number, number>();
    values.forEach(val => {
      counts.set(val, (counts.get(val) || 0) + 1);
    });

    let entropy = 0;
    const n = values.length;

    for (const count of counts.values()) {
      const p = count / n;
      entropy -= p * Math.log2(p);
    }

    return entropy / Math.log2(counts.size || 1); // Normalize to 0-1
  }
}



