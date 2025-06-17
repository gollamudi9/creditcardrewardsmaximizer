import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { PlaidLink as PlaidLinkSDK, LinkSuccess, LinkExit, LinkEvent } from 'react-native-plaid-link-sdk';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/context/ThemeContext';
import { useEnhancedPlaid } from '@/hooks/useEnhancedPlaid';
import { Shield, CreditCard, CircleAlert as AlertCircle, CircleCheck as CheckCircle, RefreshCw, Zap, TrendingUp, Lock } from 'lucide-react-native';

interface EnhancedPlaidLinkProps {
  onSuccess?: () => void;
  onExit?: () => void;
  customization?: {
    institutionSearchEnabled?: boolean;
    paymentInitiationEnabled?: boolean;
    linkCustomizationName?: string;
  };
}

export default function EnhancedPlaidLink({ 
  onSuccess, 
  onExit,
  customization 
}: EnhancedPlaidLinkProps) {
  const { colors } = useTheme();
  const { 
    loading, 
    error, 
    linkToken, 
    createLinkToken, 
    exchangeToken,
    clearError 
  } = useEnhancedPlaid();
  const [step, setStep] = useState<'consent' | 'connecting' | 'success' | 'error'>('consent');
  const [isLinkReady, setIsLinkReady] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);

  useEffect(() => {
    if (linkToken) {
      setIsLinkReady(true);
    }
  }, [linkToken]);

  const handleGetStarted = async () => {
    setStep('connecting');
    setConnectionProgress(25);
    clearError();
    
    if (!linkToken) {
      await createLinkToken({
        linkCustomizationName: customization?.linkCustomizationName,
      });
    }
    setConnectionProgress(50);
  };

  const handleLinkSuccess = async (success: LinkSuccess) => {
    try {
      setConnectionProgress(75);
      const result = await exchangeToken(success.publicToken);
      
      if (result) {
        setConnectionProgress(100);
        setStep('success');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
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
    
    setConnectionProgress(0);
    onExit?.();
  };

  const handleLinkEvent = (event: LinkEvent) => {
    console.log('Plaid Link event:', event);
    
    // Update progress based on events
    switch (event.eventName) {
      case 'OPEN':
        setConnectionProgress(60);
        break;
      case 'SELECT_INSTITUTION':
        setConnectionProgress(70);
        break;
      case 'SUBMIT_CREDENTIALS':
        setConnectionProgress(80);
        break;
      case 'HANDOFF':
        setConnectionProgress(85);
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
          Securely connect your credit card accounts to automatically import transactions and maximize your rewards
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <Text variant="subtitle" medium style={styles.featuresTitle}>
          What you'll get:
        </Text>
        
        <View style={styles.featureItem}>
          <Zap size={20} color={colors.primary} style={styles.featureIcon} />
          <View style={styles.featureText}>
            <Text variant="body" medium>Automatic Transaction Import</Text>
            <Text variant="caption" color={colors.subtext}>
              No more manual entry. Transactions sync automatically in real-time.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <TrendingUp size={20} color={colors.success} style={styles.featureIcon} />
          <View style={styles.featureText}>
            <Text variant="body" medium>Smart Rewards Tracking</Text>
            <Text variant="caption" color={colors.subtext}>
              AI-powered categorization and rewards optimization suggestions.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <CreditCard size={20} color={colors.accent} style={styles.featureIcon} />
          <View style={styles.featureText}>
            <Text variant="body" medium>Real-time Balance Updates</Text>
            <Text variant="caption" color={colors.subtext}>
              Always know your current balance and available credit.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.securityNote}>
        <Lock size={16} color={colors.success} style={styles.securityIcon} />
        <Text variant="caption" color={colors.subtext} style={styles.securityText}>
          Bank-level 256-bit encryption. We never store your login credentials. 
          Powered by Plaid, trusted by thousands of financial apps.
        </Text>
      </View>

      <Button
        title="Connect Your Accounts"
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
        <LoadingSpinner size="large" />
        <Text variant="heading3" bold style={styles.statusTitle}>
          Connecting Your Accounts
        </Text>
        <Text variant="body" color={colors.subtext} center style={styles.statusText}>
          Please complete the connection process in the secure Plaid window
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${connectionProgress}%`,
                  backgroundColor: colors.primary
                }
              ]} 
            />
          </View>
          <Text variant="caption" color={colors.subtext} style={styles.progressText}>
            {connectionProgress}% complete
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card style={styles.statusCard}>
      <View style={styles.statusContent}>
        <CheckCircle size={64} color={colors.success} />
        <Text variant="heading3" bold style={styles.statusTitle}>
          Successfully Connected!
        </Text>
        <Text variant="body" color={colors.subtext} center style={styles.statusText}>
          Your credit card accounts have been connected. We're now importing your transactions and setting up automatic sync.
        </Text>
        
        <View style={styles.successFeatures}>
          <View style={styles.successFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>Automatic transaction import enabled</Text>
          </View>
          <View style={styles.successFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>Real-time balance updates activated</Text>
          </View>
          <View style={styles.successFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>Rewards tracking optimized</Text>
          </View>
        </View>
        
        <Button
          title="Continue to Dashboard"
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
          {error || 'We couldn\'t connect your accounts. This might be due to temporary server issues or incorrect credentials.'}
        </Text>
        
        <View style={styles.errorActions}>
          <Button
            title="Try Again"
            onPress={() => {
              clearError();
              setStep('consent');
              setConnectionProgress(0);
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
      </View>
    </Card>
  );

  // Platform-specific rendering
  if (Platform.OS === 'web') {
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

      {/* Enhanced Plaid Link Component */}
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
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
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
  statusTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
  },
  successFeatures: {
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  successFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  continueButton: {
    marginTop: 16,
    minWidth: 200,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    marginBottom: 12,
  },
  webNoticeCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
});