
function arraySet(array, values, start, end) {
  if (start!== undefined && end !== undefined && start > end) {
    const temp = start;
    start = end;
    end = temp;
  }
  start = start || 0;
  end = end || values.length;
  for (let index = start; index < end; index += 1)
    array[index] = values[index];
  return array;
}

Function.safeStdLibAddition(Array, 'isItterable', (itterable) => itterable && itterable[Symbol.iterator] instanceof Function, true);
Function.safeStdLibAddition(Array, 'set',   arraySet, true);
Function.safeStdLibAddition(Array, 'set',   function (values, start, end) {return arraySet(this, values, start, end)});

Function.safeStdLibAddition(Array, 'copy',   function (other) {
  if (Array.isArray(other)) {
    this.deleteAll();
    this.merge(other, false);
  } else {
    const newArr = [];
    newArr.merge(this, false);
    return newArr;
  }
});

Function.safeStdLibAddition(Array, 'filterSplit',   function (filter, truthy) {
  const retVal = {};
  for (let index = 0; index < this.length; index++) {
    let path = filter(this[index]);
    if (truthy === true) path = path && true;
    if (retVal.pathValue(path) === undefined) retVal.pathValue(path, []);
    retVal.pathValue(path).push(this[index]);
  }
  return retVal;
});

Function.safeStdLibAddition(Array, 'idMap',   function (idFunc) {
  const retVal = {};
  for (let index = 0; index < this.length; index++) {
    let id = idFunc(this[index]);
    retVal[id] = this[index];
  }
  return retVal;
});

// TODO: make moore efficient... dis es terible
Function.safeStdLibAddition(Array, 'unique', function (attrFunc) {
  if (!(attrFunc instanceof Function)) attrFunc = (e) => e;
  return this.filter((() => {let found = []; return (e) => found.indexOf(attrFunc(e)) === -1 && (found.push(attrFunc(e)) || e);})());
});

Function.safeStdLibAddition(Array, 'equals', function (other, startIndex, endIndex) {
    startIndex =  startIndex > -1 ? startIndex : 0;
    endIndex = endIndex < this.length ? endIndex : this.length;
    if (endIndex < other.length) return false;
    let equal = true;
    for (let index = startIndex; equal && index < endIndex; index += 1) {
      const elem = this[index];
      if (elem && (typeof elem.equals) === 'function') {
        if (!elem.equals(other[index])) {
          return index;
        }
      } else if (!Object.equals(elem, other[index])) {
        equal = false;
      }
    }
    return equal;
});

Function.safeStdLibAddition(Array, 'removeAll', function (arr) {
  for (let index = 0; index < arr.length; index += 1) {
    this.remove(arr[index]);
  }
});

Function.safeStdLibAddition(Array, 'removeWhere', function (func) {
  for (let index = 0; index < this.length; index += 1) {
    if (func(this[index])) {
      this.splice(index--, 1)
    }
  }
});

Function.safeStdLibAddition(Array, 'findIndicies', function (func) {
  const indicies = [];
  for (let index = 0; index < this.length; index += 1) {
    if (func(this[index])) indicies.push(index);
  }
  return indicies;
});


Function.safeStdLibAddition(Array, 'deleteAll', function () {
  this.forEach((v, i) => delete this[i]);
  this.length = 0;
});

// Ripped off of: https://stackoverflow.com/a/2450976
Function.safeStdLibAddition(Array, 'shuffle', function() {
  let currentIndex = this.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex], this[currentIndex]];
  }

  return this;
});

Function.safeStdLibAddition(Array, 'count', function(funcOrVal, max) {
  let count = 0;
  const call = (typeof funcOrVal) === 'function';
  for (let index = 0; index < this.length; index++) {
    const retVal = call ? funcOrVal(this[index]) : funcOrVal === this[index];
    count += (typeof retVal) === 'number' ? retVal : (retVal ? 1 : 0);
    if (count >= max) return max;
  }
  return count;
});

Function.safeStdLibAddition(Array, 'contains', function(value, max) {
  const funcOrVal = value && (typeof value.equals) === 'function' ? value.equals : value;
  return this.count(funcOrVal, 1) === 1;
});

const primes = [3,5,7,11,17,19,23,29];
const firstNotInList = (targetList, ignoreList) => {
  for (let index = 0; index < targetList.length; index++) {
    if (ignoreList.indexOf(targetList[index]) === -1) return {item: targetList[index], index};
  }
  return null;
}
Function.safeStdLibAddition(Array, 'systematicSuffle', function (numberOfSuffles, doNotShufflePrimes) {
  const ps = [];
  ps.copy(primes);
  const map = {};
  let primeCount = 0;
  let loops = 0;
  const lastSeven = [];
  for (let index = 0; index < numberOfSuffles; index++) {
    let prime = ps[primeCount % ps.length];
    if (lastSeven.indexOf(prime) !== -1) {
      const info = firstNotInList(ps, lastSeven);
      prime = info.item;
      primeCount = info.index;
    }
    lastSeven[index % 7] = prime;
    primeCount += prime + (prime * (ps[(primeCount + loops++) % ps.length])) % ps.length;
    let shuffleIndex = 0;
    while (shuffleIndex < this.length) {
      const firstPart = this.slice(0, shuffleIndex)
      const secondPart = this.slice(shuffleIndex, (shuffleIndex = shuffleIndex + prime));
      const thirdPart = this.slice(shuffleIndex)
      this.copy(secondPart.concat(firstPart.concat(thirdPart)));
    }
    map[this.join().hash()] = true;
  }
  return Object.keys(map).length;
});

Function.safeStdLibAddition(Array, 'uniqueStringValue', function (value) {
  const matchingIndexes = [true];
  const valReg = new RegExp(`(${RegExp.escape(value)})([0-9]*)`);
  for (let index = 0; index < this.length; index++) {
    const curr = new String(this[index]);
    const match = curr.match(valReg);
    if (match) {
      matchingIndexes[match[2] || -1] = value;
    }
  }
  if (matchingIndexes[-1] === undefined) return value;
  const emptyIndex = matchingIndexes.findIndex(str => str === undefined);
  return value + (emptyIndex === -1 ? matchingIndexes.length : emptyIndex);
});

Function.safeStdLibAddition(Array, 'reorder', function () {
  let count = 2;
  let currentIndex = this.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = (currentIndex * count++) % currentIndex;
    currentIndex--;
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex], this[currentIndex]];
  }
});

Function.safeStdLibAddition(Array, 'toJson', function (arr) {
    const json = [];
    arr.forEach((elem) => json.push(JSON.value(elem)));
    return json;
}, true);

Function.safeStdLibAddition(Array, 'equalIndexOf', function (elem, startIndex, endIndex) {
    startIndex =  startIndex > -1 ? startIndex : 0;
    endIndex = endIndex < this.length ? endIndex : this.length;
    for (let index = startIndex; index < endIndex; index += 1) {
      if (elem && (typeof elem.equals) === 'function' && elem.equals(this[index])) {
        return index;
      } else if (elem === this[index]) {
        return index;
      }
    }
    return -1;
});

Function.safeStdLibAddition(Array, 'condition', function (conditionFunc, initialValue) {
  // console.warn('Function has been modified make sure results are as expected');
  let value = initialValue;
  const valueFuncDefined = (typeof valueFunc) === 'function';
  for (let index = 0; index < this.length; index += 1) {
    const elem = this[index];
    value = conditionFunc(elem, value, index);
  }
  return value;
});

function arrayMaxObj(func, max) {
  const funcDefined = (typeof func) === 'function';
  const initialValue = max || max === 0 ?
        {elem: max, value: funcDefined ? func(max) : max, index: -1} : undefined;
  return this.condition((elem, max, index) => {
    let value = funcDefined ? func(elem, index) : elem;
    if (!(max instanceof Object) || value > max.value) return {value, elem, index};
    return max;
  }, initialValue);
}

Function.safeStdLibAddition(Array, 'max', function (func, max) {
  const obj = arrayMaxObj.apply(this, [func, max]);
  return obj ? obj.elem : undefined;
});
Function.safeStdLibAddition(Array, 'maxIndex', function (func, max) {
  const obj = arrayMaxObj.apply(this, [func, max]);
  return obj ? obj.index : -1;
});

function arrayMinObj(func, min) {
  const funcDefined = (typeof func) === 'function';
  const initialValue = min || min === 0 ? {elem: min, value: funcDefined ? func(min) : min} : undefined;
  return this.condition((elem, min, index) => {
    let value = funcDefined ? func(elem, index) : elem;
    if (!(min instanceof Object) || value < min.value) return {value, elem, index};
    return min
  }, initialValue);
}

Function.safeStdLibAddition(Array, 'min', function (func, min) {
  const obj = arrayMinObj.apply(this, [func, min]);
  return obj ? obj.elem : -1;
});
Function.safeStdLibAddition(Array, 'minIndex', function (func, min) {
  const obj = arrayMinObj.apply(this, [func, min]);
  return obj ? obj.index : -1;
});

Function.safeStdLibAddition(Array, 'print', function (min, func) {
  const maxLength = new String(this.length).length;
  for (let index = 0; index < this.length; index++) {
    const elem = this[index];
    const length = new String(index).length;
    const position = new Array(maxLength - length).fill(' ').join('') + index + ':';
  }
});

Function.safeStdLibAddition(Array, 'exists', function (array, obj) {
  if (!Array.isArray(array)) return false;
  for (let index = 0; index < array.length; index += 1) {
    if (array[index] === obj) return true;
  }
  return false;
}, true);

Function.safeStdLibAddition(Array, 'remove', function (elem) {
  const isFunction = elem && (typeof elem.equals) === 'function';
  let removed = isFunction ? [] : undefined;
  for (let index = 0; index < this.length; index += 1) {
    if (isFunction && elem.equals(this[index])) {
      removed.push(this.splice(index--, 1)[0]);
    } else if (elem === this[index]) {
      removed = this.splice(index--, 1)[0];
    }
  }
  return removed;
});

Function.safeStdLibAddition(Array, 'diff', function (original, neww, modify) {
    const comparison = {both: [], removed: [], added: []};
    const arr = original.concat(neww);
    const visited = {new: {}, original: {}};
    arr.forEach((elem) => {
      const origIndex = original.equalIndexOf(elem);
      const newIndex = neww.equalIndexOf(elem);
      if (!visited.new[newIndex] && !visited.original[origIndex]) {
        if (newIndex !== -1) visited.new[newIndex] = true;
        if (origIndex !== -1) visited.original[origIndex] = true;
        if (origIndex !== -1 && newIndex !== -1) comparison.both.push(elem);
        else if (newIndex !== -1) comparison.added.push(elem);
        else comparison.removed.push({elem, index: origIndex});
      }
    });

    if (modify === true) {
      if (comparison.removed.length > 0) {
        let removed = 0;
        comparison.removed.forEach((info) => original.splice(info.index - removed++, 1));
        comparison.removed = comparison.removed.map((info) => info.elem);
      }
      if (comparison.added.length > 0) {
        original.concatInPlace(neww);
      }
    }
    return comparison.removed.length > 0 || comparison.added.length > 0 ? comparison : false;
}, true);

Function.safeStdLibAddition(Array, 'concatInPlace', function (arr, checkForDuplicats) {
  if (arr === this) return;
  if (!Array.isArray(arr)) return;
  for (let index = 0; index < arr.length; index += 1) {
    if (checkForDuplicats && this.indexOf(arr[index]) !== -1) {
      console.warn('duplicate');
    } else {
      this[this.length] = arr[index];
    }
  }
});

function sortByAttrs(attrs, reverse) {
  function sort(obj1, obj2) {
    for (let index = 0; index < attrs.length; index++) {
      const attr = attrs[index];
      const val1 = Object.pathValue(obj1, attr);
      const val2 = Object.pathValue(obj2, attr);
      if (index === attrs.length && val2 === val1) {
        continue;
      }
      if (val2 !== val1) {
        if (reverse) {
          return val1 > val2 ? -1 : 1;
        }
        return val1 > val2 ? 1 : -1;
      }
    }
    return 0;
  }
  return sort;
}

const nativeSort = Array.sort;
Function.safeStdLibAddition(Array, 'sortByAttr', function(stringOfunc, reverse) {
  if ((typeof stringOfunc) === 'string')
    return this.sort.apply(this, [sortByAttrs([stringOfunc], reverse)]);
  return this.sort.apply(this, arguments);
});

Function.safeStdLibAddition(Array, 'sortByAttrs', function(list, reverse) {
  return this.sort.apply(this, [sortByAttrs(list, reverse)]);
});

Function.safeStdLibAddition(Array, 'idObject',   function  (idAttr) {
  const obj = {};
  for (let index = 0; index < this.length; index++) {
    const elem = this[index];
    const id = (typeof elem[idAttr] === 'function') ? elem[idAttr]() : elem[idAttr];
    obj[id] = elem;
  }
  return obj;
});

Function.safeStdLibAddition(Array, 'empty', function (func) {
  for (let index = 0; index < this.length; index += 1) {
    if (this[index] !== undefined) return false;
  }
  return true;
});

Function.safeStdLibAddition(Array, 'relitiveIndex', function (funcOval, index) {
  if (!Number.isFinite(index)) index = 0;
  const isFunc = funcOval instanceof Function;
  for (let i = 0; i < this.length; i += 1) {
    const isTarget = isFunc ? funcOval(this[i], i) : funcOval === this[i];
    if (isTarget) {
      const negitive = i <= index ? i - index : -index + (i - this.length);
      const positive = i >= index ? i - index : this.length - index + i;
      if (-negitive < positive) return negitive;
      else return positive;
    }
  }
});

Function.safeStdLibAddition(Array, 'concatElements', function () {
  const elements = this.map(o => o);
  this.deleteAll();
  elements.forEach(e => Array.isArray(e) && this.concatInPlace(e));
  return this;
});

Function.safeStdLibAddition(Array, 'fill', function (length, funcOval) {
  const arr = new Array().fill(length);
  const isFunc = funcOval instanceof Function;
  for (let index = 0; index < length; index += 1) {
    const value = isFunc ? funcOval(index, arr) : funcOval;
    if (value !== undefined) arr[index] = value;
  }
  return arr;
}, true);


/////////////////////////////////// Matrix Equations //////////////////////////

Function.safeStdLibAddition(Array, 'translate', function (vector, doNotModify, quiet) {
  let point = this;
  let single = false;
  if (doNotModify === true) point = Array.from(point);
  const vecLen = vector.length;
  if (point.length !== vecLen && !quiet) console.warn('vector.length !== point.length but we\' do it anyway (arg3(quiet) = true to silence)');
  for (let i = 0; i < vecLen; i += 1) {
    if (point[i] === undefined) point[i] = 0;
    point[i] += vector[i];
  }
  return point;
});

Function.safeStdLibAddition(Array, 'inverse', function (doNotModify) {
  const arr = doNotModify === true ? Array.from(this) : this;
  for (let index = 0; index < arr.length; index += 1) {
    arr[index] *= -1;
  }
  return arr;
});

Function.safeStdLibAddition(Array, 'remap', function (func) {
  for (let index = 0; index < this.length; index += 1) {
    this[index] = func(this[index], index);
  }
});

Function.safeStdLibAddition(Array, 'scale', function (valueOfuncOarray, doNotModify) {
  const arr = doNotModify === true ? Array.from(this) : this;
  let func;
  switch (typeof valueOfuncOarray) {
    case 'function': func = (val, index) => val * valueOfuncOarray(val, index); break;
    case 'object': func = (val, index) => val * valueOfuncOarray[index]; break;
    default: func = (val, index) => val * valueOfuncOarray;
  }
  arr.remap(func);
  return arr;
});

Function.safeStdLibAddition(Array, 'add', function (valueOfuncOarray, doNotModify) {
  const arr = doNotModify === true ? Array.from(this) : this;
  let func;
  switch (typeof valueOfuncOarray) {
    case 'function': func = (val, index) => val + valueOfuncOarray(val, index); break;
    case 'object': func = (val, index) => val + valueOfuncOarray[index]; break;
    default: func = (val, index) => val + valueOfuncOarray;
  }
  arr.remap(func);
  return arr;
});

Function.safeStdLibAddition(Array, 'sum', function (valueOfuncOarray) {
  let func;
  let sum = 0;
  switch (typeof valueOfuncOarray) {
    case 'function': func = (val, index) => sum += valueOfuncOarray(val, index); break;
    case 'object': func = (val, index) => sum += valueOfuncOarray[index]; break;
    default: func = (val, index) => sum += val;
  }
  this.forEach(func);
  return sum;
});

Function.safeStdLibAddition(Array, 'group', function (...groupSizes) {
  if (groupSizes.length === 0) return;
  const elements = this.map(o => o);
  const groupSize = groupSizes.splice(0,1)[0];
  this.deleteAll();
  let i = 0;
  let j = 0;
  elements.forEach(e => {
    if (i === groupSize) (i = 0) & j++;
    if (i === 0) this[j] = [];
    this[j][i++] = e;
  });
  this.forEach(elem => elem.group(...groupSizes));
  return this;
});

Function.safeStdLibAddition(Array, 'inSetOf', function (setSize) {
  this.length = Math.ceil(this.length/setSize) * setSize;
});

Function.safeStdLibAddition(Array, 'elements', function(func) {
  const elements = [];
  this.forEach(e => Array.isArray(e) ?
              elements.concatInPlace(e.elements()) : elements.push(e));
  return elements;
});
