import React, { useState } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import Button from '@/components/ui/Button';
import { Offer } from '@/types';
import { CircleCheck as CheckCircle, Bookmark, Share2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { OffersService } from '@/lib/services/offersService';
import { apiClient } from '@/lib/api/base';

interface OfferActionsProps {
  offer: Offer;
  onRefresh?: () => void;
}

export default function OfferActions({ offer, onRefresh }: OfferActionsProps) {
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotifications();
  const [isActivating, setIsActivating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const offersService = new OffersService(apiClient);

  const handleActivate = async () => {
    if (offer.isActivated) return;

    Alert.alert(
      'Activate Offer',
      `Activate "${offer.title}"? This offer will be applied to your next qualifying purchase.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            setIsActivating(true);
            try {
              const result = await offersService.activateOffer(offer.id);
              showSuccess(
                'Offer Activated',
                `"${offer.title}" is now active on your card!`
              );
              if (onRefresh) onRefresh();
            } catch (error) {
              showError('Activation Failed', 'Unable to activate offer. Please try again.');
            } finally {
              setIsActivating(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await offersService.saveOffer(offer.id);
      showSuccess('Offer Saved', 'Offer has been saved to your favorites!');
      if (onRefresh) onRefresh();
    } catch (error) {
      showError('Save Failed', 'Unable to save offer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this offer: ${offer.title} - ${offer.description}`,
        title: offer.title,
      });
    } catch (error) {
      console.error('Error sharing offer:', error);
    }
  };

  const isExpired = new Date(offer.endDate) <= new Date();

  return (
    <View style={styles.container}>
      <Button
        title={offer.isActivated ? 'Activated' : 'Activate Offer'}
        onPress={handleActivate}
        disabled={offer.isActivated || isExpired || isActivating}
        loading={isActivating}
        leftIcon={
          offer.isActivated ? (
            <CheckCircle size={18} color="#FFFFFF" />
          ) : undefined
        }
        style={[
          styles.primaryButton,
          offer.isActivated && { backgroundColor: colors.success },
        ]}
      />

      <View style={styles.secondaryActions}>
        <Button
          title="Save"
          onPress={handleSave}
          variant="outline"
          leftIcon={<Bookmark size={16} color={colors.primary} />}
          disabled={isSaving}
          loading={isSaving}
          style={styles.secondaryButton}
        />

        <Button
          title="Share"
          onPress={handleShare}
          variant="outline"
          leftIcon={<Share2 size={16} color={colors.primary} />}
          style={styles.secondaryButton}
        />
      </View>
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
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});