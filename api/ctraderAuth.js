// Vercel serverless function: exchange cTrader authorization code for tokens
// using the cTrader Open API endpoint: https://openapi.ctrader.com/apps/token
//
// IMPORTANT:
// - Configure these env vars in Vercel:
//   - CTRADER_CLIENT_ID (e.g., 1506_ZNLG807Bj6mt9w4g9KYgRhO3CeHeleYf2YfoFVKLOaQnF)
//   - CTRADER_CLIENT_SECRET (e.g., Pr937H9OaHKwviXgd0Uc0uPjAoHdOzQ6JAU8PC7jkJqPe)
//   - CTRADER_REDIRECT_URI (production, e.g. https://alphaedge.vc/auth/ctrader/callback)
//   - CTRADER_LOCAL_REDIRECT_URI (optional, for local dev, e.g. http://localhost:3000/auth/ctrader/callback)
//
// Supports both authorization_code and refresh_token grant types

const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { code, state, redirect_uri: redirectUriFromClient, grant_type, refresh_token } = req.body || {};

    const clientId = process.env.CTRADER_CLIENT_ID;
    const clientSecret = process.env.CTRADER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({
        error: 'cTrader OAuth not configured on server',
        details: 'CTRADER_CLIENT_ID and CTRADER_CLIENT_SECRET must be set'
      });
      return;
    }

    // cTrader Open API token endpoint
    const tokenUrl = 'https://openapi.ctrader.com/apps/token';

    const params = new URLSearchParams();
    
    // Support both authorization_code and refresh_token grant types
    if (grant_type === 'refresh_token' && refresh_token) {
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refresh_token);
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
    } else {
      // Default: authorization_code flow
      if (!code) {
        res.status(400).json({ error: 'Missing authorization code' });
        return;
      }

      // Use redirect_uri from client request if provided, otherwise use env var
      // This allows localhost development
      const redirectUri = redirectUriFromClient || process.env.CTRADER_REDIRECT_URI || process.env.CTRADER_LOCAL_REDIRECT_URI;

      if (!redirectUri) {
        res.status(500).json({
          error: 'Missing redirect_uri',
          details: 'Provide redirect_uri in request body or set CTRADER_REDIRECT_URI in environment'
        });
        return;
      }

      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', redirectUri);
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
    }

    // cTrader Open API requires GET request with query parameters
    // Note: This differs from standard OAuth 2.0 (which uses POST)
    const response = await axios.get(tokenUrl, {
      params: {
        grant_type: grant_type === 'refresh_token' ? 'refresh_token' : 'authorization_code',
        ...(grant_type === 'refresh_token' 
          ? { refresh_token, client_id: clientId, client_secret: clientSecret }
          : { code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret }
        )
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // You may want to store tokens server-side; for now, return them to the client
    res.status(200).json({
      ...response.data,
      received_state: state || null
    });
  } catch (err) {
    // Log full error for debugging
    console.error('ctraderAuth error - Full Error:', err);
    console.error('ctraderAuth error - Response:', err?.response);
    console.error('ctraderAuth error - Response Data:', err?.response?.data);
    
    const statusCode = err?.response?.status || 500;
    const errorData = err?.response?.data;
    
    // If cTrader API returned a structured error, pass it through
    if (errorData && (errorData.error || errorData.error_description)) {
      res.status(statusCode).json({
        error: errorData.error || 'Failed to exchange cTrader authorization code',
        error_description: errorData.error_description,
        details: errorData // Include full error data for debugging
      });
    } else {
      // Generic error or network issue
      res.status(statusCode).json({
        error: 'Failed to exchange cTrader authorization code',
        details: errorData || err.message
      });
    }
  }
};



