const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function randomString(len) {
  len = len || 7;
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}
$t.global('getValue', getValue, true);

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24, width: 50, thickness: 21};
  return {length: 0, width: 0, thickness: 0};
}

function setterGetter () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 1) {
    const attr = arguments[index];
    this[attr] = (value) => {
      if (value === undefined) return attrs[attr];
      attrs[attr] = value;
    }
  }
}

function funcOvalue () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 2) {
    const attr = arguments[index];
    const funcOval = arguments[index + 1];
    if ((typeof funcOval) === 'function') this[attr] = funcOval;
    else this[attr] = () => funcOval;
  }
}
