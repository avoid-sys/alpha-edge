import axios from 'axios';
import CryptoJS from 'crypto-js';

const validateBinanceCredentials = async (apiKey, apiSecret) => {
  try {
    // First try to get account information (requires trading permissions)
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString();

    const response = await axios.get('https://api.binance.com/api/v3/account', {
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      params: {
        timestamp,
        signature
      }
    });

    return response.status === 200;
  } catch (err) {
    console.error('Binance validation error:', err.message, err.response?.data);

    // If account endpoint fails, try simpler ping endpoint
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString();

      // Try account snapshot (requires less permissions)
      const snapshotResponse = await axios.get('https://api.binance.com/sapi/v1/accountSnapshot', {
        headers: {
          'X-MBX-APIKEY': apiKey
        },
        params: {
          type: 'SPOT',
          timestamp,
          signature
        }
      });

      return snapshotResponse.status === 200;
    } catch (snapshotErr) {
      console.error('Binance snapshot validation also failed:', snapshotErr.message);
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
    const valid = await validateBinanceCredentials(apiKey, apiSecret);
    res.status(200).json({ valid });
  } catch (err) {
    console.error('Validation failed:', err);
    res.status(500).json({ error: 'Validation failed' });
  }
}
