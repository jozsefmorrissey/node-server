
const JointInfo = require('./joint');
const CutInfo = require('./cuts/cut');
const ToolingInfo = require('./tooling-information');
const Utils = require('../modeling/utils/utils.js');
const ToleranceMap = require('../../../../../../public/js/utils/tolerance-map.js');

const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Vector3D = require('../../../../app-src/three-d/objects/vector.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const Plane = require('../../../../app-src/three-d/objects/plane.js');
const Layer = require('../../../../app-src/three-d/objects/layer.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');

const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');

class PartInfo {
  constructor(part, env) {
    let parts = [part];
    this.part = () => part;
    this.parts = () => parts.map(p => p);
    this.environment = () => env;
    this.merge = (partInfo) => {
      // TODO: this Test definiatly needs to be more robust
      if (partInfo.cutInfo().length > 0) return;
      if (Object.equals(partInfo.demensions(), this.demensions())) {
        parts.concatInPlace(partInfo.parts());
        return true;
      }
      return false;
    }

    let normals = Utils.normals(part, env);
    this.normals = (array) => {
      if (array) return [normals.x, normals.y, normals.z];
      return normals;
    }

    const sideFilter = (vect) => c => c.set().filter(p => vect.equals(p.normal())).length > 0;
    // primarySide: Is the side you do not want to damage.
    this.primarySide = () => {
      const normals = this.normals();
      const zPos = normals.z;
      const zNeg = zPos.inverse();
      const leftOnlyCuts = this.cuts.filter(sideFilter(zPos));
      const rightOnlyCuts = this.cuts.filter(sideFilter(zNeg));
      if (leftOnlyCuts.length === rightOnlyCuts.length) return 'Both';
      return leftOnlyCuts.length < rightOnlyCuts.length ? 'Left' : 'Right';
    };

    const normRotz = Line3D.coDirectionalRotations(this.normals(true));
    let noJointModel = env.modelInfo.extended[part.id] || env.modelInfo.model[part.id];
    let poly;
    try {
      if (!(noJointModel instanceof CSG)) noJointModel = CSG.fromPolygons(noJointModel.polygons, true);
    } catch (e) {
      console.log('here');
    }
    const normInfoRight = noJointModel.normalize(normRotz, true, false);
    const normInfoLeft = noJointModel.normalize(normRotz, false, false);

    this.normalize = (rightOleft, model) => {
      if (model === undefined) return;
      let normalizeInfo;
      if (rightOleft === true) normalizeInfo = normInfoRight;
      else if (rightOleft === false) normalizeInfo = normInfoLeft;
      else return model;
      if (model.clone) {
        model = model.clone();
        model.rotate(normalizeInfo.rotations, {x:0, y:0, z:0});
        if (model.translate) model.translate(normalizeInfo.translationVector);
      } else {
        model = model.copy();
        model.rotate(normalizeInfo.rotations, {x:0, y:0, z:0});
        if (model.translate) model = model.translate(normalizeInfo.translationVector);
      }
      return model;
    };

    this.model = (rightOleft, joints) => {
      let model = this.noJointModel();
      let maleModels;
      if (joints === undefined && cutInfo) {
          const side = rightOleft ? 'Right' : 'Left';
          const cuts = cutInfo.filter(c => c.primarySide() === side || c.primarySide() === 'Both');
          maleModels = cuts.map(c => c.maleModel());
      } else {
        if (joints === undefined) {
          const jointInfo = this.jointInfo(rightOleft);
          joints = jointInfo.map(ji => ji.joint());
        }
        const males = [];
        joints.forEach(j => males.concatInPlace(env.jointMap[j.id].male));
        maleModels = males.map(maleId => this.joinedModel(maleId));
      }

      maleModels.forEach(csg => model = model.subtract(csg));
      return this.normalize(rightOleft, model);
    };

    this.polygons = (rightOleft, joints) => {
      let model = this.model(rightOleft, joints);

      const polys = Polygon3D.merge(Polygon3D.fromCSG(model));
      return polys;
    };

    this.noJointModel = (rightOleft) => {
      return this.normalize(rightOleft, noJointModel);
    };
    this.joinedModel = (id) => {
      let model = env.modelInfo.joined[id || this.part().id];
      if (!(model instanceof CSG)) model = CSG.fromPolygons(model.polygons, true);
      return model;
    }

    let currentModel = this.noJointModel();
    this.currentModel = (rightOleft) => {
      return this.normalize(rightOleft, currentModel);
    };

    const rightFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'Left' && (type === undefined || type === ji.type()));
    const leftFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'Right' && (type === undefined || type === ji.type()));
    const jointMap = {};
    this.jointInfo = (rightOleft, type) => {
      const femaleMap = env.jointMap.female[part.id];
      if(femaleMap === undefined) return [];
      let filter = rightOleft === true ? rightFilter(type) :
                   (rightOleft === false ? leftFilter(type) : null);
      const joints = femaleMap.map(jid => env.byId[jid]);
      let jointInfos = joints.map(j => {
        const hash = Object.hash(j);
        if (jointMap[hash] === undefined) {
          jointMap[hash] = new JointInfo(j, this);
        }
        return jointMap[hash];
      });
      jointInfos.sortByAttr('joint.priority', true)
      if (filter === null) return jointInfos;
      return jointInfos.filter(filter);
    };

    const round = (val) => Math.round(val * 1000)/1000;
    this.demensions = () => {
      let model = this.model();
      if (model.polygons.length === 0) return {x:0, y:0, z:0};
      model = this.normalize(true, model);
      const dems = model.demensions();
      dems.x = round(dems.x); dems.y = round(dems.y); dems.z = round(dems.z);
      return dems;
    };

    let toolingInformation;
    this.toolingInformation = () => {
      if (toolingInformation === undefined) toolingInformation = new ToolingInfo(this.cutInfo);
      return toolingInformation;
    }

    this.to2D = (rightOleft, csgOpolyOlineOvertex) => {
      const normalized = this.normalize(rightOleft, csgOpolyOlineOvertex);
      if(csgOpolyOlineOvertex instanceof Vertex3D || csgOpolyOlineOvertex instanceof Line3D ||
          csgOpolyOlineOvertex instanceof Layer) {
        return normalized.to2D('x', 'y');
      }
      return Polygon3D.lines2d(normalized, 'x', 'y');
    }


    const furthestVertexFromOrign = (rightOleft) => {
      const polys = Polygon3D.fromCSG(this.noJointModel());
      const verts = [];
      polys.forEach(p => verts.concatInPlace(p.vertices()));
      verts.sort(Vertex3D.sortByCenter(Vertex3D.origin));
      const vert2d = this.normalize(rightOleft, verts[verts.length - 1]).to2D('x', 'y');
      return vert2d;
    }

    this.demensionEdges = (rightOleft) => {
      const model = this.model(rightOleft);
      const center = new Vertex3D(model.center()).to2D('x', 'y');
      const dems = model.demensions();
      return Polygon2d.fromDemensions(dems, center).lines();
    }

    this.edges = (rightOleft) => {
      if (part.partCode === 'mfp') {
        console.log('here');
        this.parrimeterInfo();
      }
      let applicableEdges;
      applicableEdges = Layer.to2D(this.noJointModel(rightOleft), 'x', 'y');
      let index = 'A'.charCodeAt(0);
      const center = Line2d.center(applicableEdges);
      applicableEdges = new Parimeters2d(applicableEdges).largest().lines();
      Line2d.radialSort(applicableEdges, true, center, furthestVertexFromOrign(rightOleft));
      if (rightOleft) {
        // applicableEdges = applicableEdges.slice(1,).concat(applicableEdges[0]);
        applicableEdges.reverse();
      }
      applicableEdges.forEach(l => l.label = String.fromCharCode(index++));
      applicableEdges.center = center;
      return applicableEdges;
    }

    this.fenceEdges = (rightOleft) => {
      let edges = this.edges(rightOleft);
      let center;
      center = Line2d.center(edges);

      const sets = Line2d.parrelleSets(edges);
      sets.forEach(s => s.sort(Line2d.distanceSort(center, false)));

      sets.map(s => s.map(l => l.length()))

      const fenceEdges = [];
      const pushIndex = (s, index) => s[index] && fenceEdges.push(s[index]);
      sets.forEach(s => pushIndex(s, s.length - 1) & pushIndex(s, s.length - 2));
      return fenceEdges;
    }

    const edgePolys = {};
    this.edgePolys = (rightOleft) => {
      const model = this.noJointModel();
      const zNorm = this.normals().z;
      const polys = Polygon3D.fromCSG(model)
                      .filter(p => Math.abs(p.normal().dot(zNorm)) < .999);
      Polygon3D.radialSort2D(polys, zNorm);
      const normalized = polys.map(p => this.normalize(rightOleft, p));
      let index = 'A'.charCodeAt(0);
      normalized.forEach(p => p.label = String.fromCharCode(index++));
      return normalized;
    }

    const sortByNorm = (norm) => (l1, l2) => {
      const mid1 = l1.midpoint();
      const mid2 = l2.midpoint();
      if (mid1.equals(mid2)) return 0;
      const trans = mid1.translate(norm, true);
      return mid2.distance(mid1) < mid2.distance(trans) ? -1 : 1;

    }

    const dotLessThan = (val, target) => (l) => Math.abs(l.vector().unit().dot(target)) < val;
    function groupInlinePoly(poly, zNorm) {
      zNorm ||= this.normalize(rightOleft, this.normals().z);
      const dotLess = dotLessThan(.5, zNorm);
      const lines = poly.lines();
      if (lines.length !== 4) console.warn('This algorithum expects 4 sided polygons');
      const inline = lines.filter((l) => !dotLess(l));
      const perp = lines.filter(dotLess);
      inline.sort(sortByNorm(zNorm));
      perp.sort(sortByNorm(zNorm));
      if (perp.length !== 2 || inline.length !== 2) {
        console.warn('Only two edges should in each group');
      }
      return {inline, perp, label: poly.label};
    }

    this.edges3D = (rightOleft) => {
      const polys = this.edgePolys(rightOleft);
      const center = this.normalize(rightOleft, new Vertex3D(noJointModel.center()));
      const distSorter = Line3D.distanceSort(center, true);
      const edges = [];
      const zNorm = this.normalize(rightOleft, this.normals().z);
      polys.forEach(poly => {
        const perp = groupInlinePoly(poly, zNorm).perp;
        const furthestEdge = perp.sort(distSorter)[1];
        edges.push(furthestEdge);
        furthestEdge.label = poly.label;
      });
      return edges;
    }

    this.edges2D = (rightOleft) => {
      const edges = [];
      this.edges3D(rightOleft).forEach(line => {
        const l2d = line.to2D('x', 'y');
        l2d.label = line.label;
        edges.push(l2d);
      });
      return edges;
    }

    this.fencePlanes = (rightOleft) => {
      const edges = this.edges3D(rightOleft);
      const planes = [];
      const zNorm = this.normals().z;
      edges.forEach(line => {
        const thirdPoint = line.midpoint().translate(zNorm);
        const plane = new Plane(line[0], line[1], thirdPoint);
        plane.label = line.label;
        planes.push(plane);
      });
      return planes
    }

    this.parrimeterInfo = () => {
      const polys = this.edgePolys(true);
      const edges = this.edges2D();
      const info = {edges: {}, corners: {}};
      const zNorm = this.normalize(true, this.normals().z);
      let lastGrouped = groupInlinePoly(polys[polys.length - 1], zNorm);
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index];
        const norms = poly.normals();
        const currGrouped = groupInlinePoly(poly, zNorm);
        const planeLine = currGrouped.perp[0].connect(currGrouped.perp[1].midpoint());
        const planeUnit = planeLine.vector().unit();
        let edgeRadViewVect = planeUnit.inverse().crossProduct(zNorm);
        //let edgeRadViewVect = Math.abs(norms.x.dot(zNorm)) < Math.abs(norms.y.dot(zNorm)) ? norms.x : norms.y;
        let radians = Line3D.thetaBetween(new Line3D(planeUnit), new Line3D(zNorm), edgeRadViewVect, true);
        const length = edges[index].length();
        info.edges[poly.label] = {radians, length, label: poly.label};

        const cornerRadViewVect = currGrouped.perp[0].vector().unit().crossProduct(lastGrouped.perp[0].vector().unit());
        const cornerId = `${lastGrouped.label}${poly.label}`;
        const point = currGrouped.perp[0].intersection(lastGrouped.perp[0]);
        radians = Line3D.thetaBetween(currGrouped.perp[0], lastGrouped.perp[0], cornerRadViewVect, true);
        info.corners[cornerId] = {point, radians, label: cornerId};

        lastGrouped = currGrouped;
      }
      return info;
    }

    this.parrimeterInfo.toDrawString = () => {
      const {edges, corners} = this.parrimeterInfo();
      const cornerStr = Object.values(corners).map(i => `// ${i.label}@${Math.roundTo(Math.toDegrees(i.radians), .1)}deg\n${i.point.toString(.001)}`).join('\n');
      const polys = this.edgePolys(true);
      const polyStr = polys.map(p => `// ${p.label}:${Math.roundTo(edges[p.label].length/2.54, .01)}@${Math.roundTo(Math.toDegrees(edges[p.label].radians), .1)}deg\n${p.toDrawString()}`).join('\n');
      return `${cornerStr}\n\n${polyStr}`;
    }

    if (this.cuts && this.cuts.length > 0) return this.cuts;
    const jointInfo = this.jointInfo();
    const cutInfo = [];
    if (part.locationCode.match(/sh/)) {
      console.log('her');
    }
    jointInfo.forEach(ji => cutInfo.concatInPlace(ji.cutInfo()));
// console.log(cutInfo.map(c => `//${c.jointInfo().joint().descriptor}\n${Polygon3D.toDrawString(c.set(), String.nextColor())}`).join('\n\n'));
    // CutInfo.clean(cutInfo);
    const edgeJoint = new JointInfo({descriptor: 'edge'}, this);
    cutInfo.concatInPlace(CutInfo.fromEdges(this.polygons(), this.normals(), edgeJoint));
    this.cuts = cutInfo;
    console.log(this.joinedModel().toDrawString('red'), '\n\n', CutInfo.toDrawString(this.cuts))
    this.cutInfo = cutInfo;
  }
}

module.exports = PartInfo;
