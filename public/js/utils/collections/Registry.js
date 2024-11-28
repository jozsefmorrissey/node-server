
class Registry {
  constructor() {
    const registry = {};

    this.get = (...path) => {
      const info = registry.pathInfo(path.join('.'));
      if (info) return info.value;
      return null;
    }
    this.set = (value, ...path) => registry.pathValue(path.join('.'), value);

  }
}

module.exports = Registry;
