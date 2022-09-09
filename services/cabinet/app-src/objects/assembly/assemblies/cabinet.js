


const Assembly = require('../assembly.js');
const cabinetBuildConfig = require('../../../../public/json/cabinets.json');
const Joint = require('../../joint/joint.js');
const DivideSection = require('./section/space/sections/divide-section.js');
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const PropertyConfig = require('../../../config/property/config.js');

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

    const resolveOuterReveal = (panel, location) => {
      const propConfig = this.rootAssembly().propertyConfig;
      if (propConfig.isInset()) {
        return new Measurement(-1 * props.Inset.is.value()).value();
      }
      const definedValue = panel.railThickness() - panel.value(location);
      let calculatedValue;
      if (this.rootAssembly().propertyConfig.isRevealOverlay()) {
        calculatedValue = panel.railThickness() - propConfig.reveal();
      } else {
        calculatedValue = propConfig.overlay();
      }
      return calculatedValue < definedValue ? calculatedValue : definedValue;
    }

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
        // TODO: hard coded orientation logic.... make dynamic???...
        const jointOffset = 0.9525;
        if (this.propertyConfig.isRevealOverlay() || this.propertyConfig.isInset()) {
          position.right = borders.right.position().centerAdjust('x', '-z');
          position.left = borders.left.position().centerAdjust('x', '+z');
          position.top = borders.top.position().centerAdjust('y', '-z');
          position.bottom = borders.bottom.position().centerAdjust('y', '+z');
        } else {
          position.right = borders.right.position().centerAdjust('x', '-z');
          position.left = borders.left.position().centerAdjust('x', '+z');
          position.top = borders.top.position().centerAdjust('y', '-z');
          position.bottom = borders.bottom.position().centerAdjust('y', '+z');
        }

        // position.right += resolveOuterReveal(borders.right, 'rrv');
        // position.left -= resolveOuterReveal(borders.left, 'lrv')
        // position.top += resolveOuterReveal(borders.top, 'trv');
        // position.bottom -= resolveOuterReveal(borders.bottom, 'brv');

        position.front = 0;
        position.back = pb.position().center('z') + pb.position().limits('-z');

        return {borders, position, depth, borderIds};
      }
    }
  }
}

Cabinet.build = (type, group, config) => {
  const cabinet = new Cabinet('c', type);
  cabinet.propertyConfig = group && group.propertyConfig ?
                            group.propertyConfig : new PropertyConfig();
  if (group) group.propertyConfig = cabinet.propertyConfig;
  config ||= cabinetBuildConfig[type];
  config.values.forEach((value) => cabinet.value(value.key, value.eqn));

  config.subassemblies.forEach((subAssemConfig) => {
    const type = subAssemConfig.type;
    const name = subAssemConfig.name;
    const demStr = subAssemConfig.demensions.join(',');
    const centerStr = subAssemConfig.center.join(',');
    const rotationStr = subAssemConfig.rotation.join(',');
    const subAssem = Assembly.new(type, subAssemConfig.code, name, centerStr, demStr, rotationStr);
    subAssem.partCode(subAssemConfig.code);
    cabinet.addSubAssembly(subAssem);
  });

  config.joints.forEach((relationConfig) => {
    const type = relationConfig.type;
    const depth = relationConfig.depth;
    const demensionToOffset = relationConfig.demensionToOffset;
    const centerOffset = relationConfig.centerOffset;
    const joint = Joint.new(type, relationConfig);
    cabinet.addJoints(joint);
  });

  config.openings.forEach((idMap) => {
    const divideSection = new DivideSection(cabinet.borders(idMap), cabinet);
    cabinet.openings.push(divideSection);
    cabinet.addSubAssembly(divideSection);
  });
  return cabinet;
}

Cabinet.fromJson = (assemblyJson, group) => {
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = new Cabinet(partCode, partName);
  assembly.name(assemblyJson.name);
  assembly.length(assemblyJson.length);
  assembly.width(assemblyJson.width);
  assembly.propertyConfig = group.propertyConfig;
  assembly.uniqueId(assemblyJson.uniqueId);
  assembly.values = assemblyJson.values;
  Object.values(assemblyJson.subassemblies).forEach((json) => {
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
  assembly.thickness(assemblyJson.thickness);
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addJoints.apply(assembly, joints);
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
