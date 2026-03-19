"use client";
import { DownloadCloud } from 'lucide-react';
import { useState } from 'react';

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [debugJson, setDebugJson] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setDebugJson("");
    try {
      const res = await fetch('/api/snaptrade/sync', { method: 'POST' });
      
      if (!res.ok && res.status >= 400 && !res.body) {
         throw new Error("HTTP " + res.status);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let loop = true;
        while (loop) {
          const { value, done } = await reader.read();
          if (done) {
            loop = false;
            break;
          }
          const text = decoder.decode(value);
          setDebugJson(prev => prev + text);
        }
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button 
        className="btn btn-primary" 
        onClick={handleSync}
        disabled={loading}
        style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
      >
        <DownloadCloud size={18} />
        {loading ? "Scraping Brokerage..." : "Sync & Import"}
      </button>

      {debugJson && (
         <div style={{ padding: '1rem', background: '#000', color: '#0f0', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '400px', border: '1px solid #333' }}>
           {debugJson}
         </div>
      )}
    </div>
  );
}
