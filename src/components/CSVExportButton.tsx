'use client';
import { DownloadCloud } from 'lucide-react';

interface CSVExportButtonProps<T> {
  data: T[];
  filename: string;
  label?: string;
}

export default function CSVExportButton<T extends object>({ data, filename, label = 'Export CSV' }: CSVExportButtonProps<T>) {
  const downloadCSV = () => {
    if (data.length === 0) return;

    // Get headers from first object keys
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => {
        return headers.map(header => {
          const value = (row as any)[header];
          // Handle nested objects or arrays by stringifying them
          const stringValue = typeof value === 'object' ? JSON.stringify(value).replace(/"/g, '""') : String(value).replace(/"/g, '""');
          // Wrap in quotes to handle commas within values
          return `"${stringValue}"`;
        }).join(',');
      })
    ].join('\n');

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={downloadCSV} 
      className="btn btn-secondary"
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
      title="Download filtered data as CSV"
    >
      <DownloadCloud size={14} />
      {label}
    </button>
  );
}
