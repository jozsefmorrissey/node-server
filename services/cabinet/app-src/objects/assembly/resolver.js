
const ResolutionInformation = require('./resolution-info');

class Resolver {
  constructor(object) {
    this.resolve = (expr, raw) => {
      const info = this.resolve.information(expr);
      if (info && !(info instanceof ResolutionInformation))
        console.warn(`expr '${expr}' resolution invalid`);
      this.resolve.information(expr);
      return info && info.valid && info.valid() ?
                (raw === true ? info.value() : info.evaluation()) : NaN;
    }
    object.resolve = this.resolve;
  }
}

Resolver.Info = ResolutionInformation;


module.exports = Resolver;
