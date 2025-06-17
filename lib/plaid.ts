import { Platform } from 'react-native';

// Plaid configuration
export const PLAID_CONFIG = {
  clientName: 'Credit Card Rewards Tracker',
  products: ['transactions'],
  countryCodes: ['US'],
  language: 'en',
  environment: process.env.EXPO_PUBLIC_PLAID_ENVIRONMENT || 'sandbox',
  publicKey: process.env.EXPO_PUBLIC_PLAID_PUBLIC_KEY,
  clientId: process.env.EXPO_PUBLIC_PLAID_CLIENT_ID,
};

// API endpoints
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const PLAID_ENDPOINTS = {
  createLinkToken: `${API_BASE_URL}/api/plaid/create-link-token`,
  exchangeToken: `${API_BASE_URL}/api/plaid/exchange-token`,
  sync: `${API_BASE_URL}/api/plaid/sync`,
  disconnect: `${API_BASE_URL}/api/plaid/disconnect`,
  getAccounts: `${API_BASE_URL}/api/plaid/accounts`,
};

// Rate limiting configuration
export const RATE_LIMITS = {
  createLinkToken: 100, // requests per hour
  exchangeToken: 50,    // requests per hour
  sync: 20,             // requests per hour
};

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Security headers
export const getSecurityHeaders = (authToken: string) => ({
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json',
  'X-Client-Platform': Platform.OS,
  'X-Client-Version': '1.0.0',
});

// Exponential backoff utility
export const exponentialBackoff = async <T>(
  fn: () => Promise<T>,
  attempt: number = 1
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= RETRY_CONFIG.maxAttempts) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    await new Promise(resolve => setTimeout(resolve, delay));
    return exponentialBackoff(fn, attempt + 1);
  }
};

// Error handling utility
export const handlePlaidError = (error: any) => {
  if (error.response?.data?.error) {
    const plaidError = error.response.data.error;
    return {
      type: plaidError.error_type,
      code: plaidError.error_code,
      message: plaidError.display_message || plaidError.error_message,
      suggestedAction: plaidError.suggested_action,
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    code: 'UNKNOWN',
    message: error.message || 'An unexpected error occurred',
    suggestedAction: 'Please try again later',
  };
};

// Validation utilities
export const validateEnvironmentConfig = () => {
  const requiredVars = [
    'EXPO_PUBLIC_PLAID_CLIENT_ID',
    'EXPO_PUBLIC_PLAID_PUBLIC_KEY',
    'EXPO_PUBLIC_PLAID_ENVIRONMENT',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Plaid environment variables: ${missing.join(', ')}`);
  }
};

// Category mapping from Plaid to our categories
export const mapPlaidCategoryToLocal = (plaidCategory: string[] | null): string => {
  if (!plaidCategory || plaidCategory.length === 0) {
    return '8'; // Other
  }

  const primaryCategory = plaidCategory[0].toLowerCase();

  const categoryMap: { [key: string]: string } = {
    'food and drink': '1', // Dining
    'restaurants': '1',    // Dining
    'travel': '2',         // Travel
    'transportation': '2', // Travel
    'shops': '6',          // Shopping
    'grocery': '3',        // Groceries
    'gas stations': '4',   // Gas
    'entertainment': '5',  // Entertainment
    'payment': '7',        // Bills & Utilities
    'transfer': '7',       // Bills & Utilities
    'deposit': '7',        // Bills & Utilities
  };

  return categoryMap[primaryCategory] || '8'; // Default to Other
};