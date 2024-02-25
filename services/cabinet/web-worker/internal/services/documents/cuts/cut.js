
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const Plane = require('../../../../../app-src/three-d/objects/plane.js');
const Layer = require('../../../../../app-src/three-d/objects/layer.js');

const Line2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Tolerance = require('../../../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../../../public/js/utils/tolerance-map.js');

class CutInfo {
  constructor(set, jointInfo, maleId) {
    const env = jointInfo.partInfo().environment();
    const partId = jointInfo.partInfo().part().id;
    let intersectionModel = env.modelInfo.intersection[partId][maleId];
    intersectionModel ||= jointInfo.model().intersect(jointInfo.partInfo().noJointModel());

    let instance = this;
    this.jointInfo = () => jointInfo;
    this.maleModel = () => env.modelInfo.joined[maleId];
    let documented = true;
    this.documented = (isDocumented) => {
      if (isDocumented === true || isDocumented === false) {
        documented = isDocumented;
      }
      return documented;
    }
    this.set = () => set;
    this.normalize = jointInfo.partInfo().normalize;
    this.primarySide = jointInfo.partInfo().primarySide;
    this.toolType = () => 'table-saw';
    this.center = () =>
      set[0].center();
    this.intersectModel = () => intersectionModel;
    const printInfo = (rightOleft) => {
        const edges = jointInfo.partInfo().edges(rightOleft);
        let str = Line2d.toDrawString(edges) + '\n\n';
        str += Polygon3D.toDrawString2d(Polygon3D.fromCSG(jointInfo.model()), 'red') + '\n\n';
        console.log(str);
    }


    let tableSawInformation;
    this.tableSawInformation = () => {
      if (tableSawInformation === undefined) tableSawInformation = new TableSawDocumentation(this);
      return tableSawInformation;
    }

    const max = (line, vector, curr) => line.vector().positiveUnit().equals(vector) &&
            curr < line.length() ? line.length() : curr;
    this.demensions = () => {
      try {
        const axis = this.axis();
        return {x: axis.x.length(), y: axis.y.length(), z: axis.z.length(), axis};
      } catch (e) {
        return {x: -1, y: -1, z: -1}
      }
    }

    this.angle = (rightOleft) => {
      if (rightOleft !== true && rightOleft !== false) rightOleft = true;
      let zAxis = this.normalize(rightOleft, this.axis().z);
      const angle = Plane.xy.angle.line(zAxis);
      return Number.isNaN(angle) ? 0 : 90 - angle;
    }

    this.normals = () => {
      const partNormals = jointInfo.partInfo().normals();
      const zNorm = partNormals.z.positiveUnit();
      if (set.length === 1) {
        const normals = Polygon3D.normals(set[0]).swap('x', 'z');
        let yMoreInlineWithZ = Math.abs(normals.z.dot(zNorm)) < Math.abs(normals.y.dot(zNorm));
        if (yMoreInlineWithZ)
          normals.swap('z', 'y')
        normals.x = normals.x.scale(0);
        return normals;
      }
      const zPolys = set.filter(p => p.normal().positiveUnit().equals(zNorm));
      if (zPolys.length > 1 || zPolys.length === 0)
        throw new Error('Have not coded for this yet.(shouldnt have too)');
      const lines = zPolys[0].lines();
      if (lines.length > 4)
        lines[0].combineOrder(lines[4]);
      if (zPolys.length === 1) {
        return Polygon3D.normals(zPolys[0]);
      }
      throw new Error('Have not coded for this yet(shouldnt have too)');
    }

    this.axis = (rightOleft) => {
      const normals = this.normals();

      const axis = Polygon3D.axis(set, normals);
      const center = this.center();
      axis.max.x ||= new Line3D([0,0,0],[0,0,0]);
      axis.max.x.centerOn(center);
      axis.max.y.centerOn(center);
      axis.max.z.centerOn(center);
      axis.x = this.normalize(rightOleft, axis.max.x);
      axis.y = this.normalize(rightOleft, axis.max.y);
      axis.z = this.normalize(rightOleft, axis.max.z);
      delete axis.min; delete axis.max;


      return axis;
    }

    this.toDrawString = (color) => {
      const axis = this.axis();
      let str = Layer.toDrawString(this.set(), color) + '\n\n';
      str += axis.x.toDrawString('red') + '\n';
      str += axis.y.toDrawString('green') + '\n';
      str += axis.z.toDrawString('blue')  + '\n\n';
      return str;
    }

    this.toString = this.toDrawString;
  }
}

CutInfo.toDrawString = (cuts, ...colors) => {
  let str = '';
  for (let index = 0; index < cuts.length; index++) {
    const color = colors[index % colors.length];
    str += cuts[index].toDrawString(color);
  }
  return str;
}

// CutInfo.template.global('display', CutInfo.display);

CutInfo.evaluateSets = (parrelleSets, zPolys) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2);
  const lenE2 = parrelleSets.filter(s => s.length === 2);
  const lenE1 = parrelleSets.filter(s => s.length === 1);
  return !(lenG2.length > 0 || lenE2.length > 2) && zPolys.length === 0 && lenE1.length > 0;
}

function removeFullLengthPolys(existsInBoth, jointInfo) {
  if (jointInfo.joint().fullLength) {
    const zVect = jointInfo.partInfo().normals().z.positiveUnit();
    const zPolys = existsInBoth.filter(p => p.normal().positiveUnit().equals(zVect));
    if (zPolys.length > 0) {
      const normals = Polygon3D.normals(zPolys[0]);
      const yNorm = normals.y.positiveUnit();
      existsInBoth.forEach(p => p.normal().positiveUnit().equals(yNorm) && existsInBoth.remove(p));
    }
  }
}

function alignZpolyNorms(zPolys, intersectionLayers, zPolyFilter) {
  if (zPolys.length < 1) return;
  let modelZpolys = intersectionLayers.filter(zPolyFilter);
  let zUnitDir;
  for (let mi = 0; !zUnitDir && mi < modelZpolys.length; mi++) {
    const mzp = modelZpolys[mi];
    let found = false;
    for (let index = 0; !found && index < zPolys.length; index++) {
      if (zPolys[index].hash() === mzp.hash()){
        found = true;
      }
    }
    if (!found) {
      const connector = mzp.toPlane().connect.vertex(zPolys[0].center());
      zUnitDir = connector.vector().unit();
    }
  }

  if (zUnitDir) {
    zPolys.forEach((poly, index) => zUnitDir.sameDirection(poly.normal()) ||
      (zPolys[index] = zPolys[index].reverse()));
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

function partModelInfo(partId, maleId, env, jointInfo, maleModel) {
  const jointModel = env.modelInfo.joined[partId];
  const noJointModel = env.modelInfo.model[partId];
  if (env.modelInfo.joinedLayer === undefined) env.modelInfo.joinedLayer = {};
  if (env.modelInfo.joinedLayer[partId] === undefined)
    env.modelInfo.joinedLayer[partId] = Layer.fromCSG(jointModel);
  const modelLayers = env.modelInfo.joinedLayer[partId];
  const intersectionModel = env.modelInfo.intersection[partId][maleId];
  return {
    jointModel, noJointModel, modelLayers, intersectionModel
  };
}

CutInfo.partModelInfo = partModelInfo;

let partModels = {};
let time = 0;
CutInfo.get = (maleId, jointInfo, env) => {
  const part = jointInfo.partInfo().part();
  if (part.locationCode === 'c_S1_S1_dv_dv:full') {
    console.log('ladidodido');
  }
  const modelInfo = CutInfo.partModelInfo(part.id, maleId, env, jointInfo);
  if (modelInfo.intersectionModel === undefined) return;

  const intersectionLayers = Layer.fromCSG(modelInfo.intersectionModel);
  const modelLayers = modelInfo.modelLayers;
  let existsInBoth = {};
  for (let i = 0; i < modelLayers.length; i++) {
    const mLayer = modelLayers[i];
    let found = false;
    for (let j = 0; !found && j < intersectionLayers.length; j++) {
      let intLayer = intersectionLayers[j];
      const equivNorms = intLayer.normal().positiveUnit().equals(mLayer.normal().positiveUnit());
      if (equivNorms) {
        let hash = intLayer.toDetailString().hash();
        const start = new Date().getTime();
        if (existsInBoth[hash] === undefined && mLayer.overlaps(intLayer, true)) {
          existsInBoth[hash] = intLayer;
          found = true;
        }
        const end = new Date().getTime();
        time += end - start;
      }
    }
  }
  existsInBoth = Object.values(existsInBoth);
  if (existsInBoth.length === 0) {
    return;
  }
  // existsInBoth = existsInBothSets(intersectionLayers, modelPolys);
  // TODO: ideally we would remove full length in joint application
  removeFullLengthPolys(existsInBoth, jointInfo);

  const normals = jointInfo.partInfo().normals();
  const zNorm = normals.z;
  const zPolyFilter = p => p.normal().positiveUnit()
                      .equals(zNorm.positiveUnit());
  const zPolys = existsInBoth.filter(zPolyFilter);

  const sets = Polygon3D.parrelleSets(existsInBoth);

  alignZpolyNorms(zPolys, intersectionLayers, zPolyFilter);
  console.log(time / 1000);

  try {
    const validObjects = [];
    for (let index = 0; index < registered.length; index++) {
      const clazz = registered[index];
      if (clazz.evaluateSets(sets, zPolys)) validObjects.push(new clazz(existsInBoth, jointInfo, maleId));
    }
    const cutObj = validObjects[0];
    if (cutObj) {
      return cutObj;
    }
    throw new Error('This shouldn\'t happen! ' + jointInfo.joint().toString());
  } catch(e) {
    return new CutInfo.UNDEFINED_CONSTRUCTOR(existsInBoth, jointInfo, maleId, env);
  }
}

const removeMergeable = (cuts, index1, index2) => {
  const cut1 = cuts[index1];
  const cut2 = cuts[index2];
  const layer1 = cut1.set()[0];
  const layer2 = cut2.set()[0];
  const merged = layer1.merge(layer2);
  if (merged && merged.lines().length === layer1.lines().length) {
    const set = [merged];
    const maleModel = cut1.intersectModel().union(cut2.intersectModel());
    const jointInfo = cut1.jointInfo();
    const cut1Index = cuts.equalIndexOf(cut1);
    const cut2Index = cuts.equalIndexOf(cut2);
    cuts[index1] = new CutInfo(set, jointInfo, maleModel);
    cuts.remove(cut2);
    return true;
  }
  return false;
};

const splitMultipleCuts = (cuts, jointInfo) => p => {
  const newCut = new CutInfo([p], jointInfo);
  cuts.push(newCut);
};

CutInfo.sorter = (cut1, cut2) => {
  if (cut1.constructor === cut2.constructor) {
    const jointPriorDiff = cut2.jointInfo().joint().priority - cut1.jointInfo().joint().priority;
    if (jointPriorDiff) return jointPriorDiff;
    const dems1 = cut1.demensions();
    const dems2 = cut2.demensions();
    return dems2.y - dems1.y;
  } else {
    const cut1AngleNonZero = cut1.angle() !== 0;
    const cut2AngleNonZero = cut2.angle() !== 0;
    if (cut1AngleNonZero && !cut2AngleNonZero) return 1;
    if (!cut1AngleNonZero && cut2AngleNonZero) return -1;
    return cut1.constructor.priority - cut2.constructor.priority;
  }
}

function unDocumentDemensionalCut(cuts, index, demEdges) {
  const cut = cuts[index];
  const y2D = cut.axis(true).y.to2D('x', 'y');
  if (demEdges.equalIndexOf(y2D) !== -1) {
    cut.documented(false);
    return true;
  }
  return false;
}

function unDocumentExtranious(cuts) {
  const demEdges = cuts[0].jointInfo().partInfo().demensionEdges(true);
  for (let i = 0; i < cuts.length; i++) {
    const cut1 = cuts[i];
    const isCut1 = cut1.constructor === CutInfo;
    if (isCut1) {
      if (!unDocumentDemensionalCut(cuts, i, demEdges)) {
        for (let j = i + 1; j < cuts.length; j++) {
          const cut2 = cuts[j];
          if (cut2.constructor === CutInfo) {
            if (removeMergeable(cuts, i, j)) {
              i--;
              break;
            }
          }
        }
      }
    }
  }
}

function splitCutOperations(cuts) {
  const cutInfos = [];
  for (let index = 0; index < cuts.length; index++) {
    const cut = cuts[index];
    const jointInfo = cut.jointInfo();
    if (cut.constructor === CutInfo) {
      const set = cuts[index].set();
      if (set.length > 1) {
        cuts.remove(cut);
        index--;
        set.forEach(splitMultipleCuts(cuts, jointInfo, cutInfos));
      } else cutInfos.push(cut);
    }
  }
}

CutInfo.clean = (cuts) => {
  if (cuts.length === 0) return;
  splitCutOperations(cuts);
  unDocumentExtranious(cuts);

  cuts.sort(CutInfo.sorter);
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
