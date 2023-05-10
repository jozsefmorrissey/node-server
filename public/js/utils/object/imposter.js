
class Imposter {
  constructor(object, cuckooEggs, ...args) {
    const imposter = new (object.constructor)(...args);
    cuckooEggs ||= {};
    const cuckooKeys = Object.getOwnPropertyNames(cuckooEggs);

    const keys = ['toString'];//Object.getOwnPropertyNames(object);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (cuckooKeys.indexOf(key) === -1) {
        if ((typeof object[key]) === 'function') {
          imposter[key] = (...args) => object[key].apply(object, args);
        } else {
          Object.defineProperty(imposter, key, {
            get() {
              return object[key];
            },
            set(value) {
              object[key] = value;
            }
          });
        }
      }
    }

    for (let index = 0; index < cuckooKeys.length; index++) {
      const key = cuckooKeys[index];
      imposter[key] = cuckooEggs[key];
    }

    imposter.equals = (obj) => {
      if (obj === object) return true;
      return object.equals(obj);
    }

    return imposter;
  }
}

module.exports = Imposter;
