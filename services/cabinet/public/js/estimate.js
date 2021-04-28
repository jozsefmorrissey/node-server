
const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function randomString(len) {
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

const DEFAULT_PROPS = {
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

  iph: {name: 'Ideal Pull Height', value: 42},
  trv: {name: 'Top Reveal', value: 1/2},
  brv: {name: 'Bottom Reveal', value: 1/4},
  lrv: {name: 'Left Reveal', value: 1/2},
  rrv: {name: 'Right Reveal', value: 1/2},
  fs: {name: 'Face Spacing', value: 1/8},
  is: {name: 'Inset Spacing', value: 1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},
};

function properties(name, values) {
  if (values === undefined)
    return JSON.parse(JSON.stringify(properties.list[name]));

  const props = JSON.parse(JSON.stringify(DEFAULT_PROPS));
  const overwrites = JSON.parse(JSON.stringify(values));
  if (name !== undefined) properties.list[name] = props;
  Object.keys(overwrites).forEach((key) => props[key] = overwrites[key]);

}
properties.list = {};


properties('Half Overlay', {});
const CONSTANTS = properties('Half Overlay');

properties('Full Overlay', {
  trv: {name: 'Top Reveal', value: 1/16},
  brv: {name: 'Bottom Reveal', value: 1/16},
  lrv: {name: 'Left Reveal', value: 1/16},
  rrv: {name: 'Right Reveal', value: 1/16},
  fs: {name: 'Face Spacing', value: 1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},
});

properties('Inset', {
  trv: {name: 'Top Reveal', value: -1/16},
  brv: {name: 'Bottom Reveal', value: -1/16},
  lrv: {name: 'Left Reveal', value: -1/16},
  rrv: {name: 'Right Reveal', value: -1/16},
  fs: {name: 'Face Spacing', value: -1/16},
  vffs: {name: 'Vertical First Front Size', value: 5.5},
});

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


class StringMathEvaluator {
  constructor(globalScope, resolver) {
    globalScope = globalScope || {};
    const instance = this;
    let splitter = '.';

    function resolve (path, currObj, globalCheck) {
      if (path === '') return currObj;
      try {
        if ((typeof path) === 'string') path = path.split(splitter);
        for (let index = 0; index < path.length; index += 1) {
          currObj = currObj[path[index]];
        }
        if (currObj === undefined && !globalCheck) throw Error('try global');
        return currObj;
      }  catch (e) {
        return resolve(path, globalScope, true);
      }
    }

    resolve = resolver || resolve;

    function multiplyOrDivide (values, operands) {
      const op = operands[operands.length - 1];
      if (op === StringMathEvaluator.multi || op === StringMathEvaluator.div) {
        const len = values.length;
        values[len - 2] = op(values[len - 2], values[len - 1])
        values.pop();
        operands.pop();
      }
    }

    const resolveArguments = (initialChar, func) => {
      return function (expr, index, values, operands, scope, path) {
        if (expr[index] === initialChar) {
          const args = [];
          let endIndex = index += 1;
          const terminationChar = expr[index - 1] === '(' ? ')' : ']';
          let terminate = false;
          let openParenCount = 0;
          while(!terminate && endIndex < expr.length) {
            const currChar = expr[endIndex++];
            if (currChar === '(') openParenCount++;
            else if (openParenCount > 0 && currChar === ')') openParenCount--;
            else if (openParenCount === 0) {
              if (currChar === ',') {
                args.push(expr.substr(index, endIndex - index - 1));
                index = endIndex;
              } else if (openParenCount === 0 && currChar === terminationChar) {
                args.push(expr.substr(index, endIndex++ - index - 1));
                terminate = true;
              }
            }
          }

          for (let index = 0; index < args.length; index += 1) {
            args[index] = instance.eval(args[index], scope);
          }
          const state = func(expr, path, scope, args, endIndex);
          if (state) {
            values.push(state.value);
            return state.endIndex;
          }
        }
      }
    };

    function chainedExpressions(expr, value, endIndex, path) {
      if (expr.length === endIndex) return {value, endIndex};
      let values = [];
      let offsetIndex;
      let valueIndex = 0;
      let chained = false;
      do {
        const subStr = expr.substr(endIndex);
        const offsetIndex = isolateArray(subStr, 0, values, [], value, path) ||
                            isolateFunction(subStr, 0, values, [], value, path) ||
                            (subStr[0] === '.' &&
                              isolateVar(subStr, 1, values, [], value));
        if (Number.isInteger(offsetIndex)) {
          value = values[valueIndex];
          endIndex += offsetIndex - 1;
          chained = true;
        }
      } while (offsetIndex !== undefined);
      return {value, endIndex};
    }

    const isolateArray = resolveArguments('[',
      (expr, path, scope, args, endIndex) => {
        endIndex = endIndex - 1;
        let value = resolve(path, scope)[args[args.length - 1]];
        return chainedExpressions(expr, value, endIndex, '');
      });

    const isolateFunction = resolveArguments('(',
      (expr, path, scope, args, endIndex) =>
          chainedExpressions(expr, resolve(path, scope).apply(null, args), endIndex - 1, ''));

    function isolateParenthesis(expr, index, values, operands, scope) {
      const char = expr[index];
      if (char === '(') {
        let openParenCount = 1;
        let endIndex = index + 1;
        while(openParenCount > 0 && endIndex < expr.length) {
          const currChar = expr[endIndex++];
          if (currChar === '(') openParenCount++;
          if (currChar === ')') openParenCount--;
        }
        const len = endIndex - index - 2;
        values.push(instance.eval(expr.substr(index + 1, len), scope));
        multiplyOrDivide(values, operands);
        return endIndex;
      }
    };

    function isolateOperand (char, operands) {
      switch (char) {
        case '*':
        operands.push(StringMathEvaluator.multi);
        return true;
        break;
        case '/':
        operands.push(StringMathEvaluator.div);
        return true;
        break;
        case '+':
        operands.push(StringMathEvaluator.add);
        return true;
        break;
        case '-':
        operands.push(StringMathEvaluator.sub);
        return true;
        break;
      }
      return false;
    }

    function isolateValueReg(reg, resolver) {
      return function (expr, index, values, operands, scope) {
        const match = expr.substr(index).match(reg);
        let args;
        if (match) {
          let endIndex = index + match[0].length;
          let value = resolver(match[0], scope);
          if (!Number.isFinite(value)) {
            const state = chainedExpressions(expr, scope, endIndex, match[0]);
            if (state !== undefined) {
              value = state.value;
              endIndex = state.endIndex;
            }
          }
          values.push(value);
          multiplyOrDivide(values, operands);
          return endIndex;
        }
      }
    }
    const isolateNumber = isolateValueReg(StringMathEvaluator.numReg, Number.parseFloat);
    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);


    this.eval = function (expr, scope) {
      if (Number.isFinite(expr))
        return expr;
      scope = scope || globalScope;
      const allowVars = (typeof scope) === 'object';
      let operands = [];
      let values = [];
      let prevWasOpperand = true;
      for (let index = 0; index < expr.length; index += 1) {
        const char = expr[index];
        if (prevWasOpperand) {
          let newIndex = isolateParenthesis(expr, index, values, operands, scope) ||
                        isolateNumber(expr, index, values, operands, scope) ||
                        (allowVars && isolateVar(expr, index, values, operands, scope));
          if (Number.isInteger(newIndex)) {
            index = newIndex - 1;
            prevWasOpperand = false;
          }
        } else {
          prevWasOpperand = isolateOperand(char, operands);
        }
      }
      let value = values[0];
      for (let index = 0; index < values.length - 1; index += 1) {
        value = operands[index](values[index], values[index + 1]);
        values[index + 1] = value;
      }
      return value;
    }
  }
}

StringMathEvaluator.evaluateReg = /[-\+*/]|^\s*[0-9]{1,}\s*$/;
StringMathEvaluator.numReg = /^(-|)[0-9\.]{1,}/;
StringMathEvaluator.varReg = /^((\.|)([a-zA-Z][a-zA-Z0-9\.]*))/;
StringMathEvaluator.multi = (n1, n2) => n1 * n2;
StringMathEvaluator.div = (n1, n2) => n1 / n2;
StringMathEvaluator.add = (n1, n2) => n1 + n2;
StringMathEvaluator.sub = (n1, n2) => n1 - n2;


class Position {
  constructor(assembly, sme) {

    function getSme(attr, obj) {
      if (attr === undefined) {
        return {x: sme.eval(obj.x),
          y: sme.eval(obj.y),
          z: sme.eval(obj.z)}
      } else {
        return sme.eval(obj[attr]);
      }
    }

    let center, demension;
    let demCoords = {};
    let centerCoords = {};

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

    this.center = (attr) => center(attr);
    this.demension = (attr) => demension(attr);

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
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    this.display = true;
    this.part = true;
    this.included = true;
    this.parentAssembly = parent;
    let propId = 'Full Overlay';
    this.propertyId = (id) => {
      if (id === undefined) return propId;
      propId = id;
    }
    let instance = this;
    funcOvalue.apply(this, ['centerStr', centerStr, 'demensionStr',  demensionStr, 'rotationStr', rotationStr]);

    function getValueSmeFormatter(path) {
      const split = path.split('.');
      let attr = split[0];
      let objIdStr;
      if (split.length === 2) {
        objIdStr = split[0];
        attr = split[1];
      }

      let obj;
      if (objIdStr === undefined) {
        obj = instance;
      } else {
        obj = instance.getAssembly(objIdStr);
      }
      const returnVal = Assembly.resolveAttr(obj, attr);
      return returnVal;
    }
    const sme = new StringMathEvaluator(null, getValueSmeFormatter);


    let getting =  false;
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
    let position = new Position(this, sme);
    this.position = () => position;
    this.updatePosition = () => position = new Position(this, sme);
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
    this.value = (code, value) => {
      if (code.match(new RegExp(funcAttrs.join('|')))) {
        this[code](value);
      } else {
        if (value !== undefined) {
          this.values[code] = value;
        } else {
          const instVal = this.values[code];
          if (instVal !== undefined && instVal !== null) {
            if ((typeof instVal) === 'number' || (typeof instVal) === 'string') {
              return sme.eval(instVal);
            } else {
              return instVal;
            }
          }
          if (this.parentAssembly) return this.parentAssembly.value(code);
          else {
            try {
              return properties(propId)[code].value;
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
    this.setSubAssemblies = (assemblies) => {
      this.subAssemblies = {};
      assemblies.forEach((assem) => this.subAssemblies[assem.partCode] = assem);
    };
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

    this.children = () => Object.values(this.subAssemblies);

    this.getSubAssemblies = () => {
      let assemblies = [];
      this.children().forEach((assem) => {
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
    this.toJson = function (json) {
      json = json || {};
      json.type = this.constructor.name;
      if (this.important) {
        this.important.forEach((attr) =>
            json[attr] = (typeof this.attr) === 'function' ? this.attr() : this.attr);

        json.length = this.length();
        json.width = this.width();
        json.thickness = this.thickness();
      }
      json.values = JSON.parse(JSON.stringify(this.values));
      json.subAssemblies = [];
      const subAssems = this.children();
      subAssems.forEach((assem) => json.subAssemblies.push(assem.toJson()));
      return json;
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
    this.center = (attr) => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const center = {};
      center.x = (!attr || attr === 'x') &&
            leftPos.center('x') - ((leftPos.center('x') - rightPos.center('x')) / 2);
      center.y = (!attr || attr === 'y') &&
            botPos.center('y') + ((topPos.center('y') - botPos.center('y')) / 2);
      center.z = (!attr || attr === 'z') &&
            topPos.center('z');
      return attr ? center[attr] : center;
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
      const x = leftPos.center('x') + leftPos.limits('-x') - (rightPos.center('x') + rightPos.limits('+x'));
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
Section.new = (constructorId, divideProps) => new (Section.sections[constructorId]).constructor();
Section.render = (opening, scope) => {
  scope.featureDisplay = new FeatureDisplay(opening).html();
  const cId = opening.constructorId;
  if (cId === 'DivideSection') {
    return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
  }
  return Section.templates[cId].render(scope);
}

/*
    a,b,c
    d,e,f
    g,h,i
*/
class Pull extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    super(partCode, 'Pull');
    this.setParentAssembly(door);

    function offset(center, distance) {
      const spacing = distance / count;
      return center - (distance / 2) + spacing / 2 + spacing * (index);
    }


    this.demensionStr = (attr) => {
      const dems = {x: 1, y: 3, z: 1.5};
      return attr ? dems[attr] : dems;
    }

    const edgeOffset = 1;
    this.centerStr = (attr) => {
        let center = door.position().center();
        let doorDems = door.position().demension();
        let pullDems = this.demensionStr();
        center.z -= (doorDems.z + pullDems.z) / 2;
        switch (location) {
          case Pull.location.TOP_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems / 2 + edgeOffset);
					break;
          case Pull.location.TOP_LEFT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems / 2 + edgeOffset);
					break;
          case Pull.location.BOTTOM_RIGHT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems / 2 + edgeOffset);
					break;
          case Pull.location.BOTTOM_LEFT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems / 2 + edgeOffset);
					break;
          case Pull.location.TOP:
            center.x = offset(center.x, doorDems.x);
            center.y -= doorDems.y / 2;
					break;
          case Pull.location.BOTTOM:
            center.x = offset(center.x, doorDems.x);
            center.y += doorDems.y / 2;
					break;
          case Pull.location.RIGHT:
            center.y = offset(center.y, doorDems.y);
            center.x += doorDems.x / 2;
					break;
          case Pull.location.LEFT:
            center.y = offset(center.y, doorDems.y);
            center.x -= doorDems.x / 2;
					break;
          case Pull.location.CENTER:
            center.x = offset(center.x, doorDems.x);
					break;
          default:
            throw new Error('Invalid pull location');
        }
        return attr ? center[attr] : center;
    };

    this.updatePosition();
  }
}
Pull.location = {};
Pull.location.TOP_RIGHT = {rotate: true};
Pull.location.TOP_LEFT = {rotate: true};
Pull.location.BOTTOM_RIGHT = {rotate: true};
Pull.location.BOTTOM_LEFT = {rotate: true};
Pull.location.TOP = {multiple: true};
Pull.location.BOTTOM = {multiple: true};
Pull.location.RIGHT = {multiple: true};
Pull.location.LEFT = {multiple: true};
Pull.location.CENTER = {multiple: true, rotate: true};

class Door extends Assembly {
  constructor(partCode, partName, door, ) {
    super(partCode, partName);
    this.pull =

    this.updatePull = () => {
      pulls.push(new Pull(`dp`, 'Door.Pull', instance.doorPullCenter, instance.pullDems, 'z'));
    }
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

class DrawerBox extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

class DrawerFront extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.setParentAssembly(parent);
    const instance = this;
    let pulls;
    if (demensionStr === undefined) return;

    function pullCount(dems) {
      if (dems.x < 30) return 1;
      return 2;
    }

    this.demensionStr = (attr) => {
      const dems = demensionStr();
      return dems;
    };

    this.children = () => this.updatePulls();

    this.updatePulls = (dems, count) => {
      count = count || pullCount(this.demensionStr());
      pulls = [];
      for (let index = 0; index < count; index += 1) {
        pulls.push(new Pull(`${partCode}-dfp-${index}`, 'Drawer.Pull', this, Pull.location.CENTER, index, count));
      }
      return pulls;
    };
    this.updatePosition();
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

const PULL_TYPE = {
  DRAWER: 'Drawer',
  DOOR: 'Door'
}

class OpeningCoverSection extends SpaceSection {
  constructor(filePath, partCode, partName, divideProps, pullType) {
    super(filePath, partCode, partName, divideProps);

    const instance = this;

    pullType = pullType || PULL_TYPE.DOOR;
    let pulls = [];

    this.setPullType = (pt) => pullType = pt;
    if (divideProps === undefined) return;

    this.updatePulls = (count) => {
      pulls = [];
      if (pullType === PULL_TYPE.DRAWER) {
        count = count || instance.drawerPullCount();
        for (let index = 0; index < count; index += 1) {
          pulls.push(new Pull(`dwp-${index}`, 'Drawer.Pull', instance.drawerPullCenter(index, count), instance.pullDems));
        }
      } else {
        pulls.push(new Pull(`dp`, 'Door.Pull', instance.doorPullCenter, instance.pullDems, 'z'));
      }
    }

    this.coverDems = function(attr) {
      const props = divideProps();
      const dems = instance.innerSize()
      dems.z = instance.value('pwt34');
      dems.x = dems.x + 1;
      dems.y = dems.y + 1;
      return attr ? dems[attr] : dems;
    }

    this.coverCenter = function (attr) {
      const props = divideProps();
      const dems = instance.coverDems();
      const center = instance.center();
      center.z -= (props.borders.top.position().demension('z') + dems.z) / 2 - 1/8;
      return attr ? center[attr] : center;
    }

    this.hingeSide = () => {
      const props = divideProps();
      return props.borders.right.partCode === 'rr' ? '+x' : '-x';
    }


    const gap = 1/16;
    function duelDoorDems() {
      const dems = instance.coverDems();
      dems.x = (dems.x - gap) / 2;
      return dems;
    }
    this.duelDoorDems = duelDoorDems;

    function duelDoorCenter(right) {
      return function () {
        const direction = right ? -1 : 1;
        const center = instance.coverCenter();
        const dems = duelDoorDems();
        center.x += (dems.x + gap) / 2 * direction;
        return center;
      }
    }
    this.duelDoorCenter = duelDoorCenter;

    function closest(target) {
      let winner = {value: arguments[1], diff: Math.abs(target - arguments[1])};
      for (let index = 2; index < arguments.length; index += 1) {
        const value = arguments[index];
        const diff = Math.abs(target - value);
        if (diff < winner.diff) {
          winner = {diff, value}
        }
      }
      return winner.value;
    }

    this.drawerPullCenter = (index, count) =>
      (attr) => {
        const center = instance.coverCenter(attr);
        const dems = instance.coverDems();
        const spacing = (dems.x / (count));
        center.x += -(dems.x/2) + spacing / 2 + spacing * (index);
        center.z -= (instance.coverDems('z') + dems.z) / 2;
        return center;
    };

    this.pullDems = (attr) => {
      const dems = {x: 1, y: 5, z: 2};
      return attr ? dems[attr] : dems;
    }

    this.doorPullCenter = () => {
      const idealPullHeight = instance.value('iph');
      const dems = this.coverDems();
      const center = this.coverCenter();
      const top = center.y +  dems.y / 2 - 4;
      const bottom = center.y -  dems.y / 2 + 4;
      const xOffset = dems.x / 2 - 1.5;
      center.x = center.x - xOffset * (this.hingeSide() === '-x' ? 1 : -1);
      center.y = closest(idealPullHeight, top, center.y, bottom);
      center.z -= (instance.coverDems('z') + dems.z) / 2;
      return center;
    }

  }
}

const sectionFilePath = (filename) => `sections/${filename}`;

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

Feature.addRelations('DrawerBox', ['drawerType', 'drawerFront', 'drawerBox']);
Feature.addRelations('PartitionSection', ['hasFrame', 'hasPanel']);
Feature.addRelations('Door', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('DoubleDoor', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('FalseFront', ['drawerType', 'edgeProfile']);

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

class DrawerSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('drawer'), partCode, 'Drawer.Section', divideProps, PULL_TYPE.DRAWER);
    if (divideProps === undefined) return;
    const instance = this;

    function getDrawerDepth(depth) {
      if (depth < 3) return 0;
      return Math.ceil((depth - 1)/2) * 2;
    }

    function drawerCenter(attr) {
      const props = divideProps();
      const dems = drawerDems();
      const center = instance.center();
      center.z += (dems.z - props.borders.top.position().demension('z')) / 2 - 1/8;
      return attr ? center[attr] : center;
    }

    function drawerDems(attr) {
      const props = divideProps();
      const dems = instance.innerSize()
      dems.z = getDrawerDepth(props.depth);
      dems.x = dems.x - 1/2;
      dems.y = dems.y - 1/2;
      return attr ? dems[attr] : dems;
    }

    this.addSubAssembly(new DrawerBox('db', 'Drawer.Box', drawerCenter, drawerDems));
    this.addSubAssembly(new DrawerFront('df', 'Drawer.Front', this.coverCenter, this.coverDems, '', this));
  }
}
new DrawerSection();

class Divider extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}
Divider.count = 0;

class DividerSection extends PartitionSection {
  constructor(partCode, sectionProperties, parent) {
    super(sectionFilePath('divider'), partCode, 'Divider', sectionProperties, parent);
    if (sectionProperties === undefined) return;
    const props = sectionProperties;
    const instance = this;
    this.position().center = (attr) => {
      const center = props().center;
      return attr ? center[attr] : center;
    };
    this.position().demension = (attr) =>
      Position.targeted(attr, () => this.value('frw'),
          () => props().dividerLength / 2, () => this.value('frt'));
    const panelCenterFunc = () => {return '0,0,0'};
    const panelDemFunc = () => {return '0,0,0'};
    const panelRotFunc = () => {return '0,0,0'};

    const frameCenterFunc = (attr) => {
      const props = sectionProperties();
      const dem = {
        x: props.center.x,
        y: props.center.y,
        z: props.center.z
      };
      return attr ? dem[attr] : dem;
    };

    const frameDemFunc = (attr) => {
      const dem = {
        x: this.value('frw'),
        y: sectionProperties().dividerLength,
        z: this.value('frt'),
      };
      return attr ? dem[attr] : dem;
    }

    const frameRotFunc = () => sectionProperties().rotationFunc();


    this.addSubAssembly(new Panel(`dp-${Divider.count}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc));
    this.addSubAssembly(new Frame(`df-${Divider.count}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc));
  }
}
new DividerSection();

class DoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('door'), partCode, 'Door.Section', divideProps);
    this.addSubAssembly(new Door('d', 'DrawerFront', this.coverCenter, this.coverDems));
  }
}
new DoorSection();

class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('dual-door'), partCode, 'Duel.Door.Section', divideProps);
    if (divideProps === undefined) return;
    this.addSubAssembly(new Door('dr', 'DrawerFront', this.duelDoorCenter(true), this.duelDoorDems));
    this.addSubAssembly(new Door('dl', 'DrawerFront', this.duelDoorCenter(), this.duelDoorDems));
  }
}
new DualDoorSection();

class FalseFrontSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('false-front'), partCode, 'False.Front.Section', divideProps, PULL_TYPE.DRAWER);
    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', this.coverCenter, this.coverDems, '', this));
  }
}
new FalseFrontSection();

class FrameDivider extends Assembly {
  constructor (partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

let dvs;

class DivideSection extends SpaceSection {
  constructor(sectionProperties, parent) {
    super(sectionFilePath('open'), 'dvds', 'divideSection', sectionProperties, parent);
    this.setParentAssembly(parent);
    dvs = dvs || this;
    this.vertical = (is) => this.value('vertical', is);
    this.vertical(true);
    this.sections = [];
    this.value('vPattern', {name: 'Equal'});
    this.value('hPattern', {name: 'Equal'});
    this.pattern = (name, index, value) => {
      if (name === undefined) return this.vertical() ? this.value('vPattern') : this.value('hPattern');
      if (this.vertical()) this.value('vPattern', {name, index, value});
      else this.value('hPattern', {name, index, value});
    }
    this.measurments = [];
    this.dividerCount = () => (this.sections.length - 1) / 2
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection(this.borders(0), this));
      }
    }

    this.children = () => this.sections;
    this.borders = (index) => {
      return () => {
        const props = sectionProperties();

        let top = props.borders.top;
        let bottom = props.borders.bottom;
        let left = props.borders.left;
        let right = props.borders.right;
        if (this.vertical()) {
          if (index !== 0) {
            right = this.sections[index - 1];
          } if (index !== this.sections.length - 1) {
            left = this.sections[index + 1];
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
        const innerSize = this.innerSize();
        let center = this.center();
        let dividerLength;
        if (this.vertical()) {
          let start = sectionProperties().borders.right.position().center('x');
          start += sectionProperties().borders.right.position().limits('+x');
          center.x = start + offset;
          dividerLength = innerSize.y;
        } else {
          let start = sectionProperties().borders.top.position().center('y');
          start += sectionProperties().borders.top.position().limits('+x');
          center.y = start - offset;
          dividerLength = innerSize.x;
        }
        const rotationFunc = () =>  this.vertical() ? '' : 'z';

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
      const distance = this.vertical() ? this.outerSize().x : this.outerSize().y;
      const count = this.dividerCount() + 1;
      const answer = pattern.resolution(distance, config.index, config.value, count);
      config.fill = answer.fill;
      return answer;
    }
    this.divide = (dividerCount) => {
      if (!Number.isNaN(dividerCount)) {
        dividerCount = dividerCount > 10 ? 10 : dividerCount;
        dividerCount = dividerCount < 0 ? 0 : dividerCount;
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount * 2 + 1);
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            this.sections.push(new DividerSection(`dv${index}`, this.dividerProps(index), this));
            this.sections.push(new DivideSection(this.borders(dividerCount + index + 1), this));
          }
          return diff !== 0;
        }
      }
      return false;
    }
    this.setSection = (constructorId, index) => {
      const section = new (Section.sections[constructorId]).constructor('dr', this.borders(index));
      section.setParentAssembly(this);
      this.sections[index] = section;
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
  constructor(partCode, partName, propsId) {
    super(partCode, partName);
    this.propertyId(propsId);
    this.important = ['length', 'width', 'thickness', 'propertyId'];
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
      const depth = pb.position().center('z') + pb.position().limits('-z');
      return {borders: {top, bottom, right, left}, depth};
    }

    this.value('brh', 'tkb.w + pb.t + brr - br.w', true);
    this.value('stl', '(frorl + pr.t)', true);
    this.value('str', '(frorr + pl.t)', true);
    this.value('st', '(str + stl)', true);
    this.addSubAssemblies(

                          new Panel('tkb', 'Panel.Toe.Kick.Backer',
                            'pr.t + frorl + (l / 2), w / 2, tkd + (t / 2)',
                            'tkh, c.w - st, tkbw',
                            'z'),



                          new Frame('rr', 'Frame.Right',
                            'w / 2,brh + (l / 2), t / 2',
                            'frw, c.l - brh, frt'),
                          new Frame('lr', 'Frame.Left',
                            'c.w - (w / 2),brh + (l / 2), t / 2',
                            'frw, c.l - brh, frt'),
                          new Frame('br', 'Frame.Bottom',
                            'lr.w + (l / 2),brh + (w / 2), t / 2',
                            'frw,c.w - lr.w - rr.w,frt',
                            'z'),



                          new Frame('tr', 'Frame.Top',
                            'lr.w + (l / 2), c.l - (w/2),t / 2',
                            'frw,br.l,frt',
                            'z'),




                          new Panel('pr', 'Panel.Right',
                            'c.w - frorl - (t / 2),l / 2,(w / 2) + lr.t',
                            'c.t - lr.t,c.l,pwt34',
                            'y'),
                          new Panel('pl', 'Panel.Left',
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


    this.addJoints(new Rabbet('pb->pl', 3/8, 'y', '-x'),
                      new Rabbet('pb->pr', 3/8, 'y', '+x'),
                      new Butt('pb->pbt'),

                      new Dado('tkb->pl', 3/8, 'y', '-x'),
                      new Dado('pl->rr', 3/8, 'x', '-z'),

                      new Dado('tkb->pr', 3/8, 'y', '+x'),
                      new Dado('pr->lr', 3/8, 'x', '-z'),

                      new Dado('pbt->pl', 3/8, 'y', '-x'),
                      new Dado('pbt->pr', 3/8, 'y', '+x'),

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

    this.updatePosition = () => {};

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
  constructor(joinStr, defaultDepth, axis, centerOffset) {
    super(joinStr);

    this.maleOffset = (assembly) => {
      return defaultDepth;
    }

    if (axis === undefined) return;

    this.updatePosition = (position) => {
      const direction = centerOffset[0] === '-' ? -1 : 1;
      const centerAxis = centerOffset[1];
      position.demension[axis] += defaultDepth;
      position.center[centerAxis] += defaultDepth/2 * direction;
    };

  }
}

class Rabbet extends Joint {
  constructor(joinStr, defaultDepth, axis, centerOffset) {
    super(joinStr);
    this.maleOffset = (assembly) => {
      return defaultDepth;
    }

    if (axis === undefined) return;

    this.updatePosition = (position) => {
      const direction = centerOffset[0] === '-' ? -1 : 1;
      const centerAxis = centerOffset[1];
      position.demension[axis] += defaultDepth;
      position.center[centerAxis] += defaultDepth/2 * direction;
    };
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

const colors = {
  indianred: [205, 92, 92],
  lightcoral: [240, 128, 128],
  salmon: [250, 128, 114],
  darksalmon: [233, 150, 122],
  lightsalmon: [255, 160, 122],
  white: [255, 255, 255],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  black: [0, 0, 0],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  yellow: [255, 255, 0],
  olive: [128, 128, 0],
  lime: [0, 255, 0],
  green: [0, 128, 0],
  aqua: [0, 255, 255],
  teal: [0, 128, 128],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  fuchsia: [255, 0, 255],
  purple: [128, 0, 128]
}

function getColor(name) {
  if(colors[name]) return colors[name];
  return [0,0,0];
}

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

function upAll(selector, node) {
  const elems = [];
  let elem = node;
  while(elem = up(selector, elem)) {
    elems.push(elem);
    elem = elem.parentElement;
  }
  return elems;
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

function displayPart(part) {
  return true;
}

function groupParts(cabinet) {
  const grouping = {displayPart, group: {groups: {}, parts: {}}};
  const parts = cabinet.getParts();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const namePieces = part.partName.split('.');
    let currObj = grouping.group;
    let prefix = '';
    for (let nIndex = 0; nIndex < namePieces.length - 1; nIndex += 1) {
      const piece = namePieces[nIndex];
      prefix += piece;
      if (currObj.groups[piece] === undefined) currObj.groups[piece] = {groups: {}, parts: []};
      currObj = currObj.groups[piece];
      currObj.prefix = prefix;
      prefix += '.'
    }
    if (currObj.parts[part.partName] === undefined) currObj.parts[part.partName] = [];
    currObj.parts[part.partName].push(part);
  }
  return grouping;
}

const modelContTemplate = new $t('model-controller')
const stateReg = /( |^)(small|large)( |$)/;
matchRun('click', '#max-min-btn', (target) => {
  const className = target.parentElement.className;
  const controller = document.getElementById('model-controller');
  const state = className.match(stateReg);
  const clean = className.replace(new RegExp(stateReg, 'g'), '').trim();
  if (state[2] === 'small') {
    target.parentElement.className = `${clean} large`;
    const cabinet = roomDisplay.cabinet();
    if (cabinet) {
      const grouping = groupParts(cabinet);
      grouping.tdm = ThreeDModel.get(cabinet);
      controller.innerHTML = modelContTemplate.render(grouping);
    }
    controller.hidden = false;
  } else {
    target.parentElement.className = `${clean} small`;
    controller.hidden = true;
  }
});

function addClass(target, clazz) {
  target.className += ` ${clazz}`;
}

function classReg(clazz) {
  return new RegExp(`(^| )${clazz}( |$)`, 'g');
}

function removeClass(target, clazz) {
  target.className = target.className.replace(classReg(clazz), '');
}

function hasClass(target, clazz) {
  return target.className.match(classReg(clazz));
}

function toggleClass(target, clazz) {
  if (hasClass(target, clazz)) removeClass(target, clazz);
  else addClass(target, clazz);
}

matchRun('click', '.model-label', (target) => {
  if (event.target.tagName === 'INPUT') return;
  const has = hasClass(target, 'active');
  document.querySelectorAll('.model-label')
    .forEach((elem) => removeClass(elem, 'active'))
  !has ? addClass(target, 'active') : removeClass(target, 'active');
  let label = target.children[0]
  let type = label.getAttribute('type');
  let value = type !== 'prefix' ? label.innerText :
        label.nextElementSibling.getAttribute('prefix');
  const cabinet = roomDisplay.cabinet();
  const tdm = ThreeDModel.get(cabinet);
  tdm.inclusiveTarget(type, has ? undefined : value);
  tdm.render();
});

matchRun('click', '.prefix-switch', (target, event) => {
  const eventTarg = event.target;
  const active = upAll('.model-selector', target);
  active.push(target.parentElement.parentElement);
  const all = document.querySelectorAll('.prefix-body');
  all.forEach((pb) => pb.hidden = true);
  active.forEach((ms) => ms.children[0].children[1].hidden = false);
});

matchRun('change', '.prefix-checkbox', (target) => {
  const cabinet = roomDisplay.cabinet();
  const attr = target.getAttribute('prefix');
  ThreeDModel.get(cabinet).hidePrefix(attr, !target.checked);
});

matchRun('change', '.part-name-checkbox', (target) => {
  const cabinet = roomDisplay.cabinet();
  const attr = target.getAttribute('part-name');
  ThreeDModel.get(cabinet).hidePartName(attr, !target.checked);
});

matchRun('change', '.part-code-checkbox', (target) => {
  const cabinet = roomDisplay.cabinet();
  const attr = target.getAttribute('part-code');
  ThreeDModel.get(cabinet).hidePartCode(attr, !target.checked);
})


function updateModel(part) {
  const cabinet = part.getAssembly('c');
  ThreeDModel.render(cabinet);
}

function updateDivisions (target) {
  const name = target.getAttribute('name');
  const index = Number.parseInt(target.getAttribute('index'));
  const value = Number.parseFloat(target.value);
  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
  const pattern = DivisionPattern.patterns[name];
  const uniqueId = up('.opening-cnt', target).getAttribute('opening-id');
  const opening = Assembly.get(uniqueId);
  const values = opening.calcSections(pattern, index, value).fill;
  for (let index = 0; values && index < inputs.length; index += 1){
    const value = values[index];
    if(value) inputs[index].value = value;
  }
  updateModel(opening);
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
    this.active = () => props.list[this.activeIndex()];
    this.value = (index) => (key, value) => {
      if (props.activeIndex === undefined) props.activeIndex = 0;
      if (index === undefined) index = props.activeIndex;
      if (storage[index] === undefined) storage[index] = {};
      if (value === undefined) return storage[index][key];
      storage[index][key] = value;
    }
    this.set = (index, value) => props.list[index] = value;
    this.get = (index) => props.list[index];
    this.htmlBody = (index) => props.getBody(props.list[index], index);
    this.refresh();
  }
}
ExpandableList.lists = [];
ExpandableList.listTemplate = new $t('expandable/list');
ExpandableList.pillTemplate = new $t('expandable/pill');
ExpandableList.sidebarTemplate = new $t('expandable/sidebar');
ExpandableList.getIdAndIndex = (target) => {
  const cnt = up('.expand-header,.expand-body', target);
  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
  const index = Number.parseInt(cnt.getAttribute('index'));
  return {id, index};
}
ExpandableList.getValueFunc = (target) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].value(idIndex.index);
}

ExpandableList.get = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].get(idIndex.index);
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
  } else if (!isActive) {
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
OpenSectionDisplay.template = new $t('opening');
OpenSectionDisplay.listBodyTemplate = new $t('divide/body');
OpenSectionDisplay.listHeadTemplate = new $t('divide/head');
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
OpenSectionDisplay.dividerControlTemplate = new $t('divider-controls');
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
    const cabinet = opening.getAssembly('c');
    ThreeDModel.render(cabinet);
    target.focus();
  }
};

OpenSectionDisplay.onOrientation = (target) => {
  const openId = target.getAttribute('open-id');
  const value = target.value;
  const opening = OpenSectionDisplay.sections[openId];
  opening.vertical(value === 'vertical');
  OpenSectionDisplay.refresh(opening);
};

OpenSectionDisplay.onSectionChange = (target) => {
  ExpandableList.value('selected', target.value, target);
  const section = ExpandableList.get(target);
  const index = ExpandableList.getIdAndIndex(target).index;
  section.parentAssembly.setSection(target.value, index);
  updateModel(section);
}

matchRun('keyup', '.division-count-input', OpenSectionDisplay.onChange);
matchRun('click', '.division-count-input', OpenSectionDisplay.onChange);
matchRun('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
matchRun('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)

class Order {
  constructor(name) {
    this.name = name;
    this.rooms = []
    this.toJson = () => {
      const json = {name, rooms: []};
      this.rooms.forEach((room) => json.rooms.push(room.toJson()));
      return json;
    }
  }
}

class Room {
  constructor(name) {
    this.name = name || `Room ${Room.count++}`;
    this.id = randomString(32);
    this.cabinets = [];
    this.toJson = () => {
      const json = {name: this.name, id: this.id, cabinets: []};
      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
      return json;
    };
  }
};
Room.count = 0;

class RoomDisplay {
  constructor(parentSelector, rooms) {
    const cabinetDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      let propertyTypes = Object.keys(properties.list);
      setTimeout(this.cabinetDisplay().refresh, 100);
      return RoomDisplay.bodyTemplate.render({$index, room, propertyTypes});
    }
    const getObject = () => {
      const room = new Room();
      cabinetDisplays[room.id] = new CabinetDisplay(room);
      return room;
    }
    this.active = () => expandList.active();
    this.cabinetDisplay = () => cabinetDisplays[this.active().id];
    this.cabinet = () => this.cabinetDisplay().active();
    const expListProps = {
      list: rooms,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Room', type: 'pill'
    };
    const expandList = new ExpandableList(expListProps);
  }
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');

class CabinetDisplay {
  constructor(room) {
    const parentSelector = `[room-id="${room.id}"].cabinet-cnt`;
    let propId = 'Half Overlay';
    this.propId = (id) => {
      if (id ===  undefined) return propId;
      propId = id;
    }
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      ThreeDModel.render(cabinet);
      return CabinetDisplay.bodyTemplate.render({$index, cabinet, showTypes, OpenSectionDisplay});
    }
    const getObject = () => new Cabinet('c', 'Cabinet', propId);
    this.active = () => expandList.active();
    const expListProps = {
      list: room.cabinets,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Cabinet'
    };
    const expandList = new ExpandableList(expListProps);
    this.refresh = () => expandList.refresh();
    const valueUpdate = (path, value) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      const cabinet = expListProps.list[index];
      cabinet.value(key, value);
      ThreeDModel.render(cabinet);
    }

    bindField('.cabinet-input', valueUpdate, REGEX.size)
  }
}
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');

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
FeatureDisplay.template = new $t('features');


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
  constructor(assembly) {
    const hiddenPartCodes = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let inclusiveTarget = {};

    this.isTarget = (type, value) => {
      return inclusiveTarget.type === type && inclusiveTarget.value === value;
    }
    this.inclusiveTarget = function(type, value) {
      let prefixReg;
      if (type === 'prefix') prefixReg = new RegExp(`^${value}`)
      inclusiveTarget = {type, value, prefixReg};
    }

    function inclusiveMatch(part) {
      if (!inclusiveTarget.type || !inclusiveTarget.value) return null;
      switch (inclusiveTarget.type) {
        case 'prefix':
          return part.partName.match(inclusiveTarget.prefixReg) !== null;
          break;
        case 'part-name':
          return part.partName === inclusiveTarget.value;
        case 'part-code':
          return part.partCode === inclusiveTarget.value;
        default:
          throw new Error('unknown inclusiveTarget type');
      }
    }

    function manageHidden(object) {
      return function (attr, value) {
        if (value === undefined) return object[attr] === true;
       object[attr] = value === true;
       instance.render();
      }
    }

    function buildHiddenPrefixReg() {
      const list = [];
      const keys = Object.keys(hiddenPrefixes);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (hiddenPrefixes[key] === true) {
          list.push(key);
        }
      }
      hiddenPrefixReg = list.length > 0 ? new RegExp(`^${list.join('|')}`) : null;
    }

    this.hidePartCode = manageHidden(hiddenPartCodes);
    this.hidePartName = manageHidden(hiddenPartNames);
    this.hidePrefix = manageHidden(hiddenPrefixes);

    function hidden(part) {
      const im = inclusiveMatch(part);
      if (im !== null) return !im;
      if (instance.hidePartCode(part.partCode)) return true;
      if (instance.hidePartName(part.partName)) return true;
      if (hiddenPrefixReg && part.partName.match(hiddenPrefixReg)) return true;
      return false;
    }

    function coloring(part) {
      if (part.partName && part.partName.match(/.*Frame.*/)) return getColor('blue');
      else if (part.partName && part.partName.match(/.*Drawer.Box.*/)) return getColor('green');
      else if (part.partName && part.partName.match(/.*Pull.*/)) return getColor('silver');
      return getColor('red');
    }

    const randInt = (start, range) => start + Math.floor(Math.random() * range);
    function debugColoring() {
      return [randInt(0, 255),randInt(0, 255),randInt(0, 255)];
    }

    function getModel(assem) {
      const pos = assem.position().current();
      let model;
      if (assem instanceof DrawerBox) {
        model = drawerBox(pos.demension.y, pos.demension.x, pos.demension.z);
      } else if (assem instanceof Pull) {
        model = pull(pos.demension.y, pos.demension.z);
      } else {
        const radius = [pos.demension.x / 2, pos.demension.y / 2, pos.demension.z / 2];
        model = CSG.cube({ radius });
      }
      model.rotate(pos.rotation);
      pos.center.z *= -1;
      model.center(pos.center);
      return model;
    }


    this.render = function () {
      const startTime = new Date().getTime();
      buildHiddenPrefixReg();
      function buildObject(assem) {
        let a = getModel(assem);
        a.setColor(...debugColoring(assem));
        assem.getJoints().female.forEach((joint) => {
          const male = joint.getMale();
          const m = getModel(male, male.position().current());
          a = a.subtract(m);
        });
        // else a.setColor(1, 0, 0);
        return a;
      }
      const assemblies = assembly.getParts();
      let a;
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        if (!hidden(assem)) {
          const b = buildObject(assem);
          if (a === undefined) a = b;
          else if (b && assem.length() && assem.width() && assem.thickness()) {
            a = a.union(b);
          }
        }
      }
      console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
      ThreeDModel.viewer.mesh = a.toMesh();
      ThreeDModel.viewer.gl.ondraw();
      console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
    }
  }
}
const cube = new CSG.cube({radius: [3,5,1]});
ThreeDModel.init = () => {
  const p = pull(5,2);
  const db = drawerBox(10, 15, 22);
  ThreeDModel.viewer = new Viewer(db, 300, 150, 50);
  addViewer(ThreeDModel.viewer, 'three-d-model');
}

ThreeDModel.models = {};
ThreeDModel.get = (assembly) => {
  if (ThreeDModel.models[assembly.uniqueId] === undefined) {
    ThreeDModel.models[assembly.uniqueId] = new ThreeDModel(assembly);
  }
  return ThreeDModel.models[assembly.uniqueId];
}
ThreeDModel.render = (part) => ThreeDModel.get(part).render();

let roomDisplay;
let order;

window.onload = () => {
  order = new Order();
  roomDisplay = new RoomDisplay('#room-pills', order.rooms);
  const dummyText = (prefix) => (item, index) => `${prefix} ${index}`;
  ThreeDModel.init();
};
