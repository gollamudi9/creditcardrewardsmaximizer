import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    const { type, amount, redemptionMethod, destinationAccount, giftCardBrand } = body;

    // Validate required fields
    if (!type || !amount || !redemptionMethod) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validTypes = ['points', 'cashback', 'miles'];
    const validMethods = ['statement_credit', 'bank_transfer', 'gift_card', 'travel'];

    if (!validTypes.includes(type)) {
      return Response.json(
        { error: 'Invalid reward type' },
        { status: 400 }
      );
    }

    if (!validMethods.includes(redemptionMethod)) {
      return Response.json(
        { error: 'Invalid redemption method' },
        { status: 400 }
      );
    }

    // Validate minimum redemption amounts
    const minimums = {
      points: 2500,
      cashback: 25,
      miles: 5000,
    };

    if (amount < minimums[type as keyof typeof minimums]) {
      return Response.json(
        { error: `Minimum redemption amount for ${type} is ${minimums[type as keyof typeof minimums]}` },
        { status: 400 }
      );
    }

    // Get user's current rewards balance
    // In a real implementation, you'd calculate this from transactions
    // For demo purposes, we'll simulate checking the balance
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        reward_earned_amount,
        reward_earned_type,
        credit_cards!inner (user_id)
      `)
      .eq('credit_cards.user_id', user.id)
      .eq('reward_earned_type', type);

    if (transError) {
      return Response.json(
        { error: 'Failed to fetch rewards balance' },
        { status: 500 }
      );
    }

    const totalEarned = transactions?.reduce((sum, t) => sum + (t.reward_earned_amount || 0), 0) || 0;

    if (amount > totalEarned) {
      return Response.json(
        { error: 'Insufficient rewards balance' },
        { status: 400 }
      );
    }

    // Generate redemption ID
    const redemptionId = `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate processing time based on redemption method
    const processingTimes = {
      statement_credit: '1-2 business days',
      bank_transfer: '3-5 business days',
      gift_card: '1-2 business days',
      travel: '5-7 business days',
    };

    // In a real implementation, you would:
    // 1. Process the redemption through appropriate channels
    // 2. Create redemption record in database
    // 3. Update user's rewards balance
    // 4. Send confirmation notifications
    // 5. For gift cards, generate codes
    // 6. For travel, integrate with travel booking systems

    // Create redemption record (you'd need a redemptions table)
    const redemptionRecord = {
      id: redemptionId,
      user_id: user.id,
      type,
      amount,
      redemption_method: redemptionMethod,
      destination_account: destinationAccount,
      gift_card_brand: giftCardBrand,
      status: 'processing',
      created_at: new Date().toISOString(),
    };

    // For demo purposes, we'll simulate the response
    return Response.json({
      redemptionId,
      success: true,
      estimatedProcessingTime: processingTimes[redemptionMethod as keyof typeof processingTimes],
      confirmationNumber: `CONF${Date.now()}`,
      message: getRedemptionMessage(type, amount, redemptionMethod),
    });

  } catch (error) {
    console.error('Redemption processing error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRedemptionMessage(type: string, amount: number, method: string): string {
  const typeDisplay = type === 'cashback' ? `$${amount}` : `${amount} ${type}`;
  
  switch (method) {
    case 'statement_credit':
      return `${typeDisplay} will be applied as a statement credit to your account.`;
    case 'bank_transfer':
      return `${typeDisplay} will be transferred to your linked bank account.`;
    case 'gift_card':
      return `${typeDisplay} gift card will be sent to your email address.`;
    case 'travel':
      return `${typeDisplay} will be available for travel bookings through our travel portal.`;
    default:
      return `Your ${typeDisplay} redemption is being processed.`;
  }
}