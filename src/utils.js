// Utility functions for the Alpha Edge platform

export const createPageUrl = (path) => {
  // Simple URL creation - can be enhanced for routing
  return `/${path.toLowerCase()}`;
};

export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const formatPercentage = (value, decimals = 2) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 2) => {
  return value.toFixed(decimals);
};
