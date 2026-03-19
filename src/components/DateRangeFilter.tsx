'use client';
import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRange = { from: Date | null; to: Date | null };

const PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last Month', value: '1m' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'Custom', value: 'custom' },
];

function presetToRange(preset: string): DateRange {
  const now = new Date();
  if (preset === 'all') return { from: null, to: null };
  if (preset === '7d') {
    const f = new Date(now); f.setDate(f.getDate() - 7);
    return { from: f, to: now };
  }
  if (preset === '1m') {
    const f = new Date(now); f.setMonth(f.getMonth() - 1);
    return { from: f, to: now };
  }
  if (preset === '3m') {
    const f = new Date(now); f.setMonth(f.getMonth() - 3);
    return { from: f, to: now };
  }
  if (preset === '6m') {
    const f = new Date(now); f.setMonth(f.getMonth() - 6);
    return { from: f, to: now };
  }
  if (preset === '12m') {
    const f = new Date(now); f.setFullYear(f.getFullYear() - 1);
    return { from: f, to: now };
  }
  return { from: null, to: null };
}

/** Returns true if a date string falls within the given range */
export function inDateRange(dateStr: string | undefined, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void;
  style?: React.CSSProperties;
}

export default function DateRangeFilter({ onChange, style }: DateRangeFilterProps) {
  const [preset, setPreset] = useState('all');
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const selectPreset = (p: string) => {
    setPreset(p);
    setOpen(false);
    if (p !== 'custom') {
      onChange(presetToRange(p));
    }
  };

  const applyCustom = () => {
    onChange({
      from: customFrom ? new Date(customFrom) : null,
      to: customTo ? new Date(customTo) : null,
    });
    setOpen(false);
  };

  const activeLabel = PRESETS.find(p => p.value === preset)?.label ?? 'All Time';

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    padding: '0.35rem 0.6rem',
    outline: 'none',
    flex: 1,
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', padding: '0.55rem 1rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        <Calendar size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
        {activeLabel}
        <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '0.1rem' }} />
      </button>

      {open && (
        <div
          style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500, backgroundColor: '#141820', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', minWidth: '200px', boxShadow: '0 12px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}
        >
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => selectPreset(p.value)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.625rem 1rem', background: preset === p.value ? 'rgba(59,130,246,0.15)' : 'transparent', color: preset === p.value ? '#60a5fa' : 'rgba(255,255,255,0.75)', fontSize: '0.82rem', border: 'none', cursor: 'pointer', fontWeight: preset === p.value ? 600 : 400 }}
              onMouseEnter={e => { if (preset !== p.value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (preset !== p.value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {p.label}
            </button>
          ))}

          {preset === 'custom' && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inputStyle} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inputStyle} />
              </div>
              <button onClick={applyCustom} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click-outside to close */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
