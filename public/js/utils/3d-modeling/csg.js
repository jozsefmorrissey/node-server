

const GL = require('./lightgl.js');

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
  this.toString = () => {
    let str = '';
    for (let index = 0; index < this.polygons.length; index++) {
      const verts = this.polygons[index].vertices;
      str += '['
      for (let v = 0; v < verts.length; v++) {
        str += `${verts[v].toString()},`;
      }
      str = `${str.substring(0, str.length - 1)}]\n`;
    }
    return str;
  }
};

const colors = {
  indianred: [205, 92, 92],
  gray: [128, 128, 128],
  fuchsia: [255, 0, 255],
  lime: [0, 255, 0],
  black: [0, 0, 0],
  lightsalmon: [255, 160, 122],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  yellow: [255, 255, 0],
  olive: [128, 128, 0],
  lightcoral: [240, 128, 128],
  green: [0, 128, 0],
  aqua: [0, 255, 255],
  white: [255, 255, 255],
  teal: [0, 128, 128],
  darksalmon: [233, 150, 122],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  salmon: [250, 128, 114],
  silver: [192, 192, 192],
  purple: [128, 0, 128]
}

// Construct a CSG solid from a list of `CSG.Polygon` instances.
CSG.fromPolygons = function(polygons, deepCopy) {
  var csg = new CSG();

  if (deepCopy) {
    const newPolys = [];
    for (let pi = 0; pi < polygons.length; pi++) {
      const polygon = polygons[pi];
      const vertices =  polygon.vertices;
      const newVerts = [];
      const shared = Array.from(polygon.shared || []);
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

CSG.toString = function () {
  const list = [];
  this.polygons.forEach((polygon) => {
    const obj = {vertices: []};
    polygon.vertices.forEach((vertex) =>
        obj.vertices.push({x: vertex.pos.x, y: vertex.pos.y, z: vertex.pos.z}));
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

  scale: function(coeficient) {
    const center = this.center();
    this.polygons.map(function(p) { return p.scale(center, coeficient); });
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
    if (csg.polygons.length === 0) return CSG.fromPolygons(this.polygons);
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

  demensions: function () {
    const epts = this.endpoints();
    return {
      x: epts.x - epts['-x'],
      y: epts.y - epts['-y'],
      z: epts.z - epts['-z']
    }
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
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      let newPos = vertex.pos;
      newPos = ArbitraryRotate(newPos, rotations.x, {x: pivot.x, y:0, z:0});
      newPos = ArbitraryRotate(newPos, rotations.y, {x: 0, y:pivot.y, z:0});
      newPos = ArbitraryRotate(newPos, rotations.z, {x: 0, y:0, z:pivot.z});
      return new CSG.Vertex(newPos, vertex.normal);
    }));
  },
  reverseRotate: function (rotation) {
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
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      vertex.pos.x += offset.x;
      vertex.pos.y += offset.y;
      vertex.pos.z += offset.z;
    }));
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
CSG.cube = function(options) {
  options = options || {};
  var c = new CSG.Vector(options.center || [0, 0, 0]);
  var r = !options.radius ? [1, 1, 1] : options.radius.length ?
           options.radius : [options.radius, options.radius, options.radius];
  if (options.demensions) {
    r = [options.demensions[0]/2, options.demensions[1]/2, options.demensions[2]/2];
  }
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

CSG.Point = function (center, radius, color) {
  const sphere = new CSG.sphere({radius, center});
  sphere.setColor(color);
  return sphere;
}

function vecotrOvertexModel(start, end, model, defaultColor) {
  let color = end.color || defaultColor;
  if (end instanceof CSG.Vector) {
    const unit = end.minus(new CSG.Vector(start)).unit().times(6);
    start = end.minus(unit);
    return new CSG.cone({start, end, model, color, radius: 5});
  } else {
    return new CSG.Point(end, 1, color).union(model);
  }
}

CSG.Line = function (options) {
  options ||= {};
  const start = options.start || [0,0,0];
  const end = options.end || [0,0,0];
  const radius = options.radius || .2;
  let model = new CSG.cylinder({start, end, radius});
  model = vecotrOvertexModel(end, start, model, options.color);
  model.setColor(options.color);
  return vecotrOvertexModel(start, end, model, options.color);
}


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
  var slices = options.slices || 16;
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
  return CSG.fromPolygons(polygons);
};

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
  var slices = options.slices || 16;
  var axisZ = ray.unit(), isY = (Math.abs(axisZ.y) > 0.5);
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
  for (var i = 0; i < slices; i++) {
    var t0 = i / slices, t1 = (i + 1) / slices;
    polygons.push(new CSG.Polygon([start, point(0, t0, -1), point(0, t1, -1)]));
    polygons.push(new CSG.Polygon([point(0, t1, 0), point(0, t0, 0), point(1, t0, 0), point(1, t1, 0)]));
    polygons.push(new CSG.Polygon([end, point(1, t1, 1), point(1, t0, 1)]));
  }
  return CSG.fromPolygons(polygons);
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

CSG.cone = function (options) {
  options ||= {};
  let length = options.length || 10;
  const start = new CSG.Vector(options.start || [0,0,0]);
  const end = new CSG.Vector(options.end || start.add([0,length,0]));
  length = end.minus(start).length();
  const point = new CSG.sphere({radius: 1, center: end});
  const radius = options.radius || 5;
  const slices = options.slices || 16;
  let cylinder = new CSG.cylinder({start, end, radius, slices});
  let cone = cylinder.clone();
  cone.setColor(options.color);
  const sliceRotation = 360/slices;
  const rotationVector = end.minus(start).unit();
  const lengthVector = rotationVector.clone().times(length);
  const perpVector = perpendicularVector(rotationVector.clone()).times(radius/-2);
  const widthVector = perpVector.cross(rotationVector).unit().times(30);
  const cutterCenter = end;
  const plane = new CSG.Rectangle([30, length*10, radius], cutterCenter, rotationVector.unit(), widthVector.unit());
  const planeCenter = new CSG.Vector(plane.center());
  plane.setColor(options.color);
  plane.translate(perpVector);
  plane.translate(cutterCenter.negated());
  plane.ArbitraryRotate(5, widthVector.unit());
  plane.translate(cutterCenter);

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

  // const e = rotationVector.times(1000);
  // const s = cutterCenter;
  // const p = perpVector.times(100);
  // const w = widthVector.times(100);
  // const r = cutterCenter.plus(lengthVector);
  // // const line = new CSG.Line({start: [s.x,s.y,s.z], end: [e.x,e.y,e.z]});
  // const line1 = new CSG.Line({start: [0,0,0], end: [w.x,w.y,w.z], color: 'green'});
  // const line2 = new CSG.Line({start: [0,0,0], end: [p.x,p.y,p.z], color: 'blue'});
  // const line3 = new CSG.Line({start: [0,0,0], end: [e.x,e.y,e.z], color: 'yellow'});
  // // const line4 = new CSG.Line({start: [0,0,0], end: [r.x,r.y,r.z], color: 'red'});
  // return line1.union(line2).union(line3).union(cone);//.union(line4).union(line);//.union(options.model);//cylinder.union(line);

  return cone;
}

function axis(vector, origin, color, size) {
  origin ||= [0,0,0];
  const end = [vector[0]+origin[0],vector[1]+origin[1],vector[2]+origin[2]]
  const ax = CSG.cylinder({start: origin, end, radius: size/1000})
  ax.setColor(color);
  return ax;
}

CSG.axis =  function (size, origin) {
  size ||= 100;
  origin ||= [0,0,0];
  const center = CSG.sphere({center: origin, radius: size/500})
  const xAxis = axis([size,0,0], origin, [255,0,0], size);
  const yAxis = axis([0,size,0], origin, [0,128,0], size);
  const zAxis = axis([0,0,size], origin, [0,0,255], size);
  return center.union(xAxis.union(yAxis).union(zAxis));
}

// # class Vector

// Represents a 3D vector.
//
// Example usage:
//
//     new CSG.Vector(1, 2, 3);
//     new CSG.Vector([1, 2, 3]);
//     new CSG.Vector({ x: 1, y: 2, z: 3 });

CSG.Vector = function(x, y, z) {
  if (arguments.length == 3) {
    this.x = x;
    this.y = y;
    this.z = z;
  } else if ('x' in x) {
    this.x = x.x;
    this.y = x.y;
    this.z = x.z;
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

  toString: function() {
    return `(${this.x},${this.y},${this.z})`
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

CSG.Vertex = function(pos, normal) {
  this.pos = new CSG.Vector(pos);
  this.normal = new CSG.Vector(normal);
  this.toString = () => `(${this.pos.x},${this.pos.y},${this.pos.z})`;

  this.scale = (center, coeficient) => {
    const centerVector = new CSG.Vector(center);
    const vector = new CSG.Vector(pos.x - center.x, pos.y - center.y, pos.z - center.z);
    const scaled = vector.times(coeficient);
    this.pos = centerVector.plus(scaled);
  }
};

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
  toString: function () {
    return `(${this.pos.x},${this.pos.y},${this.pos.z})`
  },

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
};

// `CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
// point is on the plane.
CSG.Plane.EPSILON = 1e-5;//1e-3;

CSG.Plane.fromPoints = function(a, b, c) {
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
  setColor: function(r, g, b) {
    if (colors[r]) r = colors[r];
    if (Array.isArray(r)) {
      g = r[1];
      b = r[2];
      r = r[0];
    }
    this.shared = [r/255, g/255, b/255];
  }
};

CSG.Polygon.Enclosed = function (verts, width, color) {
  width ||= .1;
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
  verts.forEach(v => v.color && (model = model.union(new CSG.Point(v, 1, v.color))));
  model.setColor(color);
  return model;//model.union(vect);
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
    if (this.front) front = this.front.clipPolygons(front);
    if (this.back) back = this.back.clipPolygons(back);
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
  build: function(polygons) {
    if (!polygons.length) return;
    if (!this.plane) this.plane = polygons[0].plane.clone();
    var front = [], back = [];
    for (var i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
    }
    if (front.length) {
      if (!this.front) this.front = new CSG.Node();
      this.front.build(front);
    }
    if (back.length) {
      if (!this.back) this.back = new CSG.Node();
      this.back.build(back);
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
  let newPos = point;
  newPos = ArbitraryRotate(newPos, rotation.x || 0, {x: 1, y:0, z:0});
  newPos = ArbitraryRotate(newPos, rotation.y || 0, {x: 0, y:1, z:0});
  newPos = ArbitraryRotate(newPos, rotation.z || 0, {x: 0, y:0, z:1});
  return newPos;
}

function reverseRotate (point, rotation) {
  if (Array.isArray(rotation)) return rotation.forEach(r => reverseRotate(point, r));
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
    // i = isZero(i) ? 0 : i;
    // j = isZero(j) ? 0 : j;
    // k = isZero(k) ? 0 : k;
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

// module.exports = Vector3D;
