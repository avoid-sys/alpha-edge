import { TradeData, AccountData, TraderELO } from '../types/elo';

export interface Trader {
  id: string;
  nickname: string;
  email?: string;
  createdAt: Date;
  lastUpdated: Date;
  elo?: TraderELO;
  dataQuality: {
    hasRequiredFields: boolean;
    totalTrades: number;
    accountAgeDays?: number;
    lastStatementUpload?: Date;
  };
}

export interface Trade {
  id: string;
  traderId: string;
  // Required fields
  openTime: Date;
  closeTime: Date;
  pnl: number;

  // Optional trade data
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskPercent?: number;
  tradeDuration?: number;
  realizedRR?: number;

  // Metadata
  createdAt: Date;
}

export interface AccountSnapshot {
  id: string;
  traderId: string;
  date: Date;
  balance: number;
  equity: number;
  leverage?: number;
  createdAt: Date;
}

export interface ELORecord {
  id: string;
  traderId: string;
  calculatedAt: Date;
  eloScore: number;
  rawScore: number;
  dataCoverage: number;
  confidence: number;
  reliability: number;
  totalTrades: number;
  category: string;
  missingMetrics: string[];
  lowConfidenceBlocks: string[];
  penalties: Array<{
    name: string;
    value: number;
    reason: string;
  }>;
  blocks: Array<{
    name: string;
    score: number;
    confidence: string;
    coveragePercent: number;
  }>;
}

// Database schema for localStorage simulation
export class TraderDatabase {
  private static instance: TraderDatabase;
  private storage: Map<string, any> = new Map();

  static getInstance(): TraderDatabase {
    if (!TraderDatabase.instance) {
      TraderDatabase.instance = new TraderDatabase();
    }
    return TraderDatabase.instance;
  }

  // Traders
  async createTrader(trader: Omit<Trader, 'id' | 'createdAt' | 'lastUpdated'>): Promise<Trader> {
    const id = `trader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTrader: Trader = {
      ...trader,
      id,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.storage.set(`trader_${id}`, newTrader);
    return newTrader;
  }

  async getTrader(id: string): Promise<Trader | null> {
    return this.storage.get(`trader_${id}`) || null;
  }

  async updateTrader(id: string, updates: Partial<Trader>): Promise<Trader | null> {
    const trader = await this.getTrader(id);
    if (!trader) return null;

    const updatedTrader = {
      ...trader,
      ...updates,
      lastUpdated: new Date()
    };

    this.storage.set(`trader_${id}`, updatedTrader);
    return updatedTrader;
  }

  // Trades
  async saveTrades(traderId: string, trades: TradeData[]): Promise<Trade[]> {
    const tradeRecords: Trade[] = trades.map(trade => ({
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      traderId,
      ...trade,
      createdAt: new Date()
    }));

    const existingTrades = this.storage.get(`trades_${traderId}`) || [];
    const allTrades = [...existingTrades, ...tradeRecords];

    this.storage.set(`trades_${traderId}`, allTrades);
    return tradeRecords;
  }

  async getTrades(traderId: string): Promise<Trade[]> {
    return this.storage.get(`trades_${traderId}`) || [];
  }

  async clearTrades(traderId: string): Promise<void> {
    this.storage.delete(`trades_${traderId}`);
  }

  // Account snapshots
  async saveAccountSnapshots(traderId: string, snapshots: Array<{ date: Date; balance: number; equity: number; leverage?: number }>): Promise<void> {
    const accountRecords: AccountSnapshot[] = snapshots.map(snapshot => ({
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      traderId,
      ...snapshot,
      createdAt: new Date()
    }));

    const existingSnapshots = this.storage.get(`snapshots_${traderId}`) || [];
    const allSnapshots = [...existingSnapshots, ...accountRecords];

    this.storage.set(`snapshots_${traderId}`, allSnapshots);
  }

  async getAccountSnapshots(traderId: string): Promise<AccountSnapshot[]> {
    return this.storage.get(`snapshots_${traderId}`) || [];
  }

  // ELO Records
  async saveELORecord(eloRecord: Omit<ELORecord, 'id'>): Promise<ELORecord> {
    const id = `elo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: ELORecord = {
      ...eloRecord,
      id
    };

    const existingRecords = this.storage.get(`elo_${eloRecord.traderId}`) || [];
    const updatedRecords = [...existingRecords, record];

    this.storage.set(`elo_${eloRecord.traderId}`, updatedRecords);
    return record;
  }

  async getLatestELO(traderId: string): Promise<ELORecord | null> {
    const records = this.storage.get(`elo_${traderId}`) || [];
    if (records.length === 0) return null;

    return records.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime())[0];
  }

  async getELOHistory(traderId: string): Promise<ELORecord[]> {
    return this.storage.get(`elo_${traderId}`) || [];
  }

  // Utility methods
  async getAllTraders(): Promise<Trader[]> {
    const traders: Trader[] = [];
    for (const [key, value] of this.storage.entries()) {
      if (key.startsWith('trader_')) {
        traders.push(value);
      }
    }
    return traders;
  }

  async clearAllData(): Promise<void> {
    this.storage.clear();
  }
}



