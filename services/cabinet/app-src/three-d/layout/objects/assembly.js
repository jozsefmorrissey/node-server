const Object3D = require('../object');
const Vertex3D = require('../../objects/vertex.js');
const Assembly = require('../../../objects/assembly/assembly.js');
const SnapPolygon = require('../../../../../../public/js/utils/canvas/two-d/objects/snap/polygon.js');

class Assembly3D extends Object3D {
  constructor(assembly) {
    super(assembly.id(), assembly);
    if (!(assembly instanceof Assembly)) return undefined;

    this.layout = assembly.layout;
    this.center = (vertex3D) => {
      const position = assembly.position();
      if (vertex3D instanceof Vertex3D) {
        position.setCenter('x', vertex3D.x);
        position.setCenter('y', vertex3D.y);
        position.setCenter('z', vertex3D.z);
      }
      return new Vertex3D(position.center());
    }
    this.height = assembly.length;
    this.width = assembly.width;
    this.thickness = assembly.thickness;
    this.name = assembly.name;
    this.snap2d.top = () => topSnap;
    this.shouldSave = () => false;

    this.rotation = (rotation) => {
      if (rotation) assembly.position().setRotation(rotation);
      return assembly.position().rotation();
    }

    const topSnap = new SnapPolygon(this.bridge.top(), assembly.view.top, 10);
  }
}

Object3D.register(Assembly);

module.exports = Assembly3D;
