import {
  TradeData,
  AccountData,
  TraderELO,
  ELOCalculationRequest,
  ELOCalculationResponse
} from '../types/elo';
import { ELOCalculator } from './ELOCalculator';
import { TraderDatabase } from '../models/Trader';

/**
 * ELO API Service - Handles ELO calculations and data persistence
 */
export class ELOApiService {
  private static instance: ELOApiService;
  private eloCalculator = ELOCalculator.getInstance();
  private database = TraderDatabase.getInstance();

  static getInstance(): ELOApiService {
    if (!ELOApiService.instance) {
      ELOApiService.instance = new ELOApiService();
    }
    return ELOApiService.instance;
  }

  /**
   * Calculate ELO for a trader
   */
  async calculateTraderELO(request: ELOCalculationRequest): Promise<ELOCalculationResponse> {
    try {
      // Calculate ELO
      const response = await this.eloCalculator.calculateELO(request);

      if (!response.success || !response.elo) {
        return response;
      }

      // Save to database
      await this.saveELOData(request, response.elo);

      return response;
    } catch (error) {
      return {
        success: false,
        error: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get latest ELO for a trader
   */
  async getTraderELO(traderId: string): Promise<TraderELO | null> {
    try {
      let eloRecord = await this.database.getLatestELO(traderId);

      // If no data exists, return mock data for testing
      if (!eloRecord) {
        console.log('No ELO data found, returning mock data for testing');
        return this.getMockELOData(traderId);
      }

      // Convert database record back to TraderELO format
      return this.convertELORecordToTraderELO(eloRecord);
    } catch (error) {
      console.error('Error fetching trader ELO:', error);
      // Return mock data as fallback
      return this.getMockELOData(traderId);
    }
  }

  /**
   * Get ELO history for a trader
   */
  async getTraderELOHistory(traderId: string): Promise<TraderELO[]> {
    try {
      const eloRecords = await this.database.getELOHistory(traderId);
      return eloRecords.map(record => this.convertELORecordToTraderELO(record));
    } catch (error) {
      console.error('Error fetching trader ELO history:', error);
      return [];
    }
  }

  /**
   * Get leaderboard (top traders by ELO)
   */
  async getLeaderboard(limit: number = 50): Promise<Array<{ traderId: string; elo: TraderELO }>> {
    try {
      const allTraders = await this.database.getAllTraders();
      const leaderboard: Array<{ traderId: string; elo: TraderELO }> = [];

      for (const trader of allTraders) {
        if (trader.elo) {
          leaderboard.push({
            traderId: trader.id,
            elo: trader.elo
          });
        }
      }

      // Sort by ELO score descending
      leaderboard.sort((a, b) => b.elo.eloScore - a.elo.eloScore);

      return leaderboard.slice(0, limit);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Update trader data and recalculate ELO
   */
  async updateTraderData(traderId: string, trades: TradeData[], account: AccountData): Promise<ELOCalculationResponse> {
    try {
      // Save new trade data
      await this.database.saveTrades(traderId, trades);
      await this.database.saveAccountSnapshots(traderId, account.equityHistory || account.balanceHistory || []);

      // Update trader data quality
      const trader = await this.database.getTrader(traderId);
      if (trader) {
        const dataQuality = {
          hasRequiredFields: true, // Assume data is valid if provided
          totalTrades: trades.length,
          accountAgeDays: account.accountAgeDays,
          lastStatementUpload: new Date()
        };

        await this.database.updateTrader(traderId, { dataQuality });
      }

      // Recalculate ELO
      const request: ELOCalculationRequest = {
        traderId,
        trades,
        account
      };

      return await this.calculateTraderELO(request);
    } catch (error) {
      return {
        success: false,
        error: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save ELO calculation result to database
   */
  private async saveELOData(request: ELOCalculationRequest, elo: TraderELO): Promise<void> {
    try {
      // Save ELO record
      const eloRecord = {
        traderId: request.traderId,
        calculatedAt: elo.calculatedAt,
        eloScore: elo.eloScore,
        rawScore: elo.rawScore,
        dataCoverage: elo.reliability.dataCoverage,
        confidence: elo.reliability.confidenceCoefficient,
        reliability: elo.reliability.reliabilityMultiplier,
        totalTrades: elo.reliability.totalTrades,
        category: elo.category,
        missingMetrics: elo.missingMetrics,
        lowConfidenceBlocks: elo.lowConfidenceBlocks,
        penalties: elo.penalties.map(p => ({
          name: p.name,
          value: p.value,
          reason: p.reason
        })),
        blocks: elo.blocks.map(b => ({
          name: b.name,
          score: b.score,
          confidence: b.confidence,
          coveragePercent: b.coveragePercent
        }))
      };

      await this.database.saveELORecord(eloRecord);

      // Update trader with latest ELO
      await this.database.updateTrader(request.traderId, {
        elo,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error saving ELO data:', error);
      throw error;
    }
  }

  /**
   * Get mock ELO data for testing
   */
  private getMockELOData(traderId: string): TraderELO {
    const mockELO: TraderELO = {
      traderId,
      eloScore: 78.5,
      rawScore: 82.3,
      reliability: {
        totalTrades: 245,
        reliabilityMultiplier: 0.85,
        dataCoverage: 0.92,
        confidenceCoefficient: 0.79
      },
      blocks: [
        {
          name: 'Performance',
          score: 85.2,
          confidence: 'high',
          availableMetrics: 4,
          totalMetrics: 4,
          coveragePercent: 100,
          metrics: [
            { name: 'Annualized Return', value: 24.8, status: 'available' },
            { name: 'Win Rate', value: 68.5, status: 'available' },
            { name: 'Average R/R', value: 1.45, status: 'available' },
            { name: 'Expectancy', value: 0.085, status: 'available' }
          ],
          originalWeight: 0.40,
          adjustedWeight: 0.40
        },
        {
          name: 'RiskControl',
          score: 72.8,
          confidence: 'medium',
          availableMetrics: 3,
          totalMetrics: 3,
          coveragePercent: 100,
          metrics: [
            { name: 'Max Drawdown', value: 12.3, status: 'available' },
            { name: 'Volatility', value: 8.7, status: 'available' },
            { name: 'Risk per Trade', value: 2.1, status: 'available' }
          ],
          originalWeight: 0.30,
          adjustedWeight: 0.30
        },
        {
          name: 'Consistency',
          score: 88.1,
          confidence: 'high',
          availableMetrics: 2,
          totalMetrics: 3,
          coveragePercent: 67,
          metrics: [
            { name: 'Equity Smoothness', value: 0.92, status: 'available' },
            { name: 'Monthly Positive Ratio', value: 78.3, status: 'available' },
            { name: 'Trade Frequency Stability', value: null, status: 'missing_data' }
          ],
          originalWeight: 0.15,
          adjustedWeight: 0.15
        },
        {
          name: 'AccountHealth',
          score: 65.4,
          confidence: 'low',
          availableMetrics: 2,
          totalMetrics: 3,
          coveragePercent: 67,
          metrics: [
            { name: 'Violations SL', value: 3, status: 'available' },
            { name: 'Leverage Overuse', value: 2, status: 'available' },
            { name: 'Risk Limit Breach', value: null, status: 'missing_data' }
          ],
          originalWeight: 0.10,
          adjustedWeight: 0.10
        },
        {
          name: 'Longevity',
          score: 45.2,
          confidence: 'high',
          availableMetrics: 1,
          totalMetrics: 1,
          coveragePercent: 100,
          metrics: [
            { name: 'Account Age Days', value: 180, status: 'available' }
          ],
          originalWeight: 0.05,
          adjustedWeight: 0.05
        }
      ],
      penalties: [
        {
          name: 'Profit Concentration',
          value: 5.2,
          reason: 'Top 10% of trades account for 35% of total profit'
        }
      ],
      missingMetrics: [
        'Monthly Positive Ratio',
        'Trade Frequency Stability',
        'Leverage Overuse'
      ],
      lowConfidenceBlocks: ['accountHealth'],
      category: 'Professional',
      calculatedAt: new Date(),
      dataQuality: {
        hasRequiredFields: true,
        totalTrades: 245,
        dataCompleteness: 0.92,
        winningTrades: 168,
        losingTrades: 77
      }
    };

    return mockELO;
  }

  /**
   * Convert database ELO record back to TraderELO format
   */
  private convertELORecordToTraderELO(record: any): TraderELO {
    // This would reconstruct the full TraderELO object from database record
    // For now, return a simplified version
    return {
      traderId: record.traderId,
      eloScore: record.eloScore,
      rawScore: record.rawScore,
      reliability: {
        totalTrades: record.totalTrades,
        reliabilityMultiplier: record.reliability,
        dataCoverage: record.dataCoverage,
        confidenceCoefficient: record.confidence
      },
      blocks: record.blocks || [],
      penalties: record.penalties || [],
      missingMetrics: record.missingMetrics || [],
      lowConfidenceBlocks: record.lowConfidenceBlocks || [],
      category: record.category,
      calculatedAt: record.calculatedAt,
      dataQuality: {
        hasRequiredFields: true,
        totalTrades: record.totalTrades,
        dataCompleteness: record.dataCoverage
      }
    } as TraderELO;
  }

  /**
   * Get ELO statistics for dashboard
   */
  async getELOStatistics(): Promise<{
    totalTraders: number;
    averageELO: number;
    topPerformers: Array<{ traderId: string; elo: number; category: string }>;
    distribution: { [key: string]: number };
  }> {
    try {
      const allTraders = await this.database.getAllTraders();
      const tradersWithELO = allTraders.filter(t => t.elo);

      const totalTraders = tradersWithELO.length;
      const averageELO = totalTraders > 0
        ? tradersWithELO.reduce((sum, t) => sum + t.elo!.eloScore, 0) / totalTraders
        : 0;

      const topPerformers = tradersWithELO
        .sort((a, b) => b.elo!.eloScore - a.elo!.eloScore)
        .slice(0, 10)
        .map(t => ({
          traderId: t.id,
          elo: t.elo!.eloScore,
          category: t.elo!.category
        }));

      const distribution: { [key: string]: number } = {};
      tradersWithELO.forEach(trader => {
        const category = trader.elo!.category;
        distribution[category] = (distribution[category] || 0) + 1;
      });

      return {
        totalTraders,
        averageELO,
        topPerformers,
        distribution
      };
    } catch (error) {
      console.error('Error fetching ELO statistics:', error);
      return {
        totalTraders: 0,
        averageELO: 0,
        topPerformers: [],
        distribution: {}
      };
    }
  }
}
