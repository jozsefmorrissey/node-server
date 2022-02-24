



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


Function.safeStdLibAddition(String, 'random',  function (len) {
    len = len || 7;
    let str = '';
    while (str.length < len) str += Math.random().toString(36).substr(2);
    return str.substr(0, len);
}, true);

Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
}, true);

const classLookup = {};
const identifierAttr = '_TYPE';
const immutableAttr = '_IMMUTABLE';
const temporaryAttr = '_TEMPORARY';

Function.safeStdLibAddition(Object, 'fromJson', function (rootJson) {
  function interpretValue(value) {
    if (value instanceof Object) {
      const classname = value[identifierAttr];
      const attrs = Object.keys(value).filter((attr) => !attr.match(/^_[A-Z]*[A-Z_]*$/));
      if (Array.isArray(value)) {
        const realArray = [];
        for (let index = 0; index < value.length; index += 1) {
          realArray[index] = Object.fromJson(value[index]);
        }
        return realArray;
      } else if (classname && classLookup[classname]) {
        const classObj = new (classLookup[classname])();
        for (let index = 0; index < attrs.length; index += 1) {
          const attr = attrs[index];
          if ((typeof classObj[attr]) === 'function')
            classObj[attr](interpretValue(value[attr]));
        };
        return classObj;
      } else {
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
  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
  let values = {};
  let temporary = false;
  let immutable = false;
  if ((typeof initialVals) === 'object') {
    values = JSON.clone(initialVals);
    immutable = values[immutableAttr] === true;
    temporary = values[temporaryAttr] === true;
    if (immutable) {
      attrs = Object.keys(values);
    } else {
      attrs = Object.keys(values).concat(attrs);
    }
  } else {
    attrs.push(initialVals);
  }

  for (let index = 0; index < attrs.length; index += 1) {
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
          if ((typeof value) === 'object' && value !== null) {
            if ((typeof value.toJson) === 'function') {
              json[attr] = value.toJson();
            } else if (Array.isArray(value)){
              const arr = [];
              value.forEach((val) => {
                if ((typeof val.toJson) === 'function') {
                  arr.push(val.toJson());
                } else {
                  arr.push(val);
                }
              });
              json[attr] = arr;
            } else {
              json[attr] = JSON.clone(value);
            }
          } else {
            json[attr] = value;
          }
        }
      }
      return json;
    }
  }
  obj.fromJson = (json) => {
    for (let index = 0; index < attrs.length; index += 1) {
      const attr = attrs[index];
      if (attr !== immutableAttr) {
        obj[attr](json[attr]);
      }
    };
    return obj;
  }
  if (obj.constructor.DO_NOT_CLONE) {
    obj.clone = () => obj;
  } else {
    obj.clone = () => {
      const clone = new obj.constructor();
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
