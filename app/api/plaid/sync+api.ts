import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const plaidClientId = process.env.PLAID_CLIENT_ID!;
const plaidSecret = process.env.PLAID_SECRET!;
const plaidEnvironment = process.env.PLAID_ENVIRONMENT || 'sandbox';
const encryptionKey = process.env.ENCRYPTION_KEY!;

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, limit: number = 20): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const key = `sync:${userId}`;
  
  const userLimit = rateLimitStore.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + hourInMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// AES-256 decryption
function decryptAccessToken(encryptedToken: string): string {
  const algorithm = 'aes-256-gcm';
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipher(algorithm, encryptionKey);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      return Response.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { item_id, start_date, end_date, account_ids } = body;

    // Get Plaid credentials
    let credentialsQuery = supabase
      .from('plaid_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (item_id) {
      credentialsQuery = credentialsQuery.eq('item_id', item_id);
    }

    const { data: credentials, error: credError } = await credentialsQuery;

    if (credError || !credentials || credentials.length === 0) {
      return Response.json(
        { error: 'No active Plaid credentials found' },
        { status: 404 }
      );
    }

    // Get Plaid environment URL
    const getPlaidUrl = () => {
      switch (plaidEnvironment) {
        case 'production':
          return 'https://production.plaid.com';
        case 'development':
          return 'https://development.plaid.com';
        default:
          return 'https://sandbox.plaid.com';
      }
    };

    const allAccounts: any[] = [];
    const allTransactions: any[] = [];

    // Sync data for each credential
    for (const credential of credentials) {
      try {
        const accessToken = decryptAccessToken(credential.encrypted_access_token);

        // Fetch accounts with retry logic
        const accountsData = await retryWithBackoff(async () => {
          const response = await fetch(`${getPlaidUrl()}/accounts/get`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: plaidClientId,
              secret: plaidSecret,
              access_token: accessToken,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Plaid accounts error: ${errorData.error_message}`);
          }

          return response.json();
        });

        allAccounts.push(...accountsData.accounts);

        // Fetch transactions with retry logic
        const transactionsData = await retryWithBackoff(async () => {
          const response = await fetch(`${getPlaidUrl()}/transactions/get`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: plaidClientId,
              secret: plaidSecret,
              access_token: accessToken,
              start_date: start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end_date: end_date || new Date().toISOString().split('T')[0],
              account_ids: account_ids,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Plaid transactions error: ${errorData.error_message}`);
          }

          return response.json();
        });

        allTransactions.push(...transactionsData.transactions);

        // Update last sync timestamp
        await supabase
          .from('plaid_credentials')
          .update({ last_sync_timestamp: new Date().toISOString() })
          .eq('id', credential.id);

      } catch (error) {
        console.error(`Sync error for credential ${credential.id}:`, error);
        
        // Mark credential as error status
        await supabase
          .from('plaid_credentials')
          .update({ status: 'error' })
          .eq('id', credential.id);
      }
    }

    // Log successful sync (for monitoring)
    console.log(`Sync completed for user ${user.id}: ${allAccounts.length} accounts, ${allTransactions.length} transactions`);

    return Response.json({
      accounts: allAccounts,
      transactions: allTransactions,
      total_transactions: allTransactions.length,
      request_id: `sync_${Date.now()}`,
    });

  } catch (error) {
    console.error('Sync error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}