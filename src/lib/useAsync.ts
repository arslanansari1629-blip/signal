import { useEffect, useState } from 'react';

export interface AsyncState<T> { data: T | null; loading: boolean; error: string | null }

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: enabled, error: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!enabled) { setState({ data: null, loading: false, error: null }); return; }
    const controller = new AbortController();
    setState((s) => ({ data: s.data, loading: true, error: null }));
    fn(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); })
      .catch((err) => { if (!controller.signal.aborted) setState({ data: null, loading: false, error: err?.message || 'Something went wrong' }); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);
  return { ...state, reload: () => setNonce((n) => n + 1) };
}
