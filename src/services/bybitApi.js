import axios from 'axios';

/**
 * Front-end helper that calls the Vercel serverless proxy for Bybit.
 *
 * All sensitive credentials are kept on the server side (see api/cryptoProxy.js).
 */
export const getBybitAccountData = async (endpoint, params = {}) => {
  const response = await axios.get('/api/cryptoProxy', {
    params: {
      platform: 'bybit',
      endpoint,
      ...params
    }
  });

  return response.data;
};



