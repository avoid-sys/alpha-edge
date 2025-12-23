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
    tokenUrl: process.env.CTRADER_TOKEN_URL || 'https://connect.spotware.com/apps/token'
  });

  // Prepare token exchange request
  // Try different endpoints if one fails - user suggested openapi.ctrader.com
  const tokenUrl = process.env.CTRADER_TOKEN_URL || 'https://openapi.ctrader.com/apps/token';
  console.log('🎯 Using token endpoint:', tokenUrl);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id: process.env.CTRADER_CLIENT_ID,
    client_secret: process.env.CTRADER_CLIENT_SECRET,
  });

  try {
    console.log('🔄 cTrader token exchange request:', {
      code: code.substring(0, 20) + '...', // Don't log full code
      redirect_uri,
      client_id: process.env.CTRADER_CLIENT_ID?.substring(0, 20) + '...',
      tokenUrl
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Alpha-Edge-Trading-Platform/1.0'
      },
      body
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON — read as text (HTML error page)
      const text = await response.text();
      console.error('❌ Spotware returned non-JSON (likely HTML error page):', text.substring(0, 500));
      return res.status(400).json({
        error: 'Spotware returned HTML instead of JSON',
        spotware_status: response.status,
        response_preview: text.substring(0, 500),
        content_type: contentType
      });
    }

    // Log FULL response from Spotware (even if error)
    console.log('📡 Spotware response:', {
      status: response.status,
      ok: response.ok,
      data: data,
      headers: Object.fromEntries(response.headers.entries()),
      content_type: contentType
    });

    if (!response.ok) {
      console.error('❌ Token exchange failed:', data);
      return res.status(response.status).json({
        error: 'Token exchange failed',
        details: data,
        spotware_status: response.status
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
