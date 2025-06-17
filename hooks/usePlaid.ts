import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthContext';
import {
  PLAID_ENDPOINTS,
  getSecurityHeaders,
  exponentialBackoff,
  handlePlaidError,
  validateEnvironmentConfig,
  mapPlaidCategoryToLocal,
} from '@/lib/plaid';
import {
  PlaidLinkTokenResponse,
  PlaidExchangeTokenResponse,
  PlaidSyncResponse,
  PlaidCredential,
} from '@/types/plaid';

export function usePlaid() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<PlaidCredential[]>([]);

  // Validate environment configuration
  const validateConfig = useCallback(() => {
    try {
      validateEnvironmentConfig();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration error');
      return false;
    }
  }, []);

  // Create link token for Plaid Link
  const createLinkToken = useCallback(async () => {
    if (!user || !validateConfig()) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await exponentialBackoff(async () => {
        const res = await fetch(PLAID_ENDPOINTS.createLinkToken, {
          method: 'POST',
          headers: getSecurityHeaders(session.access_token),
          body: JSON.stringify({
            user_id: user.id,
            client_name: 'Credit Card Rewards Tracker',
            products: ['transactions'],
            country_codes: ['US'],
            language: 'en',
            account_filters: {
              credit: {
                account_subtypes: ['credit card'],
              },
            },
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to create link token');
        }

        return res.json();
      });

      const data: PlaidLinkTokenResponse = response;
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (err) {
      const plaidError = handlePlaidError(err);
      setError(plaidError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, validateConfig]);

  // Exchange public token for access token
  const exchangeToken = useCallback(async (publicToken: string) => {
    if (!user || !validateConfig()) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await exponentialBackoff(async () => {
        const res = await fetch(PLAID_ENDPOINTS.exchangeToken, {
          method: 'POST',
          headers: getSecurityHeaders(session.access_token),
          body: JSON.stringify({
            public_token: publicToken,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to exchange token');
        }

        return res.json();
      });

      const data: PlaidExchangeTokenResponse = response;
      
      // Store credentials in database
      await supabase.from('plaid_credentials').insert({
        user_id: user.id,
        encrypted_access_token: data.access_token, // This should be encrypted on the backend
        item_id: data.item_id,
        status: 'active',
      });

      await fetchCredentials();
      return data;
    } catch (err) {
      const plaidError = handlePlaidError(err);
      setError(plaidError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, validateConfig]);

  // Sync accounts and transactions
  const syncData = useCallback(async (itemId?: string) => {
    if (!user || !validateConfig()) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await exponentialBackoff(async () => {
        const res = await fetch(PLAID_ENDPOINTS.sync, {
          method: 'POST',
          headers: getSecurityHeaders(session.access_token),
          body: JSON.stringify({
            item_id: itemId,
            start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 90 days
            end_date: new Date().toISOString().split('T')[0],
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to sync data');
        }

        return res.json();
      });

      const data: PlaidSyncResponse = response;

      // Process and store the synced data
      await processPlaidData(data);

      // Update last sync timestamp
      if (itemId) {
        await supabase
          .from('plaid_credentials')
          .update({ last_sync_timestamp: new Date().toISOString() })
          .eq('item_id', itemId)
          .eq('user_id', user.id);
      }

      return data;
    } catch (err) {
      const plaidError = handlePlaidError(err);
      setError(plaidError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, validateConfig]);

  // Process Plaid data and store in our database
  const processPlaidData = useCallback(async (data: PlaidSyncResponse) => {
    if (!user) return;

    try {
      // Process accounts (credit cards)
      for (const account of data.accounts) {
        if (account.type === 'credit' && account.subtype === 'credit card') {
          // Check if card already exists
          const { data: existingCard } = await supabase
            .from('credit_cards')
            .select('id')
            .eq('user_id', user.id)
            .eq('last_four_digits', account.mask || '')
            .single();

          if (!existingCard) {
            // Create new credit card record
            await supabase.from('credit_cards').insert({
              user_id: user.id,
              name: account.official_name || account.name,
              issuer: extractIssuerFromName(account.name),
              network: extractNetworkFromName(account.name),
              last_four_digits: account.mask || '0000',
              expiry_month: 12, // Default values - would need additional API calls to get real data
              expiry_year: new Date().getFullYear() + 3,
              color: getRandomCardColor(),
              cardholder_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Cardholder',
              credit_limit: account.balances.limit || 0,
              current_balance: account.balances.current || 0,
              is_default: false,
            });
          } else {
            // Update existing card balances
            await supabase
              .from('credit_cards')
              .update({
                credit_limit: account.balances.limit || 0,
                current_balance: account.balances.current || 0,
              })
              .eq('id', existingCard.id);
          }
        }
      }

      // Process transactions
      for (const transaction of data.transactions) {
        // Find the corresponding credit card
        const { data: creditCard } = await supabase
          .from('credit_cards')
          .select('id')
          .eq('user_id', user.id)
          .eq('last_four_digits', transaction.account_id.slice(-4))
          .single();

        if (creditCard) {
          // Check if transaction already exists
          const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('card_id', creditCard.id)
            .eq('merchant_name', transaction.merchant_name || transaction.name)
            .eq('amount', Math.abs(transaction.amount))
            .eq('transaction_date', transaction.date)
            .single();

          if (!existingTransaction) {
            const categoryId = mapPlaidCategoryToLocal(transaction.category);
            
            // Calculate rewards (simplified - would need card-specific logic)
            const rewardAmount = Math.abs(transaction.amount) * 0.01; // 1% default

            await supabase.from('transactions').insert({
              card_id: creditCard.id,
              category_id: categoryId,
              merchant_name: transaction.merchant_name || transaction.name,
              amount: Math.abs(transaction.amount),
              transaction_date: transaction.date,
              reward_earned_amount: rewardAmount,
              reward_earned_type: 'cashback',
              is_recurring: false,
              notes: `Imported from Plaid - ${transaction.transaction_id}`,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error processing Plaid data:', err);
      throw err;
    }
  }, [user]);

  // Fetch stored credentials
  const fetchCredentials = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('plaid_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (err) {
      console.error('Error fetching credentials:', err);
    }
  }, [user]);

  // Disconnect Plaid account
  const disconnect = useCallback(async (itemId: string) => {
    if (!user || !validateConfig()) return false;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      await exponentialBackoff(async () => {
        const res = await fetch(PLAID_ENDPOINTS.disconnect, {
          method: 'POST',
          headers: getSecurityHeaders(session.access_token),
          body: JSON.stringify({ item_id: itemId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to disconnect account');
        }
      });

      // Update status in database
      await supabase
        .from('plaid_credentials')
        .update({ status: 'inactive' })
        .eq('item_id', itemId)
        .eq('user_id', user.id);

      await fetchCredentials();
      return true;
    } catch (err) {
      const plaidError = handlePlaidError(err);
      setError(plaidError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, validateConfig, fetchCredentials]);

  return {
    loading,
    error,
    linkToken,
    credentials,
    createLinkToken,
    exchangeToken,
    syncData,
    disconnect,
    fetchCredentials,
    clearError: () => setError(null),
  };
}

// Helper functions
const extractIssuerFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('chase')) return 'Chase';
  if (lowerName.includes('amex') || lowerName.includes('american express')) return 'American Express';
  if (lowerName.includes('citi')) return 'Citi';
  if (lowerName.includes('discover')) return 'Discover';
  if (lowerName.includes('capital one')) return 'Capital One';
  if (lowerName.includes('wells fargo')) return 'Wells Fargo';
  if (lowerName.includes('bank of america')) return 'Bank of America';
  return 'Unknown';
};

const extractNetworkFromName = (name: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'other' => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('visa')) return 'visa';
  if (lowerName.includes('mastercard') || lowerName.includes('master card')) return 'mastercard';
  if (lowerName.includes('amex') || lowerName.includes('american express')) return 'amex';
  if (lowerName.includes('discover')) return 'discover';
  return 'other';
};

const getRandomCardColor = (): string => {
  const colors = ['#1E3B70', '#108A00', '#003B70', '#C01F2F', '#7048E8', '#F37021'];
  return colors[Math.floor(Math.random() * colors.length)];
};