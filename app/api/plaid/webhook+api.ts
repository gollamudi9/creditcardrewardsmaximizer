import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const plaidClientId = process.env.PLAID_CLIENT_ID!;
const plaidSecret = process.env.PLAID_SECRET!;
const plaidEnvironment = process.env.PLAID_ENVIRONMENT || 'sandbox';
const webhookVerificationKey = process.env.PLAID_WEBHOOK_VERIFICATION_KEY;

// Verify webhook signature (if verification key is provided)
function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!webhookVerificationKey) {
    console.warn('Webhook verification key not configured');
    return true; // Skip verification in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookVerificationKey)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('plaid-verification') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return Response.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    const { webhook_type, webhook_code, item_id, error: webhookError } = webhookData;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the credential associated with this item
    const { data: credential, error: credError } = await supabase
      .from('plaid_credentials')
      .select('*')
      .eq('item_id', item_id)
      .single();

    if (credError || !credential) {
      console.error('Credential not found for item:', item_id);
      return Response.json({ error: 'Credential not found' }, { status: 404 });
    }

    const actions: string[] = [];

    // Handle different webhook types
    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhookData, credential, supabase, actions);
        break;
      
      case 'ITEM':
        await handleItemWebhook(webhookData, credential, supabase, actions);
        break;
      
      case 'AUTH':
        await handleAuthWebhook(webhookData, credential, supabase, actions);
        break;
      
      case 'ASSETS':
        await handleAssetsWebhook(webhookData, credential, supabase, actions);
        break;
      
      default:
        console.log(`Unhandled webhook type: ${webhook_type}`);
        actions.push(`Received unhandled webhook type: ${webhook_type}`);
    }

    // Log webhook processing
    console.log(`Processed webhook: ${webhook_type}/${webhook_code} for item ${item_id}`);

    return Response.json({
      processed: true,
      actions,
      webhook_type,
      webhook_code,
      item_id,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTransactionsWebhook(
  webhookData: any,
  credential: any,
  supabase: any,
  actions: string[]
) {
  const { webhook_code, new_transactions, removed_transactions } = webhookData;

  switch (webhook_code) {
    case 'INITIAL_UPDATE':
      actions.push('Initial transaction data available');
      // Trigger initial sync
      await triggerSync(credential, supabase);
      break;
    
    case 'HISTORICAL_UPDATE':
      actions.push('Historical transaction data updated');
      // Trigger historical sync
      await triggerSync(credential, supabase);
      break;
    
    case 'DEFAULT_UPDATE':
      if (new_transactions > 0) {
        actions.push(`${new_transactions} new transactions available`);
        // Trigger incremental sync
        await triggerSync(credential, supabase);
      }
      
      if (removed_transactions && removed_transactions.length > 0) {
        actions.push(`${removed_transactions.length} transactions removed`);
        // Handle removed transactions
        await handleRemovedTransactions(removed_transactions, credential, supabase);
      }
      break;
    
    case 'TRANSACTIONS_REMOVED':
      if (removed_transactions && removed_transactions.length > 0) {
        actions.push(`${removed_transactions.length} transactions removed`);
        await handleRemovedTransactions(removed_transactions, credential, supabase);
      }
      break;
  }
}

async function handleItemWebhook(
  webhookData: any,
  credential: any,
  supabase: any,
  actions: string[]
) {
  const { webhook_code, error: itemError } = webhookData;

  switch (webhook_code) {
    case 'ERROR':
      actions.push('Item error detected');
      // Update credential status
      await supabase
        .from('plaid_credentials')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', credential.id);
      
      // Notify user about the error
      await notifyUserOfError(credential, itemError, supabase);
      break;
    
    case 'PENDING_EXPIRATION':
      actions.push('Item access will expire soon');
      // Notify user to re-authenticate
      await notifyUserOfExpiration(credential, supabase);
      break;
    
    case 'USER_PERMISSION_REVOKED':
      actions.push('User revoked access');
      // Deactivate credential
      await supabase
        .from('plaid_credentials')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', credential.id);
      break;
    
    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      actions.push('Webhook update acknowledged');
      break;
  }
}

async function handleAuthWebhook(
  webhookData: any,
  credential: any,
  supabase: any,
  actions: string[]
) {
  const { webhook_code } = webhookData;

  switch (webhook_code) {
    case 'AUTOMATICALLY_VERIFIED':
      actions.push('Account automatically verified');
      break;
    
    case 'VERIFICATION_EXPIRED':
      actions.push('Account verification expired');
      // Update credential status
      await supabase
        .from('plaid_credentials')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', credential.id);
      break;
  }
}

async function handleAssetsWebhook(
  webhookData: any,
  credential: any,
  supabase: any,
  actions: string[]
) {
  const { webhook_code } = webhookData;

  switch (webhook_code) {
    case 'PRODUCT_READY':
      actions.push('Assets product ready');
      break;
    
    case 'ERROR':
      actions.push('Assets error detected');
      break;
  }
}

async function triggerSync(credential: any, supabase: any) {
  // In a real implementation, you might queue a background job
  // For now, we'll just update the last sync timestamp to indicate sync is needed
  await supabase
    .from('plaid_credentials')
    .update({ 
      // You could add a 'sync_needed' flag or similar
      updated_at: new Date().toISOString()
    })
    .eq('id', credential.id);
}

async function handleRemovedTransactions(
  removedTransactionIds: string[],
  credential: any,
  supabase: any
) {
  // Remove transactions from our database
  // Note: You'd need to store the external transaction ID to match them
  for (const transactionId of removedTransactionIds) {
    await supabase
      .from('transactions')
      .delete()
      .eq('external_transaction_id', transactionId);
  }
}

async function notifyUserOfError(credential: any, error: any, supabase: any) {
  // In a real implementation, you'd send push notifications, emails, etc.
  console.log(`User ${credential.user_id} needs to re-authenticate item ${credential.item_id}`);
  
  // You could create a notification record
  // await supabase.from('notifications').insert({
  //   user_id: credential.user_id,
  //   type: 'account_error',
  //   title: 'Account Connection Issue',
  //   message: 'Please reconnect your account to continue receiving updates.',
  //   data: { item_id: credential.item_id, error }
  // });
}

async function notifyUserOfExpiration(credential: any, supabase: any) {
  // Notify user that they need to re-authenticate soon
  console.log(`User ${credential.user_id} item ${credential.item_id} will expire soon`);
  
  // You could create a notification record
  // await supabase.from('notifications').insert({
  //   user_id: credential.user_id,
  //   type: 'account_expiring',
  //   title: 'Account Access Expiring',
  //   message: 'Please re-authenticate your account to maintain access.',
  //   data: { item_id: credential.item_id }
  // });
}