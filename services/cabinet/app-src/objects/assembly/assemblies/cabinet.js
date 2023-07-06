


const Assembly = require('../assembly.js');
const cabinetBuildConfig = require('../../../../public/json/cabinets.json');
const Joint = require('../../joint/joint.js');
const CabinetOpeningCorrdinates = require('../../../services/cabinet-opening-coordinates.js');
const SectionProperties = require('./section/section-properties.js');
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Group = require('../../group');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex');
const Vertex3D = require('../../../three-d/objects/vertex.js');
const Line3D = require('../../../three-d/objects/line.js');
const CSG = require('../../../../public/js/3d-modeling/csg.js');
const AutoToekick = require('./auto/toekick.js');

const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

class Cabinet extends Assembly {
  constructor(partCode, partName) {
    super(partCode, partName);
    // Object.getSet(this, {_DO_NOT_OVERWRITE: true}, 'length', 'width', 'thickness');
    Object.getSet(this, 'propertyId', 'name', 'currentPosition', 'autoToeKick');
    const instance = this;
    let toeKickHeight = 4;
    this.part = false;
    this.currentPosition = () => this.position().current();
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
      if (propConfig.isReveal()) {
        calculatedValue = panel.railThickness() - propConfig.reveal();
      } else {
        calculatedValue = propConfig.overlay();
      }
      return calculatedValue < definedValue ? calculatedValue : definedValue;
    }

    const parentGetSubAssems = this.getSubassemblies;
    let toeKick;
    this.getSubassemblies = () => {
      const subs = parentGetSubAssems();
      if (this.autoToeKick()) {
        if (toeKick === undefined) toeKick = new AutoToekick(this);
        subs.concatInPlace(toeKick.getSubassemblies());
        return subs.concat(toeKick);
      }
      return subs;
    }

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
      return keys.filter(str => !valueObj[str].match(/[a-zA-Z]/))
                  .map(str => ({key: str, value: this.eval(valueObj[str])}));
    }

    this.modifiableString = () => {
      const keys = Object.values(this.modifiableValues());
      return keys.map(obj => `${obj.key}=${obj.value}`).join();
    }

    // TODO: ???? It is possible to have inner/outer intersections from
    //       different parts..... not suure its worth the extra calculations
    this.planeIntersection = (line) => {
      const center = this.partCenter();
      const vector = line.vector();
      let closest = {};
      const subAssems = Object.values(this.subassemblies);
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        if ((typeof assem.position) === 'function') {
          const biPoly = assem.position().toBiPolygon();
          const faces = biPoly.closestOrder(center);
          const plane = faces[0].toPlane();
          const intersection = plane.intersection.line(line);
          if (intersection) {
            const dist = line.midpoint().distance(intersection);
            const intersectLine = new Line3D(line.midpoint(), intersection);
            const intersectVector = intersectLine.vector();
            const direction = vector.sameDirection(intersectVector) ? 'positive' : 'negitive';
            if (closest[direction] === undefined || closest[direction].inner.dist > dist) {
              const oplane = faces[1].toPlane();
              plane.intersection.line(line)
              const ointer = oplane.intersection.line(line);
              const odist = ointer.distance(line.midpoint());
              closest[direction] = {assem, inner: {dist, plane, intersection},
              outer: {dist: odist, plane: oplane, intersection: ointer}};
            };
          }
        }
      }
      return closest;
    }

    function bordersByIds(borderIds) {
      const borders = {};
      const center = borderIds.center;
      borders.right = instance.getAssembly(borderIds.right);
      borders.left = instance.getAssembly(borderIds.left);
      borders.top = instance.getAssembly(borderIds.top);
      borders.bottom = instance.getAssembly(borderIds.bottom);

      const pb = instance.getAssembly(borderIds.back);

      return () => {
        const depth = pb.position().center('z') + pb.position().limits('-z');

        const position = {};
        const propConfig = instance.propertyConfig();
        if (propConfig.isReveal()) {
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

        return {borders, position, depth, borderIds, center};
      }
    }

    function bordersByEndPoints (borderObj) {
      const bo = borderObj;

      return () => {
        const rotation = {x: 0, z: 0, y: instance.eval(borderObj.zRotation)};
        let evaluated;

        let points;
        const propConfig = instance.propertyConfig();
        if (propConfig.isReveal()) {
          points = instance.evalObject(bo.outer);
        } else {
          points = instance.evalObject(bo.inner);
        }

        const pointArr = [points.top.left, points.top.right, points.bottom.right, points.bottom.left];
        let center = Vertex3D.center.apply(null, pointArr);
        // CSG.rotatePointsAroundCenter(rotation, pointArr, center, true);

        const width = new Vertex3D(points.top.left).distance(new Vertex3D(points.top.right));
        const length = new Vertex3D(points.bottom.left).distance(new Vertex3D(points.top.left));

        //TODO: calculate real value;
        const depth = 20 * 2.54;

        const position = {};
        if (propConfig.isReveal()) {
          const revealProps = propConfig.reveal();
          position.right = center.x + width/2 - revealProps.rvr.value();
          position.left = center.x - width/2 + revealProps.rvl.value();
          position.top = center.y + length/2 - revealProps.rvt.value();
          position.bottom = center.y - length/2 + revealProps.rvb.value();
        } else if (propConfig.isInset()) {
          const insetValue = propConfig('Inset').is.value();
          position.right = center.x + width/2 - insetValue;
          position.left = center.x - width/2 + insetValue;
          position.top = center.y + length/2 - insetValue;
          position.bottom = center.y - length/2 + insetValue;
        } else {
          const ov = propConfig('Overlay').ov.value();
          position.right = center.x + width/2 + ov;;
          position.left = center.x - width/2 - ov;
          position.top = center.y + length/2 + ov;
          position.bottom = center.y - length/2 - ov;
        }

        return {position, depth, center, rotation};
      }
    }

    this.index = () => {
      const group = this.group();
      return `${group.name()}-${group.objects.equalIndexOf(this)}`;
    }

    this.borders = (borderObj) => {
      if (borderObj.inner) return bordersByEndPoints(borderObj);
      return bordersByIds(borderObj);
    }

    function updateOpeningPoints(func, test) {
      return (...args) => {
        const shouldUpdate = test && test(...args);
        const value = func(...args);
        if (shouldUpdate) instance.updateOpenings();
        return value;
      }
    }

    this.updateOpenings = () => {
      for (let index = 0; index < this.openings.length; index++) {
        this.openings[index].update();
      }
    };

    this.normals = () => {
      const normals = [];
      for (let index = 0; index < this.openings.length; index++) {
        normals.push(this.openings[index].normal());
      }
      return normals;
    }

    this.width = updateOpeningPoints(this.width, (w) => w && this.width() !== w);
    this.length = updateOpeningPoints(this.length, (l) => l && this.length() !== l);
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

  config.subassemblies.forEach((subAssemConfig) => {
    const type = subAssemConfig.type;
    const name = subAssemConfig.name;
    const demStr = subAssemConfig.demensions.join(':');
    const centerConfig = subAssemConfig.center.join(':');
    const rotationConfig = subAssemConfig.rotation.join(':');
    const subAssem = Assembly.new(type, subAssemConfig.code, name, centerConfig, demStr, rotationConfig);
    subAssem.partCode(subAssemConfig.code);
    cabinet.addSubAssembly(subAssem);
  });

  config.joints.forEach((relationConfig) => {
    cabinet.addJoints(Object.fromJson(relationConfig));
  });

  config.openings.forEach((config, i) => {
    const sectionProperties = new SectionProperties(config, i);
    const cabOpenCoords = new CabinetOpeningCorrdinates(cabinet, sectionProperties);
    cabinet.openings.push(cabOpenCoords);
    cabinet.addSubAssembly(sectionProperties);
    cabOpenCoords.update();
  });
  return cabinet;
}

Cabinet.fromJson = (assemblyJson, group) => {
  group ||= new Group();
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const pos = assemblyJson.currentPosition;
  const assembly = new Cabinet(partCode, partName);
  assembly.name(assemblyJson.name);
  assembly.length(pos.demension.y);
  assembly.width(pos.demension.x);
  assembly.group(group);
  assembly.id(assemblyJson.id);
  assembly.value.all(assemblyJson.value.values);
  Object.values(assemblyJson.subassemblies).forEach((json) => {
    const clazz = Assembly.class(json._TYPE);
    json.parent = assembly;
    if (clazz !== SectionProperties) {
      assembly.addSubAssembly(Object.fromJson(json));
    } else {
      const sectionProperties = clazz.fromJson(json, assembly);
      const openingCoords = new CabinetOpeningCorrdinates(assembly, sectionProperties);
      openingCoords.update();
      assembly.openings.push(openingCoords);
      assembly.addSubAssembly(sectionProperties);
    }
  });
  assembly.thickness(pos.demension.z);
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addJoints.apply(assembly, joints);
  assembly.position().setCenter(pos.center);
  assembly.position().setRotation(pos.rotation)
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
