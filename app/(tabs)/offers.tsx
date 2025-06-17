import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, Image } from 'react-native';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import OfferActions from '@/components/offers/OfferActions';
import { useTheme } from '@/context/ThemeContext';
import { Search, Filter, Calendar, Tag, Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
//import { offers, sampleCards } from '@/data/sampleData';
import { Offer } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function OffersScreen() {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [loading, setLoading] = useState(false);

  // Filter offers based on active filter
  const filteredOffers = offers.filter(offer => {
    if (activeFilter === 'active') {
      return new Date(offer.endDate) > new Date() && !offer.isActivated;
    } else if (activeFilter === 'expired') {
      return new Date(offer.endDate) <= new Date();
    }
    return true;
  });

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const renderOfferItem = ({ item }: { item: Offer }) => {
    const card = sampleCards.find(card => card.id === item.cardId);
    const isExpired = new Date(item.endDate) <= new Date();
    const daysLeft = Math.ceil((new Date(item.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <View style={styles.merchantInfo}>
            {item.merchantName && (
              <Image 
                source={{ uri: `https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1` }}
                style={styles.merchantLogo}
              />
            )}
            <View style={styles.offerDetails}>
              <Text variant="subtitle" medium numberOfLines={1}>{item.title}</Text>
              <Text variant="caption" color={colors.subtext}>{item.merchantName || 'Multiple Merchants'}</Text>
            </View>
          </View>
          {item.isActivated ? (
            <CheckCircle size={24} color={colors.success} />
          ) : (
            <XCircle size={24} color={isExpired ? colors.subtext : colors.primary} />
          )}
        </View>
        
        <Text variant="body" style={styles.offerDescription}>{item.description}</Text>
        
        <View style={styles.offerMeta}>
          <View style={styles.metaItem}>
            <Calendar size={16} color={colors.subtext} style={styles.metaIcon} />
            <Text variant="caption" color={colors.subtext}>
              {isExpired ? 'Expired' : `${daysLeft} days left`}
            </Text>
          </View>
          {card && (
            <View style={styles.metaItem}>
              <Tag size={16} color={colors.subtext} style={styles.metaIcon} />
              <Text variant="caption" color={colors.subtext}>{card.name.split(' ')[0]}</Text>
            </View>
          )}
          {item.minSpend && (
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.subtext} style={styles.metaIcon} />
              <Text variant="caption" color={colors.subtext}>Min: ${item.minSpend}</Text>
            </View>
          )}
        </View>
        
        <OfferActions offer={item} onRefresh={handleRefresh} />
      </Card>
    );
  };

  if (loading) {
    return (
      <Container safeArea>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text variant="body" color={colors.subtext} style={styles.loadingText}>
            Loading offers...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container padded>
        <View style={styles.header}>
          <Text variant="heading1" bold>Offers</Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchFilterContainer}>
          <View style={[
            styles.searchContainer,
            { backgroundColor: isDark ? colors.card : '#F0F0F0' }
          ]}>
            <Search size={20} color={colors.subtext} style={styles.searchIcon} />
            <Pressable style={styles.searchInput} onPress={() => {}}>
              <Text color={colors.subtext}>Search offers...</Text>
            </Pressable>
          </View>
          
          <Button 
            title="Filter" 
            variant="outline" 
            size="small" 
            leftIcon={<Filter size={18} color={colors.primary} />}
            onPress={() => {}}
            style={styles.filterButton}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <Pressable
            style={[
              styles.filterTab,
              activeFilter === 'all' && [styles.activeFilterTab, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text 
              variant="caption" 
              color={activeFilter === 'all' ? colors.primary : colors.subtext}
              medium={activeFilter === 'all'}
            >
              All ({offers.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterTab,
              activeFilter === 'active' && [styles.activeFilterTab, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => setActiveFilter('active')}
          >
            <Text 
              variant="caption" 
              color={activeFilter === 'active' ? colors.primary : colors.subtext}
              medium={activeFilter === 'active'}
            >
              Active ({offers.filter(o => new Date(o.endDate) > new Date() && !o.isActivated).length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterTab,
              activeFilter === 'expired' && [styles.activeFilterTab, { backgroundColor: colors.primary + '20' }]
            ]}
            onPress={() => setActiveFilter('expired')}
          >
            <Text 
              variant="caption" 
              color={activeFilter === 'expired' ? colors.primary : colors.subtext}
              medium={activeFilter === 'expired'}
            >
              Expired ({offers.filter(o => new Date(o.endDate) <= new Date()).length})
            </Text>
          </Pressable>
        </View>

        {/* Offers List */}
        <FlatList
          data={filteredOffers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.offersList}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <Card style={styles.emptyStateCard}>
              <Text variant="subtitle" center>No offers available</Text>
              <Text variant="body" color={colors.subtext} center style={styles.emptyStateText}>
                New offers will appear here as they become available.
              </Text>
              <Button 
                title="Refresh" 
                onPress={handleRefresh}
                style={styles.refreshButton}
              />
            </Card>
          }
        />
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
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  filterButton: {
    height: 44,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterTab: {
    borderRadius: 20,
  },
  offersList: {
    paddingBottom: 100, // Add bottom padding for tab bar
  },
  offerCard: {
    marginBottom: 16,
    padding: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  offerDetails: {
    flex: 1,
  },
  offerDescription: {
    marginBottom: 16,
  },
  offerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaIcon: {
    marginRight: 4,
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
  refreshButton: {
    marginTop: 8,
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