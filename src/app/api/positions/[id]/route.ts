import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  // 1. Unlink trades associated with this position so they don't get deleted by cascade (if that's the desired behavior)
  // Actually, in this app, positions are aggregations. If we delete the position, we probably want the trades to be orphaned 
  // so they can be re-imported or re-linked if the user clears the cache.
  await supabase
    .from('trades')
    .update({ position_id: null })
    .eq('position_id', id)
    .eq('user_id', user.id);

  // 2. Delete the position
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete position error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
