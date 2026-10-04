import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fudffigqqwcqbhkxcdun.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZGZmaWdxcXdjcWJoa3hjZHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTQ2OTUsImV4cCI6MjEwNjUzMDY5NX0.fjW9Vhr_tGDi_zHfrQ_GMXgK1o-iYO927I8WAEY_Xq8';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
