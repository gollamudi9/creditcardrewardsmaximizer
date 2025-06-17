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

function checkRateLimit(userId: string, limit: number = 30): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const key = `refresh:${userId}`;
  
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
    const { item_id } = body;

    if (!item_id) {
      return Response.json(
        { error: 'Missing item_id' },
        { status: 400 }
      );
    }

    // Get Plaid credentials
    const { data: credential, error: credError } = await supabase
      .from('plaid_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', item_id)
      .eq('status', 'active')
      .single();

    if (credError || !credential) {
      return Response.json(
        { error: 'Plaid credential not found or inactive' },
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

    try {
      const accessToken = decryptAccessToken(credential.encrypted_access_token);

      // Refresh account data from Plaid
      const accountsResponse = await fetch(`${getPlaidUrl()}/accounts/get`, {
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

      if (!accountsResponse.ok) {
        const errorData = await accountsResponse.json();
        console.error('Plaid accounts refresh error:', errorData);
        
        // Mark credential as error if it's an auth issue
        if (errorData.error_code === 'ITEM_LOGIN_REQUIRED') {
          await supabase
            .from('plaid_credentials')
            .update({ status: 'error' })
            .eq('id', credential.id);
        }
        
        throw new Error(errorData.error_message || 'Failed to refresh accounts');
      }

      const accountsData = await accountsResponse.json();

      // Update credit card balances in our database
      for (const account of accountsData.accounts) {
        if (account.type === 'credit' && account.subtype === 'credit card') {
          // Find matching credit card in our database
          const { data: creditCard } = await supabase
            .from('credit_cards')
            .select('id')
            .eq('user_id', user.id)
            .eq('last_four_digits', account.mask || '')
            .single();

          if (creditCard) {
            // Update balances
            await supabase
              .from('credit_cards')
              .update({
                credit_limit: account.balances.limit || 0,
                current_balance: account.balances.current || 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', creditCard.id);
          }
        }
      }

      // Update last refresh timestamp
      await supabase
        .from('plaid_credentials')
        .update({ 
          last_sync_timestamp: new Date().toISOString(),
          status: 'active' // Reset status to active if it was in error
        })
        .eq('id', credential.id);

      // Log successful refresh (for monitoring)
      console.log(`Account refresh completed for user ${user.id}, item ${item_id}`);

      return Response.json({
        success: true,
        refreshedAt: new Date().toISOString(),
        accountsUpdated: accountsData.accounts.length,
        message: 'Account balances refreshed successfully',
      });

    } catch (error) {
      console.error('Plaid refresh error:', error);
      
      // Update credential status if there's an error
      await supabase
        .from('plaid_credentials')
        .update({ status: 'error' })
        .eq('id', credential.id);

      throw error;
    }

  } catch (error) {
    console.error('Refresh error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}