import axios from 'axios';
import CryptoJS from 'crypto-js';

const validateBybitCredentials = async (apiKey, apiSecret) => {
  try {
    const timestamp = Date.now().toString();
    const queryString = `category=linear&timestamp=${timestamp}`;
    const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString();

    const response = await axios.get('https://api.bybit.com/v5/position/list', {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature
      }
    });

    return response.status === 200;
  } catch (err) {
    console.error('Bybit validation error:', err.message);
    return false;
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
