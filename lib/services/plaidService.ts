import { APIClient } from '../api/base';
import { PlaidLinkTokenResponse, PlaidAccount, PlaidTransaction } from '@/types/plaid';

export interface PlaidSyncOptions {
  itemId?: string;
  startDate?: string;
  endDate?: string;
  accountIds?: string[];
  includePersonalFinanceCategory?: boolean;
}

export interface PlaidWebhookData {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error?: any;
  new_transactions?: number;
  removed_transactions?: string[];
}

export class PlaidService {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  async createLinkToken(userId: string, options?: {
    products?: string[];
    countryCodes?: string[];
    webhook?: string;
    linkCustomizationName?: string;
  }): Promise<PlaidLinkTokenResponse> {
    return this.apiClient.post('/api/plaid/create-link-token', {
      user_id: userId,
      client_name: 'Credit Card Rewards Tracker',
      products: options?.products || ['transactions', 'accounts'],
      country_codes: options?.countryCodes || ['US'],
      language: 'en',
      webhook: options?.webhook,
      link_customization_name: options?.linkCustomizationName,
      account_filters: {
        credit: {
          account_subtypes: ['credit card'],
        },
      },
    });
  }

  async exchangePublicToken(publicToken: string): Promise<{ itemId: string }> {
    return this.apiClient.post('/api/plaid/exchange-token', {
      public_token: publicToken,
    });
  }

  async syncAccounts(options?: PlaidSyncOptions): Promise<{
    accounts: PlaidAccount[];
    transactions: PlaidTransaction[];
    totalTransactions: number;
    hasMore: boolean;
  }> {
    return this.apiClient.post('/api/plaid/sync', {
      item_id: options?.itemId,
      start_date: options?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: options?.endDate || new Date().toISOString().split('T')[0],
      account_ids: options?.accountIds,
      include_personal_finance_category: options?.includePersonalFinanceCategory || true,
    });
  }

  async disconnectAccount(itemId: string): Promise<void> {
    return this.apiClient.post('/api/plaid/disconnect', {
      item_id: itemId,
    });
  }

  async getAccountBalances(itemId: string): Promise<PlaidAccount[]> {
    return this.apiClient.get(`/api/plaid/accounts/${itemId}`);
  }

  async refreshAccountData(itemId: string): Promise<{
    success: boolean;
    refreshedAt: string;
  }> {
    return this.apiClient.post('/api/plaid/refresh', {
      item_id: itemId,
    });
  }

  async getItemStatus(itemId: string): Promise<{
    item: {
      item_id: string;
      institution_id: string;
      webhook: string;
      error: any;
      available_products: string[];
      billed_products: string[];
      consent_expiration_time: string;
      update_type: string;
    };
    status: {
      investments: any;
      transactions: any;
      last_successful_update: string;
      last_failed_update: string;
    };
  }> {
    return this.apiClient.get(`/api/plaid/item/${itemId}/status`);
  }

  async handleWebhook(webhookData: PlaidWebhookData): Promise<{
    processed: boolean;
    actions: string[];
  }> {
    return this.apiClient.post('/api/plaid/webhook', webhookData);
  }

  async getInstitutions(query?: string, products?: string[]): Promise<{
    institutions: Array<{
      institution_id: string;
      name: string;
      products: string[];
      country_codes: string[];
      url: string;
      primary_color: string;
      logo: string;
      routing_numbers: string[];
    }>;
  }> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (products) params.append('products', products.join(','));

    return this.apiClient.get(`/api/plaid/institutions?${params}`);
  }

  async updateWebhook(itemId: string, webhook: string): Promise<{
    item: {
      item_id: string;
      webhook: string;
    };
  }> {
    return this.apiClient.post('/api/plaid/webhook/update', {
      item_id: itemId,
      webhook,
    });
  }

  async getCategories(): Promise<{
    categories: Array<{
      category_id: string;
      group: string;
      hierarchy: string[];
    }>;
  }> {
    return this.apiClient.get('/api/plaid/categories');
  }

  async searchTransactions(itemId: string, query: {
    accountIds?: string[];
    startDate?: string;
    endDate?: string;
    searchTerms?: string[];
    minAmount?: number;
    maxAmount?: number;
  }): Promise<{
    transactions: PlaidTransaction[];
    total: number;
  }> {
    return this.apiClient.post('/api/plaid/transactions/search', {
      item_id: itemId,
      ...query,
    });
  }
}