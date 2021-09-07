



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

Function.safeStdLibAddition(Object, 'getSet',   function () {
  let values = {};
  let attrs = Array.from(arguments);
  attrs.forEach((attr) => {
    this[attr] = (value) => {
      if (value === undefined) {
        const noDefaults = (typeof this.defaultGetterValue) !== 'function';
        if (values[attr] !== undefined || noDefaults)
        return values[attr];
        return this.defaultGetterValue(attr);
      }
      values[attr] = value;
    }
  });
  const origToJson = this.toJson;
  this.toJson = () => {
    const json = (typeof origToJson === 'function') ? origToJson() : {};
    json._TYPE = this.constructor.name;
    attrs.forEach((attr) => {
      const value = this[attr]();
      if ((typeof value) === 'object') {
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
    });
    return json;
  }
  this.fromJson = (json) => {
    attrs.forEach((attr) => {
      this[attr](json[attr]);
    });
    return this;
  }
});

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
});

Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
  const keys = Object.keys(obj);
  const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
                  Array.isArray(obj) ? [] : {};
  for(let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const member = obj[key];
    if ((typeof memeber) === 'object') {
      if ((typeof member.clone) === 'function') {
        clone[key] = member.clone();
      } else {
        clone[key] = JSON.clone(member);
      }
    } else {
      clone[key] = member;
    }
  }
  return clone;
}, true);

Function.safeStdLibAddition(String, 'parseSeperator',   function (seperator, isRegex) {
  if ((typeof this) !== 'string') {
    return {};
  }
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

Function.safeStdLibAddition(Object, 'pathValue', function (path, value) {
  const attrs = path.split('.');
  const lastIndex = attrs.length - 1;
  let currObj = this;
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
});
module.exports = safeStdLibAddition




