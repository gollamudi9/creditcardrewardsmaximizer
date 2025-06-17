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

      const response = await plaidService.createLinkToken(user.id, {
        webhook: options?.webhook || `${process.env.EXPO_PUBLIC_API_URL}/api/plaid/webhook`,
        linkCustomizationName: options?.linkCustomizationName,
      });

      setLinkToken(response.link_token);
      return response.link_token;
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

      const response = await plaidService.exchangePublicToken(publicToken);
      
      addNotification({
        type: 'success',
        title: 'Account Connected',
        message: 'Successfully connected your account. Syncing data...',
      });

      // Immediately sync data for the new account
      await syncData(response.itemId);
      await fetchCredentials();
      
      return response;
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

  // Enhanced sync with progress tracking
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

      const response = await plaidService.syncAccounts({
        itemId: targetItemId,
        startDate: options?.startDate,
        endDate: options?.endDate,
        includePersonalFinanceCategory: true,
      });

      // Update sync status
      if (targetItemId) {
        setSyncStatus(prev => ({
          ...prev,
          [targetItemId]: {
            lastSync: new Date().toISOString(),
            status: 'success',
            transactionCount: response.totalTransactions,
          }
        }));
      }

      // Update accounts state
      setAccounts(prev => {
        const existingAccountIds = prev.map(acc => acc.account_id);
        const newAccounts = response.accounts.filter(
          acc => !existingAccountIds.includes(acc.account_id)
        );
        return [...prev, ...newAccounts];
      });

      if (options?.showNotification !== false) {
        addNotification({
          type: 'success',
          title: 'Sync Complete',
          message: `Imported ${response.totalTransactions} transactions from ${response.accounts.length} accounts`,
        });
      }

      return response;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      apiClient.setAuthToken(session.access_token);

      await plaidService.disconnectAccount(itemId);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      apiClient.setAuthToken(session.access_token);

      const response = await plaidService.refreshAccountData(itemId);
      
      addNotification({
        type: 'success',
        title: 'Balances Updated',
        message: 'Account balances have been refreshed',
      });

      return response;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      apiClient.setAuthToken(session.access_token);

      return await plaidService.getItemStatus(itemId);
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
    }
  }, [user, getItemStatus]);

  // Auto-sync on app focus
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

      autoSync();
    }
  }, [user, credentials, syncData]);

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