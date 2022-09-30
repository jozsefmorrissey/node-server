


const Assembly = require('../assembly.js');
const cabinetBuildConfig = require('../../../../public/json/cabinets.json');
const Joint = require('../../joint/joint.js');
const DivideSection = require('./section/space/sections/divide-section.js');
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const PropertyConfig = require('../../../config/property/config.js');
const Group = require('../../group');

const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

class Cabinet extends Assembly {
  constructor(partCode, partName) {
    super(partCode, partName);
    Object.getSet(this, {_DO_NOT_OVERWRITE: true}, 'length', 'width', 'thickness');
    Object.getSet(this, 'propertyId', 'name');
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
      const propConfig = this.propertyConfig();
      if (propConfig.isInset()) {
        return new Measurement(-1 * props.Inset.is.value()).value();
      }
      const definedValue = panel.railThickness() - panel.value(location);
      let calculatedValue;
      if (propConfig.isRevealOverlay()) {
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
        const propConfig = this.propertyConfig();
        if (propConfig.isRevealOverlay()) {
          const revealProps = propConfig.reveal();
          position.right = borders.right.position().centerAdjust('x', '+z') - revealProps.rvr.value();
          position.left = borders.left.position().centerAdjust('x', '-z') + revealProps.rvl.value();
          position.top = borders.top.position().centerAdjust('y', '+z') - revealProps.rvt.value();
          position.bottom = borders.bottom.position().centerAdjust('y', '-z') + revealProps.rvb.value();
        } else if (propConfig.isInset()) {
          const insetValue = propConfig('Inset').is.value();
          position.right = borders.right.position().centerAdjust('x', '-z') - insetValue;
          position.left = borders.left.position().centerAdjust('x', '+z') + insetValue;
          position.top = borders.top.position().centerAdjust('y', '-z') - insetValue;
          position.bottom = borders.bottom.position().centerAdjust('y', '+z') + insetValue;
        } else {
          const ov = propConfig('Overlay').ov.value();
          position.right = borders.right.position().centerAdjust('x', '-z') + ov;;
          position.left = borders.left.position().centerAdjust('x', '+z') - ov;
          position.top = borders.top.position().centerAdjust('y', '-z') + ov;
          position.bottom = borders.bottom.position().centerAdjust('y', '+z') - ov;
        }

        position.front = 0;
        position.back = pb.position().center('z') + pb.position().limits('-z');

        return {borders, position, depth, borderIds};
      }
    }
  }
}

Cabinet.build = (type, group, config) => {
  group ||= new Group();
  const cabinet = new Cabinet('c', type);
  cabinet.group(group);
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
  group ||= new Group();
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = new Cabinet(partCode, partName);
  assembly.name(assemblyJson.name);
  assembly.length(assemblyJson.length);
  assembly.width(assemblyJson.width);
  assembly.group(group);
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
