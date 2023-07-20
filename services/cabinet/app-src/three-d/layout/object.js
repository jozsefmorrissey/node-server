
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const SnapSquare = require('../../../../../public/js/utils/canvas/two-d/objects/snap/square.js');

class Bridge2dTo3D {
  constructor(obj3D, xCoord, xDem, yCoord, yDem) {
    const axis = 'z' !== xCoord && 'z' !== yCoord ? 'z' :
                  ('x' !== xCoord && 'x' !== yCoord ? 'x' : 'y');
    function setXYZ(x, y, z) {
      if (x instanceof Vertex2d) {
        y = x.y();
        x = x.x();
      }
      if (x instanceof Vertex3D) {
        y = x.y;
        zs = x.z;
        x = x.x;
      }
      const center3D = obj3D.center();
      let updated = false;
      if (x !== undefined) {
        center3D[xCoord] = x;
        updated = true;
      }
      if (y !== undefined) {
        center3D[yCoord] = y;
        updated = true;
      }
      if (z !== undefined) {
        center3D[axis] = z;
        updated = true;
      }

      if (updated) {
        obj3D.center(center3D);
      }
      return obj3D.center();
    }

    this.layout = obj3D.layout;
    this.id = obj3D.id;
    this.name = obj3D.name;
    this.x = (x) => setXYZ(x)[xCoord];
    this.y = (y) => setXYZ(undefined, y)[yCoord];
    this.center = (newCenter) => {
      const center3D = setXYZ(newCenter);
      return new Vertex2d(center3D[xCoord], center3D[yCoord]);
    }
    this.fromFloor = (distance) => setXYZ(undefined, undefined, distance)[axis];
    this.fromCeiling = (distance) => {
      const fromFloor = this.fromFloor();
      const ceilh = obj3D.layout().ceilingHeight();
      const height = obj3D.height();
      if (Number.isFinite(distance)) {
        const fromFloor = ceilh - height - distance;
        this.fromFloor(fromFloor);
      }
      return ceilh - (this.fromFloor() + height);
    }
    this.height = (value) => {
      if(value) obj3D[yDem](value);
      return obj3D[yDem]();
    }
    this.width = (value) => {
      if(value) obj3D[xDem](value);
      return obj3D[xDem]();
    }
    this.radians = (rads) => {
      if (rads !== undefined && rads > 0) {
        console.log('rads:', this.radians());
      }
      const rotation = obj3D.rotation();
      if (rads !== undefined) {
        const radDiff = rads - Math.toRadians(rotation[axis]);
        rotation[axis] = Math.toDegrees(rads);
        obj3D.rotation(rotation);
      }
      return Math.toRadians(rotation[axis]);
    }
    this.angle = (angle) => {
      if (angle !== undefined) this.radians(Math.toRadians(angle));
      return Math.toDegrees(this.radians());
    }
    this.rotate = (rads) => this.radians(rads + Math.toRadians(obj3D.rotation()[axis]));
  }
}

class Object3D extends Lookup {
  constructor(payload, layout) {
    // super(undefined, undefined, true);
    super();
    this.layout = () => layout;
    this.snap2d = {};
    this.bridge = {};
    Object.getSet(this, {center: new Vertex3D(),
                          height: 34*2.54,
                          width: 32*2.54,
                          thickness: 24*2.54,
                          rotation: {x: 0, y: 0, z:0},
                          name: ``});

    this.payload = () => payload;

    // Consider simplifying bridge, should only need the rotation axis as argument;

    this.bridge.top = () => new Bridge2dTo3D(this, 'x', 'width', 'z', 'thickness');
    let topview = new SnapSquare(this.bridge.top(), 10);
    this.snap2d.top = () => topview;
    this.shouldSave = () => true;

    this.toString = () => `${this.constructor.name}: at${this.center()} ${payload}`;
  }
}

const objectClasses = [];

Object3D.register = (clazz) => {
  objectClasses.push(clazz);
}


Object3D.new = (...args) => {
  for (let index = objectClasses.length - 1; index > -1; index--) {
    const cxtr = objectClasses[index];
    const object = cxtr.build(...args);
    if (object) return object;
  }
  return new Object3D(...args);
}

new Object3D();
module.exports = Object3D;
