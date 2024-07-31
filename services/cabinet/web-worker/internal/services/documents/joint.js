
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const CutInfo = require('./cuts/cut');

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
class JointInfo {
  constructor(joint, partInfo) {
    this.partInfo = () => partInfo;
    this.joint = () => joint;

    let jointModel;
    this.model = (zOnz, model) => {
      if (model instanceof CSG) jointModel = model;
      if (jointModel) model = jointModel;
      if (!(model instanceof CSG)) {
        let maleModel = new CSG();
        const env = partInfo.environment();
        const jointRel = env.jointMap[joint.id];
        const maleIds = (jointRel && jointRel.male) || [];
        const maleModels = maleIds.map(id => ensureCsg(env.modelInfo.joined[id]));
        maleModels.forEach(mm => maleModel = maleModel.union(mm));
        model = partInfo.noJointModel().clone().intersect(maleModel);
      }
      return partInfo.normalize(zOnz, model);
    };

    const sideFilter = (vect) => c => c.set().filter(p => vect.equals(p.normal())).length > 0;
    this.primarySide = () => {
      const normals = partInfo.normals();
      const zPos = normals.z;
      const zNeg = zPos.inverse();
      try {
        const zOnlyCuts = this.cuts.filter(sideFilter(zPos));
        const nzOnlyCuts = this.cuts.filter(sideFilter(zNeg));
        if (zOnlyCuts.length === 0 && nzOnlyCuts.length === 0) return 'Both';
        return zOnlyCuts.length < nzOnlyCuts.length ? 'z' : 'nz';
      } catch (e) {
        console.log(e);
      }
    };

    this.type = () => {
      return 'cut';
    }

    this.cuts = [];

    this.demensions = () => this.model().demensions();

    this.cutInfo = () => {
      if (this.cuts && this.cuts.length > 0) return this.cuts;
      const info = [];
      const noJointModel = this.partInfo().noJointModel();
      const env = partInfo.environment();
      const jointRel = env.jointMap[joint.id];
      const males = (jointRel && jointRel.male) || [];
      males.forEach(maleId => {
        try {
          const cut =  CutInfo.get(maleId, this, env);
          if (cut) info.push(cut);
        } catch (e) {
          console.error(e);
        }
      });
      this.cuts = info;
      return info;
    };
  }
}

module.exports = JointInfo;
