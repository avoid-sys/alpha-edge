// Vercel serverless function: exchange cTrader authorization code for tokens
// using the OpenID Connect endpoint
//
// IMPORTANT:
// - Configure these env vars in Vercel:
//   - CTRADER_CLIENT_ID
//   - CTRADER_CLIENT_SECRET
//   - CTRADER_REDIRECT_URI (production, e.g. https://www.alphaedge.vc/auth/ctrader/callback)
//   - CTRADER_LOCAL_REDIRECT_URI (optional, for local dev, e.g. http://localhost:5173/auth/ctrader/callback)

const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { code, state, redirect_uri: redirectUriFromClient } = req.body || {};

    if (!code) {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    const clientId = process.env.CTRADER_CLIENT_ID;
    const clientSecret = process.env.CTRADER_CLIENT_SECRET;
    
    // Use redirect_uri from client request if provided, otherwise use env var
    // This allows localhost development
    const redirectUri = redirectUriFromClient || process.env.CTRADER_REDIRECT_URI || process.env.CTRADER_LOCAL_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      res.status(500).json({
        error: 'cTrader OAuth not configured on server',
        details: 'CTRADER_CLIENT_ID and CTRADER_CLIENT_SECRET must be set'
      });
      return;
    }

    if (!redirectUri) {
      res.status(500).json({
        error: 'Missing redirect_uri',
        details: 'Provide redirect_uri in request body or set CTRADER_REDIRECT_URI in environment'
      });
      return;
    }

    // Try both possible token endpoints (cTrader may use either)
    const tokenUrls = [
      'https://openid.ctrader.com/connect/token',
      'https://id.ctrader.com/connect/token',
      'https://connect.spotware.com/connect/token'
    ];

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    let lastError = null;
    let response = null;

    // Try each token endpoint until one works
    for (const tokenUrl of tokenUrls) {
      try {
        response = await axios.post(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        });
        // If successful, break out of loop
        break;
      } catch (err) {
        lastError = err;
        // If it's a 404 or connection error, try next URL
        if (err.response?.status === 404 || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
          continue;
        }
        // For other errors (400, 401, etc.), this might be the right endpoint but wrong credentials
        // So we'll try the next one, but keep this error
        continue;
      }
    }

    if (!response) {
      console.error('ctraderAuth error: All token endpoints failed', lastError?.response?.data || lastError?.message);
      res.status(lastError?.response?.status || 500).json({
        error: 'Failed to exchange cTrader authorization code',
        details: lastError?.response?.data || lastError?.message || 'All token endpoints failed'
      });
      return;
    }

    // You may want to store tokens server-side; for now, return them to the client
    res.status(200).json({
      ...response.data,
      received_state: state || null
    });
  } catch (err) {
    console.error('ctraderAuth error:', err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({
      error: 'Failed to exchange cTrader authorization code',
      details: err?.response?.data || err.message
    });
  }
};



