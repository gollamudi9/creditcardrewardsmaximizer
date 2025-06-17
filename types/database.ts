export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          preferences: {
            primaryGoal: 'cashback' | 'points' | 'travel' | 'balance';
            notifications: boolean;
            darkMode: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          preferences?: {
            primaryGoal?: 'cashback' | 'points' | 'travel' | 'balance';
            notifications?: boolean;
            darkMode?: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          preferences?: {
            primaryGoal?: 'cashback' | 'points' | 'travel' | 'balance';
            notifications?: boolean;
            darkMode?: boolean;
          };
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          color?: string;
        };
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          issuer: string;
          network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
          last_four_digits: string;
          expiry_month: number;
          expiry_year: number;
          color: string;
          cardholder_name: string;
          credit_limit: number;
          current_balance: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          issuer: string;
          network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
          last_four_digits: string;
          expiry_month: number;
          expiry_year: number;
          color: string;
          cardholder_name: string;
          credit_limit?: number;
          current_balance?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          issuer?: string;
          network?: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
          last_four_digits?: string;
          expiry_month?: number;
          expiry_year?: number;
          color?: string;
          cardholder_name?: string;
          credit_limit?: number;
          current_balance?: number;
          is_default?: boolean;
          updated_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          card_id: string;
          category_id: string;
          rate: number;
          type: 'cashback' | 'points' | 'miles';
          max_amount: number | null;
          min_spend: number | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          category_id: string;
          rate: number;
          type: 'cashback' | 'points' | 'miles';
          max_amount?: number | null;
          min_spend?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          category_id?: string;
          rate?: number;
          type?: 'cashback' | 'points' | 'miles';
          max_amount?: number | null;
          min_spend?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          card_id: string;
          category_id: string | null;
          merchant_name: string;
          amount: number;
          transaction_date: string;
          reward_earned_amount: number;
          reward_earned_type: 'cashback' | 'points' | 'miles' | null;
          is_recurring: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          category_id?: string | null;
          merchant_name: string;
          amount: number;
          transaction_date: string;
          reward_earned_amount?: number;
          reward_earned_type?: 'cashback' | 'points' | 'miles' | null;
          is_recurring?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          category_id?: string | null;
          merchant_name?: string;
          amount?: number;
          transaction_date?: string;
          reward_earned_amount?: number;
          reward_earned_type?: 'cashback' | 'points' | 'miles' | null;
          is_recurring?: boolean;
          notes?: string | null;
        };
      };
      offers: {
        Row: {
          id: string;
          card_id: string;
          title: string;
          description: string;
          merchant_name: string | null;
          discount_percentage: number;
          min_spend: number | null;
          max_discount: number | null;
          start_date: string;
          end_date: string;
          is_activated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          title: string;
          description: string;
          merchant_name?: string | null;
          discount_percentage: number;
          min_spend?: number | null;
          max_discount?: number | null;
          start_date: string;
          end_date: string;
          is_activated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          title?: string;
          description?: string;
          merchant_name?: string | null;
          discount_percentage?: number;
          min_spend?: number | null;
          max_discount?: number | null;
          start_date?: string;
          end_date?: string;
          is_activated?: boolean;
        };
      };
      recommendations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          potential_savings: number;
          type: 'card_switch' | 'new_card' | 'spending_habit';
          card_id: string | null;
          category_id: string | null;
          is_dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          potential_savings: number;
          type: 'card_switch' | 'new_card' | 'spending_habit';
          card_id?: string | null;
          category_id?: string | null;
          is_dismissed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          potential_savings?: number;
          type?: 'card_switch' | 'new_card' | 'spending_habit';
          card_id?: string | null;
          category_id?: string | null;
          is_dismissed?: boolean;
        };
      };
      plaid_credentials: {
        Row: {
          id: string;
          user_id: string;
          encrypted_access_token: string;
          item_id: string;
          last_sync_timestamp: string | null;
          status: 'active' | 'inactive' | 'error';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          encrypted_access_token: string;
          item_id: string;
          last_sync_timestamp?: string | null;
          status?: 'active' | 'inactive' | 'error';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_access_token?: string;
          item_id?: string;
          last_sync_timestamp?: string | null;
          status?: 'active' | 'inactive' | 'error';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}