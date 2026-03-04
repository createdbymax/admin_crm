import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OptimisticUpdateOptions<T> {
  onUpdate: (id: string, data: Partial<T>) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useOptimisticUpdate<T extends { id: string }>({
  onUpdate,
  onError,
}: OptimisticUpdateOptions<T>) {
  const router = useRouter();
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<T>>>(new Map());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      // Optimistically update the UI
      setPendingUpdates((prev) => new Map(prev).set(id, data));
      setErrors((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      try {
        // Perform the actual update
        await onUpdate(id, data);
        
        // Clear pending update on success
        setPendingUpdates((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });

        // Refresh the page data
        router.refresh();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Update failed');
        
        // Revert optimistic update
        setPendingUpdates((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });

        // Store error
        setErrors((prev) => new Map(prev).set(id, err));

        // Call error handler
        onError?.(err);
      }
    },
    [onUpdate, onError, router]
  );

  const getPendingUpdate = useCallback(
    (id: string): Partial<T> | undefined => {
      return pendingUpdates.get(id);
    },
    [pendingUpdates]
  );

  const getError = useCallback(
    (id: string): Error | undefined => {
      return errors.get(id);
    },
    [errors]
  );

  const clearError = useCallback((id: string) => {
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    update,
    getPendingUpdate,
    getError,
    clearError,
    hasPendingUpdates: pendingUpdates.size > 0,
  };
}
