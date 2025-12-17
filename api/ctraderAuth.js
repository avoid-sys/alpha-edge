// Vercel serverless function: exchange cTrader authorization code for tokens
// using the cTrader Open API endpoint: https://openapi.ctrader.com/apps/token
//
// IMPORTANT:
// - Configure these env vars in Vercel:
//   - CTRADER_CLIENT_ID
//   - CTRADER_CLIENT_SECRET
//   - CTRADER_REDIRECT_URI (production, e.g. https://alphaedge.vc/auth/ctrader/callback)
//   - CTRADER_LOCAL_REDIRECT_URI (optional, for local dev, e.g. http://localhost:3000/auth/ctrader/callback)

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

    // cTrader Open API token endpoint
    const tokenUrl = 'https://openapi.ctrader.com/apps/token';

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    // Exchange authorization code for access token
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });

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



