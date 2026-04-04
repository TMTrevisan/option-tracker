import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

import { Snaptrade } from 'snaptrade-typescript-sdk';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.SNAPTRADE_CLIENT_ID?.trim();
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY?.trim();

  if (!clientId || !consumerKey) {
    return NextResponse.json({ error: 'SnapTrade credentials missing' }, { status: 500 });
  }

  const snaptrade = new Snaptrade({
     clientId: clientId,
     consumerKey: consumerKey
  });

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Try fetching from private table first
    const { data: secretRecord } = await supabaseAdmin
      .from('private_user_secrets')
      .select('snaptrade_secret')
      .eq('user_id', user.id)
      .single();

    let userSecret = secretRecord?.snaptrade_secret;

    // 2. Fallback to metadata if migration hasn't moved it yet
    if (!userSecret && user.user_metadata?.snaptrade_secret) {
        userSecret = user.user_metadata.snaptrade_secret;
        // Auto-migrate it to the new table
        await supabaseAdmin.from('private_user_secrets').upsert({
            user_id: user.id,
            snaptrade_secret: userSecret
        }, { onConflict: 'user_id' });
    }

    if (!userSecret) {
      // 3. Register User on SnapTrade
      const registerResponse = await snaptrade.authentication.registerSnapTradeUser({ userId: user.id });
      userSecret = registerResponse.data?.userSecret;

      if (!userSecret) {
        return NextResponse.json({ error: `SnapTrade registration failed. Raw response: ${JSON.stringify(registerResponse.data)}` }, { status: 500 });
      }

      // Persist the secret to the private table ONLY
      await supabaseAdmin.from('private_user_secrets').upsert({
        user_id: user.id,
        snaptrade_secret: userSecret
      }, { onConflict: 'user_id' });
    }

    // 2. Generate secure Connection Portal URL
    const loginResponse = await snaptrade.authentication.loginSnapTradeUser({ userId: user.id, userSecret: userSecret });
    const loginData = loginResponse.data as any;
    
    if (loginData?.redirectURI) {
       return NextResponse.json({ url: loginData.redirectURI });
    }

    throw new Error('No redirect URI provided by SnapTrade');
    
  } catch (error: any) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : (error as Error).message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
