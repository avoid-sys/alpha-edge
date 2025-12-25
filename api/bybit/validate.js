import axios from 'axios';
import CryptoJS from 'crypto-js';

const validateBybitCredentials = async (apiKey, apiSecret) => {
  // First check basic format validation
  if (!apiKey || apiKey.length < 10 || !apiSecret || apiSecret.length < 10) {
    console.error('Bybit credentials format invalid');
    return false;
  }

  try {
    // Try the simplest possible validation - server time
    const timestamp = Date.now().toString();
    const queryString = `timestamp=${timestamp}`;
    const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);

    console.log('Bybit validation attempt:', { timestamp, signature: signature.substring(0, 10) + '...' });

    const response = await axios.get('https://api.bybit.com/v5/market/time', {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature
      }
    });

    console.log('Bybit time response:', response.status, response.data);
    return response.status === 200;
  } catch (err) {
    console.error('Bybit time endpoint failed:', err.message, err.response?.status, err.response?.data);

    // Fallback: try without signature for basic connectivity test
    try {
      const response = await axios.get('https://api.bybit.com/v5/market/time');
      console.log('Bybit basic connectivity works, but auth failed');
      return false; // API works but auth failed
    } catch (basicErr) {
      console.error('Bybit API completely unreachable');
      return false;
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, apiSecret } = req.body;

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'API Key and Secret required' });
  }

  try {
    const valid = await validateBybitCredentials(apiKey, apiSecret);
    res.status(200).json({ valid });
  } catch (err) {
    console.error('Validation failed:', err);
    res.status(500).json({ error: 'Validation failed' });
  }
}
