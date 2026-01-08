
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document.
 * Can operate in real-time (default) or as a one-time fetch.
 * 
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef -
 * The Firestore DocumentReference. Must be memoized with useMemoFirebase. Waits if null/undefined.
 * @param {object} [options] - Hook options.
 * @param {boolean} [options.realtime=true] - If false, fetches data once instead of listening for real-time updates.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
  options: { realtime?: boolean } = { realtime: true }
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const handleSnapshot = (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) {
        setData({ ...(snapshot.data() as T), id: snapshot.id });
      } else {
        setData(null);
      }
      setError(null);
      setIsLoading(false);
    };

    const handleError = (error: FirestoreError) => {
      const contextualError = new FirestorePermissionError({
        operation: 'get',
        path: memoizedDocRef.path,
      });
      setError(contextualError);
      setData(null);
      setIsLoading(false);
      errorEmitter.emit('permission-error', contextualError);
    };
    
    if (options.realtime) {
      const unsubscribe = onSnapshot(memoizedDocRef, handleSnapshot, handleError);
      return () => unsubscribe();
    } else {
        getDoc(memoizedDocRef).then(handleSnapshot).catch(handleError);
    }
  }, [memoizedDocRef, options.realtime]);

  return { data, isLoading, error };
}
