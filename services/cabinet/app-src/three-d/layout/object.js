
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const SnapSquare = require('../../../../../public/js/utils/canvas/two-d/objects/snap/square.js');

class Bridge2dTo3D {
  constructor(obj3D, xCoord, xDem, yCoord, yDem, axis) {
    function setXY(x, y) {
      if (x instanceof Vertex2d) {
        y = x.y();
        x = x.x();
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
      const center2d = new Vertex2d(center3D[xCoord], center3D[yCoord]);
      if (updated) {
        obj3D.center(center3D);
        obj3D.snap2d.top().object().centerOn(center2d);
        console.warn.subtle('hacky fix', 10000);
      }
      return center2d;
    }

    this.layout = obj3D.layout;
    this.id = obj3D.id;
    this.name = obj3D.name;
    this.x = (x) => setXY(x).x();
    this.y = (y) => setXY(undefined, y).y();
    this.center = (newCenter) => setXY(newCenter);
    this.height = (value) => {
      if(value) obj3D[yDem](value);
      return obj3D[yDem]();
    }
    this.width = (value) => {
      if(value) obj3D[xDem](value);
      return obj3D[xDem]();
    }
    this.radians = (rads) => {
      const rotation = obj3D.rotation();
      if (rads !== undefined) {
        const radDiff = rads - Math.toRadians(rotation[axis]);
        rotation[axis] = Math.toDegrees(rads);
        console.warn.subtle('hacky fix', 10000);
        obj3D.snap2d.top().object().rotate(radDiff);
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
  constructor(layout, payload) {
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

    this.bridge.top = () => new Bridge2dTo3D(this, 'x', 'width', 'z', 'thickness', 'y');
    let topview = new SnapSquare(this.bridge.top(), 10);
    this.snap2d.top = () => topview;
    this.shouldSave = () => true;

    this.toString = () => `${this.constructor.name}: at${this.center()} ${payload}`;
  }
}

const objectClasses = [Object3D];

Object3D.register = (clazz) => {
  objectClasses.push(clazz);
}

Object3D.new = (...args) => {
  for (let index = objectClasses.length - 1; index > -1; index--) {
    const object = new (objectClasses[index])(...args);
    if (object) return object;
  }
  throw new Error('something went wrong...');
}

new Object3D();
module.exports = Object3D;
