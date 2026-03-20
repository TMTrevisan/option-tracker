'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { linkTradeToPosition } from '@/lib/services/positions'
import { Database } from '@/lib/types'

type TradeInsert = Database['public']['Tables']['trades']['Insert']

export async function logTrade(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const strategy = formData.get('strategy') as string;

  const tradeData: TradeInsert = {
    user_id: user.id,
    trade_type: formData.get('trade_type') as TradeInsert['trade_type'],
    symbol: formData.get('symbol') as string,
    strike_price: formData.get('strike_price') ? parseFloat(formData.get('strike_price') as string) : undefined,
    expiration_date: formData.get('expiration_date') ? (formData.get('expiration_date') as string) : undefined,
    option_type: formData.get('option_type') ? (formData.get('option_type') as 'CALL' | 'PUT') : undefined,
    quantity: parseInt(formData.get('quantity') as string, 10),
    price: parseFloat(formData.get('price') as string),
    fees: parseFloat(formData.get('fees') as string || '0'),
    trade_date: formData.get('trade_date') as string,
    notes: formData.get('notes') as string,
  }

  // Phase 5 Parsing: Extract #tags from notes
  const noteContent = tradeData.notes || '';
  const tagsMatch = noteContent.match(/#\w+/g);
  tradeData.tags = tagsMatch ? tagsMatch.map((t: string) => t.toLowerCase()) : [];

  // 1. Evaluate Context rules and aggregate into a Position lifecycle
  const positionId = await linkTradeToPosition(supabase, tradeData, strategy);
  
  if (positionId) {
    tradeData.position_id = positionId;
  }

  // 2. Insert the atomic trade
  const { error } = await supabase.from('trades').insert(tradeData)

  if (error) {
    console.error('Error logging trade:', error)
    redirect('/log-trade?error=Failed to log trade due to database error')
  }

  revalidatePath('/options')
  revalidatePath('/equities')
  redirect('/options')
}

export async function updateTradeNote(tradeId: string, newNote: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const tagsMatch = newNote.match(/#\w+/g);
  const tags = tagsMatch ? tagsMatch.map((t: string) => t.toLowerCase()) : [];

  const { error } = await supabase
    .from('trades')
    .update({ notes: newNote, tags })
    .eq('id', tradeId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/options');
  revalidatePath('/equities');
  return { success: true };
}
