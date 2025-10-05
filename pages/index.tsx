import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace('/vault');
      } else {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return null; // or a loader/spinner component while redirecting
}
