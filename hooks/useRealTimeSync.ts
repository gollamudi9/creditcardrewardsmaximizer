import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePlaid } from './usePlaid';
import { useAuthContext } from '@/context/AuthContext';
import { useAppState } from '@/context/AppStateContext';

export function useRealTimeSync() {
  const { user } = useAuthContext();
  const { syncData, credentials } = usePlaid();
  const { setLastSync, addNotification } = useAppState();
  const appState = useRef(AppState.currentState);
  const lastSyncTime = useRef<number>(0);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        user &&
        credentials.length > 0
      ) {
        // Sync if app becomes active and it's been more than 5 minutes
        const now = Date.now();
        if (now - lastSyncTime.current > 5 * 60 * 1000) {
          syncAllAccounts();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, credentials]);

  const syncAllAccounts = async () => {
    if (!user || credentials.length === 0) return;

    try {
      let totalTransactions = 0;
      
      for (const credential of credentials) {
        if (credential.status === 'active') {
          const result = await syncData(credential.item_id);
          if (result) {
            totalTransactions += result.transactions.length;
          }
        }
      }
      
      lastSyncTime.current = Date.now();
      setLastSync(lastSyncTime.current);
      
      if (totalTransactions > 0) {
        addNotification({
          type: 'success',
          title: 'Sync Complete',
          message: `Imported ${totalTransactions} new transactions`,
        });
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Unable to sync account data. Please try again.',
      });
    }
  };

  // Initial sync when user logs in
  useEffect(() => {
    if (user && credentials.length > 0) {
      syncAllAccounts();
    }
  }, [user, credentials]);

  return { syncAllAccounts };
}