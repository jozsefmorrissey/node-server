
const objectResolver = require('./object-resolver.js');

function FROM_JSON (json) {
  if (Array.isArray(json)) {
    const arr = [];
    json.forEach((value) => {
      if ((typeof value) === 'object') {
        arr.push(FROM_JSON(value));
      } else {
        arr.push(value);
      }
    });
    return arr;
  }
  const keys = Object.keys(json);
  keys.forEach((key) => {
    if (key !== '_TYPE') {
      const value = json[key];
      if ((typeof value) === 'object') {
        json[key] = FROM_JSON(value);
      } else {
        json[key] = value;
      }
    }
  });
  return objectResolver(json);
}

exports.FROM_JSON = FROM_JSON;
