
const Tolerance = require('../../../tolerance.js');
const ToleranceMap = require('../../../tolerance-map.js');

const withinTol = new Tolerance(.00000001).within;

function isZero(val) {
  return Vector2d.tolerance.bounds.i.within(val, 0);
}

function isZeros() {
  for (let index = 0; index < arguments.length; index++) {
    if (!isZero(arguments[index])) return false;
  }
  return true;
}


class Vector2d {
  constructor(i, j) {
    if (i instanceof Vector2d) return i;
    if (i instanceof Object) {
      if (Array.isArray(i)) {
        j = i[1];
        i = i[0];
      } else if (i.x !== undefined) {
        j = i.y;
        i = i.x;
      } else {
        j = i.j;
        i = i.i;
      }
    }
    this.i = () => i;
    this.j = () => j;

    this.dominant = () => Math.abs(i) > Math.abs(j) ? 'i' : 'j';

    this.magnitude = () => Math.sqrt(this.i()*this.i() + this.j()*this.j());
    this.magnitudeSQ = () => this.i()*this.i() + this.j()*this.j();
    this.minus = (vector) => {
      if (!(vector instanceof Vector2d)) vector = new Vector2d(vector, vector, vector);
      return new Vector2d(this.i() - vector.i(), this.j() - vector.j());
    }
    this.add = (vector) => {
      if (!(vector instanceof Vector2d)) vector = new Vector2d(vector, vector, vector);
      return new Vector2d(this.i() + vector.i(), this.j() + vector.j());
    }
    this.scale = (coef) => {
      return new Vector2d(coef*this.i(), coef*this.j());
    }
    this.sameDirection = (otherVect) => {
      return this.dot(otherVect) >= tol;
    }
    this.divide = (vector) => {
      if (!(vector instanceof Vector2d)) vector = new Vector2d(vector, vector, vector);
      return new Vector2d(this.i() / vector.i(), this.j() / vector.j());
    }
    this.toArray = (percision) => !percision ? [this.i(), this.j()] :
                  [Math.roundTo(this.i(), percision), Math.roundTo(this.j(), percision)];
    this.dot = (vector) =>
      this.i() * vector.i() + this.j() * vector.j();
    this.perpendicular = (vector, tol) => !tol ? isZero(this.dot(vector)) :
      Tolerance.within(tol)(this.dot(vector), 0);
    this.parrelle = (vector) => {
      let coef = isZero(this.i()) ? 0 : this.i() / vector.i();
      if (isZero(coef)) coef = isZero(this.j()) ? 0 : this.j() / vector.j();
      if (isZero(coef)) return false;
      const equivVect = new Vector2d(vector.i() * coef, vector.j() * coef);
      return Vector2d.tolerance.within(equivVect, this);
    }
    this.parrelle.toAxis = (boolean) => {
      const unit = this.positiveUnit();
      if (withinTol(unit.i(), 1)) return (boolean ? true : 'x');
      if (withinTol(unit.j(), 1)) return (boolean ? true : 'y');
      return false;
    }

    this.to2D = (i, j) => Vector2d.to2D([this], i, j)[0];
    this.viewFromVector = (vector) => Vector2d.viewFromVector([this], vector)[0];


    this.toDrawString = (color, percision, center, scale) => {
      color ||= '';
      scale ||= 1;
      const s = new Vector2d(center || [0,0,0]);
      const e = new Vector2d(s.i()+i*scale, s.j()+j*scale, s);
      const mrt = (v) => Math.roundTo(v, percision);
      return `${color}[(${mrt(s.i())},${mrt(s.j())}),(${mrt(e.i())},${mrt(e.j())})}))`;
    }

    const scalarStr = (val) => val >= tol ? '+' : '-';
    this.sectorScalar = () => {
      const scaleStr = `${scalarStr(i)}${scalarStr(j)}`;
      switch (scaleStr) {
        case '++': return 1;
        case '-+': return 2;
        case '+-': return 3;
        case '--': return 4;
      }
    }

    this.clone = () => new Vector2d(i,j);

    this.getPerpendicular = () => new Vector2d(j, -i).positiveUnit();

    this.rotate = (rotations, center, reverse) => {
      const point = {x: i, y: j, z: 0};
      CSG.rotatePointAroundCenter(rotations, point, null, reverse);
      return new Vector2d(point);
    }

    this.inverse = () => new Vector2d(this.i()*-1, this.j()*-1);

    this.projectOnTo = (v) => {
      const multiplier = this.dot(v) / v.magnitudeSQ();
      return v.scale(multiplier);
    }

    this.point = () => ({x: i, y: j});

    this.radians = (v) => Math.acos(this.unit().dot(v.unit()));
    this.angle = (v) => Math.toDegrees(this.radians(v));

    this.hash = () => {
      let hash = 1;
      if (i) hash*=i > 0 ? i : -i; else hash*=1000000;
      if (j) hash*=j > 0 ? j : -j; else hash*=1000000;
      return hash;
    }

    this.bisector = (v) => {
      return v.scale(this.magnitude()).add(this.scale(v.magnitude()));
    }

    this.unit = () => {
      const magnitude = this.magnitude();
      return new Vector2d(i/magnitude, j/magnitude);
    }

    this.positive = () =>
      i > tol || (isZero(i) && j > tol) || (isZeros(i,j)) ||
      isZeros(i, j,);

    this.positiveUnit = () => {
      if (this.positive()) return this.unit();
      if (!this.inverse().positive())
        throw new Error('if this happens algorythums will fail 11/07/2023');
      return this.inverse().unit();
    }

    this.acquiescent = (other) => {
      if (other === undefined) return this.positive() ? this : this.inverse();
      if (this.positive() !== other.positive()) return this.inverse();
      return this;
    }

    this.equivalent = (vector, tol) => !tol ? Vector2d.tolerance.within(vector.positiveUnit(), this.positiveUnit()) :
                  new Tolerance({i: tol, j: tol}).within(new Vector2d(vector.positiveUnit()), this.positiveUnit());
    this.equals = (vector, tol) => !tol ? Vector2d.tolerance.within(vector, this) :
                  new Tolerance({i: tol, j: tol}).within(new Vector2d(vector), this);
    this.toString = (percision) => !percision ? `<${i},  ${j}>` :
      `<${Math.roundTo(i, percision)},  ${Math.roundTo(j, percision)}>`;
  }
}

Object.defineProperty(Vector2d.prototype, 'x', {get: function () {return this.i()}});
Object.defineProperty(Vector2d.prototype, 'y', {get: function () {return this.j()}});

const tol = .01;
Vector2d.tolerance = new Tolerance({i: tol, j: tol});
Vector2d.ToleranceMap = (parrelle, tolerance) => {
  tolerance ||= tol;
  if (parrelle) return new ToleranceMap({'positiveUnit().i()': tolerance,
                                          'positiveUnit().j()': tolerance});
  return new ToleranceMap({i: tolerance,
                            j: tolerance});
  }

Vector2d.mostInLine = (vectors, target) => {
  let closest;
  target = target.unit();
  for (let index = 0; index < vectors.length; index++) {
    const vector = vectors[index];
    const dist = vector.minus(target).magnitude();
    if (closest === undefined || closest.dist > dist) {
      closest = {dist, vector};
    }
  }
  return closest.vector;
}

Vector2d.viewFromVector = (vectors, vector, filter) => {
  const negitive = !vector.positive();
  const orthoVects = [];
  const runFilter = (typeof filter) === 'function';
  for (let index = 0; index < vectors.length; index++) {
    const u = vectors[index];
    const projection = u.projectOnTo(vector);
    let orthogonal = u.minus(projection).scale(negitive ? 1 : -1);
    if (!runFilter || (runFilter && filter(orthogonal, vertex)))
      orthoVects.push(orthogonal);
  }
  return orthoVects;
}

const vMap = {
  i: new Vector2d(1,0),
  j: new Vector2d(0,1)
}
Object.keys(vMap).forEach(k => Vector2d[k] = vMap[k]);

Vector2d.cardinal = (array) => array ? [vMap.i, vMap.j] :
                    {i: vMap.i, j: vMap.j};
Vector2d.cardinal.plus = (array) => array ? Object.values(vMap) : vMap;

Object.class.register(Vector2d, 'i', 'j');
Vector2d.fromJson = json => new Vector2d(json);

module.exports = Vector2d;
