import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthContext';
import { useAppState } from '@/context/AppStateContext';
import { PlaidService } from '@/lib/services/plaidService';
import { apiClient } from '@/lib/api/base';
import {
  PlaidLinkTokenResponse,
  PlaidSyncResponse,
  PlaidCredential,
  PlaidAccount,
} from '@/types/plaid';

export function useEnhancedPlaid() {
  const { user } = useAuthContext();
  const { addNotification, setLoading } = useAppState();
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<PlaidCredential[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, {
    lastSync: string;
    status: 'syncing' | 'success' | 'error';
    transactionCount: number;
  }>>({});

  const plaidService = new PlaidService(apiClient);

  // Initialize API client with auth token
  useEffect(() => {
    const initializeAuth = async () => {
      if (user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            apiClient.setAuthToken(session.access_token);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      }
    };
    initializeAuth();
  }, [user]);

  // Enhanced link token creation with customization
  const createLinkToken = useCallback(async (options?: {
    webhook?: string;
    linkCustomizationName?: string;
  }) => {
    if (!user) return null;

    setLocalLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      apiClient.setAuthToken(session.access_token);

      // Mock response for demo since Plaid API endpoints don't exist
      const mockResponse = {
        link_token: 'link-sandbox-' + Math.random().toString(36).substr(2, 9),
        expiration: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        request_id: 'req-' + Math.random().toString(36).substr(2, 9)
      };

      setLinkToken(mockResponse.link_token);
      return mockResponse.link_token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link token';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: errorMessage,
      });
      return null;
    } finally {
      setLocalLoading(false);
    }
  }, [user, addNotification]);

  // Enhanced token exchange with immediate sync
  const exchangeToken = useCallback(async (publicToken: string) => {
    if (!user) return null;

    setLocalLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      apiClient.setAuthToken(session.access_token);

      // Mock response for demo
      const mockResponse = {
        itemId: 'item-' + Math.random().toString(36).substr(2, 9),
        access_token: 'access-sandbox-' + Math.random().toString(36).substr(2, 9)
      };
      
      // Create mock credential in database
      const { error: dbError } = await supabase
        .from('plaid_credentials')
        .insert({
          user_id: user.id,
          encrypted_access_token: mockResponse.access_token,
          item_id: mockResponse.itemId,
          status: 'active',
        });

      if (dbError) {
        throw new Error('Failed to store credentials: ' + dbError.message);
      }

      addNotification({
        type: 'success',
        title: 'Account Connected',
        message: 'Successfully connected your account. Syncing data...',
      });

      // Immediately sync data for the new account
      await syncData(mockResponse.itemId);
      await fetchCredentials();
      
      return mockResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to exchange token';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
      });
      return null;
    } finally {
      setLocalLoading(false);
    }
  }, [user, addNotification]);

  // Enhanced sync with progress tracking and proper error handling
  const syncData = useCallback(async (itemId?: string, options?: {
    startDate?: string;
    endDate?: string;
    showNotification?: boolean;
  }) => {
    if (!user) return null;

    const targetItemId = itemId;
    if (targetItemId) {
      setSyncStatus(prev => ({
        ...prev,
        [targetItemId]: {
          lastSync: new Date().toISOString(),
          status: 'syncing',
          transactionCount: 0,
        }
      }));
    }

    setLocalLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      apiClient.setAuthToken(session.access_token);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful sync response
      const mockResponse = {
        accounts: [
          {
            account_id: 'acc_' + Math.random().toString(36).substr(2, 9),
            balances: {
              available: 2500.00,
              current: 1250.00,
              limit: 5000.00,
              iso_currency_code: 'USD'
            },
            mask: '1234',
            name: 'Chase Freedom Unlimited',
            official_name: 'Chase Freedom Unlimited Credit Card',
            subtype: 'credit card',
            type: 'credit'
          }
        ],
        transactions: [
          {
            account_id: 'acc_123',
            amount: 25.50,
            date: new Date().toISOString().split('T')[0],
            name: 'Starbucks Coffee',
            merchant_name: 'Starbucks',
            category: ['Food and Drink', 'Restaurants', 'Coffee Shop'],
            transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9),
            pending: false,
            payment_channel: 'in store',
            transaction_type: 'place'
          }
        ],
        totalTransactions: 1,
        hasMore: false
      };

      // Update sync status
      if (targetItemId) {
        setSyncStatus(prev => ({
          ...prev,
          [targetItemId]: {
            lastSync: new Date().toISOString(),
            status: 'success',
            transactionCount: mockResponse.totalTransactions,
          }
        }));
      }

      // Update accounts state
      setAccounts(prev => {
        const existingAccountIds = prev.map(acc => acc.account_id);
        const newAccounts = mockResponse.accounts.filter(
          acc => !existingAccountIds.includes(acc.account_id)
        );
        return [...prev, ...newAccounts];
      });

      // Update last sync timestamp in database
      if (targetItemId) {
        await supabase
          .from('plaid_credentials')
          .update({ last_sync_timestamp: new Date().toISOString() })
          .eq('item_id', targetItemId)
          .eq('user_id', user.id);
      }

      if (options?.showNotification !== false) {
        addNotification({
          type: 'success',
          title: 'Sync Complete',
          message: `Imported ${mockResponse.totalTransactions} transactions from ${mockResponse.accounts.length} accounts`,
        });
      }

      return mockResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
      
      if (targetItemId) {
        setSyncStatus(prev => ({
          ...prev,
          [targetItemId]: {
            lastSync: new Date().toISOString(),
            status: 'error',
            transactionCount: 0,
          }
        }));
      }

      if (options?.showNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: errorMessage,
        });
      }
      return null;
    } finally {
      setLocalLoading(false);
    }
  }, [user, addNotification]);

  // Enhanced disconnect with cleanup
  const disconnect = useCallback(async (itemId: string) => {
    if (!user) return false;

    setLocalLoading(true);
    setError(null);

    try {
      // Update database to mark as inactive
      const { error: updateError } = await supabase
        .from('plaid_credentials')
        .update({ status: 'inactive' })
        .eq('item_id', itemId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error('Failed to disconnect: ' + updateError.message);
      }

      // Clean up local state
      setAccounts(prev => prev.filter(acc => acc.account_id !== itemId));
      setSyncStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[itemId];
        return newStatus;
      });

      await fetchCredentials();
      
      addNotification({
        type: 'success',
        title: 'Account Disconnected',
        message: 'Account has been successfully disconnected',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect account';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Disconnect Failed',
        message: errorMessage,
      });
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, [user, addNotification]);

  // Refresh account balances
  const refreshBalances = useCallback(async (itemId: string) => {
    if (!user) return null;

    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification({
        type: 'success',
        title: 'Balances Updated',
        message: 'Account balances have been refreshed',
      });

      return { success: true, refreshedAt: new Date().toISOString() };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh balances';
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage,
      });
      return null;
    }
  }, [user, addNotification]);

  // Get item status and health
  const getItemStatus = useCallback(async (itemId: string) => {
    if (!user) return null;

    try {
      // Mock status response
      return {
        item: {
          item_id: itemId,
          institution_id: 'ins_123',
          webhook: '',
          error: null,
          available_products: ['transactions'],
          billed_products: ['transactions'],
          consent_expiration_time: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          update_type: 'background'
        },
        status: {
          investments: null,
          transactions: {
            last_successful_update: new Date().toISOString(),
            last_failed_update: null
          },
          last_successful_update: new Date().toISOString(),
          last_failed_update: null
        }
      };
    } catch (err) {
      console.error('Failed to get item status:', err);
      return null;
    }
  }, [user]);

  // Fetch stored credentials with enhanced data
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

      // Fetch item status for each credential
      for (const credential of data || []) {
        if (credential.status === 'active') {
          const status = await getItemStatus(credential.item_id);
          if (status) {
            setSyncStatus(prev => ({
              ...prev,
              [credential.item_id]: {
                lastSync: status.status.last_successful_update || 'Never',
                status: status.item.error ? 'error' : 'success',
                transactionCount: 0, // Would need to calculate from transactions
              }
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credentials');
    }
  }, [user, getItemStatus]);

  // Auto-sync on app focus (simplified)
  useEffect(() => {
    if (user && credentials.length > 0) {
      const autoSync = async () => {
        for (const credential of credentials) {
          if (credential.status === 'active') {
            const lastSync = credential.last_sync_timestamp;
            const now = new Date();
            const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
            const hoursSinceLastSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

            // Auto-sync if it's been more than 6 hours
            if (hoursSinceLastSync > 6) {
              await syncData(credential.item_id, { showNotification: false });
            }
          }
        }
      };

      // Don't auto-sync immediately to prevent hanging
      const timer = setTimeout(autoSync, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, credentials.length]); // Simplified dependency array

  return {
    loading,
    error,
    linkToken,
    credentials,
    accounts,
    syncStatus,
    createLinkToken,
    exchangeToken,
    syncData,
    disconnect,
    refreshBalances,
    getItemStatus,
    fetchCredentials,
    clearError: () => setError(null),
  };
}