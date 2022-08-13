

function approximate(value, acc) {
  acc ||= approximate.accuracy || 1000;
  return Math.round(value * acc) / acc;
}

approximate.accuracy = 1000;
approximate.eq = (val1, val2) => approximate(val1) === approximate(val2);
approximate.neq = (val1, val2) => approximate(val1) !== approximate(val2);
approximate.gt = (val1, val2) => approximate(val1) > approximate(val2);
approximate.lt = (val1, val2) => approximate(val1) < approximate(val2);
approximate.gteq = (val1, val2) => approximate(val1) >= approximate(val2);
approximate.lteq = (val1, val2) => approximate(val1) <= approximate(val2);

module.exports  = approximate;
