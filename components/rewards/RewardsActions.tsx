import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { Gift, History, ArrowRightLeft, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { RewardsService } from '@/lib/services/rewardsService';
import { apiClient } from '@/lib/api/base';

interface RewardsActionsProps {
  totalPoints: number;
  totalCashback: number;
  totalMiles: number;
  onRefresh?: () => void;
}

export default function RewardsActions({
  totalPoints,
  totalCashback,
  totalMiles,
  onRefresh,
}: RewardsActionsProps) {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotifications();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const rewardsService = new RewardsService(apiClient);

  const handleRedeem = (type: 'points' | 'cashback' | 'miles') => {
    const amount = type === 'points' ? totalPoints : type === 'cashback' ? totalCashback : totalMiles;
    const minAmount = type === 'points' ? 2500 : type === 'cashback' ? 25 : 5000;

    if (amount < minAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least ${minAmount} ${type} to redeem.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Redeem Rewards',
      `How would you like to redeem your ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Statement Credit', onPress: () => processRedemption(type, amount, 'statement_credit') },
        { text: 'Bank Transfer', onPress: () => processRedemption(type, amount, 'bank_transfer') },
        { text: 'Gift Card', onPress: () => processRedemption(type, amount, 'gift_card') },
      ]
    );
  };

  const processRedemption = async (
    type: 'points' | 'cashback' | 'miles',
    amount: number,
    method: 'statement_credit' | 'bank_transfer' | 'gift_card'
  ) => {
    setIsRedeeming(true);
    try {
      const result = await rewardsService.redeemRewards({
        type,
        amount,
        redemptionMethod: method,
      });

      showSuccess(
        'Redemption Successful',
        `Your ${type} redemption is being processed. ID: ${result.redemptionId}`
      );

      if (onRefresh) onRefresh();
    } catch (error) {
      showError('Redemption Failed', 'Unable to process your redemption. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleViewHistory = () => {
    showSuccess('History', 'Rewards history feature coming soon!');
  };

  const handleTransferPoints = () => {
    showSuccess('Transfer', 'Points transfer feature coming soon!');
  };

  const handleBrowseCatalog = () => {
    showSuccess('Catalog', 'Rewards catalog feature coming soon!');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.balanceCard}>
        <Text variant="subtitle" style={styles.balanceTitle}>Available Rewards</Text>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceItem}>
            <Text variant="heading2" color={colors.primary}>{totalPoints.toLocaleString()}</Text>
            <Text variant="caption" color={colors.subtext}>Points</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text variant="heading2" color={colors.success}>${totalCashback.toFixed(2)}</Text>
            <Text variant="caption" color={colors.subtext}>Cashback</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text variant="heading2" color={colors.accent}>{totalMiles.toLocaleString()}</Text>
            <Text variant="caption" color={colors.subtext}>Miles</Text>
          </View>
        </View>
      </Card>

      <View style={styles.actionsGrid}>
        <Button
          title="Redeem Points"
          onPress={() => handleRedeem('points')}
          leftIcon={<Gift size={18} color="#FFFFFF" />}
          disabled={totalPoints < 2500 || isRedeeming}
          loading={isRedeeming}
          style={styles.actionButton}
        />

        <Button
          title="Redeem Cashback"
          onPress={() => handleRedeem('cashback')}
          leftIcon={<Gift size={18} color="#FFFFFF" />}
          disabled={totalCashback < 25 || isRedeeming}
          loading={isRedeeming}
          style={styles.actionButton}
        />

        <Button
          title="View History"
          onPress={handleViewHistory}
          variant="outline"
          leftIcon={<History size={18} color={colors.primary} />}
          style={styles.actionButton}
        />

        <Button
          title="Transfer Points"
          onPress={handleTransferPoints}
          variant="outline"
          leftIcon={<ArrowRightLeft size={18} color={colors.primary} />}
          style={styles.actionButton}
        />

        <Button
          title="Browse Catalog"
          onPress={handleBrowseCatalog}
          variant="outline"
          leftIcon={<ShoppingBag size={18} color={colors.primary} />}
          style={[styles.actionButton, styles.fullWidth]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  balanceCard: {
    marginBottom: 20,
    padding: 20,
  },
  balanceTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
  },
  fullWidth: {
    width: '100%',
  },
});