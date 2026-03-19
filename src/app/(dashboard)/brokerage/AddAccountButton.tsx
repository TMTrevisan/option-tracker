"use client";

import { Link as LinkIcon } from 'lucide-react';

export default function AddAccountButton() {
  const handleAddAccount = async () => {
    try {
      const res = await fetch('/api/snaptrade');
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert("API Error: " + (data.error || "Missing URL payload"));
      }
    } catch (error: any) {
      alert("Network Error: " + error.message);
    }
  }

  return (
    <button className="btn btn-primary" onClick={handleAddAccount}>
      <LinkIcon size={16} />
      Add Account
    </button>
  );
}
