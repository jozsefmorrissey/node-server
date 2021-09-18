class Register {
  constructor() {
    const registered = {};
    this.register = function (nameOobj, obj) {
      if ((typeof nameOobj) !== 'object') {
        registered[nameOobj] = obj;
      } else {
        const keys = Object.keys(nameOobj);
        for (let index = 0; index < keys.length; index += 1) {
          const key = keys[index];
          registered[key] = nameOobj[key];
        }
      }
    }
    this.get = (name) => registered[name];
  }
}

module.exports = new Register();
