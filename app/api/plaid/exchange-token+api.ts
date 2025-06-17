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

function checkRateLimit(userId: string, limit: number = 50): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const key = `exchange-token:${userId}`;
  
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

// AES-256 encryption
function encryptAccessToken(accessToken: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, encryptionKey);
  
  let encrypted = cipher.update(accessToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
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
    const { public_token } = body;

    if (!public_token) {
      return Response.json(
        { error: 'Missing public_token' },
        { status: 400 }
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

    // Exchange public token for access token
    const plaidRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      public_token,
    };

    const plaidResponse = await fetch(`${getPlaidUrl()}/link/token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plaidRequest),
    });

    if (!plaidResponse.ok) {
      const errorData = await plaidResponse.json();
      console.error('Plaid exchange token error:', errorData);
      
      return Response.json(
        { 
          error: 'Failed to exchange token',
          details: errorData.error_message || 'Unknown error'
        },
        { status: plaidResponse.status }
      );
    }

    const plaidData = await plaidResponse.json();

    // Encrypt the access token
    const encryptedAccessToken = encryptAccessToken(plaidData.access_token);

    // Store credentials in database
    const { error: dbError } = await supabase
      .from('plaid_credentials')
      .insert({
        user_id: user.id,
        encrypted_access_token: encryptedAccessToken,
        item_id: plaidData.item_id,
        status: 'active',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return Response.json(
        { error: 'Failed to store credentials' },
        { status: 500 }
      );
    }

    // Log successful exchange (for monitoring)
    console.log(`Token exchanged for user ${user.id}, item ${plaidData.item_id}`);

    return Response.json({
      access_token: 'encrypted', // Don't return the actual token
      item_id: plaidData.item_id,
      request_id: plaidData.request_id,
    });

  } catch (error) {
    console.error('Exchange token error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}