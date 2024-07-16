
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const Plane = require('../../../../../app-src/three-d/objects/plane.js');
const Layer = require('../../../../../app-src/three-d/objects/layer.js');
const PolyOverlapAxis = require('../poly-overlap-axis');

const Line2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Tolerance = require('../../../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../../../public/js/utils/tolerance-map.js');

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
class CutInfo {
  constructor(axis, jointInfo, maleId) {
    const env = jointInfo.partInfo().environment();
    const partId = jointInfo.partInfo().part().id;

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
    this.primarySide = () => {
      const zPos = jointInfo.partInfo().normals().z;
      const leftPolys = this.normals().z.equals(zPos);
      if (leftPolys.length && !rightPolys.length) return 'Left';

      const rightPolys = this.normals().z.equals(zPos.inverse());
      if (rightPolys.length && !leftPolys.length) return 'Right';
      return 'Both';
    };
    this.secondarySide = () => {
      const ps = this.primarySide();
      if (ps === 'Right') return 'Left';
      if (ps === 'Left') return 'Right';
      return 'Both';
    }
    this.toolType = 'table-saw';
    this.center = () => axis.y.midpoint();
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

    const normals = {
      x: axis.x.vector().unit(),
      y: axis.y.vector().unit(),
      z: axis.z.vector().unit()
    }
    this.normals = () => normals;
    this.axis = (rightOleft) => ({
      x: this.normalize(rightOleft, axis.x),
      y: this.normalize(rightOleft, axis.y),
      z: this.normalize(rightOleft, axis.z)
    });
    this.axis.toString = () => [axis.x, axis.y, axis.z].map(l => l.toString(.0001)).join('\n');
    this.hash = () => this.axis.toString().hash();

    this.toDrawString = (color) => {
      const axis = this.axis();
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

// let partModels = {};
// let time = 0;
// const start = new Date().getTime();
// const end = new Date().getTime();
// time += end - start;
// console.log(time / 1000);

function partModelInfo(partId, maleId, env, jointInfo) {
  const intersectionModel = ensureCsg(env.modelInfo.intersection[partId][maleId]);
  if (!intersectionModel || intersectionModel.polygons.length === 0) return null;
  const jointModel = ensureCsg(env.modelInfo.joined[partId]);
  const noJointModel = ensureCsg(env.modelInfo.model[partId]);
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
  const edges  = polys.filter(p => !p.normal().parrelle(partNormals.z));
  const nonPerp = edges.filter(p => !p.normal().perpendicular(partNormals.z), 0);
  console.log(nonPerp.map(p => p.toDrawString()).join('\n'))
  const cuts = [];
  nonPerp.forEach(poly => {
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
  console.log(CutInfo.toDrawString(cuts));
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
  return CutInfo.fromAxis(axis, jointInfo, maleId);
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

function unDocumentDemensionalCut(cuts, index, demEdges) {
  const cut = cuts[index];
  const y2D = cut.axis(true).y.to2D('x', 'y');

  if (demEdges.find(l => y2D.combine(l))) {
    cut.documented(false);
    return true;
  }
  return false;
}

function unDocumentExtranious(cuts) {
  const demEdges = cuts[0].jointInfo().partInfo().demensionEdges(true);
  for (let i = 0; i < cuts.length; i++) {
    const cut1 = cuts[i];
    if (cut1.documented()) {
      const isCut1 = cut1.constructor === CutInfo;
      if (isCut1) {
        if (!unDocumentDemensionalCut(cuts, i, demEdges)) {
          for (let j = i + 1; j < cuts.length; j++) {
            const cut2 = cuts[j];
            if (cut2.documented() && cut2.constructor === CutInfo) {
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
}

CutInfo.clean = (cuts) => {
  if (cuts.length === 0) return;
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
