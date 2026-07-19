'use client';

import { useState } from 'react';
import type { OrganizeResult } from '@/lib/board-types';

export function useOrganize(roomId: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const organize = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${roomId}/organize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      setResult(data as OrganizeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return { organize, loading, result, error, clear };
}
