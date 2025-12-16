import axios from 'axios';

/**
 * Front-end helper that calls the Vercel serverless proxy for Bybit.
 *
 * All sensitive credentials are kept on the server side (see api/cryptoProxy.js).
 */
export const getBybitAccountData = async (endpoint, params = {}, credentials) => {
  const { apiKey, apiSecret } = credentials || {};

  if (!apiKey || !apiSecret) {
    throw new Error('Missing Bybit API credentials. Please connect your exchange API key and secret.');
  }

  const response = await axios.get('/api/cryptoProxy', {
    params: {
      platform: 'bybit',
      endpoint,
      apiKey,
      apiSecret,
      ...params
    }
  });

  return response.data;
};



