import { create } from 'zustand';
import { Position, Trade } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

interface TradeStore {
  positions: Position[];
  trades: Trade[];
  isInitialized: boolean;
  initialize: (supabase: SupabaseClient) => Promise<void>;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  positions: [],
  trades: [],
  isInitialized: false,
  initialize: async (supabase) => {
    if (get().isInitialized) return;

    // Fetch initial data payload efficiently
    const { data: posData } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
    const { data: tradeData } = await supabase.from('trades').select('*').order('trade_date', { ascending: false });

    set({ positions: posData || [], trades: tradeData || [], isInitialized: true });

    // Establish WebSocket subscriptions for Realtime UI updates
    supabase.channel('public:positions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        set((state) => {
          if (eventType === 'INSERT') return { positions: [newRecord as Position, ...state.positions] };
          if (eventType === 'UPDATE') return { positions: state.positions.map(p => p.id === newRecord.id ? newRecord as Position : p) };
          if (eventType === 'DELETE') return { positions: state.positions.filter(p => p.id !== oldRecord.id) };
          return state;
        });
      }).subscribe();

    supabase.channel('public:trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        set((state) => {
          if (eventType === 'INSERT') {
            // keep trades sorted descending
            const newTrades = [newRecord as Trade, ...state.trades];
            return { trades: newTrades.sort((a,b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()) };
          }
          if (eventType === 'UPDATE') return { trades: state.trades.map(t => t.id === newRecord.id ? newRecord as Trade : t) };
          if (eventType === 'DELETE') return { trades: state.trades.filter(t => t.id !== oldRecord.id) };
          return state;
        });
      }).subscribe();
  }
}));
