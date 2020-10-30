
class Endpoints {
  constructor(object) {
    const endPointFuncs = {}
    this.getFuncObj = function () {return endPointFuncs;};

    function build(str) {
      const pieces = str.split(/:[a-zA-Z0-9]*/g);
      const labels = str.match(/:[a-zA-Z0-9]*/g) || [];
      return function () {
        let endpoint = '';
        for (let index = 0; index < pieces.length; index += 1) {
          const arg = arguments[index];
          let value = '';
          if (index < pieces.length - 1) {
            value = arg !== undefined ? arg : labels[index];
          }
          endpoint += pieces[index] + value;
        }
        return endpoint;
      }
    }

    function objectRecurse(currObject, currFunc) {
      const keys = Object.keys(currObject);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (key.indexOf('_') !== 0) {
          const value = currObject[key];
          if (value instanceof Object) {
            currFunc[key] = {};
            objectRecurse(value, currFunc[key]);
          } else {
            currFunc[key] = build(value);
          }
        }
      }
    }

    objectRecurse(object, endPointFuncs);
  }
}

exports.EPNTS = new Endpoints(require('../json/endpoints.json')).getFuncObj();
