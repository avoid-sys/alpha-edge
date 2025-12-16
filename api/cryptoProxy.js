// Vercel serverless function to proxy authenticated requests to crypto exchanges.
// NOTE: For security, API keys and secrets must be provided via environment
// variables in Vercel (Project Settings → Environment Variables).
//
// Currently implemented: Bybit v5 wallet-balance style GET requests.

const axios = require('axios');
const CryptoJS = require('crypto-js');

// Base URLs per exchange (extend as needed)
const BASE_URLS = {
  bybit: 'https://api.bybit.com'
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { platform, endpoint, apiKey: apiKeyFromQuery, apiSecret: apiSecretFromQuery, ...queryParams } = req.query;

    if (!platform || !endpoint) {
      res.status(400).json({ error: 'platform and endpoint are required' });
      return;
    }

    const baseUrl = BASE_URLS[platform];
    if (!baseUrl) {
      res.status(400).json({ error: `Platform ${platform} is not supported in the proxy yet` });
      return;
    }

    // Route per platform
    switch (platform) {
      case 'bybit': {
        // Prefer per-request credentials (multi-tenant), fall back to env vars if provided
        const apiKey = apiKeyFromQuery || process.env.BYBIT_API_KEY;
        const apiSecret = apiSecretFromQuery || process.env.BYBIT_API_SECRET;

        if (!apiKey || !apiSecret) {
          res.status(400).json({
            error: 'Missing API credentials for Bybit',
            details: 'Provide apiKey & apiSecret in the request or configure BYBIT_API_KEY / BYBIT_API_SECRET in the server environment.'
          });
          return;
        }

        const recvWindow = '5000';
        const timestamp = Date.now().toString();

        // Build query string including client params
        const params = { ...queryParams };
        const query = new URLSearchParams(params);
        const queryString = query.toString();

        // Per Bybit v5 docs, sign raw string of: timestamp + apiKey + recvWindow + queryString
        const signPayload = timestamp + apiKey + recvWindow + queryString;
        const signature = CryptoJS.HmacSHA256(signPayload, apiSecret).toString(CryptoJS.enc.Hex);

        const url = `${baseUrl}${endpoint}?${queryString}`;

        const response = await axios.get(url, {
          headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN': signature,
            'Content-Type': 'application/json'
          }
        });

        res.status(response.status).json(response.data);
        return;
      }

      default: {
        res.status(400).json({ error: `Platform ${platform} is not implemented in cryptoProxy yet` });
        return;
      }
    }
  } catch (err) {
    console.error('cryptoProxy error:', err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({
      error: 'Upstream request failed',
      details: err?.response?.data || err.message
    });
  }
};


