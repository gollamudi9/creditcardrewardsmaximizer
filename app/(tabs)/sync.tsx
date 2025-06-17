import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EnhancedPlaidLink from '@/components/plaid/EnhancedPlaidLink';
import EnhancedAccountList from '@/components/plaid/EnhancedAccountList';
import { useTheme } from '@/context/ThemeContext';
import { useAuthContext } from '@/context/AuthContext';
import { useEnhancedPlaid } from '@/hooks/useEnhancedPlaid';
import { CreditCard, Shield, Zap, TrendingUp, Plus, Activity, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';

export default function SyncScreen() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const { credentials, syncStatus } = useEnhancedPlaid();
  const [showPlaidLink, setShowPlaidLink] = useState(false);

  if (!user) {
    return (
      <Container safeArea padded>
        <View style={styles.errorContainer}>
          <Text variant="heading2">Please sign in to sync accounts</Text>
        </View>
      </Container>
    );
  }

  const handlePlaidSuccess = () => {
    setShowPlaidLink(false);
  };

  const handlePlaidExit = () => {
    setShowPlaidLink(false);
  };

  const renderSyncStats = () => {
    const totalAccounts = credentials.length;
    const activeAccounts = credentials.filter(c => c.status === 'active').length;
    const recentSyncs = Object.values(syncStatus).filter(s => 
      s.lastSync !== 'Never' && 
      new Date(s.lastSync).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    return (
      <Card style={styles.statsCard}>
        <Text variant="heading3" bold style={styles.statsTitle}>
          Sync Overview
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
              <CreditCard size={20} color={colors.primary} />
            </View>
            <Text variant="heading2" bold>{totalAccounts}</Text>
            <Text variant="caption" color={colors.subtext}>Connected Accounts</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Activity size={20} color={colors.success} />
            </View>
            <Text variant="heading2" bold>{activeAccounts}</Text>
            <Text variant="caption" color={colors.subtext}>Active Connections</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
              <Clock size={20} color={colors.accent} />
            </View>
            <Text variant="heading2" bold>{recentSyncs}</Text>
            <Text variant="caption" color={colors.subtext}>Recent Syncs (24h)</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="heading1" bold>Account Sync</Text>
      <Text variant="body" color={colors.subtext} style={styles.headerSubtitle}>
        Connect your credit card accounts to automatically import transactions and maximize your rewards
      </Text>
    </View>
  );

  const renderBenefits = () => (
    <Card style={styles.benefitsCard}>
      <Text variant="heading3" bold style={styles.benefitsTitle}>
        Enhanced Features
      </Text>
      
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '20' }]}>
            <Zap size={20} color={colors.primary} />
          </View>
          <View style={styles.benefitText}>
            <Text variant="subtitle" medium>Real-time Sync</Text>
            <Text variant="caption" color={colors.subtext}>
              Transactions sync automatically within minutes of purchase.
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <View style={[styles.benefitIcon, { backgroundColor: colors.success + '20' }]}>
            <TrendingUp size={20} color={colors.success} />
          </View>
          <View style={styles.benefitText}>
            <Text variant="subtitle" medium>Smart Categorization</Text>
            <Text variant="caption" color={colors.subtext}>
              AI-powered transaction categorization for accurate rewards tracking.
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <View style={[styles.benefitIcon, { backgroundColor: colors.accent + '20' }]}>
            <Shield size={20} color={colors.accent} />
          </View>
          <View style={styles.benefitText}>
            <Text variant="subtitle" medium>Enhanced Security</Text>
            <Text variant="caption" color={colors.subtext}>
              Multi-factor authentication and continuous monitoring.
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  if (showPlaidLink) {
    return (
      <Container safeArea padded>
        <EnhancedPlaidLink 
          onSuccess={handlePlaidSuccess}
          onExit={handlePlaidExit}
          customization={{
            institutionSearchEnabled: true,
            linkCustomizationName: 'rewards_tracker_v2',
          }}
        />
      </Container>
    );
  }

  return (
    <Container scrollable padded safeArea>
      {renderHeader()}
      
      {credentials.length > 0 && renderSyncStats()}
      
      <EnhancedAccountList 
        onAddAccount={() => setShowPlaidLink(true)}
      />
      
      {renderBenefits()}

      <Card style={styles.securityCard}>
        <View style={styles.securityHeader}>
          <Shield size={24} color={colors.success} style={styles.securityIcon} />
          <Text variant="subtitle" medium>Your Security is Our Priority</Text>
        </View>
        
        <Text variant="body" color={colors.subtext} style={styles.securityText}>
          We use Plaid, a trusted financial technology company used by thousands of apps. 
          Your login credentials are never stored on our servers, and all data is encrypted 
          with bank-level security.
        </Text>
        
        <View style={styles.securityFeatures}>
          <View style={styles.securityFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>256-bit SSL encryption</Text>
          </View>
          <View style={styles.securityFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>SOC 2 Type II certified</Text>
          </View>
          <View style={styles.securityFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>Read-only access to your accounts</Text>
          </View>
          <View style={styles.securityFeature}>
            <CheckCircle size={16} color={colors.success} />
            <Text variant="caption" color={colors.subtext}>No storage of login credentials</Text>
          </View>
        </View>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  headerSubtitle: {
    marginTop: 8,
    lineHeight: 22,
  },
  statsCard: {
    marginBottom: 24,
    padding: 20,
  },
  statsTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitsCard: {
    marginTop: 24,
    marginBottom: 24,
    padding: 20,
  },
  benefitsTitle: {
    marginBottom: 20,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
  },
  securityCard: {
    padding: 20,
    marginBottom: 24,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityIcon: {
    marginRight: 8,
  },
  securityText: {
    marginBottom: 16,
    lineHeight: 22,
  },
  securityFeatures: {
    gap: 8,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});