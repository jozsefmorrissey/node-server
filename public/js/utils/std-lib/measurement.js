
  try {
    Lookup = require('../object/lookup');
    StringMathEvaluator = require('../string-math-evaluator');
  } catch(e) {
    console.error(e);
  }


function regexToObject (str, reg) {
  const match = str.match(reg);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 2; index < arguments.length; index += 1) {
    const attr = arguments[index];
    if (attr && match[index - 1]) returnVal[attr] = match[index - 1];
  }
  return returnVal;
}

let units = [
  'cm',
  'inch',
  'mm'
]
const BASE_UNITS = units[0];
let unit = units[1];

let areaUnits = [
  'SQMM',
  'SQCM',
  'SQM',
  'SQIN',
  'SQFT'
]

const convertMetricToUs = (standardDecimal) =>  standardDecimal / 2.54;
const convertUsToMetric = (standardDecimal) => value = standardDecimal * 2.54;
const convertmmToMetric = (standardDecimal) => value = standardDecimal / 10;

const determineUnit = (notMetric) => {
  if ((typeof notMetric === 'string')) {
    const index = units.indexOf(notMetric);
    if (index !== -1) return units[index];
  } else if ((typeof notMetric) === 'boolean') {
    if (notMetric === true) return unit;
  }
  return BASE_UNITS;
}

function standardize(ambiguousDecimal, notMetric) {
  switch (determineUnit(notMetric)) {
    case units[0]:
      return ambiguousDecimal;
    case units[1]:
      return convertUsToMetric(ambiguousDecimal);
    case units[2]:
      return convertmmToMetric(ambiguousDecimal);
    default:
      throw new Error('This should not happen, Measurement.unit should be the gate keeper that prevents invalid units from being set');
  }
}

Measurement = function (value, notMetric) {
    if ((typeof value) === 'string') {
      value += ' '; // Hacky fix for regularExpression
    }

    this.clone = (decimal) => new Measurement(decimal === undefined ? this.decimal() : decimal);

    let decimal = 0;
    let nan = value === null || value === undefined;
    this.isNaN = () => nan;
    this.equals = (other) => (other instanceof Measurement) && other.decimal() === this.decimal();

    const parseFraction = (str) => {
      const regObj = regexToObject(str, Measurement.regex.full(), 'integer', 'numerator', 'denominator', 'stOsh', 'integer', 'stOsh');
      regObj.integer = Number.parseFloat(regObj.integer) || 0;
      regObj.numerator = Number.parseFloat(regObj.numerator) || 0;
      regObj.denominator = Number.parseFloat(regObj.denominator) || 0;
      if(regObj.denominator === 0) {
        regObj.numerator = 0;
        regObj.denominator = 1;
      }
      if (regObj.stOsh) {
        const coef = 32 / regObj.denominator;
        regObj.numerator = (coef * regObj.numerator) + (regObj.stOsh === 'st' ? 1 : -1);
        regObj.denominator *= coef;
      }
      const numCoef = regObj.integer < 0 ? -1 : 1;
      regObj.decimal = regObj.integer + (numCoef * regObj.numerator / regObj.denominator);
      return regObj;
    };

    const reduceObj = (numerator, denominator, str) =>
          ({numerator: numerator === denominator ? 0 : numerator,
            denominator,str,addOne: numerator/denominator === 1});
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
        return {numerator: 0, denominator, str: ''};
      }
      if (denominator === 32) {
        const bigger = reduce((numerator + 1)/2, denominator/2, true);
        const smaller = reduce((numerator - 1)/2, denominator/2, true);
        if (!bigger.numerator) return reduceObj(1, 1, 'sh');
        if (bigger.denominator < smaller.denominator)
          return  reduceObj(bigger.numerator, bigger.denominator, `sh`);

        return !smaller ? reduceObj(smaller.numerator, smaller.denominator, 'st') :
                  reduceObj(smaller.numerator, smaller.denominator, `st`);
      }
      return reduceObj(numerator, denominator, '');
    }

    //TODO: This could easily be more efficient.... bigger fish.
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
      const diff1 = Math.abs(decimalValue) - ((numerator - fracObj.numerator) / denominator);
      const diff2 = (numerator / denominator) - Math.abs(decimalValue);
      numerator -= diff1 + .0001 < diff2 ? fracObj.numerator : 0;
      const integer = sign * Math.floor(numerator / denominator);
      numerator = numerator % denominator;
      return {integer, numerator, denominator};
    }

    this.fraction = (accuracy, standardDecimal) => {
      standardDecimal = standardDecimal || decimal;
      if (nan) return NaN;
      const obj = fractionEquivalent(standardDecimal, accuracy);
      if (obj.integer === 0 && obj.numerator === 0) return '0';
      let integer = Math.abs(obj.integer !== 0 ? obj.integer : 0);

      const reduction = reduce(obj.numerator, obj.denominator);
      const mag = standardDecimal > 0 ? '' : '-'
      if (reduction.addOne) integer += 1;
      const frac = reduction.numerator === 0 ?
                      '' : `${reduction.numerator}/${reduction.denominator}`
      const str = reduction.str ? `${frac}${reduction.str}` : frac;
      return mag + (integer || !frac ? (str ? `${integer} ${str}` : `${integer}`) : (str ? str : 0));
    }
    this.standardUS = (accuracy) => this.fraction(accuracy, convertMetricToUs(decimal));

    this.display = (accuracy, dispUnit) => {
      switch (dispUnit || this.unit()) {
        case units[0]: return new String(this.decimal(accuracy || .1), units[0]);
        case units[1]: return this.standardUS(accuracy);
        case units[2]: return new String(Math.roundTo(this.decimal() * 10, accuracy || .1), units[2]);
        default:
            return this.standardUS(accuracy);
      }
    }

    // TODO: Remove
    this.value = (accuracy) => this.decimal(accuracy);

    this.decimal = (accuracy, convert) => {
      if (nan) return NaN;
      if (!accuracy) accuracy = 1e-32;
      const unit = Boolean.is(convert) ? (convert ? this.unit() : BASE_UNITS) :
                      convert ? convert : BASE_UNITS;
      switch (unit) {
        case units[0]: return Math.roundTo(decimal, accuracy);
        case units[1]: return Math.roundTo(convertMetricToUs(decimal), accuracy);
        case units[2]: return Math.roundTo(decimal * 10, accuracy);
        default: return Math.roundTo(decimal, accuracy);
      }
    }
    this.ceil = (convert) => new Measurement(Math.ceil(this.decimal(.00000001, (convert || true))), convert || true);
    this.floor = (convert) => new Measurement(Math.floor(this.decimal(.00000001, (convert || true))), convert || true);

    function getDecimalEquivalant(string) {
      string = string.trim();
      if (string.match(Measurement.decimalReg)) {
        return Number.parseFloat(string);
      } else if (string.match(Measurement.regex.full())) {
        return parseFraction(string).decimal
      } else {
        const value = Measurement.sme(string);
        if ((typeof value) === 'number') return value;
      }
      nan = true;
      return NaN;
    }

    this.unit = (unit) => unit !== undefined ? (notMetric = unit) : notMetric || Measurement.unit();

    if ((typeof value) === 'number') {
      decimal = standardize(value, notMetric);
    } else if ((typeof value) === 'string') {
      try {
        const ambiguousDecimal = getDecimalEquivalant(value);
        decimal = standardize(ambiguousDecimal, notMetric);
      } catch (e) {
        nan = true;
      }
    } else {
      nan = true;
    }
  }

Measurement.display = (value, notMetric) => {
  return new Measurement(value, notMetric).display();
}

const convertSqUnitToStd = (unit) => {
  const match = unit.match(/^([a-zA-Z]*)2$/);
  return match ? `SQ${match[1].toUppercase()}` : unit;
}
Measurement.tocm2 = (factors, unit) => {
  unit = convertSqUnitToStd(unit);
  switch (unit) {
    case 'SQMM': return factors[0] * factors[1] / 100;
    case 'SQM': return factors[0] * factors[1] * 100000;
    case 'SQIN': return factors[0] * factors[1] * 6.4516;
    case 'SQFT': return factors[0] * factors[1] * 929.0304;
    case 'SQCM': return factors[0] * factors[1];

    default: throw new Error(`Unkown unit: ${unit}`);
  }
}

Measurement.display.area = (SQCM, units, percision) => {
  if (!percision) percision = .1;
  if (!units) units = Measurement.unit() === Measurement.units()[1] ? 'SQFT' : undefined;
  units = convertSqUnitToStd(units);
  if (units) {
    const breakdown = Measurement.areaReg.breakdown(units);
    if (breakdown) {
      const quantity = Measurement.tocm2(breakdown.factors, breakdown.unit);
      return `${SQCM/quantity} - ${breakdown.factors[0]} X ${breakdown.factors[1]} ${breakdown.unit} Sheets`;
    }
  }
  switch (units) {
    case 'SQMM': return `${Measurement.round(SQCM * 100, percision)} mm2`;
    case 'SQM': return `${Measurement.round(SQCM / 100000, percision)} M2`;
    case 'SQIN': return `${Measurement.round(SQCM / 6.4516, percision)} SQ IN`;
    case 'SQFT': return `${Measurement.round(SQCM / 929.0304, percision)} SQ FT`;// ~ ${Measurement.round(SQCM / 29729, percision)}, 4 X 8 Sheets`;


    default: return `${SQCM} cm2`;

  }
}

Measurement.unit = (newUnit) => {
  for (index = 0; index < units.length; index += 1) {
    if (newUnit === units[index]) unit = newUnit;
  }
  return unit
};
Measurement.unit.BASE = BASE_UNITS;
Measurement.sme = new StringMathEvaluator(Math).eval;
Measurement.units = () => JSON.parse(JSON.stringify(units));


const nr = Number.regex.source;
Measurement.regex = new RegExp(`(?:(${nr}\\s{1,}|)(${nr})/(${nr})(st|sh|)|(${nr})(st|sh|))`);

Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;
Measurement.decimalReg = new RegExp(`(^${Number.regex.source}$)`);///(^(-|)[0-9]*(\.|$|^)[0-9]*)$/;
const areaRegStr = `^(${Number.regex.source})(x|X)(${Number.regex.source})((SQ)[a-zA-Z]{1,})$`;
Measurement.areaReg = new RegExp(areaRegStr);
Measurement.areaReg.breakdown = (str) => {
  const match = str.match(Measurement.areaReg);
  return match ? {factors: [Number.parseFloat(match[1]), Number.parseFloat(match[5])],
                  unit: match[8]} : null;
}

Measurement.fromString = (string, unit) => {
  if (!string.match(Measurement.regex)) return null;
  if (unit === undefined) unit = false;
  return new Measurement(string, unit);
}

Measurement.decimal = (value, unit) => {
  if ((typeof value) === 'string') return Measurement.fromString(value, unit).decimal();
  return new Measurement(value, unit).decimal();
}

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

Measurement.area = function (demensions, notMetric) {
  if (demensions.length === 0) return 0;
  let area = 0;
  for (let index = 0; index < demensions.length; index++) {
    const dem = demensions[index];
    area += standardize(dem.x, notMetric) * standardize(dem.y, notMetric);
  }
  return area;
}

Measurement.round = (value, percision) => {
  if (percision)
  return new Measurement(value).decimal(percision);
  return Math.round(value * 10000000) / 10000000;
}

try {
  module.exports = Measurement;
} catch (e) {}
