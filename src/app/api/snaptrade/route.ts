import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    return NextResponse.json({ error: 'SnapTrade credentials missing from Environment' }, { status: 500 });
  }

  try {
    // 1. Register User on SnapTrade
    const registerResponse = await fetch(`https://api.snaptrade.com/api/v1/snapTrade/registerUser?clientId=${clientId}&consumerKey=${consumerKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    
    const regData = await registerResponse.json();
    const userSecret = regData?.userSecret;

    if (!userSecret) {
      return NextResponse.json({ error: `SnapTrade registration failed. Raw response: ${JSON.stringify(regData)}` }, { status: 500 });
    }

    // 2. Generate secure Connection Portal URL
    const loginResponse = await fetch(`https://api.snaptrade.com/api/v1/snapTrade/login?clientId=${clientId}&consumerKey=${consumerKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ userId: user.id, userSecret: userSecret })
    });

    if (!loginResponse.ok) throw new Error('Failed to generate connection URL');
    
    const loginData = await loginResponse.json();
    if (loginData?.redirectURI) {
       return NextResponse.json({ url: loginData.redirectURI });
    }

    throw new Error('No redirect URI provided by SnapTrade');
    
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
