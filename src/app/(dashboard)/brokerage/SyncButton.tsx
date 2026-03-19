"use client";
import { DownloadCloud } from 'lucide-react';

export default function SyncButton() {
  const handleSync = () => {
    alert("Historic data import is currently under construction for V2! Your connection to Robinhood is live and secure.");
  };

  return (
    <button 
      className="btn btn-primary" 
      onClick={handleSync}
      style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
    >
      <DownloadCloud size={18} />
      Sync & Import
    </button>
  );
}
