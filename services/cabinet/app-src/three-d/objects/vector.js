
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');


function isZero(val) {
  return Vector3D.tolerance.bounds.i.within(val, 0);
}

function isZeros() {
  for (let index = 0; index < arguments.length; index++) {
    if (!isZero(arguments[index])) return false;
  }
  return true;
}


class Vector3D {
  constructor(i, j, k) {
    if (i instanceof Vector3D) return i;
    if (i instanceof Object) {
      if (Array.isArray(i)) {
        k = i[2];
        j = i[1];
        i = i[0];
      } else if (i.x !== undefined) {
        k = i.z;
        j = i.y;
        i = i.x;
      } else {
        k = i.k;
        j = i.j;
        i = i.i;
      }
    }
    this.i = () => i;
    this.j = () => j;
    this.k = () => k;

    this.magnitude = () => Math.sqrt(this.i()*this.i() + this.j()*this.j() + this.k()*this.k());
    this.magnitudeSQ = () => this.i()*this.i() + this.j()*this.j() + this.k()*this.k();
    this.minus = (vector) => {
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector, vector, vector);
      return new Vector3D(this.i() - vector.i(), this.j() - vector.j(), this.k() - vector.k());
    }
    this.add = (vector) => {
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector, vector, vector);
      return new Vector3D(this.i() + vector.i(), this.j() + vector.j(), this.k() + vector.k());
    }
    this.scale = (coef) => {
      return new Vector3D(coef*this.i(), coef*this.j(), coef*this.k());
    }
    this.sameDirection = (otherVect) => {
      return this.dot(otherVect) >= tol;
    }
    this.divide = (vector) => {
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector, vector, vector);
      return new Vector3D(this.i() / vector.i(), this.j() / vector.j(), this.k() / vector.k());
    }
    this.toArray = (percision) => !percision ? [this.i(), this.j(), this.k()] :
                  [Math.roundTo(this.i(), percision), Math.roundTo(this.j(), percision), Math.roundTo(this.k(), percision)];
    this.dot = (vector) =>
      this.i() * vector.i() + this.j() * vector.j() + this.k() * vector.k();
    this.perpendicular = (vector, tol) => !tol ? isZero(this.dot(vector)) :
      Tolerance.within(tol)(this.dot(vector), 0);
    this.parrelle = (vector) => {
      let coef = isZero(this.i()) ? 0 : this.i() / vector.i();
      if (isZero(coef)) coef = isZero(this.j()) ? 0 : this.j() / vector.j();
      if (isZero(coef)) coef = isZero(this.k()) ? 0 : this.k() / vector.k();
      if (isZero(coef)) return false;
      const equivVect = new Vector3D(vector.i() * coef, vector.j() * coef, vector.k() * coef);
      return Vector3D.tolerance.within(equivVect, this);
    }

    this.toDrawString = (color, percision, center, scale) => {
      color ||= '';
      scale ||= 1;
      const s = new Vector3D(center || [0,0,0]);
      const e = new Vector3D(s.i()+i*scale, s.j()+j*scale, s.k()+k*scale);
      const mrt = (v) => Math.roundTo(v, percision);
      return `${color}[(${mrt(s.i())},${mrt(s.j())},${mrt(s.k())}),(${mrt(e.i())},${mrt(e.j())},${mrt(e.k())}))`;
    }

    const scalarStr = (val) => val >= tol ? '+' : '-';
    this.sectorScalar = () => {
      const scaleStr = `${scalarStr(i)}${scalarStr(j)}${scalarStr(k)}`;
      switch (scaleStr) {
        case '+++': return 1;
        case '-++': return 2;
        case '++-': return 3;
        case '+-+': return 4;
        case '-+-': return 5;
        case '--+': return 6;
        case '+--': return 7;
        case '---': return 8;
      }
    }

    this.clone = () => new Vector3D(i,j,k);

    this.getPerpendicular = () => new Vector3D(
      Math.copysign(k, i),
      Math.copysign(k,j),
      -Math.copysign(i,k) - Math.copysign(j,k)
    );

    this.rotate = (rotations, center) => {
      const point = {x: i, y: j, z: k};
      CSG.rotatePointAroundCenter(rotations, point);
      i = point.x; j = point.y; k = point.z;
    }

    this.crossProduct = (other) => {
      const i = this.j() * other.k() - this.k() * other.j();
      const j = this.i() * other.k() - this.k() * other.i();
      const k = this.i() * other.j() - this.j() * other.i();
      const mag = Math.sqrt(i*i+j*j+k*k);
      return new Vector3D(i/mag || 0,j/-mag || 0,k/mag || 0);
    }
    this.inverse = () => new Vector3D(this.i()*-1, this.j()*-1, this.k()*-1);

    this.projectOnTo = (v) => {
      const multiplier = this.dot(v) / v.magnitudeSQ();
      return v.scale(multiplier);
    }

    this.point = () => ({x: i, y: j, z:k});

    this.radians = (v) => Math.acos(this.unit().dot(v.unit()));
    this.angle = (v) => Math.toDegrees(this.radians(v));

    this.hash = () => {
      let hash = 1;
      if (i) hash*=i > 0 ? i : -i; else hash*=1000000;
      if (j) hash*=j > 0 ? j : -j; else hash*=1000000;
      if (k) hash*=k > 0 ? k : -k; else hash*=1000000;
      return hash;
    }

    this.bisector = (v) => {
      return v.scale(this.magnitude()).add(this.scale(v.magnitude()));
    }

    this.unit = () => {
      const i = this.i();const j = this.j();const k = this.k();
      const magnitude = Math.sqrt(i*i+j*j+k*k);
      return new Vector3D(i/magnitude, j/magnitude, k/magnitude);
    }

    this.positive = () =>
      i > tol || (isZero(i) && j > tol) || (isZeros(i,j) && k > tol) ||
      isZeros(i, j, k);

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

    this.equals = (vector, tol) => !tol ? Vector3D.tolerance.within(vector, this) :
                  new Tolerance({i: tol, j: tol, k: tol}).within(new Vector3D(vector), this);
    this.toString = (percision) => !percision ? `<${i},  ${j},  ${k}>` :
      `<${Math.roundTo(i, percision)},  ${Math.roundTo(j, percision)},  ${Math.roundTo(k, percision)}>`;
  }
}

const tol = .0001;
Vector3D.tolerance = new Tolerance({i: tol, j: tol, k: tol});
Vector3D.ToleranceMap = (parrelle, tolerance) => {
  tolerance ||= tol;
  if (parrelle) return new ToleranceMap({'positiveUnit().i()': tolerance,
                                          'positiveUnit().j()': tolerance,
                                          'positiveUnit().k()': tolerance});
  return new ToleranceMap({i: tolerance,
                            j: tolerance,
                            k: tolerance});
  }

Vector3D.mostInLine = (vectors, target) => {
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

Vector3D.i = new Vector3D(1,0,0);
Vector3D.j = new Vector3D(0,1,0);
Vector3D.k = new Vector3D(0,0,1);
Vector3D.cardinal = (array) => array ? [Vector3D.i, Vector3D.j, Vector3D.k] :
                    {i: Vector3D.i, j: Vector3D.j, k: Vector3D.k};

const sectorVectors = [Vector3D.i, Vector3D.j, Vector3D.k,
  Vector3D.i.inverse(), Vector3D.j.inverse(), Vector3D.k.inverse()]
const sectorLabels = ['Left', 'Top', 'Front', 'Right', 'Bottom', 'Back'];
const sectorMap =
Vector3D.sector = (vector, sectorMap) => {
  sectorMap ||= {Right: Vector3D.i, Top: Vector3D.j, Front: Vector3D.k,
    Left: Vector3D.i.inverse(), Bottom: Vector3D.j.inverse(), Back: Vector3D.k.inverse()};
  const keys = Object.keys(sectorMap);
  return keys[keys.maxIndex(k => sectorMap[k].dot(vector))];
  // sectorVectors[directionVectors.minIndex(v => v.dot(vector))];
}

Object.class.register(Vector3D, 'i', 'j', 'k');
Vector3D.fromJson = json => new Vector3D(json);

module.exports = Vector3D;
