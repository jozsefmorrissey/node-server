
const Resolver = require('../resolver');
const openingReg = /^OP([0-9]*)(\.(i|o|inner|outer)|)\.(c|n|d|center|normal|demension)\.(x|y|z|i|j|k)/;

class CabinetResolver extends Resolver {
  constructor(cabinet) {
    const parentResolver = cabinet.resolve.information;
    super(cabinet);
    this.resolve.parse = (expr) => {
      const match = expr.match(openingReg);
      if (match === null || cabinet.openings.length === 0) return null;
      let index = Number.parseInt(match[1]) || 1;
      if (index > cabinet.openings.length) index = cabinet.openings.length;
      const inOut = match[2] || 'i';
      const func = match[4];
      const dir = match[5];
      return {index, inOut, func, dir};
    }

    this.resolve.information = (expr, raw) => {
      const parsed = this.resolve.parse(expr, raw);
      if (parsed) return this.resolve.brokenDown(parsed.index, parsed.inOut, parsed.func, parsed.dir, raw);
      else return parentResolver(expr, raw);
    }
    this.resolve.inherited = this.resolve.information;


    this.resolve.brokenDown = (index, inOut, func, dir, raw) => {
      const expr = `OP${index}.${inOut}.${func}.${dir}`;

      const opening = cabinet.openings[index - 1];
      const secPropsInfo = opening.sectionProperties().resolve.brokenDown(inOut, func, dir);
      if (secPropsInfo && secPropsInfo.valid()) {
        secPropsInfo.object(cabinet);
        return secPropsInfo;
      }
      return parentResolver(expr, raw);
    }
  }
}

module.exports = CabinetResolver;
