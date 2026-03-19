import { createClient } from '@/utils/supabase/server';
import { Snaptrade } from 'snaptrade-typescript-sdk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.SNAPTRADE_CLIENT_ID?.trim();
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY?.trim();
  const secret = user.user_metadata?.snaptrade_secret;

  if (!clientId || !consumerKey || !secret) {
    return NextResponse.json({ error: 'Missing SnapTrade configuration or secret.' }, { status: 500 });
  }

  const snaptrade = new Snaptrade({ clientId, consumerKey });

  try {
    const accountsRes = await snaptrade.accountInformation.listUserAccounts({ userId: user.id, userSecret: secret });
    const accounts = accountsRes.data || [];
    
    if (accounts.length === 0) return NextResponse.json({ error: 'No brokerage accounts found.' }, { status: 400 });

    const activities = await snaptrade.accountInformation.getAccountActivities({ 
        userId: user.id, 
        userSecret: secret, 
        accountId: accounts[0].id,
        startDate: "2024-01-01" 
    });

    // Only dump the 5 most recent activities to avoid blasting the screen
    const parsedData = activities.data.slice(0, 5);
    
    return NextResponse.json({ 
        success: true, 
        message: `Successfully pulled ${activities.data.length} historic trades.\n\nPLEASE COPY THIS GREEN TEXT AND SEND TO YOUR AI DEVELOPER SO HE CAN BUILD THE PARSER:\n\n${JSON.stringify(parsedData, null, 2)}` 
    });

  } catch (error: any) {
    console.error("Sync Error:", error.response?.data || error.message);
    return NextResponse.json({ error: `SnapTrade Scraper Failed: ${error.message}` }, { status: 500 });
  }
}
