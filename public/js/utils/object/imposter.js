
class Imposter {
  constructor(object, cuckooEggs) {
    const imposter = new (object.constructor)();
    cuckooEggs ||= {};
    const cuckooKeys = Object.keys(cuckooEggs);

    const keys = Object.keys(object);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (cuckooEggs[key] === undefined) {
        if ((typeof object[key]) === 'function') {
          imposter[key] = object[key];
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
