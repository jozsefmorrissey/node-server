
const ResolutionInformation = require('./resolution-info');

class Resolver {
  constructor(object) {
    const parentResolver = this.resolve;
    this.resolve = (expr, raw) => {
      if ((typeof expr) !== 'string') return expr;
      const info = this.resolve.information(expr);
      if (!info && parentResolver) info = parentResolver.information();
      return info && info.valid && info.valid() ?
                (raw === true ? info.value() : info.evaluation()) : NaN;
    }
    this.resolve.inherited = () => {};
    object.resolve = this.resolve;
  }
}

Resolver.Info = ResolutionInformation;


module.exports = Resolver;
