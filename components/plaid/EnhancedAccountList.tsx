import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Alert, RefreshControl } from 'react-native';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/context/ThemeContext';
import { useEnhancedPlaid } from '@/hooks/useEnhancedPlaid';
import { PlaidCredential } from '@/types/plaid';
import { CreditCard, RefreshCw, Unlink, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Activity, Zap } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedAccountListProps {
  onAddAccount?: () => void;
}

export default function EnhancedAccountList({ onAddAccount }: EnhancedAccountListProps) {
  const { colors } = useTheme();
  const { 
    loading, 
    error, 
    credentials, 
    accounts,
    syncStatus,
    syncData, 
    disconnect, 
    refreshBalances,
    fetchCredentials 
  } = useEnhancedPlaid();
  const [refreshing, setRefreshing] = useState(false);
  const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCredentials();
    setRefreshing(false);
  };

  const handleSync = async (credential: PlaidCredential) => {
    setSyncingItems(prev => new Set(prev).add(credential.item_id));
    
    try {
      const result = await syncData(credential.item_id, { showNotification: true });
      if (result) {
        Alert.alert(
          'Sync Complete',
          `Successfully imported ${result.totalTransactions} transactions from ${result.accounts.length} accounts.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert(
        'Sync Failed',
        'Failed to sync account data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(credential.item_id);
        return newSet;
      });
    }
  };

  const handleRefreshBalances = async (credential: PlaidCredential) => {
    try {
      await refreshBalances(credential.item_id);
    } catch (err) {
      Alert.alert(
        'Refresh Failed',
        'Failed to refresh account balances. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = (credential: PlaidCredential) => {
    Alert.alert(
      'Disconnect Account',
      'Are you sure you want to disconnect this account? You will no longer receive automatic transaction updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const success = await disconnect(credential.item_id);
            if (success) {
              Alert.alert(
                'Account Disconnected',
                'Your account has been successfully disconnected.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (credential: PlaidCredential) => {
    const status = syncStatus[credential.item_id];
    
    if (status?.status === 'syncing' || syncingItems.has(credential.item_id)) {
      return <LoadingSpinner size="small" />;
    }
    
    if (credential.status === 'error' || status?.status === 'error') {
      return <AlertCircle size={20} color={colors.error} />;
    }
    
    if (credential.status === 'active' && status?.status === 'success') {
      return <CheckCircle size={20} color={colors.success} />;
    }
    
    return <Activity size={20} color={colors.subtext} />;
  };

  const getStatusText = (credential: PlaidCredential) => {
    const status = syncStatus[credential.item_id];
    
    if (status?.status === 'syncing' || syncingItems.has(credential.item_id)) {
      return 'Syncing...';
    }
    
    if (credential.status === 'error') {
      return 'Connection Error';
    }
    
    if (credential.status === 'inactive') {
      return 'Disconnected';
    }
    
    return 'Connected';
  };

  const renderCredentialItem = ({ item }: { item: PlaidCredential }) => {
    const isActive = item.status === 'active';
    const isSyncing = syncingItems.has(item.item_id);
    const status = syncStatus[item.item_id];
    const lastSyncText = item.last_sync_timestamp 
      ? formatDistanceToNow(new Date(item.last_sync_timestamp), { addSuffix: true })
      : 'Never synced';

    // Get associated accounts for this item
    const itemAccounts = accounts.filter(acc => 
      // In a real implementation, you'd have a way to associate accounts with items
      // For now, we'll show a placeholder
      true
    );

    return (
      <Card style={styles.credentialCard}>
        <View style={styles.credentialHeader}>
          <View style={styles.credentialInfo}>
            <View style={styles.credentialTitleRow}>
              <CreditCard size={20} color={colors.primary} style={styles.credentialIcon} />
              <Text variant="subtitle" medium>Connected Institution</Text>
              <View style={styles.statusContainer}>
                {getStatusIcon(item)}
                <Text 
                  variant="caption" 
                  color={isActive ? colors.success : colors.error}
                  style={styles.statusText}
                >
                  {getStatusText(item)}
                </Text>
              </View>
            </View>
            
            <View style={styles.credentialMeta}>
              <Calendar size={14} color={colors.subtext} style={styles.metaIcon} />
              <Text variant="caption" color={colors.subtext}>
                Last sync: {lastSyncText}
              </Text>
              {status?.transactionCount > 0 && (
                <>
                  <Text variant="caption" color={colors.subtext}> • </Text>
                  <Text variant="caption" color={colors.subtext}>
                    {status.transactionCount} transactions
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Account Details */}
        {itemAccounts.length > 0 && (
          <View style={styles.accountsContainer}>
            <Text variant="caption" color={colors.subtext} style={styles.accountsTitle}>
              Connected Accounts:
            </Text>
            {itemAccounts.slice(0, 3).map((account, index) => (
              <View key={index} style={styles.accountItem}>
                <Text variant="caption">{account.name}</Text>
                <Text variant="caption" color={colors.subtext}>
                  ••••{account.mask}
                </Text>
              </View>
            ))}
            {itemAccounts.length > 3 && (
              <Text variant="caption" color={colors.subtext}>
                +{itemAccounts.length - 3} more accounts
              </Text>
            )}
          </View>
        )}

        {item.status === 'error' && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color={colors.error} style={styles.errorIcon} />
            <Text variant="caption" color={colors.error} style={styles.errorText}>
              Connection error. Please reconnect your account or check with your bank.
            </Text>
          </View>
        )}

        <View style={styles.credentialActions}>
          <Button
            title={isSyncing ? "Syncing..." : "Sync Now"}
            onPress={() => handleSync(item)}
            variant="outline"
            size="small"
            disabled={!isActive || isSyncing}
            loading={isSyncing}
            leftIcon={!isSyncing ? <RefreshCw size={16} color={colors.primary} /> : undefined}
            style={styles.actionButton}
          />
          
          <Button
            title="Refresh"
            onPress={() => handleRefreshBalances(item)}
            variant="outline"
            size="small"
            disabled={!isActive}
            leftIcon={<Zap size={16} color={colors.primary} />}
            style={styles.actionButton}
          />
          
          <Button
            title="Disconnect"
            onPress={() => handleDisconnect(item)}
            variant="outline"
            size="small"
            leftIcon={<Unlink size={16} color={colors.error} />}
            textStyle={{ color: colors.error }}
            style={[styles.actionButton, { borderColor: colors.error }]}
          />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyStateCard}>
      <CreditCard size={48} color={colors.subtext} style={styles.emptyIcon} />
      <Text variant="heading3" bold style={styles.emptyTitle}>
        No Connected Accounts
      </Text>
      <Text variant="body" color={colors.subtext} center style={styles.emptyText}>
        Connect your credit card accounts to automatically import transactions, track rewards, and get personalized insights.
      </Text>
      <Button
        title="Connect Your First Account"
        onPress={onAddAccount}
        variant="primary"
        leftIcon={<CreditCard size={18} color="#FFFFFF" />}
        style={styles.emptyButton}
      />
    </Card>
  );

  const renderErrorState = () => (
    <Card style={styles.errorStateCard}>
      <AlertCircle size={48} color={colors.error} style={styles.emptyIcon} />
      <Text variant="heading3" bold style={styles.emptyTitle}>
        Connection Error
      </Text>
      <Text variant="body" color={colors.subtext} center style={styles.emptyText}>
        {error}
      </Text>
      <Button
        title="Try Again"
        onPress={fetchCredentials}
        variant="primary"
        style={styles.emptyButton}
      />
    </Card>
  );

  if (loading && credentials.length === 0) {
    return (
      <Card style={styles.loadingCard}>
        <LoadingSpinner size="large" />
        <Text variant="body" color={colors.subtext} style={styles.loadingText}>
          Loading connected accounts...
        </Text>
      </Card>
    );
  }

  if (error && credentials.length === 0) {
    return renderErrorState();
  }

  if (credentials.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading3" bold>Connected Accounts</Text>
        <Button
          title="Add Account"
          onPress={onAddAccount}
          variant="outline"
          size="small"
          leftIcon={<CreditCard size={16} color={colors.primary} />}
        />
      </View>

      <FlatList
        data={credentials}
        renderItem={renderCredentialItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  credentialCard: {
    marginBottom: 12,
    padding: 16,
  },
  credentialHeader: {
    marginBottom: 12,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialIcon: {
    marginRight: 8,
  },
  statusContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  credentialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  accountsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  accountsTitle: {
    marginBottom: 8,
    fontWeight: '500',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    flex: 1,
  },
  credentialActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorStateCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 200,
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
});