
const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function randomString(len) {
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

const CONSTANTS = {
  pwt34: {name: 'Plywood 3/4 Thickness', value: 25/32},
  pwt12: {name: 'Plywood 1/2 Thickness', value: 1/2},
  pwt14: {name: 'Plywood 1/4 Thickness', value: 1/4},
  brh: {name: 'Bottom rail height', value: 4.5},
  frw: {name: 'Frame Rail Width', value: 1.5},
  frt: {name: 'Frame Rail Thickness', value: 3/4},
  tkbw: {name: 'Toe Kick Backer Width', value: 1/2},
  tkh: {name: 'Toe Kick Height', value: 3},
  pbt: {name: 'Panel Back Thickness', value: 1/2},
  brr: {name: 'Bottom Rail Reveal', value: 1/8},

  trv: {name: 'Top Reveal', value: 1/2},
  brv: {name: 'Bottom Reveal', value: 1/4},
  lrv: {name: 'Left Reveal', value: 1/2},
  rrv: {name: 'Right Reveal', value: 1/2},
  fs: {name: 'Face Spacing??', value: 1/8},
  is: {name: 'Inset Spacing??', value: 1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},

}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}
$t.global('getValue', getValue, true);

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24, width: 50, thickness: 21};
  return {length: 0, width: 0, thickness: 0};
}

class Expression {
  constructor(target, str, identificationFunc, attrResolveFunc) {
    this.target = () => target;
    this.str = () => str;
    this.identify = (objTypeId) => identificationFunc(objTypeId);
    this.resolve = attrResolveFunc || ((obj, attr) => obj[attr]);
    this.getValue = (objTypeId, attr) => {
      const idStr = `${objTypeId}.${attr}`;
      // if (Expression.requestedIds[idStr] === true) throw new Error(`Circular dependency detected @${idStr}: ${JSON.stringify(Object.keys(Expression.requestedIds))}`)
      Expression.requestedIds[idStr] = true;
      let obj;
      if (objTypeId === undefined) {
        obj = target;
      } else {
        obj = this.identify(objTypeId);
      }
      const returnVal = this.resolve(obj, attr);
      delete Expression.requestedIds[idStr];
      return returnVal;
    }
    this.replace = () => {
      let retStr = str;
      const references = retStr.match(Expression.refRegex) || [];
      references.forEach((ref) => {
        const match = ref.match(Expression.breakdownReg);
        const objTypeId = match[4];
        const attr = match[5];
        const value = this.getValue(objTypeId, attr);
        if (value !== undefined) {
          retStr = retStr.replace(match[2], value);
        }
      });
      return retStr;
    }

    this.eval = () =>
      eval(this.replace(target, str));  }

}

Expression.requestedIds = {}
Expression.refRegStr = '(^|[\\s\\+-\\\\(\\\\)])((([a-zA-Z][a-zA-Z0-9]*)\\.|)([a-zA-Z][a-zA-Z0-9]*))($|[\\s\\+-\\\\(\\\\)])';
Expression.refRegex = new RegExp(Expression.refRegStr, 'g');
Expression.breakdownReg = new RegExp(Expression.refRegStr);
Expression.list = function (target, identificationFunc, attrResolveFunc) {
  const list = [];
  for (let index = 3; index < arguments.length; index +=1) {
    const str = arguments[index];
    list.push(new Expression(target, str, identificationFunc, attrResolveFunc));
  }
  return list;
}
class Position {
  constructor(rotateStr, origXexp, origYexp, origZexp) {
    rotateStr = rotateStr || '';
    const attr = {};
    attr.y = 'length';
    attr.x = 'width';
    attr.z = 'thickness';

    this.getDemension = (axis) => attr[axis];

    const match = rotateStr.match(Position.regex);
    const rotateAxis = match === null ? [] : match[1].split('');
    const o = {};
    o.x = origXexp;
    o.y = origYexp;
    o.z = origZexp;
    // console.log(o)
    const resolve = (str) => eval(str);

    this.pointObj = (x, y, z) => ({x, y, z});
    this.get = (obj, targetAttr) => {
      const dem = (axis) => o[axis].eval() + obj[attr[axis]]();
      const orig = (axis) => o[axis].eval();
      if (targetAttr !== undefined) {
        if (targetAttr.match(/^([xyz])0$/)) return orig(targetAttr.match(/^([xyz])0$/)[1]);
        if (targetAttr.match(/^([xyz])1$/)) return dem(targetAttr.match(/^([xyz])1$/)[1]);
      }

      const points = [];
      const ret = {x0: orig('x'), x1: dem('x'), y0: orig('y'), y1: dem('y'),
                    z0: orig('z'), z1: dem('z'), points};
      points.push(this.pointObj(dem('x'), orig('y'), dem('z')));
      points.push(this.pointObj(dem('x'), orig('y'), orig('z')));
      points.push(this.pointObj(dem('x'), dem('y'), orig('z')));
      points.push(this.pointObj(dem('x'), dem('y'), dem('z')));
      points.push(this.pointObj(orig('x'), dem('y'), dem('z')));
      points.push(this.pointObj(orig('x'), dem('y'), orig('z')));
      points.push(this.pointObj(orig('x'), orig('y'), orig('z')));
      points.push(this.pointObj(orig('x'), orig('y'), dem('z')));
      return ret;
    }

    rotateAxis.forEach((axis) => {
      let temp;
      switch (axis) {
        case 'x':
          temp =  attr.z;
          attr.z = attr.y;
          attr.y = temp;
          break;
        case 'y':
          temp =  attr.z;
          attr.z = attr.x;
          attr.x = temp;
          break;
        case 'z':
          temp =  attr.y;
          attr.y = attr.x;
          attr.x = temp;
          break;
      }
    })

  }
}
Position.regex = /^([xyz]{1,})$/;
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
      coordinateMatch = str.match(Assembly.demsionRegex);
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

class Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    this.getAssembly = (partCode, callingAssem) => {
      if (callingAssem === this) return undefined;
      if (this.partCode === partCode) return this;
      if (this.subAssemblies[partCode]) return this.subAssemblies[partCode];
      if (callingAssem !== undefined) {
        const children = Object.values(this.subAssemblies);
        for (let index = 0; index < children.length; index += 1) {
          const assem = children[index].getAssembly(partCode, this);
          if (assem !== undefined) return assem;
        }
      }
      if (this.parentAssembly !== undefined && this.parentAssembly !== callingAssem)
        return this.parentAssembly.getAssembly(partCode, this);
      return undefined;
    }


    const origLoc = Position.parseCoordinates(originStr, '0,0,0');
    const origExp = Expression.list(this, this.getAssembly, Assembly.resolveAttr,
      origLoc.x, origLoc.y, origLoc.z);
    const originalPosition = new Position(rotationStr, origExp[0], origExp[1], origExp[2]);
    this.getPosition = (attr) => originalPosition.get(this, attr);
    this.getDemension = (axis) => originalPosition.getDemension(axis);
    const defSizes = getDefaultSize(this);
    let dems = Position.parseCoordinates(demensionStr,
        `${defSizes.length},${defSizes.width},${defSizes.thickness}`,
        '0,0,0');
    let demExp = Expression.list(this, this.getAssembly, Assembly.resolveAttr,
          dems.x, dems.y, dems.z);
    this.partCode = partCode;
    this.partName = partName;
    this.joints = [];
    this.values = {};
    this.positionObj = () => originalPosition.get(this);
    this.fullDem = () => {
      const maleJoints = this.getJoints().male;
      const pos = this.getPosition();
      maleJoints.forEach((joint) => {
        const femPos = this.getAssembly(joint.femalePartCode).getPosition();
        const axis = Position.touching(pos, femPos);
        console.log(axis);
      });
    }
    this.getJoints = (pc, joints) => {
      pc = pc || partCode;
      joints = joints || {male: [], female: []};
      this.joints.forEach((joint) => {
        if (joint.malePartCode === pc) {
          joints.male.push(joint);
        } else if (joint.femalePartCode === pc) {
          joints.female.push(joint);
        }
      });
      if (this.parentAssembly !== undefined)
        this.parentAssembly.getJoints(pc, joints);
      return joints;
    }
    function initObj(value) {
      const obj = {};
      for (let index = 1; index < arguments.length; index += 1) {
        obj[arguments[index]] = value;
      }
      return obj;
    }
    this.value = (code, value) => {
      if (value !== undefined) {
        this.values[code] = value;
      } else {
        if (this.values[code] !== undefined && this.values[code] !== null) {
          return this.values[code];
        }
        return CONSTANTS[code].value;
      }
    }
    this.jointOffsets = () => {
      const joints = this.getJoints(this.partCode);
      const jointOffsets = initObj({value: 0}, '-x', '+x', '-y', '+y', '-z', '+z');
      const pos = this.getPosition();
      joints.male.forEach((joint) => {
        const femalePos = this.getAssembly(joint.femalePartCode).getPosition();
        const femalePart = this.getAssembly(joint.femalePartCode);
        const attr = Position.touching(pos, femalePos);
        const axis = attr.axis;
        const dir = attr.direction;
        const axisDirStr = `${dir}${axis}`;
        const dem = this.getDemension(axis);
        const value = joint.maleOffset();
        if (jointOffsets[axisDirStr].value < value)
          jointOffsets[axisDirStr] = {dem, value};
      });
      return jointOffsets;
    }
    this.getCutDemensions = () => {
      const dems = {
        length: this.length(),
        width: this.width(),
        thickness: this.thickness()
      }
      const jointOffsets = this.jointOffsets();
      Object.values(jointOffsets).forEach((offset) => {
        if (offset.value !== 0)
          dems[offset.dem] += offset.value;
      });
      return dems;
    }
    this.subAssemblies = {};
    this.setParentAssembly = (pa) => this.parentAssembly = pa;
    this.features = Feature.getList(formatConstructorId(this));
    this.addSubAssembly = (assembly) => {
      this.subAssemblies[assembly.partCode] = assembly;
      assembly.setParentAssembly(this);
    }
    this.objId = this.constructor.name;

    this.addJoints = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        const joint = arguments[i];
        this.joints.push(joint);
        joint.setParentAssembly(this);
      }
    }

    this.addSubAssemblies = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        this.addSubAssembly(arguments[i]);
      }
    }

    this.getSubAssemblies = () => {
      let assemblies = [];
      Object.values(this.subAssemblies).forEach((assem) => {
        assemblies.push(assem);
        assemblies = assemblies.concat(assem.getSubAssemblies());
      });
      return assemblies;
    }
    this.uniqueId = randomString(32);
    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }
    Assembly.add(this);
    const lengthExp = demExp[0];
    const widthExp = demExp[1];
    const thicknessExp = demExp[2];
    this.length = () => lengthExp.eval();
    this.width = () => widthExp.eval();
    this.thickness = () => thicknessExp.eval();
  }
}

Assembly.demsionRegex = /([^,]{1,}?),([^,]{1,}?),([^,]{1,})/;
Assembly.list = {};
Assembly.add = (assembly) => {
  const name = assembly.constructor.name;
  if (Assembly.list[name] === undefined) Assembly.list[name] = [];
  Assembly.list[name].push(assembly);
}
Assembly.all = () => {
  const list = [];
  const keys = Object.keys(Assembly.list);
  keys.forEach((key) => list.push(Assembly.list[key]));
  return list;
}
Assembly.resolveAttr = (assembly, attr) => {
  if (CONSTANTS[attr]) return CONSTANTS[attr].value;
  if (attr === 'length' || attr === 'height' || attr === 'h' || attr === 'l') {
    return assembly.length();
  } else if (attr === 'w' || attr === 'width') {
    return assembly.width();
  } else if (attr === 'depth' || attr === 'thickness' || attr === 'd' || attr === 't') {
    return assembly.thickness();
  } else if (attr === 'x0') return assembly.getPosition('x0');
  else if (attr === 'x1') return assembly.getPosition('x1');
  else if (attr === 'y0') return assembly.getPosition('y0');
  else if (attr === 'y1') return assembly.getPosition('y1');
  else if (attr === 'z0') return assembly.getPosition('z0');
  else if (attr === 'z1') return assembly.getPosition('z1');
}
Assembly.lists = {};
Assembly.idCounters = {};

class Section extends Assembly {
  constructor(templatePath, isPartition, partCode, partName, originStr, demensionStr, rotationStr) {
    super(templatePath, isPartition, partCode, partName, originStr, demensionStr, rotationStr);
    this.isPartition = () => isPartition;
    if (templatePath === undefined) {
      throw new Error('template path must be defined');
    }
    this.constructorId = this.constructor.name;
    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
    Section.sections[this.constructorId] = this;
    Section.templates[this.constructorId] = new $t(templatePath);
  }
}
Section.sections = {};
Section.getSections = (isPartition) => {
  const sections = [];
  Object.values(Section.sections).forEach((section) => {
    const part = section.isPartition();
    if(isPartition === undefined || part === isPartition) sections.push(section);
  });
  return sections;
}
Section.keys = () => Object.keys(Section.sections);
Section.templates = {};
Section.new = (constructorId) => new (Section.sections[constructorId]).constructor();
Section.render = (opening, scope) => {
  scope.featureDisplay = new FeatureDisplay(opening).html();
  const cId = opening.constructorId;
  if (cId === 'DivideSection') {
    return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
  }
  return Section.templates[cId].render(scope);
}

class Pull extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
  }
}

class Door extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
    this.addSubAssembly(new Pull());
  }
}

class Panel extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
  }
}

class Frame extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
  }
}

class Drawer extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
  }
}

class PartitionSection extends Section {
  constructor(templatePath, partCode, partName, originStr, demensionStr, rotationStr) {
    super(templatePath, true, partCode, partName, originStr, demensionStr, rotationStr);
  }
}

class SpaceSection extends Section {
  constructor(templatePath, partCode, partName, originStr, demensionStr, rotationStr) {
    super(templatePath, false, partCode, partName, originStr, demensionStr, rotationStr);
  }
}


const sectionFilePath = (filename) => `./public/html/planks/sections/${filename}.html`;

class Feature {
  constructor(id, subFeatures, properties, parent) {
    subFeatures = subFeatures || [];
    this.properties = properties || {};
    this.enabled = false;
    this.features = [];
    const radioFeatures = [];
    this.name = id.replace(/([a-z])([A-Z])/g, '$1.$2')
                  .replace(/\.([a-zA-Z0-9])/g, Feature.formatName);
    this.id = id;
    this.isRoot = (path) => path === 'root';
    this.multipleFeatures = () => this.features.length > 1;
    this.isInput = () => (typeof this.properties.inputValidation) === 'function';
    this.showInput = () => (this.isInput() && !this.isCheckbox() && !this.isRadio())
                          || (this.enabled && (this.isCheckbox() || this.isRadio()));
    this.isCheckbox = () => this.id.indexOf('has') === 0;
    this.radioFeature = (feature) => radioFeatures.length > 1 && radioFeatures.indexOf[feature] !== -1;
    this.isRadio = () => (!this.isCheckbox() && parent !== undefined && parent.radioFeature(this));
    this.addFeature = (featureOrId) => {
      let feature;
      if (featureOrId instanceof Feature) feature = featureOrId;
      else feature = Feature.byId[featureOrId];
      if (!(feature instanceof Feature)) {
        throw new Error(`Invalid feature '${id}'`);
      }
      this.features.push(feature);
      if (!feature.isCheckbox()) radioFeatures.push(feature);
    };
    subFeatures.forEach((featureId) => this.addFeature(featureId))
    Feature.byId[id] = this;
  }
}

Feature.byId = {};
Feature.objMap = {};
Feature.addRelations = (objId, featureIds) => {
  featureIds.forEach((id) => {
    if (Feature.objMap[objId] === undefined) Feature.objMap[objId] = [];
    const feature = Feature.byId[id];
    if (!(feature instanceof Feature)) {
      throw new Error('Trying to add none Feature object');
    }
    else Feature.objMap[objId].push(feature);
  });
};
Feature.clone = (feature, parent) => {
  const clone = new feature.constructor(feature.id, undefined, feature.properties, parent);
  feature.features.forEach((f) => clone.addFeature(Feature.clone(f, feature)));
  return clone;
}
Feature.getList = (id) => {
  const masterList = Feature.objMap[id];
  if (masterList === undefined) return [];
  const list = [];
  masterList.forEach((feature) => list.push(Feature.clone(feature)));
  return list;
}
Feature.formatName = (match) => ` ${match[1].toUpperCase()}`;

function regexToObject (str, reg) {
  const match = str.match(reg);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 2; index < arguments.length; index += 1) {
    const attr = arguments[index];
    if (attr) returnVal[attr] = match[index - 1];
  }
  return returnVal;
}

class Measurment {
  constructor(value) {
    let decimal = 0;
    let nan = false;
    this.isNaN = () => nan;

    const parseFraction = (str) => {
      const regObj = regexToObject(str, Measurment.regex, 'integer', null, 'numerator', 'denominator');
      regObj.integer = Number.parseInt(regObj.integer) || 0;
      regObj.numerator = Number.parseInt(regObj.numerator) || 0;
      regObj.denominator = Number.parseInt(regObj.denominator) || 0;
      if(regObj.denominator === 0) {
        regObj.numerator = 0;
        regObj.denominator = 1;
      }
      regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
      return regObj;
    };

    function reduce(numerator, denominator) {
      let reduced = true;
      while (reduced) {
        reduced = false;
        for (let index = 0; index < Measurment.primes.length; index += 1) {
          const prime = Measurment.primes[index];
          if (prime >= denominator) break;
          if (numerator % prime === 0 && denominator % prime === 0) {
            numerator = numerator / prime;
            denominator = denominator / prime;
            reduced = true;
            break;
          }
        }
      }
      return `${numerator}/${denominator}`;
    }

    this.fraction = (accuracy) => {
      const fracObj = parseFraction(accuracy);
      if (fracObj.decimal === 0 || fracObj.integer > 0 || fracObj.denominator > 1000) {
        throw new Error('Please enter a fraction with a denominator between (0, 1000]')
      }
      const integer = Math.floor(decimal);
      let remainder = decimal - integer;
      let currRemainder = remainder;
      let value = 0;
      let numerator = 0;
      while (currRemainder > 0) {
        numerator++;
        currRemainder -= fracObj.decimal;
      }
      const diff1 = remainder - ((numerator - 1) / fracObj.denominator);
      const diff2 = (numerator / fracObj.denominator) - remainder;
      numerator -= diff1 < diff2 ? 1 : 0;
      return `${integer} ${reduce(numerator, fracObj.denominator)}`;
    }

    if ((typeof value) === 'number') {
      decimal = value;
    } else if ((typeof value) === 'string') {
      decimal = parseFraction(value).decimal;
    } else {
      nan = true;
    }
  }
}
Measurment.regex = /^\s*([0-9]*)\s*(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
Measurment.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];

new Feature('thickness', undefined, {inputValidation: (value) => !new Measurment(value).isNaN()});
new Feature('inset');
new Feature('fullOverlay');
new Feature('1/8');
new Feature('1/4');
new Feature('1/2');
new Feature('roundOver', ['1/8', '1/4', '1/2']);
new Feature('knockedOff');
new Feature('hasFrame', ['thickness']);
new Feature('hasPanel', ['thickness']);
new Feature('insetProfile');
new Feature('glass');
new Feature('edgeProfile', ['roundOver', 'knockedOff']);
new Feature('drawerFront', ['edgeProfile'])
new Feature('doveTail');
new Feature('miter');
new Feature('drawerBox', ['doveTail', 'miter'])
new Feature('insetPanel', ['glass', 'insetProfile'])
new Feature('solid');
new Feature('doorType', ['fullOverlay', 'inset']);
new Feature('doorStyle', ['insetPanel', 'solid'])
new Feature('drawerType', ['fullOverlay', 'inset']);

Feature.addRelations('Drawer', ['drawerType', 'drawerFront', 'drawerBox']);
Feature.addRelations('PartitionSection', ['hasFrame', 'hasPanel']);
Feature.addRelations('Door', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('DoubleDoor', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('FalseFront', ['drawerType', 'edgeProfile']);
// console.log('objMap:', Feature.objMap);

class Cost {
  constructor(id, formula, options) {
    options = options || {};
    formula = formula || 0;
    const optionalPercentage = options.optionalPercentage;
    const demMutliplier = options.demMutliplier;
    let percentage = 100;
    const getMutliplier = (attr) => {
      if (options.demMutliplier !== undefined) {
        return options.demMutliplier;
      }
      return 'llwwdd';
    };
    this.calc = (assembly) => {
      let priceStr = formula.toLowerCase();
      for (let index = 0; index < 6; index += 1) {
        const char = priceStr[index];
        let multiplier;
        switch (char) {
          case 'l': value = assembly['length']; break;
          case 'w': value = assembly['width']; break;
          case 'd': value = assembly['depth']; break;
          default: value = 1;
        }
        priceStr.replace(new RegExp(`/${char}/`), assembly[value]);
      }
      try {
        const price = eval(priceStr)
        if (optionalPercentage) price*percentage;
        return price;
      } catch (e) {
        return -0.01;
      }
    }

    const cName = this.constructor.name;
    if (Cost.lists[cName] === undefined) Cost.lists[cName] = {};
    if (Cost.lists[cName][id] === undefined) Cost.lists[cName][id] = [];
    Cost.lists[cName][id].push(this);

  }
}
Cost.lists = {};
Cost.objMap = {}
Cost.get = (name) => {
  const obj = Cost.lists[id];
  if (obj === undefined) return null;
  return new obj.constructor();
}
Cost.addRelations = (type, id, name) => {
  names.forEach((name) => {
    if (objMap[id] === undefined) Cost.objMap[id] = {Labor: [], Material: []}
    if (type === Labor) Cost.objMap[id].Labor.push(Cost.get(name));
    if (type === Material) Cost.objMap[id].Material.push(Cost.get(name));
  });
}
class Labor extends Cost {
  constructor (id, formula, options) {
    super(id, formula, options)
  }
}
Labor.addRelations = (id, name) => Cost.addRelations(Labor, id, name);

class Material extends Cost {
  constructor (id, formula, options) {
    super(id, formula, options)
  }
}
Material.addRelations = (id, name) => Cost.addRelations(Material, id, name);

new Labor('Panel', '1+(0.05*l*w');
new Labor('Frame', '0.25');
new Labor('GlueFrame', '0.25');
new Labor('SandFrame', '0.05*l*l*w*w*d*d');
new Labor('SandPanel', '(0.25*l*w)/12');
new Labor('GlueMiter', '(0.25*l*l*w*w)');
new Labor('InstallBlumotionGuides', '2');
new Labor('InstallOtherGuides', '2');
new Labor('InstallFushHinges', '2');
new Labor('installOverLayHinges', '2');
new Labor('Paint', '(l*l*w*w*.1)/12');
new Labor('Stain', '(l*l*w*w*.25)/12');
new Labor('InstallDrawerFront', '2');
new Labor('InstallPullout', 10);

new Material('Wood');
new Material('Wood.SoftMapel', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Hickory', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Wood.Oak', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood');
new Material('Plywood.SoftMapel.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Hickory.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Oak.PaintGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.SoftMapel.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Hickory.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Plywood.Oak.StainGrade', '(l*w*d)*(.2)', {optionalPercentage: true});
new Material('Glass');
new Material('Glass.Flat', '(l*w*d)*.2', {optionalPercentage: true});
new Material('Glass.textured', '(l*w*d)*.2', {optionalPercentage: true});

class DrawerSection extends SpaceSection {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(sectionFilePath('drawer'), partCode, partName, originStr, demensionStr, rotationStr);
  }
}
new DrawerSection();

class Divider extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
    this.addSubAssembly(new Panel());
    this.addSubAssembly(new Frame());
  }
}

class DividerSection extends PartitionSection {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(sectionFilePath('divider'), partCode, partName, originStr, demensionStr, rotationStr);
  }
}
new DividerSection();

class DoorSection extends SpaceSection {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(sectionFilePath('door'), partCode, partName, originStr, demensionStr, rotationStr);
    this.addSubAssembly(new Door());
    this.addSubAssembly(new Drawer());
  }
}
new DoorSection();
// console.log(JSON.stringify(new DoorSection().features, null, 2))

class DualDoorSection extends SpaceSection {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(sectionFilePath('dual-door'), partCode, partName, originStr, demensionStr, rotationStr);
  }
}
new DualDoorSection();

class FalseFrontSection extends SpaceSection {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(sectionFilePath('false-front'), partCode, partName, originStr, demensionStr, rotationStr);
  }
}
new FalseFrontSection();

class FrameDivider extends Assembly {
  constructor (partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
  }
}

const divSet = {horizontal: [], vertical: []};
const getHorizontalDivSet = (id) => divSet.horizontal[id];
const getVerticalDivSet = (id) => divSet.vertical[id];
const setDivSet = (id, sizes) => {
  if (divSet[type][sizes.length] === undefined) divSet[type][sizes.length] = [];
  divSet[type][sizes.length] = sizes;
}
const setHorizontalDivSet = (id, sizes) => (id, sizes, 'horizontal');
const setVerticalDivSet = (id, sizes) => (id, sizes, 'vertical');

let dvs;

class DivideSection extends SpaceSection {
  constructor(sectionProperties, originStr, demensionStr, rotationStr) {
    super(sectionFilePath('open'), 'dvds', 'divideSection', originStr, demensionStr, rotationStr);
    this.parent = parent;
    dvs = dvs || this;
    this.vertical = true;
    this.sections = [];
    this.vPattern = 'Equal';
    this.hPattern = 'Equal';
    this.pattern = (pattern) => {
      if (pattern === undefined) return this.vertical ? this.vPattern : this.hPattern;
      if (this.vertical) this.vPattern = pattern;
      else this.hPattern = pattern;
    }
    this.measurments = [];
    this.dividerCount = () => (this.sections.length - 1) / 2
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical;
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection());
      }
    }
    this.calcSections = () => {
      const length = sectionProperties.length;
      const width = sectionProperties.width;
      const count = this.dividerCount() + 1;
      const patternFunc = DivisionPattern.patterns[this.pattern()].resolution;
      const answer = patternFunc(length, 0, this.value('vffs'), count);
      console.log(answer);
    }
    this.divide = (dividerCount) => {
      if (!Number.isNaN(dividerCount)) {
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount * 2 + 1);
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = 0; index < diff; index +=1) {
            this.sections.push(new DividerSection());
            this.sections.push(new DivideSection());
          }
        }
      }
    }
    this.size = () => {
      return {width: this.width, height: this.height};
    }
    this.sizes = () => {
      return 'val';
    }
  }
}

const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

const framedFrameWidth = 1.5;
const framelessFrameWidth = 3/4;
class Cabinet extends Assembly {
  constructor(partCode, partName, originStr, demensionStr, rotationStr) {
    super(partCode, partName, originStr, demensionStr, rotationStr);
    const instance = this;
    let frameWidth = framedFrameWidth;
    let toeKickHeight = 4;
    this.overlay = OVERLAY.HALF;
    this.type = CABINET_TYPE.FRAMED;
    const panels = 0;
    const framePieces = 0;
    const addFramePiece = (piece) => framePieces.push(piece);
    const framePieceCount = () => pieces.length;
    const addPanel = (panel) => panels.push(panel);
    const panelCount = () => panels.length;
    const opening = () => {
      const w = width - (frameWidth * 2);
      const h = height - toeKickHeight - (frameWidth * 2);
      return {width: w, height: h};
    }

    function drawerAreaOverlay() {
      const rrv = instance.value('rrv');
      const trv = instance.value('trv');
      const brv = instance.value('brv');
      const fs = instance.value('fs');
      const lrv = instance.value('lrv');
      let length = instance.length() - trv - brv + fs;
      let width = instance.width() - lrv - rrv + fs;
      const right = instance.getAssembly('rr').width() - rrv;
      const left = instance.getAssembly('lr').width() - lrv;
      const top = instance.getAssembly('tr').width() - trv;
      const bottom = instance.getAssembly('br').width() - brv;
      return {width, length, overlap: {right, left, top, bottom}};
    }

    function drawerAreaInset() {
      const topAndBottomRailWidth = getAssembly('tr').width() + getAssembly('br').width();
      const leftAndRightWidth = getAssembly('lr').width() + getAssembly('rr').width();
      let length = this.length() - topAndBottomRailWidth;
      let width = this.width() - leftAndRightWidth;
      return {width, length};
    }
    this.openingDemensions = () => {
      if (this.type === CABINET_TYPE.INSET) return drawerAreaInset();
      else return drawerAreaOverlay();
    }

    this.addSubAssemblies(new Divider('lr', 'Frame.Left',
                            '0,brh - w,0',
                            'c.l - (brh - w), frw, frt'),
                          new Panel('pl', 'Panel.Right',
                            '1/8, 0, rr.t',
                            'c.h,c.t - rr.t, pwt34',
                            'y'),
                          new Panel('pr', 'Panel.Left',
                            'c.w - 1/8 - t, 0, pl.z0',
                            'pl.l,pl.w, pwt34',
                            'y'),

                          new Panel('tkb', 'Panel.ToeKickBacker',
                            'pl.x1,0,3.5',
                            'pr.x0 - pl.x1, 3, tkbw',
                            'z'),

                          new Panel('pb', 'Panel.Back',
                            'pl.x1, tkb.w, c.t - t',
                            'c.l - tkb.w, pr.x0 - pl.x1, pbt'),

                          new Panel('pbt', 'Panel.Bottom',
                            'pl.x1, tkb.w, pl.z0',
                            'pr.x0 - pl.x1, pr.w - pwt12, pwt34',
                            'zx'),

                          new Divider('rr', 'Frame.Right',
                            'c.w - w,lr.y0,0',
                            'lr.l,frw,frt'),




                          new Divider('tr', 'Frame.Top',
                            'br.x0,c.l - w,0',
                            'br.l,frw,frt',
                            'z'),
                          new Divider('br', 'Frame.Bottom',
                            'rr.w,brh - w,0',
                            'rr.x0 - lr.x1,frw,frt',
                            'z'));


    this.addJoints(new Rabbet('pb->pr', 3/8),
                      new Rabbet('pb->pl', 3/8),
                      new Butt('pb->pbt'),

                      new Rabbet('pr->tkb', 3/8),
                      new Dado('pr->rr', 3/8),

                      new Rabbet('pl->tkb', 3/8),
                      new Dado('pl->tkb', 3/8),

                      new Dado('pbt->pr', 3/8),
                      new Dado('pbt->pl', 3/8),

                      new Dado('pbt->br', 3/8),
                      new Dado('pbt->rr', 3/8),
                      new Dado('pbt->lr', 3/8),

                      new Butt('tr->rr'),
                      new Butt('tr->lr'),
                      new Butt('br->rr'),
                      new Butt('br->lr'));
    this.opening = new DivideSection(this.openingDemensions());
  }
}

class Joint {
  constructor(joinStr) {
    const match = joinStr.match(Joint.regex);
    this.malePartCode = match[1];
    this.femalePartCode = match[2];

    this.getFemale = () => this.parentAssembly.getAssembly(this.femalePartCode);
    this.getMale = () => this.parentAssembly.getAssembly(this.malePartCode);

    this.maleOffset = () => 0;
    this.femaleOffset = () => 0;
    this.setParentAssembly = (pa) => this.parentAssembly = pa;

    this.getDemensions = () => {
      const malePos = getMale();
      const femalePos = getFemale();
      // I created a loop but it was harder to understand
      return undefined;
    }

    if (Joint.list[this.malePartCode] === undefined) Joint.list[this.malePartCode] = [];
    if (Joint.list[this.femalePartCode] === undefined) Joint.list[this.femalePartCode] = [];
    Joint.list[this.malePartCode].push(this);
    Joint.list[this.femalePartCode].push(this);
  }
}
Joint.list = {};
Joint.regex = /([a-z0-1\.]{1,})->([a-z0-1\.]{1,})/;

function eq(val1, val2, testName) {
  if (val1 !== val2) throw new Error(`${testName} Failed: Values not equal ${val1} !== ${val2}`);
}
function testJoints () {
  const obj1 = {length: 10, width: 2, thickness: .75};
  const obj2 = {length: 15, width: 2, thickness: .75};
  const axDir = (axis, dir) => ({axis, dir});
  const test = (p1, p2, wVal, tVal, testName) => {
    eq(Position.within(p1, p2), wVal, `${testName} - within`);
    if (tVal === null) {
      eq(Position.touching(p1,p2), null, `${testName} - touching`);
    } else {
      eq(Position.touching(p1,p2).axis, tVal.axis, `${testName} - touching:axis`);
      eq(Position.touching(p1,p2).direction, tVal.dir, `${testName} - touching:dir`);
    }
  }
  const pObj = (pStr, obj) => new Position(pStr).get(obj);

  test(pObj('@0,2,0', obj1), pObj('@0,2,0', obj2), true, null, 'Same Position');
  test(pObj('@-2,2,0', obj1), pObj('@0,2,0', obj2), true, axDir('x', '+'), 'Left X');
  test(pObj('@2,2,0', obj1), pObj('@0,2,0', obj2), true, axDir('x', '-'), 'Right X');
  test(pObj('@0,15,0', obj1), pObj('@0,0,0', obj2), true, axDir('y', '-'), 'Top Y');
  test(pObj('@0,-10,0', obj1), pObj('@0,0,0', obj2), true, axDir('y', '+'), 'Bottom Y');
  test(pObj('@0,0,-.75', obj1), pObj('@0,0,0', obj2), true, axDir('z', '+'), 'Front Z');
  test(pObj('@0,2,.75', obj1), pObj('@0,2,0', obj2), true, axDir('z', '-'), 'Back Z');
  test(pObj('@-3,2,0', obj1), pObj('@0,2,0', obj2), false, null, 'X Not Connected');
  test(pObj('@0,18,0', obj1), pObj('@0,2,0', obj2), false, null, 'Y Not Connected');
  test(pObj('@0,0,.76', obj1), pObj('@0,2,0', obj2), false, null, 'Z Not Connected');
}

class Dado extends Joint {
  constructor(joinStr, defaultDepth) {
    super(joinStr);
    this.maleOffset = (assembly) => {
      return defaultDepth;
    }
  }
}

class Rabbet extends Joint {
  constructor(joinStr, defaultDepth) {
    super(joinStr);
    this.maleOffset = (assembly) => {
      return defaultDepth;
    }
  }
}

class Butt extends Joint {
  constructor(joinStr) {
    super(joinStr);
  }
}

class Miter extends Butt {
  constructor(joinStr) {
    super(joinStr);
  }
}


// ----------------------------------  Display  ---------------------------//

function REGEX() {
  types = {};
  types.int = '^[0-9]{1,}$';
  types.float = `^((\\.[0-9]{1,})|([0-9]{1,}\\.[0-9]{1,}))$|(${types.int})`;
  types.fraction = '^[0-9]{1,}/[0-9]{1,}$';
  types.size = `(${types.float})|(${types.fraction})`;

  let obj = {};
  Object.keys(types).forEach((type) => obj[type] = new RegExp(types[type]));
  return obj;
}
REGEX = REGEX();

function createElement(tagname, attributes) {
  const elem = document.createElement(tagname);
  const keys = Object.keys(attributes);
  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
  return elem;
}

function up(selector, node) {
  if (node instanceof HTMLElement) {
    if (node.matches(selector)) {
      return node;
    } else {
      return up(selector, node.parentNode);
    }
  }
}

function down(selector, node) {
    function recurse (currNode, distance) {
      if (currNode.matches(selector)) {
        return { node: currNode, distance };
      } else {
        let found = { distance: Number.MAX_SAFE_INTEGER };
        for (let index = 0; index < currNode.children.length; index += 1) {
          distance++;
          const child = currNode.children[index];
          const maybe = recurse(child, distance);
          found = maybe && maybe.distance < found.distance ? maybe : found;
        }
        return found;
      }
    }
    return recurse(node, 0).node;
}

function closest(selector, node) {
  const visited = [];
  function recurse (currNode, distance) {
    let found = { distance: Number.MAX_SAFE_INTEGER };
    if (!currNode || (typeof currNode.matches) !== 'function') {
      return found;
    }
    visited.push(currNode);
    if (currNode.matches(selector)) {
      return { node: currNode, distance };
    } else {
      for (let index = 0; index < currNode.children.length; index += 1) {
        const child = currNode.children[index];
        if (visited.indexOf(child) === -1) {
          const maybe = recurse(child, distance + index + 1);
          found = maybe && maybe.distance < found.distance ? maybe : found;
        }
      }
      if (visited.indexOf(currNode.parentNode) === -1) {
        const maybe = recurse(currNode.parentNode, distance + 1);
        found = maybe && maybe.distance < found.distance ? maybe : found;
      }
      return found;
    }
  }

  return recurse(node, 0).node;
}


const selectors = {};
let matchRunIdCount = 0;
function getTargetId(target) {
  if((typeof target.getAttribute) === 'function') {
    let targetId = target.getAttribute('ce-match-run-id');
    if (targetId === null || targetId === undefined) {
      targetId = matchRunIdCount + '';
      target.setAttribute('ce-match-run-id', matchRunIdCount++)
    }
    return targetId;
  }
  return target === document ?
        '#document' : target === window ? '#window' : undefined;
}

function runMatch(event) {
  const  matchRunTargetId = getTargetId(event.currentTarget);
  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
  selectStrs.forEach((selectStr) => {
    const target = up(selectStr, event.target);
    if (target) {
      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target, event));
    }
  })
}

function matchRun(event, selector, func, target) {
  target = target || document;
  const  matchRunTargetId = getTargetId(target);
  if (selectors[matchRunTargetId] === undefined) {
    selectors[matchRunTargetId] = {};
  }
  if (selectors[matchRunTargetId][event] === undefined) {
    selectors[matchRunTargetId][event] = {};
    target.addEventListener(event, runMatch);
  }
  if (selectors[matchRunTargetId][event][selector] === undefined) {
    selectors[matchRunTargetId][event][selector] = [];
  }

  selectors[matchRunTargetId][event][selector].push(func);
}

class DivisionPattern {
  constructor() {
    this.patterns = {};
    const instance = this;
    this.filter = (dividerCount, selected) => {
      const sectionCount = dividerCount + 1;
      if (sectionCount < 2) return '';
      let filtered = '';
      let patternArr = Object.values(this.patterns);
      patternArr.forEach((pattern) => {
        if (pattern.restrictions === undefined || pattern.restrictions.indexOf(sectionCount) !== -1) {
          const name = pattern.name;
          filtered += `<option value='${name}' ${selected === name ? 'selected' : ''}>${name}</option>`;
        }
      });
      this.inputStr
      return filtered;
    }
    this.add = (name, resolution, inputarr, restrictions) => {
      inputarr = inputarr || [];
      let inputHtml = '';
      inputarr.forEach((label, index) => {
        const labelTag = `<label>${label}</label>`;
        const inputTag = `<input class='division-pattern-input' name='${name}' index='${index}'>`;
        inputHtml += labelTag + inputTag;
      });
      this.patterns[name] = {name, resolution, restrictions, inputHtml};
    }
    matchRun('change', '.open-pattern-select', (target) => {
      target.nextElementSibling.innerHTML = instance.patterns[target.value].inputHtml;
    });
    matchRun('keyup', '.division-pattern-input', (target) => {
      const name = target.getAttribute('name');
      const index = Number.parseInt(target.getAttribute('index'));
      const value = Number.parseFloat(target.value);
      const inputs = target.parentElement.querySelectorAll('.division-pattern-input');
      const pattern = instance.patterns[name];
      const sectionCount = Number.parseInt(target.parentElement.parentElement.children[1].value) + 1;

      //todo factor in divider length;
      const values = pattern.resolution(24, index, value, sectionCount).fill;
      for (let index = 0; index < values.length; index += 1){
        const value = values[index];
        if(value) inputs[index].value = value;
      }
    });
  }
}

matchRun('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
});

DivisionPattern = new DivisionPattern();

DivisionPattern.add('Unique',() => {

});

DivisionPattern.add('Equal', (length, index, value, sectionCount) => {
  const newVal = length / sectionCount;
  const list = new Array(sectionCount).fill(newVal);
  return {list};
});

DivisionPattern.add('1 to 2', (length, index, value, sectionCount) => {
  if (index === 0) {
    const twoValue = (length - value) / 2;
    const list = [value, twoValue, twoValue];
    const fill = [, twoValue];
    return {list, fill};
  } else {
    const oneValue = (length - (value * 2));
    const list = [oneValue, value, value];
    const fill = [oneValue];
    return {list, fill};
  }
}, ['first(1):', 'next(2)'], [3], [5.5]);

DivisionPattern.add('2 to 2', (length, index, value, sectionCount) => {
  const newValue = (length - (value * 2)) / 2;
  if (index === 0) {
    const list = [value, value, newValue, newValue];
    const fill = [, newValue];
    return {list, fill};
  } else {
    const list = [newValue, newValue, value, value];
    const fill = [newValue];
    return {list, fill};
  }
}, ['first(2):', 'next(2)'], [4]);

DivisionPattern.add('1 to 3', (length, index, value, sectionCount) => {
  if (index === 0) {
    const threeValue = (length - value) / 3;
    const list = [value, threeValue, threeValue, threeValue];
    const fill = [, threeValue];
    return {list, fill};
  } else {
    const oneValue = (length - (value * 3));
    const list = [oneValue, value, value, value];
    const fill = [oneValue];
    return {list, fill};
  }
}, ['first(1):', 'next(3)'], [4], 5.5);

// properties
//  required: {
//  getHeader: function returns html header string,
//  getBody: function returns html body string,
//}
//  optional: {
//  list: list to use, creates on undefined
//  getObject: function returns new list object default is generic js object,
//  parentSelector: cssSelector only reqired for refresh function,
//  listElemLable: nameOfElementType changes add button label,
//  hideAddBtn: defaults to false,
//  type: defaults to list,
//  selfCloseTab: defalts to true - allows clicking on header to close body,
//  findElement: used to find elemenents related to header - defaults to closest
//}
class ExpandableList {
  constructor(props) {
    props.list = props.list || [];
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  closest(selector, target));
    this.findElement = props.findElement;
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    props.id = ExpandableList.lists.length;
    this.id = () => props.id;
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    props.activeIndex = 0;
    ExpandableList.lists[props.id] = this;
    this.add = () => {
      props.list.push(props.getObject());
      this.refresh();
    };
    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (index) => {
      props.list.splice(index, 1);
      this.refresh();
    }
    this.refresh = (type) => {
      props.type = (typeof type) === 'string' ? type : props.type;
      if (!pendingRefresh) {
        pendingRefresh = true;
        setTimeout(() => {
          const parent = document.querySelector(props.parentSelector);
          const html = ExpandableList[`${props.type}Template`].render(props);
          if (parent && html !== undefined) parent.innerHTML = html;
          pendingRefresh = false;
        }, 100);
      }
    };
    this.activeIndex = (value) => value === undefined ? props.activeIndex : (props.activeIndex = value);
    this.value = (index) => (key, value) => {
      if (index === undefined) index = props.activeIndex;
      if (storage[index] === undefined) storage[index] = {};
      if (value === undefined) return storage[index][key];
      storage[index][key] = value;
    }
    this.set = (index, value) => props.list[index] = value;
    this.htmlBody = (index) => props.getBody(props.list[index], index);
    this.refresh();
  }
}
ExpandableList.lists = [];
ExpandableList.listTemplate = new $t('./public/html/planks/expandable-list.html');
ExpandableList.pillTemplate = new $t('./public/html/planks/expandable-pill.html');
ExpandableList.sidebarTemplate = new $t('./public/html/planks/expandable-sidebar.html');
ExpandableList.getIdAndIndex = (target) => {
  const cnt = up('.expand-header,.expand-body', target);
  const id = cnt.getAttribute('ex-list-id');
  const index = cnt.getAttribute('index');
  return {id, index};
}
ExpandableList.getValueFunc = (target) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].value(idIndex.index);
}

ExpandableList.set = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  ExpandableList.lists[idIndex.id].set(idIndex.index, value);
}

ExpandableList.value = (key, value, target) => {
  return ExpandableList.getValueFunc(target)(key, value);
}
matchRun('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  ExpandableList.lists[id].add();
});
matchRun('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const index = target.getAttribute('index');
  ExpandableList.lists[id].remove(index);
});
ExpandableList.closeAll = (header) => {
  const hello = 'world';
}

matchRun('click', '.expand-header', (target, event) => {
  const isActive = target.matches('.active');
  const id = target.getAttribute('ex-list-id');
  const list = ExpandableList.lists[id];
  if (isActive && event.target === target) {
    target.className = target.className.replace(/(^| )active( |$)/g, '');
    list.findElement('.expand-body', target).style.display = 'none';
    list.activeIndex(null);
    target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
  } else {
    const headers = up('.expandable-list', target).querySelectorAll('.expand-header');
    const bodys = up('.expandable-list', target).querySelectorAll('.expand-body');
    const rmBtns = up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
    headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
    bodys.forEach((body) => body.style.display = 'none');
    rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
    const body = list.findElement('.expand-body', target);
    body.style.display = 'block';
    const index = target.getAttribute('index');
    list.activeIndex(index);
    body.innerHTML = list.htmlBody(index);
    target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
    target.className += ' active';
  }
});

class Show {
  constructor(name) {
    this.name = name;
    Show.types[name] = this;
  }
}
Show.types = {};
Show.listTypes = () => Object.values(Show.types);
new Show('None');
new Show('Flat');
new Show('Inset Panel');

const OpenSectionDisplay = {};
OpenSectionDisplay.html = (opening, list, sections) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  opening.init();
  OpenSectionDisplay.sections[opening.uniqueId] = opening;
  const patterns = DivisionPattern.filter(opening.dividerCount(), opening.pattern());
  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
  bindField(`#${selectPatternId}`, (g, p) => opening.pattern(p), /.*/)
  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
  const storage = {};
  return OpenSectionDisplay.template.render({opening, openDispId, patterns, selectPatternId, storage, list, sections});
}

OpenSectionDisplay.getSelectId = (opening) => `opin-division-patturn-select-${opening.uniqueId}`;
OpenSectionDisplay.template = new $t('./public/html/planks/opening.html');
OpenSectionDisplay.listBodyTemplate = new $t('./public/html/planks/opening-list-body.html');
OpenSectionDisplay.listHeadTemplate = new $t('./public/html/planks/opening-list-head.html');
OpenSectionDisplay.sections = {};
OpenSectionDisplay.lists = {};
OpenSectionDisplay.getId = (opening) => `open-section-display-${opening.uniqueId}`;

OpenSectionDisplay.getList = (root) => {
  let openId = root.uniqueId;
  if (OpenSectionDisplay.lists[openId]) return OpenSectionDisplay.lists[openId];
  const sections = Object.values(Section.sections);
  const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
  const list = root.sections;
  const hideAddBtn = true;
  const selfCloseTab = true;
  let exList;
  const getHeader = (opening, index) => {
    const sections = index % 2 === 0 ? Section.getSections(false) : [];
    return OpenSectionDisplay.listHeadTemplate.render({opening, sections});
  }
  const getBody = (opening) => {
    const list = OpenSectionDisplay.getList(root);
    const getFeatureDisplay = (assem) => new FeatureDisplay(assem).html();
    const assemblies = opening.getSubAssemblies();
    return Section.render(opening, {assemblies, getFeatureDisplay, opening, list, sections});
  }
  const findElement = (selector, target) => down(selector, up('.expandable-list', target));
  const expListProps = {
    parentSelector, getHeader, getBody, getObject, list, hideAddBtn,
    selfCloseTab, findElement
  }
  exList = new ExpandableList(expListProps);
  OpenSectionDisplay.lists[openId] = exList;
  return exList;
}

OpenSectionDisplay.refresh = (opening) => {
  const orientations = document.querySelectorAll(`[name="orientation-${opening.uniqueId}"]`);
  const orientParent = orientations[0].parentElement;
  if (opening.isVertical() === true) {
    orientations[1].checked = true;
    orientParent.style.display = 'inline-block';
  } else if (opening.isVertical() === false) {
    orientations[0].checked = true;
    orientParent.style.display = 'inline-block';
  } else {
    orientParent.style.display = 'none';
  }
  const id = OpenSectionDisplay.getId(opening);
  const target = document.getElementById(id);
  const type = opening.isVertical() === true ? 'pill' : 'sidebar';
  OpenSectionDisplay.getList(opening).refresh(type);
  const select = document.getElementById(OpenSectionDisplay.getSelectId(opening));
  if (opening.dividerCount() < 1) select.style.display = 'none';
  else {
    select.style.display = 'inline-block';
    select.innerHTML = DivisionPattern.filter(opening.dividerCount(), opening.pattern());
  }
}
OpenSectionDisplay.onChange = (target) => {
  const id = target.getAttribute('opening-id');
  const value = Number.parseInt(target.value);
  const opening = OpenSectionDisplay.sections[id];
  opening.divide(value);
  OpenSectionDisplay.refresh(opening);
  target.focus();
};

OpenSectionDisplay.onOrientation = (target) => {
  const openId = target.getAttribute('open-id');
  const value = target.value;
  const opening = OpenSectionDisplay.sections[openId];
  opening.vertical =  value === 'vertical';
  OpenSectionDisplay.refresh(opening);
};

OpenSectionDisplay.onSectionChange = (target) => {
  ExpandableList.value('selected', target.value, target);
  ExpandableList.set(target, Section.new(target.value));
}

matchRun('keyup', '.open-division-input', OpenSectionDisplay.onChange);
matchRun('click', '.open-division-input', OpenSectionDisplay.onChange);
matchRun('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
matchRun('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)

class CabinetDisplay {
  constructor(parentSelector) {
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      new ThreeDModel(cabinet);
      return CabinetDisplay.bodyTemplate.render({$index, cabinet, showTypes, OpenSectionDisplay});
    }
    const getObject = () => new Cabinet('c', 'Cabinet');
    const expListProps = {
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Cabinet'
    };
    new ExpandableList(expListProps);
    const valueUpdate = (path, value) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      expListProps.list[index].value(key, value);
    }

    bindField('.cabinet-input', valueUpdate, REGEX.size)
  }
}
CabinetDisplay.bodyTemplate = new $t('./public/html/planks/cabinet-body.html');
CabinetDisplay.headTemplate = new $t('./public/html/planks/cabinet-head.html');

function bindField(selector, objOrFunc, validationRegex) {
  function update(elem) {
    const updatePath = elem.getAttribute('prop-update');
    if (updatePath !== null) {
      const newValue = elem.value;
      if (newValue.match(validationRegex) === null) {
        console.error('badValue')
      } else if ((typeof objOrFunc) === 'function') {
        objOrFunc(updatePath, elem.value);
      } else {
        const attrs = updatePath.split('.');
        const lastIndex = attrs.length - 1;
        let currObj = objOrFunc;
        for (let index = 0; index < lastIndex; index += 1) {
          let attr = attrs[index];
          if (currObj[attr] === undefined) currObj[attr] = {};
          currObj = currObj[attr];
        }
        currObj[attrs[lastIndex]] = elem.value;
      }
    }
  }
  matchRun('keyup', selector, update);
  matchRun('change', selector, update);
}

class FeatureDisplay {
  constructor(assembly, parentSelector) {
    this.html = () => FeatureDisplay.template.render({features: assembly.features, id: 'root'});
    this.refresh = () => {
      const container = document.querySelector(parentSelector);
      container.innerHTML = this.html;
    }
  }
}
FeatureDisplay.template = new $t('./public/html/planks/features.html');


function pull(length, height) {
  var rspx = length - .75;
  var rCyl = CSG.cylinder({start: [rspx, .125, .125-height], end: [rspx, .125, .125], radius: .25})
  var lCyl = CSG.cylinder({start: [.75, .125, .125 - height], end: [.75, .125, .125], radius: .25})
  var mainCyl = CSG.cylinder({start: [0, .125, .125], end: [length, .125, .125], radius: .25})
  return mainCyl.union(lCyl).union(rCyl);
}

class ThreeDModel {
  constructor(assem) {
    const radius = [assem.width(), assem.length(), assem.thickness()];
    const a = CSG.cube({ center: assem.center, radius });
    a.setColor(1, 0, 0);
    ThreeDModel.viewer.mesh = a.toMesh();
    ThreeDModel.viewer.gl.ondraw();
  }
}
ThreeDModel.init = () => {
  ThreeDModel.viewer = new Viewer(pull(5,2), 300, 150, 50);
  addViewer(ThreeDModel.viewer, 'three-d-model');
}

function threeDModeling() {
  var viewer;
  // Test simple cases
  var a = CSG.cube({ center: [-0.25, -0.25, -0.25], radius: [2,5,.75] });
  var b = CSG.sphere({ radius: 1.3, center: [0.25, 0.25, 0.25] });

  // c = rectangle(15,3,2);
  // c = c.subtract(rectangle(1,3,1));
  let c = pull(4, 1);
  a.setColor(1, 0, 0);
  b.setColor(0, 0, 1);
  c.setColor(0, 0, 0);
  var operations = [
    a,
    c,
    a.union(b),
    a.subtract(b),
    a.intersect(b)
  ];
  viewer = new Viewer(operations[1], 300, 150, 20);
  addViewer(viewer, 'three-d-model');
}



window.onload = () => {
  const dummyText = (prefix) => (item, index) => `${prefix} ${index}`;
  const cabinetDisplay = new CabinetDisplay('#add-cabinet-cnt');
  ThreeDModel.init();
};
