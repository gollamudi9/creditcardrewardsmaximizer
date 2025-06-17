import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const plaidClientId = process.env.PLAID_CLIENT_ID!;
const plaidSecret = process.env.PLAID_SECRET!;
const plaidEnvironment = process.env.PLAID_ENVIRONMENT || 'sandbox';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
function checkRateLimit(userId: string, limit: number = 100): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const key = `create-link-token:${userId}`;
  
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
    const { user_id, client_name, products, country_codes, language, account_filters } = body;

    // Validate required fields
    if (!user_id || user_id !== user.id) {
      return Response.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prepare Plaid API request
    const plaidRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      client_name: client_name || 'Credit Card Rewards Tracker',
      country_codes: country_codes || ['US'],
      language: language || 'en',
      user: {
        client_user_id: user_id,
      },
      products: products || ['transactions'],
      account_filters: account_filters || {
        credit: {
          account_subtypes: ['credit card'],
        },
      },
    };

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

    // Call Plaid API
    const plaidResponse = await fetch(`${getPlaidUrl()}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plaidRequest),
    });

    if (!plaidResponse.ok) {
      const errorData = await plaidResponse.json();
      console.error('Plaid API error:', errorData);
      
      return Response.json(
        { 
          error: 'Failed to create link token',
          details: errorData.error_message || 'Unknown error'
        },
        { status: plaidResponse.status }
      );
    }

    const plaidData = await plaidResponse.json();

    // Log successful request (for monitoring)
    console.log(`Link token created for user ${user.id}`);

    return Response.json({
      link_token: plaidData.link_token,
      expiration: plaidData.expiration,
      request_id: plaidData.request_id,
    });

  } catch (error) {
    console.error('Create link token error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}