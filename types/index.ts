export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    primaryGoal: 'cashback' | 'points' | 'travel' | 'balance';
    notifications: boolean;
    darkMode: boolean;
  };
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  color: string;
  cardholderName: string;
  rewards: Reward[];
  limit: number;
  balance: number;
  isDefault: boolean;
}

export interface Reward {
  id: string;
  cardId: string;
  category: Category;
  rate: number; // percentage or points multiplier
  type: 'cashback' | 'points' | 'miles';
  maxAmount?: number; // maximum reward amount, if applicable
  minSpend?: number; // minimum spend to qualify
  startDate?: string;
  endDate?: string; // for temporary rewards
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  merchantName: string;
  amount: number;
  date: string;
  category: Category;
  rewardEarned: {
    amount: number;
    type: 'cashback' | 'points' | 'miles';
  };
  isRecurring: boolean;
  notes?: string;
}

export interface RewardsSummary {
  totalCashback: number;
  totalPoints: number;
  totalMiles: number;
  byCategory: {
    [categoryId: string]: {
      cashback: number;
      points: number;
      miles: number;
    };
  };
  byCard: {
    [cardId: string]: {
      cashback: number;
      points: number;
      miles: number;
    };
  };
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  type: 'card_switch' | 'new_card' | 'spending_habit';
  cardId?: string; // For card_switch recommendations
  categoryId?: string; // For category-specific recommendations
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  cardId: string;
  merchantName?: string;
  discount: number; // percentage
  minSpend?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActivated: boolean;
}