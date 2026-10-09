import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createStore } from './createStore.ts';

describe('createStore', () => {
  test('merges patches into a new snapshot', () => {
    const store = createStore({ count: 0, label: 'a' });
    const before = store.get();
    store.set({ count: 1 });

    assert.deepEqual(store.get(), { count: 1, label: 'a' });
    assert.notEqual(store.get(), before);
  });

  test('notifies only on real changes', () => {
    const store = createStore({ count: 0 });
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });

    store.set({ count: 0 });
    store.set({ count: 2 });
    unsubscribe();
    store.set({ count: 3 });

    assert.equal(calls, 1);
  });
});
