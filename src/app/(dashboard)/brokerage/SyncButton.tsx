"use client";
import { DownloadCloud, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function SyncButton() {
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const defaultDate = oneYearAgo.toISOString().slice(0, 10);

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(defaultDate);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setLoading(true);
    setLogLines([]);
    setStatus('running');

    try {
      const res = await fetch('/api/snaptrade/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate }),
      });

      if (!res.body) throw new Error("No response stream from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        // Split on newlines and add each line
        const lines = full.split('\n');
        // Keep incomplete final fragment
        full = lines.pop() || '';
        setLogLines(prev => [...prev, ...lines.filter(l => l.trim())]);
      }
      if (full.trim()) setLogLines(prev => [...prev, full]);

      setStatus('success');
    } catch (e: any) {
      setLogLines(prev => [...prev, `❌ Error: ${e.message}`]);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const hasError = logLines.some(l => l.startsWith('❌'));
  
  // Very rough estimate of progress based on log lines
  const estimatedTotalLines = 50; 
  const progressPercent = status === 'success' ? 100 : status === 'running' ? Math.min(Math.max((logLines.length / estimatedTotalLines) * 100, 5), 95) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Controls row */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>START DATE</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={loading}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSync}
          disabled={loading}
          style={{ alignSelf: 'flex-end', padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
        >
          {loading && (
             <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progressPercent}%`, backgroundColor: 'rgba(255,255,255,0.2)', transition: 'width 0.3s ease' }} />
          )}
          {loading ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', zIndex: 1 }} />
              <span style={{ zIndex: 1 }}>Syncing...</span>
            </>
          ) : (
            <>
              <DownloadCloud size={16} />
              <span>Sync &amp; Import</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal log */}
      {logLines.length > 0 && (
        <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Terminal header bar */}
          <div style={{ background: '#1a1a1a', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>rolltrackr — sync engine</span>
            {status === 'success' && !hasError && <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: '#28c840' }} />}
            {(status === 'error' || hasError) && <XCircle size={14} style={{ marginLeft: 'auto', color: '#ff5f57' }} />}
          </div>

          {/* Log output */}
          <div style={{ background: '#0d0d0d', padding: '1rem', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.7, maxHeight: '320px', overflowY: 'auto' }}>
            {logLines.map((line, i) => {
              const color = line.startsWith('❌') ? '#ff5f57'
                : line.startsWith('✅') ? '#28c840'
                : line.startsWith('!') ? '#febc2e'
                : line.startsWith('  ...') ? 'rgba(255,255,255,0.4)'
                : '#00d060';
              return (
                <div key={i} style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {line}
                </div>
              );
            })}
            {loading && (
              <div style={{ color: 'rgba(255,255,255,0.25)', animation: 'pulse 1s infinite' }}>▋</div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
