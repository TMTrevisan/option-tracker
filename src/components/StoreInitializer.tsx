'use client';

import { useEffect } from 'react';
import { useTradeStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

export default function StoreInitializer() {
  const initialize = useTradeStore(state => state.initialize);

  useEffect(() => {
    const supabase = createClient();
    initialize(supabase);
  }, [initialize]);

  // This is a headless component, it merely exists to mount the subscriptions into the React tree lifecycle.
  return null;
}
