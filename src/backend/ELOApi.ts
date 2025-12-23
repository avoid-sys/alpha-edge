import { ELOApiService } from './services/ELOApiService';
import {
  TradeData,
  AccountData,
  TraderELO,
  ELOCalculationRequest,
  ELOCalculationResponse
} from './types/elo';

/**
 * Main ELO API Interface
 * Provides methods for frontend to interact with ELO calculation system
 */
class ELOApi {
  private apiService = ELOApiService.getInstance();

  /**
   * Calculate ELO for a trader
   */
  async calculateTraderELO(trades: TradeData[], account: AccountData, traderId?: string): Promise<ELOCalculationResponse> {
    const request: ELOCalculationRequest = {
      traderId: traderId || `trader_${Date.now()}`,
      trades,
      account
    };

    return await this.apiService.calculateTraderELO(request);
  }

  /**
   * Get trader's current ELO
   */
  async getTraderELO(traderId: string): Promise<TraderELO | null> {
    return await this.apiService.getTraderELO(traderId);
  }

  /**
   * Get trader's ELO history
   */
  async getTraderELOHistory(traderId: string): Promise<TraderELO[]> {
    return await this.apiService.getTraderELOHistory(traderId);
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit: number = 50): Promise<Array<{ traderId: string; elo: TraderELO }>> {
    return await this.apiService.getLeaderboard(limit);
  }

  /**
   * Update trader data and recalculate ELO
   */
  async updateTraderData(traderId: string, trades: TradeData[], account: AccountData): Promise<ELOCalculationResponse> {
    return await this.apiService.updateTraderData(traderId, trades, account);
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
    return await this.apiService.getELOStatistics();
  }

  /**
   * Validate trade data format
   */
  validateTradeData(trades: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(trades)) {
      errors.push('Trades must be an array');
      return { isValid: false, errors };
    }

    if (trades.length === 0) {
      errors.push('At least one trade is required');
      return { isValid: false, errors };
    }

    trades.forEach((trade, index) => {
      if (!trade.openTime || !trade.closeTime) {
        errors.push(`Trade ${index + 1}: Missing open or close time`);
      }
      if (typeof trade.pnl !== 'number') {
        errors.push(`Trade ${index + 1}: Invalid PnL value`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate account data format
   */
  validateAccountData(account: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof account.initialBalance !== 'number') {
      errors.push('Invalid initial balance');
    }

    if (!account.equityHistory && !account.balanceHistory) {
      errors.push('Account must have either equity or balance history');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Get ELO category description
   */
  getCategoryDescription(category: string): string {
    const descriptions: { [key: string]: string } = {
      'Elite': 'Top 10% of traders with exceptional performance and risk management',
      'Professional': 'High-performing traders with consistent results',
      'Consistent': 'Solid performers with good risk control',
      'Unstable': 'Average performance with some inconsistencies',
      'Speculative': 'Below average performance, high risk',
      'Insufficient_Data': 'Not enough data for reliable ELO calculation'
    };

    return descriptions[category] || 'Unknown category';
  }

  /**
   * Get ELO score color based on value
   */
  getELOColor(score: number): string {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#3B82F6'; // Blue
    if (score >= 65) return '#F59E0B'; // Yellow
    if (score >= 50) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }

  /**
   * Format ELO score for display
   */
  formatELOScore(score: number): string {
    return score.toFixed(1);
  }

  /**
   * Format confidence percentage
   */
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }
}

// Export singleton instance
export const eloApi = new ELOApi();
export default eloApi;



