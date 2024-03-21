
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const CutInfo = require('./cuts/cut');

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
class JointInfo {
  constructor(joint, partInfo) {
    this.partInfo = () => partInfo;
    this.joint = () => joint;

    let jointModel;
    this.model = (rightOleft, model) => {
      if (model instanceof CSG) jointModel = model;
      if (jointModel) model = jointModel;
      if (!(model instanceof CSG)) {
        let maleModel = new CSG();
        const env = partInfo.environment();
        const maleIds = env.jointMap[joint.id].male || [];
        const maleModels = maleIds.map(id => ensureCsg(env.modelInfo.joined[id]));
        maleModels.forEach(mm => maleModel = maleModel.union(mm));
        model = partInfo.noJointModel().clone().intersect(maleModel);
      }
      return partInfo.normalize(rightOleft, model);
    };

    const sideFilter = (vect) => c => c.set().filter(p => vect.equals(p.normal())).length > 0;
    this.primarySide = () => {
      const normals = partInfo.normals();
      const zPos = normals.z;
      const zNeg = zPos.inverse();
      try {
        const leftOnlyCuts = this.cuts.filter(sideFilter(zPos));
        const rightOnlyCuts = this.cuts.filter(sideFilter(zNeg));
        if (leftOnlyCuts.length === 0 && rightOnlyCuts.length === 0) return 'Both';
        return leftOnlyCuts.length < rightOnlyCuts.length ? 'Left' : 'Right';
      } catch (e) {
        console.log(e);
      }
    };

    this.type = () => {
      return 'cut';
    }

    this.cuts = [];

    this.demensions = () => this.model().demensions();

    this.cutInfo = (layersCovered) => {
      if (this.cuts && this.cuts.length > 0) return this.cuts;
      const info = [];
      const noJointModel = this.partInfo().noJointModel();
      const env = partInfo.environment();
      const males = env.jointMap[joint.id].male;
      males.forEach(maleId => {
        try {
          const cut =  CutInfo.get(maleId, this, env, layersCovered);
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
