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
    const { cardId, amount, paymentMethod, accountId } = body;

    // Validate required fields
    if (!cardId || !amount || !paymentMethod) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return Response.json(
        { error: 'Payment amount must be positive' },
        { status: 400 }
      );
    }

    // Verify card ownership
    const { data: card, error: cardError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return Response.json(
        { error: 'Card not found or access denied' },
        { status: 404 }
      );
    }

    // Validate payment amount doesn't exceed balance
    if (amount > card.current_balance) {
      return Response.json(
        { error: 'Payment amount exceeds current balance' },
        { status: 400 }
      );
    }

    // Generate transaction ID
    const transactionId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would:
    // 1. Process payment through payment processor (Stripe, etc.)
    // 2. Update card balance
    // 3. Create payment record
    // 4. Send confirmation notifications

    // For demo purposes, we'll simulate a successful payment
    const newBalance = card.current_balance - amount;

    // Update card balance
    const { error: updateError } = await supabase
      .from('credit_cards')
      .update({ 
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId);

    if (updateError) {
      return Response.json(
        { error: 'Failed to update card balance' },
        { status: 500 }
      );
    }

    // Create payment transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        card_id: cardId,
        merchant_name: 'Payment',
        amount: -amount, // Negative for payment
        transaction_date: new Date().toISOString(),
        reward_earned_amount: 0,
        reward_earned_type: null,
        is_recurring: false,
        notes: `Payment via ${paymentMethod}`,
      });

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
      // Don't fail the payment for this, just log it
    }

    return Response.json({
      transactionId,
      success: true,
      newBalance,
      message: 'Payment processed successfully',
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}