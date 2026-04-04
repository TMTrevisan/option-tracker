'use client';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/lib/store';

export default function HeaderClient({ 
  userEmail, 
  logoutAction 
}: { 
  userEmail: string | null; 
  logoutAction: (formData: FormData) => Promise<void>;
}) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', minHeight: '64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="header-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
          style={{ 
            display: 'none', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            padding: '0.5rem',
            marginLeft: '-0.5rem'
          }}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
          <Link href="/analytics" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>Analytics</Link>
          <Link href="/options" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>Options</Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {userEmail ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'none' }} className="lg:block">{userEmail}</span>
            <form action={logoutAction}>
              <button className="btn btn-secondary" style={{ borderRadius: '20px', padding: '0.4rem 1.25rem', fontSize: '0.75rem' }}>Logout</button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0.4rem 1.25rem', fontSize: '0.75rem', textDecoration: 'none' }}>Login</Link>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .header-menu-btn {
            display: flex !important;
          }
          .nav-links {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
