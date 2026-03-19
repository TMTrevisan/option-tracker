"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLink({ href, icon, label, exact = false }: { href: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  const pathname = usePathname() || '';
  const active = exact ? pathname === href : (pathname === href || (pathname.startsWith(href) && href !== '/'));

  return (
    <Link 
      href={href} 
      className={`sidebar-link ${active ? 'active' : ''}`}
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)'
      }}
    >
      <div style={{ color: active ? 'var(--accent-primary)' : 'inherit', transition: 'color var(--transition-fast)' }}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      {active && <div style={{ marginLeft: 'auto', width: '3px', height: '16px', background: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)' }} />}
    </Link>
  );
}
