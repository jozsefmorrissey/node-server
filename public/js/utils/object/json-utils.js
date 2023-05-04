
const numberReg = /^[0-9]{1,}$/;
const isNumber = (key) => key.match(numberReg) !== null;
const arrayPathIndex = (key) => {
  const split = key.split('.');
  const count = key.count('.') + 1;
  if (!isNumber(split[split.length - 1])) return count + .1;
  return count;
}

const pathIndex = (key) => key.count('.') + 1;

// I think these printstatements should always exist...
// That being said if if you know what you are doing feel free to bypass them.
function winterIsComing(obj, key) {
  if (JSON.deconstruct.overcomeWinter === true) return;
  if (key === '') console.error('An empty space key exists within an object, it will not be reconstructed properly');
  if (key.indexOf('.') !== -1) console.error('Period exists within a key, object will not be reconstructed properly');
  if (!Array.isArray(obj) && isNumber(key)) console.error('An Integer key exists within something that is not an array, it will not be reconstructed properly');
}

const hasEmpty = (v) => (Array.isArray(v) && v.contains(undefined));
const notRootEmpty = (v, path) => path !== '' && hasEmpty(v);
function emptyArrayObject(obj) {
  const hasEmptyArrs = obj.filter(hasEmpty);
  if (hasEmptyArrs === undefined) return;
  const emptyArrObj = {};
  hasEmptyArrs.foreach((value, path) =>
            emptyArrObj[path] = value, hasEmpty);
  return emptyArrObj;
}

function removeNestedEmptyArrays(emptyArrObj) {
  Object.values(emptyArrObj).forEach((obj) => {
    obj.foreach((v, path) => {
      obj.deletePath(path);
    }, notRootEmpty);
  });
}

function forceEachIndexIntoDeconstruction(obj, emptyArrObj, deconstruct) {
  Object.keys(emptyArrObj).forEach((key) => {
    Object.keys(emptyArrObj[key]).forEach((index) => {
      deconstruct[`${key}.${index}`] = JSON.stringify(emptyArrObj[key][index]);
    });
  });
  return deconstruct;
}

// Solving this issue: JSON.stringify([,,3,]) = [null,null,3,null]
function deconstructionOfSparceArrays(obj) {
  if (!(obj instanceof Object)) return obj;
  const deconstruct = (Array.isArray(obj) ? [] : {});
  const emptyArrObj = emptyArrayObject(obj);
  if (emptyArrObj === undefined) return deconstruct;
  removeNestedEmptyArrays(emptyArrObj);
  return forceEachIndexIntoDeconstruction(obj, emptyArrObj, deconstruct);
}

Function.safeStdLibAddition(JSON, 'deconstruct',   function (obj, maxObjLen, space, path, deconstruction) {
  if (obj === undefined) return;
  if (deconstruction === undefined) {
    obj = obj.copy();
    deconstruction = deconstructionOfSparceArrays(obj);
  }
  const str = JSON.stringify(obj, null, space);
  maxObjLen ||= 1000;
  path ||= '';
  if (!(obj instanceof Object) || str.length < maxObjLen) {
    deconstruction[path] = str;
    return deconstruction;
  }
  let keys = Object.keys(obj);
  let keyMaxLen = maxObjLen / keys.length;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    winterIsComing(obj, key);
    let currObj = Object.pathValue(obj, key);
    let currStr = JSON.stringify(currObj, null, space);
    if (currStr.length > keyMaxLen) {
      const currPath = path === '' ? key : `${path}.${key}`;
      JSON.deconstruct(currObj, maxObjLen, space, currPath, deconstruction);
      delete obj[key];
    }
  }
  if (Array.isArray(obj) && obj.empty()) obj.length = 0;
  else if (Object.keys(obj).length !== 0) {
    deconstruction[path] = JSON.stringify(obj, null, space);
  }
  return deconstruction;
}, true);

const lenSorter = (s1, s2) => pathIndex(s1) - pathIndex(s2);
const keySorter = (s1, s2) => {
  const api1 = arrayPathIndex(s1);
  const api2 = arrayPathIndex(s2);
  if (api1 && api2) return api1 - api2;
  if (!api1 && !api2) return;
  return api1 ? 1 : -1;
}
const mainSorter = (s1, s2) => {
  const s1Main = s1 === '';
  const s2Main = s2 === '';
  if (!s1Main && !s2Main) return undefined;
  return s1Main ? -1 : 1;
}
const prioritySorter = (s1, s2) => {
  let val = mainSorter(s1,s2);
  if (val !== undefined) return val;
  val = keySorter(s1,s2);
  if (val !== undefined) return val;
  return lenSorter(s1,s2);
}

Function.safeStdLibAddition(JSON, 'reconstruct',   function (obj) {
  const paths = Object.keys(obj);
  paths.sort(prioritySorter);
  const mainDef = paths[0] === '';
  const constructed = mainDef ? JSON.parse(obj['']) : {};
  for (let index = (mainDef ? 1 : 0); index < paths.length; index++) {
    const path = paths[index];
    Object.pathValue(constructed, path, JSON.parse(obj[path]));
  }
  return constructed;
}, true);
