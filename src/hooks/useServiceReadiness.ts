import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ServiceReadinessSnapshot } from "../api";

export type ServiceReadinessState = {
  snapshot: ServiceReadinessSnapshot | null;
  loading: boolean;
  error: string;
  refresh: () => void;
};

type ReadinessState = {
  snapshot: ServiceReadinessSnapshot | null;
  error: string;
  requestKey: number;
  settledKey: number;
};

export function useServiceReadiness(enabled: boolean): ServiceReadinessState {
  const [state, setState] = useState<ReadinessState>({
    snapshot: null,
    error: "",
    requestKey: 0,
    settledKey: -1,
  });

  const refresh = useCallback(() => {
    if (!enabled) return;
    setState((current) => ({
      ...current,
      error: "",
      requestKey: current.requestKey + 1,
    }));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const requestKey = state.requestKey;

    void api.readiness()
      .then((snapshot) => {
        if (!active) return;
        setState((current) => current.requestKey === requestKey
          ? { ...current, snapshot, error: "", settledKey: requestKey }
          : current);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState((current) => current.requestKey === requestKey
          ? {
              ...current,
              error: reason instanceof Error ? reason.message : "服务预检失败。",
              settledKey: requestKey,
            }
          : current);
      });

    return () => { active = false; };
  }, [enabled, state.requestKey]);

  const loading = enabled && state.settledKey !== state.requestKey;

  return useMemo(() => ({
    snapshot: state.snapshot,
    loading,
    error: state.error,
    refresh,
  }), [loading, refresh, state.error, state.snapshot]);
}
