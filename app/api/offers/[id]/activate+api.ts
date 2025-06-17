import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const offerId = params.id;

    // Get offer details and verify user has access to the associated card
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        credit_cards!inner (
          id,
          user_id,
          name
        )
      `)
      .eq('id', offerId)
      .eq('credit_cards.user_id', user.id)
      .single();

    if (offerError || !offer) {
      return Response.json(
        { error: 'Offer not found or access denied' },
        { status: 404 }
      );
    }

    // Check if offer is already activated
    if (offer.is_activated) {
      return Response.json(
        { error: 'Offer is already activated' },
        { status: 400 }
      );
    }

    // Check if offer is expired
    if (new Date(offer.end_date) <= new Date()) {
      return Response.json(
        { error: 'Offer has expired' },
        { status: 400 }
      );
    }

    // Check if offer hasn't started yet
    if (new Date(offer.start_date) > new Date()) {
      return Response.json(
        { error: 'Offer is not yet available' },
        { status: 400 }
      );
    }

    // Generate activation ID
    const activationId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Activate the offer
    const { error: updateError } = await supabase
      .from('offers')
      .update({ 
        is_activated: true,
        // In a real implementation, you might add activation_date, activation_id, etc.
      })
      .eq('id', offerId);

    if (updateError) {
      return Response.json(
        { error: 'Failed to activate offer' },
        { status: 500 }
      );
    }

    // In a real implementation, you would:
    // 1. Register the offer with the payment processor
    // 2. Set up automatic discount application
    // 3. Send confirmation notifications
    // 4. Log the activation for analytics
    // 5. Check for any activation limits or conflicts

    return Response.json({
      success: true,
      activationId,
      message: `Offer "${offer.title}" has been activated on your ${offer.credit_cards.name}`,
      activatedAt: new Date().toISOString(),
      expiresAt: offer.end_date,
      terms: generateOfferTerms(offer),
    });

  } catch (error) {
    console.error('Offer activation error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateOfferTerms(offer: any): string[] {
  const terms = [
    `Offer valid until ${new Date(offer.end_date).toLocaleDateString()}`,
    `Discount: ${offer.discount_percentage}% off`,
  ];

  if (offer.min_spend) {
    terms.push(`Minimum spend: $${offer.min_spend}`);
  }

  if (offer.max_discount) {
    terms.push(`Maximum discount: $${offer.max_discount}`);
  }

  if (offer.merchant_name) {
    terms.push(`Valid only at ${offer.merchant_name}`);
  }

  terms.push('Offer cannot be combined with other promotions');
  terms.push('Discount will be applied automatically to qualifying purchases');

  return terms;
}