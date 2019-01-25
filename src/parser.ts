import { Either, left, right } from '@beenotung/tslib/either';
import { deepEqual } from '@beenotung/tslib/object';
import * as util from 'util';
import { anyEqual } from './utils/object';

function format(x) {
  return util.inspect(x, { depth: 999 });
}

export interface parse_result<T> {
  data: T;
  offset: number;
}
export type parser<C, T> = (
  cs: C[],
  offset: number,
) => Either<string, parse_result<T>>;
export type char = string;

export function success<C = any, T = any>(data: T): parser<C, T> {
  return (cs, offset) => {
    return right({ data, offset });
  };
}

export function fail(reason: string): parser<any, any> {
  return (cs, offset) => {
    return left(reason);
  };
}

export function parseOne<C>(c: C): parser<C, C> {
  return (cs, offset) => {
    if (deepEqual(cs[offset], c)) {
      return right({ data: cs[offset], offset: offset + 1 });
    }
    return left(`expect: ${format(c)}, got: ${format(cs[offset])}`);
  };
}

export function parseAny<C>(xs: C[]): parser<C, C> {
  return (cs, offset) => {
    if (anyEqual(xs, [cs[offset]])) {
      return right({ data: cs[offset], offset: offset + 1 });
    }
    return left(
      `expect any of: ${xs.map(x => format(x)).join()}, got: ${format(
        cs[offset],
      )}`,
    );
  };
}

export function anyParser<C, T>(ps: Array<parser<C, T>>): parser<C, T> {
  return (cs, offset) => {
    for (const p of ps) {
      const res = p(cs, offset);
      if (res.isRight) {
        return res;
      }
    }
    return left(
      `expect to pass any of: ${ps.map(p => p.toString())} but failed`,
    );
  };
}

export function parseAll<C>(xs: C[]): parser<C, C[]> {
  return (cs, offset) => {
    for (let i = 0; i < xs.length; i++) {
      if (!deepEqual(cs[offset + i], xs[i])) {
        return left(
          `expect: ${format(xs[i])}, got: ${
            cs[offset + i]
          }, expected sequence: ${xs
            .map(x => format(x))
            .join()}, seen sequence: ${cs
            .slice(offset, offset + i)
            .map(x => format(x))
            .join()}`,
        );
      }
    }
    return right({
      data: cs.slice(offset, offset + xs.length),
      offset: offset + xs.length,
    });
  };
}

export function combineParser<C, T>(ps: Array<parser<C, T>>): parser<C, T[]> {
  return (cs, offset) => {
    const xs: T[] = [];
    for (const p of ps) {
      const res = p(cs, offset);
      if (res.isLeft) {
        return res.mapRight(x => x as any);
      }
      const result = res.getRight();
      xs.push(result.data);
      offset = result.offset;
    }
    return right({ data: xs, offset });
  };
}

/**
 * @param start: inclusive
 * @param end: inclusive
 * */
export function parseCharRange(start: char, end: char): parser<char, char> {
  return (cs, offset) => {
    const c = cs[offset];
    if (start <= c && c <= end) {
      return right({ data: c, offset: offset + 1 });
    }
    return left(
      `expect char of range ${format(start)} to ${format(end)}, got: ${c}`,
    );
  };
}

export function mapParser<C, T, R>(
  p: parser<C, T>,
  f: (data: T) => R,
): parser<C, R> {
  return (cs, offset) => {
    return p(cs, offset).mapRight(({ data, offset }) => ({
      data: f(data),
      offset,
    }));
  };
}

export function repeatParser<C, T>(p: parser<C, T>): parser<C, T[]> {
  return (cs, offset) => {
    const xs: T[] = [];
    for (; offset < cs.length; ) {
      const res = p(cs, offset);
      if (res.isLeft) {
        break;
      }
      const result = res.getRight();
      offset = result.offset;
      xs.push(result.data);
    }
    return right({ data: xs, offset });
  };
}

export function repeatParserAtLeastN<C, T>(
  p: parser<C, T>,
  n: number,
): parser<C, T[]> {
  return (cs, offset) => {
    const res = repeatParser(p)(cs, offset);
    if (res.isLeft) {
      return res;
    }
    const result = res.getRight();
    if (result.data.length < n) {
      return left(
        `expect at least: ${n} times pass of ${p.toString()}, only got: ${
          result.data.length
        } times`,
      );
    }
    return res;
  };
}

export let numDigitParser: parser<char, number> = mapParser(
  parseCharRange('0', '9'),
  data => data.charCodeAt(0) - 48,
);
numDigitParser.toString = () => 'numDigitParser';

export let posIntParser: parser<string, number> = mapParser(
  repeatParserAtLeastN(numDigitParser, 1),
  ns => ns.reduce((acc, c) => acc * 10 + c),
);
posIntParser.toString = () => 'posIntParser';
