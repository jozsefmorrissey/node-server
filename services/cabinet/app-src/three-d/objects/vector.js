

class Vector3D {
  constructor(i, j, k) {
    this.i = () => i;
    this.j = () => j;
    this.k = () => k;

    this.minus = (vector) =>
      new Vector3D(this.i() - vector.i(), this.j() - vector.j(), this.k() - vector.k())
    this.add = (vector) =>
      new Vector3D(this.i() + vector.i(), this.j() + vector.j(), this.k() + vector.k())
    this.dot = (vector) => {
      const i = (this.j() * vector.k()) - (vector.j() * this.k());
      const j = (this.i() * vector.k()) - (vector.i() * this.k());
      const k = (this.i() * vector.j()) - (vector.i() * this.j());
      return new Vector3D(i,j,k);
    }
    this.perpendicular = (vector) =>
      ((this.i() * vector.i()) + (this.j() * vector.j()) + (this.k() * vector.k())) === 0;
    this.parrelle = (vector) => {
      let coef = this.i() / vector.i() || this.j() / vector.j() || this.k() / vector.k();
      if (Math.abs(coef) === Infinity || coef === 0 || Number.isNaN(coef)) return null;
      return vector.i() * coef === this.i() && vector.j() * coef === this.j() && vector.k() * coef === this.k();
    }

    this.crossProduct = (other) => {
      const i = this.j() * other.k() - this.k() * other.j();
      const j = this.i() * other.k() - this.k() * other.i();
      const k = this.i() * other.j() - this.j() * other.i();
      const mag = Math.sqrt(i*i+j*j+k*k);
      return new Vector3D(i/mag,j/-mag,k/mag);
    }
    this.equals = this.parrelle;
    this.toString = () => `<${i},  ${j},  ${k}>`;
  }
}

module.exports = Vector3D;
