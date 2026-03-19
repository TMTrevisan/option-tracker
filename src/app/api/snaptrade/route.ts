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
    // For V1 MVP, we return a structural link. In production, we'd POST to /api/v1/snapTrade/login to generate a user-specific token
    const mockLoginLink = `https://app.snaptrade.com/login?partner_client_id=${clientId}&user_id=${user.id}`;
    return NextResponse.json({ url: mockLoginLink });
  } catch {
    return NextResponse.json({ error: 'Failed to generate SnapTrade link' }, { status: 500 });
  }
}
