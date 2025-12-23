// Trader ELO System Types - Strict Implementation
// Based on the specification, no assumptions or interpolations allowed

export interface TradeData {
  // Required for minimal data check
  openTime: Date;
  closeTime: Date;
  pnl: number;

  // Optional trade-level data
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskPercent?: number;
  tradeDuration?: number; // in minutes
  realizedRR?: number; // Risk-Reward ratio
}

export interface AccountData {
  // Required for minimal data check
  initialBalance: number;
  equityHistory?: Array<{ date: Date; equity: number }>;
  balanceHistory?: Array<{ date: Date; balance: number }>;

  // Optional account-level data
  dailyReturns?: number[];
  monthlyReturns?: number[];
  leverage?: number;
  accountAgeDays?: number;
  tradesPerWeek?: number;
}

export interface MetricDependency {
  required: string[];
  optional?: string[];
}

export interface MetricResult {
  name: string;
  value: number | null;
  status: 'available' | 'missing_data';
  confidence: number; // 0-1 based on data completeness
  dependencies: MetricDependency;
  description: string;
}

export interface BlockResult {
  name: string;
  score: number; // 0-100
  confidence: 'high' | 'medium' | 'low' | 'excluded';
  availableMetrics: number;
  totalMetrics: number;
  coveragePercent: number; // 0-100
  metrics: MetricResult[];
  originalWeight: number;
  adjustedWeight: number;
}

export interface ReliabilityFactors {
  totalTrades: number;
  reliabilityMultiplier: number; // MIN(1, sqrt(totalTrades / 300))
  dataCoverage: number; // available_metrics / total_metrics
  confidenceCoefficient: number; // 0.5 + 0.5 * dataCoverage
}

export interface PenaltyResult {
  name: string;
  value: number; // negative penalty points
  reason: string;
  applied: boolean; // only if verifiable data exists
}

export interface TraderELO {
  traderId: string;
  eloScore: number; // 0-100, clamped
  rawScore: number; // before penalties
  reliability: ReliabilityFactors;
  blocks: BlockResult[];
  penalties: PenaltyResult[];
  missingMetrics: string[];
  lowConfidenceBlocks: string[];
  category: 'Elite' | 'Professional' | 'Consistent' | 'Unstable' | 'Speculative' | 'Insufficient_Data';
  calculatedAt: Date;
  dataQuality: {
    hasRequiredFields: boolean;
    totalTrades: number;
    accountAgeDays?: number;
    dataCompleteness: number; // 0-1
    winningTrades?: number;
    losingTrades?: number;
  };
}

export interface ELOCalculationRequest {
  traderId: string;
  trades: TradeData[];
  account: AccountData;
}

export interface ELOCalculationResponse {
  success: boolean;
  elo?: TraderELO;
  error?: string;
  warnings?: string[];
}

// Block weights as per specification
export const BLOCK_WEIGHTS = {
  performance: 0.40,
  riskControl: 0.30,
  consistency: 0.15,
  accountHealth: 0.10,
  longevity: 0.05
} as const;

// Metric definitions with dependencies
export const METRIC_DEFINITIONS = {
  // Performance Metrics
  annualizedReturn: {
    required: ['initialBalance', 'finalBalance', 'daysActive'],
    category: 'performance'
  },
  winRate: {
    required: ['totalTrades', 'winningTrades'],
    category: 'performance'
  },
  averageRR: {
    required: ['stopLoss', 'takeProfit'], // OR realizedRR
    optional: ['realizedRR'],
    category: 'performance'
  },
  expectancy: {
    required: ['winRate', 'avgWin', 'avgLoss'],
    category: 'performance'
  },

  // Risk Metrics
  maxDrawdown: {
    required: ['equityCurve'],
    category: 'riskControl'
  },
  volatility: {
    required: ['dailyReturns'],
    category: 'riskControl'
  },
  averageRiskPerTrade: {
    required: ['riskPercent'], // OR (stopLoss + positionSize)
    optional: ['stopLoss', 'positionSize'],
    category: 'riskControl'
  },

  // Consistency Metrics
  equitySmoothness: {
    required: ['equityCurve'],
    category: 'consistency'
  },
  monthlyPositiveRatio: {
    required: ['monthlyReturns'],
    category: 'consistency'
  },
  tradeFrequencyStability: {
    required: ['tradesPerWeek'],
    category: 'consistency'
  },

  // Anti-Manipulation Metrics (ONLY IF DATA EXISTS)
  profitConcentrationIndex: {
    required: ['pnlPerTrade'],
    category: 'accountHealth'
  },
  riskSpike: {
    required: ['maxRisk', 'avgRisk'],
    category: 'riskControl'
  },
  humanVariability: {
    required: ['tradeTimestamps', 'positionSizes', 'rrPerTrade'],
    category: 'consistency'
  },
  marketRegimeBalance: {
    required: ['tradeTimestamps', 'volatilityData'],
    category: 'consistency'
  },

  // Account Health Metrics
  accountAgeScore: {
    required: ['accountAgeDays'],
    category: 'longevity'
  }
} as const;
