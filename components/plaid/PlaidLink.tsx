import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { PlaidLink as PlaidLinkSDK, LinkSuccess, LinkExit, LinkEvent } from 'react-native-plaid-link-sdk';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { usePlaid } from '@/hooks/usePlaid';
import { Shield, CreditCard, CircleAlert as AlertCircle, CircleCheck as CheckCircle, RefreshCw } from 'lucide-react-native';

interface PlaidLinkProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

export default function PlaidLink({ onSuccess, onExit }: PlaidLinkProps) {
  const { colors } = useTheme();
  const { 
    loading, 
    error, 
    linkToken, 
    createLinkToken, 
    exchangeToken,
    clearError 
  } = usePlaid();
  const [step, setStep] = useState<'consent' | 'connecting' | 'success' | 'error'>('consent');
  const [isLinkReady, setIsLinkReady] = useState(false);

  useEffect(() => {
    if (linkToken) {
      setIsLinkReady(true);
    }
  }, [linkToken]);

  const handleGetStarted = async () => {
    setStep('connecting');
    clearError();
    
    if (!linkToken) {
      await createLinkToken();
    }
  };

  const handleLinkSuccess = async (success: LinkSuccess) => {
    try {
      setStep('connecting');
      const result = await exchangeToken(success.publicToken);
      
      if (result) {
        setStep('success');
        onSuccess?.();
      } else {
        setStep('error');
      }
    } catch (err) {
      console.error('Link success error:', err);
      setStep('error');
    }
  };

  const handleLinkExit = (exit: LinkExit) => {
    console.log('Plaid Link exit:', exit);
    
    if (exit.error) {
      Alert.alert(
        'Connection Error',
        exit.error.displayMessage || 'Failed to connect your account. Please try again.',
        [{ text: 'OK', onPress: () => setStep('consent') }]
      );
    } else {
      setStep('consent');
    }
    
    onExit?.();
  };

  const handleLinkEvent = (event: LinkEvent) => {
    console.log('Plaid Link event:', event);
    
    // Track important events for analytics
    switch (event.eventName) {
      case 'OPEN':
        console.log('Plaid Link opened');
        break;
      case 'SELECT_INSTITUTION':
        console.log('Institution selected:', event.metadata?.institutionName);
        break;
      case 'SUBMIT_CREDENTIALS':
        console.log('Credentials submitted');
        break;
      case 'HANDOFF':
        console.log('Handoff to institution');
        break;
    }
  };

  const renderConsentStep = () => (
    <Card style={styles.consentCard}>
      <View style={styles.consentHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Shield size={32} color={colors.primary} />
        </View>
        <Text variant="heading2" bold style={styles.consentTitle}>
          Connect Your Credit Cards
        </Text>
        <Text variant="body" color={colors.subtext} center style={styles.consentSubtitle}>
          Securely connect your credit card accounts to automatically import transactions and track rewards
        </Text>
      </View>

      <View style={styles.permissionsContainer}>
        <Text variant="subtitle" medium style={styles.permissionsTitle}>
          What we'll access:
        </Text>
        
        <View style={styles.permissionItem}>
          <CreditCard size={20} color={colors.primary} style={styles.permissionIcon} />
          <View style={styles.permissionText}>
            <Text variant="body" medium>Account Information</Text>
            <Text variant="caption" color={colors.subtext}>
              Account names, types, and balances
            </Text>
          </View>
        </View>

        <View style={styles.permissionItem}>
          <RefreshCw size={20} color={colors.primary} style={styles.permissionIcon} />
          <View style={styles.permissionText}>
            <Text variant="body" medium>Transaction History</Text>
            <Text variant="caption" color={colors.subtext}>
              Recent transactions for reward calculations
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.securityNote}>
        <Shield size={16} color={colors.success} style={styles.securityIcon} />
        <Text variant="caption" color={colors.subtext} style={styles.securityText}>
          Your data is encrypted and secure. We use bank-level security and never store your login credentials.
        </Text>
      </View>

      <Button
        title="Connect Accounts"
        onPress={handleGetStarted}
        loading={loading}
        disabled={loading}
        fullWidth
        style={styles.connectButton}
      />

      <Button
        title="Skip for Now"
        onPress={onExit}
        variant="ghost"
        fullWidth
        style={styles.skipButton}
      />
    </Card>
  );

  const renderConnectingStep = () => (
    <Card style={styles.statusCard}>
      <View style={styles.statusContent}>
        <RefreshCw size={48} color={colors.primary} style={styles.loadingIcon} />
        <Text variant="heading3" bold style={styles.statusTitle}>
          Connecting Your Accounts
        </Text>
        <Text variant="body" color={colors.subtext} center style={styles.statusText}>
          Please complete the connection process in the secure Plaid window
        </Text>
      </View>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card style={styles.statusCard}>
      <View style={styles.statusContent}>
        <CheckCircle size={48} color={colors.success} />
        <Text variant="heading3" bold style={styles.statusTitle}>
          Successfully Connected!
        </Text>
        <Text variant="body" color={colors.subtext} center style={styles.statusText}>
          Your credit card accounts have been connected. We're now importing your transactions.
        </Text>
        <Button
          title="Continue"
          onPress={onSuccess}
          variant="primary"
          style={styles.continueButton}
        />
      </View>
    </Card>
  );

  const renderErrorStep = () => (
    <Card style={styles.statusCard}>
      <View style={styles.statusContent}>
        <AlertCircle size={48} color={colors.error} />
        <Text variant="heading3" bold style={styles.statusTitle}>
          Connection Failed
        </Text>
        <Text variant="body" color={colors.subtext} center style={styles.statusText}>
          {error || 'We couldn\'t connect your accounts. Please try again.'}
        </Text>
        <Button
          title="Try Again"
          onPress={() => {
            clearError();
            setStep('consent');
          }}
          variant="primary"
          style={styles.retryButton}
        />
        <Button
          title="Skip for Now"
          onPress={onExit}
          variant="ghost"
          style={styles.skipButton}
        />
      </View>
    </Card>
  );

  // Platform-specific rendering
  if (Platform.OS === 'web') {
    // For web, show a message about mobile-only feature
    return (
      <Card style={styles.webNoticeCard}>
        <View style={styles.statusContent}>
          <CreditCard size={48} color={colors.subtext} />
          <Text variant="heading3" bold style={styles.statusTitle}>
            Mobile Feature
          </Text>
          <Text variant="body" color={colors.subtext} center style={styles.statusText}>
            Account connection is available on mobile devices. Please use the mobile app to connect your credit card accounts.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {step === 'consent' && renderConsentStep()}
      {step === 'connecting' && renderConnectingStep()}
      {step === 'success' && renderSuccessStep()}
      {step === 'error' && renderErrorStep()}

      {/* Plaid Link Component */}
      {isLinkReady && linkToken && step === 'connecting' && (
        <PlaidLinkSDK
          tokenConfig={{
            token: linkToken,
          }}
          onSuccess={handleLinkSuccess}
          onExit={handleLinkExit}
          onEvent={handleLinkEvent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  consentCard: {
    padding: 24,
  },
  consentHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  consentTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  consentSubtitle: {
    paddingHorizontal: 16,
  },
  permissionsContainer: {
    marginBottom: 24,
  },
  permissionsTitle: {
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  permissionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  permissionText: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  securityText: {
    flex: 1,
    lineHeight: 18,
  },
  connectButton: {
    marginBottom: 12,
  },
  skipButton: {
    marginTop: 8,
  },
  statusCard: {
    padding: 32,
    alignItems: 'center',
  },
  statusContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 24,
  },
  statusTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  continueButton: {
    marginTop: 16,
    minWidth: 120,
  },
  retryButton: {
    marginTop: 16,
    marginBottom: 12,
    minWidth: 120,
  },
  webNoticeCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
});