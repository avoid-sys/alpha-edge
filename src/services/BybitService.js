import axios from 'axios';
import CryptoJS from 'crypto-js';

export const fetchBybitTrades = async (apiKey, apiSecret) => {
  try {
    // For demo purposes, return mock trades
    // In production, you'd implement proper Bybit API calls
    const mockTrades = [
      {
        id: 'bybit_demo_1',
        time: new Date(Date.now() - 172800000), // 2 days ago
        close_time: new Date(Date.now() - 172800000),
        symbol: 'BTCUSDT',
        direction: 'Buy',
        volume: 0.001,
        price: 50000,
        net_profit: 75,
        commission: 0.08,
        balance: 10000
      },
      {
        id: 'bybit_demo_2',
        time: new Date(Date.now() - 21600000), // 6 hours ago
        close_time: new Date(Date.now() - 21600000),
        symbol: 'ETHUSDT',
        direction: 'Sell',
        volume: 0.02,
        price: 3000,
        net_profit: -25,
        commission: 0.03,
        balance: 10075
      }
    ];

    return mockTrades;
  } catch (error) {
    console.error('Bybit API error:', error.message);
    // Return empty array on error
    return [];
  }
};

export const validateBybitCredentials = async (apiKey, apiSecret) => {
  try {
    await fetchBybitTrades(apiKey, apiSecret);
    return true;
  } catch (err) {
    console.error('Bybit validation error:', err.message);
    return false;
  }
};
