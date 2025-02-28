


const Assembly = require('../assembly.js');
const cabinetBuildConfig = require('../../../../public/json/cabinets/construction.json');
const Joint = require('../../joint/joint.js');
const JointSettings = require('../../../../web-worker/shared/settings.js');
const Dependency = require('../../dependency');
const CabinetOpeningCorrdinates = require('../../../services/cabinet-opening-coordinates.js');
const SectionProperties = require('./section/section-properties.js');
const Group = require('../../group');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex');

const {Vertex3D, Vector3D, Line3D} = require('../../../../../../public/js/utils/canvas/three-d/lib');

const CSG = require('../../../../../../public/js/utils/3d-modeling/csg.js');
const AutoToekick = require('./auto/toekick.js');
const CabinetResolver = require('../resolvers/cabinet');
const Notifiction = require('../../../../../../public/js/utils/collections/notification.js');
const NotifictionArray = Notifiction.Array;
const CustomEvent = require('../../../../../../public/js/utils/custom-event');

const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

class Cabinet extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    new CabinetResolver(this);
    // Object.getSet(this, {_DO_NOT_OVERWRITE: true}, 'length', 'width', 'thickness');
    Object.getSet(this, 'propertyId','currentPosition', 'autoToeKick',
                    'dividerJoint', 'sectionProperties');

    // TODO: this is stupid id needs to be added to toJson however getter/setter should not change...
    const idFunc = this.id;
    const id = this.id();
    Object.getSet(this, {id});
    this.id = idFunc;

    const instance = this;
    let toeKickHeight = 4;
    this.jointSettings = new JointSettings(false,false,false,false);
    this.part = () => false;
    this.currentPosition = () => this.position().current();
    this.display = false;
    this.overlay = OVERLAY.HALF;
    this.type = CABINET_TYPE.FRAMED;
    this.openings = new NotifictionArray(false);

    this.sectionProperties = () => this.openings.map(o => o.sectionProperties());

    this.faceNormals = () => this.openings.map(o => o.sectionProperties().normal())

    const parentUserFriendlyId = this.userFriendlyId;

    const parentGetSubAssems = this.getSubassemblies;
    let toeKick, autoToeKick;
    this.autoToeKick = (tf) => {
      if (tf === true) {
        if (toeKick === undefined) toeKick = new AutoToekick(this);
        autoToeKick = true;
      } else if (tf === false) autoToeKick = false;
      return autoToeKick;
    }
    const getToeKick = () => {
      if (!this.autoToeKick()) return undefined;
      return toeKick;
    }

    this.getSubassemblies = (childrenOnly) => {
      const subs = parentGetSubAssems(childrenOnly).map(sa => sa);
      subs.concatInPlace(this.openings.map(o => o.sectionProperties()));
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

    let modificationState = 0;
    this.modificationState = () =>
      modificationState;
    this.value.on.change(() => modificationState++);
    this.on.processing((job) =>
      Global.trigger.processing.cabinet(job, this));


    const pAddSubAssem = this.addSubAssembly;
    this.addSubAssembly = (assembly) => {
      // if (assembly.constructor.name === 'Divider')  {
      //   const sec
      // }
      pAddSubAssem(assembly);
      this.addDependencies(new Dependency(assembly, this));
      const simplePart = assembly.constructor.name.match(/Frame|Panel/);
      if (simplePart) {
        this.addDependencies(new Joint(/.*S:.*[^a-z^A-Z]dv:.*/, assembly, null, assembly.id()));
      }
    }


    const parentHash = this.hash;
    let initialized = false;
    this.hash = () => {
      if (!initialized) this.updateOpenings(initialized = true);
      return parentHash() + Math.hash(...this.openings.map(o => o.sectionProperties().hash()));
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
      const mainOpening = this.openings[0];
      const secProps = mainOpening.sectionProperties();
      normObj.y = new Vector3D(0,1,0);
      normObj.z = mainOpening.normal();
      normObj.x = normObj.z.crossProduct(normObj.y).inverse();
      const center = this.buildCenter();
      const outerCenter = mainOpening.sectionProperties().outer.center();
      const rightCenter = secProps.right().position().center();
      if (center.distance(rightCenter) < center.translate(normObj.x, true).distance(rightCenter))
        normObj.x = normObj.x.inverse();
      if (center.distance(outerCenter) < center.translate(normObj.z, true).distance(outerCenter))
        normObj.z = normObj.z.inverse();


      return array ? [normObj.x, normObj.y, normObj.z] : normObj;
    }

    this.width = updateOpeningPoints(this.width, (w) => w && this.width() !== w);
    this.length = updateOpeningPoints(this.length, (l) => l && this.length() !== l, true);
    this.thickness = updateOpeningPoints(this.thickness, (t) => t && this.thickness() !== t);

    this.on.change(Cabinet.trigger.change);
  }
}

const linkSectionsToDividers = (assembly) => {
  const sections = assembly.children().filter(a => a.id().startsWith('SectionProperties'));
  sections.forEach(s => s.borders().forEach(b => {
    const border = b();
    if (border.sectionProperties) border.sectionProperties.add(s);
  }));
}

Cabinet.build = (type, group, config) => {
  const cabinet = Assembly.build(type, group, config, new Cabinet('c', type));
  config ||= cabinetBuildConfig[type];


  config.openings.forEach((config, i) => {
    const sectionProperties = new SectionProperties(config, i + 1);
    sectionProperties.name(config.name);
    const cabOpenCoords = new CabinetOpeningCorrdinates(cabinet, sectionProperties);
    cabinet.openings.push(cabOpenCoords);
    sectionProperties.parentAssembly(cabinet);
    cabOpenCoords.update();
  });
  config.subassemblies.filter(sac => sac.dividerType).forEach((sac) =>
      cabinet.subassemblies[sac.code].type(sac.dividerType));
  cabinet.updateOpenings(true);
  cabinet.autoToeKick(config.autoToeKick);
  return cabinet;
}

const addSectionProps = (sectionProperties, assembly) => () => {
  const openingCoords = new CabinetOpeningCorrdinates(assembly, sectionProperties);
  assembly.openings.push(openingCoords);
  openingCoords.update();
  sectionProperties.parentAssembly(assembly);
}

Cabinet.fromJson = (assemblyJson) => {
  const trigger = Function.event('constructed', assemblyJson, (o) => o._TYPE);
  const group = assemblyJson.group || new Group();
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = new Cabinet(partCode, partName, assemblyJson.config);
  assembly.name(assemblyJson.name);
  assembly.group(group);
  assembly.id(assemblyJson.id);
  assembly.notes(assemblyJson.notes);
  assembly.value.all(Object.fromJson(assemblyJson.value.values));
  Object.values(assemblyJson.subassemblies).forEach((json) => {
    const clazz = Assembly.class(json._TYPE);
    json.parent = assembly;
    assembly.addSubAssembly(Object.fromJson(json));
  });
  assemblyJson.sectionProperties.forEach(json => {
    const clazz = Assembly.class(json._TYPE);
    json.parent = assembly;
    assemblyJson.constructed(addSectionProps(clazz.fromJson(json, assembly), assembly));
  });
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addDependencies.apply(assembly, joints);
  assembly.autoToeKick(assemblyJson.autoToeKick);
  trigger();
  assembly.trigger.change();
  linkSectionsToDividers(assembly);
  return assembly;
}

function getIntersectPoint(line, centerLine, right, dist, gap, noneAdjacent) {
  if (noneAdjacent) {
    if (right)
      return centerLine[1];
    return centerLine[0];
  }
  const parr = line.parrelle(dist);
  if (line.isParrelle(centerLine)) {
    if (right)
      return parr.trimmed(gap/2)[0];
    return parr.trimmed(gap/-2)[1];
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
  const tsp = centerFrontTrimmed[0];
  const tep = centerFrontTrimmed[1];
  const clrs = CL.closestPointOnLine(tsp);
  const crrs = CL.closestPointOnLine(tep);

  const centerRightSide = new Line2d(crrs, tep);
  const centerLeftSide = new Line2d(clrs, tsp);

  const info = {center: {left: {}, right: {}}, left: {}, right: {}};


  info.center.center = Vertex2d.center(tsp, tep, centerBackTrimmed[0], centerBackTrimmed[1]);
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
