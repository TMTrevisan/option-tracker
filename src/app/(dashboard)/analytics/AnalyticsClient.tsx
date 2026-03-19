'use client';
import { useMemo, useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, PieChart, Pie, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Clock, Award, AlertTriangle } from 'lucide-react';

type Position = {
  id: string; symbol: string; asset_type: string; strategy?: string;
  status: string; realized_pl?: number; total_fees?: number;
  created_at?: string; updated_at?: string; trades?: any[];
};
type Trade = {
  id: string; symbol: string; trade_type: string; trade_date?: string;
  price: number; quantity: number; fees?: number; expiration_date?: string;
  strike_price?: number; option_type?: string;
};

const STRATEGY_COLORS: Record<string, string> = {
  'Short Put': '#10b981',
  'Covered Call': '#60a5fa',
  'Long Put': '#f87171',
  'Long Call': '#a78bfa',
  'Long Stock': '#fb923c',
  'Short Stock': '#f59e0b',
  'Option Trade': '#94a3b8',
};
const colorFor = (s: string) => STRATEGY_COLORS[s] || '#94a3b8';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#fff' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', color: p.color }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.name}</span>
          <span style={{ fontWeight: 700 }}>
            {typeof p.value === 'number' && p.name.includes('P/L') ? `${p.value >= 0 ? '+' : ''}$${p.value.toFixed(2)}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', lineHeight: 1, color: '#fff' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AnalyticsClient({ positions, trades }: { positions: Position[]; trades: Trade[] }) {
  const [rollingWindow, setRollingWindow] = useState<30 | 90 | 180 | 365>(90);

  const closed = useMemo(() => positions.filter(p => p.status === 'CLOSED' || p.status === 'ASSIGNED'), [positions]);
  const open = useMemo(() => positions.filter(p => p.status === 'OPEN'), [positions]);

  // --- Core stats ---
  const totalPL = closed.reduce((s, p) => s + (p.realized_pl || 0), 0);
  const wins = closed.filter(p => (p.realized_pl || 0) > 0);
  const losses = closed.filter(p => (p.realized_pl || 0) <= 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, p) => s + (p.realized_pl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, p) => s + (p.realized_pl || 0), 0) / losses.length : 0;
  const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0;
  const totalFees = positions.reduce((s, p) => s + (p.total_fees || 0), 0);

  // --- Win Rate by strategy ---
  const strategyStats = useMemo(() => {
    const map: Record<string, { total: number; wins: number; pl: number }> = {};
    closed.forEach(p => {
      const s = p.strategy || 'Option Trade';
      if (!map[s]) map[s] = { total: 0, wins: 0, pl: 0 };
      map[s].total++;
      map[s].pl += p.realized_pl || 0;
      if ((p.realized_pl || 0) > 0) map[s].wins++;
    });
    return Object.entries(map).map(([strategy, d]) => ({
      strategy,
      winRate: Math.round((d.wins / d.total) * 100),
      pl: Math.round(d.pl * 100) / 100,
      count: d.total,
      color: colorFor(strategy),
    })).sort((a, b) => b.pl - a.pl);
  }, [closed]);

  // --- Best / Worst tickers ---
  const tickerStats = useMemo(() => {
    const map: Record<string, { pl: number; count: number; wins: number }> = {};
    closed.forEach(p => {
      if (!map[p.symbol]) map[p.symbol] = { pl: 0, count: 0, wins: 0 };
      map[p.symbol].pl += p.realized_pl || 0;
      map[p.symbol].count++;
      if ((p.realized_pl || 0) > 0) map[p.symbol].wins++;
    });
    return Object.entries(map).map(([symbol, d]) => ({
      symbol, pl: Math.round(d.pl * 100) / 100, count: d.count,
      winRate: Math.round((d.wins / d.count) * 100),
    })).sort((a, b) => b.pl - a.pl);
  }, [closed]);
  const best5 = tickerStats.slice(0, 5);
  const worst5 = [...tickerStats].sort((a, b) => a.pl - b.pl).slice(0, 5);

  // --- Rolling P/L (last N days by trade date) ---
  const rollingData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rollingWindow);
    const dayMap: Record<string, number> = {};
    closed.forEach(p => {
      const d = new Date(p.updated_at || p.created_at || 0);
      if (d < cutoff) return;
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = (dayMap[key] || 0) + (p.realized_pl || 0);
    });
    const days = Object.keys(dayMap).sort();
    let running = 0;
    return days.map(day => {
      running += dayMap[day];
      return { day: day.slice(5), 'P/L': Math.round(dayMap[day] * 100) / 100, cumulative: Math.round(running * 100) / 100 };
    });
  }, [closed, rollingWindow]);

  // --- Monthly P/L bar ---
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    closed.forEach(p => {
      const d = new Date(p.updated_at || p.created_at || 0);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + (p.realized_pl || 0);
    });
    return Object.entries(map).map(([month, pl]) => ({ month, 'P/L': Math.round(pl * 100) / 100 }));
  }, [closed]);

  // --- Strategy pie data ---
  const pieData = useMemo(() =>
    strategyStats.map(s => ({ name: s.strategy, value: s.count, fill: s.color }))
  , [strategyStats]);

  const cardStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard label="TOTAL P/L" value={`${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)}`} sub={`${closed.length} closed positions`} icon={<TrendingUp size={20} />} color={totalPL >= 0 ? '#10b981' : '#f87171'} />
        <StatCard label="WIN RATE" value={`${winRate.toFixed(1)}%`} sub={`${wins.length}W · ${losses.length}L`} icon={<Target size={20} />} color="#60a5fa" />
        <StatCard label="PROFIT FACTOR" value={profitFactor > 0 ? profitFactor.toFixed(2) : '—'} sub={`Avg win $${avgWin.toFixed(0)} · Avg loss $${Math.abs(avgLoss).toFixed(0)}`} icon={<Award size={20} />} color="#a78bfa" />
        <StatCard label="TOTAL FEES" value={`$${totalFees.toFixed(2)}`} sub="All time" icon={<AlertTriangle size={20} />} color="#f59e0b" />
      </div>

      {/* Row 2: Monthly bars + rolling line */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Monthly P/L bar */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1.25rem' }}>Monthly P/L</div>
          {monthlyData.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" fontSize={11} stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                <Bar dataKey="P/L" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((d, i) => <Cell key={i} fill={(d['P/L'] ?? 0) >= 0 ? '#10b981' : '#f87171'} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rolling cumulative P/L line */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Rolling P/L</div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {([30, 90, 180, 365] as const).map(w => (
                <button key={w} onClick={() => setRollingWindow(w)}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', border: '1px solid', borderColor: rollingWindow === w ? '#60a5fa' : 'rgba(255,255,255,0.12)', color: rollingWindow === w ? '#60a5fa' : 'rgba(255,255,255,0.4)', background: rollingWindow === w ? 'rgba(96,165,250,0.1)' : 'transparent', cursor: 'pointer' }}>
                  {w}d
                </button>
              ))}
            </div>
          </div>
          {rollingData.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem' }}>No activity in this window</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rollingData} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" fontSize={10} stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis fontSize={11} stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="cumulative" name="Running P/L" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Strategy win rate + pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* Strategy win rate table */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1.25rem' }}>Win Rate by Strategy</div>
          {strategyStats.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No closed positions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {strategyStats.map(s => (
                <div key={s.strategy} style={{ display: 'grid', gridTemplateColumns: '8rem 1fr 5rem 5rem', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: s.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.strategy}</div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.winRate}%`, backgroundColor: s.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', color: s.winRate >= 50 ? '#10b981' : '#f87171' }}>{s.winRate}%</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', color: s.pl >= 0 ? '#10b981' : '#f87171' }}>{s.pl >= 0 ? '+' : ''}${s.pl.toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strategy pie */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}>Strategy Mix</div>
          {pieData.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} trades`, n]} contentStyle={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '0.72rem', paddingTop: '0.5rem' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 4: Best / Worst tickers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {[{ title: '🏆 Best Tickers', data: best5, positive: true }, { title: '📉 Worst Tickers', data: worst5, positive: false }].map(({ title, data, positive }) => (
          <div key={title} style={cardStyle}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1.25rem' }}>{title}</div>
            {data.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.875rem' }}>No data</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.map((t, i) => (
                  <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ width: '1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, flexShrink: 0, textAlign: 'center' }}>#{i + 1}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', flex: 1 }}>{t.symbol}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{t.count} positions · {t.winRate}% win</div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: t.pl >= 0 ? '#10b981' : '#f87171' }}>
                      {t.pl >= 0 ? '+' : ''}${t.pl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
