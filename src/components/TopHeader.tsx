import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';

export default async function TopHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="top-header" style={{ flexDirection: 'column', height: 'auto', padding: 0 }}>
      {/* Top Navbar */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <Link href="/docs" style={{ color: 'inherit', textDecoration: 'none' }}>Docs</Link>
          <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           {user ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
               <form action={logout}>
                 <button className="btn btn-secondary" style={{ borderRadius: '20px', padding: '0.4rem 1.25rem', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}>Logout</button>
               </form>
             </div>
           ) : (
             <Link href="/login" className="btn btn-secondary" style={{ borderRadius: '20px', padding: '0.4rem 1.25rem', backgroundColor: '#e2e8f0', color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
           )}
        </div>
      </div>
    </header>
  );
}
