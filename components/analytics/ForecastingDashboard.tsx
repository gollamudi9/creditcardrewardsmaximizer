import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ForecastPeriod } from '@/types/analytics';
import { TrendingUp, TrendingDown, Calendar, Settings, TriangleAlert as AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const FORECAST_PERIODS: ForecastPeriod[] = [
  { period: 3, label: '3 Months' },
  { period: 6, label: '6 Months' },
  { period: 12, label: '12 Months' },
  { period: 24, label: '24 Months' },
];

export default function ForecastingDashboard() {
  const { colors, isDark } = useTheme();
  const {
    forecast,
    forecastAccuracy,
    selectedPeriod,
    loading,
    generateForecast,
    updateForecastVariables,
  } = useAnalytics();

  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjustments, setAdjustments] = useState({
    incomeMultiplier: 1.0,
    expenseMultiplier: 1.0,
    seasonalAdjustment: 0,
  });

  const handlePeriodChange = (period: ForecastPeriod['period']) => {
    generateForecast(period);
  };

  const handleApplyAdjustments = () => {
    updateForecastVariables(adjustments);
    setShowAdjustments(false);
  };

  const chartData = {
    labels: forecast.slice(0, 6).map(f => f.month.substring(0, 3)),
    datasets: [
      {
        data: forecast.slice(0, 6).map(f => f.netIncome),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3,
      },
      {
        data: forecast.slice(0, 6).map(f => f.confidenceInterval.upper),
        color: (opacity = 1) => `${colors.success}80`,
        strokeWidth: 1,
        withDots: false,
      },
      {
        data: forecast.slice(0, 6).map(f => f.confidenceInterval.lower),
        color: (opacity = 1) => `${colors.error}80`,
        strokeWidth: 1,
        withDots: false,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const totalProjectedIncome = forecast.reduce((sum, f) => sum + f.netIncome, 0);
  const averageMonthlyIncome = totalProjectedIncome / forecast.length || 0;
  const trend = forecast.length > 1 ? 
    (forecast[forecast.length - 1].netIncome > forecast[0].netIncome ? 'up' : 'down') : 'stable';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="heading2" bold>Financial Forecast</Text>
        <Button
          title="Adjust"
          variant="outline"
          size="small"
          leftIcon={<Settings size={16} color={colors.primary} />}
          onPress={() => setShowAdjustments(!showAdjustments)}
        />
      </View>

      {/* Period Selection */}
      <View style={styles.periodSelector}>
        {FORECAST_PERIODS.map((period) => (
          <Button
            key={period.period}
            title={period.label}
            variant={selectedPeriod === period.period ? 'primary' : 'outline'}
            size="small"
            onPress={() => handlePeriodChange(period.period)}
            style={styles.periodButton}
          />
        ))}
      </View>

      {/* Forecast Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text variant="subtitle" medium>Forecast Summary</Text>
          <View style={styles.accuracyBadge}>
            <Text variant="caption" color={colors.success}>
              {Math.round(forecastAccuracy * 100)}% Accuracy
            </Text>
          </View>
        </View>

        <View style={styles.summaryMetrics}>
          <View style={styles.metric}>
            <Text variant="caption" color={colors.subtext}>Total Projected</Text>
            <Text variant="heading3" bold color={colors.primary}>
              ${totalProjectedIncome.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption" color={colors.subtext}>Monthly Average</Text>
            <Text variant="heading3" bold>
              ${averageMonthlyIncome.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption" color={colors.subtext}>Trend</Text>
            <View style={styles.trendIndicator}>
              {trend === 'up' ? (
                <TrendingUp size={20} color={colors.success} />
              ) : (
                <TrendingDown size={20} color={colors.error} />
              )}
              <Text variant="body" color={trend === 'up' ? colors.success : colors.error}>
                {trend === 'up' ? 'Growing' : 'Declining'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Forecast Chart */}
      <Card style={styles.chartCard}>
        <Text variant="subtitle" medium style={styles.chartTitle}>
          Net Income Projection
        </Text>
        <Text variant="caption" color={colors.subtext} style={styles.chartSubtitle}>
          Showing confidence intervals and seasonal adjustments
        </Text>
        
        {forecast.length > 0 && (
          <LineChart
            data={chartData}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        )}

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text variant="caption" color={colors.subtext}>Projected Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success + '80' }]} />
            <Text variant="caption" color={colors.subtext}>Upper Confidence</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error + '80' }]} />
            <Text variant="caption" color={colors.subtext}>Lower Confidence</Text>
          </View>
        </View>
      </Card>

      {/* Manual Adjustments Panel */}
      {showAdjustments && (
        <Card style={styles.adjustmentsCard}>
          <Text variant="subtitle" medium style={styles.adjustmentsTitle}>
            Forecast Adjustments
          </Text>
          
          <View style={styles.adjustmentItem}>
            <Text variant="body">Income Multiplier</Text>
            <Text variant="caption" color={colors.subtext}>
              Current: {adjustments.incomeMultiplier.toFixed(1)}x
            </Text>
            {/* Slider would go here - simplified for demo */}
            <View style={styles.adjustmentButtons}>
              <Button
                title="-0.1"
                size="small"
                variant="outline"
                onPress={() => setAdjustments(prev => ({
                  ...prev,
                  incomeMultiplier: Math.max(0.1, prev.incomeMultiplier - 0.1)
                }))}
              />
              <Button
                title="+0.1"
                size="small"
                variant="outline"
                onPress={() => setAdjustments(prev => ({
                  ...prev,
                  incomeMultiplier: Math.min(3.0, prev.incomeMultiplier + 0.1)
                }))}
              />
            </View>
          </View>

          <View style={styles.adjustmentItem}>
            <Text variant="body">Expense Multiplier</Text>
            <Text variant="caption" color={colors.subtext}>
              Current: {adjustments.expenseMultiplier.toFixed(1)}x
            </Text>
            <View style={styles.adjustmentButtons}>
              <Button
                title="-0.1"
                size="small"
                variant="outline"
                onPress={() => setAdjustments(prev => ({
                  ...prev,
                  expenseMultiplier: Math.max(0.1, prev.expenseMultiplier - 0.1)
                }))}
              />
              <Button
                title="+0.1"
                size="small"
                variant="outline"
                onPress={() => setAdjustments(prev => ({
                  ...prev,
                  expenseMultiplier: Math.min(3.0, prev.expenseMultiplier + 0.1)
                }))}
              />
            </View>
          </View>

          <Button
            title="Apply Adjustments"
            onPress={handleApplyAdjustments}
            loading={loading}
            style={styles.applyButton}
          />
        </Card>
      )}

      {/* Monthly Breakdown */}
      <Card style={styles.breakdownCard}>
        <Text variant="subtitle" medium style={styles.breakdownTitle}>
          Monthly Breakdown
        </Text>
        
        {forecast.slice(0, 6).map((month, index) => (
          <View key={month.month} style={styles.monthRow}>
            <View style={styles.monthInfo}>
              <Text variant="body" medium>{month.month}</Text>
              <Text variant="caption" color={colors.subtext}>
                Seasonal factor: {month.seasonalFactor.toFixed(2)}
              </Text>
            </View>
            <View style={styles.monthAmounts}>
              <Text variant="body" color={colors.success}>
                +${month.projectedIncome.toLocaleString()}
              </Text>
              <Text variant="body" color={colors.error}>
                -${month.projectedExpenses.toLocaleString()}
              </Text>
              <Text variant="body" bold>
                ${month.netIncome.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Forecast Confidence */}
      <Card style={styles.confidenceCard}>
        <View style={styles.confidenceHeader}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text variant="subtitle" medium>Forecast Confidence</Text>
        </View>
        
        <Text variant="body" color={colors.subtext} style={styles.confidenceText}>
          This forecast is based on your historical spending patterns and income trends. 
          Accuracy decreases for longer time periods. Consider updating your forecast 
          monthly for best results.
        </Text>
        
        <View style={styles.confidenceMetrics}>
          <View style={styles.confidenceMetric}>
            <Text variant="caption" color={colors.subtext}>Data Points</Text>
            <Text variant="body" bold>{forecast.length * 30}</Text>
          </View>
          <View style={styles.confidenceMetric}>
            <Text variant="caption" color={colors.subtext}>Last Updated</Text>
            <Text variant="body" bold>Today</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accuracyBadge: {
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    marginBottom: 4,
  },
  chartSubtitle: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  adjustmentsCard: {
    marginBottom: 16,
    padding: 20,
  },
  adjustmentsTitle: {
    marginBottom: 16,
  },
  adjustmentItem: {
    marginBottom: 16,
  },
  adjustmentButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  applyButton: {
    marginTop: 8,
  },
  breakdownCard: {
    marginBottom: 16,
    padding: 16,
  },
  breakdownTitle: {
    marginBottom: 16,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  monthInfo: {
    flex: 1,
  },
  monthAmounts: {
    alignItems: 'flex-end',
    gap: 2,
  },
  confidenceCard: {
    marginBottom: 20,
    padding: 16,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confidenceText: {
    lineHeight: 22,
    marginBottom: 16,
  },
  confidenceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  confidenceMetric: {
    alignItems: 'center',
  },
});