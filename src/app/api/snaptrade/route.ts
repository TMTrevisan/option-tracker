import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

  try {
    // 1. Register User on SnapTrade
    const registerResponse = await snaptrade.authentication.registerSnapTradeUser({ userId: user.id });
    const userSecret = registerResponse.data?.userSecret;

    if (!userSecret) {
      return NextResponse.json({ error: `SnapTrade registration failed. Raw response: ${JSON.stringify(registerResponse.data)}` }, { status: 500 });
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
