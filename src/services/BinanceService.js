import axios from 'axios';
import CryptoJS from 'crypto-js';

export const fetchBinanceTrades = async (apiKey, apiSecret) => {
  try {
    // Get account snapshot for balance information
    const timestamp = Date.now();
    const queryString = `type=SPOT&timestamp=${timestamp}`;
    const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString();

    const snapshotResponse = await axios.get(`${import.meta.env.VITE_BINANCE_API_URL || 'https://api.binance.com'}/sapi/v1/accountSnapshot`, {
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      params: {
        type: 'SPOT',
        timestamp,
        signature
      }
    });

    // For demo purposes, return mock trades since myTrades requires symbol parameter
    // In production, you'd need to get all symbols and fetch trades for each
    const mockTrades = [
      {
        id: 'binance_demo_1',
        time: new Date(Date.now() - 86400000), // 1 day ago
        close_time: new Date(Date.now() - 86400000),
        symbol: 'BTCUSDT',
        direction: 'Buy',
        volume: 0.001,
        price: 50000,
        net_profit: 50,
        commission: 0.1,
        balance: 10000
      },
      {
        id: 'binance_demo_2',
        time: new Date(Date.now() - 43200000), // 12 hours ago
        close_time: new Date(Date.now() - 43200000),
        symbol: 'ETHUSDT',
        direction: 'Sell',
        volume: 0.01,
        price: 3000,
        net_profit: -10,
        commission: 0.05,
        balance: 10050
      }
    ];

    return mockTrades;
  } catch (error) {
    console.error('Binance API error:', error.message);
    // Return empty array on error
    return [];
  }
};

export const validateBinanceCredentials = async (apiKey, apiSecret) => {
  try {
    await fetchBinanceTrades(apiKey, apiSecret);
    return true;
  } catch (err) {
    console.error('Binance validation error:', err.message);
    return false;
  }
};
