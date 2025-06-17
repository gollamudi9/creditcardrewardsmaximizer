import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Dimensions, ScrollView } from 'react-native';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RewardsActions from '@/components/rewards/RewardsActions';
import { useTheme } from '@/context/ThemeContext';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Filter, ArrowUpRight, Download, Share2 } from 'lucide-react-native';
import { useTransactions } from '@/hooks/useTransactions';
import { useCards } from '@/hooks/useCards';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

const { width } = Dimensions.get('window');

export default function RewardsScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'summary' | 'by-card' | 'by-category'>('summary');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  
  const { cards, loading: cardsLoading } = useCards();
  const { transactions, loading: transactionsLoading } = useTransactions();

  // Calculate rewards summary from actual data
  const rewardsSummary = React.useMemo(() => {
    const summary = {
      totalCashback: 0,
      totalPoints: 0,
      totalMiles: 0,
      byCard: {} as Record<string, { cashback: number; points: number; miles: number }>,
      byCategory: {} as Record<string, { cashback: number; points: number; miles: number }>,
    };

    transactions.forEach(transaction => {
      const { rewardEarned, cardId, category } = transaction;
      
      // Add to totals
      if (rewardEarned.type === 'cashback') {
        summary.totalCashback += rewardEarned.amount;
      } else if (rewardEarned.type === 'points') {
        summary.totalPoints += rewardEarned.amount;
      } else if (rewardEarned.type === 'miles') {
        summary.totalMiles += rewardEarned.amount;
      }

      // Add to by-card breakdown
      if (!summary.byCard[cardId]) {
        summary.byCard[cardId] = { cashback: 0, points: 0, miles: 0 };
      }
      summary.byCard[cardId][rewardEarned.type] += rewardEarned.amount;

      // Add to by-category breakdown
      if (!summary.byCategory[category.id]) {
        summary.byCategory[category.id] = { cashback: 0, points: 0, miles: 0 };
      }
      summary.byCategory[category.id][rewardEarned.type] += rewardEarned.amount;
    });

    return summary;
  }, [transactions]);

  // Prepare data for Bar Chart - By Card
  const barChartData = {
    labels: cards.slice(0, 4).map(card => card.name.split(' ')[0]), // Limit to 4 cards for display
    datasets: [
      {
        data: cards.slice(0, 4).map(card => {
          const cardRewards = rewardsSummary.byCard[card.id] || { cashback: 0, points: 0, miles: 0 };
          return cardRewards.cashback + (cardRewards.points / 100); // Convert points to dollar value
        }),
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  const isLoading = cardsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <Container safeArea>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text variant="body" color={colors.subtext} style={styles.loadingText}>
            Loading rewards data...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container scrollable padded>
        <View style={styles.header}>
          <Text variant="heading1" bold>Rewards</Text>
          <Button 
            title="Filter" 
            variant="outline" 
            size="small" 
            leftIcon={<Filter size={18} color={colors.primary} />}
            onPress={() => {}}
          />
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Pressable
            style={[
              styles.timeRangeButton,
              timeRange === 'month' && [styles.activeTimeRange, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => setTimeRange('month')}
          >
            <Text 
              variant="caption" 
              color={timeRange === 'month' ? colors.primary : colors.subtext}
              medium={timeRange === 'month'}
            >
              Month
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.timeRangeButton,
              timeRange === 'quarter' && [styles.activeTimeRange, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => setTimeRange('quarter')}
          >
            <Text 
              variant="caption" 
              color={timeRange === 'quarter' ? colors.primary : colors.subtext}
              medium={timeRange === 'quarter'}
            >
              Quarter
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.timeRangeButton,
              timeRange === 'year' && [styles.activeTimeRange, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => setTimeRange('year')}
          >
            <Text 
              variant="caption" 
              color={timeRange === 'year' ? colors.primary : colors.subtext}
              medium={timeRange === 'year'}
            >
              Year
            </Text>
          </Pressable>
        </View>

        {/* Rewards Actions Component */}
        <RewardsActions
          totalPoints={rewardsSummary.totalPoints}
          totalCashback={rewardsSummary.totalCashback}
          totalMiles={rewardsSummary.totalMiles}
        />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'summary' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('summary')}
          >
            <Text 
              variant="caption" 
              color={activeTab === 'summary' ? colors.primary : colors.subtext}
              medium={activeTab === 'summary'}
            >
              Summary
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'by-card' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('by-card')}
          >
            <Text 
              variant="caption" 
              color={activeTab === 'by-card' ? colors.primary : colors.subtext}
              medium={activeTab === 'by-card'}
            >
              By Card
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'by-category' && [styles.activeTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('by-category')}
          >
            <Text 
              variant="caption" 
              color={activeTab === 'by-category' ? colors.primary : colors.subtext}
              medium={activeTab === 'by-category'}
            >
              By Category
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <View style={styles.summaryTab}>
            {cards.length > 0 && (
              <Card style={styles.chartCard}>
                <Text variant="subtitle" medium style={styles.chartTitle}>Rewards by Card</Text>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={barChartData}
                    width={width - 64}
                    height={220}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    fromZero
                  />
                </View>
              </Card>
            )}
            
            <Card style={styles.actionsCard}>
              <Text variant="subtitle" medium style={styles.actionsTitle}>Quick Actions</Text>
              <View style={styles.actionButtonsContainer}>
                <Button 
                  title="Export Data" 
                  variant="outline" 
                  leftIcon={<Download size={18} color={colors.primary} />}
                  onPress={() => {}}
                  style={styles.actionButton}
                />
                <Button 
                  title="Share Report" 
                  variant="outline" 
                  leftIcon={<Share2 size={18} color={colors.primary} />}
                  onPress={() => {}}
                  style={styles.actionButton}
                />
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'by-card' && (
          <View style={styles.byCardTab}>
            {cards.map(card => {
              const cardRewards = rewardsSummary.byCard[card.id] || { cashback: 0, points: 0, miles: 0 };
              const totalValue = cardRewards.cashback + (cardRewards.points / 100) + (cardRewards.miles / 100);
              
              return (
                <Card key={card.id} style={styles.cardRewardsCard}>
                  <View style={styles.cardRewardsHeader}>
                    <Text variant="subtitle" medium numberOfLines={1}>{card.name}</Text>
                    <Text variant="subtitle" medium color={colors.success}>${totalValue.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.rewardDetailsContainer}>
                    {cardRewards.cashback > 0 && (
                      <View style={styles.rewardDetail}>
                        <Text variant="caption" color={colors.subtext}>Cashback</Text>
                        <Text variant="body">${cardRewards.cashback.toFixed(2)}</Text>
                      </View>
                    )}
                    
                    {cardRewards.points > 0 && (
                      <View style={styles.rewardDetail}>
                        <Text variant="caption" color={colors.subtext}>Points</Text>
                        <Text variant="body">{cardRewards.points.toLocaleString()}</Text>
                      </View>
                    )}
                    
                    {cardRewards.miles > 0 && (
                      <View style={styles.rewardDetail}>
                        <Text variant="caption" color={colors.subtext}>Miles</Text>
                        <Text variant="body">{cardRewards.miles.toLocaleString()}</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {activeTab === 'by-category' && (
          <View style={styles.byCategoryTab}>
            <Text variant="subtitle" medium style={styles.breakdownTitle}>Category Breakdown</Text>
            
            {Object.keys(rewardsSummary.byCategory).map(categoryId => {
              const catRewards = rewardsSummary.byCategory[categoryId];
              const totalValue = catRewards.cashback + (catRewards.points / 100) + (catRewards.miles / 100);
              
              if (totalValue === 0) return null;
              
              // Find category name from transactions
              const categoryName = transactions.find(t => t.category.id === categoryId)?.category.name || 'Unknown';
              const categoryColor = transactions.find(t => t.category.id === categoryId)?.category.color || colors.subtext;
              
              return (
                <View key={categoryId} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                    <Text variant="body">{categoryName}</Text>
                  </View>
                  <Text variant="body" medium>${totalValue.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Container>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'center',
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTimeRange: {
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  summaryTab: {
    marginBottom: 24,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  actionsCard: {
    padding: 16,
  },
  actionsTitle: {
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  byCardTab: {
    marginBottom: 24,
  },
  cardRewardsCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardRewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardDetailsContainer: {
    marginTop: 8,
  },
  rewardDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  byCategoryTab: {
    marginBottom: 24,
  },
  breakdownTitle: {
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
});