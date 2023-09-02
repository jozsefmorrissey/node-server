
const CSG = require('../../../public/js/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Stairs extends SimpleModel {
  constructor(obj3D) {
    super();
    Object.getSet(this, {count: 2, treadLength: 10*2.54});
    if (obj3D) {
      obj3D.width(37*2.54);
      obj3D.height(20*2.54);
      obj3D.thickness = () => this.treadLength() * this.count();
    }

    this.toModel = () => {
      const count = this.count();
      const treadLength = this.treadLength();
      const rise = obj3D.height() / count;
      const width = obj3D.width();
      const height = obj3D.height();
      const center = obj3D.center();
      let model = new CSG();
      for (let index = 0; index < count; index++) {
        model = model.union(CSG.cube({
          radius: [width/2, rise/2, treadLength/2],
          center:[
            center.x,
            center.y - height / 2 + rise * index + rise/2,
            center.z - treadLength * count / 2 + treadLength/2 + treadLength * index
          ]
        }));
      }

      const modCenter = model.center();
      model.center({x:0,y:0,z:0});
      const rotation = obj3D.rotation().copy();
      model.rotate(rotation);
      model.center(modCenter);
      
      return model;
    }
  }
}

module.exports = Stairs;
