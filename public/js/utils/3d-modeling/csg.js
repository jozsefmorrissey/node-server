// TODO: Use Require Class to include ToleranceMap and STL
const ToleranceMap = require('../tolerance-map');
const STL = require('./STL');


// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
//
// Example usage:
//
//     var cube = CSG.cube();
//     var sphere = CSG.sphere({ radius: 1.3 });
//     var polygons = cube.subtract(sphere).toPolygons();
//
// ## Implementation Details
//
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
//
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
//
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
//
// ## License
//
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.

// # class CSG

// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.

CSG = function() {
  this.polygons = [];
  this.toString = (percision, includeColor) => {
    percision ||= .001;
    let strs = [];
    this.polygons.forEach(p => strs.push(p.toString(percision, includeColor)));
    strs.sort();
    return strs.join('\n');
  }
  this.toDrawString = (color, percision) => color ?
      this.toString(percision).replace(/(^|\n)\[/g, `$1${color}[`) :
      this.toString(percision, true).replace(/(^|\n)\[/g, `$1${'blue'}[`);
  this.vertices = (percision) => {
    const verts = [];
    this.polygons.forEach(p => p.vertices.forEach(v => verts.push(v)));
    return verts.unique(o => o.toString(percision || .0001));
  }
  //TODO: USE TOLERANCE MAP FOR 2N RUNTIME!!!;
  this.sharesVertex = function (other) {
    const otherVerts = other.vertices();
    for (let pi = 0; pi < this.polygons.length; pi++) {
      const poly = this.polygons[pi];
      for (let vi = 0; vi < poly.vertices.length; vi++) {
        const vert = poly.vertices[vi];
        for (let ovi = 0; ovi < otherVerts.length; ovi++) {
          if (otherVerts[ovi].equals(vert)) return true;
        }
      }
    }
    return false;
  }

  this.toSTL = (header) => {
    const stl = new STL(header);
    const scaled = this.clone();
    scaled.scale(10);
    scaled.polygons.forEach(p => stl.add.polygon(p.vertices.map(v => v.pos),
                            p.plane.normal, Color.rgb.percent(p.rgb())));
    return stl;
  }
};

CSG.BIG = 160934.4;//One Mile in cm

// Construct a CSG solid from a list of `CSG.Polygon` instances.
CSG.fromPolygons = function(polygons, deepCopy) {
  var csg = new CSG();

  if (deepCopy) {
    const newPolys = [];
    for (let pi = 0; pi < polygons.length; pi++) {
      const polygon = polygons[pi];
      const vertices =  polygon.vertices;
      const newVerts = [];
      const shared = polygon.shared ? Array.from(polygon.shared) : undefined;
      for (let vi = 0; vi < vertices.length; vi++) {
        const vert = vertices[vi];
        const norm = vert.normal;
        const pos = vert.pos;
        const newNorm = new CSG.Vector(norm.x, norm.y, norm.z);
        const newPos = new CSG.Vector(pos.x, pos.y, pos.z);
        newVerts.push(new CSG.Vertex(newPos, newNorm));
      }
      newPolys.push(new CSG.Polygon(newVerts, shared));
    }
    polygons = newPolys;
  }

  csg.polygons = polygons;
  return csg;
};

const oneTenth = (v) => ({x: v.x / 10, y: v.y /= 10, z: v.z /= 10});
CSG.fromSTL = (stl) => {
  const json = stl.toJson();
  const triangles = json.triangles;
  const polys = triangles.map(t => {
    const normal = new CSG.Vector(t.normal);
    if (normal.length() < .999) normal = CSG.normal(t.vertices[0], t.vertices[1], t.vertices[2]);
    const v1 = new CSG.Vertex(oneTenth(t.vertices[0]), normal);
    const v2 = new CSG.Vertex(oneTenth(t.vertices[1]), normal);
    const v3 = new CSG.Vertex(oneTenth(t.vertices[2]), normal);
    return new CSG.Polygon([v1,v2,v3], t.color);
  });
  const csg = CSG.fromPolygons(polys);
  return csg;
}

CSG.normal = (verts) => {
  if (verts.length < 3) throw new Error('Normal calculations require atleast 3 vertices');
  v0 = new CSG.Vector(verts[0]);
  v1 = new CSG.Vector(verts[1]);
  v2 = new CSG.Vector(verts[2]);
  return v1.minus(v0).cross(v1.minus(v2)).unit();
}

CSG.fromPolygon = (poly, offset) => {
  const front = poly.clone();
  const back = poly.clone();
  const offsetVect = poly.vertices[0].normal.times(offset);
  back.translate(offsetVect);
  const center = new CSG.Vector(front.center().pos).plus(new CSG.Vector(back.center().pos)).dividedBy(2);
  const len = poly.vertices.length;
  const fverts = front.vertices.map(v => new CSG.Vector(v.pos));
  const bverts = back.vertices.map(v => new CSG.Vector(v.pos));
  const sides = [];
  for (let index = 0; index < len; index++) {
    const vi1 = index%len;
    const vi2 = (index + 1)%len;
    const pts = [fverts[vi1], fverts[vi2], bverts[vi2], bverts[vi1]];
    let norm = pts[1].minus(pts[0]).cross(pts[1].minus(pts[2])).unit();
    const vertices = pts.map(p => new CSG.Vertex(p, norm));
    const poly = new CSG.Polygon(vertices);
    poly.alignNormal(center);
    sides.push(poly);
  }
  if (offset < 0) {
    back.vertices.forEach(v => v.normal = v.normal.times(-1));
    back.vertices.reverse();
    back.plane.normal = back.plane.normal.times(-1);
  } else {
    front.vertices.forEach(v => v.normal = v.normal.times(-1));
    front.vertices.reverse();
    front.plane.normal = front.plane.normal.times(-1);
  }
  front.alignNormal(center);
  back.alignNormal(center);
  console.log([front, back].concat(sides).map((p, i) => `// ${i} ${p.plane.normal.unit()}\n${p.toString()}`).join('\n'))
  const csg = CSG.fromPolygons([front, back].concat(sides));
  return csg;
}

function sliceConfig(x, y, width, dems, center) {
  if (!Array.isArray(dems)) dems = [dems.x, dems.y, dems.z];
  const notIncluded = [x,y].indexOf('z') === -1 ? 2 : ([x,y].indexOf('y')) === -1 ? 1 : 0;
  const length = dems[notIncluded];
  const demensions = dems.map(v => v);
  demensions[notIncluded] = width;
  const startOffset = [0, 0, 0];
  startOffset[notIncluded] = (length / -2) + (width / 2);
  center = center.translate(startOffset);
  center = [center.pos.x, center.pos.y, center.pos.z];
  let step = [0, 0, 0];
  step[notIncluded] = width;
  step = new CSG.Vector(step);
  const steps = Math.ceil(length/width);
  return {demensions, center, step, steps, width, index: 0};
}

CSG.fromString = function (string) {
  const numRegStr = '((-|)[0-9]*\\.[0-9]{1,}|[0-9]{1,})'
  const vertRegStr = `\\(${numRegStr},${numRegStr},${numRegStr}\\)`;
  const polyRegStr = `([a-zA-z0-9, ]*)\\[(${vertRegStr}(,|)){3,}\\]`;
  const polyRegG = new RegExp(polyRegStr, 'g');
  const polyReg = new RegExp(polyRegStr);
  const vertRegG = new RegExp(vertRegStr, 'g');
  const vertReg = new RegExp(vertRegStr);
  const numRegG = new RegExp(numRegStr, 'g');
  const numReg = new RegExp(numRegStr);

  const pf = Number.parseFloat;
  const polyStrs = string.match(polyRegG);
  if (polyStrs === null) return null;
  const polys = [];
  for (let i = 0; i < polyStrs.length; i++) {
    const vertStrs = polyStrs[i].match(vertRegG);
    let color = polyStrs[i].match(polyReg)[1];
    let colorMatch = color.match(numRegG);
    if (colorMatch && colorMatch.length === 3) color = colorMatch.map(s => pf(s));
    const verts = [];
    for (let j = 0; vertStrs && j < vertStrs.length; j++) {
      const match = vertStrs[j].match(vertReg);
      const vertex = {x: pf(match[1]), y: pf(match[3]), z: pf(match[5])};
      verts.push(vertex);
    }
    const a = new CSG.Vector(verts[0]);
    const b = new CSG.Vector(verts[1]);
    const c = new CSG.Vector(verts[2]);
    const norm = a.minus(b).cross(b.minus(c));
    const vertices = verts.map(v => new CSG.Vertex(v, norm));
    const poly = new CSG.Polygon(vertices);
    if (color) poly.setColor(color);
    polys.push(poly);
  }

  return CSG.fromPolygons(polys);
}

const vertexPercision = (percision, x, y, z) => ({
  x: percision ? Math.roundTo(x, percision) : x,
  y: percision ? Math.roundTo(y, percision) : y,
  z: percision ? Math.roundTo(z, percision) : z
});

CSG.toString = function (percision) {
  const list = [];
  this.polygons.forEach((polygon) => {
    const obj = {vertices: []};
    polygon.vertices.forEach((vertex) => {
      obj.vertices.push(vertexPercision(percision, vertex.pos.x, vertex.pos.y, vertex.pos.z));
    });
    list.push(obj);
  });
  return JSON.stringify(list, null, 2);
}

CSG.prototype = {
  clone: function() {
    var csg = new CSG();
    //csg.normals = this.normals;
    csg.polygons = this.polygons.map(function(p) { return p.clone(); });
    return csg;
  },

  scale: function(xOall, y, z, relitive) {
    const center = this.center();
    if (y === undefined && z === undefined && relitive === undefined) {
      this.polygons.map(function(p) { return p.scale(center, xOall); });
    } else {
      const dems = this.demensions();
      const x = relitive ? (dems.x + xOall)/dems.x : (xOall || 1);
      y = relitive ? (dems.y + y)/dems.y : (y || 1);
      z = relitive ? (dems.z + z)/dems.z : (z || 1);
      this.polygons.forEach(p => p.vertices.forEach(v => {
        v.scale(center, x, y, z);
      }));
    }
    this.center(center)
    return this;
  },

  explode: function(distance) {
    const center = this.center();
    this.polygons.forEach(p =>
      p.translate(p.plane.normal.times(distance))
    );
  },

  setColors: function(funcOcolor) {
    if (funcOcolor instanceof Function) {
      this.polygons.forEach(p => p.setColor(funcOcolor(p)));
    } else {
      this.polygons.forEach(p => p.setColor(funcOcolor));
    }
  },

  setColor: function(color, force) {
    this.toPolygons().map(function(polygon) {
      if (polygon.shared === undefined || force) {
        polygon.setColor(color);
      }
    });
  },

  toPolygons: function() {
    return this.polygons;
  },

  // Return a new CSG solid representing space in either this solid or in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.union(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |       +----+
  //     +----+--+    |       +----+       |
  //          |   B   |            |       |
  //          |       |            |       |
  //          +-------+            +-------+
  //
  union: function(csg) {
    if (!csg || csg.polygons.length === 0) return this.clone();
    var a = new CSG.Node(this.clone().polygons);
    var b = new CSG.Node(csg.clone().polygons);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    return CSG.fromPolygons(a.allPolygons());
  },
  add: function(csg) {
    this.polygons.concatInPlace(csg.clone().polygons);
  },
  islands: function() {
    const islands = [];
    let allVerts = [];
    for (let index = 0; index < this.polygons.length; index++) {
      const poly = this.polygons[index];
      let addToIndex = -1;
      for (let vi = 0; vi < poly.vertices.length; vi++) {
        const vert = poly.vertices[vi];
        for (let avi = 0; addToIndex < 0 && avi < allVerts.length; avi++) {
          if (vert.equals(allVerts[avi].vert)) addToIndex = allVerts[avi].index;
        }
        if (addToIndex === -1) addToIndex = islands.push(new CSG()) - 1;
        islands[addToIndex].polygons.push(poly);
      }
      for (let vi = 0; vi < poly.vertices.length; vi++) {
        allVerts.push({vert: poly.vertices[vi], index: addToIndex});
      }
    }
    CSG.combine(islands);
    return islands;
  },

  // Return a new CSG solid representing space in this solid but not in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.subtract(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |    +--+
  //     +----+--+    |       +----+
  //          |   B   |
  //          |       |
  //          +-------+
  //
  subtract: function(csg) {
    if (!csg || csg.polygons.length === 0) return this.clone();
    var a = new CSG.Node(this.clone().polygons);
    var b = new CSG.Node(csg.clone().polygons);
    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  },

  // Return a new CSG solid representing space both this solid and in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.intersect(B)
  //
  //     +-------+
  //     |       |
  //     |   A   |
  //     |    +--+----+   =   +--+
  //     +----+--+    |       +--+
  //          |   B   |
  //          |       |
  //          +-------+
  //
  intersect: function(csg) {
    if (!csg || csg.polygons.length === 0) return null;
    var a = new CSG.Node(this.clone().polygons);
    var b = new CSG.Node(csg.clone().polygons);
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  },

  slice: function (width, x, y, map) {
    width ||= .01;
    if ((!x && y) || (x && !y)) throw new Error('If you define x you must define y and vice versa')
    if (!x && !y) (x = 'x') & (y = 'z');
    const dems = this.demensions();
    const center = new CSG.Vertex(this.center());
    const config = sliceConfig(x,y, width, dems, center);
    config.slice = new CSG.cube(config);
    config.slices = [];
    const runFunc = map instanceof Function;
    for (;config.index < config.steps; config.index++) {
        const int = config.slice.intersect(this);
        int.polygons = int.polygons.filter(p => config.step.dot(p.plane.normal) === config.width);
        if (runFunc) config.slices.push(map(int, config));
        else config.slices.push(int);
        config.slice.translate(config.step);
    }
    console.log(config.slices.map((s, i) => `//${i}\n${s.toDrawString()}\n${this.toDrawString('green')}`).join('\n\n'))
    return config.slices;
  },

  peel: function (vector, depth, peelOcore) {
    if (this.polygons.length === 0) return this;
    if (peelOcore !== false) peelOcore = true;
    vector = new CSG.Vector(vector).unit();
    const peeled = this.clone();
    const center = new CSG.Vector(this.center());


    let maxDist = 0;
    this.polygons.forEach(p => p.vertices.forEach(v => {
      const dot = new CSG.Vector(v.pos).minus(center).dot(vector);
      if (dot > maxDist)
        maxDist = dot;
    }));

    const planeCenter = center.plus(vector.times(maxDist - depth));
    const cutterNormal = new CSG.Vector(vector).times(peelOcore ? 1 : -1);
    const cutter = CSG.Polygon.fromNormal(cutterNormal, planeCenter, 1000000);
    return this.subtract(CSG.fromPolygons([cutter]));
  },
  // Return a new CSG solid with solid and empty space switched. This solid is
  // not modified.
  inverse: function() {
    var csg = this.clone();
    csg.polygons.map(function(p) { p.flip(); });
    return csg;
  },
  endpoints: function () {
    const endpoints = {};
    const endpoint = (attr, value) => {
      const max = endpoints[attr];
      endpoints[attr] = max === undefined || max < value ? value : max;
      const minAttr = `-${attr}`;
      const min = endpoints[minAttr];
      endpoints[minAttr] = min === undefined || min > value ? value : min;
    }
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      endpoint('x', vertex.pos.x);
      endpoint('y', vertex.pos.y);
      endpoint('z', vertex.pos.z);
    }));
    return endpoints;
  },
  distCenter: function () {
    const endpoints = this.endpoints();
    const x = ((endpoints.x + endpoints['-x']) / 2);
    const y = ((endpoints.y + endpoints['-y']) / 2);
    const z = ((endpoints.z + endpoints['-z']) / 2);
    return {x,y,z};
  },
  mean: function () {
    const vertices = this.vertices();
    const mean = Math.mean(vertices, ['pos.x', 'pos.y', 'pos.z']);
    return mean.pos;
  },

  demensions: function () {
    const epts = this.endpoints();
    return {
      x: epts.x - epts['-x'],
      y: epts.y - epts['-y'],
      z: epts.z - epts['-z']
    }
  },
  cube: function () {
    return new CSG.cube({demensions: this.demensions(), center: this.center()});
  },
  demCenter: function () {
    const dems = this.demensions();
    return {x: dems.x/2, y: dems.y/2, z: dems.z/2};
  },
  rotateAroundPoint: function (rotations, point) {
    const returnVector = new CSG.Vector(point);
    const centerVector = returnVector.negated();
    this.translate(centerVector);
    this.rotate(rotations);
    this.translate(returnVector);
  },

  rotate: function (rotations, pivot) {
    pivot ||= {x: 1, y:1, z:1};
    if (Array.isArray(rotations)) {
      for (let i = 0; i < rotations.length; i++) this.rotate(rotations[i])
      return;
    }
    rotations = new CSG.Vector(rotations)
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      let newPos = vertex.pos;
      newPos = ArbitraryRotate(newPos, rotations.x, {x: pivot.x, y:0, z:0});
      newPos = ArbitraryRotate(newPos, rotations.y, {x: 0, y:pivot.y, z:0});
      newPos = ArbitraryRotate(newPos, rotations.z, {x: 0, y:0, z:pivot.z});
      return new CSG.Vertex(newPos, vertex.normal);
    }));
  },
  reverseRotate: function (rotation) {
    rotation = new CSG.Vector(rotation)
    rotation = {x: rotation.x * -1, y: rotation.y * -1, z: rotation.z * -1};
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      let newPos = vertex.pos;
      newPos = ArbitraryRotate(newPos, rotation.z, {x: 0, y:0, z:1});
      newPos = ArbitraryRotate(newPos, rotation.y, {x: 0, y:1, z:0});
      newPos = ArbitraryRotate(newPos, rotation.x, {x: 1, y:0, z:0});
      return new CSG.Vertex(newPos, vertex.normal);
    }));
  },

  ArbitraryRotate: function(degrees, pivot) {
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
        let newPos = vertex.pos;
        newPos = ArbitraryRotate(newPos, degrees, pivot);
        return new CSG.Vertex(newPos, vertex.normal);
    }));
  },

  translate: function (offset) {
    offset = new CSG.Vector(offset)
    if (Array.isArray(offset)) offset = {x: offset[0], y: offset[1], z: offset[2]};
    offset.id = String.random();
    this.polygons.forEach((poly) => poly.translate(offset));
  },

  center: function (newCenter) {
    const center = this.distCenter();
    if (!newCenter) return center;
    const offset = {
      x: newCenter.x - center.x,
      y: newCenter.y - center.y,
      z: newCenter.z - center.z
    }
    this.translate(offset);
    return newCenter;
  },

  normalize: function (rotations, rightSide, leftOfAxis) {
    if (rightSide) {
      if (rotations) {
        if (Array.isArray(rotations)) rotations = rotations.concat([{y:180}]);
        else rotations = [rotations, {y: 180}];
      } else rotations = [{y:180}];
    }
    const clone = this.clone();
    if (rotations) clone.rotate(rotations);
    const dems = clone.demensions();
    const divisor = leftOfAxis ? -2 : 2;
    const normCenter = {x: dems.x/divisor, y: dems.y/2, z: dems.z/2};
    // const translationVector = new CSG.Vector(clone.center()).minus(normCenter);
    const translationVector = new CSG.Vector(normCenter).minus(clone.center());
    clone.translate(translationVector);
    const side = !rightSide ? 'Left' : 'Right';
    return {poly: clone, translationVector, rotations, normCenter, side};
  }
};

CSG.combine = function(csgs) {
  for (let index = csgs.length - 1; index > -1; index--) {
    const proposer = csgs[index];
    for (let oi = 0; oi < index; oi++) {
      const proposeTo = csgs[oi];
      if (proposer.sharesVertex(proposeTo)) {
        proposeTo.polygons.concatInPlace(proposer.polygons);
        csgs.splice(index, 1);
        break;
      }
    }
  }
}

CSG.concat = function(csgs) {
  const all = new CSG();
  for (let index = 0; index < csgs.length; index++) {
    if (csgs[index] instanceof CSG)
      all.polygons.concatInPlace(csgs[index].polygons);
  }
  return all;
}

CSG.marroonedOn = function(csgOpolyOvertex, islands) {
  let vertices;
  if (csgOpolyOvertex instanceof CSG) vertices = csgOpolyOvertex.vertices();
  else if (csgOpolyOvertex instanceof CSG.Polygon) vertices = csgOpolyOvertex.vertices;
  else if (csgOpolyOvertex instanceof CSG.Vertex) vertices = [csgOpolyOvertex];
  else throw new Error(`marroonedOn not configured for input '${csgOpolyOvertex}'`);
  for(let ii = 0; ii < islands.length; ii++) {
    const island = islands[ii];
    const iVerts = island.vertices();
    for (let ivi = 0; ivi < iVerts.length; ivi++) {
      for (let vi = 0; vi < vertices.length; vi++) {
        if (vertices[vi].equals(iVerts[ivi])) return island;
      }
    }
  }
  return null;
}

// Construct an axis-aligned solid cuboid. Optional parameters are `center` and
// `radius`, which default to `[0, 0, 0]` and `[1, 1, 1]`. The radius can be
// specified using a single number or a list of three numbers, one for each axis.
//
// Example code:
//
//     var cube = CSG.cube({
//       center: [0, 0, 0],
//       radius: 1
//     });
//
// x1 = (x0 – xc)cos(θ) – (y0 – yc)sin(θ) + xc(Equation 3)
// y1 = (x0 – xc)sin(θ) + (y0 – yc)cos(θ) + yc(Equation 4)

function getRadius(options) {
  if (options.demension)
    options.radius = [options.demension/2,options.demension/2,options.demension/2];
  if (!options.radius && options.demensions) {
      options.radius = new CSG.Vector(options.demensions).times(.5).toArray();
  }
  if (options.radius) {
    return Number.isFinite(options.radius) ?
      [options.radius, options.radius, options.radius] :
      new CSG.Vector(options.radius).toArray();
  }
  return  [1, 1, 1];
}

CSG.cube = function(options) {
  options = options || {};
  var c = new CSG.Vector(options.center || [0, 0, 0]);
  var r = getRadius(options);
  return CSG.fromPolygons([
    [[0, 4, 6, 2], [-1, 0, 0]],
    [[1, 3, 7, 5], [+1, 0, 0]],
    [[0, 1, 5, 4], [0, -1, 0]],
    [[2, 6, 7, 3], [0, +1, 0]],
    [[0, 2, 3, 1], [0, 0, -1]],
    [[4, 5, 7, 6], [0, 0, +1]]
  ].map(function(info) {
    return new CSG.Polygon(info[0].map(function(i) {
      var pos = new CSG.Vector(
        c.x + r[0] * (2 * !!(i & 1) - 1),
        c.y + r[1] * (2 * !!(i & 2) - 1),
        c.z + r[2] * (2 * !!(i & 4) - 1)
      );
      return new CSG.Vertex(pos, new CSG.Vector(info[1]));
    }));
  }));
};

const oneOnone = (val) => val > 0 ? 1 : (val < 0) ? -1 : 0;
function champerCube(center, x, y, z, depth) {
  const big = 10;
  const bigVect = new CSG.Vector(oneOnone(x), oneOnone(y), oneOnone(z)).unit();
  const cube = new CSG.cube({demension: big});
  const rotations = x === 0 ? {x: 45} : (y === 0 ? {y: 45} : {z: 45});
  cube.rotate(rotations);
  const vector = new CSG.Vector(x, y, z);
  const bigOffset = bigVect.unit().times(big/2);
  const depthOffset = bigVect.unit().times(depth);
  cube.translate(vector.plus(bigOffset).minus(depthOffset));
  return cube;
}

CSG.cube.champhered = function (options) {
  let cube = new CSG.cube(options);
  const depth = options.depth || 1;
  const edges = options.edges || [true,true,true];
  if (edges[0] === true) edges[0] = [true,true,true,true];
  if (edges[1] === true) edges[1] = [true,true,true,true];
  if (edges[2] === true) edges[2] = [true,true,true,true];
  const c = options.center;
  const r = getRadius(options);

  if (edges[0]) {
    if (edges[0][0]) cube = cube.subtract(champerCube(c, 0, r[1], r[2], depth));
    if (edges[0][1]) cube = cube.subtract(champerCube(c, 0, r[1], -r[2], depth));
    if (edges[0][2]) cube = cube.subtract(champerCube(c, 0, -r[1], -r[2], depth));
    if (edges[0][3]) cube = cube.subtract(champerCube(c, 0, -r[1], r[2], depth));
  }

  if (edges[1]) {
    if (edges[1][0]) cube = cube.subtract(champerCube(c, r[0], 0, r[2], depth));
    if (edges[1][1]) cube = cube.subtract(champerCube(c, r[0], 0, -r[2], depth));
    if (edges[1][2]) cube = cube.subtract(champerCube(c, -r[0], 0, -r[2], depth));
    if (edges[1][3]) cube = cube.subtract(champerCube(c, -r[0], 0, r[2], depth));
  }

  if (edges[2]) {
    if (edges[2][0]) cube = cube.subtract(champerCube(c, r[0], r[1], 0, depth));
    if (edges[2][1]) cube = cube.subtract(champerCube(c, r[0], -r[1], 0, depth));
    if (edges[2][2]) cube = cube.subtract(champerCube(c, -r[0], -r[1], 0, depth));
    if (edges[2][3]) cube = cube.subtract(champerCube(c, -r[0], r[1], 0, depth));
  }
  return cube
}

CSG.Point = function (center, radius, color) {
  radius ||= .5
  const sphere = new CSG.sphere({radius, center});
  sphere.setColor(color);
  return sphere;
}

function vecotrOvertexModel(start, end, model, options) {
  if (Array.isArray(end) || options.lineDisplayType === CSG.Line.DISPLAY_TYPES.LINE_ONLY) return model;
  let color = end.color || options.color;
  if (CSG.Line.DISPLAY_TYPES.VECTOR === options.lineDisplayType &&
          end instanceof CSG.Vector) {
    const maxLen = end.distance(new CSG.Vector(start)) / 2;
    const unit = end.minus(new CSG.Vector(start)).unit().times(maxLen > 6 ? 6 : maxLen);
    start = end.minus(unit);
    return new CSG.cone({start, end, model, color});
  } else {
    return new CSG.Point(end, null, color).union(model);
  }
}

CSG.Line = function (options) {
  options ||= {};
  const start = options.start || [0,0,0];
  const end = options.end || [0,0,0];
  if (new CSG.Vector(start).equals(new CSG.Vector(end))) {
    return new CSG.Point(options.start, .3, options.color);
  }
  const radius = options.radius || .2;
  let model = new CSG.cylinder({start, end, radius, slices: 8});
  model = vecotrOvertexModel(end, start, model, options);
  model.setColor(options.color);
  return vecotrOvertexModel(start, end, model, options);
}

CSG.Line.DISPLAY_TYPES = {};
CSG.Line.DISPLAY_TYPES.LINE_ONLY = 'lineOnly';
CSG.Line.DISPLAY_TYPES.VECTOR = 'vector';

CSG.Rectangle = function (demensions, center, yVector, xVector) {
  yVector = new CSG.Vector(yVector || [0,1,0]).unit();
  const defaultVector = !Object.equals(yVector, {x:1, y:0, z:0}) ? {x:1, y:0, z:0} : {x:0, y:0, z:1};
  xVector = new CSG.Vector(xVector || defaultVector);
  center = new CSG.Vector(center || [0,0,0]);
  const demVector = new CSG.Vector(demensions || [3,5,1]);
  const width = demVector.x;
  const length = demVector.y;
  const depth = demVector.z;
  const zVector = xVector.cross(yVector).unit();

  const vs = {
    x: yVector.times(length/2),
    y: xVector.times(width/2),
    z: zVector.times(depth/2),
    nx: yVector.times(length/2).negated(),
    ny: xVector.times(width/2).negated(),
    nz: zVector.times(depth/2).negated()
  }

  const vert = (...args) => {
    const vertex = new CSG.Vertex(center);
    for(let index = 0; index < args.length; index++) vertex.plus(args[index]);
    return vertex;
  }

  // const front = new CSG.Polygon([vert(vs.x, vs.y), vert(vs.nx, vs.y), vert(vs.nx, vs.ny), vert(vs.x, vs.ny)]);
  let v1 = new CSG.Vertex(center.plus(vs.x).plus(vs.y), vs.nz);
  let v2 = new CSG.Vertex(center.minus(vs.x).plus(vs.y),  vs.nz);
  let v3 = new CSG.Vertex(center.minus(vs.x).minus(vs.y),  vs.nz);
  let v4 = new CSG.Vertex(center.plus(vs.x).minus(vs.y),  vs.nz);
  const front = new CSG.Polygon([v1,v2,v3,v4]);

  // const back = new CSG.Polygon([vert(vs.x,vs.y,vs.z),vert(vs.nx,vs.y,vs.z),vert(vs.nx,vs.ny,vs.z),vert(vs.x,vs.ny,vs.z)]);
  v1 = new CSG.Vertex(center.plus(vs.x).plus(vs.y).plus(vs.z), vs.z);
  v2 = new CSG.Vertex(center.minus(vs.x).plus(vs.y).plus(vs.z),  vs.z);
  v3 = new CSG.Vertex(center.minus(vs.x).minus(vs.y).plus(vs.z),  vs.z);
  v4 = new CSG.Vertex(center.plus(vs.x).minus(vs.y).plus(vs.z),  vs.z);
  const back = new CSG.Polygon([v4,v3,v2,v1]);

  v1 = new CSG.Vertex(center.minus(vs.x).plus(vs.y).plus(vs.z),  vs.y);
  v2 = new CSG.Vertex(center.plus(vs.x).plus(vs.y).plus(vs.z), vs.y);
  v3 = new CSG.Vertex(center.plus(vs.x).plus(vs.y), vs.y);
  v4 = new CSG.Vertex(center.minus(vs.x).plus(vs.y),  vs.y);
  const top = new CSG.Polygon([v4,v3,v2,v1]);

  v1 = new CSG.Vertex(center.minus(vs.x).minus(vs.y),  vs.ny);
  v2 = new CSG.Vertex(center.plus(vs.x).minus(vs.y),  vs.ny);
  v4 = new CSG.Vertex(center.minus(vs.x).minus(vs.y).plus(vs.z),  vs.ny);
  v3 = new CSG.Vertex(center.plus(vs.x).minus(vs.y).plus(vs.z),  vs.ny);
  const bottom = new CSG.Polygon([v4,v3,v2,v1]);

  v1 = new CSG.Vertex(center.plus(vs.x).plus(vs.y), vs.x);
  v2 = new CSG.Vertex(center.plus(vs.x).minus(vs.y),  vs.x);
  v3 = new CSG.Vertex(center.plus(vs.x).minus(vs.y).plus(vs.z),  vs.x);
  v4 = new CSG.Vertex(center.plus(vs.x).plus(vs.y).plus(vs.z), vs.x);
  const left = new CSG.Polygon([v1,v2,v3,v4]);

  v4 = new CSG.Vertex(center.minus(vs.x).plus(vs.y),  vs.nx);
  v3 = new CSG.Vertex(center.minus(vs.x).minus(vs.y),  vs.nx);
  v2 = new CSG.Vertex(center.minus(vs.x).minus(vs.y).plus(vs.z),  vs.nx);
  v1 = new CSG.Vertex(center.minus(vs.x).plus(vs.y).plus(vs.z),  vs.nx);
  const right = new CSG.Polygon([v1,v2,v3,v4]);

  return CSG.fromPolygons([front, back, top, bottom, left, right])
}

// Construct a solid sphere. Optional parameters are `center`, `radius`,
// `slices`, and `stacks`, which default to `[0, 0, 0]`, `1`, `16`, and `8`.
// The `slices` and `stacks` parameters control the tessellation along the
// longitude and latitude directions.
//
// Example usage:
//
//     var sphere = CSG.sphere({
//       center: [0, 0, 0],
//       radius: 1,
//       slices: 16,
//       stacks: 8
//     });
CSG.sphere = function(options) {
  options = options || {};
  var c = new CSG.Vector(options.center || [0, 0, 0]);
  var r = options.radius || 1;
  var slices = options.slices || 32;
  var stacks = options.stacks || 8;
  var polygons = [], vertices;
  function vertex(theta, phi) {
    theta *= Math.PI * 2;
    phi *= Math.PI;
    var dir = new CSG.Vector(
      Math.cos(theta) * Math.sin(phi),
      Math.cos(phi),
      Math.sin(theta) * Math.sin(phi)
    );
    vertices.push(new CSG.Vertex(c.plus(dir.times(r)), dir));
  }
  for (var i = 0; i < slices; i++) {
    for (var j = 0; j < stacks; j++) {
      vertices = [];
      vertex(i / slices, j / stacks);
      if (j > 0) vertex((i + 1) / slices, j / stacks);
      if (j < stacks - 1) vertex((i + 1) / slices, (j + 1) / stacks);
      vertex(i / slices, (j + 1) / stacks);
      polygons.push(new CSG.Polygon(vertices));
    }
  }

  const csg = CSG.fromPolygons(polygons);
  csg.property('x', c.x, false, false);
  csg.property('y', c.y, false, false);
  csg.property('z', c.z, false, false);
  csg.property('radius', c.radius, false, false);
  return csg;
};

// TODO: add a length option so that start and end dont need to be defined;
// Construct a solid cylinder. Optional parameters are `start`, `end`,
// `radius`, and `slices`, which default to `[0, -1, 0]`, `[0, 1, 0]`, `1`, and
// `16`. The `slices` parameter controls the tessellation.
//
// Example usage:
//
//     var cylinder = CSG.cylinder({
//       start: [0, -1, 0],
//       end: [0, 1, 0],
//       radius: 1,
//       slices: 16
//     });
CSG.cylinder = function(options) {
  options = options || {};
  var s = new CSG.Vector(options.start || [0, -1, 0]);
  var e = new CSG.Vector(options.end || [0, 1, 0]);
  var ray = e.minus(s);
  var r = options.radius || 1;
  if (!ray.positive()) {
    let temp = s;
    s = e;
    e = temp;
    ray = ray.negated();
  }
  var slices = options.slices || 8;
  var axisZ = ray.unit(); isY = (Math.abs(axisZ.y) > 0.5);
  var axisX = new CSG.Vector(isY, !isY, 0).cross(axisZ).unit();
  var axisY = axisX.cross(axisZ).unit();
  var start = new CSG.Vertex(s, axisZ.negated());
  var end = new CSG.Vertex(e, axisZ.unit());
  var polygons = [];
  function point(stack, slice, normalBlend) {
    var angle = slice * Math.PI * 2;
    var out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
    var pos = s.plus(ray.times(stack)).plus(out.times(r));
    var normal = out.times(1 - Math.abs(normalBlend)).plus(axisZ.times(normalBlend));
    return new CSG.Vertex(pos, normal);
  }
  const topVerts = [];
  const bottomVerts = [];
  for (var i = 0; i < slices; i++) {
    var t0 = i / slices, t1 = (i + 1) / slices;
    polygons.push(new CSG.Polygon([point(0, t1, 0), point(0, t0, 0), point(1, t0, 0), point(1, t1, 0)]));
    topVerts.push(point(1, t0, 1));
    bottomVerts.push(point(0, t0, 1));
  }
  topVerts.reverse();
  return CSG.fromPolygons(polygons.concat([new CSG.Polygon(topVerts),new CSG.Polygon(bottomVerts)]));
  // return new CSG.Polygon(verts);
};

let crossVect;
const perpendicularVector = (vector) => {
  let other;
  const option1Mag = vector.z*vector.z+vector.y*vector.y;
  const option2Mag = vector.z*vector.z+vector.x*vector.x;
  const option3Mag = vector.y*vector.y+vector.x*vector.x;
  if (option1Mag > option2Mag && option1Mag > option3Mag) {
    other = new CSG.Vector(0, vector.z, -vector.y);
  } else if (option2Mag > option3Mag) {
    other = new CSG.Vector(-vector.z, 0, vector.x);
  } else {
    other = new CSG.Vector(-vector.y, vector.x, 0);
  }
  crossVect = other;
  return other;
}

CSG.cylinder.step = function(cylinders, options) {
  let stepCylinder = new CSG();
  options ||= {};
  const mainCenter = options.center || {x:0,y:0,z:0};
  const mainSlices = options.slices;
  cylinders.forEach(c => {
    const vector = new CSG.Vector(c.vector || {y: 0, x: 0, z: 1});
    const center = new CSG.Vector(c.center || mainCenter);
    const length = c.length || 1;
    const radius = c.radius || c.diameter / 2;
    const slices = c.slices || mainSlices;
    const half = c.half || options.half;
    const start = half === true ? center : center.minus(vector.times(length/-2));
    const end = half === false ? center : center.minus(vector.times(length/2));
    const cylinder = new CSG.cylinder({start, end, center, radius, slices});
    stepCylinder = stepCylinder.union(cylinder);
  });
  return stepCylinder;
}


const femaleLatchCutter = (endLength, radius, thickness, blockCount) => {

}
const maleLatchBlocks = (endLength, radius, thickness, blockCount, female) => {
  let blocks = new CSG();
  const blockThickness = thickness/2 + (female ? .05 : 0);
  const offset = radius - thickness;

  for (let index = 0; index < blockCount; index++) {
    const block = new CSG.cube({radius: blockThickness});
    block.translate({x:offset, y:0, z:0});
    block.rotate({z: (360/blockCount) * index});
    blocks.add(block);
  }
  return blocks;
}

const applyEndCutter = (pipe, ends, index, radius, length, thickness, endLength, slices) => {
  if (!ends[index].includes('MALE')) return pipe;
  const cutterRadius = ends[index] === 'MALE' ? radius : radius-thickness/2;
  thickness = (thickness / 2) + .02;
  const cutter = new CSG.cylinder.hollow(cutterRadius, endLength, thickness, {slices});
  const translation = new CSG.Vector({x: 0, y:0, z: (length/2 - endLength/2) * (index === 0 ? -1 : 1)});
  cutter.translate(translation);
  pipe = pipe.subtract(cutter);
  const blocks = maleLatchBlocks(endLength, radius, thickness, 4, ends[index] !== 'MALE');
  blocks.translate({x:0, y:0, z:translation.z + (index === 0 ? -.3 : .3)});
  // blocks.translate(translation);
  if (ends[index] === 'MALE') pipe = pipe.union(blocks);
  // else {
  //   const stepVect = translation.unit().times(blocks.demensions().z *.9);
  //   const rotation = {z: 360 * (thickness/3)/(2*Math.PI*radius)};
  //   Array.fill(8, i=>i).forEach(i => blocks.rotate(rotation) & (pipe = pipe.subtract(blocks)));
  //   Array.fill(8, i=>i).forEach(i => blocks.reverseRotate(rotation));
  //   let moved = 0;
  //   while(moved < 2*endLength / 3) {
  //     pipe = pipe.subtract(blocks);
  //     blocks.translate(stepVect);
  //     moved += Math.abs(stepVect.z);
  //   }
  // }

  return pipe;
}

const validEnd = (end) => CSG.cylinder.hollow.ENDS.indexOf(end) !== -1;
CSG.cylinder.hollow = function(radius, length, thickness, options) {
  radius ||= 1;
  length ||= 1;
  thickness ||= .2;
  let pipe = new CSG.cylinder.step([{radius, length}], options);
  const ends = options.ends || []
  if (!validEnd(ends[0])) ends[0] = 'OPEN';
  if (!validEnd(ends[1])) ends[1] = 'OPEN';
  const cappedCount = ends.count(e => e === 'CAP');
  const maleCount = ends.count(e => e === 'MALE');
  const femaleCount = ends.count(e => e === 'FEMALE');
  const hollowLength = length - (cappedCount ? thickness * (cappedCount === 2 ? 2 : 1) : 0);
  const hollow = new CSG.cylinder.step([{radius: radius - thickness, length: hollowLength}], options);
  if (cappedCount === 1) hollow.translate({x:0,y:0,z:thickness * (ends[0] === 'CAP' ? 1 : -1)});
  const endLength = options.endLength || length/10;
  pipe = applyEndCutter(pipe, ends, 0, radius, length, thickness, endLength, options.slices);
  pipe = applyEndCutter(pipe, ends, 1, radius, length, thickness, endLength, options.slices);

  return pipe.subtract(hollow);
}
CSG.cylinder.hollow.ENDS = ['MALE', "FEMALE", "CAP", "OPEN"];

CSG.cone = function (options) {
  options ||= {};
  let length = options.length || 10;
  const start = new CSG.Vector(options.start || [0,0,0]);
  const end = new CSG.Vector(options.end || start.add([0,length,0]));
  length = end.minus(start).length();
  const point = new CSG.sphere({radius: 1, center: end});
  const radius = options.radius || 1;
  const slices = options.slices || 8;
  let cylinder = new CSG.cylinder({start, end, radius, slices});
  let cone = cylinder.clone();
  if (options.color) cone.setColor(options.color);
  const sliceRotation = 360/slices;
  const rotationVector = end.minus(start).unit();
  const lengthVector = rotationVector.clone().times(length);
  const perpVector = perpendicularVector(rotationVector.clone()).times(radius/-2);
  const widthVector = perpVector.cross(rotationVector).unit().times(30);
  const cutterCenter = end;
  const plane = new CSG.Rectangle([30, length*10, radius*2], cutterCenter, rotationVector.unit(), widthVector.unit());
  const planeCenter = new CSG.Vector(plane.center());
  if (options.color) plane.setColor(options.color);
  const degrees = Math.toDegrees(Math.atan(radius/(2*length)))*2;
  plane.ArbitraryRotate(degrees, widthVector.unit());
  plane.center(cutterCenter);
  plane.translate(perpVector);

  for (let index = 0; index < slices; index++) {
    plane.translate(cutterCenter.negated());
    plane.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
        let newPos = vertex.pos;
        newPos = ArbitraryRotate(newPos, sliceRotation, rotationVector.unit());
        return new CSG.Vertex(newPos, vertex.normal);
      }));
      plane.translate(cutterCenter);
      cone = cone.subtract(plane);
  }

  if(options.model) {
    const model = options.model.subtract(cylinder);
    cone = cone.union(model);
  }

  return cone;
}

function axis(vector, origin, color, size, radius) {
  origin ||= [0,0,0];
  const end = [vector[0]*size+origin[0],vector[1]*size+origin[1],vector[2]*size+origin[2]]
  const ax = CSG.cylinder({start: origin, end, radius})
  ax.setColor(color);
  return ax;
}

function lidFingerPull(container, x, z) {
  const cent = container.center();
  const dems = container.demensions();
  const radius = Math.min(1.5, .25*(!Boolean.is(x) ? dems.x : (!Boolean.is(z) ? dems.z : Math.min(dems.x, dems.z))));
  x = Boolean.is(x) ? (dems.x/2 * (x === false ? -1 : 1)) : 0;
  z = Boolean.is(z) ? (dems.z/2 * (z === false ? -1 : 1)) : 0;
  const vector = new CSG.Vector(x,dems.y/2,z);
  const center = new CSG.Vector(container.center()).plus(vector);
  const sphere = new CSG.sphere({radius, center});
  return container.subtract(sphere);
}

CSG.Container = function (options) {
  const sideT = options.sideThickness || .2;
  const bottomT = options.bottomThickness || .2;
  const rad = getRadius(options);
  const boxHeight = rad[1] + bottomT/2 + sideT / 2;
  let container = new CSG.cube({radius: [rad[0] + sideT*2, boxHeight, rad[2] + sideT * 2]});
  const containerCutter = new CSG.cube({radius: rad});
  containerCutter.translate({x:0,y:bottomT - boxHeight/2,  z:0});
  container = container.subtract(containerCutter);

  let lid = new CSG.cube({radius: [rad[0] + sideT*2, sideT*2, rad[2] + sideT * 2]});
  let lidCutter = new CSG.cube({radius: [rad[0] + sideT*2, sideT, rad[2] + sideT * 2]});
  containerCutter.center(lidCutter.center())
  lidCutter = lidCutter.subtract(containerCutter);
  lidCutter.translate({x:0,y:-sideT,z:0});
  lid = lid.subtract(lidCutter);

  lid.rotate({x:180});
  lid.center(lid.demensions());
  container.center(container.demensions());
  lid.translate({x:0, y:lid.demensions().y/-2, z:(rad[2] + sideT) * 3});
  container.translate({x:0, y:container.demensions().y/-2, z: 0});

  container = lidFingerPull(container, true);
  container = lidFingerPull(container, false);
  container = lidFingerPull(container, null,true);
  container = lidFingerPull(container, null,false);

  // // lid.rotate({x: 90});
  // container.rotate({x:90});
  return {lid, container}
}

CSG.Axis =  function (size, radius, origin, vectors) {
  size ||= 100;
  origin ||= [0,0,0];
  vectors ||= [[1,0,0], [0,1,0], [0,0,1]];
  radius ||= size/100;
  const center = CSG.sphere({center: origin, radius: radius*1.5})
  const xAxis = axis(vectors[0], origin, [255,0,0], size, radius);
  const yAxis = axis(vectors[1], origin, [0,128,0], size, radius);
  const zAxis = axis(vectors[2], origin, [0,0,255], size, radius);
  const csg = new CSG();
  csg.polygons.concatInPlace(center.polygons);
  csg.polygons.concatInPlace(xAxis.polygons);
  csg.polygons.concatInPlace(yAxis.polygons);
  csg.polygons.concatInPlace(zAxis.polygons);
  return csg;
}

// # class Vector

// Represents a 3D vector.
//
// Example usage:
//
//     new CSG.Vector(1, 2, 3);
//     new CSG.Vector([1, 2, 3]);
//     new CSG.Vector({ x: 1, y: 2, z: 3 });
const isZeros = (...vals) => vals.findIndex(v => withinEPSILON(v, 0)) === -1;
CSG.Vector = function(x, y, z) {
  if (arguments.length == 3) {
    this.x = x;
    this.y = y;
    this.z = z;
  } else if ('x' in x || 'y' in x || 'z' in x) {
    this.x = x.x;
    this.y = x.y;
    this.z = x.z || 0;
  } else if ('i' in x || 'j' in x || 'k' in x) {
    this.x = x.i;
    this.y = x.j;
    this.z = x.k;
  } else {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
  }
};

CSG.Vector.prototype = {
  clone: function() {
    return new CSG.Vector(this.x, this.y, this.z);
  },
  positive: function () {
    return this.x > 0 || (isZeros(this.x) && this.y > 0) ||
              (isZeros(this.x,this.y) && this.z > 0) || isZeros(this.x, this.y, this.z);
  },
  toArray: function() {return [this.x,this.y,this.z]},

  negated: function() {
    return new CSG.Vector(-this.x, -this.y, -this.z);
  },

  plus: function(a) {
    return new CSG.Vector(this.x + a.x, this.y + a.y, this.z + a.z);
  },

  minus: function(a) {
    return new CSG.Vector(this.x - a.x, this.y - a.y, this.z - a.z);
  },

  times: function(a) {
    return new CSG.Vector(this.x * a, this.y * a, this.z * a);
  },

  dividedBy: function(a) {
    return new CSG.Vector(this.x / a, this.y / a, this.z / a);
  },

  dot: function(a) {
    return this.x * a.x + this.y * a.y + this.z * a.z;
  },

  lerp: function(a, t) {
    return this.plus(a.minus(this).times(t));
  },

  length: function() {
    return Math.sqrt(this.dot(this));
  },

  unit: function() {
    return this.dividedBy(this.length());
  },

  distance: function (other) {
    const vector = this.minus(other);
    return vector.length();
  },

  cross: function(a) {
    return new CSG.Vector(
      this.y * a.z - this.z * a.y,
      this.z * a.x - this.x * a.z,
      this.x * a.y - this.y * a.x
    );
  },
  perpendicular: function () {
    return new CSG.Vector(Math.copysign(this.z, this.x),
                            Math.copysign(this.z,this.y),
                            -Math.copysign(this.x,this.z) - Math.copysign(this.y,this.z)).unit();
  },

  equals: function(other) {
    return withinEPSILON(this.x, other.x) &&
            withinEPSILON(this.y, other.y) &&
            withinEPSILON(this.z, other.z);
  },

  toString: function(percision) {
    const vertPer = vertexPercision(percision, this.x, this.y, this.z);
    return `(${vertPer.x},${vertPer.y},${vertPer.z})`
  }
};

// # class Vertex

// Represents a vertex of a polygon. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.


CSG.Vector.I = new CSG.Vector(1,0,0);
CSG.Vector.J = new CSG.Vector(0,1,0);
CSG.Vector.K = new CSG.Vector(0,0,1);

CSG.Vertex = function(pos, normal) {
  this.pos = new CSG.Vector(pos);
  this.normal = new CSG.Vector(normal || {x:1,y:0,z:0});
  this.toString = (percision) => {
    const verPer = vertexPercision(percision, this.pos.x, this.pos.y, this.pos.z);
    return `(${verPer.x},${verPer.y},${verPer.z})`;
  }

  this.scale = (center, xOall, y, z) => {
    const centerVector = new CSG.Vector(center);
    const vector = new CSG.Vector(pos.x - center.x, pos.y - center.y, pos.z - center.z);
    if (y === undefined && z === undefined) {
      const scaled = vector.times(xOall);
      this.pos = centerVector.plus(scaled);
    } else {
      const iVect = CSG.Vector.I.times(vector.x * xOall);
      const jVect = CSG.Vector.J.times(vector.y * y);
      const kVect = CSG.Vector.K.times(vector.z * z);
      this.pos = centerVector.plus(iVect.plus(jVect).plus(kVect));
    }
  }

  const tol = .1
  const attrSq = (other, attr) => (this.pos[attr]-other.pos[attr]) * (this.pos[attr]-other.pos[attr]);
  this.equals = (other, tolerance) => {
    tolerance ||= tol;
    if (!(other instanceof CSG.Vertex)) return false;
    const sqrtError = Math.sqrt(attrSq(other, 'x') + attrSq(other, 'y') + attrSq(other, 'z'));
    return Math.abs(sqrtError) < tol;
  }
};

CSG.VertexNoNorm = function (pos) {
  return new CSG.Vertex(pos, [-1,-1,-1]);
}

CSG.Vertex.Center = function (vertices) {
  vertices = vertices.map(v => new CSG.Vector(v));
  const total = {x:0, y:0,z:0};
  vertices.forEach(v => {
    total.x += v.x;total.y += v.y;total.z += v.z;
  })
  return {
    x: total.x / vertices.length,
    y: total.y / vertices.length,
    z: total.z / vertices.length
  }
}

CSG.Vertex.prototype = {
  clone: function() {
    return new CSG.Vertex(this.pos.clone(), this.normal.clone());
  },
  toString: function (percision) {
    const vertPer = vertexPercision(percision, this.pos.x, this.pos.y, this.pos.z);
    return `(${vertPer.x},${vertPer.y},${vertPer.z})`
  },
  translate: function (offset) {return translate(this, offset)},

  // Invert all orientation-specific data (e.g. vertex normal). Called when the
  // orientation of a polygon is flipped.
  flip: function() {
    this.normal = this.normal.negated();
  },

  // Create a new vertex between this vertex and `other` by linearly
  // interpolating all properties using a parameter of `t`. Subclasses should
  // override this to interpolate additional properties.
  interpolate: function(other, t) {
    return new CSG.Vertex(
      this.pos.lerp(other.pos, t),
      this.normal.lerp(other.normal, t)
    );
  }
};

// # class Plane

// Represents a plane in 3D space.

CSG.Plane = function(normal, w) {
  this.normal = normal;
  this.w = w;
  this.setColor = function(color) {
    const rgb = Color.rgb(color);
    this.shared = [rgb[0]/255, rgb[1]/255, rgb[2]/255];
  }
};

// `CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
// point is on the plane.
CSG.Plane.EPSILON = 1e-5;//1e-3;
const withinEPSILON = (v1,v2) => Math.abs(v1-v2) < CSG.Plane.EPSILON;

CSG.Plane.fromPoints = function(a, b, c) {
  if (Array.isArray(a)) (c = a[2]) & (b = a[1]) & (a = a[0]);
  a = new CSG.Vector(a);
  b = new CSG.Vector(b);
  c = new CSG.Vector(c);
  var n = b.minus(a).cross(c.minus(a)).unit();
  return new CSG.Plane(n, n.dot(a));
};

CSG.Plane.prototype = {
  clone: function() {
    return new CSG.Plane(this.normal.clone(), this.w);
  },

  flip: function() {
    this.normal = this.normal.negated();
    this.w = -this.w;
  },

  // Split `polygon` by this plane if needed, then put the polygon or polygon
  // fragments in the appropriate lists. Coplanar polygons go into either
  // `coplanarFront` or `coplanarBack` depending on their orientation with
  // respect to this plane. Polygons in front or in back of this plane go into
  // either `front` or `back`.
  splitPolygon: function(polygon, coplanarFront, coplanarBack, front, back) {
    var COPLANAR = 0;
    var FRONT = 1;
    var BACK = 2;
    var SPANNING = 3;

    // Classify each point as well as the entire polygon into one of the above
    // four classes.
    var polygonType = 0;
    var types = [];
    for (var i = 0; i < polygon.vertices.length; i++) {
      var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
      var type = (t < -CSG.Plane.EPSILON) ? BACK : (t > CSG.Plane.EPSILON) ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    // Put the polygon in the correct list, splitting it when necessary.
    switch (polygonType) {
      case COPLANAR:
        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
        break;
      case FRONT:
        front.push(polygon);
        break;
      case BACK:
        back.push(polygon);
        break;
      case SPANNING:
        var f = [], b = [];
        for (var i = 0; i < polygon.vertices.length; i++) {
          var j = (i + 1) % polygon.vertices.length;
          var ti = types[i], tj = types[j];
          var vi = polygon.vertices[i], vj = polygon.vertices[j];
          if (ti != BACK) f.push(vi);
          if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi);
          if ((ti | tj) == SPANNING) {
            var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
            var v = vi.interpolate(vj, t);
            f.push(v);
            b.push(v.clone());
          }
        }
        if (f.length >= 3) front.push(new CSG.Polygon(f, polygon.shared));
        if (b.length >= 3) back.push(new CSG.Polygon(b, polygon.shared));
        break;
    }
  }
};

// # class Polygon

// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
//
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).

CSG.Polygon = function(vertices, shared) {
  this.vertices = vertices;
  this.shared = shared;
  this.plane = CSG.Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
};

CSG.Polygon.prototype = {
  clone: function() {
    var vertices = this.vertices.map(function(v) { return v.clone(); });
    return new CSG.Polygon(vertices, this.shared);
  },

  lines: function () {
    const verts = this.vertices;
    return verts.map((v,i) => [v.pos, verts[(i+1)%verts.length].pos]);
  },

  alignNormal: function (objectCenter) {
    const center = new CSG.Vector(this.center().pos);
    const dir = center.minus(objectCenter).unit();
    const norm = this.plane.normal;
    if (norm.dot(dir) < 0) {
      this.plane.normal = norm.times(-1);
      this.vertices.forEach(v => v.normal = v.normal.times(-1));
      console.log('realigned');
    }
  },

  toString: function (percision, includeColor) {
    percision ||= .001;
    const verts = this.vertices;
    const shared = this.shared;
    let color = includeColor ? Color.getName(shared) : '';
    let str = `${color}[`;
    for (let v = 0; v < verts.length; v++) {
      str += `${verts[v].toString(percision)},`;
    }
    str = `${str.substring(0, str.length - 1)}]`;
    return str;
  },

  center: function () {
    const mr = Math.midrange(this.vertices, ['pos.x','pos.y','pos.z']);
    return new CSG.Vertex({x: mr['pos.x'], y: mr['pos.y'], z: mr['pos.z']});
  },

  translate: function (offset) {
    if (Array.isArray(offset)) offset = {x: offset[0], y: offset[1], z: offset[2]};
    const offsetId = offset.id || (offset.id = String.random());
    this.forEachVertex((vertex) => {
      if (!vertex.offsetId || vertex.offsetId !== offsetId) {
        vertex.pos.x += offset.x;
        vertex.pos.y += offset.y;
        vertex.pos.z += offset.z;
        vertex.offsetId = offsetId;
      }
    });
  },

  color: function () {
    const name = Color.getName(this.shared);
    return name.indexOf(',') === -1 ? name : this.shared.map(v => Math.round(v*255));
  },
  rgb: function () {return !this.shared ? [0,0,0] : this.shared.map(v => Math.round(v*255));},
  scale: function(center, coeficient) {
    this.vertices.forEach(function(v) { return v.scale(center, coeficient); });
  },

  flip: function() {
    this.vertices.reverse().map(function(v) { v.flip(); });
    this.plane.flip();
  },
  forEachVertex: function (func) {
    for (let vIndex = 0; vIndex < this.vertices.length; vIndex += 1) {
      const vertex = this.vertices[vIndex];
      const newVertex = func(vertex);
      this.vertices[vIndex] = newVertex instanceof CSG.Vertex ? newVertex : vertex;
    }
  },
  setColor: function(color) {
    const rgb = Color.rgb(color);
    this.shared = [rgb[0]/255, rgb[1]/255, rgb[2]/255];
  }
};

CSG.Polygon.fromVertices = (verts) => {
  const a = new CSG.Vector(verts[0]);
  const b = new CSG.Vector(verts[1]);
  const c = new CSG.Vector(verts[2]);
  const norm = a.minus(b).cross(b.minus(c)).unit();
  const vertices = verts.map(v => new CSG.Vertex(v, norm));
  const poly = new CSG.Polygon(vertices);

  return poly;
}

CSG.Polygon.fromNormal = (normal, center, scale) => {
  center ||= {x:0,y:0,z:0};
  center = new CSG.Vector(center);
  normal = new CSG.Vector(normal).unit();
  const perp1 = normal.perpendicular();
  const perp2 = normal.cross(perp1);
  const a = center.plus(perp1);
  const b = center.plus(perp2);
  const c = center.minus(perp1);
  const d = center.minus(perp2);
  const verts = [a,b,c,d];
  const vertices = verts.map(v => new CSG.Vertex(v, normal));
  const poly = new CSG.Polygon(vertices);
  poly.scale(poly.center().pos, scale || 1);

  return poly;
}

CSG.Polygon.Enclosed = function (verts, width, color) {
  width ||= .1;
  verts = verts.map(v => new CSG.Vector(v));
  const centerNormal = (verts) => {
    const center = CSG.Vertex.Center(verts);
    const v1 = new CSG.Vector(verts[0]).minus(center)
    const v2 = new CSG.Vector(verts[1]).minus(center)
    return v1.cross(v2).unit()
  }

  const normal = centerNormal(verts);
  const transVert = (normal) => (pos) => {let v = new CSG.Vertex(pos, normal); return translate(v, normal.times(width/2));}
  const vert = (normal) => (pos) => new CSG.Vertex(pos, normal);
  const frontVerts = verts.map(vert(normal));
  let front = new CSG.Polygon(frontVerts);


  const backVerts = verts.map(transVert(normal.negated()));
  let back = new CSG.Polygon(backVerts.map(v => v.clone()).reverse());

  const polys = [front, back];
  if (width > 0) {
    for (let index = 0; index < frontVerts.length; index++) {
      const index2 = (index + 1) % frontVerts.length;
      let sideVerts = [backVerts[index].pos, backVerts[index2].pos, frontVerts[index2].pos, frontVerts[index].pos];
      const sideNormal = centerNormal(sideVerts);
      sideVerts = sideVerts.map((v) => new CSG.Vertex(v, sideNormal));
      let side = new CSG.Polygon(sideVerts);
      polys.push(side);
    }
  }

  let model = new CSG.fromPolygons(polys);
  verts.forEach(v => v.color && (model = model.union(new CSG.Point(v, null, v.color))));
  model.setColor(color);
  return model;//model.union(vect);
}


CSG.text = function (text, depth) {
  depth ||= 10;
  const textMap = require('../../../json/alpha-numeric-point-maps/default.json');
  let center = new CSG.Vector(0,0,0);
  const letters = [];
  for (let index = 0; index < text.length; index++) {
    let csg = new CSG();
    if (text[index] === ' ') {
      center.x += letters[letters.length - 1].demensions().x + 7.5;
    } else {
      const pointMap = textMap[text[index]];
      if (pointMap) {
        const sr = .5;
        for (let pi = 0; pi < pointMap.length; pi++) {
          const center = [pointMap[pi].x, pointMap[pi].y, 0];
          const d = pointMap[pi].d || 1;
          const cube = new CSG.cube({center, demensions: [d,d,depth]});
          // csg.polygons.concatInPlace(cube.polygons);
          const c = new CSG.Vector(center);
          // csg.add(cube);
          csg = csg.union(cube);
        }
        csg.center(center);
        csg.translate({x:0,z:0,y:center.y-csg.demensions().y/2})
        letters.push(csg);
        center.x += csg.demensions().x / 2 + 25;
      }
    }
  }
  const csg = new CSG();
  csg.polygons = letters.map(l => l.polygons).concatElements();
  csg.rotate({x:180});
  return csg;
}
// # class Node

// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.

CSG.Node = function(polygons) {
  this.plane = null;
  this.front = null;
  this.back = null;
  this.polygons = [];
  if (polygons) this.build(polygons);
};

CSG.Node.prototype = {
  clone: function() {
    var node = new CSG.Node();
    node.plane = this.plane && this.plane.clone();
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();
    node.polygons = this.polygons.map(function(p) { return p.clone(); });
    return node;
  },

  // Convert solid space to empty space and empty space to solid space.
  invert: function() {
    for (var i = 0; i < this.polygons.length; i++) {
      this.polygons[i].flip();
    }
    this.plane.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    var temp = this.front;
    this.front = this.back;
    this.back = temp;
  },

  // Recursively remove all polygons in `polygons` that are inside this BSP
  // tree.
  clipPolygons: function(polygons) {
    if (!this.plane) return polygons.slice();
    var front = [], back = [];
    for (var i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], front, back, front, back);
    }
    if (this.front && front.length) front = this.front.clipPolygons(front);
    if (this.back && back.length) back = this.back.clipPolygons(back);
    else back = [];
    return front.concat(back);
  },

  // Remove all polygons in this BSP tree that are inside the other BSP tree
  // `bsp`.
  clipTo: function(bsp) {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  },

  // Return a list of all polygons in this BSP tree.
  allPolygons: function() {
    var polygons = this.polygons.slice();
    if (this.front) polygons = polygons.concat(this.front.allPolygons());
    if (this.back) polygons = polygons.concat(this.back.allPolygons());
    return polygons;
  },

  // Build a BSP tree out of `polygons`. When called on an existing tree, the
  // new polygons are filtered down to the bottom of the tree and become new
  // nodes there. Each set of polygons is partitioned using the first polygon
  // (no heuristic is used to pick a good split).
  build: function(polygons, callCount) {
    if (!polygons.length) return;
    callCount ||= 0;
    // if (callCount > 500) {
    //   throw new Error('CSG.polygons are misconfigured');
    // }
    if (!this.plane) this.plane = polygons[0].plane.clone();
    var front = [], back = [];
    for (var i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
    }
    if (front.length) {
      if (!this.front) this.front = new CSG.Node();
      this.front.build(front, callCount + 1);
    }
    if (back.length) {
      if (!this.back) this.back = new CSG.Node();
      this.back.build(back, callCount + 1);
    }
  }
};

/*
   Rotate a point p by angle theta around an arbitrary axis r
   Return the rotated point.
   Positive angles are anticlockwise looking down the axis
   towards the origin.
   Assume right hand coordinate system.
*/
function ArbitraryRotate(point, degreestheta, radius)
{
  if (!Number.isFinite(degreestheta)) return point;
  radius = radius.copy();
  theta = degreestheta * Math.PI/180;
  let p = point;
  let r = radius;
   let q = {x: 0.0, y: 0.0, z: 0.0};
   let costheta,sintheta;

   // const Normalise = (obj, attr) => obj[attr] *= obj[attr] > 0 ? 1 : -1;
   // Normalise(r, 'x',);
   // Normalise(r, 'y',);
   // Normalise(r, 'z',);

   costheta = Math.cos(theta);
   sintheta = Math.sin(theta);

   q.x += (costheta + (1 - costheta) * r.x * r.x) * p.x;
   q.x += ((1 - costheta) * r.x * r.y - r.z * sintheta) * p.y;
   q.x += ((1 - costheta) * r.x * r.z + r.y * sintheta) * p.z;

   q.y += ((1 - costheta) * r.x * r.y + r.z * sintheta) * p.x;
   q.y += (costheta + (1 - costheta) * r.y * r.y) * p.y;
   q.y += ((1 - costheta) * r.y * r.z - r.x * sintheta) * p.z;

   q.z += ((1 - costheta) * r.x * r.z - r.y * sintheta) * p.x;
   q.z += ((1 - costheta) * r.y * r.z + r.x * sintheta) * p.y;
   q.z += (costheta + (1 - costheta) * r.z * r.z) * p.z;

   return(q);
}

function rotate (point, rotation) {
  if (Array.isArray(rotation)) return rotation.forEach(r => rotate(point, r));
  if (!(rotation instanceof Object)) return;
  rotation = new CSG.Vector(rotation);
  let newPos = point;
  newPos = ArbitraryRotate(newPos, rotation.x || 0, {x: 1, y:0, z:0});
  newPos = ArbitraryRotate(newPos, rotation.y || 0, {x: 0, y:1, z:0});
  newPos = ArbitraryRotate(newPos, rotation.z || 0, {x: 0, y:0, z:1});
  return newPos;
}

function reverseRotate (point, rotation) {
  if (Array.isArray(rotation)) return rotation.forEach(r => reverseRotate(point, r));
  rotation = new CSG.Vector(rotation);
  rotation = {x: rotation.x * -1, y: rotation.y * -1, z: rotation.z * -1};
  let newPos = point;
  newPos = ArbitraryRotate(newPos, rotation.z || 0, {x: 0, y:0, z:1});
  newPos = ArbitraryRotate(newPos, rotation.y || 0, {x: 0, y:1, z:0});
  newPos = ArbitraryRotate(newPos, rotation.x || 0, {x: 1, y:0, z:0});
  return newPos;
}

function transRotate (point, offset, rotation) {
  let newPos = rotate (offset, rotation);
  newPos.x += point.x;
  newPos.y += point.y;
  newPos.z += point.z;
  return newPos;
}

function translate (point, offset) {
  if (Array.isArray(offset)) offset = {x: offset[0], y: offset[1], z: offset[2]};
  if (point instanceof CSG.Vertex) {
    const newPos = point.clone();
    newPos.pos.x += offset.x;
    newPos.pos.y += offset.y;
    newPos.pos.z += offset.z;
    return newPos;

  } else {
    const newPos = point.clone();
    newPos.x += offset.x;
    newPos.y += offset.y;
    newPos.z += offset.z;
    return newPos;
  }
}

function transRotateAll (points, offset, rotation) {
  for (let index = 0; index < points.length; index++) {
    points[index] = transRotate(points[index], offset, rotation);
  }
}

function rotateAll (points, rotation) {
  const ret = [];
  for (let index = 0; index < points.length; index++) {
    ret[index] = rotate(points[index], rotation);
  }
  return ret;
}

function reverseRotateAll (points, rotation) {
  const ret = [];
  for (let index = 0; index < points.length; index++) {
    ret[index] = reverseRotate(points[index], rotation);
  }
  return ret;
}

function rotatePointAroundCenter(rotation, point, center, reverse) {
  if (Array.isArray(rotation)) return rotation.forEach(r => rotatePointAroundCenter(r, point, center, reverse));
  if (!(rotation instanceof Object)) return;
  center ||= {x:0, y:0, z:0};
  point.x -=  center.x;
  point.y -= center.y;
  point.z -= center.z;
  const rotated = reverse ? reverseRotate(point, rotation) : rotate(point, rotation);
  point.x =  center.x + rotated.x;
  point.y = center.y + rotated.y;
  point.z = center.z + rotated.z;
  return point;
}

function rotatePointsAroundCenter(rotation, points, center, reverse) {
  for (let index = 0; index < points.length; index++) {
    rotatePointAroundCenter(rotation, points[index], center, reverse);
  }
  return points;
}

CSG.printDrawString = (model, normals, center, scale) => {
  center ||= model.center();
  scale ||= 200;
  const str = `${normals.x.toDrawString('red', .001, center, scale)}\n` +
                `${normals.y.toDrawString('green', .001, center, scale)}\n` +
                `${normals.z.toDrawString('blue', .001, center, scale)}\n\n` +
                model.toDrawString();

  console.log(str);
}
CSG.ArbitraryRotate = ArbitraryRotate;
CSG.rotatePointsAroundCenter = rotatePointsAroundCenter;
CSG.rotatePointAroundCenter = rotatePointAroundCenter;
CSG.transRotate = transRotate;
CSG.translate = translate;
CSG.rotateAll = rotateAll;
CSG.transRotateAll = transRotateAll;
CSG.reverseRotateAll = reverseRotateAll;
CSG.rotate = rotate;
CSG.reverseRotate = reverseRotate;
module.exports = CSG;
