class Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    this.display = true;
    this.important = ['partCode', 'partName', 'centerStr', 'demensionStr', 'rotationStr'];
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

    // TODO: wierd dependency on inherited class.... fix!!!
    const defaultPartCode = () =>
      instance.partCode = instance.partCode || Cabinet.partCode(this);

    this.setParentAssembly = (pa) => {
      this.parentAssembly = pa;
      defaultPartCode();
    }
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
            json[attr] = (typeof this[attr]) === 'function' ? this[attr]() : this[attr]);
      }
      json.values = JSON.parse(JSON.stringify(this.values));
      json.subAssemblies = [];
      if (!Assembly.class(json.type).dontSaveChildren) {
        const subAssems = this.children();
        subAssems.forEach((assem) => json.subAssemblies.push(assem.toJson()));
      }
      return json;
    }

    Assembly.add(this);

    this.width = (value) => position.setDemension('x', value);
    this.length = (value) => position.setDemension('y', value);
    this.thickness = (value) => position.setDemension('z', value);
    defaultPartCode();
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
Assembly.fromJson = (assemblyJson) => {
  const demensionStr = assemblyJson.demensionStr;
  const centerStr = assemblyJson.centerStr;
  const rotationStr = assemblyJson.rotationStr;
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = Assembly.new(assemblyJson.type, partCode, partName, centerStr, demensionStr, rotationStr);
  const clazz = assembly.constructor;
  assembly.values = assemblyJson.values;
    assemblyJson.subAssemblies.forEach((json) =>
      assembly.addSubAssembly(Assembly.class(json.type)
                                .fromJson(json, assembly)));
  if (assemblyJson.length) assembly.length(assemblyJson.length);
  if (assemblyJson.width) assembly.width(assemblyJson.width);
  if (assemblyJson.thickness) assembly.thickness(assemblyJson.thickness);
  return assembly;
}
Assembly.classes = {};
Assembly.register = (clazz) =>
  Assembly.classes[clazz.prototype.constructor.name] = clazz;
Assembly.new = function (id) {
  return new Assembly.classes[id](...Array.from(arguments).slice(1));
}
Assembly.class = function (id) {
  return Assembly.classes[id];
}

Assembly.classObj = (filterFunc) => {
  if ((typeof filterFunc) !== 'function') return Assembly.classes;
  const classIds = Object.keys(Assembly.classes);
  const classes = Assembly.classes;
  const obj = [];
  for (let index = 0; index < classIds.length; index += 1) {
    const id = classIds[index];
    if (filterFunc(classes[id])) obj[id]= classes[id];
  }
  return obj;
}
Assembly.classList = (filterFunc) => Object.values(Assembly.classObj(filterFunc));
Assembly.classIds = (filterFunc) => Object.keys(Assembly.classObj(filterFunc));
Assembly.lists = {};
Assembly.idCounters = {};
