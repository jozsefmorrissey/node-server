
const Resolver = require('../resolver');

const xyzReg = /^x|y|z$/;
const ijkReg = /^i|j|k$/;
const isXYZ = (expr) => !!((typeof expr) === 'string' && expr.match(xyzReg));
const isIJK = (expr) => !!((typeof expr) === 'string' && expr.match(ijkReg));
const safeLowerCase = (str) => (typeof str) === 'string' ? str.toLowerCase() : null;

class AssemblyResolver extends Resolver {
  constructor(assembly) {
    super(assembly);
    const infoObj = (expression, value, evaluation) =>
      new Resolver.Info(assembly, expression, value, evaluation);
    const positionInfoObj = (expr, attr, axis, raw) =>
      infoObj(expr, assembly.config()[attr][axis], raw ? null : assembly.position()[attr](axis));

    const positionValue = (assem, expr, func, axis,  normDir, raw) => {
      func = safeLowerCase(func);
      axis = safeLowerCase(axis);
      normDir = safeLowerCase(normDir);
      if ((func === 'r' || func === 'rotation') && isXYZ(axis))
        return positionInfoObj(expr, 'rotation', axis, raw);
      else if ((func === 'c' || func === 'center') && isXYZ(axis))
        return positionInfoObj(expr, 'center', axis, raw);
      else if ((func === 'd' || func === 'demension') && isXYZ(axis))
        return positionInfoObj(expr, 'demension', axis, raw);
      else if ((func === 'n' || func === 'normal') && isXYZ(axis) && isIJK(normDir)) {
        const value = assembly.normals()[axis][normDir]();
        return infoObj(expr, value, value);
      }
    }

    // assembly.config().demension.x
    let v;
    const demensionValue = (expr, raw) => {
      if (expr === 'length' || expr === 'height' || expr === 'h' || expr === 'l')
        return infoObj(expr, assembly.config().demension.y, assembly.length());
      else if (expr === 'w' || expr === 'width')
        return infoObj(expr, assembly.config().demension.x, assembly.width());
      else if (expr === 'depth' || expr === 'thickness' || expr === 'd' || expr === 't')
        return infoObj(expr, assembly.config().demension.z, assembly.thickness());
    }

    const posValue = (expr, raw) => {
      const posMatch = expr.match(positionReg);
      if (posMatch) return positionValue(assembly, expr, posMatch[1], posMatch[2], posMatch[4], raw);
    }

    const pcPositionReg = /^([a-zA-Z_]{1,})(\.([a-zA-Z.0-9]{1,})){1,}$/;
    const partCodePositionValue = (expr, raw) => {
      const pcMatch = expr.match(pcPositionReg);
      if (pcMatch) {
        const part = assembly.getAssembly(pcMatch[1]);
        if (part)
          return part.resolve.information(pcMatch[3], raw);
      }
    }

    const keyValueValue = (expr, assem, raw) => {
      let assemVal = (assem || assembly).value(expr, undefined, raw);
      if (assemVal !== undefined)
        return infoObj(expr, assemVal, assemVal);
    }

    const groupValue = (expr, raw) => {
      const group = assembly.group();
      const value = group.resolve(expr, undefined, undefined, raw);
      if (value === undefined) return undefined;
      return infoObj(expr, value, raw ? null : assembly.eval(value));
    }

    let goDownTheRabbitHole = false;
    const positionReg = /^(n|c|r|d|normal|center|rotation|demension)\.(x|y|z)(\.(i|j|k)|)$/;

    const parentResolveInfo = (expr, raw) => {
      let curr = assembly.parentAssembly();
      while (curr) {
        let info = keyValueValue(expr, curr);
        if (info && info.valid()) return info;
        info = curr.resolve.inherited(expr, raw);
        if (info && info.valid()) return info;
        curr = curr.parentAssembly();
      }
    }

    const returnsIfValid = (info) => info && info.valid() ? info : null;

    this.resolve.information = (expr, raw) => {
      let info;
      if (expr.match(/^(W|H|T|D)$/)) expr = `${assembly.getRoot().partCode()}.${expr.toLowerCase()}`;
      info = demensionValue(expr, raw);
      info ||= returnsIfValid(info) || posValue(expr, raw);
      info ||= returnsIfValid(info) || partCodePositionValue(expr, raw);
      info ||= returnsIfValid(info) || keyValueValue(expr, undefined, raw);
      if (info && info.valid()) return info;
      let parentInfo = parentResolveInfo(expr, raw);
      if (parentInfo) return parentInfo;
      const groupInfo = groupValue(expr, raw);
      return groupInfo && groupInfo.valid() ? groupInfo : undefined;
    }
  }
}



module.exports = AssemblyResolver;
