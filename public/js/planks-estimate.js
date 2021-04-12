
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
  frw: {name: 'Frame Rail Width', value: 1.5},
  frorr: {name: 'Frame Rail Outside Reveal Right', value: 1 / 8},
  frorl: {name: 'Frame Rail Outside Reveal Left', value: 1 / 8},
  frt: {name: 'Frame Rail Thickness', value: 3/4},
  tkbw: {name: 'Toe Kick Backer Width', value: 1/2},
  tkd: {name: 'Toe Kick Depth', value: 3},
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
    let lastEvaluation;
    const savedRefs = {};
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
      let evaluate = false;
      const references = retStr.match(Expression.refRegex) || [];
      const currDate = new Date().getTime();
      if (!lastEvaluation || lastEvaluation + 200 < currDate) {
        lastEvaluation = currDate;
        evaluate = true;
      }
      references.forEach((ref) => {
        const match = ref.match(Expression.breakdownReg);
        const objTypeId = match[4];
        const attr = match[5];
        const cleanRef = `${objTypeId}.${attr}`;
        let value;
        if (evaluate) {
          value = this.getValue(objTypeId, attr);
          // console.log(ref, value)
          savedRefs[cleanRef] = value;
        } else {
          value = savedRefs[cleanRef];
        }
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
  constructor(assembly) {
    const defSizes = getDefaultSize(assembly);
    const centerExpressions = () => Position.parseExpressions(assembly, assembly.centerStr(), '0,0,0');

    const demExpressions = () => Position.parseExpressions(assembly, assembly.demensionStr(),
      `${defSizes.width},${defSizes.length},${defSizes.thickness}`,
      '0,0,0');

    this.demension = (attr) => (attr === undefined ?
                          {x: demExpressions().x.eval(),
                          y: demExpressions().y.eval(),
                          z: demExpressions().z.eval()}
                          : demExpressions()[attr].eval());
    this.center = (attr) => (attr === undefined ?
                            {x: centerExpressions().x.eval(),
                            y: centerExpressions().y.eval(),
                            z: centerExpressions().z.eval()}
                            : centerExpressions()[attr].eval());
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


    this.rotation = () => {
      const rotation = {x: 0, y: 0, z: 0};
      const axisStrs = (assembly.rotationStr() || '').match(Position.rotateStrRegex);
      for (let index = 0; axisStrs && index < axisStrs.length; index += 1) {
        const match = axisStrs[index].match(Position.axisStrRegex);
        rotation[match[2]] = match[4] ? Number.parseInt[match[4]] : 90;
      }
      return rotation;
    };

    this.setDemension = (type, value) => {
      if (value !== undefined)
        demExpressions()[type] = new Expression(assembly, value, assembly.getAssembly,
            Assembly.resolveAttr);
      try {
        return demExpressions()[type].eval();
      } catch (e) {
        console.error(`Failed to evaluate '${demExpressions()[type].str()}'`);
        return NaN;
      }
    }

    const setCenter = (type, value) => {
      if (value !== undefined)
        centerExpressions()[type] = new Expression(this, value, this.getAssembly,
            Assembly.resolveAttr);
      return centerExpressions()[type].eval();
    }
  }
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

Position.parseExpressions = function(assembly) {
  const coordinates = Position.parseCoordinates.apply(null, Array.from(arguments).slice(1));
  let expressions = Expression.list(assembly, assembly.getAssembly,
    Assembly.resolveAttr, coordinates.x, coordinates.y, coordinates.z);
  return {x: expressions[0], y: expressions[1], z: expressions[2]}
};

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


Position.rotatePoint = function (point, degreestheta, radius)
{
  theta = degreestheta * Math.PI/180;
  let p = point;
  let r = radius;
   let q = {x: 0.0, y: 0.0, z: 0.0};
   let costheta,sintheta;

   const Normalise = (obj, attr) => obj[attr] *= obj[attr] > 0 ? 1 : -1;
   Normalise(r, 'x',);
   Normalise(r, 'y',);
   Normalise(r, 'z',);

   costheta = Math.cos(theta);
   sintheta = Math.sin(theta);

   q.x += (costheta + (1 - costheta) * r.x * r.x) * p.x;
   q.x += ((1 - costheta) * r.x * r.y - r.z * sintheta) * p.y;
   q.x += ((1 - costheta) * r.x * r.z + r.y * sintheta) * p.z;

   q.y += ((1 - costheta) * r.x * r.y + r.z * sintheta) * p.x;
   q.y += (costheta + (1 - costheta) * r.y * r.y) * p.y;
   q.y += ((1 - costheta) * r.y * r.z - r.x * sintheta) * p.z;

   q.z += ((1 - costheta) * r.x * r.z - r.y * sintheta) * p.x;
   q.z += ((1 - costheta) * r.y * r.z + r.x * sintheta) * p.y;
   q.z += (costheta + (1 - costheta) * r.z * r.z) * p.z;

   return(q);
}

function setterGetter () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 1) {
    const attr = arguments[index];
    this[attr] = (value) => {
      if (value === undefined) return attrs[attr];
      attrs[attr] = value;
    }
  }
}

function funcOvalue () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 2) {
    const attr = arguments[index];
    const funcOval = arguments[index + 1];
    if ((typeof funcOval) === 'function') this[attr] = funcOval;
    else this[attr] = () => funcOval;
  }
}

class Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    this.display = true;
    this.part = true;
    this.included = true;
    funcOvalue.apply(this, ['centerStr', centerStr, 'demensionStr',  demensionStr, 'rotationStr', rotationStr]);
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
    this.parent = () => parentAssembly;
    const position = new Position(this);
    this.position = () => position;
    this.partCode = partCode;
    this.partName = partName;
    this.joints = [];
    this.values = {};
    this.fullDem = () => {
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
    const funcAttrs = ['length', 'width', 'thickness'];
    this.value = (code, value, expression) => {
      if (code.match(new RegExp(funcAttrs.join('|')))) {
        this[code](value);
      } else {
        if (value !== undefined) {
          if (expression) {
            this.values[code] = new Expression(this, value, this.getAssembly,
                Assembly.resolveAttr);
          } else {
            this.values[code] = value;
          }
        } else {
          const instVal = this.values[code];
          if (instVal !== undefined && instVal !== null) {
            if (instVal instanceof Expression) {
              return instVal.eval();
            }
            return instVal;
          }
          if (this.parentAssembly) return this.parentAssembly.value(code);
          else {
            try {
              return CONSTANTS[code].value;
            } catch (e) {
              console.error(`Failed to resolve code: ${code}`);
              return NaN;
            }
          }
        }
      }
    }
    this.jointOffsets = () => {
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
    this.getParts = () => {
      return this.getSubAssemblies().filter((a) => a.part && a.included );
    }
    this.uniqueId = randomString(32);
    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }
    Assembly.add(this);

    this.width = (value) => position.setDemension('x', value);
    this.length = (value) => position.setDemension('y', value);
    this.thickness = (value) => position.setDemension('z', value);
  }
}

Assembly.list = {};
Assembly.get = (uniqueId) => {
  const keys = Object.keys(Assembly.list);
  for (let index = 0; index < keys.length; index += 1) {
    const assembly = Assembly.list[keys[index]][uniqueId];
    if (assembly !== undefined) return assembly;
  }
  return null;
}
Assembly.add = (assembly) => {
  const name = assembly.constructor.name;
  if (Assembly.list[name] === undefined) Assembly.list[name] = {};
  Assembly.list[name][assembly.uniqueId] = assembly;
}
Assembly.all = () => {
  const list = [];
  const keys = Object.keys(Assembly.list);
  keys.forEach((key) => list.concat(Object.values(Assembly.list[key])));
  return list;
}
Assembly.resolveAttr = (assembly, attr) => {
  if (attr === 'length' || attr === 'height' || attr === 'h' || attr === 'l') {
    return assembly.length();
  } else if (attr === 'w' || attr === 'width') {
    return assembly.width();
  } else if (attr === 'depth' || attr === 'thickness' || attr === 'd' || attr === 't') {
    return assembly.thickness();
  }
  return assembly.value(attr);
}
Assembly.lists = {};
Assembly.idCounters = {};

class Section extends Assembly {
  constructor(templatePath, isPartition, partCode, partName, sectionProperties) {
    super(templatePath, isPartition, partCode, partName);
    this.centerStr = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = leftPos.center('x') + ((rightPos.center('x') - leftPos.center('x')));
      const y = botPos.center('y') + ((topPos.center('y') - botPos.center('y')) / 2);
      const z = topPos.center('z');
      return `${x},${y},${z}`;
    }

    this.outerSize = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = leftPos.center('x') - rightPos.center('x');
      const y = topPos.center('y') - botPos.center('y');
      const z = topPos.center('z');
      return {x,y,z};
    }

    this.innerSize = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = leftPos.center('x') + leftPos.limits('-x') - (rightPos.center('x') + rightPos.limits('-x'));
      const y = topPos.center('y') + topPos.limits('-x') - ((botPos.center('y') + botPos.limits('+x')));
      const z = topPos.center('z');
      return {x,y,z};
    }

    this.rotationStr = () => sectionProperties().rotationFunc();

    this.isPartition = () => isPartition;
    if (templatePath === undefined) {
      throw new Error('template path must be defined');
    }
    this.constructorId = this.constructor.name;
    this.part = false;
    this.display = false;
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
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

class Door extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.addSubAssembly(new Pull());
  }
}

class Panel extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

class Frame extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

class Drawer extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

class PartitionSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, true, partCode, partName, sectionProperties);
  }
}

class SpaceSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, false, partCode, partName, sectionProperties);
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
      return 'llwwdd'; };
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
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(sectionFilePath('drawer'), partCode, partName, centerStr, demensionStr, rotationStr);
  }
}
new DrawerSection();

class Divider extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);

    // const panelCenterFunc = () => {return '0,0,0'};
    // const panelDemFunc = () => {return '0,0,0'};
    // const panelRotFunc = () => {return '0,0,0'};
    //
    // const frameCenterFunc = () => {return '-2,-2,-2'};
    // const frameDemFunc = () => {return '4,5,1'};
    // const frameRotFunc = () => {return ''};
    //
    //
    // this.addSubAssembly(new Panel(`dp-${++Divider.count}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc));
    // this.addSubAssembly(new Frame(`df-${Divider.count}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc));
    //
  }
}
Divider.count = 0;

class DividerSection extends PartitionSection {
  constructor(partCode, sectionProperties) {
    super(sectionFilePath('divider'), partCode, 'Divider', sectionProperties);
    if (sectionProperties === undefined) return;
    const props = sectionProperties;
    const instance = this;
    this.centerStr = () => {
      const center = props().center;
      return `${center.x},${center.y},${center.z}`
    };
    this.demensionStr = () => `frw, ${props().dividerLength / 2}, frt`;
    const panelCenterFunc = () => {return '0,0,0'};
    const panelDemFunc = () => {return '0,0,0'};
    const panelRotFunc = () => {return '0,0,0'};

    const frameCenterFunc = () => {
      const x = sectionProperties().center.x;
      const y = sectionProperties().center.y;
      const z = sectionProperties().center.z;
      return `${x},${y},${z}`;
    };
    const frameDemFunc = () => {
      const y = sectionProperties().dividerLength;
      return `frw,${y},frt`;
    };
    const frameRotFunc = () => sectionProperties().rotationFunc();


    this.addSubAssembly(new Panel(`dp-${Divider.count}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc));
    this.addSubAssembly(new Frame(`df-${Divider.count}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc));
  }
}
new DividerSection();

class DoorSection extends SpaceSection {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(sectionFilePath('door'), partCode, partName, centerStr, demensionStr, rotationStr);
    this.addSubAssembly(new Door());
    this.addSubAssembly(new Drawer());
  }
}
new DoorSection();
// console.log(JSON.stringify(new DoorSection().features, null, 2))

class DualDoorSection extends SpaceSection {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(sectionFilePath('dual-door'), partCode, partName, centerStr, demensionStr, rotationStr);
  }
}
new DualDoorSection();

class FalseFrontSection extends SpaceSection {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(sectionFilePath('false-front'), partCode, partName, centerStr, demensionStr, rotationStr);
  }
}
new FalseFrontSection();

class FrameDivider extends Assembly {
  constructor (partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
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
  constructor(sectionProperties) {
    super(sectionFilePath('open'), 'dvds', 'divideSection', sectionProperties);
    dvs = dvs || this;
    this.vertical = true;
    this.sections = [];
    this.vPattern = {name: 'Equal'};
    this.hPattern = {name: 'Equal'};
    this.pattern = (name, index, value) => {
      if (name === undefined) return this.vertical ? this.vPattern : this.hPattern;
      if (this.vertical) this.vPattern = {name, index, value};
      else this.hPattern = {name, index, value};
    }
    this.measurments = [];
    this.dividerCount = () => (this.sections.length - 1) / 2
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical;
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection(this.borders(0)));
        this.sections[0].setParentAssembly(this);
      }
    }
    const parentGetSubAssemblies = this.getSubAssemblies;
    this.getSubAssemblies = () => {
      let assemblies = parentGetSubAssemblies().concat(this.sections);
      this.sections.forEach((assem) => assemblies = assemblies.concat(assem.getSubAssemblies()));
      return assemblies;
    }
    this.borders = (index) => {
      return () => {
        const props = sectionProperties();

        let top = props.borders.top;
        let bottom = props.borders.bottom;
        let left = props.borders.left;
        let right = props.borders.right;
        if (this.vertical) {
          if (index !== 0) {
            left = this.sections[index - 1];
          } if (index !== this.sections.length - 1) {
            right = this.sections[index + 1];
          }
        } else {
          if (index !== 0) {
            top = this.sections[index - 1];
          } if (index !== this.sections.length - 1) {
            bottom = this.sections[index + 1];
          }
        }

        const depth = props.depth;
        return {borders: {top, bottom, right, left}, depth};
      }
    }
    this.dividerProps = (index) => {
      return () => {
        const answer = this.calcSections().list;
        let offset = 0;
        for (let i = 0; i < index + 1; i += 1) offset += answer[i];
        let props = sectionProperties();
        const pos = this.position();
        const innerSize = this.innerSize();
        let center = pos.center();
        let dividerLength;
        if (this.vertical) {
          center.x += offset;
          dividerLength = innerSize.y;
        } else {
          center.y += offset;
          dividerLength = innerSize.x;
        }
        const rotationFunc = () =>  this.vertical ? '' : 'z';

        return {center, dividerLength, rotationFunc};
      }
    }
    this.calcSections = (pattern, index, value) => {
      if (pattern && (typeof pattern.name) === 'string' && typeof(index + value) === 'number') {
        this.pattern(pattern.name, index, value);
      } else {
        pattern = DivisionPattern.patterns[this.pattern().name];
      }

      const config = this.pattern();
      const props = sectionProperties();
      const distance = this.vertical ? this.outerSize().x : this.outerSize().y;
      const count = this.dividerCount() + 1;
      const answer = pattern.resolution(distance, config.index, config.value, count);
      config.fill = answer.fill;
      return answer;
    }
    this.divide = (dividerCount) => {
      if (!Number.isNaN(dividerCount)) {
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount * 2 + 1);
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            this.sections.push(new DividerSection(`dv${index}`, this.dividerProps(index)));
            this.sections[index].setParentAssembly(this);
            this.sections.push(new DivideSection(this.borders(index + 1)));
            this.sections[index + 1].setParentAssembly(this);
            console.log(index, ':',this.dividerProps(index)())
          }
          return diff !== 0;
        }
      }
      return false;
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
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    const instance = this;
    let frameWidth = framedFrameWidth;
    let toeKickHeight = 4;
    this.part = false;
    this.display = false;
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

    this.borders = () => {
      const right = instance.getAssembly('rr');
      const left = instance.getAssembly('lr');
      const top = instance.getAssembly('tr');
      const bottom = instance.getAssembly('br');
      const pb = instance.getAssembly('pb');
      const depth = pb.position().limits('-z') - right.position().limits('-z');
      return {borders: {top, bottom, right, left}, depth};
    }

    this.value('brh', 'tkb.w + pb.t + brr - br.w', true);
    this.value('stl', '(frorl + pl.t)', true);
    this.value('str', '(frorr + pr.t)', true);
    this.value('st', '(str + stl)', true);
    this.addSubAssemblies(

                          new Panel('tkb', 'Panel.ToeKickBacker',
                            'pl.t + frorl + (l / 2), w / 2, tkd + (t / 2)',
                            'tkh, c.w - st, tkbw',
                            'z'),



                          new Divider('rr', 'Frame.Right',
                            'w / 2,brh + (l / 2), t / 2',
                            'frw, c.l - brh, frt'),
                          new Divider('lr', 'Frame.Left',
                            'c.w - (w / 2),brh + (l / 2), t / 2',
                            'frw, c.l - brh, frt'),
                          new Divider('br', 'Frame.Bottom',
                            'lr.w + (l / 2),brh + (w / 2), t / 2',
                            'frw,c.w - lr.w - rr.w,frt',
                            'z'),



                          new Divider('tr', 'Frame.Top',
                            'lr.w + (l / 2), c.l - (w/2),t / 2',
                            'frw,br.l,frt',
                            'z'),




                          new Panel('pl', 'Panel.Left',
                            'c.w - frorl - (t / 2),l / 2,(w / 2) + lr.t',
                            'c.t - lr.t,c.l,pwt34',
                            'y'),
                          new Panel('pr', 'Panel.Right',
                            'frorr + (t / 2), l / 2, (w/2) + rr.t',
                            'c.t - lr.t,c.l,pwt34',
                            'y'),



                          new Panel('pb', 'Panel.Back',
                            'l / 2 + stl, (w / 2) + tkb.w, c.t - (t / 2)',
                            'c.l - tkb.w, c.w - st, pwt34',
                            'z'),

                          new Panel('pbt', 'Panel.Bottom',
                            '(l / 2) + stl, brh + br.w - (t / 2) - brr,br.t + (w / 2)',
                            'c.t - br.t - pb.t,c.w - st,pwt34',
                            'yx'));


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
    this.opening = new DivideSection(this.borders);
    this.addSubAssembly(this.opening);
    this.borders();
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
      if (node instanceof HTMLElement) {
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
      return { distance: Number.MAX_SAFE_INTEGER };
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

const stateReg = /( |^)(small|large)( |$)/;
matchRun('click', '#max-min-btn', (target) => {
  const className = target.parentElement.className;
  const state = className.match(stateReg);
  const clean = className.replace(new RegExp(stateReg, 'g'), '').trim();
  if (state[2] === 'small') {
    target.parentElement.className = `${clean} large`;
  } else {
    target.parentElement.className = `${clean} small`;
  }
});

function updateDivisions (target) {
  const name = target.getAttribute('name');
  const index = Number.parseInt(target.getAttribute('index'));
  const value = Number.parseFloat(target.value);
  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
  const pattern = DivisionPattern.patterns[name];
  const uniqueId = up('.opening-cnt', target).getAttribute('opening-id');
  const values = Assembly.get(uniqueId).calcSections(pattern, index, value).fill;
  for (let index = 0; values && index < inputs.length; index += 1){
    const value = values[index];
    if(value) inputs[index].value = value;
  }
  console.log('updating')
}

matchRun('change', '.open-orientation-radio,.open-division-input', updateDivisions);

class DivisionPattern {
  constructor() {
    this.patterns = {};
    const instance = this;
    this.filter = (dividerCount, config) => {
      const sectionCount = dividerCount + 1;
      if (sectionCount < 2) return '';
      let filtered = '';
      let patternArr = Object.values(this.patterns);
      patternArr.forEach((pattern) => {
        if (pattern.restrictions === undefined || pattern.restrictions.indexOf(sectionCount) !== -1) {
          const name = pattern.name;
          filtered += `<option value='${name}' ${config.name === name ? 'selected' : ''}>${name}</option>`;
        }
      });
      this.inputStr
      return filtered;
    }
    this.add = (name, resolution, inputArr, restrictions) => {
      inputArr = inputArr || [];
      let inputHtml =  (fill) => {
        let html = '';
        inputArr.forEach((label, index) => {
          const value = fill ? fill[index] : '';
          const labelTag = ``;
          const inputTag = ``;
          html += labelTag + inputTag;
        });
        return html;
      }
      this.patterns[name] = {name, resolution, restrictions, inputHtml, inputArr};
    }

    matchRun('change', '.open-pattern-select', (target) => {
      const openingId = up('.opening-cnt', target).getAttribute('opening-id');
      const opening = OpenSectionDisplay.sections[openingId];
      OpenSectionDisplay.refresh(opening);
    });

    matchRun('keyup', '.division-pattern-input', updateDivisions);
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
    const fill = [value, twoValue];
    return {list, fill};
  } else {
    const oneValue = (length - (value * 2));
    const list = [oneValue, value, value];
    const fill = [oneValue, value];
    return {list, fill};
  }
}, ['first(1):', 'next(2)'], [3], [5.5]);

DivisionPattern.add('2 to 2', (length, index, value, sectionCount) => {
  const newValue = (length - (value * 2)) / 2;
  if (index === 0) {
    const list = [value, value, newValue, newValue];
    const fill = [value, newValue];
    return {list, fill};
  } else {
    const list = [newValue, newValue, value, value];
    const fill = [newValue, value];
    return {list, fill};
  }
}, ['first(2):', 'next(2)'], [4]);

DivisionPattern.add('1 to 3', (length, index, value, sectionCount) => {
  if (index === 0) {
    const threeValue = (length - value) / 3;
    const list = [value, threeValue, threeValue, threeValue];
    const fill = [value, threeValue];
    return {list, fill};
  } else {
    const oneValue = (length - (value * 3));
    const list = [oneValue, value, value, value];
    const fill = [oneValue, value];
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

OpenSectionDisplay.html = (opening) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  opening.init();
  OpenSectionDisplay.sections[opening.uniqueId] = opening;
  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
  return OpenSectionDisplay.template.render({opening, openDispId});
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
OpenSectionDisplay.dividerControlTemplate = new $t('./public/html/planks/divider-controls.html');
OpenSectionDisplay.updateDividers = (opening) => {
  const selector = `[opening-id="${opening.uniqueId}"].opening-cnt > .divider-controls`;
  const dividerControlsCnt = document.querySelector(selector);
  const patterns = DivisionPattern.filter(opening.dividerCount(), opening.pattern());
  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
  bindField(`#${selectPatternId}`, (g, p) => opening.pattern(p), /.*/);
  const patternConfig = opening.pattern();
  const pattern = DivisionPattern.patterns[patternConfig.name];
  const fill = patternConfig.fill;
  dividerControlsCnt.innerHTML = OpenSectionDisplay.dividerControlTemplate.render(
          {opening, fill, pattern, selectPatternId, patterns});
}

OpenSectionDisplay.changeId = 0;
OpenSectionDisplay.refresh = (opening) => {
  const changeId = ++OpenSectionDisplay.changeId;
  setTimeout(()=> {
    if (changeId === OpenSectionDisplay.changeId) {
      const id = OpenSectionDisplay.getId(opening);
      const target = document.getElementById(id);
      const listCnt = up('.expandable-list', target);
      const listId = Number.parseInt(listCnt.getAttribute('ex-list-id'));

      const type = opening.isVertical() === true ? 'pill' : 'sidebar';
      OpenSectionDisplay.updateDividers(opening);
      OpenSectionDisplay.getList(opening).refresh(type);
      const dividerSelector = `[opening-id='${opening.uniqueId}'].division-count-input`;
      listCnt.querySelector(dividerSelector).focus();
    }
  }, 500);
}

OpenSectionDisplay.onChange = (target) => {
  const id = target.getAttribute('opening-id');
  const value = Number.parseInt(target.value);
  const opening = OpenSectionDisplay.sections[id];
  if (opening.divide(value)) {
    OpenSectionDisplay.refresh(opening);
    target.focus();
  }
  const cabinet = opening.getAssembly('c');
  new ThreeDModel(cabinet.getParts());
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

matchRun('keyup', '.division-count-input', OpenSectionDisplay.onChange);
matchRun('click', '.division-count-input', OpenSectionDisplay.onChange);
matchRun('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
matchRun('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)

class CabinetDisplay {
  constructor(parentSelector) {
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      new ThreeDModel(cabinet.getParts());
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
      const cabinet = expListProps.list[index];
      cabinet.value(key, value);
      new ThreeDModel(cabinet.getParts());
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

function drawerBox(length, width, depth) {
  const bottomHeight = 7/8;
  const box = CSG.cube({demensions: [width, length, depth], center: [0,0,0]});
  box.setColor(1, 0, 0);
  const inside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, bottomHeight, 0]});
  inside.setColor(0, 0, 1);
  const bInside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, (-length) + (bottomHeight) - 1/4, 0]});
  bInside.setColor(0, 0, 1);

  return box.subtract(bInside).subtract(inside);
}

class ThreeDModel {
  constructor(assemblies) {
    const call = ++ThreeDModel.call;

    function render() {
      if (ThreeDModel.call !== call) return;
      function buildObject(assem) {
        const radius = [assem.width() / 2, assem.length() / 2, assem.thickness() / 2];
        let a = CSG.cube({ radius });
        a.rotate(assem.position().rotation());
        a.center(assem.position().center());
        if (assem.partName && assem.partName.match(/.*Divider.Frame.*/))a.setColor(0, 1, 0);
        else if (assem.partName && assem.partName.match(/.*Frame.*/))a.setColor(0, 0, 1);
        else a.setColor(1, 0, 0);
        return a;
      }
      const assem1 = assemblies[0];
      const assem2 = assemblies[1];
      let a = buildObject(assem1);
      // console.log(assem1.partName, a.distCenter(), '-', a.endpoints());
      for (let index = 1; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        const b = buildObject(assem);
        // console.log(assem.partName, b.distCenter(), '-', b.endpoints());
        if (assem.length() && assem.width() && assem.thickness()) {
          a = a.union(b);
        }
      }
      ThreeDModel.viewer.mesh = a.toMesh();
      ThreeDModel.viewer.gl.ondraw();
    }
    setTimeout(render, 500);
  }
}
const cube = new CSG.cube({radius: [3,5,1]});
ThreeDModel.call = 0;
ThreeDModel.init = () => {
  const p = pull(5,2);
  const db = drawerBox(10, 15, 22);
  ThreeDModel.viewer = new Viewer(db, 300, 150, 50);
  addViewer(ThreeDModel.viewer, 'three-d-model');
}

ThreeDModel.arbitraryRotate = function (point, degreestheta, radius)
{
  theta = degreestheta * Math.PI/180;
  let p = point;
  let r = radius;
   let q = {x: 0.0, y: 0.0, z: 0.0};
   let costheta,sintheta;

   const Normalise = (obj, attr) => obj[attr] *= obj[attr] > 0 ? 1 : -1;
   Normalise(r, 'x',);
   Normalise(r, 'y',);
   Normalise(r, 'z',);

   costheta = Math.cos(theta);
   sintheta = Math.sin(theta);

   q.x += (costheta + (1 - costheta) * r.x * r.x) * p.x;
   q.x += ((1 - costheta) * r.x * r.y - r.z * sintheta) * p.y;
   q.x += ((1 - costheta) * r.x * r.z + r.y * sintheta) * p.z;

   q.y += ((1 - costheta) * r.x * r.y + r.z * sintheta) * p.x;
   q.y += (costheta + (1 - costheta) * r.y * r.y) * p.y;
   q.y += ((1 - costheta) * r.y * r.z - r.x * sintheta) * p.z;

   q.z += ((1 - costheta) * r.x * r.z - r.y * sintheta) * p.x;
   q.z += ((1 - costheta) * r.y * r.z + r.x * sintheta) * p.y;
   q.z += (costheta + (1 - costheta) * r.z * r.z) * p.z;

   return(q);
}

window.onload = () => {
  const dummyText = (prefix) => (item, index) => `${prefix} ${index}`;
  const cabinetDisplay = new CabinetDisplay('#add-cabinet-cnt');
  ThreeDModel.init();
};
