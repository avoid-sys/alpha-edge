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

  const { code, redirect_uri, account_type = 'live' } = req.body;

  // Validate required parameters
  if (!code || !redirect_uri) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'Both code and redirect_uri are required'
    });
  }

  // Select credentials based on account type with backward compatibility
  const isDemo = account_type === 'demo';

  // Try new format first (CTRADER_LIVE_CLIENT_ID, CTRADER_DEMO_CLIENT_ID)
  let clientId = isDemo
    ? process.env.CTRADER_DEMO_CLIENT_ID
    : process.env.CTRADER_LIVE_CLIENT_ID;
  let clientSecret = isDemo
    ? process.env.CTRADER_DEMO_CLIENT_SECRET
    : process.env.CTRADER_LIVE_CLIENT_SECRET;

  // Backward compatibility: fallback to old format if new ones not set
  if (!clientId || !clientSecret) {
    console.warn('⚠️ New format credentials not found, trying backward compatibility...');
    clientId = process.env.CTRADER_FULL_CLIENT_ID || process.env.CTRADER_CLIENT_ID;
    clientSecret = process.env.CTRADER_CLIENT_SECRET;

    if (clientId && clientSecret) {
      console.log('✅ Using backward compatible credentials');
    }
  }

  // Fallback: if demo credentials missing, use live credentials
  if (isDemo && (!clientId || !clientSecret)) {
    console.warn('⚠️ DEMO credentials not configured, falling back to LIVE credentials for token exchange');
    clientId = process.env.CTRADER_LIVE_CLIENT_ID || process.env.CTRADER_FULL_CLIENT_ID || process.env.CTRADER_CLIENT_ID;
    clientSecret = process.env.CTRADER_LIVE_CLIENT_SECRET || process.env.CTRADER_CLIENT_SECRET;
  }

  console.log('🔧 Using', isDemo ? 'DEMO' : 'LIVE', 'credentials for token exchange (with fallback)');

  // Validate cTrader credentials with backward compatibility check
  if (!clientId || !clientSecret) {
    console.error('❌ Missing cTrader credentials (both LIVE and DEMO):', {
      hasLiveClientId: !!process.env.CTRADER_LIVE_CLIENT_ID,
      hasLiveClientSecret: !!process.env.CTRADER_LIVE_CLIENT_SECRET,
      hasDemoClientId: !!process.env.CTRADER_DEMO_CLIENT_ID,
      hasDemoClientSecret: !!process.env.CTRADER_DEMO_CLIENT_SECRET,
      // Backward compatibility check
      hasOldFullClientId: !!process.env.CTRADER_FULL_CLIENT_ID,
      hasOldClientId: !!process.env.CTRADER_CLIENT_ID,
      hasOldClientSecret: !!process.env.CTRADER_CLIENT_SECRET,
      accountType: account_type
    });
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'cTrader credentials not configured. Need CTRADER_LIVE_CLIENT_ID/CTRADER_LIVE_CLIENT_SECRET or backward compatible CTRADER_FULL_CLIENT_ID/CTRADER_CLIENT_SECRET'
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
    accountType: account_type,
    hasClientId: !!clientId,
    clientIdValue: clientId, // Show actual value for debugging
    clientIdLength: clientId?.length,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length,
    tokenUrl: process.env.CTRADER_TOKEN_URL || 'https://openapi.ctrader.com/apps/token'
  });

  // Prepare token exchange request
  // Try different endpoints if one fails - user suggested openapi.ctrader.com
  const tokenUrl = process.env.CTRADER_TOKEN_URL || 'https://openapi.ctrader.com/apps/token';
  console.log('🎯 Using token endpoint:', tokenUrl);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id: clientId, // Use selected credentials based on account type
    client_secret: clientSecret,
  });

  try {
    console.log('🔄 cTrader token exchange request:', {
      accountType: account_type,
      code: code.substring(0, 20) + '...', // Don't log full code
      redirect_uri,
      client_id: clientId?.substring(0, 20) + '...',
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

    // Handle specific Spotware errors
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 300; // Default 5 minutes
      console.warn(`⚠️ Rate limited by Spotware (429). Retry after ${retryAfter} seconds`);
      return res.status(429).json({
        error: 'Rate limited by Spotware',
        retry_after: parseInt(retryAfter),
        message: 'Превышен лимит запросов. Подождите несколько минут и попробуйте подключить аккаунт заново.'
      });
    }

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
