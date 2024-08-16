
const Resolver = require('../resolver');
const openingReg = /^OP.((i|o|inner|outer)\.|)(c|n|d|center|normal|demension)\.(x|y|z|i|j|k)/;

class SectionPropertiesResolver extends Resolver {
  constructor(sectionProps) {
    super(sectionProps);
    const parentResolveInfo = (expr) => sectionProps.parentAssembly().resolve.information(expr);

    this.resolve.parse = (expr) => {
      const match = expr.match(openingReg);
      if (match === null) return null;
      const inOut = match[2] || 'i';
      const func = match[3];
      const dir = match[4];
      const value = this.resolve.brokenDown(inOut, func, dir);
      return value !== undefined ? value : undefined;
    }

    this.resolve.information = (expr) => {
      const parsed = this.resolve.parse(expr);
      if (parsed) return parsed;
      if (sectionProps.parentAssembly() === undefined) {
        console.warn('This should not happen');
      }
      return sectionProps.parentAssembly().resolve.information(expr);
    }

    this.resolve.inherited = this.resolve.information;

    this.resolve.brokenDown = (inOut, func, dir) => {
      const expr = `OP.${inOut}.${func}.${dir}`;
      const info = new Resolver.Info(sectionProps, expr);
      let value;
      if (func.startsWith('n') && dir.match(/^(i|j|k)$/)) value = sectionProps.normal()[dir]();
      else if (func.startsWith('d') && dir === 'z') value = 0;
      else if (inOut.startsWith('o')) {
        if (func.startsWith('c')) value = secProps.outerCenter()[dir];
        if (func.startsWith('d') && dir === 'x') value = secProps.outerWidth();
        if (func.startsWith('d') && dir === 'y') value = secProps.outerHeight();
      } else {
        if (func.startsWith('c')) value = secProps.innerCenter()[dir];
        if (func.startsWith('d') && dir === 'x') value = secProps.innerWidth();
        if (func.startsWith('d') && dir === 'y') value = secProps.innerHeight();
      }
      info.value(value);
      return info.valid() ? info : undefined;
    }
  }
}

module.exports = SectionPropertiesResolver;
