

const classLookup = {};
const attrMap = {};
const identifierAttr = '_TYPE';
const immutableAttr = '_IMMUTABLE';
const temporaryAttr = '_TEMPORARY';
const doNotOverwriteAttr = '_DO_NOT_OVERWRITE';
const forceFromJsonAttr = '_FORCE_FROM_JSON';

const clazz = {};
const universalCloneFunction = (obj) => obj.constructor.fromJson(obj.constructor.toJson());
clazz.object = () => Object.merge({}, classLookup);
clazz.register = (clazz, ...attrs) => {
  const cxtrName = clazz.name;
  classLookup[cxtrName] = clazz;
  if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
  attrs.forEach((attr) => attrMap[cxtrName][attr] = true);
  const parentToJson = clazz.toJson;
  clazz.toJson = (obj) => {
    const json = parentToJson ? parentToJson(obj) : {};
    json._TYPE = cxtrName;
    Object.keys(attrMap[cxtrName]).forEach(k => json.pathValue(k, JSON.value(obj.pathValue(k))));
    return json;
  }
  const parentFromJson = clazz.fromJson;
  clazz.fromJson = (json, obj) => {
    if (!obj) obj = clazz.new();
    if (parentFromJson) obj = parentFromJson(json, obj);
    Object.keys(attrMap[cxtrName]).forEach(k => obj.pathValue(k, Object.fromJson((json.pathValue(k)))));
    return obj;
  }
  clazz.new = (...args) => new clazz(...args);
  const parentClone = clazz.clone;
  clazz.clone = (obj, clone) => {
    if (!clone) clone = clazz.new();
    if (parentClone) parentClone(obj, clone);
    Object.keys(attrMap[cxtrName]).forEach(k => clone.pathValue(k, obj.pathValue(k)));
    return clone;
  }
}
clazz.get = (nameOobject) => (typeof nameOobject) === 'string' ? classLookup[nameOobject] : nameOobject.constructor;
clazz.new = (nameOobject, ...args) => (typeof nameOobject) === 'string' ? new classLookup[nameOobject](...args) : new nameOobject.constructor(...args);
clazz.filter = (filterFunc) => {
  const classes = clazz.object();
  if ((typeof filterFunc) !== 'function') return classes;
  const classIds = Object.keys(classes);
  const list = [];
  for (let index = 0; index < classIds.length; index += 1) {
    const id = classIds[index];
    if (filterFunc(classes[id])) list.push(classes[id]);
  }
  return list;
}

const filterOutUndefined = (obj) => (key) => obj[key] !== undefined;
function objEq(obj1, obj2) {
  const isObj1 = obj1 instanceof Object;
  const isObj2 = obj2 instanceof Object;
  if (!isObj1 && !isObj2)
    return obj1 === obj2;
  if (!isObj1)
    return false;
  if (!isObj2)
    return false;
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  const obj1Keys = Object.keys(obj1).filter(filterOutUndefined(obj1)).sort();
  const obj2Keys = Object.keys(obj2).filter(filterOutUndefined(obj2)).sort();
  if (obj1Keys.length !== obj2Keys.length) return false;
  for (let index = 0; index < obj1Keys.length; index += 1) {
    const obj1Key = obj1Keys[index];
    const obj2Key = obj2Keys[index];
    if (obj1Key !== obj2Key) return false;
    const obj1Val = obj1[obj1Key];
    const obj2Val = obj2[obj2Key];
    if (obj1Val instanceof Object) {
      if ((typeof obj1Val.equals) !== 'function') {
        if(!objEq(obj1Val, obj2Val)) {
          objEq(obj1Val, obj2Val)
          return false;
        }
      }
      else if (!obj1Val.equals(obj2Val))
        return false;
    } else if (obj1[obj1Key] !== obj2[obj2Key])
        return false;
  }
  return true;
}



Function.safeStdLibAddition(Object, 'definedPropertyNames', function(object) {
  const names = [];
  for (var key in object) names.push(key);
  return names;
}, true);

// TODO: implement depth first search... I cant remember needing it so not worth my time
Function.safeStdLibAddition(Object, 'linkListFind', function(attr, is) {
  let toSearch = [this];
  let index = 0;
  while(index < toSearch.length && !is(curr = toSearch[index])) {
    objOArr = curr.pathValue(attr);
    if (objOArr) {
      if (Array.isArray(objOArr)) toSearch.concatInPlace(objOArr);
      else toSearch.push(objOArr);
    }
    index++;
  }
  return toSearch[index];
});

const isNotUndefined = (key, obj) => obj[key] !== undefined;
Function.safeStdLibAddition(Object, 'defined', function(...keys) {
  let condition = isNotUndefined;
  if (keys[0] instanceof Object) {
    const conditionMap = keys[0];
    keys = Object.keys(conditionMap);
    condition = (key) =>
      conditionMap[key](this[key]);
  }
  for (var index in keys) if (!condition(keys[index], this)) return false;
  return true;
});

// Stole this from: https://stackoverflow.com/a/71115598
// was useful in finding a data leak
function roughSizeOfObject(object) {
  const objectList = [];
  const stack = [object];
  const bytes = [0];
  while (stack.length) {
    const value = stack.pop();
    if (value == null) bytes[0] += 4;
    else if (typeof value === 'boolean') bytes[0] += 4;
    else if (typeof value === 'string') bytes[0] += value.length * 2;
    else if (typeof value === 'number') bytes[0] += 8;
    else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);
      if (typeof value.byteLength === 'number') bytes[0] += value.byteLength;
      else if (value[Symbol.iterator]) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of value) stack.push(v);
      } else {
        Object.keys(value).forEach(k => {
           bytes[0] += k.length * 2; stack.push(value[k]);
        });
      }
    }
  }
  return bytes[0];
}

Function.safeStdLibAddition(Object, 'sizeOf', roughSizeOfObject);

Function.safeStdLibAddition(Object, 'merge', (target, object, soft) => {
  if (!(target instanceof Object)) return;
  if (!(object instanceof Object)) return;
  if (soft !== false) soft = true;
  const objKeys = Object.keys(object);
  if (!soft) target.deleteAll();
  for (let index = 0; index < objKeys.length; index++) {
    const key = objKeys[index];
    const value = object[key];
    if (value instanceof Object && target[key] instanceof Object) {
      Object.merge(target[key], value, soft);
    } else if (!soft || target[key] === undefined) {
      target[key] = value;
    }
  }
  return target;
}, true);

Function.safeStdLibAddition(Object, 'merge', function () {
  const lastArg = arguments[arguments.length - 1];
  let soft = true;
  let args = arguments;
  if (lastArg === false || lastArg === true) {
    soft = lastArg;
    args = Array.from(arguments).slice(0, arguments.length - 1);
  }
  for (let index = 0; index < args.length; index++) {
    const object = args[index];
    if (object instanceof Object) {
      Object.merge(this, object, soft);
    } else {
      console.error('Attempting to merge a non-object');
    }
  }
  return this;
});

Function.safeStdLibAddition(Object, 'deleteAll', function () {
  Object.keys(this).forEach(key => delete this[key]);
});

Function.safeStdLibAddition(Object, 'forAllRecursive', (object, func) => {
  if (!(object instanceof Object)) return;
  if ((typeof func) !== 'function') return;
  const target = Array.isArray(object) ? [] :{};
  const objKeys = Object.keys(object);
  for (let index = 0; index < objKeys.length; index++) {
    const key = objKeys[index];
    if (object[key] instanceof Object) {
      target[key] = Object.forAllRecursive(object[key], func);
    } else target[key] = func(object[key], key, object);
  }
  return target;
}, true);

Function.safeStdLibAddition(Object, 'class', clazz, true);
Function.safeStdLibAddition(Object, 'equals', objEq, true);


Function.safeStdLibAddition(Object, 'forEachConditional', function (obj, func, conditionFunc, modifyObject) {
  if (!modifyObject) obj = JSON.clone(obj);
  conditionFunc = (typeof conditionFunc) === 'function' ? conditionFunc : () => true;
  const keys = Object.keys(obj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = obj[key];
    if (conditionFunc(value)) func(value, key, obj);
    if (value instanceof Object) Object.forEachConditional(value, func, conditionFunc, true);
  }
  return obj;
}, true);

Function.safeStdLibAddition(Object, 'toJson', function (obj) {
    if (!(obj instanceof Object)) throw new Error('Not an Object');
    const json = Array.isArray(obj) ? [] : {};
    const keys = Object.keys(obj);
    keys.forEach((key) => json[key] = JSON.value(obj[key]));
    return json;
}, true);


Function.safeStdLibAddition(Object, 'fromJson', function (rootJson) {
  function interpretValue(value) {
    if (value instanceof Object) {
      const classname = value[identifierAttr];
      const attrs = attrMap[classname] ? Object.keys(attrMap[classname]) :
                    Object.keys(value).filter((attr) => !attr.match(/^_[A-Z]*[A-Z_]*$/));
      if (Array.isArray(value) && !(classLookup[classname] && classLookup[classname].fromJson)) {
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
            classObj.pathValue(attr, interpretValue(value[attr]));
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

function setToJson(obj, options) {
  if (!options.temporary) {
    const origToJson = obj.toJson;
    obj.toJson = (members, exclusive) => {
      try {
        const restrictions = Array.isArray(members) && members.length;
        const json = (typeof origToJson === 'function') ? origToJson() : {};
        if (!options.isObject) json[identifierAttr] = obj.constructor.name;
        for (let index = 0; index < options.attrs.length; index += 1) {
          const attr = options.attrs[index];
          const inclusiveAndValid = restrictions && !exclusive && members.indexOf(attr) !== -1;
          const exclusiveAndValid = restrictions && exclusive && members.indexOf(attr) === -1;
          if (attr !== immutableAttr && (!restrictions || inclusiveAndValid || exclusiveAndValid)) {
            const value = obj.pathValue(attr);
            json.pathValue(attr, JSON.value(value));
          }
        }
        return json;
      } catch(e) {
        console.warn(e.message);
        throw e;
        return e.message;
      }
    }
  }
}

function staticFromJson(cxtr) {
  const fromJson = (json) => {
    const obj = new cxtr();
    obj.fromJson(json);
    return obj;
  };
  return fromJson;
}

Object.class.staticFromJson = staticFromJson;

function setFromJson(obj, options) {
  const cxtr = obj.constructor;
  if (cxtr.fromJson === undefined || options.forceFromJson)
    cxtr.fromJson = staticFromJson(cxtr);
  const parentFromJson = obj.fromJson;
  obj.fromJson = (json) => {
    for (let index = 0; index < options.attrs.length; index += 1) {
      const attr = options.attrs[index];
      if (attr !== immutableAttr) {
        if ((typeof obj[attr]) === 'function') {
          if(Array.isArray(obj[attr]())){
            obj[attr]().copy(Object.fromJson(json[attr]));
          } else {
            obj[attr](Object.fromJson(json[attr]));
          }
        }
        else {
          obj[attr] = Object.fromJson(json[attr]);
        }
      }
    };
    if ((typeof parentFromJson) === 'function') parentFromJson(json);
    return obj;
  }
}

function setClone(obj, options) {
  const cxtrFromJson = obj.constructor.fromJson;
  if (obj.constructor.DO_NOT_CLONE) {
    obj.clone = () => obj;
  } else if (cxtrFromJson && cxtrFromJson !== Object.fromJson) {
    obj.clone = () => cxtrFromJson(obj.toJson());
  } else if (options.isObject) {
    obj.clone = () => {
      const clone = Object.fromJson(obj.toJson());
      Object.getSet(clone, clone);
      return clone;
    }
  } else {
    obj.clone = () => {
      const clone = new obj.constructor(obj.toJson());
      clone.fromJson(obj.toJson());
      return clone;
    }
  }
}

function getOptions(obj, initialVals, attrs) {
  const options = {};
  options.temporary = false;
  options.immutable = false;
  options.doNotOverwrite = false;
  if ((typeof initialVals) === 'object') {
    options.values = initialVals;
    options.immutable = options.values[immutableAttr] === true;
    options.temporary = options.values[temporaryAttr] === true;
    options.doNotOverwrite = options.values[doNotOverwriteAttr] === true;
    options.forceFromJson = options.values[forceFromJsonAttr] === true;
    if (options.immutable) {
      options.attrs = Object.keys(options.values);
    } else {
      options.attrs = Object.keys(options.values).concat(attrs);
    }
  } else {
    options.values = {};
    options.attrs = [initialVals].concat(attrs);
  }
  return options;
}

function setGettersAndSetters(obj, options) {
  for (let index = 0; !options.doNotOverwrite && index < options.attrs.length; index += 1) {
    const attr = options.attrs[index];
    if (attr !== immutableAttr) {
      const initVal = options.values[attr];
      if(initVal instanceof Function)
        obj[attr] = initVal;
      else if (options.immutable) obj[attr] = () => initVal;
      else if (!(obj[attr] instanceof Function)) {
        obj.pathValue(attr, (value) => {
          if (value === undefined) {
            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
            if (options.values[attr] !== undefined || noDefaults)
              return options.values[attr];
            return obj.defaultGetterValue(attr);
          }
          return options.values[attr] = value;
        });
      }
    }
  }
}

Function.safeStdLibAddition(Object, 'getSet',   function (obj, initialVals, ...attrs) {
  const cxtrName = obj.constructor.name;
  const isObject = cxtrName === 'Object'
  if (!isObject) {
    if (classLookup[cxtrName] === undefined) {
      classLookup[cxtrName] = obj.constructor;
    } else if (classLookup[cxtrName] !== obj.constructor) {
      console.warn(`Object.fromJson will not work for the following class due to name conflict\n\taffected class: ${obj.constructor}\n\taready registered: ${classLookup[cxtrName]}`);
    }
  }
  if (initialVals === undefined) return;
  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
  const options = getOptions(obj, initialVals, attrs);
  options.isObject = isObject;
  if (!isObject) {
    if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
    options.attrs.forEach((attr) => {
      if (!attr.match(/^_[A-Z]*[A-Z_]*$/))
        attrMap[cxtrName][attr] = true;
    });
  }

  setGettersAndSetters(obj, options);
  setToJson(obj, options);
  setClone(obj, options);
  setFromJson(obj, options);
  return options.attrs;
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


const numberReg = /^[0-9]{1,}$/;
const funcReg = /^(.*?)(\(\)|)$/;
Function.safeStdLibAddition(Object, 'pathInfo', function (path, create) {
  const attrs = (path + '').split('.');
  let value = this;
  let parent, attr, target;
  let created = false;
  for (let index = 0; index < attrs.length; index += 1) {
    const match = attrs[index].match(funcReg);
    attr = match[1];
    parent = value;
    const isFunc = value && value[attr] instanceof Function && match[2] === '()';

    const nextIsIndex = new String(attrs[index + 1]).match(numberReg);
    if (value[attr] === undefined) {
      if (create) {
        created = true;
        value[attr] = nextIsIndex ? [] : {};
      } else {
        return;
      }
    }
    target = value[attr];
    value = isFunc ? target() : target;
    if (value === undefined) return value;
    if (value === null) break;
  }
  return {parent, value, target, attr, created}
});

Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
  const valueDefined = value !== undefined;
  const pathInfo = obj.pathInfo(path, valueDefined);
  if (!valueDefined && !pathInfo) return pathInfo;
  if (!pathInfo)
    obj.pathInfo(path, valueDefined);
  const parent = pathInfo.parent;
  const attr = pathInfo.attr;
  if ((typeof parent[attr]) === 'function') {
    return parent[attr](value);
  }
  return valueDefined ? (parent[attr] = value) : parent[attr];
}, true);

Function.safeStdLibAddition(Object, 'pathValue', function (path, value) {
  return Object.pathValue(this, path, value);
});


function setProperty(path, value, enumerable, writable, configurable, get, set) {
  const pathInfo = this.pathInfo(path, true);
  writable = Boolean.first(writable, true);
  enumerable = Boolean.first(enumerable, true);
  configurable = Boolean.first(configurable, true);
  if (get || set) Object.defineProperty(pathInfo.parent, pathInfo.attr,
    {enumerable, configurable, get, set});
  else Object.defineProperty(pathInfo.parent, pathInfo.attr,
    {writable, enumerable, configurable, value});
}


Function.safeStdLibAddition(Object, 'property', setProperty);

Function.safeStdLibAddition(Object, 'undefinedKey', function (key, joinStr, requireIndex) {
  if (!requireIndex && this[key] === undefined) return key;
  if (joinStr === undefined) joinStr = '';
  let index = 1;
  while(this[`${key}${joinStr}${index}`] !== undefined) index++;
  return `${key}${joinStr}${index}`;
});


Function.safeStdLibAddition(Object, 'deletePath', function (path) {
  if ((typeof path) !== 'string' || path === '') throw new Error('path(arg1) must be defined as a non empty string');
  const pathInfo = this.pathInfo(path);
  if (pathInfo === undefined) return;
  const parent = pathInfo.parent;
  const attr = pathInfo.attr;
  delete parent[attr];
});

Function.safeStdLibAddition(Object, 'swap', function (i, j, doNotModify) {
  const arr = doNotModify === true ?
              (Array.isArray(this) ? Array.from(this) : this.copy())
              : this;
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
  return arr;
});

Function.safeStdLibAddition(Object, 'filter', function(complement, func, modify, parentKey) {
  if (!modify) complement = JSON.copy(complement);
  if (func(complement, parentKey)) return {filtered: complement};

  if (!(complement instanceof Object)) return {complement};
  let filtered = Array.isArray(complement) ? [] : {};
  const keys = Object.keys(complement);
  let setOne = false;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const path = parentKey ? `${parentKey}.${key}` : key;
    const seperated = Object.filter(complement[key], func, true, path);
    if (seperated.filtered !== undefined) filtered[key] = seperated.filtered;
    setOne = true;
    if (seperated.complement === undefined) delete complement[key];
    else complement[key] = seperated.complement;
  }
  if (Object.keys(filtered).length === 0) filtered = undefined;
  return {complement, filtered};
}, true);

Function.safeStdLibAddition(Object, 'filter', function(func) {
  return Object.filter(this, func, true).filtered;
});

Function.safeStdLibAddition(Object, 'copy', function(arr) {
  if (Array.isArray(arr)) throw new Error('point to merge...');
  const root = Array.isArray(arr) ? [] : {};
  const keys = Object.keys(arr);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = arr[key];
    if (!(value instanceof Object)) root[key] = value;
    else root[key] = value.copy();
  }
  return root;
}, true);

Function.safeStdLibAddition(Object, 'copy', function(arr) {
  return Object.copy(this);
});

function foreach(obj, func, filter, pathPrefix) {
  if (!pathPrefix) pathPrefix = '';
  if((typeof filter) !== 'function' || filter(obj, pathPrefix)) func(obj, pathPrefix);
  const keys = Object.keys(obj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const path = pathPrefix === '' ? key : `${pathPrefix}.${key}`;
    const value = obj[key];
    if (value instanceof Object) {
      Object.foreach(value, func, filter, path);
    }
  }
};

Function.safeStdLibAddition(Object, 'foreach', function(func, filter) {
  foreach(this, func, filter);
});
Function.safeStdLibAddition(Object, 'map',   function (obj, func) {
  if ((typeof func) !== 'function') return console.warn('Object.map requires a function argument');
  const keys = Object.keys(obj);
  const map = {};
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = obj[key];
    map[key] = func(value, key);
  }
  return map;
}, true);

Function.safeStdLibAddition(Object, 'hash',
  (obj) => JSON.stringify(obj === undefined ? 'undefined' : obj).hash(), true);
