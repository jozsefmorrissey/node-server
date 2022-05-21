



function safeStdLibAddition() {
  const addition = [];
  function verify() {
    additions.forEach((a) => {
      if ((a.static && a.lib[a.field] !== a.func) ||
      (!a.static && a.lib.prototype[a.field] !== a.func))
        throw new Error(`Functionality was overwritten -` +
                          `\n\tLibrary: ${a.lib}` +
                          `\n\tStatic: ${a.static}` +
                          `\n\tField: ${a.field}`)
    });
    delete additions;
  }
  function safeAdd (lib, field, func, static) {
    if (!static && lib.prototype[field] === undefined)
      lib.prototype[field] = func;
    else if (lib[field] === undefined)
      lib[field] = func;
    else
      console.error(`Attempting to overwrite functionality -` +
                        `\n\tLibrary: ${lib}` +
                        `\n\tStatic: ${static}` +
                        `\n\tField: ${field}`);
    addition.push({lib, field, func, static})
  }
  safeAdd(Function, 'safeStdLibAddition', safeAdd);
}
safeStdLibAddition();

function processValue(value) {
  let retVal;
  if ((typeof value) === 'object' && value !== null) {
    if ((typeof value.toJson) === 'function') {
      retVal = value.toJson();
    } else if ((typeof value.toJSON) === 'function') {
      retVal = value.toJSON();
    } else if (Array.isArray(value)){
      const arr = [];
      value.forEach((val) => {
        if ((typeof val.toJson) === 'function') {
          arr.push(val.toJson());
        } else if ((typeof val.toJSON) === 'function') {
          arr.push(val.toJSON());
        } else {
          arr.push(val);
        }
      });
      retVal = arr;
    } else {
      const keys = Object.keys(value);
      const obj = {};
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        obj[key] = processValue(value[key]);
      }
      retVal = obj;
    }
  } else {
    retVal = value;
  }
  return retVal;
}

Function.safeStdLibAddition(String, 'random',  function (len) {
    len = len || 7;
    let str = '';
    while (str.length < len) str += Math.random().toString(36).substr(2);
    return str.substr(0, len);
}, true);

const LEFT = 1;
const RIGHT = 0;
Function.safeStdLibAddition(String, 'obscure',  function (count) {
    const direction = count < 0 ? LEFT : RIGHT;
    const test = (index) => direction === LEFT ? index > this.length + count - 1 : index < count;
    let str = '';
    for (let index = 0; index < this.length; index += 1) {
      if (test(index)) {
        str += '*';
      } else {
        str += this[index];
      }
    }
    return str;
});

const singleCharReg = /([a-zA-Z]{1,})[^a-z^A-Z]{1,}([a-zA-Z])[^a-z^A-Z]{1,}([a-zA-Z]{1,})/;
const specialCharReg = /([a-zA-Z])[^a-z^A-Z]{1,}([a-zA-Z])/g;
function singleCharReplace(whoCares, one, two, three) {
  const oneLastChar = one[one.length - 1];
  const twoLower = oneLastChar !== oneLastChar.toLowerCase();
  const twoStr = twoLower ? two.toLowerCase() : two.toUpperCase();
  const threeStr = twoLower ? `${three[0].toUpperCase()}${three.substr(1)}` :
                                `${three[0].toLowerCase()}${three.substr(1)}`;
  return `${one}${twoStr}${threeStr}`;
}
function camelReplace(whoCares, one, two) {return `${one}${two.toUpperCase()}`;}
function toCamel() {
  let string = `${this.substr(0,1).toLowerCase()}${this.substr(1)}`;
  while (string.match(singleCharReg)) string = string.replace(singleCharReg, singleCharReplace);
  return string.replace(specialCharReg, camelReplace);
}
Function.safeStdLibAddition(String, 'toCamel',  toCamel);

const multipleUpperReg = /([A-Z]{2,})([a-z])/g;
const caseChangeReg = /([a-z])([A-Z])/g;
function pascalReplace(whoCares, one, two) {return `${one.toUpperCase()}_${two.toUpperCase()}`;}
function toPascal() {
  let string = this;
  return string.replace(multipleUpperReg, pascalReplace)
                .replace(caseChangeReg, pascalReplace)
                .replace(specialCharReg, pascalReplace).toUpperCase();
}
Function.safeStdLibAddition(String, 'toPascal',  toPascal);

Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
}, true);

const classLookup = {};
const attrMap = {};
const identifierAttr = '_TYPE';
const immutableAttr = '_IMMUTABLE';
const temporaryAttr = '_TEMPORARY';
const doNotOverwriteAttr = '_DO_NOT_OVERWRITE';

const clazz = {};
clazz.object = () => JSON.clone(classLookup);
clazz.get = (name) => classLookup[name];
clazz.filter = (filterFunc) => {
  const classes = clazz.object();
  if ((typeof filterFunc) !== 'function') return classes;
  const classIds = Object.keys(classes);
  const obj = {};
  for (let index = 0; index < classIds.length; index += 1) {
    const id = classIds[index];
    if (filterFunc(classes[id])) obj[id] = classes[id];
  }
  return obj;
}


Function.safeStdLibAddition(Object, 'class', clazz, true);

Function.safeStdLibAddition(Array, 'toJson', function (arr) {
    const json = [];
    arr.forEach((elem) => json.push(processValue(elem)));
    return json;
}, true);
Function.safeStdLibAddition(Object, 'fromJson', function (rootJson) {
  function interpretValue(value) {
    if (value instanceof Object) {
      const classname = value[identifierAttr];
      const attrs = attrMap[classname] ? Object.keys(attrMap[classname]) :
                    Object.keys(value).filter((attr) => !attr.match(/^_[A-Z]*[A-Z_]*$/));
      if (Array.isArray(value)) {
        const realArray = [];
        for (let index = 0; index < value.length; index += 1) {
          realArray[index] = Object.fromJson(value[index]);
        }
        return realArray;
      } else if (classname && classLookup[classname]) {
        if (classLookup[classname].fromJson) {
          return classLookup[classname].fromJson(value);
        } else {
          const classObj = new (classLookup[classname])(value);
          for (let index = 0; index < attrs.length; index += 1) {
            const attr = attrs[index];
            if ((typeof classObj[attr]) === 'function')
            classObj[attr](interpretValue(value[attr]));
            else
            classObj[attr] = interpretValue(value[attr]);
          };
          return classObj;
        }
      } else {
        if (classname) {
          console.warn(`fromJson for class ${classname} not registered`)
        }
        const realObj = {}
        for (let index = 0; index < attrs.length; index += 1) {
          const attr = attrs[index];
          realObj[attr] = interpretValue(value[attr]);
        };
        return realObj
      }
    }
    return value;
  }

  if (!(rootJson instanceof Object)) return rootJson;
  return interpretValue(rootJson);
}, true);

Function.safeStdLibAddition(Object, 'getSet',   function (obj, initialVals, ...attrs) {
  const cxtrName = obj.constructor.name;
  if (classLookup[cxtrName] === undefined) {
    classLookup[cxtrName] = obj.constructor;
  } else if (classLookup[cxtrName] !== obj.constructor) {
    console.warn(`Object.fromJson will not work for the following class due to name conflict\n\taffected class: ${obj.constructor}\n\taready registered: ${classLookup[cxtrName]}`);
  }
  if (initialVals === undefined) return;
  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
  let values = {};
  let temporary = false;
  let immutable = false;
  let doNotOverwrite = false;
  if ((typeof initialVals) === 'object') {
    values = initialVals;
    immutable = values[immutableAttr] === true;
    temporary = values[temporaryAttr] === true;
    doNotOverwrite = values[doNotOverwriteAttr] === true;
    if (immutable) {
      attrs = Object.keys(values);
    } else {
      attrs = Object.keys(values).concat(attrs);
    }
  } else {
    attrs = [initialVals].concat(attrs);
  }
  if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
  attrs.forEach((attr) => {
    if (!attr.match(/^_[A-Z]*[A-Z_]*$/))
      attrMap[cxtrName][attr] = true;
  });

  for (let index = 0; !doNotOverwrite && index < attrs.length; index += 1) {
    const attr = attrs[index];
    if (attr !== immutableAttr) {
      if (immutable) obj[attr] = () => values[attr];
      else {
        obj[attr] = (value) => {
          if (value === undefined) {
            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
            if (values[attr] !== undefined || noDefaults)
            return values[attr];
            return obj.defaultGetterValue(attr);
          }
          values[attr] = value;
        }
      }
    }
  }
  if (!temporary) {
    const origToJson = obj.toJson;
    obj.toJson = (members, exclusive) => {
      const restrictions = Array.isArray(members) && members.length;
      const json = (typeof origToJson === 'function') ? origToJson() : {};
      json[identifierAttr] = obj.constructor.name;
      for (let index = 0; index < attrs.length; index += 1) {
        const attr = attrs[index];
        const inclusiveAndValid = restrictions && !exclusive && members.indexOf(attr) !== -1;
        const exclusiveAndValid = restrictions && exclusive && members.indexOf(attr) === -1;
        if (attr !== immutableAttr && (!restrictions || inclusiveAndValid || exclusiveAndValid)) {
          const value = (typeof obj[attr]) === 'function' ? obj[attr]() : obj[attr];
          json[attr] = processValue(value);
        }
      }
      return json;
    }
  }
  obj.fromJson = (json) => {
    for (let index = 0; index < attrs.length; index += 1) {
      const attr = attrs[index];
      if (attr !== immutableAttr) {
        if ((typeof obj[attr]) === 'function')
          obj[attr](Object.fromJson(json[attr]));
        else
          obj[attr] = Object.fromJson(json[attr]);
      }
    };
    return obj;
  }
  if (obj.constructor.DO_NOT_CLONE) {
    obj.clone = () => obj;
  } else {
    obj.clone = () => {
      const clone = new obj.constructor(obj.toJson());
      clone.fromJson(obj.toJson());
      return clone;
    }
  }
}, true);
Object.getSet.format = 'Object.getSet(obj, {initialValues:optional}, attributes...)'

Function.safeStdLibAddition(Object, 'set',   function (obj, otherObj) {
  if (otherObj === undefined) return;
  if ((typeof otherObj) !== 'object') {
    throw new Error('Requires one argument of type object or undefined for meaningless call');
  }
  const keys = Object.keys(otherObj);
  keys.forEach((key) => obj[key] = otherObj[key]);
}, true);

Function.safeStdLibAddition(Array, 'set',   function (array, values, start, end) {
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
}, true);

const checked = {};

// Swiped from https://stackoverflow.com/a/43197340
function isClass(obj) {
  const isCtorClass = obj.constructor
      && obj.constructor.toString().substring(0, 5) === 'class'
  if(obj.prototype === undefined) {
    return isCtorClass
  }
  const isPrototypeCtorClass = obj.prototype.constructor
    && obj.prototype.constructor.toString
    && obj.prototype.constructor.toString().substring(0, 5) === 'class'
  return isCtorClass || isPrototypeCtorClass
}

Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
  if ((typeof obj) != 'object') return obj;
  const keys = Object.keys(obj);
  if (!checked[obj.constructor.name]) {
    console.log('constructor: ' + obj.constructor.name);
    checked[obj.constructor.name] = true;
  }

  const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
                  Array.isArray(obj) ? [] : {};
  for(let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const member = obj[key];
    if (member && (member.DO_NOT_CLONE || member.constructor.DO_NOT_CLONE)) {
      clone[key] = member;
    } else if ((typeof member) !== 'function') {
      if ((typeof member) === 'object') {
        if ((typeof member.clone) === 'function') {
          clone[key] = member.clone();
        } else {
          clone[key] = JSON.clone(member);
        }
      } else {
        clone[key] = member;
      }
    }
    else if (isClass(member)) {
      clone[key] = member;
    }
  }
  return clone;
}, true);

Function.safeStdLibAddition(String, 'parseSeperator',   function (seperator, isRegex) {
  if (isRegex !== true) {
    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
  }
  var keyValues = this.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
  var json = {};
  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
    if (split) {
      json[split[1]] = split[2];
    }
  }
  return json;
});

Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
  const attrs = path.split('.');
  const lastIndex = attrs.length - 1;
  let currObj = obj;
  for (let index = 0; index < lastIndex; index += 1) {
    let attr = attrs[index];
    if (currObj[attr] === undefined) currObj[attr] = {};
    currObj = currObj[attr];
  }

  const lastAttr = attrs[lastIndex];
  if ((typeof currObj[lastAttr]) === 'function') {
    return currObj[lastAttr](value);
  } else if (value !== undefined) {
    currObj[lastAttr] = value;
  }
  return currObj[lastAttr];
}, true);
