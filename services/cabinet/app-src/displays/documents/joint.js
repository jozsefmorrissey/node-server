
const Polygon3D = require('../../three-d/objects/polygon.js');
const CutInfo = require('./cuts/cut');

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
        joint.maleModels().forEach(mm => maleModel = maleModel.union(mm));
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

    this.cutInfo = () => {
      if (this.cuts && this.cuts.length > 0) return this.cuts;
      const info = [];
      const noJointModel = this.partInfo().noJointModel();
      joint.maleModels().forEach(mm => {
        try {
          const cut =  CutInfo.get(mm, this);
          if (cut) info.push(cut);
        } catch (e) {
          console.error(e);
        }
      });
      this.cuts = info;
      return info;
    };

    this.cutInfo();
  }
}

module.exports = JointInfo;
