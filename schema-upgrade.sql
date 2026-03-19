import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Oops! We don't have Service Role Key.
);

// We can't run schema changes from a script because we don't have the connection string or service role key.
// The user has to run the SQL in their Supabase Dashboard.
