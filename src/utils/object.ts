import { deepEqual } from '@beenotung/tslib/object';

export function anyEqual<A, B>(as: A[], bs: B[]): boolean {
  for (const a of as) {
    for (const b of bs) {
      if (deepEqual(a, b)) {
        return true;
      }
    }
  }
}
