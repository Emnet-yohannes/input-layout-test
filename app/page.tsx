'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FormulaInput from './components/FormulaInput';
import { useState } from 'react';

export default function Home() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <QueryClientProvider client={queryClient}>
          <h1 className="text-2xl font-bold mb-8 text-center">Formula Editor</h1>
          <FormulaInput />
        </QueryClientProvider>
      </main>
    </div>
  );
}