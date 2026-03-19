import Link from 'next/link';
import { LayoutDashboard, Plus, TrendingUp, BarChart2, Briefcase, MessageSquare, Settings, LineChart } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import SidebarLink from './SidebarLink';

export default async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'D';
  const displayEmail = user?.email || 'Not logged in';
  return (
    <aside className="sidebar">
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
        <h1 className="text-xl font-bold">RollTrackr</h1>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem', gap: '0.5rem', marginTop: '1rem' }}>
        <SidebarLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" exact />
        <SidebarLink href="/log-trade" icon={<Plus size={20} />} label="Log Trade" />
        <SidebarLink href="/options" icon={<TrendingUp size={20} />} label="Options" />
        <SidebarLink href="/equities" icon={<BarChart2 size={20} />} label="Equities" />
        <SidebarLink href="/analytics" icon={<LineChart size={20} />} label="Analytics" />
        <SidebarLink href="/brokerage" icon={<Briefcase size={20} />} label="Brokerage" />
      </nav>

      <div style={{ flex: 1 }} />
      
      <nav style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
        <SidebarLink href="/support" icon={<MessageSquare size={20} />} label="Support" />
        <SidebarLink href="/settings" icon={<Settings size={20} />} label="Settings" />
        
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {userInitial}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="text-sm font-medium" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{displayEmail}</div>
            <div className="text-xs text-muted">User</div>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
          RollTrackr v1.0.1
        </div>
      </nav>
    </aside>
  );
}
