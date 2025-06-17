import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard } from '@/types';
import { useAuth } from './useAuth';

export function useCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch cards with their rewards and categories
      const { data: cardsData, error: cardsError } = await supabase
        .from('credit_cards')
        .select(`
          *,
          rewards (
            *,
            categories (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Transform the data to match our CreditCard type
      const transformedCards: CreditCard[] = cardsData?.map(card => ({
        id: card.id,
        userId: card.user_id,
        name: card.name,
        issuer: card.issuer,
        network: card.network,
        lastFourDigits: card.last_four_digits,
        expiryMonth: card.expiry_month,
        expiryYear: card.expiry_year,
        color: card.color,
        cardholderName: card.cardholder_name,
        limit: card.credit_limit,
        balance: card.current_balance,
        isDefault: card.is_default,
        rewards: card.rewards?.map(reward => ({
          id: reward.id,
          cardId: reward.card_id,
          category: {
            id: reward.categories.id,
            name: reward.categories.name,
            icon: reward.categories.icon,
            color: reward.categories.color,
          },
          rate: reward.rate,
          type: reward.type,
          maxAmount: reward.max_amount,
          minSpend: reward.min_spend,
          startDate: reward.start_date,
          endDate: reward.end_date,
          isActive: reward.is_active,
        })) || [],
      })) || [];

      setCards(transformedCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (cardData: Omit<CreditCard, 'id' | 'userId' | 'rewards'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: user.id,
          name: cardData.name,
          issuer: cardData.issuer,
          network: cardData.network,
          last_four_digits: cardData.lastFourDigits,
          expiry_month: cardData.expiryMonth,
          expiry_year: cardData.expiryYear,
          color: cardData.color,
          cardholder_name: cardData.cardholderName,
          credit_limit: cardData.limit,
          current_balance: cardData.balance,
          is_default: cardData.isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCards(); // Refresh the cards list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const updateCard = async (cardId: string, updates: Partial<CreditCard>) => {
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .update({
          name: updates.name,
          issuer: updates.issuer,
          network: updates.network,
          last_four_digits: updates.lastFourDigits,
          expiry_month: updates.expiryMonth,
          expiry_year: updates.expiryYear,
          color: updates.color,
          cardholder_name: updates.cardholderName,
          credit_limit: updates.limit,
          current_balance: updates.balance,
          is_default: updates.isDefault,
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      await fetchCards(); // Refresh the cards list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      await fetchCards(); // Refresh the cards list
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  return {
    cards,
    loading,
    error,
    fetchCards,
    addCard,
    updateCard,
    deleteCard,
  };
}