import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Dimensions, Pressable } from 'react-native';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CreditCardItem from '@/components/cards/CreditCardItem';
import CardActions from '@/components/cards/CardActions';
import { useTheme } from '@/context/ThemeContext';
import { CreditCard, Transaction } from '@/types';
import { CirclePlus as PlusCircle, TrendingUp, Search, Filter } from 'lucide-react-native';
import { useCards } from '@/hooks/useCards';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionItem from '@/components/transactions/TransactionItem';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

const { width } = Dimensions.get('window');

export default function CardsScreen() {
  const { colors } = useTheme();
  const { cards, loading: cardsLoading, error: cardsError, fetchCards } = useCards();
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'details' | 'actions'>('transactions');

  // Set first card as selected when cards load
  React.useEffect(() => {
    if (cards.length > 0 && !selectedCard) {
      setSelectedCard(cards[0]);
    }
  }, [cards, selectedCard]);

  const { 
    transactions, 
    loading: transactionsLoading, 
    fetchTransactions 
  } = useTransactions(selectedCard?.id);

  const handleRefresh = () => {
    fetchCards();
    if (selectedCard) {
      fetchTransactions();
    }
  };

  if (cardsLoading && cards.length === 0) {
    return (
      <Container safeArea>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text variant="body" color={colors.subtext} style={styles.loadingText}>
            Loading your cards...
          </Text>
        </View>
      </Container>
    );
  }

  if (cardsError) {
    return (
      <Container safeArea padded>
        <Card style={styles.errorCard}>
          <Text variant="heading3" color={colors.error}>Error Loading Cards</Text>
          <Text variant="body" color={colors.subtext} style={styles.errorText}>
            {cardsError}
          </Text>
          <Button title="Try Again" onPress={handleRefresh} />
        </Card>
      </Container>
    );
  }

  if (cards.length === 0) {
    return (
      <Container safeArea padded>
        <View style={styles.emptyStateContainer}>
          <Text variant="heading2" style={styles.emptyTitle}>No Cards Added</Text>
          <Text variant="body" color={colors.subtext} style={styles.emptyText}>
            Connect your credit cards to start tracking rewards and managing your finances.
          </Text>
          <Button 
            title="Add Your First Card" 
            leftIcon={<PlusCircle size={18} color="#FFFFFF" />}
            onPress={() => {}}
            style={styles.addCardButton}
          />
        </View>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container scrollable padded>
        <View style={styles.header}>
          <Text variant="heading1" bold>My Cards</Text>
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
          <FlatList
            data={cards}
            renderItem={({ item }) => (
              <CreditCardItem 
                card={item} 
                onPress={(card) => setSelectedCard(card)}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            snapToInterval={width * 0.85 + 20}
            decelerationRate="fast"
          />
        </View>

        {selectedCard && (
          <>
            {/* Card Stats */}
            <Card style={styles.cardStatsContainer}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text variant="caption" color={colors.subtext}>Current Balance</Text>
                  <Text variant="heading2" medium>${selectedCard.balance.toLocaleString()}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text variant="caption" color={colors.subtext}>Available Credit</Text>
                  <Text variant="heading2" medium>${(selectedCard.limit - selectedCard.balance).toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(selectedCard.balance / selectedCard.limit) * 100}%`,
                        backgroundColor: selectedCard.balance / selectedCard.limit > 0.7 ? colors.warning : colors.primary
                      }
                    ]} 
                  />
                </View>
                <Text variant="caption" color={colors.subtext} style={styles.progressText}>
                  {Math.round((selectedCard.balance / selectedCard.limit) * 100)}% of credit used
                </Text>
              </View>
            </Card>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === 'transactions' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('transactions')}
              >
                <Text 
                  variant="subtitle" 
                  color={activeTab === 'transactions' ? colors.primary : colors.subtext}
                  medium={activeTab === 'transactions'}
                >
                  Transactions
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === 'details' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('details')}
              >
                <Text 
                  variant="subtitle" 
                  color={activeTab === 'details' ? colors.primary : colors.subtext}
                  medium={activeTab === 'details'}
                >
                  Details
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === 'actions' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('actions')}
              >
                <Text 
                  variant="subtitle" 
                  color={activeTab === 'actions' ? colors.primary : colors.subtext}
                  medium={activeTab === 'actions'}
                >
                  Actions
                </Text>
              </Pressable>
            </View>

            {/* Tab Content */}
            {activeTab === 'transactions' && (
              <View style={styles.transactionsContainer}>
                {transactionsLoading ? (
                  <Card style={styles.loadingCard}>
                    <LoadingSpinner />
                    <Text variant="body" color={colors.subtext} style={styles.loadingText}>
                      Loading transactions...
                    </Text>
                  </Card>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onPress={() => {}}
                    />
                  ))
                ) : (
                  <Card style={styles.emptyStateCard}>
                    <Text variant="subtitle" center>No transactions found</Text>
                    <Text variant="body" color={colors.subtext} center style={styles.emptyStateText}>
                      Transactions will appear here once you start using your card.
                    </Text>
                  </Card>
                )}
              </View>
            )}

            {activeTab === 'details' && (
              <View style={styles.detailsContainer}>
                <Card style={styles.detailsCard}>
                  <Text variant="subtitle" medium>Card Information</Text>
                  <View style={styles.detailRow}>
                    <Text variant="caption" color={colors.subtext}>Card Name</Text>
                    <Text variant="body">{selectedCard.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text variant="caption" color={colors.subtext}>Card Number</Text>
                    <Text variant="body">•••• •••• •••• {selectedCard.lastFourDigits}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text variant="caption" color={colors.subtext}>Expiration Date</Text>
                    <Text variant="body">{selectedCard.expiryMonth.toString().padStart(2, '0')}/{selectedCard.expiryYear.toString().slice(-2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text variant="caption" color={colors.subtext}>Cardholder Name</Text>
                    <Text variant="body">{selectedCard.cardholderName}</Text>
                  </View>
                </Card>

                <Card style={styles.rewardsCard}>
                  <Text variant="subtitle" medium>Rewards</Text>
                  {selectedCard.rewards.map((reward, index) => (
                    <View key={reward.id} style={[
                      styles.rewardRow,
                      index < selectedCard.rewards.length - 1 && styles.rewardRowBorder
                    ]}>
                      <View style={[
                        styles.categoryDot,
                        { backgroundColor: reward.category.color }
                      ]} />
                      <View style={styles.rewardCategory}>
                        <Text variant="body">{reward.category.name}</Text>
                      </View>
                      <Text variant="body" bold>
                        {reward.rate}{reward.type === 'cashback' ? '%' : 'x'} {reward.type}
                      </Text>
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {activeTab === 'actions' && (
              <CardActions card={selectedCard} onRefresh={handleRefresh} />
            )}
          </>
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
  cardsSection: {
    marginBottom: 24,
  },
  cardsContainer: {
    paddingRight: 20,
  },
  cardStatsContainer: {
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceItem: {
    alignItems: 'flex-start',
  },
  progressBarContainer: {
    marginTop: 8,
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
    textAlign: 'right',
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
  transactionsContainer: {
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rewardsCard: {
    marginBottom: 16,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rewardRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  rewardCategory: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    marginVertical: 12,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateText: {
    marginTop: 8,
    textAlign: 'center',
  },
  addCardButton: {
    marginTop: 16,
  },
});