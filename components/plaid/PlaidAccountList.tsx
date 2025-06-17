import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Alert } from 'react-native';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { usePlaid } from '@/hooks/usePlaid';
import { PlaidCredential } from '@/types/plaid';
import { CreditCard, RefreshCw, Unlink, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

interface PlaidAccountListProps {
  onAddAccount?: () => void;
}

export default function PlaidAccountList({ onAddAccount }: PlaidAccountListProps) {
  const { colors } = useTheme();
  const { 
    loading, 
    error, 
    credentials, 
    syncData, 
    disconnect, 
    fetchCredentials 
  } = usePlaid();
  const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSync = async (credential: PlaidCredential) => {
    setSyncingItems(prev => new Set(prev).add(credential.item_id));
    
    try {
      const result = await syncData(credential.item_id);
      if (result) {
        Alert.alert(
          'Sync Complete',
          `Successfully imported ${result.transactions.length} transactions from ${result.accounts.length} accounts.`,
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

  const renderCredentialItem = ({ item }: { item: PlaidCredential }) => {
    const isActive = item.status === 'active';
    const isSyncing = syncingItems.has(item.item_id);
    const lastSyncText = item.last_sync_timestamp 
      ? formatDistanceToNow(new Date(item.last_sync_timestamp), { addSuffix: true })
      : 'Never synced';

    return (
      <Card style={styles.credentialCard}>
        <View style={styles.credentialHeader}>
          <View style={styles.credentialInfo}>
            <View style={styles.credentialTitleRow}>
              <CreditCard size={20} color={colors.primary} style={styles.credentialIcon} />
              <Text variant="subtitle" medium>Connected Account</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? colors.success + '20' : colors.error + '20' }
              ]}>
                <Text 
                  variant="caption" 
                  color={isActive ? colors.success : colors.error}
                  style={styles.statusText}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <View style={styles.credentialMeta}>
              <Calendar size={14} color={colors.subtext} style={styles.metaIcon} />
              <Text variant="caption" color={colors.subtext}>
                Last sync: {lastSyncText}
              </Text>
            </View>
          </View>
        </View>

        {item.status === 'error' && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color={colors.error} style={styles.errorIcon} />
            <Text variant="caption" color={colors.error} style={styles.errorText}>
              Connection error. Please reconnect your account.
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
        Connect your credit card accounts to automatically import transactions and track rewards.
      </Text>
      <Button
        title="Connect Your First Account"
        onPress={onAddAccount}
        variant="primary"
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
        <RefreshCw size={32} color={colors.primary} style={styles.loadingIcon} />
        <Text variant="body" color={colors.subtext}>Loading connected accounts...</Text>
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
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
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
    marginHorizontal: 4,
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
  },
  emptyButton: {
    minWidth: 200,
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginBottom: 12,
  },
});