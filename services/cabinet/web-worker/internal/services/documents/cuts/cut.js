

const PolyOverlapAxis = require('../poly-overlap-axis');
const {Polygon3D, Vector3D, Vertex3D, Line3D, Plane, Layer} =
    require('../../../../../../../public/js/utils/canvas/three-d/lib');
const Line2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Tolerance = require('../../../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../../../public/js/utils/tolerance-map.js');

const axisStr = (axis) => axis.isLine() ? '' : axis.length();
const lengthWidthDepth = (axis) => {
  return [axisStr(axis.x), axisStr(axis.y), axisStr(axis.z)];
}

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
class CutInfo {
  constructor(axis, jointInfo, maleId) {
    const env = jointInfo.partInfo().environment();
    const partId = jointInfo.partInfo().part().id;

    this.partInfo = () => jointInfo.partInfo();

    const tiltAligned =  () => {
      if (!axis.z.isLine() || axis.z.vector().parrelle.toAxis()) return true;
      const center = this.partInfo().center(true).to2D();
      const zA2D = this.partInfo().normalize(true, axis.z).to2D();
      const positive = center.distance(zA2D[1]) < center.distance(zA2D[0]);
      return positive;
    }
    if (!tiltAligned()) {
      axis.z = axis.z.negitive()
    }

    let instance = this;
    this.maleId = () => maleId;
    this.jointInfo = () => jointInfo;
    this.maleModel = () => ensureCsg(env.modelInfo.joined[maleId]);
    let documented = true;
    this.documented = (isDocumented) => {
      if (isDocumented === true || isDocumented === false) {
        documented = isDocumented;
      }
      return documented;
    }
    this.normalize = jointInfo.partInfo().normalize;

    this.zOnz = () =>
      this.normals().z.sameDirection(this.partInfo().normals().z) ? true : false;

    this.primarySide = (boolean) => {
      const pzN = jointInfo.partInfo().normals().z;
      const zNorm = pzN.sameDirection(instance.normals().z) ? pzN : pzN.inverse();
      const sideLabel = Vector3D.sector(zNorm);
      const leftOright = sideLabel.match(/^(Left|Front|Top)$/) !== null;
      return boolean ? leftOright : (leftOright ? 'z' : 'nz');
    };

    this.toolType = 'table-saw';
    this.center = () => axis.y.midpoint();
    const printInfo = (zOnz) => {
        const edges = jointInfo.partInfo().edges(zOnz);
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

    this.tilt = () => {
      let zOnz = this.partInfo().primarySide(true);
      let zAxis = this.axis(zOnz).z.acquiescent(this.partInfo().normals().z);
      let angle = Math.roundTo(Plane.xy.angle.line(zAxis), .000001) + 180;
      if (Number.isNaN(angle)) {
        Math.roundTo(Plane.xy.angle.line(zAxis), .000001) + 360;
        throw new Error('This Shouldnt Ever F****** Happen!');
      }
      while (angle >= 90) angle -= 90;
      if (within(angle, 0)) return 0;
      return this.tilting() ? {left:angle,right:-(90-angle)} : {left:-angle,right:90 - angle};
    }

    this.tilting = () => {
      let zOnz = this.partInfo().primarySide(true);
      let zAxis = this.axis(zOnz).z.acquiescent(this.partInfo().normals().z);
      const center = this.partInfo().center(zOnz).to2D();
      const zA2D = zAxis.to2D();
      const positive = center.distance(zA2D[1]) < center.distance(zA2D[0]);
      return zOnz === positive;
    }

    this.fenceEdges = (zOnz, line) => {
      if (zOnz === undefined) zOnz = true;
      line ||= this.axis(zOnz).y.to2D();
      const fenceEdges = this.partInfo().fenceEdges(zOnz);
      return fenceEdges.filter(e => line.isParrelle(e));
    }


    function getMarker(yAxis, zOnz) {
      const edges = instance.partInfo().edges2D(zOnz);
      const markerEdge = edges.find(l => l.combine(yAxis));
      if (markerEdge) return {label: markerEdge.label};
      const markerIds = (instance.partInfo().markerIds ||= {});
      const label = markerIds.undefinedKey(' ', '', 1);
      markerIds[label] = true;
      return {label, line: yAxis};
    }

    const CHAR = this.constructor.CHAR;
    const hasFenceIds = (refs, axis) => {
      const distances = refs.map(a => a ? a.map(i => i.distance) : []).concatElements();
      return distances.map(d => [CHAR, d].concat(lengthWidthDepth(instance.axis())));
    }
    const noFenceIds = (refs, axis) => {
      return refs.map(l => [CHAR].concat([l[0].x,l[0].y,l[1].x,l[1].y])
                          .concat(lengthWidthDepth(instance.axis())));
    }

    function hasFenceEdges(axis, fenceEdges, zOnz) {
      const halfWidth = axis.x.length()/2;
      const axis3D = instance.axis();
      const z = fenceEdges.map(e => ({label: e.label, distance: e.distance(axis.z[1], false) - halfWidth}));
      const nz = !axis3D.z.isLine() ? null : fenceEdges.map(e => ({label: e.label, distance: e.distance(axis.z[0], false) - halfWidth}));
      const refs = [z, nz];
      const identifiers = hasFenceIds(refs, axis);
      const marker = getMarker(axis.y, zOnz);
      const primarySide = instance.primarySide(true);
      if (primarySide === false) refs.reverse();
      if (axis3D.z.isLine() && axis.z.isPoint()) delete refs[1];
      return {references: refs, identifiers, marker};
    }

    const xAxis = new Line2d([[0,0],[1,0]]);
    const yAxis = new Line2d([[0,0],[0,1]]);
    const vertMag = (v) => Math.min(xAxis.distance(v, false), yAxis.distance(v, false));
    const vertSort = (v1,v2) => {
      const dist1 = {x: xAxis.distance(v1, false), y: yAxis.distance(v2, false)};
      const dist2 = {x: xAxis.distance(v1, false), y: yAxis.distance(v2, false)};
      if (within(dist1.x + dist1.y, 0) && !within(dist2.x + dist2.y, 0)) return -1;
      if (!within(dist1.x + dist1.y, 0) && within(dist2.x + dist2.y, 0)) return 1;
      if (within(dist1.y, 0) && !within(dist2.y, 0)) return -1;
      if (!within(dist1.y, 0) && within(dist2.y, 0)) return 1;
      if (within(dist1.x, 0) && !within(dist2.x, 0)) return -1;
      if (!within(dist1.x, 0) && within(dist2.x, 0)) return 1;
      return dist2.x - dist1.x;
    }
    // [v.x, v.y].sort((a,b) => a-b).sum((v,i) => v*((i+1)*.2));
    function noFenceEdges(axis, zOnz) {
      const allEdges = instance.partInfo().edges2D(zOnz);
      const marker = getMarker(axis.y, zOnz);
      const edges = allEdges.filter(l => !l.isParrelle(axis.y));
      let z = axis.y.clone().translate(axis.z.negitive().scale(.5, true), true);
      const zInts = edges.map(e => e.findSegmentIntersection(z, true))
                      .unique((v) => v.toString())
                      .filter(v => v)
                      .sort(vertSort);
      let nz = axis.y.translate(axis.z.scale(.5, true), true);
      const nzInts = edges.map(e => e.findSegmentIntersection(nz, true))
                      .unique((v) => v.toString())
                      .filter(v => v)
                      .sort(vertSort);
      const refs = [new Line2d(zInts[0], zInts[1]), new Line2d(nzInts[0], nzInts[1])];
      if (instance.primarySide(true) === false) refs.reverse();
      const either = axis.z.isPoint();

      const dems = instance.partInfo().demensions()
      const reverseIndex = zOnz ? 1 : 1;
      refs[reverseIndex][0].translate(-dems.x, 0);
      refs[reverseIndex][1].translate(-dems.x, 0);
      refs[reverseIndex][0].x = -refs[1][0].x;
      refs[reverseIndex][1].x = -refs[1][1].x;

      const identifiers = noFenceIds(refs, axis);
      if (instance.partInfo().part().partCode === 'T:b' || instance.partInfo().part().partCode === 'dv:f') {
        instance.fenceEdges(zOnz);
      }
      // if (either) refs.splice(1,1);
      return {references: refs, either, identifiers, marker};
    }

    this.locationRef = () => {
      const info = {};
      const zOnz = this.zOnz();
      const axis = this.axis(zOnz);
      axis.x = axis.x.to2D('x', 'y');
      axis.y = axis.y.to2D('x', 'y');
      axis.z = axis.z.to2D('x', 'y');
      const fenceEdges = this.fenceEdges(zOnz);
      if (fenceEdges.length > 1) return hasFenceEdges(axis, fenceEdges, zOnz);
      else return noFenceEdges(axis, zOnz);
    }

    this.toJson = () => {
      const locationRef = this.locationRef();
      const id = locationRef.id;
      const marker = locationRef.marker;
      const axis = {z: this.axis(true)};
      const joint = this.jointInfo().joint().descriptor;
      const primarySide = this.primarySide(true);
      axis['-z'] = this.axis(false);
      return {
        id, axis, locationRef, marker, joint, primarySide,
        tilt: this.tilt()
      }
    }

    const normals = {
      x: axis.x.vector.directional().unit(),
      y: axis.y.vector.directional().unit(),
      z: axis.z.vector.directional().unit()
    }
    this.normals = () => normals;
    this.axis = (zOnz) => ({
      x: this.normalize(zOnz, axis.x),
      y: this.normalize(zOnz, axis.y),
      z: this.normalize(zOnz, axis.z)
    });
    this.axis.poly = (x,y) => {
      const a1 = axis[x]; const a1mp = a1.midpoint();
      const a2 = axis[y]; const a2mp = a2.midpoint();
      const l1 = a2.clone(); l1.centerOn(a1[0]);
      const l2 = a2.clone(); l2.centerOn(a1[1]);
      const l3 = a1.clone(); l3.centerOn(a2[0]);
      const l4 = a1.clone(); l4.centerOn(a2[1]);
      const verts = Line3D.vertices([l1, l2, l3, l4]).unique(v => v.toString(.00001));
      Vertex3D.radialSort2D(verts);
      return new Polygon3D(verts);
    }
    this.axis.toString = () => [axis.x, axis.y, axis.z].map(l => l.toString(.0001)).join('\n');
    this.hash = () => this.axis.toString().hash();

    this.toDrawString = (color, zOnz) => {
      const axis = this.axis(zOnz);
      axis.x = axis.x.clone(); axis.y = axis.y.clone(); axis.z = axis.z.clone();
      // axis.z.adjustLength(100);
      axis.z.directional(false, true);
      let str = `// ${this.jointInfo().joint().descriptor}\n`;
      str += axis.x.toDrawString('red') + '\n';
      str += axis.y.toDrawString('green') + '\n';
      str += axis.z.toDrawString('blue')  + '\n\n';
      return str;
    }

    this.toString = this.toDrawString;
  }
}

class UndocumentedCut extends CutInfo {
  constructor(axis, jointInfo, maleId) {
    super(axis, jointInfo, maleId);
    this.documented(false);
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

CutInfo.is = (axis) => axis.x.length() < .0001;

function possibleOverlaps (intersectionLayers, modelLayers) {
  const vertIndexLength = (il, ml, index) => ml.toPlane().connect.vertex(il.toPlane().points()[index]).length();
  const planesOverlap = modelLayers.map((ml, mi) => intersectionLayers.map((il, ii) => ({
    mi,ii,
    len: Math.max(vertIndexLength(il,ml, 0), vertIndexLength(il,ml, 1), vertIndexLength(il,ml, 2))
  })).filter(obj => Tolerance.within(.001)(obj.len, 0)));

  let drawStr = '';
  planesOverlap.forEach(arr => arr.forEach(obj => {
    drawStr += `// modelLayerIndex(green): ${obj.mi}
${modelLayers[obj.mi].toDrawString('green')}
// intersectionLayerIndex(blue): ${obj.ii}
${intersectionLayers[obj.ii].toDrawString('blue')}\n\n`;
  }));
  console.log(drawStr);
}

function partModelInfo(partId, maleId, env, jointInfo) {
  const intersectionMap = env.modelInfo.intersection[partId];
  const intersectionModel = intersectionMap && ensureCsg(intersectionMap[maleId]);
  if (!intersectionModel || intersectionModel.polygons.length === 0) return null;
  const jointModel = ensureCsg(env.getModel(partId, 'joined'));
  const noJointModel = ensureCsg(env.getModel(partId, 'model'));
  if (env.modelInfo.joinedLayer === undefined) env.modelInfo.joinedLayer = {};
  if (env.modelInfo.joinedLayer[partId] === undefined)
    env.modelInfo.joinedLayer[partId] = Layer.fromCSG(jointModel);
  const modelLayers = env.modelInfo.joinedLayer[partId];
  return {
    jointModel, noJointModel, modelLayers, intersectionModel
  };
}

const within = Tolerance.within(.0001);
CutInfo.fromEdges = (polys, partNormals, jointInfo) => {
  const cuts = [];
  polys.forEach(poly => {
    const normals = Polygon3D.normals(poly).swap('x', 'z');
    const zNorm = partNormals.z;
    let yMoreInlineWithZ = Math.abs(normals.z.dot(zNorm)) < Math.abs(normals.y.dot(zNorm));
    if (yMoreInlineWithZ)
    normals.swap('z', 'y')
    normals.x = normals.x.scale(0);

    const axis = Polygon3D.axis([poly], normals).max;
    axis.z.directional(true, true);
    axis.y.directional(true, true);
    cuts.push(CutInfo.fromAxis(axis, jointInfo));
  });
  return cuts;
}

CutInfo.fromAxis = (axis, jointInfo, maleId) => {
  try {
    for (let index = 0; index < registered.length; index++) {
      const clazz = registered[index];
      if (clazz.is(axis)) return new clazz(axis, jointInfo, maleId);
    }
    if (goDownTheRabbitHole) {
      possibleOverlaps(intersectionLayers, modelLayers);
      cutInfo.get(maleId, jointInfo, env);
    }
    throw new Error('This shouldn\'t happen! ' + jointInfo.joint().toString());
  } catch(e) {
    console.error(e);
    return new CutInfo.UNDEFINED_CONSTRUCTOR(axis, jointInfo, maleId);
  }

}

CutInfo.get = (maleId, jointInfo, env) => {
  const part = jointInfo.partInfo().part();
  const modelInfo = partModelInfo(part.id, maleId, env, jointInfo);
  if (modelInfo === null) {
    partModelInfo(part.id, maleId, env, jointInfo);
    return null;
  }
  const intersectModel = modelInfo.intersectionModel;

  const intersectionLayers = Layer.fromCSG(intersectModel);
  const modelLayers = modelInfo.modelLayers;
  const axis = PolyOverlapAxis(modelLayers, intersectionLayers, jointInfo);
  return axis ? axis.map(a => CutInfo.fromAxis(a, jointInfo, maleId)) : [];
}

const removeMergeable = (cuts, index1, index2) => {
  console.warn.subtle('Merging by axis needs to be implemented');
};

CutInfo.sorter = (cut1, cut2) => {
  if (cut1.documented() === false && cut2.documented() === false) return 0;
  if (cut1.documented() === false) return -1;
  if (cut2.documented() === false) return 1;
  if (cut1.constructor === cut2.constructor) {
    const jointPriorDiff = cut2.jointInfo().joint().priority - cut1.jointInfo().joint().priority;
    if (jointPriorDiff) return jointPriorDiff;
    const dems1 = cut1.demensions();
    const dems2 = cut2.demensions();
    return dems2.y - dems1.y;
  } else {
    return cut1.constructor.priority - cut2.constructor.priority;
  }
}

const tol = .001;
CutInfo.clean = (cuts, fenceEdges) => {
  for (let index = 0; index < cuts.length; index++) {
    const line = cuts[index].axis(true).y.to2D();
    if (fenceEdges.findIndex(l => l.combine(line)) !== -1) {
      cuts.splice(index--,1);
    }
  }


  Line3D.combineByLine(cuts, 'axis().y', (c1, c2, combined) => {
    if (!within(c1.axis().x.length(), c2.axis().x.length())) return null;
    if (!within(c1.axis().x.length(), c2.axis().x.length())) return null;
    const maleId = c1.maleId() + '&' + c2.maleId();
    const axis = {
      x: c1.axis().x.centerOn(combined.midpoint()),
      y: combined,
      z: c1.axis().z.centerOn(combined.midpoint())

    }
    return new c1.constructor(axis, c1.jointInfo(), maleId);
  });

  const tolMap = new ToleranceMap({'axis().(x,y,z).(0,1).(x,y,z)': tol});
  tolMap.addAll(cuts);
  cuts = tolMap.group().map(g => g[0]);
  cuts.sort(CutInfo.sorter);
  return cuts;
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

CutInfo.CHAR = 'C';

class UnknownInfo extends CutInfo {
  constructor(axis, jointInfo, maleId) {
    super(axis, jointInfo, maleId);
    this.toolType = 'unknown';
    this.joint = jointInfo.joint().descriptor;
    this.toString = () => jointInfo.joint().descriptor;

    this.angle = () => -0;
  }
}

UnknownInfo.is = (axis) => CutInfo.fromAxis(axis) instanceof CutInfo.UNDEFINED_CONSTRUCTOR;

CutInfo.UNDEFINED_CONSTRUCTOR = UnknownInfo;
UnknownInfo.priority = Number.MIN_SAFE_INTEGER;


const registered = [];
let priority = 0;
const undefinedCutConstructor = 'UnknownInfo';
CutInfo.register = (clazz) => {
  if (registered.indexOf(clazz) === -1) {
    registered.push(clazz);
    clazz.priority = priority++;
  }
}
CutInfo.register(CutInfo);

module.exports = CutInfo;
