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
    const { cardId, issueType, description, lastKnownLocation } = body;

    // Validate required fields
    if (!cardId || !issueType || !description) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validIssueTypes = ['lost', 'stolen', 'fraud'];
    if (!validIssueTypes.includes(issueType)) {
      return Response.json(
        { error: 'Invalid issue type' },
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

    // Generate report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would:
    // 1. Create a card_issues table to track reports
    // 2. Automatically freeze the card for lost/stolen reports
    // 3. Send notifications to fraud department
    // 4. Generate replacement card request
    // 5. Send confirmation email/SMS to user

    // For demo purposes, we'll simulate the process
    let cardStatus = card.status || 'active';
    
    if (issueType === 'lost' || issueType === 'stolen') {
      cardStatus = 'frozen';
      
      // Update card status to frozen
      const { error: updateError } = await supabase
        .from('credit_cards')
        .update({ 
          // Note: We'd need to add a status column to the credit_cards table
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (updateError) {
        console.error('Failed to update card status:', updateError);
      }
    }

    // In a real app, you'd insert into a card_issues table
    // For now, we'll just simulate the response

    return Response.json({
      reportId,
      success: true,
      status: cardStatus,
      message: getIssueResponseMessage(issueType),
      nextSteps: getNextSteps(issueType),
      estimatedResolution: getEstimatedResolution(issueType),
    });

  } catch (error) {
    console.error('Issue reporting error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getIssueResponseMessage(issueType: string): string {
  switch (issueType) {
    case 'lost':
      return 'Your card has been reported as lost and has been temporarily frozen for your security.';
    case 'stolen':
      return 'Your card has been reported as stolen and has been immediately frozen. We will investigate any unauthorized transactions.';
    case 'fraud':
      return 'We have received your fraud report and will investigate the suspicious activity immediately.';
    default:
      return 'Your issue has been reported and is being processed.';
  }
}

function getNextSteps(issueType: string): string[] {
  switch (issueType) {
    case 'lost':
      return [
        'A replacement card will be expedited to your address',
        'Monitor your account for any unauthorized transactions',
        'Contact us if you find your card before the replacement arrives',
      ];
    case 'stolen':
      return [
        'File a police report if you haven\'t already',
        'A replacement card will be expedited to your address',
        'We will investigate any unauthorized transactions',
        'You will not be liable for fraudulent charges',
      ];
    case 'fraud':
      return [
        'We will investigate the reported transactions',
        'Temporary credits may be applied while we investigate',
        'You may receive a call from our fraud department',
        'Consider changing your online banking passwords',
      ];
    default:
      return ['We will contact you with updates on your case'];
  }
}

function getEstimatedResolution(issueType: string): string {
  switch (issueType) {
    case 'lost':
    case 'stolen':
      return 'Replacement card: 1-2 business days';
    case 'fraud':
      return 'Investigation: 5-10 business days';
    default:
      return '3-5 business days';
  }
}