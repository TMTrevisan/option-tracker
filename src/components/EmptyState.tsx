'use client';
import { LucideIcon, Plus, DownloadCloud } from 'lucide-react';
import Link from 'next/link';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
};

export default function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '4rem 2rem', 
      textAlign: 'center',
      backgroundColor: 'var(--bg-input)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-color)',
      gap: '1.25rem'
    }}>
      <div style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '50%', 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        <Icon size={32} />
      </div>
      
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {action && (
          <Link href={action.href} className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {action.icon && <action.icon size={16} />}
            {action.label}
          </Link>
        )}
        {secondaryAction && (
          <Link href={secondaryAction.href} className="btn btn-secondary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {secondaryAction.icon && <secondaryAction.icon size={16} />}
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}
