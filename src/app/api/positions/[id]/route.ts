import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// DELETE /api/positions/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // First verify this position belongs to the user
  const { data: pos } = await supabase
    .from('positions')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!pos || pos.user_id !== user.id) {
    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
  }

  // Unlink all trades from this position (don't delete the trades themselves)
  await supabase
    .from('trades')
    .update({ position_id: null })
    .eq('position_id', id);

  // Delete the position
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
