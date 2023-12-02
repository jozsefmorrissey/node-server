
const JointInfo = require('./joint');
const CutInfo = require('./cuts/cut');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Line3D = require('../../three-d/objects/line.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const FunctionCache = require('../../../../../public/js/utils/services/function-cache.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');

FunctionCache.on('long-refresh', 4000);

class PartInfo {
  constructor(part) {
    let parts = [part];
    this.parts = () => parts.map(p => p);
    this.merge = (partInfo) => {
      // TODO: this Test definiatly needs to be more robust
      if (partInfo.cutInfo().length > 0) return;
      if (Object.equals(partInfo.demensions(), this.demensions())) {
        parts.concatInPlace(partInfo.parts());
        return true;
      }
      return false;
    }

    this.normals = () => part.position().normals();

    this.noJointmodel = new FunctionCache((rightOleft) => {
      return part.toModel([]);
    }, 'long-refresh', this);

    const sideFilter = (vect) => c => c.set().filter(p => vect.equals(p.normal())).length > 0;
    // primarySide: Is the side you do not want to damage.
    this.primarySide = new FunctionCache(() => {
      const normals = this.normals();
      const zPos = normals.z;
      const zNeg = zPos.inverse();
      const leftOnlyCuts = this.cuts.filter(sideFilter(zPos));
      const rightOnlyCuts = this.cuts.filter(sideFilter(zNeg));
      return leftOnlyCuts.length < rightOnlyCuts.length ? 'Left' : 'Right';
    }, 'long-refresh', this);

    const normRotz = part.position().normalizingRotations();
    const normInfoRight = this.noJointmodel().normalize(normRotz, true, false);
    const normInfoLeft = this.noJointmodel().normalize(normRotz, false, false);

    this.normalize = new FunctionCache((rightOleft, model) => {
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
    }, 'long-refresh', this);

    this.model = new FunctionCache((rightOleft, joints) => {
      if (joints === undefined) {
        const jointInfo = this.jointInfo(rightOleft);
        joints = jointInfo.map(ji => ji.joint());
      }
      let model = part.toModel(joints);

      return this.normalize(rightOleft, model);
    }, 'long-refresh', this);

    this.noJointmodel = new FunctionCache((rightOleft) => {
      return this.normalize(rightOleft, part.toModel([]));
    }, 'long-refresh', this);

    this.cutsOnlyModel = new FunctionCache((rightOleft) => {
      const cuts = this.cutInfo().filter(ji => ji.constructor === CutInfo);
      const joints = cuts.map(c => c.jointInfo().joint());
      return this.model(rightOleft, joints);
    }, 'long-refresh', this);

    const rightFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'Left' && (type === undefined || type === ji.type()));
    const leftFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'Right' && (type === undefined || type === ji.type()));
    const jointMap = {};
    this.jointInfo = new FunctionCache((rightOleft, type) => {
      let filter = rightOleft === true ? rightFilter(type) :
                   (rightOleft === false ? leftFilter(type) : null);
      const joints = part.getJoints().female;
      let jointInfos = joints.map(j => {
        const hash = j.toString().hash();
        if (jointMap[hash] === undefined) {
          jointMap[hash] = new JointInfo(j, this);
        }
        return jointMap[hash];
      });
      // jointInfos.sort((ji1, ji2) => ji1.order() - ji2.order())
      if (filter === null) return jointInfos;
      return jointInfos.filter(filter);
    }, 'long-refresh', this);

    this.cutInfo = new FunctionCache(() => {
      if (this.cuts && this.cuts.length > 0) return this.cuts;
      const jointInfo = this.jointInfo();
      const cutInfo = [];
      jointInfo.forEach(ji => cutInfo.concatInPlace(ji.cutInfo()));
//console.log(cutInfo.map(c => `//${c.jointInfo().joint().toString()}\n${Polygon3D.toDrawString(c.set(), String.nextColor())}`).join('\n\n'))
      CutInfo.clean(cutInfo);
      this.cuts = cutInfo;
      return cutInfo;
    }, 'long-refresh', this);

    const round = (val) => Math.round(val * 1000)/1000;
    this.demensions = new FunctionCache(() => {
      const model = part.toModel();
      const dems = model.demensions();
      dems.x = round(dems.x); dems.y = round(dems.y); dems.z = round(dems.z);
      return dems;
    }, 'long-refresh', this);


    const sidesCut = [];
    this.cutMade = (cutLine3D) => {
      sidesCut.push(cutLine3D);
    }

    this.to2D = (rightOleft, csgOpolyOlineOvertex) => {
      const normalized = this.normalize(rightOleft, csgOpolyOlineOvertex);
      if(csgOpolyOlineOvertex instanceof Vertex3D || csgOpolyOlineOvertex instanceof Line3D) {
        return normalized.to2D('x', 'y');
      }
      return Polygon3D.lines2d(normalized, 'x', 'y');
    }


    const furthestVertexFromOrign = (rightOleft) => {
      const polys = Polygon3D.fromCSG(this.noJointmodel());
      const verts = [];
      polys.forEach(p => verts.concatInPlace(p.vertices()));
      verts.sort(Vertex3D.sortByCenter(Vertex3D.origin));
      const vert2d = this.normalize(rightOleft, verts[verts.length - 1]).to2D('x', 'y');
      return vert2d;
    }

    this.edges = (rightOleft, availbleEdgesOnly) => {
      let applicableEdges;
      if (availbleEdgesOnly === undefined) {
        const cutsOnly = this.cutsOnlyModel(rightOleft);
        applicableEdges = Polygon3D.lines2d(cutsOnly, 'x', 'y');
      } else {
        applicableEdges = Polygon3D.lines2d(this.noJointmodel(true), 'x', 'y');
        if (availbleEdgesOnly === true) {
          applicableEdges.concatInPlace(sidesCut.map(l => this.to2D(rightOleft, l)));
        }
      }
      let index = 'A'.charCodeAt(0);
      const center = Line2d.center(applicableEdges);
      applicableEdges.sort(Line2d.sorter(center, furthestVertexFromOrign(rightOleft)));
      if (rightOleft) {
        // applicableEdges = applicableEdges.slice(1,).concat(applicableEdges[0]);
        applicableEdges.reverse();
      }
      applicableEdges.forEach(l => l.label = String.fromCharCode(index++));
      applicableEdges.center = center;
      return applicableEdges;
    }
  }
}

module.exports = PartInfo;
