import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Transaction } from '@/types';
import Text from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, CalendarClock } from 'lucide-react-native';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onPress 
}) => {
  const { colors, isDark } = useTheme();
  
  const handlePress = () => {
    if (onPress) {
      onPress(transaction);
    }
  };

  // Format transaction date to relative time (e.g., "2 days ago")
  const formattedDate = formatDistanceToNow(new Date(transaction.date), { addSuffix: true });

  return (
    <Pressable 
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View 
          style={[
            styles.categoryIcon, 
            { backgroundColor: transaction.category.color + '20' }
          ]}
        >
          {/* This should be replaced with the appropriate Lucide icon based on category */}
          <ArrowUpRight size={18} color={transaction.category.color} />
        </View>
        
        <View style={styles.merchantInfo}>
          <Text variant="subtitle" numberOfLines={1}>
            {transaction.merchantName}
          </Text>
          <View style={styles.dateContainer}>
            {transaction.isRecurring && (
              <CalendarClock size={12} color={colors.subtext} style={styles.recurringIcon} />
            )}
            <Text 
              variant="caption" 
              color={colors.subtext}
              numberOfLines={1}
            >
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text 
          variant="subtitle" 
          style={styles.amount}
          medium
        >
          ${transaction.amount.toFixed(2)}
        </Text>
        <View style={styles.rewardContainer}>
          <Text 
            variant="caption" 
            color={colors.success}
            style={styles.rewardText}
          >
            +{transaction.rewardEarned.amount.toFixed(0)} {transaction.rewardEarned.type === 'cashback' ? '%' : transaction.rewardEarned.type}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  merchantInfo: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recurringIcon: {
    marginRight: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
  },
  rewardContainer: {
    marginTop: 4,
  },
  rewardText: {
    fontSize: 12,
  },
});

export default TransactionItem;