import { TrendingUp, Target, Calendar, Bookmark, Plus } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
// Chart component separated to keep it as Client Component
import DashboardChart from '@/components/DashboardChart';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Fetch real trades from DB
  const { data: trades } = await supabase.from('trades').select('*');
  const openTradesCount = trades?.length || 0;

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <StatCard 
          title="YTD P/L" 
          value="+$0.00" 
          subtitle={openTradesCount > 0 ? "Tracking" : "No closed trades"} 
          icon={<TrendingUp size={20} color="#10b981" />} 
          accent="#10b981"
          success={false}
        />
        <StatCard 
          title="YTD Win Rate" 
          value="0.0%" 
          subtitle="0 closed trades" 
          icon={<Target size={20} color="#60a5fa" />} 
          accent="#60a5fa"
        />
        <StatCard 
          title="This Month" 
          value="+$0.00" 
          subtitle="-- " 
          icon={<Calendar size={20} color="#a78bfa" />} 
          accent="#a78bfa"
          success={false}
        />
        <StatCard 
          title="Total Trades Logged" 
          value={openTradesCount.toString()} 
          subtitle="Historical & Active" 
          icon={<Bookmark size={20} color="#fb923c" />} 
          accent="#fb923c"
        />
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <DashboardChart />

        {/* Strategy Breakdown */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
            <div style={{ width: 14, height: 14, border: '2px solid var(--text-secondary)', borderRadius: '50%' }} />
            YTD Strategy Breakdown
          </div>
          
          {openTradesCount === 0 ? (
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p className="text-sm">No trades logged yet.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">Active Positions</span>
                <span className="badge badge-dark" style={{ fontSize: '0.7rem' }}>{openTradesCount} items</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, accent, success }: { title: string, value: string, subtitle: string, icon: React.ReactNode, accent: string, success?: boolean }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden', height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', transform: 'translateY(-50%)', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: accent, opacity: 0.1, zIndex: 0 }} />
      <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="text-sm font-medium text-muted mb-2">{title}</div>
          <div className="text-3xl font-bold mb-2">{value}</div>
          <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: success ? 'var(--accent-success)' : 'var(--text-muted)' }}>
            {success && <TrendingUp size={14} />}
            {subtitle}
          </div>
        </div>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
