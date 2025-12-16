// Local data service to replace Bass 44 API calls
// This will use localStorage for persistence with encryption

import { securityService } from './securityService';

class LocalDataService {
  constructor() {
    this.STORAGE_KEYS = {
      TRADER_PROFILES: 'alpha_edge_trader_profiles',
      TRADES: 'alpha_edge_trades',
      USER: 'alpha_edge_user',
      ACCOUNT_EVENTS: 'alpha_edge_account_events'
    };
    this.initializeStorage();
  }

  initializeStorage() {
    // Initialize localStorage with empty arrays if not exists
    if (!localStorage.getItem(this.STORAGE_KEYS.TRADER_PROFILES)) {
      localStorage.setItem(this.STORAGE_KEYS.TRADER_PROFILES, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.TRADES)) {
      localStorage.setItem(this.STORAGE_KEYS.TRADES, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.USER)) {
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(null));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.ACCOUNT_EVENTS)) {
      localStorage.setItem(this.STORAGE_KEYS.ACCOUNT_EVENTS, JSON.stringify([]));
    }
  }

  // Trader Profile methods
  async getTraderProfiles() {
    const encrypted = localStorage.getItem(this.STORAGE_KEYS.TRADER_PROFILES);
    if (!encrypted) return [];

    try {
      const profiles = securityService.decrypt(encrypted);
      return profiles.sort((a, b) => (b.trader_score || 0) - (a.trader_score || 0));
    } catch (error) {
      console.error('Failed to decrypt trader profiles:', error);
      return [];
    }
  }

  async getTraderProfile(id) {
    const profiles = await this.getTraderProfiles();
    return profiles.find(profile => profile.id === id);
  }

  async getTraderProfileById(id) {
    return this.getTraderProfile(id);
  }

  async createTraderProfile(profile) {
    const profiles = await this.getTraderProfiles();
    const newProfile = {
      ...profile,
      id: Date.now().toString(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    profiles.push(newProfile);

    try {
      const encrypted = securityService.encrypt(profiles);
      localStorage.setItem(this.STORAGE_KEYS.TRADER_PROFILES, encrypted);
    } catch (error) {
      console.error('Failed to encrypt trader profiles:', error);
      // Fallback to unencrypted storage
      localStorage.setItem(this.STORAGE_KEYS.TRADER_PROFILES, JSON.stringify(profiles));
    }

    return newProfile;
  }

  async updateTraderProfile(id, updates) {
    const profiles = await this.getTraderProfiles();
    const index = profiles.findIndex(profile => profile.id === id);
    if (index !== -1) {
      profiles[index] = {
        ...profiles[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      try {
        const encrypted = securityService.encrypt(profiles);
        localStorage.setItem(this.STORAGE_KEYS.TRADER_PROFILES, encrypted);
      } catch (error) {
        console.error('Failed to encrypt trader profiles:', error);
        // Fallback to unencrypted storage
        localStorage.setItem(this.STORAGE_KEYS.TRADER_PROFILES, JSON.stringify(profiles));
      }

      return profiles[index];
    }
    throw new Error('Trader profile not found');
  }

  async deleteTraderProfile(id) {
    const profiles = await this.getTraderProfiles();
    const filteredProfiles = profiles.filter(profile => profile.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.TRADER_PROFILES, JSON.stringify(filteredProfiles));
  }

  // Trade methods
  async getTrades(traderProfileId = null) {
    const trades = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRADES) || '[]');
    if (traderProfileId) {
      return trades.filter(trade => trade.trader_profile_id === traderProfileId);
    }
    return trades;
  }

  async createTrade(trade) {
    const trades = await this.getTrades();
    const newTrade = {
      ...trade,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    trades.push(newTrade);
    localStorage.setItem(this.STORAGE_KEYS.TRADES, JSON.stringify(trades));
    return newTrade;
  }

  async bulkCreateTrades(trades) {
    const existingTrades = await this.getTrades();
    const newTrades = trades.map(trade => ({
      ...trade,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    }));
    const allTrades = [...existingTrades, ...newTrades];
    localStorage.setItem(this.STORAGE_KEYS.TRADES, JSON.stringify(allTrades));
    return newTrades;
  }

  async deleteTrade(id) {
    const trades = await this.getTrades();
    const filteredTrades = trades.filter(trade => trade.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.TRADES, JSON.stringify(filteredTrades));
  }

  async deleteTradesByProfileId(profileId) {
    const allTrades = await this.getTrades();
    const filteredTrades = allTrades.filter(trade => trade.trader_profile_id !== profileId);
    localStorage.setItem(this.STORAGE_KEYS.TRADES, JSON.stringify(filteredTrades));
  }

  // --- Account Event / "Bill of Exchange" style ledger ---
  // This keeps a persistent history of important user/account actions.
  async getAccountEvents() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.ACCOUNT_EVENTS) || '[]';
    let events;
    try {
      events = JSON.parse(raw);
    } catch {
      events = [];
    }
    // Newest first
    return events.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async createAccountEvent(event) {
    const events = await this.getAccountEvents();
    const newEvent = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      created_at: new Date().toISOString(),
      // Common fields for later querying
      type: event.type || 'generic',
      user_email: event.user_email || null,
      profile_id: event.profile_id || null,
      // Free-form description and metadata payload
      description: event.description || '',
      metadata: event.metadata || {}
    };
    events.push(newEvent);
    localStorage.setItem(this.STORAGE_KEYS.ACCOUNT_EVENTS, JSON.stringify(events));
    return newEvent;
  }

  async filterAccountEvents(filters = {}) {
    const events = await this.getAccountEvents();
    let filtered = events;

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        filtered = filtered.filter((ev) => ev[key] === value);
      }
    });

    return filtered;
  }

  // User methods (simplified)
  async getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USER) || 'null');
  }

  async setCurrentUser(user) {
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }

  async logout() {
    localStorage.removeItem(this.STORAGE_KEYS.USER);
  }

  // Mock auth methods for compatibility
  auth = {
    me: () => this.getCurrentUser(),
    logout: () => this.logout()
  };

  // Mock entities for compatibility
  entities = {
    TraderProfile: {
      list: (sort = null, limit = null) => {
        return this.getTraderProfiles().then(profiles => {
          if (sort && sort.startsWith('-')) {
            const field = sort.substring(1);
            profiles.sort((a, b) => (b[field] || 0) - (a[field] || 0));
          }
          if (limit) {
            profiles = profiles.slice(0, limit);
          }
          return profiles;
        });
      },
      filter: (filters, sort = null, limit = null) => {
        return this.getTraderProfiles().then(profiles => {
          let filtered = profiles;

          // Apply filters
          Object.keys(filters || {}).forEach(key => {
            if (filters[key] !== undefined) {
              filtered = filtered.filter(profile => profile[key] === filters[key]);
            }
          });

          if (sort && sort.startsWith('-')) {
            const field = sort.substring(1);
            filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
          }

          if (limit) {
            filtered = filtered.slice(0, limit);
          }

          return filtered;
        });
      },
      get: (id) => this.getTraderProfile(id),
      create: (profile) => this.createTraderProfile(profile),
      update: (id, updates) => this.updateTraderProfile(id, updates),
      delete: (id) => this.deleteTraderProfile(id)
    },
    Trade: {
      list: (filters = null) => {
        return this.getTrades().then(trades => {
          if (filters) {
            Object.keys(filters).forEach(key => {
              if (filters[key] !== undefined) {
                trades = trades.filter(trade => trade[key] === filters[key]);
              }
            });
          }
          return trades;
        });
      },
      filter: (filters, sort = null, limit = null) => {
        return this.getTrades().then(trades => {
          let filtered = trades;

          // Apply filters
          Object.keys(filters || {}).forEach(key => {
            if (filters[key] !== undefined) {
              filtered = filtered.filter(trade => trade[key] === filters[key]);
            }
          });

          if (sort && sort.startsWith('-')) {
            const field = sort.substring(1);
            filtered.sort((a, b) => (b[field] || 0) - (a[field] || 0));
          }

          if (limit) {
            filtered = filtered.slice(0, limit);
          }

          return filtered;
        });
      },
      create: (trade) => this.createTrade(trade),
      bulkCreate: (trades) => this.bulkCreateTrades(trades),
      delete: (id) => this.deleteTrade(id),
      deleteByProfileId: (profileId) => this.deleteTradesByProfileId(profileId)
    },
    AccountEvent: {
      list: () => this.getAccountEvents(),
      filter: (filters) => this.filterAccountEvents(filters),
      create: (event) => this.createAccountEvent(event)
    }
  };
}

// Create singleton instance
export const localDataService = new LocalDataService();

// Export for compatibility with existing code
export default localDataService;
