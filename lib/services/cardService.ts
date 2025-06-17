import { APIClient } from '../api/base';
import { CreditCard } from '@/types';

export interface PaymentRequest {
  cardId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'debit_card';
  accountId?: string;
}

export interface CardIssueReport {
  cardId: string;
  issueType: 'lost' | 'stolen' | 'fraud';
  description: string;
  lastKnownLocation?: string;
}

export class CardService {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  async getCards(): Promise<CreditCard[]> {
    return this.apiClient.get('/api/cards');
  }

  async getCard(cardId: string): Promise<CreditCard> {
    return this.apiClient.get(`/api/cards/${cardId}`);
  }

  async makePayment(paymentRequest: PaymentRequest): Promise<{ transactionId: string }> {
    return this.apiClient.post('/api/cards/payment', paymentRequest);
  }

  async reportIssue(report: CardIssueReport): Promise<{ reportId: string }> {
    return this.apiClient.post('/api/cards/report-issue', report);
  }

  async updateCardSettings(cardId: string, settings: {
    isDefault?: boolean;
    notificationsEnabled?: boolean;
    spendingLimits?: {
      daily?: number;
      monthly?: number;
    };
  }): Promise<void> {
    return this.apiClient.put(`/api/cards/${cardId}/settings`, settings);
  }

  async freezeCard(cardId: string): Promise<void> {
    return this.apiClient.post(`/api/cards/${cardId}/freeze`);
  }

  async unfreezeCard(cardId: string): Promise<void> {
    return this.apiClient.post(`/api/cards/${cardId}/unfreeze`);
  }

  async getTransactions(cardId: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    transactions: any[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return this.apiClient.get(`/api/cards/${cardId}/transactions?${params}`);
  }
}