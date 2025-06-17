import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Dimensions, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuthContext } from '@/context/AuthContext';
import { useCards } from '@/hooks/useCards';
import { useTransactions } from '@/hooks/useTransactions';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CreditCardItem from '@/components/cards/CreditCardItem';
import TransactionItem from '@/components/transactions/TransactionItem';
import { LineChart } from 'react-native-chart-kit';
import { CirclePlus as PlusCircle, TrendingUp, ChevronRight } from 'lucide-react-native';
import { CreditCard, Transaction } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthContext();
  const { cards, loading: cardsLoading } = useCards();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);

  // Set active card to first card when cards are loaded
  React.useEffect(() => {
    if (cards.length > 0 && !activeCard) {
      setActiveCard(cards[0]);
    }
  }, [cards, activeCard]);

  // Calculate rewards summary from actual data
  const rewardsSummary = React.useMemo(() => {
    const summary = {
      totalCashback: 0,
      totalPoints: 0,
      totalMiles: 0,
    };

    transactions.forEach(transaction => {
      if (transaction.rewardEarned.type === 'cashback') {
        summary.totalCashback += transaction.rewardEarned.amount;
      } else if (transaction.rewardEarned.type === 'points') {
        summary.totalPoints += transaction.rewardEarned.amount;
      } else if (transaction.rewardEarned.type === 'miles') {
        summary.totalMiles += transaction.rewardEarned.amount;
      }
    });

    return summary;
  }, [transactions]);

  // Chart data for rewards trend (mock data for now)
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: () => colors.primary,
        strokeWidth: 2
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary
    }
  };

  if (!user) {
    return (
      <Container safeArea padded>
        <View style={styles.errorContainer}>
          <Text variant="heading2">Please sign in to continue</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container scrollable padded>
      <View style={styles.header}>
        <Text variant="heading1" bold>Dashboard</Text>
        <Button 
          title="Add Card" 
          variant="outline" 
          size="small" 
          leftIcon={<PlusCircle size={18} color={colors.primary} />}
          onPress={() => {}}
        />
      </View>

      {/* Cards Carousel */}
      <View style={styles.cardsSection}>
        <Text variant="heading3" style={styles.sectionTitle}>Your Cards</Text>
        {cardsLoading ? (
          <Card style={styles.loadingCard}>
            <Text variant="body" center>Loading cards...</Text>
          </Card>
        ) : cards.length > 0 ? (
          <FlatList
            data={cards}
            renderItem={({ item }) => (
              <CreditCardItem 
                card={item} 
                onPress={(card) => setActiveCard(card)}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            snapToInterval={width * 0.85 + 20}
            decelerationRate="fast"
          />
        ) : (
          <Card style={styles.emptyStateCard}>
            <Text variant="subtitle" center>No cards added yet</Text>
            <Text variant="body" color={colors.subtext} center style={styles.emptyStateText}>
              Add your first credit card to start tracking rewards
            </Text>
            <Button 
              title="Add Your First Card" 
              variant="primary" 
              onPress={() => {}}
              style={styles.addCardButton}
            />
          </Card>
        )}
      </View>

      {/* Rewards Summary */}
      <View style={styles.rewardsSection}>
        <View style={styles.sectionHeader}>
          <Text variant="heading3" style={styles.sectionTitle}>Rewards Summary</Text>
          <Button 
            title="Details"
            variant="ghost"
            size="small"
            rightIcon={<ChevronRight size={18} color={colors.primary} />}
            onPress={() => {}}
          />
        </View>
        <Card style={styles.rewardsCard}>
          <View style={styles.rewardsRow}>
            <View style={styles.rewardItem}>
              <Text variant="caption" color={colors.subtext}>Total Cashback</Text>
              <Text variant="heading2" color={colors.success} bold>${rewardsSummary.totalCashback.toFixed(2)}</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text variant="caption" color={colors.subtext}>Total Points</Text>
              <Text variant="heading2" bold>{rewardsSummary.totalPoints.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            <Text variant="subtitle" style={styles.chartTitle}>
              <TrendingUp size={16} color={colors.primary} style={{ marginRight: 4 }} />
              Rewards Trend
            </Text>
            <LineChart
              data={chartData}
              width={width - 64}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </Card>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text variant="heading3" style={styles.sectionTitle}>Recent Transactions</Text>
          <Button 
            title="View All"
            variant="ghost"
            size="small"
            rightIcon={<ChevronRight size={18} color={colors.primary} />}
            onPress={() => {}}
          />
        </View>
        {transactionsLoading ? (
          <Card style={styles.loadingCard}>
            <Text variant="body" center>Loading transactions...</Text>
          </Card>
        ) : transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onPress={() => {}}
            />
          ))
        ) : (
          <Card style={styles.emptyStateCard}>
            <Text variant="subtitle" center>No transactions yet</Text>
            <Text variant="body" color={colors.subtext} center style={styles.emptyStateText}>
              Transactions will appear here once you start using your cards
            </Text>
          </Card>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  cardsContainer: {
    paddingRight: 20,
  },
  rewardsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardsCard: {
    padding: 16,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  rewardItem: {
    alignItems: 'flex-start',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  addCardButton: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});