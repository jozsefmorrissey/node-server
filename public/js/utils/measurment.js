

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

class Measurement {
  constructor(value, isMetric) {
    if ((typeof value) === 'string') {
      value += ' '; // Hacky fix for regularExpression
    }

    let decimal = 0;
    let nan = false;
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

    function calculateValue(accuracy) {
      accuracy = accuracy || '1/1000'
      const fracObj = parseFraction(accuracy);
      const denominator = fracObj.denominator;
      if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
        throw new Error('Please enter a fraction with a denominator between (0, 1000]')
      }
      let standardDecimal = decimal / 2.54;
      let sign = standardDecimal > 0 ? 1 : -1;
      let remainder = Math.abs(standardDecimal);
      let currRemainder = remainder;
      let value = 0;
      let numerator = 0;
      while (currRemainder > 0) {
        numerator += fracObj.numerator;
        currRemainder -= fracObj.decimal;
      }
      const diff1 = standardDecimal - ((numerator - fracObj.numerator) / denominator);
      const diff2 = (numerator / denominator) - standardDecimal;
      numerator -= diff1 < diff2 ? fracObj.numerator : 0;
      const integer = sign * Math.floor(numerator / denominator);
      numerator = numerator % denominator;
      return {integer, numerator, denominator};
    }

    this.fraction = (accuracy) => {
      if (nan) return NaN;
      const obj = calculateValue(accuracy);
      if (obj.integer === 0 && obj.numerator === 0) return '0';
      const integer = obj.integer !== 0 ? obj.integer : '';
      return `${integer}${reduce(obj.numerator, obj.denominator)}`;
    }
    this.standard = this.fraction;

    this.decimal = (accuracy) => {
      accuracy = accuracy % 10 ? accuracy : 10;
      return Math.round(decimal * accuracy) / accuracy;
    }
    const convertToMetric = (standardDecimal) => value = standardDecimal * 2.54;

    if ((typeof value) === 'number') {
      if (!isMetric) {
          convertToMetric(value);
      }
      decimal = value;
    } else if ((typeof value) === 'string') {
      try {
        if (!isMetric) {
          const standardDecimal = parseFraction(value).decimal;
          convertToMetric(standardDecimal);
        }
        decimal = value;
      } catch (e) {
        nan = true;
      }
    } else {
      nan = true;
    }
  }
}

Measurement.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;

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

Measurement.round = (value, percision) => {
  if (percision)
  return new Measurement(value).decimal(percision);
  return Math.round(value * 10000000) / 10000000;
}

try {
  module.exports = Measurement;
} catch (e) {/* TODO: Consider Removing */}
