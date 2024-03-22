


const Assembly = require('../assembly.js');
const cabinetBuildConfig = require('../../../../public/json/cabinets.json');
const Joint = require('../../joint/joint.js');
const Dependency = require('../../dependency');
const CabinetOpeningCorrdinates = require('../../../services/cabinet-opening-coordinates.js');
const SectionProperties = require('./section/section-properties.js');
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Group = require('../../group');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex');
const Vertex3D = require('../../../three-d/objects/vertex.js');
const Vector3D = require('../../../three-d/objects/vector.js');
const Line3D = require('../../../three-d/objects/line.js');
const CSG = require('../../../../../../public/js/utils/3d-modeling/csg.js');
const AutoToekick = require('./auto/toekick.js');
const Notifiction = require('../../../../../../public/js/utils/collections/notification.js');
const NotifictionArray = Notifiction.Array;

const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

class Cabinet extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, 'Simple', config);
    // Object.getSet(this, {_DO_NOT_OVERWRITE: true}, 'length', 'width', 'thickness');
    Object.getSet(this, 'propertyId', 'name', 'currentPosition', 'autoToeKick', 'dividerJoint');
    const instance = this;
    let toeKickHeight = 4;
    this.includeJoints(false);
    this.part = () => false;
    this.currentPosition = () => this.position().current();
    this.display = false;
    this.overlay = OVERLAY.HALF;
    this.openings = new NotifictionArray(false);
    this.type = CABINET_TYPE.FRAMED;

    this.faceNormals = () => this.openings.map(o => o.sectionProperties().normal())

    let name;
    this.name = (value) => {
      const group = this.group();
      if (value) {
        const list = group && group.objects ? group.objects : [];
        name =  list.map(g => g.name()).uniqueStringValue(value);
      }
      return name;
    }


    const parentUserFriendlyId = this.userFriendlyId;
    this.userFriendlyId = (id) => id === undefined ? `c${this.groupIndex() + 1}` : parentUserFriendlyId(id);
    this.userIdentifier = () => {
      const groupPrefix = this.group().room().groups.length > 1 ? `${this.group().name()}:` : '';
      return `${groupPrefix}${this.name() || this.userFriendlyId()}`;
    }
    const panels = 0;
    const framePieces = 0;
    const addFramePiece = (piece) => framePieces.push(piece);
    const framePieceCount = () => pieces.length;
    const addPanel = (panel) => panels.push(panel);
    const panelCount = () => panels.length;

    const parentGetSubAssems = this.getSubassemblies;
    let toeKick;
    const getToeKick = () => {
      if (!this.autoToeKick()) return undefined;
      if (toeKick === undefined) toeKick = new AutoToekick(this);
      return toeKick;
    }

    this.getSubassemblies = (childrenOnly) => {
      const subs = parentGetSubAssems(childrenOnly).map(sa => sa);
      const toeKick = getToeKick();
      if (toeKick) {
        subs.push(toeKick);
        if (!childrenOnly) subs.concatInPlace(toeKick.getSubassemblies());
        return subs;
      }
      return subs;
    }

    const parentAllAssems = this.allAssemblies;
    this.allAssemblies = () =>
      parentAllAssems().concat(this.openings);

    this.partCenter = () => {
      const centers = [];
      const subAssems = Object.values(this.subassemblies);
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        if (!(assem instanceof SectionProperties))
          centers.push(assem.position().center());
      }
      return Vertex3D.center(...centers);
    }

    this.modifiableValues = () => {
      const valueObj = this.value.values;
      const keys = Object.keys(valueObj);
      return keys.filter(key => {
        const value = valueObj[key];
        return value.match instanceof Function && !value.match(/[a-zA-Z]/);
      }).map(str => ({key: str, value: this.eval(valueObj[str])}));
    }

    let modificationState = 0;
    this.modificationState = () =>
      modificationState;
    this.value.onChange(() => modificationState++);


    const pAddSubAssem = this.addSubAssembly;
    this.addSubAssembly = (assembly) => {
      pAddSubAssem(assembly);
      this.addDependencies(new Dependency(assembly, this));
      const simplePart = assembly.constructor.name.match(/Frame|Panel/);
      if (simplePart) {
        this.addDependencies(new Joint(/.*S1:.*[^a-z^A-Z]dv:.*/, assembly));
      }
    }


    this.groupIndex = () => {
      const group = this.group();
      const gIndex = group.objects.equalIndexOf(this);
      if (gIndex === -1) return 1;
      return gIndex;
    }

    const parentHash = this.hash;
    this.hash = () => {
      return parentHash() + this.openings.map(o => o.sectionProperties().hash()).sum();
    }


    let openingModState;
    function updateOpeningPoints(func, test, isLen) {
      const shouldTest = test instanceof Function;
      return (...args) => {
        if (shouldTest && test(...args)) {
          modificationState++;
          let value = func(...args);
          instance.updateOpenings(true);
          instance.hash();
          return value;
        }
        return func(...args);
      }
    }

    let lastCallId = 0;
    function updateOpenings(callId) {
      if (callId === lastCallId) {
        for (let index = 0; index < instance.openings.length; index++) {
          instance.openings[index].update();
        }
        const toeKick = getToeKick();
        if(toeKick) toeKick.update();
      }
    }
    this.updateOpenings = (force) => {
      const callId = ++lastCallId;
      force ? updateOpenings(callId) : setTimeout(() => updateOpenings(callId), 50);
    };

    // this.faceNormals = () => {
    //   const normals = [];
    //   for (let index = 0; index < this.openings.length; index++) {
    //     normals.push(this.openings[index].normal());
    //   }
    //   return normals;
    // }
    this.normals = (array) => {
      if (this.openings.length === 0) return;
      const normObj = {};
      normObj.y = new Vector3D(0,1,0);
      normObj.x = this.openings[0].normal();
      normObj.z = normObj.x.crossProduct(normObj.y);
      return array ? [normObj.x, normObj.y, normObj.z] : normObj;
    }

    this.width = updateOpeningPoints(this.width, (w) => w && this.width() !== w);
    this.length = updateOpeningPoints(this.length, (l) => l && this.length() !== l, true);
    this.thickness = updateOpeningPoints(this.thickness, (t) => t && this.thickness() !== t);
  }
}

Cabinet.build = (type, group, config) => {
  group ||= new Group();
  const cabinet = new Cabinet('c', type);
  cabinet.group(group);
  config ||= cabinetBuildConfig[type];
  cabinet.autoToeKick(config.autoToeKick);
  cabinet.length(config.height);
  cabinet.width(config.width);
  cabinet.thickness(config.thickness);
  cabinet.position().setCenter('y', config.fromFloor);
  config.values.forEach((value) => cabinet.value(value.key, value.eqn));
  cabinet.value('dividerJoint', Object.fromJson(config.dividerJoint));

  config.subassemblies.forEach((subAssemConfig) => {
    const type = subAssemConfig.type;
    const name = subAssemConfig.name;
    const posConfig = {
      demension: subAssemConfig.demensions.join(':'),
      center: subAssemConfig.center.join(':'),
      rotation: subAssemConfig.rotation.join(':')
    }
    const subAssem = Assembly.new(type, subAssemConfig.code, name, posConfig);
    // TODO: This should use Object.fromJson so more complex objects can easily save/load values.
    if (subAssem.jointSetIndex) {
      subAssem.jointSetIndex(subAssemConfig.jointSetIndex);
      subAssem.includedSides(subAssemConfig.includedSides);
    }
    subAssem.partCode(subAssemConfig.code);
    cabinet.addSubAssembly(subAssem);
    cabinet.trigger.change();
  });

  config.joints.forEach((jointConfig) => {
    const male = cabinet.getAssembly(jointConfig.dependsSelector);
    if (male === undefined) console.warn(`No male found for joint: ${jointConfig}`);
    else male.addDependencies(Object.fromJson(jointConfig));
  });

  config.openings.forEach((config, i) => {
    const sectionProperties = new SectionProperties(config, i + 1);
    const cabOpenCoords = new CabinetOpeningCorrdinates(cabinet, sectionProperties);
    cabinet.openings.push(cabOpenCoords);
    cabinet.addSubAssembly(sectionProperties);
    cabOpenCoords.update();
  });
  config.subassemblies.filter(sac => sac.dividerType).forEach((sac) =>
      cabinet.subassemblies[sac.code].type(sac.dividerType));
  cabinet.updateOpenings(true);
  return cabinet;
}

const addSectionProps = (sectionProperties, assembly) => () => {
  const openingCoords = new CabinetOpeningCorrdinates(assembly, sectionProperties);
  assembly.openings.push(openingCoords);
  openingCoords.update();
  assembly.addSubAssembly(sectionProperties);
}

Cabinet.fromJson = (assemblyJson, group) => {
  const trigger = Function.event('constructed', assemblyJson, (o) => o._TYPE);
  group ||= new Group();
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = new Cabinet(partCode, partName, assemblyJson.config);
  assembly.name(assemblyJson.name);
  assembly.group(group);
  assembly.id(assemblyJson.id);
  assembly.value.all(Object.fromJson(assemblyJson.value.values));
  Object.values(assemblyJson.subassemblies).forEach((json) => {
    const clazz = Assembly.class(json._TYPE);
    json.parent = assembly;
    if (clazz !== SectionProperties) {
      assembly.addSubAssembly(Object.fromJson(json));
    } else {
      assemblyJson.constructed(addSectionProps(clazz.fromJson(json, assembly), assembly));
    }
  });
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addDependencies.apply(assembly, joints);
  assembly.autoToeKick(assemblyJson.autoToeKick);

  trigger();
  assembly.trigger.change();
  return assembly;
}
Cabinet.abbriviation = 'c';

function getIntersectPoint(line, centerLine, right, dist, gap, noneAdjacent) {
  if (noneAdjacent) {
    if (right)
      return centerLine.endVertex();
    return centerLine.startVertex();
  }
  const parr = line.parrelle(dist);
  if (line.isParrelle(centerLine)) {
    if (right)
      return parr.trimmed(gap/2).startVertex();
    return parr.trimmed(gap/-2).endVertex();
  }
  return centerLine.findIntersection(parr);
}

// document location /cabinet/html/docs/door-intersect-diagram.html
function doorIntersect(llp, lcp, rcp, rrp, ld, cd, rd, gap, padOffset) {
  padOffset ||= 0;
  const LL = new Line2d(llp, lcp);
  const CL = new Line2d(lcp, rcp);
  const RL = new Line2d(rcp, rrp);

  const CLFP = CL.parrelle(cd + padOffset);

  const cxlp = getIntersectPoint(LL, CLFP, false, ld + padOffset, gap, !llp);
  const cxrp = getIntersectPoint(RL, CLFP, true, rd + padOffset, gap, !rrp);

  const centerFrontTrimmed = new Line2d(cxlp, cxrp).trimmed(gap, true);
  const centerBackTrimmed = centerFrontTrimmed.parrelle(-1 * cd);
  const tsp = centerFrontTrimmed.startVertex();
  const tep = centerFrontTrimmed.endVertex();
  const clrs = CL.closestPointOnLine(tsp);
  const crrs = CL.closestPointOnLine(tep);

  const centerRightSide = new Line2d(crrs, tep);
  const centerLeftSide = new Line2d(clrs, tsp);

  const info = {center: {left: {}, right: {}}, left: {}, right: {}};


  info.center.center = Vertex2d.center(tsp, tep, centerBackTrimmed.startVertex(), centerBackTrimmed.endVertex());
  info.center.length = centerFrontTrimmed.length();
  info.center.left.reveal = clrs.distance(lcp) * (CL.isOn(clrs) ? 1 : -1);
  info.center.right.reveal = crrs.distance(rcp) * (CL.isOn(crrs) ? 1 : -1);

  if (rrp){
    const rrsp = RL.closestPointOnLine(cxrp);
    const rightSide = new Line2d(rrsp, cxrp);
    const rightGapTheta = CL.thetaBetween(RL);
    const rightGapLine = Line2d.startAndTheta(rcp, CL.negitive().radians() + rightGapTheta / 2);
    info.right.reveal = rrsp.distance(rcp) * (RL.isOn(rrsp) ? 1 : -1);
    if (rightGapTheta > Math.PI) {
      info.right.theta = rightGapLine.thetaBetween(rightSide);
      info.center.right.theta = centerRightSide.thetaBetween(rightGapLine);
    } else if (info.center.right.reveal < 0) {
      //For meeting walls or other flat surfaces
      info.center.right.theta = centerRightSide.thetaBetween(RL);
    }
  }

  if (llp) {
    const lrsp = LL.closestPointOnLine(cxlp);
    info.left.reveal = lrsp.distance(lcp) * (LL.isOn(lrsp) ? 1 : -1);
    const leftGapTheta = LL.thetaBetween(CL);
    if (leftGapTheta > Math.PI) {
      const leftSide = new Line2d(lrsp, cxlp);
      const leftGapLine = Line2d.startAndTheta(rcp, CL.radians() - leftGapTheta / 2);
      info.left.theta = leftSide.thetaBetween(leftGapLine);
      info.center.left.theta = leftGapLine.thetaBetween(centerLeftSide);
    } else if (info.center.left.reveal < 0) {
      //For meeting walls or other flat surfaces
      info.center.left.theta = LL.thetaBetween(centerRightSide);
    }
  }

  return info;
}

Cabinet.doorIntersect = doorIntersect;

module.exports = Cabinet
