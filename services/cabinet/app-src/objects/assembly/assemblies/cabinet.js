


const Assembly = require('../assembly.js');
const cabinetBuildConfig = require('../../../../public/json/cabinets.json');
const Joint = require('../../joint/joint.js');
const DivideSection = require('./section/space/sections/divide-section.js');

const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

class Cabinet extends Assembly {
  constructor(partCode, partName, propsId) {
    super(partCode, partName);
    Object.getSet(this, {_DO_NOT_OVERWRITE: true}, 'length', 'width', 'thickness');
    Object.getSet(this, 'propertyId', 'name');
    this.propertyId(propsId);
    const instance = this;
    let toeKickHeight = 4;
    this.part = false;
    this.display = false;
    this.overlay = OVERLAY.HALF;
    this.openings = [];
    this.type = CABINET_TYPE.FRAMED;
    const panels = 0;
    const framePieces = 0;
    const addFramePiece = (piece) => framePieces.push(piece);
    const framePieceCount = () => pieces.length;
    const addPanel = (panel) => panels.push(panel);
    const panelCount = () => panels.length;

    this.borders = (borderIds) => {
      const borders = {};
      borders.right = instance.getAssembly(borderIds.right);
      borders.left = instance.getAssembly(borderIds.left);
      borders.top = instance.getAssembly(borderIds.top);
      borders.bottom = instance.getAssembly(borderIds.bottom);

      const pb = instance.getAssembly(borderIds.back);

      return () => {
        const depth = pb.position().center('z') + pb.position().limits('-z');

        const position = {};
        const start = {};
        if (this.propertyConfig.isRevealOverlay() || this.propertyConfig.isInset()) {
          position.right = borders.right.position().centerAdjust('x', '-x');
          position.left = borders.left.position().centerAdjust('x', '+x');
          position.top = borders.top.position().centerAdjust('y', '-x');
          position.bottom = borders.bottom.position().centerAdjust('y', '+x');
        } else {
          position.right = borders.right.position().centerAdjust('x', '+x');
          position.left = borders.left.position().centerAdjust('x', '-x');
          position.top = borders.top.position().centerAdjust('y', '+x');
          position.bottom = borders.bottom.position().centerAdjust('y', '-x');
        }
        position.right -= this.value('rrv');
        position.left += this.value('lrv')
        position.top -= this.value('trv');
        position.bottom += this.value('brv');

        return {borders, position, depth, borderIds};
      }
    }
  }
}

Cabinet.build = (type, group) => {
  const cabinet = new Cabinet('c', type);
  cabinet.propertyConfig = group && group.propertyConfig ?
                            group.propertyConfig : new PropertyConfig();
  const config = cabinetBuildConfig[type];

  const valueIds = Object.keys(config.values);
  valueIds.forEach((valueId) => cabinet.value(valueId, config.values[valueId]));

  const subNames = Object.keys(config.subAssemblies);
  subNames.forEach((name) => {
    subAssemConfig = config.subAssemblies[name];
    const type = subAssemConfig.type;
    const demStr = subAssemConfig.demensions.join(',');
    const centerStr = subAssemConfig.center.join(',');
    const rotationStr = subAssemConfig.rotation;
    const subAssem = Assembly.new(type, subAssemConfig.code, name, centerStr, demStr, rotationStr);
    subAssem.partCode(subAssemConfig.code);
    cabinet.addSubAssembly(subAssem);
  });

  const joinRelations = Object.keys(config.joints);
  joinRelations.forEach((relation) => {
    relationConfig = config.joints[relation];
    const type = relationConfig.type;
    const depth = relationConfig.depth;
    const demensionToOffset = relationConfig.DemensionToOffset;
    const centerOffset = relationConfig.centerOffset;
    const joint = Joint.new(type, relation, depth, demensionToOffset, centerOffset);
    cabinet.addJoints(joint);
  });

  config.bordersIdMap.forEach((idMap) => {
    const divideSection = new DivideSection(cabinet.borders(idMap), cabinet);
    cabinet.openings.push(divideSection);
    cabinet.addSubAssembly(divideSection);
  });
  return cabinet;
}

Cabinet.fromJson = (assemblyJson) => {
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = new Cabinet(partCode, partName);
  assembly.propertyConfig = assemblyJson.propertyConfig;
  assembly.uniqueId(assemblyJson.uniqueId);
  assembly.values = assemblyJson.values;
  Object.values(assemblyJson.subAssemblies).forEach((json) => {
    const clazz = Assembly.class(json._TYPE);
    json.parent = assembly;
    if (clazz !== DivideSection) {
      assembly.addSubAssembly(Object.fromJson(json));
    } else {
      const divideSection = clazz.fromJson(json, assembly);
      assembly.openings.push(divideSection);
      assembly.addSubAssembly(divideSection);
    }
  });
  assembly.name(assemblyJson.name);
  assembly.length(assemblyJson.length);
  assembly.width(assemblyJson.width);
  assembly.thickness(assemblyJson.thickness);
  return assembly;
}
Cabinet.abbriviation = 'c';

// Cabinet.partCode = (assembly) => {
//   const cabinet = assembly.getAssembly('c');
//   if (cabinet) {
//     const name = assembly.constructor.name;
//     cabinet.partIndex = cabinet.partIndex || 0;
//     return `${assembly.constructor.abbriviation}-${cabinet.partIndex++}`;
//   }
// }


module.exports = Cabinet
