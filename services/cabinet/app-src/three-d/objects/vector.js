
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
    this.divide = (vector) => {
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector, vector, vector);
      return new Vector3D(this.i() / vector.i(), this.j() / vector.j(), this.k() / vector.k());
    }
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

    this.unit = () => {
      const attrs = ['i', 'j', 'k'];
      let maxIndex = 0;
      for (let index = 1; index < 3; index++)
        if (Math.abs(this[attrs[maxIndex]]()) < Math.abs(this[attrs[index]]())) maxIndex = index;
      const unit = [];
      const maxAttr = attrs[maxIndex];
      unit[maxIndex] = attrs[maxIndex] > 0 ? 1 : -1;
      const magnitudeOfMaxValue = this[maxAttr]() * (unit[maxAttr] < 0 ? -1 : 1);
      for (let index = 1; index < 4; index++) {
        const targetIndex = (index + maxIndex) % 3;
        const attr = attrs[targetIndex];
        unit[targetIndex] = this[attr]() / magnitudeOfMaxValue;
      }
      return new Vector3D(...unit);
    }
    this.equals = this.parrelle;
    this.toString = () => `<${i},  ${j},  ${k}>`;
  }
}

module.exports = Vector3D;
