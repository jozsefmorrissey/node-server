
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Vector3D = require('../../../three-d/objects/vector.js');
const Vertex3D = require('../../../three-d/objects/vertex.js');
const Line3D = require('../../../three-d/objects/line.js');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Tolerance = require('../../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../../public/js/utils/tolerance-map.js');
const within = Tolerance.within(.0001);
const $t = require('../../../../../../public/js/utils/$t.js');
const EPNTS = require('../../../../generated/EPNTS.js');

class CutInfo {
  constructor(set, jointInfo, maleModel) {
    let instance = this;
    this.jointInfo = () => jointInfo;
    this.set = () => set;
    this.normalize = jointInfo.partInfo().normalize;
    this.primarySide = jointInfo.partInfo().primarySide;
    this.toolType = () => 'tableSaw';
    this.intersectModel = () => (maleModel === undefined ? jointInfo.model() :
      maleModel).intersect(jointInfo.partInfo().noJointmodel());

    const printInfo = (rightOleft) => {
        const edges = jointInfo.partInfo().edges(rightOleft);
        let str = Line2d.toDrawString(edges) + '\n\n';
        str += Polygon3D.toDrawString2d(Polygon3D.fromCSG(jointInfo.model()), 'red') + '\n\n';
        console.log(str);
    }

    function yCutLine(yAxis, rightOleft, edges) {
      if (instance.constructor === CutInfo) {
        const edges = jointInfo.partInfo().edges(rightOleft, true);
        const cut = jointInfo.partInfo().to2D(rightOleft, set[0])[0];
        let foundStart = false; let foundEnd = false;
        for (let index = 0; index < edges.length; index++) {
          foundStart ||= edges[index].isOn(cut.startVertex());
          foundEnd ||= edges[index].isOn(cut.endVertex());
        }
        if (foundStart && foundEnd) return;
        if (foundStart) return cut;
        if (foundEnd) return cut.negitive();
        throw new Error('This shouldnt happen!10/29/2023');
      } else {
        const setNormalized = set.map(p => instance.normalize(rightOleft, p));
        const blockingPolys = setNormalized.filter(p => yAxis.isParrelle(p.normal()));
        if (blockingPolys.length > 1) throw new Error('This Should Not Happen');
        if (blockingPolys[0] === undefined) return;
        const intersectingLine = Line3D.fromVector(blockingPolys[0].normal(), yAxis.midpoint());
        const intersection = blockingPolys[0].toPlane().intersection.line(intersectingLine);
        const line3D = new Line3D(intersection, yAxis.midpoint());
        let line2d = jointInfo.partInfo().to2D(null, line3D);
        let intersections = edges.map(e => line2d.findDirectionalIntersection(e))
                                 .filter(v => v instanceof Vertex2d);
        intersections.sort(Vertex2d.sortByCenter(yAxis.midpoint()));
        line2d.endVertex(intersections[intersections.length - 1]);
        return line2d.negitive();
      }
    }

    const FENCE = Line2d.startAndTheta(null, Math.PI12, 10000);
    /**    y+         0        y-
      +z|-------------------------
        |
       0|   0   ------o-----       tableTop: xy-plane
        |  -|- |__TableSaw__|      fence: y-axis (right hand side of table)
      -z|  / \  /          \
    **/
    this.tableSawInformation = () => {
//console.log(Line2d.toDrawString(edges) + '\n\nyellow' + Line2d.toDrawString([y2d]) + '\n\n' + Polygon3D.toDrawString(set, 'red'))

      const upSide = this.primarySide();
      const rightOleft = upSide === 'Left' ? true : false;
      const edges = jointInfo.partInfo().edges(rightOleft);
      edges.sort(Line2d.sorter(edges.center, -135));
      // if (rightOleft) edges.reverse();
      const axes = this.axes(rightOleft);
      const y2d = axes.y.to2D('x', 'y');
      const parrelleSets = Line2d.parrelleSets(edges);
      const possibleFenceEdges = parrelleSets.filter(s => s[0].isParrelle(y2d))[0];
      const y2dExt = Line2d.startAndTheta(y2d.midpoint(), y2d.radians(), 1000)
          .combine(Line2d.startAndTheta(y2d.midpoint(), y2d.negitive().radians(), 1000));
      possibleFenceEdges.sort(Line2d.distanceSort(edges.center));
      let fenceEdge = possibleFenceEdges[possibleFenceEdges.length - 1];
      let yCutL = yCutLine(axes.y, rightOleft, edges);
      if (yCutL) {
        if (!within(fenceEdge.radians(), yCutL.radians()))
          fenceEdge = possibleFenceEdges[possibleFenceEdges.length - 2];
        if (!within(fenceEdge.radians(), yCutL.radians()))
          throw new Error('Shouldn\'t happen!28Nov2023');
      }
      // fenceEdge.rotate(Math.mod(Math.PI12 - fenceEdge.radians(), Math.PI * 2), edges.center);
      const length = yCutL ? yCutL.length() : null;
      const width = axes.x.length();
      const depth = null;
      const fenceDistance = fenceEdge.distance(y2d, false) - width/2;
      let outsideOfBlade = length !== null && within(width, 0); //&& joint dist < cutDist
      if (outsideOfBlade) {
        const model = this.intersectModel();
        const normCenter = this.normalize(rightOleft, model).center();
        const jointCenter = new Vertex3D(normCenter).to2D('x', 'y');
        outsideOfBlade = fenceEdge.distance(jointCenter, false) < fenceDistance + width;
      }
      return {length, width, depth, fenceDistance, fenceEdge, outsideOfBlade, upSide,
                display: CutInfo.display, jointInfo}
    }

    const max = (line, vector, curr) => line.vector().positiveUnit().equals(vector) &&
            curr < line.length() ? line.length() : curr;
    this.demensions = () => {
      try {
        const axes = this.axes();
        return {x: axes.x.length(), y: axes.y.length(), z: axes.z.length(), axes};
      } catch (e) {
        return {x: -1, y: -1, z: -1}
      }
    }

    this.normals = () => {
      if (set.length === 1) return Polygon3D.normals(set[0]).swap('x', 'z');
      const partNormals = jointInfo.partInfo().normals();
      const zNorm = partNormals.z.positiveUnit();
      const zPolys = set.filter(p => p.normal().positiveUnit().equals(zNorm));
      if (zPolys.length > 1) throw new Error('Have not coded for this yet.(shouldnt have too)');
      const lines = zPolys[0].lines();
      if (lines.length > 4)
        lines[0].combineOrder(lines[4]);
      if (zPolys.length === 1) {
        return Polygon3D.normals(zPolys[0]);
      }
      throw new Error('Have not coded for this yet(shouldnt have too)');
    }

    this.axes = (rightOleft) => {
      const normals = this.normals();
      const nLines = {};
      try {
        nLines.x = Line3D.fromVector(normals.x);nLines.y = Line3D.fromVector(normals.y);nLines.z = Line3D.fromVector(normals.z);
      } catch (e) {
        console.log(e);
        this.normals();
      }
      const lines = [];
      set.forEach(p => lines.concatInPlace(p.lines()));
      const axis = {x: [], y: [], z: [], normals};
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (line.isParrelle(nLines.x)) axis.x.push(line);
        else if (line.isParrelle(nLines.y)) axis.y.push(line);
        else if (line.isParrelle(nLines.z)) axis.z.push(line);
      }
      const zeroVert = new Vertex3D(0,0,0);
      axis.x = this.normalize(rightOleft, Line3D.averageLine(axis.x, zeroVert));
      axis.y = this.normalize(rightOleft, Line3D.averageLine(axis.y, zeroVert));
      axis.z = this.normalize(rightOleft, Line3D.averageLine(axis.z, zeroVert));
      return axis;
    }

    this.toString = () =>
      CutInfo.template.render(this.tableSawInformation());
  }
}
CutInfo.template = new $t('documents/cuts/cut');
// CutInfo.template.global('display', CutInfo.display);

CutInfo.evaluateSets = (parrelleSets, zPolys) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2);
  const lenE2 = parrelleSets.filter(s => s.length === 2);
  const lenE1 = parrelleSets.filter(s => s.length === 1);
  return !(lenG2.length > 0 || lenE2.length > 2) && zPolys.length === 0 && lenE1.length > 0;
}

function removeFullLengthPolys(existsInBoth, jointInfo) {
  if (jointInfo.joint().fullLength()) {
    const zVect = jointInfo.partInfo().parts()[0].position().normals().z.positiveUnit();
    const zPolys = existsInBoth.filter(p => p.normal().positiveUnit().equals(zVect));
    if (zPolys.length > 0) {
      const normals = Polygon3D.normals(zPolys[0]);
      const yNorm = normals.y.positiveUnit();
      existsInBoth.forEach(p => p.normal().positiveUnit().equals(yNorm) && existsInBoth.remove(p));
    }
  }
}

function existsInBothSets(set1, set2) {
  const tol = .001;
  const tolMap = new ToleranceMap({'normal.positiveUnit.i': tol,
                        'normal.positiveUnit.j': tol,
                        'normal.positiveUnit.k': tol,
                        'toPlane.axisIntercepts.x': tol,
                        'toPlane.axisIntercepts.y': tol,
                        'toPlane.axisIntercepts.z': tol});
  tolMap.addAll(set2);
  const existsInBoth = [];
  for (let index = 0; index < set1.length; index++) {
    const poly = set1[index];
    const matches = tolMap.matches(poly);
    let found = false;
    for (let j = 0; !found && j < matches.length; j++) {
      if (poly.overlaps(matches[j], true)) {
        existsInBoth.push(poly);
        found = true;
      }
    }
  }
  return existsInBoth;
}

let partModels = {};
let time = 0;
CutInfo.get = (maleModel, jointInfo) => {
  const start = new Date().getTime();
  const part = jointInfo.partInfo().parts()[0];
  const jointModel = part.toModel();
  let noJointmodel = jointInfo.partInfo().noJointmodel();
  const intersection = maleModel.intersect(noJointmodel);
  if (intersection.polygons.length === 0) return;
  const intersectionPolys = Polygon3D.merge(Polygon3D.fromCSG(intersection));
  const modelPolys = partModels[part.id()] ? partModels[part.id()] : Polygon3D.fromCSG(jointModel);
  partModels[part.id()] = modelPolys;
  Polygon3D.merge(modelPolys);
  let existsInBoth = {};
  for (let i = 0; i < modelPolys.length; i++) {
    const mPoly = modelPolys[i];
    let found = false;
    for (let j = 0; !found && j < intersectionPolys.length; j++) {
      let intPoly = intersectionPolys[j];
      let hash = intPoly.toDetailString().hash();
      if (mPoly.overlaps(intPoly, true) && existsInBoth[hash] === undefined) {
        existsInBoth[hash] = intPoly;
        found = true;
      }
    }
  }
  const end = new Date().getTime();
  time += end - start;
  console.log(time / 1000);
  existsInBoth = Object.values(existsInBoth);
  // existsInBoth = existsInBothSets(intersectionPolys, modelPolys);
  // TODO: ideally we would remove full length in joint application
  removeFullLengthPolys(existsInBoth, jointInfo);

  const normals = jointInfo.partInfo().parts()[0].position().normals();
  const zPolyFilter = p => p.normal().positiveUnit()
                      .equals(normals.z.positiveUnit());
  const zPolys = existsInBoth.filter(zPolyFilter);

  const sets = Polygon3D.parrelleSets(existsInBoth);

  try {
    const validObjects = [];
    for (let index = 0; index < registered.length; index++) {
      const clazz = registered[index];
      if (clazz.evaluateSets(sets, zPolys)) validObjects.push(new clazz(existsInBoth, jointInfo, maleModel));
    }
    const cutObj = validObjects[0];
    if (cutObj) {
      return cutObj;
    }
    throw new Error('This shouldn\'t happen! ' + jointInfo.joint().toString());
  } catch(e) {
    return new CutInfo.UNDEFINED_CONSTRUCTOR(sets, jointInfo, maleModel);
  }
}

const removeMergeable = (cut, set, cuts) => (c) => {
  for (let index = 0; index < set.length; index++) {
    const p = set[index];
    const merged = c.set()[0].merge(p);
    if (merged) {
      c.set()[0] = merged;
      const csg = cut.jointInfo().model().union(cut.jointInfo().model());
      c.jointInfo().model(null, csg)
      cuts.remove(cut);
    }
  }
};

const splitMultipleCuts = (cuts, jointInfo) => p => {
  const newCut = new CutInfo([p], jointInfo);
  cuts.push(newCut);
};

CutInfo.sorter = (cut1, cut2) => {
  if (cut1.constructor === cut2.constructor) {
    const dems1 = cut1.demensions();
    const dems2 = cut2.demensions();
    return dems2.y - dems1.y;
  } else {
    return cut1.constructor.priority - cut2.constructor.priority;
  }
}

CutInfo.clean = (cuts) => {
  const cutInfos = [];
  for (let index = 0; index < cuts.length; index++) {
    const cut = cuts[index];
    const set = cut.set();
    const jointInfo = cut.jointInfo();
    if (cut.constructor === CutInfo) {
      cutInfos.forEach(removeMergeable(cut, set, cuts));
      if (set.length === 0) {
        cuts.remove(cut);
        index--;
      } else if (set.length > 1) {
        cuts.remove(cut);
        index--;
        set.forEach(splitMultipleCuts(cuts, jointInfo, cutInfos));
      } else cutInfos.push(cut);
    }
  }
  cuts.sort(CutInfo.sorter);
  cuts.split = cuts.filterSplit(c => c.toolType());
}

// intersectionPolys[1]
// modelPolys[47]

CutInfo.display = {};
CutInfo.display.measurement = (val) => new Measurement(Math.abs(val)).display();
const disp = CutInfo.display.measurement;
CutInfo.display.vertex3D = (vert) => `(${disp(vert.x)}, ${disp(vert.y)})`;//` X ${disp(vert.z)}`;
CutInfo.display.vertex2d = (vert) => `(${disp(vert.x())}, ${disp(vert.y())})`;
CutInfo.display.demensions = (dems) => `${disp(dems.x)} X ${disp(dems.y)} X ${disp(dems.z)}`;
CutInfo.display.partIds = (parts) => {
  const cId = parts[0].getAssembly('c').index();
  if (!cId) return '';
  let partStr;
  if (parts.length === 1) partStr = parts[0].userFriendlyId();
  else partStr = `[${parts.map(p => p.userFriendlyId()).join(',')}]`;
  return `${cId}-${partStr}`;
}

CutInfo.display.partCodes = (parts) => {
  if (EPNTS.getEnv() !== 'local') return '';
  let partStr;
  if (parts.length === 1) partStr = parts[0].userFriendlyId();
  else partStr = `[${parts.map(p => p.userFriendlyId()).join(',')}]`;
  return `${partStr}`;
}


CutInfo.printPolys = (csgs, colors) => {
  colors ||= [];
  let str = '';
  for (let index = 0; index < csgs.length; index++) {
    const polys = Polygon3D.fromCSG(csgs[index]);
    const color = colors[index%colors.length];
    for (let j = 0; j < polys.length; j++) {
      str += polys[j].toDrawString(color) + '\n';
    }
    str += '\n';
  }
  console.log(str);
}

const registered = [];
let priority = 0;
const undefinedCutConstructor = 'UnknownInfo';
CutInfo.register = (clazz) => {
  if (registered.indexOf(clazz) === -1) {
    registered.push(clazz);
    if (clazz.name === undefinedCutConstructor) {
      CutInfo.UNDEFINED_CONSTRUCTOR = clazz;
      clazz.priority = Number.MIN_SAFE_INTEGER;
    } else clazz.priority = priority++;
  }
}
CutInfo.register(CutInfo);

module.exports = CutInfo;
