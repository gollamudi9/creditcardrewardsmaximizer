import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const plaidClientId = process.env.PLAID_CLIENT_ID!;
const plaidSecret = process.env.PLAID_SECRET!;
const plaidEnvironment = process.env.PLAID_ENVIRONMENT || 'sandbox';
const encryptionKey = process.env.ENCRYPTION_KEY!;

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
      .single();

    if (credError || !credential) {
      return Response.json(
        { error: 'Plaid credential not found' },
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

      // Remove item from Plaid
      const plaidResponse = await fetch(`${getPlaidUrl()}/item/remove`, {
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

      if (!plaidResponse.ok) {
        const errorData = await plaidResponse.json();
        console.error('Plaid disconnect error:', errorData);
        
        // Continue with local cleanup even if Plaid API fails
      }
    } catch (error) {
      console.error('Error calling Plaid disconnect:', error);
      // Continue with local cleanup
    }

    // Update credential status to inactive
    const { error: updateError } = await supabase
      .from('plaid_credentials')
      .update({ status: 'inactive' })
      .eq('id', credential.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return Response.json(
        { error: 'Failed to update credential status' },
        { status: 500 }
      );
    }

    // Log successful disconnect (for monitoring)
    console.log(`Account disconnected for user ${user.id}, item ${item_id}`);

    return Response.json({
      success: true,
      message: 'Account successfully disconnected',
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}