
  try {
    Lookup = require('./object/lookup');
    StringMathEvaluator = require('./string-math-evaluator');
  } catch(e) {}


function regexToObject (str, reg) {
  const match = str.match(reg);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 2; index < arguments.length; index += 1) {
    const attr = arguments[index];
    if (attr) returnVal[attr] = match[index - 1];
  }
  return returnVal;
}

let units = [
  'Metric',
  'Imperial (US)'
]
let unit = units[1];


class Measurement extends Lookup {
  constructor(value, notMetric) {
    super();
    if ((typeof value) === 'string') {
      value += ' '; // Hacky fix for regularExpression
    }

    const determineUnit = () => {
      if ((typeof notMetric === 'string')) {
        const index = units.indexOf(notMetric);
        if (index !== -1) return units[index];
      } else if ((typeof notMetric) === 'boolean') {
        if (notMetric === true) return unit;
      }
      return units[0];
    }

    let decimal = 0;
    let nan = value === null || value === undefined;
    this.isNaN = () => nan;

    const parseFraction = (str) => {
      const regObj = regexToObject(str, Measurement.regex, null, 'integer', null, 'numerator', 'denominator');
      regObj.integer = Number.parseInt(regObj.integer) || 0;
      regObj.numerator = Number.parseInt(regObj.numerator) || 0;
      regObj.denominator = Number.parseInt(regObj.denominator) || 0;
      if(regObj.denominator === 0) {
        regObj.numerator = 0;
        regObj.denominator = 1;
      }
      regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
      return regObj;
    };

    function reduce(numerator, denominator) {
      let reduced = true;
      while (reduced) {
        reduced = false;
        for (let index = 0; index < Measurement.primes.length; index += 1) {
          const prime = Measurement.primes[index];
          if (prime >= denominator) break;
          if (numerator % prime === 0 && denominator % prime === 0) {
            numerator = numerator / prime;
            denominator = denominator / prime;
            reduced = true;
            break;
          }
        }
      }
      if (numerator === 0) {
        return '';
      }
      return ` ${numerator}/${denominator}`;
    }

    function fractionEquivalent(decimalValue, accuracy) {
      accuracy = accuracy || '1/32'
      const fracObj = parseFraction(accuracy);
      const denominator = fracObj.denominator;
      if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
        throw new Error('Please enter a fraction with a denominator between (0, 1000]')
      }
      let sign = decimalValue > 0 ? 1 : -1;
      let remainder = Math.abs(decimalValue);
      let currRemainder = remainder;
      let value = 0;
      let numerator = 0;
      while (currRemainder > 0) {
        numerator += fracObj.numerator;
        currRemainder -= fracObj.decimal;
      }
      const diff1 = decimalValue - ((numerator - fracObj.numerator) / denominator);
      const diff2 = (numerator / denominator) - decimalValue;
      numerator -= diff1 < diff2 ? fracObj.numerator : 0;
      const integer = sign * Math.floor(numerator / denominator);
      numerator = numerator % denominator;
      return {integer, numerator, denominator};
    }

    this.fraction = (accuracy, standardDecimal) => {
      standardDecimal = standardDecimal || decimal;
      if (nan) return NaN;
      const obj = fractionEquivalent(standardDecimal, accuracy);
      if (obj.integer === 0 && obj.numerator === 0) return '0';
      const integer = obj.integer !== 0 ? obj.integer : '';
      return `${integer}${reduce(obj.numerator, obj.denominator)}`;
    }
    this.standardUS = (accuracy) => this.fraction(accuracy, convertMetricToUs(decimal));

    this.display = (accuracy) => {
      switch (unit) {
        case units[0]: return this.decimal(accuracy);
        case units[1]: return this.standardUS(accuracy);
        default:
            return this.standardUS(accuracy);
      }
    }

    this.value = (accuracy) => this.decimal(accuracy);

    this.decimal = (accuracy) => {
      if (nan) return NaN;
      accuracy = accuracy % 100 ? accuracy : 100;
      return Math.round(decimal * accuracy) / accuracy;
    }

    function getDecimalEquivalant(string) {
      string = string.trim();
      if (string.match(Measurement.decimalReg)) {
        return Number.parseFloat(string);
      } else if (string.match(StringMathEvaluator.fractionOrMixedNumberReg)) {
        return parseFraction(string).decimal
      }
      nan = true;
      return NaN;
    }

    const convertMetricToUs = (standardDecimal) =>  standardDecimal / 2.54;
    const convertUsToMetric = (standardDecimal) => value = standardDecimal * 2.54;

    function standardize(ambiguousDecimal) {
      switch (determineUnit()) {
        case units[0]:
          return ambiguousDecimal;
        case units[1]:
          return convertUsToMetric(ambiguousDecimal);
        default:
          throw new Error('This should not happen, Measurement.unit should be the gate keeper that prevents invalid units from being set');
      }
    }

    if ((typeof value) === 'number') {
      decimal = standardize(value);
    } else if ((typeof value) === 'string') {
      try {
        const ambiguousDecimal = getDecimalEquivalant(value);
        decimal = standardize(ambiguousDecimal);
      } catch (e) {
        nan = true;
      }
    } else {
      nan = true;
    }
  }
}

Measurement.unit = (newUnit) => {
  for (index = 0; index < units.length; index += 1) {
    if (newUnit === units[index]) unit = newUnit;
  }
  return unit
};
Measurement.units = () => JSON.parse(JSON.stringify(units));
Measurement.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;
Measurement.decimalReg = /(^(-|)[0-9]*(\.|$|^)[0-9]*)$/;


Measurement.validation = function (range) {
  const obj = regexToObject(range, Measurement.rangeRegex, 'minBound', 'min', 'max', 'maxBound');
  let min = obj.min.trim() !== '' ?
        new Measurement(obj.min).decimal() : Number.MIN_SAFE_INTEGER;
  let max = obj.max.trim() !== '' ?
        new Measurement(obj.max).decimal() : Number.MAX_SAFE_INTEGER;
  const minCheck = obj.minBound === '(' ? ((val) => val > min) : ((val) => val >= min);
  const maxCheck = obj.maxBound === ')' ? ((val) => val < max) : ((val) => val <= max);
  return function (value) {
    const decimal = new Measurement(value).decimal();
    if (decimal === NaN) return false;
    return minCheck(decimal) && maxCheck(decimal);
  }
}

Measurement.decimal = (value) => {
  return new Measurement(value, true).decimal();
}

Measurement.round = (value, percision) => {
  if (percision)
  return new Measurement(value).decimal(percision);
  return Math.round(value * 10000000) / 10000000;
}

try {
  module.exports = Measurement;
} catch (e) {/* TODO: Consider Removing */}
