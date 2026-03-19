import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const SNAPTRADE_KEY = "PERS-E3AD48IDJZGU8R4S2DSWuJH84wYV9c8NZybFFNPbx0sRtGPIqzMijKbauR0puL8fI0CCGy";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mockLoginLink = `https://app.snaptrade.com/login?partner_client_id=${SNAPTRADE_KEY.substring(0,5)}&user_id=${user.id}`;
    return NextResponse.json({ url: mockLoginLink });
  } catch {
    return NextResponse.json({ error: 'Failed to generate SnapTrade link' }, { status: 500 });
  }
}
