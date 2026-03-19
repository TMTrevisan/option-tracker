"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLink({ href, icon, label, exact = false }: { href: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  const pathname = usePathname() || '';
  const active = exact ? pathname === href : (pathname === href || (pathname.startsWith(href) && href !== '/'));

  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      textDecoration: 'none',
      transition: 'var(--transition-fast)'
    }}>
      <div style={{ color: active ? 'var(--accent-primary)' : 'inherit' }}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      {active && <div style={{ marginLeft: 'auto', width: '3px', height: '16px', background: 'var(--accent-primary)', borderRadius: 'var(--radius-sm)' }} />}
    </Link>
  );
}
