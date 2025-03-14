
const ResolutionInformation = require('./resolution-info');

class Resolver {
  constructor(object) {
    const parentResolver = this.resolve;
    this.resolve = (expr, raw) => {
      if ((typeof expr) !== 'string') return expr;
      const info = this.resolve.information(expr, raw);
      if (!info && parentResolver) info = parentResolver.information();
      return info && info.valid && info.valid() ?
                (raw === true ? info.value() : info.evaluation()) : NaN;
    }
    this.resolve.inherited = () => {};
    object.resolve = this.resolve;

    this.resolve.NaN = (expr) => Number.isNaN(this.resolve(expr));
    this.resolve.display = (expr) => {
      const resolved = this.resolve(expr);
      if (!Number.isNaN(resolved)) return new Measurement(resolved).display();
      return this.resolve(expr, true);
    }
  }
}

Resolver.Info = ResolutionInformation;


module.exports = Resolver;
