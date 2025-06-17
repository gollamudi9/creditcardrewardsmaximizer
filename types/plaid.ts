export interface PlaidLinkTokenRequest {
  user_id: string;
  client_name: string;
  products: string[];
  country_codes: string[];
  language: string;
  webhook?: string;
  link_customization_name?: string;
  account_filters?: {
    depository?: {
      account_subtypes: string[];
    };
    credit?: {
      account_subtypes: string[];
    };
  };
}

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

export interface PlaidExchangeTokenRequest {
  public_token: string;
}

export interface PlaidExchangeTokenResponse {
  access_token: string;
  item_id: string;
  request_id: string;
}

export interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
  mask: string | null;
  name: string;
  official_name: string | null;
  subtype: string | null;
  type: string;
}

export interface PlaidTransaction {
  account_id: string;
  amount: number;
  iso_currency_code: string | null;
  date: string;
  datetime: string | null;
  authorized_date: string | null;
  authorized_datetime: string | null;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
    lat: number | null;
    lon: number | null;
    store_number: string | null;
  };
  name: string;
  merchant_name: string | null;
  payment_channel: string;
  pending: boolean;
  pending_transaction_id: string | null;
  account_owner: string | null;
  transaction_id: string;
  transaction_code: string | null;
  transaction_type: string;
  category: string[] | null;
  category_id: string | null;
  check_number: string | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
  } | null;
}

export interface PlaidCredential {
  id: string;
  user_id: string;
  encrypted_access_token: string;
  item_id: string;
  last_sync_timestamp: string | null;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
}

export interface PlaidSyncRequest {
  start_date?: string;
  end_date?: string;
  account_ids?: string[];
}

export interface PlaidSyncResponse {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  total_transactions: number;
  request_id: string;
}

export interface PlaidError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message: string | null;
  request_id: string;
  causes: any[];
  status: number;
  documentation_url: string;
  suggested_action: string | null;
}