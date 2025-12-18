import axios from 'axios';
import CryptoJS from 'crypto-js';

// Bybit API configuration
const BYBIT_BASE_URL = 'https://api.bybit.com';
const BYBIT_API_KEY = import.meta.env.VITE_BYBIT_API_KEY;
const BYBIT_API_SECRET = import.meta.env.VITE_BYBIT_API_SECRET;

// Generate HMAC SHA256 signature for Bybit API
function generateSignature(secret, params) {
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return CryptoJS.HmacSHA256(queryString, secret).toString();
}

// Get current timestamp
function getTimestamp() {
  return Date.now().toString();
}

// Make authenticated request to Bybit API
async function makeBybitRequest(endpoint, params = {}) {
  if (!BYBIT_API_KEY || !BYBIT_API_SECRET) {
    throw new Error('Bybit API credentials not configured. Please set VITE_BYBIT_API_KEY and VITE_BYBIT_API_SECRET.');
  }

  const timestamp = getTimestamp();
  const requestParams = {
    api_key: BYBIT_API_KEY,
    timestamp: timestamp,
    ...params
  };

  const signature = generateSignature(BYBIT_API_SECRET, requestParams);
  requestParams.sign = signature;

  const url = `${BYBIT_BASE_URL}${endpoint}`;

  try {
    const response = await axios.get(url, {
      params: requestParams,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.retCode !== 0) {
      throw new Error(`Bybit API error: ${response.data.retMsg}`);
    }

    return response.data.result;
  } catch (error) {
    console.error('Bybit API request failed:', error);
    throw error;
  }
}

// Get closed positions (trades) from Bybit
export async function getBybitTrades(limit = 50) {
  try {
    // Get closed PNL data - this gives us trade history
    const pnlData = await makeBybitRequest('/v5/position/closed-pnl', {
      limit: limit.toString(),
      category: 'linear' // spot/linear/inverse
    });

    // Transform Bybit data to our trade format
    const trades = pnlData.list.map(pnl => ({
      symbol: pnl.symbol,
      direction: pnl.side === 'Buy' ? 'Buy' : 'Sell',
      entry_price: parseFloat(pnl.avgEntryPrice),
      exit_price: parseFloat(pnl.avgExitPrice),
      volume: parseFloat(pnl.qty),
      net_profit: parseFloat(pnl.closedPnl),
      close_time: new Date(parseInt(pnl.updatedTime)).toISOString(),
      open_time: new Date(parseInt(pnl.createdTime)).toISOString(),
      balance: 0, // Bybit doesn't provide balance in this endpoint
      exchange: 'bybit'
    }));

    console.log('Fetched Bybit trades:', trades.length);
    return trades;

  } catch (error) {
    console.error('Failed to fetch Bybit trades:', error);
    throw error;
  }
}

// Get account balance from Bybit
export async function getBybitAccountBalance() {
  try {
    const balanceData = await makeBybitRequest('/v5/account/wallet-balance', {
      accountType: 'UNIFIED'
    });

    return balanceData.list[0]; // Return first account balance
  } catch (error) {
    console.error('Failed to fetch Bybit balance:', error);
    throw error;
  }
}

// Alternative: Get order history (another way to get trades)
export async function getBybitOrderHistory(limit = 50) {
  try {
    const orderData = await makeBybitRequest('/v5/order/history', {
      limit: limit.toString(),
      category: 'linear'
    });

    // Transform order data to trade format
    const trades = orderData.list
      .filter(order => order.orderStatus === 'Filled')
      .map(order => ({
        symbol: order.symbol,
        direction: order.side,
        entry_price: parseFloat(order.price),
        volume: parseFloat(order.qty),
        net_profit: 0, // Orders don't have profit info
        close_time: new Date(parseInt(order.updatedTime)).toISOString(),
        open_time: new Date(parseInt(order.createdTime)).toISOString(),
        balance: 0,
        exchange: 'bybit'
      }));

    return trades;
  } catch (error) {
    console.error('Failed to fetch Bybit order history:', error);
    throw error;
  }
}