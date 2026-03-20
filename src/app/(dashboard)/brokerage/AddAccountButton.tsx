"use client";

import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function AddAccountButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snaptrade');
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast("API Error: " + (data.error || "Missing URL payload"), "error");
        setLoading(false);
      }
    } catch (error: any) {
      toast("Network Error: " + error.message, "error");
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-primary" onClick={handleAddAccount} disabled={loading}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
      {loading ? 'Connecting...' : 'Add Account'}
    </button>
  );
}
