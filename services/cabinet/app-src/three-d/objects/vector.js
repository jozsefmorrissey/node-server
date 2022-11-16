
const approximate = require('../../../../../public/js/utils/approximate.js').new(1);

class Vector3D {
  constructor(i, j, k) {
    this.i = () => i;
    this.j = () => j;
    this.k = () => k;

    this.magnitude = () => Math.sqrt(this.i()*this.i() + this.j()*this.j() + this.k()*this.k());
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
    this.divide = (vector) => {
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector, vector, vector);
      return new Vector3D(this.i() / vector.i(), this.j() / vector.j(), this.k() / vector.k());
    }
    this.toArray = () => [this.i(), this.j(), this.k()];
    this.dot = (vector) =>
      this.i() * vector.i() + this.j() * vector.j() + this.k() * vector.k();
    this.perpendicular = (vector) =>
      approximate.eq(this.dot(vector), 0);
    this.parrelle = (vector) => {
      let coef = approximate(this.i()) / approximate(vector.i()) ||
                  approximate(this.j()) / approximate(vector.j()) ||
                  approximate(this.k()) / approximate(vector.k());
      if (Math.abs(coef) === Infinity || coef === 0 || Number.isNaN(coef)) return null;
      return approximate.eq(vector.i() * coef, this.i()) &&
              approximate.eq(vector.j() * coef, this.j()) &&
              approximate.eq(vector.k() * coef, this.k());
    }
    this.crossProduct = (other) => {
      const i = this.j() * other.k() - this.k() * other.j();
      const j = this.i() * other.k() - this.k() * other.i();
      const k = this.i() * other.j() - this.j() * other.i();
      const mag = Math.sqrt(i*i+j*j+k*k);
      return new Vector3D(i/mag,j/-mag,k/mag);
    }
    this.inverse = () => new Vector3D(this.i()*-1, this.j()*-1, this.k()*-1);

    this.unit = () => {
      const i = this.i();const j = this.j();const k = this.k();
      const magnitude = Math.sqrt(i*i+j*j+k*k);
      return new Vector3D(i/magnitude, j/magnitude, k/magnitude);
    }
    this.equals = this.parrelle;
    this.toString = () => `<${i},  ${j},  ${k}>`;
  }
}

module.exports = Vector3D;
