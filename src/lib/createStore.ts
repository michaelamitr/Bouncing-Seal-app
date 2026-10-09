export interface Store<T extends object> {
  get: () => T;
  /** Merges `patch` into the state; listeners run only if something changed. */
  set: (patch: Partial<T>) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * Minimal observable state container for imperative systems (audio engine,
 * YouTube player). Snapshots are immutable, so it plugs straight into
 * React's `useSyncExternalStore`.
 */
export const createStore = <T extends object>(initialState: T): Store<T> => {
  let state = initialState;
  const listeners = new Set<() => void>();

  const set = (patch: Partial<T>) => {
    const changed = (Object.keys(patch) as Array<keyof T>).some(
      (key) => !Object.is(state[key], patch[key]),
    );

    if (!changed) {
      return;
    }

    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { get: () => state, set, subscribe };
};
