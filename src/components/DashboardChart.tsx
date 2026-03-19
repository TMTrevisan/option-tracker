"use client";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from "recharts";

type MonthlyPoint = { month: string; pl: number; cumulative: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pl = payload[0]?.value ?? 0;
  const cum = payload[1]?.value ?? payload[0]?.value ?? 0;
  return (
    <div style={{ backgroundColor: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.name === 'cumulative' ? 'Running Total' : 'Monthly P/L'}</span>
          <span style={{ fontWeight: 700 }}>{p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardChart({ data }: { data: MonthlyPoint[] }) {
  const hasData = data.length > 0 && data.some(d => d.pl !== 0);
  const totalPL = data.reduce((s, d) => s + d.pl, 0);
  const isPositive = totalPL >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f87171';
  const fillId = isPositive ? 'gradGreen' : 'gradRed';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', minHeight: '320px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
          {isPositive ? <TrendingUp size={18} color="#10b981" /> : <TrendingDown size={18} color="#f87171" />}
          Cumulative P/L — {new Date().getFullYear()}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', color: isPositive ? '#10b981' : '#f87171', lineHeight: 1 }}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>YTD Total</div>
        </div>
      </div>

      {!hasData ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
          No closed positions yet — data will appear after your first sync.
        </div>
      ) : (
        <div style={{ height: '260px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="cumulative" name="cumulative" stroke={strokeColor} strokeWidth={2.5} fillOpacity={1} fill={`url(#${fillId})`} dot={false} activeDot={{ r: 5, fill: strokeColor }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasData && (
        <div style={{ marginTop: '1rem', height: '60px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="month" stroke="transparent" fontSize={0} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="pl" name="pl" radius={[3, 3, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#f87171'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
