
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Toilet extends SimpleModel {
  constructor(obj3D) {
    super(obj3D);
    if (obj3D) {
      obj3D.width(18*2.54);
      obj3D.height(28*2.54);
      obj3D.thickness(29*2.54);
    }

    this.toModel = () => {
      const third = obj3D.thickness()/3;
      const center = obj3D.center();
      const height = obj3D.height();
      const depth = obj3D.thickness();
      const bowlCenter = [
        center.x,
        center.y,
        center.z - third/2
      ];

      const bowl = CSG.sphere({
           center: bowlCenter,
           radius: third,
      });

      const cutterCenter = [
        center.x,
        center.y + third*2,
        center.z - third/2
      ];

      const bowlCutter = CSG.cube({
        radius: third*2,
        center: cutterCenter
      });

      const pedistalHeight = third;
      const wallOffset = 2*2.54;
      const pedistal = CSG.cube({
        radius: [third/2, pedistalHeight/2, third],
        center:[
          center.x,
          center.y - height/2 + third/2,
          center.z + third/2 - wallOffset
        ]
      });

      const tankHeight = height - pedistalHeight;
      const tankWidth = third - wallOffset;
      const tank = CSG.cube({
        radius: [obj3D.width()/2, tankHeight/2, tankWidth/2],
        center: [
          center.x,
          (center.y + height/2 - tankHeight/2),
          center.z + depth/2 - wallOffset - tankWidth/2
        ]
      });

      const model = bowl.subtract(bowlCutter).union(pedistal).union(tank);
      const modCenter = model.center();
      model.center({x:0,y:0,z:0});
      const rotation = obj3D.rotation().copy();
      model.rotate(rotation);
      model.center(modCenter);
      return model;
    }
  }
}

module.exports = Toilet;
