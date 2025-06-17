import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import ForecastingDashboard from '@/components/analytics/ForecastingDashboard';
import AdhocExpensePlanner from '@/components/analytics/AdhocExpensePlanner';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AlertsCenter from '@/components/analytics/AlertsCenter';
import { useTheme } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TrendingUp, Calendar, ChartBar as BarChart3, Bell, DollarSign, Target } from 'lucide-react-native';
import ErrorBoundary from '@/components/ErrorBoundary';

type AnalyticsTab = 'dashboard' | 'forecast' | 'planning' | 'alerts';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { alerts } = useAnalytics();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');

  const unreadAlerts = alerts.filter(alert => !alert.isRead).length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'forecast':
        return <ForecastingDashboard />;
      case 'planning':
        return <AdhocExpensePlanner />;
      case 'alerts':
        return <AlertsCenter />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <Container safeArea>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Button
            title="Analytics"
            variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
            size="small"
            leftIcon={<BarChart3 size={16} color={activeTab === 'dashboard' ? '#FFFFFF' : colors.subtext} />}
            onPress={() => setActiveTab('dashboard')}
            style={styles.tabButton}
          />
          
          <Button
            title="Forecast"
            variant={activeTab === 'forecast' ? 'primary' : 'ghost'}
            size="small"
            leftIcon={<TrendingUp size={16} color={activeTab === 'forecast' ? '#FFFFFF' : colors.subtext} />}
            onPress={() => setActiveTab('forecast')}
            style={styles.tabButton}
          />
          
          <Button
            title="Planning"
            variant={activeTab === 'planning' ? 'primary' : 'ghost'}
            size="small"
            leftIcon={<Calendar size={16} color={activeTab === 'planning' ? '#FFFFFF' : colors.subtext} />}
            onPress={() => setActiveTab('planning')}
            style={styles.tabButton}
          />
          
          <View style={styles.alertsTabContainer}>
            <Button
              title="Alerts"
              variant={activeTab === 'alerts' ? 'primary' : 'ghost'}
              size="small"
              leftIcon={<Bell size={16} color={activeTab === 'alerts' ? '#FFFFFF' : colors.subtext} />}
              onPress={() => setActiveTab('alerts')}
              style={styles.tabButton}
            />
            {unreadAlerts > 0 && (
              <View style={[styles.alertBadge, { backgroundColor: colors.error }]}>
                <Text variant="caption" color="#FFFFFF" bold>
                  {unreadAlerts}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>
      </Container>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    margin: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  alertsTabContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 2,
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});