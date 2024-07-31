
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
    const instance = this;
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
      const zOnlyCuts = this.cuts.filter(sideFilter(zPos));
      const nzOnlyCuts = this.cuts.filter(sideFilter(zNeg));
      if (zOnlyCuts.length === nzOnlyCuts.length) return 'Both';
      return zOnlyCuts.length < nzOnlyCuts.length ? 'z' : 'nz';
    };

    const normRotz = Line3D.coDirectionalRotations(this.normals(true));
    let noJointModel = env.modelInfo.extended[part.id] || env.modelInfo.model[part.id];
    let poly;
    try {
      if (!(noJointModel instanceof CSG)) noJointModel = CSG.fromPolygons(noJointModel.polygons, true);
    } catch (e) {
      console.log('here');
    }
    const normInfoNZ = noJointModel.normalize(normRotz, true, false);
    const normInfoZ = noJointModel.normalize(normRotz, false, false);

    this.normalize = (zOnz, model) => {
      if (model === undefined) return;
      if (Array.isArray(model)) return model.map(e => {
        const normed = this.normalize(zOnz, e);
        normed.label = e.label;
        return normed;
      });
      let normalizeInfo;
      if (zOnz === true) normalizeInfo = normInfoNZ;
      else if (zOnz === false) normalizeInfo = normInfoZ;
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

    this.model = (zOnz, joints) => {
      let model = this.noJointModel();
      let maleModels;
      if (joints === undefined && cutInfo) {
          const side = zOnz ? 'nz' : 'z';
          const cuts = cutInfo.filter(c => c.primarySide() === side || c.primarySide() === 'Both');
          maleModels = cuts.map(c => c.maleModel());
      } else {
        if (joints === undefined) {
          const jointInfo = this.jointInfo(zOnz);
          joints = jointInfo.map(ji => ji.joint());
        }
        const males = [];
        joints.forEach(j => males.concatInPlace(env.jointMap[j.id].male));
        maleModels = males.map(maleId => this.joinedModel(maleId));
      }

      maleModels.forEach(csg => model = model.subtract(csg));
      return this.normalize(zOnz, model);
    };

    this.layers = (zOnz) => {
      const layers = Layer.fromCSG(this.model(zOnz));
      layers.sort((a,b) => a.center().z - b.center().z);
      return layers;
    }

    this.polygons = (zOnz, joints) => {
      let model = this.model(zOnz, joints);

      const polys = Polygon3D.merge(Polygon3D.fromCSG(model));
      return polys;
    };

    this.noJointModel = (zOnz) => {
      return this.normalize(zOnz, noJointModel);
    };
    this.joinedModel = (id) => {
      let model = env.modelInfo.joined[id || this.part().id];
      if (!(model instanceof CSG)) model = CSG.fromPolygons(model.polygons, true);
      return model;
    }

    let currentModel = this.noJointModel();
    this.currentModel = (zOnz) => {
      return this.normalize(zOnz, currentModel);
    };

    const nzFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'z' && (type === undefined || type === ji.type()));
    const zFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'nz' && (type === undefined || type === ji.type()));
    const jointMap = {};
    this.jointInfo = (zOnz, type) => {
      const femaleMap = env.jointMap.female[part.id];
      if(femaleMap === undefined) return [];
      let filter = zOnz === true ? nzFilter(type) :
                   (zOnz === false ? zFilter(type) : null);
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
      const edgePolys = this.edges3D();
      const cutPolys = this.cutInfo.map(c => c.axis.poly('y', 'z'));
      if (toolingInformation === undefined) toolingInformation = new ToolingInfo(this.cutInfo);
      return toolingInformation;
    }

    const center = new Vertex3D(this.noJointModel().center());
    this.center = (zOnz) => this.normalize(zOnz, center);

    this.to2D = (zOnz, csgOpolyOlineOvertex) => {
      const normalized = this.normalize(zOnz, csgOpolyOlineOvertex);
      if(csgOpolyOlineOvertex instanceof Vertex3D || csgOpolyOlineOvertex instanceof Line3D ||
          csgOpolyOlineOvertex instanceof Layer) {
        return normalized.to2D('x', 'y');
      }
      return Polygon3D.lines2d(normalized, 'x', 'y');
    }


    const furthestVertexFromOrign = (zOnz) => {
      const polys = Polygon3D.fromCSG(this.noJointModel());
      const verts = [];
      polys.forEach(p => verts.concatInPlace(p.vertices()));
      verts.sort(Vertex3D.sortByCenter(Vertex3D.origin));
      const vert2d = this.normalize(zOnz, verts[verts.length - 1]).to2D('x', 'y');
      return vert2d;
    }

    this.demensionEdges = (zOnz) => {
      const model = this.model(zOnz);
      const center = new Vertex3D(model.center()).to2D('x', 'y');
      const dems = model.demensions();
      return Polygon2d.fromDemensions(dems, center).lines();
    }

    this.edges = (zOnz) => {
      if (part.partCode === 'mfp') {
        console.log('here');
        this.parrimeterInfo(true);
        this.parrimeterInfo(false);
      }
      let applicableEdges;
      applicableEdges = Layer.to2D(this.noJointModel(zOnz), 'x', 'y');
      let index = 'A'.charCodeAt(0);
      const center = Line2d.center(applicableEdges);
      applicableEdges = new Parimeters2d(applicableEdges).largest().lines();
      Line2d.radialSort(applicableEdges, true, center, furthestVertexFromOrign(zOnz));
      if (zOnz) {
        // applicableEdges = applicableEdges.slice(1,).concat(applicableEdges[0]);
        applicableEdges.reverse();
      }
      applicableEdges.forEach(l => l.label = String.fromCharCode(index++));
      applicableEdges.center = center;
      return applicableEdges;
    }

    this.fenceEdges = (zOnz) => {
      let edges = this.edges(zOnz);
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
    this.edgePolys = (zOnz) => {
      const model = this.noJointModel();
      const zNorm = this.normals().z;
      const allPolys = Polygon3D.fromCSG(model);
      const polys = []
      const frontBack = []
      for (let index = 0; index < allPolys.length; index++) {
        const poly = allPolys[index];
        if (Math.abs(poly.normal().dot(zNorm)) < .999) polys.push(poly);
        else if (poly.normal().dot(zNorm) > .999) frontBack[0] = poly;
        else if (poly.normal().dot(zNorm) < -.999) frontBack[1] = poly;
        else throw new Error('This should never happen');
      }
      Polygon3D.radialSort2D(polys, zNorm);

      const normalized = polys.map(p => this.normalize(zOnz, p));
      normalized.frontBack = frontBack.map(p => this.normalize(zOnz, p));
      let index = 'A'.charCodeAt(0);
      normalized.forEach(p => p.label = String.fromCharCode(index++));
      return normalized;
    }
    this.edgePolys.toDrawString = (faces, polys) => {
      polys ||= this.edgePolys();
      const c = noJointModel.center();
      const norms = this.normals();
      const normStrs = [norms.x.toDrawString('red', .1, c, 20),
                        norms.y.toDrawString('green', .1, c, 20),
                        norms.z.toDrawString('blue', .1, c, 20)];
      let edgeStrs = polys.map(p => p.toDrawString(String.color.distinct()));
      if (!faces) return edgeStrs.concat(normStrs).join('\n');
      let faceStrs = [polys.frontBack[0].toDrawString('blue'), polys.frontBack[1].toDrawString('black')];
      return faceStrs.concat(edgeStrs).concat(normStrs).join('\n');
    }

    const sortByNorm = (norm) => (l1, l2) => {
      const mid1 = l1.midpoint();
      const mid2 = l2.midpoint();
      if (mid1.equals(mid2)) return 0;
      const trans = mid1.translate(norm, true);
      return mid2.distance(mid1) < mid2.distance(trans) ? -1 : 1;

    }

    const dotLessThan = (val, target) => (l) => Math.abs(l.vector().unit().dot(target)) < val;
    function groupInlinePoly(poly) {
      const zNorm = instance.normals().z;
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

    this.edges3D = (zOnz) => {
      const polys = this.edgePolys();
      const center = new Vertex3D(noJointModel.center());
      const distSorter = Line3D.distanceSort(center, true);
      const edges = [];
      polys.forEach(poly => {
        const perp = groupInlinePoly(poly).perp;
        const furthestEdge = perp.sort(distSorter)[1];
        edges.push(furthestEdge);
        furthestEdge.label = poly.label;
      });
      return zOnz !== true && zOnz !== false ? edges :
        this.normalize(zOnz, edges);
    }

    this.edges2D = (zOnz) => {
      const edges = [];
      if ((typeof zOnz) !== 'boolean') zOnz = true;
      this.edges3D(zOnz).forEach(line => {
        const l2d = line.to2D('x', 'y');
        l2d.label = line.label;
        edges.push(l2d);
      });
      Line2d.radialSort(edges, true)
      return edges;
    }

    this.fencePlanes = (zOnz) => {
      const edges = this.edges3D(zOnz);
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

    if (this.cuts && this.cuts.length > 0) return this.cuts;
    const jointInfo = this.jointInfo();
    const cutInfo = [];
    if (part.locationCode.match(/sh/)) {
      console.log('her');
    }
    jointInfo.forEach(ji => cutInfo.concatInPlace(ji.cutInfo()));
// console.log(cutInfo.map(c => `//${c.jointInfo().joint().descriptor}\n${Polygon3D.toDrawString(c.set(), String.color.next())}`).join('\n\n'));
    // CutInfo.clean(cutInfo);
    const edgeJoint = new JointInfo({descriptor: 'edge'}, this);
    cutInfo.concatInPlace(CutInfo.fromEdges(this.polygons(), this.normals(), edgeJoint));
    this.cuts = cutInfo;
    console.log(this.joinedModel().toDrawString('red'), '\n\n', CutInfo.toDrawString(this.cuts))
    this.cutInfo = cutInfo;
  }
}

module.exports = PartInfo;
