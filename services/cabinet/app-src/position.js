


const getDefaultSize = require('./utils.js').getDefaultSize;
const FunctionCache = require('../../../public/js/utils/services/function-cache.js');

class Position {
  constructor(assembly, sme) {

    function getSme(attr, obj) {
      if (attr === undefined) {
        return {x: sme.eval(obj.x),
          y: sme.eval(obj.y),
          z: sme.eval(obj.z)}
      } else {
        return sme.eval(obj[attr], assembly);
      }
    }

    let center, demension, rotation;
    let demCoords = {};
    let centerCoords = {};

    if ((typeof assembly.rotationStr()) !== 'object') {
      const rotCoords = Position.parseCoordinates(assembly.rotationStr(), '0,0,0');
      rotation = (attr) => getSme(attr, rotCoords);
    } else {
      rotation = assembly.rotationStr;
    }

    if ((typeof assembly.centerStr()) !== 'object') {
      centerCoords = Position.parseCoordinates(assembly.centerStr(), '0,0,0');
      center = (attr) => getSme(attr, centerCoords);
    } else {
      center = assembly.centerStr;
    }

    if ((typeof assembly.demensionStr()) !== 'object') {
      const defSizes = getDefaultSize(assembly);
      demCoords = Position.parseCoordinates(assembly.demensionStr(),
      `${defSizes.width},${defSizes.length},${defSizes.thickness}`,
      '0,0,0');
      demension = (attr) => getSme(attr, demCoords);
    } else new Promise(function(resolve, reject) {
      demension = assembly.demensionStr
    });



    function get(func, sme) {
      if ((typeof func) === 'function' && (typeof func()) === 'object') return func;
      return sme;
    }


    const rootAssembly = assembly.getRoot();
    if (rootAssembly.constructor.name === 'Cabinet') {
      const cacheId = rootAssembly.uniqueId();
      this.rotation = new FunctionCache((attr) => rotation(attr), null, cacheId, assembly);
      this.center = new FunctionCache((attr) => center(attr), null, cacheId, assembly);
      this.demension = new FunctionCache((attr) => demension(attr), null, cacheId, assembly);
    } else {
      this.rotation = (attr) => rotation(attr);
      this.center = (attr) => center(attr);
      this.demension = (attr) => demension(attr);
    }

    this.current = () => {
      const position = {
        center: this.center(),
        demension: this.demension(),
        rotation: this.rotation()
      };
      assembly.getJoints().male.forEach((joint) =>
        joint.updatePosition(position)
      );
      return position;
    }

    this.centerAdjust = (center, direction) => {
      const magnitude = direction[0] === '-' ? -1 : 1;
      const axis = direction.replace(/\+|-/, '');
      return this.center(center) + (magnitude * this.demension(axis) / 2);
    }

    this.limits = (targetStr) => {
      if (targetStr !== undefined) {
        const match = targetStr.match(/^(\+|-|)([xyz])$/)
        const attr = match[2];
        const d = this.demension(attr)/2;
        const pos = `+${attr}`;
        const neg = `-${attr}`;
        const limits = {};
        limits[pos] = d;
        if (match[1] === '+') return limits[pos];
        limits[neg] = -d;
        if (match[1] === '-') return limits[neg];
        return  limits;
      }
      const d = this.demension();
      return  {
        x: d.x / 2,
        '-x': -d.x / 2,
        y: d.y / 2,
        '-y': -d.y / 2,
        z: d.z / 2,
        '-z': -d.z / 2,
      }
    }

    this.set = (obj, type, value) => {
      if (value !== undefined) obj[type] = value;
      return demension(type);
    }

    this.setDemension = (type, value) => this.set(demCoords, type, value);
    this.setCenter = (type, value) => this.set(centerCoords, type, value);
  }
}

Position.targeted = (attr, x, y, z) => {
  const all = attr === undefined;
  const dem = {
    x: all || attr === 'x' && x(),
    y: all || attr === 'y' && y(),
    z: all || attr === 'z' && z()
  };
  return all ? {x,y,z} : dem[attr];
}
Position.axisStrRegex = /(([xyz])(\(([0-9]*)\)|))/;
Position.rotateStrRegex = new RegExp(Position.axisStrRegex, 'g');
Position.touching = (pos1, pos2) => {
  const touchingAxis = (axis) => {
    if (pos1[`${axis}1`] === pos2[`${axis}0`])
      return {axis: `${axis}`, direction: '+'};
    if (pos1[`${axis}0`] === pos2[`${axis}1`])
      return {axis: `${axis}`, direction: '-'};
  }
  if (!Position.within(pos1, pos2)) return null;
  return touchingAxis('x') || touchingAxis('y') || touchingAxis('z') || null;
}
Position.within = (pos1, pos2, axises) => {
  const axisTouching = (axis) => {
    if (axises !== undefined && axises.index(axis) === -1) return true;
    const p10 = pos1[`${axis}0`];
    const p11 = pos1[`${axis}1`];
    const p20 = pos2[`${axis}0`];
    const p21 = pos2[`${axis}1`];
    return (p10 >= p20 && p10 <= p21) ||
            (p11 <= p21 && p11 >= p20);
  }
  return axisTouching('x') && axisTouching('y') && axisTouching('z');
}

Position.parseCoordinates = function() {
  let coordinateMatch = null;
  for (let index = 0; coordinateMatch === null && index < arguments.length; index += 1) {
    const str = arguments[index];
    if (index > 0 && arguments.length - 1 === index) {
      //console.error(`Attempted to parse invalid coordinateStr: '${JSON.stringify(arguments)}'`);
    }
    if (typeof str === 'string') {
      coordinateMatch = str.match(Position.demsRegex);
    }
  }
  if (coordinateMatch === null) {
    throw new Error(`Unable to parse coordinates`);
  }
  return {
    x: coordinateMatch[1],
    y: coordinateMatch[2],
    z: coordinateMatch[3]
  }
}
Position.demsRegex = /([^,]{1,}?),([^,]{1,}?),([^,]{1,})/;
module.exports = Position
