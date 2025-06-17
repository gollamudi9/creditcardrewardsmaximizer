import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types';
import { useAuth } from './useAuth';

export function useTransactions(cardId?: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('transactions')
        .select(`
          *,
          credit_cards!inner (user_id),
          categories (*)
        `)
        .eq('credit_cards.user_id', user.id)
        .order('transaction_date', { ascending: false });

      // Filter by card if cardId is provided
      if (cardId) {
        query = query.eq('card_id', cardId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform the data to match our Transaction type
      const transformedTransactions: Transaction[] = data?.map(transaction => ({
        id: transaction.id,
        cardId: transaction.card_id,
        merchantName: transaction.merchant_name,
        amount: transaction.amount,
        date: transaction.transaction_date,
        category: transaction.categories ? {
          id: transaction.categories.id,
          name: transaction.categories.name,
          icon: transaction.categories.icon,
          color: transaction.categories.color,
        } : {
          id: '8',
          name: 'Other',
          icon: 'more-horizontal',
          color: '#607D8B',
        },
        rewardEarned: {
          amount: transaction.reward_earned_amount,
          type: transaction.reward_earned_type || 'points',
        },
        isRecurring: transaction.is_recurring,
        notes: transaction.notes,
      })) || [];

      setTransactions(transformedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          card_id: transactionData.cardId,
          category_id: transactionData.category.id,
          merchant_name: transactionData.merchantName,
          amount: transactionData.amount,
          transaction_date: transactionData.date,
          reward_earned_amount: transactionData.rewardEarned.amount,
          reward_earned_type: transactionData.rewardEarned.type,
          is_recurring: transactionData.isRecurring,
          notes: transactionData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTransactions(); // Refresh the transactions list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, cardId]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
  };
}