import {
  TradeData,
  AccountData,
  TraderELO,
  MetricResult,
  BlockResult,
  ReliabilityFactors,
  PenaltyResult,
  ELOCalculationRequest,
  ELOCalculationResponse
} from '../types/elo';
import { MetricCalculator } from './MetricCalculator';
import { BlockCalculator } from './BlockCalculator';

/**
 * Trader ELO Calculator - Strict Implementation
 * Based on the specification: no assumptions, interpolations, or default values
 */
export class ELOCalculator {
  private static instance: ELOCalculator;
  private metricCalculator = MetricCalculator.getInstance();
  private blockCalculator = BlockCalculator.getInstance();

  static getInstance(): ELOCalculator {
    if (!ELOCalculator.instance) {
      ELOCalculator.instance = new ELOCalculator();
    }
    return ELOCalculator.instance;
  }

  /**
   * Main ELO calculation method
   */
  async calculateELO(request: ELOCalculationRequest): Promise<ELOCalculationResponse> {
    try {
      const { traderId, trades, account } = request;

      // 1. MINIMAL DATA CHECK
      const dataQuality = this.checkMinimalDataRequirements(trades, account);
      if (!dataQuality.hasRequiredFields) {
        return {
          success: false,
          error: 'INSUFFICIENT_DATA: Missing required fields for ELO calculation'
        };
      }

      // 2. CALCULATE ALL METRICS
      const allMetrics = await this.calculateAllMetrics(trades, account);

      // 3. FILTER AVAILABLE METRICS ONLY
      const availableMetrics = allMetrics.filter(m => m.status === 'available');

      // 4. CALCULATE BLOCKS WITH DYNAMIC REWEIGHTING
      const blocks = this.blockCalculator.calculateAllBlocks(availableMetrics);

      // 5. CALCULATE RAW SCORE
      const rawScore = this.blockCalculator.calculateFinalScore(blocks);

      // 6. CALCULATE RELIABILITY MULTIPLIER
      const reliability = this.calculateReliabilityFactors(trades.length);

      // 7. APPLY RELIABILITY
      const scoreAfterReliability = rawScore * reliability.reliabilityMultiplier;

      // 8. CALCULATE CONFIDENCE COEFFICIENT
      const confidenceCoefficient = reliability.confidenceCoefficient;

      // 9. APPLY CONFIDENCE
      const scoreAfterConfidence = scoreAfterReliability * confidenceCoefficient;

      // 10. CALCULATE PENALTIES (ONLY IF VERIFIABLE DATA EXISTS)
      const penalties = this.calculatePenalties(trades, availableMetrics);
      const totalPenalty = penalties.reduce((sum, p) => sum + p.value, 0);

      // 11. FINAL ELO SCORE
      const finalScore = Math.max(0, Math.min(100, scoreAfterConfidence - totalPenalty));

      // 12. DETERMINE CATEGORY
      const category = this.determineCategory(finalScore);

      // 13. COLLECT MISSING METRICS
      const missingMetrics = allMetrics
        .filter(m => m.status === 'missing_data')
        .map(m => m.name);

      const lowConfidenceBlocks = blocks
        .filter(b => b.confidence === 'low' || b.confidence === 'excluded')
        .map(b => b.name);

      const elo: TraderELO = {
        traderId,
        eloScore: finalScore,
        rawScore,
        reliability,
        blocks,
        penalties,
        missingMetrics,
        lowConfidenceBlocks,
        category,
        calculatedAt: new Date(),
        dataQuality
      };

      return {
        success: true,
        elo
      };

    } catch (error) {
      return {
        success: false,
        error: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check minimal data requirements
   */
  private checkMinimalDataRequirements(trades: TradeData[], account: AccountData) {
    const hasRequiredFields =
      trades.length > 0 &&
      trades.every(trade =>
        trade.openTime &&
        trade.closeTime &&
        trade.pnl !== undefined &&
        trade.pnl !== null
      ) &&
      account.initialBalance !== undefined &&
      account.initialBalance !== null &&
      (
        account.equityHistory?.length ||
        account.balanceHistory?.length
      );

    return {
      hasRequiredFields,
      totalTrades: trades.length,
      accountAgeDays: account.accountAgeDays,
      dataCompleteness: this.calculateDataCompleteness(trades, account)
    };
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(trades: TradeData[], account: AccountData): number {
    let totalFields = 0;
    let availableFields = 0;

    // Trade-level fields
    const tradeFields = ['entryPrice', 'exitPrice', 'stopLoss', 'takeProfit', 'positionSize', 'riskPercent', 'tradeDuration', 'realizedRR'];
    trades.forEach(trade => {
      tradeFields.forEach(field => {
        totalFields++;
        if ((trade as any)[field] !== undefined && (trade as any)[field] !== null) {
          availableFields++;
        }
      });
    });

    // Account-level fields
    const accountFields = ['equityHistory', 'balanceHistory', 'dailyReturns', 'monthlyReturns', 'leverage', 'accountAgeDays'];
    accountFields.forEach(field => {
      totalFields++;
      if ((account as any)[field] !== undefined && (account as any)[field] !== null && (account as any)[field]?.length > 0) {
        availableFields++;
      }
    });

    return totalFields > 0 ? availableFields / totalFields : 0;
  }

  /**
   * Calculate all available metrics
   */
  private async calculateAllMetrics(trades: TradeData[], account: AccountData): Promise<MetricResult[]> {
    const metrics: MetricResult[] = [];

    // Performance Metrics
    metrics.push(this.metricCalculator.calculateAnnualizedReturn(trades, account));
    const winRateResult = this.metricCalculator.calculateWinRate(trades);
    metrics.push(winRateResult);
    metrics.push(this.metricCalculator.calculateAverageRR(trades));
    if (winRateResult.status === 'available') {
      metrics.push(this.metricCalculator.calculateExpectancy(trades, winRateResult.value!));
    }

    // Risk Metrics
    metrics.push(this.metricCalculator.calculateMaxDrawdown(account));
    metrics.push(this.metricCalculator.calculateVolatility(account));
    metrics.push(this.metricCalculator.calculateAverageRiskPerTrade(trades, account));

    // Consistency Metrics
    metrics.push(this.metricCalculator.calculateEquitySmoothness(account));
    metrics.push(this.metricCalculator.calculateMonthlyPositiveRatio(account));
    metrics.push(this.metricCalculator.calculateTradeFrequencyStability(trades));

    // Anti-Manipulation Metrics (ONLY IF DATA EXISTS)
    const profitConcentration = this.metricCalculator.calculateProfitConcentration(trades);
    if (profitConcentration.status === 'available') {
      metrics.push(profitConcentration);
    }

    const riskSpike = this.metricCalculator.calculateRiskSpike(trades);
    if (riskSpike.status === 'available') {
      metrics.push(riskSpike);
    }

    const humanVariability = this.metricCalculator.calculateHumanVariability(trades);
    if (humanVariability.status === 'available') {
      metrics.push(humanVariability);
    }

    const marketRegimeBalance = this.metricCalculator.calculateMarketRegimeBalance(trades, account);
    if (marketRegimeBalance.status === 'available') {
      metrics.push(marketRegimeBalance);
    }

    return metrics;
  }

  /**
   * Calculate reliability factors
   */
  private calculateReliabilityFactors(totalTrades: number): ReliabilityFactors {
    const reliabilityMultiplier = Math.min(1, Math.sqrt(totalTrades / 300));

    // Calculate data coverage from all metrics
    const totalMetrics = 13; // Based on METRIC_DEFINITIONS count
    const availableMetrics = 0; // This would be calculated from actual available metrics
    const dataCoverage = availableMetrics / totalMetrics;
    const confidenceCoefficient = 0.5 + 0.5 * dataCoverage;

    return {
      totalTrades,
      reliabilityMultiplier,
      dataCoverage,
      confidenceCoefficient
    };
  }

  /**
   * Calculate penalties (ONLY IF VERIFIABLE DATA EXISTS)
   */
  private calculatePenalties(trades: TradeData[], availableMetrics: MetricResult[]): PenaltyResult[] {
    const penalties: PenaltyResult[] = [];

    // Profit Concentration Penalty
    const profitConcentrationMetric = availableMetrics.find(m => m.name === 'profitConcentrationIndex');
    if (profitConcentrationMetric && profitConcentrationMetric.value !== null) {
      if (profitConcentrationMetric.value > 0.6) {
        penalties.push({
          name: 'profitConcentration',
          value: -15,
          reason: 'Top 10% of trades account for more than 60% of profits',
          applied: true
        });
      }
    }

    // Risk Spike Penalty
    const riskSpikeMetric = availableMetrics.find(m => m.name === 'riskSpike');
    if (riskSpikeMetric && riskSpikeMetric.value !== null) {
      if (riskSpikeMetric.value > 5) {
        penalties.push({
          name: 'riskSpike',
          value: -30,
          reason: 'Risk spike ratio exceeds 5x average',
          applied: true
        });
      } else if (riskSpikeMetric.value > 3) {
        penalties.push({
          name: 'riskSpike',
          value: -15,
          reason: 'Risk spike ratio exceeds 3x average',
          applied: true
        });
      }
    }

    // Bot Probability Penalty
    const humanVariabilityMetric = availableMetrics.find(m => m.name === 'humanVariability');
    if (humanVariabilityMetric && humanVariabilityMetric.value !== null) {
      const botThreshold = 30; // Configurable threshold
      if (humanVariabilityMetric.value < botThreshold) {
        const penaltyValue = Math.min(25, Math.max(10, (botThreshold - humanVariabilityMetric.value) / 2));
        penalties.push({
          name: 'botProbability',
          value: -penaltyValue,
          reason: `Low human variability score: ${humanVariabilityMetric.value.toFixed(1)}`,
          applied: true
        });
      }
    }

    return penalties;
  }

  /**
   * Determine trader category based on final score
   */
  private determineCategory(score: number): TraderELO['category'] {
    if (score >= 90) return 'Elite';
    if (score >= 80) return 'Professional';
    if (score >= 65) return 'Consistent';
    if (score >= 50) return 'Unstable';
    return 'Speculative';
  }

  /**
   * Update reliability factors with actual data coverage
   */
  updateReliabilityWithActualData(reliability: ReliabilityFactors, availableMetricsCount: number, totalMetricsCount: number): ReliabilityFactors {
    const dataCoverage = availableMetricsCount / totalMetricsCount;
    const confidenceCoefficient = 0.5 + 0.5 * dataCoverage;

    return {
      ...reliability,
      dataCoverage,
      confidenceCoefficient
    };
  }
}



