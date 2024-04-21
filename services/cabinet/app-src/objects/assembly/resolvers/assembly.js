
const Resolver = require('../resolver');

class AssemblyResolver extends Resolver {
  constructor(assembly) {
    super(assembly);
    const infoObj = (expression, value, evaluation) =>
      new Resolver.Info(assembly, expression, value, evaluation);
    const positionInfoObj = (expr, attr, axis) =>
      infoObj(expr, assembly.position()[attr](axis), assembly.config()[attr][axis]);

    const positionValue = (assem, expr, func, axis) => {
      if (func === 'r' || func === 'rotation')
        return positionInfoObj(expr, 'rotation', axis);
      else if (func === 'c' || func === 'center')
        return positionInfoObj(expr, 'center', axis);
      else if (func === 'd' || func === 'demension')
        return positionInfoObj(expr, 'demension', axis);
    }

    const demensionValue = (expr) => {
      if (expr === 'length' || expr === 'height' || expr === 'h' || expr === 'l')
        return infoObj(expr, assembly.config().demension.y,  assembly.length());
      else if (expr === 'w' || expr === 'width')
        return infoObj(expr, assembly.config().demension.x, assembly.width());
      else if (expr === 'depth' || expr === 'thickness' || expr === 'd' || expr === 't')
        return infoObj(expr, assembly.config().demension.z, assembly.thickness());
    }

    const posValue = (expr) => {
      const posMatch = expr.match(positionReg);
      if (posMatch) return positionValue(assembly, expr, posMatch[1], posMatch[2]);
    }

    const pcPositionReg = /^([a-zA-Z]{1,})\.([a-zA-Z.0-9]{1,})$/;
    const partCodePositionValue = (expr) => {
      const pcMatch = expr.match(pcPositionReg);
      if (pcMatch) {
        const part = assembly.getAssembly(pcMatch[1]);
        if (part) return part.resolve.information(pcMatch[2]);
      }
    }

    const keyValueValue = (expr) => {
      let assemVal = assembly.value(expr);
      if (Number.isFinite(assemVal))
        return infoObj(expr, assemVal, assemVal);
    }

    const groupValue = (expr) => {
      const group = assembly.group();
      const value = group.resolve(assembly, expr);
      if (value === undefined) return undefined;
      const evaluation = assembly.eval(value);
      return infoObj(expr, value, evaluation);
    }

    let goDownTheRabbitHole = false;
    const positionReg = /^(c|r|d|center|rotation|demension)\.(x|y|z)$/;

    const parentResolveInfo = (expr) => assembly.parentAssembly() ?
          assembly.parentAssembly().resolve.information(expr) : undefined;

    const returnsIfValid = (info) => info && info.valid() ? info : null;

    this.resolve.information = (expr) => {
      // return 1;
      let info;
      info = demensionValue(expr);
      info = returnsIfValid(info) || posValue(expr);
      info = returnsIfValid(info) || partCodePositionValue(expr);
      info = returnsIfValid(info) || keyValueValue(expr);
      if (info && info.valid()) return info;
      const parentAssembly = assembly.parentAssembly();
      let parentInfo = parentResolveInfo(expr);
      if (parentInfo && parentInfo.valid()) return parentInfo;
      const groupInfo = groupValue(expr);
      if (!parentAssembly) return groupInfo;
      return groupInfo && groupInfo.valid() ? groupInfo : undefined;
    }
  }
}



module.exports = AssemblyResolver;
