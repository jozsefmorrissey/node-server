


let defaultAccuracy;

class Approximate {
  constructor(accuracy) {
    if ((typeof accuracy) !== 'number' || accuracy === defaultAccuracy) return Approximate.default;

    function approximate(value) {
      return Math.round(value * accuracy) / accuracy;
    }

    function approximateFunc(test) {
      return function () {
        if (arguments.length === 2) return test(approximate(arguments[0]), approximate(arguments[1]));
        for (let index = 1; index < arguments.length; index++) {
          if (!test(approximate(arguments[index - 1]), approximate(arguments[index]))) return false;
        }
        return true;
      }
    }
    approximate.eq = approximateFunc((one, two) => one === two);
    approximate.neq = approximateFunc((one, two) => one !== two);
    approximate.gt = approximateFunc((one, two) => one > two);
    approximate.lt = approximateFunc((one, two) => one < two);
    approximate.gteq = approximateFunc((one, two) => one >= two);
    approximate.lteq = approximateFunc((one, two) => one <= two);
    approximate.eqAbs = approximateFunc((one, two) => Math.abs(one) === Math.abs(two));
    approximate.neqAbs = approximateFunc((one, two) => Math.abs(one) !== Math.abs(two));
    approximate.abs = (value) => Math.abs(approximate(value));
    return approximate;
  }
}


Approximate.setDefault = (accuracy) => {
  if ((typeof accuracy) !== 'number') throw new Error('Must enter a number for accuracy: hint must be a power of 10');
  Approximate.default = new Approximate(accuracy);
  defaultAccuracy = accuracy;
  Approximate.default.new = (acc) => new Approximate(acc);
  Approximate.default.setDefault = Approximate.default;
}

Approximate.setDefault(1000);

module.exports  = Approximate.default;
