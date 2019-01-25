import {
  anyParser,
  char,
  combineParser,
  mapParser,
  parseAny,
  parser,
  posIntParser,
  repeatParserAtLeastN,
} from '../src/parser';
import * as util from 'util';
import { mapExp } from './map-parser';

function format(x) {
  // return JSON.stringify(x, undefined, 2)
  return util.inspect(x, { depth: 999, breakLength: 2 });
}

interface OpAst {
  type: 'op';
  left: Ast;
  op: string;
  right: Ast;
}

interface NumAst {
  type: 'number';
  value: number;
}

type Ast = NumAst | OpAst;

let numAstParser: parser<char, NumAst> = mapParser(
  posIntParser,
  data => ({ type: 'number', value: data } as NumAst),
);

let opAstParser: parser<char, Ast> = mapParser(
  combineParser<char, NumAst | char>([
    numAstParser,
    parseAny(['+', '-', '*', '/']),
    numAstParser,
  ]),
  data =>
    ({
      type: 'op',
      left: data[0] as Ast,
      op: data[1] as string,
      right: data[2] as Ast,
    } as OpAst),
);

let astParser = repeatParserAtLeastN(anyParser([opAstParser, numAstParser]), 1);

let text = '1+2*3/4';
let cs = text.split('');
console.log('cs:', cs);
let res = astParser(cs, 0);
if (res.isLeft) {
  console.log('failed to parse: ', res.getLeft());
} else {
  console.log('ast:', format(res.getRight()));
}

let parse = (xs: any[]) => {
  let ys = [];
  for (let i = 0; i < xs.length; i++) {
    let x = xs[i];
    switch (x) {
      case '+':
      case '-':
      case '*':
      case '/':
        let left = ys.pop();
        let op = x;
        i++;
        let right = xs[i];
        ys.push({ left, op, right });
        continue;
    }
    ys.push(x);
  }
  return ys;
};

// let ast2 = parse(text.split(''));
let ast2 = mapExp(text.split(''));
console.log('ast2:\n', format(ast2[0]));
