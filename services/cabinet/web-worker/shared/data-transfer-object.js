
const mathClassReg = /^.*(2|3)(d|D)$/

const isPrimitive = (val) => (!(val instanceof Object) && !(val instanceof Function)) ||
                              val instanceof Error;

const arrayMapReg = /^(.*?)\>(.*)$/
const evaluateAttributes = (to) => (object, attributes, dto) => {
  dto ||= {};
  for (let index = 0; index < attributes.length; index++) {
    let attr = attributes[index];
    if (attr === 'toString') {
      console.warn('toString cannot be overwitted as a non-function');
    }
    const match = attr.match(arrayMapReg);
    if (match) {
      attr = match[1];
    }
    let value = Object.pathValue(object, attr);
    if (match) {
      const childAttrs = match[2].split(',');
      if (Array.isArray(value))
        value = value.map(o => to.evaluateAttributes(o, childAttrs));
      else if (value instanceof Object)
        value = to.evaluateAttributes(value, childAttrs);
    }
    dto.pathValue(attr, to(value));
  }
  return dto;
}

const excludeKeys = ['events', 'trigger', 'on'];
const nonFuntionalAttrs = (object, dto, to) => {
  const keys = Object.keys(object);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if ((typeof object[key]) !== 'function' && excludeKeys.indexOf(key) === -1) {
      const value =  to(object[key]);
      dto.pathValue(key, value);
    }
  }
}

const toStrConstructors = ['IdString'];
const useToString = (obj) => {
  const cxtr = obj.constructor.name;
  return toStrConstructors.indexOf(cxtr) !== -1;
}

class DataTransferObject{constructor(){}};

function toDto (functionValueConfiguration, objectPreProcessor) {
  functionValueConfiguration ||= {};
  const to = function toDto (objectOval) {
    if (objectOval === null || objectOval === undefined) return objectOval;
    if (objectOval instanceof Function) return;
    if (isPrimitive(objectOval)) return objectOval;
    if (useToString(objectOval)) return objectOval.toString();
    // if (objectOval.constructor.name.match(mathClassReg)) return objectOval.toDrawString();
    if (Array.isArray(objectOval)) return objectOval.map(oov =>  to(oov)).filter(o => o !== undefined);
    let dto = new DataTransferObject();
    nonFuntionalAttrs(objectOval, dto, to);
    if (objectPreProcessor) {
      const ppValue = objectPreProcessor(objectOval, dto, to);
      if (ppValue !== undefined) return ppValue;
    }
    if (functionValueConfiguration[objectOval.constructor.name])
    to.evaluateAttributes(objectOval, functionValueConfiguration[objectOval.constructor.name], dto);
    return dto;
  }
  to.evaluateAttributes = evaluateAttributes(to);
  return to;
}


module.exports = toDto;
