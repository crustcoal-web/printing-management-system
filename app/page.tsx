'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading NAAM Studio...</p>
      </div>
    </div>
  );
}
