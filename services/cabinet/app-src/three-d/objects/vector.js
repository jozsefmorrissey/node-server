
const approximate = require('../../../../../public/js/utils/approximate.js').new(1);
const Tolerance = require('../../../../../public/js/utils/tolerance.js');


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
      if (i.x !== undefined) {
        k = i.z;
        j = i.y;
        i = i.x;
      } else {
        k = i.k;
        j = i.j;
        i = i.i;
      }
    }
    i = isZero(i) ? 0 : i;
    j = isZero(j) ? 0 : j;
    k = isZero(k) ? 0 : k;
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
      // console.warn('Changed this function with out looking into the consequences');
      return this.dot(otherVect) >= 0;
      // return approximate.sameSign(otherVect.i(), this.i()) &&
      //         approximate.sameSign(otherVect.j(), this.j()) &&
      //         approximate.sameSign(otherVect.k(), this.k());
    }
    this.divide = (vector) => {
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector, vector, vector);
      return new Vector3D(this.i() / vector.i(), this.j() / vector.j(), this.k() / vector.k());
    }
    this.toArray = () => [this.i(), this.j(), this.k()];
    this.dot = (vector) =>
      this.i() * vector.i() + this.j() * vector.j() + this.k() * vector.k();
    this.perpendicular = (vector) =>
      Vector3D.tolerance.within(this.dot(vector), 0);
    this.parrelle = (vector) => {
      let coef = isZero(this.i()) ? 0 : this.i() / vector.i();
      if (isZero(coef)) coef = isZero(this.j()) ? 0 : this.j() / vector.j();
      if (isZero(coef)) coef = isZero(this.k()) ? 0 : this.k() / vector.k();
      if (isZero(coef)) return false;
      const equivVect = new Vector3D(vector.i() * coef, vector.j() * coef, vector.k() * coef);
      return Vector3D.tolerance.within(equivVect, this);
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

    this.hash = () => {
      let hash = 1;
      if (i) hash*=i > 0 ? i : -i; else hash*=1000000;
      if (j) hash*=j > 0 ? j : -j; else hash*=1000000;
      if (k) hash*=k > 0 ? k : -k; else hash*=1000000;
      return hash;
    }

    this.unit = () => {
      const i = this.i();const j = this.j();const k = this.k();
      const magnitude = Math.sqrt(i*i+j*j+k*k);
      return new Vector3D(i/magnitude, j/magnitude, k/magnitude);
    }

    this.positive = () =>
      i > 0 || (isZero(i) && j > 0) || (isZeros(i,j) && k > 0) ||
      isZeros(i, j, k);

    this.positiveUnit = () => {
      if (this.positive()) return this;
      if (!this.inverse().positive()) throw new Error('if this happens algorythums will fail 11/07/2023');
      return this.inverse();
    }

    this.equals = (vector, tol) => !tol ? Vector3D.tolerance.within(vector, this) :
                  new Tolerance({i: tol, j: tol, k: tol}).within(vector, this);
    this.toString = () => `<${i},  ${j},  ${k}>`;
  }
}

const tol = .00000001;
Vector3D.tolerance = new Tolerance({i: tol, j: tol, k: tol});

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

module.exports = Vector3D;
