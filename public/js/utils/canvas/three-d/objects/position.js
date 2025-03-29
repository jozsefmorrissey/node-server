
const nOu = (val) => val !== null && val !== undefined;

class Position3D extends Array {
  constructor(x, y, z, calc) {
    super();
    this.set = (x,y,z,calc) => {
      if (Defined.none(z,calc)) {
        calc  = y;
        if (x && x.x) {
          z = x.z; y = x.y; x = x.x;
          nOu(x.calc) && (calc = x.calc);
        } else if (x && x.length) {
          nOu(x[3]) && (calc = x[3]);
          nOu(x[2]) && (z = x[2]);
          nOu(x[1]) && (y = x[1]);
          nOu(x[0]) && (x = x[0]);
        }
      }
      nOu(x) && (this[0] = x);
      nOu(y) && (this[1] = y);
      nOu(z) && (this[2] = z);
      if (nOu(calc)) this.calc = calc;
      return this;
    }

    this.toJson = () => ({
      _TYPE: this.constructor.name,
      xyz: Array.from(this),
      calc
    })

    this.set(x,y,z,calc);
  }
}

Position3D.fromJson = (json) => {
  return new Position3D(Object.fromJson(json.xyz), json.calc);
}

const getSet = (index) => ({
  get: function () {return this[index];},
  set: function (val) {return this[index] = val;}
});
Object.defineProperty(Position3D.prototype, 'i', getSet(0));
Object.defineProperty(Position3D.prototype, 'j', getSet(1));
Object.defineProperty(Position3D.prototype, 'k', getSet(2));

Object.defineProperty(Position3D.prototype, 'x', getSet(0));
Object.defineProperty(Position3D.prototype, 'y', getSet(1));
Object.defineProperty(Position3D.prototype, 'z', getSet(2));

Object.class.register(Position3D);
Position3D.fromJson(new Position3D(1,2,3).toJson())
Object.fromJson(new Position3D(1,2,3).toJson())

module.exports = Position3D;
