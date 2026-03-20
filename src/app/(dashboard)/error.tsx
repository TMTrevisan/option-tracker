'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Dashboard Segment Error Caught:", error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <AlertTriangle size={32} color="#EF4444" />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong!</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
        We encountered an error loading this dashboard segment. It might be a temporary network issue or a problem with the data provider.
      </p>
      
      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '2rem', width: '100%', maxWidth: '500px', textAlign: 'left', overflowX: 'auto' }}>
        <code style={{ fontSize: '0.75rem', color: '#f87171' }}>{error.message || "Unknown error occurred"}</code>
      </div>

      <button
        onClick={() => reset()}
        className="btn btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
      >
        <RefreshCw size={18} />
        Try Again
      </button>
    </div>
  );
}
