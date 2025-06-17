import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsAlert } from '@/types/analytics';
import { TriangleAlert as AlertTriangle, TrendingUp, DollarSign, Target, Bell, X, Settings, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';

const ALERT_ICONS = {
  spending_pattern: TrendingUp,
  budget_overrun: Target,
  large_expense: DollarSign,
  forecast_deviation: AlertTriangle,
};

const SEVERITY_COLORS = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
};

export default function AlertsCenter() {
  const { colors } = useTheme();
  const {
    alerts,
    markAlertAsRead,
    dismissAlert,
    loading,
  } = useAnalytics();

  const [selectedAlert, setSelectedAlert] = useState<AnalyticsAlert | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const highPriorityAlerts = alerts.filter(alert => alert.severity === 'high');

  const handleAlertPress = (alert: AnalyticsAlert) => {
    if (!alert.isRead) {
      markAlertAsRead(alert.id);
    }
    setSelectedAlert(alert);
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    setSelectedAlert(null);
  };

  const getAlertIcon = (type: AnalyticsAlert['type']) => {
    const IconComponent = ALERT_ICONS[type];
    return <IconComponent size={20} color={colors.primary} />;
  };

  const getSeverityColor = (severity: AnalyticsAlert['severity']) => {
    return SEVERITY_COLORS[severity];
  };

  const formatAlertDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="heading2" bold>Alerts</Text>
          {unreadAlerts.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text variant="caption" color="#FFFFFF" bold>
                {unreadAlerts.length}
              </Text>
            </View>
          )}
        </View>
        <Button
          title="Settings"
          variant="outline"
          size="small"
          leftIcon={<Settings size={16} color={colors.primary} />}
          onPress={() => setShowSettings(true)}
        />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Bell size={24} color={colors.primary} />
          <Text variant="heading3" bold color={colors.primary}>
            {alerts.length}
          </Text>
          <Text variant="caption" color={colors.subtext}>Total Alerts</Text>
        </Card>
        
        <Card style={styles.summaryCard}>
          <AlertTriangle size={24} color={colors.error} />
          <Text variant="heading3" bold color={colors.error}>
            {highPriorityAlerts.length}
          </Text>
          <Text variant="caption" color={colors.subtext}>High Priority</Text>
        </Card>
        
        <Card style={styles.summaryCard}>
          <Clock size={24} color={colors.warning} />
          <Text variant="heading3" bold color={colors.warning}>
            {alerts.filter(a => a.actionRequired).length}
          </Text>
          <Text variant="caption" color={colors.subtext}>Action Required</Text>
        </Card>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* High Priority Alerts */}
        {highPriorityAlerts.length > 0 && (
          <View style={styles.section}>
            <Text variant="subtitle" medium style={styles.sectionTitle}>
              High Priority
            </Text>
            {highPriorityAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                style={[
                  styles.alertCard,
                  { borderLeftColor: getSeverityColor(alert.severity), borderLeftWidth: 4 }
                ]}
                onPress={() => handleAlertPress(alert)}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    {getAlertIcon(alert.type)}
                  </View>
                  <View style={styles.alertInfo}>
                    <Text variant="body" medium numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text variant="caption" color={colors.subtext}>
                      {formatAlertDate(alert.date)}
                    </Text>
                  </View>
                  <View style={styles.alertStatus}>
                    {!alert.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                    {alert.actionRequired && (
                      <AlertTriangle size={16} color={colors.warning} />
                    )}
                  </View>
                </View>
                <Text variant="body" color={colors.subtext} numberOfLines={2}>
                  {alert.message}
                </Text>
              </Card>
            ))}
          </View>
        )}

        {/* All Alerts */}
        <View style={styles.section}>
          <Text variant="subtitle" medium style={styles.sectionTitle}>
            All Alerts
          </Text>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card 
                key={alert.id} 
                style={[
                  styles.alertCard,
                  { borderLeftColor: getSeverityColor(alert.severity), borderLeftWidth: 4 },
                  !alert.isRead && styles.unreadAlert
                ]}
                onPress={() => handleAlertPress(alert)}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    {getAlertIcon(alert.type)}
                  </View>
                  <View style={styles.alertInfo}>
                    <Text variant="body" medium numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text variant="caption" color={colors.subtext}>
                      {formatAlertDate(alert.date)}
                    </Text>
                  </View>
                  <View style={styles.alertStatus}>
                    {!alert.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                    {alert.actionRequired && (
                      <AlertTriangle size={16} color={colors.warning} />
                    )}
                  </View>
                </View>
                <Text variant="body" color={colors.subtext} numberOfLines={2}>
                  {alert.message}
                </Text>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyState}>
              <CheckCircle size={48} color={colors.success} />
              <Text variant="body" color={colors.subtext} center style={styles.emptyText}>
                No alerts at this time. Your finances are looking good!
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={selectedAlert !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAlert(null)}
      >
        {selectedAlert && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="heading3" bold>Alert Details</Text>
              <Button
                title=""
                variant="ghost"
                leftIcon={<X size={24} color={colors.subtext} />}
                onPress={() => setSelectedAlert(null)}
              />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.alertDetailHeader}>
                <View style={styles.alertDetailIcon}>
                  {getAlertIcon(selectedAlert.type)}
                </View>
                <View style={styles.alertDetailInfo}>
                  <Text variant="heading3" medium>{selectedAlert.title}</Text>
                  <Text variant="caption" color={colors.subtext}>
                    {formatAlertDate(selectedAlert.date)} • {selectedAlert.severity.toUpperCase()} Priority
                  </Text>
                </View>
              </View>

              <Card style={styles.alertDetailCard}>
                <Text variant="body" style={styles.alertDetailMessage}>
                  {selectedAlert.message}
                </Text>
              </Card>

              {selectedAlert.actionRequired && (
                <Card style={styles.actionCard}>
                  <View style={styles.actionHeader}>
                    <AlertTriangle size={20} color={colors.warning} />
                    <Text variant="subtitle" medium>Action Required</Text>
                  </View>
                  <Text variant="body" color={colors.subtext}>
                    This alert requires your attention. Please review your spending patterns 
                    and consider adjusting your budget or financial strategy.
                  </Text>
                </Card>
              )}

              <View style={styles.alertMetadata}>
                <Text variant="caption" color={colors.subtext}>
                  Alert Type: {selectedAlert.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text variant="caption" color={colors.subtext}>
                  Severity: {selectedAlert.severity.toUpperCase()}
                </Text>
                <Text variant="caption" color={colors.subtext}>
                  Created: {new Date(selectedAlert.date).toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Dismiss Alert"
                variant="outline"
                onPress={() => handleDismissAlert(selectedAlert.id)}
                style={styles.modalButton}
              />
              <Button
                title="Mark as Read"
                onPress={() => {
                  markAlertAsRead(selectedAlert.id);
                  setSelectedAlert(null);
                }}
                style={styles.modalButton}
              />
            </View>
          </View>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="heading3" bold>Alert Settings</Text>
            <Button
              title=""
              variant="ghost"
              leftIcon={<X size={24} color={colors.subtext} />}
              onPress={() => setShowSettings(false)}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text variant="body" color={colors.subtext} style={styles.settingsDescription}>
              Configure when and how you receive financial alerts.
            </Text>

            <Card style={styles.settingsCard}>
              <Text variant="subtitle" medium style={styles.settingsTitle}>
                Alert Thresholds
              </Text>
              
              <View style={styles.settingItem}>
                <Text variant="body">Spending Pattern Changes</Text>
                <Text variant="caption" color={colors.subtext}>Alert when spending increases by 20%</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text variant="body">Budget Overrun Warning</Text>
                <Text variant="caption" color={colors.subtext}>Alert at 80% of budget</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text variant="body">Large Expense Amount</Text>
                <Text variant="caption" color={colors.subtext}>Alert for expenses over $500</Text>
              </View>
            </Card>

            <Card style={styles.settingsCard}>
              <Text variant="subtitle" medium style={styles.settingsTitle}>
                Notification Preferences
              </Text>
              
              <View style={styles.settingItem}>
                <Text variant="body">Push Notifications</Text>
                <Text variant="caption" color={colors.subtext}>Enabled</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text variant="body">Email Alerts</Text>
                <Text variant="caption" color={colors.subtext}>Enabled</Text>
              </View>
            </Card>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Save Settings"
              onPress={() => setShowSettings(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  alertCard: {
    marginBottom: 12,
    padding: 16,
  },
  unreadAlert: {
    backgroundColor: '#0066CC10',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  alertDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertDetailIcon: {
    marginRight: 16,
  },
  alertDetailInfo: {
    flex: 1,
  },
  alertDetailCard: {
    marginBottom: 20,
    padding: 16,
  },
  alertDetailMessage: {
    lineHeight: 22,
  },
  actionCard: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FF980020',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  alertMetadata: {
    marginBottom: 20,
    gap: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  settingsDescription: {
    marginBottom: 20,
    lineHeight: 22,
  },
  settingsCard: {
    marginBottom: 16,
    padding: 16,
  },
  settingsTitle: {
    marginBottom: 16,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});