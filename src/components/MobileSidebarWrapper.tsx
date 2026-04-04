'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';

export default function MobileSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [sidebarOpen]);

  return (
    <>
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}
      
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        {children}
      </div>
    </>
  );
}
