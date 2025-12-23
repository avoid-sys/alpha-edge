import { MetricResult, BlockResult, BLOCK_WEIGHTS, METRIC_DEFINITIONS } from '../types/elo';

/**
 * Block Calculator - Dynamic Reweighting Implementation
 * Blocks are calculated from available metrics only, with weights redistributed proportionally
 */
export class BlockCalculator {
  private static instance: BlockCalculator;

  static getInstance(): BlockCalculator {
    if (!BlockCalculator.instance) {
      BlockCalculator.instance = new BlockCalculator();
    }
    return BlockCalculator.instance;
  }

  /**
   * Calculate block score from available metrics with dynamic reweighting
   */
  calculateBlock(
    blockName: keyof typeof BLOCK_WEIGHTS,
    availableMetrics: MetricResult[]
  ): BlockResult {
    // Filter metrics for this block
    const blockMetrics = availableMetrics.filter(metric => {
      const definition = METRIC_DEFINITIONS[metric.name as keyof typeof METRIC_DEFINITIONS];
      return definition && definition.category === blockName;
    });

    const totalMetricsInBlock = Object.values(METRIC_DEFINITIONS)
      .filter(def => def.category === blockName).length;

    const availableMetricsCount = blockMetrics.length;
    const coveragePercent = totalMetricsInBlock > 0 ? (availableMetricsCount / totalMetricsInBlock) * 100 : 0;

    // Block exclusion rules
    if (coveragePercent < 30) {
      return {
        name: blockName,
        score: 0,
        confidence: 'excluded',
        availableMetrics: availableMetricsCount,
        totalMetrics: totalMetricsInBlock,
        coveragePercent,
        metrics: blockMetrics,
        originalWeight: BLOCK_WEIGHTS[blockName],
        adjustedWeight: 0
      };
    }

    const confidence = coveragePercent >= 50 ? 'high' :
                      coveragePercent >= 35 ? 'medium' : 'low';

    // Calculate weighted average of available metrics
    if (blockMetrics.length === 0) {
      return {
        name: blockName,
        score: 50, // Neutral score when no metrics available but block not excluded
        confidence,
        availableMetrics: 0,
        totalMetrics: totalMetricsInBlock,
        coveragePercent: 0,
        metrics: [],
        originalWeight: BLOCK_WEIGHTS[blockName],
        adjustedWeight: BLOCK_WEIGHTS[blockName]
      };
    }

    // Normalize metric values to 0-100 scale and calculate weighted average
    const normalizedScores = blockMetrics.map(metric => {
      if (metric.value === null) return 0;

      // Different metrics need different normalization strategies
      let normalizedValue = this.normalizeMetricValue(metric.name, metric.value);
      return normalizedValue * metric.confidence; // Weight by metric confidence
    });

    const totalConfidence = blockMetrics.reduce((sum, metric) => sum + metric.confidence, 0);
    const blockScore = totalConfidence > 0 ?
      normalizedScores.reduce((sum, score) => sum + score, 0) / totalConfidence : 50;

    return {
      name: blockName,
      score: Math.max(0, Math.min(100, blockScore)),
      confidence,
      availableMetrics: availableMetricsCount,
      totalMetrics: totalMetricsInBlock,
      coveragePercent,
      metrics: blockMetrics,
      originalWeight: BLOCK_WEIGHTS[blockName],
      adjustedWeight: BLOCK_WEIGHTS[blockName] // Will be adjusted later if blocks are excluded
    };
  }

  /**
   * Calculate all blocks and handle exclusions with weight redistribution
   */
  calculateAllBlocks(availableMetrics: MetricResult[]): BlockResult[] {
    const blocks = Object.keys(BLOCK_WEIGHTS).map(blockName =>
      this.calculateBlock(blockName as keyof typeof BLOCK_WEIGHTS, availableMetrics)
    );

    // Separate included and excluded blocks
    const includedBlocks = blocks.filter(block => block.confidence !== 'excluded');
    const excludedBlocks = blocks.filter(block => block.confidence === 'excluded');

    // Redistribute weights from excluded blocks to included blocks proportionally
    if (excludedBlocks.length > 0 && includedBlocks.length > 0) {
      const totalExcludedWeight = excludedBlocks.reduce((sum, block) => sum + block.originalWeight, 0);
      const totalIncludedWeight = includedBlocks.reduce((sum, block) => sum + block.originalWeight, 0);

      includedBlocks.forEach(block => {
        const weightRatio = block.originalWeight / totalIncludedWeight;
        block.adjustedWeight = block.originalWeight + (totalExcludedWeight * weightRatio);
      });
    } else {
      // No redistribution needed
      includedBlocks.forEach(block => {
        block.adjustedWeight = block.originalWeight;
      });
    }

    return blocks;
  }

  /**
   * Calculate final score from blocks
   */
  calculateFinalScore(blocks: BlockResult[]): number {
    const includedBlocks = blocks.filter(block => block.confidence !== 'excluded');

    if (includedBlocks.length === 0) {
      return 0; // No valid blocks
    }

    const totalWeightedScore = includedBlocks.reduce((sum, block) => {
      return sum + (block.score * block.adjustedWeight);
    }, 0);

    const totalWeight = includedBlocks.reduce((sum, block) => sum + block.adjustedWeight, 0);

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  /**
   * Normalize metric values to 0-100 scale
   * Different metrics require different normalization strategies
   */
  private normalizeMetricValue(metricName: string, value: number): number {
    switch (metricName) {
      // Performance Metrics (higher = better)
      case 'annualizedReturn':
        // Clamp to reasonable range and normalize
        const clampedReturn = Math.max(-50, Math.min(200, value)); // -50% to 200%
        return Math.max(0, Math.min(100, 50 + clampedReturn)); // 0-100 scale

      case 'winRate':
        // Direct percentage (0-100)
        return Math.max(0, Math.min(100, value));

      case 'averageRR':
        // Risk-reward ratio (typically 0.5-3.0 is good)
        const rrScore = Math.max(0, Math.min(4, value)) / 4 * 100;
        return rrScore;

      case 'expectancy':
        // Expectancy (can be negative, 0+ is good)
        const expScore = Math.max(-2, Math.min(2, value)); // Clamp extremes
        return Math.max(0, Math.min(100, 50 + expScore * 25)); // 0-100 scale

      // Risk Metrics (lower = better for risk, but we want higher scores for good performance)
      case 'maxDrawdown':
        // Lower drawdown = higher score
        const ddScore = Math.max(0, Math.min(50, value)); // Cap at 50% max drawdown
        return Math.max(0, Math.min(100, 100 - ddScore * 2)); // Invert: lower DD = higher score

      case 'volatility':
        // Lower volatility = higher score (more stable)
        const volScore = Math.max(0, Math.min(100, value)); // Cap at 100% volatility
        return Math.max(0, Math.min(100, 100 - volScore)); // Invert: lower vol = higher score

      case 'averageRiskPerTrade':
        // Lower risk per trade = higher score (more conservative)
        const riskScore = Math.max(0, Math.min(10, value)); // Cap at 10% risk per trade
        return Math.max(0, Math.min(100, 100 - riskScore * 10)); // Invert: lower risk = higher score

      // Consistency Metrics
      case 'equitySmoothness':
        // Higher smoothness = higher score
        return Math.max(0, Math.min(100, value * 20)); // Scale appropriately

      case 'monthlyPositiveRatio':
        // Direct percentage (0-100)
        return Math.max(0, Math.min(100, value));

      case 'tradeFrequencyStability':
        // Direct percentage (0-100)
        return Math.max(0, Math.min(100, value));

      // Anti-manipulation Metrics
      case 'profitConcentrationIndex':
        // Lower concentration = higher score (better diversification)
        const concentrationScore = Math.max(0, Math.min(1, value));
        return Math.max(0, Math.min(100, 100 - concentrationScore * 100)); // Invert: lower concentration = higher score

      case 'riskSpike':
        // Lower risk spike = higher score (more consistent risk)
        const spikeScore = Math.max(0.1, Math.min(10, value)); // Avoid division by zero
        return Math.max(0, Math.min(100, 100 / spikeScore * 10)); // Lower spike = higher score

      case 'humanVariability':
        // Direct percentage (0-100, higher = more human-like)
        return Math.max(0, Math.min(100, value));

      case 'marketRegimeBalance':
        // Direct percentage (0-100)
        return Math.max(0, Math.min(100, value));

      default:
        // Fallback: assume 0-100 range
        return Math.max(0, Math.min(100, value));
    }
  }
}



