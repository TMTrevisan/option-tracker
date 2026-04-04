'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { linkTradeToPosition } from '@/lib/services/positions'

import { z } from 'zod'
import { Database } from '@/lib/types'

const TradeSchema = z.object({
  trade_type: z.enum(['BUY', 'SELL', 'BTO', 'STC', 'STO', 'BTC', 'ASSIGNMENT', 'EXERCISE']),
  symbol: z.string().min(1).max(12).transform(s => s.toUpperCase()),
  quantity: z.preprocess((val) => Number(val), z.number().int().positive()),
  price: z.preprocess((val) => Number(val), z.number().nonnegative()),
  fees: z.preprocess((val) => Number(val || 0), z.number().nonnegative()),
  trade_date: z.string(),
  strike_price: z.preprocess((val) => val ? Number(val) : undefined, z.number().positive().optional()),
  expiration_date: z.string().optional(),
  option_type: z.enum(['CALL', 'PUT']).optional(),
  notes: z.string().optional(),
})

type TradeInsert = Database['public']['Tables']['trades']['Insert']

export async function logTrade(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const strategy = formData.get('strategy') as string;

  const rawData = {
    trade_type: formData.get('trade_type'),
    symbol: formData.get('symbol'),
    strike_price: formData.get('strike_price') || undefined,
    expiration_date: formData.get('expiration_date') || undefined,
    option_type: formData.get('option_type') || undefined,
    quantity: formData.get('quantity'),
    price: formData.get('price'),
    fees: formData.get('fees') || '0',
    trade_date: formData.get('trade_date'),
    notes: formData.get('notes'),
  }

  const result = TradeSchema.safeParse(rawData);
  if (!result.success) {
    console.error('Validation error:', result.error);
    redirect(`/log-trade?error=Invalid trade data: ${result.error.issues[0].message}`);
  }

  const tradeData: TradeInsert = {
    user_id: user.id,
    ...result.data,
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
