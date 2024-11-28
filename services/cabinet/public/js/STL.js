let fs = () => 'Only works on searver';
let shell = fs;

try {
  fs = require('fs');
  shell = require('shelljs');
} catch(e) {}



function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class MapScript {
  constructor (absolutePath, script) {
    this.script = script;
    script = MapScript.removeReg(/\/\/.*?\n/g, '', script);
    script = MapScript.removeReg(/`.*?`/g, '', script);
    script = MapScript.removeReg(/([^\\])\/[^\n]{1,}?[^\\]\//g, '$1', script);
    script = MapScript.removeReg(MapScript.reg.block, '', script);
    script = MapScript.removeReg(/\s{2,}/g, ' ', script);

    this.absPath = () => absolutePath;
    this.dir = () => absolutePath.replace(/^(.*\/).*$/, '$1')
    this.existingExports = MapScript.regToNameArr(MapScript.reg.export, script);
    this.requires = MapScript.regToNameArr(MapScript.reg.require, script);
    this.classes = MapScript.regToNameArr(MapScript.reg.class, script);
    this.functions = MapScript.regToNameArr(MapScript.reg.function, script);
    this.consts = MapScript.regToNameArr(MapScript.reg.const, script);

    this.exports = this.existingExports.length > 0 ?
                    this.existingExports : (this.classes.length > 0 ?
                        this.classes : (this.functions.length > 0 ?
                          this.functions : this.consts));

    this.exportStr = () => {
      let exportStr = '';
      if (this.existingExports.length === 0) {
        if (this.exports.length === 1) return `module.exports = ${this.exports[0]}\n`;
        this.exports.forEach((exprt) => (exportStr += `exports.${exprt} = ${exprt}\n`));
      }
      return exportStr;
    }

    this.requireStr = async () => {
      return new Promise(async (resolve) => {
        let requireStr = '';
        if (this.requires.length === 0) {
          const reqReg = MapScript.findRequireReg();
          if (reqReg) {
            const referenced = this.script.match(reqReg.all) || [];
            const filesRefd = {};
            filesRefd[this.absPath()] = true;
            for (let i = 0; i < referenced.length; i += 1) {
              const ref = referenced[i];
              const formattedRef = ref.match(reqReg.first)[1];
              const refMap = MapScript.list[formattedRef];
              if (!filesRefd[refMap.absPath()]) {
                filesRefd[refMap.absPath()] = true;
                const moduleExport = refMap.exports.length === 1;
                const relativePath = await MapScript.toRelativePath(refMap.absPath(), this.dir());
                requireStr += `const ${formattedRef} = require('${relativePath}')`;
                requireStr += moduleExport ? ';\n' : `.${formattedRef};\n`
              }
            }
          }
        }
        resolve(requireStr);
      });
      return requireStr;
    }

    this.toString = async () => {
      const arrToStr = (name, arr) => `(${arr.length}) ${name}: ${arr}\n`;
      console.log(`File: ${absolutePath}\n` +
             arrToStr('exports', this.exports) +
             arrToStr('requires', this.requires) +
             arrToStr('classes', this.classes) +
             arrToStr('functions', this.functions) +
             arrToStr('consts', this.consts) +
             `requireStr ${await this.requireStr()}\n` +
             `exportStr ${this.exportStr()}\n` +
             `script: \n${script}`);
    }
    this.exports.forEach((name) => MapScript.list[name] = this);
  }
}

MapScript.list = {};
MapScript.findRequireReg = () => {
  let reg = '';
  const names = Object.keys(MapScript.list);
  if (names.length === 0) return null;
  names.forEach((name) => {
    reg += `${name}|`;
  });
  reg = reg.substr(0, reg.length - 1);
  reg = `[^a-z^A-Z^$^_](${reg})[^a-z^A-Z^0-9^$^_]`;
  return {all: new RegExp(reg, 'g'), first: new RegExp(reg)};
}
MapScript.regToNameArr = function (regObj, script) {
  const arr = [];
  const matches = script.match(regObj.all) || [];
  matches.forEach((match) =>
    arr.push(regObj.name.apply(null, match.match(regObj.first))))
  return arr;
}

MapScript.removeReg = function (reg, replace, script) {
  while(script.match(reg)) {
    script = script.replace(reg, replace);
  }
  return script;
}

MapScript.value = {one: (match, one) => one};
MapScript.value.exports = (match, one, two, exportName, realName) => {
  return exportName || realName;
}

MapScript.reg = {};
MapScript.reg.const = {
  all: /const\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)\s{1,}=/g,
  first: /const\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)\s{1,}=/,
  name: MapScript.value.one
}

MapScript.reg.function = {
  all: /function\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/g,
  first: /function\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/,
  name: MapScript.value.one
}

MapScript.reg.class = {
  all: /class\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/g,
  first: /class\s{1,}([a-zA-Z$_][a-zA-Z0-9$_]*)/,
  name: MapScript.value.one
}
MapScript.reg.export = {
  all: /(module.|)exports(.([a-zA-Z$_][a-zA-Z0-9$_]*)|)\s*=\s*([a-zA-Z$_][a-zA-Z0-9$_]*)/g,
  first: /(module.|)exports(.([a-zA-Z$_][a-zA-Z0-9$_]*)|)\s*=\s*([a-zA-Z$_][a-zA-Z0-9$_]*)/,
  name: MapScript.value.exports
}

MapScript.reg.require = {
  all: /require\((.*?)\)/g,
  first: /require\((.*?)\)/,
  name: MapScript.value.one
}

MapScript.reg.block = /\{[^{^}]*\}/g;
MapScript.upFolderRegex = /(\/|^)([^/]{3,}|[^.]|[^.].|.[^.])\/\.\.\//g;


MapScript.simplifyPath = function (path) {
  path = path.replace(/^\.\//, '');
  path = path.replace(/\/.\//, '/');
  path += path.match(/^.*\.(js|json)$/) ? '' : '.js';
  let simplified = path;
  let currSimplify = path;
  while(currSimplify.match(MapScript.upFolderRegex)) {
    currSimplify = currSimplify.replace(MapScript.upFolderRegex, '$1');
    simplified = currSimplify;
  }
  const fChar = simplified[0];
  if (fChar !== '.' && fChar !== '/') simplified = `./${simplified}`;
  return simplified;
}

MapScript.toRelativePath = async function (path, dir) {
  const cmd = `realpath --relative-to='${dir}' '${path}'`;
  const promise = new Promise((resolve) => {
    function resolver(data) {
      const relPath = MapScript.simplifyPath(`${data.trim()}`);
      resolve(relPath);
    }
    const child = shell.exec(cmd, {async: true, silent: true});
    child.stdout.on('data', resolver);
  });
  return promise;
}


class RequireJS {
  constructor(projectDir, main) {
    function guessProjectDir () {
      const stackTarget = new Error().stack.split('\n')[4];
      return stackTarget === undefined ? '' : stackTarget
          .replace(/^.*?\(([^(^:]*)\/[^/]{1,}?:.*$/, '$1');
    }

    projectDir = projectDir || guessProjectDir();
    const scripts = {};
    const prefixReg = /^\.\//;
    const trimPrefix = (path) => path.replace(prefixReg, '');

    const nameReg = /^(.*)\/(.*)$/;
    function guessFilePath (wrongPath, currFile) {
      const guesses = [];
      const fileName = wrongPath.replace(nameReg, '$2').toLowerCase();
      Object.keys(scripts).forEach((path) => {
        const name = path.replace(nameReg, '$2').toLowerCase();
        if (name === fileName) {
          guesses.push('??' + determineRelativePath(currFile, path));
        }
      });
      return guesses;
    }

    function determineRelativePath(from, to) {
      from = trimPrefix(MapScript.simplifyPath(from))
      from = from.replace(nameReg, '$1');
      from = from.split('/');
      to = trimPrefix(MapScript.simplifyPath(to))
      to = to.split('/');
      let index = 0;
      while (from[index] && from[index] === to[index]) {
        index += 1;
      }
      const backPages = from.length - index;
      if (backPages) {
        const relPathArr = backPages === 0  ? `./${to.slice(to.length - 1)}` :
              new Array(backPages).fill('..').concat(to.slice(index)).join('/');
        return relPathArr;
      }
      return './' + to.slice(index).join('/');
    }

    function requireWrapper (absDir, relativePath, filePath) {
      relativePath = MapScript.simplifyPath(relativePath);
      const path = MapScript.simplifyPath(`${absDir}${relativePath}`);
      if (scripts[path] instanceof Unloaded) {
        scripts[path] = scripts[path].load();
      }
      if (scripts[path] === undefined) {
        console.warn(`Trying to load a non existent js file
\t'${relativePath}' from file '${filePath}'
\t\tDid you mean:\n\t\t\t${guessFilePath(relativePath, filePath).join('\n\t\t\t')}`);
      }
      return scripts[path];
    }

    function requireFunc (absoluteDir, filePath) {
      return (relativePath) => requireWrapper(absoluteDir, relativePath, filePath);
    }

    const loadPath = [];
    class Unloaded {
      constructor(path, func) {
        const absoluteDir = MapScript.simplifyPath(path).replace(/(.*\/).*/, '$1');
        const modulee = {exports: {}};
        this.load = () => {
          if (loadPath.indexOf(path) !== -1)
            throw Error(`Circular Reference: ${path}\n\t\t${loadPath.join('\n\t\t')}`);
          loadPath.push(path);
          func(requireFunc(absoluteDir, path), modulee.exports, modulee);
          loadPath.splice(loadPath.indexOf(path), 1);
          return modulee.exports;
        };
      }
    }

    function addFunction (path, func) {
      scripts[path] = new Unloaded(path, func);
    }

    let header;
    this.header = () => {
      if (header === undefined) {
        header = fs.readFileSync(__filename, 'utf8');
      }
      return `${header}\n\n\n`;
    }

    this.footer = () => {
      return `try {window.onload = () => RequireJS.init('${main}')}
              catch {RequireJS.init('${main}')}\n`;
    }

    let guess = false;
    this.guess = (g) => guess = (typeof g) === 'boolean' ? g : !guess;

    function resolveBody (script) {
      async function resolver(resolve) {
        try {
          JSON.parse(script);
          resolve(`module.exports = ${script.trim()};`);
        } catch (e) {
          if (guess) {
            const reqStr = await map.requireStr();
            const expStr = map.exportStr();
            resolve(`${reqStr}\n${script}${expStr}\n`);
          } else {
            resolve(script);
          }
        }
      }
      return new Promise(resolver);
    }


    const startTime = new Date().getTime();
    const pathCache = {};
    function encapsulate(absolutePath, script) {
      const map = new MapScript(absolutePath, script);
      async function resolver (resolve) {
        if (pathCache[absolutePath] === undefined) {
          pathCache[absolutePath] = await MapScript.toRelativePath(absolutePath, projectDir);
        }
        const body = await resolveBody(script);
        const encaps = `RequireJS.addFunction('${pathCache[absolutePath]}',
function (require, exports, module) {
${body.replace(/(^|\n)/g, '\n\t').substr(1)}
});\n\n\n`;
        resolve(encaps);

        if (guess && startTime + 10000 < new Date().getTime()) {
          fs.writeFile(map.absPath(), body, 'utf8');
        }

      }
      const promise = new Promise(resolver);
      return promise;
    }

    function init(main) {
      requireWrapper ('', main)
    }

    this.init = init;
    this.encapsulate = encapsulate;
    this.addFunction = addFunction;
  }
}


try {
  exports.RequireJS = RequireJS;
} catch (e) {}

RequireJS = new RequireJS();



RequireJS.addFunction('./public/js/utils/3d-modeling/csg.js',
function (require, exports, module) {
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
	                            p.plane.normal, String.color.rgb.percent(p.rgb())));
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
	    const vector = c.vector || new CSG.Vector({y: 0, x: 0, z: 1});
	    const center = new CSG.Vector(c.center || mainCenter);
	    const length = c.length;
	    const radius = c.radius || c.diameter / 2;
	    const slices = c.slices || mainSlices;
	    const half = c.half || options.half;
	    const start = half === true ? center : center.minus(vector.times(c.length/-2));
	    const end = half === false ? center : center.minus(vector.times(c.length/2));
	    const cylinder = new CSG.cylinder({start, end, center, radius, slices});
	    stepCylinder = stepCylinder.union(cylinder);
	  });
	  return stepCylinder;
	}
	
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
	    this.z = x.z;
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
	    const rgb = String.color.rgb(color);
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
	    let color = includeColor ? String.colorName(shared) : '';
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
	    const name = String.colorName(this.shared);
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
	    const rgb = String.color.rgb(color);
	    this.shared = [rgb[0]/255, rgb[1]/255, rgb[2]/255];
	  }
	};
	
	CSG.Polygon.fromVertices = (verts) => {
	  const a = new CSG.Vector(verts[0]);
	  const b = new CSG.Vector(verts[1]);
	  const c = new CSG.Vector(verts[2]);
	  const norm = a.minus(b).cross(b.minus(c));
	  const vertices = verts.map(v => new CSG.Vertex(v, norm));
	  const poly = new CSG.Polygon(vertices);
	
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
	
});


RequireJS.addFunction('./public/js/utils/3d-modeling/export-dxf.js',
function (require, exports, module) {
	

	
	const Company = require('../../../app-src/objects/company.js');
	
	
	/*
	AutoCAD DXF Content
	
	These are the common headers, classes, tables, blocks, and objects required for AC2017 DXF files.
	
	## License
	
	Copyright (c) 2018 Z3 Development https://github.com/z3dev
	
	All code released under MIT license
	*/
	
	// Important Variables
	//   ANGDIR = 0 : counter clockwise angles
	//   INSUNITS = 4 : millimeters
	//
	const dxfHeaders = function () {
	  const content = `  0
	SECTION
	  2
	HEADER
	  9
	$ACADVER
	  1
	AC1027
	  9
	$ACADMAINTVER
	 70
	8
	  9
	$DWGCODEPAGE
	  3
	ANSI_1252
	  9
	$LASTSAVEDBY
	  1
	unknown
	  9
	$REQUIREDVERSIONS
	160
	0
	  9
	$INSBASE
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$EXTMIN
	 10
	1e+20
	 20
	1e+20
	 30
	1e+20
	  9
	$EXTMAX
	 10
	-1e+20
	 20
	-1e+20
	 30
	-1e+20
	  9
	$LIMMIN
	 10
	0.0
	 20
	0.0
	  9
	$LIMMAX
	 10
	12.0
	 20
	9.0
	  9
	$ORTHOMODE
	 70
	0
	  9
	$REGENMODE
	 70
	1
	  9
	$FILLMODE
	 70
	1
	  9
	$QTEXTMODE
	 70
	0
	  9
	$MIRRTEXT
	 70
	0
	  9
	$LTSCALE
	 40
	1.0
	  9
	$ATTMODE
	 70
	1
	  9
	$TEXTSIZE
	 40
	0.2
	  9
	$TRACEWID
	 40
	0.05
	  9
	$TEXTSTYLE
	  7
	Notes
	  9
	$CLAYER
	  8
	0
	  9
	$CELTYPE
	  6
	ByLayer
	  9
	$CECOLOR
	 62
	256
	  9
	$CELTSCALE
	 40
	1.0
	  9
	$DISPSILH
	 70
	0
	  9
	$DIMSCALE
	 40
	1.0
	  9
	$DIMASZ
	 40
	3.0
	  9
	$DIMEXO
	 40
	1.5
	  9
	$DIMDLI
	 40
	6.0
	  9
	$DIMRND
	 40
	0.0
	  9
	$DIMDLE
	 40
	0.0
	  9
	$DIMEXE
	 40
	3.0
	  9
	$DIMTP
	 40
	0.0
	  9
	$DIMTM
	 40
	0.0
	  9
	$DIMTXT
	 40
	3.0
	  9
	$DIMCEN
	 40
	3.0
	  9
	$DIMTSZ
	 40
	0.0
	  9
	$DIMTOL
	 70
	0
	  9
	$DIMLIM
	 70
	0
	  9
	$DIMTIH
	 70
	0
	  9
	$DIMTOH
	 70
	0
	  9
	$DIMSE1
	 70
	0
	  9
	$DIMSE2
	 70
	0
	  9
	$DIMTAD
	 70
	1
	  9
	$DIMZIN
	 70
	3
	  9
	$DIMBLK
	  1
	
	  9
	$DIMASO
	 70
	1
	  9
	$DIMSHO
	 70
	1
	  9
	$DIMPOST
	  1
	
	  9
	$DIMAPOST
	  1
	
	  9
	$DIMALT
	 70
	0
	  9
	$DIMALTD
	 70
	2
	  9
	$DIMALTF
	 40
	25.4
	  9
	$DIMLFAC
	 40
	1.0
	  9
	$DIMTOFL
	 70
	0
	  9
	$DIMTVP
	 40
	0.0
	  9
	$DIMTIX
	 70
	0
	  9
	$DIMSOXD
	 70
	0
	  9
	$DIMSAH
	 70
	0
	  9
	$DIMBLK1
	  1
	
	  9
	$DIMBLK2
	  1
	
	  9
	$DIMSTYLE
	  2
	Civil-Metric
	  9
	$DIMCLRD
	 70
	0
	  9
	$DIMCLRE
	 70
	0
	  9
	$DIMCLRT
	 70
	0
	  9
	$DIMTFAC
	 40
	1.0
	  9
	$DIMGAP
	 40
	2.0
	  9
	$DIMJUST
	 70
	0
	  9
	$DIMSD1
	 70
	0
	  9
	$DIMSD2
	 70
	0
	  9
	$DIMTOLJ
	 70
	1
	  9
	$DIMTZIN
	 70
	0
	  9
	$DIMALTZ
	 70
	0
	  9
	$DIMALTTZ
	 70
	0
	  9
	$DIMUPT
	 70
	0
	  9
	$DIMDEC
	 70
	2
	  9
	$DIMTDEC
	 70
	2
	  9
	$DIMALTU
	 70
	2
	  9
	$DIMALTTD
	 70
	2
	  9
	$DIMTXSTY
	  7
	Standard
	  9
	$DIMAUNIT
	 70
	0
	  9
	$DIMADEC
	 70
	2
	  9
	$DIMALTRND
	 40
	0.0
	  9
	$DIMAZIN
	 70
	2
	  9
	$DIMDSEP
	 70
	46
	  9
	$DIMATFIT
	 70
	3
	  9
	$DIMFRAC
	 70
	1
	  9
	$DIMLDRBLK
	  1
	
	  9
	$DIMLUNIT
	 70
	2
	  9
	$DIMLWD
	 70
	-2
	  9
	$DIMLWE
	 70
	-2
	  9
	$DIMTMOVE
	 70
	0
	  9
	$DIMFXL
	 40
	1.0
	  9
	$DIMFXLON
	 70
	0
	  9
	$DIMJOGANG
	 40
	0.785398163397
	  9
	$DIMTFILL
	 70
	0
	  9
	$DIMTFILLCLR
	 70
	0
	  9
	$DIMARCSYM
	 70
	0
	  9
	$DIMLTYPE
	  6
	
	  9
	$DIMLTEX1
	  6
	
	  9
	$DIMLTEX2
	  6
	
	  9
	$DIMTXTDIRECTION
	 70
	0
	  9
	$LUNITS
	 70
	2
	  9
	$LUPREC
	 70
	4
	  9
	$SKETCHINC
	 40
	0.1
	  9
	$FILLETRAD
	 40
	0.0
	  9
	$AUNITS
	 70
	4
	  9
	$AUPREC
	 70
	5
	  9
	$MENU
	  1
	.
	  9
	$ELEVATION
	 40
	0.0
	  9
	$PELEVATION
	 40
	0.0
	  9
	$THICKNESS
	 40
	0.0
	  9
	$LIMCHECK
	 70
	0
	  9
	$CHAMFERA
	 40
	0.0
	  9
	$CHAMFERB
	 40
	0.0
	  9
	$CHAMFERC
	 40
	0.0
	  9
	$CHAMFERD
	 40
	0.0
	  9
	$SKPOLY
	 70
	0
	  9
	$TDCREATE
	 40
	2457986.69756
	  9
	$TDUCREATE
	 40
	2455631.2632
	  9
	$TDUPDATE
	 40
	2457986.69756
	  9
	$TDUUPDATE
	 40
	2456436.43179
	  9
	$TDINDWG
	 40
	0.0003490741
	  9
	$TDUSRTIMER
	 40
	0.0003487153
	  9
	$USRTIMER
	 70
	1
	  9
	$ANGBASE
	 50
	0.0
	  9
	$ANGDIR
	 70
	0
	  9
	$PDMODE
	 70
	0
	  9
	$PDSIZE
	 40
	0.0
	  9
	$PLINEWID
	 40
	0.0
	  9
	$SPLFRAME
	 70
	0
	  9
	$SPLINETYPE
	 70
	6
	  9
	$SPLINESEGS
	 70
	8
	  9
	$HANDSEED
	  5
	5C7
	  9
	$SURFTAB1
	 70
	6
	  9
	$SURFTAB2
	 70
	6
	  9
	$SURFTYPE
	 70
	6
	  9
	$SURFU
	 70
	6
	  9
	$SURFV
	 70
	6
	  9
	$UCSBASE
	  2
	
	  9
	$UCSNAME
	  2
	
	  9
	$UCSORG
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSXDIR
	 10
	1.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSYDIR
	 10
	0.0
	 20
	1.0
	 30
	0.0
	  9
	$UCSORTHOREF
	  2
	
	  9
	$UCSORTHOVIEW
	 70
	0
	  9
	$UCSORGTOP
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSORGBOTTOM
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSORGLEFT
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSORGRIGHT
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSORGFRONT
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$UCSORGBACK
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSBASE
	  2
	
	  9
	$PUCSNAME
	  2
	
	  9
	$PUCSORG
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSXDIR
	 10
	1.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSYDIR
	 10
	0.0
	 20
	1.0
	 30
	0.0
	  9
	$PUCSORTHOREF
	  2
	
	  9
	$PUCSORTHOVIEW
	 70
	0
	  9
	$PUCSORGTOP
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSORGBOTTOM
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSORGLEFT
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSORGRIGHT
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSORGFRONT
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PUCSORGBACK
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$USERI1
	 70
	0
	  9
	$USERI2
	 70
	0
	  9
	$USERI3
	 70
	0
	  9
	$USERI4
	 70
	0
	  9
	$USERI5
	 70
	0
	  9
	$USERR1
	 40
	0.0
	  9
	$USERR2
	 40
	0.0
	  9
	$USERR3
	 40
	0.0
	  9
	$USERR4
	 40
	0.0
	  9
	$USERR5
	 40
	0.0
	  9
	$WORLDVIEW
	 70
	1
	  9
	$SHADEDGE
	 70
	3
	  9
	$SHADEDIF
	 70
	70
	  9
	$TILEMODE
	 70
	1
	  9
	$MAXACTVP
	 70
	64
	  9
	$PINSBASE
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  9
	$PLIMCHECK
	 70
	0
	  9
	$PEXTMIN
	 10
	0.628866766397
	 20
	0.799999952316
	 30
	0.0
	  9
	$PEXTMAX
	 10
	9.02886638493
	 20
	7.19999957085
	 30
	0.0
	  9
	$PLIMMIN
	 10
	-0.700541819174
	 20
	-0.228100386192
	  9
	$PLIMMAX
	 10
	10.2994579405
	 20
	8.27189937351
	  9
	$UNITMODE
	 70
	0
	  9
	$VISRETAIN
	 70
	1
	  9
	$PLINEGEN
	 70
	0
	  9
	$PSLTSCALE
	 70
	1
	  9
	$TREEDEPTH
	 70
	3020
	  9
	$CMLSTYLE
	  2
	Standard
	  9
	$CMLJUST
	 70
	0
	  9
	$CMLSCALE
	 40
	1.0
	  9
	$PROXYGRAPHICS
	 70
	1
	  9
	$MEASUREMENT
	 70
	1
	  9
	$CELWEIGHT
	370
	-1
	  9
	$ENDCAPS
	280
	0
	  9
	$JOINSTYLE
	280
	0
	  9
	$LWDISPLAY
	290
	0
	  9
	$INSUNITS
	 70
	4
	  9
	$HYPERLINKBASE
	  1
	
	  9
	$STYLESHEET
	  1
	
	  9
	$XEDIT
	290
	1
	  9
	$CEPSNTYPE
	380
	0
	  9
	$PSTYLEMODE
	290
	1
	  9
	$FINGERPRINTGUID
	  2
	{39DB1BDD-BC6C-46D3-A333-DFCC0DC4782D}
	  9
	$VERSIONGUID
	  2
	{69EEBB2D-7039-498F-9366-3F994E4A07E7}
	  9
	$EXTNAMES
	290
	1
	  9
	$PSVPSCALE
	 40
	0.0
	  9
	$OLESTARTUP
	290
	0
	  9
	$SORTENTS
	280
	127
	  9
	$INDEXCTL
	280
	0
	  9
	$HIDETEXT
	280
	1
	  9
	$XCLIPFRAME
	280
	0
	  9
	$HALOGAP
	280
	0
	  9
	$OBSCOLOR
	 70
	257
	  9
	$OBSLTYPE
	280
	0
	  9
	$INTERSECTIONDISPLAY
	280
	0
	  9
	$INTERSECTIONCOLOR
	 70
	257
	  9
	$DIMASSOC
	280
	2
	  9
	$PROJECTNAME
	  1
	
	  9
	$CAMERADISPLAY
	290
	0
	  9
	$LENSLENGTH
	 40
	50.0
	  9
	$CAMERAHEIGHT
	 40
	0.0
	  9
	$STEPSPERSEC
	 40
	2.0
	  9
	$STEPSIZE
	 40
	6.0
	  9
	$3DDWFPREC
	 40
	2.0
	  9
	$PSOLWIDTH
	 40
	0.25
	  9
	$PSOLHEIGHT
	 40
	4.0
	  9
	$LOFTANG1
	 40
	1.57079632679
	  9
	$LOFTANG2
	 40
	1.57079632679
	  9
	$LOFTMAG1
	 40
	0.0
	  9
	$LOFTMAG2
	 40
	0.0
	  9
	$LOFTPARAM
	 70
	7
	  9
	$LOFTNORMALS
	280
	1
	  9
	$LATITUDE
	 40
	37.795
	  9
	$LONGITUDE
	 40
	-122.394
	  9
	$NORTHDIRECTION
	 40
	0.0
	  9
	$TIMEZONE
	 70
	-8000
	  9
	$LIGHTGLYPHDISPLAY
	280
	1
	  9
	$TILEMODELIGHTSYNCH
	280
	1
	  9
	$CMATERIAL
	347
	96
	  9
	$SOLIDHIST
	280
	1
	  9
	$SHOWHIST
	280
	1
	  9
	$DWFFRAME
	280
	2
	  9
	$DGNFRAME
	280
	0
	  9
	$REALWORLDSCALE
	290
	1
	  9
	$INTERFERECOLOR
	 62
	1
	  9
	$INTERFEREOBJVS
	345
	A3
	  9
	$INTERFEREVPVS
	346
	A0
	  9
	$CSHADOW
	280
	0
	  9
	$SHADOWPLANELOCATION
	 40
	0.0
	  0
	ENDSEC`
	  return content
	}
	
	const dxfClasses = function () {
	  const content = `  0
	SECTION
	  2
	CLASSES
	  0
	CLASS
	  1
	ACDBDICTIONARYWDFLT
	  2
	AcDbDictionaryWithDefault
	  3
	ObjectDBX Classes
	 90
	0
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	DICTIONARYVAR
	  2
	AcDbDictionaryVar
	  3
	ObjectDBX Classes
	 90
	0
	 91
	15
	280
	0
	281
	0
	  0
	CLASS
	  1
	TABLESTYLE
	  2
	AcDbTableStyle
	  3
	ObjectDBX Classes
	 90
	4095
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	MATERIAL
	  2
	AcDbMaterial
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	3
	280
	0
	281
	0
	  0
	CLASS
	  1
	VISUALSTYLE
	  2
	AcDbVisualStyle
	  3
	ObjectDBX Classes
	 90
	4095
	 91
	26
	280
	0
	281
	0
	  0
	CLASS
	  1
	SCALE
	  2
	AcDbScale
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	17
	280
	0
	281
	0
	  0
	CLASS
	  1
	MLEADERSTYLE
	  2
	AcDbMLeaderStyle
	  3
	ACDB_MLEADERSTYLE_CLASS
	 90
	4095
	 91
	3
	280
	0
	281
	0
	  0
	CLASS
	  1
	CELLSTYLEMAP
	  2
	AcDbCellStyleMap
	  3
	ObjectDBX Classes
	 90
	1152
	 91
	2
	280
	0
	281
	0
	  0
	CLASS
	  1
	EXACXREFPANELOBJECT
	  2
	ExAcXREFPanelObject
	  3
	EXAC_ESW
	 90
	1025
	 91
	0
	280
	0
	281
	0
	  0
	CLASS
	  1
	NPOCOLLECTION
	  2
	AcDbImpNonPersistentObjectsCollection
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	0
	280
	0
	281
	0
	  0
	CLASS
	  1
	LAYER_INDEX
	  2
	AcDbLayerIndex
	  3
	ObjectDBX Classes
	 90
	0
	 91
	0
	280
	0
	281
	0
	  0
	CLASS
	  1
	SPATIAL_INDEX
	  2
	AcDbSpatialIndex
	  3
	ObjectDBX Classes
	 90
	0
	 91
	0
	280
	0
	281
	0
	  0
	CLASS
	  1
	IDBUFFER
	  2
	AcDbIdBuffer
	  3
	ObjectDBX Classes
	 90
	0
	 91
	0
	280
	0
	281
	0
	  0
	CLASS
	  1
	DIMASSOC
	  2
	AcDbDimAssoc
	  3
	"AcDbDimAssoc|Product Desc:     AcDim ARX App For Dimension|Company:          Autodesk, Inc.|WEB Address:      www.autodesk.com"
	 90
	0
	 91
	0
	280
	0
	281
	0
	  0
	CLASS
	  1
	ACDBSECTIONVIEWSTYLE
	  2
	AcDbSectionViewStyle
	  3
	ObjectDBX Classes
	 90
	1025
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	ACDBDETAILVIEWSTYLE
	  2
	AcDbDetailViewStyle
	  3
	ObjectDBX Classes
	 90
	1025
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	IMAGEDEF
	  2
	AcDbRasterImageDef
	  3
	ISM
	 90
	0
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	RASTERVARIABLES
	  2
	AcDbRasterVariables
	  3
	ISM
	 90
	0
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	IMAGEDEF_REACTOR
	  2
	AcDbRasterImageDefReactor
	  3
	ISM
	 90
	1
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	IMAGE
	  2
	AcDbRasterImage
	  3
	ISM
	 90
	2175
	 91
	1
	280
	0
	281
	1
	  0
	CLASS
	  1
	PDFDEFINITION
	  2
	AcDbPdfDefinition
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	1
	280
	0
	281
	0
	  0
	CLASS
	  1
	PDFUNDERLAY
	  2
	AcDbPdfReference
	  3
	ObjectDBX Classes
	 90
	4095
	 91
	1
	280
	0
	281
	1
	  0
	CLASS
	  1
	DWFDEFINITION
	  2
	AcDbDwfDefinition
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	2
	280
	0
	281
	0
	  0
	CLASS
	  1
	DWFUNDERLAY
	  2
	AcDbDwfReference
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	1
	280
	0
	281
	1
	  0
	CLASS
	  1
	DGNDEFINITION
	  2
	AcDbDgnDefinition
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	2
	280
	0
	281
	0
	  0
	CLASS
	  1
	DGNUNDERLAY
	  2
	AcDbDgnReference
	  3
	ObjectDBX Classes
	 90
	1153
	 91
	1
	280
	0
	281
	1
	  0
	ENDSEC`
	  return content
	}
	
	const dxfTables = function () {
	  const content = `  0
	SECTION
	  2
	TABLES
	  0
	TABLE
	  2
	VPORT
	  5
	8
	330
	0
	100
	AcDbSymbolTable
	 70
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	LTYPE
	  5
	5F
	330
	0
	100
	AcDbSymbolTable
	 70
	7
	  0
	LTYPE
	  5
	14
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	ByBlock
	 70
	0
	  3
	
	 72
	65
	 73
	0
	 40
	0.0
	  0
	LTYPE
	  5
	15
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	ByLayer
	 70
	0
	  3
	
	 72
	65
	 73
	0
	 40
	0.0
	  0
	LTYPE
	  5
	16
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	Continuous
	 70
	0
	  3
	Solid line
	 72
	65
	 73
	0
	 40
	0.0
	  0
	LTYPE
	  5
	1B1
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	CENTER
	 70
	0
	  3
	Center ____ _ ____ _ ____ _ ____ _ ____ _ ____
	 72
	65
	 73
	4
	 40
	2.0
	 49
	1.25
	 74
	0
	 49
	-0.25
	 74
	0
	 49
	0.25
	 74
	0
	 49
	-0.25
	 74
	0
	  0
	LTYPE
	  5
	1B2
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	DASHED
	 70
	0
	  3
	Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _
	 72
	65
	 73
	2
	 40
	0.75
	 49
	0.5
	 74
	0
	 49
	-0.25
	 74
	0
	  0
	LTYPE
	  5
	1B3
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	PHANTOM
	 70
	0
	  3
	Phantom ______  __  __  ______  __  __  ______
	 72
	65
	 73
	6
	 40
	2.5
	 49
	1.25
	 74
	0
	 49
	-0.25
	 74
	0
	 49
	0.25
	 74
	0
	 49
	-0.25
	 74
	0
	 49
	0.25
	 74
	0
	 49
	-0.25
	 74
	0
	  0
	LTYPE
	  5
	39E
	330
	5F
	100
	AcDbSymbolTableRecord
	100
	AcDbLinetypeTableRecord
	  2
	HIDDEN
	 70
	0
	  3
	Hidden __ __ __ __ __ __ __ __ __ __ __ __ __ __
	 72
	65
	 73
	2
	 40
	9.525
	 49
	6.35
	 74
	0
	 49
	-3.175
	 74
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	LAYER
	  5
	2
	330
	0
	100
	AcDbSymbolTable
	 70
	3
	  0
	LAYER
	  5
	10
	330
	2
	100
	AcDbSymbolTableRecord
	100
	AcDbLayerTableRecord
	  2
	0
	 70
	0
	  6
	Continuous
	370
	-3
	390
	F
	347
	98
	348
	0
	  0
	LAYER
	  5
	1B4
	330
	2
	100
	AcDbSymbolTableRecord
	100
	AcDbLayerTableRecord
	  2
	View Port
	 70
	0
	  6
	Continuous
	290
	0
	370
	-3
	390
	F
	347
	98
	348
	0
	  0
	LAYER
	  5
	21D
	330
	2
	100
	AcDbSymbolTableRecord
	100
	AcDbLayerTableRecord
	  2
	Defpoints
	 70
	0
	  6
	Continuous
	290
	0
	370
	-3
	390
	F
	347
	98
	348
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	STYLE
	  5
	3
	330
	0
	100
	AcDbSymbolTable
	 70
	3
	  0
	STYLE
	  5
	11
	330
	3
	100
	AcDbSymbolTableRecord
	100
	AcDbTextStyleTableRecord
	  2
	Standard
	 70
	0
	 40
	0.0
	 41
	1.0
	 50
	0.0
	 71
	0
	 42
	0.2
	  3
	arial.ttf
	  4
	
	  0
	STYLE
	  5
	DC
	330
	3
	100
	AcDbSymbolTableRecord
	100
	AcDbTextStyleTableRecord
	  2
	Annotative
	 70
	0
	 40
	0.0
	 41
	1.0
	 50
	0.0
	 71
	0
	 42
	0.2
	  3
	arial.ttf
	  4
	
	  0
	STYLE
	  5
	178
	330
	3
	100
	AcDbSymbolTableRecord
	100
	AcDbTextStyleTableRecord
	  2
	Notes
	 70
	0
	 40
	3.0
	 41
	1.0
	 50
	0.0
	 71
	0
	 42
	0.2
	  3
	arial.ttf
	  4
	
	  0
	ENDTAB
	  0
	TABLE
	  2
	VIEW
	  5
	6
	330
	0
	100
	AcDbSymbolTable
	 70
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	UCS
	  5
	7
	330
	0
	100
	AcDbSymbolTable
	 70
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	APPID
	  5
	9
	330
	0
	100
	AcDbSymbolTable
	 70
	12
	  0
	APPID
	  5
	12
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD
	 70
	0
	  0
	APPID
	  5
	DD
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	AcadAnnoPO
	 70
	0
	  0
	APPID
	  5
	DE
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	AcadAnnotative
	 70
	0
	  0
	APPID
	  5
	DF
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_DSTYLE_DIMJAG
	 70
	0
	  0
	APPID
	  5
	E0
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_DSTYLE_DIMTALN
	 70
	0
	  0
	APPID
	  5
	107
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_MLEADERVER
	 70
	0
	  0
	APPID
	  5
	1B5
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	AcAecLayerStandard
	 70
	0
	  0
	APPID
	  5
	1BA
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_EXEMPT_FROM_CAD_STANDARDS
	 70
	0
	  0
	APPID
	  5
	237
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_DSTYLE_DIMBREAK
	 70
	0
	  0
	APPID
	  5
	28E
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_PSEXT
	 70
	0
	  0
	APPID
	  5
	4B0
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	ACAD_NAV_VCDISPLAY
	 70
	0
	  0
	APPID
	  5
	4E3
	330
	9
	100
	AcDbSymbolTableRecord
	100
	AcDbRegAppTableRecord
	  2
	HATCHBACKGROUNDCOLOR
	 70
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	DIMSTYLE
	  5
	A
	330
	0
	100
	AcDbSymbolTable
	 70
	3
	100
	AcDbDimStyleTable
	 71
	3
	340
	242
	340
	27
	340
	E1
	  0
	DIMSTYLE
	105
	27
	330
	A
	100
	AcDbSymbolTableRecord
	100
	AcDbDimStyleTableRecord
	  2
	Standard
	 70
	0
	 41
	3.0
	 42
	2.0
	 43
	9.0
	 44
	5.0
	140
	3.0
	141
	2.0
	147
	2.0
	340
	11
	1001
	ACAD_DSTYLE_DIMJAG
	1070
	388
	1040
	38.0
	1001
	ACAD_DSTYLE_DIMBREAK
	1070
	391
	1040
	90.0
	1001
	ACAD_DSTYLE_DIMTALN
	1070
	392
	1070
	0
	  0
	DIMSTYLE
	105
	E1
	330
	A
	100
	AcDbSymbolTableRecord
	100
	AcDbDimStyleTableRecord
	  2
	Annotative
	 70
	0
	 40
	0.0
	 41
	3.0
	 42
	2.5
	 43
	10.0
	 44
	5.0
	140
	3.0
	141
	2.0
	147
	2.0
	340
	11
	1001
	AcadAnnotative
	1000
	AnnotativeData
	1002
	{
	1070
	1
	1070
	1
	1002
	}
	1001
	ACAD_DSTYLE_DIMJAG
	1070
	388
	1040
	38.0
	1001
	ACAD_DSTYLE_DIMBREAK
	1070
	391
	1040
	90.0
	1001
	ACAD_DSTYLE_DIMTALN
	1070
	392
	1070
	0
	  0
	DIMSTYLE
	105
	242
	330
	A
	100
	AcDbSymbolTableRecord
	100
	AcDbDimStyleTableRecord
	  2
	Civil-Metric
	 70
	0
	 41
	3.0
	 42
	1.5
	 43
	6.0
	 44
	3.0
	 73
	0
	 74
	0
	 77
	1
	 78
	3
	 79
	2
	140
	3.0
	141
	3.0
	147
	2.0
	179
	2
	271
	2
	272
	2
	276
	1
	340
	11
	1001
	ACAD_DSTYLE_DIMBREAK
	1070
	391
	1040
	3.0
	1001
	ACAD_DSTYLE_DIMJAG
	1070
	388
	1040
	38.0
	1001
	ACAD_DSTYLE_DIMTALN
	1070
	392
	1070
	0
	  0
	ENDTAB
	  0
	TABLE
	  2
	BLOCK_RECORD
	  5
	1
	330
	0
	100
	AcDbSymbolTable
	 70
	4
	  0
	BLOCK_RECORD
	  5
	1F
	330
	1
	100
	AcDbSymbolTableRecord
	100
	AcDbBlockTableRecord
	  2
	*Model_Space
	340
	530
	 70
	0
	280
	1
	281
	0
	  0
	BLOCK_RECORD
	  5
	58
	330
	1
	100
	AcDbSymbolTableRecord
	100
	AcDbBlockTableRecord
	  2
	*Paper_Space
	340
	531
	 70
	0
	280
	1
	281
	0
	  0
	BLOCK_RECORD
	  5
	238
	330
	1
	100
	AcDbSymbolTableRecord
	100
	AcDbBlockTableRecord
	  2
	_ArchTick
	340
	0
	 70
	0
	280
	1
	281
	0
	  0
	BLOCK_RECORD
	  5
	23C
	330
	1
	100
	AcDbSymbolTableRecord
	100
	AcDbBlockTableRecord
	  2
	_Open30
	340
	0
	 70
	0
	280
	1
	281
	0
	  0
	ENDTAB
	  0
	ENDSEC`
	  return content
	}
	
	const dxfBlocks = function () {
	  const content = `  0
	SECTION
	  2
	BLOCKS
	  0
	BLOCK
	  5
	23A
	330
	238
	100
	AcDbEntity
	  8
	0
	100
	AcDbBlockBegin
	  2
	_ArchTick
	 70
	0
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  3
	_ArchTick
	  1
	
	  0
	ENDBLK
	  5
	23B
	330
	238
	100
	AcDbEntity
	  8
	0
	100
	AcDbBlockEnd
	  0
	BLOCK
	  5
	20
	330
	1F
	100
	AcDbEntity
	  8
	0
	100
	AcDbBlockBegin
	  2
	*Model_Space
	 70
	0
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  3
	*Model_Space
	  1
	
	  0
	ENDBLK
	  5
	21
	330
	1F
	100
	AcDbEntity
	  8
	0
	100
	AcDbBlockEnd
	  0
	BLOCK
	  5
	5A
	330
	58
	100
	AcDbEntity
	 67
	1
	  8
	0
	100
	AcDbBlockBegin
	  2
	*Paper_Space
	 70
	0
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  3
	*Paper_Space
	  1
	
	  0
	ENDBLK
	  5
	5B
	330
	58
	100
	AcDbEntity
	 67
	1
	  8
	0
	100
	AcDbBlockEnd
	  0
	BLOCK
	  5
	240
	330
	23C
	100
	AcDbEntity
	  8
	0
	100
	AcDbBlockBegin
	  2
	_Open30
	 70
	0
	 10
	0.0
	 20
	0.0
	 30
	0.0
	  3
	_Open30
	  1
	
	  0
	ENDBLK
	  5
	241
	330
	23C
	100
	AcDbEntity
	  8
	0
	100
	AcDbBlockEnd
	  0
	ENDSEC`
	  return content
	}
	
	const dxfObjects = function () {
	  const content = `  0
	SECTION
	  2
	OBJECTS
	  0
	DICTIONARY
	  5
	C
	330
	0
	100
	AcDbDictionary
	281
	1
	  3
	ACAD_COLOR
	350
	524
	  3
	ACAD_GROUP
	350
	525
	  3
	ACAD_LAYOUT
	350
	526
	  3
	ACAD_MATERIAL
	350
	527
	  3
	ACAD_MLEADERSTYLE
	350
	528
	  3
	ACAD_MLINESTYLE
	350
	529
	  3
	ACAD_PLOTSETTINGS
	350
	52A
	  3
	ACAD_PLOTSTYLENAME
	350
	52C
	  3
	ACAD_SCALELIST
	350
	52D
	  3
	ACAD_TABLESTYLE
	350
	52E
	  3
	ACAD_VISUALSTYLE
	350
	52F
	  0
	DICTIONARY
	  5
	524
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	525
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	526
	330
	C
	100
	AcDbDictionary
	281
	1
	  3
	Model
	350
	530
	  3
	Layout1
	350
	531
	  0
	DICTIONARY
	  5
	527
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	528
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	529
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	52A
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	ACDBPLACEHOLDER
	  5
	52B
	330
	52C
	  0
	ACDBDICTIONARYWDFLT
	  5
	52C
	330
	C
	100
	AcDbDictionary
	281
	1
	  3
	Normal
	350
	52B
	100
	AcDbDictionaryWithDefault
	340
	52B
	  0
	DICTIONARY
	  5
	52D
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	52E
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	DICTIONARY
	  5
	52F
	330
	C
	100
	AcDbDictionary
	281
	1
	  0
	LAYOUT
	  5
	530
	330
	526
	100
	AcDbPlotSettings
	  1
	
	  2
	DWFx ePlot (XPS Compatible).pc3
	  4
	ANSI_A_(8.50_x_11.00_Inches)
	  6
	
	 40
	5.8
	 41
	17.8
	 42
	5.8
	 43
	17.8
	 44
	215.9
	 45
	279.4
	 46
	0.0
	 47
	0.0
	 48
	0.0
	 49
	0.0
	140
	0.0
	141
	0.0
	142
	1.0
	143
	14.53
	 70
	11952
	 72
	0
	 73
	1
	 74
	0
	  7
	
	 75
	0
	147
	0.069
	148
	114.98
	149
	300.29
	100
	AcDbLayout
	  1
	Model
	 70
	1
	 71
	0
	 10
	0.0
	 20
	0.0
	 11
	12.0
	 21
	9.0
	 12
	0.0
	 22
	0.0
	 32
	0.0
	 14
	0.0
	 24
	0.0
	 34
	0.0
	 15
	0.0
	 25
	0.0
	 35
	0.0
	146
	0.0
	 13
	0.0
	 23
	0.0
	 33
	0.0
	 16
	1.0
	 26
	0.0
	 36
	0.0
	 17
	0.0
	 27
	1.0
	 37
	0.0
	 76
	0
	330
	1F
	  0
	LAYOUT
	  5
	531
	330
	526
	100
	AcDbPlotSettings
	  1
	
	  2
	DWFx ePlot (XPS Compatible).pc3
	  4
	ANSI_A_(8.50_x_11.00_Inches)
	  6
	
	 40
	5.8
	 41
	17.8
	 42
	5.8
	 43
	17.8
	 44
	215.9
	 45
	279.4
	 46
	0.0
	 47
	0.0
	 48
	0.0
	 49
	0.0
	140
	0.0
	141
	0.0
	142
	1.0
	143
	1.0
	 70
	688
	 72
	0
	 73
	1
	 74
	5
	  7
	acad.ctb
	 75
	16
	147
	1.0
	148
	0.0
	149
	0.0
	100
	AcDbLayout
	  1
	Layout1
	 70
	1
	 71
	1
	 10
	-0.7
	 20
	-0.23
	 11
	10.3
	 21
	8.27
	 12
	0.0
	 22
	0.0
	 32
	0.0
	 14
	0.63
	 24
	0.8
	 34
	0.0
	 15
	9.0
	 25
	7.2
	 35
	0.0
	146
	0.0
	 13
	0.0
	 23
	0.0
	 33
	0.0
	 16
	1.0
	 26
	0.0
	 36
	0.0
	 17
	0.0
	 27
	1.0
	 37
	0.0
	 76
	0
	330
	58
	  0
	ENDSEC`
	  return content
	}
	
	const dxfEntities = (objects, options) => {
	  const entityContents = objects.map((object, i) => {
	    return PolygonsTo3DFaces(object, options)
	  });
	
	  let section = `  0
	SECTION
	  2
	ENTITIES
	`
	  entityContents.forEach((content) => {
	    if (content) {
	      section += content
	    }
	  })
	  section += `  0
	ENDSEC`
	  return section
	}
	
	
	const serialize = (options, ...objects) => {
	  const defaults = {
	    geom3To: '3dface', // or polyline
	    pathTo: 'lwpolyline',
	    statusCallback: null,
	    colorIndex: 0
	  }
	  options = Object.assign({}, defaults, options)
	
	  options.entityId = 0 // sequence id for entities created
	
	  if (objects.length === 0) throw new Error('only JSCAD geometries can be serialized to DXF')
	
	  const dxfContent = `999
	Created by JSCAD
	${dxfHeaders(options)}
	${dxfClasses(options)}
	${dxfTables(options)}
	${dxfBlocks(options)}
	${dxfEntities(objects, options)}
	${dxfObjects(options)}
	  0
	EOF
	`
	  return [dxfContent]
	}
	
	let polygonToTriangles = (polygon) => {
	  const length = polygon.vertices.length - 2
	  if (length < 1) return []
	
	  const pivot = polygon.vertices[0]
	  const triangles = []
	  for (let i = 0; i < length; i++) {
	    triangles.push([pivot, polygon.vertices[i + 1], polygon.vertices[i + 2]])
	  }
	  return triangles
	}
	
	let triangleTo3DFaces = (triangle, options, color) => {
	  const corner10 = triangle[0].pos;
	  const corner11 = triangle[1].pos;
	  const corner12 = triangle[2].pos;
	  const corner13 = triangle[2].pos;
	  const str = `  0
	3DFACE
	  5
	MyPart
	  100
	AcDbEntity
	  8
	0
	  62
	${color}
	  100
	AcDbFace
	  70
	0
	  10
	${corner10.x}
	  20
	${corner10.y}
	  30
	${corner10.z}
	  11
	${corner11.x}
	  21
	${corner11.y}
	  31
	${corner11.z}
	  12
	${corner12.x}
	  22
	${corner12.y}
	  32
	${corner12.z}
	  13
	${corner13.x}
	  23
	${corner13.y}
	  33
	${corner13.z}
	`
	  return str
	}
	
	let PolygonsTo3DFaces = (csg, options) => {
	  let str = ''
	  const polygons = csg.polygons
	  // const objectColor = getColorNumber(object, options)
	  polygons.forEach((polygon, i) => {
	    const polyColor = 0;//polygon.color ? getColorNumber(polygon, options) : objectColor
	    const triangles = polygonToTriangles(polygon)
	    triangles.forEach((triangle, i) => {
	      str += triangleTo3DFaces(triangle, options, polyColor)
	    })
	  })
	  return [str]
	}
	exports.dxfHeaders = dxfHeaders
	exports.dxfClasses = dxfClasses
	exports.dxfTables = dxfTables
	exports.dxfBlocks = dxfBlocks
	exports.dxfObjects = dxfObjects
	exports.dxfEntities = dxfEntities
	exports.serialize = serialize
	
	
	
	
	
});


RequireJS.addFunction('./public/js/utils/3d-modeling/lightgl.js',
function (require, exports, module) {
	/*
	 * lightgl.js
	 * http://github.com/evanw/lightgl.js/
	 *
	 * Copyright 2011 Evan Wallace
	 * Released under the MIT license
	 */
	module.exports = (function() {
	
	// src/shader.js
	// Provides a convenient wrapper for WebGL shaders. A few uniforms and attributes,
	// prefixed with `gl_`, are automatically added to all shader sources to make
	// simple shaders easier to write.
	//
	// Example usage:
	//
	//     var shader = new GL.Shader('\
	//       void main() {\
	//         gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
	//       }\
	//     ', '\
	//       uniform vec4 color;\
	//       void main() {\
	//         gl_FragColor = color;\
	//       }\
	//     ');
	//
	//     shader.uniforms({
	//       color: [1, 0, 0, 1]
	//     }).draw(mesh);
	
	function regexMap(regex, text, callback) {
	  let result;
	  while ((result = regex.exec(text)) != null) {
	    callback(result);
	  }
	}
	
	// Non-standard names beginning with `gl_` must be mangled because they will
	// otherwise cause a compiler error.
	var LIGHTGL_PREFIX = 'LIGHTGL';
	
	// ### new GL.Shader(vertexSource, fragmentSource)
	//
	// Compiles a shader program using the provided vertex and fragment shaders.
	function Shader(vertexSource, fragmentSource) {
	  // Allow passing in the id of an HTML script tag with the source
	  function followScriptTagById(id) {
	    var element = document.getElementById(id);
	    return element ? element.text : id;
	  }
	  vertexSource = followScriptTagById(vertexSource);
	  fragmentSource = followScriptTagById(fragmentSource);
	
	  // Headers are prepended to the sources to provide some automatic functionality.
	  var header = '\
	    uniform mat3 gl_NormalMatrix;\
	    uniform mat4 gl_ModelViewMatrix;\
	    uniform mat4 gl_ProjectionMatrix;\
	    uniform mat4 gl_ModelViewProjectionMatrix;\
	    uniform mat4 gl_ModelViewMatrixInverse;\
	    uniform mat4 gl_ProjectionMatrixInverse;\
	    uniform mat4 gl_ModelViewProjectionMatrixInverse;\
	  ';
	  var vertexHeader = header + '\
	    attribute vec4 gl_Vertex;\
	    attribute vec4 gl_TexCoord;\
	    attribute vec3 gl_Normal;\
	    attribute vec4 gl_Color;\
	    vec4 ftransform() {\
	      return gl_ModelViewProjectionMatrix * gl_Vertex;\
	    }\
	  ';
	  var fragmentHeader = '\
	    precision highp float;\
	  ' + header;
	
	  // Check for the use of built-in matrices that require expensive matrix
	  // multiplications to compute, and record these in `usedMatrices`.
	  var source = vertexSource + fragmentSource;
	  var usedMatrices = {};
	  regexMap(/\b(gl_[^;]*)\b;/g, header, function(groups) {
	    var name = groups[1];
	    if (source.indexOf(name) != -1) {
	      var capitalLetters = name.replace(/[a-z_]/g, '');
	      usedMatrices[capitalLetters] = LIGHTGL_PREFIX + name;
	    }
	  });
	  if (source.indexOf('ftransform') != -1) usedMatrices.MVPM = LIGHTGL_PREFIX + 'gl_ModelViewProjectionMatrix';
	  this.usedMatrices = usedMatrices;
	
	  // The `gl_` prefix must be substituted for something else to avoid compile
	  // errors, since it's a reserved prefix. This prefixes all reserved names with
	  // `_`. The header is inserted after any extensions, since those must come
	  // first.
	  function fix(header, source) {
	    var replaced = {};
	    var match = /^((\s*\/\/.*\n|\s*#extension.*\n)+)[^]*$/.exec(source);
	    source = match ? match[1] + header + source.substr(match[1].length) : header + source;
	    regexMap(/\bgl_\w+\b/g, header, function(result) {
	      if (!(result in replaced)) {
	        source = source.replace(new RegExp('\\b' + result + '\\b', 'g'), LIGHTGL_PREFIX + result);
	        replaced[result] = true;
	      }
	    });
	    return source;
	  }
	  vertexSource = fix(vertexHeader, vertexSource);
	  fragmentSource = fix(fragmentHeader, fragmentSource);
	
	  // Compile and link errors are thrown as strings.
	  function compileSource(type, source) {
	    var shader = gl.createShader(type);
	    gl.shaderSource(shader, source);
	    gl.compileShader(shader);
	    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	      throw new Error('compile error: ' + gl.getShaderInfoLog(shader));
	    }
	    return shader;
	  }
	  this.program = gl.createProgram();
	  gl.attachShader(this.program, compileSource(gl.VERTEX_SHADER, vertexSource));
	  gl.attachShader(this.program, compileSource(gl.FRAGMENT_SHADER, fragmentSource));
	  gl.linkProgram(this.program);
	  if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
	    throw new Error('link error: ' + gl.getProgramInfoLog(this.program));
	  }
	  this.attributes = {};
	  this.uniformLocations = {};
	
	  // Sampler uniforms need to be uploaded using `gl.uniform1i()` instead of `gl.uniform1f()`.
	  // To do this automatically, we detect and remember all uniform samplers in the source code.
	  var isSampler = {};
	  regexMap(/uniform\s+sampler(1D|2D|3D|Cube)\s+(\w+)\s*;/g, vertexSource + fragmentSource, function(groups) {
	    isSampler[groups[2]] = 1;
	  });
	  this.isSampler = isSampler;
	}
	
	function isArray(obj) {
	  var str = Object.prototype.toString.call(obj);
	  return str == '[object Array]' || str == '[object Float32Array]';
	}
	
	function isNumber(obj) {
	  var str = Object.prototype.toString.call(obj);
	  return str == '[object Number]' || str == '[object Boolean]';
	}
	
	var tempMatrix = new Matrix();
	var resultMatrix = new Matrix();
	
	Shader.prototype = {
	  // ### .uniforms(uniforms)
	  //
	  // Set a uniform for each property of `uniforms`. The correct `gl.uniform*()` method is
	  // inferred from the value types and from the stored uniform sampler flags.
	  uniforms: function(uniforms) {
	    gl.useProgram(this.program);
	
	    for (var name in uniforms) {
	      var location = this.uniformLocations[name] || gl.getUniformLocation(this.program, name);
	      if (!location) continue;
	      this.uniformLocations[name] = location;
	      var value = uniforms[name];
	      if (value instanceof Vector) {
	        value = [value.x, value.y, value.z];
	      } else if (value instanceof Matrix) {
	        value = value.m;
	      }
	      if (isArray(value)) {
	        switch (value.length) {
	          case 1: gl.uniform1fv(location, new Float32Array(value)); break;
	          case 2: gl.uniform2fv(location, new Float32Array(value)); break;
	          case 3: gl.uniform3fv(location, new Float32Array(value)); break;
	          case 4: gl.uniform4fv(location, new Float32Array(value)); break;
	          // Matrices are automatically transposed, since WebGL uses column-major
	          // indices instead of row-major indices.
	          case 9: gl.uniformMatrix3fv(location, false, new Float32Array([
	            value[0], value[3], value[6],
	            value[1], value[4], value[7],
	            value[2], value[5], value[8]
	          ])); break;
	          case 16: gl.uniformMatrix4fv(location, false, new Float32Array([
	            value[0], value[4], value[8], value[12],
	            value[1], value[5], value[9], value[13],
	            value[2], value[6], value[10], value[14],
	            value[3], value[7], value[11], value[15]
	          ])); break;
	          default: throw new Error('don\'t know how to load uniform "' + name + '" of length ' + value.length);
	        }
	      } else if (isNumber(value)) {
	        (this.isSampler[name] ? gl.uniform1i : gl.uniform1f).call(gl, location, value);
	      } else {
	        throw new Error('attempted to set uniform "' + name + '" to invalid value ' + value);
	      }
	    }
	
	    return this;
	  },
	
	  // ### .draw(mesh[, mode])
	  //
	  // Sets all uniform matrix attributes, binds all relevant buffers, and draws the
	  // mesh geometry as indexed triangles or indexed lines. Set `mode` to `gl.LINES`
	  // (and either add indices to `lines` or call `computeWireframe()`) to draw the
	  // mesh in wireframe.
	  draw: function(mesh, mode) {
	    this.drawBuffers(mesh.vertexBuffers,
	      mesh.indexBuffers[mode == gl.LINES ? 'lines' : 'triangles'],
	      arguments.length < 2 ? gl.TRIANGLES : mode);
	  },
	
	  // ### .drawBuffers(vertexBuffers, indexBuffer, mode)
	  //
	  // Sets all uniform matrix attributes, binds all relevant buffers, and draws the
	  // indexed mesh geometry. The `vertexBuffers` argument is a map from attribute
	  // names to `Buffer` objects of type `gl.ARRAY_BUFFER`, `indexBuffer` is a `Buffer`
	  // object of type `gl.ELEMENT_ARRAY_BUFFER`, and `mode` is a WebGL primitive mode
	  // like `gl.TRIANGLES` or `gl.LINES`. This method automatically creates and caches
	  // vertex attribute pointers for attributes as needed.
	  drawBuffers: function(vertexBuffers, indexBuffer, mode) {
	    // Only construct up the built-in matrices we need for this shader.
	    var used = this.usedMatrices;
	    var MVM = gl.modelviewMatrix;
	    var PM = gl.projectionMatrix;
	    var MVMI = (used.MVMI || used.NM) ? MVM.inverse() : null;
	    var PMI = (used.PMI) ? PM.inverse() : null;
	    var MVPM = (used.MVPM || used.MVPMI) ? PM.multiply(MVM) : null;
	    var matrices = {};
	    if (used.MVM) matrices[used.MVM] = MVM;
	    if (used.MVMI) matrices[used.MVMI] = MVMI;
	    if (used.PM) matrices[used.PM] = PM;
	    if (used.PMI) matrices[used.PMI] = PMI;
	    if (used.MVPM) matrices[used.MVPM] = MVPM;
	    if (used.MVPMI) matrices[used.MVPMI] = MVPM.inverse();
	    if (used.NM) {
	      var m = MVMI.m;
	      matrices[used.NM] = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
	    }
	    this.uniforms(matrices);
	
	    // Create and enable attribute pointers as necessary.
	    var length = 0;
	    for (var attribute in vertexBuffers) {
	      var buffer = vertexBuffers[attribute];
	      var location = this.attributes[attribute] ||
	        gl.getAttribLocation(this.program, attribute.replace(/^(gl_.*)$/, LIGHTGL_PREFIX + '$1'));
	      if (location == -1 || !buffer.buffer) continue;
	      this.attributes[attribute] = location;
	      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
	      gl.enableVertexAttribArray(location);
	      gl.vertexAttribPointer(location, buffer.buffer.spacing, gl.FLOAT, false, 0, 0);
	      length = buffer.buffer.length / buffer.buffer.spacing;
	    }
	
	    // Disable unused attribute pointers.
	    for (var attribute in this.attributes) {
	      if (!(attribute in vertexBuffers)) {
	        gl.disableVertexAttribArray(this.attributes[attribute]);
	      }
	    }
	
	    // Draw the geometry.
	    if (length && (!indexBuffer || indexBuffer.buffer)) {
	      if (indexBuffer) {
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
	        gl.drawElements(mode, indexBuffer.buffer.length, gl.UNSIGNED_SHORT, 0);
	      } else {
	        gl.drawArrays(mode, 0, length);
	      }
	    }
	
	    return this;
	  }
	};
	
	// src/vector.js
	// Provides a simple 3D vector class. Vector operations can be done using member
	// functions, which return new vectors, or static functions, which reuse
	// existing vectors to avoid generating garbage.
	function Vector(x, y, z) {
	  this.x = x || 0;
	  this.y = y || 0;
	  this.z = z || 0;
	}
	
	// ### Instance Methods
	// The methods `add()`, `subtract()`, `multiply()`, and `divide()` can all
	// take either a vector or a number as an argument.
	Vector.prototype = {
	  negative: function() {
	    return new Vector(-this.x, -this.y, -this.z);
	  },
	  add: function(v) {
	    if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
	    else return new Vector(this.x + v, this.y + v, this.z + v);
	  },
	  subtract: function(v) {
	    if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
	    else return new Vector(this.x - v, this.y - v, this.z - v);
	  },
	  multiply: function(v) {
	    if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
	    else return new Vector(this.x * v, this.y * v, this.z * v);
	  },
	  divide: function(v) {
	    if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
	    else return new Vector(this.x / v, this.y / v, this.z / v);
	  },
	  equals: function(v) {
	    return this.x == v.x && this.y == v.y && this.z == v.z;
	  },
	  dot: function(v) {
	    return this.x * v.x + this.y * v.y + this.z * v.z;
	  },
	  cross: function(v) {
	    return new Vector(
	      this.y * v.z - this.z * v.y,
	      this.z * v.x - this.x * v.z,
	      this.x * v.y - this.y * v.x
	    );
	  },
	  length: function() {
	    return Math.sqrt(this.dot(this));
	  },
	  unit: function() {
	    return this.divide(this.length());
	  },
	  min: function() {
	    return Math.min(Math.min(this.x, this.y), this.z);
	  },
	  max: function() {
	    return Math.max(Math.max(this.x, this.y), this.z);
	  },
	  toAngles: function() {
	    return {
	      theta: Math.atan2(this.z, this.x),
	      phi: Math.asin(this.y / this.length())
	    };
	  },
	  angleTo: function(a) {
	    return Math.acos(this.dot(a) / (this.length() * a.length()));
	  },
	  toArray: function(n) {
	    return [this.x, this.y, this.z].slice(0, n || 3);
	  },
	  clone: function() {
	    return new Vector(this.x, this.y, this.z);
	  },
	  init: function(x, y, z) {
	    this.x = x; this.y = y; this.z = z;
	    return this;
	  }
	};
	
	// ### Static Methods
	// `Vector.randomDirection()` returns a vector with a length of 1 and a
	// statistically uniform direction. `Vector.lerp()` performs linear
	// interpolation between two vectors.
	Vector.negative = function(a, b) {
	  b.x = -a.x; b.y = -a.y; b.z = -a.z;
	  return b;
	};
	Vector.add = function(a, b, c) {
	  if (b instanceof Vector) { c.x = a.x + b.x; c.y = a.y + b.y; c.z = a.z + b.z; }
	  else { c.x = a.x + b; c.y = a.y + b; c.z = a.z + b; }
	  return c;
	};
	Vector.subtract = function(a, b, c) {
	  if (b instanceof Vector) { c.x = a.x - b.x; c.y = a.y - b.y; c.z = a.z - b.z; }
	  else { c.x = a.x - b; c.y = a.y - b; c.z = a.z - b; }
	  return c;
	};
	Vector.multiply = function(a, b, c) {
	  if (b instanceof Vector) { c.x = a.x * b.x; c.y = a.y * b.y; c.z = a.z * b.z; }
	  else { c.x = a.x * b; c.y = a.y * b; c.z = a.z * b; }
	  return c;
	};
	Vector.divide = function(a, b, c) {
	  if (b instanceof Vector) { c.x = a.x / b.x; c.y = a.y / b.y; c.z = a.z / b.z; }
	  else { c.x = a.x / b; c.y = a.y / b; c.z = a.z / b; }
	  return c;
	};
	Vector.cross = function(a, b, c) {
	  c.x = a.y * b.z - a.z * b.y;
	  c.y = a.z * b.x - a.x * b.z;
	  c.z = a.x * b.y - a.y * b.x;
	  return c;
	};
	Vector.unit = function(a, b) {
	  var length = a.length();
	  b.x = a.x / length;
	  b.y = a.y / length;
	  b.z = a.z / length;
	  return b;
	};
	Vector.fromAngles = function(theta, phi) {
	  return new Vector(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
	};
	Vector.randomDirection = function() {
	  return Vector.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
	};
	Vector.min = function(a, b) {
	  return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
	};
	Vector.max = function(a, b) {
	  return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
	};
	Vector.lerp = function(a, b, fraction) {
	  return b.subtract(a).multiply(fraction).add(a);
	};
	Vector.fromArray = function(a) {
	  return new Vector(a[0], a[1], a[2]);
	};
	Vector.angleBetween = function(a, b) {
	  return a.angleTo(b);
	};
	
	// src/mesh.js
	// Represents indexed triangle geometry with arbitrary additional attributes.
	// You need a shader to draw a mesh; meshes can't draw themselves.
	//
	// A mesh is a collection of `GL.Buffer` objects which are either vertex buffers
	// (holding per-vertex attributes) or index buffers (holding the order in which
	// vertices are rendered). By default, a mesh has a position vertex buffer called
	// `vertices` and a triangle index buffer called `triangles`. New buffers can be
	// added using `addVertexBuffer()` and `addIndexBuffer()`. Two strings are
	// required when adding a new vertex buffer, the name of the data array on the
	// mesh instance and the name of the GLSL attribute in the vertex shader.
	//
	// Example usage:
	//
	//     var mesh = new GL.Mesh({ coords: true, lines: true });
	//
	//     // Default attribute "vertices", available as "gl_Vertex" in
	//     // the vertex shader
	//     mesh.vertices = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]];
	//
	//     // Optional attribute "coords" enabled in constructor,
	//     // available as "gl_TexCoord" in the vertex shader
	//     mesh.coords = [[0, 0], [1, 0], [0, 1], [1, 1]];
	//
	//     // Custom attribute "weights", available as "weight" in the
	//     // vertex shader
	//     mesh.addVertexBuffer('weights', 'weight');
	//     mesh.weights = [1, 0, 0, 1];
	//
	//     // Default index buffer "triangles"
	//     mesh.triangles = [[0, 1, 2], [2, 1, 3]];
	//
	//     // Optional index buffer "lines" enabled in constructor
	//     mesh.lines = [[0, 1], [0, 2], [1, 3], [2, 3]];
	//
	//     // Upload provided data to GPU memory
	//     mesh.compile();
	
	// ### new GL.Indexer()
	//
	// Generates indices into a list of unique objects from a stream of objects
	// that may contain duplicates. This is useful for generating compact indexed
	// meshes from unindexed data.
	function Indexer() {
	  this.unique = [];
	  this.indices = [];
	  this.map = {};
	}
	
	Indexer.prototype = {
	  // ### .add(v)
	  //
	  // Adds the object `obj` to `unique` if it hasn't already been added. Returns
	  // the index of `obj` in `unique`.
	  add: function(obj) {
	    var key = JSON.stringify(obj);
	    if (!(key in this.map)) {
	      this.map[key] = this.unique.length;
	      this.unique.push(obj);
	    }
	    return this.map[key];
	  }
	};
	
	// ### new GL.Buffer(target, type)
	//
	// Provides a simple method of uploading data to a GPU buffer. Example usage:
	//
	//     var vertices = new GL.Buffer(gl.ARRAY_BUFFER, Float32Array);
	//     var indices = new GL.Buffer(gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
	//     vertices.data = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]];
	//     indices.data = [[0, 1, 2], [2, 1, 3]];
	//     vertices.compile();
	//     indices.compile();
	//
	function Buffer(target, type) {
	  this.buffer = null;
	  this.target = target;
	  this.type = type;
	  this.data = [];
	}
	
	Buffer.prototype = {
	  // ### .compile(type)
	  //
	  // Upload the contents of `data` to the GPU in preparation for rendering. The
	  // data must be a list of lists where each inner list has the same length. For
	  // example, each element of data for vertex normals would be a list of length three.
	  // This will remember the data length and element length for later use by shaders.
	  // The type can be either `gl.STATIC_DRAW` or `gl.DYNAMIC_DRAW`, and defaults to
	  // `gl.STATIC_DRAW`.
	  //
	  // This could have used `[].concat.apply([], this.data)` to flatten
	  // the array but Google Chrome has a maximum number of arguments so the
	  // concatenations are chunked to avoid that limit.
	  compile: function(type) {
	    var data = [];
	    for (var i = 0, chunk = 10000; i < this.data.length; i += chunk) {
	      data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));
	    }
	    var spacing = this.data.length ? data.length / this.data.length : 0;
	    if (spacing != Math.round(spacing)) throw new Error('buffer elements not of consistent size, average size is ' + spacing);
	    this.buffer = this.buffer || gl.createBuffer();
	    this.buffer.length = data.length;
	    this.buffer.spacing = spacing;
	    gl.bindBuffer(this.target, this.buffer);
	    gl.bufferData(this.target, new this.type(data), type || gl.STATIC_DRAW);
	  }
	};
	
	// ### new GL.Mesh([options])
	//
	// Represents a collection of vertex buffers and index buffers. Each vertex
	// buffer maps to one attribute in GLSL and has a corresponding property set
	// on the Mesh instance. There is one vertex buffer by default: `vertices`,
	// which maps to `gl_Vertex`. The `coords`, `normals`, and `colors` vertex
	// buffers map to `gl_TexCoord`, `gl_Normal`, and `gl_Color` respectively,
	// and can be enabled by setting the corresponding options to true. There are
	// two index buffers, `triangles` and `lines`, which are used for rendering
	// `gl.TRIANGLES` and `gl.LINES`, respectively. Only `triangles` is enabled by
	// default, although `computeWireframe()` will add a normal buffer if it wasn't
	// initially enabled.
	function Mesh(options) {
	  options = options || {};
	  this.vertexBuffers = {};
	  this.indexBuffers = {};
	  this.addVertexBuffer('vertices', 'gl_Vertex');
	  if (options.coords) this.addVertexBuffer('coords', 'gl_TexCoord');
	  if (options.normals) this.addVertexBuffer('normals', 'gl_Normal');
	  if (options.colors) this.addVertexBuffer('colors', 'gl_Color');
	  if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
	  if (options.lines) this.addIndexBuffer('lines');
	}
	
	Mesh.prototype = {
	  // ### .addVertexBuffer(name, attribute)
	  //
	  // Add a new vertex buffer with a list as a property called `name` on this object
	  // and map it to the attribute called `attribute` in all shaders that draw this mesh.
	  addVertexBuffer: function(name, attribute) {
	    var buffer = this.vertexBuffers[attribute] = new Buffer(gl.ARRAY_BUFFER, Float32Array);
	    buffer.name = name;
	    this[name] = [];
	  },
	
	  // ### .addIndexBuffer(name)
	  //
	  // Add a new index buffer with a list as a property called `name` on this object.
	  addIndexBuffer: function(name) {
	    var buffer = this.indexBuffers[name] = new Buffer(gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
	    this[name] = [];
	  },
	
	  // ### .compile()
	  //
	  // Upload all attached buffers to the GPU in preparation for rendering. This
	  // doesn't need to be called every frame, only needs to be done when the data
	  // changes.
	  compile: function() {
	    for (var attribute in this.vertexBuffers) {
	      var buffer = this.vertexBuffers[attribute];
	      buffer.data = this[buffer.name];
	      buffer.compile();
	    }
	
	    for (var name in this.indexBuffers) {
	      var buffer = this.indexBuffers[name];
	      buffer.data = this[name];
	      buffer.compile();
	    }
	  },
	
	  // ### .transform(matrix)
	  //
	  // Transform all vertices by `matrix` and all normals by the inverse transpose
	  // of `matrix`.
	  transform: function(matrix) {
	    this.vertices = this.vertices.map(function(v) {
	      return matrix.transformPoint(Vector.fromArray(v)).toArray();
	    });
	    if (this.normals) {
	      var invTrans = matrix.inverse().transpose();
	      this.normals = this.normals.map(function(n) {
	        return invTrans.transformVector(Vector.fromArray(n)).unit().toArray();
	      });
	    }
	    this.compile();
	    return this;
	  },
	
	  // ### .computeNormals()
	  //
	  // Computes a new normal for each vertex from the average normal of the
	  // neighboring triangles. This means adjacent triangles must share vertices
	  // for the resulting normals to be smooth.
	  computeNormals: function() {
	    if (!this.normals) this.addVertexBuffer('normals', 'gl_Normal');
	    for (var i = 0; i < this.vertices.length; i++) {
	      this.normals[i] = new Vector();
	    }
	    for (var i = 0; i < this.triangles.length; i++) {
	      var t = this.triangles[i];
	      var a = Vector.fromArray(this.vertices[t[0]]);
	      var b = Vector.fromArray(this.vertices[t[1]]);
	      var c = Vector.fromArray(this.vertices[t[2]]);
	      var normal = b.subtract(a).cross(c.subtract(a)).unit();
	      this.normals[t[0]] = this.normals[t[0]].add(normal);
	      this.normals[t[1]] = this.normals[t[1]].add(normal);
	      this.normals[t[2]] = this.normals[t[2]].add(normal);
	    }
	    for (var i = 0; i < this.vertices.length; i++) {
	      this.normals[i] = this.normals[i].unit().toArray();
	    }
	    this.compile();
	    return this;
	  },
	
	  // ### .computeWireframe()
	  //
	  // Populate the `lines` index buffer from the `triangles` index buffer.
	  computeWireframe: function() {
	    var indexer = new Indexer();
	    for (var i = 0; i < this.triangles.length; i++) {
	      var t = this.triangles[i];
	      for (var j = 0; j < t.length; j++) {
	        var a = t[j], b = t[(j + 1) % t.length];
	        indexer.add([Math.min(a, b), Math.max(a, b)]);
	      }
	    }
	    if (!this.lines) this.addIndexBuffer('lines');
	    this.lines = indexer.unique;
	    this.compile();
	    return this;
	  },
	
	  // ### .getAABB()
	  //
	  // Computes the axis-aligned bounding box, which is an object whose `min` and
	  // `max` properties contain the minimum and maximum coordinates of all vertices.
	  getAABB: function() {
	    var aabb = { min: new Vector(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE) };
	    aabb.max = aabb.min.negative();
	    for (var i = 0; i < this.vertices.length; i++) {
	      var v = Vector.fromArray(this.vertices[i]);
	      aabb.min = Vector.min(aabb.min, v);
	      aabb.max = Vector.max(aabb.max, v);
	    }
	    return aabb;
	  },
	
	  // ### .getBoundingSphere()
	  //
	  // Computes a sphere that contains all vertices (not necessarily the smallest
	  // sphere). The returned object has two properties, `center` and `radius`.
	  getBoundingSphere: function() {
	    var aabb = this.getAABB();
	    var sphere = { center: aabb.min.add(aabb.max).divide(2), radius: 0 };
	    for (var i = 0; i < this.vertices.length; i++) {
	      sphere.radius = Math.max(sphere.radius,
	        Vector.fromArray(this.vertices[i]).subtract(sphere.center).length());
	    }
	    return sphere;
	  }
	};
	
	// ### GL.Mesh.plane([options])
	//
	// Generates a square 2x2 mesh the xy plane centered at the origin. The
	// `options` argument specifies options to pass to the mesh constructor.
	// Additional options include `detailX` and `detailY`, which set the tesselation
	// in x and y, and `detail`, which sets both `detailX` and `detailY` at once.
	// Two triangles are generated by default.
	// Example usage:
	//
	//     var mesh1 = GL.Mesh.plane();
	//     var mesh2 = GL.Mesh.plane({ detail: 5 });
	//     var mesh3 = GL.Mesh.plane({ detailX: 20, detailY: 40 });
	//
	Mesh.plane = function(options) {
	  options = options || {};
	  var mesh = new Mesh(options);
	  detailX = options.detailX || options.detail || 1;
	  detailY = options.detailY || options.detail || 1;
	
	  for (var y = 0; y <= detailY; y++) {
	    var t = y / detailY;
	    for (var x = 0; x <= detailX; x++) {
	      var s = x / detailX;
	      mesh.vertices.push([2 * s - 1, 2 * t - 1, 0]);
	      if (mesh.coords) mesh.coords.push([s, t]);
	      if (mesh.normals) mesh.normals.push([0, 0, 1]);
	      if (x < detailX && y < detailY) {
	        var i = x + y * (detailX + 1);
	        mesh.triangles.push([i, i + 1, i + detailX + 1]);
	        mesh.triangles.push([i + detailX + 1, i + 1, i + detailX + 2]);
	      }
	    }
	  }
	
	  mesh.compile();
	  return mesh;
	};
	
	var cubeData = [
	  [0, 4, 2, 6, -1, 0, 0], // -x
	  [1, 3, 5, 7, +1, 0, 0], // +x
	  [0, 1, 4, 5, 0, -1, 0], // -y
	  [2, 6, 3, 7, 0, +1, 0], // +y
	  [0, 2, 1, 3, 0, 0, -1], // -z
	  [4, 5, 6, 7, 0, 0, +1]  // +z
	];
	
	function pickOctant(i) {
	  return new Vector((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);
	}
	
	// ### GL.Mesh.cube([options])
	//
	// Generates a 2x2x2 box centered at the origin. The `options` argument
	// specifies options to pass to the mesh constructor.
	Mesh.cube = function(options) {
	  var mesh = new Mesh(options);
	
	  for (var i = 0; i < cubeData.length; i++) {
	    var data = cubeData[i], v = i * 4;
	    for (var j = 0; j < 4; j++) {
	      var d = data[j];
	      mesh.vertices.push(pickOctant(d).toArray());
	      if (mesh.coords) mesh.coords.push([j & 1, (j & 2) / 2]);
	      if (mesh.normals) mesh.normals.push(data.slice(4, 7));
	    }
	    mesh.triangles.push([v, v + 1, v + 2]);
	    mesh.triangles.push([v + 2, v + 1, v + 3]);
	  }
	
	  mesh.compile();
	  return mesh;
	};
	
	// ### GL.Mesh.sphere([options])
	//
	// Generates a geodesic sphere of radius 1. The `options` argument specifies
	// options to pass to the mesh constructor in addition to the `detail` option,
	// which controls the tesselation level. The detail is `6` by default.
	// Example usage:
	//
	//     var mesh1 = GL.Mesh.sphere();
	//     var mesh2 = GL.Mesh.sphere({ detail: 2 });
	//
	Mesh.sphere = function(options) {
	  function tri(a, b, c) { return flip ? [a, c, b] : [a, b, c]; }
	  function fix(x) { return x + (x - x * x) / 2; }
	  options = options || {};
	  var mesh = new Mesh(options);
	  var indexer = new Indexer();
	  detail = options.detail || 6;
	
	  for (var octant = 0; octant < 8; octant++) {
	    var scale = pickOctant(octant);
	    var flip = scale.x * scale.y * scale.z > 0;
	    var data = [];
	    for (var i = 0; i <= detail; i++) {
	      // Generate a row of vertices on the surface of the sphere
	      // using barycentric coordinates.
	      for (var j = 0; i + j <= detail; j++) {
	        var a = i / detail;
	        var b = j / detail;
	        var c = (detail - i - j) / detail;
	        var vertex = { vertex: new Vector(fix(a), fix(b), fix(c)).unit().multiply(scale).toArray() };
	        if (mesh.coords) vertex.coord = scale.y > 0 ? [1 - a, c] : [c, 1 - a];
	        data.push(indexer.add(vertex));
	      }
	
	      // Generate triangles from this row and the previous row.
	      if (i > 0) {
	        for (var j = 0; i + j <= detail; j++) {
	          var a = (i - 1) * (detail + 1) + ((i - 1) - (i - 1) * (i - 1)) / 2 + j;
	          var b = i * (detail + 1) + (i - i * i) / 2 + j;
	          mesh.triangles.push(tri(data[a], data[a + 1], data[b]));
	          if (i + j < detail) {
	            mesh.triangles.push(tri(data[b], data[a + 1], data[b + 1]));
	          }
	        }
	      }
	    }
	  }
	
	  // Reconstruct the geometry from the indexer.
	  mesh.vertices = indexer.unique.map(function(v) { return v.vertex; });
	  if (mesh.coords) mesh.coords = indexer.unique.map(function(v) { return v.coord; });
	  if (mesh.normals) mesh.normals = mesh.vertices;
	  mesh.compile();
	  return mesh;
	};
	
	// ### GL.Mesh.load(json[, options])
	//
	// Creates a mesh from the JSON generated by the `convert/convert.py` script.
	// Example usage:
	//
	//     var data = {
	//       vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
	//       triangles: [[0, 1, 2]]
	//     };
	//     var mesh = GL.Mesh.load(data);
	//
	Mesh.load = function(json, options) {
	  options = options || {};
	  if (!('coords' in options)) options.coords = !!json.coords;
	  if (!('normals' in options)) options.normals = !!json.normals;
	  if (!('colors' in options)) options.colors = !!json.colors;
	  if (!('triangles' in options)) options.triangles = !!json.triangles;
	  if (!('lines' in options)) options.lines = !!json.lines;
	  var mesh = new Mesh(options);
	  mesh.vertices = json.vertices;
	  if (mesh.coords) mesh.coords = json.coords;
	  if (mesh.normals) mesh.normals = json.normals;
	  if (mesh.colors) mesh.colors = json.colors;
	  if (mesh.triangles) mesh.triangles = json.triangles;
	  if (mesh.lines) mesh.lines = json.lines;
	  mesh.compile();
	  return mesh;
	};
	
	// src/main.js
	// The internal `gl` variable holds the current WebGL context.
	var gl;
	
	var GL = {
	  // ### Initialization
	  //
	  // `GL.create()` creates a new WebGL context and augments it with more
	  // methods. The alpha channel is disabled by default because it usually causes
	  // unintended transparencies in the canvas.
	  create: function(options) {
	    options = options || {};
	    var canvas = document.createElement('canvas');
	    canvas.width = 800;
	    canvas.height = 600;
	    if (!('alpha' in options)) options.alpha = false;
	    try { gl = canvas.getContext('webgl', options); } catch (e) {}
	    try { gl = gl || canvas.getContext('experimental-webgl', options); } catch (e) {}
	    if (!gl) throw new Error('WebGL not supported');
	    gl.HALF_FLOAT_OES = 0x8D61;
	    addMatrixStack();
	    addImmediateMode();
	    addEventListeners();
	    addOtherMethods();
	    return gl;
	  },
	
	  // `GL.keys` contains a mapping of key codes to booleans indicating whether
	  // that key is currently pressed.
	  keys: {},
	
	  // Export all external classes.
	  Matrix: Matrix,
	  Indexer: Indexer,
	  Buffer: Buffer,
	  Mesh: Mesh,
	  HitTest: HitTest,
	  Raytracer: Raytracer,
	  Shader: Shader,
	  Texture: Texture,
	  Vector: Vector
	};
	
	// ### Matrix stack
	//
	// Implement the OpenGL modelview and projection matrix stacks, along with some
	// other useful GLU matrix functions.
	
	function addMatrixStack() {
	  gl.MODELVIEW = ENUM | 1;
	  gl.PROJECTION = ENUM | 2;
	  var tempMatrix = new Matrix();
	  var resultMatrix = new Matrix();
	  gl.modelviewMatrix = new Matrix();
	  gl.projectionMatrix = new Matrix();
	  var modelviewStack = [];
	  var projectionStack = [];
	  var matrix, stack;
	  gl.matrixMode = function(mode) {
	    switch (mode) {
	      case gl.MODELVIEW:
	        matrix = 'modelviewMatrix';
	        stack = modelviewStack;
	        break;
	      case gl.PROJECTION:
	        matrix = 'projectionMatrix';
	        stack = projectionStack;
	        break;
	      default:
	        throw new Error('invalid matrix mode ' + mode);
	    }
	  };
	  gl.loadIdentity = function() {
	    Matrix.identity(gl[matrix]);
	  };
	  gl.setIdentity = function (m) {
	    gl[matrix] = m;
	  }
	  gl.loadMatrix = function(m) {
	    var from = m.m, to = gl[matrix].m;
	    for (var i = 0; i < 16; i++) {
	      to[i] = from[i];
	    }
	  };
	  gl.multMatrix = function(m) {
	    gl.loadMatrix(Matrix.multiply(gl[matrix], m, resultMatrix));
	  };
	  gl.perspective = function(fov, aspect, near, far) {
	    gl.multMatrix(Matrix.perspective(fov, aspect, near, far, tempMatrix));
	  };
	  gl.frustum = function(l, r, b, t, n, f) {
	    gl.multMatrix(Matrix.frustum(l, r, b, t, n, f, tempMatrix));
	  };
	  gl.ortho = function(l, r, b, t, n, f) {
	    gl.multMatrix(Matrix.ortho(l, r, b, t, n, f, tempMatrix));
	  };
	  gl.scale = function(x, y, z) {
	    gl.multMatrix(Matrix.scale(x, y, z, tempMatrix));
	  };
	  gl.translate = function(x, y, z) {
	    gl.multMatrix(Matrix.translate(x, y, z, tempMatrix));
	  };
	  gl.rotateAroundPoint = function(point, rotations) {
	    gl.multMatrix(Matrix.rotateAroundPoint(point, rotations, tempMatrix));
	  };
	  gl.rotate = function(a, x, y, z) {
	    gl.multMatrix(Matrix.rotate(a, x, y, z, tempMatrix));
	  };
	  gl.lookAt = function(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
	    return gl.multMatrix(Matrix.lookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz, tempMatrix));
	  };
	  gl.pushMatrix = function() {
	    stack.push(Array.prototype.slice.call(gl[matrix].m));
	  };
	  gl.popMatrix = function() {
	    var m = stack.pop();
	    gl[matrix].m = hasFloat32Array ? new Float32Array(m) : m;
	  };
	  gl.project = function(objX, objY, objZ, modelview, projection, viewport) {
	    modelview = modelview || gl.modelviewMatrix;
	    projection = projection || gl.projectionMatrix;
	    viewport = viewport || gl.getParameter(gl.VIEWPORT);
	    var point = projection.transformPoint(modelview.transformPoint(new Vector(objX, objY, objZ)));
	    return new Vector(
	      viewport[0] + viewport[2] * (point.x * 0.5 + 0.5),
	      viewport[1] + viewport[3] * (point.y * 0.5 + 0.5),
	      point.z * 0.5 + 0.5
	    );
	  };
	  gl.unProject = function(winX, winY, winZ, modelview, projection, viewport) {
	    modelview = modelview || gl.modelviewMatrix;
	    projection = projection || gl.projectionMatrix;
	    viewport = viewport || gl.getParameter(gl.VIEWPORT);
	    var point = new Vector(
	      (winX - viewport[0]) / viewport[2] * 2 - 1,
	      (winY - viewport[1]) / viewport[3] * 2 - 1,
	      winZ * 2 - 1
	    );
	    return Matrix.inverse(Matrix.multiply(projection, modelview, tempMatrix), resultMatrix).transformPoint(point);
	  };
	  gl.matrixMode(gl.MODELVIEW);
	}
	
	// ### Immediate mode
	//
	// Provide an implementation of OpenGL's deprecated immediate mode. This is
	// depricated for a reason: constantly re-specifying the geometry is a bad
	// idea for performance. You should use a `GL.Mesh` instead, which specifies
	// the geometry once and caches it on the graphics card. Still, nothing
	// beats a quick `gl.begin(gl.POINTS); gl.vertex(1, 2, 3); gl.end();` for
	// debugging. This intentionally doesn't implement fixed-function lighting
	// because it's only meant for quick debugging tasks.
	
	function addImmediateMode() {
	  var immediateMode = {
	    mesh: new Mesh({ coords: true, colors: true, triangles: false }),
	    mode: -1,
	    coord: [0, 0, 0, 0],
	    color: [1, 1, 1, 1],
	    pointSize: 1,
	    shader: new Shader('\
	      uniform float pointSize;\
	      varying vec4 color;\
	      varying vec4 coord;\
	      void main() {\
	        color = gl_Color;\
	        coord = gl_TexCoord;\
	        gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
	        gl_PointSize = pointSize;\
	      }\
	    ', '\
	      uniform sampler2D texture;\
	      uniform float pointSize;\
	      uniform bool useTexture;\
	      varying vec4 color;\
	      varying vec4 coord;\
	      void main() {\
	        gl_FragColor = color;\
	        if (useTexture) gl_FragColor *= texture2D(texture, coord.xy);\
	      }\
	    ')
	  };
	  gl.pointSize = function(pointSize) {
	    immediateMode.shader.uniforms({ pointSize: pointSize });
	  };
	  gl.begin = function(mode) {
	    if (immediateMode.mode != -1) throw new Error('mismatched gl.begin() and gl.end() calls');
	    immediateMode.mode = mode;
	    immediateMode.mesh.colors = [];
	    immediateMode.mesh.coords = [];
	    immediateMode.mesh.vertices = [];
	  };
	  gl.color = function(r, g, b, a) {
	    immediateMode.color = (arguments.length == 1) ? r.toArray().concat(1) : [r, g, b, a || 1];
	  };
	  gl.texCoord = function(s, t) {
	    immediateMode.coord = (arguments.length == 1) ? s.toArray(2) : [s, t];
	  };
	  gl.vertex = function(x, y, z) {
	    immediateMode.mesh.colors.push(immediateMode.color);
	    immediateMode.mesh.coords.push(immediateMode.coord);
	    immediateMode.mesh.vertices.push(arguments.length == 1 ? x.toArray() : [x, y, z]);
	  };
	  gl.end = function() {
	    if (immediateMode.mode == -1) throw new Error('mismatched gl.begin() and gl.end() calls');
	    immediateMode.mesh.compile();
	    immediateMode.shader.uniforms({
	      useTexture: !!gl.getParameter(gl.TEXTURE_BINDING_2D)
	    }).draw(immediateMode.mesh, immediateMode.mode);
	    immediateMode.mode = -1;
	  };
	}
	
	// ### Improved mouse events
	//
	// This adds event listeners on the `gl.canvas` element that call
	// `gl.onmousedown()`, `gl.onmousemove()`, and `gl.onmouseup()` with an
	// augmented event object. The event object also has the properties `x`, `y`,
	// `deltaX`, `deltaY`, and `dragging`.
	function addEventListeners() {
	  var context = gl, oldX = 0, oldY = 0, buttons = {}, hasOld = false;
	  var has = Object.prototype.hasOwnProperty;
	  function isDragging() {
	    for (var b in buttons) {
	      if (has.call(buttons, b) && buttons[b]) return true;
	    }
	    return false;
	  }
	  function augment(original) {
	    // Make a copy of original, a native `MouseEvent`, so we can overwrite
	    // WebKit's non-standard read-only `x` and `y` properties (which are just
	    // duplicates of `pageX` and `pageY`). We can't just use
	    // `Object.create(original)` because some `MouseEvent` functions must be
	    // called in the context of the original event object.
	    var e = {};
	    for (var name in original) {
	      if (typeof original[name] == 'function') {
	        e[name] = (function(callback) {
	          return function() {
	            callback.apply(original, arguments);
	          };
	        })(original[name]);
	      } else {
	        e[name] = original[name];
	      }
	    }
	    e.original = original;
	    e.x = e.pageX;
	    e.y = e.pageY;
	    for (var obj = gl.canvas; obj; obj = obj.offsetParent) {
	      e.x -= obj.offsetLeft;
	      e.y -= obj.offsetTop;
	    }
	    if (hasOld) {
	      e.deltaX = e.x - oldX;
	      e.deltaY = e.y - oldY;
	    } else {
	      e.deltaX = 0;
	      e.deltaY = 0;
	      hasOld = true;
	    }
	    oldX = e.x;
	    oldY = e.y;
	    e.dragging = isDragging();
	    e.preventDefault = function() {
	      e.original.preventDefault();
	    };
	    e.stopPropagation = function() {
	      e.original.stopPropagation();
	    };
	    return e;
	  }
	  function mousedown(e) {
	    gl = context;
	    if (!isDragging()) {
	      // Expand the event handlers to the document to handle dragging off canvas.
	      on(document, 'mousemove', mousemove);
	      on(document, 'mouseup', mouseup);
	      off(gl.canvas, 'mousemove', mousemove);
	      off(gl.canvas, 'mouseup', mouseup);
	    }
	    buttons[e.which] = true;
	    e = augment(e);
	    if (gl.onmousedown) gl.onmousedown(e);
	    e.preventDefault();
	  }
	  function mousemove(e) {
	    gl = context;
	    e = augment(e);
	    if (gl.onmousemove) gl.onmousemove(e);
	    e.preventDefault();
	  }
	  function mouseup(e) {
	    gl = context;
	    buttons[e.which] = false;
	    if (!isDragging()) {
	      // Shrink the event handlers back to the canvas when dragging ends.
	      off(document, 'mousemove', mousemove);
	      off(document, 'mouseup', mouseup);
	      on(gl.canvas, 'mousemove', mousemove);
	      on(gl.canvas, 'mouseup', mouseup);
	    }
	    e = augment(e);
	    if (gl.onmouseup) gl.onmouseup(e);
	    e.preventDefault();
	  }
	  function reset() {
	    hasOld = false;
	  }
	  function resetAll() {
	    buttons = {};
	    hasOld = false;
	  }
	  on(gl.canvas, 'mousedown', mousedown);
	  on(gl.canvas, 'mousemove', mousemove);
	  on(gl.canvas, 'mouseup', mouseup);
	  on(gl.canvas, 'mouseover', reset);
	  on(gl.canvas, 'mouseout', reset);
	  on(document, 'contextmenu', resetAll);
	}
	
	// ### Automatic keyboard state
	//
	// The current keyboard state is stored in `GL.keys`, a map of integer key
	// codes to booleans indicating whether that key is currently pressed. Certain
	// keys also have named identifiers that can be used directly, such as
	// `GL.keys.SPACE`. Values in `GL.keys` are initially undefined until that
	// key is pressed for the first time. If you need a boolean value, you can
	// cast the value to boolean by applying the not operator twice (as in
	// `!!GL.keys.SPACE`).
	
	function mapKeyCode(code) {
	  var named = {
	    8: 'BACKSPACE',
	    9: 'TAB',
	    13: 'ENTER',
	    16: 'SHIFT',
	    27: 'ESCAPE',
	    32: 'SPACE',
	    37: 'LEFT',
	    38: 'UP',
	    39: 'RIGHT',
	    40: 'DOWN'
	  };
	  return named[code] || (code >= 65 && code <= 90 ? String.fromCharCode(code) : null);
	}
	
	function on(element, name, callback) {
	  element.addEventListener(name, callback);
	}
	
	function off(element, name, callback) {
	  element.removeEventListener(name, callback);
	}
	
	on(document, 'keydown', function(e) {
	  if (!e.altKey && !e.ctrlKey && !e.metaKey) {
	    var key = mapKeyCode(e.keyCode);
	    if (key) GL.keys[key] = true;
	    GL.keys[e.keyCode] = true;
	  }
	});
	
	on(document, 'keyup', function(e) {
	  if (!e.altKey && !e.ctrlKey && !e.metaKey) {
	    var key = mapKeyCode(e.keyCode);
	    if (key) GL.keys[key] = false;
	    GL.keys[e.keyCode] = false;
	  }
	});
	
	function addOtherMethods() {
	  // ### Multiple contexts
	  //
	  // When using multiple contexts in one web page, `gl.makeCurrent()` must be
	  // called before issuing commands to a different context.
	  (function(context) {
	    gl.makeCurrent = function() {
	      gl = context;
	    };
	  })(gl);
	
	  // ### Animation
	  //
	  // Call `gl.animate()` to provide an animation loop that repeatedly calls
	  // `gl.onupdate()` and `gl.ondraw()`.
	  gl.animate = function() {
	    var post =
	      window.requestAnimationFrame ||
	      window.mozRequestAnimationFrame ||
	      window.webkitRequestAnimationFrame ||
	      function(callback) { setTimeout(callback, 1000 / 60); };
	    var time = new Date().getTime();
	    var context = gl;
	    function update() {
	      gl = context;
	      var now = new Date().getTime();
	      if (gl.onupdate) gl.onupdate((now - time) / 1000);
	      if (gl.ondraw) gl.ondraw();
	      post(update);
	      time = now;
	    }
	    update();
	  };
	
	  // ### Fullscreen
	  //
	  // Provide an easy way to get a fullscreen app running, including an
	  // automatic 3D perspective projection matrix by default. This should be
	  // called once.
	  //
	  // Just fullscreen, no automatic camera:
	  //
	  //     gl.fullscreen({ camera: false });
	  //
	  // Adjusting field of view, near plane distance, and far plane distance:
	  //
	  //     gl.fullscreen({ fov: 45, near: 0.1, far: 1000 });
	  //
	  // Adding padding from the edge of the window:
	  //
	  //     gl.fullscreen({ paddingLeft: 250, paddingBottom: 60 });
	  //
	  gl.fullscreen = function(options) {
	    options = options || {};
	    var top = options.paddingTop || 0;
	    var left = options.paddingLeft || 0;
	    var right = options.paddingRight || 0;
	    var bottom = options.paddingBottom || 0;
	    if (!document.body) {
	      throw new Error('document.body doesn\'t exist yet (call gl.fullscreen() from ' +
	        'window.onload() or from inside the <body> tag)');
	    }
	    document.body.appendChild(gl.canvas);
	    document.body.style.overflow = 'hidden';
	    gl.canvas.style.position = 'absolute';
	    gl.canvas.style.left = left + 'px';
	    gl.canvas.style.top = top + 'px';
	    function resize() {
	      gl.canvas.width = window.innerWidth - left - right;
	      gl.canvas.height = window.innerHeight - top - bottom;
	      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	      if (options.camera || !('camera' in options)) {
	        gl.matrixMode(gl.PROJECTION);
	        gl.loadIdentity();
	        gl.perspective(options.fov || 45, gl.canvas.width / gl.canvas.height,
	          options.near || 0.1, options.far || 1000);
	        gl.matrixMode(gl.MODELVIEW);
	      }
	      if (gl.ondraw) gl.ondraw();
	    }
	    on(window, 'resize', resize);
	    resize();
	  };
	}
	
	// A value to bitwise-or with new enums to make them distinguishable from the
	// standard WebGL enums.
	var ENUM = 0x12340000;
	
	// src/2d-projection.js
	
	// src/raytracer.js
	// Provides a convenient raytracing interface.
	
	// ### new GL.HitTest([t, hit, normal])
	//
	// This is the object used to return hit test results. If there are no
	// arguments, the constructed argument represents a hit infinitely far
	// away.
	function HitTest(t, hit, normal) {
	  this.t = arguments.length ? t : Number.MAX_VALUE;
	  this.hit = hit;
	  this.normal = normal;
	}
	
	// ### .mergeWith(other)
	//
	// Changes this object to be the closer of the two hit test results.
	HitTest.prototype = {
	  mergeWith: function(other) {
	    if (other.t > 0 && other.t < this.t) {
	      this.t = other.t;
	      this.hit = other.hit;
	      this.normal = other.normal;
	    }
	  }
	};
	
	// ### new GL.Raytracer()
	//
	// This will read the current modelview matrix, projection matrix, and viewport,
	// reconstruct the eye position, and store enough information to later generate
	// per-pixel rays using `getRayForPixel()`.
	//
	// Example usage:
	//
	//     var tracer = new GL.Raytracer();
	//     var ray = tracer.getRayForPixel(
	//       gl.canvas.width / 2,
	//       gl.canvas.height / 2);
	//     var result = GL.Raytracer.hitTestSphere(
	//       tracer.eye, ray, new GL.Vector(0, 0, 0), 1);
	function Raytracer() {
	  var v = gl.getParameter(gl.VIEWPORT);
	  var m = gl.modelviewMatrix.m;
	
	  var axisX = new Vector(m[0], m[4], m[8]);
	  var axisY = new Vector(m[1], m[5], m[9]);
	  var axisZ = new Vector(m[2], m[6], m[10]);
	  var offset = new Vector(m[3], m[7], m[11]);
	  this.eye = new Vector(-offset.dot(axisX), -offset.dot(axisY), -offset.dot(axisZ));
	
	  var minX = v[0], maxX = minX + v[2];
	  var minY = v[1], maxY = minY + v[3];
	  this.ray00 = gl.unProject(minX, minY, 1).subtract(this.eye);
	  this.ray10 = gl.unProject(maxX, minY, 1).subtract(this.eye);
	  this.ray01 = gl.unProject(minX, maxY, 1).subtract(this.eye);
	  this.ray11 = gl.unProject(maxX, maxY, 1).subtract(this.eye);
	  this.viewport = v;
	}
	
	Raytracer.prototype = {
	  // ### .getRayForPixel(x, y)
	  //
	  // Returns the ray originating from the camera and traveling through the pixel `x, y`.
	  getRayForPixel: function(x, y) {
	    x = (x - this.viewport[0]) / this.viewport[2];
	    y = 1 - (y - this.viewport[1]) / this.viewport[3];
	    var ray0 = Vector.lerp(this.ray00, this.ray10, x);
	    var ray1 = Vector.lerp(this.ray01, this.ray11, x);
	    return Vector.lerp(ray0, ray1, y).unit();
	  }
	};
	
	// ### GL.Raytracer.hitTestBox(origin, ray, min, max)
	//
	// Traces the ray starting from `origin` along `ray` against the axis-aligned box
	// whose coordinates extend from `min` to `max`. Returns a `HitTest` with the
	// information or `null` for no intersection.
	//
	// This implementation uses the [slab intersection method](http://www.siggraph.org/education/materials/HyperGraph/raytrace/rtinter3.htm).
	Raytracer.hitTestBox = function(origin, ray, min, max) {
	  var tMin = min.subtract(origin).divide(ray);
	  var tMax = max.subtract(origin).divide(ray);
	  var t1 = Vector.min(tMin, tMax);
	  var t2 = Vector.max(tMin, tMax);
	  var tNear = t1.max();
	  var tFar = t2.min();
	
	  if (tNear > 0 && tNear < tFar) {
	    var epsilon = 1.0e-6, hit = origin.add(ray.multiply(tNear));
	    min = min.add(epsilon);
	    max = max.subtract(epsilon);
	    return new HitTest(tNear, hit, new Vector(
	      (hit.x > max.x) - (hit.x < min.x),
	      (hit.y > max.y) - (hit.y < min.y),
	      (hit.z > max.z) - (hit.z < min.z)
	    ));
	  }
	
	  return null;
	};
	
	// ### GL.Raytracer.hitTestSphere(origin, ray, center, radius)
	//
	// Traces the ray starting from `origin` along `ray` against the sphere defined
	// by `center` and `radius`. Returns a `HitTest` with the information or `null`
	// for no intersection.
	Raytracer.hitTestSphere = function(origin, ray, center, radius) {
	  var offset = origin.subtract(center);
	  var a = ray.dot(ray);
	  var b = 2 * ray.dot(offset);
	  var c = offset.dot(offset) - radius * radius;
	  var discriminant = b * b - 4 * a * c;
	
	  if (discriminant > 0) {
	    var t = (-b - Math.sqrt(discriminant)) / (2 * a), hit = origin.add(ray.multiply(t));
	    return new HitTest(t, hit, hit.subtract(center).divide(radius));
	  }
	
	  return null;
	};
	
	// ### GL.Raytracer.hitTestTriangle(origin, ray, a, b, c)
	//
	// Traces the ray starting from `origin` along `ray` against the triangle defined
	// by the points `a`, `b`, and `c`. Returns a `HitTest` with the information or
	// `null` for no intersection.
	Raytracer.hitTestTriangle = function(origin, ray, a, b, c) {
	  var ab = b.subtract(a);
	  var ac = c.subtract(a);
	  var normal = ab.cross(ac).unit();
	  var t = normal.dot(a.subtract(origin)) / normal.dot(ray);
	
	  if (t > 0) {
	    var hit = origin.add(ray.multiply(t));
	    var toHit = hit.subtract(a);
	    var dot00 = ac.dot(ac);
	    var dot01 = ac.dot(ab);
	    var dot02 = ac.dot(toHit);
	    var dot11 = ab.dot(ab);
	    var dot12 = ab.dot(toHit);
	    var divide = dot00 * dot11 - dot01 * dot01;
	    var u = (dot11 * dot02 - dot01 * dot12) / divide;
	    var v = (dot00 * dot12 - dot01 * dot02) / divide;
	    if (u >= 0 && v >= 0 && u + v <= 1) return new HitTest(t, hit, normal);
	  }
	
	  return null;
	};
	
	// src/texture.js
	// Provides a simple wrapper around WebGL textures that supports render-to-texture.
	
	// ### new GL.Texture(width, height[, options])
	//
	// The arguments `width` and `height` give the size of the texture in texels.
	// WebGL texture dimensions must be powers of two unless `filter` is set to
	// either `gl.NEAREST` or `gl.LINEAR` and `wrap` is set to `gl.CLAMP_TO_EDGE`
	// (which they are by default).
	//
	// Texture parameters can be passed in via the `options` argument.
	// Example usage:
	//
	//     var t = new GL.Texture(256, 256, {
	//       // Defaults to gl.LINEAR, set both at once with "filter"
	//       magFilter: gl.NEAREST,
	//       minFilter: gl.LINEAR,
	//
	//       // Defaults to gl.CLAMP_TO_EDGE, set both at once with "wrap"
	//       wrapS: gl.REPEAT,
	//       wrapT: gl.REPEAT,
	//
	//       format: gl.RGB, // Defaults to gl.RGBA
	//       type: gl.FLOAT // Defaults to gl.UNSIGNED_BYTE
	//     });
	function Texture(width, height, options) {
	  options = options || {};
	  this.id = gl.createTexture();
	  this.width = width;
	  this.height = height;
	  this.format = options.format || gl.RGBA;
	  this.type = options.type || gl.UNSIGNED_BYTE;
	  var magFilter = options.filter || options.magFilter || gl.LINEAR;
	  var minFilter = options.filter || options.minFilter || gl.LINEAR;
	  if (this.type === gl.FLOAT) {
	    if (!Texture.canUseFloatingPointTextures()) {
	      throw new Error('OES_texture_float is required but not supported');
	    }
	    if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
	        !Texture.canUseFloatingPointLinearFiltering()) {
	      throw new Error('OES_texture_float_linear is required but not supported');
	    }
	  } else if (this.type === gl.HALF_FLOAT_OES) {
	    if (!Texture.canUseHalfFloatingPointTextures()) {
	      throw new Error('OES_texture_half_float is required but not supported');
	    }
	    if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
	        !Texture.canUseHalfFloatingPointLinearFiltering()) {
	      throw new Error('OES_texture_half_float_linear is required but not supported');
	    }
	  }
	  gl.bindTexture(gl.TEXTURE_2D, this.id);
	  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap || options.wrapS || gl.CLAMP_TO_EDGE);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap || options.wrapT || gl.CLAMP_TO_EDGE);
	  gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, options.data || null);
	}
	
	var framebuffer;
	var renderbuffer;
	var checkerboardCanvas;
	
	Texture.prototype = {
	  // ### .bind([unit])
	  //
	  // Bind this texture to the given texture unit (0-7, defaults to 0).
	  bind: function(unit) {
	    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
	    gl.bindTexture(gl.TEXTURE_2D, this.id);
	  },
	
	  // ### .unbind([unit])
	  //
	  // Clear the given texture unit (0-7, defaults to 0).
	  unbind: function(unit) {
	    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
	    gl.bindTexture(gl.TEXTURE_2D, null);
	  },
	
	  // ### .canDrawTo()
	  //
	  // Check if rendering to this texture is supported. It may not be supported
	  // for floating-point textures on some configurations.
	  canDrawTo: function() {
	    framebuffer = framebuffer || gl.createFramebuffer();
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
	    var result = gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE;
	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	    return result;
	  },
	
	  // ### .drawTo(callback)
	  //
	  // Render all draw calls in `callback` to this texture. This method sets up
	  // a framebuffer with this texture as the color attachment and a renderbuffer
	  // as the depth attachment. It also temporarily changes the viewport to the
	  // size of the texture.
	  //
	  // Example usage:
	  //
	  //     texture.drawTo(function() {
	  //       gl.clearColor(1, 0, 0, 1);
	  //       gl.clear(gl.COLOR_BUFFER_BIT);
	  //     });
	  drawTo: function(callback) {
	    var v = gl.getParameter(gl.VIEWPORT);
	    framebuffer = framebuffer || gl.createFramebuffer();
	    renderbuffer = renderbuffer || gl.createRenderbuffer();
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	    if (this.width != renderbuffer.width || this.height != renderbuffer.height) {
	      renderbuffer.width = this.width;
	      renderbuffer.height = this.height;
	      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
	    }
	    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
	    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
	      throw new Error('Rendering to this texture is not supported (incomplete framebuffer)');
	    }
	    gl.viewport(0, 0, this.width, this.height);
	
	    callback();
	
	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	    gl.viewport(v[0], v[1], v[2], v[3]);
	  },
	
	  // ### .swapWith(other)
	  //
	  // Switch this texture with `other`, useful for the ping-pong rendering
	  // technique used in multi-stage rendering.
	  swapWith: function(other) {
	    var temp;
	    temp = other.id; other.id = this.id; this.id = temp;
	    temp = other.width; other.width = this.width; this.width = temp;
	    temp = other.height; other.height = this.height; this.height = temp;
	  }
	};
	
	// ### GL.Texture.fromImage(image[, options])
	//
	// Return a new image created from `image`, an `<img>` tag.
	Texture.fromImage = function(image, options) {
	  options = options || {};
	  var texture = new Texture(image.width, image.height, options);
	  try {
	    gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, texture.type, image);
	  } catch (e) {
	    if (location.protocol == 'file:') {
	      throw new Error('image not loaded for security reasons (serve this page over "http://" instead)');
	    } else {
	      throw new Error('image not loaded for security reasons (image must originate from the same ' +
	        'domain as this page or use Cross-Origin Resource Sharing)');
	    }
	  }
	  if (options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR) {
	    gl.generateMipmap(gl.TEXTURE_2D);
	  }
	  return texture;
	};
	
	// ### GL.Texture.fromURL(url[, options])
	//
	// Returns a checkerboard texture that will switch to the correct texture when
	// it loads.
	Texture.fromURL = function(url, options) {
	  checkerboardCanvas = checkerboardCanvas || (function() {
	    var c = document.createElement('canvas').getContext('2d');
	    c.canvas.width = c.canvas.height = 128;
	    for (var y = 0; y < c.canvas.height; y += 16) {
	      for (var x = 0; x < c.canvas.width; x += 16) {
	        c.fillStyle = (x ^ y) & 16 ? '#FFF' : '#DDD';
	        c.fillRect(x, y, 16, 16);
	      }
	    }
	    return c.canvas;
	  })();
	  var texture = Texture.fromImage(checkerboardCanvas, options);
	  var image = new Image();
	  var context = gl;
	  image.onload = function() {
	    context.makeCurrent();
	    Texture.fromImage(image, options).swapWith(texture);
	  };
	  image.src = url;
	  return texture;
	};
	
	// ### GL.Texture.canUseFloatingPointTextures()
	//
	// Returns false if `gl.FLOAT` is not supported as a texture type. This is the
	// `OES_texture_float` extension.
	Texture.canUseFloatingPointTextures = function() {
	  return !!gl.getExtension('OES_texture_float');
	};
	
	// ### GL.Texture.canUseFloatingPointLinearFiltering()
	//
	// Returns false if `gl.LINEAR` is not supported as a texture filter mode for
	// textures of type `gl.FLOAT`. This is the `OES_texture_float_linear`
	// extension.
	Texture.canUseFloatingPointLinearFiltering = function() {
	  return !!gl.getExtension('OES_texture_float_linear');
	};
	
	// ### GL.Texture.canUseFloatingPointTextures()
	//
	// Returns false if `gl.HALF_FLOAT_OES` is not supported as a texture type.
	// This is the `OES_texture_half_float` extension.
	Texture.canUseHalfFloatingPointTextures = function() {
	  return !!gl.getExtension('OES_texture_half_float');
	};
	
	// ### GL.Texture.canUseFloatingPointLinearFiltering()
	//
	// Returns false if `gl.LINEAR` is not supported as a texture filter mode for
	// textures of type `gl.HALF_FLOAT_OES`. This is the
	// `OES_texture_half_float_linear` extension.
	Texture.canUseHalfFloatingPointLinearFiltering = function() {
	  return !!gl.getExtension('OES_texture_half_float_linear');
	};
	
	// src/matrix.js
	// Represents a 4x4 matrix stored in row-major order that uses Float32Arrays
	// when available. Matrix operations can either be done using convenient
	// methods that return a new matrix for the result or optimized methods
	// that store the result in an existing matrix to avoid generating garbage.
	
	var hasFloat32Array = (typeof Float32Array != 'undefined');
	
	// ### new GL.Matrix([elements])
	//
	// This constructor takes 16 arguments in row-major order, which can be passed
	// individually, as a list, or even as four lists, one for each row. If the
	// arguments are omitted then the identity matrix is constructed instead.
	function Matrix() {
	  var m = Array.prototype.concat.apply([], arguments);
	  if (!m.length) {
	    m = [
	      1, 0, 0, 0,
	      0, 1, 0, 0,
	      0, 0, 1, 0,
	      0, 0, 0, 1
	    ];
	  }
	  this.m = hasFloat32Array ? new Float32Array(m) : m;
	}
	
	Matrix.prototype = {
	  // ### .inverse()
	  //
	  // Returns the matrix that when multiplied with this matrix results in the
	  // identity matrix.
	  inverse: function() {
	    return Matrix.inverse(this, new Matrix());
	  },
	
	  // ### .transpose()
	  //
	  // Returns this matrix, exchanging columns for rows.
	  transpose: function() {
	    return Matrix.transpose(this, new Matrix());
	  },
	
	  // ### .multiply(matrix)
	  //
	  // Returns the concatenation of the transforms for this matrix and `matrix`.
	  // This emulates the OpenGL function `glMultMatrix()`.
	  multiply: function(matrix) {
	    return Matrix.multiply(this, matrix, new Matrix());
	  },
	
	  // ### .transformPoint(point)
	  //
	  // Transforms the vector as a point with a w coordinate of 1. This
	  // means translations will have an effect, for example.
	  transformPoint: function(v) {
	    var m = this.m;
	    return new Vector(
	      m[0] * v.x + m[1] * v.y + m[2] * v.z + m[3],
	      m[4] * v.x + m[5] * v.y + m[6] * v.z + m[7],
	      m[8] * v.x + m[9] * v.y + m[10] * v.z + m[11]
	    ).divide(m[12] * v.x + m[13] * v.y + m[14] * v.z + m[15]);
	  },
	
	  // ### .transformPoint(vector)
	  //
	  // Transforms the vector as a vector with a w coordinate of 0. This
	  // means translations will have no effect, for example.
	  transformVector: function(v) {
	    var m = this.m;
	    return new Vector(
	      m[0] * v.x + m[1] * v.y + m[2] * v.z,
	      m[4] * v.x + m[5] * v.y + m[6] * v.z,
	      m[8] * v.x + m[9] * v.y + m[10] * v.z
	    );
	  }
	};
	
	// ### GL.Matrix.inverse(matrix[, result])
	//
	// Returns the matrix that when multiplied with `matrix` results in the
	// identity matrix. You can optionally pass an existing matrix in `result`
	// to avoid allocating a new matrix. This implementation is from the Mesa
	// OpenGL function `__gluInvertMatrixd()` found in `project.c`.
	Matrix.inverse = function(matrix, result) {
	  result = result || new Matrix();
	  var m = matrix.m, r = result.m;
	
	  r[0] = m[5]*m[10]*m[15] - m[5]*m[14]*m[11] - m[6]*m[9]*m[15] + m[6]*m[13]*m[11] + m[7]*m[9]*m[14] - m[7]*m[13]*m[10];
	  r[1] = -m[1]*m[10]*m[15] + m[1]*m[14]*m[11] + m[2]*m[9]*m[15] - m[2]*m[13]*m[11] - m[3]*m[9]*m[14] + m[3]*m[13]*m[10];
	  r[2] = m[1]*m[6]*m[15] - m[1]*m[14]*m[7] - m[2]*m[5]*m[15] + m[2]*m[13]*m[7] + m[3]*m[5]*m[14] - m[3]*m[13]*m[6];
	  r[3] = -m[1]*m[6]*m[11] + m[1]*m[10]*m[7] + m[2]*m[5]*m[11] - m[2]*m[9]*m[7] - m[3]*m[5]*m[10] + m[3]*m[9]*m[6];
	
	  r[4] = -m[4]*m[10]*m[15] + m[4]*m[14]*m[11] + m[6]*m[8]*m[15] - m[6]*m[12]*m[11] - m[7]*m[8]*m[14] + m[7]*m[12]*m[10];
	  r[5] = m[0]*m[10]*m[15] - m[0]*m[14]*m[11] - m[2]*m[8]*m[15] + m[2]*m[12]*m[11] + m[3]*m[8]*m[14] - m[3]*m[12]*m[10];
	  r[6] = -m[0]*m[6]*m[15] + m[0]*m[14]*m[7] + m[2]*m[4]*m[15] - m[2]*m[12]*m[7] - m[3]*m[4]*m[14] + m[3]*m[12]*m[6];
	  r[7] = m[0]*m[6]*m[11] - m[0]*m[10]*m[7] - m[2]*m[4]*m[11] + m[2]*m[8]*m[7] + m[3]*m[4]*m[10] - m[3]*m[8]*m[6];
	
	  r[8] = m[4]*m[9]*m[15] - m[4]*m[13]*m[11] - m[5]*m[8]*m[15] + m[5]*m[12]*m[11] + m[7]*m[8]*m[13] - m[7]*m[12]*m[9];
	  r[9] = -m[0]*m[9]*m[15] + m[0]*m[13]*m[11] + m[1]*m[8]*m[15] - m[1]*m[12]*m[11] - m[3]*m[8]*m[13] + m[3]*m[12]*m[9];
	  r[10] = m[0]*m[5]*m[15] - m[0]*m[13]*m[7] - m[1]*m[4]*m[15] + m[1]*m[12]*m[7] + m[3]*m[4]*m[13] - m[3]*m[12]*m[5];
	  r[11] = -m[0]*m[5]*m[11] + m[0]*m[9]*m[7] + m[1]*m[4]*m[11] - m[1]*m[8]*m[7] - m[3]*m[4]*m[9] + m[3]*m[8]*m[5];
	
	  r[12] = -m[4]*m[9]*m[14] + m[4]*m[13]*m[10] + m[5]*m[8]*m[14] - m[5]*m[12]*m[10] - m[6]*m[8]*m[13] + m[6]*m[12]*m[9];
	  r[13] = m[0]*m[9]*m[14] - m[0]*m[13]*m[10] - m[1]*m[8]*m[14] + m[1]*m[12]*m[10] + m[2]*m[8]*m[13] - m[2]*m[12]*m[9];
	  r[14] = -m[0]*m[5]*m[14] + m[0]*m[13]*m[6] + m[1]*m[4]*m[14] - m[1]*m[12]*m[6] - m[2]*m[4]*m[13] + m[2]*m[12]*m[5];
	  r[15] = m[0]*m[5]*m[10] - m[0]*m[9]*m[6] - m[1]*m[4]*m[10] + m[1]*m[8]*m[6] + m[2]*m[4]*m[9] - m[2]*m[8]*m[5];
	
	  var det = m[0]*r[0] + m[1]*r[4] + m[2]*r[8] + m[3]*r[12];
	  for (var i = 0; i < 16; i++) r[i] /= det;
	  return result;
	};
	
	// ### GL.Matrix.transpose(matrix[, result])
	//
	// Returns `matrix`, exchanging columns for rows. You can optionally pass an
	// existing matrix in `result` to avoid allocating a new matrix.
	Matrix.transpose = function(matrix, result) {
	  result = result || new Matrix();
	  var m = matrix.m, r = result.m;
	  r[0] = m[0]; r[1] = m[4]; r[2] = m[8]; r[3] = m[12];
	  r[4] = m[1]; r[5] = m[5]; r[6] = m[9]; r[7] = m[13];
	  r[8] = m[2]; r[9] = m[6]; r[10] = m[10]; r[11] = m[14];
	  r[12] = m[3]; r[13] = m[7]; r[14] = m[11]; r[15] = m[15];
	  return result;
	};
	
	// ### GL.Matrix.multiply(left, right[, result])
	//
	// Returns the concatenation of the transforms for `left` and `right`. You can
	// optionally pass an existing matrix in `result` to avoid allocating a new
	// matrix. This emulates the OpenGL function `glMultMatrix()`.
	Matrix.multiply = function(left, right, result) {
	  result = result || new Matrix();
	  var a = left.m, b = right.m, r = result.m;
	
	  r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
	  r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
	  r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
	  r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];
	
	  r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
	  r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
	  r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
	  r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];
	
	  r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
	  r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
	  r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
	  r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];
	
	  r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
	  r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
	  r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
	  r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];
	
	  return result;
	};
	
	// ### GL.Matrix.identity([result])
	//
	// Returns an identity matrix. You can optionally pass an existing matrix in
	// `result` to avoid allocating a new matrix. This emulates the OpenGL function
	// `glLoadIdentity()`.
	Matrix.identity = function(result) {
	  result = result || new Matrix();
	  var m = result.m;
	  m[0] = m[5] = m[10] = m[15] = 1;
	  m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
	  return result;
	};
	
	// ### GL.Matrix.perspective(fov, aspect, near, far[, result])
	//
	// Returns a perspective transform matrix, which makes far away objects appear
	// smaller than nearby objects. The `aspect` argument should be the width
	// divided by the height of your viewport and `fov` is the top-to-bottom angle
	// of the field of view in degrees. You can optionally pass an existing matrix
	// in `result` to avoid allocating a new matrix. This emulates the OpenGL
	// function `gluPerspective()`.
	Matrix.perspective = function(fov, aspect, near, far, result) {
	  var y = Math.tan(fov * Math.PI / 360) * near;
	  var x = y * aspect;
	  return Matrix.frustum(-x, x, -y, y, near, far, result);
	};
	
	// ### GL.Matrix.frustum(left, right, bottom, top, near, far[, result])
	//
	// Sets up a viewing frustum, which is shaped like a truncated pyramid with the
	// camera where the point of the pyramid would be. You can optionally pass an
	// existing matrix in `result` to avoid allocating a new matrix. This emulates
	// the OpenGL function `glFrustum()`.
	Matrix.frustum = function(l, r, b, t, n, f, result) {
	  result = result || new Matrix();
	  var m = result.m;
	
	  m[0] = 2 * n / (r - l);
	  m[1] = 0;
	  m[2] = (r + l) / (r - l);
	  m[3] = 0;
	
	  m[4] = 0;
	  m[5] = 2 * n / (t - b);
	  m[6] = (t + b) / (t - b);
	  m[7] = 0;
	
	  m[8] = 0;
	  m[9] = 0;
	  m[10] = -(f + n) / (f - n);
	  m[11] = -2 * f * n / (f - n);
	
	  m[12] = 0;
	  m[13] = 0;
	  m[14] = -1;
	  m[15] = 0;
	
	  return result;
	};
	
	// ### GL.Matrix.ortho(left, right, bottom, top, near, far[, result])
	//
	// Returns an orthographic projection, in which objects are the same size no
	// matter how far away or nearby they are. You can optionally pass an existing
	// matrix in `result` to avoid allocating a new matrix. This emulates the OpenGL
	// function `glOrtho()`.
	Matrix.ortho = function(l, r, b, t, n, f, result) {
	  result = result || new Matrix();
	  var m = result.m;
	
	  m[0] = 2 / (r - l);
	  m[1] = 0;
	  m[2] = 0;
	  m[3] = -(r + l) / (r - l);
	
	  m[4] = 0;
	  m[5] = 2 / (t - b);
	  m[6] = 0;
	  m[7] = -(t + b) / (t - b);
	
	  m[8] = 0;
	  m[9] = 0;
	  m[10] = -2 / (f - n);
	  m[11] = -(f + n) / (f - n);
	
	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;
	
	  return result;
	};
	
	// ### GL.Matrix.scale(x, y, z[, result])
	//
	// This emulates the OpenGL function `glScale()`. You can optionally pass an
	// existing matrix in `result` to avoid allocating a new matrix.
	Matrix.scale = function(x, y, z, result) {
	  result = result || new Matrix();
	  var m = result.m;
	
	  m[0] = x;
	  m[1] = 0;
	  m[2] = 0;
	  m[3] = 0;
	
	  m[4] = 0;
	  m[5] = y;
	  m[6] = 0;
	  m[7] = 0;
	
	  m[8] = 0;
	  m[9] = 0;
	  m[10] = z;
	  m[11] = 0;
	
	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;
	
	  return result;
	};
	
	// ### GL.Matrix.translate(x, y, z[, result])
	//
	// This emulates the OpenGL function `glTranslate()`. You can optionally pass
	// an existing matrix in `result` to avoid allocating a new matrix.
	Matrix.translate = function(x, y, z, result) {
	  result = result || new Matrix();
	  var m = result.m;
	
	  m[0] = 1;
	  m[1] = 0;
	  m[2] = 0;
	  m[3] = x;
	
	  m[4] = 0;
	  m[5] = 1;
	  m[6] = 0;
	  m[7] = y;
	
	  m[8] = 0;
	  m[9] = 0;
	  m[10] = 1;
	  m[11] = z;
	
	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;
	
	  return result;
	};
	
	Matrix.relitiveDirection = function(x,y,z,matrix) {
	  const m = matrix.m;
	  let v = [
	    m[0] * x + m[1] * y + m[2] * z,
	    m[4] * x + m[5] * y + m[6] * z,
	    m[8] * x + m[9] * y + m[10] * z
	  ];
	
	  return v;
	}
	
	function rotationMatrix(rotation) {
	  let result = new Matrix();
	  var m = result.m;
	
	  const yaw = rotation[0];
	  const pitch = rotation[1];
	  const roll = rotation[2];
	  const ca = Math.cos(yaw);
	  const sa = Math.sin(yaw);
	  const cb = Math.cos(pitch);
	  const sb = Math.sin(pitch);
	  const cc = Math.cos(roll);
	  const sc = Math.sin(roll);
	
	  result.m = [ca*cb, ca*sb*sc-sa*cc, ca*sb*cc+sa*sc, 0,
	              sa*cb, sa*sb*sc+ca*cc, sa*sb*cc-ca*sc, 0,
	              -sb,          cb*sc,          cb*cc, 0,
	                0,              0,              0, 1];
	
	  return result;
	}
	
	Matrix.rotationMatrix = rotationMatrix;
	
	Matrix.rotateAroundPoint = function(point, rotation, result) {
	  if (!rotation || (!rotation[0] && !rotation[1] && !rotation[2])) {
	    return Matrix.identity(result);
	  }
	  result = result || new Matrix();
	
	  const rm = rotationMatrix(rotation).m;
	  const x = point.x;
	  const y = point.y;
	  const z = point.z;
	
	  // I was about to fix this, but after thinking about it. If anyone ever reads this,
	  // I want to be remembered not for the tens, probably hundreds, of thousands of
	  // lines I have written. I wish to be remembered as the autistic obsesive person
	  // who managed to fill his mind soo full, the alphabet fell out.
	  //          Jozsef Morrissey
	  let a,b,c,e,
	      f,g,h,i,
	      j,k,l,m,
	      n,o,p,q;
	
	
	  a = rm[0]; b = rm[1]; c = rm[2];  e = rm[3];
	  f = rm[4]; g = rm[5]; h = rm[6];  i = rm[7];
	  j = rm[8]; k = rm[9]; l = rm[10]; m = rm[11];
	  n = rm[12]; o = rm[13]; p = rm[14]; q = rm[15];
	
	  result.m[0] = a+x*n;
	  result.m[1] = b+x*o;
	  result.m[2] = c+x*p;
	  result.m[3] = -x*(a+x*n)-y*(b+x*o)-z*(c+x*p)+x*q;
	
	  result.m[4] = f+y*n;
	  result.m[5] = g+y*o;
	  result.m[6] = h+y*p;
	  result.m[7] = -x*(f+y*n)-y*(g+y*o)-z*(h+y*p)+y*q;
	
	  result.m[8]  = j+z*n;
	  result.m[9]  = k+z*o;
	  result.m[10] = l+z*p;
	  result.m[11] = -x*(j+z*n)-y*(k+z*o)-z*(l+z*p)+z*q;
	
	  result.m[12] = n;
	  result.m[13] = o;
	  result.m[14] = p;
	  result.m[15] = -x*n-y*o-z*p+q;
	
	  return result;
	};
	
	const multiply = (matrix, point) => {
	
	}
	const result = Matrix.rotateAroundPoint({x: 0, y:0, z: 0}, [2, 5, 3]);
	
	
	
	// const zOnly = new Matrix();
	// zOnly.m[0] = zOnly.m[5] = 0;
	// const zRotation = new Matrix();
	
	// zRotation.m[0] = zRotation.m[5] = 0;
	
	// ### GL.Matrix.rotate(a, x, y, z[, result])
	//
	// Returns a matrix that rotates by `a` degrees around the vector `x, y, z`.
	// You can optionally pass an existing matrix in `result` to avoid allocating
	// a new matrix. This emulates the OpenGL function `glRotate()`.
	Matrix.rotate = function(a, x, y, z, result) {
	  if (!a || (!x && !y && !z)) {
	    return Matrix.identity(result);
	  }
	
	  result = result || new Matrix();
	  var m = result.m;
	
	  var d = Math.sqrt(x*x + y*y + z*z);
	  a *= Math.PI / 180; x /= d; y /= d; z /= d;
	  var c = Math.cos(a), s = Math.sin(a), t = 1 - c;
	
	  m[0] = x * x * t + c;
	  m[1] = x * y * t - z * s;
	  m[2] = x * z * t + y * s;
	  m[3] = 0;
	
	  m[4] = y * x * t + z * s;
	  m[5] = y * y * t + c;
	  m[6] = y * z * t - x * s;
	  m[7] = 0;
	
	  m[8] = z * x * t - y * s;
	  m[9] = z * y * t + x * s;
	  m[10] = z * z * t + c;
	  m[11] = 0;
	
	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;
	
	  return result;
	};
	
	// ### GL.Matrix.lookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz[, result])
	//
	// Returns a matrix that puts the camera at the eye point `ex, ey, ez` looking
	// toward the center point `cx, cy, cz` with an up direction of `ux, uy, uz`.
	// You can optionally pass an existing matrix in `result` to avoid allocating
	// a new matrix. This emulates the OpenGL function `gluLookAt()`.
	Matrix.lookAt = function(ex, ey, ez, cx, cy, cz, ux, uy, uz, result) {
	  result = result || new Matrix();
	  var m = result.m;
	
	  var e = new Vector(ex, ey, ez);
	  var c = new Vector(cx, cy, cz);
	  var u = new Vector(ux, uy, uz);
	  var f = e.subtract(c).unit();
	  var s = u.cross(f).unit();
	  var t = f.cross(s).unit();
	
	  m[0] = s.x;
	  m[1] = s.y;
	  m[2] = s.z;
	  m[3] = -s.dot(e);
	
	  m[4] = t.x;
	  m[5] = t.y;
	  m[6] = t.z;
	  m[7] = -t.dot(e);
	
	  m[8] = f.x;
	  m[9] = f.y;
	  m[10] = f.z;
	  m[11] = -f.dot(e);
	
	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;
	
	  return result;
	};
	
	return GL;
	})();
	
});


RequireJS.addFunction('./public/js/utils/3d-modeling/shaders.js',
function (require, exports, module) {
	const GL = require('./lightgl.js');
	
	const LightDirection = require('./shaders/light-direction.frag');
	const WireFrame = require('./shaders/wire-frame.vert');
	const RealisticLight = require('./shaders/realistic-light-shader.frag');
	const IlluminateAll = require('./shaders/illuminate-all.vert');
	const shaders = {LightDirection, WireFrame, RealisticLight, IlluminateAll};
	
	const splitReg = /\n\s*,\n/;
	const templatize = (string) => {
	  const func = (scope) => {
	    let str = string;
	    if (scope) {
	      const keys = Object.keys(scope);
	      keys.forEach(k => str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), scope[k]));
	    }
	    return str.split(splitReg);
	  }
	  func.raw = string.split(splitReg);
	  return func;
	}
	
	module.exports = {};
	Object.keys(shaders).forEach(k => module.exports[k] = templatize(shaders[k]));
	
});


RequireJS.addFunction('./public/js/utils/3d-modeling/STL.js',
function (require, exports, module) {
	
const colorShifts = [0,5,10,15]
	function encodeColor(color) {
	  if (color === undefined) return 0;
	  const values = [(Math.floor(color[0] * 32)), (Math.floor(color[1] * 32)), (Math.floor(color[2] * 32)), 1];
	  return values.sum((v,i) => (v << colorShifts[i]));
	}
	
	function extractColor(encoding) {
	  return colorShifts.map((s,i) => i === 3 ? encoding % 2 : ((encoding >> s) % 32)/32);
	}
	
	class STL {
	  constructor(header) {
	    let _header;
	    const triangles = [];
	    const throwXYZError = () => {throw new Error('Invalid XYZ object all must be finite numbers')};
	    const validateXYZ = (...objs) => {
	      for (let index = 0; index < objs.length; index++) {
	        const obj = objs[index];
	        if (!Number.isFinite(obj.x)) throwXYZError();
	        if (!Number.isFinite(obj.y)) throwXYZError();
	        if (!Number.isFinite(obj.z)) throwXYZError();
	      }
	      return true;
	    }
	    const copyXYZ = (obj) => ({x: obj.x,y: obj.y,z: obj.z});
	    const copyAllXYZ = (...vs) => vs.map(v => copyXYZ(v));
	    const XYZstr = (obj) => `${obj.x} ${obj.y} ${obj.z}`
	
	    this.header = (header) => header !== undefined ? (_header = header.slice(0,80)) : _header;
	    this.header(header);
	    // TODO: make add imutable
	    this.add = {};
	    this.add.triangle = (v1, v2, v3, normal, colorPercent) =>
	          validateXYZ(v1,v2,v3,normal) &&
	          triangles.push({vertices: copyAllXYZ(v1,v2,v3), normal, color: colorPercent});
	    this.add.polygon = (vertices, normal, colorPercent) => {
	      vertices = vertices.map(v=>v);
	      while (vertices.length > 2) {
	        this.add.triangle(vertices[0],vertices[1],vertices[2], normal, colorPercent);
	        vertices.splice(1,1);
	      }
	    }
	    this.toJson = () => {
	      const json = {header};
	      json.triangles = triangles.map(t => {
	        const json = {normal: copyXYZ(t.normal)};
	        if (t.color) json.color = t.color.slice(0,3);
	        json.vertices = t.vertices.map(v => copyXYZ(v));
	        return json;
	      });
	      return json;
	    }
	    this.binary = () => {
	      const byteLength = STL.binaryLength(triangles.length);
	      const buffer = new ArrayBuffer(byteLength);
	      const view = new DataView(buffer);
	      let bPos = 0;
	
	      if (header) header.split('').forEach((c,i) => view.setUint8(i, c.charCodeAt(0)));
	
	      bPos = 80;
	      view.setUint32(bPos, triangles.length, true);
	      bPos += 4;
	      triangles.forEach(t => {
	        view.setFloat32(bPos, t.normal.x, true); bPos += 4;
	        view.setFloat32(bPos, t.normal.y, true); bPos += 4;
	        view.setFloat32(bPos, t.normal.z, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[0].x, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[0].y, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[0].z, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[1].x, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[1].y, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[1].z, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[2].x, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[2].y, true); bPos += 4;
	        view.setFloat32(bPos, t.vertices[2].z, true); bPos += 4;
	        view.setUint16(bPos, encodeColor(t.color), true); bPos += 2;
	      });
	
	      console.log(view.toByteString());
	      return buffer;
	    }
	    this.binary.file = () => {
	      const blob = new Blob([this.binary()], { type: 'application/octet-stream' }); // Set the MIME type to binary
	      return blob;
	    }
	    this.ascii = () => {
	      return `solid ${header}
	${triangles.map(t =>
	`  facet normal ${XYZstr(t.normal)}
	    outer loop
	      vertex ${XYZstr(t.vertices[0])}
	      vertex ${XYZstr(t.vertices[1])}
	      vertex ${XYZstr(t.vertices[2])}
	    endloop
	  endfacet`).join('\n')}
	endsolid ${header}`
	    }
	    this.url = () => {
	      return URL.createObjectURL(this.binary.file());
	    }
	  }
	}
	
	STL.fromCSG = (csg, header) => {
	  const stl = new STL(header);
	  const scaled = csg.clone();
	  scaled.scale(10);
	  scaled.polygons.forEach(p => stl.add.polygon(p.vertices.map(v => v.pos), p.plane.normal));
	  return stl;
	}
	
	STL.binaryLength = (length) => 80+4+50*length;
	
	const viewVertex = (view, i) => {
	  const x = view.getFloat32(i, true);
	  const y = view.getFloat32(i + 4, true);
	  const z = view.getFloat32(i + 8, true);
	  return {x, y, z};
	}
	
	STL.fromArrayBuffer = (arrayBuffer, header) => {
	  const view = new DataView(arrayBuffer);
	  const length = view.getUint32(80, true);
	  const expectedLength = STL.binaryLength(length);
	  if (expectedLength < 1 || arrayBuffer.length < expectedLength)
	    throw new Error(`Data is corrupt or invalid\n\tExpecting a bufferLength of at least ${expectedLength}`);
	  header ||= Array.fill(80, (i) => (charCode = view.getUint8(i)) ?
	                                  String.fromCharCode(charCode) : '').join('')
	  const stl = new STL(header);
	  for (let i = 84; i < expectedLength - 1;) {
	    const normal = viewVertex(view, i);
	    const v1 = viewVertex(view, i+=12);
	    const v2 = viewVertex(view, i+=12);
	    const v3 = viewVertex(view, i+=12);
	    const color = extractColor(view.getUint16(i += 12, true));
	    stl.add.triangle(v1, v2, v3, normal, color);
	    i+=2;
	  }
	
	  return stl;
	}
	
	STL.fromFiles = async (files) => {
	  const stls = [];
	  for (let index = 0; index < files.length; index++) {
	    const file = files[index];
	    try {
	      stls.push(STL.fromArrayBuffer(await file.arrayBuffer(), file.name));
	    } catch (e) {
	      e.name = file.name;
	      stls.push(e);
	    }
	  }
	
	  return stls;
	}
	
	module.exports = STL;
	
});


RequireJS.addFunction('./public/js/utils/3d-modeling/viewer.js',
function (require, exports, module) {
	

	
	const du = require('../dom-utils.js');
	const CSG = require('./csg.js');
	const GL = require('./lightgl.js');
	const shaders = require('./shaders.js');
	
	// Convert from CSG solid to GL.Mesh object
	CSG.prototype.toMesh = function() {
	  var mesh = new GL.Mesh({ normals: true, colors: true });
	  var indexer = new GL.Indexer();
	  this.toPolygons().map(function(polygon) {
	    var indices = polygon.vertices.map(function(vertex) {
	      vertex.color = polygon.shared || [1, 1, 1];
	      return indexer.add(vertex);
	    });
	    for (var i = 2; i < indices.length; i++) {
	      mesh.triangles.push([indices[0], indices[i - 1], indices[i]]);
	    }
	  });
	  mesh.vertices = indexer.unique.map(function(v) { return [v.pos.x, v.pos.y, v.pos.z]; });
	  mesh.normals = indexer.unique.map(function(v) { return [v.normal.x, v.normal.y, v.normal.z]; });
	  mesh.colors = indexer.unique.map(function(v) { return v.color; });
	  mesh.computeWireframe();
	  return mesh;
	};
	
	var angleX = 0;
	var angleY = 0;
	var angleZ = 0;
	var viewers = [];
	
	// Set to true so lines don't use the depth buffer
	Viewer.lineOverlay = false;
	
	// A viewer is a WebGL canvas that lets the user view a mesh. The user can
	// tumble it around by dragging the mouse.
	function Viewer(csg, width, height, depth) {
	  const originalDepth = depth;
	  viewers.push(this);
	  this.setDepth = (d) => depth = d;
	  let x = 0;
	  let y = 0;
	
	  let lastZoom;
	  let zoomCount = 0;
	  const zoom = (out) => {
	    let direction = (out === true ? 1 : -1);
	    let zoomOffset = 2;
	    let newTime = new Date().getTime();
	    if (lastZoom > newTime - 50) {
	      zoomCount++;
	      zoomOffset *= zoomCount;
	      zoomOffset = zoomOffset > 20 ? 20 : zoomOffset;
	    }
	    lastZoom = newTime;
	    depth += zoomOffset * direction;
	  };
	  this.zoom = zoom;
	  const pan = (leftRight, upDown) => {
	    x += leftRight;
	    y += upDown * -1;
	  }
	
	  // Get a new WebGL canvas
	  var gl = GL.create();
	  this.gl = gl;
	  this.mesh = csg.toMesh();
	  this.canvas = () => gl.canvas;
	
	  // Set up the viewport
	  gl.canvas.width = width;
	  gl.canvas.height = height;
	  gl.viewport(0, 0, width, height);
	  gl.matrixMode(gl.PROJECTION);
	  gl.loadIdentity();
	  gl.perspective(100, width / height, 10, 1000);
	  gl.rotate(0, 0, 1, 0);
	  gl.translate(0, 0, -200);
	  gl.matrixMode(gl.MODELVIEW);
	
	  // Set up WebGL state
	  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	  gl.clearColor(0.93, 0.93, 0.93, 1);
	  gl.enable(gl.DEPTH_TEST);
	  gl.enable(gl.CULL_FACE);
	  gl.polygonOffset(1, 1);
	
	  // Black shader for wireframe
	  this.blackShader = new GL.Shader(...shaders.WireFrame());
	
	  // const program = gl.createProgram();
	  // this.realisticLightShader = new GL.Shader(...shaders.RealisticLight());
	
	  // Shader with diffuse and specular lighting
	  this.changeLightingShaderDirection = (x,y,z) =>
	      this.lightingShader = new GL.Shader(...shaders.LightDirection({x:3,y:2,z:3}));
	
	  // this.lightingShaders = [
	  //   new GL.Shader(...shaders.LightDirection({x:3,y:2,z:3})),
	  //   new GL.Shader(...shaders.LightDirection({x:1,y:0,z:0})),
	  //   new GL.Shader(...shaders.LightDirection({x:-1,y:0,z:0})),
	  //   new GL.Shader(...shaders.LightDirection({x:0,y:0,z:-1})),
	  //   new GL.Shader(...shaders.LightDirection({x:0,y:0,z:1})),
	  //   new GL.Shader(...shaders.LightDirection({x:-3,y:-2,z:-3}))
	  // ];
	  this.lightingShader = new GL.Shader(...shaders.IlluminateAll({x:3,y:2,z:3}));
	
	  // this.changeLightingShaderDirection(0, 0, 0);
	  // this.changeLightingShaderDirection(3, 2, 3);
	
	  let origCenter = {x:0, y:0};
	  let pointClicked = {x: 0, y: 0, z: 0};
	  function setPointClicked(e) {
	    const canvasPos = e.target.getBoundingClientRect();
	    const clickPos = {x: e.x - canvasPos.x, y: e.y - canvasPos.y};
	    const canvasCenter = {x: e.target.width/2, y: e.target.height/2};
	    const canvasOffset = {x: clickPos.x - canvasCenter.x, y: clickPos.y - canvasCenter.y};
	    const twoDLoc = {x: origCenter.x + canvasOffset.x, y: origCenter.y + canvasOffset.y};
	    const centerOffset = GL.Matrix.relitiveDirection(twoDLoc.x, twoDLoc.y,0,gl.modelviewMatrix)
	    pointClicked = {x: centerOffset[0], y: centerOffset[1], z: centerOffset[2]};
	  }
	
	  let rotationUnit;
	  let rotationOffset = [0,0,0];
	  let panOffset;
	  let panUnit;
	
	  let rotationVector = new CSG.Vector(25, 12,11.5);
	  let point = {x: 0, y: 12, z: 11.5};
	  // let rotationVector = new CSG.Vector(25, 12,11.5);
	  function rotateEvent(e) {
	    if (!rotationUnit) {
	      rotationUnit = {};
	      rotationUnit.y = GL.Matrix.relitiveDirection(1, 0,0,gl.modelviewMatrix);
	      rotationUnit.x = GL.Matrix.relitiveDirection(0, 1,0,gl.modelviewMatrix);
	    }
	    if (rotationUnit) {
	      const speed = 40;
	      if (e.deltaY) {
	        const dir = e.deltaY < 0 ? -speed : speed;
	        rotationOffset[0] += rotationUnit.y[0]/dir;
	        rotationOffset[1] += rotationUnit.y[1]/dir;
	        rotationOffset[2] += rotationUnit.y[2]/dir;
	      }
	      if (e.deltaX) {
	        const dir = e.deltaX < 0 ? speed : -speed;
	        rotationOffset[0] += rotationUnit.x[0]/dir;
	        rotationOffset[1] += rotationUnit.x[1]/dir;
	        rotationOffset[2] += rotationUnit.x[2]/dir;
	      }
	    }
	    // angleY += e.deltaX * 2;
	    // angleX += e.deltaY * 2;
	    // angleX = Math.max(-90, Math.min(90, angleX));
	  }
	
	  gl.onmousemove = function(e) {
	    if (e.dragging) {
	      if (shiftHeld) panEvent(e);
	      else rotateEvent(e);
	      gl.ondraw();
	    }
	  };
	
	  function zoomEvent(e) {
	    const st = document.documentElement.scrollTop;
	    if (e.deltaY < 0) {
	      zoom(true);
	    } else {
	      zoom();
	    }
	  }
	
	  function panEvent(e) {
	    const st = document.documentElement.scrollTop;
	    pan(-e.deltaX, e.deltaY)
	  }
	
	  let lastScrollTop = 0;
	  gl.canvas.onwheel = function (e) {
	    zoomEvent(e);
	    gl.ondraw();
	  }
	  disableScroll(gl.canvas);
	
	  let shiftHeld = false;
	  window.onkeydown = (e) => {
	    shiftHeld = e.key === "Shift" ? true : false;
	  }
	  window.onkeyup = (e) => {
	    shiftHeld = !shiftHeld || e.key === "Shift" ? false : true;
	  }
	
	  let clickHeld = false;
	  window.onclick = (e) => {
	    clickHeld = !clickHeld;
	    if (!clickHeld) {
	      rotationUnit = null;
	      panUnit = null;
	    }
	  }
	
	  window.onmousedown = setPointClicked;
	
	  function viewFrom(point, rotation) {
	      gl.makeCurrent();
	
	      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	      // const relDir1 = GL.Matrix.relitiveDirection(point.x, point.y, point.z, gl.modelviewMatrix);
	      gl.loadIdentity();
	
	      gl.rotate(rotation.x, 1, 0, 0);
	      gl.rotate(rotation.y, 0, 1, 0);
	      gl.rotate(rotation.z, 0, 0, 1);
	
	      gl.translate(0, 0, -20);
	      // const relDir = GL.Matrix.relitiveDirection(point.x, point.y, point.z, gl.modelviewMatrix);
	      // gl.translate(-relDir[0], -relDir[1], -relDir[2]);
	
	      if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
	      // that.lightingShaders.forEach(s => s.draw(that.mesh, gl.TRIANGLES));
	      that.lightingShader.draw(that.mesh, gl.TRIANGLES);
	      if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);
	
	      if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
	      gl.enable(gl.BLEND);
	      that.blackShader.draw(that.mesh, gl.LINES);
	      gl.disable(gl.BLEND);
	      if (Viewer.lineOverlay) gl.enable(gl.DEPTH_TEST);
	  }
	  this.viewFrom = viewFrom;
	
	  function applyZoom() {
	    // const depthArr = GL.Matrix.relitiveDirection(0,0,depth,gl.modelviewMatrix);
	    const transArr = GL.Matrix.relitiveDirection(x,-y,depth,gl.modelviewMatrix);
	    gl.translate(-transArr[0], -transArr[1], transArr[2])
	  }
	
	  var that = this;
	  gl.ondraw = function() {
	    gl.makeCurrent();
	
	    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	    // gl.loadIdentity();
	    applyZoom();
	    gl.rotateAroundPoint(pointClicked, rotationOffset);
	
	    // gl.rotate(angleX, rotationVector.x, rotationVector.y, rotationVector.z);
	    // gl.rotate(angleY, rotationVector.x, rotationVector.y, rotationVector.z);
	    // gl.rotate(rotationOffset[2], 0, 0, -1);
	    x = y = angleX = angleY = rotationOffset[0] = rotationOffset[1] = rotationOffset[2] = depth = 0;
	
	    if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
	    // that.lightingShaders.forEach(s => s.draw(that.mesh, gl.TRIANGLES));
	    that.lightingShader.draw(that.mesh, gl.TRIANGLES);
	    if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);
	
	    if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
	    gl.enable(gl.BLEND);
	    that.blackShader.draw(that.mesh, gl.LINES);
	    gl.disable(gl.BLEND);
	    if (Viewer.lineOverlay) gl.enable(gl.DEPTH_TEST);
	  };
	
	  gl.ondraw();
	
	  // gl.canvas.width = '100vw';
	  // gl.canvas.height = '100vh';
	}
	
	var nextID = 0;
	function addViewer(viewer, id) {
	  du.find(id).appendChild(viewer.gl.canvas);
	}
	
	
	
	
	// left: 37, up: 38, right: 39, down: 40,
	// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
	var keys = {37: 1, 38: 1, 39: 1, 40: 1};
	
	function preventDefault(e) {
	  e.preventDefault();
	}
	
	function preventDefaultForScrollKeys(e) {
	  if (keys[e.keyCode]) {
	    preventDefault(e);
	    return false;
	  }
	}
	
	// modern Chrome requires { passive: false } when adding event
	var supportsPassive = false;
	try {
	  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
	    get: function () { supportsPassive = true; }
	  }));
	} catch(e) {}
	
	var wheelOpt = supportsPassive ? { passive: false } : false;
	var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
	
	// call this to Disable
	function disableScroll(element) {
	  element.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
	  element.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
	  element.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
	  element.addEventListener('keydown', preventDefaultForScrollKeys, false);
	}
	
	// call this to Enable
	function enableScroll(element) {
	  element.removeEventListener('DOMMouseScroll', preventDefault, false);
	  element.removeEventListener(wheelEvent, preventDefault, wheelOpt);
	  element.removeEventListener('touchmove', preventDefault, wheelOpt);
	  element.removeEventListener('keydown', preventDefaultForScrollKeys, false);
	}
	
	exports.Viewer = Viewer
	exports.addViewer = addViewer
	exports.preventDefault = preventDefault
	exports.preventDefaultForScrollKeys = preventDefaultForScrollKeys
	exports.disableScroll = disableScroll
	exports.enableScroll = enableScroll
	
});


RequireJS.addFunction('./public/js/utils/3d-modeling/shaders/illuminate-all.vert.js',
function (require, exports, module) {
	module.exports = `varying vec3 color;
	varying vec3 normal;
	varying vec3 light;
	void main() {
	  color = gl_Color.rgb;
	  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	}
	
	,
	
	varying vec3 color;
	varying vec3 normal;
	varying vec3 light;
	void main() {
	  gl_FragColor = vec4(color, 1.0);
	}
	`
});


RequireJS.addFunction('./public/js/utils/3d-modeling/shaders/light-direction.frag.js',
function (require, exports, module) {
	module.exports = `varying vec3 color;
	varying vec3 normal;
	varying vec3 light;
	void main() {
	  const vec3 lightDir = vec3({{x}}, {{y}}, {{z}}) / 3.741657386773941;
	  light = (gl_ModelViewMatrix * vec4(lightDir, 0.005)).xyz;
	  color = gl_Color.rgb;
	  normal = gl_NormalMatrix * gl_Normal;
	  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	}
	
	,
	
	varying vec3 color;
	varying vec3 normal;
	varying vec3 light;
	void main() {
	  vec3 n = normalize(normal);
	  float diffuse = max(0.0, dot(light, n));
	  float specular = pow(max(0.0, -reflect(light, n).z), 32.0) * sqrt(diffuse);
	  gl_FragColor = vec4(mix(color * (0.3 + 0.7 * diffuse), vec3(1.0), specular), 1.0);
	}
	`
});


RequireJS.addFunction('./public/js/utils/3d-modeling/shaders/ray-trace-func.unfinished.js',
function (require, exports, module) {
	module.exports = `// should probably start with this project
	// https://github.com/kamyy/webgl-ray-tracer?tab=readme-ov-file
	// algorithm wiki
	// https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
	
	uniform vec4 triangles[12];
	
	unk ray_intersects_triangle(vec4 ray_origin,
	    vec4 ray_vector,
	    vec4 triangle[3])
	{
	    float epsilon = .000000001;
	
	    vec3 edge1 = triangle[1] - triangle[0];
	    vec3 edge2 = triangle[2] - triangle[0];
	    vec3 ray_cross_e2 = cross(ray_vector, edge2);
	    float det = dot(edge1, ray_cross_e2);
	
	    if (det > -epsilon && det < epsilon)
	        return {};    // This ray is parallel to this triangle.
	
	    float inv_det = 1.0 / det;
	    vec3 s = ray_origin - triangle[0];
	    float u = inv_det * dot(s, ray_cross_e2);
	
	    if ((u < 0 && abs(u) > epsilon) || (u > 1 && abs(u-1) > epsilon))
	        return {};
	
	    vec3 s_cross_e1 = cross(s, edge1);
	    float v = inv_det * dot(ray_vector, s_cross_e1);
	
	    if ((v < 0 && abs(v) > epsilon) || (u + v > 1 && abs(u + v - 1) > epsilon))
	        return {};
	
	    // At this stage we can compute t to find out where the intersection point is on the line.
	    float t = inv_det * dot(edge2, s_cross_e1);
	
	    if (t > epsilon) // ray intersection
	    {
	        return  vec3(ray_origin + ray_vector * t);
	    }
	    else // This means that there is a line intersection but not a ray intersection.
	        return {};
	}
	
	
	void main(void) {
	  const vec3 ray_origin = vec3(100, 100, 100);
	  const vec3 ray_vector = vec3(0.57735, 0.57735, 0.57735);
	  for(int i = 0; i < 12; i++) {
	     vec3 lightDirection = normalize(uLightPosition[i], vPosition.xyz);
	     if (uLightIsDirectional[i]) {
	       reflectedLightColor += max(dot(vTransformedNormal, uLightDirection[i]), 0.0) * uLightColor[i];
	     }
	     else  {
	       reflectedLightColor += max(dot(normalize(vTransformedNormal, lightDirection), 0.0) * uLightColor[i];
	     }
	  }
	
	 glFragColor = vec4(uAmbientColor + reflectedLightColor * vColor, uAlpha);
	}
	`
});


RequireJS.addFunction('./public/js/utils/3d-modeling/shaders/realistic-light-shader.frag.js',
function (require, exports, module) {
	module.exports = `uniform vec3 uLightPosition[16];
	uniform vec3 uLightColor[16];
	uniform vec3 uLightDirection[16];
	uniform bool uLightIsDirectional[16];
	
	uniform vec3 uAmbientColor;
	
	varying vec4 vPosition;
	varying vec3 vTransformedNormal;
	varying vec3 vColor;
	
	void main(void) {
	 vec3 reflectedLightColor;
	
	 for(int i = 0; i < 16; i++) {
	   vec3 lightDirection = normalize(uLightPosition[i], vPosition.xyz);
	   if (uLightIsDirectional[i]) {
	     reflectedLightColor += max(dot(vTransformedNormal, uLightDirection[i]), 0.0) * uLightColor[i];
	   }
	   else  {
	     reflectedLightColor += max(dot(normalize(vTransformedNormal, lightDirection), 0.0) * uLightColor[i];
	   }
	 }
	
	 glFragColor = vec4(uAmbientColor + reflectedLightColor * vColor, uAlpha);
	}
	`
});


RequireJS.addFunction('./public/js/utils/3d-modeling/shaders/wire-frame.vert.js',
function (require, exports, module) {
	module.exports = `void main() {
	  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	}
	
	,
	
	void main() {
	  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);
	}
	`
});


RequireJS.addFunction('./public/js/utils/test/tests/STL.js',
function (require, exports, module) {
	
const STL = require('../../3d-modeling/STL.js');
	const OrientationArrows = require('../../display/orientation-arrows.js');
	const $t = require('../../$t.js');
	$t.loadFunctions(require('../../../../../services/cabinet/generated/html-templates.js'));
	
	require('../../3d-modeling/csg');
	require('../../utils');
	const du = require('../../dom-utils');
	const Viewer = require('../../3d-modeling/viewer.js').Viewer;
	const addViewer = require('../../3d-modeling/viewer.js').addViewer;
	
	function addLink (model, name) {
	  const stl = STL.fromCSG(model, name);
	  console.log(model.toDrawString());
	  du.copy(model.toDrawString());
	
	  const link = document.createElement('a');
	  link.innerText = name;
	  link.href = URL.createObjectURL(stl.binary.file());
	  link.download = name.toKebab() + '.stl';
	
	  // document.body.append(link);
	  link.click();
	  // link.remove();
	}
	
	let individual = false;
	function addLinks(modelOmodels, name) {
	  if (modelOmodels instanceof CSG) addLink(modelOmodels, name);
	  else {
	    if (individual) Object.keys(modelOmodels).forEach(k => addLink(modelOmodels[k], k));
	    else {
	      let collective = new CSG();
	      Object.keys(modelOmodels).forEach(k => collective = collective.union(modelOmodels[k]));
	      addLink(collective, name);
	    }
	  }
	}
	
	const models = {};
	
	models['Axis'] = (length, diameter, isVector) => {
	  length ||= 18; diameter ||= .5;
	  const hl = length / 2;
	  const hd = diameter / 2;
	  const start = [-hl,hd,0];
	  const end = isVector ? new CSG.Vector([hl,0,hd*2]) : [hl,hd,0];
	  let lineDisplayType;
	  if (isVector) lineDisplayType = CSG.Line.DISPLAY_TYPES.VECTOR;
	  const axis = new CSG.Line({start,end, radius: hd, color: 'blue', lineDisplayType});
	  let base = new CSG.cube({radius: [hl, hd/2, hd/2], center: [0,hd/2,0]});
	  const elivated = axis.clone();
	  elivated.translate({x:0,y:10,z:0});
	  const ss = .2;
	  const gap = .25;
	  const chopper = new CSG.cube({radius:[gap/2,hd,hd], center: [-hl+gap/2+ss,hd,0]});
	  const offset = {x:gap+ss,y:0,z:0};
	  for (let index = 0; index < 100; index++) {
	    base = base.subtract(chopper);
	    chopper.translate(offset);
	  }
	
	
	  return axis;// base.subtract(axis).union(axis);//.subtract(axis);//elivated.union(base);
	};
	
	models['Shower Wheel Thingy!'] = (one,two) => {
	  let height = 1.5*2.54;
	  let width = 1 * 2.54;
	  let wheelScrewCenterZ = (5/16) * -2.54;
	  let glassThickness = (1/4) * 2.54;
	  let glassScrewCenter = [0, .5*2.54, glassThickness - .1];
	  let gsc = glassScrewCenter;
	  let flapThickness = (1/16) * 2.54;
	  let screwThickness = .5;
	  let smallBackThickness = .3
	  let sbt = smallBackThickness;
	  let supportCylRad = (13/32) * 2.54/2;
	  let scr = supportCylRad;
	  let notchThickness = .08;
	  let slices = 48;
	  const cylinder = new CSG.cylinder({slices, start: [0,0,0], end: [0,height,0], radius: width/2});
	  const glassCutter = new CSG.cube({radius: [width, height/2, glassThickness/2], center: [0,(height/2) - flapThickness, glassThickness/2]});
	  const backNotchCutter = new CSG.cube({radius: [width/2, notchThickness, notchThickness]});
	  // backNotchCutter.rotate({x:45,y:0,z:0});
	  backNotchCutter.center({x:0, y:(height) - flapThickness, z: glassThickness})
	  const wheelScrewCyl = new CSG.cylinder({slices, radius: screwThickness/2 + .01, start: [0,0,wheelScrewCenterZ], end: [0,height,wheelScrewCenterZ]});
	  const topScrewResess = new CSG.cylinder({slices, radius: .8/2 + .1, start: [0,height - (7/32)*2.54/2, wheelScrewCenterZ], end: [0,height, wheelScrewCenterZ]});
	  const bottomScrewResess = new CSG.cylinder({slices, radius: .8/2 + .01, start: [0,(7/32)*2.54/2, wheelScrewCenterZ], end: [0,0, wheelScrewCenterZ]});
	  const backScrewCyl = new CSG.cylinder({slices, radius: 1.09/2 - .01, start: [0,gsc[1], 0], end: [0,gsc[1], gsc[2]]});
	  const backScrewHole = new CSG.cylinder({slices, radius: .4/2 + .01, start: [0,gsc[1], gsc[2] - 1], end: [0,gsc[1], 100]});
	  const backScrewResess = new CSG.cylinder({slices, radius: .8/2, start: [0,gsc[1], width/2], end: [0,gsc[1], width/2 - (1/8) * 2.54]});
	  const backScrewWell = new CSG.cylinder({slices, radius: .3, start: [0,gsc[1], -1], end: [0,gsc[1], gsc[2] - .2]});
	  const wheelCavity = new CSG.cube({radius: [100, ((15/16)*2.54)/2 - .01, width/2 - sbt], center: [0, height/2, width/-2 + sbt/2]})
	  const supportCylR = new CSG.cylinder({slices, radius: scr, start: [width/2-scr, .635, 0], end: [width/2-scr, 2.54 + .635, 0]}).subtract(glassCutter);
	  const supportCylL = new CSG.cylinder({slices, radius: scr, start: [width/-2+scr, .635, 0], end: [width/-2+scr, 2.54 + .635, 0]}).subtract(glassCutter);
	
	  let supportSqR = new CSG.cube({radius: [scr,height/2,scr], center: [width/2-scr, height/2, scr/2]}).subtract(glassCutter);
	  let supportSqL = new CSG.cube({radius: [scr,height/2,scr], center: [width/-2+scr, height/2, scr/2]}).subtract(glassCutter);
	
	  const plierSlot = new CSG.cube({radius: [(3/16)*2.54/2, (7/32)*2.54/2, 5], center: [0,height,-5]});
	  const backAngle = new CSG.cube({radius: [1.5*2.54/2, 1.5*2.54/2, .5/2], center: [0,0,0]});
	  backAngle.rotate({x:-45});
	  backAngle.translate([0,height,(width)/2.54+.1]);
	  const crossSection = new CSG.cube({radius: [50,50,50], center: [0,0,50]});
	  let body = cylinder.subtract(glassCutter)
	    .subtract(wheelScrewCyl)
	    .subtract(topScrewResess)
	    .subtract(bottomScrewResess)
	    .subtract(backScrewResess)
	    .union(backScrewCyl)
	    .subtract(wheelCavity)
	    .union(supportCylR)
	    .union(supportCylL)
	    .union(supportSqR)
	    .union(supportSqL)
	    .subtract(backAngle)
	    .subtract(plierSlot)
	    .subtract(backNotchCutter)
	    .subtract(backScrewWell)
	    .subtract(backScrewHole)
	  body.rotate({y:90});
	  const pilotHole = new CSG.cylinder({slices, radius: .14, start: [0,gsc[1], -1], end: [0,gsc[1], gsc[2] + .2]});
	  const dowel = backScrewCyl.intersect(backScrewHole.union(backScrewWell)).subtract(pilotHole);
	  dowel.scale(.95);
	  // body = body.subtract(crossSection);
	  return {body, dowel};
	}
	
	models['Rack'] =  (one)  => {
	  const w = 1.93;
	  const h = 3.5;
	  const t = 1;
	  const cw = .75;
	  const ct = t + 2;
	  const blockCenter = {x:cw+w/2, y:h/2, z:t/2};
	  const _3_32 = 0.238125;
	  const _3_16 = _3_32*2;
	  let block = new CSG.cube({radius: [w/2, h/2, t/2], center: blockCenter});
	  const through = new CSG.cylinder({slices: 8, start: [0,0,0], end: [0,0,ct/2], radius: _3_32});
	  through.center(blockCenter);
	  const recess = new CSG.cylinder({slices: 8, start: [0,0,0], end: [0,0,ct/4], radius: _3_16});
	  recess.center({x:blockCenter.x, y:blockCenter.y, z:t-t/4})
	  block = block.subtract(through).subtract(recess);
	
	  const cer = cw*.6;
	  let clip = new CSG.cube({radius: [cw/2, h/2, ct/2], center: [cw/2, h/2, ct/2]});
	  const champherLeft = new CSG.cube({radius: [w/10,h*2,w/10]});
	  champherLeft.rotate({y:45});
	  champherLeft.rotate({x:-45});
	  champherLeft.center({x: 0, y:h, z:2*ct/4});
	  clip = clip.subtract(champherLeft);
	  const champherRight = champherLeft.clone();
	  champherLeft.center({x: 0, y:0, z:2*ct/4});
	  champherLeft.rotate({x:90});
	  clip = clip.subtract(champherLeft);
	  champherRight.translate({x: cw, z:0, y:0});
	  champherLeft.translate({x: cw, z:0, y:0});
	  clip = clip.subtract(champherRight).subtract(champherLeft);
	
	  const clipEnd = new CSG.cylinder({start: [0,0,0], end: [0,h,0], radius: cer});
	  clipEnd.center({x: cw/2, y:h/2, z:ct-cer/2});
	
	  const clip2 = clip.clone();
	  const translation = {x: w + cw, y:0, z:0};
	  clip2.translate(translation)
	  const blockClip2 = block.union(clip2);
	  let m = clip.union(blockClip2);
	  const spots = 6;
	  for (let i = 0; i < spots; i++) {
	    blockClip2.translate(translation);
	    m = m.union(blockClip2);
	  }
	
	  const dems = m.demensions();
	  const epts = m.endpoints();
	  const champher = new CSG.cube({radius: [dems.x*2,h/3,h/3]});
	  champher.rotate({x:45})
	  champher.center({x:dems.x/2, y:epts.y, z:epts.z});
	  m = m.subtract(champher);
	  champher.center({x:dems.x/2, y:0, z:epts.z});
	  m = m.subtract(champher);
	
	  const bAse = m.clone();
	  bAse.rotate({x:-90});
	  bAse.translate({x:0,y:0,z:h});
	  let mBase = m.union(bAse);
	  mBase.translate({x:0, y:0, z:h + .3});
	  m.rotate({x:-90});
	  m.translate({x:0,y:0,z:h});
	  mBase.polygons.concatInPlace(m.polygons);
	  return mBase;
	}
	
	models['Sink Drain Plate'] =  (isTpuSeal)  => {
	  const diameter = (2/16 + 3.25) * 2.54;
	  const overhang = 3*2.54 / 8;
	  const sealRingWidth = 2.54/8;
	  const thickness = 2.54/4;
	  const subThickness = 2.54/2;
	  const subWallThickness = 2.54/4;
	  const solidBottomRadius = diameter / 2 - sealRingWidth;
	  let topPlate = new CSG.cylinder({start: [0,0,0], end: [0,thickness,0], radius: diameter/2 + overhang});
	
	  let bottomStructure = new CSG.cylinder({start: [0,0,0], end: [0,-subThickness,0], radius: solidBottomRadius});
	  const stopperWidth = sealRingWidth/3;
	  let sealStopper = new CSG.cylinder({start: [0,-subThickness,0], end: [0,-subThickness + stopperWidth,0], radius: diameter / 2 - stopperWidth});
	  sealStopper = sealStopper.subtract(bottomStructure);
	  let sealRing = new CSG.cylinder({start: [0,-subThickness+stopperWidth,0], end: [0,-subThickness + sealRingWidth + stopperWidth,0], radius: diameter / 2});
	  let sealRing2 = new CSG.cylinder({start: [0,-subThickness+stopperWidth,0], end: [0,-subThickness + sealRingWidth + stopperWidth,0], radius: diameter / 2 + 2.54/16});
	  sealRing2 = sealRing2.subtract(bottomStructure);
	  sealRing2.translate({x: 3.5*2.54, y:0,z:0});
	  sealRing = sealRing.subtract(bottomStructure);
	  sealRing = sealRing.union(sealRing2);
	  sealRing.setColor('black');
	  const bottomCutter = new CSG.cylinder({start: [0,0,0], end: [0,-subThickness,0], radius: solidBottomRadius - subWallThickness/2});
	  bottomStructure = bottomStructure.subtract(bottomCutter);
	  const structureSupport = new CSG.cube({radius: [solidBottomRadius - .1, subThickness/2, subWallThickness/2], center: [0,-subThickness/2,0]});
	
	  let sideChannel = new CSG.cylinder({slices: 8, start: [diameter, 0,0], end: [-diameter, 0, 0], radius: 3*thickness/4});
	  const centerSupportRadius = 2*solidBottomRadius/3;
	  const sideChannelCutter = new CSG.cube({radius: [centerSupportRadius, subThickness, centerSupportRadius], center: [0,0, 0]});
	  sideChannel = sideChannel.subtract(sideChannelCutter);
	
	  const handleWidth = .9*centerSupportRadius;
	  const handleYoff = 2.54;
	  const legRadius = 2*thickness/3
	  let handle =  new CSG.cube({radius: [handleWidth, thickness, thickness/2], center: [0,thickness + handleYoff,0]});
	  const handleLeg = new CSG.cylinder({slices: 4, start:[0,-subThickness,0], end: [0,subThickness+handleYoff,0], radius: legRadius});
	  handleLeg.rotate({x:0, y:45,z:0});
	  handleLeg.translate({x:handleWidth - legRadius,y:0,z:0});
	  handle = handle.union(handleLeg);
	  handleLeg.translate({x:-2*handleWidth + 2*legRadius,y:0,z:0});
	  handle = handle.union(handleLeg);
	  handle.rotate({x:0, y:-30,z:0});
	
	  const explodedHandle = handle.clone();
	  explodedHandle.explode(.1);
	  // topPlate = topPlate.subtract(handle);
	
	  structureSupport.rotate({x:0,y:15,z:0});
	  bottomStructure = bottomStructure.union(structureSupport);
	  structureSupport.rotate({x:0,y:90,z:0});
	  bottomStructure = bottomStructure.union(structureSupport);
	  let model = topPlate;
	  model.polygons.concatInPlace(bottomStructure.polygons.concat(sealStopper.polygons));
	  sealStopper.translate({x:0,y:sealRingWidth+stopperWidth+.03,z:0});
	  for (let index = 0; index < 6; index ++) {
	    model  = model.subtract(sideChannel);
	    sideChannel.rotate({x:0, y: 180/6, z:0});
	  }
	
	  model = model.union(sealStopper);
	  model.polygons.concatInPlace(handle.polygons);
	  return isTpuSeal ? sealRing : model;
	}
	
	models['hingeRouterFence'] =  (isStopper, plateWidth, plateDepth, bitSize, routerDiameter, plateCornerRadius, slotWidth)  => {
	  plateWidth ||= 4*2.54;
	  plateDepth ||= 1.75 * 2.54;
	  routerDiameter ||= 4*2.54;
	  bitSize ||= 2.54/2;
	  plateCornerRadius ||= 2.54/2;
	  routerRadius = routerDiameter/2 - bitSize/2;
	  slotWidth ||= 3*2.54/16;
	  const cutterRadius = routerRadius + plateCornerRadius;
	
	  const gerth = 2;
	  const width = plateWidth + routerRadius*2 + .01;
	  const height = plateDepth + routerRadius*2;
	  let fence = new CSG.cube({radius: [(width + gerth*2)/2, gerth/4, (height+gerth)/2], center: [0,0, 0]});
	  let stopper = new CSG.cube({radius: [(width + gerth*2)/2, gerth/4, gerth/2], center: [0,0, 0]});
	  const squareCutter = new CSG.cube({radius: [width/2 - cutterRadius, gerth/2, height/2], center: [0,0, 0]});
	  const freeSideCutter = new CSG.cube({radius: [width/2, gerth, height/2 + gerth], center: [0,0, 0]});
	  freeSideCutter.translate({x:0,y:0,z:-cutterRadius-gerth});
	
	  const roundCutterLeft = new CSG.cylinder({start: [width/2 - cutterRadius, -gerth, height/2 - cutterRadius],
	                                            end: [width/2 - cutterRadius, gerth, height/2 - cutterRadius],
	                                            radius: cutterRadius,
	                                            slices:32
	                                          });
	  const roundCutterRight = roundCutterLeft.clone();
	  roundCutterRight.translate({x: -width + 2*cutterRadius,y:0,z:0});
	
	  const adjustmentGrooveRight = new CSG.cube({radius: [slotWidth/2, gerth, (height-gerth)/2,], center: [width/2 + gerth/2, 0,0]});
	  const adjustmentGrooveLeft = adjustmentGrooveRight.clone();
	  adjustmentGrooveLeft.translate({x:-width - gerth, y:0, z:0});
	
	  const threeSixtenths = new CSG.cylinder({slices: 24, radius: slotWidth/2});
	  threeSixtenths.center(adjustmentGrooveLeft.center());
	  stopper = stopper.subtract(threeSixtenths);
	  threeSixtenths.center(adjustmentGrooveRight.center());
	  stopper = stopper.subtract(threeSixtenths);
	
	  stopper.rotate({x:90,y:0,z:0});
	  stopper.setColors(String.color.next);
	  if (isStopper) return stopper;
	  fence = fence.subtract(roundCutterLeft).subtract(roundCutterRight);
	  const model = fence.subtract(freeSideCutter).subtract(squareCutter).subtract(adjustmentGrooveRight).subtract(adjustmentGrooveLeft);
	  model.rotate({x:90,y:0,z:0});
	  model.setColors(String.color.next);
	  return model;
	}
	
	models['Well Spacer'] =  (width, length, depth, slot, lipOverlay, lipThickness, lengthOffset)  => {
	  width ||= 3*2.54/8 - .01;
	  length ||= (1.75 * 2.54 + 3)*2; -.01;
	  depth ||= 2.9;
	  slot ||= 3*2.54/16;
	  lipOverlay ||= .5;
	  lipThickness ||= 2.54/8;
	  const offset = lengthOffset || width-slot;
	  const well = new CSG.cube({radius: [width/2,length/2,depth/2]});
	  const lip = new CSG.cube({radius: [width/2 + lipOverlay, length/2+lipOverlay, lipThickness/2],
	                            center: [0,0,depth/2 - lipThickness/4]});
	  const slotCutter = new CSG.cube({radius: [slot/2, length/2 - offset/2, depth]});
	  return well.union(lip).subtract(slotCutter);
	};
	
	models['screen door latch spacer'] = () =>{
	  let offset = 2.54/2 - 2.54/16;
	  let stepLen = 5*2.54/16;
	  let stepHeight = 2.54/2 + 2.54/16;
	  let length = 5*2.54/2;
	  let width = 3*2.54/4;
	  const spacer = new CSG.cube({radius: [width/2,length/2,offset/2]});
	  const step = new CSG.cube({radius: [(width - stepLen)/2, length/2, stepHeight/2],
	                        center: [width/2 - (width - stepLen)/2, 0, offset/2 + stepHeight/2]});
	  let topScrewHole = new CSG.cylinder({slices: 8, start: [.2,0,-stepHeight - offset],
	                                    radius: 3*2.54/32, end: [.2,0,stepHeight + offset]});
	  let topScrewResess = new CSG.cylinder({slices: 8, start: [.2,0, -offset/2],
	                                    radius: 5*2.54/32, end: [.2,0, -offset/2 + 3*2.54/16 ]});
	  topScrewHole = topScrewHole.union(topScrewResess);
	  const bottomScrewHole = topScrewHole.clone();
	  topScrewHole.translate({x:0,y:length/2 - 2.54/4,z:0});
	  bottomScrewHole.translate({x:0,y:length/-2 + 2.54/4,z:0});
	  return spacer.union(step).subtract(topScrewHole).subtract(bottomScrewHole);
	}
	
	models['screen door latch'] = () =>{
	  const barRadius = 5*2.54/32 - .01;
	  const bar = new CSG.cube({radius: [barRadius, barRadius, 3]});
	  return bar;
	}
	
	models['shifter boot bracket'] = (innerWidth, innerDepth, innerHeight, bracketWidth, bracketHeight,
	                      innerLip, bracketThickness, topHoleDia, bottomHoleDia, champherAngle,
	                      champherDepth, prongHeight, prongDia) => {
	  innerWidth ||= 10;
	  innerDepth ||= 13.75;
	  innerHeight ||= 3;
	  bracketWidth ||= 3.9;
	  bracketHeight ||= 1.5;
	  innerLip ||= 1;
	  bracketThickness ||= .25;
	  topHoleDia ||= 1;
	  bottomHoleDia ||= 3*2.54/16;
	  champherAngle ||= 45;
	  champherDepth ||= 2;
	  prongHeight ||= .9;
	  prongDia ||= .3;
	
	  const bt = bracketThickness;
	
	  const insideCutout = new CSG.cube({demensions: [innerWidth, innerHeight, innerDepth]});
	  const dbw = bracketWidth * 2;
	  let bracket = new CSG.cube({demensions: [innerWidth+dbw, bracketHeight, innerDepth+dbw]});
	  bracket.translate({x: 0, y: innerHeight/2-bracketHeight/2, z: 0});
	  bracket = bracket.subtract(insideCutout);
	
	  const champerBracket = (innerLen, rotation, offset, direction, xOz) => {
	    const champher = new CSG.cube({demensions: [champherDepth, champherDepth, 100]});
	    let underCut = new CSG.cube({demensions: [champherDepth, champherDepth, innerLen]});
	
	    const x = xOz ? 'x' : 'z';
	    const z = xOz ? 'z' : 'x';
	    const depth = xOz ? innerDepth : innerWidth;
	    const width = xOz ? innerWidth : innerDepth;
	    const radius = 6;
	    const hype = Math.sqrt((radius)*(radius)*2)/2
	
	    let innerMiter1 = new CSG.cube({radius});
	    const innerOffset1 = new CSG.Vector(offset).clone();
	    innerOffset1[z] = -depth/2 - hype;
	    innerOffset1[x] = direction * (-width/2 + hype);
	    innerMiter1.rotate({y:-45});
	    innerMiter1.translate(innerOffset1);
	
	    let innerMiter2 = new CSG.cube({radius});
	    const innerOffset2 = new CSG.Vector(offset).clone();
	    innerOffset2[z] = depth/2 + hype;
	    innerOffset2[x] = direction * (-width/2 + hype);
	    innerMiter2.rotate({y:-45});
	    innerMiter2.translate(innerOffset2);
	
	
	    champher.rotate(rotation);
	    underCut.rotate(rotation);
	    champher.translate(offset);
	    underCut.translate(offset);
	    const translation = {y: -Math.sin(Math.toRadians(45)) * (bt + champherDepth), x:0, z:0};
	    if (xOz) translation.x = direction * Math.cos(Math.toRadians(45)) * (bt + champherDepth);
	    else translation.z = direction * Math.cos(Math.toRadians(45)) * (bt + champherDepth);
	    underCut.translate(translation);
	    underCut = underCut.subtract(innerMiter1).subtract(innerMiter2);
	    bracket = bracket.subtract(champher).subtract(underCut);
	  }
	
	  let rotation = {z:champherAngle};
	  let offset = {x: innerWidth/2 + bracketWidth, y: innerHeight/2, z:0};
	  champerBracket(innerDepth+bracketWidth*2, rotation, offset, -1, true);
	
	  rotation = {z:-champherAngle};
	  offset = {x: -(innerWidth/2 + bracketWidth), y: innerHeight/2, z:0};
	  champerBracket(innerDepth+bracketWidth*2, rotation, offset, 1, true);
	
	  rotation = [{y: 90}, {x:-champherAngle}];
	  offset = {z: -(innerDepth/2 + bracketWidth), y: innerHeight/2, x:0};
	  champerBracket(innerWidth+bracketWidth*2, rotation, offset, 1, false);
	
	  rotation = [{y: 90}, {x:champherAngle}];
	  offset = {z: innerDepth/2 + bracketWidth, y: innerHeight/2, x:0};
	  champerBracket(innerWidth+bracketWidth*2, rotation, offset, -1, false);
	
	  const dil = innerLip * 2;
	  const dbt = bracketThickness * 2
	  const dilAdbt = dil + dbt;
	  let squareSupport = new CSG.cube({demensions: [innerWidth + dilAdbt, innerHeight, innerDepth+dilAdbt]});
	  const squareSupportCutter = new CSG.cube({demensions: [innerWidth + dil, innerHeight, innerDepth+dil]});
	  squareSupportCutter.translate({x:0,y:-bracketThickness,z:0});
	  let model = bracket.union(squareSupport).subtract(squareSupportCutter).subtract(insideCutout);
	
	
	  const slices = 48;
	  const hole = new CSG.cylinder({slices, start: [0,-innerHeight/2 + bt, 0], end: [0,100,0], radius: topHoleDia/2});
	  const screwWell = new CSG.cylinder({slices, start: [0,-innerHeight/2, 0], end: [0,innerHeight/2,0], radius: topHoleDia/2 + bt});
	  const pilotHole = new CSG.cylinder({slices, start: [0,-100, 0], end: [0,100,0], radius: bottomHoleDia/2});
	
	  offset = {x: innerWidth/2 + topHoleDia/2 + dbt/2, z: innerDepth/2 + topHoleDia/2 + dbt/2, y:0};
	  hole.translate(offset);
	  screwWell.translate(offset);
	  pilotHole.translate(offset);
	  model = model.union(screwWell).subtract(hole).subtract(pilotHole);
	
	  offset = {x: -(innerWidth + topHoleDia + dbt), z:0 , y:0};
	  hole.translate(offset);
	  screwWell.translate(offset);
	  pilotHole.translate(offset);
	  model = model.union(screwWell).subtract(hole).subtract(pilotHole);
	
	  offset = {x: 0, z: -(innerDepth + topHoleDia + dbt), y:0};
	  hole.translate(offset);
	  screwWell.translate(offset);
	  pilotHole.translate(offset);
	  model = model.union(screwWell).subtract(hole).subtract(pilotHole);
	
	  offset = {x: innerWidth + topHoleDia + dbt, z:0 , y:0};
	  hole.translate(offset);
	  screwWell.translate(offset);
	  pilotHole.translate(offset);
	  model = model.union(screwWell).subtract(hole).subtract(pilotHole);
	
	  let start = [0, innerHeight/2 - bracketThickness, 0];
	  let end = [0, innerHeight/2 - bracketThickness - 2*prongHeight/3, 0];
	  let prong = new CSG.cylinder({slices, start, end, radius: prongDia/2});
	  start = end;
	  end = [0, innerHeight/2 - bracketThickness - prongHeight, 0];
	  let coneTip = new CSG.cone({slices, start, end, radius: prongDia/2, color: 'red'});
	  let bluntTip = new CSG.cube({radius:.1, center: end});
	  prong = prong.union(coneTip.subtract(bluntTip));
	
	  const y = prong.center().y;
	  const x = 5.2;
	  const z = 7.075;
	  const prongPoints = [
	    {x: -2.95, y, z},
	    {x: 1.65, y, z},
	    {x: 2.95, y, z},
	    {x, y, z: -5.24},
	    {x, y, z: -1.785},
	    {x, y, z: 1.785},
	    {x, y, z: 5.24},
	    {x: 2.95, y, z: -z},
	    {x: -2.95, y, z: -z},
	    {x: -x, y, z: 5.24},
	    {x: -x, y, z: 1.785},
	    {x: -x, y, z: -1.785},
	    {x: -x, y, z: -5.24}
	  ];
	
	  prongPoints.forEach(p => {
	    prong.center(p);
	    model = model.union(prong);
	  });
	
	  let prongClip = new CSG.cylinder({slices, radius: .5, start: [0,0,0], end: [0,.3,0]});
	  let splitCone = new CSG.cone({slices, radius: .5, start: [0,0,0], end: [0,.6,0]});
	  // prongClip = prongClip.subtract(splitCone);
	  const splitConeCavity = new CSG.cone({slices, radius: .4, start: [0,0,0], end: [0,.4,0]});
	  splitCone = splitCone.subtract(splitConeCavity);
	  splitter = new CSG.cube({demensions: [10, 10, .08]});
	  splitCone = splitCone.subtract(splitter);
	  splitter.rotate({y:60});
	  splitCone = splitCone.subtract(splitter);
	  splitter.rotate({y:60});
	  splitCone = splitCone.subtract(splitter);
	  // prongClip = splitCone.union(prongClip);
	  const prongHole = new CSG.cylinder({slices, radius: prongDia/2 - .01, start: [0,-10,0], end: [0,10,0]});
	  prongClip = prongClip.subtract(prongHole);
	  prongClip.rotate({x:90})
	
	  return prongClip;
	}
	
	models['Blum Narrow Rear Bracket Jig'] = () => {
	  const height = 7.5;
	  const width = 4;
	
	  const sleeveOuterRadius = .435;
	  const retainingLip = .1;
	  const sleeveInnerRadius = sleeveOuterRadius - retainingLip;
	  const sleeveLength = 2.54/2;
	  const thickness = sleeveLength + .01 + retainingLip*2;
	
	  const slices = 128;
	
	  let body = new CSG.cube({demensions: [width, height, thickness]});
	
	  const steps = [{length: sleeveLength, radius: sleeveOuterRadius + .05},
	                  {length: thickness*2, radius: sleeveInnerRadius}];
	  const stepCyl = new CSG.cylinder.step(steps, {slices});
	
	  const holeCenters = [{x:-width/2+1.44,y:-height/2+1.6, z:0},
	                        {x:-width/2+2.88,y:-height/2+4.6, z:0}];
	
	  holeCenters.forEach(c => {
	    stepCyl.center(c);
	    body = body.subtract(stepCyl);
	  });
	
	  const cornerCutter = new CSG.cylinder({start:[0,0,0], end: [0,0,thickness*2], radius: 2.54/2, slices});
	  const corners = [{x: width/2, y: height/2, z:0}, {x: -width/2, y: height/2, z:0}, {x: width/2, y: -height/2, z:0}]
	  corners.forEach(c => {
	    cornerCutter.center(c);
	    body = body.subtract(cornerCutter);
	  });
	
	  const champh = .5;
	  const champerCorner = new CSG.cube({demensions: [champh,champh*4,champh*4]});
	  champerCorner.rotate({z:45});
	  champerCorner.center({x:-width/2, y:-height/2, z:0});
	
	  body = body.subtract(champerCorner);
	
	  return body;//.union(champerCorner);// base.subtract(axis).union(axis);//.subtract(axis);//elivated.union(base);
	};
	
	models['Uberest Drawer Jigs'] = (guideHeight, guideReveal, bottomGap,
	      bumperThickness, sleeveOuterRadius, retainingLip, sleeveLength,
	      innerRailHeight, innerRailInsetDepth) => {
	  bumperThickness ||= 2.54/8;
	  guideHeight ||= 3.95
	  guideReveal ||= 2.54/16;
	  bottomGap ||= 2.54/8;
	  retainingLip ||= .1;
	  sleeveOuterRadius ||= .435;
	  sleeveInnerRadius = sleeveOuterRadius - retainingLip;
	  sleeveLength ||= 2.54/2;
	  innerRailHeight ||= 2;
	  innerRailInsetDepth ||= .2;
	  thickness = sleeveLength + .01 + retainingLip*2;
	  const minDbGuideReveal = 2.54/4;
	
	  const centerCabinetGuide = {
	    y: guideHeight/2 + bottomGap + minDbGuideReveal, x: .65 + guideReveal, z:thickness/2
	  }
	  let cabinetGuideJig = new CSG.cube.champhered({radius: [centerCabinetGuide.x, centerCabinetGuide.y, thickness/2], edges: [true], depth: .2});
	  cabinetGuideJig.center({x: centerCabinetGuide.x, y:centerCabinetGuide.y, z: thickness/2})
	
	  const lipSize = [2.54/4, centerCabinetGuide.y * 2 + 2.54/2, thickness + 2.54/2];
	  const lipCenter = [lipSize[0]/-2, lipSize[1]/2 - 2.54/4, lipSize[2]/2 - 2.54/4];
	  const lip = new CSG.cube({demensions: lipSize, center: lipCenter})
	
	  const slices = 128;
	  // const steps = [{length: sleeveLength, radius: sleeveOuterRadius + .05},
	  //                 {length: thickness*2, radius: sleeveInnerRadius}];
	  const steps = [{length: thickness*2, radius: sleeveInnerRadius}];
	  let drillHole = new CSG.cylinder.step(steps, {slices});
	  drillHole.center(centerCabinetGuide);
	  cabinetGuideJig = cabinetGuideJig.union(lip).subtract(drillHole);
	
	  const guideLen = 2.54*6;
	  const demsBase = [guideLen, 2.54/4, 2.54*5/4];
	  const centerBase = [demsBase[0]/2, demsBase[1]/2, 0];
	  let drawerGuideJig = new CSG.cube({demensions: demsBase, center: centerBase});
	
	  const demsRail = [guideLen, (guideHeight - innerRailHeight)/2 + minDbGuideReveal, 2.54/4];
	  const railCenter = [demsRail[0]/2, demsBase[1] + demsRail[1]/2, 0];
	  const centerRail = new CSG.cube({demensions: demsRail, center: railCenter});
	
	  const shimSize = innerRailInsetDepth + bumperThickness + guideReveal;
	  const demsStop = [shimSize, 2.54/2, 2.54/4];
	  const centerStop = [shimSize / 2, demsBase[1] + demsRail[1] + demsStop[1]/2, 0];
	  const stopShim = new CSG.cube({demensions: demsStop, center: centerStop});
	
	  drawerGuideJig = drawerGuideJig.union(centerRail).union(stopShim);
	  drawerGuideJig.rotate({x: 90, z: 90});
	  cabinetGuideJig.rotate({y: -90});
	  drawerGuideJig.center({x: 2.54,y: drawerGuideJig.demensions().y/2, z: drawerGuideJig.demensions().z/2});
	  cabinetGuideJig.center({x:-2.54, y: cabinetGuideJig.demensions().y/2, z:cabinetGuideJig.demensions().z/2});
	
	  return {cabinetGuideJig, drawerGuideJig};
	}
	
	models['chrismas tree leg'] = (guideHeight, guideReveal, bottomGap) => {
	  const body = new CSG.cube({demensions: [9*2.54, 7.5, 1.4]});
	  const bottomCutter = new CSG.cube({demensions: [8.25*2.54, .75, 1.4]})
	  const slotCutter = new CSG.cube({demensions: [.8, 7.5, .725]});
	  const endPiece = new CSG.cube({demensions: [.32, 7.5 - .75 - .28, 1.08]});
	  const angleCutter = body.clone();
	  angleCutter.rotate({z:15.5});
	  angleCutter.translate({x:-2,y:4.3,z:0});
	
	  body.center({x:0,y:0,z:0});
	  bottomCutter.center({x:3*2.54/8, y:-3.75 + 3/8, z:0});
	  body.setColor('blue');
	  bottomCutter.setColor('green');
	  angleCutter.setColor('blue');
	  slotCutter.setColor('blue');
	  endPiece.setColor('red')
	
	  let model = body.subtract(angleCutter);
	  slotCutter.center({x:9*2.54/2 - .4, y: 1.1, z: -.55/2 - .725/2});
	  endPiece.center({x:9*2.54/2 - .16, y: .14 + .375, z: 0});
	  model=model.subtract(slotCutter);
	  slotCutter.translate({x:0,y:0,z:.55+.725});
	  return model.subtract(slotCutter).union(endPiece).subtract(bottomCutter);
	}
	
	const cnt = du.create.element('div');
	const controls = du.create.element('div', {style: 'float: left'});
	const display = du.create.element('div', {id: 'stl-three-d-model-cnt'});
	const orientCnt = du.create.element('div', {class: 'orientation-controls'});
	document.body.append(cnt);cnt.append(controls,display);display.append(orientCnt);
	
	const select = document.createElement('select');
	select.innerHTML = Object.keys(models).map(k => `<option>${k}</option>`);
	const argCnt = document.createElement('div');
	const downloadBtn = document.createElement('button');
	downloadBtn.innerText = 'Stl';
	controls.append(select);
	controls.append(argCnt);
	controls.append(downloadBtn);
	
	const inputValue = i => i.type === 'checkbox' ? i.checked : i.value;
	const getSelected = () => {
	  let args = du.find.downAll('input', argCnt).map(inputValue);
	  args = args.map(a => Boolean.is(a) ? a : Number.parseFloat(a));
	  return models[select.value](...args);
	}
	
	const getModel = () => {
	  const modelOmodels = getSelected();
	  modelList = modelOmodels instanceof CSG ? [modelOmodels] : Object.values(modelOmodels);
	  const model = new CSG();
	  modelList.forEach(m => model.polygons.concatInPlace(m.polygons));
	  // console.log(modelList.map(m => m.toDrawString(String.color.next())).join('\n\n'));
	  model.scale(10);
	  return model;
	}
	
	viewer = new Viewer(new CSG(), 500, 500, 50);
	const orientSelector = `#stl-three-d-model-cnt .orientation-controls`;
	const orientArrows = OrientationArrows.forCSG(orientSelector, viewer, getModel);
	
	
	const updateModel = () => {
	  const model = getModel();
	  viewer.mesh = model.toMesh();
	  viewer.gl.ondraw();
	}
	
	
	const updateArgs = (arg) => {
	  if (arg !== undefined){
	    const name = select.value;
	    argCnt.innerHTML = models[name].Arguments().map(a => {
	      const type = a.match(/^is[A-Z]/) ? 'checkbox' : 'number';
	      return `<label>${a}</label><br/><input type='${type}'\><br/>`;
	    }).join('\n');
	  }
	  updateModel();
	}
	
	
	
	const download = () => {
	  addLinks(getSelected(), select.value);
	}
	
	select.value = 'chrismas tree leg';
	
	du.on.match('change', 'input', updateModel);
	
	select.addEventListener('change', updateArgs);
	downloadBtn.addEventListener('click', download);
	updateArgs();
	
	addViewer(viewer, '#stl-three-d-model-cnt');
	
});


RequireJS.addFunction('./public/js/utils/utils.js',
function (require, exports, module) {
	Math.PI12 = Math.PI/2;
	Math.PI32 = 3*Math.PI/2;
	Math.PI2 = 2*Math.PI;
	
	Math.PI14 = Math.PI/4;
	Math.PI34 = 3*Math.PI/4;
	Math.PI54 = 5*Math.PI/4;
	Math.PI74 = 7*Math.PI/4;
	
	function safeStdLibAddition() {
	  const addition = [];
	  function verify() {
	    additions.forEach((a) => {
	      if ((a.static && a.lib[a.field] !== a.func) ||
	      (!a.static && a.lib.prototype[a.field] !== a.func))
	        throw new Error(`Functionality was overwritten -` +
	                          `\n\tLibrary: ${a.lib}` +
	                          `\n\tStatic: ${a.static}` +
	                          `\n\tField: ${a.field}`)
	    });
	    delete additions;
	  }
	  function safeAdd (lib, field, func, static) {
	    if (!static && lib.prototype[field] === undefined) {
	      Object.defineProperty(lib.prototype, field, {
	          value: func,
	          writable: true,
	          itterable: false
	      });
	    } else if (lib[field] === undefined)
	      lib[field] = func;
	    else
	      console.error(`Attempting to overwrite functionality -` +
	                        `\n\tLibrary: ${lib}` +
	                        `\n\tStatic: ${static}` +
	                        `\n\tField: ${field}`);
	    addition.push({lib, field, func, static})
	  }
	  safeAdd(Function, 'safeStdLibAddition', safeAdd);
	}
	safeStdLibAddition();
	
	Function.safeStdLibAddition(Object, 'definedPropertyNames', function(object) {
	  const names = [];
	  for (var key in object) names.push(key);
	  return names;
	}, true);
	
	Function.safeStdLibAddition(Boolean, 'is', (boolean) =>
	    (typeof boolean) === 'boolean' || boolean instanceof Boolean, true);
	Function.safeStdLibAddition(Boolean, 'first', (...booleans) => booleans.find(b => Boolean.is(b)), true);
	
	// TODO: implement depth first search... I cant remember needing it so not worth my time
	Function.safeStdLibAddition(Object, 'linkListFind', function(attr, is) {
	  let toSearch = [this];
	  let index = 0;
	  while(index < toSearch.length && !is(curr = toSearch[index])) {
	    objOArr = curr.pathValue(attr);
	    if (objOArr) {
	      if (Array.isArray(objOArr)) toSearch.concatInPlace(objOArr);
	      else toSearch.push(objOArr);
	    }
	    index++;
	  }
	  return toSearch[index];
	});
	
	
	const isNotUndefined = (key, obj) => obj[key] !== undefined;
	Function.safeStdLibAddition(Object, 'defined', function(...keys) {
	  let condition = isNotUndefined;
	  if (keys[0] instanceof Object) {
	    const conditionMap = keys[0];
	    keys = Object.keys(conditionMap);
	    condition = (key) =>
	      conditionMap[key](this[key]);
	  }
	  for (var index in keys) if (!condition(keys[index], this)) return false;
	  return true;
	});
	
	Function.safeStdLibAddition(Function, 'AsyncRunIgnoreSuccessPrintError', function(afunc, args) {
	  afunc(args).then(() => {}, (e) => console.error(e));
	}, true);
	
	Function.safeStdLibAddition(Function, 'Arguments', function() {
	  const argumentReg = /^(function|)[^(]*?\(([^)]*?)\)\s*/;
	  return this.toString().match(argumentReg)[2].split(/\s*,\s*/);
	});
	
	class EventFunction {
	  constructor(event, list) {
	    const add = (func, orderIndex) => {
	      if (func instanceof Function) {
	        if (event.triggered()) func(event.triggered());
	        else {
	          if (!Number.isFinite(orderIndex)) orderIndex = 0;
	          list.push({func, orderIndex});
	        }
	      }
	    }
	    // TODO: I dont know how to define custom function classes....
	    add.id = this.constructor.name;
	    return add;
	  }
	}
	
	class Event {
	  constructor(name) {
	    const list = [];
	    let triggered = false;
	    this.name = () => name;
	    this.triggered = () => triggered;
	    this.add = new EventFunction(this, list);
	    this.trigger = (info) => {
	      const run = !triggered;
	      triggered = info;
	      if (run) list.sortByAttr('orderIndex').forEach(fo => fo.func(info));
	    }
	    return ;
	  }
	}
	
	Function.safeStdLibAddition(Function, 'event', (eventName, object, recursiveFilter) => {
	  const eventFunc = new Event(eventName);
	  if (recursiveFilter === true) recursiveFilter = () => true;
	  const recursive = recursiveFilter instanceof Function;
	  if(object[eventName] && object[eventName].id === 'EventFunction') object[eventName](eventFunc.trigger);
	  const definition = {
	      writable: true,
	      enumerable: false,
	      configurable: false,
	      value: eventFunc.add
	  };
	  const define = (target) => {
	    if (!recursive || recursiveFilter(target)) {
	      Object.defineProperty(target, eventName, definition);
	    }
	    if (recursive) {
	      const keys = Object.keys(target);
	      for (let index = 0; index < keys.length; index++) {
	        const child = target[keys[index]];
	        if (child instanceof Object) define(child);
	      }
	    }
	  }
	  define(object);
	  return eventFunc.trigger;
	}, true);
	
	// Stole this from: https://stackoverflow.com/a/71115598
	// was useful in finding a data leak
	function roughSizeOfObject(object) {
	  const objectList = [];
	  const stack = [object];
	  const bytes = [0];
	  while (stack.length) {
	    const value = stack.pop();
	    if (value == null) bytes[0] += 4;
	    else if (typeof value === 'boolean') bytes[0] += 4;
	    else if (typeof value === 'string') bytes[0] += value.length * 2;
	    else if (typeof value === 'number') bytes[0] += 8;
	    else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
	      objectList.push(value);
	      if (typeof value.byteLength === 'number') bytes[0] += value.byteLength;
	      else if (value[Symbol.iterator]) {
	        // eslint-disable-next-line no-restricted-syntax
	        for (const v of value) stack.push(v);
	      } else {
	        Object.keys(value).forEach(k => {
	           bytes[0] += k.length * 2; stack.push(value[k]);
	        });
	      }
	    }
	  }
	  return bytes[0];
	}
	
	Function.safeStdLibAddition(Object, 'sizeOf', roughSizeOfObject);
	
	function arraySet(array, values, start, end) {
	  if (start!== undefined && end !== undefined && start > end) {
	    const temp = start;
	    start = end;
	    end = temp;
	  }
	  start = start || 0;
	  end = end || values.length;
	  for (let index = start; index < end; index += 1)
	    array[index] = values[index];
	  return array;
	}
	
	Function.safeStdLibAddition(Array, 'set',   arraySet, true);
	Function.safeStdLibAddition(Array, 'set',   function (values, start, end) {return arraySet(this, values, start, end)});
	
	Function.safeStdLibAddition(Array, 'copy',   function (other) {
	  if (Array.isArray(other)) {
	    this.deleteAll();
	    this.merge(other, false);
	  } else {
	    const newArr = [];
	    newArr.merge(this, false);
	    return newArr;
	  }
	});
	
	Function.safeStdLibAddition(Array, 'filterSplit',   function (filter, truthy) {
	  const retVal = {};
	  for (let index = 0; index < this.length; index++) {
	    let value = filter(this[index]);
	    if (truthy === true) value = value && true;
	    if (retVal[value] === undefined) retVal[value] = [];
	    retVal[value].push(this[index]);
	  }
	  return retVal;
	});
	
	
	Function.safeStdLibAddition(JSON, 'copy',   function  (obj) {
	  if (!(obj instanceof Object)) return obj;
	  return JSON.parse(JSON.stringify(obj));
	}, true);
	
	function processValue(value) {
	  let retVal;
	  if ((typeof value) === 'object' && value !== null) {
	    if (value.toJson) {
	      retVal = value.toJson();
	    } else if (value.toJSON) {
	      retVal = value.toJSON();
	    } else if (value.constructor.toJson) {
	      retVal = value.constructor.toJson(value);
	    } else if (Array.isArray(value)){
	      const arr = [];
	      value.forEach((val) => arr.push(processValue(val)));
	      retVal = arr;
	    } else {
	      const keys = Object.keys(value);
	      const obj = {};
	      for (let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        obj[key] = processValue(value[key]);
	      }
	      retVal = obj;
	    }
	  } else {
	    retVal = value;
	  }
	  return retVal;
	}
	
	// TODO: make moore efficient... dis es terible
	Function.safeStdLibAddition(Array, 'unique', function (attrFunc) {
	  if (!(attrFunc instanceof Function)) attrFunc = (e) => e;
	  return this.filter((() => {let found = []; return (e) => found.indexOf(attrFunc(e)) === -1 && (found.push(attrFunc(e)) || e);})());
	});
	
	Function.safeStdLibAddition(Array, 'equals', function (other, startIndex, endIndex) {
	    startIndex =  startIndex > -1 ? startIndex : 0;
	    endIndex = endIndex < this.length ? endIndex : this.length;
	    if (endIndex < other.length) return false;
	    let equal = true;
	    for (let index = startIndex; equal && index < endIndex; index += 1) {
	      const elem = this[index];
	      if (elem && (typeof elem.equals) === 'function') {
	        if (!elem.equals(other[index])) {
	          return index;
	        }
	      } else if (!Object.equals(elem, other[index])) {
	        equal = false;
	      }
	    }
	    return equal;
	});
	
	Function.safeStdLibAddition(String, 'random',  function (len) {
	    len = len || 7;
	    let str = '';
	    while (str.length < len) str += Math.random().toString(36).substr(2);
	    return str.substr(0, len);
	}, true);
	
	// const specialRegChars = /[-[\]{}()*+?.,\\^$|#\\s]/g;
	// TODO: Removed \\s not sure if its the right move
	const specialRegChars = /[-[\]{}()*+?.,\\^$|#]/g;
	Function.safeStdLibAddition(RegExp, 'escape',  function (str) {
	  return str.replace(specialRegChars, '\\$&');
	}, true);
	
	Function.safeStdLibAddition(String, 'replaceIterativly',  function (exp, replace) {
	  let str = this;
	  let next;
	  while ((next = str.replace(exp, replace)) !== str) str = next;
	  return str;
	});
	
	Function.safeStdLibAddition(String, 'count',  function (needle, length) {
	  const clean = RegExp.escape(this.substring(0, length));
	  const reg = new RegExp(`[^${RegExp.escape(needle)}]`, 'g');
	  return clean.replace(reg, '').length
	});
	
	
	const decimalRegString = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
	const decimalReg = new RegExp(`^${decimalRegString}$`);
	Function.safeStdLibAddition(String, 'isNumber', function (len) {
	  return this.trim().match(decimalReg) !== null;
	});
	
	const npiweblt = 'No Positive Integer (lt 10) Will Ever Be Less Than 0 (Duh)';
	const npiwebgt = 'No Positive Integer (lt 10) Will Ever Be Greater Than 9 (Duh)';
	const lessThanRegSingle = (int) => int >= 0 ? `[0-${int}]` : npiweblt;
	const greaterThanRegSingle = (int) => int <= 9 ? `[${int}-9]` : npiwebgt;
	const lessThanFormat = (prefix, leadInt, length) => {
	  const lessButSameLength = leadInt !== 0 ? `|[0-${leadInt - 1}][0-9]{${length-1}}` : ''
	  return `(${prefix}${lessButSameLength}|[0-9]{0,${length-1}})`;
	}
	const greaterThanFormat = (prefix, leadInt, length) => {
	  const greaterButSameLength = leadInt !== 9 ? `|[${leadInt + 1}-9][0-9]{${length-1}}` : ''
	  return `(${prefix}${greaterButSameLength}|[1-9][0-9]{${length},})`;
	}
	
	const integerCompareReg = (lessThan, equalTo) => (integer, asString) => {
	  lessThan = lessThan === true;
	  const ints = (integer + '').split('');
	  const compareFunc = lessThan ? lessThanRegSingle : greaterThanRegSingle;
	  const compareOffset = lessThan ? -1 : 1;
	  let offset = equalTo === true ? 0 : compareOffset;
	  let leadInt;
	  let reg = '';
	  let endOrVals = [];
	  let secondToLast;
	  let singleDigit = ints.length === 1;
	  for (let index = 0; index < ints.length; index++) {
	    const int = Number.parseInt(ints[index]);
	    if (index === 0) leadInt = int;
	    const str = index === ints.length - 1 ? compareFunc(int + offset) : compareFunc(int);
	    if (index === ints.length - 2) secondToLast = int;
	    const lastTwo = index > ints.length - 3;
	    if (!singleDigit && lastTwo && ((!lessThan && secondToLast !== 9) || (lessThan && secondToLast !== 0))) {
	      endOrVals.push(str);
	      const orValue = index !== ints.length - 1 ? compareFunc(int + compareOffset) : '[0-9]';
	      endOrVals.push(orValue);
	    } else reg += str;
	  }
	  if (endOrVals.length !== 0) {
	    reg = `${reg}(${endOrVals[0]}${endOrVals[2]}|${endOrVals[1]}${endOrVals[3]})`;
	  }
	  reg = (lessThan ? lessThanFormat : greaterThanFormat)(reg, leadInt, ints.length);
	  return asString ? reg : new RegExp(`^${reg}$`);
	}
	
	Function.safeStdLibAddition(RegExp, 'lessThan', integerCompareReg(true, false), true);
	Function.safeStdLibAddition(RegExp, 'greaterThan',  integerCompareReg(false, false), true);
	Function.safeStdLibAddition(RegExp, 'lessThanEqual',  integerCompareReg(true, true), true);
	Function.safeStdLibAddition(RegExp, 'greaterThanEqual',  integerCompareReg(false, true), true);
	const evenReg = '[0-9]*[02468](?![0-9])';
	Function.safeStdLibAddition(RegExp, 'even', (asString) => asString ? evenReg : new RegExp(`${evenReg}`));
	const oddReg = '[0-9]*[13579](?![0-9])';
	Function.safeStdLibAddition(RegExp, 'odd', (asString) => asString ? oddReg : new RegExp(`${oddReg}`));
	Function.safeStdLibAddition(RegExp, 'toObject',  function (str) {
	  const match = str.match(this);
	  if (match === null) return null;
	  const returnVal = {};
	  for (let index = 1; index < arguments.length; index += 1) {
	    const attr = arguments[index];
	    if (attr) returnVal[attr] = match[index];
	  }
	  return returnVal;
	}, false);
	
	
	const test = (testUpTo, funcName, test) => {
	  for (let value = 0; value < testUpTo; value++) {
	    for (let index = 0; index < 100; index++) {
	      try {
	        if (!test(index, value, `${index}`.match(RegExp[funcName](value)))) {
	          throw new Error('FAILED!!!');
	        }
	      } catch (e) {
	        console.log(`'${index}'.match(RegExp.${funcName}(${value})); //Failed`);
	        RegExp[funcName](value);
	        break;
	      }
	    }
	  }
	}
	
	Function.safeStdLibAddition(String, 'number',  function (str) {
	  str = new String(str);
	  const match = str.match(/([0-9]).([0-9]{1,})e\+([0-9]{2,})/);
	  if (match) {
	    const zeros = Number.parseInt(match[3]) - match[2].length;
	    str = match[1] + match[2] + new Array(zeros).fill('0').join('');
	  }
	  return new String(str)
	      .split('').reverse().join(',')
	      .replace(/([0-9]),([0-9]),([0-9]),/g, '$1$2$3,')
	      .replace(/,([0-9]{1,2}),/g, ',$1')
	      .replace(/,([0-9]{1,2}),/g, ',$1')
	      .split('').reverse().join('')
	}, true);
	
	Function.safeStdLibAddition(DataView, 'toByteString',  function () {
	  let bytes = [];
	  for (let index = 0; index < this.byteLength; index++) {
	    bytes.push(this.getUint8(index));
	  }
	  return `[${bytes.join(',')}]`;
	});
	
	function formatNumber(number, biteLen, func, bigEndian) {
	  const buffer = new ArrayBuffer(biteLen);
	  const view = new DataView(buffer);
	
	  view[func](0, number, !bigEndian);
	
	  return buffer;
	}
	
	Function.safeStdLibAddition(Number, 'float32',  {}, true);
	Function.safeStdLibAddition(Number, 'float64',  {}, true);
	Function.safeStdLibAddition(Number, 'int32',  {}, true);
	Function.safeStdLibAddition(Number, 'bigInt64',  {}, true);
	Function.safeStdLibAddition(Number.float32, 'littleEndian',  function (float) {
	  return formatNumber(float, 4, 'setFloat32');
	}, true);
	
	Function.safeStdLibAddition(Number.float32, 'bigEndian',  function (float) {
	  return formatNumber(float, 4, 'setFloat32', true);
	}, true);
	
	Function.safeStdLibAddition(Number.float64, 'littleEndian',  function (float) {
	  return formatNumber(float, 8, 'setFloat64');
	}, true);
	
	Function.safeStdLibAddition(Number.float64, 'bigEndian',  function (float) {
	  return formatNumber(float, 8, 'setFloat64', true);
	}, true);
	
	Function.safeStdLibAddition(Number.int32, 'littleEndian',  function (float, U) {
	  return formatNumber(float, 4, U !== false ? 'setInt32' : 'setUInt32');
	}, true);
	
	Function.safeStdLibAddition(Number.int32, 'bigEndian',  function (float, U) {
	  return formatNumber(float, 4, U !== false ? 'setInt32' : 'setUInt32', true);
	}, true);
	
	Function.safeStdLibAddition(Number.bigInt64, 'littleEndian',  function (float, U) {
	  return formatNumber(float, 8, U !== false ? 'setBigInt64' : 'setBigUint64', true);
	}, true);
	
	Function.safeStdLibAddition(Number.bigInt64, 'bigEndian',  function (float, U) {
	  return formatNumber(float, 8, U !== false ? 'setBigInt64' : 'setBigUint64', true);
	}, true);
	
	Function.safeStdLibAddition(Math, 'mod',  function (val, mod) {
	  mox = Math.abs(mod);
	
	  if(val < 0) {
	    val -= Math.floor(val/-mod) * mod
	    val += mod;
	  }
	  return val % mod;
	}, true);
	
	Function.safeStdLibAddition(Math, 'copysign',  function (a, b) {
	  return b < 0 ? -Math.abs(a) : Math.abs(a);
	}, true);
	
	Function.safeStdLibAddition(Math, 'modWithin',  function (val, mod, lowerLimit, upperLimit) {
	  val = Math.mod(val, mod);
	  lowerLimit = Math.mod(lowerLimit, mod);
	  upperLimit = Math.mod(upperLimit, mod);
	  return lowerLimit <= upperLimit ? val >= lowerLimit && val <= upperLimit : (val >= lowerLimit || val <= upperLimit);
	}, true);
	
	Function.safeStdLibAddition(Math, 'modTolerance',  function (val1, val2, mod, tol) {
	  if (tol > mod) return true;
	  const min2 = Math.mod(val2 - tol/2, mod);
	  const max2 = Math.mod(val2 + tol/2, mod);
	  return Math.modWithin(val1, mod, min2, max2);
	}, true);
	
	Function.safeStdLibAddition(Number, 'NaNfinity',  function (...vals) {
	  for (let index = 0; index < vals.length; index++) {
	    let val = vals[index];
	    if(Number.isNaN(val) || !Number.isFinite(val)) return true;
	  }
	  return false;
	}, true);
	
	function adjustPolarity(value, positive) {
	  if (positive === true && value < 0) value *= -1;
	  if (positive === false && value > 0) value *= -1;
	  return value;
	}
	
	function stringHash(digits, positive) {
	  let hashString = this;
	  let hash = 0;
	  for (let i = 0; i < hashString.length; i += 1) {
	    const character = hashString.charCodeAt(i);
	    hash = ((hash << 5) - hash) + character;
	    hash &= hash; // Convert to 32bit integer
	  }
	  if (!digits) return adjustPolarity(hash, positive);
	  let mod = 1;
	  for (let i = 0; i < digits; i++) mod *= 10;
	  return adjustPolarity(mod ? hash % mod : hash, positive);
	}
	
	Function.safeStdLibAddition(String, 'hash',  stringHash, false);
	
	const LEFT = 1;
	const RIGHT = 0;
	Function.safeStdLibAddition(String, 'obscure',  function (count) {
	    const direction = count < 0 ? LEFT : RIGHT;
	    const test = (index) => direction === LEFT ? index > this.length + count - 1 : index < count;
	    let str = '';
	    for (let index = 0; index < this.length; index += 1) {
	      if (test(index)) {
	        str += '*';
	      } else {
	        str += this[index];
	      }
	    }
	    return str;
	});
	
	const singleCharReg = /([a-zA-Z]{1,})[^a-z^A-Z]{1,}([a-zA-Z])[^a-z^A-Z]{1,}([a-zA-Z]{1,})/;
	const specialCharReg = /([a-zA-Z])[^a-z^A-Z^0-9]{1,}([a-zA-Z])/g;
	const charNumberReg = /([a-zA-Z])([0-9])/
	function singleCharReplace(whoCares, one, two, three) {
	  const oneLastChar = one[one.length - 1];
	  const twoLower = oneLastChar !== oneLastChar.toLowerCase();
	  const twoStr = twoLower ? two.toLowerCase() : two.toUpperCase();
	  const threeStr = twoLower ? `${three[0].toUpperCase()}${three.substr(1)}` :
	                                `${three[0].toLowerCase()}${three.substr(1)}`;
	  return `${one}${twoStr}${threeStr}`;
	}
	function camelReplace(whoCares, one, two) {return `${one}${two.toUpperCase ? two.toUpperCase() : two}`;}
	function toCamel() {
	  let string = `${this.substr(0,1).toLowerCase()}${this.substr(1)}`.replace(charNumberReg, camelReplace);
	  while (string.match(singleCharReg)) string = string.replace(singleCharReg, singleCharReplace);
	  return string.replace(specialCharReg, camelReplace);
	}
	Function.safeStdLibAddition(String, 'toCamel',  toCamel);
	
	const multipleUpperReg = /([A-Z]{2,})([a-z])/g;
	const caseChangeReg = /([a-z])([A-Z])/g;
	function pascalReplace(whoCares, one, two) {return `${one.toLowerCase()}_${two.toUpperCase ? two.toUpperCase() : two}`;}
	function toPascal() {
	  let string = this;
	  return string.replace(multipleUpperReg, pascalReplace)
	                .replace(caseChangeReg, pascalReplace)
	                .replace(charNumberReg, pascalReplace)
	                .replace(specialCharReg, pascalReplace);
	}
	Function.safeStdLibAddition(String, 'toPascal',  toPascal);
	
	function toKebab() {
	  return this.toPascal().toLowerCase().replace(/_/g, '-');
	}
	Function.safeStdLibAddition(String, 'toKebab',  toKebab);
	
	Function.safeStdLibAddition(String, 'toSnake',  function () {return this.toKebab().replace(/-/g, '_')});
	Function.safeStdLibAddition(String, 'toDot',  function () {return this.toKebab().replace(/-/g, '.')});
	Function.safeStdLibAddition(String, 'toScreamingDot',  function () {return this.toKebab().replace(/-/g, '.')});
	Function.safeStdLibAddition(String, 'toScreamingSnake',  function () {return this.toSnakeCase().toUpperCase()});
	Function.safeStdLibAddition(String, 'toScreamingKebab',  function () {return this.toKebab().toUpperCase()});
	Function.safeStdLibAddition(String, 'toSentance',  function () {
	  const pascal = this.toPascal().replace(/_/g, ' ');
	  return pascal[0].toUpperCase() + pascal.substring(1);
	});
	
	Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
	  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
	}, true);
	
	const classLookup = {};
	const attrMap = {};
	const identifierAttr = '_TYPE';
	const immutableAttr = '_IMMUTABLE';
	const temporaryAttr = '_TEMPORARY';
	const doNotOverwriteAttr = '_DO_NOT_OVERWRITE';
	const forceFromJsonAttr = '_FORCE_FROM_JSON';
	
	const clazz = {};
	const universalCloneFunction = (obj) => obj.constructor.fromJson(obj.constructor.toJson());
	clazz.object = () => Object.merge({}, classLookup);
	clazz.register = (clazz, ...attrs) => {
	  const cxtrName = clazz.name;
	  classLookup[cxtrName] = clazz;
	  if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
	  attrs.forEach((attr) => attrMap[cxtrName][attr] = true);
	  const parentToJson = clazz.toJson;
	  clazz.toJson = (obj) => {
	    const json = parentToJson ? parentToJson(obj) : {};
	    json._TYPE = cxtrName;
	    Object.keys(attrMap[cxtrName]).forEach(k => json.pathValue(k, processValue(obj.pathValue(k))));
	    return json;
	  }
	  const parentFromJson = clazz.fromJson;
	  clazz.fromJson = (json, obj) => {
	    if (!obj) obj = clazz.new();
	    if (parentFromJson) parentFromJson(json, obj);
	    Object.keys(attrMap[cxtrName]).forEach(k => obj.pathValue(k, Object.fromJson((json.pathValue(k)))));
	    return obj;
	  }
	  clazz.new = (...args) => new clazz(...args);
	  const parentClone = clazz.clone;
	  clazz.clone = (obj, clone) => {
	    if (!clone) clone = clazz.new();
	    if (parentClone) parentClone(obj, clone);
	    Object.keys(attrMap[cxtrName]).forEach(k => clone.pathValue(k, obj.pathValue(k)));
	    return clone;
	  }
	}
	clazz.get = (nameOobject) => (typeof nameOobject) === 'string' ? classLookup[nameOobject] : nameOobject.constructor;
	clazz.new = (nameOobject, ...args) => (typeof nameOobject) === 'string' ? new classLookup[nameOobject](...args) : new nameOobject.constructor(...args);
	clazz.filter = (filterFunc) => {
	  const classes = clazz.object();
	  if ((typeof filterFunc) !== 'function') return classes;
	  const classIds = Object.keys(classes);
	  const list = [];
	  for (let index = 0; index < classIds.length; index += 1) {
	    const id = classIds[index];
	    if (filterFunc(classes[id])) list.push(classes[id]);
	  }
	  return list;
	}
	
	const filterOutUndefined = (obj) => (key) => obj[key] !== undefined;
	function objEq(obj1, obj2) {
	  const isObj1 = obj1 instanceof Object;
	  const isObj2 = obj2 instanceof Object;
	  if (!isObj1 && !isObj2)
	    return obj1 === obj2;
	  if (!isObj1)
	    return false;
	  if (!isObj2)
	    return false;
	  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
	  const obj1Keys = Object.keys(obj1).filter(filterOutUndefined(obj1)).sort();
	  const obj2Keys = Object.keys(obj2).filter(filterOutUndefined(obj2)).sort();
	  if (obj1Keys.length !== obj2Keys.length) return false;
	  for (let index = 0; index < obj1Keys.length; index += 1) {
	    const obj1Key = obj1Keys[index];
	    const obj2Key = obj2Keys[index];
	    if (obj1Key !== obj2Key) return false;
	    const obj1Val = obj1[obj1Key];
	    const obj2Val = obj2[obj2Key];
	    if (obj1Val instanceof Object) {
	      if ((typeof obj1Val.equals) !== 'function') {
	        if(!objEq(obj1Val, obj2Val)) {
	          objEq(obj1Val, obj2Val)
	          return false;
	        }
	      }
	      else if (!obj1Val.equals(obj2Val))
	        return false;
	    } else if (obj1[obj1Key] !== obj2[obj2Key])
	        return false;
	  }
	  return true;
	}
	
	Function.safeStdLibAddition(Object, 'merge', (target, object, soft) => {
	  if (!(target instanceof Object)) return;
	  if (!(object instanceof Object)) return;
	  if (soft !== false) soft = true;
	  const objKeys = Object.keys(object);
	  if (!soft) target.deleteAll();
	  for (let index = 0; index < objKeys.length; index++) {
	    const key = objKeys[index];
	    const value = object[key];
	    if (value instanceof Object && target[key] instanceof Object) {
	      Object.merge(target[key], value, soft);
	    } else if (!soft || target[key] === undefined) {
	      target[key] = value;
	    }
	  }
	  return target;
	}, true);
	
	Function.safeStdLibAddition(Object, 'merge', function () {
	  const lastArg = arguments[arguments.length - 1];
	  let soft = true;
	  let args = arguments;
	  if (lastArg === false || lastArg === true) {
	    soft = lastArg;
	    args = Array.from(arguments).slice(0, arguments.length - 1);
	  }
	  for (let index = 0; index < args.length; index++) {
	    const object = args[index];
	    if (object instanceof Object) {
	      Object.merge(this, object, soft);
	    } else {
	      console.error('Attempting to merge a non-object');
	    }
	  }
	  return this;
	});
	
	Function.safeStdLibAddition(Array, 'removeAll', function (arr) {
	  for (let index = 0; index < arr.length; index += 1) {
	    this.remove(arr[index]);
	  }
	});
	
	Function.safeStdLibAddition(Array, 'removeWhere', function (func) {
	  for (let index = 0; index < this.length; index += 1) {
	    if (func(this[index])) {
	      this.splice(index--, 1)
	    }
	  }
	});
	
	Function.safeStdLibAddition(Array, 'findIndicies', function (func) {
	  const indicies = [];
	  for (let index = 0; index < this.length; index += 1) {
	    if (func(this[index])) indicies.push(index);
	  }
	  return indicies;
	});
	
	
	Function.safeStdLibAddition(Array, 'deleteAll', function () {
	  this.forEach((v, i) => delete this[i]);
	  this.length = 0;
	});
	
	Function.safeStdLibAddition(Object, 'deleteAll', function () {
	  Object.keys(this).forEach(key => delete this[key]);
	});
	
	Function.safeStdLibAddition(Object, 'forAllRecursive', (object, func) => {
	  if (!(object instanceof Object)) return;
	  if ((typeof func) !== 'function') return;
	  const target = Array.isArray(object) ? [] :{};
	  const objKeys = Object.keys(object);
	  for (let index = 0; index < objKeys.length; index++) {
	    const key = objKeys[index];
	    if (object[key] instanceof Object) {
	      target[key] = Object.forAllRecursive(object[key], func);
	    } else target[key] = func(object[key], key, object);
	  }
	  return target;
	}, true);
	
	Function.safeStdLibAddition(Object, 'class', clazz, true);
	Function.safeStdLibAddition(Object, 'equals', objEq, true);
	
	
	Function.safeStdLibAddition(Math, 'toDegrees', function (rads) {
	  return Math.round(1000 * Math.mod(rads * 180/Math.PI, 360)) / 1000;
	}, true);
	
	Function.safeStdLibAddition(Math, 'difference', function (val1, val2) {
	  if (val1 > val2) return Math.abs(val1 - val2);
	  return Math.abs(val2 - val1);
	}, true);
	
	Function.safeStdLibAddition(Math, 'roundTo', function (val, percision) {
	  if (percision === undefined) percision = .001;
	  const rounded = Math.round(val*1/percision) / (1/percision);
	  return rounded;
	}, true);
	
	
	Function.safeStdLibAddition(Object, 'forEachConditional', function (obj, func, conditionFunc, modifyObject) {
	  if (!modifyObject) obj = JSON.clone(obj);
	  conditionFunc = (typeof conditionFunc) === 'function' ? conditionFunc : () => true;
	  const keys = Object.keys(obj);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = obj[key];
	    if (conditionFunc(value)) func(value, key, obj);
	    if (value instanceof Object) Object.forEachConditional(value, func, conditionFunc, true);
	  }
	  return obj;
	}, true);
	
	Function.safeStdLibAddition(Math, 'toRadians', function (angle, accuracy) {
	  return (angle*Math.PI/180)%(2*Math.PI);
	}, true);
	
	Function.safeStdLibAddition(Math, 'midpoint', function (s, e) {
	  if (e < s) {
	    let t = s;
	    s = e;
	    e = t;
	  }
	  return s + (e - s)/2;
	}, true);
	
	// Ripped off of: https://stackoverflow.com/a/2450976
	Function.safeStdLibAddition(Array, 'shuffle', function() {
	  let currentIndex = this.length,  randomIndex;
	  while (currentIndex != 0) {
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex--;
	    [this[currentIndex], this[randomIndex]] = [
	      this[randomIndex], this[currentIndex]];
	  }
	
	  return this;
	});
	
	Function.safeStdLibAddition(Array, 'count', function(funcOrVal, max) {
	  let count = 0;
	  const call = (typeof funcOrVal) === 'function';
	  for (let index = 0; index < this.length; index++) {
	    const retVal = call ? funcOrVal(this[index]) : funcOrVal === this[index];
	    count += (typeof retVal) === 'number' ? retVal : (retVal ? 1 : 0);
	    if (count >= max) return max;
	  }
	  return count;
	});
	
	Function.safeStdLibAddition(Array, 'contains', function(value, max) {
	  const funcOrVal = value && (typeof value.equals) === 'function' ? value.equals : value;
	  return this.count(funcOrVal, 1) === 1;
	});
	
	const primes = [3,5,7,11,17,19,23,29];
	const firstNotInList = (targetList, ignoreList) => {
	  for (let index = 0; index < targetList.length; index++) {
	    if (ignoreList.indexOf(targetList[index]) === -1) return {item: targetList[index], index};
	  }
	  return null;
	}
	Function.safeStdLibAddition(Array, 'systematicSuffle', function (numberOfSuffles, doNotShufflePrimes) {
	  const ps = [];
	  ps.copy(primes);
	  const map = {};
	  let primeCount = 0;
	  let loops = 0;
	  const lastSeven = [];
	  for (let index = 0; index < numberOfSuffles; index++) {
	    let prime = ps[primeCount % ps.length];
	    if (lastSeven.indexOf(prime) !== -1) {
	      const info = firstNotInList(ps, lastSeven);
	      prime = info.item;
	      primeCount = info.index;
	    }
	    lastSeven[index % 7] = prime;
	    primeCount += prime + (prime * (ps[(primeCount + loops++) % ps.length])) % ps.length;
	    let shuffleIndex = 0;
	    while (shuffleIndex < this.length) {
	      const firstPart = this.slice(0, shuffleIndex)
	      const secondPart = this.slice(shuffleIndex, (shuffleIndex = shuffleIndex + prime));
	      const thirdPart = this.slice(shuffleIndex)
	      this.copy(secondPart.concat(firstPart.concat(thirdPart)));
	    }
	    map[this.join().hash()] = true;
	  }
	  return Object.keys(map).length;
	});
	
	Function.safeStdLibAddition(Array, 'uniqueStringValue', function (value) {
	  const matchingIndexes = [true];
	  const valReg = new RegExp(`(${RegExp.escape(value)})([0-9]*)`);
	  for (let index = 0; index < this.length; index++) {
	    const curr = new String(this[index]);
	    const match = curr.match(valReg);
	    if (match) {
	      matchingIndexes[match[2] || -1] = value;
	    }
	  }
	  if (matchingIndexes[-1] === undefined) return value;
	  const emptyIndex = matchingIndexes.findIndex(str => str === undefined);
	  return value + (emptyIndex === -1 ? matchingIndexes.length : emptyIndex);
	});
	
	Function.safeStdLibAddition(Array, 'reorder', function () {
	  let count = 2;
	  let currentIndex = this.length,  randomIndex;
	  while (currentIndex != 0) {
	    randomIndex = (currentIndex * count++) % currentIndex;
	    currentIndex--;
	    [this[currentIndex], this[randomIndex]] = [
	      this[randomIndex], this[currentIndex]];
	  }
	});
	
	Function.safeStdLibAddition(Array, 'toJson', function (arr) {
	    const json = [];
	    arr.forEach((elem) => json.push(processValue(elem)));
	    return json;
	}, true);
	
	Function.safeStdLibAddition(Object, 'toJson', function (obj) {
	    if (!(obj instanceof Object)) throw new Error('Not an Object');
	    const json = Array.isArray(obj) ? [] : {};
	    const keys = Object.keys(obj);
	    keys.forEach((key) => json[key] = processValue(obj[key]));
	    return json;
	}, true);
	
	Function.safeStdLibAddition(Array, 'equalIndexOf', function (elem, startIndex, endIndex) {
	    startIndex =  startIndex > -1 ? startIndex : 0;
	    endIndex = endIndex < this.length ? endIndex : this.length;
	    for (let index = startIndex; index < endIndex; index += 1) {
	      if (elem && (typeof elem.equals) === 'function' && elem.equals(this[index])) {
	        return index;
	      } else if (elem === this[index]) {
	        return index;
	      }
	    }
	    return -1;
	});
	
	Function.safeStdLibAddition(Array, 'condition', function (conditionFunc, initialValue) {
	  // console.warn('Function has been modified make sure results are as expected');
	  let value = initialValue;
	  const valueFuncDefined = (typeof valueFunc) === 'function';
	  for (let index = 0; index < this.length; index += 1) {
	    const elem = this[index];
	    value = conditionFunc(elem, value, index);
	  }
	  return value;
	});
	
	function arrayMaxObj(func, max) {
	  const funcDefined = (typeof func) === 'function';
	  const initialValue = max || max === 0 ?
	        {elem: max, value: funcDefined ? func(max) : max, index: -1} : undefined;
	  return this.condition((elem, max, index) => {
	    let value = funcDefined ? func(elem, index) : elem;
	    if (!(max instanceof Object) || value > max.value) return {value, elem, index};
	    return max;
	  }, initialValue);
	}
	
	Function.safeStdLibAddition(Array, 'max', function (func, max) {
	  const obj = arrayMaxObj.apply(this, [func, max]);
	  return obj ? obj.elem : undefined;
	});
	Function.safeStdLibAddition(Array, 'maxIndex', function (func, max) {
	  const obj = arrayMaxObj.apply(this, [func, max]);
	  return obj ? obj.index : -1;
	});
	
	function arrayMinObj(func, min) {
	  const funcDefined = (typeof func) === 'function';
	  const initialValue = min || min === 0 ? {elem: min, value: funcDefined ? func(min) : min} : undefined;
	  return this.condition((elem, min, index) => {
	    let value = funcDefined ? func(elem, index) : elem;
	    if (!(min instanceof Object) || value < min.value) return {value, elem, index};
	    return min
	  }, initialValue);
	}
	
	Function.safeStdLibAddition(Array, 'min', function (func, min) {
	  const obj = arrayMinObj.apply(this, [func, min]);
	  return obj ? obj.elem : -1;
	});
	Function.safeStdLibAddition(Array, 'minIndex', function (func, min) {
	  const obj = arrayMinObj.apply(this, [func, min]);
	  return obj ? obj.index : -1;
	});
	
	Function.safeStdLibAddition(Array, 'print', function (min, func) {
	  const maxLength = new String(this.length).length;
	  for (let index = 0; index < this.length; index++) {
	    const elem = this[index];
	    const length = new String(index).length;
	    const position = new Array(maxLength - length).fill(' ').join('') + index + ':';
	  }
	});
	
	Function.safeStdLibAddition(Array, 'exists', function (array, obj) {
	  if (!Array.isArray(array)) return false;
	  for (let index = 0; index < array.length; index += 1) {
	    if (array[index] === obj) return true;
	  }
	  return false;
	}, true);
	
	Function.safeStdLibAddition(Array, 'remove', function (elem) {
	  const isFunction = elem && (typeof elem.equals) === 'function';
	  let removed = isFunction ? [] : undefined;
	  for (let index = 0; index < this.length; index += 1) {
	    if (isFunction && elem.equals(this[index])) {
	      removed.push(this.splice(index--, 1)[0]);
	    } else if (elem === this[index]) {
	      removed = this.splice(index--, 1)[0];
	    }
	  }
	  return removed;
	});
	
	Function.safeStdLibAddition(Array, 'diff', function (original, neww, modify) {
	    const comparison = {both: [], removed: [], added: []};
	    const arr = original.concat(neww);
	    const visited = {new: {}, original: {}};
	    arr.forEach((elem) => {
	      const origIndex = original.equalIndexOf(elem);
	      const newIndex = neww.equalIndexOf(elem);
	      if (!visited.new[newIndex] && !visited.original[origIndex]) {
	        if (newIndex !== -1) visited.new[newIndex] = true;
	        if (origIndex !== -1) visited.original[origIndex] = true;
	        if (origIndex !== -1 && newIndex !== -1) comparison.both.push(elem);
	        else if (newIndex !== -1) comparison.added.push(elem);
	        else comparison.removed.push({elem, index: origIndex});
	      }
	    });
	
	    if (modify === true) {
	      if (comparison.removed.length > 0) {
	        let removed = 0;
	        comparison.removed.forEach((info) => original.splice(info.index - removed++, 1));
	        comparison.removed = comparison.removed.map((info) => info.elem);
	      }
	      if (comparison.added.length > 0) {
	        original.concatInPlace(neww);
	      }
	    }
	    return comparison.removed.length > 0 || comparison.added.length > 0 ? comparison : false;
	}, true);
	
	Function.safeStdLibAddition(Array, 'concatInPlace', function (arr, checkForDuplicats) {
	  if (arr === this) return;
	  if (!Array.isArray(arr)) return;
	  for (let index = 0; index < arr.length; index += 1) {
	    if (checkForDuplicats && this.indexOf(arr[index]) !== -1) {
	      console.warn('duplicate');
	    } else {
	      this[this.length] = arr[index];
	    }
	  }
	});
	
	function sortByAttrs(attrs, reverse) {
	  function sort(obj1, obj2) {
	    for (let index = 0; index < attrs.length; index++) {
	      const attr = attrs[index];
	      const val1 = Object.pathValue(obj1, attr);
	      const val2 = Object.pathValue(obj2, attr);
	      if (index === attrs.length && val2 === val1) {
	        continue;
	      }
	      if (val2 !== val1) {
	        if (reverse) {
	          return val1 > val2 ? -1 : 1;
	        }
	        return val1 > val2 ? 1 : -1;
	      }
	    }
	    return 0;
	  }
	  return sort;
	}
	
	const nativeSort = Array.sort;
	Function.safeStdLibAddition(Array, 'sortByAttr', function(stringOfunc, reverse) {
	  if ((typeof stringOfunc) === 'string')
	    return this.sort.apply(this, [sortByAttrs([stringOfunc], reverse)]);
	  return this.sort.apply(this, arguments);
	});
	
	Function.safeStdLibAddition(Array, 'sortByAttrs', function(list, reverse) {
	  return this.sort.apply(this, [sortByAttrs(list, reverse)]);
	});
	
	Function.safeStdLibAddition(Object, 'fromJson', function (rootJson) {
	  function interpretValue(value) {
	    if (value instanceof Object) {
	      const classname = value[identifierAttr];
	      const attrs = attrMap[classname] ? Object.keys(attrMap[classname]) :
	                    Object.keys(value).filter((attr) => !attr.match(/^_[A-Z]*[A-Z_]*$/));
	      if (Array.isArray(value)) {
	        const realArray = [];
	        for (let index = 0; index < value.length; index += 1) {
	          realArray[index] = Object.fromJson(value[index]);
	        }
	        return realArray;
	      } else if (classname && classLookup[classname]) {
	        if (classLookup[classname].fromJson) {
	          return classLookup[classname].fromJson(value);
	        } else {
	          const classObj = new (classLookup[classname])(value);
	          for (let index = 0; index < attrs.length; index += 1) {
	            const attr = attrs[index];
	            classObj.pathValue(attr, interpretValue(value[attr]));
	          };
	          return classObj;
	        }
	      } else {
	        if (classname) {
	          console.warn(`fromJson for class ${classname} not registered`)
	        }
	        const realObj = {}
	        for (let index = 0; index < attrs.length; index += 1) {
	          const attr = attrs[index];
	          realObj[attr] = interpretValue(value[attr]);
	        };
	        return realObj
	      }
	    }
	    return value;
	  }
	
	  if (!(rootJson instanceof Object)) return rootJson;
	  return interpretValue(rootJson);
	}, true);
	
	function setToJson(obj, options) {
	  if (!options.temporary) {
	    const origToJson = obj.toJson;
	    obj.toJson = (members, exclusive) => {
	      try {
	        const restrictions = Array.isArray(members) && members.length;
	        const json = (typeof origToJson === 'function') ? origToJson() : {};
	        if (!options.isObject) json[identifierAttr] = obj.constructor.name;
	        for (let index = 0; index < options.attrs.length; index += 1) {
	          const attr = options.attrs[index];
	          const inclusiveAndValid = restrictions && !exclusive && members.indexOf(attr) !== -1;
	          const exclusiveAndValid = restrictions && exclusive && members.indexOf(attr) === -1;
	          if (attr !== immutableAttr && (!restrictions || inclusiveAndValid || exclusiveAndValid)) {
	            const value = obj.pathValue(attr);
	            json.pathValue(attr, processValue(value));
	          }
	        }
	        return json;
	      } catch(e) {
	        console.warn(e.message);
	        throw e;
	        return e.message;
	      }
	    }
	  }
	}
	
	function staticFromJson(cxtr) {
	  const fromJson = (json) => {
	    const obj = new cxtr();
	    obj.fromJson(json);
	    return obj;
	  };
	  return fromJson;
	}
	
	Object.class.staticFromJson = staticFromJson;
	
	function setFromJson(obj, options) {
	  const cxtr = obj.constructor;
	  if (cxtr.fromJson === undefined || options.forceFromJson)
	    cxtr.fromJson = staticFromJson(cxtr);
	  const parentFromJson = obj.fromJson;
	  obj.fromJson = (json) => {
	    for (let index = 0; index < options.attrs.length; index += 1) {
	      const attr = options.attrs[index];
	      if (attr !== immutableAttr) {
	        if ((typeof obj[attr]) === 'function') {
	          if(Array.isArray(obj[attr]())){
	            obj[attr]().copy(Object.fromJson(json[attr]));
	          } else {
	            obj[attr](Object.fromJson(json[attr]));
	          }
	        }
	        else {
	          obj[attr] = Object.fromJson(json[attr]);
	        }
	      }
	    };
	    if ((typeof parentFromJson) === 'function') parentFromJson(json);
	    return obj;
	  }
	}
	
	function setClone(obj, options) {
	  const cxtrFromJson = obj.constructor.fromJson;
	  if (obj.constructor.DO_NOT_CLONE) {
	    obj.clone = () => obj;
	  } else if (cxtrFromJson && cxtrFromJson !== Object.fromJson) {
	    obj.clone = () => cxtrFromJson(obj.toJson());
	  } else if (options.isObject) {
	    obj.clone = () => {
	      const clone = Object.fromJson(obj.toJson());
	      Object.getSet(clone, clone);
	      return clone;
	    }
	  } else {
	    obj.clone = () => {
	      const clone = new obj.constructor(obj.toJson());
	      clone.fromJson(obj.toJson());
	      return clone;
	    }
	  }
	}
	
	function getOptions(obj, initialVals, attrs) {
	  const options = {};
	  options.temporary = false;
	  options.immutable = false;
	  options.doNotOverwrite = false;
	  if ((typeof initialVals) === 'object') {
	    options.values = initialVals;
	    options.immutable = options.values[immutableAttr] === true;
	    options.temporary = options.values[temporaryAttr] === true;
	    options.doNotOverwrite = options.values[doNotOverwriteAttr] === true;
	    options.forceFromJson = options.values[forceFromJsonAttr] === true;
	    if (options.immutable) {
	      options.attrs = Object.keys(options.values);
	    } else {
	      options.attrs = Object.keys(options.values).concat(attrs);
	    }
	  } else {
	    options.values = {};
	    options.attrs = [initialVals].concat(attrs);
	  }
	  return options;
	}
	
	function setGettersAndSetters(obj, options) {
	  for (let index = 0; !options.doNotOverwrite && index < options.attrs.length; index += 1) {
	    const attr = options.attrs[index];
	    if (attr !== immutableAttr) {
	      const initVal = options.values[attr];
	      if(initVal instanceof Function)
	        obj[attr] = initVal;
	      else if (options.immutable) obj[attr] = () => initVal;
	      else if (!(obj[attr] instanceof Function)) {
	        obj.pathValue(attr, (value) => {
	          if (value === undefined) {
	            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
	            if (options.values[attr] !== undefined || noDefaults)
	              return options.values[attr];
	            return obj.defaultGetterValue(attr);
	          }
	          return options.values[attr] = value;
	        });
	      }
	    }
	  }
	}
	
	Function.safeStdLibAddition(Object, 'getSet',   function (obj, initialVals, ...attrs) {
	  const cxtrName = obj.constructor.name;
	  const isObject = cxtrName === 'Object'
	  if (!isObject) {
	    if (classLookup[cxtrName] === undefined) {
	      classLookup[cxtrName] = obj.constructor;
	    } else if (classLookup[cxtrName] !== obj.constructor) {
	      console.warn(`Object.fromJson will not work for the following class due to name conflict\n\taffected class: ${obj.constructor}\n\taready registered: ${classLookup[cxtrName]}`);
	    }
	  }
	  if (initialVals === undefined) return;
	  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
	  const options = getOptions(obj, initialVals, attrs);
	  options.isObject = isObject;
	  if (!isObject) {
	    if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
	    options.attrs.forEach((attr) => {
	      if (!attr.match(/^_[A-Z]*[A-Z_]*$/))
	        attrMap[cxtrName][attr] = true;
	    });
	  }
	
	  setGettersAndSetters(obj, options);
	  setToJson(obj, options);
	  setClone(obj, options);
	  setFromJson(obj, options);
	  return options.attrs;
	}, true);
	Object.getSet.format = 'Object.getSet(obj, {initialValues:optional}, attributes...)'
	
	Function.safeStdLibAddition(Object, 'set',   function (obj, otherObj) {
	  if (otherObj === undefined) return;
	  if ((typeof otherObj) !== 'object') {
	    throw new Error('Requires one argument of type object or undefined for meaningless call');
	  }
	  const keys = Object.keys(otherObj);
	  keys.forEach((key) => obj[key] = otherObj[key]);
	}, true);
	
	const checked = {};
	
	// Swiped from https://stackoverflow.com/a/43197340
	function isClass(obj) {
	  const isCtorClass = obj.constructor
	      && obj.constructor.toString().substring(0, 5) === 'class'
	  if(obj.prototype === undefined) {
	    return isCtorClass
	  }
	  const isPrototypeCtorClass = obj.prototype.constructor
	    && obj.prototype.constructor.toString
	    && obj.prototype.constructor.toString().substring(0, 5) === 'class'
	  return isCtorClass || isPrototypeCtorClass
	}
	
	Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
	  if ((typeof obj) != 'object') return obj;
	  const keys = Object.keys(obj);
	  if (!checked[obj.constructor.name]) {
	    checked[obj.constructor.name] = true;
	  }
	
	  const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
	                  Array.isArray(obj) ? [] : {};
	  for(let index = 0; index < keys.length; index += 1) {
	    const key = keys[index];
	    const member = obj[key];
	    if (member && (member.DO_NOT_CLONE || member.constructor.DO_NOT_CLONE)) {
	      clone[key] = member;
	    } else if ((typeof member) !== 'function') {
	      if ((typeof member) === 'object') {
	        if ((typeof member.clone) === 'function') {
	          clone[key] = member.clone();
	        } else {
	          clone[key] = JSON.clone(member);
	        }
	      } else {
	        clone[key] = member;
	      }
	    }
	    else if (isClass(member)) {
	      clone[key] = member;
	    }
	  }
	  return clone;
	}, true);
	
	Function.safeStdLibAddition(Array, 'idObject',   function  (idAttr) {
	  const obj = {};
	  for (let index = 0; index < this.length; index++) {
	    const elem = this[index];
	    const id = (typeof elem[idAttr] === 'function') ? elem[idAttr]() : elem[idAttr];
	    obj[id] = elem;
	  }
	  return obj;
	});
	
	const lastCallDelay = 1000;
	const lastCallers = {};
	function lastCall(callerId, delayOptional, ...args) {
	  let delay = delayOptional;
	  if (arguments.length === 1) {
	    delay = lastCallDelay;
	    args = [callerId];
	  } else {
	    if (!Number.isFinite(delay) || delay > 60000) {
	      delay = delay;
	      args = [delayOptional].concat(args);
	    }
	  }
	  const id = String.random();
	  lastCallers[callerId] = id;
	  setTimeout(() => {
	    if (id === lastCallers[callerId]) {
	      this(...args);
	    }
	  }, delay);
	}
	
	const defaultInterval = 1000;
	const lastTimeStamps = {};
	function intervalFunction(callerId, intervalOptional, ...args) {
	  let interval = intervalOptional;
	  if (arguments.length === 1) {
	    interval = defaultInterval;
	    args = [callerId];
	  } else {
	    if (!Number.isFinite(interval) || interval > 60000) {
	      interval = defaultInterval;
	      args = [intervalOptional].concat(args);
	    }
	  }
	  const lastTime = lastTimeStamps[callerId];
	  const thisTime = new Date().getTime();
	  if (lastTime === undefined || lastTime + interval < thisTime)
	    this(...args);
	  lastTimeStamps[callerId] = thisTime;
	}
	
	const logData = {};
	function logarithmic(callerId, baseOptional, ...args) {
	  let base = baseOptional;
	  if (arguments.length === 1) {
	    base = 10;
	    args = [callerId];
	  } else {
	    if (!Number.isFinite(base) || base < 2) {
	      base = 10;
	      args = [baseOptional].concat(args);
	    }
	  }
	  if (!logData[callerId]) logData[callerId] = {base};
	  if (!logData[callerId].count) {
	    logData[callerId].count  = 1;
	    this(1, ...args);
	  } else {
	    count = ++logData[callerId].count;
	    const log = Math.log(count)/Math.log(logData[callerId].base);
	    if (log === Math.roundTo(log)) this(count, ...args);
	  }
	}
	logarithmic.reset = (callerId) => logData[callerId] && (logData[callerId].count = 0)
	
	Function.safeStdLibAddition(Function, 'subtle',   intervalFunction);
	Function.safeStdLibAddition(Function, 'lastCall',   lastCall);
	Function.safeStdLibAddition(Function, 'logarithmic',   logarithmic);
	
	Function.safeStdLibAddition(String, 'foreach', function (func) {
	  const arr = [];
	  for (let index = 0; index < this.length; index++) {
	    func(this[index], index);
	  }
	});
	
	Function.safeStdLibAddition(String, 'map', function (func) {
	  const arr = [];
	  for (let index = 0; index < this.length; index++) {
	    arr[index] = func(this[index]);
	  }
	  return arr;
	});
	
	Function.safeStdLibAddition(String, 'filter', function (func) {
	  const arr = [];
	  for (let index = 0; index < this.length; index++) {
	    if (func(this[index])) arr[index] = this[index];
	  }
	  return arr;
	});
	
	
	Function.safeStdLibAddition(String, 'parseSeperator',   function (seperator, isRegex) {
	  if (isRegex !== true) {
	    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
	  }
	  var keyValues = this.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
	  var json = {};
	  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
	    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
	    if (split) {
	      json[split[1]] = split[2];
	    }
	  }
	  return json;
	});
	
	const colors = [
	  'blue', 'red', 'yellow', 'lime', 'gray', 'indianred', 'fuchsia', 'black', 'lightsalmon',
	  'maroon', 'olive', 'lightcoral', 'green', 'aqua', 'white',
	  'teal', 'darksalmon', 'navy', 'salmon', 'silver', 'purple'
	];
	const colorRGBs = {indianred: [205, 92, 92],gray: [128, 128, 128],fuchsia: [255, 0, 255],
	  lime: [0, 255, 0],black: [0, 0, 0],lightsalmon: [255, 160, 122],red: [255, 0, 0],
	  maroon: [128, 0, 0],yellow: [255, 255, 0],olive: [128, 128, 0],lightcoral: [240, 128, 128],
	  green: [0, 128, 0],aqua: [0, 255, 255],white: [255, 255, 255],teal: [0, 128, 128],
	  darksalmon: [233, 150, 122],blue: [0, 0, 255],navy: [0, 0, 128],salmon: [250, 128, 114],
	  silver: [192, 192, 192],purple: [128, 0, 128]
	}
	
	const colorsCodeMap = {}
	colors.forEach(k => colorsCodeMap[colorRGBs[k].join(',')] = k);
	
	Function.safeStdLibAddition(String, 'color', () => colors[colorIndex % colors.length], true);
	String.color.RGB = colorRGBs;
	Function.safeStdLibAddition(String, 'colorName', function (color) {
	  if (!Array.isArray(color)) return '';
	  const strKey = color.map(v => Math.round(v * 255)).join(',');
	  return colorsCodeMap[strKey] || strKey;
	}, true);
	
	let colorIndex = 0;
	Function.safeStdLibAddition(String.color, 'next', (...exclude) => {
	  const filteredColors = colors.filter(c => exclude.indexOf(c) === -1)
	  return filteredColors[colorIndex++ % filteredColors.length];
	}, true);
	let distinctColorIndex = -1;
	const distinct = ['red', 'yellow', 'blue', 'green', 'purple', 'black']
	Function.safeStdLibAddition(String.color, 'distinct', () => {
	  distinctColorIndex++;
	  colorIndex = colors.findIndex((c) => c === distinct[distinctColorIndex % distinct.length]);
	  return colors[colorIndex];
	}, true);
	
	function hexToRgb(hex) {
	  hex = hex.replace("#", "");
	  if (hex.length === 3) {
	    hex = hex
	      .split("")
	      .map((char) => char + char)
	      .join("");
	  }
	  const r = parseInt(hex.substring(0, 2), 16);
	  const g = parseInt(hex.substring(2, 4), 16);
	  const b = parseInt(hex.substring(4, 6), 16);
	
	  return [r, g, b];
	}
	
	function rgbToHex(rgb) {
	  return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
	}
	
	function rgbToHSL(rgb) {
	  const r = rgb[0];
	  const g = rgb[1];
	  const b = rgb[2];
	  const max = Math.max(r, g, b);
	  const min = Math.min(r, g, b);
	  let h, s, l = (max + min) / 2;
	  if (max === min) {
	    h = s = 0;
	  } else {
	    const d = max - min;
	    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	    switch (max) {
	      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	      case g: h = (b - r) / d + 2; break;
	      case b: h = (r - g) / d + 4; break;
	    }
	    h /= 6;
	  }
	  return {
	    h: Math.round(h * 360),
	    s: Math.round(s * 100),
	    l: Math.round(l * 100)
	  };
	}
	
	function hslToRgb(h, s, l) {
	  h /= 360;
	  s /= 100;
	  l /= 100;
	
	  let r, g, b;
	
	  if (s === 0) {
	    r = g = b = l; // achromatic
	  } else {
	    const hue2rgb = (p, q, t) => {
	      if (t < 0) t += 1;
	      if (t > 1) t -= 1;
	      if (t < 1 / 6) return p + (q - p) * 6 * t;
	      if (t < 1 / 2) return q;
	      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	      return p;
	    };
	
	    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	    const p = 2 * l - q;
	    r = hue2rgb(p, q, h + 1 / 3);
	    g = hue2rgb(p, q, h);
	    b = hue2rgb(p, q, h - 1 / 3);
	  }
	  return rgb;
	}
	
	function getRgb(color, deFault) {
	  if (deFault === undefined) deFault = [0,0,0];
	  if (Array.isArray(color)) {
	    if (color[0] < 1) return color.map(v => Math.floor(v*255));
	    return color;
	  }
	  if (color instanceof Object) return String.color.hslToRgb(color) || deFault;
	  if ((typeof color) === 'string')
	    if (String.color.RGB[color]) return String.color.RGB[color] || deFault;
	    else return hexToRgb(color) || deFault;
	  return deFault;
	}
	
	const getHex = (color) => rgbToHex(getRgb(color));
	const getHexShortHand = (color) => rgbToHex(getRgb(color)).replace(/(#.).(.).(.)./, '$1$2$3');
	const rgbPercent = (color) => getRgb(color).map(v => v/255);
	
	
	Function.safeStdLibAddition(String.color, 'hexToRgb', hexToRgb, true);
	Function.safeStdLibAddition(String.color, 'rgbToHex', rgbToHex, true);
	Function.safeStdLibAddition(String.color, 'rgbToHSL', rgbToHSL, true);
	Function.safeStdLibAddition(String.color, 'hslToRgb', hslToRgb, true);
	Function.safeStdLibAddition(String.color, 'rgb', getRgb, true);
	Function.safeStdLibAddition(String.color, 'hex', getHex, true);
	Function.safeStdLibAddition(String.color.hex, 'short', getHexShortHand, true);
	Function.safeStdLibAddition(String.color.rgb, 'percent', rgbPercent, true);
	
	
	
	{
	  const a = 'a'.charCodeAt(0);
	  const z = 'z'.charCodeAt(0);
	  const A = 'A'.charCodeAt(0);
	  const Z = 'Z'.charCodeAt(0);
	  const zero = '0'.charCodeAt(0);
	  const nine = '9'.charCodeAt(0);
	  const range = {
	    upper: [A,Z],
	    lower: [a,z],
	    alpha: [A,z],
	    numeric: [zero, nine]
	  }
	  range.alpha.exclude = [Z+1, a-1];
	
	  Function.safeStdLibAddition(String, 'range', range, true);
	}
	
	const rangeLength = range => !range ? 0 : range[1] - range[0] - rangeLength(range.exclude) + 1;
	
	const integerToChar = (int, range) => {
	  if (range.exclude) {
	    if (int + range[0] >= range.exclude[0]) int += rangeLength(range.exclude);
	    // if (int + range[0] - 1 <= range.exclude[1]) int += 1;
	  }
	  return String.fromCharCode(int + range[0]);
	}
	function integerToStr(int, range) {
	  if (!range) range = String.range.alpha;
	  const rangeLen = rangeLength(range);
	  let mod = rangeLen;
	  let str = '';
	  do {
	    const value = int % mod;
	    str += integerToChar(value, range);
	    int = (int - value - 1) / rangeLen;
	  } while (int > 0);
	  return Array.from(str).reverse().join('');
	}
	Function.safeStdLibAddition(String, 'fromInt', integerToStr, true);
	
	const charInteger = (char, range) => {
	  const rangeLen = rangeLength(range);
	  const code = char.charCodeAt(0);
	  if (code >= range[0]) {
	    if (range.exclude) {
	      if (code < range.exclude[0]) return code - range[0];
	      if (code > range.exclude[1] && code <= range[1]) return code - range[0] - rangeLength(range.exclude);
	      throw new Error ('This shouldnt happen but char is not within range');
	    }
	    if (code <= range[1])  return code - range[0];
	  }
	  throw new Error ('This shouldnt happen but char is not within range');
	}
	
	const strInteger = function (range) {
	  if (!range) range = String.range.alpha;
	  const rangeLen = rangeLength(range);
	  let int = 0;
	  this.foreach((char, i) => {
	    const placeValue = Math.pow(rangeLen, this.length -1 - i);
	    const charInt = charInteger(char, range) + (i !== this.length - 1 ? 1 : 0);
	    int += placeValue * charInt;
	  });
	  return int;
	}
	Function.safeStdLibAddition(String, 'toInt', strInteger);
	
	Function.safeStdLibAddition(String, 'plus', function (intOstring, range) {
	  return String.fromInt(this.toInt(range) + (Number.isInteger(intOstring) ? intOstring : intOstring.toInt(range)));
	});
	
	
	const numberReg = /^[0-9]{1,}$/;
	const funcReg = /^(.*?)(\(\)|)$/;
	Function.safeStdLibAddition(Object, 'pathInfo', function (path, create) {
	  const attrs = (path + '').split('.');
	  let value = this;
	  let parent, attr, target;
	  let created = false;
	  for (let index = 0; index < attrs.length; index += 1) {
	    const match = attrs[index].match(funcReg);
	    attr = match[1];
	    parent = value;
	    const isFunc = value && value[attr] instanceof Function && match[2] === '()';
	
	    const nextIsIndex = new String(attrs[index + 1]).match(numberReg);
	    if (value[attr] === undefined) {
	      if (create) {
	        created = true;
	        value[attr] = nextIsIndex ? [] : {};
	      } else {
	        return;
	      }
	    }
	    target = value[attr];
	    value = isFunc ? target() : target;
	    if (value === undefined) return value;
	    if (value === null) break;
	  }
	  return {parent, value, target, attr, created}
	});
	
	Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
	  const valueDefined = value !== undefined;
	  const pathInfo = obj.pathInfo(path, valueDefined);
	  if (!valueDefined && !pathInfo) return pathInfo;
	  if (!pathInfo)
	    obj.pathInfo(path, valueDefined);
	  const parent = pathInfo.parent;
	  const attr = pathInfo.attr;
	  if ((typeof parent[attr]) === 'function') {
	    return parent[attr](value);
	  }
	  return valueDefined ? (parent[attr] = value) : parent[attr];
	}, true);
	
	Function.safeStdLibAddition(Object, 'pathValue', function (path, value) {
	  return Object.pathValue(this, path, value);
	});
	
	
	function setProperty(path, value, enumerable, writable, configurable, get, set) {
	  const pathInfo = this.pathInfo(path, true);
	  writable = Boolean.first(writable, true);
	  enumerable = Boolean.first(enumerable, true);
	  configurable = Boolean.first(configurable, true);
	  Object.defineProperty(pathInfo.parent, pathInfo.attr,
	    {writable, enumerable, configurable, value});
	}
	
	
	Function.safeStdLibAddition(Object, 'property', setProperty);
	
	Function.safeStdLibAddition(Object, 'undefinedKey', function (key, joinStr, requireIndex) {
	  if (!requireIndex && this[key] === undefined) return key;
	  if (joinStr === undefined) joinStr = '';
	  let index = 1;
	  while(this[`${key}${joinStr}${index}`] !== undefined) index++;
	  return `${key}${joinStr}${index}`;
	});
	
	
	Function.safeStdLibAddition(Object, 'deletePath', function (path) {
	  if ((typeof path) !== 'string' || path === '') throw new Error('path(arg1) must be defined as a non empty string');
	  const pathInfo = this.pathInfo(path);
	  if (pathInfo === undefined) return;
	  const parent = pathInfo.parent;
	  const attr = pathInfo.attr;
	  delete parent[attr];
	});
	
	Function.safeStdLibAddition(Array, 'empty', function (func) {
	  for (let index = 0; index < this.length; index += 1) {
	    if (this[index] !== undefined) return false;
	  }
	  return true;
	});
	
	Function.safeStdLibAddition(Array, 'relitiveIndex', function (funcOval, index) {
	  if (!Number.isFinite(index)) index = 0;
	  const isFunc = funcOval instanceof Function;
	  for (let i = 0; i < this.length; i += 1) {
	    const isTarget = isFunc ? funcOval(this[i], i) : funcOval === this[i];
	    if (isTarget) {
	      const negitive = i <= index ? i - index : -index + (i - this.length);
	      const positive = i >= index ? i - index : this.length - index + i;
	      if (-negitive < positive) return negitive;
	      else return positive;
	    }
	  }
	});
	
	Function.safeStdLibAddition(Array, 'concatElements', function () {
	  const elements = this.map(o => o);
	  this.deleteAll();
	  elements.forEach(e => Array.isArray(e) && this.concatInPlace(e));
	  return this;
	});
	
	Function.safeStdLibAddition(Array, 'fill', function (length, funcOval) {
	  const arr = new Array().fill(length);
	  const isFunc = funcOval instanceof Function;
	  for (let index = 0; index < length; index += 1) {
	    const value = isFunc ? funcOval(index, arr) : funcOval;
	    if (value !== undefined) arr[index] = value;
	  }
	  return arr;
	}, true);
	
	
	/////////////////////////////////// Matrix Equations //////////////////////////
	
	Function.safeStdLibAddition(Array, 'translate', function (vector, doNotModify, quiet) {
	  let point = this;
	  let single = false;
	  if (doNotModify === true) point = Array.from(point);
	  const vecLen = vector.length;
	  if (point.length !== vecLen && !quiet) console.warn('vector.length !== point.length but we\' do it anyway (arg3(quiet) = true to silence)');
	  for (let i = 0; i < vecLen; i += 1) {
	    if (point[i] === undefined) point[i] = 0;
	    point[i] += vector[i];
	  }
	  return point;
	});
	
	Function.safeStdLibAddition(Array, 'inverse', function (doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  for (let index = 0; index < arr.length; index += 1) {
	    arr[index] *= -1;
	  }
	  return arr;
	});
	
	Function.safeStdLibAddition(Array, 'remap', function (func) {
	  for (let index = 0; index < this.length; index += 1) {
	    this[index] = func(this[index], index);
	  }
	});
	
	Function.safeStdLibAddition(Object, 'swap', function (i, j, doNotModify) {
	  const arr = doNotModify === true ?
	              (Array.isArray(this) ? Array.from(this) : this.copy())
	              : this;
	  const temp = arr[i];
	  arr[i] = arr[j];
	  arr[j] = temp;
	  return arr;
	});
	
	Function.safeStdLibAddition(Array, 'scale', function (valueOfuncOarray, doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  let func;
	  switch (typeof valueOfuncOarray) {
	    case 'function': func = (val, index) => val * valueOfuncOarray(val, index); break;
	    case 'object': func = (val, index) => val * valueOfuncOarray[index]; break;
	    default: func = (val, index) => val * valueOfuncOarray;
	  }
	  arr.remap(func);
	  return arr;
	});
	
	Function.safeStdLibAddition(Array, 'add', function (valueOfuncOarray, doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  let func;
	  switch (typeof valueOfuncOarray) {
	    case 'function': func = (val, index) => val + valueOfuncOarray(val, index); break;
	    case 'object': func = (val, index) => val + valueOfuncOarray[index]; break;
	    default: func = (val, index) => val + valueOfuncOarray;
	  }
	  arr.remap(func);
	  return arr;
	});
	
	Function.safeStdLibAddition(Array, 'sum', function (valueOfuncOarray) {
	  let func;
	  let sum = 0;
	  switch (typeof valueOfuncOarray) {
	    case 'function': func = (val, index) => sum += valueOfuncOarray(val, index); break;
	    case 'object': func = (val, index) => sum += valueOfuncOarray[index]; break;
	    default: func = (val, index) => sum += val;
	  }
	  this.forEach(func);
	  return sum;
	});
	
	Function.safeStdLibAddition(Array, 'group', function (...groupSizes) {
	  if (groupSizes.length === 0) return;
	  const elements = this.map(o => o);
	  const groupSize = groupSizes.splice(0,1)[0];
	  this.deleteAll();
	  let i = 0;
	  let j = 0;
	  elements.forEach(e => {
	    if (i === groupSize) (i = 0) & j++;
	    if (i === 0) this[j] = [];
	    this[j][i++] = e;
	  });
	  this.forEach(elem => elem.group(...groupSizes));
	  return this;
	});
	
	Function.safeStdLibAddition(Array, 'inSetOf', function (setSize) {
	  this.length = Math.ceil(this.length/setSize) * setSize;
	});
	
	const MSI = Number.MAX_SAFE_INTEGER;
	const msi = Number.MIN_SAFE_INTEGER;
	Function.safeStdLibAddition(Math, 'minMax', function (items, targetAttrs) {
	  let min,max, total;
	  if (!targetAttrs) {
	    max = msi;
	    min = MSI;
	    total = 0;
	  }
	  const maxMinObject = {};
	  for (let index = 0; index < items.length; index++) {
	    const item = items[index];
	    if (max !== undefined) {
	      if (max < item) max = item;
	      if (min > item) min = item;
	      total += item;
	    } else {
	      const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	      for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	        const attr = attrs[tIndex];
	        const value = Object.pathValue(item, attr);
	        const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	        if (!maxMinObject[key]) maxMinObject[key] = {max: msi, min: MSI, total: 0};
	        if (maxMinObject[key].max < value) maxMinObject[key].max = value;
	        if (maxMinObject[key].min > value) maxMinObject[key].min = value;
	        maxMinObject[key].total += value;
	      }
	    }
	  }
	  if (max !== undefined) return {max, min, total};
	  return maxMinObject;
	}, true);
	
	Function.safeStdLibAddition(Math, 'midrange', function (items, targetAttrs) {
	  const maxMin = Math.minMax(items, targetAttrs);
	  if (!targetAttrs) {
	    return (maxMin.max + maxMin.min)/2;
	  }
	  const midRangeObject = {};
	  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	    const attr = attrs[tIndex];
	    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	    midRangeObject[key] = (maxMin[key].max + maxMin[key].min)/2;
	  }
	  return midRangeObject;
	}, true);
	
	Function.safeStdLibAddition(Math, 'mean', function (items, targetAttrs) {
	  const maxMin = Math.minMax(items, targetAttrs);
	  if (!targetAttrs) {
	    return maxMin.total / items.length;
	  }
	  const meanObject = {};
	  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	    const attr = attrs[tIndex];
	    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	    meanObject.pathValue(key, maxMin[key].total/items.length);
	  }
	  return meanObject;
	}, true);
	
	Function.safeStdLibAddition(Math, 'median', function (items, targetAttrs) {
	  const medianObject = {};
	  if (targetAttrs === undefined) {
	    items.sort();
	    const middleIndex = items.length/2
	    return Number.isInteger(middleIndex) ? items[middleIndex] :
	        (items[middleIndex - .5] + items[middleIndex+.5])/2;
	  }
	  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
	  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
	    const attr = attrs[tIndex];
	    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
	    const values = items.map(i => i.pathValue(key));
	    medianObject.pathValue(key, Math.median(values));
	  }
	  return medianObject;
	}, true);
	
	
	Function.safeStdLibAddition(Object, 'filter', function(complement, func, modify, key) {
	  if (!modify) complement = JSON.copy(complement);
	  if (func(complement, key)) return {filtered: complement};
	
	  if (!(complement instanceof Object)) return {complement};
	  let filtered = Array.isArray(complement) ? [] : {};
	  const keys = Object.keys(complement);
	  let setOne = false;
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const seperated = Object.filter(complement[key], func, true, key);
	    if (seperated.filtered !== undefined) filtered[key] = seperated.filtered;
	    setOne = true;
	    if (seperated.complement === undefined) delete complement[key];
	    else complement[key] = seperated.complement;
	  }
	  if (Object.keys(filtered).length === 0) filtered = undefined;
	  return {complement, filtered};
	}, true);
	
	Function.safeStdLibAddition(Object, 'filter', function(func) {
	  return Object.filter(this, func, true).filtered;
	});
	
	Function.safeStdLibAddition(Array, 'elements', function(func) {
	  const elements = [];
	  this.forEach(e => Array.isArray(e) ?
	              elements.concatInPlace(e.elements()) : elements.push(e));
	  return elements;
	});
	
	Function.safeStdLibAddition(Object, 'copy', function(arr) {
	  if (Array.isArray(arr)) throw new Error('point to merge...');
	  const root = Array.isArray(arr) ? [] : {};
	  const keys = Object.keys(arr);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = arr[key];
	    if (!(value instanceof Object)) root[key] = value;
	    else root[key] = value.copy();
	  }
	  return root;
	}, true);
	
	Function.safeStdLibAddition(Object, 'copy', function(arr) {
	  return Object.copy(this);
	});
	
	Function.safeStdLibAddition(Object, 'foreach', function(obj, func, filter, pathPrefix) {
	  if (!pathPrefix) pathPrefix = '';
	  if((typeof filter) !== 'function' || filter(obj, pathPrefix)) func(obj, pathPrefix);
	  const keys = Object.keys(obj);
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const path = pathPrefix === '' ? key : `${pathPrefix}.${key}`;
	    const value = obj[key];
	    if (value instanceof Object) {
	      Object.foreach(value, func, filter, path);
	    }
	  }
	}, true);
	
	Function.safeStdLibAddition(Object, 'foreach', function(func, filter) {
	  Object.foreach(this, func, filter);
	});
	Function.safeStdLibAddition(Object, 'map',   function (obj, func) {
	  if ((typeof func) !== 'function') return console.warn('Object.map requires a function argument');
	  const keys = Object.keys(obj);
	  const map = {};
	  for (let index = 0; index < keys.length; index++) {
	    const key = keys[index];
	    const value = obj[key];
	    map[key] = func(value, key);
	  }
	  return map;
	}, true);
	
	Function.safeStdLibAddition(Object, 'hash',
	  (obj) => JSON.stringify(obj === undefined ? 'undefined' : obj).hash(), true);
	
});


RequireJS.addFunction('./public/js/utils/dom-utils.js',
function (require, exports, module) {
	
const frag = document.createDocumentFragment();
	function validSelector (selector) {
	  try {
	    frag.querySelector(selector)
	    return selector;
	  } catch (e) {
	    const errMsg = `Invalid Selector: '${selector}'` ;
	    console.error(errMsg);
	    return null;
	  }
	};
	const VS = validSelector;
	
	function parseSeperator(string, seperator, isRegex) {
	  if (isRegex !== true) {
	    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
	  }
	  var keyValues = string.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
	  var json = {};
	  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
	    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
	    if (split) {
	      json[split[1]] = split[2];
	    }
	  }
	  return json;
	}
	
	function querySelector(selector, context) {
	  if (context) {
	    if (context.matches(selector)) return context;
	    return context.querySelector(selector);
	  }
	  return document.querySelector(selector);
	}
	
	function querySelectorAll(selector, context) {
	  const list = [];
	  if (context) {
	    if (context.matches(selector)) list.push(context);
	    list.concatInPlace(context.querySelectorAll(selector))
	    return list;
	  }
	  return document.querySelectorAll(selector);
	}
	
	const du = {create: {}, class: {}, cookie: {}, param: {}, style: {}, is: {},
	      scroll: {}, input: {}, on: {}, move: {}, url: {}, fade: {}, position: {},
	      bounds: {}};
	du.find = (selector, context) => querySelector(selector, context);
	du.find.all = (selector, context) => querySelectorAll(selector, context);
	du.validSelector = VS;
	
	du.input.valueObject = (elem) => {
	  const inputs = du.find.downAll('input,select,textarea', elem);
	  const obj = {};
	  inputs.forEach((input) => {
	    switch(input.type) {
	      case 'number': obj[input.name] = Number.parseFloat(input.value);break;
	      case 'checkbox': obj[input.name] = input.checked;break;
	      default: obj[input.name] = input.value;break;
	    }
	  });
	  return obj;
	}
	
	du.create.element = function (tagname, attributes) {
	  const elem = document.createElement(tagname);
	  const keys = Object.keys(attributes || {});
	  keys.forEach((key) => key === 'innerText' ?
	                        elem.innerText = attributes.innerText :
	                        elem.setAttribute(key, attributes[key]));
	  return elem;
	}
	
	du.create.event = (eventName) => {
	  let event;
	  if(document.createEvent){
	      event = document.createEvent("HTMLEvents");
	      event.initEvent(eventName, true, true);
	      event.eventName = eventName;
	  } else {
	      event = document.createEventObject();
	      event.eventName = eventName;
	      event.eventType = eventName;
	  }
	  event.trigger = (elem) => {
	    elem ||= document;
	    if(document.createEvent){
	      elem.dispatchEvent(event);
	    } else {
	      elem.fireEvent("on" + event.eventType, event);
	    }
	  }
	  return event;
	}
	
	
	
	// Ripped off of: https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
	du.download = (filename, contents) => {
	  var element = document.createElement('a');
	  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
	  element.setAttribute('download', filename);
	
	  element.style.display = 'none';
	  document.body.appendChild(element);
	
	  element.click();
	
	  document.body.removeChild(element);
	}
	
	du.download.binary = (filename, binaryFile) => {
	  const link = document.createElement('a');
	  link.innerText = filename;
	  link.href = URL.createObjectURL(binaryFile);
	  link.download = filename;
	
	  document.body.append(link);
	  link.click();
	  link.remove();
	}
	
	function keepInBounds (elem, minimum) {
	  if (!du.is.fixed(elem)) return;
	  const ancestors = [elem];
	  while(elem.parentElement) ancestors.push(elem = elem.parentElement);
	  while (elem && !du.is.fixed(elem = ancestors.pop()));
	  elem ||= ancestors[0];
	  minimum ||= 5;
	  const windowBounds = du.bounds.window();
	  function checkDir(dir1, dir2) {
	    const rect = du.bounds.elem(elem);
	    const dir1dist = Math.difference(rect[dir1], windowBounds[dir1]);
	    const dir2dist = Math.difference(rect[dir2], windowBounds[dir2]);
	    if (dir1dist < dir2dist) {
	      if (rect[dir1] < windowBounds[dir1] - 1) {
	        console.log('moving')
	        du.bounds.window();
	        du.bounds.window();
	        elem.style[dir1] = windowBounds[dir1] + minimum + 'px';
	        elem.style[dir2] = 'unset';
	      }
	    }
	    // TODO: Need to apply scale to window bounds in order for upperLimit check
	    // else {
	    //   if (rect[dir2] > windowBounds[dir2] + 1) {
	    //     console.log('moving1');
	    //     du.bounds.window();
	    //     elem.style[dir2] = windowBounds[dir2] + minimum + 'px';
	    //     elem.style[dir1] = 'unset';
	    //   }
	    // }
	  }
	  checkDir('left', 'right');
	  checkDir('top', 'bottom');
	}
	
	du.bounds.window = () => {
	  const w = window.innerWidth;
	  const h = window.innerHeight;
	  const sx = window.scrollX;
	  const sy = window.scrollY;
	  return {left: 0, right: sx+w, top: 0, bottom: sy+h};
	}
	
	du.bounds.view = () => {
	  const w = window.innerWidth;
	  const h = window.innerHeight;
	  return {left: 0, right: w, top: 0, bottom: h};
	}
	
	du.bounds.elem = (elem) => {
	  const rect = elem.getBoundingClientRect();
	  const sx = window.scrollX;
	  const sy = window.scrollY;
	  rect.x += sx;
	  rect.y += sy;
	  rect.top += sy;
	  rect.bottom += sy;
	  rect.left += sx;
	  rect.right += sx;
	  return rect;
	}
	
	du.zIndex = function (elem) {
	  return Number.parseInt(document.defaultView.getComputedStyle(elem, null)
	    .getPropertyValue("z-index"), 10);
	}
	du.move.inFront = function (elem, timeout) {
	  setTimeout(function () {
	    var exclude = du.find.downAll('*', elem);
	    exclude.push(elem);
	    var elems = document.querySelectorAll('*');
	    var highest = Number.MIN_SAFE_INTEGER;
	    for (var i = 0; i < elems.length; i++) {
	      const e = elems[i];
	      if (exclude.indexOf(e) === -1) {
	        var zindex = du.zIndex(e);
	      }
	      if (zindex > highest) highest = zindex;
	    }
	    if (highest < Number.MAX_SAFE_INTEGER) elem.style.zIndex = highest + 1;
	  },  timeout || 0);
	}
	
	du.move.inbounds = keepInBounds;
	
	du.move.relitive = function (elem, target, direction, props) {
	  props = props || {};
	  const clientHeight = document.documentElement.clientHeight;
	  const clientWidth = document.documentElement.clientWidth;
	  const rect = target.getBoundingClientRect();
	
	  const style = {};
	  style.cursor = props.cursor || 'unset';
	  style.position = props.position || 'absolute';
	  du.style(elem, style);
	
	  const scrollY =  props.isFixed ? 0 : window.scrollY;
	  const scrollX =  props.isFixed ? 0 : window.scrollX;
	  const isTop = direction.indexOf('top') !== -1;
	  const isBottom = direction.indexOf('bottom') !== -1;
	  const isRight = direction.indexOf('right') !== -1;
	  const isLeft = direction.indexOf('left') !== -1;
	  const isCenter = direction.indexOf('center') !== -1;
	  const isOutside = direction.indexOf('outer') !== -1;
	  const isVertical = isTop || isBottom;
	  const position = {};
	  const outOffset = isOutside ? (isVertical ? elem.clientHeight : elem.clientWidth) : 0;
	  if (isCenter) {
	    position.top = (rect.top + rect.bottom - elem.clientHeight) / 2 + scrollY + 'px';
	    position.left = (rect.left + rect.right - elem.clientWidth) / 2 + scrollX + 'px';
	  }
	
	  if (isOutside) {
	    if (isTop) {
	      position.bottom = clientHeight - (rect.top + scrollY + outOffset) + elem.clientHeight + 'px';
	      position.top = 'unset';
	    } else { position.bottom = 'unset'; }
	
	    if (isBottom) {
	      position.top = clientHeight - ((clientHeight - rect.bottom) + elem.clientHeight - outOffset - scrollY) + 'px';
	    } else if (!isCenter) { position.top = 'unset'; }
	
	    if (isRight) {
	      position.left = (rect.right - scrollX) + 'px';
	    } else if (!isCenter) { position.left = 'unset'; }
	
	    if (isLeft) {
	      position.right = clientWidth - (rect.left + scrollX) + 'px';
	      position.left = 'unset';
	    } else { position.right = 'unset'; }
	  } else {
	    if (isTop) {
	      position.top = rect.top + scrollY + 'px';
	    } else if (!isCenter) { position.top = 'unset'; }
	
	    if (isBottom) {
	      position.bottom = (clientHeight - rect.bottom) - scrollY + 'px';
	      position.top = 'unset';
	    } else { position.bottom = 'unset'; }
	
	    if (isRight) {
	      position.right = clientWidth - rect.right - scrollX + 'px';
	    } else { position.right = 'unset'; }
	
	    if (isLeft) {
	      position.left = rect.left + scrollX + 'px';
	    } else if (!isCenter) { position.left = 'unset'; }
	  }
	
	  du.style(elem, position);
	}
	
	du.move.below = function (elem, target) {
	  du.move.relitive(elem, target, 'bottom');
	}
	
	du.move.above = function (elem, target) {
	  du.move.relitive(elem, target, 'bottom');
	}
	
	du.find.up = function (selector, node) {
	  selector = VS(selector);
	  if (node instanceof HTMLElement) {
	    if (node.matches(selector)) {
	      return node;
	    } else {
	      return du.find.up(selector, node.parentNode);
	    }
	  }
	}
	
	function visibility(hide, targets) {
	  targets = Array.isArray(targets) ? targets : [targets];
	  for (let index = 0; index < targets.length; index += 1) {
	    const target = targets[index];
	    if ((typeof target) === 'string') {
	      targets = targets.concat(Array.from(document.querySelectorAll(target)));
	    } else if (target instanceof HTMLElement) {
	      target.hidden = hide;
	    } else if (Array.isArray(target) || target instanceof NodeList || target instanceof HTMLCollection) {
	      targets = targets.concat(Array.from(target));
	    }
	  }
	}
	
	du.hide = (...targets) => visibility(true, targets);
	du.show = (...targets) => visibility(false, targets);
	
	du.id = function (id) {return document.getElementById(id);}
	
	du.appendError = (target, message) => {
	  return function (e) {
	    const parent = target.parentNode;
	    const error = document.createElement('div');
	    error.className = 'error';
	    error.innerHTML = message;
	    parent.insertBefore(error, target.nextElementSibling)
	  }
	}
	
	const jsAttrReg = /<([a-zA-Z]{1,}[^>]{1,})(\s|'|")on[a-z]{1,}=/;
	du.innerHTML = (text, elem) => {
	  if (text === undefined) return undefined;
	  const clean = text.replace(/<script(| [^<]*?)>/, '').replace(jsAttrReg, '<$1');
	  if (clean !== text) {
	    throw new JsDetected(text, clean);
	  }
	  if (elem !== undefined) elem.innerHTML = clean;
	  return clean;
	}
	
	du.find.upAll = function(selector, node) {
	  const elems = [];
	  let elem = node;
	  selector = VS(selector);
	  while(elem = du.find.up(selector, elem)) {
	    elems.push(elem);
	    elem = elem.parentElement;
	  }
	  return elems;
	}
	
	du.depth = function(node) {return upAll('*', node).length};
	
	du.find.downInfo = function (selector, node, distance, leafSelector) {
	  const nodes = node instanceof HTMLCollection ? node : [node];
	  distance = distance || 0;
	  selector = VS(selector);
	
	  function recurse (node, distance) {
	    if (node instanceof HTMLElement) {
	      if (node.matches(selector)) {
	        return { node, distance, matches: [{node, distance}]};
	      }
	    }
	    return { distance: Number.MAX_SAFE_INTEGER, matches: [] };
	  }
	
	  let matches = [];
	  let found = { distance: Number.MAX_SAFE_INTEGER };
	  for (let index = 0; index < nodes.length; index += 1) {
	    const currNode = nodes[index];
	    const maybe = recurse(currNode, ++distance);
	    if (maybe.node) {
	      matches = matches.concat(maybe.matches);
	      found = maybe.distance < found.distance ? maybe : found;
	
	    }
	    if (!leafSelector || !currNode.matches(leafSelector)) {
	      const childRes = du.find.downInfo(selector, currNode.children, distance + 1, leafSelector);
	      matches = matches.concat(childRes.matches);
	      found = childRes.distance < found.distance ? childRes : found;
	    }
	  }
	  found.matches = matches
	  found.list = matches.map((match) => match.node);
	  return found;
	}
	
	du.find.down = function(selector, node) {return du.find.downInfo(selector, node).node};
	du.find.downAll = function(selector, node) {return du.find.downInfo(selector, node).list};
	
	du.find.closest = function(selector, node) {
	  node ||= document.head;
	  const visited = [];
	  selector = VS(selector);
	  function recurse (currNode, distance) {
	    let found = { distance: Number.MAX_SAFE_INTEGER };
	    if (!currNode || (typeof currNode.matches) !== 'function') {
	      return found;
	    }
	    visited.push(currNode);
	    if (currNode.matches(selector)) {
	      return { node: currNode, distance };
	    } else {
	      for (let index = 0; index < currNode.children.length; index += 1) {
	        const child = currNode.children[index];
	        if (visited.indexOf(child) === -1) {
	          const maybe = recurse(child, distance + index + 1);
	          found = maybe && maybe.distance < found.distance ? maybe : found;
	        }
	      }
	      const sibIndex = du.find.siblings.index(currNode);
	      const parent = currNode.parentNode;
	      for (let index = 0; index < parent.children.length; index += 1) {
	        const child = parent.children[index];
	        if (visited.indexOf(child) === -1) {
	          const dist = distance + Math.abs(sibIndex - index);
	          if (child.matches(selector)) {
	            maybe = {node:child, distance: dist};
	            found = maybe && maybe.distance < found.distance ? maybe : found;
	          }
	        }
	      }
	      if (visited.indexOf(parent) === -1) {
	        const maybe = recurse(parent, distance + sibIndex + 1);
	        found = maybe && maybe.distance < found.distance ? maybe : found;
	      }
	      return found;
	    }
	  }
	
	  return recurse(node, 0).node;
	}
	
	const findAttrFunc = (findFunc) =>
	  findFunc.attribute = (attribute, node) => {
	  const nearestElem = findFunc(`[${attribute}]`, node);
	  return nearestElem ? nearestElem.getAttribute(attribute) : null;
	};
	findAttrFunc(du.find.closest);
	findAttrFunc(du.find);
	findAttrFunc(du.find.down);
	findAttrFunc(du.find.up);
	
	
	
	// TODO: apply this to all relevant functions. (selector, target)|(selector)|(target)
	//      target - starting element for function
	//      selector - filtering of identified elements
	function selectorAndTarget(selector, target) {
	  const targetDef = target !== undefined;
	  const selectorDef = selector !== undefined;
	  if ((typeof target) === 'string') target = du.find(target);
	  if (targetDef && selectorDef) return {selector, target};
	  if (!targetDef && !selectorDef) return {selector: '*'};
	  if (!selector) return {target, selector: '*'}
	  if (!targetDef) {
	    if (selector instanceof HTMLElement) return {target: selector, selector: '*'};
	    return {selector};
	  }
	  throw new Error('This should not Happen');
	}
	
	du.find.siblings = (selector, elem) => {
	  const selTar = selectorAndTarget(selector, elem);
	  selector = selTar.selector; elem = selTar.target;
	  const siblings = [];
	  let currP = elem;
	  let currN = elem;
	  while(currP = currP.previousElementSibling) currP.matches(selector) && siblings.push(currP);
	  siblings.reverse();
	  while(currN = currN.nextElementSibling) currN.matches(selector) && siblings.push(currN);
	  return siblings;
	}
	
	du.find.siblings.index = (elem) => {
	  let index = 0;
	  let curr = elem;
	  while(curr = curr.previousElementSibling) index++;
	  return index;
	}
	
	du.find.relations = (selector, elem) => {
	  const selTar = selectorAndTarget(selector, elem);
	  selector = selTar.selector; elem = selTar.target;
	  const relations = {};
	  relations.ancestors = du.find.upAll(selector, elem);
	  relations.distants = [];
	  relations.ancestors.forEach(e => relations.distants.concatInPlace(du.find.siblings(selector, e)));
	  relations.ancestors.splice(0, 1);
	  return relations;
	}
	
	const selectors = {};
	let matchRunIdCount = 0;
	function getTargetId(target) {
	  if((typeof target.getAttribute) === 'function') {
	    let targetId = target.getAttribute('du-match-run-id');
	    if (targetId === null || targetId === undefined) {
	      targetId = matchRunIdCount + '';
	      target.setAttribute('du-match-run-id', matchRunIdCount++)
	    }
	    return targetId;
	  }
	  return target === document ?
	        '#document' : target === window ? '#window' : undefined;
	}
	
	function runMatches(withinId, eventType, selectStr, target, event) {
	  const eventSelectors = selectors[withinId][eventType];
	  if (eventSelectors && eventSelectors[selectStr] !== undefined) {
	    eventSelectors[selectStr].forEach((func) => {
	      try {
	        func(target, event)
	      } catch (e) {
	        console.error(e);
	      }
	    });
	  }
	}
	
	function runMatch(event) {
	  const  matchRunTargetId = getTargetId(event.currentTarget);
	  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
	  selectStrs.forEach((selectStr) => {
	    const target = du.find.up(selectStr, event.target);
	    const everything = selectStr === '*';
	    if (everything || target) {
	      runMatches(matchRunTargetId, event.type, selectStr, target, event);
	      runMatches(matchRunTargetId, '*', selectStr, target, event);
	    }
	  })
	}
	
	du.is.hidden = function (target) {
	  const elem = du.find.up('[hidden]', target);
	  return elem !== undefined;
	}
	
	du.is.fixed = function (target) {
	  const pos = document.defaultView.getComputedStyle(target).position;
	  const isAbsolute = pos === 'absolute';
	  const isRelative = pos === 'relative';
	  const isFixed = pos === 'fixed';
	  return isAbsolute || isFixed || isRelative;
	}
	
	du.is.inView = function (elem) {
	  const rect = elem.getBoundingClientRect();
	  const winTopLim = window.scrollY;
	  const winBotLim = window.scrollY + window.innerHeight;
	  const winLeftLim = window.scrollX;
	  const winRightLim = window.scrollY + window.innerWidth;
	
	  const leftGreater = rect.left > winLeftLim;
	  const leftLess = rect.left < winRightLim;
	  const rightGreater = rect.right > winLeftLim;
	  const rightLess = rect.right < winRightLim;
	  const topGreater = rect.top > winTopLim;
	  const topLess = rect.top < winBotLim;
	  const bottomGreater = rect.bottom > winTopLim;
	  const bottomLess = rect.bottom < winBotLim;
	
	  const leftTopCornerIn =  leftGreater && leftLess && topGreater && topLess;
	  const rightTopCornerIn =  rightGreater && rightLess && topGreater && topLess;
	
	  const leftBottomCornerIn =  leftGreater && leftLess && bottomGreater && bottomLess;
	  const rightBottomCornerIn =  rightGreater && rightLess && bottomGreater && bottomLess;
	
	  return leftTopCornerIn || rightTopCornerIn || leftBottomCornerIn || rightBottomCornerIn;
	}
	
	du.is.ancestor = function (elem, ancestor) {
	  while (elem.parentElement) {
	    if(elem === ancestor) return true;
	    elem = elem.parentElement;
	  }
	  return false;
	}
	
	du.class.add = function(target, clazz) {
	  du.class.remove(target, clazz);
	  target.className += ` ${clazz}`;
	}
	
	du.class.swap = function(target, newClass, oldClass) {
	  du.class.remove(target, oldClass);
	  du.class.add(target, newClass)
	}
	
	function classReg(clazz) {
	  return new RegExp(`(^| )(${clazz}( |$)){1,}`, 'g');
	}
	
	du.class.remove = function(target, clazz) {
	  if (!(target instanceof HTMLElement)) return;
	  target.className = target.className.replace(classReg(clazz), ' ').trim();
	}
	
	du.class.has = function(target, clazz) {
	  return target.className.match(classReg(clazz)) !== null;
	}
	
	du.class.toggle = function(target, clazz) {
	  if (du.class.has(target, clazz)) du.class.remove(target, clazz);
	  else du.class.add(target, clazz);
	}
	
	
	du.class.oft = function(target, clazz, true_false_undefined) {
	  if (!(target instanceof HTMLElement)) return;
	  if (true_false_undefined === true) return du.class.add(target, clazz);
	  if (true_false_undefined === false) return du.class.remove(target, clazz);
	  if (true_false_undefined === undefined) return du.class.toggle(target, clazz);
	  return du.has(target, clazz);
	}
	
	let lastKeyId;
	let keyPressId = 0;
	function onKeycombo(event, func, args) {
	  const keysDown = {};
	  const allPressed = () => {
	    const keys = Object.keys(keysDown);
	    if (keys.length !== args.length) return false;
	    let is = true;
	    const minTime = new Date().getTime() - 1000;
	    for (let index = 0; index < keys.length; index++) {
	      if (keysDown[keys[index]] < minTime) delete keysDown[keys[index]];
	    }
	    for (let index = 0; is && index < args.length; index += 1) {
	      is = is && keysDown[args[index]];
	    }
	    return is;
	  }
	  const keysString = () => Object.keys(keysDown).sort().join('/');
	  const setComboObj = (event) => {
	    const id = keysString;
	    const firstCall = lastKeyId !== id;
	    event.keycombonation = {
	      allPressed: allPressed(),
	      keysDown: JSON.clone(keysDown),
	      keyPressId: firstCall ? ++keyPressId : keyPressId,
	      firstCall, id
	    }
	  }
	
	  const keyup = (target, event) => {
	    delete keysDown[event.key];
	    setComboObj(event);
	    if (event.keycombonation.firstCall && args.length === 0) {
	      setComboObj(event);
	      func(target, event);
	    }
	  }
	  const keydown = (target, event) => {
	    keysDown[event.key] = new Date().getTime();
	    setComboObj(event);
	
	    if (event.keycombonation.firstCall && event.keycombonation.allPressed) {
	      func(target, event);
	    }
	  }
	  du.on.match('keyup', '*', keyup);
	  return {event: 'keydown', func: keydown};
	}
	
	function created(elem, selectors) {
	  selectors ||= Object.keys(onCreateSelectors);
	  for (let index = 0; index < selectors.length; index++) {
	    const selector = selectors[index];
	    if (elem.matches(selector)) onCreateSelectors[selector](elem);
	  }
	  for (let ci = 0; ci < elem.children.length; ci++) {
	    created(elem.children[ci], selectors);
	  }
	}
	
	function onCreate(event) {
	  if (event.target instanceof HTMLElement) created(event.target);
	}
	
	const onCreateSelectors = {};
	function create(func, selector) {
	  if (func instanceof Function) onCreateSelectors[selector] = func;
	}
	
	document.addEventListener('DOMNodeInserted', onCreate);
	
	function onNoactivity(event, func, selector, args) {
	  let time = Number.parseInt(args[0]);
	  if (!Number.isFinite(time)) time = 500;
	  let lastEventId = 0;
	  const anyEvent = (target, event) => {
	    const id = ++lastEventId;
	    setTimeout(() => {
	      if (lastEventId === id) {
	        func(target, null);
	      }
	    }, time);
	  }
	  return {event: '*', func: anyEvent};
	}
	
	function containerfocusout(event, func, selector, args) {
	  let time = Number.parseInt(args[1]);
	  let identifyingAttr = args[0];
	  if (!Number.isFinite(time)) time = 200;
	  let lastEventId = 0;
	  const onFocus = (out) => (target, event) => {
	    const id = ++lastEventId;
	    if (out) {
	      setTimeout(() => {
	        if (lastEventId === id) {
	          func(target, null);
	        }
	      }, time);
	    }
	  }
	
	  du.on.match('focusin', `${selector}, ${selector} *`, onFocus(false));
	  du.on.match('focusout', selector, onFocus(true));
	}
	
	// TODO: add custom function selectors.
	const argEventReg = /^(.*?)(|:(.*))$/;
	function filterCustomEvent(event, func, selector) {
	  const split = event.split(/[\(\),]/).filter(str => str);;
	  event = split[0];
	  const args = split.slice(1).map((str, i) => str === ' ' ? ' ' : str.trim());
	  let customEvent = {func, event};
	  switch (event) {
	    case 'enter':
	      customEvent.func = (target, event) => event.key === 'Enter' && func(target, event);
	      customEvent.event = 'keydown';
	      break;
	    case 'keycombo':
	      customEvent = onKeycombo(event, func, args);
	    break;
	    case 'noactivity':
	      customEvent = onNoactivity(event, func, selector, args);
	    case 'create':
	      create(func, selector);
	      customEvent = null;
	    case 'containerfocusout':
	      containerfocusout(event, func, selector, args);
	      customEvent = null;
	  }
	  return customEvent;
	}
	
	du.on.match = function(event, selector, func, target) {
	  const events = event.split(':');
	  if (events.length > 1) return events.forEach((e) => du.on.match(e, selector, func, target));
	  const filter = filterCustomEvent(event, func, selector);
	  if (filter === null) return;
	  target = target || document;
	  selector = VS(selector);
	  if (selector === null) return;
	  if ((typeof func) !== 'function') console.warn(`Attempting to create an event without calling function.\nevent: "${event}"\nselector: ${selector}`)
	  const  matchRunTargetId = getTargetId(target);
	  if (selectors[matchRunTargetId] === undefined) {
	    selectors[matchRunTargetId] = {};
	  }
	  if (selectors[matchRunTargetId][filter.event] === undefined) {
	    selectors[matchRunTargetId][filter.event] = {};
	    target.addEventListener(filter.event, runMatch);
	  }
	  if ( selectors[matchRunTargetId][filter.event][selector] === undefined) {
	    selectors[matchRunTargetId][filter.event][selector] = [];
	  }
	
	  const selectorArray = selectors[matchRunTargetId][filter.event][selector];
	  // if (selectorArray.indexOf(func) !== -1) {
	    selectorArray.push(filter.func);
	  // }
	}
	
	
	
	du.switch = (selector, idAttr) => {
	  if (!VS(selector)) throw new Error('This class needs a valid selector that can grab your button and your container');
	  const btnSelector = `button${selector}`;
	  const cntSelector = `${selector}:not(button)`;
	  function onlyOne(elem) {
	    let allBtns = du.find.all(btnSelector);
	    let allCnts = du.find.all(cntSelector);
	    for (let i = 0; i < allBtns.length; i++) allBtns[i].hidden = false;
	    for (let i = 0; i < allCnts.length; i++) allCnts[i].hidden = true;
	    if (elem) {
	      let idSel = '';
	      if (idAttr) {
	        const attr = elem.getAttribute(idAttr);
	        idSel = attr ? `[${idAttr}='${attr}']` : '';
	      }
	      let cnt = du.find.closest(`${cntSelector}${idSel}`, elem);
	      if (cnt) cnt.hidden = false;
	      else console.warn('Element does not appear to have a corresponding container');
	    }
	  }
	
	  du.on.match('click', btnSelector, onlyOne);
	  return onlyOne;
	}
	
	du.trigger = (eventName, elemOid) => {
	  const elem = (typeof elemOid) === 'string' ? du.id(elemOid) : elemOid;
	  if (elem instanceof HTMLElement) {
	    const event = du.create.event(eventName);
	    // event.target = elem;
	    if(document.createEvent){
	      elem.dispatchEvent(event);
	    } else {
	      elem.fireEvent("on" + event.eventType, event);
	    }
	  }
	}
	
	du.cookie.set = function(name, value, lifeMilliSecs) {
	  if (value instanceof Object) {
	    value = JSON.stringify(value);
	  }
	  const expireDate = new Date();
	  expireDate.setTime(expireDate.getTime() + (lifeMilliSecs || (8035200000))); //93 days by default
	  document.cookie = `${name}=${value}; expires=${expireDate.toUTCString()}`;
	}
	
	du.cookie.get = function(name, seperator) {
	  const cookie = parseSeperator(document.cookie, ';')[name];
	  if (seperator === undefined) return cookie;
	  const values = cookie === undefined ? [] : cookie.split(seperator);
	  if (arguments.length < 3) return values;
	  let obj = {};
	  for (let index = 2; index < arguments.length; index += 1) {
	    const key = arguments[index];
	    const value = values[index - 2];
	    obj[key] = value;
	  }
	  return obj;
	}
	
	du.url.breakdown = function () {
	  const breakdown = {};
	  const hashMatch = window.location.href.match(/(.*?)#(.*)/, '$1');
	  let noHash;
	  if (hashMatch) {
	    noHash = hashMatch[1];
	    breakdown.hashtag = hashMatch[2]
	  } else {
	    noHash = window.location.href;
	  }
	  const domainMatch = noHash.match(/(.*?):\/\/([^\/]*?)(:([0-9]{1,5})|)(\/[^?^#]*)/)
	  breakdown.protocol = domainMatch[1];
	  breakdown.domain = domainMatch[2];
	  breakdown.port = domainMatch[4] || undefined;
	  breakdown.path = domainMatch[5];
	
	  const urlMatch = noHash.match(/.*?:\/\/([^.]{1,})\.([^\/]*?)\.([^.^\/]{1,})(\/.*)/);
	  if (urlMatch) {
	    breakdown.subdomain = urlMatch[1];
	    breakdown.secondLevelDomain = urlMatch[2];
	    breakdown.topLevelDomaian = urlMatch[3]
	  }
	  breakdown.paramStr = noHash.substr(noHash.indexOf('?') + 1);
	
	  breakdown.params = parseSeperator(breakdown.paramStr, '&');
	  return breakdown;
	}
	
	du.url.build = function (b) {
	  const paramArray = [];
	  Object.keys(b.params).forEach((key) => paramArray.push(`${key}=${b.params[key]}`));
	  const paramStr = paramArray.length > 0 ? `?${paramArray.join('&')}` : '';
	  const portStr = b.port ? `:${b.port}` : '';
	  const hashStr = b.hashtag ? `#${b.hashtag}` : '';
	  return `${b.protocol}://${b.domain}${portStr}${b.path}${paramStr}${hashStr}`;
	}
	
	du.url.change = function (url) {
	  window.history.pushState(null,"", url);
	}
	
	du.param.get = function(name) {
	  let params = du.url.breakdown().params;
	  const value = params[name];
	  if (value === undefined) return undefined;
	  return decodeURI(value);
	}
	
	du.param.remove = function (name) {
	  const breakdown = du.url.breakdown();
	  delete breakdown.params[name];
	  du.url.change(du.url.build(breakdown));
	}
	
	du.style = function(elem, style, time) {
	  if (!(elem instanceof HTMLElement)) {
	    for (let index = 0; index < elem.length; index++) {
	      du.style(elem[index], style, time);
	    }
	  } else {
	    const save = {};
	    const keys = Object.keys(style);
	    keys.forEach((key) => {
	      save[key] = elem.style[key];
	      elem.style[key] = style[key];
	    });
	
	    if (time) {
	      setTimeout(() => {
	        keys.forEach((key) => {
	          elem.style[key] = save[key];
	        });
	      }, time);
	    }
	  }
	}
	
	function center(elem) {
	  const rect = elem.getBoundingClientRect();
	  const x = rect.x + (rect.height / 2);
	  const y = rect.y + (rect.height / 2);
	  return {x, y, top: rect.top};
	}
	
	du.scroll.can = function (elem) {
	    const horizontallyScrollable = elem.scrollWidth > elem.clientWidth;
	    const verticallyScrollable = elem.scrollHeight > elem.clientHeight;
	    return elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight;
	};
	
	du.scroll.parents = function (elem) {
	  let scrollable = [];
	  if (elem instanceof HTMLElement) {
	    if (du.scroll.can(elem)) {
	      scrollable.push(elem);
	    }
	    return du.scroll.parents(elem.parentNode).concat(scrollable);
	  }
	  return scrollable;
	}
	
	du.scroll.intoView = function(elem, divisor, delay, scrollElem) {
	  let scrollPidCounter = 0;
	  const lastPosition = {};
	  let highlighted = false;
	  function scroll(scrollElem) {
	    return function() {
	      const scrollCenter = center(scrollElem);
	      const elemCenter = center(elem);
	      const fullDist = Math.abs(scrollCenter.y - elemCenter.y);
	      const scrollDist = fullDist > 5 ? fullDist/divisor : fullDist;
	      const yDiff = scrollDist * (elemCenter.y < scrollCenter.y ? -1 : 1);
	      scrollElem.scroll(0, scrollElem.scrollTop + yDiff);
	      if (elemCenter.top !== lastPosition[scrollElem.scrollPid]
	            && (scrollCenter.y < elemCenter.y - 2 || scrollCenter.y > elemCenter.y + 2)) {
	        lastPosition[scrollElem.scrollPid] = elemCenter.top;
	        setTimeout(scroll(scrollElem), delay);
	      } else if(!highlighted) {
	        highlighted = true;
	        du.style.temporary(elem, 2000, {
	          borderStyle: 'solid',
	          borderColor: '#07ff07',
	          borderWidth: '5px'
	        });
	      }
	    }
	  }
	  const scrollParents = du.scroll.parents(elem);
	  scrollParents.forEach((scrollParent) => {
	    scrollParent.scrollPid = scrollPidCounter++;
	    setTimeout(scroll(scrollParent), 100);
	  });
	}
	
	du.fade.out = (elem, disapearAt, func) => {
	  const origOpacity = elem.style.opacity;
	  let stopFade = false;
	  function reduceOpacity () {
	    if (stopFade) return;
	    elem.style.opacity -= .005;
	    if (elem.style.opacity <= 0) {
	      elem.style.opacity = origOpacity;
	      func(elem);
	    } else {
	      setTimeout(reduceOpacity, disapearAt * 2 / 600 * 1000);
	    }
	  }
	
	  elem.style.opacity = 1;
	  setTimeout(reduceOpacity, disapearAt / 3 * 1000);
	  return () => {
	    stopFade = true;
	    elem.style.opacity = origOpacity;
	  };
	}
	
	
	
	du.cookie.remove = function (name) {
	  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
	}
	
	let copyTextArea;
	du.copy = (textOelem) => {
	  let elem;
	  if (textOelem instanceof HTMLElement) {
	    elem = textOelem;
	  } else {
	    if (copyTextArea === undefined) {
	      copyTextArea = du.create.element('textarea', {id: 'du-copy-textarea'});
	      document.body.append(copyTextArea);
	    }
	    elem = copyTextArea;
	    copyTextArea.value = textOelem;
	    copyTextArea.innerText = textOelem;
	  }
	
	  elem.select();
	  document.execCommand("copy");
	}
	
	du.paste = (elem, success, fail, validate) => {
	  fail ||= err => console.error('Failed to read clipboard contents: ', err);
	  navigator.clipboard.readText()
	  .then((text) => {
	    if ((typeof validate) !== 'function') {
	      success(text, elem);
	    } else {
	      const validResult = validate(text);
	      if (validResult) {
	        if (validResult === true) success(text, elem);
	        else success(validResult, elem);
	      }
	    }
	  })
	  .catch(fail);
	};
	
	du.paste.json = (elem, success, fail, validate) => {
	  let obj;
	  const validateWrapper = (text) => {
	    try {
	      const obj = Object.fromJson(JSON.parse(text));
	      return obj;
	    } catch (e) {
	      fail(e);
	    }
	  };
	  const successWrapper = (value, elem) => success(value, elem);
	  fail ||= err => console.error('Failed to read JSON object from clipboard contents: ', err);
	  du.paste(elem, successWrapper, fail, validateWrapper);
	}
	
	// du.print = {};
	// du.print.elem = (selectorOelem) => {
	//   let elem = selectorOelem;
	//   if (!(elem instanceof HTMLElement)) elem = du.find(selectorOelem);
	//   if (elem instanceof HTMLElement) {
	//    const relations = du.find.relations(elem)
	//    du.hide(relations.distants);
	//    du.style(relations.ancestors, {all: 'unset'});
	//    window.print();
	//    du.show(relations.distants);
	//    du.style(relations.ancestors, {all: ''});
	//  } else console.error(`Cant find HTMLElement '${selectorOelem}'`);
	// }
	//
	// du.on.match('click', 'button.print', (elem) => du.print.elem(elem.parentElement));
	
	const attrReg = /^[a-zA-Z-]*$/;
	du.uniqueSelector = function selector(focusElem) {
	  if (!focusElem) return '';
	  let selector = '';
	  let percice;
	  let attrSelector;
	  let currSelector;
	  let currElem = focusElem;
	  do {
	    attrSelector = `${currElem.id ? '#' + currElem.id : `${currElem.tagName}`}`;
	
	    currSelector = `${attrSelector}${selector}`;
	    let found = du.find.all(currSelector);
	    percice = found && (found.length === 1 || (selector.length > 0 && found[0] === focusElem));
	    if (!percice) {
	      const index = Array.from(currElem.parentElement.children).indexOf(currElem);
	      selector = ` > :nth-child(${index + 1})${selector}`;
	      currElem = currElem.parentElement;
	      if (currElem === null) return '';
	    }
	  } while (!percice);
	  return currSelector;
	}
	
	class FocusInfo {
	  constructor() {
	    this.elem = document.activeElement;
	    if (this.elem) {
	      this.selector = du.uniqueSelector(this.elem);
	      this.start =  this.elem.selectionStart;
	      this.end = this.elem.selectionEnd;
	    } else return null;
	  }
	}
	
	du.focusInfo = function () { return new FocusInfo();}
	
	du.focus = function (selector) {
	  if ((typeof selector) === 'string') {
	    const elem = du.find(selector);
	    if (elem) elem.focus();
	  } else if (selector instanceof FocusInfo) {
	    const elem = du.find(selector.selector);
	    if (elem) {
	      elem.focus();
	      if (Number.isFinite(selector.start) && Number.isFinite(selector.end)) {
	        elem.selectionStart = selector.start;
	        elem.selectorEnd = selector.end;
	      }
	    }
	  }
	}
	
	// Stolen From: https://stackoverflow.com/a/66569574
	// Should write and test my own but bigger fish
	const cssUnitReg = new RegExp(/^((-|)[0-9]{1,})([a-zA-Z]{1,4})$/);
	du.convertCssUnit = function( cssValue, target ) {
	    target = target || document.body;
	    const supportedUnits = {
	        // Absolute sizes
	        'px': value => value,
	        'cm': value => value * 38,
	        'mm': value => value * 3.8,
	        'q': value => value * 0.95,
	        'in': value => value * 96,
	        'pc': value => value * 16,
	        'pt': value => value * 1.333333,
	        // Relative sizes
	        'rem': value => value * parseFloat( getComputedStyle( document.documentElement ).fontSize ),
	        'em': value => value * parseFloat( getComputedStyle( target ).fontSize ),
	        'vw': value => value / 100 * window.innerWidth,
	        'vh': value => value / 100 * window.innerHeight,
	        // Times
	        'ms': value => value,
	        's': value => value * 1000,
	        // Angles
	        'deg': value => value,
	        'rad': value => value * ( 180 / Math.PI ),
	        'grad': value => value * ( 180 / 200 ),
	        'turn': value => value * 360
	    };
	
	    // If is a match, return example: [ "-2.75rem", "-2.75", "rem" ]
	    const matches = String.prototype.toString.apply( cssValue ).trim().match(cssUnitReg);
	
	    if ( matches ) {
	        const value = Number( matches[ 1 ] );
	        const unit = matches[ 3 ].toLocaleLowerCase();
	        // Sanity check, make sure unit conversion function exists
	        if ( unit in supportedUnits ) {
	            return supportedUnits[ unit ]( value );
	        }
	    }
	
	    return cssValue;
	};
	
	function createTimerShortCut() {
	  let timers = [];
	  du.on.match('keycombo(s,t)', '*', () => timers.push(new Date().getTime()));
	  du.on.match('keycombo(t)', '*', (info, info2) => {
	    if (timers.length === 0) return;
	    const endTime = new Date().getTime();
	    let str = '';
	    for (let index = 0; index < timers.length; index++) {
	      let time = endTime - timers[index];
	      if (time < 2000) time = `${time/100} msec`;
	      else time = `${time/1000} sec`;
	      str += `${index}) ${time}\n`;
	    }
	    if (str) alert(str);
	    timers = [];
	  });
	}
	createTimerShortCut();
	
	try {
	  module.exports = du;
	} catch (e) {}
	
});


RequireJS.addFunction('./public/js/utils/display/orientation-arrows.js',
function (require, exports, module) {
	
const $t = require('../../../../public/js/utils/$t.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const CustomEvent = require('../../../../public/js/utils/custom-event.js');
	
	class OrientationArrows extends Lookup {
	  constructor(parentSelector) {
	    super();
	    const navId = `orientation-arrows-${this.id()}`;
	    this.navId = () => navId;
	    this.space = () => '&nbsp;&nbsp;';
	    CustomEvent.all(this, 'up', 'right', 'down', 'left', 'center');
	
	    const elem = du.find(parentSelector);
	    if (elem === undefined) throw new Error(`No container found: '${parentSelector}'`);
	    elem.innerHTML = OrientationArrows.template.render(this);
	  }
	}
	
	OrientationArrows.template = new $t('orientation-arrows');
	
	du.on.match('click', '.orient-arrows>tbody>tr>td[dir]', function (target) {
	  const tableElem = du.find.up('[l-id]', target);
	  if (!tableElem) return;
	  const id = tableElem.getAttribute('l-id');
	  const instance = OrientationArrows.get(id);
	  const direction = target.getAttribute('dir');
	  switch (direction) {
	    case 'u':
	      instance.trigger.up(target, {direction, instance});
	      break;
	    case 'r':
	      instance.trigger.right(target, {direction, instance});
	      break;
	    case 'd':
	      instance.trigger.down(null, {direction, instance});
	      break;
	    case 'l':
	      instance.trigger.left(target, {direction, instance});
	      break;
	    case 'c':
	      instance.trigger.center(target, {direction, instance});
	      break;
	  }
	});
	
	OrientationArrows.forCSG = (parentSelector, viewerOgetter, modelOgetter) => {
	  let lastViewId;
	  const getViewer = viewerOgetter instanceof Function ? viewerOgetter : () => viewerOgetter;
	  const getModel = modelOgetter instanceof Function ? modelOgetter : () => modelOgetter;
	  function centerOnObj(x,y,z, viewId) {
	    const model = getModel();
	    const center = model ? model.center() : {x:0, y:0, z:0};
	    center.x += 200 * y;
	    center.y += -200 * x;
	    center.z += 100;
	    const rotation = {x: x*90, y: y*90, z: z*90};
	
	    lastViewId = viewId;
	    return [center, rotation];
	  }
	
	  let viewer;
	  const orientArrows = new OrientationArrows(parentSelector);
	  orientArrows.on.center(() =>
	    (viewer = getViewer()) && viewer.viewFrom(...(lastViewId === 'front' ?
	                    centerOnObj(2,0,2, 'back') : centerOnObj(0,0, 0, 'front'))));
	  orientArrows.on.up(() =>
	    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(1, 0,0)));
	  orientArrows.on.down(() =>
	    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(-1,0,0)));
	  orientArrows.on.left(() =>
	    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(0,1,0)));
	  orientArrows.on.right(() =>
	    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(0,-1,0)));
	
	  return orientArrows;
	}
	
	module.exports = OrientationArrows;
	
});


RequireJS.addFunction('./public/js/utils/expression-definition.js',
function (require, exports, module) {
	

	
	
	let idCount = 0;
	class ExprDef {
	  constructor(name, options, notify, stages, alwaysPossible) {
	    this.id = idCount++;
	    let id = this.id;
	    let string;
	    let modified = '';
	    let start;
	    let end;
	    alwaysPossible = alwaysPossible ? alwaysPossible : [];
	    stages = stages ? stages : {};
	    let currStage = stages;
	
	    function getRoutes(prefix, stage) {
	      let routes = [];
	      let keys = Object.keys(stage);
	      for (let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        if (key !== '_meta') {
	          let newPrefix;
	          if (prefix) {
	            newPrefix = `${prefix}.${key}`;
	          } else {
	            newPrefix = key;
	          }
	          const deepRoutes = getRoutes(newPrefix, stage[key]);
	          if (deepRoutes.length > 0) {
	            routes = routes.concat(deepRoutes);
	          }
	          if (stage[key]._meta && stage[key]._meta.end) {
	            routes.push(newPrefix + '.end');
	          }
	          if (stage[key]._meta && stage[key]._meta.repeat) {
	            routes.push(newPrefix + '.repeat');
	          }
	        }
	      }
	      return routes;
	    }
	
	    this.always = function () {
	      for (let index = 0; index < arguments.length; index += 1) {
	        alwaysPossible.push(arguments[index]);
	      }
	    };
	    this.getAlways = function (exprDef) {return alwaysPossible;};
	
	    this.allRoutes = function () {
	      return getRoutes(null, stages);
	    }
	
	    function getNotice (exprDef) {
	      let isInAlways = false;
	      alwaysPossible.map(function (value) {if (value.getName() === exprDef.getName()) isInAlways = true;});
	      if (isInAlways) return;
	      if (!exprDef.closed()) {
	        if (currStage[exprDef.getName()] === undefined) {
	          throw new Error(`Invalid Stage Transition ${currStage._meta.expr.getName()} -> ${exprDef.getName()}\n${currStage._meta.expr.allRoutes()}`)
	        }
	        currStage = currStage[exprDef.getName()];
	      }
	    }
	    this.getNotice = getNotice;
	
	    function getName () {return name;};
	    this.getName = getName;
	    this.onClose = function (start, end) {
	      return function (str, start, end) {
	        if (notify) notify(this);
	        options.onClose(str, start, end);
	      }
	    }
	
	    function setMeta(targetNodes, attr, value) {
	      return function () {
	        for (let lIndex = 0; lIndex < targetNodes.length; lIndex += 1) {
	          targetNodes[lIndex]._meta[attr] = value;
	        }
	      }
	    }
	
	    function then (targetNodes) {
	      return function () {
	        const createdNodes = [];
	        for (let lIndex = 0; lIndex < targetNodes.length; lIndex += 1) {
	          const targetNode = targetNodes[lIndex];
	          for (let index = 0; index < arguments.length; index += 1) {
	            const exprDef = arguments[index];
	            if (!exprDef instanceof ExprDef) {
	              throw new Error(`Argument is not an instanceof ExprDef`);
	            }
	            const nextExpr = exprDef.clone(getNotice);
	            if (targetNode[nextExpr.getName()] === undefined) {
	              targetNode[nextExpr.getName()] = {
	                _meta: {
	                  expr: nextExpr
	                }
	              };
	            }
	            createdNodes.push(targetNode[nextExpr.getName()]);
	          }
	        }
	        return {
	          then: then(createdNodes),
	          repeat: setMeta(createdNodes, 'repeat', true),
	          end: setMeta(createdNodes, 'end', true),
	        };
	      }
	    }
	
	    this.if = function () {return then([stages]).apply(this, arguments);}
	
	    function isEscaped(str, index) {
	      if (options.escape === undefined) {
	        return false;
	      }
	      let count = -1;
	      let firstIndex, secondIndex;
	      do {
	        count += 1;
	        firstIndex = index - (options.escape.length * (count + 1));
	        secondIndex = options.escape.length;
	      } while (str.substr(firstIndex, secondIndex) === options.escape);
	      return count % 2 == 0;
	    }
	
	    function foundCall(onFind, sub) {
	      if ((typeof notify) === 'function') {
	        notify(this);
	      }
	      if ((typeof onFind) === 'function') {
	        return onFind(sub);
	      } else {
	        return sub;
	      }
	    }
	
	    this.find = function (str, index) {
	      let startedThisCall = false;
	      let needle = options.closing;
	      let starting = false;
	      if (start === undefined) {
	        needle = options.opening;
	        starting = true;
	      }
	      const sub = str.substr(index);
	      let needleLength;
	      if (needle instanceof RegExp) {
	        const match = sub.match(needle);
	        if (match && match.index === 0) {
	          needleLength = match[0].length;
	        }
	      } else if ((typeof needle) === 'string') {
	        if (sub.indexOf(needle) === 0 && !isEscaped(str, index))
	          needleLength = needle.length;
	      } else if (needle === undefined || needle === null) {
	        needleLength = 0;
	      } else {
	        throw new Error('Opening or closing type not supported. Needs to be a RegExp or a string');
	      }
	      needleLength += options.tailOffset ? options.tailOffset : 0;
	      let changes = '';
	      if (start === undefined && starting && (needleLength || needle === null)) {
	        string = str;
	        start = index;
	        startedThisCall = true;
	        if (needle === null) {
	          if ((typeof notify) === 'function') {
	            notify(this);
	          }          return {index, changes}
	        } else {
	          changes += foundCall.apply(this, [options.onOpen, str.substr(start, needleLength)]);
	        }
	      }
	      if ((!startedThisCall && needleLength) ||
	            (startedThisCall && options.closing === undefined) ||
	            (!startedThisCall && options.closing === null)) {
	        if (str !== string) {
	          throw new Error ('Trying to apply an expression to two different strings.');
	        }
	        end = index + needleLength;
	        if (options.closing === null) {
	          return {index, changes}
	        }
	        if (!startedThisCall) {
	          changes += foundCall.apply(this, [options.onClose, str.substr(end - needleLength, needleLength)]);
	        }
	        return { index: end, changes };
	      }
	
	      return start !== undefined ? { index: start + needleLength, changes } :
	                      { index: -1, changes };
	    }
	
	    this.clone = function (notify) {
	      return new ExprDef(name, options, notify, stages, alwaysPossible);
	    };
	    this.name = this.getName();
	    this.canEnd = function () {return (currStage._meta && currStage._meta.end) || options.closing === null};
	    this.endDefined = function () {return options.closing !== undefined && options.closing !== null};
	    this.location = function () {return {start, end, length: end - start}};
	    this.closed = function () {return end !== undefined;}
	    this.open = function () {return start !== undefined;}
	    this.next =  function () {
	      const expressions = [];
	      if (currStage._meta && currStage._meta.repeat) {
	        currStage = stages;
	      }
	      Object.values(currStage).map(
	        function (val) {if (val._meta) expressions.push(val._meta.expr);}
	      )
	      return alwaysPossible.concat(expressions);
	    };
	  }
	}
	
	function parse(exprDef, str) {
	  exprDef = exprDef.clone();
	  let index = 0;
	  let modified = '';
	  const breakDown = [];
	  const stack = [];
	
	  function topOfStack() {
	    return stack[stack.length - 1];
	  }
	
	  function closeCheck(exprDef) {
	    if (exprDef && (exprDef.canEnd() || exprDef.endDefined())) {
	      let result = exprDef.find(str, index);
	      if (result.index) {
	        modified += result.changes;
	        return result.index;
	      }
	    }
	  }
	
	  function checkArray(exprDef, array) {
	    if (exprDef.endDefined()) {
	      let nextIndex = closeCheck(exprDef);
	      if (nextIndex) return nextIndex;
	    }
	    for (let aIndex = 0; aIndex < array.length; aIndex += 1) {
	      const childExprDef = array[aIndex].clone(exprDef.getNotice);
	      const result = childExprDef.find(str, index);
	      if (result.index !== -1) {
	        modified += result.changes;
	        if (childExprDef.closed()) {
	          breakDown.push(childExprDef);
	        } else {
	          stack.push(childExprDef);
	        }
	        return result.index;
	      }
	    }
	    if (exprDef.canEnd()) {
	      nextIndex = closeCheck(exprDef);
	      if (nextIndex) return nextIndex;
	    }
	    throw new Error(`Invalid string @ index ${index}\n'${str.substr(0, index)}' ??? '${str.substr(index)}'`);
	  }
	
	  function open(exprDef, index) {
	    const always = exprDef.getAlways();
	    while (!exprDef.open()) {
	      let result = exprDef.find(str, index);
	      modified += result.changes;
	      if(result.index === -1) {
	        let newIndex = checkArray(exprDef, always);
	        index = newIndex;
	      } else {
	        if (exprDef.closed()) {
	          breakDown.push(exprDef);
	        } else {
	          stack.push(exprDef);
	        }
	        index = result.index;
	      }
	    }
	    return index;
	  }
	
	  let loopCount = 0;
	  index = open(exprDef, index);
	  progress = [-3, -2, -1];
	  while (topOfStack() !== undefined) {
	    const tos = topOfStack();
	    if (progress[0] === index) {
	      throw new Error(`ExprDef stopped making progress`);
	    }
	    let stackIds = '';
	    let options = '';
	    stack.map(function (value) {stackIds+=value.getName() + ','});
	    tos.next().map(function (value) {options+=value.getName() + ','})
	    index = checkArray(tos, tos.next());
	    if (tos.closed()) {
	      stack.pop();
	    }
	    loopCount++;
	  }
	  // if (index < str.length) {
	  //   throw new Error("String not fully read");
	  // }
	  return modified;
	}
	
	
	ExprDef.parse = parse;
	
	if ((typeof module) !== 'undefined')
	  module.exports = ExprDef;
	
});


RequireJS.addFunction('./public/js/utils/$t.js',
function (require, exports, module) {
	

	
	const moduleExists = (typeof module) !== 'undefined';
	
	if (moduleExists) {
	CustomEvent = require('./custom-event');
	ExprDef = require('./expression-definition');
	}
	
	class $t {
		constructor(template, id, selector) {
			if (selector) {
				CustomEvent.all(this, 'after.render', 'before.render');
			}
	
			function varReg(prefix, suffix) {
			  const vReg = '([a-zA-Z_\\$][a-zA-Z0-9_\\$]*)';
			  prefix = prefix ? prefix : '';
			  suffix = suffix ? suffix : '';
			  return new RegExp(`${prefix}${vReg}${suffix}`)
			};
	
			function replace(needleRegEx, replaceStr, exceptions) {
			  return function (sub) {
			    if (!exceptions || exceptions.indexOf(sub) === -1) {
			      return sub.replace(needleRegEx, replaceStr)
			    } else {
			      return sub;
			    }
			  }
			}
	
			const relationalProps = {opening: /((!==|===|!=|==|\<|\>|\<\=|\>\=|\|\||\||&&|&))/};
	    const signProps = {opening: /([-+\!])/};
			const ternaryProps = {opening: /\?/};
			const keyWordProps = {opening: /(new|null|undefined|typeof|NaN|true|false)[^a-z^A-Z]/, tailOffset: -1};
	      		const ignoreProps = {opening: /new \$t\(.*?\).render\(.*?, (.*?), get\)|\$t\.clean\(.*?\)/};
			const commaProps = {opening: /,/};
			const colonProps = {opening: /:/};
			const multiplierProps = {opening: /([-+*\/%](=|))/};
			const stringProps = {opening: /('|"|`)(\1|.*?([^\\]((\\\\)*?|[^\\])(\1)))/};
			const spaceProps = {opening: /\s{1}/};
			const numberProps = {opening: /([0-9]*((\.)[0-9]{1,})|[0-9]{1,})/};
			const objectProps = {opening: '{', closing: '}'};
			const objectLabelProps = {opening: varReg(null, '\\:')};
			const groupProps = {opening: /\(/, closing: /\)/};
			const expressionProps = {opening: null, closing: null};
			const attrProps = {opening: varReg('(\\.', '){1,}')};
	
			// const funcProps = {
			//   opening: varReg(null, '\\('),
			//   onOpen: replace(varReg(null, '\\('), 'get("$1")('),
			//   closing: /\)/
			// };
			const arrayProps = {
			  opening: varReg(null, '\\['),
			  onOpen: replace(varReg(null, '\\['), 'get("$1")['),
			  closing: /\]/
			};
			const funcRefProps = {
				opening: /\[|\(/,
				closing: /\]|\)/
			};
			const memberRefProps = {
				opening: varReg('\\.', ''),
			};
			const variableProps = {
			  opening: varReg(),
			  onOpen: replace(varReg(), 'get("$1")'),
			};
			const objectShorthandProps = {
			  opening: varReg(),
			  onOpen: replace(varReg(), '$1: get("$1")'),
			};
	
	
			const expression = new ExprDef('expression', expressionProps);
			const ternary = new ExprDef('ternary', ternaryProps);
			const relational = new ExprDef('relational', relationalProps);
			const comma = new ExprDef('comma', commaProps);
			const colon = new ExprDef('colon', colonProps);
			const attr = new ExprDef('attr', attrProps);
			// const func = new ExprDef('func', funcProps);
			const funcRef = new ExprDef('funcRef', funcRefProps);
			const memberRef = new ExprDef('memberRef', memberRefProps);
			const string = new ExprDef('string', stringProps);
			const space = new ExprDef('space', spaceProps);
			const keyWord = new ExprDef('keyWord', keyWordProps);
			const group = new ExprDef('group', groupProps);
			const object = new ExprDef('object', objectProps);
			const array = new ExprDef('array', arrayProps);
			const number = new ExprDef('number', numberProps);
			const multiplier = new ExprDef('multiplier', multiplierProps);
			const sign = new ExprDef('sign', signProps);
			const ignore = new ExprDef('ignore', ignoreProps);
			const variable = new ExprDef('variable', variableProps);
			const objectLabel = new ExprDef('objectLabel', objectLabelProps);
			const objectShorthand = new ExprDef('objectShorthand', objectShorthandProps);
	
			expression.always(space, ignore, keyWord);
			expression.if(string, number, group, array, variable, funcRef, memberRef)
			      .then(multiplier, relational, sign, group)
			      .repeat();
			expression.if(string, group, array, variable, funcRef, memberRef)
						.then(attr)
			      .then(multiplier, relational, sign, expression, funcRef, memberRef)
						.repeat();
			expression.if(string, group, array, variable, funcRef, memberRef)
						.then(attr)
						.end();
	
			funcRef.if(expression).then(comma).repeat();
			funcRef.if(expression).end();
			memberRef.if(expression).then(comma).repeat();
			memberRef.if(expression).end();
	
	    expression.if(relational)
			      .then(expression)
			      .then(multiplier, relational, sign, group)
			      .repeat();
			expression.if(sign)
			      .then(expression)
			      .then(multiplier, relational, sign, group)
			      .repeat();
			expression.if(string, number, group, array, variable)
			      .then(ternary)
			      .then(expression)
			      .then(colon)
			      .then(expression)
			      .end();
			expression.if(ternary)
			      .then(expression)
			      .then(colon)
			      .then(expression)
			      .end();
			expression.if(object, string, number, group, array, variable)
			      .end();
			expression.if(sign)
			      .then(number)
			      .end();
	
			object.always(space, ignore, keyWord);
			object.if(objectLabel).then(expression).then(comma).repeat();
			object.if(objectShorthand).then(comma).repeat();
			object.if(objectLabel).then(expression).end();
			object.if(objectShorthand).end();
	
			group.always(space, ignore, keyWord);
			group.if(expression).then(comma).repeat();
			group.if(expression).end();
	
			array.always(space, ignore, keyWord);
			array.if(expression).then(comma).repeat();
			array.if(expression).end();
	
			function getter(scope, parentScope) {
				if (!(parentScope instanceof Function) && parentScope instanceof Object)
					parentScope = getter(parentScope);
				parentScope = parentScope || function () {return undefined};
				function get(name) {
					if (name === 'scope') return scope;
					const split = new String(name).split('.');
	        if (split.length === 0) return currObj[split]
					let currObj = scope;
					for (let index = 0; currObj != undefined && index < split.length; index += 1) {
						currObj = currObj[split[index]];
					}
					if (currObj !== undefined) return currObj;
					const parentScopeVal = parentScope(name);
					if (parentScopeVal !== undefined) return parentScopeVal;
	        else {
	          const globalVal = $t.global(name);
	          return globalVal === undefined ? '' : globalVal;
	        }
				}
				return get;
			}
	
			function defaultArray(elemName, get) {
				let resp = '';
				for (let index = 0; index < get('scope').length; index += 1) {
					if (elemName) {
						const obj = {};
						obj.$index = index;
						obj[elemName] = get(index);
						resp += new $t(template).render(obj, undefined, get);
					} else {
						const parentScope = getter({$index: index}, get);
						resp += new $t(template).render(get(index), undefined, parentScope);
					}
				}
				return `${resp}`;
			}
	
			function arrayExp(varName, get) {
				varName = varName.trim();
				const array = get('scope');
				let built = '';
				for (let index = 0; index < array.length; index += 1) {
					const obj = {};
					obj[varName] = array[index];
					obj.$index = index;
					built += new $t(template).render(obj, undefined, get);
				}
				return built;
			}
	
			function itOverObject(varNames, get) {
				const match = varNames.match($t.objectNameReg);
				const keyName = match[1];
				const valueName = match[2];
				const obj = get('scope');
				const keys = Object.keys(obj);
				const isArray = Array.isArray(obj);
				let built = '';
				for (let index = 0; index < keys.length; index += 1) {
					let key = keys[index];
					if (!isArray || key.match(/^[0-9]{1,}$/)) {
						if (isArray) key = Number.parseInt(key);
						const childScope = {};
						childScope[keyName] = key;
						childScope[valueName] = obj[key];
						childScope.$index = index;
						built += new $t(template).render(childScope, undefined, get);
					}
				}
	      return built;
			}
	
			function rangeExp(rangeItExpr, varName, get) {
				const match = rangeItExpr.match($t.rangeItExpReg);
				const elemName = varName;
				let startIndex = (typeof match[2]) === 'number' ||
							match[1].match(/^[0-9]*$/) ?
							match[1] : get(`${match[2]}`);
				let endIndex = (typeof match[3]) === 'number' ||
							match[2].match(/^[0-9]*$/) ?
							match[2] : get(`${match[3]}`);
				if (((typeof startIndex) !== 'string' &&
								(typeof	startIndex) !== 'number') ||
									(typeof endIndex) !== 'string' &&
									(typeof endIndex) !== 'number') {
										throw Error(`Invalid range '${rangeItExpr}' evaluates to '${startIndex}..${endIndex}'`);
				}
	
				try {
					startIndex = Number.parseInt(startIndex);
				} catch (e) {
					throw Error(`Invalid range '${rangeItExpr}' evaluates to '${startIndex}..${endIndex}'`);
				}
				try {
					endIndex = Number.parseInt(endIndex);
				} catch (e) {
					throw Error(`Invalid range '${rangeItExpr}' evaluates to '${startIndex}..${endIndex}'`);
				}
	
				let index = startIndex;
				let built = '';
				while (true) {
					let increment = 1;
					if (startIndex > endIndex) {
						if (index <= endIndex) {
							break;
						}
						increment = -1;
					} else if (index >= endIndex) {
						break;
					}
					const obj = {$index: index};
					obj[elemName] = index;
					built += new $t(template).render(obj, undefined, get);
					index += increment;
				}
				return built;
			}
	
			function evaluate(get) {
				if ($t.functions[id]) {
					try {
						return $t.functions[id](get, $t);
					} catch (e) {
					  console.error(e);
					}
				} else {
					return eval($t.templates[id])
				}
			}
	
			function type(scope, expression) {
	      const noExpression = expression === undefined || expression === null || expression === '';
				if ((typeof scope) === 'string' && scope.match($t.rangeAttemptExpReg)) {
					if (scope.match($t.rangeItExpReg)) {
						return 'rangeExp'
					}
					return 'rangeExpFormatError';
				} else if (Array.isArray(scope)) {
					if (noExpression) {
						return 'defaultArray';
					} else if (expression.match($t.nameScopeExpReg)) {
						return 'nameArrayExp';
					}
				}
	
				if ((typeof scope) === 'object') {
					if (noExpression) {
						return 'defaultObject';
					} else if (expression.match($t.objectNameReg)){
						return 'itOverObject';
					} else if (expression.match($t.arrayNameReg)){
						return 'arrayExp';
					} else {
						return 'invalidObject';
					}
				} else {
					return 'defaultObject';
				}
			}
	
			function render(scope, varName, parentScope) {
	      if (scope === undefined) return '';
				let rendered = '';
				const get = getter(scope, parentScope);
				switch (type(scope, varName)) {
					case 'rangeExp':
						rendered = rangeExp(scope, varName, get);
						break;
					case 'rangeExpFormatError':
						throw new Error(`Invalid range itteration expression "${varName}"`);
					case 'defaultArray':
						rendered = defaultArray(varName, get);
						break;
					case 'nameArrayExp':
						rendered = defaultArray(varName, get);
						break;
					case 'arrayExp':
						rendered = arrayExp(varName, get);
						break;
					case 'invalidArray':
						throw new Error(`Invalid iterative expression for an array "${varName}"`);
					case 'defaultObject':
						rendered = evaluate(get);
						break;
					case 'itOverObject':
						rendered = itOverObject(varName, get);
						break;
					case 'invalidObject':
						throw new Error(`Invalid iterative expression for an object "${varName}"`);
					default:
						throw new Error(`Programming error defined type '${type()}' not implmented in switch`);
				}
	
	      if (selector) {
	        const elem = document.querySelector(selector);
	        if (elem !== null) {
	          beforeRenderEvent.trigger();
	          elem.innerHTML = rendered;
						instance.trigger.after.render();
	        }
	      }
				return rendered;
			}
	
	
	//---------------------  Compile Functions ---------------//
	
			function stringHash(string) {
				let hashString = string;
				let hash = 0;
				for (let i = 0; i < hashString.length; i += 1) {
					const character = hashString.charCodeAt(i);
					hash = ((hash << 5) - hash) + character;
					hash &= hash; // Convert to 32bit integer
				}
				return hash;
			}
	
			function isolateBlocks(template) {
				let inBlock = false;
				let openBracketCount = 0;
				let block = '';
				let blocks = [];
				let str = template;
				for (let index = 0; index < str.length; index += 1) {
					if (inBlock) {
						block += str[index];
					}
					if (!inBlock && index > 0 &&
						str[index] == '{' && str[index - 1] == '{') {
						inBlock = true;
					} else if (inBlock && str[index] == '{') {
						openBracketCount++;
					} else if (openBracketCount > 0 && str[index] == '}') {
						openBracketCount--;
					} else if (str[index + 1] == '}' && str[index] == '}' ) {
						inBlock = false;
						blocks.push(`${block.substr(0, block.length - 1)}`);
						block = '';
					}
				}
				return blocks;
			}
	
			function resolve(str) {
				return ExprDef.parse(expression, str);
			}
	
			function compile(strToCompile) {
	      			if (!strToCompile) strToCompile = template;
				const blocks = isolateBlocks(strToCompile);
				let str = strToCompile;
				for (let index = 0; index < blocks.length; index += 1) {
					const parced = resolve(blocks[index]);
					str = str.replace(`{{${blocks[index]}}}`, `\` + $t.clean(${parced}) + \``);
				}
				return `\`${str}\``;
			}
	
			// format: <[tagName]:t .*repeat='[repeatExpression]'.*$t-id='[templateName]'.*>[templateHtml]</[tagName]:t>
			const repeatReg = /<([a-zA-Z-]*):t( ([^>]* |))repeat=("|')(([^>^\4]*?)\s{1,}in\s{1,}([^>^\4]*?))\4([^>]*>((?!(<\1:t[^>]*>|<\/\1:t>)).)*<\/)\1:t>/;
			function formatRepeat(string) {
				let match;
				while (match = string.match(repeatReg)) {
					let tagContents = match[2] + match[8];
	        let tagName = match[1];
	        let varNames = match[6];
	        let realScope = match[7];
					let template = `<${tagName}${tagContents}${tagName}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
					let templateName = tagContents.replace(/.*\$t-id=('|")([\.a-zA-Z-_\/]*?)(\1).*/, '$2');
					let scope = 'scope';
					template = templateName !== tagContents ? templateName : template;
					templateName = exprToStr(templateName);
					if (templateName.indexOf(' + ') === -1) {
						const t = templateName === instance.id() ? instance : eval(`new $t(\`${template}\`)`);
						templateName = `'${t.id()}'`;
					}
	        let resolvedScope = "get('scope')";
	        try {
						if (realScope.match(/[0-9]{1,}\.\.[0-9]{1,}/)){
	            resolvedScope = `'${realScope}'`;
	          } else {
	            resolvedScope = ExprDef.parse(expression, realScope);
	          }
	        } catch (e) {}
	        string = string.replace(match[0], `{{ new $t(${templateName}).render(${resolvedScope}, '${varNames}', get)}}`);
				}
				return string;
			}
	
	    function exprToStr(expr) {
	      if (isolateBlocks(expr).length === 0) return `'${expr}'`;
	      const raw = compile(expr);
	      const formatted = raw.replace(/(^ \+ | \+ $)/, '');
	      return formatted;
	    }
	
	    // format: <[tagName]:t .*$t-id='[templateName]'.*>[scopeVariableName]</[tagName]:t>
	    const templateReg = /<([a-zA-Z-]*):t( ([^>]* |))\$t-id=("|')([^>^\4]*?)\4([^>]*>(((?!(<\1:t[^>]*>|<\/\1:t>)).)*)<\/)\1:t>/;
			function formatTemplate(string) {
				let match;
				while (match = string.match(templateReg)) {
					let tagContents = match[7];
					let tagName = match[1];
					let template = `<${tagName}${tagContents}${tagName}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
					let templateName = match[0].replace(/.*\$t-id=('|")(.*?)(\1).*/, '$2');
	        templateName = exprToStr(templateName);
					template = templateName !== tagContents ? templateName : template;
					let resolvedScope = ExprDef.parse(expression, match[7].trim() || "scope");
					string = string.replace(match[0], `{{ new $t(${templateName}).render(${resolvedScope}, undefined, get)}}`);
				}
				return string;
			}
	
			if (id) {
				$t.templates[id] = undefined;
				$t.functions[id] = undefined;
			}
	
			template = template.replace(/\s{1,}/g, ' ');
	    const fileStringMatch = template.match(/^[a-zA-Z0-9\/\._-]{1,}$/) !== null;
			id = fileStringMatch ? template : id || stringHash(template);
	    this.id = () => id;
			if (!$t.functions[id]) {
				if (!$t.templates[id]) {
					template = template.replace(/\s{2,}|\n/g, ' ');
					template = formatRepeat(template);
					template = formatTemplate(template);
					$t.templates[id] = compile();
				}
			}
			this.compiled = function () { return $t.templates[id];}
			this.render = render;
			this.type = type;
			this.isolateBlocks = isolateBlocks;
	    this.id = () => id;
		}
	}
	
	$t.templates = {};//{"-1554135584": '<h1>{{greeting}}</h1>'};
	$t.functions = {};
	$t.loadFunctions = (functions) => {
		Object.keys(functions).forEach((name) => {
			$t.functions[name] = functions[name];
		});
	
	}
	$t.isTemplate = (id) => $t.functions[id] !== undefined;
	$t.arrayNameReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
	$t.objectNameReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*,\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
	$t.rangeAttemptExpReg = /^\s*(.*\.\..*)\s*$/;
	$t.rangeItExpReg = /^\s*([a-z0-9A-Z]*)\.\.([a-z0-9A-Z]*)\s*$/;
	$t.nameScopeExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
	$t.quoteStr = function (str) {
			str = str.replace(/\\`/g, '\\\\\\`')
			str = str.replace(/([^\\])`/g, '$1\\\`')
			return `\`${str.replace(/``/g, '`\\`')}\``;
		}
	$t.formatName = function (string) {
	    function toCamel(whoCares, one, two) {return `${one}${two.toUpperCase()}`;}
	    return string.replace(/([a-z])[^a-z^A-Z]{1,}([a-zA-Z])/g, toCamel);
	}
	$t.dumpTemplates = function (debug) {
		let templateFunctions = '';
		let tempNames = Object.keys($t.templates);
		for (let index = 0; index < tempNames.length; index += 1) {
			const tempName = tempNames[index];
			if (tempName) {
				let template = $t.templates[tempName] || tempName;
	      if (debug === true) {
	        const endTagReg = /( \+) /g;
	        template = template.replace(endTagReg, '$1\n\t\t');
	      }
				templateFunctions += `\nexports['${tempName}'] = (get, $t) => \n\t\t${template}\n`;
			}
		}
		return templateFunctions;
	}
	
	$t.clean = (val) => val === undefined ? '' : val;
	
	function createGlobalsInterface() {
	  const GLOBALS = {};
	  const isMotifiable = (name) => GLOBALS[name] === undefined ||
	        GLOBALS[name].imutable !== 'true';
	  $t.global = function (name, value, imutable) {
	    if (value === undefined) return GLOBALS[name] ? GLOBALS[name].value : undefined;
	    if (isMotifiable(name)) GLOBALS[name] = {value, imutable};
	  }
	  $t.rmGlobal = function(name) {
	    if (isMotifiable(name)) delete GLOBALS[name];
	  }
	}
	createGlobalsInterface();
	
	if (moduleExists) module.exports = $t;
	
});


RequireJS.addFunction('./public/js/utils/object/lookup.js',
function (require, exports, module) {
	
class IdString extends String {
	  constructor(...ids) {
	    let id = '';
	    for (let index = 0; index < ids.length; index++) {
	      id += `${ids[index]}_`;
	    }
	    id = id.substring(0, id.length - 1);
	    super(id);
	    this.split = () => {
	      return id.split('_');
	    }
	    this.toJson = () => new String(id).toString();
	    this.index = (index) => this.split().at(index);
	    this.equals = (other) => `${this}` ===`${other}`;
	    this.equivalent = (other, ...indicies) => {
	      if (indicies.length === 0) return this.equals(other);
	      const thisSplit = this.split();
	      const otherSplit = other.split();
	      for (let index = 0; index < indicies.length; index++) {
	        const i = indicies[index];
	        if (thisSplit[i] !== otherSplit[i]) return false;
	      }
	      return true;
	    }
	  }
	}
	
	
	
	class Lookup {
	  constructor(id, attr, singleton) {
	    if (id && id._TYPE) {
	      attr = id.ID_ATTRIBUTE;
	      id = id.id;
	    }
	    Lookup.convert(this, attr, id, singleton);
	  }
	}
	
	Lookup.convert = function (obj, attr, id, singleton) {
	  if (id) {
	    const decoded = Lookup.decode(id);
	    if (decoded) {
	      id = decoded.id;
	    } else if (id._TYPE !== undefined) {
	      id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
	    }
	  }
	
	  const cxtr = obj.constructor;
	  const cxtrName = cxtr.name;
	  id = new IdString(cxtrName, id || String.random());
	  let group;
	  if (singleton && cxtr.get(id)) return cxtr.get(id);
	
	  let constructedAt = new Date().getTime();
	  let modificationWindowOpen = true;
	  attr = attr || 'id';
	  if (obj.constructor.name === 'Object' && !obj.toJson) {
	    obj.toJson = () => JSON.copy(obj);
	  }
	  obj.lookupGroup = (g) => {
	    if (group === undefined && g !== undefined) {
	      if (Lookup.groups[g] === undefined) Lookup.groups[g] = [];
	      group = g;
	      Lookup.groups[g].push(obj);
	    }
	    return group;
	  }
	
	  obj.lookupRelease = () => {
	    if (cxtr.reusable === true) {
	      if (Lookup.freeAgents[cxtr.name] === undefined) Lookup.freeAgents[cxtr.name] = [];
	      Lookup.freeAgents[cxtr.name].push(obj);
	      const index = Lookup.groups[group] ? Lookup.groups[group].indexOf(obj) : -1;
	      if (index !== -1) Lookup.groups[group].splice(index, 1);
	    }
	    delete Lookup.byId[cxtr.name][obj[attr]().index(-1)];
	  }
	
	
	  obj[Lookup.ID_ATTRIBUTE] = () => attr;
	  obj[attr] = (idStr) => {
	    if (modificationWindowOpen) {
	      if ((typeof idStr) === 'string' && idStr) idStr = new IdString(idStr);
	      if (idStr instanceof IdString && idStr.split().length === 2) {
	        let objId = idStr.index(-1);
	        id = new IdString(cxtrName, objId);
	        Lookup.byId[cxtr.name][id.index(-1)] = obj;
	        modificationWindowOpen = false;
	      } else if (constructedAt < new Date().getTime() - 200) {
	        modificationWindowOpen = false;
	      }
	    }
	    return id;
	  }
	
	  function registerConstructor() {
	    if (Lookup.byId[cxtr.name] === undefined) {
	      Lookup.byId[cxtr.name] = {};
	      Lookup.constructorMap[cxtr.name] = cxtr;
	    }
	  }
	
	  function addSelectListFuncToConstructor() {
	    if (cxtr !== Lookup) {
	      if(cxtr.selectList === Lookup.selectList) {
	        cxtr.get = (id) => Lookup.get(id, cxtr);
	        if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
	        Lookup.byId[cxtr.name] = {};
	        cxtr.selectList = () => Lookup.selectList(cxtr.name);
	      }
	    }
	  }
	
	  registerConstructor();
	  addSelectListFuncToConstructor();
	
	  if (id.toString() === 'Group_9kcdyju') {
	    console.log('foundOne');
	  }
	
	  if (!Lookup.byId[cxtrName][id.index(-1)])
	    Lookup.byId[cxtrName][id.index(-1)] = obj;
	  else
	    console.warn(`Lookup id '${id}' object has been created more than once.`);
	  if (obj.toString === undefined) obj.toString = () => obj[attr]();
	}
	
	Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
	Lookup.byId = {Lookup};
	Lookup.constructorMap = {Lookup: Lookup};
	Lookup.groups = {};
	Lookup.freeAgents = {};
	
	Lookup.get = (id, cxtr) => {
	  const decoded = Lookup.decode(id);
	  let decodedId, decodedCxtr;
	  if (decoded) {
	    decodedId = decoded.id;
	    decodedCxtr = decoded.constructor;
	  }
	  id = decodedId || id;
	  cxtr = cxtr || decodedCxtr || Lookup;
	  const instance = Lookup.byId[cxtr.name][id] || (decodedCxtr && Lookup.byId[decodedCxtr.name][id]);
	  return instance;
	}
	Lookup.selectList = (className) => {
	  return Object.keys(Lookup.byId[className]);
	}
	Lookup.instance = (cxtrName) => {
	  const agents = Lookup.freeAgents[cxtrName];
	  if (!agents || agents.length === 0) {
	    return new (Lookup.constructorMap[cxtrName])();
	  }
	
	  const index = agents.length - 1;
	  const agent = agents[index];
	  agents.splice(index, 1);
	  return agent;
	}
	Lookup.decode = (id) => {
	  if ((typeof id) === 'string') id = new IdString(...id.split('_'));
	  if (!(id instanceof IdString)) return;
	  const cxtrId = id.index(0);
	  const objId = id.index(-1);
	  return {
	    constructor: cxtrId === objId ? undefined : Lookup.constructorMap[cxtrId],
	    id: objId
	  };
	}
	Lookup.release = (groupOlist) => {
	  if ((typeof groupOobject) === 'string') {
	    const groupList = Lookup.groups[groupOlist];
	    if (groupList === undefined) return;
	    Lookup.groups[groupOlist] = [];
	    for (let index = 0; index < groupList.length; index += 1) {
	      groupList[index].release();
	    }
	  } else if (Array.isArray(groupOlist)) {
	    for (let index = 0; index < groupOlist.length; index++) {
	      const obj = groupOlist[index];
	      if (obj && obj.lookupRelease instanceof Function) obj.lookupRelease();
	    }
	  }
	}
	
	Lookup.fromJson = (json, obj) => {
	  const attr = json[Lookup.ID_ATTRIBUTE];
	  if (attr) {
	    const obj = Lookup.get(json[attr]);
	    if(obj) return obj;
	  }
	
	  const type = json._TYPE;
	  if (type && type === 'Lookup') return new Lookup(json);
	  obj ||= Object.fromJson(json);
	  if (obj instanceof Lookup) return obj;
	  if (attr) {
	    Lookup.convert(obj, obj[attr], attr);
	    return obj;
	  }
	  return null;
	}
	
	Lookup.IdString = IdString;
	try {
	  module.exports = Lookup;
	} catch (e) {}
	
});


RequireJS.addFunction('./public/js/utils/custom-event.js',
function (require, exports, module) {
	
let domAccessible = false;
	
	try {
	  document;
	  domAccessible = true;
	} catch (e) {}
	
	
	
	
	class CustomEvent {
	  constructor(name) {
	    const watchers = [];
	    this.name = name;
	    let lastArgs;
	
	    const runFuncs = (elem, detail) =>
	    watchers.forEach((func) => {
	      try {
	        func(elem, detail, event);
	      } catch (e) {
	        console.error(e);
	      }
	    });
	
	
	    this.watchers = () => watchers;
	    this.on = function (func) {
	      if ((typeof func) === 'function') {
	        if (lastArgs)
	          func(...lastArgs);
	        if (watchers.indexOf(func) === -1) watchers.push(func);
	      } else {
	        return 'on' + name;
	      }
	    }
	
	    this.remove = (func) =>
	      watchers.remove(func);
	
	
	    this.trigger = function (element, detail) {
	      lastArgs = [element, detail];
	      element = element !== undefined ? element : domAccessible ? window : detail;
	      runFuncs(element, detail);
	      event.detail = detail;
	      if (domAccessible) {
	        if (element instanceof HTMLElement) {
	          if(document.createEvent){
	            element.dispatchEvent(event);
	          } else {
	            element.fireEvent("on" + event.eventType, event);
	          }
	        }
	      }
	    }
	//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
	    let event;
	    if (domAccessible) {
	      if(document.createEvent){
	        event = document.createEvent("HTMLEvents");
	        event.initEvent(name, true, true);
	        event.eventName = name;
	      } else {
	        event = document.createEventObject();
	        event.eventName = name;
	        event.eventType = name;
	      }
	    } else {
	      event = {name, type: name};
	    }
	    this.event = event;
	  }
	}
	
	CustomEvent.all = (obj, eventObject, ...eventNames) => {
	  if (eventObject instanceof Object) {
	    eventNames.concatInPlace(Object.keys(eventObject));
	  } else {
	    eventNames.push(eventObject);
	    eventObject = {};
	  }
	  if (obj.on === undefined) obj.property('on', {}, false);
	  if (obj.trigger === undefined) obj.property('trigger', {}, false);
	  if (obj.events === undefined) obj.property('events', {}, false);
	  for (let index = 0; index < eventNames.length; index++) {
	    const name = eventNames[index];
	    const e = eventObject[name] || new CustomEvent(name);
	    obj.events.property(name, e, false);
	    if (obj.on[name] === undefined) obj.on.property(name, e.on, false);
	    else obj.on[name](e.trigger);
	    obj.trigger.property(name, (...args) => e.trigger.apply(e, args), false);
	  }
	}
	
	CustomEvent.dynamic = () => {
	  const events = {};
	  return {
	    on: (eventType, func) => {
	      if (events[eventType] === undefined)
	        events[eventType] = new CustomEvent(eventType);
	      events[eventType].on(func);
	    },
	    trigger: (event, detail) => {
	      if (events[event.type] === undefined) return;
	      events[event.type].trigger(event, detail);
	    }
	  }
	}
	
	if ((typeof module) !== 'undefined')
	  module.exports = CustomEvent;
	
});


RequireJS.addFunction('./services/cabinet/generated/html-templates.js',
function (require, exports, module) {
	
exports['40671914'] = (get, $t) => 
			`<tr class='btm-border-barely-visible'> <td>` +
			$t.clean(get("cabinet").groupIndex()) +
			`</td> <td>` +
			$t.clean(get("cabinet").name()) +
			`</td> <td>` +
			$t.clean(get("Utils").display.demensions(get("cabinet").position().demension())) +
			`</td> <td class='min-width-20'>` +
			$t.clean(get("cabinet").value('show.left.type')) +
			`</td> <td class='min-width-20'>` +
			$t.clean(get("cabinet").value('show.right.type')) +
			`</td> <td class='min-width-20'>` +
			$t.clean(get("cabinet").value('show.left.endStyle')) +
			`</td> <td class='min-width-20'>` +
			$t.clean(get("cabinet").value('show.right.endStyle')) +
			`</td> <td>` +
			$t.clean(get("Utils").count.shelves(get("cabinet")) || '') +
			`</td> <td class='align-left'>` +
			$t.clean(get("Utils").textToHtml(get("cabinet").notes())) +
			`</td> </tr>`
	
	exports['107913065'] = (get, $t) => 
			`<td class='cut-info-cnt tab font-medium' > ` +
			$t.clean(get("loc").vertexLabel) +
			`@` +
			$t.clean(get("loc").length ? get("display").measurement(get("loc").length) : '') +
			`</td>`
	
	exports['110915528'] = (get, $t) => 
			`<div key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> <div class="expand-header ` +
			$t.clean(get("type")()) +
			`` +
			$t.clean(get("active")() === get("item") ? ' active' : '') +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
	exports['115117775'] = (get, $t) => 
			`<div ` +
			$t.clean(get("hideAll")(get("properties")) ? 'hidden' : '') +
			`> <div class="property-container close" radio-id='666'> <div class='` +
			$t.clean(get("key") ? "expand-header" : "") +
			`'> ` +
			$t.clean(get("key")) +
			` </div> <div id='config-expand-list-` +
			$t.clean(get("childIdMap")[get("key")]) +
			`' hidden> ` +
			$t.clean(get("childIdMap")[get("key")]) +
			` </div> </div> </div>`
	
	exports['133324092'] = (get, $t) => 
			`<div index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("getXyzSelect")('').html()) +
			` <input class='template-input xyz' attr='subassemblies' name='polyConfig.points.` +
			$t.clean(get("$index")) +
			`' value='` +
			$t.clean(get("point")[0]) +
			`'> <input disabled class='measurement-input' name='value'> <input type="checkbox" name="convert" checked> <button class="remove-btn smaller" key="0">X</button> </div>`
	
	exports['134249436'] = (get, $t) => 
			`<div class='avoid-page-break'> <h2 class=''>` +
			$t.clean(get("section").toSentance()) +
			`</h2> <div class='everything-` +
			$t.clean(get("section").toKebab()) +
			`-cnt'> <h3>Coming Soon...</h3> </div> </div>`
	
	exports['184800797'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("section").prototype.constructor.name) +
			`' ` +
			$t.clean(get("opening").coverType() === get("section").name ? 'selected' : '') +
			`> ` +
			$t.clean(get("section").name.toSentance().replace('Section', '')) +
			` </option>`
	
	exports['406900361'] = (get, $t) => 
			`<option ` +
			$t.clean(get("partCode") === 'c_BACK' ? 'selected' : '') +
			`> ` +
			$t.clean(get("partCode")) +
			` </option>`
	
	exports['447219845'] = (get, $t) => 
			`<no-tag > <td>` +
			$t.clean(get("section").userFriendlyIndex()) +
			`)</td> <td> ` +
			$t.clean(get("disp").measurement(get("section").innerWidth())) +
			` X ` +
			$t.clean(get("disp").measurement(get("section").innerLength())) +
			` <br> ` +
			$t.clean(get("section").value('shelves') > 0 ? "Adj Shelves: " +
			get("section").value('shelves') : '') +
			` </td> ` +
			$t.clean((get("$index") % 2) === 0 ? '<td>&nbsp&nbsp&nbsp</td>' : '') +
			` </no-tag>`
	
	exports['550500469'] = (get, $t) => 
			`<span > <input list='auto-fill-list-` +
			$t.clean(get("input").id() +
			get("willFailCheckClassnameConstruction")()) +
			` expand-list-` +
			$t.clean(get("type")()) +
			`-input' id='` +
			$t.clean(get("input").id()) +
			`' placeholder='` +
			$t.clean(get("input").placeholder) +
			`' type='text'> <datalist id="auto-fill-list-` +
			$t.clean(get("input").id()) +
			`"> ` +
			$t.clean( new $t('-1921787246').render(get("input").autofill(), 'option', get)) +
			` </datalist> </span>`
	
	exports['568362631'] = (get, $t) => 
			`<div class='room-part-doc-cnt' > ` +
			$t.clean(get("DocumentationHtml").parts.group(get("group"), get("partType"))) +
			` </div>`
	
	exports['672662266'] = (get, $t) => 
			`<div ` +
			$t.clean(get("selected").is(get("title")) ? 'class="selected"' : 'empty-contents') +
			` title='` +
			$t.clean(get("title")) +
			`' ` +
			$t.clean(get("selected").is(get("title")) ? '' : 'hidden') +
			`> ` +
			$t.clean(get("title") === get("selected")() ? get("html")(get("title")) : '') +
			` </div>`
	
	exports['678094078'] = (get, $t) => 
			`<tr > ` +
			$t.clean( new $t('447219845').render(get("set"), 'section', get)) +
			` </tr>`
	
	exports['714657883'] = (get, $t) => 
			`<div >` +
			$t.clean(get("groupHtml")(get("group"))) +
			`</div>`
	
	exports['772459705'] = (get, $t) => 
			`<option ` +
			$t.clean(get("pull").location().position === get("location").position ? 'selected' : '') +
			`> ` +
			$t.clean(get("id")) +
			` </option>`
	
	exports['821257078'] = (get, $t) => 
			`<li ` +
			$t.clean(get("title") === get("selected")() ? 'class="selected"' : '') +
			` title='` +
			$t.clean(get("title")) +
			`'> ` +
			$t.clean(get("title")) +
			` </li>`
	
	exports['976176139'] = (get, $t) => 
			`<td > ` +
			$t.clean(get("col").html()) +
			` </td>`
	
	exports['1036581066'] = (get, $t) => 
			`<div class='tab' > ` +
			$t.clean(get("property").name()) +
			` (` +
			$t.clean(get("property").code()) +
			`) </div>`
	
	exports['1088583088'] = (get, $t) => 
			`<div > <input type='text' value='` +
			$t.clean(get("key")) +
			`'/> => ` +
			$t.clean(get("listItemHtml")(get("value"))) +
			` <br> </div>`
	
	exports['1100231627'] = (get, $t) => 
			`<th colspan='3' >` +
			$t.clean(get("char")) +
			`</th>`
	
	exports['1254550278'] = (get, $t) => 
			`<td >` +
			$t.clean(get("name")) +
			`</td>`
	
	exports['1410278299'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("property").name()) +
			`</label> <input type='radio' name='` +
			$t.clean(get("key")) +
			`' prop-radio-update='` +
			$t.clean(get("property").id()) +
			`' ` +
			$t.clean(get("property").value() === true ? 'checked' : '') +
			`> </span>`
	
	exports['1417643187'] = (get, $t) => 
			`<li name='` +
			$t.clean(get("property").name()) +
			`'> ` +
			$t.clean(get("property").name()) +
			` </li>`
	
	exports['1442479092'] = (get, $t) => 
			`<no-tag class='avery-5160 page'> <div class='half-inch-height'></div> ` +
			$t.clean( new $t('-1550030595').render(get("page"), 'row', get)) +
			` </no-tag>`
	
	exports['1507176312'] = (get, $t) => 
			`<div class='single-entry-cnt' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("setHtml")(get("$index"))) +
			` </div>`
	
	exports['1586878820'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("property").name()) +
			`</label> <input class='transparent' type='radio' name='UNIT2' value="` +
			$t.clean(get("property").name()) +
			`" ` +
			$t.clean(get("property").value() === true ? 'checked' : '') +
			` is-raw> </span>`
	
	exports['1618726004'] = (get, $t) => 
			`<div class="cabinet-part-doc-cnt" > <div class='avoid-page-break part-top-margin'> <div class='part-header-cnt'> <h3 class='part-header'> ` +
			$t.clean(get("info").parts.length) +
			`|` +
			$t.clean(get("info").partsId) +
			`) ` +
			$t.clean(get("disp").demensions(get("info").demensions)) +
			` &nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp; ` +
			$t.clean(get("disp").partIds(get("info").parts)) +
			` </h3> </div> <div class='font-medium part-cnt'> <div>` +
			$t.clean(get("toolingHtml")(get("info"))) +
			`</div> <span class='tab' id='` +
			$t.clean(get("viewContainer")(get("views")(get("info")).left)) +
			`'> <div class='part-label'><b>` +
			$t.clean(get("views")(get("info")).left.label) +
			`</b></div> <div class='part-material'><b>` +
			$t.clean(get("views")(get("info")).left.material) +
			`</b></div> <br> </span> <span class='tab border-left' id='` +
			$t.clean(get("viewContainer")(get("views")(get("info")).right)) +
			`'> <div class='part-label'><b>` +
			$t.clean(get("views")(get("info")).right.label) +
			`</b></div> <div class='part-material'><b>` +
			$t.clean(get("views")(get("info")).right.material) +
			`</b></div> <br> </span> </div> </div> </div>`
	
	exports['1682356664'] = (get, $t) => 
			`<div id="input-input-list-` +
			$t.clean(get("id")()) +
			`" > ` +
			$t.clean(get("input").html()) +
			` <br> </div>`
	
	exports['1819729875'] = (get, $t) => 
			`<th >` +
			$t.clean(get("char")) +
			`</th>`
	
	exports['1835219150'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("isArray")() ? get("value") : get("key")) +
			`' ` +
			$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
			`> ` +
			$t.clean(get("value")) +
			` </option>`
	
	exports['1856420978'] = (get, $t) => 
			`<li class='align-left ` +
			$t.clean(get("issue").solved ? 'strike' : '') +
			`' > ` +
			$t.clean(get("issue").text) +
			` </li>`
	
	exports['1860435907'] = (get, $t) => 
			`<div > <label>` +
			$t.clean(get("obj").key) +
			`</label> <input type='text' value='` +
			$t.clean(get("display")(get("obj").value)) +
			`' class='modifiable-value-input'> </div>`
	
	exports['1903603615'] = (get, $t) => 
			`<tr class='cut-info-cnt tab font-medium' > <td>` +
			$t.clean(get("item").width ? get("display").measurement(get("item").width) : '') +
			`</td> <td>` +
			$t.clean(get("item").depth ? get("display").measurement(get("item").depth) : '') +
			`</td> <td>` +
			$t.clean(get("item").length ? get("display").measurement(get("item").length) : '') +
			`</td> <td>` +
			$t.clean(get("item").angle ? get("display").degrees(get("item").angle) : '') +
			`</td> ` +
			$t.clean( new $t('107913065').render(get("item").relitiveLocations, 'loc', get)) +
			` </tr>`
	
	exports['1927703609'] = (get, $t) => 
			`<div > ` +
			$t.clean(get("recurse")(get("key"), get("group"))) +
			` </div>`
	
	exports['1932279957'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("void").label(get("i"))) +
			`</label> <input type='checkbox' name='` +
			$t.clean(get("void").label(get("i"))) +
			`' ` +
			$t.clean(get("void").include(get("void").label(get("i"))) ? 'checked' : '') +
			`> </span>`
	
	exports['1970100821'] = (get, $t) => 
			`<div index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("$index") +
			1) +
			`) <button class='remove-btn'>X</button> ` +
			$t.clean(get("sizeInputHtml")(get("$index"))) +
			` <label>Location</label> <select name='location'> ` +
			$t.clean( new $t('772459705').render(get("pull").constructor.location, 'id, location', get)) +
			` </select> </div>`
	
	exports['2053240362'] = (get, $t) => 
			`<span ` +
			$t.clean(get("task").progress() === 100 ? 'hidden' : '') +
			`> ` +
			$t.clean(get("task").process()) +
			`) ` +
			$t.clean(get("task").status()) +
			` ` +
			$t.clean(get("task").progress()) +
			`% <div class="loading-bar-cnt"> <div class="loading-bar center" style="width:` +
			$t.clean(get("task").progress()) +
			`%"> ` +
			$t.clean(get("task").progress()) +
			`% </div> </div> </span>`
	
	exports['2055573719'] = (get, $t) => 
			`<div > ` +
			$t.clean(get("CostManager").headHtml(get("child"))) +
			` ` +
			$t.clean(get("CostManager").bodyHtml(get("child"))) +
			` </div>`
	
	exports['auto-save'] = (get, $t) => 
			`<div> <button type="button" class='auto-save-btn' name="button">Auto Save</button> <span class='status'></span> </div> `
	
	exports['expandable/input-repeat'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('550500469').render(get("inputs")(), 'input', get)) +
			` <button ex-list-id='` +
			$t.clean(get("id")()) +
			`' class='expandable-list-add-btn' ` +
			$t.clean(get("hideAddBtn") ? 'hidden' : '') +
			`> Add ` +
			$t.clean(get("listElemLable")()) +
			` here </button> <div class='error' id='` +
			$t.clean(get("ERROR_CNT_ID")) +
			`'></div> </div> `
	
	exports['-1921787246'] = (get, $t) => 
			`<option value="` +
			$t.clean(get("option")) +
			`" ></option>`
	
	exports['expandable/list'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('-357054111').render(get("list")(), 'key, item', get)) +
			` <div class='expand-input-cnt' hidden has-input-tree='` +
			$t.clean(get("hasInputTree")()) +
			`'>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'> <button ` +
			$t.clean(get("hideAddBtn") ? 'hidden' : '') +
			`>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button> </div> </div> `
	
	exports['-357054111'] = (get, $t) => 
			`<div class="expandable-list-body" key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> <div class="expand-header ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`' ` +
			$t.clean(get("active")() === get("item") ? '' : 'hidden') +
			`> ` +
			$t.clean(get("initialBody")(get("key"))) +
			` </div> </div> </div>`
	
	exports['expandable/pill'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> <div class="expand-list-cnt ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('110915528').render(get("list")(), 'key, item', get)) +
			` <div class='input-open-cnt'> <button ` +
			$t.clean(get("hideAddBtn") ? 'hidden' : '') +
			`>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button> </div> </div> <div> <div class='expand-input-cnt' hidden>` +
			$t.clean(get("inputHtml")()) +
			`</div> <br> <div class='error' id='` +
			$t.clean(get("ERROR_CNT_ID")()) +
			`'></div> </div> <div class='expand-tab'> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("activeKey")()) +
			`' ` +
			$t.clean(get("active")() ? '' : 'hidden') +
			`> ` +
			$t.clean(get("initialBody")(get("activeKey")())) +
			` </div> </div> </div> `
	
	exports['expandable/sidebar'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> <div class="expand-list-cnt ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('-688234735').render(get("list")(), 'key, item', get)) +
			` <div class='expand-input-cnt' hidden>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'> <button ` +
			$t.clean(get("hideAddBtn") ? 'hidden' : '') +
			`>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button> </div> </div> <div> </div> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("activeKey")()) +
			`'> ` +
			$t.clean(get("active")() && get("getBody")(get("active")())) +
			` </div> </div> `
	
	exports['-688234735'] = (get, $t) => 
			`<div class="expandable-list-body" key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> </div> <div class="expand-header ` +
			$t.clean(get("type")()) +
			` ` +
			$t.clean(get("activeKey")() === get("key") ? ' active' : '') +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
	exports['expandable/top-add-list'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> <div class='expand-input-cnt' hidden has-input-tree='` +
			$t.clean(get("hasInputTree")()) +
			`'>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> ` +
			$t.clean( new $t('-357054111').render(get("list")(), 'key, item', get)) +
			` </div> `
	
	exports['input/data-list'] = (get, $t) => 
			`` +
			$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
			` `
	
	exports['-994603408'] = (get, $t) => 
			`<option value="` +
			$t.clean(get("item")) +
			`" ></option>`
	
	exports['input/decision/decision-modification'] = (get, $t) => 
			` <div class='decision-tree-mod-cnt'> <div class='then-add-cnt'> <button hidden class='then-btn modify-edit' mod-id='1'> Then... </button> <button hidden class='add-btn modify-edit'mod-id='4'>Add Input</button> </div> <div hidden class='if-edit-cnt'> <button class='twentys edit-btn modify-edit' mod-id='2'> <i class="inline gg-pen"></i> </button> <button class='twentys conditional-btn modify-edit' mod-id='3'> If </button> </div> <div hidden class='then-cnt tab modify-edit' mod-id='1'>Then Html!</div> <div hidden class='condition-cnt tab modify-edit' mod-id='3'>Condition Tree Html!</div> <div hidden class='rm-edit-cnt modify-edit' mod-id='2'> <div class='edit-cnt'>Edit Tree Html!</div> <button class='modiy-rm-input-btn'>Remove</button> </div> <div hidden class='add-cnt tab modify-edit' mod-id='4'> Add Input Html! </div> <div class='remove-btn-cnt' hidden> <button class='rm-node modify-edit'>X</button> </div> <div class='close-cnts' hidden><button class='modify-edit'>X</button></div> <br> <br> <div class='copy-save-paste-cnt'> <div style='display: inline-block'> <textarea id='json-data'></textarea> <br> <button id="copy">Copy</button> <button id='paste' class='modify-edit' style='float:right'>Paste</button> <br><br> <button id="save" class='modify-edit'>Save</button> </div> </div> </div> `
	
	exports['input/decision/decision'] = (get, $t) => 
			` <div class='decision-input-cnt card` +
			$t.clean(get("empty")() ? ' empty' : '') +
			`' node-id='` +
			$t.clean(get("id")()) +
			`' recursion="disabled"> <span id='` +
			$t.clean(get("id")()) +
			`'> <div class='payload-cnt'>` +
			$t.clean(get("payloadHtml")()) +
			`</div> ` +
			$t.clean(get("empty")() ? '<br><br>' : '') +
			` ` +
			$t.clean( new $t('-1551174699').render(get("inputArray")(), 'input', get)) +
			` <div class='orphan-cnt tab'>` +
			$t.clean(get("childrenHtml")()) +
			`</div> </span> </div> `
	
	exports['-1551174699'] = (get, $t) => 
			`<div class='decision-input-array-cnt pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` </div>`
	
	exports['input/decision/decisionTree'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("node").tree().class()) +
			` ` +
			$t.clean(get("DecisionInputTree").class) +
			`' tree-id='` +
			$t.clean(get("node").tree().id()) +
			`' input-id='` +
			$t.clean(get("node").tree().id()) +
			`' node-id='` +
			$t.clean(get("node").id()) +
			`'> ` +
			$t.clean(get("header")) +
			` ` +
			$t.clean(get("inputHtml")) +
			` <div ` +
			$t.clean(get("node").tree().hideButton ? 'hidden' : '') +
			`> <br> <button class='` +
			$t.clean(get("node").tree().buttonClass()) +
			` ` +
			$t.clean(get("DecisionInputTree").buttonClass) +
			`' tree-id='` +
			$t.clean(get("node").tree().id()) +
			`'> ` +
			$t.clean(get("node").tree().buttonText()) +
			` </button> </div> </div> `
	
	exports['input/edit/input'] = (get, $t) => 
			`<div class='input-edit-cnt' input-ref-id='` +
			$t.clean(get("input").id()) +
			`'> <label>Label</label> <input type='text' attr='label' value='` +
			$t.clean(get("input").label()) +
			`'/> <br> <label>Name</label> <input type='text' attr='name' value='` +
			$t.clean(get("input").name()) +
			`'/> <br> <label ` +
			$t.clean(get("input").list().length === 0 ? 'hidden' : '') +
			`>List</label> <div class='tab edit-input-list-cnt relative'> ` +
			$t.clean( new $t('1088583088').render(get("input").list(), 'key, value', get)) +
			` </div> <br> </div> `
	
	exports['input/edit/list/object'] = (get, $t) => 
			`<div class='edit-input-list-obj tab'> ` +
			$t.clean( new $t('-2045511556').render(get("scope"), 'key, value', get)) +
			` </div> `
	
	exports['-2045511556'] = (get, $t) => 
			`<div > <input type='text' value='` +
			$t.clean(get("key")) +
			`'/> = <input type='text' value='` +
			$t.clean(get("value")) +
			`'/> </div>`
	
	exports['input/edit/list/string'] = (get, $t) => 
			`<input type='text' name='value' value='` +
			$t.clean(get("value")) +
			`'/> `
	
	exports['input/edit/table'] = (get, $t) => 
			`<div class='input-edit-cnt' input-ref-id='` +
			$t.clean(get("table").id()) +
			`'> <label>Label</label> <input type='text' attr='label' value='` +
			$t.clean(get("table").label()) +
			`'/> <br> <label>Name</label> <input type='text' attr='name' value='` +
			$t.clean(get("table").name()) +
			`'/> <br> <div class='table-column-edit-cnt'> <label ` +
			$t.clean(get("table").columns().length === 0 ? 'hidden' : '') +
			`>Columns</label> ` +
			$t.clean(get("listHtml")(get("table").columns())) +
			`; <button id='table-column-edit-btn'>Apply</button> </div> <div class='table-row-edit-cnt'> <label ` +
			$t.clean(get("table").rows().length === 0 ? 'hidden' : '') +
			`>Rows</label> ` +
			$t.clean(get("listHtml")(get("table").rows())) +
			`; <button id='table-row-edit-btn'>Apply</button> </div> <br> </div> `
	
	exports['input/input'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <input class='` +
			$t.clean(get("class")()) +
			`' list='input-list-` +
			$t.clean(get("id")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' ` +
			$t.clean(get("disabled")() ? 'disabled' : '') +
			` ` +
			$t.clean(get("attrString")()) +
			` ` +
			$t.clean(get("checked")()) +
			`> <datalist id="input-list-` +
			$t.clean(get("id")()) +
			`"> ` +
			$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
			` </datalist> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/list'] = (get, $t) => 
			`<div class='input-cnt` +
			$t.clean(get("inline")() ? ' inline' : '') +
			`'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> ` +
			$t.clean( new $t('1682356664').render(get("list")(), 'input', get)) +
			` <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['input/multiple-entries'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt multi'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <div class='multiple-entry-cnt tab card ` +
			$t.clean(get("inline")() ? 'inline' : '') +
			`' id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('1507176312').render(get("list")(), 'inputArray', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/measurement'] = (get, $t) => 
			`<div class='fit input-cnt measurement-input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <input class='measurement-input ` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' value='` +
			$t.clean(get("value")() ? get("value")() : "") +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' unit='` +
			$t.clean(get("unit")()) +
			`' ` +
			$t.clean(get("disabled")() ? 'disabled' : '') +
			`> ` +
			$t.clean( new $t('-992439070').render(get("units")(), 'unit', get)) +
			` <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['-992439070'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("unit")) +
			`</label><input type='radio' name='` +
			$t.clean(get("id")()) +
			`-unit' value='` +
			$t.clean(get("unit")) +
			`' ` +
			$t.clean(get("$index") === 0 ? 'checked' : '') +
			`> </span>`
	
	exports['input/number'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <input class='` +
			$t.clean(get("class")()) +
			`' list='input-list-` +
			$t.clean(get("id")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='number' name='` +
			$t.clean(get("name")()) +
			`' max='` +
			$t.clean(get("max")()) +
			`' min='` +
			$t.clean(get("min")()) +
			`' step='` +
			$t.clean(get("step")()) +
			`'> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/object'] = (get, $t) => 
			`<div class='input-cnt` +
			$t.clean(get("inline")() ? ' inline' : '') +
			`'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> ` +
			$t.clean( new $t('1682356664').render(get("list")(), 'input', get)) +
			` <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['input/one-entry'] = (get, $t) => 
			`<span class='one-entry-cnt'> ` +
			$t.clean(get("html")()) +
			` </span> `
	
	exports['input/radio-table'] = (get, $t) => 
			`<div class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <br> <div class='tab'> <table border="1"> <tbody> <tr> <td></td> ` +
			$t.clean( new $t('1254550278').render(get("columns")(), 'name', get)) +
			` </tr> ` +
			$t.clean( new $t('-44250289').render(get("rowDetail")(), 'row', get)) +
			` </tbody> </table> </div> </div> `
	
	exports['-54469610'] = (get, $t) => 
			`<td class='radio-table-input-cnt' > <input type='radio' name='` +
			$t.clean(get("row").name) +
			`' key='` +
			$t.clean(get("row").key) +
			`' value='` +
			$t.clean(get("col")) +
			`' ` +
			$t.clean(get("row").value === get("col") ? 'checked' : '') +
			`/> </td>`
	
	exports['-44250289'] = (get, $t) => 
			`<tr > <td>` +
			$t.clean(get("row").label) +
			`</td> ` +
			$t.clean( new $t('-54469610').render(get("columns")(get("rowIndex")), 'col', get)) +
			` </tr>`
	
	exports['input/radio'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")() ? get("label")() +
			':' : '') +
			`</label> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <div class='inline tab'> ` +
			$t.clean( new $t('-2140138526').render(get("list")(), 'key, val', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-2140138526'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("isArray")() ? get("val") : get("key")) +
			`</label> <input type='radio' ` +
			$t.clean((get("isArray")() ? get("val") : get("key")) === get("value")() ? 'checked' : '') +
			` class='` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' name='` +
			$t.clean(get("uniqueName")()) +
			`' value='` +
			$t.clean(get("val")) +
			`'> &nbsp;&nbsp; </span>`
	
	exports['input/select'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <select class='` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' value='` +
			$t.clean(get("value")()) +
			`'> ` +
			$t.clean( new $t('1835219150').render(get("list")(), 'key, value', get)) +
			` </select> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/table'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <br> <div class='tab'> <table border="1"> <tbody> <tr> <td></td> ` +
			$t.clean( new $t('1254550278').render(get("columnNames")(), 'name', get)) +
			` </tr> ` +
			$t.clean( new $t('-808712670').render(get("rows")(), 'rowIndex, row', get)) +
			` </tbody> </table> </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-808712670'] = (get, $t) => 
			`<tr > <td>` +
			$t.clean(get("row")) +
			`</td> ` +
			$t.clean( new $t('976176139').render(get("columns")(get("rowIndex")), 'col', get)) +
			` </tr>`
	
	exports['input/textarea'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			` input-id='` +
			$t.clean(get("id")()) +
			`'> <label>` +
			$t.clean(get("label")()) +
			`</label> <br> <textarea class='` +
			$t.clean(get("class")()) +
			`' list='input-list-` +
			$t.clean(get("id")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' placeholder='` +
			$t.clean(get("placeholder")()) +
			`' type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`' ` +
			$t.clean(get("attrString")()) +
			`></textarea> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['lists/file-tab'] = (get, $t) => 
			`<div class='file-tab-cnt ` +
			$t.clean(get("type")()) +
			`` +
			$t.clean(get("isOpen")() ? ' open' : '') +
			`' id='` +
			$t.clean(get("id")()) +
			`'> <ul class='list no-print'> ` +
			$t.clean( new $t('821257078').render(get("list")(), 'title', get)) +
			` </ul> <div class='content-cnt'> ` +
			$t.clean( new $t('672662266').render(get("list")(), 'title', get)) +
			` </div> </div> `
	
	exports['orientation-arrows'] = (get, $t) => 
			`<div class='orientation-arrows' id='` +
			$t.clean(get("navId")()) +
			`' l-id='` +
			$t.clean(get("id")()) +
			`'> <table class='orientation-arrows-table orient-arrows' cellspacing="0" cellpadding="0"> <tr><td></td> <td dir='u'>&#8681;</td> <td></td></tr> <tr><td dir='l'>&#8680;</td> <td dir='c'>` +
			$t.clean(get("space")()) +
			`&#8865;` +
			$t.clean(get("space")()) +
			`</td> <td dir='r'>&#8678;</td></tr> <tr><td></td> <td dir='d'>&#8679;</td> <td></td></tr> </table> </div> `
	
	exports['2d/auto-location-properties'] = (get, $t) => 
			`<div class='auto-location-properties-cnt'> <h3 class='inline-flex chev-dropdown-toggle'> Auto Location Settings <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </h3> <div class='tab chev-dropdown' hidden> <input type='text' value='` +
			$t.clean(get("id")()) +
			`' name='id' hidden/> <div ` +
			$t.clean(get("isDefault")() ? 'hidden' : '') +
			`> Default <button class='default-reset'>Return</button> <button class='apply-to-defualt'>Apply</button> </div> <label>Interior Only</label> <input type='checkbox' name='LAYOUT_INTERIOR_ONLY' ` +
			$t.clean(get("LAYOUT_INTERIOR_ONLY") ? 'checked' : '') +
			`/> <br> <label>Snaps</label> <input type='checkbox' name='SNAPS' ` +
			$t.clean(get("SNAPS") ? 'checked' : '') +
			`/> <br> <label>Corners</label> <input type='checkbox' name='CORNERS' ` +
			$t.clean(get("CORNERS") ? 'checked' : '') +
			`/> <div> <div class='inline-flex chev-dropdown-toggle'> <label>Walls</label> <input type='checkbox' name='WALLS' ` +
			$t.clean(get("WALLS") ? 'checked' : '') +
			`/> <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </div> <div class='tab chev-dropdown' hidden> <label>Match Angle</label> <input type='checkbox' name='MATCH_WALL_ANGLE' ` +
			$t.clean(get("MATCH_WALL_ANGLE") ? 'checked' : '') +
			`/> <br> <label>Size Adjust (0 to deactivate)</label> <input class='dem' type='number' name='SIZE_ADJUST_PERCENT' value='` +
			$t.clean(get("SIZE_ADJUST_PERCENT")) +
			`'/>% </div> </div> <label>Fixed Object Angle</label> <input type='checkbox' name='FIXED_ANGLE' ` +
			$t.clean(get("FIXED_ANGLE") ? 'checked' : '') +
			`/> <br> <label>Tolerance</label> <input class='dem' type='number' name='TOLERANCE' value='` +
			$t.clean(get("TOLERANCE")) +
			`'/> </div> </div> `
	
	exports['2d/controls'] = (get, $t) => 
			`<div class='orientation-arrows' id='` +
			$t.clean(get("navId")()) +
			`' l-id='` +
			$t.clean(get("id")()) +
			`'> <table class='orientation-arrows-table controls-2d' cellspacing="0" cellpadding="0"> <tbody> <tr><td></td> <td dir='u'>&#8679;</td> <td></td></tr> <tr><td dir='l'>&#8635;</td> <td dir='c'>` +
			$t.clean(get("space")()) +
			`&#` +
			$t.clean(get("centerCode")()) +
			`;` +
			$t.clean(get("space")()) +
			`</td> <td dir='r'>&#8634;</td></tr> <tr><td></td> <td dir='d'>&#8681;</td> <td></td></tr> </tbody> </table> </div> `
	
	exports['2d/pop-up/corner-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <table> <tr> <td><label>X</label></td> <td><input class='value-2d' key='x' value='` +
			$t.clean(get("display")(get("target").x)) +
			`'></td> </tr> <tr> <td><label>Y</label></td> <td><input class='value-2d' key='y' value='` +
			$t.clean(get("display")(get("target").y)) +
			`'></td> </tr> <tr> <td><label>Angle</label></td> <td><input class='value-2d' key='angle' value='` +
			$t.clean(get("target").angle()) +
			`' convert='false'></td> </tr> <tr> <td><label>Show Angle</label></td> <td><input class='value-2d' key='showAngle' type='checkbox' convert='false' ` +
			$t.clean(get("target").showAngle ? 'checked' : '') +
			`></td> </tr> <tr> <td colspan="2"><button class='remove-btn-2d transparent'>Remove</button></td> </tr> </table> </div> `
	
	exports['2d/pop-up/door-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <table> <tr> <td><label>Height</label></td> <td><input class='value-2d' key='height' value='` +
			$t.clean(get("display")(get("target").height())) +
			`'></td> </tr> <tr> <td><label>Width</label></td> <td><input class='value-2d' key='width' value='` +
			$t.clean(get("display")(get("target").width())) +
			`'></td> </tr> <tr> <td><label>Distance From Floor</label></td> <td><input class='value-2d' key='fromFloor' value='` +
			$t.clean(get("display")(get("target").fromFloor())) +
			`'></td> </tr> <tr> <td> <button class='hinge-btn transparent'>Hinge</button> </td> <td><button class='remove-btn-2d transparent'>Remove</button></td> </tr> </table> </div> `
	
	exports['2d/pop-up/layout-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <button class='add-object-btn-2d transparent'>Add Object</button> <br> <label>Ceiling Height</label> <input class='value-2d' type="text" key="ceilingHeight" convert='false' value="` +
			$t.clean(get("display")(get("target").ceilingHeight())) +
			`"> <br> <div class='center-vert center'> <button class='layout ruler` +
			$t.clean(get("panZ").measurements.enabled() ? ' active' : '') +
			`'> <i class="gg-ruler"></i> </button> </div> </div> `
	
	exports['2d/pop-up/line-measurement-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> ` +
			$t.clean( new $t('1586878820').render(get("UNITS"), 'property', get)) +
			` <br> <input type='text' class='measurement-mod transparent' value='` +
			$t.clean(get("target").display()) +
			`'> </div> `
	
	exports['2d/pop-up/snap-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").parent().constructor.name) +
			`' id='` +
			$t.clean(get("target").parent().id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> ` +
			$t.clean( new $t('2d/auto-location-properties').render(get("autoLocProps"), undefined, get)) +
			` <label>Name</label> <input class='value-2d' member='object' type="text" key="name" value="` +
			$t.clean(get("target").parent().name()) +
			`"> <br><br> <label>Width</label> <input class='value-2d' member='object' type="text" key="width" value="` +
			$t.clean(get("display")(get("target").width())) +
			`"> <br> <label>Depth</label> <input class='value-2d' member='object' type="text" key="thickness" value="` +
			$t.clean(get("display")(get("target").height())) +
			`"> <br> <label>height</label> <input class='value-2d' member='bridge' type="text" key="depth" value="` +
			$t.clean(get("display")(get("target").parent().depth())) +
			`"> <br> <label>Angle</label> <input class='value-2d' member='snap' type="text" convert='false' key="angle" value="` +
			$t.clean(get("target").angle()) +
			`"> <br> <label>X</label> <input class='value-2d' member='snap' type="text" key="x" value="` +
			$t.clean(get("display")(get("target").x())) +
			`"> <br> <label>Y</label> <input class='value-2d' member='snap' type="text" key="y" value="` +
			$t.clean(get("display")(get("target").y())) +
			`"> <br> <label>From Floor</label> <input class='value-2d' member='bridge' type="text" key="fromFloor" cascade='fromCeiling' value="` +
			$t.clean(get("display")(get("target").parent().fromFloor())) +
			`"> <br> <label>From Ceiling</label> <input class='value-2d' member='bridge' type="text" key="fromCeiling" cascade='fromFloor' value="` +
			$t.clean(get("display")(get("target").parent().fromCeiling())) +
			`"> <br> <button class='remove-btn-2d transparent'>Remove</button> </div> `
	
	exports['2d/pop-up/snap-location-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").parent().constructor.name) +
			`' id='` +
			$t.clean(get("target").parent().id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <div class='which-radio-cnt'` +
			$t.clean(get("scope").snapPartner() ? '' : ' hidden') +
			`> <label>Both</label> <input type="radio" name="which" checked value='Both'> <div class='tab'> <label>` +
			$t.clean(get("name1")()) +
			`</label> <input type="radio" name="which" value="` +
			$t.clean(get("name1")()) +
			`"> <br> <label>` +
			$t.clean(get("name2")()) +
			`</label> <input type="radio" name="which" value="` +
			$t.clean(get("name2")()) +
			`"> </div> <br> </div> <label>` +
			$t.clean(get("scope").partner() ? 'Rotate' : 'Angle') +
			`</label> <input member='snap-loc' type="text" convert='false' name="angle" value="` +
			$t.clean(get("angle")()) +
			`"> <br> <label>X</label> <input member='snap-loc' type="text" name="x" value="` +
			$t.clean(get("display")(get("target").center().x)) +
			`"> <br> <label>Y</label> <input member='snap-loc' type="text" name="y" value="` +
			$t.clean(get("display")(get("target").center().y)) +
			`"> <br> <button class='remove-btn-2d transparent'>Remove</button> <span class='fix-cnt right'` +
			$t.clean(!get("scope").snapPartner() ? '' : ' hidden') +
			`> <label>Fix</label> <input member='snap-loc' type="checkbox" name="fix" value=""> </span> </div> `
	
	exports['2d/pop-up/wall-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <button class='add-door-btn-2d transparent'>Add Door</button> <button class='add-window-btn-2d transparent'>Add Window</button> <button class='add-vertex-btn-2d transparent'>Add Vertex</button> <button class='remove-btn-2d transparent'>Remove</button> </div> `
	
	exports['2d/pop-up/window-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <table> <tr> <td><label>Height</label></td> <td><input class='value-2d' key='height' value='` +
			$t.clean(get("display")(get("target").height())) +
			`'></td> </tr> <tr> <td><label>Width</label></td> <td><input class='value-2d' key='width' value='` +
			$t.clean(get("display")(get("target").width())) +
			`'></td> </tr> <tr> <td><label>Distance From Floor</label></td> <td><input class='value-2d' key='fromFloor' value='` +
			$t.clean(get("display")(get("target").fromFloor())) +
			`'></td> </tr> <tr> <td colspan="2"><button class='remove-btn-2d'>Remove</button></td> </tr> </table> </div> `
	
	exports['advanced/cabinet/divider'] = (get, $t) => 
			`<div lookup-id='` +
			$t.clean(get("divider").id()) +
			`'> <label>Type</label> ` +
			$t.clean(get("DividerTypeSelector")(get("divider")).html()) +
			` <br> <label>Panel Thickness</label> <input type="text" name="panelThickness" value="` +
			$t.clean(get("divider").panelThickness(undefined, true)) +
			`"> <input disabled class='dem' type="text" name="panelThickness" value="` +
			$t.clean(get("Measurement").display(get("divider").panelThickness())) +
			`"> <br> <label>Has Frame</label> <input type="checkbox" name="has-frame"` +
			$t.clean(get("divider").hasFrame() ? ' checked' : '') +
			`> <br> <div class='frame-width-cnt'` +
			$t.clean(get("divider").hasFrame() ? '' : ' hidden') +
			`> <label>Frame Width</label> <input type="text" name="frameWidth" value="` +
			$t.clean(get("divider").frameWidth()) +
			`"> <input disabled class='dem' type="text" name="frameWidth" value="` +
			$t.clean(get("Measurement").display(get("divider").frameWidth())) +
			`"> </div> </div> `
	
	exports['advanced/cabinet'] = (get, $t) => 
			`<div class='align-left'> ` +
			$t.clean( new $t('-194441702').render(get("parts"), 'part', get)) +
			` </div> `
	
	exports['-194441702'] = (get, $t) => 
			`<div > <div class='inline-flex chev-dropdown-toggle'> ` +
			$t.clean(get("part").partCode()) +
			` <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </div> <div class='tab chev-dropdown' hidden> ` +
			$t.clean(get("partHtml")(get("part"))) +
			` </div> </div>`
	
	exports['advanced/subassemblies/assembly-config'] = (get, $t) => 
			`<div id='` +
			$t.clean(get("id")()) +
			`'> <div class='sub-demension-cnt inline-flex'> ` +
			$t.clean(get("demension").html()) +
			` <input attr='subassemblies' name='demension' value='` +
			$t.clean(get("demension").eqn()) +
			`'> <input disabled class='measurement-input' name='value' value='` +
			$t.clean(get("demension").value()) +
			`'> <input type="checkbox" name="convert" checked> </div> <br> <div class='sub-center-cnt inline-flex'> ` +
			$t.clean(get("center").html()) +
			` <input attr='subassemblies' name='center' value='` +
			$t.clean(get("center").eqn()) +
			`'> <input disabled class='measurement-input' name='value' value='` +
			$t.clean(get("center").value()) +
			`'> <input type="checkbox" name="convert" checked> </div> <br> <div class='sub-rotation-cnt inline-flex'> ` +
			$t.clean(get("rotation").html()) +
			` <input attr='subassemblies' name='rotation' value='` +
			$t.clean(get("rotation").eqn()) +
			`'> <input disabled class='measurement-input' name='value' value='` +
			$t.clean(get("rotation").value()) +
			`'> </div> </div> `
	
	exports['cabinet/head'] = (get, $t) => 
			`<div class='cabinet-header' cabinet-id='` +
			$t.clean(get("cabinet").id()) +
			`'> ` +
			$t.clean(get("$index") +
			1) +
			`) <input class='cabinet-id-input' name='name' prop-update='` +
			$t.clean(get("$index")) +
			`.name' index='` +
			$t.clean(get("$index")) +
			`' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("cabinet").name()) +
			`'> &nbsp;&nbsp;&nbsp;&nbsp; Size: <div class='cabinet-dem-cnt' cabinet-id='` +
			$t.clean(get("cabinet").id()) +
			`'> <label>W:</label> <input class='cabinet-id-input dem' prop-update='` +
			$t.clean(get("$index")) +
			`.width' name='width' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("displayValue")(get("cabinet").width())) +
			`'> <label>H:</label> <input class='cabinet-id-input dem' prop-update='` +
			$t.clean(get("$index")) +
			`.length' name='length' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("displayValue")(get("cabinet").length())) +
			`'> <label>D:</label> <input class='cabinet-id-input dem' prop-update='` +
			$t.clean(get("$index")) +
			`.thickness' name='thickness' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("displayValue")(get("cabinet").thickness())) +
			`'> </div> </div> `
	
	exports['cabinet/notes'] = (get, $t) => 
			`<div> <textarea class="cab-notes">` +
			$t.clean(get("cabinet").notes()) +
			`</textarea> </div> `
	
	exports['cabinet/simple'] = (get, $t) => 
			`Im simple bitch `
	
	exports['divide/body'] = (get, $t) => 
			`<h2>` +
			$t.clean(get("list").activeKey()) +
			`</h2> val: ` +
			$t.clean(get("list").value()('selected')) +
			` `
	
	exports['divide/head'] = (get, $t) => 
			`<div> <div class='open-divider-select` +
			$t.clean(get("sections").length === 0 ? '' : ' hidden') +
			`'> ` +
			$t.clean(get("headText")) +
			` </div> </div> `
	
	exports['divider-controls'] = (get, $t) => 
			`<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` +
			$t.clean(get("opening").id()) +
			`' value='` +
			$t.clean(get("opening").pattern().str.length < 2 ? '' : get("opening").pattern().str) +
			`'> <span class="open-orientation-radio-cnt"> <div class='div-orien-btn ` +
			$t.clean(get("opening").value('vertical') ? '' : 'pressed') +
			`' orientation='horizontal'> <i class='gg-horizontal'></i> </div> <div class='div-orien-btn ` +
			$t.clean(!get("opening").value('vertical') ? '' : 'pressed') +
			`' orientation='vertical'> <i class='gg-vertical'></i> </div> </span> <div` +
			$t.clean(get("opening").divideRight() ? '': ' hidden') +
			`> ` +
			$t.clean(get("dividerTypeSelect").html()) +
			` </div> <div class='open-pattern-input-cnt' opening-id='` +
			$t.clean(get("opening").id()) +
			`' ` +
			$t.clean(get("opening").pattern().equals ? 'hidden' : '') +
			`> ` +
			$t.clean(get("patternInputHtml")) +
			` </div> </div> `
	
	exports['advanced/subassemblies/void'] = (get, $t) => 
			`<div class='void-display-cnt inline-flex' void-id='` +
			$t.clean(get("id")()) +
			`' cabinet-id='` +
			$t.clean(get("cabinetId")()) +
			`' void-disp-hash='` +
			$t.clean(get("hash")()) +
			`'> <div class='void-join-direction-toggle'` +
			$t.clean(get("voids")().length > 1 ? '' : ' hidden') +
			`> <div> <h3> <span` +
			$t.clean(get("cabinet")().value('acsendingVoidJoin') ? '' : ' hidden') +
			`> <i class='left gg-chevron-left'></i> </span> Join <span` +
			$t.clean(!get("cabinet")().value('acsendingVoidJoin') ? '' : ' hidden') +
			`> <i class='right gg-chevron-right'></i> </span> </h3> </div> </div> <div> <select class='void-part-code-select'> ` +
			$t.clean( new $t('406900361').render(get("partCodes")(), 'partCode', get)) +
			` </select> <label>Horizontal</label> <input type='radio' name='orientation' value='horizontal' checked> <label>Vertical</label> <input type='radio' name='orientation' value='vertical'> <label>Size</label> <input type='text' name='width' class='dem' value='5'> <label>X</label> <input type='text' name='height' class='dem' value='5'> <button class='add-void-btn'>Add</button> <div class='void-cnt'> ` +
			$t.clean( new $t('-636533943').render(get("voids")(), 'void', get)) +
			` </div> </div> </div> `
	
	exports['-636533943'] = (get, $t) => 
			`<div class='card margin' index='` +
			$t.clean(get("$index")) +
			`' target-id='` +
			$t.clean(get("void").id()) +
			`'> <button class='assembly remove-btn'>X</button> <h3 class='inline-flex chev-dropdown-toggle'> ` +
			$t.clean(get("void").partCode()) +
			` <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </h3> <input type="text" class='void-dem' name="width" value="` +
			$t.clean(get("displayWidth")(get("void"))) +
			`"> X <input type="text" class='void-dem' name="length" value="` +
			$t.clean(get("displayLength")(get("void"))) +
			`"> <br> <div class='tab chev-dropdown' hidden> <div> <h3 class='inline-flex chev-dropdown-toggle'> Joint Config <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </h3> <div class='tab chev-dropdown joint-config' hidden> <label>Cap Set</label> <input type='number' min='0' max='2' step='1' value='` +
			$t.clean(get("void").capSet()) +
			`'/> <br/> <label>Cap Male</label> <input type='checkbox' ` +
			$t.clean(get("void").capMale() ? 'checked' : '') +
			`/> <br/> <label>Male Set</label> <input type='number' min='0' max='1' step='1' value='` +
			$t.clean(get("void").maleSet()) +
			`'/> <br/> <label>Joint</label> <select class='joint-selector'> <option>Body</option> <option>Cap</option> <option>Non Void</option> <option>Void Panel</option> </select> <div class='joint-input-cnt tab'> ` +
			$t.clean(get("joint")(get("void"), 'body').html()) +
			` </div> </div> </div> <div class='input-set'> <label>Include sides</label> ` +
			$t.clean( new $t('1932279957').render('0..6', 'i', get)) +
			` </div> ` +
			$t.clean(get("assemblyConfig")(get("void")).html()) +
			` </div> </div>`
	
	exports['cabinet/body'] = (get, $t) => 
			`<div lookup-id='` +
			$t.clean(get("cabinet").id()) +
			`'> <div class='center relitive'> <div class='absolute-top-left show-cnt'> <div class='align-right'> <label>Show</label> <select class="show-select" name='type' side='left'> ` +
			$t.clean( new $t('-94499910').render(get("showTypes"), 'showType', get)) +
			` </select> <br> <label>End Style</label> <select class="show-select" name='endStyle' side='left'> <option ` +
			$t.clean(!get("cabinet").value('show.left.endStyle') ? 'selected' : '') +
			`> No </option> <option ` +
			$t.clean(get("cabinet").value('show.left.endStyle') ? 'selected' : '') +
			`> Yes </option> </select> </div> </div> <div class='toe-kick-cab-cnt auto-fit'> <label>Toe Kick</label> <br> <div class='auto-fit inline-flex'> <span> <measurement-input name='tkd' label='Depth' decimal='` +
			$t.clean(get("cabinet").resolve('tkd')) +
			`'/> </span> &nbsp;&nbsp;&nbsp; <span> <measurement-input name='tkh' label='Height' decimal='` +
			$t.clean(get("cabinet").resolve('tkh')) +
			`'/> </span> </div> </div> <div class='cab-tab-cnt'>` +
			$t.clean(get("fileTabDisp").html()) +
			`</div> <div class='absolute-top-right show-cnt'> <div class='align-left'> <select class="show-select" name='type' side='right'> ` +
			$t.clean( new $t('-445556989').render(get("showTypes"), 'showType', get)) +
			` </select> <label>Show</label> <br> <select class="show-select" name='endStyle' side='right'> <option ` +
			$t.clean(!get("cabinet").value('show.right.endStyle') ? 'selected' : '') +
			`> No </option> <option ` +
			$t.clean(get("cabinet").value('show.right.endStyle') ? 'selected' : '') +
			`> Yes </option> </select> <label>End Style</label> </div> </div> </div> <br> <div> ` +
			$t.clean( new $t('1860435907').render(get("modifiableValues"), 'obj', get)) +
			` </div> <div class='center' hidden> <button class='save-cabinet-btn' index='` +
			$t.clean(get("$index")) +
			`'>Save</button> </div> </div> `
	
	exports['-94499910'] = (get, $t) => 
			`<option ` +
			$t.clean(get("cabinet").value('show.left.type') === get("showType").name ? 'selected' : '') +
			`> ` +
			$t.clean(get("showType").name) +
			` </option>`
	
	exports['-445556989'] = (get, $t) => 
			`<option ` +
			$t.clean(get("cabinet").value('show.right.type') === get("showType").name ? 'selected' : '') +
			`> ` +
			$t.clean(get("showType").name) +
			` </option>`
	
	exports['documents/construction/aerials'] = (get, $t) => 
			`<div class='aerial-views'> ` +
			$t.clean( new $t('-1044419277').render(get("order").rooms, 'name, room', get)) +
			` </div> `
	
	exports['-1044419277'] = (get, $t) => 
			`<div > <h3>` +
			$t.clean(get("room").name()) +
			`</h3> <canvas class='this-one' order-room='` +
			$t.clean(get("order").name().toKebab()) +
			`-` +
			$t.clean(get("room").name().toKebab()) +
			`'></canvas> </div>`
	
	exports['documents/construction/cabinet-parts'] = (get, $t) => 
			`<div class='tab fit'> <h2> ` +
			$t.clean(get("disp").cabinetAndGroup(get("root"))) +
			` </h2> ` +
			$t.clean( new $t('documents/construction/part').render(get("scope"), undefined, get)) +
			` </div> `
	
	exports['documents/construction/cabinetList'] = (get, $t) => 
			`<div class='small-margin'> <table class='last-col-full'> <tr class='btm-border-barely-visible'> <th>Index</th> <th>Name</th> <th>Demensions</th> <th colspan="2">Show(L|R)</th> <th colspan="2">End Style(L|R)</th> <th>Shelves</th> <th>Notes</th> </tr> ` +
			$t.clean( new $t('40671914').render(get("cabinets"), 'cabinet', get)) +
			` </table> </div> `
	
	exports['documents/construction/cut-list-label'] = (get, $t) => 
			`<div class='center-all'> <div>` +
			$t.clean(get("info").partsId) +
			`</div> <div> ` +
			$t.clean(get("disp").partIdPrefix(get("part"))) +
			`:` +
			$t.clean(get("part").userFriendlyId()) +
			` <br> ` +
			$t.clean(get("disp").measurement(get("info").demensions.x)) +
			` X ` +
			$t.clean(get("disp").measurement(get("info").demensions.y)) +
			` X ` +
			$t.clean(get("disp").measurement(get("info").demensions.z)) +
			` </div> </div> `
	
	exports['documents/construction/door-list'] = (get, $t) => 
			`<div class='small-margin last-col-full '> <table> <tbody> <tr class='btm-border-barely-visible'> <th>Qt</th> <th>` +
			$t.clean(get("width")) +
			`</th> <th>` +
			$t.clean(get("height")) +
			`</th> <th>` +
			$t.clean(get("thickness")) +
			`</th> <th>Style</th> <th>Location</th> <th>Notes</th> </tr> ` +
			$t.clean( new $t('-278391780').render(get("partListMap")[get("type")], 'doorObj', get)) +
			` </tbody> </table> </div> `
	
	exports['-278391780'] = (get, $t) => 
			`<tr ` +
			$t.clean(!get("partListMap")[get("type")] ? 'hidden' : '') +
			` class='btm-border-barely-visible'> <td>` +
			$t.clean(get("disp").material.qty(get("doorObj").info)) +
			`</td> <td>` +
			$t.clean(get("disp").measurement(get("doorObj").info.demensions.x)) +
			`</td> <td>` +
			$t.clean(get("disp").measurement(get("doorObj").info.demensions.y)) +
			`</td> <td>` +
			$t.clean(get("disp").measurement(get("doorObj").info.demensions.z)) +
			`</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>` +
			$t.clean(get("disp").sectionLocation(get("doorObj"))) +
			`</td> <td></td> </tr>`
	
	exports['documents/construction/elevation-diagrams'] = (get, $t) => 
			`<div cabinet-list-hash='` +
			$t.clean(get("hash")) +
			`'> ` +
			$t.clean( new $t('-892612743').render(get("groups"), 'group', get)) +
			` </div> `
	
	exports['-892612743'] = (get, $t) => 
			`<div class='avoid-page-break center'> <label>` +
			$t.clean(get("$index")) +
			`</label> <canvas class='upside-down mirror-x' id='` +
			$t.clean(get("elevationCanvasId")(get("$index"))) +
			`'></canvas> </div>`
	
	exports['documents/construction/everything'] = (get, $t) => 
			`<div class='everything-cnt' id='everything-cnt-` +
			$t.clean(get("id")) +
			`'> ` +
			$t.clean( new $t('134249436').render(get("sections"), 'section', get)) +
			` </div> `
	
	exports['documents/construction/group'] = (get, $t) => 
			`<div class='page group-part-doc-cnt'> ` +
			$t.clean( new $t('-535896152').render(get("groupInfo").cabinets, 'cabinet', get)) +
			` </div> `
	
	exports['-535896152'] = (get, $t) => 
			`<div class='page' > ` +
			$t.clean(get("DocumentationHtml").parts.cabinet(get("cabinet"), get("partType"))) +
			` </div>`
	
	exports['documents/construction/materials'] = (get, $t) => 
			`<div class='small-margin'> <table> <tbody> <tr> <th>Category</th> <th>Size</th> </tr> ` +
			$t.clean( new $t('documents/construction/materials-row').render(get("partListMap"), 'category, set', get)) +
			` </tbody> </table> </div> `
	
	exports['documents/construction/materials-row'] = (get, $t) => 
			`<tr> <td class='align-left'>` +
			$t.clean(get("disp").tabStr(get("set").list && get("set").list.depth)) +
			`` +
			$t.clean(get("category")) +
			`</td> <td>` +
			$t.clean(get("disp").material(get("set").list)) +
			`</td> </tr> ` +
			$t.clean( new $t('documents/construction/materials-row').render(get("categories")(get("set")), 'category, set', get)) +
			` `
	
	exports['documents/construction/opening-diagrams'] = (get, $t) => 
			`<div cabinet-list-hash=` +
			$t.clean(get("hash")) +
			` class='build-diagram-cnt'> ` +
			$t.clean( new $t('-1303323074').render(get("cabinetSets"), 'set', get)) +
			` </div> `
	
	exports['-1255362949'] = (get, $t) => 
			`<span class='fit'> <div class='center'> <b>` +
			$t.clean(get("disp").partIdPrefix(get("cabinet"))) +
			`</b> </div> <div id='` +
			$t.clean(get("cntId")(get("cabinet").id())) +
			`'></div> <div class='inline-flex'> <table class='no-borders'> <tbody> ` +
			$t.clean( new $t('678094078').render(get("sectionSets")(get("cabinet")), 'set', get)) +
			` </tbody> </table> </div> </span>`
	
	exports['-1303323074'] = (get, $t) => 
			`<div class='avoid-page-break inline-flex'> ` +
			$t.clean( new $t('-1255362949').render(get("set"), 'cabinet', get)) +
			` </div>`
	
	exports['documents/construction/order-information'] = (get, $t) => 
			`<div> ` +
			$t.clean(get("order").name()) +
			`&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;` +
			$t.clean(get("order").date().initial) +
			` <div class='tab'> ` +
			$t.clean(get("Utils").textToHtml(get("order").notes())) +
			` </div> </div> `
	
	exports['documents/construction/panel-cut-list'] = (get, $t) => 
			`` +
			$t.clean( new $t('1442479092').render(get("pages"), 'page', get)) +
			` `
	
	exports['-628650965'] = (get, $t) => 
			`<span class='avery-5160-label center'> ` +
			$t.clean(get("pickles")) +
			` </span>`
	
	exports['-1550030595'] = (get, $t) => 
			`<div class='flex fit'> ` +
			$t.clean( new $t('-628650965').render(get("row"), 'pickles', get)) +
			` </div>`
	
	exports['documents/construction/part'] = (get, $t) => 
			`<div class='center'> <h3>` +
			$t.clean(get("category").PARTS.length ? get("category").PARTS[0].categories.join('-') : '') +
			`</h3> </div> ` +
			$t.clean( new $t('1618726004').render(get("category").PARTS, 'info', get)) +
			` ` +
			$t.clean( new $t('documents/construction/part').render(get("subCategories")(get("category")), 'category', get)) +
			` `
	
	exports['documents/construction/room'] = (get, $t) => 
			`` +
			$t.clean( new $t('568362631').render(get("roomInfo").groups, 'group', get)) +
			` `
	
	exports['documents/cuts/cut-data'] = (get, $t) => 
			`<tr> <td>` +
			$t.clean(get("cut").id) +
			`</td> <td>` +
			$t.clean(get("cut").marker && get("cut").marker.label) +
			`</td> <td>` +
			$t.clean(get("disp").axis.x(get("cut").axis)) +
			`</td> <td>` +
			$t.clean(get("disp").axis.z(get("cut").axis)) +
			`</td> <td> ` +
			$t.clean(get("disp").roundTo(get("cut").tilt && get("cut").tilt.left) || '') +
			` <br> ` +
			$t.clean(get("disp").roundTo(get("cut").tilt && get("cut").tilt.right) || '') +
			` </td> <td>` +
			$t.clean(get("disp").angle(get("cut"), true)) +
			`<br/>` +
			$t.clean(get("disp").angle(get("cut"), false)) +
			`</td> <td> ` +
			$t.clean( new $t('-2011682991').render(get("cut").locationRef.references, 'er', get)) +
			` </td> <td>` +
			$t.clean(get("disp").axis.y(get("cut").axis)) +
			`</td> </tr> `
	
	exports['-2011682991'] = (get, $t) => 
			`<span class='flow-root' > ` +
			$t.clean( new $t(`documents/cuts/cut-` +
			$t.clean(get("er") ? (get("er")[0].label ? "edge" : "point") : "no") +
			`-ref`).render(get("er"), undefined, get)) +
			` </span>`
	
	exports['documents/construction/three-view'] = (get, $t) => 
			`<div cabinet-list-hash='` +
			$t.clean(get("hash")) +
			`'> ` +
			$t.clean( new $t('-1730737816').render(get("cabinetInfos"), 'cabInfo', get)) +
			` </div> `
	
	exports['-1730737816'] = (get, $t) => 
			`<div class='avoid-page-break center'> <div> <b>` +
			$t.clean(get("disp").partIdPrefix(get("cabInfo").parts[0])) +
			`</b> </div> <div> <canvas class='upside-down mirror-x' id='` +
			$t.clean(get("cabCanvasId")(get("cabInfo").parts[0], 'front')) +
			`'></canvas> <canvas class='upside-down mirror-x' id='` +
			$t.clean(get("cabCanvasId")(get("cabInfo").parts[0], 'top')) +
			`'></canvas> <canvas class='upside-down mirror-x' id='` +
			$t.clean(get("cabCanvasId")(get("cabInfo").parts[0], 'side')) +
			`'></canvas> </div> </div>`
	
	exports['documents/construction'] = (get, $t) => 
			`<div class='target-input-selector'> ` +
			$t.clean(get("selectorHtml")) +
			` </div> <div id='document-print-body' hidden> <button class='print'>Print</button> <div class='document-cnt'></div> <button class='print'>Print</button> </div> `
	
	exports['documents/cuts/cut-edge-ref'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("$index") === 0 ? "left" : "right") +
			`'> <div> ` +
			$t.clean(get("label")) +
			`@` +
			$t.clean(get("disp").measurement(get("distance"))) +
			` </div> </div> `
	
	exports['documents/cuts/cut-no-ref'] = (get, $t) => 
			`<div class='center dashed'></div> `
	
	exports['documents/cuts/cut-point-ref'] = (get, $t) => 
			`` +
			$t.clean(get("disp").line2d(get("scope"))) +
			` `
	
	exports['documents/cuts/cuts'] = (get, $t) => 
			`<span> <table class='no-border-cells'> <caption><b>Cut References</b></caption> <tr> <th>Cut ID</th> <th>Marker</th> <th>Width</th> <th>Depth</th> <th><i class='gg-shape-triangle no-right no-bottom'></i></th> <th><i class='gg-shape-triangle no-right'></i></th> <th class='edge-ref'>Edge References<div>Left<br/>Right</div></th> <th>Length</th> </tr> ` +
			$t.clean( new $t('documents/cuts/cut-data').render(get("cuts"), 'cut', get)) +
			` </table> </span> `
	
	exports['documents/cuts/hand-saw'] = (get, $t) => 
			`<div class='hand-saw-cnt'> <table class='no-border-cells'> <caption><b>Hand Saw</b></caption> <tr> <th>Width</th> <th>Depth</th> <th>Length</th> <th>Angle</th> <th>Relitive To Vertex</th> <th>Relitive To Vertex</th> </tr> ` +
			$t.clean( new $t('1903603615').render(get("list"), 'item', get)) +
			` </table> </div> `
	
	exports['documents/cuts/table-saw'] = (get, $t) => 
			`<span> <table class='no-border-cells'> <caption><b>Table Saw</b></caption> <tr> <th class='no-border'></th> <th>Width</th> <th>Depth</th> <th>Angle</th> <th>Side&nbsp;Up</th> <th>Edge</th> <th>Fence&nbsp;@</th> <th>Length</th> <th>OOB</th> </tr> ` +
			$t.clean( new $t('documents/cuts/table-data').render(get("list"), 'item', get)) +
			` </table> </span> `
	
	exports['documents/cuts/table-data'] = (get, $t) => 
			`<tr> <td class='no-border'>` +
			$t.clean(!get("item").valid ? '!!!' : '') +
			`</td> <td>` +
			$t.clean(get("item").width ? get("display").measurement(get("item").width) : '') +
			`</td> <td>` +
			$t.clean(get("item").depth ? get("display").measurement(get("item").depth) : '') +
			`</td> <td>` +
			$t.clean(get("item").angle ? get("display").degrees(get("item").angle) : '') +
			`</td> <td>` +
			$t.clean(get("item").upSide === 'Both' ? '' : get("item").upSide) +
			`</td> <td>` +
			$t.clean(get("item").fenceEdge.label) +
			`</td> <td>` +
			$t.clean(get("display").measurement(get("item").fenceDistance)) +
			`</td> <td>` +
			$t.clean(get("item").length ? get("display").measurement(get("item").length) : '') +
			`</td> <td>` +
			$t.clean(get("item").outsideOfBlade ? 'true' : '') +
			`</td> </tr> `
	
	exports['documents/cuts/unknown'] = (get, $t) => 
			`<div class='unknown-cnt'> <h3>Cut information Cannot Be Determined for joints:</h3> ` +
			$t.clean( new $t('-506182427').render(get("list"), 'item', get)) +
			` </div> `
	
	exports['-506182427'] = (get, $t) => 
			`<div class='cut-info-cnt tab font-medium' > ` +
			$t.clean(get("item").descriptor) +
			` </div>`
	
	exports['documents/task-completion'] = (get, $t) => 
			`<div> <br> <div class="loading-bar-cnt main-progress-cnt"> <div class="loading-bar center" style="width:` +
			$t.clean(get("progress")) +
			`%"> ` +
			$t.clean(get("progress")) +
			`% </div> </div> <br> <div class='ind-task-progress-cnt'> ` +
			$t.clean( new $t('2053240362').render(get("tasks"), 'task', get)) +
			` </div> </div> `
	
	exports['feature'] = (get, $t) => 
			`<h3>Feature Display</h3> `
	
	exports['group/body'] = (get, $t) => 
			`<div group-id='` +
			$t.clean(get("group").id()) +
			`' lookup-id='` +
			$t.clean(get("group").id()) +
			`'> <div class='group-descriptor'> ` +
			$t.clean( new $t(`group/descriptors/` +
			$t.clean(get("group").resolve("style").toLowerCase()) +
			``).render(get("scope"), undefined, get)) +
			` </div> ` +
			$t.clean(get("propertyHtml")(get("group"))) +
			` <div class='cabinet-cnt'>` +
			$t.clean(get("groupDisplay").cabinetHtml(get("group"))) +
			`</div> </div> `
	
	exports['group/descriptors/overlay'] = (get, $t) => 
			`<div cab-style='Overlay'> <h5> ` +
			$t.clean(get("group").resolve('fls') ? '' : get("group").propertyConfig('dfw').display() +
			' Frame - ') +
			` <b class='group-key'>` +
			$t.clean(get("group").propertyConfig('ov').display()) +
			`</b> Overlay </h5> </div> `
	
	exports['group/descriptors/inset'] = (get, $t) => 
			`<div cab-style='Inset'> <h5> ` +
			$t.clean(get("group").resolve('fls') ? '' : get("group").propertyConfig('dfw').display() +
			' Frame - ') +
			` <b class='group-key'>` +
			$t.clean(get("group").propertyConfig('is').display()) +
			`</b> Inset </h5> </div> `
	
	exports['group/descriptors/reveal'] = (get, $t) => 
			`<div cab-style='Reveal'> <h5> ` +
			$t.clean(get("group").resolve('fls') ? '' : get("group").propertyConfig('dfw').display() +
			' Frame - ') +
			` <b class='group-key'>` +
			$t.clean(get("group").propertyConfig('r').display()) +
			`</b> Reveal </h5> </div> `
	
	exports['group/style-descriptor'] = (get, $t) => 
			``
	
	exports['group/head'] = (get, $t) => 
			`<div group-display-id='` +
			$t.clean(get("groupDisplay").id()) +
			`'> <div group-id='` +
			$t.clean(get("group").id()) +
			`' class='expand-header group-display-header ` +
			$t.clean(get("groupDisplay").active() === get("group") ? 'active' : '') +
			`'> <input class='group-input' group-id='` +
			$t.clean(get("group").id()) +
			`' value='` +
			$t.clean(get("group").name()) +
			`' prop-update='name'> </div> <div class='group-display-body' ` +
			$t.clean(get("groupDisplay").active() === get("group") ? '' : 'hidden') +
			`> ` +
			$t.clean(get("body")) +
			` </div> <br> </div> `
	
	exports['hello'] = (get, $t) => 
			`Hello World `
	
	exports['index'] = (get, $t) => 
			`<html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <style> /* #two-d-model { width: 500px; height:500px;} */ div { font-size:x-small; } </style> <script type="text/javascript" src='/cabinet/js/index.js'></script> <script type="text/javascript" src='/js/qrious.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/styles/file-tab.css"> <link rel="stylesheet" href="/cabinet/styles/estimate.css"> <link rel="stylesheet" href="/styles/icons.css"> <script src="/js/utility-filter.js" run-type='auto'></script> <title>` +
			$t.clean(get("title")) +
			`</title> </head> <body> <button id='menu-btn'>&#8801;</button> <div id='menu' hidden></div> <div id='login' hidden><div id='login-cnt' class='center-all'></div></div> <div id='display-ctn'> <div id='app' name='Orders' ` +
			$t.clean(get("pageId") !== 'home' ? "link='/cabinet/home'" : '') +
			` hidden> <div id='order-cnt'></div> </div> <div name='Property Manager' ` +
			$t.clean(get("pageId") !== 'home' ? "link='/cabinet/property'" : '') +
			` id='property-manager-cnt' hidden> <div class='center'> <button id='property-manager-save-all'>Save All</button> </div> <div id='property-manager'></div> </div> <div id='cost-manager' "link='/cabinet/cost'" name='Cost Manager' ` +
			$t.clean(get("pageId") !== 'cost' ? "link='/cabinet/cost'" : '') +
			` hidden></div> <div id='template-manager' name='Template Manager' ` +
			$t.clean(get("pageId") !== 'template' ? "link='/cabinet/template'" : '') +
			` hidden>Temp Man</div> <div id='pattern-manager' name='Pattern Manager' ` +
			$t.clean(get("pageId") !== 'home' ? "link='/cabinet/pattern'" : '') +
			` hidden>Pat Man</div> </div> ` +
			$t.clean( new $t('canvas-displays').render(get("autoLocProps"), undefined, get)) +
			` <div id='property-select-cnt'></div> </body> </html> `
	
	exports['login/confirmation-message'] = (get, $t) => 
			`<h3> Check your email for confirmation. </h3> <button id='resend-activation'>Resend</button> `
	
	exports['login/create-account'] = (get, $t) => 
			`<h3>Create An Account</h3> <input type='text' placeholder="email" name='email' value='` +
			$t.clean(get("email")) +
			`'> <input type='password' placeholder="password" name='password' value='` +
			$t.clean(get("password")) +
			`'> <br><br> <button id='register'>Register</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='LOGIN'>Login</a> `
	
	exports['login/login'] = (get, $t) => 
			`<h3>Login</h3> <input type='text' placeholder="email" name='email' value='` +
			$t.clean(get("email")) +
			`'> <input type='password' placeholder="password" name='password' value='` +
			$t.clean(get("password")) +
			`'> <br><br> <button id='login-btn'>Login</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `
	
	exports['login/reset-password'] = (get, $t) => 
			`<h3>Reset Password</h3> <input type='text' placeholder="email" name='email' value='` +
			$t.clean(get("email")) +
			`'> <input type='password' placeholder="password" name='password' value='` +
			$t.clean(get("password")) +
			`'> <br><br> <button id='reset-password'>Reset</button> <br><br> <a href='#' user-state='LOGIN'>Login</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `
	
	exports['managers/abstract-manager'] = (get, $t) => 
			`<div> <div class="center"> <h2 id='` +
			$t.clean(get("headerId")) +
			`'> ` +
			$t.clean(get("header")) +
			` <button class='manager-save-btn' id='` +
			$t.clean(get("saveBtnId")) +
			`'>Save</button> </h2> </div> <div id="` +
			$t.clean(get("bodyId")) +
			`"></div> </div> `
	
	exports['managers/cost/body'] = (get, $t) => 
			`<div hidden> <div> <span> ` +
			$t.clean(get("CostManager").nodeInputHtml()) +
			` <button>Add Cost</button> <button>Add Node</button> </span> <span> Cost Display </span> </div> ` +
			$t.clean( new $t('2055573719').render(get("node").children(), 'child', get)) +
			` </div> `
	
	exports['managers/cost/head'] = (get, $t) => 
			`<div class='expand-header' node-id='` +
			$t.clean(get("node").nodeId()) +
			`'> <b> ` +
			$t.clean(get("node").payload().name()) +
			` - ` +
			$t.clean(get("node").payload().type()) +
			` </b> <ul> ` +
			$t.clean( new $t('1417643187').render(get("node").payload().requiredProperties, 'property', get)) +
			` </ul> </div> `
	
	exports['managers/cost/main'] = (get, $t) => 
			`<div> <div class="center"> <h2 id='cost-manager-header'> Cost Tree Manager </h2> </div> ` +
			$t.clean( new $t('-496477131').render(get("root")().children(), 'child', get)) +
			` <button id='cost-manager-save-btn'>Save</button> </div> `
	
	exports['-496477131'] = (get, $t) => 
			`<div class='expandable-list cost-tree' radio-id='poo'> ` +
			$t.clean(get("headHtml")(get("child"))) +
			` ` +
			$t.clean(get("bodyHtml")(get("child"))) +
			` </div>`
	
	exports['managers/cost/property-select'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('-1569738859').render(get("groups"), 'group, properties', get)) +
			` </div> `
	
	exports['-1569738859'] = (get, $t) => 
			`<div > <b>` +
			$t.clean(get("group")) +
			` (` +
			$t.clean(get("abbriviation")(get("group"))) +
			`)</b> ` +
			$t.clean( new $t('1036581066').render(get("properties"), 'property', get)) +
			` </div>`
	
	exports['managers/cost/types/labor'] = (get, $t) => 
			`<div cost-id='` +
			$t.clean(get("cost").id()) +
			`'> <b>Labor</b> <span` +
			$t.clean(get("cost").length() === undefined ? ' hidden' : '') +
			`> <input value='` +
			$t.clean(get("cost").length()) +
			`'> </span> <span` +
			$t.clean(get("cost").width() === undefined ? ' hidden' : '') +
			`> <label>X</label> <input value='` +
			$t.clean(get("cost").width()) +
			`'> </span> <span` +
			$t.clean(get("cost").depth() === undefined ? ' hidden' : '') +
			`> <label>X</label> <input value='` +
			$t.clean(get("cost").depth()) +
			`'> </span> <br> <div> <label>Cost</label> <input value='` +
			$t.clean(get("cost").cost()) +
			`'> <label>Per ` +
			$t.clean(get("cost").unitCost('name')) +
			` = ` +
			$t.clean(get("cost").unitCost('value')) +
			`</label> </div> </div> `
	
	exports['managers/cost/types/material'] = (get, $t) => 
			`<div cost-id='` +
			$t.clean(get("cost").id()) +
			`'> <b>Material</b> <span` +
			$t.clean(get("cost").length() === undefined ? ' hidden' : '') +
			`> <input value='` +
			$t.clean(get("cost").length()) +
			`'> </span> <span` +
			$t.clean(get("cost").width() === undefined ? ' hidden' : '') +
			`> <label>X</label> <input value='` +
			$t.clean(get("cost").width()) +
			`'> </span> <span` +
			$t.clean(get("cost").depth() === undefined ? ' hidden' : '') +
			`> <label>X</label> <input value='` +
			$t.clean(get("cost").depth()) +
			`'> </span> <br> <div> <label>Cost</label> <input value='` +
			$t.clean(get("cost").cost()) +
			`'> <label>Per ` +
			$t.clean(get("cost").unitCost('name')) +
			` = ` +
			$t.clean(get("cost").unitCost('value')) +
			`</label> </div> </div> `
	
	exports['managers/property/body'] = (get, $t) => 
			`<div> No Need </div> `
	
	exports['managers/template/body'] = (get, $t) => 
			`<div class='template-body' template-id=` +
			$t.clean(get("template").id()) +
			`> <div class='inline-flex full-width'> <h4 class='nowrap'>` +
			$t.clean(get("template").type()) +
			`</h4> <div class='full-width'> <button class='copy-template right'>Copy</button> <button class='paste-template right'>Paste</button> </div> </div> ` +
			$t.clean( new $t(`managers/template/headers/` +
			$t.clean(get("template").constructor.cxtrType.toLowerCase()) +
			``).render({hideEmpty: true}, undefined, get)) +
			` <br> <div class='inline-flex'> <label>Demensions: </label> <span> <input class='cabinet-input dem' type="text" name="width" value="` +
			$t.clean(get("toDisplay")(get("template").width())) +
			`"> X <input class='cabinet-input dem' type="text" name="height" value="` +
			$t.clean(get("toDisplay")(get("template").height())) +
			`"> X <input class='cabinet-input dem' type="text" name="thickness" value="` +
			$t.clean(get("toDisplay")(get("template").thickness())) +
			`"> <br> <input class='cabinet-input' type="text" name="widthValue" disabled> X <input class='cabinet-input' type="text" name="heightValue" disabled> X <input class='cabinet-input' type="text" name="thicknessValue" disabled> </span> </div> ` +
			$t.clean( new $t('managers/template/expand-cnt').render(get("containers"), 'container', get)) +
			` <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>View Shape</div> <div hidden> <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='layout-shape-display'> <canvas class="top-sketch upside-down mirror-x" width="200" height="200"></canvas> <canvas class="front-sketch upside-down mirror-x" width="200" height="200"></canvas> </div> </div> </div> </div> `
	
	exports['managers/property/header'] = (get, $t) => 
			`<div> <b>` +
			$t.clean(get("instance").name) +
			` (` +
			$t.clean(get("instance").constructor.code) +
			`) - ` +
			$t.clean(get("instance").value) +
			`</b> </div> `
	
	exports['managers/template/expand-cnt'] = (get, $t) => 
			`<div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>` +
			$t.clean(get("container").name) +
			`</div> <div hidden class="` +
			$t.clean(get("container").class) +
			`"> ` +
			$t.clean(get("container").html && get("container").html(get("template"))) +
			` </div> </div> `
	
	exports['managers/template/head'] = (get, $t) => 
			`<div> <b>` +
			$t.clean(get("template").type()) +
			`</b> </div> `
	
	exports['managers/template/headers/assembly'] = (get, $t) => 
			``
	
	exports['managers/template/headers/cabinet'] = (get, $t) => 
			`<label>Automatic Toekick</label> <input type="checkbox" name="autoToeKick" ` +
			$t.clean(get("template").autoToeKick() ? 'checked' : '') +
			`> <br> <label>Height from floor:</label> <input class='cabinet-input dem' type="text" name="fromFloor" value="` +
			$t.clean(get("template").fromFloor()) +
			`"> <input class='cabinet-input' type="text" name="fromFloorValue" disabled> <br> `
	
	exports['managers/template/joints/body'] = (get, $t) => 
			`` +
			$t.clean(get("jointInput").html()) +
			` <input type="text" name="value" disabled > <input type="checkbox" name="convert" checked> `
	
	exports['managers/template/joints/head'] = (get, $t) => 
			`<b> <input class='template-input' value='` +
			$t.clean(get("obj").selector.depends()) +
			`' attr='joints' placeholder='Male Part Code' name='selector-depends'> => <input class='template-input' value='` +
			$t.clean(get("obj").selector.dependent()) +
			`' attr='joints' placeholder='Female Part Code' name='selector-dependent'> </b> `
	
	exports['managers/template/main'] = (get, $t) => 
			`<div template-manager=` +
			$t.clean(get("id")()) +
			`> <div class='section-properties'> <br> <label>Inset</label> <input class='style-selector' type="radio" name="style" value="Inset" ` +
			$t.clean(get("sectionState").style === 'Inset' ? 'checked' : '') +
			`> <label>overlay</label> <input class='style-selector' type="radio" name="style" value="Overlay" ` +
			$t.clean(get("sectionState").style === 'Overlay' ? 'checked' : '') +
			`> <label>Reveal</label> <input class='style-selector' type="radio" name="style" value="Reveal" ` +
			$t.clean(get("sectionState").style === 'Reveal' ? 'checked' : '') +
			`> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <label>Door</label> <input type="radio" name='sectionType' value="DoorSection"> <label>Drawer</label> <input type="radio" name='sectionType' value="DrawerSection"> <label>Duel Door</label> <input type="radio" name='sectionType' value="DualDoorSection"> <label>False Front</label> <input type="radio" name='sectionType' value="FalseFrontSection"> <label>Open</label> <input type="radio" name='sectionType' value=""> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <label>Divider Count</label> <input id='template-divider-count-input' type="number" name="count" min='0' max='3' value=0> <label>Vertical</label> <input type="checkbox" name="vertical"> <label>Test</label> <input type="checkbox" name="testDividers"> </div> <div id='` +
			$t.clean(get("parentId")()) +
			`'></div> <div class='center center-vert' id='opening-sketch-cnt'></div> </div> `
	
	exports['managers/template/openings/head'] = (get, $t) => 
			`<div class='inline-flex' opening-index='` +
			$t.clean(get("index")) +
			`' opening-id='` +
			$t.clean(get("obj").id) +
			`'> Openings </div> `
	
	exports['canvas-displays'] = (get, $t) => 
			`<div id='model-cnt'> <div id='display-menu'></div> <div id='model-display-cnt'> <div name="Layout" id='two-d-model'> <canvas id="two-d-model-canvas"></canvas> <div class='orientation-controls'></div> </div> <div name='Cabinet' id='disp-canvas-cab'></div> <div name='Parts 3D' id='disp-canvas-p3d'> <div id='model-controller'></div> </div> <div name='Parts 2D' id='disp-canvas-p2d'></div> <div name='Room' id='disp-canvas-room'> <table class='borderless'> <tbody class='borderless'> <tr id='wall-color-cnt'> <td class='borderless'><label>Walls</label></td> <td class='borderless'><select class='color-selector'></select></td> <td class='borderless'><input type='color'></td> </tr> <tr id='cab-color-cnt'> <td class='borderless'><label>Cabinet</label></td> <td class='borderless'><select class='color-selector'></select></td> <td class='borderless'><input type='color'></td> </tr> <tr id='obj-color-cnt'> <td class='borderless'><label>Object</label></td> <td class='borderless'><select class='color-selector'></select></td> <td class='borderless'><input type='color'></td> </tr> </tbody> </table> </div> <div id="three-d-model" class="viewer small"> <div class='inline left'> <div class='orientation-controls'></div> </div> </div> </div> </div> `
	
	exports['display-manager'] = (get, $t) => 
			`<div class='display-manager' id='` +
			$t.clean(get("switchCntId")) +
			`'> ` +
			$t.clean( new $t('-533097724').render(get("list"), 'item', get)) +
			` </div> `
	
	exports['-533097724'] = (get, $t) => 
			`<span class='display-manager-item'> <button class='display-manager-input` +
			$t.clean(get("$index") === 0 ? " active" : "") +
			`' type='button' display-id='` +
			$t.clean(get("item").id) +
			`' link='` +
			$t.clean(get("link")) +
			`'>` +
			$t.clean(get("item").name) +
			`</button> </span>`
	
	exports['managers/template/subassemblies/head'] = (get, $t) => 
			`<label>Part Code</label> <input class='template-input' attr='subassemblies' name='code' value="` +
			$t.clean(get("obj").code) +
			`"> ` +
			$t.clean(get("typeInput").html()) +
			` `
	
	exports['managers/template/subassemblies/object/normals'] = (get, $t) => 
			`<table class='` +
			$t.clean(!get("obj").normalInfo || get("obj").normalInfo.valid ? '' : 'error') +
			`'> <tr> <th></th> ` +
			$t.clean( new $t('1819729875').render(['i', 'j', 'k'], 'char', get)) +
			` <th>Calculated</th> <th>Value</th> </tr> ` +
			$t.clean( new $t('-1855337671').render(['Cross Grain', 'With Grain', 'End Grain'], 'label', get)) +
			` </table> `
	
	exports['-1855337671'] = (get, $t) => 
			`<tr index="` +
			$t.clean(get("$index")) +
			`" class='tab normal-vector-input-cnt ` +
			$t.clean(!get("obj").normalInfo || get("obj").normalInfo.normals[get("$index")] ? '' : 'error') +
			`'> <td><label>` +
			$t.clean(get("label")) +
			`</label></td> <td> <input class="dem" type="text" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.normals[get("$index")][0]) +
			`"> </td> <td> <input class="dem" type="text" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.normals[get("$index")][1]) +
			`"> </td> <td> <input class="dem" type="text" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.normals[get("$index")][2]) +
			`"> </td> <td> <input type='radio' name='calculated-` +
			$t.clean(get("obj").id) +
			`' class='calc-vect-radio' ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'checked' : '') +
			`> </td> <td> <input name='display' type='text' disabled value='` +
			$t.clean(get("normalToString")(get("obj"), get("$index"))) +
			`'> </td> </tr>`
	
	exports['managers/template/subassemblies/object/poly'] = (get, $t) => 
			`<div class='poly-input-cnt'> <label>Thickness</label> <input class='template-input measurement-display' attr='subassemblies' name='polyConfig.thickness' value='` +
			$t.clean(get("subAssem").polyConfig.thickness) +
			`'> <input disabled class='measurement-input' name='value'> <br> <label>Points</label> ` +
			$t.clean( new $t('133324092').render(get("subAssem").polyConfig.points, 'point', get)) +
			` <button class='add-poly-point'>Add</button> </div> `
	
	exports['managers/template/subassemblies/object/void'] = (get, $t) => 
			`<div> <label>Joint Set:</label> <select class='template-input set-selector' name='jointSetIndex'> ` +
			$t.clean( new $t('-2013474054').render('0..6', 'i', get)) +
			` </select> <br> <div> <label>Include sides</label> ` +
			$t.clean( new $t('-1101208247').render('0..6', 'i', get)) +
			` </div> </div> `
	
	exports['-2013474054'] = (get, $t) => 
			`<option ` +
			$t.clean(get("jointSetIndex") === get("i") ? 'selected' : '') +
			`>` +
			$t.clean(get("i")) +
			`</option>`
	
	exports['-1101208247'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("i")) +
			`</label> <input class='template-input' type='checkbox' name='includedSides.` +
			$t.clean(get("i")) +
			`' ` +
			$t.clean(get("includedSides")[get("i")] ? 'checked' : '') +
			`> </span>`
	
	exports['managers/template/values/head'] = (get, $t) => 
			`<div template-attr='values'> <input class='template-input' attr='values' type='text' name='name' value='` +
			$t.clean(get("obj").key) +
			`' placeholder="Variable Name"> <input class='measurement-input' type='text' name='value' value='` +
			$t.clean(get("obj").eqn) +
			`' placeholder="Value" disabled> <input type="checkbox" name="convert" checked> <br> <input class='template-input full-width' attr='values' type='text' name='eqn' value='` +
			$t.clean(get("obj").eqn) +
			`' placeholder="Equation"> </div> `
	
	exports['model-controller-old'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("group").level < 2 ? '' : 'model-selector indent') +
			`' ` +
			$t.clean(get("group").level < 2 ? '' : 'hidden') +
			`> <div class='model-state ` +
			$t.clean(get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") +
			` ` +
			$t.clean(get("label") ? "prefix-switch" : "") +
			`'> <label type='prefix'>` +
			$t.clean(get("label")) +
			`</label> <input type='checkbox' class='prefix-checkbox' prefix='` +
			$t.clean(get("group").prefix) +
			`' ` +
			$t.clean(!get("tdm").hidePrefix(get("label")) ? 'checked' : '') +
			` ` +
			$t.clean(get("group").level === 0 ? 'hidden' : '') +
			`> <div class='model-container'> ` +
			$t.clean( new $t('-986829271').render(get("group").parts, 'partName, partList', get)) +
			` </div> ` +
			$t.clean( new $t('model-controller').render(get("group").groups, 'label, group', get)) +
			` </div> </div> `
	
	exports['-103984952'] = (get, $t) => 
			`<div part-id='` +
			$t.clean(get("part").id()) +
			`' part-code='` +
			$t.clean(get("part").partCode()) +
			`' class='model-state ` +
			$t.clean(get("tdm").isTarget("part-id", get("part").id()) ? "active " : "") +
			`' ` +
			$t.clean(get("partList").length === 1 ? 'hidden' : '') +
			`> <label type='part-id' target part-code='` +
			$t.clean(get("part").partCode()) +
			`'> ` +
			$t.clean(get("part").partCode()) +
			`-` +
			$t.clean(get("$index") +
			1) +
			` </label> <input type='checkbox' class='part-id-checkbox' part-id='` +
			$t.clean(get("part").id()) +
			`' part-code='` +
			$t.clean(get("part").partCode()) +
			`' ` +
			$t.clean(!get("tdm").hidePartId(get("part").id()) ? 'checked' : '') +
			`> </div>`
	
	exports['-986829271'] = (get, $t) => 
			`<div class='model-state ` +
			$t.clean(get("group").level < 1 ? '' : 'model-label indent') +
			` ` +
			$t.clean(get("tdm").isTarget("part-name", get("partName")) ? " active" : "") +
			`' ` +
			$t.clean(get("group").level < 1 ? '' : 'hidden') +
			` ` +
			$t.clean(get("partList").length === 1 ? 'target part-code="' +
			get("partList")[0].partCode() +
			'"' : '') +
			`> <label type='part-name' part-name='` +
			$t.clean(get("partName")) +
			`'> ` +
			$t.clean(get("partName")) +
			`` +
			$t.clean(get("partList").length === 1 ? '(' +
			get("partList")[0].partCode() +
			')' : '') +
			` </label> <input type='checkbox' class='part-name-checkbox' part-name='` +
			$t.clean(get("partName")) +
			`' ` +
			$t.clean(!get("tdm").hidePartName(get("partName")) ? 'checked' : '') +
			`> <div class='indent'> ` +
			$t.clean( new $t('-103984952').render(get("partList"), 'part', get)) +
			` </div> </div>`
	
	exports['opening'] = (get, $t) => 
			`<div class='opening-cnt' opening-id='` +
			$t.clean(get("opening").id()) +
			`'> <b class='copy-inner-text'>` +
			$t.clean(get("opening").name()) +
			`</b> <div class='divider-controls'> ` +
			$t.clean(get("OpenSectionDisplay").dividerHtml(get("opening"))) +
			` </div> <div> <label>Section Type:</label> <select class='section-selection'> <option>Open</option> ` +
			$t.clean( new $t('184800797').render(get("sections"), 'section', get)) +
			` </select> <div class='section-feature-cnt'> <div class='inline-flex chev-dropdown-toggle'> Opening Features <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </div> <div class='tab chev-dropdown' hidden> ` +
			$t.clean(get("featuresHtml")) +
			` </div> </div> <div id='` +
			$t.clean(get("openDispId")) +
			`'> </div> </div> </div> `
	
	exports['order/body'] = (get, $t) => 
			`<div order-id='` +
			$t.clean(get("order").id()) +
			`'> <b>` +
			$t.clean(get("order").name()) +
			`</b> <ul id='order-nav' class='center toggle-display-list'> <li class='toggle-display-item active' display-id='builder-display-` +
			$t.clean(get("order").id()) +
			`'>Builder</li> <li class='toggle-display-item' display-id='information-display-` +
			$t.clean(get("order").id()) +
			`'>Information</li> </ul> <div id='builder-display-` +
			$t.clean(get("order").id()) +
			`'> <b>` +
			$t.clean(get("order").name()) +
			`</b> <button class='save-order-btn' index='` +
			$t.clean(get("$index")) +
			`'>Save</button> <div id='room-pills'>RoomPills!</div> </div> <div id='information-display-` +
			$t.clean(get("order").id()) +
			`' hidden> <utility-filter id='uf-info-` +
			$t.clean(get("order").id()) +
			`' edit='true'> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> </div> </div> `
	
	exports['order/builder/body'] = (get, $t) => 
			`<div order-id='` +
			$t.clean(get("order").id()) +
			`'> <b>` +
			$t.clean(get("order").name) +
			`</b> <button class='save-order-btn' index='` +
			$t.clean(get("$index")) +
			`'>Save</button> <div id='room-pills'>RoomPills!</div> </div> `
	
	exports['order/builder/head'] = (get, $t) => 
			`<h3 class='margin-zero'> ` +
			$t.clean(get("order").name) +
			` </h3> `
	
	exports['order/head'] = (get, $t) => 
			`<h3 class='margin-zero'> ` +
			$t.clean(get("order").name()) +
			` </h3> `
	
	exports['order/information/body'] = (get, $t) => 
			`<utility-filter hidden> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> `
	
	exports['order/information/head'] = (get, $t) => 
			`<b>Information</b> `
	
	exports['managers/template/openings/body'] = (get, $t) => 
			`<div> <h4>Opening Border Part Codes</h4> <div class='tab border-part-code-cnt'> ` +
			$t.clean(get("select").html()) +
			` <input class='opening-part-code-input' attr='openings' name='partCode' value="` +
			$t.clean(get("obj")[get("select").value()]) +
			`"> </div> <h4>Opening Border Locations</h4> <div class='tab'> Definition Type: <div class='tab'> <label>Default</label> <input class='opening-type-selector' type='radio' name="definitionType-` +
			$t.clean(get("obj").id) +
			`" value='Default' ` +
			$t.clean(get("obj")._Type === undefined ? 'checked' : '') +
			`> <label>Manual</label> <input class='opening-type-selector' type='radio' name="definitionType-` +
			$t.clean(get("obj").id) +
			`" value='location' ` +
			$t.clean(get("obj")._Type === 'location' ? 'checked' : '') +
			`> <label>Slice (L/R)</label> <input class='opening-type-selector' type='radio' name="definitionType-` +
			$t.clean(get("obj").id) +
			`" value='slice' ` +
			$t.clean(get("obj")._Type === 'slice' ? 'checked' : '') +
			`> </div> <div class='border-location-cnt' ` +
			$t.clean(get("obj")._Type === 'location' ? '' : 'hidden') +
			`> <label>Inner</label> <input type="radio" name="innerOouter-` +
			$t.clean(get("obj").id) +
			`" value="true" ` +
			$t.clean(get("state").innerOouter === 'true' ? 'checked' : '') +
			`> <label>Outer</label> <input type="radio" name="innerOouter-` +
			$t.clean(get("obj").id) +
			`" value="false" ` +
			$t.clean(get("state").innerOouter === 'false' ? 'checked' : '') +
			`> <br><br> <label>Vertex:</label> <br> ` +
			$t.clean( new $t('-182533851').render('0..4', 'i', get)) +
			` <br><br> <label>X</label> <input type="radio" name="xOyOz-` +
			$t.clean(get("obj").id) +
			`" value="x" ` +
			$t.clean(get("state").xOyOz === 'x' ? 'checked' : '') +
			`> <label>Y</label> <input type="radio" name="xOyOz-` +
			$t.clean(get("obj").id) +
			`" value="y" ` +
			$t.clean(get("state").xOyOz === 'y' ? 'checked' : '') +
			`> <label>Z</label> <input type="radio" name="xOyOz-` +
			$t.clean(get("obj").id) +
			`" value="z" ` +
			$t.clean(get("state").xOyOz === 'z' ? 'checked' : '') +
			`> <br><br> <input type='text' name='opening-coordinate-value' value=''> </div> <div class='border-slice-cnt' ` +
			$t.clean(get("obj")._Type === 'slice' ? '' : 'hidden') +
			`> Left Side Depth <input type='text' name='leftDepth' value='` +
			$t.clean(get("leftDepth")) +
			`'> <br> Right Side Depth <input type='text' name='rightDepth' value='` +
			$t.clean(get("rightDepth")) +
			`'> </div> <div class='opening-location-value-cnt'></div> <div class='opening-location-description-cnt'></div> </div> </div> `
	
	exports['-182533851'] = (get, $t) => 
			`<span class='border-location-cnt'> <label>` +
			$t.clean(get("i")) +
			`</label> <input type="radio" name="index-` +
			$t.clean(get("obj").id) +
			`" value="` +
			$t.clean(get("i")) +
			`" ` +
			$t.clean(get("state").index === get("i") ? 'checked' : '') +
			`> </span>`
	
	exports['order'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <script type="text/javascript" src='/cabinet/js/index.js'></script> <script type="text/javascript" src='/js/qrious.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/styles/file-tab.css"> <link rel="stylesheet" href="/styles/icons.css"> <link rel="stylesheet" href="/cabinet/styles/estimate.css"> <script src="/js/utility-filter.js" run-type='auto'></script> <title>CComp</title> </head> <body> <div id='order-select-cnt' class='center no-print'> <span id='order-selector-cnt' hidden></span> <button type="button" class='auto-save-btn' name="button">Choose Save Location</button> <span id='save-time-cnt'></span> </div> <div class='expandable-list' id='single-order-cnt'> <div id='main-display-menu' class='display-manager center'></div> <div id='display-cnt'> <div id='order-display-cnt'> <div id='order-cnt'> <div class='center pad no-print'> <input id='order-name-input' class='header-input' size='20' type="text" name="order-name"> <input id='order-version-input' class='header-input' size='20' type="text" name="order-version"> </div> <div id="order-tab-cnt"></div> </div> ` +
			$t.clean( new $t('canvas-displays').render(get("scope"), undefined, get)) +
			` </div> <div id='information-display'> <utility-filter id='uf-order-info' edit='true'></utility-filter> </div> </div> </div> <canvas id='qr-demo' hidden></canvas> </body> </html> `
	
	exports['parts/model-controller'] = (get, $t) => 
			` <div class='model-controller-cnt'> <label>Explosion Factor</label> <input type='number' min=0 max=10 step=1 name='explosionFactor' value='` +
			$t.clean(get("dispExplosionFactor")) +
			`'> <br> <label>location</label> <input type='radio' name='grouping' value='location' ` +
			$t.clean(get("groupingType") === 'location' ? 'checked' : '') +
			`> <label>id</label> <input type='radio' name='grouping' value='id' ` +
			$t.clean(get("groupingType") === 'id' ? 'checked' : '') +
			`> ` +
			$t.clean( new $t('parts/selector').render(get("grouping"), undefined, get)) +
			` </div> `
	
	exports['parts/selector'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("group").level < 2 ? '' : 'model-selector indent') +
			`' ` +
			$t.clean(get("group").level < 2 ? '' : 'hidden') +
			`> <div prefix='` +
			$t.clean(get("group").prefix) +
			`' class='model-state` +
			$t.clean(get("label") ? " prefix-switch" : "") +
			`'> <label type='prefix'>` +
			$t.clean(get("label")) +
			`</label> ` +
			$t.clean( new $t('parts/selector').render(get("group").groups, 'label, group', get)) +
			` </div> </div> `
	
	exports['projects'] = (get, $t) => 
			`<div class='center'> ` +
			$t.clean( new $t('-1239278236').render(get("projects"), 'project', get)) +
			` </div> `
	
	exports['-241913653'] = (get, $t) => 
			`<span > <image src='` +
			$t.clean(get("image").url) +
			`'> </span>`
	
	exports['-1823929975'] = (get, $t) => 
			`<li > ` +
			$t.clean(get("note")) +
			` </li>`
	
	exports['-1239278236'] = (get, $t) => 
			`<div class='project-cnt'> <input id="_` +
			$t.clean(get("$index")) +
			`" type="checkbox" hidden> <label class="css-dropdown" for="_` +
			$t.clean(get("$index")) +
			`"> <b> <a href='http://localhost:3000/cabinet/order?staticOrder=` +
			$t.clean(get("project").file) +
			`' target="_blank"> ` +
			$t.clean(get("project").name) +
			` </a> </b> - <b class='project-date'>` +
			$t.clean(get("project").date) +
			`</b> </label> <div> ` +
			$t.clean(get("project").description) +
			` <div> <table border='1' class='border-collapse center'> <tbody> <tr> <th> Design Time </th> <th>Build Time</th> <th>Finished With</th> <th>Finish Time</th> </tr> <tr> <td>` +
			$t.clean(get("project").designTime) +
			`</td> <td>` +
			$t.clean(get("project").buildTime) +
			`</td> <td>` +
			$t.clean(get("project").finishedWith) +
			`</td> <td>` +
			$t.clean(get("project").finishTime) +
			`</td> </tr> </tbody> </table> </div> <br> <div class='project-image-cnt'> ` +
			$t.clean( new $t('-241913653').render(get("project").images, 'image', get)) +
			` </div> <br> <label><b>Notes</b></label> <div class='center fit'> <ul> ` +
			$t.clean( new $t('-1823929975').render(get("project").notes, 'note', get)) +
			` </ul> </div> <br> <label><b>Issues</b></label> <div class='center fit'> <ul> ` +
			$t.clean( new $t('1856420978').render(get("project").issues, 'issue', get)) +
			` </ul> </div> </div> </div>`
	
	exports['properties/config-body'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('-302479018').render(get("properties"), 'property', get)) +
			` <button class='save-change' properties-id='` +
			$t.clean(get("properties")._ID) +
			`' ` +
			$t.clean(get("changed")(get("properties")._ID) ? '' : 'hidden') +
			`> Save </button> </div> `
	
	exports['-302479018'] = (get, $t) => 
			`<div class='property-cnt' > <label>` +
			$t.clean(get("property").name()) +
			`</label> <span ` +
			$t.clean(get("property").measurementId() ? '' : 'hidden') +
			`> <input type="text" prop-value-update='` +
			$t.clean(get("property").id()) +
			`' value="` +
			$t.clean(get("property").display()) +
			`" measurement-id='` +
			$t.clean(get("property").measurementId()) +
			`'> </span> <span ` +
			$t.clean((typeof (get("property").value())) === 'boolean' ? '' : 'hidden') +
			`> <input type="checkbox" prop-boolean-update='` +
			$t.clean(get("property").id()) +
			`' ` +
			$t.clean(get("property").value() === true ? 'checked' : '') +
			`> </span> </div>`
	
	exports['properties/config-body0'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('-179269626').render(get("properties"), 'property', get)) +
			` <button class='save-change' properties-id='` +
			$t.clean(get("properties")._ID) +
			`' ` +
			$t.clean(get("changed")(get("properties")._ID) ? '' : 'hidden') +
			`> Save </button> </div> `
	
	exports['-179269626'] = (get, $t) => 
			`<div class='property-cnt' > <label>` +
			$t.clean(get("property").name()) +
			`</label> <input type="text" prop-value-update='` +
			$t.clean(get("property").id()) +
			`' value="` +
			$t.clean(get("property").display()) +
			`" measurement-id='` +
			$t.clean(get("property").measurementId()) +
			`'> </div>`
	
	exports['properties/config-head'] = (get, $t) => 
			`` +
			$t.clean(get("name")) +
			` `
	
	exports['properties/config-head0'] = (get, $t) => 
			`` +
			$t.clean(get("name")) +
			` `
	
	exports['managers/template/subassemblies/object/lines'] = (get, $t) => 
			`<table class='` +
			$t.clean(!get("obj").normalInfo || get("obj").normalInfo.valid ? '' : 'error') +
			`'> <tr> <th></th> ` +
			$t.clean( new $t('1100231627').render(['start(x|y|z)', 'end(x|y|z)'], 'char', get)) +
			` <th>Calculated</th> <th>Value</th> </tr> ` +
			$t.clean( new $t('-1858767942').render(['Cross Grain', 'With Grain', 'End Grain'], 'label', get)) +
			` </table> `
	
	exports['-1858767942'] = (get, $t) => 
			`<tr index="` +
			$t.clean(get("$index")) +
			`" class='tab normal-vector-input-cnt ` +
			$t.clean(!get("obj").normalInfo || get("obj").normalInfo.normals[get("$index")] ? '' : 'error') +
			`'> <td><label>` +
			$t.clean(get("label")) +
			`</label></td> <td> <input class='template-input dem' attr='subassemblies' name="normalInfo.lines.` +
			$t.clean(get("$index")) +
			`.0.x" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").pathValue("normalInfo.lines." +
			get("$index") +
			".0.x")) +
			`"> </td> <td> <input class='template-input dem' attr='subassemblies' name="normalInfo.lines.` +
			$t.clean(get("$index")) +
			`.0.y" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").pathValue("normalInfo.lines." +
			get("$index") +
			".0.y")) +
			`"> </td> <td> <input class='template-input dem' attr='subassemblies' name="normalInfo.lines.` +
			$t.clean(get("$index")) +
			`.0.z" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").pathValue("normalInfo.lines." +
			get("$index") +
			".0.z")) +
			`"> </td> <td> <input class='template-input dem' attr='subassemblies' name="normalInfo.lines.` +
			$t.clean(get("$index")) +
			`.1.x" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").pathValue("normalInfo.lines." +
			get("$index") +
			".1.x")) +
			`"> </td> <td> <input class='template-input dem' attr='subassemblies' name="normalInfo.lines.` +
			$t.clean(get("$index")) +
			`.1.y" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").pathValue("normalInfo.lines." +
			get("$index") +
			".1.y")) +
			`"> </td> <td> <input class='template-input dem' attr='subassemblies' name="normalInfo.lines.` +
			$t.clean(get("$index")) +
			`.1.z" ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.calc === get("$index") ? 'disabled' : '') +
			` value="` +
			$t.clean(get("obj").pathValue("normalInfo.lines." +
			get("$index") +
			".1.z")) +
			`"> </td> <td> <input type='radio' name='calculated-` +
			$t.clean(get("obj").id) +
			`' class='calc-vect-radio' ` +
			$t.clean(get("obj").pathValue('normalInfo.calc') === get("$index") ? 'checked' : '') +
			`> </td> <td> <input name='display' type='text' disabled value='` +
			$t.clean(get("normalToString")(get("obj"), get("$index"))) +
			`'> </td> </tr>`
	
	exports['properties/properties'] = (get, $t) => 
			`<div class='center'> <div class='center'> <label>UNIT :&nbsp;&nbsp;&nbsp;&nbsp;</label> ` +
			$t.clean( new $t('-766481261').render(get("Properties").UNITS, 'property', get)) +
			` </div> ` +
			$t.clean( new $t('115117775').render(get("values"), 'key, properties', get)) +
			` </div> `
	
	exports['-766481261'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("property").name()) +
			`</label> <input type='radio' name='UNIT' prop-radio-update='` +
			$t.clean(get("property").id()) +
			`' value="` +
			$t.clean(get("property").name()) +
			`" ` +
			$t.clean(get("property").value() === true ? 'checked' : '') +
			`> </span>`
	
	exports['properties/properties0'] = (get, $t) => 
			`<div class='center'> <div class='` +
			$t.clean(get("key") ? "property-container close" : "") +
			`' radio-id='` +
			$t.clean(get("radioId")) +
			`' ` +
			$t.clean(get("noChildren")() ? 'hidden' : '') +
			`> <div class='` +
			$t.clean(get("key") ? "expand-header" : "") +
			`'> ` +
			$t.clean(get("label")) +
			` </div> <div` +
			$t.clean(get("key") ? ' hidden' : '') +
			`> <div` +
			$t.clean(get("branch") ? ' hidden' : '') +
			`> <div id='config-expand-list-` +
			$t.clean(get("id")) +
			`'></div> ` +
			$t.clean( new $t('1927703609').render(get("groups"), 'key, group', get)) +
			` </div> </div> </div> </div> `
	
	exports['properties/property-menu'] = (get, $t) => 
			` <div class='inline-flex chev-dropdown-toggle'> Property Menu <i class='down gg-chevron-down hidden' ></i> <i class='right gg-chevron-right'></i> </div> <div class='tab chev-dropdown' hidden> <div class='cabinet-style-selector-cnt'>` +
			$t.clean(get("styleSelector")(get("group"))) +
			`</div> <input class='measurement-input' name='crownHeight' decimal='` +
			$t.clean(get("group").crown.height()) +
			`'> </div> <br/><br/> `
	
	exports['properties/radio'] = (get, $t) => 
			`<div class='center'> <label>` +
			$t.clean(get("key")) +
			`:&nbsp;&nbsp;&nbsp;&nbsp;</label> ` +
			$t.clean( new $t('1410278299').render(get("values"), 'property', get)) +
			` </div> `
	
	exports['order-redirect'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <title>` +
			$t.clean(get("order").name()) +
			`</title> <data hidden>` +
			$t.clean(get("JSON").stringify(get("order").toJson())) +
			`</data> <script> let stop = false; let urlElem, countdownElem, buttonElem; function postOrder() { const xhr = new XMLHttpRequest(); const url = urlElem.value; const body = 'heyoooo'; xhr.open('post', url, true); xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); xhr.setRequestHeader('Access-Control-Allow-Origin', '*'); xhr.setRequestHeader('Content-Type', 'application/json'); xhr.onreadystatechange = function () { if (this.readyState != 4) return; if (this.status == 200) { console.log('success'); } else { console.error('failure'); } } xhr.send(JSON.stringify(body)); return xhr; } window.addEventListener('click', () => { stop = true; urlElem.parentElement.hidden = false; countdownElem.parentElement.hidden = true; }); let count = 15; const countdown = () => { if (count === 0) return postOrder(); if (!stop) { countdownElem.innerText = count--; setTimeout(countdown, 1000); } } window.onload = () => { urlElem = document.getElementById('url-input'); countdownElem = document.getElementById('load-countdown'); buttonElem = document.getElementById('load-btn'); buttonElem.addEventListener('click', postOrder); countdown(); } </script> </head> <body> <div> <h3> Loading '` +
			$t.clean(get("order").name()) +
			`' using url: ` +
			$t.clean(get("url")) +
			` </h3> <h3 id='load-countdown'></h3> <h4> Click anywhare to stop/change url</h4> </div> <div hidden> <input id='url-input' type="text" name="url" value="` +
			$t.clean(get("url")) +
			`"> <button id='load-btn'>Load</button> </div> </body> </html> `
	
	exports['properties/unit'] = (get, $t) => 
			`<div> <label>Imperial inch (US)</label> <input type='radio' name='unit' ` +
			$t.clean(get("unit").value() === 'inch' ? 'checked' : '') +
			` value='inch'> <label>cm</label> <input type='radio' name='unit' ` +
			$t.clean(get("unit").value() === 'cm' ? 'checked' : '') +
			` value='cm'> </div> `
	
	exports['room/body'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('714657883').render(get("room").groups, 'group', get)) +
			` <div> <button class='group-add-btn' room-id='` +
			$t.clean(get("room").id()) +
			`'>Add Group</button> </div> </div> `
	
	exports['room/head'] = (get, $t) => 
			`<b>` +
			$t.clean(get("room").name()) +
			`</b> `
	
	exports['sections/divider'] = (get, $t) => 
			`<h2>Divider: ` +
			$t.clean(get("list").activeKey()) +
			`</h2> <div class='section-feature-ctn'> ` +
			$t.clean(get("featureDisplay")) +
			` </div> `
	
	exports['sections/door'] = (get, $t) => 
			`<div> ` +
			$t.clean(get("Features").opening(get("section"))) +
			` ` +
			$t.clean(get("Features").pulls(get("section").door())) +
			` </div> `
	
	exports['sections/drawer'] = (get, $t) => 
			`<div class='section-feature-ctn'> ` +
			$t.clean(get("Features").pulls(get("section").front())) +
			` </div> `
	
	exports['sections/dual-door'] = (get, $t) => 
			`<div class='section-feature-ctn'> ` +
			$t.clean(get("Features").opening(get("section"))) +
			` ` +
			$t.clean(get("Features").pulls(get("section").left(), 'Left')) +
			` ` +
			$t.clean(get("Features").pulls(get("section").right(), 'Right')) +
			` </div> `
	
	exports['sections/false-front'] = (get, $t) => 
			`<div class='section-feature-ctn'> ` +
			$t.clean(get("Features").pulls(get("section").front())) +
			` </div> `
	
	exports['sections/helpers/opening'] = (get, $t) => 
			`<div class='opening-feature-cnt' section-id='` +
			$t.clean(get("section").id()) +
			`'> <label>Shelves</label> <input type='number' name='shelveCount' step='1' min='0' max='10' value='` +
			$t.clean(get("shelveCount")) +
			`'> </div> `
	
	exports['sections/helpers/pulls'] = (get, $t) => 
			`<div class='pulls-mod-cnt' has-pulls-id='` +
			$t.clean(get("hasPulls").id()) +
			`' prefix=` +
			$t.clean(get("prefix")) +
			`> <div class='inline-flex chev-dropdown-toggle'> ` +
			$t.clean(get("prefix")) +
			` Pulls <i class='down gg-chevron-down ` +
			$t.clean(get("open") ? '' : 'hidden') +
			`'></i> <i class='right gg-chevron-right ` +
			$t.clean(!get("open") ? '' : 'hidden') +
			`'></i> </div> <div class='tab chev-dropdown' ` +
			$t.clean(get("open") ? '' : 'hidden') +
			`> ` +
			$t.clean( new $t('1970100821').render(get("hasPulls").pulls(), 'pull', get)) +
			` <button type="button" class="add-pull">Add Pull</button> </div> </div> `
	
	exports['sections/open'] = (get, $t) => 
			`<div class='open-section-feature-ctn'> ` +
			$t.clean(get("Features").opening(get("section"))) +
			` </div> `
	
	exports['static-page'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <link rel="stylesheet" href="/styles/icons.css"> <link rel="stylesheet" href="/cabinet/styles/estimate.css"> <title>` +
			$t.clean(get("title")) +
			`</title> </head> <body> ` +
			$t.clean( new $t(`` +
			$t.clean(get("file")) +
			``).render(get("scope"), undefined, get)) +
			` </body> </html> `
	
	exports['three-view'] = (get, $t) => 
			`<div class='three-view-cnt' id='` +
			$t.clean(get("id")()) +
			`'> <div class='three-view-three-d-cnt'> <div class='inline left'> <div class='orientation-controls' id='three-d-orientation-controls'></div> <span id="model-controller"></span> </div> </div> <div class='three-view-two-d-cnt'> <div class='three-view-canvases-cnt' id='` +
			$t.clean(get("id")()) +
			`-cnt'> <div class='inline-flex'> <div class='part-input-cnt center-vert'> <label>Side:</label> <label>Right</label> <input type="radio" name="side" value="right" ` +
			$t.clean(get("side")() === 'right' ? 'checked' : '') +
			`> <label>Left</label> <input type="radio" name="side" value="left" ` +
			$t.clean(get("side")() === 'left' ? 'checked' : '') +
			`> <br> <input type="text" name="partSelector" list='part-list'> <datalist id='part-list'></datalist> <br> <div class='center-vert'>Part Code: <b id='three-view-part-code-` +
			$t.clean(get("id")()) +
			`'></b></div> <button class='ruler'> <i class="gg-ruler"></i> </button> </div> <span class='three-view-canvas-cnt'> <b>Three View Drawing</b> <button class='three-view-draw-string-btn'>Copy Draw String</button> <canvas id="three-view" width="` +
			$t.clean(get("maxDem")()) +
			`" height="` +
			$t.clean(get("maxDem")()) +
			`"></canvas> </span> </div> <div class='part-info-cnt'>P INF CNT</div> </div> </div> </div> `
	
	exports['managers/template/openings/points'] = (get, $t) => 
			`<table> <tr> <td` +
			$t.clean(get("target")(4) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").outer[0])) +
			`</td> <td></td> <td></td> <td` +
			$t.clean(get("target")(5) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").outer[1])) +
			`</td> </tr> <tr> <td></td> <td` +
			$t.clean(get("target")(0) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").inner[0])) +
			`</td> <td` +
			$t.clean(get("target")(1) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").inner[1])) +
			`</td> <td></td> </tr> <tr> <td></td> <td` +
			$t.clean(get("target")(3) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").inner[3])) +
			`</td> <td` +
			$t.clean(get("target")(2) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").inner[2])) +
			`</td> <td></td> </tr> <tr> <td` +
			$t.clean(get("target")(7) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").outer[3])) +
			`</td> <td></td> <td></td> <td` +
			$t.clean(get("target")(6) ? ' class="bold"' : '') +
			`>` +
			$t.clean(get("display")(get("coords").outer[2])) +
			`</td> </tr> </table> `
	
	exports['managers/template/subassemblies/body'] = (get, $t) => 
			`<div template-attr='subassembles'> <div class='center'> <label>All</label> <input class='template-include' type='radio' name='is-` +
			$t.clean(get("obj").id) +
			`' value='All' ` +
			$t.clean(get("obj").include === 'All' ? 'checked' : '') +
			`> <label>Overlay</label> <input class='template-include' type='radio' name='is-` +
			$t.clean(get("obj").id) +
			`' value='Overlay' ` +
			$t.clean(get("obj").include === 'Overlay' ? 'checked' : '') +
			`> <label>Reveal</label> <input class='template-include' type='radio' name='is-` +
			$t.clean(get("obj").id) +
			`' value='Reveal' ` +
			$t.clean(get("obj").include === 'Reveal' ? 'checked' : '') +
			`> <label>Inset</label> <input class='template-include' type='radio' name='is-` +
			$t.clean(get("obj").id) +
			`' value='Inset' ` +
			$t.clean(get("obj").include === 'Inset' ? 'checked' : '') +
			`> </div> <label>Name</label> <input class='template-input' attr='subassemblies' name="name" value="` +
			$t.clean(get("obj").name) +
			`"> <div> ` +
			$t.clean(get("dividerTypeSelect") && get("dividerTypeSelect").html()) +
			` </div> <div> <div class='center'> <label><b>Position:</b></label> <label>Box</label> <input type='radio' name='positionMethod-` +
			$t.clean(get("obj").id) +
			`' value='box' ` +
			$t.clean(get("obj").positionMethod !== 'poly' ? 'checked' : '') +
			`> <label>Poly</label> <input type='radio' name='positionMethod-` +
			$t.clean(get("obj").id) +
			`' value='poly' ` +
			$t.clean(get("obj").positionMethod === 'poly' ? 'checked' : '') +
			`> </div> <div class='poly-input-cnt' ` +
			$t.clean(get("obj").positionMethod !== 'poly' ? 'hidden' : '') +
			`> ` +
			$t.clean(get("polyHtml")) +
			` </div> <div class='box-input-cnt' ` +
			$t.clean(get("obj").positionMethod === 'poly' ? 'hidden' : '') +
			`> ` +
			$t.clean(get("referenceSelect").html()) +
			` <select name='type' hidden> <option>All</option> <option>Center</option> <option>Demension</option> <option>Rotation</option> </select> <select name='axis' hidden> <option>All</option> <option>X</option> <option>Y</option> <option>Z</option> </select> <button class='template-reference-update-btn' hidden>Change</button> <br> <div class='sub-demensions-cnt inline-flex'> ` +
			$t.clean(get("demensionXyzSelect").html()) +
			` <input class='template-input xyz' attr='subassemblies' name='demensions' value='` +
			$t.clean(get("getEqn")(get("demensionXyzSelect"), get("obj").demensions)) +
			`'> <input disabled class='measurement-input' name='value'> <input type="checkbox" name="convert" checked> </div> <br> <div class='sub-center-cnt inline-flex'> ` +
			$t.clean(get("centerXyzSelect").html()) +
			` <input class='template-input xyz' attr='subassemblies' name='center' value='` +
			$t.clean(get("getEqn")(get("centerXyzSelect"), get("obj").center)) +
			`'> <input disabled class='measurement-input' name='value'> <input type="checkbox" name="convert" checked> </div> <br> </div> <div class='subassem-normal-cnt center'> <label><b>Normals:</b></label> <label>Rotation</label> <input type='radio' name='normalStyle-` +
			$t.clean(get("obj").id) +
			`' value='rotation' ` +
			$t.clean(!get("obj").normalInfo || get("obj").normalInfo.style !== 'rotation' ? 'checked' : '') +
			`> <label>Vector</label> <input type='radio' name='normalStyle-` +
			$t.clean(get("obj").id) +
			`' value='vector' ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.style === 'vector' ? 'checked' : '') +
			`> <label>Line</label> <input type='radio' name='normalStyle-` +
			$t.clean(get("obj").id) +
			`' value='line' ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.style === 'line' ? 'checked' : '') +
			`> <div class='rotation-normal-cnt tab' ` +
			$t.clean(!get("obj").normalInfo || get("obj").normalInfo.style === 'rotation' ? '' : 'hidden') +
			`> <div class='sub-center-cnt inline-flex'> ` +
			$t.clean(get("rotationXyzSelect").html()) +
			` <input class='template-input xyz' attr='subassemblies' name='rotation' value='` +
			$t.clean(get("getEqn")(get("rotationXyzSelect"), get("obj").rotation)) +
			`'> <input disabled class='measurement-input' name='value'> </div> </div> <div class='vector-normal-cnt tab' ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.style === 'vector' ? '' : 'hidden') +
			`> ` +
			$t.clean( new $t('managers/template/subassemblies/object/normals').render(get("scope"), undefined, get)) +
			` </div> <div class='line-normal-cnt tab' ` +
			$t.clean(get("obj").normalInfo && get("obj").normalInfo.style === 'line' ? '' : 'hidden') +
			`> ` +
			$t.clean( new $t('managers/template/subassemblies/object/lines').render(get("scope"), undefined, get)) +
			` </div> </div> <div> ` +
			$t.clean(get("typeSpecificHtml")) +
			` </div> </div> `
	
});


try {window.onload = () => RequireJS.init('./public/js/utils/test/tests/STL.js')}
              catch {RequireJS.init('./public/js/utils/test/tests/STL.js')}
