// Vercel serverless function for cTrader token exchange
// Handles sensitive OAuth token operations server-side to avoid CORS issues

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for token exchange'
    });
  }

  const { code, redirect_uri } = req.body;

  // Validate required parameters
  if (!code || !redirect_uri) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'Both code and redirect_uri are required'
    });
  }

  // Log request for debugging (without sensitive data)
  console.log('🔄 cTrader token exchange request received:', {
    hasCode: !!code,
    codeLength: code?.length,
    redirectUri: redirect_uri,
    timestamp: new Date().toISOString()
  });

  // Log environment variables (without secrets)
  console.log('🔧 Environment check:', {
    hasClientId: !!process.env.CTRADER_CLIENT_ID,
    clientIdLength: process.env.CTRADER_CLIENT_ID?.length,
    hasClientSecret: !!process.env.CTRADER_CLIENT_SECRET,
    clientSecretLength: process.env.CTRADER_CLIENT_SECRET?.length,
    tokenUrl: process.env.CTRADER_TOKEN_URL || 'https://openapi.ctrader.com/apps/token'
  });

  // Prepare token exchange request
  // Try different endpoints if one fails
  const tokenUrl = process.env.CTRADER_TOKEN_URL || 'https://connect.spotware.com/apps/token';
  console.log('🎯 Using token endpoint:', tokenUrl);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id: process.env.CTRADER_CLIENT_ID,
    client_secret: process.env.CTRADER_CLIENT_SECRET,
  });

  try {
    console.log('📡 Making token exchange request to:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Alpha-Edge-Trading-Platform/1.0'
      },
      body
    });

    const data = await response.json();

    console.log('📡 Token exchange response status:', response.status);
    console.log('📡 Raw token exchange response:', JSON.stringify(data, null, 2));
    console.log('📡 Token exchange response summary:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      error: data.error,
      errorDescription: data.error_description
    });

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      return res.status(response.status).json({
        error: 'Token exchange failed',
        details: data,
        message: data.error_description || data.error || 'Unknown error from cTrader'
      });
    }

    // Add expiration timestamp for easier client-side handling
    data.expires_at = Date.now() + (data.expires_in * 1000);

    console.log('✅ Token exchange successful, returning tokens');

    // Return tokens to client
    res.status(200).json(data);

  } catch (error) {
    console.error('💥 Server error during token exchange:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to exchange authorization code for tokens',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
