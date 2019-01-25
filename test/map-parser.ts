export let mapNum = (xs: any[]) => {
  return xs.map((x: string) => {
    if (x.length === 1 && '0' <= x && x <= '9') {
      return { type: 'number', value: x.charCodeAt(0) - 48 };
    }
    return x;
  });
};
export let mapOp = (xs: any[]) => {
  let ys = [];
  for (let i = 0; i < xs.length; i++) {
    switch (xs[i]) {
      case '+':
      case '-':
      case '*':
      case '/':
        let left = ys.pop();
        let op = xs[i];
        let right = xs[i + 1];
        ys.push({
          type: 'op',
          left,
          op,
          right,
        });
        break;
      default:
        ys.push(xs[i]);
    }
  }
  return ys;
};
export let mapExp = cs => mapOp(mapNum(cs));
