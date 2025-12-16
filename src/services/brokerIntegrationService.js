// Broker and Exchange Integration Service
// Manages connections to trading platforms and cryptocurrency exchanges

import { securityService } from './securityService';

class BrokerIntegrationService {
  constructor() {
    this.connectedBrokers = new Map();
    this.connectedExchanges = new Map();
    this.supportedBrokers = {
      // Traditional Brokers
      'interactive-brokers': {
        name: 'Interactive Brokers',
        authType: 'oauth', // Requires OAuth
        apiDocs: 'https://interactivebrokers.github.io/tws-api/',
        supportedAssets: ['stocks', 'options', 'futures', 'forex', 'crypto'],
        features: ['real-time data', 'order execution', 'portfolio tracking']
      },
      'alpaca': {
        name: 'Alpaca',
        authType: 'api-key',
        apiDocs: 'https://alpaca.markets/docs/',
        supportedAssets: ['stocks', 'options', 'crypto'],
        features: ['commission-free trading', 'real-time data', 'paper trading']
      },
      'schwab': {
        name: 'Charles Schwab',
        authType: 'oauth',
        apiDocs: 'https://developer.schwab.com/',
        supportedAssets: ['stocks', 'options', 'mutual funds', 'bonds'],
        features: ['real-time data', 'order execution', 'research tools']
      },
      'etrade': {
        name: 'E*TRADE',
        authType: 'oauth',
        apiDocs: 'https://developer.etrade.com/',
        supportedAssets: ['stocks', 'options', 'mutual funds', 'bonds'],
        features: ['real-time data', 'advanced charting', 'research']
      },
      'robinhood': {
        name: 'Robinhood',
        authType: 'oauth',
        apiDocs: 'https://docs.robinhood.com/',
        supportedAssets: ['stocks', 'options', 'crypto', 'etfs'],
        features: ['commission-free', 'fractional shares', 'crypto trading']
      },
      'metatrader': {
        name: 'MetaTrader 5',
        authType: 'broker-api',
        apiDocs: 'https://www.metatrader5.com/en/automated-trading',
        supportedAssets: ['forex', 'commodities', 'indices', 'crypto'],
        features: ['advanced charting', 'automated trading', 'expert advisors']
      },
      'ctrader': {
        name: 'cTrader',
        authType: 'oauth',
        apiDocs: 'https://help.ctrader.com/ctrader-open-api',
        supportedAssets: ['forex', 'indices', 'commodities', 'crypto', 'stocks'],
        features: ['ECN execution', 'advanced charting', 'copy trading', 'OAuth integration'],
        oauth: {
          // Per Spotware cTrader ID/Open API docs, the authorize endpoint is under /apps/authorize
          authUrl: 'https://connect.spotware.com/apps/authorize',
          redirectUri: 'https://www.alphaedge.vc/auth/ctrader/callback',
          scope: 'profile trading' // adjust scopes as needed per Spotware docs
        }
      }
    };

    this.supportedExchanges = {
      // Cryptocurrency Exchanges
      'binance': {
        name: 'Binance',
        authType: 'api-key',
        apiDocs: 'https://binance-docs.github.io/apidocs/',
        supportedAssets: ['spot', 'futures', 'margin', 'options'],
        features: ['high liquidity', 'advanced trading', 'futures', 'staking']
      },
      'coinbase-pro': {
        name: 'Coinbase Pro',
        authType: 'api-key',
        apiDocs: 'https://docs.pro.coinbase.com/',
        supportedAssets: ['spot', 'advanced-trade'],
        features: ['secure storage', 'insurance', 'regulatory compliance']
      },
      'kraken': {
        name: 'Kraken',
        authType: 'api-key',
        apiDocs: 'https://docs.kraken.com/rest/',
        supportedAssets: ['spot', 'futures', 'margin', 'staking'],
        features: ['security focused', 'futures trading', 'staking rewards']
      },
      'kucoin': {
        name: 'KuCoin',
        authType: 'api-key',
        apiDocs: 'https://docs.kucoin.com/',
        supportedAssets: ['spot', 'futures', 'margin', 'lending'],
        features: ['high leverage', 'lending platform', 'KuCoin Shares']
      },
      'bybit': {
        name: 'Bybit',
        authType: 'api-key',
        apiDocs: 'https://bybit-exchange.github.io/docs/',
        supportedAssets: ['spot', 'futures', 'options', 'copy trading'],
        features: ['derivatives focus', 'copy trading', 'high leverage']
      },
      'okx': {
        name: 'OKX',
        authType: 'api-key',
        apiDocs: 'https://www.okx.com/docs/',
        supportedAssets: ['spot', 'futures', 'options', 'defi'],
        features: ['multi-chain support', 'DeFi integration', 'NFT marketplace']
      },
      'gate-io': {
        name: 'Gate.io',
        authType: 'api-key',
        apiDocs: 'https://www.gate.io/docs/',
        supportedAssets: ['spot', 'futures', 'margin', 'defi'],
        features: ['meme coins', 'defi integration', 'high leverage']
      },
      'huobi': {
        name: 'Huobi',
        authType: 'api-key',
        apiDocs: 'https://huobiapi.github.io/docs/',
        supportedAssets: ['spot', 'futures', 'margin', 'options'],
        features: ['global exchange', 'HT token ecosystem', 'high volume']
      }
    };

    this.loadConnections();
  }

  // Load saved connections from localStorage
  loadConnections() {
    try {
      const brokers = securityService.decrypt(localStorage.getItem('alpha_edge_connected_brokers') || '[]');
      const exchanges = securityService.decrypt(localStorage.getItem('alpha_edge_connected_exchanges') || '[]');

      this.connectedBrokers = new Map(JSON.parse(brokers));
      this.connectedExchanges = new Map(JSON.parse(exchanges));
    } catch (error) {
      console.error('Failed to load broker/exchange connections:', error);
      this.connectedBrokers = new Map();
      this.connectedExchanges = new Map();
    }
  }

  // Save connections to localStorage
  saveConnections() {
    try {
      const brokers = securityService.encrypt(JSON.stringify([...this.connectedBrokers]));
      const exchanges = securityService.encrypt(JSON.stringify([...this.connectedExchanges]));

      localStorage.setItem('alpha_edge_connected_brokers', brokers);
      localStorage.setItem('alpha_edge_connected_exchanges', exchanges);
    } catch (error) {
      console.error('Failed to save broker/exchange connections:', error);
    }
  }

  // Broker Integration Methods
  async connectBroker(brokerId, credentials) {
    if (!this.supportedBrokers[brokerId]) {
      throw new Error('Unsupported broker');
    }

    const broker = this.supportedBrokers[brokerId];
    securityService.logSecurityEvent('broker_connection_attempted', { brokerId });

    try {
      let connectionResult;

      switch (broker.authType) {
        case 'api-key':
          connectionResult = await this.authenticateWithApiKey(brokerId, credentials, 'broker');
          break;
        case 'oauth':
          connectionResult = await this.authenticateWithOAuth(brokerId, credentials, 'broker');
          break;
        case 'broker-api':
          connectionResult = await this.authenticateWithBrokerApi(brokerId, credentials);
          break;
        default:
          throw new Error('Unsupported authentication method');
      }

      this.connectedBrokers.set(brokerId, {
        ...connectionResult,
        connectedAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      });

      this.saveConnections();
      securityService.logSecurityEvent('broker_connection_successful', { brokerId });

      return connectionResult;
    } catch (error) {
      securityService.logSecurityEvent('broker_connection_failed', { brokerId, error: error.message });
      throw error;
    }
  }

  async connectExchange(exchangeId, credentials) {
    if (!this.supportedExchanges[exchangeId]) {
      throw new Error('Unsupported exchange');
    }

    const exchange = this.supportedExchanges[exchangeId];
    securityService.logSecurityEvent('exchange_connection_attempted', { exchangeId });

    try {
      let connectionResult;

      switch (exchange.authType) {
        case 'api-key':
          connectionResult = await this.authenticateWithApiKey(exchangeId, credentials, 'exchange');
          break;
        case 'oauth':
          connectionResult = await this.authenticateWithOAuth(exchangeId, credentials, 'exchange');
          break;
        default:
          throw new Error('Unsupported authentication method');
      }

      this.connectedExchanges.set(exchangeId, {
        ...connectionResult,
        connectedAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      });

      this.saveConnections();
      securityService.logSecurityEvent('exchange_connection_successful', { exchangeId });

      return connectionResult;
    } catch (error) {
      securityService.logSecurityEvent('exchange_connection_failed', { exchangeId, error: error.message });
      throw error;
    }
  }

  // Authentication Methods
  async authenticateWithApiKey(platformId, credentials, type) {
    const { apiKey, apiSecret, passphrase } = credentials;

    if (!apiKey || !apiSecret) {
      throw new Error('API Key and Secret are required');
    }

    // Validate API key format (basic validation)
    if (apiKey.length < 10 || apiSecret.length < 10) {
      throw new Error('Invalid API credentials format');
    }

    // Placeholder for actual API validation
    // In production, this would make test API calls
    console.log(`Validating ${type} API credentials for ${platformId}`);

    // Simulate API validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful authentication
    // NOTE: For this local/front-end only implementation we keep API
    // credentials in memory and in encrypted localStorage (see saveConnections).
    // They are NOT sent to any third-party except when explicitly used
    // via our own backend proxy to call the exchange.
    return {
      platformId,
      type,
      status: 'connected',
      accountId: `mock_${platformId}_${Date.now()}`,
      permissions: ['read'],
      authenticated: true,
      apiKey,
      apiSecret,
      passphrase: passphrase || null
    };
  }

  async authenticateWithOAuth(platformId, credentials, type) {
    // Placeholder for OAuth flow
    // In production, this would redirect to OAuth provider
    console.log(`Initiating OAuth flow for ${type}: ${platformId}`);

    // Mock OAuth result
    return {
      platformId,
      type,
      status: 'connected',
      oauth: true,
      accountId: `oauth_${platformId}_${Date.now()}`,
      permissions: ['read', 'trading'],
      authenticated: true
    };
  }

  async authenticateWithBrokerApi(brokerId, credentials) {
    const { brokerServer, accountNumber, password } = credentials;

    if (!brokerServer || !accountNumber || !password) {
      throw new Error('Broker server, account number, and password are required');
    }

    // Placeholder for MetaTrader/broker API authentication
    console.log(`Authenticating with broker API: ${brokerId}`);

    return {
      platformId: brokerId,
      type: 'broker',
      status: 'connected',
      brokerServer,
      accountNumber: accountNumber.replace(/./g, '*'), // Mask account number
      permissions: ['read', 'trading'],
      authenticated: true
    };
  }

  // Data Synchronization Methods
  async syncBrokerData(brokerId) {
    const connection = this.connectedBrokers.get(brokerId);
    if (!connection) {
      throw new Error('Broker not connected');
    }

    // Placeholder for data synchronization
    console.log(`Syncing data from ${brokerId}`);

    // Mock data sync result
    const mockData = {
      balance: Math.random() * 10000 + 5000,
      positions: Math.floor(Math.random() * 20) + 1,
      orders: Math.floor(Math.random() * 10),
      lastSync: new Date().toISOString()
    };

    connection.lastSync = mockData.lastSync;
    this.saveConnections();

    return mockData;
  }

  async syncExchangeData(exchangeId) {
    const connection = this.connectedExchanges.get(exchangeId);
    if (!connection) {
      throw new Error('Exchange not connected');
    }

    // Placeholder for data synchronization
    console.log(`Syncing data from ${exchangeId}`);

    // Mock data sync result
    const mockData = {
      balance: Math.random() * 5000 + 1000,
      positions: Math.floor(Math.random() * 15) + 1,
      orders: Math.floor(Math.random() * 8),
      lastSync: new Date().toISOString()
    };

    connection.lastSync = mockData.lastSync;
    this.saveConnections();

    return mockData;
  }

  // Utility Methods
  getConnectedBrokers() {
    return Array.from(this.connectedBrokers.entries()).map(([id, data]) => ({
      id,
      ...this.supportedBrokers[id],
      ...data
    }));
  }

  getConnectedExchanges() {
    return Array.from(this.connectedExchanges.entries()).map(([id, data]) => ({
      id,
      ...this.supportedExchanges[id],
      ...data
    }));
  }

  disconnectBroker(brokerId) {
    this.connectedBrokers.delete(brokerId);
    this.saveConnections();
    securityService.logSecurityEvent('broker_disconnected', { brokerId });
  }

  disconnectExchange(exchangeId) {
    this.connectedExchanges.delete(exchangeId);
    this.saveConnections();
    securityService.logSecurityEvent('exchange_disconnected', { exchangeId });
  }

  getSupportedBrokers() {
    return this.supportedBrokers;
  }

  getSupportedExchanges() {
    return this.supportedExchanges;
  }

  // Get comprehensive API requirements documentation
  getApiRequirements() {
    return {
      brokers: {
        'interactive-brokers': {
          required: ['OAuth Application Registration', 'TWS/Gateway Installation', 'IBKR Account'],
          apiKeys: ['Client ID', 'Client Secret'],
          documentation: 'https://interactivebrokers.github.io/tws-api/',
          notes: 'Requires running TWS or IB Gateway locally'
        },
        'alpaca': {
          required: ['Alpaca Account', 'API Key Generation'],
          apiKeys: ['API Key ID', 'API Secret Key'],
          documentation: 'https://alpaca.markets/docs/',
          notes: 'Paper trading available for testing'
        },
        'schwab': {
          required: ['Schwab Account', 'Developer App Registration'],
          apiKeys: ['App Key', 'App Secret'],
          documentation: 'https://developer.schwab.com/',
          notes: 'Requires individual app approval'
        },
        'etrade': {
          required: ['E*TRADE Account', 'OAuth Application Setup'],
          apiKeys: ['Consumer Key', 'Consumer Secret'],
          documentation: 'https://developer.etrade.com/',
          notes: 'Requires OAuth 1.0a implementation'
        },
        'robinhood': {
          required: ['Robinhood Account', 'Unofficial API Access'],
          apiKeys: ['Username', 'Password', 'Device Token'],
          documentation: 'https://github.com/robinhood-unofficial/pyrh',
          notes: 'Uses unofficial API - may break with updates'
        },
        'metatrader': {
          required: ['MetaTrader Account', 'Broker API Access'],
          apiKeys: ['Broker Server', 'Account Number', 'Password'],
          documentation: 'https://www.metatrader5.com/en/automated-trading',
          notes: 'Varies by broker - some provide API access'
        }
      },
      exchanges: {
        'binance': {
          required: ['Binance Account', 'API Key Generation'],
          apiKeys: ['API Key', 'Secret Key'],
          documentation: 'https://binance-docs.github.io/apidocs/',
          notes: 'Enable spot and futures trading permissions'
        },
        'coinbase-pro': {
          required: ['Coinbase Account', 'Pro Account', 'API Key Setup'],
          apiKeys: ['API Key', 'API Secret', 'Passphrase'],
          documentation: 'https://docs.pro.coinbase.com/',
          notes: 'Requires Coinbase Pro subscription'
        },
        'kraken': {
          required: ['Kraken Account', 'API Key Generation'],
          apiKeys: ['API Key', 'API Secret'],
          documentation: 'https://docs.kraken.com/rest/',
          notes: 'Enable trading and funding permissions'
        },
        'kucoin': {
          required: ['KuCoin Account', 'API Key Setup'],
          apiKeys: ['API Key', 'API Secret', 'Passphrase'],
          documentation: 'https://docs.kucoin.com/',
          notes: 'Enable spot and futures trading'
        },
        'bybit': {
          required: ['Bybit Account', 'API Key Generation'],
          apiKeys: ['API Key', 'API Secret'],
          documentation: 'https://bybit-exchange.github.io/docs/',
          notes: 'Enable derivatives and spot trading'
        },
        'okx': {
          required: ['OKX Account', 'API Key Setup'],
          apiKeys: ['API Key', 'API Secret', 'Passphrase'],
          documentation: 'https://www.okx.com/docs/',
          notes: 'Enable trading and reading permissions'
        },
        'gate-io': {
          required: ['Gate.io Account', 'API Key Generation'],
          apiKeys: ['API Key', 'API Secret'],
          documentation: 'https://www.gate.io/docs/',
          notes: 'Enable spot and futures trading'
        },
        'huobi': {
          required: ['Huobi Account', 'API Key Setup'],
          apiKeys: ['Access Key', 'Secret Key'],
          documentation: 'https://huobiapi.github.io/docs/',
          notes: 'Enable spot and futures trading'
        }
      },
      generalRequirements: {
        server: 'Backend server needed for secure API key storage and proxy requests',
        database: 'Secure database for storing encrypted API credentials',
        oauth: 'OAuth 2.0 implementation for supported platforms',
        rateLimiting: 'API rate limiting to prevent abuse',
        security: 'API key encryption and secure transmission',
        cors: 'Proper CORS configuration for API requests',
        monitoring: 'API health monitoring and error handling'
      }
    };
  }
}

// Export singleton instance
export const brokerIntegrationService = new BrokerIntegrationService();
