import {deepEqual} from "@beenotung/tslib/object";

export type parse_result<T> = Array<[T, number]>;
export type parser<C, T> = (cs: C[], offset: number) => parse_result<T>;
export type char = string;

export function parseOne<C>(c: C): parser<C, C> {
  return (cs, offset) => {
    if (deepEqual(cs[offset], c)) {
      return [[cs[offset], offset + 1]]
    }
    return []
  }
}

export function anyEqual<A, B>(as: A[], bs: B[]): boolean {
  for (let a of as) {
    for (let b of bs) {
      if (deepEqual(a, b)) {
        return true;
      }
    }
  }
}

export function parseAny<C>(xs: C[]): parser<C, C> {
  return (cs, offset) => {
    if (anyEqual(xs, [cs[offset]])) {
      return [[cs[offset], offset + 1]]
    }
    return []
  }
}

export function parseAll<C>(xs: C[]): parser<C, C[]> {
  return (cs, offset) => {
    if (xs.every((x, i) => deepEqual(x, cs[offset + i]))) {
      return [[cs.slice(offset, xs.length), offset + xs.length]]
    }
    return []
  }
}
