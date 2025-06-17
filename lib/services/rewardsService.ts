import { APIClient } from '../api/base';

export interface RedemptionRequest {
  type: 'points' | 'cashback' | 'miles';
  amount: number;
  redemptionMethod: 'statement_credit' | 'bank_transfer' | 'gift_card' | 'travel';
  destinationAccount?: string;
  giftCardBrand?: string;
}

export interface TransferRequest {
  fromCardId: string;
  toCardId: string;
  pointsAmount: number;
}

export interface RewardsHistory {
  id: string;
  type: 'earned' | 'redeemed' | 'transferred' | 'expired';
  amount: number;
  rewardType: 'points' | 'cashback' | 'miles';
  description: string;
  date: string;
  transactionId?: string;
}

export class RewardsService {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  async getRewardsSummary(): Promise<{
    totalPoints: number;
    totalCashback: number;
    totalMiles: number;
    byCard: Record<string, {
      points: number;
      cashback: number;
      miles: number;
    }>;
    byCategory: Record<string, {
      points: number;
      cashback: number;
      miles: number;
    }>;
  }> {
    return this.apiClient.get('/api/rewards/summary');
  }

  async redeemRewards(request: RedemptionRequest): Promise<{
    redemptionId: string;
    estimatedProcessingTime: string;
  }> {
    return this.apiClient.post('/api/rewards/redeem', request);
  }

  async transferPoints(request: TransferRequest): Promise<{
    transferId: string;
  }> {
    return this.apiClient.post('/api/rewards/transfer', request);
  }

  async getRewardsHistory(options?: {
    startDate?: string;
    endDate?: string;
    type?: 'earned' | 'redeemed' | 'transferred' | 'expired';
    limit?: number;
    offset?: number;
  }): Promise<{
    history: RewardsHistory[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return this.apiClient.get(`/api/rewards/history?${params}`);
  }

  async getRewardsCatalog(category?: string): Promise<{
    items: Array<{
      id: string;
      name: string;
      description: string;
      pointsCost: number;
      category: string;
      imageUrl: string;
      availability: 'available' | 'limited' | 'out_of_stock';
    }>;
  }> {
    const params = category ? `?category=${category}` : '';
    return this.apiClient.get(`/api/rewards/catalog${params}`);
  }

  async redeemCatalogItem(itemId: string, quantity: number = 1): Promise<{
    redemptionId: string;
    estimatedDelivery: string;
  }> {
    return this.apiClient.post('/api/rewards/catalog/redeem', {
      item_id: itemId,
      quantity,
    });
  }
}