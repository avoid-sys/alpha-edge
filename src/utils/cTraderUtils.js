// cTrader OAuth utilities
export const getRedirectUri = () => {
  // Must match exactly with registered URIs in cTrader app
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3008/auth/ctrader/callback';
  }
  return 'https://alphaedge.vc/auth/ctrader/callback';
};

export const generateState = () => {
  return crypto.randomUUID();
};
