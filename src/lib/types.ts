export type AssetType = 'EQUITY' | 'OPTION';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'ASSIGNED';
export type TradeType = 'BTO' | 'STC' | 'STO' | 'BTC' | 'ASSIGNMENT' | 'EXERCISE' | 'BUY' | 'SELL';

export interface BrokerageAccount {
  id: string;
  user_id: string;
  name: string;
  broker: string;
  account_number?: string;
  balance: number;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  account_id?: string;
  asset_type: AssetType;
  symbol: string;
  underlying_symbol?: string;
  strategy?: string;
  status: PositionStatus;
  side?: 'LONG' | 'SHORT';
  strike_price?: number;
  expiration_date?: string;
  option_type?: 'CALL' | 'PUT';
  occ_symbol?: string;
  adjusted_cost_basis: number;
  total_premium_kept: number;
  total_fees: number;
  realized_pl: number;
  tags?: string[];
  open_quantity: number;
  closed_quantity: number;
  wash_sale_adjusted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  position_id?: string;
  account_id?: string;
  trade_type: TradeType;
  symbol: string;
  strike_price?: number;
  expiration_date?: string;
  option_type?: 'CALL' | 'PUT';
  quantity: number;
  price: number;
  fees: number;
  trade_date: string;
  notes?: string;
  tags?: string[];
  created_at: string;
}

// Database schema typing for Supabase Client
export interface Database {
  public: {
    Tables: {
      brokerage_accounts: {
        Row: BrokerageAccount;
        Insert: Omit<BrokerageAccount, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BrokerageAccount, 'id' | 'created_at' | 'updated_at'>>;
      };
      positions: {
        Row: Position;
        Insert: Omit<Position, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Position, 'id' | 'created_at' | 'updated_at'>>;
      };
      trades: {
        Row: Trade;
        Insert: Omit<Trade, 'id' | 'created_at'>;
        Update: Partial<Omit<Trade, 'id' | 'created_at'>>;
      };
    }
  }
}
