

function approximate(value, acc) {
  acc ||= approximate.accuracy || 1000;
  return Math.round(value * acc) / acc;
}

approximate.accuracy = 1000000000;
approximate.eq = (val1, val2, acc) => approximate(val1, acc) === approximate(val2, acc);
approximate.neq = (val1, val2, acc) => approximate(val1, acc) !== approximate(val2, acc);
approximate.gt = (val1, val2, acc) => approximate(val1, acc) > approximate(val2, acc);
approximate.lt = (val1, val2, acc) => approximate(val1, acc) < approximate(val2, acc);
approximate.gteq = (val1, val2, acc) => approximate(val1, acc) >= approximate(val2, acc);
approximate.lteq = (val1, val2, acc) => approximate(val1, acc) <= approximate(val2, acc);

module.exports  = approximate;
