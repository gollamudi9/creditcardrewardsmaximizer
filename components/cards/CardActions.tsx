import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Button from '@/components/ui/Button';
import { CreditCard } from '@/types';
import { DollarSign, TriangleAlert as AlertTriangle, Settings, Trees as Freeze, Trees as Unfreeze } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { CardService } from '@/lib/services/cardService';
import { apiClient } from '@/lib/api/base';

interface CardActionsProps {
  card: CreditCard;
  onRefresh?: () => void;
}

export default function CardActions({ card, onRefresh }: CardActionsProps) {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotifications();
  const cardService = new CardService(apiClient);

  const handlePayment = () => {
    Alert.alert(
      'Make Payment',
      `Make a payment for ${card.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Navigate to payment screen or show payment modal
            showSuccess('Payment Initiated', 'Redirecting to payment options...');
          }
        },
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'What would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Lost Card', 
          onPress: () => reportIssue('lost', 'Card has been lost')
        },
        { 
          text: 'Stolen Card', 
          onPress: () => reportIssue('stolen', 'Card has been stolen')
        },
        { 
          text: 'Fraudulent Charges', 
          onPress: () => reportIssue('fraud', 'Suspicious transactions detected')
        },
      ]
    );
  };

  const reportIssue = async (type: 'lost' | 'stolen' | 'fraud', description: string) => {
    try {
      const result = await cardService.reportIssue({
        cardId: card.id,
        issueType: type,
        description,
      });

      showSuccess(
        'Issue Reported',
        `Your ${type} report has been submitted. Report ID: ${result.reportId}`
      );

      if (onRefresh) onRefresh();
    } catch (error) {
      showError('Report Failed', 'Unable to submit your report. Please try again.');
    }
  };

  const handleFreezeCard = async () => {
    try {
      await cardService.freezeCard(card.id);
      showSuccess('Card Frozen', 'Your card has been temporarily frozen for security.');
      if (onRefresh) onRefresh();
    } catch (error) {
      showError('Freeze Failed', 'Unable to freeze your card. Please try again.');
    }
  };

  const handleUnfreezeCard = async () => {
    try {
      await cardService.unfreezeCard(card.id);
      showSuccess('Card Unfrozen', 'Your card is now active and ready to use.');
      if (onRefresh) onRefresh();
    } catch (error) {
      showError('Unfreeze Failed', 'Unable to unfreeze your card. Please try again.');
    }
  };

  const isCardFrozen = false; // You'd get this from card status

  return (
    <View style={styles.container}>
      <Button
        title="Make Payment"
        onPress={handlePayment}
        leftIcon={<DollarSign size={18} color="#FFFFFF" />}
        style={styles.primaryButton}
      />
      
      <View style={styles.secondaryActions}>
        <Button
          title="Report Issue"
          onPress={handleReportIssue}
          variant="outline"
          leftIcon={<AlertTriangle size={16} color={colors.error} />}
          style={styles.secondaryButton}
        />
        
        <Button
          title={isCardFrozen ? "Unfreeze" : "Freeze"}
          onPress={isCardFrozen ? handleUnfreezeCard : handleFreezeCard}
          variant="outline"
          leftIcon={isCardFrozen ? 
            <Unfreeze size={16} color={colors.primary} /> : 
            <Freeze size={16} color={colors.warning} />
          }
          style={styles.secondaryButton}
        />
      </View>

      <Button
        title="Card Settings"
        onPress={() => showSuccess('Settings', 'Card settings coming soon!')}
        variant="ghost"
        leftIcon={<Settings size={16} color={colors.subtext} />}
        style={styles.settingsButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  settingsButton: {
    alignSelf: 'center',
  },
});