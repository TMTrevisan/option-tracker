import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';
import HeaderClient from './HeaderClient';

export default async function TopHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="top-header">
      <HeaderClient userEmail={user?.email || null} logoutAction={logout} />
    </header>
  );
}
