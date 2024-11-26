
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');

const withinTol = new Tolerance(.00000001).within;

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

    this.dominant = () => Math.abs(i) > Math.abs(j) ? (Math.abs(i) > Math.abs(k) ? 'i' :
                            (Math.abs(k) > Math.abs(j) ? 'k' : 'j')) :
                            (Math.abs(j) > Math.abs(k) ? 'j' : 'k');

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
    this.parrelle.toAxis = (boolean) => {
      const unit = this.positiveUnit();
      if (withinTol(unit.i(), 1)) return (boolean ? true : 'x');
      if (withinTol(unit.j(), 1)) return (boolean ? true : 'y');
      if (withinTol(unit.k(), 1)) return (boolean ? true : 'z');
      return false;
    }

    this.to2D = (i, j) => Vector3D.to2D([this], i, j)[0];
    this.viewFromVector = (vector) => Vector3D.viewFromVector([this], vector)[0];


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

    this.rotate = (rotations, center, reverse) => {
      const point = {x: i, y: j, z: k};
      CSG.rotatePointAroundCenter(rotations, point, null, reverse);
      return new Vector3D(point);
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

    this.equivalent = (vector, tol) => !tol ? Vector3D.tolerance.within(vector.positiveUnit(), this.positiveUnit()) :
                  new Tolerance({i: tol, j: tol, k: tol}).within(new Vector3D(vector.positiveUnit()), this.positiveUnit());
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

Vector3D.viewFromVector = (vectors, vector, filter) => {
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

Vector3D.to2D = (vectors, i, j) => {
  i ||= 'i';
  j ||= 'j';
  const verts2D = [];
  for (let index = 0; index < vectors.length; index++) {
    verts2D.push(new Line2d(null, new Vertex2d(vectors[index][i](), vectors[index][j]())));
  }
  return verts2D;
}





function get2dLines(ortho1, ortho2, pivot) {
  if (pivot === 'i')
    return [ortho1.to2D('j','k'), ortho2.to2D('j','k')];
  if (pivot === 'j')
    return [ortho1.to2D('k','i'), ortho2.to2D('k','i')];
  if (pivot === 'k')
    return [ortho1.to2D('i','j'), ortho2.to2D('i','j')];
}

const pivotVectors = {i: new Vector3D(1,0,0), j: new Vector3D(0,1,0), k: new Vector3D(0,0,1)};
function determineRotation(unitLine, target, pivot, reverse) {
  const pivotVec = pivotVectors[pivot];
  // const orthoLine = Vector3D.viewFromVector([unitLine], pivotVec)[0];
  // const orthoTar = Vector3D.viewFromVector([target], pivotVec)[0];
  const twoDlines = get2dLines(unitLine, target, pivot);
  if (!twoDlines[0].isPoint() && !twoDlines[1].isPoint()) {
    const degrees = (twoDlines[0].radians.sub(twoDlines[1], false) * 180)/Math.PI;
    if (!Math.modTolerance(degrees, 0,360, .01)) {
      const rotation = {};
      rotation[pivot] = reverse ? degrees : -degrees;
      return rotation;
    }
  }
}

const revPivots = ['k', 'j', 'i'];
const pivots = ['i', 'j', 'k'];
const checkAllAreParrelle = (align, alignTo) => {
  let equal = true;
  for (let index = 0; index < align.length; index++) {
    if (!align[index].isParrelle(alignTo[index])) equal = false;
  }
  return equal;
}

let correctCount = 0;
const c = ['red', 'green', 'blue']
const dotCmp = (alignTo) => (l, i) => Math.abs(l.dot(alignTo[i]));
const alignToString = (align, unitLine, targetLine) => [unitLine ? unitLine.toString() : '', align.map((l,i) => l.toDrawString(c[i])).join('\n'),targetLine ? targetLine.toString() : ''].filter(l=>l).join('\n');
const rotStr = (rot) => rot ? `(${rot.i||''},${rot.j||''},${rot.k||''})` : '';
const rotationInfo = (len, aIndex, index, rot) => `// ${len} ${aIndex}${index} ${rotStr(rot)}`;
const snapShotStr = (len, aIndex, index, rot, align, unitLine, targetLine) =>
`${rotationInfo(len, aIndex, index, rot)}\n\n${alignToString(align, unitLine, targetLine)}\n`
function determinRotations(align, alignTo, reverse) {
  align = align.map(l => l.clone());
  const rotations = [];
  let cycles = 0;
  let keepGoing = true;
  let lastRotation;
  const center = {x:0,y:0,z:0};
  let axisCannotBeEqual;
  let icl = {incorrect: [], correct: [], snapShots: []}
  const dot = dotCmp(alignTo);
  proccess:
  while (keepGoing && cycles++ < 7) {
    for (let aIndex = 0; aIndex < align.length; aIndex++) {
      const targetLine = alignTo[aIndex];
      const rotationLength = rotations.length;
      for (let index = 0; index < pivots.length; index++) {
        const unitLine = align[aIndex];
        const pivot = (reverse ? revPivots : pivots)[index];
        const state = [align.map(v=>v.toString())];
        const rotation = determineRotation(unitLine, targetLine, pivot, reverse);
        if (rotation && !Object.equals(lastRotation, rotation)) {
          icl.snapShots.push(snapShotStr(icl.snapShots.length, aIndex, index, rotation, align, unitLine, targetLine));
          align = align.map(l => l.rotate(rotation, center, reverse));
          state[1] = align.map(v=>v.toString());
          const newRot = determineRotation(align[0], targetLine, pivot, reverse);
          if (newRot) {
            icl.incorrect.push({rotation});
            align = align.map(l => l.rotate(rotation, center, !reverse));
            state[2] = align.map(v=>v.toString());
            determineRotation(align[0], targetLine, pivot, reverse);
            // align[0].rotate(newRot).toString()
          } else {
            correctCount++;
            icl.correct.push(rotation);
          }
          rotations.push(rotation);
          lastRotation = rotation;
        }
        if (withinTol(align.sum(dot), alignTo.length)) break;
      }
      keepGoing = rotations.length !== rotationLength && align.map((l,i) => l.parrelle(alignTo[i])).contains(false);
    }
  }
  icl.snapShots.push(snapShotStr(icl.snapShots.length, align.length, pivots.length, null, align));
  if (icl.incorrect.length > 0) {
    console.log.logarithmic('rotations were incorrectly determined');
  }

  if (rotations.length > 4) {
    console.warn.logarithmic('Resolving rotations seams confused...');
    determinRotations(align, alignTo, reverse);
  }

  return rotations.length > 0 ? rotations : null;
}

const defaultAlignVectors = [
  new Vector3D(1,0,0),
  new Vector3D(0,1,0),
  new Vector3D(0,0,1)
]

Vector3D.coDirectionalRotations = (align, alignTo, reverse) => {
  if (alignTo == null) alignTo = defaultAlignVectors;
  if (!Array.isArray(align)) align = [align];
  if (!Array.isArray(alignTo)) alignTo = [alignTo];
  if (align.length != alignTo.length) throw new Error('The same number of vectors must be in align and alignTo');
  align = align.map(v => v.unit());
  alignTo = alignTo.map(v => v.unit());
  if (align.equals(alignTo) === true) {
    return [];
  }

  let rotations = determinRotations(align, alignTo, reverse);
  if (!reverse || rotations.length > 3) return rotations;
  const combine = {x: 0, y: 0, z:0};
  rotations.forEach(r => {
    combine.x += r.x ? r.x : 0;
    combine.y += r.y ? r.y : 0;
    combine.z += r.z ? r.z : 0;
  })
  return combine;
}






class SectorMap {
  constructor(normals, divideItterations) {
    if (!Number.isFinite(divideItterations)) divideItterations = 0;
    if (divideItterations > 1) throw new Error('algorythum needs to be improved for this to be feasible')
    const instance = this;
    normals ||= {x: Vector3D.i, y: Vector3D.j, z: Vector3D.k};
    if (normals.x) {
      this.Right = normals.x;
      this.Left = normals.x.inverse();
    }
    if (normals.y) {
      this.Top = normals.y;
      this.Bottom = normals.y.inverse();
    }
    if (normals.z) {
      this.Front = normals.z;
      this.Back = normals.z.inverse();
    }

    const vectorKey = (keys) => keys.sort().join(' ').toPascal();
    const addSector = (...keys) => {
      const key = vectorKey(keys);
      let vector = new Vector3D(0,0,0);
      keys.forEach(key => vector = vector.add(instance[key]));
      instance[key] = vector.unit();
    }

    function divide() {
      const keys = Object.keys(instance);
      for (let i = 0; i < keys.length; i++) {
        const vi = instance[keys[i]];
        for (let j = i + 1; j < keys.length; j++) {
          const vj = instance[keys[j]];
          for (let k = j + 1; k < keys.length; k++) {
            const vk = instance[keys[k]];
            if (!vi.parrelle(vk)) addSector(keys[i], keys[k]);
            if (!vi.parrelle(vj)) addSector(keys[i], keys[j]);
            if (!vi.parrelle(vk) && !vi.parrelle(vj) && !vj.parrelle(vk)) addSector(keys[i],keys[j],keys[k]);
          }
        }
      }
    }

    for (let index = 0; index < divideItterations; index++) divide();
    this.property('toString', () =>
      Object.keys(this).map((k,i) => `//${i} ${k}\n${this[k].toDrawString()}`).join('\n'), false);
  }
}
Vector3D.SectorMap = SectorMap;

const vMap = {
  i: new Vector3D(1,0,0),
  j: new Vector3D(0,1,0),
  k: new Vector3D(0,0,1),
  ij: new Vector3D(1,1,0).unit(),
  ik: new Vector3D(1,0,1).unit(),
  jk: new Vector3D(0,1,1).unit(),
}
Object.keys(vMap).forEach(k => Vector3D[k] = vMap[k]);

Vector3D.cardinal = (array) => array ? [vMap.i, vMap.j, vMap.k] :
                    {i: vMap.i, j: vMap.j, k: vMap.k};
Vector3D.cardinal.plus = (array) => array ? Object.values(vMap) : vMap;

const sectorVectors = [Vector3D.i, Vector3D.j, Vector3D.k,
  Vector3D.i.inverse(), Vector3D.j.inverse(), Vector3D.k.inverse()]
const secMap = new SectorMap();
Vector3D.sector = (vector, sectorMap) => {
  sectorMap ||= secMap;
  const keys = Object.keys(sectorMap);
  return keys[keys.maxIndex(k => sectorMap[k].dot(vector))];
  // sectorVectors[directionVectors.minIndex(v => v.dot(vector))];
}




Object.class.register(Vector3D, 'i', 'j', 'k');
Vector3D.fromJson = json => new Vector3D(json);

module.exports = Vector3D;
