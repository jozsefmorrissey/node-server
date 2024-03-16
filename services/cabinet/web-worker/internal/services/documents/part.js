
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
    let noJointModel = env.modelInfo.model[part.id];
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
        model.translate(normalizeInfo.translationVector);
      } else {
        model = model.copy();
        model.rotate(normalizeInfo.rotations, {x:0, y:0, z:0});
        model = model.translate(normalizeInfo.translationVector);
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

      Polygon3D.merge(Polygon3D.fromCSG(model));
      return polys;
    };

    this.noJointModel = (rightOleft) => {
      return this.normalize(rightOleft, noJointModel);
    };
    this.joinedModel = (id) => {
      let model = env.modelInfo.joined[id];
      if (!(model instanceof CSG)) model = CSG.fromPolygons(model.polygons, true);
      return model;
    }

    let currentModel = this.noJointModel();
    this.currentModel = (rightOleft) => {
      return this.normalize(rightOleft, currentModel);
    };

    this.cutsOnlyModel = (rightOleft) => {
      const cuts = this.cutInfo.filter(ci => ci.constructor === CutInfo || ci.constructor.cutsOnly === true);
      let model = this.model(rightOleft, []);
      cuts.map(c => (model = model.subtract(this.normalize(rightOleft, c.jointInfo().model()))));
      return model;
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

    this.cutMade = (cutInfo) => {
      const mm = cutInfo.maleModel();
      if (mm && mm.polygons.length > 0)
        currentModel = currentModel.subtract(mm);
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

    this.edges = (rightOleft, availbleEdgesOnly) => {
      let applicableEdges;
      if (availbleEdgesOnly === undefined) {
        applicableEdges = Layer.to2D(this.cutsOnlyModel(rightOleft), 'x', 'y');
      } else {
        applicableEdges = Layer.to2D(this.currentModel(rightOleft), 'x', 'y');
      }
      let index = 'A'.charCodeAt(0);
      const center = Line2d.center(applicableEdges);
      applicableEdges = new Parimeters2d(applicableEdges).largest().lines();
      applicableEdges.sort(Line2d.sorter(center, furthestVertexFromOrign(rightOleft)));
      if (rightOleft) {
        // applicableEdges = applicableEdges.slice(1,).concat(applicableEdges[0]);
        applicableEdges.reverse();
      }
      applicableEdges.forEach(l => l.label = String.fromCharCode(index++));
      applicableEdges.center = center;
      return applicableEdges;
    }

    this.fenceEdges = (rightOleft, availbleEdgesOnly) => {
      let edges = this.edges(rightOleft);
      let center;
      if (availbleEdgesOnly) {
        const tolMap = new ToleranceMap({'radians.positive': `.001`});
        tolMap.addAll(edges);

        const edgeMap = {};
        edges = this.edges(rightOleft, availbleEdgesOnly);
        edges.forEach((l) => {
          const matches = tolMap.matches(l);
          const found = matches.filter(m => l.combine(m));
          if (found) found.forEach(l => edgeMap[Object.hash(l)] = l);
        });
        center = edges.center;
        delete edges.center;
        edges = Object.values(edgeMap);
      } else {
        center = Line2d.center(edges);
      }

      const sets = Line2d.parrelleSets(edges);
      sets.forEach(s => s.sort(Line2d.distanceSort(center, false)));

      if (availbleEdgesOnly && this.part().locationCode.match(/L|R/)) {
        console.log('her')
      }
      sets.map(s => s.map(l => l.length()))

      const fenceEdges = [];
      const pushIndex = (s, index) => s[index] && fenceEdges.push(s[index]);
      sets.forEach(s => pushIndex(s, s.length - 1) & pushIndex(s, s.length - 2));
      return fenceEdges;
    }

    this.fencePlanes = (rightOleft, availbleEdgesOnly) => {
      const fenceEdges = this.fenceEdges(rightOleft, availbleEdgesOnly);
      const lines3D = Line3D.from2D(fenceEdges);
      const planes = lines3D.map(l => Plane.fromPointNormal(l.midpoint(), l.vector().unit().crossProduct(Vector3D.k)));
      lines3D.forEach((l, i) => l.label = fenceEdges[i].label);
      planes.LINES = lines3D;
      return planes;
    }

    if (this.cuts && this.cuts.length > 0) return this.cuts;
    const jointInfo = this.jointInfo();
    const cutInfo = [];
    jointInfo.forEach(ji => cutInfo.concatInPlace(ji.cutInfo()));
// console.log(cutInfo.map(c => `//${c.jointInfo().joint().descriptor}\n${Polygon3D.toDrawString(c.set(), String.nextColor())}`).join('\n\n'));
    CutInfo.clean(cutInfo);
    this.cuts = cutInfo;
    // console.log(CutInfo.toDrawString(this.cuts))
    this.cutInfo = cutInfo;
  }
}

module.exports = PartInfo;
