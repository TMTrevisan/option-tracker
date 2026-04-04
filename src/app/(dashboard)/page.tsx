import { TrendingUp, Target, Calendar, Bookmark, Plus } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import DashboardChart from '@/components/DashboardChart';
import EmptyState from '@/components/EmptyState';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: positions }, { data: trades }] = await Promise.all([
    supabase.from('positions').select('*').eq('user_id', user?.id),
    supabase.from('trades').select('*').eq('user_id', user?.id),
  ]);

  const allPositions = positions || [];
  const allTrades = trades || [];

  // Core metrics
  const closedPositions = allPositions.filter(p => p.status === 'CLOSED' || p.status === 'ASSIGNED');
  const ytdPL = closedPositions.reduce((sum, p) => sum + (p.realized_pl || 0), 0);
  const winCount = closedPositions.filter(p => (p.realized_pl || 0) > 0).length;
  const winRate = closedPositions.length > 0 ? (winCount / closedPositions.length) * 100 : 0;
  
  // This month P/L
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthPL = allTrades
    .filter(t => t.trade_date && t.trade_date >= startOfMonth)
    .reduce((sum, t) => {
      const isSell = (t.trade_type || '').toUpperCase() === 'SELL' || (t.trade_type || '').toUpperCase() === 'STC' || (t.trade_type || '').toUpperCase() === 'BTC';
      return sum + (isSell ? (t.price * t.quantity) : 0);
    }, 0);

  const openCount = allPositions.filter(p => p.status === 'OPEN').length;
  const optionPositions = allPositions.filter(p => p.asset_type === 'OPTION');
  const equityPositions = allPositions.filter(p => p.asset_type === 'EQUITY');

  // Strategy breakdown counts
  const strategyMap: Record<string, number> = {};
  allPositions.forEach(p => {
    const s = p.strategy || (p.asset_type === 'OPTION' ? 'Option Trade' : 'Long Stock');
    strategyMap[s] = (strategyMap[s] || 0) + 1;
  });

  // Monthly P/L series for chart (closed positions grouped by close month)
  const monthlyPLMap: Record<string, number> = {};
  closedPositions.forEach(p => {
    // Use updated_at or created_at — pick the later one as "close date" approximation
    const d = new Date(p.updated_at || p.created_at || Date.now());
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthlyPLMap[key] = (monthlyPLMap[key] || 0) + (p.realized_pl || 0);
  });
  // Sort by date and compute cumulative
  const currentYear = now.getFullYear();
  const months = Array.from({ length: now.getMonth() + 1 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  });
  let running = 0;
  const chartData = months.map(m => {
    const pl = monthlyPLMap[m] || 0;
    running += pl;
    return { month: m, pl: Math.round(pl * 100) / 100, cumulative: Math.round(running * 100) / 100 };
  });

  // Upcoming Expirations
  const upcomingExpirations = optionPositions
    .filter(p => p.status === 'OPEN' && p.expiration_date)
    .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime())
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted">Track your options trading journey</p>
        </div>
        <Link href="/log-trade" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none' }}>
          <Plus size={18} />
          Log New Trade
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="responsive-stats-grid">
        <StatCard
          title="YTD P/L"
          value={`${ytdPL >= 0 ? '+' : ''}$${ytdPL.toFixed(2)}`}
          subtitle={closedPositions.length > 0 ? `${closedPositions.length} closed positions` : "No closed positions yet"}
          icon={<TrendingUp size={20} color="#10b981" />}
          accent="#10b981"
          success={ytdPL > 0}
          info="Total realized profit/loss for the current calendar year."
        />
        <StatCard
          title="YTD Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtitle={`${winCount} wins of ${closedPositions.length} closed`}
          icon={<Target size={20} color="#60a5fa" />}
          accent="#60a5fa"
          info="Percentage of closed trades that were profitable."
        />
        <StatCard
          title="This Month"
          value={`${thisMonthPL >= 0 ? '+' : ''}$${thisMonthPL.toFixed(2)}`}
          subtitle={`Options: ${optionPositions.length} · Equities: ${equityPositions.length}`}
          icon={<Calendar size={20} color="#a78bfa" />}
          accent="#a78bfa"
          success={thisMonthPL > 0}
          info="Rough estimate of gross sales/credits this month."
        />
        <StatCard
          title="Open Positions"
          value={openCount.toString()}
          subtitle={`${allTrades.length} total trades synced`}
          icon={<Bookmark size={20} color="#fb923c" />}
          accent="#fb923c"
          info="Number of positions currently alive in your portfolio."
        />
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <DashboardChart data={chartData} />
        </div>

        {/* Strategy Breakdown */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
            <div style={{ width: 14, height: 14, border: '2px solid var(--text-secondary)', borderRadius: '50%' }} />
            YTD Strategy Breakdown
          </div>

          {allPositions.length === 0 ? (
            <EmptyState 
              icon={Target}
              title="No Strategies Found"
              description="Connect your brokerage or log a manual trade to see your strategy breakdown."
              action={{ label: "Connect Brokerage", href: "/brokerage", icon: Bookmark }}
              secondaryAction={{ label: "Log Trade", href: "/log-trade", icon: Plus }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(strategyMap).slice(0, 8).map(([strat, count]) => (
                <div key={strat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', borderRadius: '6px', padding: '0.5rem 0.875rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{strat}</span>
                  <span className="badge badge-dark" style={{ fontSize: '0.7rem' }}>{count}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <Link href="/options" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>View Options →</Link>
                <Link href="/equities" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>View Equities →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Expirations */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
            <div style={{ width: 14, height: 14, border: '2px solid #f87171', borderRadius: '50%' }} />
            Upcoming Expirations
          </div>

          {upcomingExpirations.length === 0 ? (
            <EmptyState 
              icon={Calendar}
              title="No Upcoming Expirations"
              description="All your option positions are currently distant or you have no open contracts."
              action={{ label: "View All Options", href: "/options", icon: Target }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingExpirations.map((pos) => {
                const exp = pos.expiration_date ? new Date(pos.expiration_date) : null;
                const dte = exp ? Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                
                return (
                  <div key={pos.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', borderRadius: '6px', padding: '0.6rem 0.875rem', borderLeft: dte <= 7 ? '3px solid #f87171' : '3px solid #fb923c' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {pos.symbol} ${pos.strike_price} {pos.option_type}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {pos.strategy}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: dte <= 7 ? '#f87171' : '#fb923c' }}>
                        {dte} {dte === 1 ? 'day' : 'days'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {exp ? `${exp.getMonth() + 1}/${exp.getDate()}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Link href="/options?status=OPEN" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>Manage Options →</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, accent, success, info }: { title: string, value: string, subtitle: string, icon: React.ReactNode, accent: string, success?: boolean, info?: string }) {
  return (
    <div className="card" title={info} style={{ position: 'relative', overflow: 'hidden', height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: info ? 'help' : 'default' }}>
      <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', transform: 'translateY(-50%)', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: accent, opacity: 0.1, zIndex: 0 }} />
      <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="text-sm font-medium text-muted mb-2">{title}</div>
          <div className="text-3xl font-bold mb-2" style={{ color: success ? 'var(--accent-success)' : undefined }}>{value}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
