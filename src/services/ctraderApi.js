// cTrader Open API service
// Handles API calls to cTrader Open API for fetching trading data

import axios from 'axios';

const CTRADER_API_BASE = 'https://openapi.ctrader.com';

/**
 * Get access token from localStorage
 */
export const getCTraderToken = () => {
  return localStorage.getItem('ctrader_access_token');
};

/**
 * Check if token is expired
 */
export const isTokenExpired = () => {
  const expiresAt = localStorage.getItem('ctrader_expires_at');
  if (!expiresAt) return true;
  return Date.now() > parseInt(expiresAt, 10);
};

/**
 * Refresh access token using refresh_token
 */
export const refreshCTraderToken = async () => {
  const refreshToken = localStorage.getItem('ctrader_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    // Exchange refresh token for new access token via backend
    const response = await axios.post('/api/ctraderAuth', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    if (response.data?.access_token) {
      localStorage.setItem('ctrader_access_token', response.data.access_token);
      if (response.data?.refresh_token) {
        localStorage.setItem('ctrader_refresh_token', response.data.refresh_token);
      }
      if (response.data?.expires_in) {
        const expiresAt = Date.now() + response.data.expires_in * 1000;
        localStorage.setItem('ctrader_expires_at', expiresAt.toString());
      }
      return response.data.access_token;
    }
    throw new Error('Failed to refresh token');
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

/**
 * Get authenticated request headers
 */
const getAuthHeaders = async () => {
  let token = getCTraderToken();
  
  if (!token || isTokenExpired()) {
    token = await refreshCTraderToken();
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Get account information
 */
export const getCTraderAccountInfo = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${CTRADER_API_BASE}/accounts`, { headers });
    return response.data;
  } catch (error) {
    console.error('cTrader account info error:', error);
    throw error;
  }
};

/**
 * Get trading history (deals/trades)
 * @param {Object} params - Query parameters (from, to, accountId, etc.)
 */
export const getCTraderTrades = async (params = {}) => {
  try {
    const headers = await getAuthHeaders();
    
    // Default to last 30 days if no date range specified
    const defaultParams = {
      from: params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: params.to || new Date().toISOString().split('T')[0],
      ...params
    };

    const response = await axios.get(`${CTRADER_API_BASE}/deals`, {
      headers,
      params: defaultParams
    });
    
    return response.data;
  } catch (error) {
    console.error('cTrader trades error:', error);
    throw error;
  }
};

/**
 * Get positions (open trades)
 */
export const getCTraderPositions = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${CTRADER_API_BASE}/positions`, { headers });
    return response.data;
  } catch (error) {
    console.error('cTrader positions error:', error);
    throw error;
  }
};

/**
 * Get account statistics
 */
export const getCTraderStatistics = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${CTRADER_API_BASE}/statistics`, { headers });
    return response.data;
  } catch (error) {
    console.error('cTrader statistics error:', error);
    throw error;
  }
};

