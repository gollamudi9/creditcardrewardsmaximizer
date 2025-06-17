import { APIClient } from '../api/base';
import { Offer } from '@/types';

export interface OfferFilter {
  category?: string;
  merchant?: string;
  minDiscount?: number;
  maxDiscount?: number;
  isActivated?: boolean;
  isExpired?: boolean;
}

export class OffersService {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  async getOffers(filter?: OfferFilter): Promise<{
    offers: Offer[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.merchant) params.append('merchant', filter.merchant);
    if (filter?.minDiscount) params.append('min_discount', filter.minDiscount.toString());
    if (filter?.maxDiscount) params.append('max_discount', filter.maxDiscount.toString());
    if (filter?.isActivated !== undefined) params.append('is_activated', filter.isActivated.toString());
    if (filter?.isExpired !== undefined) params.append('is_expired', filter.isExpired.toString());

    return this.apiClient.get(`/api/offers?${params}`);
  }

  async activateOffer(offerId: string): Promise<{
    success: boolean;
    activationId: string;
  }> {
    return this.apiClient.post(`/api/offers/${offerId}/activate`);
  }

  async deactivateOffer(offerId: string): Promise<{
    success: boolean;
  }> {
    return this.apiClient.post(`/api/offers/${offerId}/deactivate`);
  }

  async saveOffer(offerId: string): Promise<{
    success: boolean;
  }> {
    return this.apiClient.post(`/api/offers/${offerId}/save`);
  }

  async unsaveOffer(offerId: string): Promise<{
    success: boolean;
  }> {
    return this.apiClient.delete(`/api/offers/${offerId}/save`);
  }

  async getSavedOffers(): Promise<{
    offers: Offer[];
  }> {
    return this.apiClient.get('/api/offers/saved');
  }

  async getOfferDetails(offerId: string): Promise<Offer & {
    terms: string;
    eligibilityRequirements: string[];
    usageHistory: Array<{
      date: string;
      amount: number;
      merchant: string;
      discountApplied: number;
    }>;
  }> {
    return this.apiClient.get(`/api/offers/${offerId}/details`);
  }

  async trackOfferUsage(offerId: string, transactionId: string): Promise<{
    success: boolean;
    discountApplied: number;
  }> {
    return this.apiClient.post(`/api/offers/${offerId}/track`, {
      transaction_id: transactionId,
    });
  }
}