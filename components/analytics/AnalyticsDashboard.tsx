import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CustomDateRange } from '@/types/analytics';
import { TrendingUp, TrendingDown, Calendar, Download, Filter, CircleAlert as AlertCircle, DollarSign, CreditCard, Target } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DATE_RANGES = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last Year', days: 365 },
];

export default function AnalyticsDashboard() {
  const { colors, isDark } = useTheme();
  const {
    spendingTrends,
    budgetVariances,
    financialHealth,
    cashFlowProjections,
    fetchSpendingTrends,
    fetchBudgetVariance,
    fetchFinancialHealth,
    fetchCashFlowProjection,
    exportReport,
    loading,
  } = useAnalytics();

  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]);
  const [activeTab, setActiveTab] = useState<'trends' | 'budget' | 'health' | 'cashflow'>('trends');

  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - selectedRange.days);

    const dateRange: CustomDateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    fetchSpendingTrends({ dateRange });
    fetchBudgetVariance({ dateRange });
    fetchFinancialHealth();
    fetchCashFlowProjection(6);
  }, [selectedRange]);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - selectedRange.days);

    await exportReport({
      format,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      includeCharts: true,
      includeForecasts: true,
    });
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

  // Prepare chart data
  const trendChartData = {
    labels: spendingTrends.slice(0, 6).map(t => t.month.substring(0, 3)),
    datasets: [{
      data: spendingTrends.slice(0, 6).map(t => t.amount),
      color: (opacity = 1) => colors.primary,
      strokeWidth: 2,
    }],
  };

  const budgetChartData = {
    labels: budgetVariances.slice(0, 5).map(b => b.category.substring(0, 8)),
    datasets: [{
      data: budgetVariances.slice(0, 5).map(b => Math.abs(b.variance)),
    }],
  };

  const categoryPieData = spendingTrends
    .reduce((acc, trend) => {
      const existing = acc.find(item => item.name === trend.category);
      if (existing) {
        existing.amount += trend.amount;
      } else {
        acc.push({
          name: trend.category,
          amount: trend.amount,
          color: getRandomColor(),
          legendFontColor: colors.text,
          legendFontSize: 12,
        });
      }
      return acc;
    }, [] as any[])
    .slice(0, 5);

  const totalSpending = spendingTrends.reduce((sum, trend) => sum + trend.amount, 0);
  const averageMonthly = totalSpending / Math.max(spendingTrends.length, 1);
  const overBudgetCategories = budgetVariances.filter(b => b.variance > 0).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="heading2" bold>Analytics</Text>
        <View style={styles.headerActions}>
          <Button
            title="Export"
            variant="outline"
            size="small"
            leftIcon={<Download size={16} color={colors.primary} />}
            onPress={() => handleExport('pdf')}
          />
          <Button
            title="Filter"
            variant="outline"
            size="small"
            leftIcon={<Filter size={16} color={colors.primary} />}
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Date Range Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRangeContainer}>
        {DATE_RANGES.map((range) => (
          <Button
            key={range.label}
            title={range.label}
            variant={selectedRange.label === range.label ? 'primary' : 'outline'}
            size="small"
            onPress={() => setSelectedRange(range)}
            style={styles.dateRangeButton}
          />
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Card style={styles.metricCard}>
            <DollarSign size={24} color={colors.primary} />
            <Text variant="heading3" bold color={colors.primary}>
              ${totalSpending.toLocaleString()}
            </Text>
            <Text variant="caption" color={colors.subtext}>Total Spending</Text>
          </Card>
          
          <Card style={styles.metricCard}>
            <Calendar size={24} color={colors.success} />
            <Text variant="heading3" bold color={colors.success}>
              ${averageMonthly.toLocaleString()}
            </Text>
            <Text variant="caption" color={colors.subtext}>Monthly Average</Text>
          </Card>
          
          <Card style={styles.metricCard}>
            <AlertCircle size={24} color={overBudgetCategories > 0 ? colors.error : colors.success} />
            <Text variant="heading3" bold color={overBudgetCategories > 0 ? colors.error : colors.success}>
              {overBudgetCategories}
            </Text>
            <Text variant="caption" color={colors.subtext}>Over Budget</Text>
          </Card>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Button
            title="Trends"
            variant={activeTab === 'trends' ? 'primary' : 'ghost'}
            size="small"
            onPress={() => setActiveTab('trends')}
            style={styles.tabButton}
          />
          <Button
            title="Budget"
            variant={activeTab === 'budget' ? 'primary' : 'ghost'}
            size="small"
            onPress={() => setActiveTab('budget')}
            style={styles.tabButton}
          />
          <Button
            title="Health"
            variant={activeTab === 'health' ? 'primary' : 'ghost'}
            size="small"
            onPress={() => setActiveTab('health')}
            style={styles.tabButton}
          />
          <Button
            title="Cash Flow"
            variant={activeTab === 'cashflow' ? 'primary' : 'ghost'}
            size="small"
            onPress={() => setActiveTab('cashflow')}
            style={styles.tabButton}
          />
        </View>

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <View>
            <Card style={styles.chartCard}>
              <Text variant="subtitle" medium style={styles.chartTitle}>
                Spending Trends
              </Text>
              {spendingTrends.length > 0 && (
                <LineChart
                  data={trendChartData}
                  width={width - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              )}
            </Card>

            <Card style={styles.chartCard}>
              <Text variant="subtitle" medium style={styles.chartTitle}>
                Category Distribution
              </Text>
              {categoryPieData.length > 0 && (
                <PieChart
                  data={categoryPieData}
                  width={width - 64}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              )}
            </Card>

            <Card style={styles.trendsCard}>
              <Text variant="subtitle" medium style={styles.trendsTitle}>
                Category Trends
              </Text>
              {spendingTrends.slice(0, 5).map((trend, index) => (
                <View key={index} style={styles.trendItem}>
                  <View style={styles.trendInfo}>
                    <Text variant="body" medium>{trend.category}</Text>
                    <Text variant="caption" color={colors.subtext}>
                      ${trend.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.trendChange}>
                    {trend.percentChange > 0 ? (
                      <TrendingUp size={16} color={colors.error} />
                    ) : (
                      <TrendingDown size={16} color={colors.success} />
                    )}
                    <Text 
                      variant="caption" 
                      color={trend.percentChange > 0 ? colors.error : colors.success}
                    >
                      {Math.abs(trend.percentChange).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <View>
            <Card style={styles.chartCard}>
              <Text variant="subtitle" medium style={styles.chartTitle}>
                Budget vs Actual
              </Text>
              {budgetVariances.length > 0 && (
                <BarChart
                  data={budgetChartData}
                  width={width - 64}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              )}
            </Card>

            <Card style={styles.budgetCard}>
              <Text variant="subtitle" medium style={styles.budgetTitle}>
                Budget Variance Analysis
              </Text>
              {budgetVariances.map((variance, index) => (
                <View key={index} style={styles.budgetItem}>
                  <View style={styles.budgetInfo}>
                    <Text variant="body" medium>{variance.category}</Text>
                    <Text variant="caption" color={colors.subtext}>
                      Budget: ${variance.budgeted.toLocaleString()} • 
                      Actual: ${variance.actual.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.budgetVariance}>
                    <Text 
                      variant="body" 
                      bold
                      color={variance.variance > 0 ? colors.error : colors.success}
                    >
                      {variance.variance > 0 ? '+' : ''}${variance.variance.toLocaleString()}
                    </Text>
                    <Text 
                      variant="caption"
                      color={variance.variance > 0 ? colors.error : colors.success}
                    >
                      {variance.percentVariance.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Financial Health Tab */}
        {activeTab === 'health' && (
          <View>
            <Card style={styles.healthCard}>
              <Text variant="subtitle" medium style={styles.healthTitle}>
                Financial Health Indicators
              </Text>
              {financialHealth.map((indicator, index) => (
                <View key={index} style={styles.healthItem}>
                  <View style={styles.healthInfo}>
                    <Text variant="body" medium>{indicator.name}</Text>
                    <Text variant="caption" color={colors.subtext}>
                      {indicator.description}
                    </Text>
                  </View>
                  <View style={styles.healthScore}>
                    <Text 
                      variant="heading3" 
                      bold
                      color={getHealthColor(indicator.status)}
                    >
                      {indicator.value}
                    </Text>
                    <Text 
                      variant="caption"
                      color={getHealthColor(indicator.status)}
                    >
                      {indicator.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <View>
            <Card style={styles.chartCard}>
              <Text variant="subtitle" medium style={styles.chartTitle}>
                Cash Flow Projection
              </Text>
              {cashFlowProjections.length > 0 && (
                <LineChart
                  data={{
                    labels: cashFlowProjections.slice(0, 6).map(p => 
                      new Date(p.date).toLocaleDateString('en', { month: 'short' })
                    ),
                    datasets: [{
                      data: cashFlowProjections.slice(0, 6).map(p => p.cumulativeBalance),
                      color: (opacity = 1) => colors.primary,
                      strokeWidth: 2,
                    }],
                  }}
                  width={width - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              )}
            </Card>

            <Card style={styles.cashFlowCard}>
              <Text variant="subtitle" medium style={styles.cashFlowTitle}>
                Monthly Cash Flow
              </Text>
              {cashFlowProjections.slice(0, 6).map((projection, index) => (
                <View key={index} style={styles.cashFlowItem}>
                  <Text variant="body" medium>
                    {new Date(projection.date).toLocaleDateString('en', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <View style={styles.cashFlowAmounts}>
                    <Text variant="caption" color={colors.success}>
                      In: ${projection.inflow.toLocaleString()}
                    </Text>
                    <Text variant="caption" color={colors.error}>
                      Out: ${projection.outflow.toLocaleString()}
                    </Text>
                    <Text 
                      variant="body" 
                      bold
                      color={projection.netFlow >= 0 ? colors.success : colors.error}
                    >
                      Net: ${projection.netFlow.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );

  function getHealthColor(status: string) {
    switch (status) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return colors.warning;
      case 'poor': return colors.error;
      default: return colors.subtext;
    }
  }

  function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeContainer: {
    marginBottom: 20,
  },
  dateRangeButton: {
    marginRight: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  trendsCard: {
    marginBottom: 16,
    padding: 16,
  },
  trendsTitle: {
    marginBottom: 16,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  trendInfo: {
    flex: 1,
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetCard: {
    marginBottom: 16,
    padding: 16,
  },
  budgetTitle: {
    marginBottom: 16,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetVariance: {
    alignItems: 'flex-end',
  },
  healthCard: {
    marginBottom: 16,
    padding: 16,
  },
  healthTitle: {
    marginBottom: 16,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  healthInfo: {
    flex: 1,
  },
  healthScore: {
    alignItems: 'center',
  },
  cashFlowCard: {
    marginBottom: 16,
    padding: 16,
  },
  cashFlowTitle: {
    marginBottom: 16,
  },
  cashFlowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cashFlowAmounts: {
    alignItems: 'flex-end',
    gap: 2,
  },
});