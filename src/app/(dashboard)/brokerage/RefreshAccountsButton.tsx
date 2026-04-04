'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function RefreshAccountsButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    // router.refresh() re-runs the server component data fetching on the current page
    router.refresh();
    toast('Account balances refreshed from SnapTrade.', 'success');
    // Give a brief visual indicator then stop
    setTimeout(() => setSpinning(false), 1200);
  };

  return (
    <button
      onClick={handleRefresh}
      className="btn btn-secondary"
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <RefreshCw
        size={16}
        style={{
          transition: 'transform 0.6s ease',
          transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
        }}
      />
      Refresh
    </button>
  );
}
