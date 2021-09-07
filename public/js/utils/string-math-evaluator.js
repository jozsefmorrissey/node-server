




const Measurement = require('./measurment');

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

class StringMathEvaluator {
  constructor(globalScope, resolver) {
    globalScope = globalScope || {};
    const instance = this;
    let splitter = '.';
    let cache = {};

    function resolve (path, currObj, globalCheck) {
      if (path === '') return currObj;
      const resolved = !globalCheck && resolver && resolver(path, currObj);
      if (resolved) return resolved;
      try {
        if ((typeof path) === 'string') path = path.split(splitter);
        for (let index = 0; index < path.length; index += 1) {
          currObj = currObj[path[index]];
        }
        if (currObj === undefined && !globalCheck) throw Error('try global');
        return currObj;
      }  catch (e) {
        return resolve(path, globalScope, true);
      }
    }

    function multiplyOrDivide (values, operands) {
      const op = operands[operands.length - 1];
      if (op === StringMathEvaluator.multi || op === StringMathEvaluator.div) {
        const len = values.length;
        values[len - 2] = op(values[len - 2], values[len - 1])
        values.pop();
        operands.pop();
      }
    }

    const resolveArguments = (initialChar, func) => {
      return function (expr, index, values, operands, scope, path) {
        if (expr[index] === initialChar) {
          const args = [];
          let endIndex = index += 1;
          const terminationChar = expr[index - 1] === '(' ? ')' : ']';
          let terminate = false;
          let openParenCount = 0;
          while(!terminate && endIndex < expr.length) {
            const currChar = expr[endIndex++];
            if (currChar === '(') openParenCount++;
            else if (openParenCount > 0 && currChar === ')') openParenCount--;
            else if (openParenCount === 0) {
              if (currChar === ',') {
                args.push(expr.substr(index, endIndex - index - 1));
                index = endIndex;
              } else if (openParenCount === 0 && currChar === terminationChar) {
                args.push(expr.substr(index, endIndex++ - index - 1));
                terminate = true;
              }
            }
          }

          for (let index = 0; index < args.length; index += 1) {
            args[index] = instance.eval(args[index], scope);
          }
          const state = func(expr, path, scope, args, endIndex);
          if (state) {
            values.push(state.value);
            return state.endIndex;
          }
        }
      }
    };

    function chainedExpressions(expr, value, endIndex, path) {
      if (expr.length === endIndex) return {value, endIndex};
      let values = [];
      let offsetIndex;
      let valueIndex = 0;
      let chained = false;
      do {
        const subStr = expr.substr(endIndex);
        const offsetIndex = isolateArray(subStr, 0, values, [], value, path) ||
                            isolateFunction(subStr, 0, values, [], value, path) ||
                            (subStr[0] === '.' &&
                              isolateVar(subStr, 1, values, [], value));
        if (Number.isInteger(offsetIndex)) {
          value = values[valueIndex];
          endIndex += offsetIndex - 1;
          chained = true;
        }
      } while (offsetIndex !== undefined);
      return {value, endIndex};
    }

    const isolateArray = resolveArguments('[',
      (expr, path, scope, args, endIndex) => {
        endIndex = endIndex - 1;
        let value = resolve(path, scope)[args[args.length - 1]];
        return chainedExpressions(expr, value, endIndex, '');
      });

    const isolateFunction = resolveArguments('(',
      (expr, path, scope, args, endIndex) =>
          chainedExpressions(expr, resolve(path, scope).apply(null, args), endIndex - 1, ''));

    function isolateParenthesis(expr, index, values, operands, scope) {
      const char = expr[index];
      if (char === ')') throw new Error('UnExpected closing parenthesis');
      if (char === '(') {
        let openParenCount = 1;
        let endIndex = index + 1;
        while(openParenCount > 0 && endIndex < expr.length) {
          const currChar = expr[endIndex++];
          if (currChar === '(') openParenCount++;
          if (currChar === ')') openParenCount--;
        }
        if (openParenCount > 0) throw new Error('UnClosed parenthesis');
        const len = endIndex - index - 2;
        values.push(instance.eval(expr.substr(index + 1, len), scope));
        multiplyOrDivide(values, operands);
        return endIndex;
      }
    };

    function isolateOperand (char, operands) {
      if (char === ')') throw new Error('UnExpected closing parenthesis');
      switch (char) {
        case '*':
        operands.push(StringMathEvaluator.multi);
        return true;
        break;
        case '/':
        operands.push(StringMathEvaluator.div);
        return true;
        break;
        case '+':
        operands.push(StringMathEvaluator.add);
        return true;
        break;
        case '-':
        operands.push(StringMathEvaluator.sub);
        return true;
        break;
      }
      return false;
    }

    function isolateValueReg(reg, resolver) {
      return function (expr, index, values, operands, scope) {
        const match = expr.substr(index).match(reg);
        let args;
        if (match) {
          let endIndex = index + match[0].length;
          let value = resolver(match[0], scope);
          if (!Number.isFinite(value)) {
            const state = chainedExpressions(expr, scope, endIndex, match[0]);
            if (state !== undefined) {
              value = state.value;
              endIndex = state.endIndex;
            }
          }
          values.push(value);
          multiplyOrDivide(values, operands);
          return endIndex;
        }
      }
    }

    function convertFeetInchNotation(expr) {
      expr = expr.replace(StringMathEvaluator.footInchReg, '($1*12+$2)') || expr;
      expr = expr.replace(StringMathEvaluator.inchReg, '$1') || expr;
      expr = expr.replace(StringMathEvaluator.footReg, '($1*12)') || expr;
      return expr = expr.replace(StringMathEvaluator.mixedNumberReg, '($1+$2)') || expr;;
    }
    function addUnexpressedMultiplicationSigns(expr) {
      expr = expr.replace(/([0-9]{1,})(\s*)([a-zA-Z]{1,})/g, '$1*$3');
      expr = expr.replace(/([a-zA-Z]{1,})\s{1,}([0-9]{1,})/g, '$1*$2');
      expr = expr.replace(/\)([^\s^+^-^*^\/])/g, ')*$1');
      return expr.replace(/([^\s^+^-^*^\/])\(/g, '$1*(');
    }

    const isolateNumber = isolateValueReg(StringMathEvaluator.numReg, Number.parseFloat);
    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);

    this.cache = (expr) => {
      const time = new Date().getTime();
      if (cache[expr] && cache[expr].time > time - 200) {
        cache[expr].time = time;
        return cache[expr].value;
      }
      return null
    }

    this.eval = function (expr, scope, percision) {
      if (instance.cache(expr) !== null) return instance.cache(expr);
      if (Number.isFinite(expr))
        return expr;
      expr = new String(expr);
      expr = addUnexpressedMultiplicationSigns(expr);
      expr = convertFeetInchNotation(expr);
      scope = scope || globalScope;
      const allowVars = (typeof scope) === 'object';
      let operands = [];
      let values = [];
      let prevWasOpperand = true;
      for (let index = 0; index < expr.length; index += 1) {
        const char = expr[index];
        if (prevWasOpperand) {
          try {
            if (isolateOperand(char, operands)) throw new Error('Invalid operand location');
            let newIndex = isolateParenthesis(expr, index, values, operands, scope) ||
                isolateNumber(expr, index, values, operands, scope) ||
                (allowVars && isolateVar(expr, index, values, operands, scope));
            if (Number.isInteger(newIndex)) {
              index = newIndex - 1;
              prevWasOpperand = false;
            }
          } catch (e) {
            console.error(e);
            return NaN;
          }
        } else {
          prevWasOpperand = isolateOperand(char, operands);
        }
      }
      if (prevWasOpperand) return NaN;

      let value = values[0];
      for (let index = 0; index < values.length - 1; index += 1) {
        value = operands[index](values[index], values[index + 1]);
        values[index + 1] = value;
      }

      if (Number.isFinite(value)) {
        cache[expr] = {time: new Date().getTime(), value};
        return StringMathEvaluator.round(value);
      }
      return NaN;
    }
  }
}

StringMathEvaluator.round = (value, percision) => {
  if (percision)
    return new Measurement(value).decimal(percision);
  return Math.round(value * 10000000) / 10000000;
}
StringMathEvaluator.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;

StringMathEvaluator.mixedNumberReg = /([0-9]{1,})\s{1,}([0-9]{1,}\/[0-9]{1,})/g;
StringMathEvaluator.footInchReg = /\s*([0-9]{1,})\s*'\s*([0-9\/ ]{1,})\s*"\s*/g;
StringMathEvaluator.footReg = /\s*([0-9]{1,})\s*'\s*/g;
StringMathEvaluator.inchReg = /\s*([0-9]{1,})\s*"\s*/g;
StringMathEvaluator.evaluateReg = /[-\+*/]|^\s*[0-9]{1,}\s*$/;
StringMathEvaluator.numReg = /^(-|)[0-9\.]{1,}/;
StringMathEvaluator.varReg = /^((\.|)([a-zA-Z][a-zA-Z0-9\.]*))/;
StringMathEvaluator.multi = (n1, n2) => n1 * n2;
StringMathEvaluator.div = (n1, n2) => n1 / n2;
StringMathEvaluator.add = (n1, n2) => n1 + n2;
StringMathEvaluator.sub = (n1, n2) => n1 - n2;

StringMathEvaluator.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];


StringMathEvaluator.reduce = function(numerator, denominator) {
  let reduced = true;
  while (reduced) {
    reduced = false;
    for (let index = 0; index < StringMathEvaluator.primes.length; index += 1) {
      const prime = StringMathEvaluator.primes[index];
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
  return `${numerator}/${denominator}`;
}

StringMathEvaluator.parseFraction = function (str) {
  const regObj = regexToObject(str, StringMathEvaluator.regex, null, 'integer', null, 'numerator', 'denominator');
  regObj.integer = Number.parseInt(regObj.integer) || 0;
  regObj.numerator = Number.parseInt(regObj.numerator) || 0;
  regObj.denominator = Number.parseInt(regObj.denominator) || 0;
  if(regObj.denominator === 0) {
    regObj.numerator = 0;
    regObj.denominator = 1;
  }
  regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
  return regObj;
}

StringMathEvaluator.toFraction = function (decimal, accuracy) {
  if (decimal === NaN) return NaN;
  accuracy = accuracy || '1/1000'
  const fracObj = StringMathEvaluator.parseFraction(accuracy);
  const denominator = fracObj.denominator;
  if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
    throw new Error('Please enter a fraction with a denominator between (0, 1000]')
  }
  let remainder = decimal;
  let currRemainder = remainder;
  let value = 0;
  let numerator = 0;
  while (currRemainder > 0) {
    numerator += fracObj.numerator;
    currRemainder -= fracObj.decimal;
  }
  const diff1 = decimal - ((numerator - fracObj.numerator) / denominator);
  const diff2 = (numerator / denominator) - decimal;
  numerator -= diff1 < diff2 ? fracObj.numerator : 0;
  const integer = Math.floor(numerator / denominator);
  numerator = numerator % denominator;
  const fraction = StringMathEvaluator.reduce(numerator, denominator);
  return (integer && fraction ? `${integer} ${fraction}` :
            (integer ? `${integer}` : (fraction ? `${fraction}` : '0')));
}

module.exports = StringMathEvaluator;




