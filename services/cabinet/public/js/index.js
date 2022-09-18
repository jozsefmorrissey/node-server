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
          console.log(reqReg)
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
                console.log(this.dir(), '->', refMap.absPath())
                const relitivePath = await MapScript.toRelitivePath(refMap.absPath(), this.dir());
                requireStr += `const ${formattedRef} = require('${relitivePath}')`;
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
  console.log('nameslen', names.length);
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

MapScript.toRelitivePath = async function (path, dir) {
  const cmd = `realpath --relative-to='${dir}' '${path}'`;
  const promise = new Promise((resolve) => {
    function resolver(data) {
      const relPath = MapScript.simplifyPath(`${data.trim()}`);
      resolve(relPath);
    }
    const child = shell.exec(cmd, {async: true});
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
      const fileName = wrongPath.replace(nameReg, '$2');
      Object.keys(scripts).forEach((path) => {
        const name = path.replace(nameReg, '$2');
        if (name === fileName) guesses.push(determinRelitivePath(currFile, path));
      });
      return guesses;
    }

    function determinRelitivePath(from, to) {
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
      const relPathArr = backPages === 0  ? `./${to.slice(to.length - 1)}` :
                          new Array(backPages).fill('..').concat(to.slice(index)).join('/');
      return relPathArr;
    }

    function requireWrapper (absDir, relitivePath, filePath) {
      relitivePath = MapScript.simplifyPath(relitivePath);
      const path = MapScript.simplifyPath(`${absDir}${relitivePath}`);
      if (scripts[path] instanceof Unloaded) {
        scripts[path] = scripts[path].load();
      }
      if (scripts[path] === undefined) console.warn(`Trying to load a none exisant js file
\t'${relitivePath}' from file '${filePath}'
\t\tDid you mean:\n\t\t\t${guessFilePath(relitivePath, filePath).join('\n\t\t\t')}`);
      return scripts[path];
    }

    function requireFunc (absoluteDir, filePath) {
      return (relitivePath) => requireWrapper(absoluteDir, relitivePath, filePath);
    }

    const loadPath = [];
    class Unloaded {
      constructor(path, func) {
        const absoluteDir = MapScript.simplifyPath(path).replace(/(.*\/).*/, '$1');
        const modulee = {exports: {}};
        this.load = () => {
          if (loadPath.indexOf(path) !== -1) throw Error(`Circular Reference: \n\t\t${loadPath.join('\n\t\t')}`);
          loadPath.push(path);
          // console.log('loading: ', path);
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
      return `window.onload = () => RequireJS.init('${main}')\n`;
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
          pathCache[absolutePath] = await MapScript.toRelitivePath(absolutePath, projectDir);
        }
        const body = await resolveBody(script);
        const encaps = `RequireJS.addFunction('${pathCache[absolutePath]}',
function (require, exports, module) {
${body.replace(/(^|\n)/g, '\n\t').substr(1)}
});\n\n\n`;
        resolve(encaps);

        if (guess && startTime + 10000 < new Date().getTime()) {
          console.log('writinggggg...')
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



RequireJS.addFunction('./globals/CONSTANTS.js',
function (require, exports, module) {
	

	
	const Door = require('../app-src/objects/assembly/assemblies/door/door.js');
	
	const APP_ID = 'cabinet-builder';
	
	
	const PULL_TYPE = {
	  DRAWER: 'Drawer',
	  DOOR: 'Door'
	};
	
	exports.VIEWER = {height: 600, width: 600}
	exports.APP_ID = APP_ID
	exports.PULL_TYPE = PULL_TYPE
	
});


RequireJS.addFunction('./public/json/endpoints.json',
function (require, exports, module) {
	module.exports = {
	  "_envs": {
	    "local": "http://localhost:3000/cabinet",
	    "dev": "https://dev.jozsefmorrissey.com/cabinet",
	    "prod": "https://node.jozsefmorrissey.com/cabinet"
	  },
	  "user": {
	    "register": "/register",
	    "resendActivation": "/resend/activation",
	    "activate": "/activate/:email/:secret",
	    "validate": "/validate",
	    "login": "/login",
	    "status": "/status",
	    "resetPasswordRequest": "/reset/password/request",
	    "resetPassword": "/reset/password/:email/:secret"
	  },
	  "cabinet": {
	    "add": "/:id",
	    "list": "/all"
	  },
	  "config": {
	    "get": "/config/get",
	    "save": "/config/save"
	  },
	  "costs": {
	    "save": "/costs/save",
	    "get": "/costs/get"
	  },
	  "configuration": {
	    "save": "/configuration/save",
	    "get": "/configuration/get"
	  },
	  "patterns": {
	    "save": "/patterns/save",
	    "get": "/patterns/get"
	  },
	  "properties": {
	    "save": "/properties/save",
	    "get": "/properties/get"
	  },
	  "templates": {
	    "save": "/templates/save",
	    "get": "/templates/get"
	  },
	  "order": {
	    "add": "/order/:id",
	    "get": "/order/:id",
	    "list": "/list/orders"
	  },
	  "export": {
	    "dxf": "/export/dxf"
	  }
	};
});


RequireJS.addFunction('./generated/EPNTS.js',
function (require, exports, module) {
	const Endpoints = require('../../../public/js/utils/endpoints.js');
	const json = require('../public/json/endpoints.json');
	module.exports = new Endpoints(json, 'local').getFuncObj();
});


RequireJS.addFunction('./public/js/3d-modeling/lightgl.js',
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
	  gl.rotate = function(a, x, y, z) {
	    gl.multMatrix(Matrix.rotate(a, x, y, z, tempMatrix));
	  };
	  gl.lookAt = function(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
	    gl.multMatrix(Matrix.lookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz, tempMatrix));
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


RequireJS.addFunction('./public/js/3d-modeling/csg.js',
function (require, exports, module) {
	

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
	
	const CSG = function() {
	  this.polygons = [];
	};
	
	// Construct a CSG solid from a list of `CSG.Polygon` instances.
	CSG.fromPolygons = function(polygons) {
	  var csg = new CSG();
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
	    csg.polygons = this.polygons.map(function(p) { return p.clone(); });
	    return csg;
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
	    function cleanPolygons(polys) {
	      const vertexMap = {};
	      const polyMap = {};
	      for (let index = 0; index < polys.length; index += 1) {
	        const wrongList = [];
	        const poly = polys[index];
	        const connected = {};
	        let added = false;
	        for (let vIndex = 0; vIndex < poly.vertices.length; vIndex += 1) {
	          const vertex = poly.vertices[vIndex];
	          const vKey = vertex.toString();
	          if (vertexMap[vKey]) {
	            const key = vertexMap[vKey].key;
	            let obj = vertexMap[vKey];
	            if (vKey === '(50.8,0,0)') {
	              console.log('badKey')
	            }
	            if (!added) {
	              obj.list.push(poly);
	              added = key;
	            }
	            if (added !== vertexMap[vKey].key){
	              wrongList.push(obj);
	            }
	            connected[key] = obj;
	          } else {
	            let obj = {vertex};
	            vertexMap[vKey] = obj;
	            wrongList.push(obj);
	          }
	        }
	        let obj = {};
	        const connKeys = Object.keys(connected);
	        if (connKeys.length === 0) {
	          obj.list = [poly];
	          obj.key = String.random();
	          polyMap[obj.key] = obj;
	        } else {
	          obj = connected[connKeys[0]];
	          for (let index = 1; index < connKeys.length; index += 1) {
	            const connKey = connKeys[index];
	            const otherObj = connected[connKey];
	            if (connKey !== obj.key) delete polyMap[otherObj.key];
	            else
	              console.log('wtf');
	            otherObj.key = obj.key;
	            otherObj.connected = true;
	            obj.list.concatInPlace(otherObj.list);
	            polyMap[obj.key] = obj;
	            otherObj.list = obj.list;
	          }
	        }
	        for (let wIndex = 0; wIndex < wrongList.length; wIndex += 1) {
	          const wrongObj = wrongList[wIndex];
	          wrongObj.list = obj.list;
	          wrongObj.key = obj.key;
	        }
	      }
	      const polylists = Object.values(polyMap);
	      if (polylists.length === 0) return [];
	      let biggest = polylists[0].list;
	      for (let index = 1; index < polylists.length; index += 1)
	        if (biggest.length < polylists[index].list.length) biggest = polylists[index].list;
	      return biggest;
	    }
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
	
	  rotate: function (rotations) {
	    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
	      let newPos = ArbitraryRotate(vertex.pos, rotations.x, {x: 1, y:0, z:0});
	      newPos = ArbitraryRotate(newPos, rotations.y, {x: 0, y:1, z:0});
	      newPos = ArbitraryRotate(newPos, rotations.z, {x: 0, y:0, z:1});
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
	    const offset = {
	      x: newCenter.x - center.x,
	      y: newCenter.y - center.y,
	      z: newCenter.z - center.z
	    }
	    this.translate(offset);
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
	
	// # class Vector
	
	// Represents a 3D vector.
	//
	// Example usage:
	//
	//     new CSG.Vector(1, 2, 3);
	//     new CSG.Vector([1, 2, 3]);
	//     new CSG.Vector({ x: 1, y: 2, z: 3 });
	
	CSG.Vector = function(x, y, z) {
	  function approximate(value, acc) {
	    acc ||= 1000000;
	    return Math.round(value * acc) / acc;
	  }
	  if (arguments.length == 3) {
	    this.x = approximate(x);
	    this.y = approximate(y);
	    this.z = approximate(z);
	  } else if ('x' in x) {
	    this.x = approximate(x.x);
	    this.y = approximate(x.y);
	    this.z = approximate(x.z);
	  } else {
	    this.x = approximate(x[0]);
	    this.y = approximate(x[1]);
	    this.z = approximate(x[2]);
	  }
	};
	
	CSG.percision = 1000;
	
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
	
	  cross: function(a) {
	    return new CSG.Vector(
	      this.y * a.z - this.z * a.y,
	      this.z * a.x - this.x * a.z,
	      this.x * a.y - this.y * a.x
	    );
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
	
	};
	
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
	CSG.Plane.EPSILON = 1e-5;
	
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
	  }
	};
	
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
	
	function round(value, percision) {
	  const multiplier = Math.pow(10, percision);
	  return Math.round(value * multiplier, 5) / multiplier;
	}
	
	/*
	   Rotate a point p by angle theta around an arbitrary axis r
	   Return the rotated point.
	   Positive angles are anticlockwise looking down the axis
	   towards the origin.
	   Assume right hand coordinate system.
	*/
	function ArbitraryRotate(point, degreestheta, radius)
	{
	  theta = degreestheta * Math.PI/180;
	  let p = point;
	  let r = radius;
	   let q = {x: 0.0, y: 0.0, z: 0.0};
	   let costheta,sintheta;
	
	   const Normalise = (obj, attr) => obj[attr] *= obj[attr] > 0 ? 1 : -1;
	   Normalise(r, 'x',);
	   Normalise(r, 'y',);
	   Normalise(r, 'z',);
	
	   costheta = Math.cos(theta);
	   sintheta = Math.sin(theta);
	
	   q.x += (costheta + (1 - costheta) * r.x * r.x) * p.x;
	   q.x += ((1 - costheta) * r.x * r.y - r.z * sintheta) * p.y;
	   q.x += ((1 - costheta) * r.x * r.z + r.y * sintheta) * p.z;
	   q.x = round(q.x, 10);
	
	   q.y += ((1 - costheta) * r.x * r.y + r.z * sintheta) * p.x;
	   q.y += (costheta + (1 - costheta) * r.y * r.y) * p.y;
	   q.y += ((1 - costheta) * r.y * r.z - r.x * sintheta) * p.z;
	   q.y = round(q.y, 10);
	
	   q.z += ((1 - costheta) * r.x * r.z - r.y * sintheta) * p.x;
	   q.z += ((1 - costheta) * r.y * r.z + r.x * sintheta) * p.y;
	   q.z += (costheta + (1 - costheta) * r.z * r.z) * p.z;
	   q.z = round(q.z, 10);
	
	   return(q);
	}
	
	module.exports = CSG;
	
});


RequireJS.addFunction('./public/js/3d-modeling/export-dxf.js',
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


RequireJS.addFunction('./public/js/3d-modeling/viewer.js',
function (require, exports, module) {
	

	
	const du = require('../../../../../public/js/utils/dom-utils.js');
	const CSG = require('./csg.js');
	const GL = require('./lightgl.js');
	
	// Set the color of all polygons in this solid
	CSG.prototype.setColor = function(r, g, b) {
	  this.toPolygons().map(function(polygon) {
	    if (Array.isArray(r)) {
	      g = r[1];
	      b = r[2];
	      r = r[0];
	    }
	    polygon.shared = [r/255, g/255, b/255];
	  });
	};
	
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
	var viewers = [];
	
	// Set to true so lines don't use the depth buffer
	Viewer.lineOverlay = false;
	
	// A viewer is a WebGL canvas that lets the user view a mesh. The user can
	// tumble it around by dragging the mouse.
	function Viewer(csg, width, height, depth) {
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
	  gl.perspective(100, width / height, 0.1, 1000);
	  gl.matrixMode(gl.MODELVIEW);
	
	  // Set up WebGL state
	  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	  gl.clearColor(0.93, 0.93, 0.93, 1);
	  gl.enable(gl.DEPTH_TEST);
	  gl.enable(gl.CULL_FACE);
	  gl.polygonOffset(1, 1);
	
	  // Black shader for wireframe
	  this.blackShader = new GL.Shader('\
	    void main() {\
	      gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
	    }\
	  ', '\
	    void main() {\
	      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\
	    }\
	  ');
	
	  // Shader with diffuse and specular lighting
	  this.lightingShader = new GL.Shader('\
	    varying vec3 color;\
	    varying vec3 normal;\
	    varying vec3 light;\
	    void main() {\
	      const vec3 lightDir = vec3(3.0, 2.0, 3.0) / 3.741657386773941;\
	      light = (gl_ModelViewMatrix * vec4(lightDir, 0.005)).xyz;\
	      color = gl_Color.rgb;\
	      normal = gl_NormalMatrix * gl_Normal;\
	      gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
	    }\
	  ', '\
	    varying vec3 color;\
	    varying vec3 normal;\
	    varying vec3 light;\
	    void main() {\
	      vec3 n = normalize(normal);\
	      float diffuse = max(0.0, dot(light, n));\
	      float specular = pow(max(0.0, -reflect(light, n).z), 32.0) * sqrt(diffuse);\
	      gl_FragColor = vec4(mix(color * (0.3 + 0.7 * diffuse), vec3(1.0), specular), 1.0);\
	    }\
	  ');
	
	  function rotateEvent(e) {
	    angleY += e.deltaX * 2;
	    angleX += e.deltaY * 2;
	    angleX = Math.max(-90, Math.min(90, angleX));
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
	    pan(e.deltaX, e.deltaY)
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
	
	  var that = this;
	  gl.ondraw = function() {
	    gl.makeCurrent();
	
	    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	    gl.loadIdentity();
	    gl.translate(x, y, -depth);
	    gl.rotate(angleX, 1, 0, 0);
	    gl.rotate(angleY, 0, 1, 0);
	
	    if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
	    that.lightingShader.draw(that.mesh, gl.TRIANGLES);
	    if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);
	
	    if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
	    gl.enable(gl.BLEND);
	    // that.blackShader.draw(that.mesh, gl.LINES);
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


RequireJS.addFunction('../../public/js/utils/measurement.js',
function (require, exports, module) {
	
  try {
	    Lookup = require('./object/lookup');
	    StringMathEvaluator = require('./string-math-evaluator');
	  } catch(e) {}
	
	
	function regexToObject (str, reg) {
	  const match = str.match(reg);
	  if (match === null) return null;
	  const returnVal = {};
	  for (let index = 2; index < arguments.length; index += 1) {
	    const attr = arguments[index];
	    if (attr) returnVal[attr] = match[index - 1];
	  }
	  return returnVal;
	}
	
	let units = [
	  'Metric',
	  'Imperial (US)'
	]
	let unit = units[1];
	
	
	class Measurement extends Lookup {
	  constructor(value, notMetric) {
	    super();
	    if ((typeof value) === 'string') {
	      value += ' '; // Hacky fix for regularExpression
	    }
	
	    const determineUnit = () => {
	      if ((typeof notMetric === 'string')) {
	        const index = units.indexOf(notMetric);
	        if (index !== -1) return units[index];
	      } else if ((typeof notMetric) === 'boolean') {
	        if (notMetric === true) return unit;
	      }
	      return units[0];
	    }
	
	    let decimal = 0;
	    let nan = value === null || value === undefined;
	    this.isNaN = () => nan;
	
	    const parseFraction = (str) => {
	      const regObj = regexToObject(str, Measurement.regex, null, 'integer', null, 'numerator', 'denominator');
	      regObj.integer = Number.parseInt(regObj.integer) || 0;
	      regObj.numerator = Number.parseInt(regObj.numerator) || 0;
	      regObj.denominator = Number.parseInt(regObj.denominator) || 0;
	      if(regObj.denominator === 0) {
	        regObj.numerator = 0;
	        regObj.denominator = 1;
	      }
	      regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
	      return regObj;
	    };
	
	    function reduce(numerator, denominator) {
	      let reduced = true;
	      while (reduced) {
	        reduced = false;
	        for (let index = 0; index < Measurement.primes.length; index += 1) {
	          const prime = Measurement.primes[index];
	          if (prime >= denominator) break;
	          if (numerator % prime === 0 && denominator % prime === 0) {
	            numerator = numerator / prime;
	            denominator = denominator / prime;
	            reduced = true;
	            break;
	          }
	        }
	      }
	      if (numerator === 0) {
	        return '';
	      }
	      return ` ${numerator}/${denominator}`;
	    }
	
	    function fractionEquivalent(decimalValue, accuracy) {
	      accuracy = accuracy || '1/32'
	      const fracObj = parseFraction(accuracy);
	      const denominator = fracObj.denominator;
	      if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
	        throw new Error('Please enter a fraction with a denominator between (0, 1000]')
	      }
	      let sign = decimalValue > 0 ? 1 : -1;
	      let remainder = Math.abs(decimalValue);
	      let currRemainder = remainder;
	      let value = 0;
	      let numerator = 0;
	      while (currRemainder > 0) {
	        numerator += fracObj.numerator;
	        currRemainder -= fracObj.decimal;
	      }
	      const diff1 = decimalValue - ((numerator - fracObj.numerator) / denominator);
	      const diff2 = (numerator / denominator) - decimalValue;
	      numerator -= diff1 < diff2 ? fracObj.numerator : 0;
	      const integer = sign * Math.floor(numerator / denominator);
	      numerator = numerator % denominator;
	      return {integer, numerator, denominator};
	    }
	
	    this.fraction = (accuracy, standardDecimal) => {
	      standardDecimal = standardDecimal || decimal;
	      if (nan) return NaN;
	      const obj = fractionEquivalent(standardDecimal, accuracy);
	      if (obj.integer === 0 && obj.numerator === 0) return '0';
	      const integer = obj.integer !== 0 ? obj.integer : '';
	      return `${integer}${reduce(obj.numerator, obj.denominator)}`;
	    }
	    this.standardUS = (accuracy) => this.fraction(accuracy, convertMetricToUs(decimal));
	
	    this.display = (accuracy) => {
	      switch (unit) {
	        case units[0]: return new String(this.decimal(10));
	        case units[1]: return this.standardUS(accuracy);
	        default:
	            return this.standardUS(accuracy);
	      }
	    }
	
	    this.value = (accuracy) => this.decimal(accuracy);
	
	    this.decimal = (accuracy) => {
	      if (nan) return NaN;
	      accuracy = accuracy % 10 ? accuracy : 10000;
	      return Math.round(decimal * accuracy) / accuracy;
	    }
	
	    function getDecimalEquivalant(string) {
	      string = string.trim();
	      if (string.match(Measurement.decimalReg)) {
	        return Number.parseFloat(string);
	      } else if (string.match(StringMathEvaluator.fractionOrMixedNumberReg)) {
	        return parseFraction(string).decimal
	      }
	      nan = true;
	      return NaN;
	    }
	
	    const convertMetricToUs = (standardDecimal) =>  standardDecimal / 2.54;
	    const convertUsToMetric = (standardDecimal) => value = standardDecimal * 2.54;
	
	    function standardize(ambiguousDecimal) {
	      switch (determineUnit()) {
	        case units[0]:
	          return ambiguousDecimal;
	        case units[1]:
	          return convertUsToMetric(ambiguousDecimal);
	        default:
	          throw new Error('This should not happen, Measurement.unit should be the gate keeper that prevents invalid units from being set');
	      }
	    }
	
	    if ((typeof value) === 'number') {
	      decimal = standardize(value);
	    } else if ((typeof value) === 'string') {
	      try {
	        const ambiguousDecimal = getDecimalEquivalant(value);
	        decimal = standardize(ambiguousDecimal);
	      } catch (e) {
	        nan = true;
	      }
	    } else {
	      nan = true;
	    }
	  }
	}
	
	Measurement.unit = (newUnit) => {
	  for (index = 0; index < units.length; index += 1) {
	    if (newUnit === units[index]) unit = newUnit;
	  }
	  return unit
	};
	Measurement.units = () => JSON.parse(JSON.stringify(units));
	Measurement.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
	Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;
	Measurement.decimalReg = /(^(-|)[0-9]*(\.|$|^)[0-9]*)$/;
	
	
	Measurement.validation = function (range) {
	  const obj = regexToObject(range, Measurement.rangeRegex, 'minBound', 'min', 'max', 'maxBound');
	  let min = obj.min.trim() !== '' ?
	        new Measurement(obj.min).decimal() : Number.MIN_SAFE_INTEGER;
	  let max = obj.max.trim() !== '' ?
	        new Measurement(obj.max).decimal() : Number.MAX_SAFE_INTEGER;
	  const minCheck = obj.minBound === '(' ? ((val) => val > min) : ((val) => val >= min);
	  const maxCheck = obj.maxBound === ')' ? ((val) => val < max) : ((val) => val <= max);
	  return function (value) {
	    const decimal = new Measurement(value).decimal();
	    if (decimal === NaN) return false;
	    return minCheck(decimal) && maxCheck(decimal);
	  }
	}
	
	Measurement.decimal = (value) => {
	  return new Measurement(value, true).decimal();
	}
	
	Measurement.round = (value, percision) => {
	  if (percision)
	  return new Measurement(value).decimal(percision);
	  return Math.round(value * 10000000) / 10000000;
	}
	
	try {
	  module.exports = Measurement;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/approximate.js',
function (require, exports, module) {
	

	function approximate(value, acc) {
	  acc ||= approximate.accuracy || 1000;
	  return Math.round(value * acc) / acc;
	}
	
	approximate.accuracy = 10000000000;
	approximate.eq = (val1, val2, acc) => approximate(val1, acc) === approximate(val2, acc);
	approximate.neq = (val1, val2, acc) => approximate(val1, acc) !== approximate(val2, acc);
	approximate.gt = (val1, val2, acc) => approximate(val1, acc) > approximate(val2, acc);
	approximate.lt = (val1, val2, acc) => approximate(val1, acc) < approximate(val2, acc);
	approximate.gteq = (val1, val2, acc) => approximate(val1, acc) >= approximate(val2, acc);
	approximate.lteq = (val1, val2, acc) => approximate(val1, acc) <= approximate(val2, acc);
	
	module.exports  = approximate;
	
});


RequireJS.addFunction('../../public/js/utils/decision-tree.js',
function (require, exports, module) {
	

	const Lookup = require('./object/lookup')
	const REMOVAL_PASSWORD = String.random();
	
	// terminology
	// name - String to define state;
	// payload - data returned for a given state
	//             - @_UNIQUE_NAME_GROUP - An Identifier used to insure all nodes of multople trees have a unique name.
	//                          note: only applicable on root node. governs entire tree
	// stateObject - object defining states {name: [payload]...}
	// states - array of availible state names.
	// node - {name, states, payload, then, addState, addStates};
	// then(name) - a function to set a following state.
	// next(name) - a function to get the next state.
	// back() - a function to move back up the tree.
	// top() - a function to get root;
	// subtree(conditions, parent) - returns a subtree.
	//    @conditions - object identifying conditions for each name or _DEFAULT for undefined
	//    @parent - can be used to atach a copy to another branch or tree
	// returns all functions return current node;
	class DecisionNode extends Lookup{
	  constructor(tree, name, instancePayload, parent) {
	    super(instancePayload && instancePayload._nodeId ?
	              instancePayload._nodeId : String.random(7));
	    Object.getSet(this, 'name');
	    const stateMap = {};
	    let jump;
	    let isComplete = false; // null : requires evaluation
	    instancePayload = instancePayload || {};
	    const formatId = (nodeId) =>
	      nodeId.replace(/^decision-node-(.*)$/, '$1') || nodeId;
	    const instance = this;
	    this.nodeId = () => DecisionNode.decode(this.id()).id;
	    instancePayload._nodeId = this.nodeId();
	    tree.nodeMap[this.nodeId()];
	    // tree.nodeMap[instancePayload._nodeId] = this;
	    this.isTree = (t) => t === tree;
	    this.setValue = (key, value) => instancePayload[key] = value;
	    this.getByName = (n) => tree.stateTemplates[n];
	    this.tree = () => tree;
	    this.getNode = (nodeOid) => nodeOid instanceof DecisionNode ? nodeOid : tree.idMap[formatId(nodeOid)];
	    this.name = name.toString();
	    this.states = () => Object.values(stateMap);
	    this.instancePayload = () => instancePayload;
	    this.set = (key, value) => instancePayload[key] = value;
	    this.fromJson = undefined;
	    this.instanceCount = (n) => tree.instanceCount(n || this.name);
	    this.lastInstance = () => tree.instanceCount(this.name) === 1;
	    this.stateDefined = tree.stateDefined;
	    this.payload = () => {
	      const copy = JSON.clone(tree.stateConfigs[name]) || {};
	      Object.keys(instancePayload).forEach((key) => {
	        copy[key] = instancePayload[key];
	      });
	      return copy;
	    };
	    this.jump = (name) => {
	      if (name) jump = tree.getState(name, parent);
	      return jump;
	    };
	    this.getNodeByPath = tree.getNodeByPath;
	    this.isLeaf = () => Object.keys(stateMap).length === 0;
	    this.stateNames = () => Object.keys(stateMap);
	    this.structureChanged = () => {
	      isComplete = null;
	      if (parent) parent.structureChanged();
	    }
	    this.remove = (node, password) => {
	      if (node === undefined) {
	        tree.remove(this, REMOVAL_PASSWORD);
	        tree = undefined;
	      } else if (REMOVAL_PASSWORD !== password) {
	        throw new Error('Attempting to remove node without going through the proper process find the node object you want to remove and call node.remove()');
	      } else {
	        let removed = false;
	        Object.keys(stateMap).forEach((name) => {
	          const realNode = stateMap[name];
	          if (realNode === node) {
	            delete stateMap[name];
	            removed = true;
	          }
	        });
	      }
	    }
	
	    this.validState = (name) => name !== undefined && instance.stateNames().indexOf(name.toString()) !== -1;
	
	    function attachTree(t) {
	      return t.subtree(null, instance, tree);
	    }
	
	    this.then = (name, instancePayload, conditional) => {
	      if (name instanceof DecisionNode) return attachTree(name);
	      if (Array.isArray(name)) {
	        const returnNodes = [];
	        for (let index = 0; index < name.length; index += 1) {
	          returnNodes.push(this.then(name[index]));
	        }
	        return returnNodes;
	      }
	      this.structureChanged();
	      const newState = tree.getState(name, this, instancePayload);
	      if ((typeof conditional) === 'string') {
	        const stateId = `${this.name}:${conditional}`;
	        stateMap[stateId] = tree.getState(stateId, this, instancePayload);
	        stateMap[stateId].jump(newState);
	      } else {
	        stateMap[name] = newState;
	      }
	      if (tree.stateTemplates[name] === undefined)
	        tree.stateTemplates[name] = newState;
	      return newState === undefined ? undefined : newState.jump() || newState;
	    }
	    this.addState = (name, payload) => tree.addState(name, payload) && this;
	    this.addStates = (sts) => tree.addStates(sts) && this;
	    this.next = (name) => {
	      const state = stateMap[name];
	      return state === undefined ? undefined : state.jump() || state;
	    }
	
	    this.nameTaken = tree.nameTaken;
	
	    this.back = () => parent;
	    this.top = () => tree.rootNode;
	    this.isRoot = () => !(parent instanceof DecisionNode)
	
	    this.getRoot = () => {
	      const root = this;
	      while (!root.isRoot()) root = root.back();
	      return root;
	    }
	
	    this.copy = (t) => new DecisionNode(t || tree, this.name, instancePayload);
	
	    // Breath First Search
	    this.forEach = (func) => {
	      const stateKeys = Object.keys(stateMap);
	      func(this);
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const state = stateMap[stateKeys[index]];
	        state.forEach(func);
	      }
	    }
	
	    this.forEachChild = (func) => {
	      const stateKeys = Object.keys(stateMap);
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const state = stateMap[stateKeys[index]];
	        func(state);
	      }
	    }
	    this.children = () => {
	      const children = [];
	      this.forEachChild((child) => children.push(child));
	      return children;
	    }
	
	    this.map = (func) => {
	      const ids = [];
	      this.forEach((node) => ids.push(func(node)));
	      return ids;
	    }
	
	    this.nodes = () => {
	      return this.map((node) => node);
	    }
	
	    this.leaves = () => {
	      const leaves = [];
	      this.forEach((node) => {
	        if (node.isLeaf()) leaves.push(node);
	      });
	      return leaves;
	    }
	
	    this.addChildren = (nodeId) => {
	      const orig = this.getNode(nodeId);
	      const states = orig.states();
	      states.forEach((state) => this.then(state));
	      return this;
	    }
	
	    this.stealChildren = (nodeOid) => {
	      return this.getNode(nodeOid).addChildren(this);
	    }
	
	    this.conditionsSatisfied = tree.conditionsSatisfied;
	
	    this.change = (name) => {
	      const newNode = this.back().then(name);
	      const root = this.top();
	      newNode.stealChildren(this);
	      this.remove();
	    }
	
	    this.subtree = (conditions, parent, t) => {
	      if (parent && !parent.conditionsSatisfied(conditions, this)) return undefined
	      conditions = conditions instanceof Object ? conditions : {};
	      const stateKeys = Object.keys(stateMap);
	      let copy;
	      if (parent === undefined) copy = this.copy(t);
	      else {
	        const target = t === undefined ? parent : t;
	        const nameTaken = target.nameTaken(this.name);
	        try {
	          if (!nameTaken) target.addState(this.name, tree.stateConfigs[this.name] || {});
	        } catch (e) {
	          target.nameTaken(this.name);
	          throw e;
	        }
	        copy = parent.then(this.name, instancePayload);
	      }
	
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const state = stateMap[stateKeys[index]];
	        state.subtree(conditions, copy, t);
	      }
	      return copy;
	    }
	
	    this.nodeOnlyToJson = (noStates) => {
	      const json = {nodeId: this.nodeId(), name, states: [],
	                    payload: Object.fromJson(instancePayload)};
	      if (noStates !== true) {
	        this.states().forEach((state) =>
	          json.states.push(state.nodeOnlyToJson()));
	      }
	      return json;
	    }
	    this.toJson = (noStates) => {
	      const json = tree.toJson(this, noStates);
	      json.name = this.name;
	      json.payload = Object.fromJson(instancePayload);
	      json.nodes = this.nodeOnlyToJson(noStates);
	      return json;
	    }
	
	    this.declairedName = tree.declairedName;
	    this.toString = (tabs, attr) => {
	      tabs = tabs || 0;
	      const tab = new Array(tabs).fill('  ').join('');
	      let str = `${tab}${this.name}`;
	      str += attr ? `) ${this.payload()[attr]}\n` : '\n';
	      const stateKeys = Object.keys(stateMap);
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        str += stateMap[stateKeys[index]].toString(tabs + 1, attr);
	      }
	      return str;
	    }
	    this.attachTree = attachTree;
	    this.treeToJson = tree.toJson;
	    this.conditionsSatisfied = tree.conditionsSatisfied;
	  }
	}
	DecisionNode.DO_NOT_CLONE = true;
	DecisionNode.stateMap = {};
	
	
	class DecisionTree {
	  constructor(name, payload) {
	    let json;
	    if (name._TYPE === 'DecisionTree') {
	      json = name;
	      payload = json.payload;
	      name = json.name;
	    }
	    const names = {};
	    name = name || String.random();
	    payload = payload || {};
	    const stateConfigs = {};
	    const idMap = {};
	    this.idMap = idMap;
	    const nodeMap = {};
	    Object.getSet(this, {name, stateConfigs, payload});
	    const tree = this;
	    tree.stateTemplates = {};
	
	    this.nameTaken = (n) => Object.keys(tree.stateConfigs).indexOf(n) !== -1;
	
	    function addState(name, payload) {
	      if (tree.declairedName(name)) {
	        throw new Error('Name already declared: This requires unique naming possibly relitive to other trees use DecisionTree.undeclairedName(name) to validate names')
	      }
	      tree.declareName(name);
	      return stateConfigs[name] = payload;
	    }
	
	    function stateDefined(name) {
	      const exists = false;
	      tree.rootNode.forEach((node) =>
	        exists = exists || node.name === name);
	      return exists;
	    }
	
	    function instanceCount(name) {
	      let count = 0;
	      tree.rootNode.forEach((node) =>
	        count += node.name === name ? 1 : 0);
	      return count;
	    }
	
	    function remove(node, password) {
	      if (!node.isTree(tree)) throw new Error('Node has already been removed');
	      let removeList = [node];
	      let index = 0;
	      let currNode;
	      while (currNode = removeList[index]) {
	          currNode.back().remove(currNode, password);
	          removeList = removeList.concat(currNode.states());
	          index += 1;
	      }
	      names[node.name] = undefined;
	    }
	
	    function addStates(sts) {
	      if ((typeof sts) !== 'object') throw new Error('Argument must be an object\nFormat: {[name]: payload...}');
	      const keys = Object.keys(sts);
	      keys.forEach((key) => addState(key, sts[key]));
	    }
	
	    function getState(name, parent, instancePayload) {
	      const node = new DecisionNode(tree, name, instancePayload, parent);
	      idMap[node.nodeId()] = node;
	      return node;
	    }
	
	    const toJson = this.toJson;
	    this.toJson = (node, noStates) => {
	      node = node || this.rootNode;
	      const json = {stateConfigs: {}, _TYPE: this.constructor.name};
	      if (noStates) {
	        json.stateConfigs[name] = stateConfigs[node.name];
	      } else {
	        const names = Array.isArray(node) ? node : node.map((n) => n.name);
	        names.forEach((name) => {
	          const s = stateConfigs[name];
	          json.stateConfigs[name] = s && s.toJson ? s.toJson() : s;
	        });
	      }
	
	      return json;
	    }
	
	    function conditionsSatisfied(conditions, state) {
	      const parent = state.back()
	      if (parent === null) return true;
	      conditions = conditions || {};
	      const cond = conditions[state.name] === undefined ?
	                    conditions._DEFAULT : conditions[state.name];
	      const func = (typeof cond) === 'function' ? cond : null;
	      if (func && !func(state)) {
	        return false;
	      }
	      return parentConditionsSatisfied(conditions, state);
	    }
	
	    function parentConditionsSatisfied(conditions, state) {
	      if ((typeof state.back) !== 'function') {
	        console.log('here')
	      }
	      const parent = state.back();
	      if (parent === null) return true;
	      conditions = conditions || {};
	      const cond = conditions[parent.name] === undefined ?
	                    conditions._DEFAULT : conditions[parent.name];
	      const noRestrictions = cond === undefined;
	      const regex = cond instanceof RegExp ? cond : null;
	      const target = (typeof cond) === 'string' ? cond : null;
	      const func = (typeof cond) === 'function' ? cond : null;
	      if (noRestrictions || (regex && state.name.match(regex)) ||
	              (target !== null && state.name === target) ||
	              (func && func(state))) {
	        return parentConditionsSatisfied(conditions, parent);
	      }
	      return false;
	    }
	
	    function getNodeByPath(...path) {
	      let currNode = tree.rootNode;
	      path.forEach((name) => currNode = currNode.next(name));
	      return currNode;
	    }
	
	    this.remove = remove;
	    this.getNodeByPath = getNodeByPath;
	    this.conditionsSatisfied = conditionsSatisfied;
	    this.getState = getState;
	    this.addState = addState;
	    this.addStates = addStates;
	    this.nodeMap = nodeMap;
	    this.instanceCount = instanceCount;
	    this.stateConfigs = stateConfigs;
	
	    this.rootNode = new DecisionNode(tree, name, payload, null);
	    idMap[this.rootNode.nodeId()] = this.rootNode;
	    payload._nodeId = this.rootNode.nodeId();
	    tree.declareName = (name) => names[name] = true;
	    tree.declairedName = (name) => !!names[name];
	
	    if (json !== undefined) {
	      addStates(Object.fromJson(json.stateConfigs));
	      let index = 0;
	      let jsons = [json.nodes];
	      let currJson;
	      nodeMap[jsons[index].name] = this.rootNode;
	      while (currJson = jsons[index]) {
	        currJson.states.forEach((state) => {
	          jsons.push(state);
	          state.instancePayload = state.instancePayload || {};
	          state.instancePayload._nodeId = state.nodeId;
	          nodeMap[state.name] = nodeMap[currJson.name].then(state.name, state.instancePayload);
	        });
	        index++;
	      }
	    }
	
	    return this.rootNode;
	  }
	}
	
	DecisionTree.DecisionNode = DecisionNode;
	module.exports = DecisionTree;
	
});


RequireJS.addFunction('../../public/js/utils/custom-event.js',
function (require, exports, module) {
	
class CustomEvent {
	  constructor(name) {
	    const watchers = [];
	    this.name = name;
	    this.on = function (func) {
	      if ((typeof func) === 'function') {
	        watchers.push(func);
	      } else {
	        return 'on' + name;
	      }
	    }
	
	    this.trigger = function (element) {
	      element = element === undefined ? window : element;
	      if(document.createEvent){
	          element.dispatchEvent(this.event);
	      } else {
	          element.fireEvent("on" + this.event.eventType, this.event);
	      }
	    }
	//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
	    this.event;
	    if(document.createEvent){
	        this.event = document.createEvent("HTMLEvents");
	        this.event.initEvent(name, true, true);
	        this.event.eventName = name;
	    } else {
	        this.event = document.createEventObject();
	        this.event.eventName = name;
	        this.event.eventType = name;
	    }
	  }
	}
	
	module.exports = CustomEvent;
	
});


RequireJS.addFunction('../../public/js/utils/custom-error.js',
function (require, exports, module) {
	

	
	
	class CustomEvent {
	  constructor(name) {
	    const watchers = [];
	    this.name = name;
	
	    const runFuncs = (e, detail) => watchers.forEach((func) => func(e, detail));
	
	    this.on = function (func) {
	      if ((typeof func) === 'function') {
	        watchers.push(func);
	      } else {
	        return 'on' + name;
	      }
	    }
	
	    this.trigger = function (element, detail) {
	      element = element === undefined ? window : element;
	      runFuncs(element, detail);
	      this.event.detail = detail;
	      if(document.createEvent){
	          element.dispatchEvent(this.event);
	      } else {
	          element.fireEvent("on" + this.event.eventType, this.event);
	      }
	    }
	//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
	    this.event;
	    if(document.createEvent){
	        this.event = document.createEvent("HTMLEvents");
	        this.event.initEvent(name, true, true);
	        this.event.eventName = name;
	    } else {
	        this.event = document.createEventObject();
	        this.event.eventName = name;
	        this.event.eventType = name;
	    }
	  }
	}
	
	module.exports = CustomEvent;
	
});


RequireJS.addFunction('../../public/js/utils/utils.js',
function (require, exports, module) {
	

	
	
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
	    if (!static && lib.prototype[field] === undefined)
	      lib.prototype[field] = func;
	    else if (lib[field] === undefined)
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
	
	function processValue(value) {
	  let retVal;
	  if ((typeof value) === 'object' && value !== null) {
	    if ((typeof value.toJson) === 'function') {
	      retVal = value.toJson();
	    } else if ((typeof value.toJSON) === 'function') {
	      retVal = value.toJSON();
	    } else if (Array.isArray(value)){
	      const arr = [];
	      value.forEach((val) => {
	        if ((typeof val.toJson) === 'function') {
	          arr.push(val.toJson());
	        } else if ((typeof val.toJSON) === 'function') {
	          arr.push(val.toJSON());
	        } else {
	          arr.push(val);
	        }
	      });
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
	
	Function.safeStdLibAddition(String, 'random',  function (len) {
	    len = len || 7;
	    let str = '';
	    while (str.length < len) str += Math.random().toString(36).substr(2);
	    return str.substr(0, len);
	}, true);
	
	Function.safeStdLibAddition(Math, 'mod',  function (val, mod) {
	  while (val < 0) val += mod;
	  return val % mod;
	}, true);
	
	function stringHash() {
	  let hashString = this;
	  let hash = 0;
	  for (let i = 0; i < hashString.length; i += 1) {
	    const character = hashString.charCodeAt(i);
	    hash = ((hash << 5) - hash) + character;
	    hash &= hash; // Convert to 32bit integer
	  }
	  return hash;
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
	Function.safeStdLibAddition(String, 'toSentance',  function () {return this.toPascal().replace(/_/g, ' ')});
	
	Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
	  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
	}, true);
	
	const classLookup = {};
	const attrMap = {};
	const identifierAttr = '_TYPE';
	const immutableAttr = '_IMMUTABLE';
	const temporaryAttr = '_TEMPORARY';
	const doNotOverwriteAttr = '_DO_NOT_OVERWRITE';
	
	const clazz = {};
	clazz.object = () => JSON.clone(classLookup);
	clazz.get = (name) => classLookup[name];
	clazz.filter = (filterFunc) => {
	  const classes = clazz.object();
	  if ((typeof filterFunc) !== 'function') return classes;
	  const classIds = Object.keys(classes);
	  const obj = {};
	  for (let index = 0; index < classIds.length; index += 1) {
	    const id = classIds[index];
	    if (filterFunc(classes[id])) obj[id] = classes[id];
	  }
	  return obj;
	}
	
	function objEq(obj1, obj2) {
	  if (!(obj1 instanceof Object)) return false;
	  if (!(obj2 instanceof Object)) return false;
	  const obj1Keys = Object.keys(obj1);
	  const obj2Keys = Object.keys(obj2);
	  if (obj1Keys.length !== obj2Keys.length) return false;
	  obj1Keys.sort();
	  obj2Keys.sort();
	  for (let index = 0; index < obj1Keys.length; index += 1) {
	    const obj1Key = obj1Keys[index];
	    const obj2Key = obj2Keys[index];
	    if (obj1Key !== obj2Key) return false;
	    const obj1Val = obj1[obj1Key];
	    const obj2Val = obj2[obj2Key];
	    if (obj1Val instanceof Object) {
	      if (!obj1Val.equals(obj2)) return false;
	    } else if (obj1[obj1Key] !== obj2[obj2Key]) return false;
	  }
	  return true;
	}
	
	
	Function.safeStdLibAddition(Object, 'class', clazz, true);
	Function.safeStdLibAddition(Object, 'equals', objEq, true);
	
	
	Function.safeStdLibAddition(Math, 'toDegrees', function (rads, accuracy) {
	  accuracy ||= 100;
	  return Math.round((rads * 180/Math.PI % 360) * accuracy) / accuracy;
	}, true);
	
	Function.safeStdLibAddition(Math, 'toRadians', function (angle, accuracy) {
	  accuracy ||= 10000;
	  return Math.round((angle*Math.PI/180)%(2*Math.PI) * accuracy)  / accuracy;
	}, true);
	
	Function.safeStdLibAddition(Array, 'toJson', function (arr) {
	    const json = [];
	    arr.forEach((elem) => json.push(processValue(elem)));
	    return json;
	}, true);
	
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
	
	Function.safeStdLibAddition(Array, 'concatInPlace', function (arr) {
	  if (arr === this) return;
	  for (let index = 0; index < arr.length; index += 1) {
	    if (this.indexOf(arr[index]) !== -1) {
	      console.error('duplicate');
	    } else {
	      this[this.length] = arr[index];
	    }
	  }
	});
	
	Function.safeStdLibAddition(Array, 'copy', function (arr) {
	  this.length = 0;
	  // const keys = Object.keys(this);
	  // for (let index = 0; index < keys.length; index += 1) delete this[keys[index]];
	  const newKeys = Object.keys(arr);
	  for (let index = 0; index < newKeys.length; index += 1) {
	    const key = newKeys[index];
	    this[key] = arr[key];
	  }
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
	            if ((typeof classObj[attr]) === 'function')
	            classObj[attr](interpretValue(value[attr]));
	            else
	            classObj[attr] = interpretValue(value[attr]);
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
	
	Function.safeStdLibAddition(Object, 'getSet',   function (obj, initialVals, ...attrs) {
	  const cxtrName = obj.constructor.name;
	  if (classLookup[cxtrName] === undefined) {
	    classLookup[cxtrName] = obj.constructor;
	  } else if (classLookup[cxtrName] !== obj.constructor) {
	    console.warn(`Object.fromJson will not work for the following class due to name conflict\n\taffected class: ${obj.constructor}\n\taready registered: ${classLookup[cxtrName]}`);
	  }
	  if (initialVals === undefined) return;
	  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
	  let values = {};
	  let temporary = false;
	  let immutable = false;
	  let doNotOverwrite = false;
	  if ((typeof initialVals) === 'object') {
	    values = initialVals;
	    immutable = values[immutableAttr] === true;
	    temporary = values[temporaryAttr] === true;
	    doNotOverwrite = values[doNotOverwriteAttr] === true;
	    if (immutable) {
	      attrs = Object.keys(values);
	    } else {
	      attrs = Object.keys(values).concat(attrs);
	    }
	  } else {
	    attrs = [initialVals].concat(attrs);
	  }
	  if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
	  attrs.forEach((attr) => {
	    if (!attr.match(/^_[A-Z]*[A-Z_]*$/))
	      attrMap[cxtrName][attr] = true;
	  });
	
	  for (let index = 0; !doNotOverwrite && index < attrs.length; index += 1) {
	    const attr = attrs[index];
	    if (attr !== immutableAttr) {
	      if (immutable) obj[attr] = () => values[attr];
	      else {
	        obj[attr] = (value) => {
	          if (value === undefined) {
	            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
	            if (values[attr] !== undefined || noDefaults)
	            return values[attr];
	            return obj.defaultGetterValue(attr);
	          }
	          values[attr] = value;
	        }
	      }
	    }
	  }
	  if (!temporary) {
	    const origToJson = obj.toJson;
	    obj.toJson = (members, exclusive) => {
	      const restrictions = Array.isArray(members) && members.length;
	      const json = (typeof origToJson === 'function') ? origToJson() : {};
	      json[identifierAttr] = obj.constructor.name;
	      for (let index = 0; index < attrs.length; index += 1) {
	        const attr = attrs[index];
	        const inclusiveAndValid = restrictions && !exclusive && members.indexOf(attr) !== -1;
	        const exclusiveAndValid = restrictions && exclusive && members.indexOf(attr) === -1;
	        if (attr !== immutableAttr && (!restrictions || inclusiveAndValid || exclusiveAndValid)) {
	          // if (obj.constructor.name === 'SnapLocation2D')
	          //   console.log('foundit!');
	          const value = (typeof obj[attr]) === 'function' ? obj[attr]() : obj[attr];
	          json[attr] = processValue(value);
	        }
	      }
	      return json;
	    }
	  }
	  obj.fromJson = (json) => {
	    for (let index = 0; index < attrs.length; index += 1) {
	      const attr = attrs[index];
	      if (attr !== immutableAttr) {
	        if ((typeof obj[attr]) === 'function') {
	          if(Array.isArray(obj[attr]())){
	            obj[attr]().copy(Object.fromJson(json[attr]));
	          } else {
	            obj[attr](Object.fromJson(json[attr]));
	          }
	        }
	        else
	          obj[attr] = Object.fromJson(json[attr]);
	      }
	    };
	    return obj;
	  }
	  if (obj.constructor.DO_NOT_CLONE) {
	    obj.clone = () => obj;
	  } else {
	    obj.clone = () => {
	      const clone = new obj.constructor(obj.toJson());
	      clone.fromJson(obj.toJson());
	      return clone;
	    }
	  }
	  return attrs;
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
	
	Function.safeStdLibAddition(Array, 'set',   function (array, values, start, end) {
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
	    // console.log('constructor: ' + obj.constructor.name);
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
	
	Function.safeStdLibAddition(JSON, 'copy',   function  (obj) {
	  if (!(obj instanceof Object)) return obj;
	  return JSON.parse(JSON.stringify(obj));
	}, true);
	
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
	
	Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
	  const attrs = path.split('.');
	  const lastIndex = attrs.length - 1;
	  let currObj = obj;
	  for (let index = 0; index < lastIndex; index += 1) {
	    let attr = attrs[index];
	    if (currObj[attr] === undefined) currObj[attr] = {};
	    currObj = currObj[attr];
	  }
	
	  const lastAttr = attrs[lastIndex];
	  if ((typeof currObj[lastAttr]) === 'function') {
	    return currObj[lastAttr](value);
	  } else if (value !== undefined) {
	    currObj[lastAttr] = value;
	  }
	  return currObj[lastAttr];
	}, true);
	
});


RequireJS.addFunction('../../public/js/utils/endpoints.js',
function (require, exports, module) {
	
class Endpoints {
	  constructor(config, host) {
	    const instance = this;
	    let environment;
	
	    if ((typeof config) !== 'object') {
	      host = config;
	      config = Endpoints.defaultConfig;
	    }
	
	    host = host || '';
	    this.setHost = (newHost) => {
	      if ((typeof newHost) === 'string') {
	        if (config._envs[newHost]) environment = newHost;
	        host = config._envs[newHost] || newHost;
	      }
	    };
	    this.setHost(host);
	    this.getHost = (env) => env === undefined ? host : config._envs[env];
	    this.getEnv = () => environment;
	
	    const endPointFuncs = {setHost: this.setHost, getHost: this.getHost, getEnv: this.getEnv};
	    this.getFuncObj = function () {return endPointFuncs;};
	
	
	    function build(str) {
	      const pieces = str.split(/:[a-zA-Z0-9]*/g);
	      const labels = str.match(/:[a-zA-Z0-9]*/g) || [];
	      return function () {
	        let values = [];
	        if (arguments[0] === null || (typeof arguments[0]) !== 'object') {
	          values = arguments;
	        } else {
	          const obj = arguments[0];
	          labels.map((value) => values.push(obj[value.substr(1)] !== undefined ? obj[value.substr(1)] : value))
	        }
	        let endpoint = '';
	        for (let index = 0; index < pieces.length; index += 1) {
	          const arg = values[index];
	          let value = '';
	          if (index < pieces.length - 1) {
	            value = arg !== undefined ? encodeURIComponent(arg) : labels[index];
	          }
	          endpoint += pieces[index] + value;
	        }
	        return `${host}${endpoint}`;
	      }
	    }
	
	    function configRecurse(currConfig, currFunc) {
	      const keys = Object.keys(currConfig);
	      for (let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        const value = currConfig[key];
	        if (key.indexOf('_') !== 0) {
	          if (value instanceof Object) {
	            currFunc[key] = {};
	            configRecurse(value, currFunc[key]);
	          } else {
	            currFunc[key] = build(value);
	          }
	        } else {
	          currFunc[key] = value;
	        }
	      }
	    }
	
	    configRecurse(config, endPointFuncs);
	  }
	}
	
	module.exports = Endpoints;
	
});


RequireJS.addFunction('../../public/js/utils/expression-definition.js',
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
	
	module.exports = ExprDef;
	
	
	
	
	
});


RequireJS.addFunction('../../public/js/utils/dom-utils.js',
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
	
	
	const du = {create: {}, class: {}, cookie: {}, param: {}, style: {}, is: {},
	      scroll: {}, input: {}, on: {}, move: {}, url: {}, fade: {}, position: {}};
	du.find = (selector) => document.querySelector(selector);
	du.find.all = (selector) => document.querySelectorAll(selector);
	
	du.create.element = function (tagname, attributes) {
	  const elem = document.createElement(tagname);
	  const keys = Object.keys(attributes || {});
	  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
	  return elem;
	}
	
	function keepInBounds (elem, minimum) {
	  function checkDir(dir) {
	    const rect = elem.getBoundingClientRect();
	    if (rect[dir] < minimum) {
	      elem.style[dir] = minimum + 'px';
	    }
	  }
	  checkDir('left');
	  checkDir('right');
	  checkDir('top');
	  checkDir('bottom');
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
	
	du.move.relitive = function (elem, target, direction, props) {
	  props = props || {};
	  const clientHeight = document.documentElement.clientHeight;
	  const clientWidth = document.documentElement.clientWidth;
	  const rect = target.getBoundingClientRect();
	
	  const style = {};
	  const padding = props.padding || 5;
	  style.cursor = props.cursor || 'unset';
	  style.padding = `${padding}px`;
	  style.position = props.position || 'absolute';
	  style.backgroundColor = props.backgroundColor || 'transparent';
	
	  const scrollY =  props.isFixed ? 0 : window.scrollY;
	  const scrollX =  props.isFixed ? 0 : window.scrollX;
	  const isTop = direction.indexOf('top') !== -1;
	  const isBottom = direction.indexOf('bottom') !== -1;
	  const isRight = direction.indexOf('right') !== -1;
	  const isLeft = direction.indexOf('left') !== -1;
	  if (isTop) {
	    style.top = rect.top - elem.clientWidth - padding + scrollY;
	  } else { style.top = 'unset'; }
	
	  if (isBottom) {
	    style.bottom = (clientHeight - rect.bottom - elem.clientHeight) - padding - scrollY + 'px';
	  } else { style.bottom = 'unset'; }
	
	  if (!isTop && !isBottom) {
	    style.bottom = (clientHeight - rect.bottom + rect.height/2 - elem.clientHeight / 2) - padding - scrollY + 'px';
	  }
	
	  if (isRight) {
	    style.right = clientWidth - rect.right - elem.clientWidth - padding - scrollX + 'px';
	  } else { style.right = 'unset'; }
	
	  if (isLeft) {
	    style.left = rect.left - padding - elem.clientWidth + scrollX;
	  } else { style.left = 'unset'; }
	
	  if (!isLeft && ! isRight) {
	    style.right = clientWidth - rect.right + rect.width/2 - elem.clientWidth/2 - padding - scrollX + 'px';
	  }
	
	  du.style(elem, style);
	  keepInBounds(elem, padding);
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
	      if (visited.indexOf(currNode.parentNode) === -1) {
	        const maybe = recurse(currNode.parentNode, distance + 1);
	        found = maybe && maybe.distance < found.distance ? maybe : found;
	      }
	      return found;
	    }
	  }
	
	  return recurse(node, 0).node;
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
	
	
	
	function runMatch(event) {
	  const  matchRunTargetId = getTargetId(event.currentTarget);
	  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
	  selectStrs.forEach((selectStr) => {
	    const target = du.find.up(selectStr, event.target);
	    const everything = selectStr === '*';
	    if (everything || target) {
	      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target, event));
	    }
	  })
	}
	
	du.is.hidden = function (target) {
	  const elem = du.find.up('[hidden]', target);
	  return elem !== undefined;
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
	  return target.className.match(classReg(clazz));
	}
	
	du.class.toggle = function(target, clazz) {
	  if (du.class.has(target, clazz)) du.class.remove(target, clazz);
	  else du.class.add(target, clazz);
	}
	
	function onKeycombo(event, func, args) {
	  const keysDown = {};
	  const keyup = (target, event) => {
	    keysDown[event.key] = false;
	  }
	  const keydown = (target, event) => {
	    let allPressed = true;
	    keysDown[event.key] = true;
	    for (let index = 0; allPressed && index < args.length; index += 1) {
	      allPressed = allPressed && keysDown[args[index]];
	    }
	    if (allPressed) {
	      console.log('All Pressed!!!');
	      func(target, event);
	    }
	  }
	  du.on.match('keyup', '*', keyup);
	  return {event: 'keydown', func: keydown};
	}
	
	const argEventReg = /^(.*?)(|:(.*))$/;
	function filterCustomEvent(event, func) {
	  const split = event.split(':');
	  event = split[0];
	  const args = split[1] ? split[1].split(',') : [];
	  let customEvent = {func, event};
	  switch (event) {
	    case 'enter':
	      customEvent.func = (target, event) => event.key === 'Enter' && func(target, event);
	      customEvent.event = 'keydown';
	      break;
	    case 'keycombo':
	      customEvent = onKeycombo(event, func, args);
	    break;
	  }
	  return customEvent;
	}
	
	du.on.match = function(event, selector, func, target) {
	  const filter = filterCustomEvent(event, func);
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
	  if (copyTextArea === undefined) {
	    copyTextArea = du.create.element('textarea', {id: 'du-copy-textarea'});
	    document.body.append(copyTextArea);
	  }
	
	  copyTextArea.value = textOelem;
	  copyTextArea.innerText = textOelem;
	
	  copyTextArea.select();
	  document.execCommand("copy");
	}
	
	try {
	  module.exports = du;
	} catch (e) {}
	
});


RequireJS.addFunction('../../public/js/utils/$t.js',
function (require, exports, module) {
	

	
	
	
	const CustomEvent = require('./custom-error');
	const ExprDef = require('./expression-definition');
	
	class $t {
		constructor(template, id, selector) {
			if (selector) {
				const afterRenderEvent = new CustomEvent('afterRender');
				const beforeRenderEvent = new CustomEvent('beforeRender');
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
	
			const signProps = {opening: /([-+\!])/};
			const relationalProps = {opening: /((\<|\>|\<\=|\>\=|\|\||\||&&|&))/};
			const ternaryProps = {opening: /\?/};
			const keyWordProps = {opening: /(new|null|undefined|typeof|NaN|true|false)[^a-z^A-Z]/, tailOffset: -1};
			const ignoreProps = {opening: /new \$t\('.*?'\).render\(.*?, '(.*?)', get\)/};
			const commaProps = {opening: /,/};
			const colonProps = {opening: /:/};
			const multiplierProps = {opening: /(===|[-+=*\/](=|))/};
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
			      .then(multiplier, sign, relational, group)
			      .repeat();
			expression.if(string, group, array, variable, funcRef, memberRef)
						.then(attr)
			      .then(multiplier, sign, relational, expression, funcRef, memberRef)
						.repeat();
			expression.if(string, group, array, variable, funcRef, memberRef)
						.then(attr)
						.end();
	
			funcRef.if(expression).then(comma).repeat();
			funcRef.if(expression).end();
			memberRef.if(expression).then(comma).repeat();
			memberRef.if(expression).end();
	
			expression.if(sign)
			      .then(expression)
			      .then(multiplier, sign, relational, group)
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
				parentScope = parentScope || function () {return undefined};
				function get(name) {
					if (name === 'scope') return scope;
					const split = new String(name).split('.');
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
						resp += new $t(template).render(get(index), undefined, get);
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
					const key = keys[index];
					if (!isArray || key.match(/^[0-9]{1,}$/)) {
						const childScope = {};
						childScope[keyName] = key;
						childScope[valueName] = obj[key];
						childScope.$index = index;
						built += new $t(template).render(childScope, undefined, get);
					}
				}
	      return built;
			}
	
			function rangeExp(elemName, rangeItExpr, get) {
				const match = rangeItExpr.match($t.rangeItExpReg);
				let startIndex = match[1].match(/^[0-9]{1,}$/) ?
							match[1] : get(match[1]);
				let endIndex = match[2].match(/^[0-9]*$/) ?
							match[2] : get(match[2]);
				if (((typeof startIndex) !== 'string' &&
								(typeof	startIndex) !== 'number') ||
									(typeof endIndex) !== 'string' &&
									(typeof endIndex) !== 'number') {
										throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
				}
	
				try {
					startIndex = Number.parseInt(startIndex);
				} catch (e) {
					throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
				}
				try {
					endIndex = Number.parseInt(endIndex);
				} catch (e) {
					throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
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
				if ((typeof scope) === 'string' && scope.match($t.rangeAttemptExpReg)) {
					if (scope.match($t.rangeItExpReg)) {
						return 'rangeExp'
					}
					return 'rangeExpFormatError';
				} else if (Array.isArray(scope)) {
					if (expression === undefined) {
						return 'defaultArray';
					} else if (expression.match($t.nameScopeExpReg)) {
						return 'nameArrayExp';
					}
				}
	
				if ((typeof scope) === 'object') {
					if (expression === undefined) {
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
	
			// TODO: itExp is not longer an iteration expression. fix!!!!
			function render(scope, itExp, parentScope) {
	      if (scope === undefined) return '';
				let rendered = '';
				const get = getter(scope, parentScope);
				switch (type(scope, itExp)) {
					case 'rangeExp':
						rendered = rangeExp(itExp, scope, get);
						break;
					case 'rangeExpFormatError':
						throw new Error(`Invalid range itteration expression "${scope}"`);
					case 'defaultArray':
						rendered = defaultArray(itExp, get);
						break;
					case 'nameArrayExp':
						rendered = defaultArray(itExp, get);
						break;
					case 'arrayExp':
						rendered = arrayExp(itExp, get);
						break;
					case 'invalidArray':
						throw new Error(`Invalid iterative expression for an array "${itExp}"`);
					case 'defaultObject':
						rendered = evaluate(get);
						break;
					case 'itOverObject':
						rendered = itOverObject(itExp, get);
						break;
					case 'invalidObject':
						throw new Error(`Invalid iterative expression for an object "${itExp}"`);
					default:
						throw new Error(`Programming error defined type '${type()}' not implmented in switch`);
				}
	
	      if (selector) {
	        const elem = document.querySelector(selector);
	        if (elem !== null) {
	          beforeRenderEvent.trigger();
	          elem.innerHTML = rendered;
	          afterRenderEvent.trigger();
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
	
			function compile() {
				const blocks = isolateBlocks(template);
				let str = template;
				for (let index = 0; index < blocks.length; index += 1) {
					const block = blocks[index];
					const parced = ExprDef.parse(expression, block);
					str = str.replace(`{{${block}}}`, `\` + $t.clean(${parced}) + \``);
				}
				return `\`${str}\``;
			}
	
	
					const repeatReg = /<([a-zA-Z-]*):t( ([^>]* |))repeat=("|')(([^>^\4]*?)\s{1,}in\s{1,}([^>^\4]*?))\4([^>]*>((?!(<\1:t[^>]*>|<\/\1:t>)).)*<\/)\1:t>/;
					function formatRepeat(string) {
						// tagname:1 prefix:2 quote:4 exlpression:5 suffix:6
						// string = string.replace(/<([^\s^:^-^>]*)/g, '<$1-ce');
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
							const t = eval(`new $t(\`${template}\`)`);
	            let resolvedScope = "get('scope')";;
	            try {
	              // console.log('tagName', tagName);
	              // console.log('varNames', varNames);
	              // console.log('realScope', realScope);
	              // console.log('tagContents', tagContents);
								if (realScope.match(/[0-9]{1,}\.\.[0-9]{1,}/)){
	                resolvedScope = `'${realScope}'`;
	              } else {
	                resolvedScope = ExprDef.parse(expression, realScope);
	              }
	            } catch (e) {}
	            string = string.replace(match[0], `{{ new $t('${t.id()}').render(${resolvedScope}, '${varNames}', get)}}`);
						}
						return string;
					}
	
			if (id) {
				$t.templates[id] = undefined;
				$t.functions[id] = undefined;
			}
	
			template = template.replace(/\s{1,}/g, ' ');
			id = $t.functions[template] ? template : id || stringHash(template);
			if (!$t.functions[id]) {
				if (!$t.templates[id]) {
					template = template.replace(/\s{2,}|\n/g, ' ');
					template = formatRepeat(template);
					$t.templates[id] = compile();
				}
			}
			this.compiled = function () { return $t.templates[id];}
			this.render = render;
	    this.afterRender = (func) => afterRenderEvent.on(func);
	    this.beforeRender = (func) => beforeRenderEvent.on(func);
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
	$t.rangeItExpReg = /^\s*([a-z0-9A-Z]*)\s*\.\.\s*([a-z0-9A-Z]*)\s*$/;
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
				let template = $t.templates[tempName];
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
	
	module.exports = $t;
	
});


RequireJS.addFunction('../../public/js/utils/string-math-evaluator.js',
function (require, exports, module) {
	
const approximate = require('approximate');
	const FunctionCache = require('./services/function-cache.js');
	
	function regexToObject (str, reg) {
	  const match = str.match(reg);
	  if (match === null) return null;
	  const returnVal = {};
	  for (let index = 2; index < arguments.length; index += 1) {
	    const attr = arguments[index];
	    if (attr) returnVal[attr] = match[index - 1];
	  }
	  return returnVal;
	}
	
	class StringMathEvaluator {
	  constructor(globalScope, resolver) {
	    globalScope = globalScope || {};
	    const instance = this;
	    let splitter = '.';
	    let cache = {};
	
	    function resolve (path, currObj, globalCheck) {
	      if (path === '') return currObj;
	      const resolved = !globalCheck && resolver && resolver(path, currObj);
	      if (Number.isFinite(resolved)) return resolved;
	      try {
	        if ((typeof path) === 'string') path = path.split(splitter);
	        for (let index = 0; index < path.length; index += 1) {
	          currObj = currObj[path[index]];
	        }
	        if (currObj === undefined && !globalCheck) throw Error('try global');
	        return currObj;
	      }  catch (e) {
	        if (!globalCheck) return resolve(path, globalScope, true);
	      }
	    }
	
	    function multiplyOrDivide (values, operands) {
	      const op = operands[operands.length - 1];
	      if (op === StringMathEvaluator.multi || op === StringMathEvaluator.div) {
	        const len = values.length;
	        values[len - 2] = op(values[len - 2], values[len - 1])
	        values.pop();
	        operands.pop();
	      }
	    }
	
	    const resolveArguments = (initialChar, func) => {
	      return function (expr, index, values, operands, scope, path) {
	        if (expr[index] === initialChar) {
	          const args = [];
	          let endIndex = index += 1;
	          const terminationChar = expr[index - 1] === '(' ? ')' : ']';
	          let terminate = false;
	          let openParenCount = 0;
	          while(!terminate && endIndex < expr.length) {
	            const currChar = expr[endIndex++];
	            if (currChar === '(') openParenCount++;
	            else if (openParenCount > 0 && currChar === ')') openParenCount--;
	            else if (openParenCount === 0) {
	              if (currChar === ',') {
	                args.push(expr.substr(index, endIndex - index - 1));
	                index = endIndex;
	              } else if (openParenCount === 0 && currChar === terminationChar) {
	                args.push(expr.substr(index, endIndex++ - index - 1));
	                terminate = true;
	              }
	            }
	          }
	
	          for (let index = 0; index < args.length; index += 1) {
	            const stringMatch = args[index].match(StringMathEvaluator.stringReg);
	            if (stringMatch) {
	              args[index] = stringMatch[1];
	            } else {
	              args[index] =  instance.eval(args[index], scope);
	            }
	          }
	          const state = func(expr, path, scope, args, endIndex);
	          if (state) {
	            values.push(state.value);
	            return state.endIndex;
	          }
	        }
	      }
	    };
	
	    function chainedExpressions(expr, value, endIndex, path) {
	      if (expr.length === endIndex) return {value, endIndex};
	      let values = [];
	      let offsetIndex;
	      let valueIndex = 0;
	      let chained = false;
	      do {
	        const subStr = expr.substr(endIndex);
	        const offsetIndex = isolateArray(subStr, 0, values, [], value, path) ||
	                            isolateFunction(subStr, 0, values, [], value, path) ||
	                            (subStr[0] === '.' &&
	                              isolateVar(subStr, 1, values, [], value));
	        if (Number.isInteger(offsetIndex)) {
	          value = values[valueIndex];
	          endIndex += offsetIndex - 1;
	          chained = true;
	        }
	      } while (offsetIndex !== undefined);
	      return {value, endIndex};
	    }
	
	    const isolateArray = resolveArguments('[',
	      (expr, path, scope, args, endIndex) => {
	        endIndex = endIndex - 1;
	        let value = resolve(path, scope)[args[args.length - 1]];
	        return chainedExpressions(expr, value, endIndex, '');
	      });
	
	    const isolateFunction = resolveArguments('(',
	      (expr, path, scope, args, endIndex) =>
	          chainedExpressions(expr, resolve(path, scope).apply(null, args), endIndex, ''));
	
	    function isolateParenthesis(expr, index, values, operands, scope) {
	      const char = expr[index];
	      if (char === ')') throw new Error('UnExpected closing parenthesis');
	      if (char === '(') {
	        let openParenCount = 1;
	        let endIndex = index + 1;
	        while(openParenCount > 0 && endIndex < expr.length) {
	          const currChar = expr[endIndex++];
	          if (currChar === '(') openParenCount++;
	          if (currChar === ')') openParenCount--;
	        }
	        if (openParenCount > 0) throw new Error('UnClosed parenthesis');
	        const len = endIndex - index - 2;
	        values.push(instance.eval(expr.substr(index + 1, len), scope));
	        multiplyOrDivide(values, operands);
	        return endIndex;
	      }
	    };
	
	    function isolateOperand (char, operands) {
	      if (char === ')') throw new Error('UnExpected closing parenthesis');
	      switch (char) {
	        case '*':
	        operands.push(StringMathEvaluator.multi);
	        return true;
	        break;
	        case '/':
	        operands.push(StringMathEvaluator.div);
	        return true;
	        break;
	        case '+':
	        operands.push(StringMathEvaluator.add);
	        return true;
	        break;
	        case '-':
	        operands.push(StringMathEvaluator.sub);
	        return true;
	        break;
	      }
	      return false;
	    }
	
	    function isolateValueReg(reg, resolver) {
	      return function (expr, index, values, operands, scope) {
	        const match = expr.substr(index).match(reg);
	        let args;
	        if (match) {
	          let endIndex = index + match[0].length;
	          let value = resolver(match[0], scope);
	          if (!Number.isFinite(value)) {
	            const state = chainedExpressions(expr, scope, endIndex, match[0]);
	            if (state !== undefined) {
	              value = state.value;
	              endIndex = state.endIndex;
	            }
	          }
	          values.push(value);
	          multiplyOrDivide(values, operands);
	          return endIndex;
	        }
	      }
	    }
	
	    function convertFeetInchNotation(expr) {
	      expr = expr.replace(StringMathEvaluator.footInchReg, '($1*12+$2)') || expr;
	      expr = expr.replace(StringMathEvaluator.inchReg, '$1') || expr;
	      expr = expr.replace(StringMathEvaluator.footReg, '($1*12)') || expr;
	      return expr = expr.replace(StringMathEvaluator.multiMixedNumberReg, '($1+$2)') || expr;
	    }
	    function addUnexpressedMultiplicationSigns(expr) {
	      expr = expr.replace(/([0-9]{1,})(\s*)([a-zA-Z]{1,})/g, '$1*$3');
	      expr = expr.replace(/([a-zA-Z]{1,})\s{1,}([0-9]{1,})/g, '$1*$2');
	      expr = expr.replace(/\)([^a-z^A-Z^$^\s^)^+^\-^*^\/])/g, ')*$1');
	      return expr.replace(/([^a-z^A-Z^\s^$^(^+^\-^*^\/])\(/g, '$1*(');
	    }
	
	    const isolateNumber = isolateValueReg(StringMathEvaluator.decimalReg, Number.parseFloat);
	    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);
	
	    this.cache = (expr) => {
	      const time = new Date().getTime();
	      if (cache[expr] && cache[expr].time > time - 200) {
	        cache[expr].time = time;
	        return cache[expr].value;
	      }
	      return null
	    }
	
	    function evaluate(expr, scope, percision) {
	      if (instance.cache(expr) !== null) return instance.cache(expr);
	      if (Number.isFinite(expr))
	        return approximate(expr);
	      expr = new String(expr);
	      expr = addUnexpressedMultiplicationSigns(expr);
	      expr = convertFeetInchNotation(expr);
	      scope = scope || globalScope;
	      const allowVars = (typeof scope) === 'object';
	      let operands = [];
	      let values = [];
	      let prevWasOpperand = true;
	      for (let index = 0; index < expr.length; index += 1) {
	        const char = expr[index];
	        if (prevWasOpperand) {
	          try {
	            if (isolateOperand(char, operands))
	                throw new Error(`Invalid operand location ${expr.substr(0,index)}'${expr[index]}'${expr.substr(index + 1)}`);
	            let newIndex = isolateParenthesis(expr, index, values, operands, scope) ||
	                isolateNumber(expr, index, values, operands, scope) ||
	                (allowVars && isolateVar(expr, index, values, operands, scope));
	            if (Number.isInteger(newIndex)) {
	              index = newIndex - 1;
	              prevWasOpperand = false;
	            }
	          } catch (e) {
	            console.error(e);
	            return NaN;
	          }
	        } else {
	          prevWasOpperand = isolateOperand(char, operands);
	        }
	      }
	      if (prevWasOpperand) return NaN;
	
	      let value = values[0];
	      for (let index = 0; index < values.length - 1; index += 1) {
	        value = operands[index](values[index], values[index + 1]);
	        values[index + 1] = value;
	      }
	
	      if (Number.isFinite(value)) {
	        value = approximate(value);
	        cache[expr] = {time: new Date().getTime(), value};
	        return value;
	      }
	      return NaN;
	    }
	
	    this.eval = new FunctionCache(evaluate, this, 'sme');
	  }
	}
	
	StringMathEvaluator.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
	
	const mixNumberRegStr = "([0-9]{1,})\\s{1,}(([0-9]{1,})\\/([0-9]{1,}))";
	StringMathEvaluator.mixedNumberReg = new RegExp(`^${mixNumberRegStr}$`);
	StringMathEvaluator.multiMixedNumberReg = new RegExp(mixNumberRegStr, 'g');///([0-9]{1,})\s{1,}([0-9]{1,}\/[0-9]{1,})/g;
	StringMathEvaluator.fractionOrMixedNumberReg = /(^([0-9]{1,})\s|^){1,}([0-9]{1,}\/[0-9]{1,})$/;
	StringMathEvaluator.footInchReg = /\s*([0-9]{1,})\s*'\s*([0-9\/ ]{1,})\s*"\s*/g;
	StringMathEvaluator.footReg = /\s*([0-9]{1,})\s*'\s*/g;
	StringMathEvaluator.inchReg = /\s*([0-9]{1,})\s*"\s*/g;
	StringMathEvaluator.evaluateReg = /[-\+*/]|^\s*[0-9]{1,}\s*$/;
	const decimalRegStr = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
	StringMathEvaluator.decimalReg = new RegExp(`^${decimalRegStr}`);///^(-|)(([0-9]{1,}\.[0-9]{1,})|[0-9]{1,}(\.|)|(\.)[0-9]{1,})/;
	StringMathEvaluator.multiDecimalReg = new RegExp(decimalRegStr, 'g');
	StringMathEvaluator.varReg = /^((\.|)([$_a-zA-Z][$_a-zA-Z0-9\.]*))/;
	StringMathEvaluator.stringReg = /\s*['"](.*)['"]\s*/;
	StringMathEvaluator.multi = (n1, n2) => n1 * n2;
	StringMathEvaluator.div = (n1, n2) => n1 / n2;
	StringMathEvaluator.add = (n1, n2) => n1 + n2;
	StringMathEvaluator.sub = (n1, n2) => n1 - n2;
	
	const npf = Number.parseFloat;
	StringMathEvaluator.convert = {eqn: {}};
	StringMathEvaluator.convert.metricToImperial = (value) => {
	  value = npf(value);
	  return value / 2.54;
	}
	
	StringMathEvaluator.resolveMixedNumber = (value) => {
	  const match = value.match(StringMathEvaluator.mixedNumberReg);
	  if (match) {
	    value = npf(match[1]) + (npf(match[3]) / npf(match[4]));
	  }
	  value = npf(value);
	  return value;
	}
	
	StringMathEvaluator.convert.imperialToMetric = (value) => {
	  value = npf(value);
	  return value * 2.54;
	}
	
	StringMathEvaluator.convert.eqn.metricToImperial = (str) =>
	  str.replace(StringMathEvaluator.multiDecimalReg, StringMathEvaluator.convert.metricToImperial);
	
	StringMathEvaluator.convert.eqn.imperialToMetric = (str) =>
	  str.replace(StringMathEvaluator.multiMixedNumberReg, StringMathEvaluator.resolveMixedNumber)
	  .replace(StringMathEvaluator.multiDecimalReg, StringMathEvaluator.convert.imperialToMetric);
	
	StringMathEvaluator.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	
	
	StringMathEvaluator.reduce = function(numerator, denominator) {
	  let reduced = true;
	  while (reduced) {
	    reduced = false;
	    for (let index = 0; index < StringMathEvaluator.primes.length; index += 1) {
	      const prime = StringMathEvaluator.primes[index];
	      if (prime >= denominator) break;
	      if (numerator % prime === 0 && denominator % prime === 0) {
	        numerator = numerator / prime;
	        denominator = denominator / prime;
	        reduced = true;
	        break;
	      }
	    }
	  }
	  if (numerator === 0) {
	    return '';
	  }
	  return `${numerator}/${denominator}`;
	}
	
	StringMathEvaluator.parseFraction = function (str) {
	  const regObj = regexToObject(str, StringMathEvaluator.regex, null, 'integer', null, 'numerator', 'denominator');
	  regObj.integer = Number.parseInt(regObj.integer) || 0;
	  regObj.numerator = Number.parseInt(regObj.numerator) || 0;
	  regObj.denominator = Number.parseInt(regObj.denominator) || 0;
	  if(regObj.denominator === 0) {
	    regObj.numerator = 0;
	    regObj.denominator = 1;
	  }
	  regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
	  return regObj;
	}
	
	StringMathEvaluator.toFraction = function (decimal, accuracy) {
	  if (decimal === NaN) return NaN;
	  accuracy = accuracy || '1/1000'
	  const fracObj = StringMathEvaluator.parseFraction(accuracy);
	  const denominator = fracObj.denominator;
	  if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
	    throw new Error('Please enter a fraction with a denominator between (0, 1000]')
	  }
	  let remainder = decimal;
	  let currRemainder = remainder;
	  let value = 0;
	  let numerator = 0;
	  while (currRemainder > 0) {
	    numerator += fracObj.numerator;
	    currRemainder -= fracObj.decimal;
	  }
	  const diff1 = decimal - ((numerator - fracObj.numerator) / denominator);
	  const diff2 = (numerator / denominator) - decimal;
	  numerator -= diff1 < diff2 ? fracObj.numerator : 0;
	  const integer = Math.floor(numerator / denominator);
	  numerator = numerator % denominator;
	  const fraction = StringMathEvaluator.reduce(numerator, denominator);
	  return (integer && fraction ? `${integer} ${fraction}` :
	            (integer ? `${integer}` : (fraction ? `${fraction}` : '0')));
	}
	
	try {
	  module.exports = StringMathEvaluator;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/logic-tree.js',
function (require, exports, module) {
	

	const DecisionTree = require('./decision-tree');
	const DataSync = require('./data-sync');
	const Lookup = require('./object/lookup');
	
	const INTERNAL_FUNCTION_PASSWORD = String.random();
	const DEFAULT_GROUP = 'LogicTree';
	
	function getNode(nodeOwrapper) {
	  if (nodeOwrapper.constructor.name === 'DecisionNode') return nodeOwrapper;
	  return nodeOwrapper.node;
	}
	
	class LogicWrapper extends Lookup {
	  constructor(node) {
	    super(node ? node.nodeId() : undefined);
	    this.node = node;
	    this.nodeId = () => LogicWrapper.decode(this.id()).id;
	  }
	}
	
	class LogicType {
	  constructor(wrapperOrJson) {
	    Object.getSet(this, 'nodeId', 'optional', 'value', 'default');
	    this.wrapper = wrapperOrJson instanceof LogicWrapper ?
	                      wrapperOrJson :
	                      LogicWrapper.get(wrapperOrJson.nodeId);
	    this.nodeId(this.wrapper.node.nodeId());
	    let optional = false;
	    this.optional = (val) => {
	      if (val === true || val === false) {
	        optional = val;
	      }
	      return optional;
	    }
	    this.selectionMade = () => true;
	  }
	}
	
	class SelectLogic extends LogicType {
	  constructor(wrapper) {
	    super(wrapper);
	    const json = wrapper;
	    wrapper = this.wrapper;
	    let value, def;
	    const instance = this;
	    this.madeSelection = () => validate(value, true) || validate(def, true);
	    function validate(val, silent) {
	      if (instance.optional() && val === null) return true;
	      const valid = (instance.optional() && val === null) ||
	                    (val !== null && wrapper.node.validState(val));
	      if (!silent && !valid)
	        throw SelectLogic.error;
	      return valid;
	    }
	    this.value = (val, password) => {
	      if (val !== undefined) {
	        validate(val);
	        value = val;
	        wrapper.valueUpdate(value, wrapper);
	      }
	      return value === undefined ? (def === undefined ? null : def) : value;
	    }
	    this.selectionMade = () => value !== undefined;
	    this.options = () => {
	      return wrapper.node.stateNames();
	    }
	    this.default = (val, password) => {
	      if (val !== undefined) {
	        validate(val);
	        def = val;
	        wrapper.defaultUpdate(value, wrapper);
	      }
	      return def;
	    }
	    this.selector = () => this.value();
	   }
	}
	
	SelectLogic.error = new Error('Invalid selection: use wrapper.options() to get valid list.')
	
	class MultiselectLogic extends LogicType {
	  constructor(wrapper) {
	    super(wrapper);
	    wrapper = this.wrapper;
	    let value, def;
	    const instance = this;
	    this.madeSelection = () => validate(value, true) || validate(def, true);
	    function validate(val, silent) {
	      if (val === null) return instance.optional();
	      if (val === undefined) return false;
	      const stateNames = Object.keys(val);
	      if (instance.optional() && stateNames.length === 0) return true;
	      let valid = stateNames.length > 0;
	      stateNames.forEach((name) => valid = valid && wrapper.node.validState(name));
	      if (!silent && !valid) throw MultiselectLogic.error;
	      return valid;
	    }
	    this.value = (val, password) => {
	      if (val !== undefined) {
	        validate(val);
	        value = val;
	        wrapper.valueUpdate(value);
	      }
	      let retVal = value === undefined ? def : value;
	      return retVal === null ? null : JSON.clone(retVal);
	    }
	    this.selectionMade = () => value !== undefined;
	    this.options = () => {
	      const options = {};
	      const stateNames = wrapper.node.stateNames();
	      stateNames.forEach((name) => options[name] = def[name] === undefined ? false : def[name]);
	      return options;
	    }
	    this.default = (val, password) => {
	      if (val !== undefined) {
	        validate(val);
	        def = val;
	        wrapper.defaultUpdate(value);
	      }
	      return def;
	    }
	    this.selector = () => {
	      const obj = this.value();
	      if (obj === null || obj === undefined) return null;
	      const keys = Object.keys(obj);
	      let selector = '';
	      keys.forEach((key) => selector += obj[key] ? `|${key}` : '');
	      selector = selector.length === 0 ? null : new RegExp(`^${selector.substring(1)}$`);
	      return selector;
	    }
	  }
	}
	MultiselectLogic.error = new Error('Invalid multiselection: use wrapper.options() to get valid list.')
	
	
	class ConditionalLogic extends LogicType {
	  constructor(wrapper) {
	    super(wrapper);
	    wrapper = this.wrapper;
	    let value, def;
	    validate(wrapper.node.payload());
	    def = wrapper.node.payload();
	    function validate(val, password) {
	      if ((typeof val.condition) !== 'function')
	        throw ConditionalLogic.error;
	    }
	    this.value = (val) => {
	      if (val !== undefined) {
	        validate(val);
	        value = val;
	        wrapper.valueUpdate(value);
	      }
	      return value || def;
	    }
	    this.options = () => undefined;
	    this.default = (val, password) => {
	      if (val !== undefined) {
	        validate(val);
	        def = val;
	        wrapper.defaultUpdate(value);
	      }
	      return def;
	    }
	    this.selector = () => () =>
	      this.value().condition(wrapper.root());
	  }
	}
	ConditionalLogic.error = new Error('Invalid condition: must be a function that returns true or false based off of node input');
	
	class BranchLogic extends LogicType {
	  constructor(wrapper) {
	    super(wrapper);
	    this.value = () => undefined;
	    this.options = () => undefined;
	    this.default = () => undefined;
	    this.selector = () => /.*/;
	  }
	}
	
	class LeafLogic extends LogicType {
	  constructor(wrapper) {
	    super(wrapper);
	    this.value = () =>undefined;
	    this.options = () => undefined;
	    this.default = () => undefined;
	    this.selector = () => undefined;
	  }
	}
	
	LogicType.types = {SelectLogic, MultiselectLogic, ConditionalLogic, BranchLogic, LeafLogic};
	class LogicTree {
	  constructor(formatPayload) {
	    Object.getSet(this);
	    const tree = this;
	    let root;
	    let choices = {};
	    const wrapperMap = {};
	
	    function getTypeObjByNodeId(nodeId) {
	      return choices[get(nodeId).name];
	    }
	    let dataSync = new DataSync('nodeId', getTypeObjByNodeId);
	    dataSync.addConnection('value');
	    dataSync.addConnection('default');
	
	    function isOptional(node) {
	      return !(choices[node.name] === undefined || !choices[node.name].optional());
	    }
	
	    function isSelector(node) {
	      return node.payload().LOGIC_TYPE.match(/Select|Multiselect/);
	    }
	
	    function mustSelect(node) {
	      return !isOptional(node)  && node.payload().LOGIC_TYPE.match(/Select|Multiselect/);
	    }
	
	    function structure() { return root.node.toString(null, 'LOGIC_TYPE') }
	
	    function setChoice(name, val) {
	      choices[name].value(val);
	    }
	
	    function setDefault(name, val) {
	      choices[name].default(val);
	    }
	
	    function getByName(name) {
	      if (root.node === undefined) return undefined;
	      const node = root.node.getByName(name);
	      return node === undefined ? undefined : wrapNode(node);
	    }
	
	    function addChildrenFunc(wrapper, options) {
	      return (name) => {
	        const targetWrapper = getByName(name);
	        if (targetWrapper === undefined) throw new Error(`Invalid name: ${name}`);
	        const states = targetWrapper.node.states();
	        states.forEach((state) => wrapNode(wrapper.node.then(state)));
	        return wrapper;
	      }
	    }
	
	    function choicesToSelectors() {
	      const keys = Object.keys(choices);
	      const selectors = {};
	      keys.forEach((key) => selectors[key] = choices[key].selector());
	      return selectors;
	    }
	
	    function reachableTree(node) {
	      return (node || root.node).subtree(choicesToSelectors());
	    }
	
	    function leaves() {
	      const wrappers = [];
	      reachableTree().leaves().forEach((node) => wrappers.push(wrapNode(node)));
	      return wrappers;
	    }
	
	    function pathsToString() {
	      let paths = '=>';
	      forPath((wrapper, data) => {
	        if (data === undefined) paths = paths.substring(0, paths.length - 2) + "\n";
	        paths += `${wrapper.name}=>`;
	        return true;
	      });
	      paths = paths.substring(0, paths.length - 2)
	      return paths;
	    }
	
	    function forPath(func, reverse) {
	      const lvs = reachableTree().leaves();
	      let data = [];
	      let dIndex = 0;
	      lvs.forEach((leave) => {
	        const path = [];
	        let curr = leave;
	        while (curr !== undefined) {
	          path.push(curr);
	          curr = curr.back()
	        }
	        if (reverse === true) {
	          for (let index = 0; index < path.length; index += 1) {
	            data[dIndex] = func(wrapNode(path[index]), data[dIndex]);
	          }
	        } else {
	          for (let index = path.length - 1; index >= 0; index -= 1) {
	            data[dIndex] = func(wrapNode(path[index]), data[dIndex]);
	          }
	        }
	        dIndex++;
	      });
	      return data;
	    }
	
	    function forAll(func, node) {
	      (node || root.node).forEach((n) => {
	        func(wrapNode(n));
	      });
	    }
	
	    function forEach(func, node) {
	      reachableTree(node).forEach((n) => {
	        func(wrapNode(n));
	      });
	    }
	
	    function reachable(nameOwrapper) {
	      const wrapper = nameOwrapper instanceof LogicWrapper ?
	                        nameOwrapper : getByName(nameOwrapper);
	      return wrapper.node.conditionsSatisfied(choicesToSelectors(), wrapper.node);
	    }
	
	    function isComplete() {
	      const subtree = reachableTree();
	      let complete = true;
	      subtree.forEach((node) => {
	        if (node.states().length === 0 && node.payload().LOGIC_TYPE !== 'Leaf' &&
	              !selectionMade(node)) {
	          complete = false;
	        }
	      });
	      return complete;
	    }
	
	    function selectionMade(node, selectors) {
	      selectors = selectors || choicesToSelectors();
	      if (mustSelect(node)) {
	        const wrapper = wrapNode(node);
	        if (getTypeObj(wrapper) === undefined) {
	          throw new Error ('This should not happen. node wrapper was not made correctly.');
	        }
	        return getTypeObj(wrapper).madeSelection();
	      }
	      return true;
	    }
	
	    function getByPath(...args) {
	      return wrapNode(root.node.getNodeByPath(...args))
	    }
	    this.getByPath = getByPath;
	
	    function decisions(wrapper) {
	      return () =>{
	        const decisions = [];
	        const addedNodeIds = [];
	        const selectors = choicesToSelectors();
	        wrapper.node.forEach((node) => {
	          if (isSelector(node)) {
	            let terminatedPath = false;
	            let current = node;
	            while (current = current.back()){
	              if (addedNodeIds.indexOf(current.nodeId()) !== -1)
	                terminatedPath = true;
	            }
	            if (!terminatedPath) {
	              if (node.conditionsSatisfied(selectors, node)) {
	                if (selectionMade(node, selectors)) {
	                  decisions.push(wrapNode(node));
	                } else {
	                  decisions.push(wrapNode(node));
	                  addedNodeIds.push(node.nodeId());
	                }
	              }
	            }
	          }
	        });
	        return decisions;
	      }
	    }
	
	    function toJson(wrapper) {
	      return function () {
	        wrapper = wrapper || root;
	        const json = {_choices: {}, _TYPE: tree.constructor.name};
	        const keys = Object.keys(choices);
	        const ids = wrapper.node.map((node) => node.nodeId());
	        keys.forEach((key) => {
	          if (ids.indexOf(choices[key].nodeId()) !== -1) {
	            json._choices[key] = choices[key].toJson();
	            const valEqDefault = choices[key].default() === choices[key].value();
	            const selectionNotMade = !choices[key].selectionMade();
	            if(selectionNotMade || valEqDefault) json._choices[key].value = undefined;
	          }
	        });
	        json._tree = wrapper.node.toJson();
	        json._connectionList = dataSync.toJson(wrapper.node.nodes());
	        return json;
	      }
	    }
	
	    function children(wrapper) {
	      return () => {
	        const children = [];
	        wrapper.node.forEachChild((child) => children.push(wrapNode(child)));
	        return children;
	      }
	    }
	
	    function addStaticMethods(wrapper) {
	      wrapper.structure = structure;
	      wrapper.choicesToSelectors = choicesToSelectors;
	      wrapper.setChoice = setChoice;
	      wrapper.children = children(wrapper);
	      wrapper.getByPath = getByPath;
	      wrapper.setDefault = setDefault;
	      wrapper.attachTree = attachTree(wrapper);
	      wrapper.toJson = toJson(wrapper);
	      wrapper.root = () => root;
	      wrapper.isComplete = isComplete;
	      wrapper.reachable = (wrap) => reachable(wrap || wrapper);
	      wrapper.decisions = decisions(wrapper);
	      wrapper.forPath = forPath;
	      wrapper.forEach = forEach;
	      wrapper.forAll = forAll;
	      wrapper.pathsToString = pathsToString;
	      wrapper.leaves = leaves;
	      wrapper.toString = () =>
	          wrapper.node.subtree(choicesToSelectors()).toString(null, 'LOGIC_TYPE');
	    }
	
	    function getTypeObj(wrapper) {
	      return choices[wrapper.name];
	    }
	
	    function addHelperMetrhods (wrapper) {
	      const node = wrapper.node;
	      const type = node.payload().LOGIC_TYPE;
	      const name = node.name;
	      if (choices[name] === undefined) {
	        choices[name] = new (LogicType.types[`${type}Logic`])(wrapper);
	      }
	      const typeObj = choices[name];
	      wrapper.name = name;
	      wrapper.getTypeObj = () => getTypeObj(wrapper);
	      wrapper.value = typeObj.value;
	      wrapper.payload = () => node.payload();
	      wrapper.options = typeObj.options;
	      wrapper.optional = typeObj.optional;
	      wrapper.default = typeObj.default;
	      wrapper.selector = typeObj.selector;
	      wrapper.addChildren = addChildrenFunc(wrapper);
	      wrapper.valueSync = (w) => dataSync.valueSync(typeObj, w.getTypeObj());
	      wrapper.defaultSync = (w) => dataSync.defaultSync(typeObj, w.getTypeObj());
	      wrapper.valueUpdate = (value) => dataSync.valueUpdate(value, typeObj);
	      wrapper.defaultUpdate = (value) => dataSync.defaultUpdate(value, typeObj);
	    }
	
	    function attachTree(wrapper) {
	      return (tree) => {
	        const json = tree.toJson();
	        return incorrperateJsonNodes(json, wrapper.node);
	      }
	    }
	
	    function addTypeFunction(type, wrapper) {
	      wrapper[type.toLowerCase()] = (name, payload) => {
	        payload = typeof formatPayload === 'function' ?
	                          formatPayload(name, payload || {}, wrapper) : payload || {};
	        payload.LOGIC_TYPE = type;
	        let newWrapper;
	        if (root === undefined) {
	          root = wrapper;
	          root.node = new DecisionTree(name, payload);
	          root.payload = root.node.payload;
	          newWrapper = root;
	        } else if (getByName(name)) {
	          newWrapper = wrapNode(wrapper.node.then(name));
	        } else {
	          wrapper.node.addState(name, payload);
	          newWrapper = wrapNode(wrapper.node.then(name));
	        }
	        return newWrapper;
	      }
	    }
	
	    function getNode(nodeOrwrapperOrId) {
	      switch (nodeOrwrapperOrId.constructor.name) {
	        case 'DecisionNode':
	          return nodeOrwrapperOrId;
	        case 'LogicWrapper':
	          return nodeOrwrapperOrId.node;
	        default:
	          const node = DecisionTree.DecisionNode.get(nodeOrwrapperOrId);
	          if (node) return node;
	          return nodeOrwrapperOrId;
	      }
	    }
	
	    function get(nodeOidOwrapper) {
	      if (nodeOidOwrapper === undefined) return undefined;
	      const node = getNode(nodeOidOwrapper);
	      if (node instanceof DecisionTree.DecisionNode) {
	        return wrapperMap[node.nodeId()];
	      } else {
	        return wrapperMap[node];
	      }
	    }
	
	    const set = (wrapper) =>
	        wrapperMap[wrapper.node.nodeId()] = wrapper;
	    this.get = get;
	
	    function wrapNode(node) {
	      let wrapper = get(node);
	      if (wrapper) return wrapper;
	      wrapper = new LogicWrapper(node);
	      if (node === undefined) {
	        wrapper.toString = () =>
	          root !== undefined ? root.toString() : 'Empty Tree';
	      }
	      if (node === undefined || node.payload().LOGIC_TYPE !== 'Leaf') {
	        addTypeFunction('Select', wrapper);
	        addTypeFunction('Multiselect', wrapper);
	        addTypeFunction('Conditional', wrapper);
	        addTypeFunction('Leaf', wrapper);
	        addTypeFunction('Branch', wrapper);
	      }
	      addStaticMethods(wrapper);
	      if (node && node.payload().LOGIC_TYPE !== undefined) {
	        addHelperMetrhods(wrapper);
	        set(wrapper);
	      }
	      return wrapper;
	    }
	
	    function updateChoices(jsonChoices) {
	      const keys = Object.keys(jsonChoices);
	      keys.forEach((key) =>
	          choices[key].fromJson(jsonChoices[key]));
	    }
	
	    function incorrperateJsonNodes(json, node) {
	      const decisionTree = new DecisionTree(json._tree);
	
	      let newNode;
	      if (node !== undefined) {
	        newNode = node.attachTree(decisionTree);
	      } else {
	        root = wrapNode(decisionTree);
	        rootWrapper.node = root.node;
	        newNode = root.node;
	      }
	      newNode.forEach((n) =>
	          wrapNode(n));
	      dataSync.fromJson(json._connectionList);
	      updateChoices(json._choices);
	      return node;
	    }
	
	    let rootWrapper = wrapNode();
	    if (formatPayload && formatPayload._TYPE === this.constructor.name) incorrperateJsonNodes(formatPayload);
	    return rootWrapper;
	  }
	}
	
	LogicTree.LogicWrapper = LogicWrapper;
	
	module.exports = LogicTree;
	
});


RequireJS.addFunction('../../public/js/utils/request.js',
function (require, exports, module) {
	

	Request = {
	    onStateChange: function (success, failure, id) {
	      return function () {
	        if (this.readyState === 4) {
	          if (this.status == 200) {
	            try {
	              resp = JSON.parse(this.responseText);
	            } catch (e){
	              resp = this.responseText;
	            }
	            if (success) {
	              success(resp, this);
	            }
	          } else if (failure) {
	            const errorMsgMatch = this.responseText.match(Request.errorMsgReg);
	            if (errorMsgMatch) {
	              this.errorMsg = errorMsgMatch[1].trim();
	            }
	            const errorCodeMatch = this.responseText.match(Request.errorCodeReg);
	            if (errorCodeMatch) {
	              this.errorCode = errorCodeMatch[1];
	
	            }
	            failure(this);
	          }
	          var resp = this.responseText;
	        }
	      }
	    },
	
	    id: function (url, method) {
	      return `request.${method}.${url.replace(/\./g, ',')}`;
	    },
	
	    get: function (url, success, failure) {
	      const xhr = new Request.xmlhr();
	      xhr.open("GET", url, true);
	      const id = Request.id(url, 'GET');
	      xhr.setRequestHeader('Content-Type', 'text/pdf');
	      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
	      Request.setGlobalHeaders(xhr);
	      if (success === undefined && failure === undefined) return xhr;
	      xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
	      xhr.send();
	      return xhr;
	    },
	
	    hasBody: function (method) {
	      return function (url, body, success, failure) {
	        const xhr = new Request.xmlhr();
	        xhr.open(method, url, true);
	        const id = Request.id(url, method);
	        xhr.setRequestHeader('Content-Type', 'application/json');
	        Request.setGlobalHeaders(xhr);
	        if (success === undefined && failure === undefined) return xhr;
	        xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
	        xhr.send(JSON.stringify(body));
	        return xhr;
	      }
	    },
	
	    post: function () {return Request.hasBody('POST')(...arguments)},
	    delete: function () {return Request.hasBody('DELETE')(...arguments)},
	    options: function () {return Request.hasBody('OPTIONS')(...arguments)},
	    head: function () {return Request.hasBody('HEAD')(...arguments)},
	    put: function () {return Request.hasBody('PUT')(...arguments)},
	    connect: function () {return Request.hasBody('CONNECT')(...arguments)},
	}
	
	Request.errorCodeReg = /Error Code:([a-zA-Z0-9]*)/;
	Request.errorMsgReg = /[a-zA-Z0-9]*?:([a-zA-Z0-9 ]*)/;
	const globalHeaders = {};
	Request.globalHeader = (header, funcOval) => {
	  globalHeaders[header] = funcOval;
	}
	Request.setGlobalHeaders = (xhr) => {
	  const headers = Object.keys(globalHeaders);
	  headers.forEach((header) => {
	    const value = (typeof globalHeaders[header]) === 'function' ? globalHeaders[header]() : globalHeaders[header];
	    xhr.setRequestHeader(header, value, xhr);
	  });
	}
	try {
	  Request.xmlhr = XMLHttpRequest;
	} catch (e) {
	  Request.xmlhr = require('xmlhttprequest').XMLHttpRequest;
	}
	
	try {
	  module.exports = Request;
	} catch (e) {}
	
});


RequireJS.addFunction('../../public/js/utils/parse-arguments.js',
function (require, exports, module) {
	const trueReg = /^true$/;
	const falseReg = /^false$/;
	const numberReg = /^[0-9]{1,}$/;
	const arrayReg = /^(.*[,].*(,|)){1,}$/;
	
	function getValue(str) {
	  if (str === '') return undefined;
	  if (str.match(trueReg)) return true;
	  if (str.match(falseReg)) return false;
	  if (str.match(numberReg)) return Number.parseInt(str);
	  if (str.match(arrayReg)) {
	    const arr = [];
	    const elems = str.split(',');
	    for (let index = 0; index < elems.length; index += 1) {
	      arr.push(getValue(elems[index]));
	    }
	    return arr;
	  }
	  return str;
	}
	
	const valueRegex = /[A-Z.a-z]{1,}=.*$/;
	function argParser() {
	  for (let index = 2; index < process.argv.length; index += 1) {
	    const arg = process.argv[index];
	    if (arg.match(valueRegex)) {
	      const varName = arg.split('=', 1)[0];
	      const valueStr = arg.substr(varName.length + 1);
	      global[varName] = getValue(valueStr.trim());
	    }
	  }
	}
	
	global.__basedir = __dirname;
	argParser();
	
});


RequireJS.addFunction('../../public/js/utils/data-sync.js',
function (require, exports, module) {
	

	class DataSync {
	  constructor(idAttr, getById) {
	    let connections = {};
	    let lastValue = {};
	    let idMap = {};
	
	    const getId = (objOid) => !(objOid instanceof Object) ? objOid :
	      ((typeof objOid[idAttr] === 'function' ? objOid[idAttr]() : objOid[idAttr]));
	
	    const getArray = (elems) => !elems ? [] : (elems.length === 1 ? elems[0] : elems);
	
	
	    function makeSyncronous(key,...objOids) {
	      objOids = getArray(objOids);
	      for (let index = 1; index < objOids.length; index += 1) {
	        let id;
	        const obj1Id = getId(objOids[index - 1]);
	        const obj2Id = getId(objOids[index]);
	        idMap[obj1Id] = idMap[obj1Id] || {};
	        idMap[obj2Id] = idMap[obj2Id] || {};
	        if (idMap[obj1Id][key] === undefined) {
	          if (idMap[obj2Id][key] === undefined) {
	            id = String.random();
	          } else {
	            id = idMap[obj2Id][key];
	          }
	        } else { id = idMap[obj1Id][key]; }
	        idMap[obj1Id][key] = id;
	        idMap[obj2Id][key] = id;
	        connections[id] = connections[id] || [];
	        if (connections[id].indexOf(obj1Id) === -1) {
	          connections[id].push(obj1Id)
	        }
	        if (connections[id].indexOf(obj2Id) === -1) {
	          connections[id].push(obj2Id)
	        }
	      }
	    }
	
	    function unSync(key,...objOids) {
	      objOids = getArray(objOids);
	      for (let index = 1; index < objOids.length; index += 1) {
	        const id = getId(objOids[index]);
	        const connId = idMap[id][key];
	        const conns = connections[connId];
	        let tIndex;
	        while ((tIndex = conns.indexOf(id)) !== -1) conns.split(tIndex, 1);
	        delete idMap[id][key];
	      }
	    }
	
	    function update(key, value, objOid) {
	      const id = getId(objOid);
	      if (!idMap[id] || !idMap[id][key]) return;
	      const connId = idMap[id] && idMap[id][key];
	      if (connId === undefined) return;
	      if (lastValue[connId] !== value) {
	        lastValue[connId] = value;
	        const objIds = connections[connId];
	        for (let index = 0; objIds && index < objIds.length; index ++) {
	          const obj = getById(objIds[index]);
	          if (obj !== undefined) obj[key](value);
	        }
	      }
	    }
	
	    function shouldRun(hasRan, validIds, id) {
	      return !hasRan && (validIds === null || validIds.indexOf(id) !== -1);
	    }
	
	    function forEach(func, ...objOids) {
	      objOids = getArray(objOids);
	      let alreadyRan = {};
	      let validIds = objOids === undefined ? null :
	                      objOids.map((objOid) => getId(objOid));
	      let ids = Object.keys(idMap);
	      for (let index = 0; index < ids.length; index += 1) {
	        const id = ids[index];
	        const idKeys = Object.keys(idMap[id]);
	        for (let iIndex = 0; iIndex < idKeys.length; iIndex += 1) {
	          const idKey = idKeys[iIndex];
	          const connectionId = idMap[id][idKey];
	          if (shouldRun(alreadyRan[connectionId], validIds, id)) {
	            const connIds = connections[connectionId];
	            const applicableConnections = [];
	            for (let cIndex = 0; cIndex < connIds.length; cIndex += 1) {
	              if (shouldRun(alreadyRan[connectionId], validIds, id)) {
	                applicableConnections.push(connIds[cIndex]);
	              }
	            }
	            if (applicableConnections.length === 0) throw new Error('This should never happen');
	            func(idKey, applicableConnections);
	            alreadyRan[connectionId] = true;
	          }
	        }
	      }
	    }
	
	    function fromJson(connections) {
	      const keys = Object.keys(connections);
	      keys.forEach((key) => {
	        this.addConnection(key);
	        const groups = connections[key];
	        groups.forEach((group) => {
	          this[`${key}Sync`](group);
	        });
	      });
	    }
	
	
	    function toJson(...objOids) {
	      objOids = getArray(objOids);
	      const connects = {};
	      forEach((key, connections) => {
	        if (connects[key] === undefined) connects[key] = [];
	        connects[key].push(connections);
	      }, ...objOids);
	      return connects;
	    }
	
	    this.addConnection = (key) => {
	      this[`${key}Sync`] = (...objOids) => makeSyncronous(key, ...objOids);
	      this[`${key}UnSync`] = (...objOids) => makeSyncronous(key, ...objOids);
	      this[`${key}Update`] = (value, objOid) => update(key,value, objOid);
	    }
	    this.toJson = toJson;
	    this.fromJson = fromJson;
	  }
	}
	
	module.exports = DataSync;
	
});


RequireJS.addFunction('../../public/js/utils/test/test.js',
function (require, exports, module) {
	

	
	
	
	Error.stackInfo = (steps) => {
	  steps = steps || 1;
	  const err = new Error();
	  const lines = err.stack.split('\n');
	  const match = lines[steps].match(/at (([a-zA-Z\.]*?) |)(.*\.js):([0-9]{1,}):([0-9]{1,})/);;
	  if (match) {
	    return {
	      filename: match[3].replace(/^\(/, ''),
	      function: match[2],
	      line: match[4],
	      character: match[5]
	    }
	  }
	}
	
	Error.reducedStack = (msg, steps) => {
	  steps = steps || 1;
	  const err = new Error();
	  let lines = err.stack.split('\n');
	  lines = lines.splice(steps);
	  return `Error: ${msg}\n${lines.join('\n')}`;
	}
	
	class ArgumentAttributeTest {
	  constructor(argIndex, value, name, errorCode, errorAttribute) {
	    function fail (ts, func, actualErrorCode, args) {
	      ts.fail('AttributeTest Failed: use null if test was supposed to succeed' +
	      `\n\tFunction: '${func.name}'` +
	      `\n\tArgument Index: '${argIndex}'` +
	      `\n\tName: '${name}'` +
	      `\n\tValue: '${value}'` +
	      `\n\tErrorCode: '${actualErrorCode}' !== '${errorCode}'`);
	    }
	
	    this.run = function (ts, func, args, thiz) {
	      thiz = thiz || null;
	      const testArgs = [];
	      for (let index = 0; index < args.length; index += 1) {
	        const obj = args[index];
	        let arg;
	        if (index === argIndex) {
	          if (name) {
	            arg = JSON.parse(JSON.stringify(obj));
	            arg[name] = value;
	          } else {
	            arg = value;
	          }
	        }
	        testArgs.push(arg);
	      }
	      try {
	        func.apply(thiz, testArgs)
	        if (errorCode || errorCode !== null) fail(ts, func, null, arguments);
	      } catch (e) {
	        errorAttribute = errorAttribute || 'errorCode';
	        const actualErrorCode = e[errorAttribute];
	        if (errorCode !== undefined &&
	              (errorCode === null || actualErrorCode !== errorCode))
	          fail(ts, func, actualErrorCode, arguments);
	      }
	    }
	  }
	}
	
	class FunctionArgumentTestError extends Error {
	  constructor(argIndex, errorAttribute) {
	    super();
	    this.message = 'errorCode should be null if no error thrown and undefined if no errorCode';
	    if (argIndex === undefined) {
	      this.message += '\n\targIndex must be defined.';
	    }
	    if (errorAttribute === undefined) {
	      this.message += '\n\terrorAttribute must be defined.';
	    }
	  }
	}
	
	const failureError = new Error('Test Failed');
	
	class FunctionArgumentTest {
	  constructor(ts, func, args, thiz) {
	    if (!(ts instanceof TestStatus))
	      throw new Error('ts must be a valid instance of TestStatus');
	    if ((typeof func) !== 'function')
	      throw new Error("Function must be defined and of type 'function'");
	    if (!Array.isArray(args) || args.length === 0)
	      throw new Error("This is not a suitable test for a function without arguments");
	    const funcArgTests = [];
	    let argIndex, errorCode;
	    let errorAttribute = 'errorCode';
	    this.setIndex = (i) => {argIndex = i; return this;}
	    this.setErrorCode = (ec) => {errorCode = ec; return this;}
	    this.setErrorAttribute = (ea) => {errorAttribute = ea; return this};
	    const hasErrorCode =  errorCode !== undefined;
	    this.run = () => {
	      funcArgTests.forEach((fat) => {
	        fat.run(ts, func, args, thiz);
	      });
	      return this;
	    }
	    this.add = (name, value) =>  {
	      if (errorAttribute === undefined || argIndex === undefined)
	        throw new FunctionArgumentTestError(argIndex, errorAttribute);
	      const at = new ArgumentAttributeTest(argIndex, value, name, errorCode, errorAttribute);
	      funcArgTests.push(at);
	      return this;
	    }
	  }
	}
	
	// ts for short
	class TestStatus {
	  constructor(testName) {
	    let assertT = 0;
	    let assertC = 0;
	    let success = false;
	    let fail = false;
	    let failOnError = true;
	    let instance = this;
	    function printError(msg, stackOffset) {
	      stackOffset = stackOffset || 4;
	      console.error(`%c${Error.reducedStack(msg, stackOffset)}`, 'color: red');
	    }
	    function assert(b) {
	      assertT++;
	      if (b) {
	        assertC++;
	        TestStatus.successAssertions++;
	        return true;
	      }
	      TestStatus.failAssertions++;
	      return false;
	    }
	    function successStr(msg) {
	      console.log(`%c ${testName} - Successfull (${assertC}/${assertT})${
	          msg ? `\n\t\t${msg}` : ''}`, 'color: green');
	    }
	    const possiblyFail = (msg) => failOnError ? instance.fail(msg, 6) : printError(msg, 5);
	
	    this.assertTrue = (b, msg) => !assert(b) &&
	                            possiblyFail(`${msg}\n\t\t'${b}' should be true`);
	    this.assertFalse = (b, msg) => !assert(!b) &&
	                            possiblyFail(`${msg}\n\t\t'${b}' should be false`);
	    this.assertEquals = (a, b, msg) => !assert(a === b) &&
	                            possiblyFail(`${msg}\n\t\t'${a}' === '${b}' should be true`);
	    this.assertNotEquals = (a, b, msg) => !assert(a !== b) &&
	                            possiblyFail(`${msg}\n\t\t'${a}' !== '${b}' should be true`);
	    this.assertTolerance = (n1, n2, tol, msg, stackOffset) => {
	      !assert(Math.abs(n1-n2) < tol) &&
	      possiblyFail(`${msg}\n\t\t${n1} and ${n2} are not within tolerance ${tol}`, stackOffset);
	    }
	    this.fail = (msg, stackOffset) => {
	      fail = true;
	      printError(msg, stackOffset);
	      throw failureError;
	    };
	    this.success = (msg, stackOffset) => (success = true) && successStr(msg, stackOffset);
	  }
	}
	
	TestStatus.successCount = 0;
	TestStatus.failCount = 0;
	TestStatus.successAssertions = 0;
	TestStatus.failAssertions = 0;
	
	const Test = {
	  tests: {},
	  add: (name, func) => {
	    if ((typeof func) === 'function') {
	      if (Test.tests[name] ===  undefined) Test.tests[name] = [];
	      Test.tests[name].push(func);
	    }
	  },
	  run: () => {
	    const testNames = Object.keys(Test.tests);
	    for (let index = 0; index < testNames.length; index += 1) {
	      const testName = testNames[index];
	      try {
	        Test.tests[testName].forEach((testFunc) => testFunc(new TestStatus(testName)));
	        TestStatus.successCount++;
	      } catch (e) {
	        TestStatus.failCount++;
	        if (e !== failureError)
	          console.log(`%c ${e.stack}`, 'color: red')
	      }
	    }
	    const failed = (TestStatus.failCount + TestStatus.failAssertions) > 0;
	    console.log(`\n%c Successfull Tests:${TestStatus.successCount} Successful Assertions: ${TestStatus.successAssertions}`, 'color: green');
	    console.log(`%c Failed Tests:${TestStatus.failCount} Failed Assertions: ${TestStatus.failAssertions}`, !failed ? 'color:green' : 'color: red');
	  }
	}
	
	exports.ArgumentAttributeTest = ArgumentAttributeTest;
	exports.FunctionArgumentTestError = FunctionArgumentTestError;
	exports.FunctionArgumentTest = FunctionArgumentTest;
	exports.TestStatus = TestStatus;
	exports.Test = Test;
	
});


RequireJS.addFunction('../../public/js/utils/collections/collection.js',
function (require, exports, module) {
	

	
	
	class Collection {
	  constructor(members) {
	    const list = [];
	    const instance = this;
	
	    function runForEach(func) {
	      let bool = true;
	      for (let index = 0; index < members.length; index += 1) {
	        bool = func(members[index]) && bool;
	      }
	      return bool;
	    }
	    function refMember(name) {
	      instance[name] = () => {
	        const attrId = list[0][name]();
	        return attrId;
	      }
	    };
	    runForEach(refMember);
	
	    this.options = () => list[0].options() || [];
	    this.cost = () => {
	      let totalCost = 0;
	      list.forEach((el) => totalCost += el.cost());
	      return totalCost;
	    }
	    this.belongs = (el) =>
	      list.length === 0 ||
	        runForEach((member) => el[member]() === list[0][member]());
	
	    this.add = (elem) => {
	      if (!this.belongs(elem)) throw new Error ('Cannot add element that does not belong.');
	      list.push(elem);
	      runForEach(refMember);
	    }
	    this.list = list;
	    this.typeId = () => {
	      let typeId = '';
	      runForEach((member) => typeId += `:${list[0][member]()}`);
	      return typeId;
	    }
	  }
	}
	
	Collection.create = function (members, objs) {
	  let collections = {};
	  for (let index = 0; index < objs.length; index += 1) {
	    let collection = new Collection(members);
	    collection.add(objs[index]);
	    const typeId = collection.typeId();
	    if (collections[typeId] === undefined) {
	      collections[typeId] = collection;
	    } else {
	      collections[typeId].add(objs[index]);
	    }
	  }
	  return Object.values(collections);
	}
	
	module.exports = Collection;
	
	
	
	
	
});


RequireJS.addFunction('../../public/js/utils/lists/expandable-object.js',
function (require, exports, module) {
	

	
	const CustomEvent = require('../custom-error.js');
	const du = require('../dom-utils.js');
	const $t = require('../$t.js');
	const Expandable = require('./expandable');
	
	
	class ExpandableObject extends Expandable {
	  constructor(props) {
	    props.list = props.list || {};
	    let idAttr, mappedObject;
	    if (props.idAttribute) {
	      idAttr = props.idAttribute;
	      mappedObject = props.mappedObject || {}
	    }
	    super(props);
		//TODO: Set aciveKey
	
	    const superRemove = this.remove;
	    this.remove = (key) => {
	      const removed = props.list[key];
	      delete props.list[key];
	      superRemove(removed);
	    }
	
	    function undefinedAttr(attr, object) {
	      if (object === undefined) return attr;
	      let currAttr = attr;
	      let count = 1;
	      while(object[currAttr] !== undefined) {
	        if (object[currAttr] === object) return currAttr;
	        currAttr = `${attr}-${count++}`;
	      }
	      return currAttr;
	    }
	
	    const valOfunc = (obj, attr) => (typeof obj[attr]) === 'function' ? obj[attr]() : obj[attr];
	    this.updateMapped = (obj) => {
	      if (idAttr === undefined) return;
	      obj = obj || props.list[this.activeKey()];
	      if (obj) {
	        const name = undefinedAttr(valOfunc(obj, idAttr), mappedObject);
	        if (name !== obj._EXPAND_LAST_OBJECT_NAME) {
	          mappedObject[name] = mappedObject[obj._EXPAND_LAST_OBJECT_NAME];
	          delete mappedObject[obj._EXPAND_LAST_OBJECT_NAME];
	          obj._EXPAND_LAST_OBJECT_NAME = name;
	        }
	      }
	    }
	    this.getMappedObject = () => mappedObject;
	
	    this.getKey = (values, object) => {
	      if (object && object._EXPAND_KEY === undefined) {
	        object._EXPAND_KEY = String.random();
	        object._EXPAND_LAST_OBJECT_NAME = undefinedAttr(valOfunc(object, idAttr), mappedObject);
	        if (idAttr !== undefined) mappedObject[object._EXPAND_LAST_OBJECT_NAME] = object;
	      }
	      if (!props.dontOpenOnAdd && object) this.activeKey(object._EXPAND_KEY);
	      if (idAttr) this.updateMapped(object);
	      return this.activeKey() || undefined;
	    }
	  }
	}
	module.exports = ExpandableObject
	
});


RequireJS.addFunction('../../public/js/utils/display/catch-all.js',
function (require, exports, module) {
	const du = require('../dom-utils');
	
	class CatchAll {
	  constructor(container) {
	    const instance = this;
	    container = container;
	    let events = Array.from(arguments).splice(1);
	    events = events.length > 0 ? events : CatchAll.allMouseEvents;
	
	    const backdrop = document.createElement('DIV');
	    this.backdrop = backdrop;
	
	    this.hide = () => {
	      backdrop.hidden = true;
	      backdrop.style.zIndex = 0;
	    };
	    this.show = () => {
	      backdrop.hidden = false
	      instance.updateZindex();
	    };
	
	    this.updateZindex = () => setTimeout(() => {
	      if (container) {
	        if (container.style.zIndex === '') {
	          container.style.zIndex = 2;
	        }
	        backdrop.style.zIndex = Number.parseInt(container.style.zIndex) - 1;
	      } else {
	        backdrop.style.zIndex = CatchAll.findHigestZindex() + 1;
	      }
	    }, 200);
	
	    this.on = (eventName, func) => backdrop.addEventListener(eventName, func);
	
	    backdrop.style.position = 'fixed';
	    backdrop.style.backgroundColor = 'transparent';
	
	    // backdrop.style.cursor = 'none';
	    backdrop.style.top = 0;
	    backdrop.style.bottom = 0;
	    backdrop.style.right = 0;
	    backdrop.style.left = 0;
	    const stopPropagation = (e) => e.stopPropagation();
	    events.forEach((eventName) => instance.on(eventName, stopPropagation));
	    CatchAll.container.append(backdrop);
	
	    this.updateZindex();
	    this.hide();
	  }
	}
	
	
	CatchAll.allMouseEvents = ['auxclick', 'click', 'contextmenu', 'dblclick',
	                        'mousedown', 'mouseenter', 'mouseleave', 'mousemove',
	                        'mouseover', 'mouseout', 'mouseup', 'pointerlockchange',
	                        'pointerlockerror', 'select', 'wheel'];
	
	// Ripped off of: https://stackoverflow.com/a/1120068
	CatchAll.findHigestZindex = function () {
	  var elems = document.querySelectorAll('*');
	  var highest = Number.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);
	  for (var i = 0; i < elems.length; i++)
	  {
	    var zindex = Number.parseInt(
	      document.defaultView.getComputedStyle(elems[i], null).getPropertyValue("z-index"),
	      10
	    );
	    if (zindex > highest && zindex !== 2147483647)
	    {
	      highest = zindex;
	    }
	  }
	  return highest;
	}
	
	CatchAll.container = du.create.element('div', {id: 'catch-all-cnt'});
	document.body.append(CatchAll.container);
	
	module.exports = CatchAll;
	
});


RequireJS.addFunction('../../public/js/utils/input/input.js',
function (require, exports, module) {
	

	
	
	
	const $t = require('../$t');
	const du = require('../dom-utils');
	const Lookup = require('../object/lookup')
	/*
	supported attributes: type, placeholder, name, class, value
	label: creates a text label preceeding input.
	clearOnClick: removes value when clicked.
	list: creates a dropdown with list values.
	default: the default value if input is invalid.
	targetAttr: attribute which defines the inputs value.
	format: attribute which defines a function used to format value.
	validation: Accepts
	                Array: value must be included
	                Regex: value must match
	                Function: value is arg1, must return true
	errorMsg: Message that shows when validation fails.
	
	*/
	class Input extends Lookup {
	  constructor(props) {
	    const id = props.id || `input-${String.random(7)}`;
	    super(id);
	    props.hidden = props.hide || false;
	    props.list = props.list || [];
	    this.inline = props.inline;
	    Object.getSet(this, props, 'hidden', 'type', 'label', 'name', 'placeholder',
	                            'class', 'list', 'value');
	
	    const immutableProps = {
	      _IMMUTABLE: true,
	      targetAttr: props.targetAttr || 'value',
	      errorMsg: props.errorMsg || 'Error',
	      errorMsgId: props.errorMsgId || `error-msg-${this.id()}`,
	    }
	    Object.getSet(this, immutableProps)
	
	    this.clone = (properties) => {
	      const json = this.toJson();
	      json.validation = props.validation;
	      delete json.id;
	      delete json.errorMsgId;
	      Object.set(json, properties);
	      return new this.constructor(json);
	    }
	
	    const instance = this;
	    const forAll = Input.forAll(this.id());
	
	    this.hide = () => forAll((elem) => {
	      const cnt = du.find.up('.input-cnt', elem);
	      this.hidden(cnt.hidden = true);
	    });
	    this.show = () => forAll((elem) => {
	      const cnt = du.find.up('.input-cnt', elem);
	      this.hidden(cnt.hidden = false);
	    });
	
	    let valid;
	    let value = props.value;
	
	    const idSelector = `#${this.id()}`;
	
	    const html = this.constructor.html(this);
	    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
	    this.html = () =>
	     html();
	
	    function valuePriority (func) {
	      return (elem, event) => func(elem[instance.targetAttr()], elem, event);
	    }
	    this.attrString = () => Input.attrString(this.targetAttr(), this.value());
	
	    function getElem(id) {return document.getElementById(id);}
	    this.get = () => getElem(this.id());
	
	    this.on = (eventType, func) => du.on.match(eventType, idSelector, valuePriority(func));
	    this.valid = () => this.setValue();
	    function getValue() {
	      const elem = getElem(instance.id());
	      let val = value;
	      if (elem) val = elem[instance.targetAttr()];
	      if (val === undefined) val = props.default;
	      return val;
	    }
	    this.updateDisplay = () => {
	      const elem = getElem(instance.id());
	      if (elem) elem[instance.targetAttr()] = this.value();
	    };
	    this.setValue = (val, force) => {
	      if (val === undefined) val = getValue();
	      if(force || this.validation(val)) {
	        valid = true;
	        value = val;
	        const elem = getElem(instance.id());
	        if (elem) elem.value = value;
	        return true;
	      }
	      valid = false;
	      value = undefined;
	      return false;
	    }
	    this.value = () => {
	      const unformatted = (typeof value === 'function') ? value() : getValue() || '';
	      return (typeof props.format) !== 'function' ? unformatted : props.format(unformatted);
	    }
	    this.doubleCheck = () => {
	      valid = undefined;
	      this.validate();
	      return valid;
	    }
	    this.validation = function(val) {
	      const elem = getElem(instance.id);
	      val = val === undefined && elem ? elem.value : val;
	      if (val === undefined) return false;
	      if (valid !== undefined && val === value) return valid;
	      let valValid = true;
	      if (props.validation instanceof RegExp) {
	        valValid = val.match(props.validation) !== null;
	      }
	      else if ((typeof props.validation) === 'function') {
	        valValid = props.validation.apply(null, arguments);
	      }
	      else if (Array.isArray(props.validation)) {
	        valValid = props.validation.indexOf(val) !== -1;
	      }
	
	      return valValid;
	    };
	
	    this.validate = (target) => {
	      target = target || getElem(instance.id());
	      if (target) {
	        if (this.setValue(target[this.targetAttr()])) {
	          getElem(this.errorMsgId()).hidden = true;
	          valid = true;
	        } else {
	          getElem(this.errorMsgId()).hidden = false;
	          valid = false;
	        }
	      }
	    }
	
	    if (props.clearOnDblClick) {
	      du.on.match(`dblclick`, `#${this.id()}`, () => {
	        const elem = getElem(this.id());
	        if (elem) elem.value = '';
	      });
	    } else if (props.clearOnClick) {
	      du.on.match(`mousedown`, `#${this.id()}`, () => {
	        const elem = getElem(this.id());
	        if (elem) elem.value = '';
	      });
	    }
	  }
	}
	
	function runValidate(elem) {
	  const input = Lookup.get(elem.id);
	  if (input) input.validate(elem);
	}
	
	du.on.match(`change`, `input`, runValidate);
	du.on.match(`keyup`, `input`, runValidate);
	du.on.match(`change`, `select`, runValidate);
	du.on.match(`keyup`, `select`, runValidate);
	
	Input.forAll = (id) => {
	  const idStr = `#${id}`;
	  return (func) => {
	    const elems = document.querySelectorAll(idStr);
	    for (let index = 0; index < elems.length; index += 1) {
	      func(elems[index]);
	    }
	  }
	}
	
	Input.template = new $t('input/input');
	Input.html = (instance) => () => Input.template.render(instance);
	Input.flagAttrs = ['checked', 'selected'];
	Input.attrString = (targetAttr, value) =>{
	  if (Input.flagAttrs.indexOf(targetAttr) !== -1) {
	    return value === true ? targetAttr : '';
	  }
	  return `${targetAttr}='${value}'`
	}
	
	Input.DO_NOT_CLONE = true;
	
	module.exports = Input;
	
});


RequireJS.addFunction('../../public/js/utils/lists/expandable.js',
function (require, exports, module) {
	

	
	const CustomEvent = require('../custom-error.js');
	const du = require('../dom-utils.js');
	const $t = require('../$t.js');
	
	// properties
	//  required: {
	//  getHeader: function returns html header string,
	//  getBody: function returns html body string,
	//}
	//  optional: {
	//  list: list to use, creates on undefined
	//  getObject: function returns new list object default is generic js object,
	//  parentSelector: cssSelector only reqired for refresh function,
	//  listElemLable: nameOfElementType changes add button label,
	//  dontOpenOnAdd: by default the active element will be switched to newly added elements.
	//  hideAddBtn: defaults to false,
	//  startClosed: all tabs are closed on list open.
	//  input: true - require user to enter text before adding new
	//  inputOptions: array of autofill inputs
	//  inputs: [{placeholder, autofill},...]
	//  inputValidation: function to validate input fields
	//  type: defaults to list,
	//  selfCloseTab: defalts to true - allows clicking on header to close body,
	//  findElement: used to find elemenents related to header - defaults to closest
	//}
	class Expandable {
	  constructor(props) {
	    const afterRenderEvent = new CustomEvent('afterRender');
	    const afterAddEvent = new CustomEvent('afterAdd');
	    const afterRefreshEvent = new CustomEvent('afterRefresh');
	    const afterRemovalEvent = new CustomEvent('afterRemoval');
	    const instance = this;
	    const renderBodyOnOpen = props.renderBodyOnOpen === false ? false : true;
	    props.getObject = props.getObject || (() => ({}));
	    props.ERROR_CNT_ID = `expandable-error-msg-cnt-${props.id}`;
	    props.inputTreeId = `expandable-input-tree-cnt-${props.id}`;
	    props.type = props.type || 'list';
	    props.findElement = props.findElement || ((selector, target) =>  du.find.closest(selector, target));
	    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
	    props.getObject = props.getObject || (() => {});
	    props.inputs = props.inputs || [];
	    props.list = props.list || [];
	    // props.list.DO_NOT_CLONE = true;
	    this.hasBody = () => (typeof this.getBody) === 'function';
	    this.getHeader = props.getHeader; delete props.getHeader;
	    this.getBody = props.getBody; delete props.getBody;
	    props.id = Expandable.lists.length;
	    props.activeKey = 0; //TODO ???
	    Object.getSet(this, props, 'listElemLable');
	    let pendingRefresh = false;
	    let lastRefresh = new Date().getTime();
	    const storage = {};
	    Expandable.lists[props.id] = this;
	    this.inputTree = () => props.inputTree;
	
	    this.errorCntId = () => props.ERROR_CNT_ID;
	    function setErrorMsg(msg) {
	        du.id(props.ERROR_CNT_ID).innerHTML = msg;
	    }
	
	    function values() {
	      const values = {};
	      props.inputs.forEach((input) =>
	        values[input.placeholder] = du.id(input.id).value);
	      return values;
	    }
	
	    function getCnt() {
	      return document.querySelector(`.expandable-list[ex-list-id='${props.id}']`);
	    }
	
	    function getBodyCnt() {
	      return du.find.down('.expand-body', getCnt());
	    }
	
	    function getInputCnt() {
	      const cnt = du.find.down('.expand-input-cnt', getCnt());
	      return cnt;
	    }
	    //changes....
	    this.values = values;
	    this.getInputCnt = getInputCnt;
	
	    this.add = (vals) => {
	      const inputValues = vals || values();
	      if ((typeof props.inputValidation) !== 'function' ||
	              props.inputValidation(inputValues) === true) {
	          const obj = props.getObject(inputValues, getInputCnt());
	          const key = this.getKey(vals, obj);
	          props.list[key] = obj;
	          if (!props.dontOpenOnAdd) this.activeKey(key);
	          this.refresh();
	          afterAddEvent.trigger();
	      } else {
	        const errors = props.inputValidation(inputValues);
	        let errorStr;
	        if ((typeof errors) === 'object') {
	          const keys = Object.keys(errors);
	          errorStr = Object.values(errors).join('<br>');
	        } else {
	          errorStr = `Error: ${errors}`;
	        }
	        setErrorMsg(errorStr);
	      }
	    };
	    this.hasInputTree = () =>
	      this.inputTree() && this.inputTree().constructor.name === 'LogicWrapper';
	    if (this.hasInputTree())
	      props.inputTree.onSubmit(this.add);
	    props.hasInputTree = this.hasInputTree;
	
	    this.isSelfClosing = () => props.selfCloseTab;
	    this.remove = (removed) => {
	      afterRemovalEvent.trigger(undefined, removed);
	      this.refresh();
	    }
	    this.html = () =>
	      Expandable[`${instance.type().toCamel()}Template`].render(this);
	    this.afterRender = (func) => afterRenderEvent.on(func);
	    this.afterAdd = (func) => afterAddEvent.on(func);
	    this.afterRemoval = (func) => afterRemovalEvent.on(func);
	    this.refresh = (type) => {
	      this.type((typeof type) === 'string' ? type : props.type);
	      if (!pendingRefresh) {
	        pendingRefresh = true;
	        setTimeout(() => {
	          props.inputs.forEach((input) => input.id = input.id || String.random(7));
	          const parent = document.querySelector(props.parentSelector);
	          const html = this.html();
	          if (parent && html !== undefined) {
	            parent.innerHTML = html;
	            afterRefreshEvent.trigger();
	          }
	          pendingRefresh = false;
	        }, 100);
	      }
	    };
	    this.activeKey = (value) => value === undefined ? props.activeKey : (props.activeKey = value);
	    this.getKey = () => this.list().length;
	    this.active = () => props.list[this.activeKey()];
	    // TODO: figure out why i wrote this and if its neccisary.
	    this.value = (key) => (key2, value) => {
	      if (props.activeKey === undefined) props.activeKey = 0;
	      if (key === undefined) key = props.activeKey;
	      if (storage[key] === undefined) storage[key] = {};
	      if (value === undefined) return storage[key][key2];
	      storage[key][key2] = value;
	    }
	    this.inputHtml = () => this.hasInputTree() ?
	          this.inputTree().payload().html() : Expandable.inputRepeatTemplate.render(this);
	    this.set = (key, value) => props.list[key] = value;
	    this.get = (key) => props.list[key];
	    this.renderBody = (target) => {
	      const headerSelector = `.expand-header[ex-list-id='${props.id}'][key='${this.activeKey()}']`;
	      target = target || document.querySelector(headerSelector);
	      if (target !== null) {
	        const id = target.getAttribute('ex-list-id');
	        const list = Expandable.lists[id];
	        const headers = du.find.up('.expandable-list', target).querySelectorAll('.expand-header');
	        const bodys = du.find.up('.expandable-list', target).querySelectorAll('.expand-body');
	        const rmBtns = du.find.up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
	        headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
	        bodys.forEach((body) => body.style.display = 'none');
	        rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
	        const body = bodys.length === 1 ? bodys[0] : du.find.closest('.expand-body', target);
	        if (this.hasBody()) {
	          body.style.display = 'block';
	        }
	        const key = target.getAttribute('key');
	        this.activeKey(key);
	        if (renderBodyOnOpen) body.innerHTML = this.htmlBody(key);
	        target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
	        target.className += ' active' + (this.hasBody() ? '' : ' no-body');
	        afterRenderEvent.trigger();
	        // du.scroll.intoView(target.parentElement, 3, 25, document.body);
	      }
	    };
	    afterRefreshEvent.on(() => {if (!props.startClosed)this.renderBody()});
	
	    this.htmlBody = (key) => {
	      getBodyCnt().setAttribute('key', key);
	      return this.hasBody() ? this.getBody(this.list()[key], key) : '';
	    }
	    this.list = () => props.list;
	    this.refresh();
	  }
	}
	Expandable.lists = [];
	Expandable.DO_NOT_CLONE = true;
	Expandable.inputRepeatTemplate = new $t('expandable/input-repeat');
	Expandable.listTemplate = new $t('expandable/list');
	Expandable.pillTemplate = new $t('expandable/pill');
	Expandable.sidebarTemplate = new $t('expandable/sidebar');
	Expandable.topAddListTemplate = new $t('expandable/top-add-list');
	Expandable.getIdAndKey = (target, level) => {
	  level ||= 0;
	  const elems = du.find.upAll('.expand-header,.expand-body', target);
	  if (elems.length < level + 1) return undefined;
	  const cnt = elems[level];
	  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
	  const key = cnt.getAttribute('key');
	  return {id, key};
	}
	Expandable.getValueFunc = (target) => {
	  const idKey = Expandable.getIdAndKey(target);
	  return Expandable.lists[idKey.id].value(idKey.key);
	}
	
	Expandable.get = (target, level) => {
	  const idKey = Expandable.getIdAndKey(target, level);
	  if (idKey === undefined) return undefined;
	  return Expandable.lists[idKey.id].get(idKey.key);
	}
	
	Expandable.list = (target) => {
	  const idKey = Expandable.getIdAndKey(target);
	  return Expandable.lists[idKey.id];
	}
	
	Expandable.set = (target, value) => {
	  const idKey = Expandable.getIdAndKey(target);
	  Expandable.lists[idKey.id].set(idKey.key, value);
	}
	
	Expandable.value = (key, value, target) => {
	  return Expandable.getValueFunc(target)(key, value);
	}
	du.on.match('click', '.expandable-list-add-btn', (target) => {
	  const id = target.getAttribute('ex-list-id');
	  Expandable.lists[id].add();
	});
	du.on.match('click', '.expandable-item-rm-btn', (target) => {
	  const id = target.getAttribute('ex-list-id');
	  const key = target.getAttribute('key');
	  Expandable.lists[id].remove(key);
	});
	Expandable.closeAll = (header) => {
	  const hello = 'world';
	}
	
	du.on.match('click', '.expand-header', (target, event) => {
	  const isActive = target.matches('.active');
	  const id = target.getAttribute('ex-list-id');
	  const list = Expandable.lists[id];
	  if (list) {
	    if (isActive && !event.target.tagName.match(/INPUT|SELECT/)) {
	      du.class.remove(target, 'active');
	      du.find.closest('.expand-body', target).style.display = 'none';
	      list.activeKey(null);
	      target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
	    } else if (!isActive) {
	      list.renderBody(target);
	    }
	  }
	});
	
	function getExpandObject(elem) {
	  const exListElem = du.find.up('[ex-list-id]', elem);
	  if (!exListElem) return undefined;
	  const listId = exListElem.getAttribute('ex-list-id');
	  return Expandable.lists[listId];
	}
	
	du.on.match('click', '.input-open-cnt', (target) => {
	  const inputCnts = document.querySelectorAll('.expand-input-cnt');
	  const expandList = getExpandObject(target);
	  if (expandList && !expandList.hasInputTree()) expandList.add();
	  else {
	    const inputOpenCnts = document.querySelectorAll('.input-open-cnt');
	    const closest = du.find.closest('.expand-input-cnt', target);
	    inputCnts.forEach((elem) => elem.hidden = true);
	    inputOpenCnts.forEach((elem) => elem.hidden = false);
	    target.hidden = true;
	    if (closest) closest.hidden = false;
	  }
	});
	
	module.exports = Expandable
	
});


RequireJS.addFunction('../../public/js/utils/display/drag-drop.js',
function (require, exports, module) {
	
const $t = require('../$t');
	const CatchAll = require('./catch-all');
	const du = require('../dom-utils');
	const Resizer = require('./resizer');
	
	class DragDropResize {
	  constructor (props) {
	    props = props || {};
	    const id = Math.floor(Math.random() * 1000000);
	    const POPUP_CNT_ID = 'place-popup-cnt-id-' + id;
	    const POPUP_CONTENT_ID = 'place-popup-content-id-' + id;
	    const POPUP_CONTENT_CNT_ID = 'place-popup-content-cnt-id-' + id;
	    const MAXIMIZE_BTN_ID = 'place-maximize-id-' + id;
	    const POPUP_HEADER_CNT_ID = 'place-header-cnt-id-' + id;
	    const MINIMIZE_BTN_ID = 'place-minimize-id-' + id;
	    const MAX_MIN_CNT_ID = 'place-max-min-id-' + id;
	    const CLOSE_BTN_ID = 'place-close-btn-id-' + id;
	    const MOVE_BTN_ID = 'place-MOVE-btn-id-' + id;
	    const BACK_BTN_ID = 'place-back-btn-id-' + id;
	    const FORWARD_BTN_ID = 'place-forward-btn-id-' + id;
	    const HISTORY_BTN_ID = 'place-history-btn-id-' + id;
	    const position = props.position || 'absolute';
	    const template = new $t('place');
	    let lastMoveEvent, prevLocation, minLocation, selectElem,
	        currElem, hasMoved;
	    const instance = this;
	    const closeFuncs = [];
	
	    let width = props.width || 'fit-content';
	    let height = props.height || 'fit-content';
	    this.getDems = props.getDems || ( () => { return {width, height}; } );
	    this.setDems = props.setDems || ( (w, h) => { width = w; height = h; } );
	
	    this.hasMoved = () => hasMoved;
	    function onResizeEvent() {
	      const rect = popupCnt.getBoundingClientRect();
	      if (!Resizer.isLocked(popupCnt)) instance.setDems({width: rect.width + 'px', height: rect.height + 'px'});
	    }
	
	    const defaultStyle = `position: ${position};`;
	
	    this.close = () => {
	      getPopupElems().cnt.style.display = 'none';
	      Resizer.hide(popupCnt);
	      closeFuncs.forEach((func) => func());
	      middleSize();
	      backdrop.hide();
	      histCnt.hidden = true;
	    }
	    this.hide = this.close;
	
	    this.updateZindex = () => {
	      const highestZ = CatchAll.findHigestZindex();
	      popupCnt.style.zIndex = highestZ + 2;
	      backdrop.backdrop.style.zIndex = highestZ - 1;
	    }
	
	    this.show = () => {
	      if (instance.hidden()) {
	        if (!props.noBackdrop) backdrop.show();
	        updateControls();
	        const css = {display: 'block',
	        height: Resizer.isLocked(popupCnt) ? undefined : instance.getDems().height,
	        width: Resizer.isLocked(popupCnt) ? undefined : instance.getDems().width};
	        if (Number.isFinite(css.height)) css.height = css.height + 'px';
	        if (Number.isFinite(css.width)) css.width = css.width + 'px';
	
	        setCss(css);
	        if (!Resizer.isLocked(popupCnt)) Resizer.show(popupCnt);
	      }
	      this.updateZindex();
	      // updateHistZindex();
	      return instance;
	    };
	
	    this.hidden = () => getPopupElems().cnt.style.display === 'none';
	
	    this.withinPopup = (offset) => {
	      const rect = getPopupElems().cnt.getBoundingClientRect();
	      if (lastMoveEvent) {
	        const withinX = lastMoveEvent.clientX < rect.right - offset && rect.left + offset < lastMoveEvent.clientX;
	        const withinY = lastMoveEvent.clientY < rect.bottom - offset && rect.top + offset < lastMoveEvent.clientY;
	        return withinX && withinY;
	      }
	      return false;
	    }
	
	    function updateHistZindex() {
	      histCnt.style.zIndex = Number.parseInt(popupCnt.style.zIndex) + 1;
	    }
	
	    function getRelitiveRect(elem) {
	      let rect;
	      if (elem instanceof HTMLElement) {
	        rect = elem.getBoundingClientRect();
	      } else if (elem.x !== undefined && elem.y !== undefined) {
	        const x = (typeof elem.x === 'function') ? elem.x() : elem.x;
	        const y = (typeof elem.y === 'function') ? elem.y() : elem.y;
	        return {
	          top: y,
	          bottom: y,
	          right: x,
	          left: x,
	          width: 0,
	          height: 0
	        }
	      } else {
	        rect = {top: 0, bottom: 0, right: 0, left: 0, width: 100, height: 100};
	        console.warn('unknown DragDrops position element:', elem);
	      }
	
	      const absRect = {};
	      const scrollOffset = getScrollOffset();
	      absRect.top = rect.top + scrollOffset.y;
	      absRect.bottom = rect.bottom + scrollOffset.y;
	      absRect.right = rect.right + scrollOffset.x;
	      absRect.left = rect.left + scrollOffset.x;
	      absRect.width = rect.width;
	      absRect.height = rect.height;
	      return absRect
	    }
	
	    this.back = () => setCss(prevLocation);
	
	    function positionOnElement(elem, container) {
	      currElem = elem || currElem;
	      container = container || getPopupElems().cnt;
	      instance.show();
	      let rect = getRelitiveRect(currElem);
	      let popRect = getRelitiveRect(container);
	      let padding = 8;
	
	      let top = `${rect.top}px`;
	      const position = {};
	      position.close = instance.close;
	      position.top = () =>{setCss({top: rect.top - popRect.height - padding + 'px'}, container); return position;};
	      position.bottom = () =>{setCss({top: rect.bottom + padding + 'px'}, container); return position;};
	      position.left = () =>{setCss({left: rect.left - popRect.width - padding + 'px'}, container); return position;};
	      position.right = () =>{setCss({left: rect.right + padding + 'px'}, container); return position;};
	      position.center = () =>{
	              let left = rect.left - (popRect.width / 2) + (rect.width / 2);
	              let top = rect.top - (popRect.height / 2) + (rect.height / 2);
	              setCss({left: left + 'px', top: top + 'px'}, container);
	              return position;};
	      position.inView = () =>{
	        // TODO: Fix or remove
	        let popRect = getRelitiveRect(container || getPopupElems().cnt);
	        const left = (popRect.left > 10 ? popRect.left : 10) + 'px';
	        const right = (popRect.right > 10 ? popRect.right : 10) + 'px';
	        const top = (popRect.top > 10 ? popRect.top : 10) + 'px';
	        const bottom = (popRect.bottom > 10 ? popRect.bottom : 10) + 'px';
	        setCss({left, right, top, bottom}, container);
	        return position;};
	      position.maximize = instance.maximize.bind(position);
	      position.minimize = instance.minimize.bind(position);
	      if (window.innerHeight / 2 > rect.top - window.scrollY) {
	        position.center().bottom().inView();
	      } else {
	        position.center().top().inView();
	      }
	
	      return position;
	    }
	
	    this.position = positionOnElement;
	    this.select = () => {
	      if (window.getSelection().toString().trim()) {
	        selectElem = window.getSelection().getRangeAt(0);
	        currElem = selectElem;
	      }
	      return positionOnElement(selectElem);
	    };
	    this.top = () => setCss({top:0,bottom:''});
	    this.left = () => setCss({right:'',left:0});
	    this.bottom = () => setCss({top:'',bottom:0});
	    this.right = () => setCss({right:0,left:''});
	
	    this.center = function () {
	      const popRect = getPopupElems().cnt.getBoundingClientRect();
	      const top = `${(window.innerHeight / 2) - (popRect.height / 2)}px`;
	      const left = `${(window.innerWidth / 2) - (popRect.width / 2)}px`;
	      setCss({top,left, right: '', bottom: ''});
	      return instance;
	    }
	
	    function showElem(id, show) {
	      popupCnt.hidden = !show;
	    }
	
	    function updateControls() {
	      showElem(MINIMIZE_BTN_ID, !props.hideMin && (isMaximized || props.tabText !== undefined));
	      showElem(MAXIMIZE_BTN_ID, !props.hideMax && !isMaximized());
	      const hasPast = props.hasPast ? props.hasPast() : false;
	      showElem(BACK_BTN_ID, hasPast);
	      const hasFuture = props.hasFuture ? props.hasFuture() : false;
	      showElem(FORWARD_BTN_ID, hasFuture);
	      showElem(HISTORY_BTN_ID, hasFuture || hasPast);
	
	    }
	
	    function middleSize() {
	      if (minLocation) {
	        setCss({position, transform: 'unset', top: 'unset', bottom: 'unset', right: 'unset', left: 'unset', width: instance.getDems().width})
	        setCss(minLocation);
	        showElem(POPUP_HEADER_CNT_ID, false);
	        showElem(POPUP_CONTENT_CNT_ID, true);
	        prevLocation = minLocation;
	        minLocation = undefined;
	        updateControls();
	        return true;
	      }
	      return false;
	    }
	
	    this.maximize = function () {
	      if (!middleSize()) {
	        setCss({position: 'fixed', top: 0, bottom: 0, right: 0, left:0, maxWidth: 'unset', maxHeight: 'unset', width: 'unset', height: '95vh'})
	        minLocation = prevLocation;
	        updateControls();
	      }
	      return this;
	    }
	
	    this.minimize = function () {
	      if (!middleSize() && props.tabText) {
	        console.log('tab-it')
	        tabHeader.innerText = props.tabText();
	        showElem(POPUP_HEADER_CNT_ID, true);
	        showElem(POPUP_CONTENT_CNT_ID, false);
	        setCss({left: 0, right: 0, bottom: 0, maxWidth: 'unset', maxHeight: 'unset', minWidth: 'unset',
	                minHeight: 'unset', width: 'fit-content', height: 'fit-content',
	                transform: 'rotate(90deg)'});
	        minLocation = prevLocation;
	        const rect = popupCnt.getBoundingClientRect();
	        const left = (rect.width - rect.height)/2 + 'px';
	        setCss({left});
	        DragDropResize.events.tabbed.trigger(getPopupElems().cnt);
	      }
	      return this;
	    }
	
	    function setCss(rect, container) {
	      if (container === undefined) {
	        const popRect = getPopupElems().cnt.getBoundingClientRect();
	        const top = getPopupElems().cnt.style.top;
	        const bottom = getPopupElems().cnt.style.bottom;
	        const left = getPopupElems().cnt.style.left;
	        const right = getPopupElems().cnt.style.right;
	        const maxWidth = getPopupElems().cnt.style.maxWidth;
	        const maxHeight = getPopupElems().cnt.style.maxHeight;
	        const width = getPopupElems().cnt.style.width;
	        const height = getPopupElems().cnt.style.height;
	        prevLocation = {top, bottom, left, right, maxWidth, maxHeight, width, height}
	        setTimeout(() => Resizer.position(popupCnt), 0);
	      }
	      du.style(container || getPopupElems().cnt, rect);
	      return instance;
	    }
	    this.setCss = setCss;
	
	    this.onClose = (func) => closeFuncs.push(func);
	
	    function updateContent(html) {
	      du.innerHTML(html, getPopupElems().content);
	      return instance;
	    }
	    this.updateContent = updateContent;
	
	    function isMaximized() {
	      return minLocation !== undefined;
	    }
	    this.isMaximized = isMaximized;
	
	    function getScrollOffset() {
	      let x,y;
	      if (props.position === 'fixed') {
	        y = 0;
	        x = 0;
	      } else {
	        y = window.scrollY;
	        x = window.scrollX;
	      }
	      return {x, y}
	    }
	
	    let moving;
	    function move(e) {
	      console.log('moving!');
	      backdrop.show();
	      Resizer.hide(popupCnt);
	      const rect = popupCnt.getBoundingClientRect();
	      const scrollOffset = getScrollOffset();
	      moving = {clientX: e.clientX + scrollOffset.x,
	                  clientY: e.clientY + scrollOffset.y,
	                  top: rect.top + scrollOffset.y,
	                  left: rect.left + scrollOffset.x};
	      DragDropResize.events.dragstart.trigger(getPopupElems().cnt);
	    }
	
	    function get(name) {
	      const prop = props[name];
	      if ((typeof prop) === 'function') return prop();
	      return prop;
	    }
	
	    function stopMoving() {
	      moving = undefined;
	      backdrop.hide();
	      Resizer.position(popupCnt);
	      DragDropResize.events.dragend.trigger(getPopupElems().cnt);
	      DragDropResize.events.drop.trigger(getPopupElems().cnt);
	      if (!Resizer.isLocked(popupCnt)) Resizer.show(popupCnt);
	    }
	
	    function backdropClick() {
	      if (moving) stopMoving();
	      else instance.close();
	    }
	
	    const tempElem = document.createElement('div');
	    tempElem.append(document.createElement('div'));
	    const tempHtml = template.render({POPUP_CNT_ID, POPUP_CONTENT_ID,
	        MINIMIZE_BTN_ID, MAXIMIZE_BTN_ID, MAX_MIN_CNT_ID, CLOSE_BTN_ID,
	        HISTORY_BTN_ID, FORWARD_BTN_ID, BACK_BTN_ID, MOVE_BTN_ID,
	        POPUP_HEADER_CNT_ID, POPUP_CONTENT_CNT_ID,
	        props});
	    du.innerHTML(tempHtml, tempElem.children[0]);
	    // tempElem.children[0].style = defaultStyle;
	    DragDropResize.container.append(tempElem);
	
	    const popupContent = tempElem.children[0];
	    const popupCnt = tempElem;
	    popupCnt.className = 'drag-drop-popup-cnt';
	    const histCnt = document.createElement('DIV');
	    const tabHeader = du.id(POPUP_HEADER_CNT_ID);
	    if (tabHeader) {
	      tabHeader.onclick = this.maximize;
	    }
	    const histFilter = document.createElement('input');
	    histFilter.placeholder = 'filter';
	    const histDisplayCnt = document.createElement('DIV');
	    histCnt.append(histFilter);
	    histCnt.append(histDisplayCnt);
	    histDisplayCnt.style.maxHeight = '20vh';
	    histDisplayCnt.style.overflow = 'auto';
	    histCnt.style.position = position;
	    histCnt.hidden = true;
	    histCnt.className = 'place-history-cnt';
	    DragDropResize.container.append(histCnt);
	    popupCnt.style = defaultStyle;
	    popupCnt.addEventListener(Resizer.events.resize.name, onResizeEvent);
	    du.on.match('click', `${MAXIMIZE_BTN_ID}`, instance.maximize);
	    du.on.match('click', `${MINIMIZE_BTN_ID}`, instance.minimize);
	    du.on.match('click', `${CLOSE_BTN_ID}`, instance.close);
	    du.on.match('click', `${MOVE_BTN_ID}`, move);
	    // if (props.back) {
	    //   document.getElementById(BACK_BTN_ID).onclick = () => {
	    //     props.back();
	    //     updateControls();
	    //     event.stopPropagation();
	    //     histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
	    //   }
	    // }
	    // if (props.forward) {
	    //   document.getElementById(FORWARD_BTN_ID).onclick = () => {
	    //     props.forward();
	    //     updateControls();
	    //     event.stopPropagation();
	    //     histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
	    //   }
	    // }
	    // if (props.historyDisplay) {
	    //   const historyBtn = document.getElementById(HISTORY_BTN_ID);
	    //   historyBtn.onclick = (event) => {
	    //     histCnt.hidden = false;
	    //     histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
	    //     positionOnElement(historyBtn, histCnt).center().bottom();
	    //     updateHistZindex();
	    //     event.stopPropagation();
	    //   }
	    //   histCnt.onclick = (event) => {
	    //     event.stopPropagation();
	    //   }
	    //   histDisplayCnt.onclick = (event) => {
	    //     event.stopPropagation();
	    //     if ((typeof props.historyClick) === 'function') {
	    //       props.historyClick(event);
	    //       updateControls();
	    //       histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
	    //       histFilter.focus();
	    //     }
	    //   }
	    //   histFilter.onkeyup = () => {
	    //     histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
	    //     histFilter.focus();
	    //   }
	    // }
	
	    popupCnt.onclick = (e) => {
	      histCnt.hidden = true;
	      // if (e.target.tagName !== 'A')
	      // e.stopPropagation()
	    };
	
	    // CssFile.apply('place');
	
	
	    function getPopupElems() {
	      return {cnt: popupCnt, content: popupContent};
	    }
	
	    let lastDragNotification = new Date().getTime()
	    let lastMove = new Date().getTime()
	    function mouseMove(e) {
	      const time = new Date().getTime();
	      const scrollOffset = getScrollOffset();
	      lastMoveEvent = {clientX: e.clientX + scrollOffset.x,
	                      clientY: e.clientY + scrollOffset.y};
	      if (moving && lastMove < time + 100) {
	        console.log('moving')
	        const dy = moving.clientY - lastMoveEvent.clientY;
	        const dx = moving.clientX - lastMoveEvent.clientX;
	        const rect = popupCnt.getBoundingClientRect();
	        popupCnt.style.top = moving.top - dy + 'px';
	        popupCnt.style.left = moving.left - dx + 'px';
	        if (lastDragNotification + 350 < time) {
	          DragDropResize.events.drag.trigger(getPopupElems().cnt);
	          lastDragNotification = time;
	        }
	      }
	    }
	
	    function on(eventName, func) {
	      getPopupElems().content.addEventListener(eventName, func);
	    }
	    this.on = on;
	
	    const cancelFade = du.fade.out(getPopupElems().cnt, 10, instance.close);
	    getPopupElems().cnt.addEventListener('mouseover', cancelFade);
	
	
	    this.container = () => getPopupElems().cnt;
	    this.lockSize = () => Resizer.lock(popupCnt);
	    this.unlockSize = () => Resizer.unlock(popupCnt);
	
	    if (props.resize !== false){
	      Resizer.all(popupCnt, props.position);
	    }
	    const backdrop = new CatchAll(popupCnt);
	    backdrop.on('click', backdropClick);
	    backdrop.on('mousemove', mouseMove);
	
	    Resizer.position(popupCnt);
	  }
	}
	
	DragDropResize.events = {};
	DragDropResize.container = du.create.element('div', {id: 'drag-drop-resize'});
	document.body.append(DragDropResize.container);
	DragDropResize.events.drag = new CustomEvent ('drag');
	DragDropResize.events.dragend = new CustomEvent ('dragend');
	DragDropResize.events.dragstart = new CustomEvent ('dragstart');
	DragDropResize.events.drop = new CustomEvent ('drop');
	DragDropResize.events.tabbed = new CustomEvent ('tabbed');
	
	// drag	An element or text selection is being dragged (fired continuously every 350ms).
	// dragend	A drag operation is being ended (by releasing a mouse button or hitting the escape key).
	// dragstart	The user starts dragging an element or text selection.
	// drop	An element is dropped on a valid drop target.
	
	module.exports = DragDropResize;
	
});


RequireJS.addFunction('../../public/js/utils/input/bind.js',
function (require, exports, module) {
	
const du = require('../dom-utils');
	const Input = require('./input');
	
	const defaultDynamInput = (value, type) => new Input({type, value});
	
	module.exports = function(selector, objOrFunc, props) {
	  let lastInputTime = {};
	  props = props || {};
	  const validations = props.validations || {};
	  const inputs = props.inputs || {};
	
	  const resolveTarget = (elem) => du.find.down('[prop-update]', elem);
	  const getValue = (updatePath, elem) => {
	    const input = Object.pathValue(inputs, updatePath);
	    return input ? input.value() : elem.value;
	  }
	  const getValidation = (updatePath) => {
	    let validation = Object.pathValue(validations, updatePath);
	    const input = Object.pathValue(inputs, updatePath);
	    if (input) {
	      validation = input.validation;
	    }
	    return validation;
	  }
	
	  function update(elem) {
	    const target = resolveTarget(elem);
	    elem = du.find.down('input,select,textarea', elem);
	    const updatePath = elem.getAttribute('prop-update') || elem.getAttribute('name');
	    elem.id = elem.id || String.random(7);
	    const thisInputTime = new Date().getTime();
	    lastInputTime[elem.id] = thisInputTime;
	    setTimeout(() => {
	      if (thisInputTime === lastInputTime[elem.id]) {
	        const validation = getValidation(updatePath);
	        if (updatePath !== null) {
	          const newValue = getValue(updatePath, elem);
	          if ((typeof validation) === 'function' && !validation(newValue)) {
	            console.error('badValue')
	          } else if ((typeof objOrFunc) === 'function') {
	            objOrFunc(updatePath, elem.value, elem);
	          } else {
	            Object.pathValue(objOrFunc, updatePath, elem.value);
	          }
	
	          if (target.tagname !== 'INPUT' && target.children.length === 0) {
	            target.innerHTML = newValue;
	          }
	        }
	      }
	    }, 2000);
	  }
	  const makeDynamic = (target) => {
	    target = resolveTarget(target);
	    if (target.getAttribute('resolved') === null) {
	      target.setAttribute('resolved', 'dynam-input');
	      const value = target.innerText;
	      const type = target.getAttribute('type');
	      const updatePath = target.getAttribute('prop-update') || target.getAttribute('name');
	      const input = Object.pathValue(inputs, updatePath) || defaultDynamInput(value, type);
	
	      target.innerHTML = input.html();
	      const id = (typeof input.id === 'function') ? input.id() : input.id;
	      const inputElem = du.find.down(`#${id}`, target);
	      du.class.add(inputElem, 'dynam-input');
	      inputElem.setAttribute('prop-update', updatePath);
	      inputElem.focus();
	    }
	  }
	
	  du.on.match('keyup', selector, update);
	  du.on.match('change', selector, update);
	  du.on.match('click', selector, makeDynamic);
	}
	
	
	const undoDynamic = (target) => {
	  const parent = du.find.up('[resolved="dynam-input"]', target)
	  parent.innerText = target.value;
	  parent.removeAttribute('resolved');
	}
	
	du.on.match('focusout', '.dynam-input', undoDynamic);
	
});


RequireJS.addFunction('../../public/js/utils/object/lookup.js',
function (require, exports, module) {
	
class Lookup {
	  constructor(id, attr, singleton) {
	    if (id){
	      const decoded = Lookup.decode(id);
	      if (decoded) {
	        id = decoded.id;
	      } else if (id._TYPE !== undefined) {
	        id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
	      }
	    }
	    id = id || String.random();
	    const cxtr = this.constructor;
	    const cxtrHash = cxtr.name;
	    let group;
	    let cxtrAndId = `${cxtrHash}_${id}`
	    if (singleton && cxtr.get(id)) return cxtr.get(id);
	
	    let constructedAt = new Date().getTime();
	    let modificationWindowOpen = true;
	    attr = attr || 'id';
	    Object.getSet(this, attr, Lookup.ID_ATTRIBUTE);
	    this.lookupGroup = (g) => {
	      if (group === undefined && g !== undefined) {
	        if (Lookup.groups[g] === undefined) Lookup.groups[g] = [];
	        group = g;
	        Lookup.groups[g].push(this);
	      }
	      return group;
	    }
	
	    this.release = () => {
	      if (cxtr.reusable === true) {
	        if (Lookup.freeAgents[cxtr.name] === undefined) Lookup.freeAgents[cxtr.name] = [];
	        Lookup.freeAgents[cxtr.name].push(this);
	        const index = Lookup.groups[group] ? Lookup.groups[group].indexOf(this) : -1;
	        if (index !== -1) Lookup.groups[group].splice(index, 1);
	      }
	      delete Lookup.byId[cxtr.name][this[attr]];
	    }
	
	
	    this[Lookup.ID_ATTRIBUTE] = () => attr;
	    this[attr] = (initialValue) => {
	      if (modificationWindowOpen) {
	        if ((typeof initialValue) === "string") {
	          Lookup.byId[cxtr.name][id] = undefined;
	          const decoded = Lookup.decode(initialValue);
	          id = decoded ? decoded.id : initialValue;
	          cxtrAndId = `${cxtrHash}_${id}`
	          Lookup.byId[cxtr.name][id] = this;
	          modificationWindowOpen = false;
	        } else if (constructedAt < new Date().getTime() - 200) {
	          modificationWindowOpen = false;
	        }
	      }
	      return cxtrAndId;
	    }
	
	    function registerConstructor() {
	      if (Lookup.byId[cxtr.name] === undefined) {
	        Lookup.byId[cxtr.name] = {};
	        Lookup.constructorMap[cxtr.name] = cxtr;
	      }
	    }
	
	    function addSelectListFuncToConstructor() {
	      if(cxtr.selectList === Lookup.selectList) {
	        cxtr.get = (id) => Lookup.get(id, cxtr);
	        if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
	        Lookup.byId[cxtr.name] = {};
	        cxtr.selectList = () => Lookup.selectList(cxtr.name);
	      }
	    }
	
	    registerConstructor();
	    addSelectListFuncToConstructor();
	
	
	    Lookup.byId[cxtr.name][id] = this;
	    this.toString = () => this[attr]();
	  }
	}
	
	Lookup.convert = function (obj, attr) {
	  let id = obj.id && obj.id();
	  if (id){
	    const decoded = Lookup.decode(id);
	    if (decoded) {
	      id = decoded.id;
	    } else if (id._TYPE !== undefined) {
	      id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
	    }
	  }
	  id = id || String.random();
	  const cxtr = obj.constructor;
	  const cxtrHash = cxtr.name;
	  let group;
	  let cxtrAndId = `${cxtrHash}_${id}`
	
	  let constructedAt = new Date().getTime();
	  let modificationWindowOpen = true;
	  attr = attr || 'id';
	  Object.getSet(obj);
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
	    delete Lookup.byId[cxtr.name][obj[attr]];
	  }
	
	
	  obj[Lookup.ID_ATTRIBUTE] = () => attr;
	  obj[attr] = (initialValue) => {
	    if (modificationWindowOpen) {
	      if (initialValue) {
	        Lookup.byId[cxtr.name][id] = undefined;
	        const decoded = Lookup.decode(initialValue);
	        id = decoded ? decoded.id : initialValue;
	        cxtrAndId = `${cxtrHash}_${id}`
	        Lookup.byId[cxtr.name][id] = obj;
	        modificationWindowOpen = false;
	      } else if (constructedAt < new Date().getTime() - 200) {
	        modificationWindowOpen = false;
	      }
	    }
	    return cxtrAndId;
	  }
	
	  function registerConstructor() {
	    if (Lookup.byId[cxtr.name] === undefined) {
	      Lookup.byId[cxtr.name] = {};
	      Lookup.constructorMap[cxtr.name] = cxtr;
	    }
	  }
	
	  function addSelectListFuncToConstructor() {
	    if(cxtr.selectList === Lookup.selectList) {
	      cxtr.get = (id) => Lookup.get(id, cxtr);
	      if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
	      Lookup.byId[cxtr.name] = {};
	      cxtr.selectList = () => Lookup.selectList(cxtr.name);
	    }
	  }
	
	  registerConstructor();
	  addSelectListFuncToConstructor();
	
	
	  Lookup.byId[cxtr.name][id] = obj;
	  if (obj.toString === undefined) obj.toString = () => obj[attr]();
	}
	
	Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
	Lookup.byId = {Lookup};
	Lookup.constructorMap = {};
	Lookup.groups = {};
	Lookup.freeAgents = {};
	
	Lookup.get = (id, cxtr) => {
	  cxtr = cxtr || Lookup;
	  const decoded = Lookup.decode(id);
	  let decodedId, decodedCxtr;
	  if (decoded) {
	    decodedId = decoded.id;
	    decodedCxtr = decoded.constructor;
	  }
	  id = decodedId || id;
	  cxtr = cxtr || decodedCxtr;
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
	  if ((typeof id) !== 'string') return;
	  const split = id.split('_');
	  if (split.length === 1) return;
	  return {
	    constructor: Lookup.constructorMap[split[0]],
	    id:  split[1]
	  };
	}
	Lookup.release = (group) => {
	  const groupList = Lookup.groups[group];
	  if (groupList === undefined) return;
	  Lookup.groups[group] = [];
	  for (let index = 0; index < groupList.length; index += 1) {
	    groupList[index].release();
	  }
	}
	
	try {
	  module.exports = Lookup;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/services/function-cache.js',
function (require, exports, module) {
	
const cacheState = {};
	const cacheFuncs = {};
	
	class FunctionCache {
	  constructor(func, context, group, assem) {
	    if ((typeof func) !== 'function') return func;
	    group ||= 'global';
	    let cache = {};
	
	    function cacheFunc() {
	      if (FunctionCache.isOn(group)) {
	        // if (assem.constructor.name === 'DrawerFront') {
	        //   console.log('df mfer');
	        // }
	        let c = cache;
	        for (let index = 0; index < arguments.length; index += 1) {
	          if (c[arguments[index]] === undefined) c[arguments[index]] = {};
	          c = c[arguments[index]];
	        }
	        if (c[arguments[index]] === undefined) c[arguments[index]] = {};
	
	        if (c.__FunctionCache === undefined) {
	          FunctionCache.notCahed++
	          c.__FunctionCache = func.apply(context, arguments);
	        } else FunctionCache.cached++;
	        return c.__FunctionCache;
	      }
	      FunctionCache.notCahed++
	      return func.apply(context, arguments);
	    }
	    cacheFunc.clearCache = () => cache = {};
	    if (cacheFuncs[group] === undefined) cacheFuncs[group] = [];
	    cacheFuncs[group].push(cacheFunc);
	    return cacheFunc;
	  }
	}
	
	FunctionCache.cached = 0;
	FunctionCache.notCahed = 0;
	FunctionCache.on = (group) => {
	  FunctionCache.cached = 0;
	  FunctionCache.notCahed = 0;
	  cacheState[group] = true;
	}
	FunctionCache.off = (group) => {
	  const cached = FunctionCache.cached;
	  const total = FunctionCache.notCahed + cached;
	  const percent = (cached / total) * 100;
	  console.log(`FunctionCache report: ${cached}/${total} %${percent}`);
	  cacheState[group] = false;
	  cacheFuncs[group].forEach((func) => func.clearCache());
	}
	FunctionCache.isOn = (group) => cacheState[group];
	
	module.exports = FunctionCache;
	
});


RequireJS.addFunction('../../public/js/utils/services/state-history.js',
function (require, exports, module) {
	
class StateHistory {
	  constructor(getState, minTimeInterval, states) {
	    states ||= [];
	    let index = 0;
	    minTimeInterval = minTimeInterval || 400;
	    const instance = this;
	    let lastStateReqTime;
	
	
	    const indexHash = () => states[index].hash;
	    this.toString = () => {
	      let str = ''
	      states.forEach((s, i) => i === index ?
	                        str += `(${s.hash}),` :
	                        str += `${s.hash},`);
	      return str.substr(0, str.length - 1);
	    }
	
	    function getNewState(reqTime) {
	      if (reqTime === lastStateReqTime) {
	        const currState = getState();
	        const currHash = JSON.stringify(currState).hash();
	        if (states.length === 0 || currHash !== indexHash()) {
	          if (states && states.length - 1 > index) states = states.slice(0, index + 1);
	          states.push({hash: currHash, json: currState});
	          index = states.length - 1;
	          console.log(instance.toString());
	        }
	      }
	    }
	    if (states.length === 0) getNewState();
	
	    this.index = (i) => {
	      if (i > -1 && i < states.length) index = i;
	      return index;
	    }
	
	    this.clone = (getState) => {
	      const sh = new StateHistory(getState, minTimeInterval, states);
	      sh.index(index);
	      return sh;
	    }
	
	    this.newState = () => {
	      const thisReqTime = new Date().getTime();
	      lastStateReqTime = thisReqTime;
	      setTimeout(() => getNewState(thisReqTime), minTimeInterval);
	    }
	
	    this.forceState = () => {
	      lastStateReqTime = 0;
	      getNewState(0);
	    }
	
	    this.canGoBack = () => index > 0;
	    this.canGoForward = () => index < states.length - 1;
	
	    this.back = () => {
	      if (this.canGoBack()) {
	        const state = states[--index];
	        lastStateReqTime = 0;
	        console.log(this.toString());
	        return state.json;
	      }
	    }
	
	    this.forward = () => {
	      if (this.canGoForward()) {
	        const state = states[++index];
	        lastStateReqTime = 0;
	        console.log(this.toString());
	        return state.json;
	      }
	    }
	  }
	}
	
	module.exports = StateHistory;
	
});


RequireJS.addFunction('../../public/js/utils/lists/expandable-list.js',
function (require, exports, module) {
	

	
	const CustomEvent = require('../custom-error.js');
	const du = require('../dom-utils.js');
	const $t = require('../$t.js');
	const Expandable = require('./expandable');
	
	class ExpandableList extends Expandable {
	  constructor(props) {
	    super(props);
	    const superRemove = this.remove;
	    this.remove = (index) => {
	      superRemove(props.list.splice(index, 1)[0]);
	      this.refresh();
	    }
	  }
	}
	
	module.exports = ExpandableList
	
});


RequireJS.addFunction('../../public/js/utils/display/pop-up.js',
function (require, exports, module) {
	const DragDropResize = require('./drag-drop');
	
	class PopUp {
	  constructor (props) {
	    props = props || {}
	    const instance = this;
	    const htmlFuncs = {};
	    let forceOpen = false;
	    let lockOpen = false;
	    let currFuncs, currElem;
	    let canClose = false;
	
	    const popupCnt = new DragDropResize(props);
	
	    popupCnt.hide();
	
	    this.position = () => popupCnt;
	    this.positionOnElement = popupCnt.position;
	
	
	    this.softClose = () => {
	      if (!lockOpen) {
	        instance.close();
	      }
	    }
	
	    this.close = popupCnt.close;
	
	    this.show = () => {
	      popupCnt.show();
	    };
	
	    function getFunctions(elem) {
	      let foundFuncs;
	      const queryStrs = Object.keys(htmlFuncs);
	      queryStrs.forEach((queryStr) => {
	        if (elem.matches(queryStr)) {
	          if (foundFuncs) {
	            throw new Error('Multiple functions being invoked on one hover event');
	          } else {
	            foundFuncs = htmlFuncs[queryStr];
	          }
	        }
	      });
	      return foundFuncs;
	    }
	
	    function on(queryStr, funcObj) {
	      if (htmlFuncs[queryStr] !== undefined) throw new Error('Assigning multiple functions to the same selector');
	      htmlFuncs[queryStr] = funcObj;
	    }
	    this.on = on;
	
	    this.onClose = popupCnt.onClose;
	
	    function updateContent(html) {
	      popupCnt.updateContent(html);
	      if (currFuncs && currFuncs.after) currFuncs.after();
	      return instance;
	    }
	    this.updateContent = updateContent;
	
	    this.open = (html, positionOn) => {
	      this.updateContent(html);
	      popupCnt.position(positionOn);
	      this.show();
	    }
	
	    this.container = popupCnt.container;
	    this.hasMoved = popupCnt.hasMoved;
	    this.lockSize = popupCnt.lockSize;
	    this.unlockSize = popupCnt.unlockSize;
	
	    document.addEventListener('click', this.forceClose);
	  }
	}
	
	module.exports = PopUp;
	
});


RequireJS.addFunction('../../public/js/utils/display/resizer.js',
function (require, exports, module) {
	const CatchAll = require('./catch-all');
	const du = require('../dom-utils');
	const CustomEvent = require('../custom-event');
	
	class Resizer {
	  constructor (elem, axisObj, cursor) {
	    const instance = this;
	    const minimumSize = 40;
	    let resizeId = elem.getAttribute(Resizer.resizeAttr);
	    let sizeLocked = false;
	
	    if (!resizeId) {
	      resizeId = 'resize-' + Math.floor(Math.random() * 1000000);
	      elem.setAttribute(Resizer.resizeAttr, resizeId);
	    }
	
	    this.show = () => {this.container.hidden = false; this.position()};
	    this.hide = () => this.container.hidden = true;
	
	    function updateZindex(zIndex) {
	      if (instance.container.hidden === false) {
	        instance.container.style.zIndex = zIndex;
	        elem.style.zIndex = zIndex;
	        Resizer.backdrop.updateZindex();
	        instance.position();
	      }
	    }
	    this.updateZindex = updateZindex;
	    elem.addEventListener('click', () => Resizer.updateZindex(elem));
	
	
	    if (resizeId) {
	      if (!Resizer.collections[resizeId]) {
	        Resizer.collections[resizeId] = [];
	      }
	      Resizer.collections[resizeId].push(this);
	    }
	    const padding = 8;
	    let resize = false;
	    let lastPosition;
	    this.getPadding = () => padding;
	
	    const attrs = Object.values(axisObj);
	    const top = attrs.indexOf('top') !== -1;
	    const bottom = attrs.indexOf('bottom') !== -1;
	    const left = attrs.indexOf('left') !== -1;
	    const right = attrs.indexOf('right') !== -1;
	
	    this.container = document.createElement('DIV');
	    this.container.style.cursor = cursor;
	    this.container.style.padding = padding/2 + 'px';
	    this.container.style.position = axisObj.position || 'absolute';
	    this.container.style.backgroundColor = 'transparent';
	    Resizer.container.append(this.container);
	
	    function getComputedSize(element, property) {
	      return Number.parseInt(window.getComputedStyle(element).getPropertyValue(property));
	    }
	
	    function resizeCnt (event) {
	      if (resize) {
	        Resizer.updateZindex(elem);
	        let dy = resize.clientY - event.clientY;
	        let dx = resize.clientX - event.clientX;
	        let minHeight = getComputedSize(elem, 'min-height');
	        let minWidth = getComputedSize(elem, 'min-width');
	        if (axisObj.x) {
	          if (left) dx *= -1;
	          const newWidth = lastPosition.width - dx;
	          if (newWidth > minWidth) {
	            if (left) {
	              elem.style.left = lastPosition.left + dx + 'px';
	            }
	            elem.style.width = newWidth + 'px'
	          }
	        }
	        if (axisObj.y) {
	          if (top) dy *= -1;
	          const newHeight = lastPosition.height - dy;
	          if (newHeight > minHeight) {
	            if (top) {
	              elem.style.top = lastPosition.top + window.scrollY + dy + 'px';
	            }
	            elem.style.height = newHeight + 'px'
	          }
	        }
	      }
	    }
	
	    this.container.onmousedown = (e) => {
	      resize = e;
	      Resizer.backdrop.show();
	      lastPosition = elem.getBoundingClientRect();
	      // e.stopPropagation();
	      // e.preventDefault();
	    }
	
	    function stopResizing() {
	      if (resize) {
	        resize = undefined;
	        Resizer.position(elem);
	        Resizer.backdrop.hide();
	        Resizer.events.resize.trigger(elem);
	      }
	    }
	
	    function isFixed() {
	      return axisObj.position && axisObj.position === 'fixed';
	    }
	
	    // this.container.addEventListener('click',
	    // (e) =>
	    // e.stopPropagation()
	    // );
	    Resizer.backdrop.on('mouseup', stopResizing);
	    this.container.onmouseup = stopResizing;
	
	    this.container.onmousemove = resizeCnt;
	    Resizer.backdrop.on('mousemove', (event) =>
	    resizeCnt(event));
	    this.position = function () {
	      const height = document.documentElement.clientHeight;
	      const width = document.documentElement.clientWidth;
	      const rect = elem.getBoundingClientRect();
	      const cntStyle = instance.container.style;
	      const scrollY =  isFixed() ? 0 : window.scrollY;
	      const scrollX =  isFixed() ? 0 : window.scrollX;
	      if (top) {
	        cntStyle.top = rect.top - padding + scrollY + 'px';
	      } else if (!bottom) {
	        cntStyle.top = rect.top + scrollY + 'px';
	      }
	
	      if (bottom) {
	        cntStyle.bottom = (height - rect.bottom) - padding - scrollY + 'px';
	      } else if (!top) {
	        cntStyle.bottom = (height - rect.bottom) - scrollY + 'px';
	      }
	
	      if (right) {
	        cntStyle.right = (width - rect.right) - padding - scrollX + 'px';
	      } else if (!left) {
	        cntStyle.right = (width - rect.right) - scrollX + 'px';
	      }
	
	      if (left) {
	        cntStyle.left = rect.left - padding + scrollX + 'px';
	      } else if (!right) {
	        cntStyle.left = rect.left + scrollX + 'px';
	      }
	    }
	  }
	}
	
	Resizer.container = du.create.element('div', {id: 'resizer-cnt'});
	document.body.append(Resizer.container);
	
	Resizer.lastZindexSearch = new Date().getTime();
	Resizer.zIndex = (zindex) => {
	  const time = new Date().getTime();
	  if (time > Resizer.lastZindexSearch + 500) {
	    Resizer.zed = CatchAll.findHigestZindex();
	    lastZindexSearch = time;
	  }
	  return Resizer.zed;
	}
	Resizer.container.id = 'resize-id-id';
	// Resizer.container.addEventListener('click', (e) => e.stopPropagation());
	Resizer.events = {};
	Resizer.events.resize = new CustomEvent ('resized')
	
	Resizer.backdrop = new CatchAll();
	
	Resizer.resizeAttr = 'resizer-id'
	Resizer.collections = {};
	Resizer.position = function (elem) {
	  const resizeId = elem.getAttribute(Resizer.resizeAttr);
	  const collection = Resizer.collections[resizeId];
	  if (collection) {
	    collection.forEach((item) => item.position());
	  }
	}
	Resizer.onEach = function (elem, func) {
	  const callArgs = Array.from(arguments).splice(2);
	  const resizeId = elem.getAttribute(Resizer.resizeAttr);
	  const collection = Resizer.collections[resizeId];
	  if (collection) {
	    collection.forEach((item) => item[func](...callArgs));
	  }
	}
	Resizer.hide = (elem) => Resizer.onEach(elem, 'hide');
	Resizer.show = (elem) => {
	    if (!Resizer.isLocked(elem)) {
	      Resizer.onEach(elem, 'show');
	      Resizer.updateZindex(elem);
	    }
	};
	Resizer.updateZindex = (elem, callback) => {
	  const highestZIndex = Resizer.zIndex() - 3;
	  if (!elem.style.zIndex ||
	      (elem.style.zIndex.match(/[0-9]{1,}/) &&
	        highestZIndex > Number.parseInt(elem.style.zIndex))) {
	    Resizer.onEach(elem, 'updateZindex', highestZIndex + 4);
	  }
	}
	
	{
	  const locked = {};
	  Resizer.lock = (elem) => locked[elem.getAttribute(Resizer.resizeAttr)] = true;
	  Resizer.unlock = (elem) => locked[elem.getAttribute(Resizer.resizeAttr)] = false;
	  Resizer.isLocked  = (elem) => locked[elem.getAttribute(Resizer.resizeAttr)];
	}
	
	Resizer.all = (elem, position) => {
	  new Resizer(elem, {y: 'top', position}, 'n-resize');
	  new Resizer(elem, {y: 'bottom', position}, 's-resize');
	  new Resizer(elem, {x: 'right', position}, 'e-resize');
	  new Resizer(elem, {x: 'left', position}, 'w-resize', position);
	  new Resizer(elem, {x: 'right', y: 'top', position}, 'ne-resize');
	  new Resizer(elem, {x: 'left', y: 'top', position}, 'nw-resize');
	  new Resizer(elem, {x: 'right', y: 'bottom', position}, 'se-resize');
	  new Resizer(elem, {x: 'left', y: 'bottom', position}, 'sw-resize');
	}
	
	module.exports = Resizer;
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/logic-tree.js',
function (require, exports, module) {
	

	// breakfast) Branch
	//   food) Multiselect
	//     bacon) Leaf
	//     eggs) Select
	//       2) Select
	//         over easy) Leaf
	//         sunny side up) Leaf
	//         scramble) Leaf
	//         fried) Leaf
	//       3) Select
	//         over easy) Leaf
	//         sunny side up) Leaf
	//         scramble) Leaf
	//         fried) Leaf
	//       6) Select
	//         over easy) Leaf
	//         sunny side up) Leaf
	//         scramble) Leaf
	//         fried) Leaf
	//     toast) Select
	//       white) Leaf
	//       wheat) Leaf
	//       texas) Leaf
	//     cereal) Branch
	//       milk) Leaf
	//       type) Select
	//         raisin brand) Leaf
	//         cheerios) Leaf
	//         life) Leaf
	//   dishes) Branch
	//     plate) Leaf
	//     fork) Leaf
	//     having cereal) Conditional
	//       bowl) Leaf
	//       spoon) Leaf
	
	
	const Test = require('../test.js').Test;
	const LogicTree = require('../../logic-tree');
	
	class ReferenceableFuctions {
	  constructor(id) {
	    id = id._TYPE === undefined ? id : id.id;
	    Object.getSet(this, {id});
	    this.condition = (tree) => {
	      if (id === 1) {
	        return tree.reachable('bacon') || tree.reachable('eggs');
	      } else if (id === 2) {
	        return tree.reachable('cereal');
	      }
	    }
	    this.LOGIC_TYPE = 'Conditional';
	    this.clone = () => new ReferenceableFuctions(id);
	  }
	}
	console.log(new ReferenceableFuctions(1).toJson())
	function createTree(connectEggs, optional, shouldCopy, testFuncs) {
	  const tree = new LogicTree(String.random());
	
	  function runTestFunc(name) {
	    if (testFuncs && testFuncs[name]) {
	      testFuncs[name](tree, name);
	    }
	  }
	
	  const branch = tree.branch('breakfast');
	  const food = branch.multiselect('food');
	  food.optional(optional);
	  food.leaf('bacon', {cost: 1});
	  const eggs = food.select('eggs');
	  const two = eggs.select(2, {multiplier: 2});
	  eggs.optional(optional);
	  two.optional(optional);
	  two.leaf('over easy', {cost: 1.8});
	  two.leaf('sunny side up', {cost: 2.6});
	  two.leaf('scramble', {cost: 3.2});
	  two.leaf('fried', {cost: 1.3});
	  runTestFunc('onlyOne');
	  const three = eggs.select(3, {multiplier: 3}).addChildren('2');
	  runTestFunc('now2');
	  const six = eggs.select(6, {multiplier: 6}).addChildren('2');
	  runTestFunc('now3');
	  const toast = food.select('toast');
	  three.optional(optional);
	  six.optional(optional);
	  toast.optional(optional);
	  toast.leaf('white', {cost: 1.01});
	  toast.leaf('wheat', {cost: 1.24});
	  toast.leaf('texas', {cost: 1.17});
	  const cereal = food.branch('cereal');
	  cereal.leaf('milk', {cost: 8.99});
	  const type = cereal.select('type');
	  type.optional(optional);
	  type.leaf('raisin brand', {cost: -0.55});
	  type.leaf('cheerios', {cost: 1.58});
	  type.leaf('life', {cost: 1.23});
	
	  const dishes = branch.branch('dishes');
	  const needPlate = dishes.conditional('need plate', new ReferenceableFuctions(1));
	  needPlate.leaf('plate', {cost: .14});
	  needPlate.leaf('fork', {cost: .07});
	  const havingCereal = dishes.conditional('having cereal', new ReferenceableFuctions(2));
	  havingCereal.leaf('bowl', {cost: .18});
	  havingCereal.leaf('spoon', {cost: .06});
	  runTestFunc('all');
	
	  if (connectEggs) {
	    two.valueSync(three);
	    two.defaultSync(six);
	  }
	  return shouldCopy ? copy(tree) : tree;
	}
	
	function copy(origTree) {
	    const treeJson = origTree.toJson();
	    return Object.fromJson(treeJson);
	}
	
	function testIsComplete(ts) {
	  return (tree, isComplete) => ts.assertTrue(isComplete === tree.isComplete());
	}
	
	function access(index, returnValue, testFuncs, tree) {
	  const func = testFuncs[index];
	  if ((typeof func === 'function')) {
	    func(tree, returnValue);
	  }
	}
	
	function accessProcess(ts, testFuncs, optional, shouldCopy) {
	  let tree = createTree(true, optional, shouldCopy);
	  access('init', tree, testFuncs, tree);
	  access('dontEat2', tree.setChoice('food', null), testFuncs, tree);
	  if (optional)
	    access('dontEat', tree.setChoice('food', {}), testFuncs, tree);
	
	  access('bacon', tree.setChoice('food', {bacon: true}), testFuncs, tree);
	
	  access('toast', tree.setChoice('food', {toast: true}), testFuncs, tree);
	  access('chooseToast', tree.setChoice('toast', 'white'), testFuncs, tree);
	
	  access('chooseCereal', tree.setChoice('type', 'life'), testFuncs, tree);
	  access('cereal', tree.setChoice('food', {cereal: true}), testFuncs, tree);
	
	  access('eggs', tree.setChoice('food', {eggs: true}), testFuncs, tree);
	  access('2', tree.setChoice('eggs', '2'), testFuncs, tree);
	  access('2value', tree.setChoice('2', 'scramble'), testFuncs, tree);
	  if (optional)
	    access('2NoValue', tree.setChoice('2', null), testFuncs, tree);
	  access('2valueAgain', tree.setChoice('2', 'scramble'), testFuncs, tree);
	  access('2default', tree.setDefault('2', 'fried'), testFuncs, tree);
	  access('3', tree.setChoice('eggs', '3'), testFuncs, tree);
	  access('6', tree.setChoice('eggs', '6'), testFuncs, tree);
	
	
	  access('all', tree.setChoice('food', {eggs: true, bacon: true, toast: true, cereal: true}), testFuncs, tree);
	  return tree;
	}
	
	function LogicTest(tree, ts) {
	  const properStructure = "breakfast) Branch\n  food) Multiselect\n    bacon) Leaf\n    eggs) Select\n      2) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      3) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      6) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n    toast) Select\n      white) Leaf\n      wheat) Leaf\n      texas) Leaf\n    cereal) Branch\n      milk) Leaf\n      type) Select\n        raisin brand) Leaf\n        cheerios) Leaf\n        life) Leaf\n  dishes) Branch\n    need plate) Conditional\n      plate) Leaf\n      fork) Leaf\n    having cereal) Conditional\n      bowl) Leaf\n      spoon) Leaf\n";
	  ts.assertEquals(tree.structure(), properStructure);
	  ts.success();
	}
	
	function decisionsTest(ts, copy) {
	  function validateDecisions (tree, ...names) {
	    if (tree.decisions().length !== names.length) {
	      console.log('badd!')
	    }
	    const decisions = tree.decisions();
	    ts.assertEquals(decisions.length, names.length);
	    const decisionNames = decisions.map((elem) => elem.name);
	    for (let index = 0; index < names.length; index += 1) {
	      ts.assertNotEquals(decisionNames.indexOf(names[index]) === -1);
	    }
	  }
	
	  const testFuncs = {
	    init: (tree) => validateDecisions(tree, 'food'),
	    dontEat: (tree) => validateDecisions(tree, 'food'),
	
	    bacon: (tree) => validateDecisions(tree, 'food'),
	
	    toast: (tree) => validateDecisions(tree, 'food', 'toast'),
	    chooseToast: (tree) => validateDecisions(tree, 'food', 'toast'),
	
	    chooseCereal: (tree) => validateDecisions(tree, 'food', 'toast'),
	    cereal: (tree) => validateDecisions(tree, 'food', 'having cereal'),
	
	    eggs: (tree) => validateDecisions(tree, 'food', 'eggs'),
	    "2": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	    "2value": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	    "2NoValue": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	    "2valueAgain": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	    "2default": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	    "3": (tree) => validateDecisions(tree, 'food', 'eggs', '3'),
	    "6": (tree) => validateDecisions(tree, 'food', 'eggs', '6'),
	
	    all: (tree) => validateDecisions(tree, 'food', 'eggs', '6', 'having cereal', 'toast')
	  }
	  accessProcess(ts, testFuncs, undefined, copy);
	  ts.success();
	}
	
	function optionalTest(ts, shouldCopy) {
	  const tic = testIsComplete(ts);
	  const testFuncs = {
	    init: (tree) => tic(tree, true),
	    dontEat: (tree) =>  tic(tree, true),
	    dontEat2: (tree) =>  tic(tree, true),
	    bacon: (tree) =>  tic(tree, true),
	    toast: (tree) =>  tic(tree, true),
	    chooseToast: (tree) =>  tic(tree, true),
	    chooseCereal: (tree) =>  tic(tree, true),
	    cereal: (tree) =>  tic(tree, true),
	    eggs: (tree) =>  tic(tree, true),
	    "2": (tree) =>  tic(tree, true),
	    "2value": (tree) =>  tic(tree, true),
	    "2NoValue": (tree) =>  tic(tree, true),
	    "2valueAgain": (tree) =>  tic(tree, true),
	    "2default": (tree) =>  tic(tree, true),
	    "3": (tree) =>  tic(tree, true),
	    "6": (tree) =>  tic(tree, true),
	    all: (tree) =>  tic(tree, true),
	  }
	  accessProcess(ts, testFuncs, true, shouldCopy);
	  ts.success();
	}
	
	function notOptionalTest(ts, shouldCopy) {
	  const tic = testIsComplete(ts);
	  const testFuncs = {
	    init: (tree) => tic(tree, false),
	    dontEat: (tree) =>  tic(tree, false),
	    dontEat2: (tree) =>  tic(tree, false),
	    bacon: (tree) =>  tic(tree, true),
	    toast: (tree) =>  tic(tree, false),
	    chooseToast: (tree) =>  tic(tree, true),
	    chooseCereal: (tree) =>  tic(tree, true),
	    cereal: (tree) =>  tic(tree, true),
	    eggs: (tree) =>  tic(tree, false),
	    "2": (tree) =>  tic(tree, false),
	    "2value": (tree) =>  tic(tree, true),
	    "2NoValue": (tree) =>  tic(tree, false),
	    "2valueAgain": (tree) =>  tic(tree, true),
	    "2default": (tree) =>  tic(tree, true),
	    "3": (tree) =>  tic(tree, true),
	    "6": (tree) =>  tic(tree, true),
	    all: (tree) =>  tic(tree, true),
	  }
	  accessProcess(ts, testFuncs, false, shouldCopy);
	  ts.success();
	}
	
	function instanceCountTest(ts, shouldCopy) {
	  const instanceCountCorrect = (tree, countObj, stage) => {
	    Object.keys(countObj).forEach((name) =>
	      ts.assertEquals(countObj[name], tree.node.instanceCount(name),
	          `@stage=${stage} name=${name} incorrect instance count shouldCopy=${shouldCopy}`)
	    );
	  }
	
	  function instanceCountObj(count, obj, two, three, six) {
	    obj['over easy'] = count;
	    obj['sunny side up'] = count;
	    obj['scramble'] = count;
	    obj['fried'] = count;
	    obj['2'] = two;
	    obj['3'] = three;
	    obj['6'] = six;
	    return obj;
	  }
	  const food = 1;
	  const eggs = 1;
	  const two = 1;
	  const three = 1;
	  const six = 1;
	  const toast = 1
	  const white = 1;
	  const wheat = 1;
	  const texas = 1;
	  const milk = 1;
	  const type = 1;
	  const cheerios = 1;
	  const life = 1;
	  const onlyOneObj = instanceCountObj(1, {food, eggs}, 1, 0, 0);
	  const now2Obj = instanceCountObj(2, {food, eggs}, 1, 1, 0);
	  const now3Obj = instanceCountObj(3, {food, eggs}, 1, 1, 1);
	  const allObj = instanceCountObj(3, {food,eggs,toast,white,wheat,texas,milk,type,cheerios,life}, 1, 1, 1);
	  const testFuncs = {
	    onlyOne: (tree, stage) =>  instanceCountCorrect(tree, onlyOneObj, stage),
	    now2: (tree, stage) =>  instanceCountCorrect(tree, now2Obj, stage),
	    now3: (tree, stage) =>  instanceCountCorrect(tree, now3Obj, stage),
	    all: (tree, stage) =>  instanceCountCorrect(tree, allObj, stage),
	  }
	  createTree(undefined, undefined, shouldCopy, testFuncs)
	  ts.success();
	}
	
	function forPathTest(ts, shouldCopy) {
	    function verifyCost(choices, expectedCost) {
	      const tree = createTree(undefined, undefined, shouldCopy);
	      const keys = Object.keys(choices);
	      keys.forEach((key) => tree.setChoice(key, choices[key]));
	      const data = tree.forPath((wrapper, cost) => {
	        cost = cost || 0;
	        const payload = wrapper.payload();
	        if (payload.cost) cost += payload.cost;
	        if (payload.multiplier) cost *= payload.multiplier;
	        return cost;
	      });
	      let total = 0;
	      data.forEach((cost) => total += cost);
	      ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
	    }
	
	    verifyCost({food: {bacon: true}}, 1.21)
	    verifyCost({food: {bacon: false, eggs: false, cereal:true},
	                type: 'life'}, 10.46);
	    verifyCost({food: {bacon: true, eggs: true},
	                eggs: '2', '2': 'fried'}, 2.51)
	    verifyCost({food: {bacon: true, eggs: false, cereal:true},
	                eggs: '2', '2': 'fried', type: 'life'}, 11.67);
	    verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
	                eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 15.51);
	    ts.success();
	}
	
	function forPathReverseTest(ts, shouldCopy) {
	      function verifyCost(choices, expectedCost) {
	        const tree = createTree(true, undefined, shouldCopy);
	        const keys = Object.keys(choices);
	        keys.forEach((key) => tree.setChoice(key, choices[key]));
	        const data = tree.forPath((wrapper, cost) => {
	          cost = cost || 0;
	          const payload = wrapper.payload();
	          if (payload.cost) cost += payload.cost;
	          if (payload.multiplier) cost *= payload.multiplier;
	          return cost;
	        }, true);
	        let total = 0;
	        data.forEach((cost) => total += cost);
	        ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
	      }
	
	      verifyCost({food: {bacon: true}}, 1.21)
	      verifyCost({food: {bacon: false, eggs: false, cereal:true},
	                  type: 'life'}, 10.46);
	      verifyCost({food: {bacon: true, eggs: true},
	                  eggs: '2', '2': 'fried'}, 3.81)
	      verifyCost({food: {bacon: true, eggs: true},
	                  eggs: '3', '2': 'fried'}, 5.11)
	      verifyCost({food: {bacon: true, eggs: true},
	                  eggs: '6', '2': 'fried'}, 1.21)
	      verifyCost({food: {bacon: true, eggs: true},
	                  eggs: '6', '6': 'scramble'}, 20.41)
	      verifyCost({food: {bacon: true, eggs: false, cereal:true},
	                  eggs: '2', '2': 'fried', type: 'life'}, 11.67);
	      verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
	                  eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 28.51);
	      ts.success();
	}
	
	function leavesTest(ts, shouldCopy) {
	      function verifyCost(choices, expectedCost) {
	        const tree = createTree(undefined, undefined, true);
	        const keys = Object.keys(choices);
	        keys.forEach((key) => tree.setChoice(key, choices[key]));
	        let total = 0;
	        tree.leaves().forEach((wrapper) => {
	          const payload = wrapper.payload();
	          if (payload.cost) total += payload.cost;
	        });
	        ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
	      }
	
	      verifyCost({food: {bacon: true}}, 1.21)
	      verifyCost({food: {bacon: false, eggs: false, cereal:true},
	                  type: 'life'}, 10.46);
	      verifyCost({food: {bacon: true, eggs: true},
	                  eggs: '2', '2': 'fried'}, 2.51)
	      verifyCost({food: {bacon: true, eggs: false, cereal:true},
	                  eggs: '2', '2': 'fried', type: 'life'}, 11.67);
	      verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
	                  eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 15.51);
	      ts.success();
	}
	
	function getNodeByPathTest(ts, shouldCopy) {
	  const tree = createTree(undefined, undefined, shouldCopy)
	
	  const fried2 = tree.root().node.next('food').next('eggs').next('2').next('fried');
	  const fried3 = tree.root().node.next('food').next('eggs').next('3').next('fried');
	  const fried6 = tree.root().node.next('food').next('eggs').next('6').next('fried');
	
	  const friedBy2 = tree.node.getNodeByPath('food', 'eggs', '2', 'fried');
	  const friedBy3 = tree.node.getNodeByPath('food', 'eggs', '3', 'fried');
	  const friedBy6 = tree.node.getNodeByPath('food', 'eggs', '6', 'fried');
	
	  ts.assertEquals(fried2, friedBy2);
	  ts.assertEquals(fried3, friedBy3);
	  ts.assertEquals(fried6, friedBy6);
	
	  ts.assertNotEquals(fried2, friedBy3);
	  ts.assertNotEquals(fried2, friedBy6);
	  ts.assertNotEquals(fried3, friedBy2);
	  ts.assertNotEquals(fried3, friedBy6);
	  ts.assertNotEquals(fried6, friedBy2);
	  ts.assertNotEquals(fried6, friedBy3);
	
	  ts.success();
	}
	
	function removeTest(ts, shouldCopy) {
	    const tree = createTree(null, null, shouldCopy);
	    function checkNodeCounts(tree, nodeCounts) {
	      Object.keys(nodeCounts).forEach((key) =>
	          ts.assertEquals(nodeCounts[key], tree.node.instanceCount(key),
	            `RemoveTest Failed: incorrect instance count for ${key}`));
	    }
	    function nodeCounts(overwrites, eggTypeCount, nuke) {
	      overwrites = overwrites || {};
	      function overVal(id, def) {
	        return overwrites[id] !== undefined ? overwrites[id] :
	                                (nuke !== undefined ? nuke : def);
	      }
	      return {
	        food: overVal("food", 1),
	        eggs: overVal("eggs", 1),
	        '2': overVal("2", 1),
	        '3': overVal("3", 1),
	        '6': overVal("6", 1),
	        toast: overVal("toast", 1),
	        white: overVal("white", 1),
	        wheat: overVal("wheat", 1),
	        texas: overVal("texas", 1),
	        milk: overVal("milk", 1),
	        type: overVal("type", 1),
	        cheerios: overVal("cheerios", 1),
	        life: overVal("life", 1),
	
	        scramble: overVal("scramble", eggTypeCount || 3),
	        fried: overVal("fried", eggTypeCount || 3),
	        "sunny side up": overVal("sunny side up", eggTypeCount || 3),
	        "over easy": overVal("over easy", eggTypeCount || 3)
	      }
	    }
	
	    try {
	      tree.node.addState('food', {hello: 'world'});
	      ts.fail();
	    } catch (e) {}
	
	    checkNodeCounts(tree, nodeCounts());
	    tree.node.getNodeByPath('food', 'eggs', '3', 'fried').remove();
	    checkNodeCounts(tree, nodeCounts({fried: 2}));
	    tree.node.getNodeByPath('food', 'eggs', '3').remove();
	    checkNodeCounts(tree, nodeCounts({'3': 0}, 2))
	    tree.node.getNodeByPath('food', 'eggs', '2').remove();
	    checkNodeCounts(tree, nodeCounts({'3': 0, '2': 0}, 1))
	    tree.node.getNodeByPath('food').remove();
	    checkNodeCounts(tree, nodeCounts(undefined, undefined, 0));
	    ts.assertEquals(tree.node.instanceCount('dishes'), 1);
	
	    const msg = 'hello world';
	    const payload = {msg};
	    tree.node.addState('food', payload);
	    tree.node.then('food');
	    const food = tree.node.getNodeByPath('food');
	    ts.assertEquals(Object.keys(food.payload()).length, 2);
	    ts.assertEquals(food.payload().msg, msg);
	
	    ts.success();
	}
	
	function attachTreeTest(ts) {
	  const orderTree = createTree();
	  const origLeaves = orderTree.node.leaves();
	  let leaveCount = origLeaves.length;
	  const drinkTree = new LogicTree(String.random());
	
	  const type = drinkTree.select('drink type');
	  type.select('alcholic').leaf('beer');
	  type.select('non alcholic').leaf('soda');
	  orderTree.attachTree(drinkTree);
	  let newLeaves = orderTree.node.leaves();
	  ts.assertEquals(leaveCount + 2, newLeaves.length)
	  leaveCount = newLeaves.length;
	
	  const eggs = orderTree.getByPath('food', 'eggs');
	  const nonAlcholic = orderTree.getByPath('drink type', 'non alcholic');
	  nonAlcholic.attachTree(eggs);
	  newLeaves = orderTree.node.leaves();
	  ts.assertEquals(leaveCount + 12, newLeaves.length)
	  leaveCount = newLeaves.length;
	
	  const milk = orderTree.getByPath('food', 'cereal', 'milk');
	  nonAlcholic.attachTree(milk);
	  newLeaves = orderTree.node.leaves();
	  ts.assertEquals(leaveCount + 1, newLeaves.length)
	
	  milk.attachTree(nonAlcholic);
	
	  ts.success();
	}
	
	Test.add('LogicTree structure', (ts) => {
	  LogicTest(createTree(), ts);
	});
	Test.add('LogicTree structure (copy)', (ts) => {
	  LogicTest(createTree(undefined, undefined, true), ts);
	});
	
	Test.add('LogicTree getNodeByPath', (ts) => {
	  getNodeByPathTest(ts);
	});
	Test.add('LogicTree getNodeByPath (copy)', (ts) => {
	  getNodeByPathTest(ts, true);
	});
	
	Test.add('LogicTree remove', (ts) => {
	  removeTest(ts);
	});
	Test.add('LogicTree remove (copy)', (ts) => {
	  removeTest(ts, true);
	});
	
	Test.add('LogicTree decisions', (ts) => {
	  decisionsTest(ts);
	});
	Test.add('LogicTree decisions (copy)', (ts) => {
	  decisionsTest(ts, true);
	});
	
	Test.add('LogicTree isComplete (optional)', (ts) => {
	  optionalTest(ts);
	});
	Test.add('LogicTree isComplete (optional & copy)', (ts) => {
	  optionalTest(ts,true);
	});
	
	Test.add('LogicTree isComplete (!optional)', (ts) => {
	  notOptionalTest(ts);
	});
	Test.add('LogicTree isComplete (!optional & copy)', (ts) => {
	  notOptionalTest(ts, true);
	});
	
	Test.add('LogicTree forPath (forward)', (ts) => {
	  forPathTest(ts);
	});
	Test.add('LogicTree forPath (forward & copy)', (ts) => {
	  forPathTest(ts, true);
	});
	
	Test.add('LogicTree forPath (reverse)', (ts) => {
	  forPathReverseTest(ts);
	});
	Test.add('LogicTree forPath (reverse & copy)', (ts) => {
	  forPathReverseTest(ts, true);
	});
	
	Test.add('LogicTree leaves', (ts) => {
	  leavesTest(ts);
	});
	Test.add('LogicTree leaves (copy)', (ts) => {
	  leavesTest(ts, true);
	});
	
	Test.add('LogicTree instanceCount', (ts) => {
	  instanceCountTest(ts);
	});
	Test.add('LogicTree instanceCount (copy)', (ts) => {
	  instanceCountTest(ts, true);
	});
	
	Test.add('LogicTree attachTree', (ts) => {
	  attachTreeTest(ts);
	});
	Test.add('LogicTree attachTree (copy)', (ts) => {
	  attachTreeTest(ts, true);
	});
	
	Test.add('LogicTree change', (ts) => {
	  let tree = createTree();
	  const food = tree.getByPath('food');
	  const needPlate = tree.getByPath('dishes', 'need plate');
	  food.node.change('needPlate');
	  ts.success();
	});
	
	
	// Test.add('LogicTree ', (ts) => {
	//   function validateDecisions (tree, ...names) {
	//     const decisions = tree.decisions();
	//     ts.assertEquals(decisions.length, names.length);
	//     const decisionNames = decisions.map((elem) => elem.name);
	//     for (let index = 0; index < names.length; index += 1) {
	//       ts.assertNotEquals(decisionNames.indexOf(names[index]) === -1);
	//     }
	//   }
	//
	//   const testFuncs = {
	//     init: (tree) => ,
	//     dontEat: (tree) => ,
	//
	//     bacon: (tree) => ,
	//
	//     toast: (tree) => ,
	//     chooseToast: (tree) => ,
	//
	//     chooseCereal: (tree) => ,
	//     cereal: (tree) => ,
	//
	//     eggs: (tree) => ,
	//     "2": (tree) => ,
	//     "2value": (tree) => ,
	//     "2NoValue": (tree) => ,
	//     "2valueAgain": (tree) => ,
	//     "2default": (tree) => ,
	//     "6": (tree) => ,
	//
	//     all: (tree) =>
	//   }
	//   accessProcess(ts, testFuncs);
	//   ts.success();
	// });
	
});


RequireJS.addFunction('../../public/js/utils/input/decision/decision.js',
function (require, exports, module) {
	

	
	
	
	const DecisionTree = require('../../decision-tree.js');
	const LogicTree = require('../../logic-tree.js');
	const LogicWrapper = LogicTree.LogicWrapper
	const Input = require('../input.js');
	const du = require('../../dom-utils');
	const $t = require('../../$t');
	
	const ROOT_CLASS = 'decision-input-tree';
	
	function isComplete(wrapper) {
	  return wrapper.isComplete() && DecisionInputTree.validate(wrapper)
	}
	
	class ValueCondition {
	  constructor(name, accepted, payload) {
	    Object.getSet(this, {name, accepted});
	    this.payload = payload;
	    this.condition = (wrapper) => {
	        let value;
	        wrapper.root().node.forEach((node) => {
	          node.payload().inputArray.forEach((input) => {
	            if (input.name() === name) value = input.value();
	          });
	        });
	        if (Array.isArray(accepted)) {
	          for (let index = 0; index < accepted.length; index +=1) {
	            if (value === accepted[index]) return true;
	          }
	          return false;
	        }
	        return value === accepted;
	    }
	  }
	}
	
	class DecisionInput {
	  constructor(name, inputArrayOinstance, tree, isRoot) {
	    Object.getSet(this, 'name', 'id', 'childCntId', 'inputArray', 'class', 'condition');
	    this.clone = () => this;
	
	    this.tree = () => tree;
	    if (inputArrayOinstance instanceof ValueCondition) {
	      this.condition = inputArrayOinstance.condition;
	      this.isConditional = true;
	      inputArrayOinstance = inputArrayOinstance.payload;
	    }
	    if (inputArrayOinstance !== undefined){
	      this.name = name;
	      this.id = `decision-input-node-${String.random()}`;
	      this.childCntId = `decision-child-ctn-${String.random()}`
	      this.values = tree.values;
	      this.onComplete = tree.onComplete;
	      this.onChange = tree.onChange;
	      this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance, this.values);
	      this.class =  ROOT_CLASS;
	      this.getValue = (index) => this.inputArray[index].value();
	      this.validate = () => DecisionInputTree.validateInput(inputArrayOinstance, this.values);
	    }
	
	    const getWrapper = (wrapperOid) => wrapperOid instanceof LogicWrapper ?
	        wrapperOid : (LogicWrapper.get(wrapperId) || this.root());
	
	    this.branch = (wrapperId, inputs) =>
	            get(wrapperId).branch(String.random(), new DecisionInput(name));
	    this.conditional = (wrapperId, inputs, name, selector) =>
	            get(wrapperId).conditional(String.random(), new DecisionInput(name, relation, formula));
	
	    this.update = tree.update;
	    this.addValues = (values) => {
	      this.inputArray.forEach((input) => values[input.name()] = input.value())
	    }
	
	    this.reachable = () => {
	      const nodeId = this._nodeId;
	      const wrapper = LogicWrapper.get(nodeId);
	      return wrapper.reachable();
	    }
	    this.isValid = () => {
	      let valid = true;
	      this.inputArray.forEach((input) =>
	            valid = valid && input.valid());
	      return valid;
	    }
	    this.isRoot = () => isRoot;
	
	    this.html = (parentCalling) => {
	      if (this.isRoot() && parentCalling !== true) return tree.html();
	      return DecisionInput.template.render(this);
	    }
	    this.treeHtml = (wrapper) => tree.html(wrapper);
	  }
	}
	DecisionInput.template = new $t('input/decision/decision');
	
	
	// properties
	// optional :
	// noSubmission: /[0-9]{1,}/ delay that determins how often a submission will be processed
	// buttonText: determins the text displayed on submit button;
	
	class DecisionInputTree extends LogicTree {
	  constructor(onComplete, props) {
	    const decisionInputs = [];
	    props = props || {};
	    const tree = {};
	
	    tree.buttonText = () => {
	      return props.buttonText || `Create ${root.node.name}`;
	    }
	
	    let disabled;
	    tree.disableButton = (d, elem) => {
	      disabled = d === null || d === true || d === false ? d : disabled;
	      if (elem) {
	        const button = du.find.closest(`button`, elem);
	        if (button) {
	          button.disabled = disabled === null ? !isComplete(root) : disabled;
	        }
	      }
	    }
	
	    function superArgument(onComplete) {
	      const formatPayload = (name, payload) => {
	        decisionInputs.push(new DecisionInput(name, payload, tree, decisionInputs.length === 0));
	        return decisionInputs[decisionInputs.length - 1];
	      }
	      if (onComplete && onComplete._TYPE === 'DecisionInputTree') {
	        onComplete.formatPayload = formatPayload;
	        return onComplete;
	      }
	      return formatPayload;
	    }
	
	    super(superArgument(onComplete));
	    const root = this;
	
	    const onCompletion = [];
	    const onChange = [];
	    const onSubmit = [];
	    tree.html = (wrapper) => {
	      wrapper = wrapper || root;
	      let inputHtml = '';
	      wrapper.forAll((wrapper) => {
	        inputHtml += wrapper.payload().html(true);
	      });
	      const scope = {wrapper, inputHtml, DecisionInputTree, tree};
	      if (wrapper === root) {
	        return DecisionInputTree.template.render(scope);
	      }
	      return inputHtml;
	    };
	
	
	    this.onComplete = (func) => {
	      if ((typeof func) === 'function') onCompletion.push(func);
	    }
	    this.onChange = (func) => {
	      if ((typeof func) === 'function') onChange.push(func);
	    }
	    this.onSubmit = (func) => {
	      if ((typeof func) === 'function') onSubmit.push(func);
	    }
	
	    this.values = () => {
	      const values = {};
	      root.forEach((wrapper) => {
	        wrapper.payload().addValues(values);
	      });
	      return values;
	    }
	    tree.values = root.values;
	    tree.hideButton = props.noSubmission;
	
	    let completionPending = false;
	    this.completed = () => {
	      if (!root.isComplete()) return false;
	      const delay = props.noSubmission || 0;
	      if (!completionPending) {
	        completionPending = true;
	        setTimeout(() => {
	          const values = tree.values();
	          onCompletion.forEach((func) => func(values, this))
	          completionPending = false;
	        }, delay);
	      }
	      return true;
	    }
	
	    let submissionPending = false;
	    this.submit = () => {
	      const delay = props.noSubmission || 0;
	      if (!submissionPending) {
	        submissionPending = true;
	        setTimeout(() => {
	          const values = tree.values();
	          if (!root.isComplete()) return false;
	          onSubmit.forEach((func) => func(values, this))
	          submissionPending = false;
	        }, delay);
	      }
	      return true;
	    }
	
	    let changePending = false;
	    this.changed = (elem) => {
	      const delay = props.noSubmission || 0;
	      if (!changePending) {
	        changePending = true;
	        setTimeout(() => {
	          const values = tree.values();
	          onChange.forEach((func) => func(values, this, elem))
	          changePending = false;
	        }, delay);
	      }
	      return true;
	    }
	
	    this.onComplete(onComplete);
	
	    return this;
	  }
	}
	
	DecisionInputTree.ValueCondition = ValueCondition;
	
	DecisionInputTree.class = 'decision-input-tree';
	DecisionInputTree.buttonClass = 'decision-input-tree-submit';
	
	DecisionInputTree.validate = (wrapper) => {
	  let valid = true;
	  wrapper.forEach((wrapper) => {
	    valid = valid && wrapper.payload().isValid();
	  });
	  return valid;
	}
	
	DecisionInputTree.update = (soft) =>
	  (elem) => {
	    const cnt = du.find.closest('[node-id]', elem);
	    const parent = cnt.parentElement;
	    const nodeId = cnt.getAttribute('node-id');
	    const wrapper = LogicWrapper.get(nodeId);
	    console.log(isComplete(wrapper));
	    if(!soft) {
	      du.find.downAll('.decision-input-cnt', parent).forEach((e) => e.hidden = true)
	      wrapper.forEach((n) => {
	        let selector = `[node-id='${n.nodeId()}']`;
	        elem = du.find.down(selector, parent);
	        if (elem) elem.hidden = false;
	      });
	      wrapper.root().changed();
	      wrapper.root().completed()
	    }
	    wrapper.payload().tree().disableButton(undefined, elem);
	  };
	
	DecisionInputTree.submit = (elem) => {
	  const wrapper = LogicWrapper.get(elem.getAttribute('root-id'));
	  wrapper.submit();
	}
	
	du.on.match('keyup', `.${ROOT_CLASS}`, DecisionInputTree.update(true));
	du.on.match('change', `.${ROOT_CLASS}`, DecisionInputTree.update());
	du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);
	
	
	DecisionInputTree.DO_NOT_CLONE = true;
	DecisionInputTree.validateInput = (inputArrayOinstance, valuesFunc) => {
	  if (Array.isArray(inputArrayOinstance)) {
	    inputArrayOinstance.forEach((instance) => {
	      instance.childCntId = `decision-child-ctn-${String.random()}`
	    });
	    return inputArrayOinstance;
	  }
	  inputArrayOinstance.childCntId = `decision-child-ctn-${String.random()}`
	  return [inputArrayOinstance];
	}
	
	DecisionInputTree.template = new $t('input/decision/decisionTree');
	
	module.exports = DecisionInputTree;
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/decision-tree.js',
function (require, exports, module) {
	

	// branch structure
	//
	// style
	//   solid
	//     isInset:false
	//     material
	//       mdf
	//         cost
	//         profile
	//       soft maple
	//         cost
	//         profile
	//       walnut
	//         cost
	//         profile
	//       alder
	//         cost
	//         profile
	//   panel
	//     isInset:true
	//     profile
	//       shaker
	//         mdfCore
	//           soft maple
	//         nonMdfCore
	//           soft maple
	//           walnut
	//           alder
	//
	// isInset (type===Inset)
	//   magnet
	
	const Test = require('../test.js').Test;
	const DecisionTree = require('../../decision-tree');
	const states = {};
	
	states[5] = {descriptor: 'style'}
	states[6] = {descriptor: 'solid'}
	states[7] = {descriptor: 'isInset=false'}
	states[8] = {descriptor: 'material'}
	states[9] = {descriptor: 'mdf'}
	states[10] = {descriptor: 'cost'}
	states[11] = {descriptor: 'profile'}
	states[12] = {descriptor: 'soft maple'}
	states[13] = {descriptor: 'cost'}
	states[14] = {descriptor: 'profile'}
	states[15] = {descriptor: 'walnut'}
	states[16] = {descriptor: 'cost'}
	states[17] = {descriptor: 'profile'}
	states[18] = {descriptor: 'alder'}
	states[19] = {descriptor: 'cost'}
	states[20] = {descriptor: 'profile'}
	states[21] = {descriptor: 'panel'}
	states[22] = {descriptor: 'isInset=true'}
	states[23] = {descriptor: 'profile'}
	states[24] = {descriptor: 'shaker'}
	states[25] = {descriptor: 'mdfCore'}
	states[26] = {descriptor: 'soft maple'}
	states[27] = {descriptor: 'nonMdfCore'}
	states[28] = {descriptor: 'soft maple'}
	states[29] = {descriptor: 'walnut'}
	states[30] = {descriptor: 'alder'}
	
	states[32] = {descriptor: 'isInset (type===Inset)'}
	states[33] = {descriptor: 'magnet'}
	
	const dNode = new DecisionTree('root', {_UNIQUE_NAME_GROUP: 'tester'});
	const dNode2 = new DecisionTree('root2', {_UNIQUE_NAME_GROUP: 'tester'});
	const dNode3 = new DecisionTree('root3', {_UNIQUE_NAME_GROUP: 'testerr'});
	const statess = dNode.addStates(states);
	const style = dNode.then(5);
	const solid = style.then(6);
	const material = solid.then([7,8])[1];
	const materials = material.then([9,12,15,18]);
	materials[0].then([10,11]);
	materials[1].then([13,14]);
	materials[2].then([16,17]);
	materials[3].then([19,20]);
	
	
	const panel = style.then(21);
	panel.then(22);
	const profile = panel.then(23);
	const shaker = profile.then(24);
	shaker.then(25).then(26);
	const nonMdfCore = shaker.then(27);
	nonMdfCore.then([28,29,30]);
	
	dNode.then(32).then(33);
	const func = (node) => node.payload().descriptor !== 'cost';
	const subtree = style.subtree({'21': '23', '27': /29|30/, '9': func});
	
	
	Test.add('DecisionTree Subtree',(ts) => {
	  const kept = ['5','6','7','8','9','11','12','13','14','15','16','17',
	                '18','19','20','21','23','24','25','26','27','29','30'];
	  const ignored = ['10','22', '28','32','33','root'];
	  const errors = {
	    '10': 'Function condition did not work',
	    '28': 'Regular expression condition did not work',
	    '22': 'String condition did not work.',
	    '32': 'Subtree is including parents',
	    '33': 'Subtree is including parents',
	    'root': 'Subtree is including parents',
	    'default': 'This should not happen I would check the modification history of this test file.'
	  }
	  let nodeCount = 0;
	  subtree.forEach((node) => {
	    const errorMsg = errors[node.name] || errors.default;
	    ts.assertNotEquals(kept.indexOf(node.name), -1, errorMsg);
	    nodeCount++;
	  });
	  ts.assertEquals(nodeCount, 23, 'Subtree does not include all the nodes it should');
	  ts.success();
	});
	
	Test.add('DecisionTree Leaves', (ts) => {
	  const leaves = subtree.leaves();
	  ts.assertEquals(leaves.length, 11, 'Not plucking all the leaves');
	  ts.assertEquals(dNode.leaves().length, 15, 'Not plucking all the leaves');
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/measurement.js',
function (require, exports, module) {
	

	
	
	const Input = require('../input');
	const $t = require('../../$t');
	const Measurement = require('../../measurement');
	
	class MeasurementInput extends Input {
	  constructor(props) {
	    let value = new Measurement(props.value, true);
	    props.value = () => value;
	    super(props);
	    props.validation = (val) =>
	        !Number.isNaN(val && val.display ? value : new Measurement(val).value());
	    props.errorMsg = 'Invalid Mathematical Expression';
	    this.value = () => {
	      return value.display();
	    }
	    const parentSetVal = this.setValue;
	    this.setValue = (val) => {
	      let newVal = props.validation(val) ? ((val instanceof Measurement) ?
	                        val : new Measurement(val, true)) : value;
	      const updated = newVal !== value;
	      value = newVal;
	      return updated;
	    }
	  }
	}
	
	MeasurementInput.template = new $t('input/measurement');
	MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);
	
	
	module.exports = MeasurementInput;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/select.js',
function (require, exports, module) {
	

	
	
	
	const Input = require('../input');
	const $t = require('../../$t');
	
	class Select extends Input {
	  constructor(props) {
	    super(props);
	    const isArray = Array.isArray(props.list);
	    let value;
	    if (isArray) {
	      value = props.index && props.list[props.index] ?
	      props.list[props.index] : props.list[0];
	      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
	    } else {
	      const key = Object.keys(props.list)[0];
	      value = props.value || key;
	    }
	    props.value = undefined;
	    this.setValue(value);
	    this.isArray = () => isArray;
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.selected = (value) => value === this.value();
	  }
	}
	
	Select.template = new $t('input/select');
	Select.html = (instance) => () => Select.template.render(instance);
	
	module.exports = Select;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/select/relation.js',
function (require, exports, module) {
	

	
	const StringMathEvaluator = require('../../../string-math-evaluator.js');
	const Select = require('../select.js');
	
	class RelationInput {
	  constructor(name, searchFunc) {
	    if (RelationInput.relationsObjs[name] !== undefined) throw new Error('Relation Inputs must have a unique name.');
	    this.eval = function(list, value) {
	      let minDiff = Number.MAX_SAFE_INTEGER;
	      let winner;
	
	      if (!Array.isArray(list)) return undefined;
	      for(let index = 0; index < list.length; index += 1) {
	        const evalVal = this.constructor.evaluator.eval(list[index]);
	        const diff =  searchFunc(value, evalVal);
	        if (diff >= 0 && diff < minDiff) {
	          minDiff = diff;
	          winner = index;
	        }
	      }
	      return winner;
	    };
	    RelationInput.relationsObjs[RelationInput.toPascalCase(name)] = this;
	    RelationInput.relations.push(name);
	    RelationInput.relations
	        .sort((a, b) => a.length > b.length ? 1 : -1);
	  }
	}
	
	RelationInput.relationsObjs = {};
	RelationInput.relations = [];
	RelationInput.toPascalCase = (str) => new String(str).replace(/ /g, '_').toUpperCase();
	
	RelationInput.evaluator = new StringMathEvaluator(Math);
	RelationInput.eval = (name, list, value) => {
	  const relation = RelationInput.relationsObjs[RelationInput.toPascalCase(name)];
	  return relation ? relation.eval(list, value) : undefined;
	}
	
	new RelationInput('Equal', (a, b) => a !== b ? -1 : 0);
	new RelationInput('Greater Than', (a, b) => a >= b ? -1 : b - a);
	new RelationInput('Greater Than Or Equal', (a, b) => a > b ? -1 : b - a);
	new RelationInput('Less Than', (a, b) => a <= b ? -1 : a - b);
	new RelationInput('Less Than Or Equal', (a, b) => a < b ? -1 : a - b);
	
	RelationInput.selector = new Select({name: 'relation',
	                            value: 'Equal',
	                            list: RelationInput.relations,
	                            label: 'Auto Select Relation'});
	
	module.exports = RelationInput;
	
	
	
	
	
});


RequireJS.addFunction('./generated/html-templates.js',
function (require, exports, module) {
	
exports['101748844'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` </span>`
	
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
	
	exports['443122713'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("section").prototype.constructor.name) +
			`' ` +
			$t.clean(get("opening").constructorId === get("section").name ? 'selected' : '') +
			`> ` +
			$t.clean(get("clean")(get("section").name)) +
			` </option>`
	
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
	
	exports['714657883'] = (get, $t) => 
			`<div >` +
			$t.clean(get("groupHtml")(get("group"))) +
			`</div>`
	
	exports['987967094'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("property").name()) +
			`</label> <input class='transparent' type='radio' name='UNIT2' prop-radio-update='` +
			$t.clean(get("property").id()) +
			`' value="` +
			$t.clean(get("property").name()) +
			`" ` +
			$t.clean(get("property").value() === true ? 'checked' : '') +
			`> </span>`
	
	exports['990870856'] = (get, $t) => 
			`<div class='inline' > <h3>` +
			$t.clean(get("assem").objId) +
			`</h3> <div> ` +
			$t.clean(get("getFeatureDisplay")(get("assem"))) +
			` </div> </div>`
	
	exports['1036581066'] = (get, $t) => 
			`<div class='tab' > ` +
			$t.clean(get("property").name()) +
			` (` +
			$t.clean(get("property").code()) +
			`) </div>`
	
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
	
	exports['1447370576'] = (get, $t) => 
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
			`'> ` +
			$t.clean(get("getBody") && get("getBody")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
	exports['1753942820'] = (get, $t) => 
			`<div class='model-label` +
			$t.clean(get("tdm").isTarget("part-name", get("partName")) ? " active" : "") +
			`' > <label type='part-name'>` +
			$t.clean(get("partName")) +
			`</label> <input type='checkbox' class='part-name-checkbox' part-name='` +
			$t.clean(get("partName")) +
			`' ` +
			$t.clean(!get("tdm").hidePartName(get("partName")) ? 'checked' : '') +
			`> ` +
			$t.clean( new $t('-1523801133').render(get("partList"), 'part', get)) +
			` </div>`
	
	exports['1835219150'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("isArray")() ? get("value") : get("key")) +
			`' ` +
			$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
			`> ` +
			$t.clean(get("value")) +
			` </option>`
	
	exports['1927703609'] = (get, $t) => 
			`<div > ` +
			$t.clean(get("recurse")(get("key"), get("group"))) +
			` </div>`
	
	exports['2055573719'] = (get, $t) => 
			`<div > ` +
			$t.clean(get("CostManager").headHtml(get("child"))) +
			` ` +
			$t.clean(get("CostManager").bodyHtml(get("child"))) +
			` </div>`
	
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
			$t.clean( new $t('987967094').render(get("UNITS"), 'property', get)) +
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
			`'> <label>Name</label> <input class='value-2d' member='object' type="text" key="name" value="` +
			$t.clean(get("target").parent().name()) +
			`"> <br><br> <label>Width</label> <input class='value-2d' memeber='cabinet' type="text" key="width" value="` +
			$t.clean(get("display")(get("target").object().width())) +
			`"> <br> <label>Depth</label> <input class='value-2d' memeber='cabinet' type="text" key="thickness" value="` +
			$t.clean(get("display")(get("target").object().height())) +
			`"> <br> <label>Angle</label> <input class='value-2d' memeber='snap' type="text" convert='false' key="angle" value="` +
			$t.clean(get("target").object().angle()) +
			`"> <br> <label>X</label> <input class='value-2d' memeber='snap' type="text" key="x" value="` +
			$t.clean(get("display")(get("target").object().x())) +
			`"> <br> <label>Y</label> <input class='value-2d' memeber='snap' type="text" key="y" value="` +
			$t.clean(get("display")(get("target").object().y())) +
			`"> <br> <button class='remove-btn-2d transparent'>Remove</button> </div> `
	
	exports['2d/pop-up/vertex-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <table> <tr> <td><label>X</label></td> <td><input class='value-2d' key='x' value='` +
			$t.clean(get("display")(get("target").x())) +
			`'></td> </tr> <tr> <td><label>Y</label></td> <td><input class='value-2d' key='y' value='` +
			$t.clean(get("display")(get("target").y())) +
			`'></td> </tr> <tr> <td colspan="2"><button class='remove-btn-2d transparent'>Remove</button></td> </tr> <tr> </table> </div> `
	
	exports['cabinet/body'] = (get, $t) => 
			`<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` +
			$t.clean( new $t('-970877277').render(get("showTypes"), 'showType', get)) +
			` </select> </div> <div class='property-id-container center inline-flex'>` +
			$t.clean(get("selectHtml")) +
			`</div> <div class='right'> <select class="show-right-select"> ` +
			$t.clean( new $t('-970877277').render(get("showTypes"), 'showType', get)) +
			` </select> <label>Show Right</label> </div> </div> <br> <div class='center'> <button class='save-cabinet-btn' index='` +
			$t.clean(get("$index")) +
			`'>Save</button> </div> ` +
			$t.clean( new $t('-1702305177').render(get("cabinet").openings, 'opening', get)) +
			` </div> `
	
	exports['-970877277'] = (get, $t) => 
			`<option >` +
			$t.clean(get("showType").name) +
			`</option>`
	
	exports['-1702305177'] = (get, $t) => 
			`<div class='divison-section-cnt'> ` +
			$t.clean(get("OpenSectionDisplay").html(get("opening"))) +
			` </div>`
	
	exports['2d/pop-up/wall-2d'] = (get, $t) => 
			`<div type-2d='` +
			$t.clean(get("target").constructor.name) +
			`' id='` +
			$t.clean(get("target").id()) +
			`' x='` +
			$t.clean(get("lastImagePoint").x) +
			`' y='` +
			$t.clean(get("lastImagePoint").y) +
			`'> <button class='add-door-btn-2d transparent'>Add Door</button> <button class='add-window-btn-2d transparent'>Add Window</button> <button class='add-vertex-btn-2d transparent'>Add Vertex</button> <button class='add-object-btn-2d transparent'>Add Object</button> <button class='remove-btn-2d transparent'>Remove</button> </div> `
	
	exports['cabinet/head'] = (get, $t) => 
			`<div class='cabinet-header' cabinet-id='` +
			$t.clean(get("cabinet").uniqueId()) +
			`'> ` +
			$t.clean(get("$index")) +
			`) <input class='cabinet-id-input' prop-update='` +
			$t.clean(get("$index")) +
			`.name' index='` +
			$t.clean(get("$index")) +
			`' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("cabinet").name()) +
			`'> Size: <div class='cabinet-dem-cnt' cabinet-id='` +
			$t.clean(get("cabinet").uniqueId()) +
			`'> <label>W:</label> <input class='cabinet-input dem' prop-update='` +
			$t.clean(get("$index")) +
			`.width' name='width' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("displayValue")(get("cabinet").width())) +
			`'> <label>H:</label> <input class='cabinet-input dem' prop-update='` +
			$t.clean(get("$index")) +
			`.length' name='length' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("displayValue")(get("cabinet").length())) +
			`'> <label>D:</label> <input class='cabinet-input dem' prop-update='` +
			$t.clean(get("$index")) +
			`.thickness' name='thickness' display-id='` +
			$t.clean(get("displayId")) +
			`' value='` +
			$t.clean(get("displayValue")(get("cabinet").thickness())) +
			`'> </div> </div> `
	
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
	
	exports['display-manager'] = (get, $t) => 
			`<div class='display-manager' id='` +
			$t.clean(get("id")) +
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
	
	exports['divide/head'] = (get, $t) => 
			`<div> <select value='` +
			$t.clean(get("opening").name) +
			`' class='open-divider-select` +
			$t.clean(get("sections").length === 0 ? ' hidden' : '') +
			`'> ` +
			$t.clean( new $t('443122713').render(get("sections"), 'section', get)) +
			` </select> <div class='open-divider-select` +
			$t.clean(get("sections").length === 0 ? '' : ' hidden') +
			`'> D </div> </div> `
	
	exports['divide/body'] = (get, $t) => 
			`<h2>` +
			$t.clean(get("list").activeKey()) +
			`</h2> val: ` +
			$t.clean(get("list").value()('selected')) +
			` `
	
	exports['feature'] = (get, $t) => 
			`<h3>Feature Display</h3> `
	
	exports['divider-controls'] = (get, $t) => 
			`<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` +
			$t.clean(get("opening").uniqueId()) +
			`' value='` +
			$t.clean(get("opening").pattern().str) +
			`'> <span class="open-orientation-radio-cnt"> <label for='open-orientation-horiz-` +
			$t.clean(get("opening").uniqueId()) +
			`'>Horizontal:</label> <input type='radio' name='orientation-` +
			$t.clean(get("opening").uniqueId()) +
			`' value='horizontal' open-id='` +
			$t.clean(get("opening").uniqueId()) +
			`' id='open-orientation-horiz-` +
			$t.clean(get("opening").uniqueId()) +
			`' class='open-orientation-radio' ` +
			$t.clean(get("opening").value('vertical') ? '' : 'checked') +
			`> <label for='open-orientation-vert-` +
			$t.clean(get("opening").uniqueId()) +
			`'>Vertical:</label> <input type='radio' name='orientation-` +
			$t.clean(get("opening").uniqueId()) +
			`' value='vertical' open-id='` +
			$t.clean(get("opening").uniqueId()) +
			`' id='open-orientation-vert-` +
			$t.clean(get("opening").uniqueId()) +
			`' class='open-orientation-radio' ` +
			$t.clean(get("opening").value('vertical') ? 'checked' : '') +
			`> </span> <div class='open-pattern-input-cnt' opening-id='` +
			$t.clean(get("opening").uniqueId()) +
			`' ` +
			$t.clean(get("opening").pattern().equal ? 'hidden' : '') +
			`> ` +
			$t.clean(get("patternInputHtml")) +
			` </div> </div> `
	
	exports['group/head'] = (get, $t) => 
			`<div group-display-id='` +
			$t.clean(get("groupDisplay").id()) +
			`'> <div class='expand-header group-display-header' group-id='` +
			$t.clean(get("group").id()) +
			`'> ` +
			$t.clean(get("$index")) +
			`<input class='group-input' group-id='` +
			$t.clean(get("group").id()) +
			`' value='` +
			$t.clean(get("group").name()) +
			`' prop-update='name'> </div> <div class='group-display-body' hidden></div> </div> <br> `
	
	exports['group/body'] = (get, $t) => 
			`<div class='group-cnt'> <div class='group-header' cab-style='Inset' ` +
			$t.clean(get("group").propertyConfig.isInset() ? '' : 'hidden') +
			`> <h2>Inset <b class='group-key'>` +
			$t.clean(get("group").propertyConfig('Inset').__KEY) +
			`</b></h2> </div> <div class='group-header' cab-style='Overlay' ` +
			$t.clean(!get("group").propertyConfig.isInset() && !get("group").propertyConfig.isRevealOverlay() ? '' : 'hidden') +
			`> <h2>Overlay <b class='group-key'>` +
			$t.clean(get("group").propertyConfig('Overlay').__KEY) +
			`</b></h2> </div> <div class='group-header' cab-style='Reveal' ` +
			$t.clean(get("group").propertyConfig.isRevealOverlay() ? '' : 'hidden') +
			`> <h2>Reveal <b class='group-key'>` +
			$t.clean(get("group").propertyConfig('Reveal').__KEY) +
			`</b></h2> </div> ` +
			$t.clean(get("propertyHtml")()) +
			` <div class='cabinet-cnt' group-id='` +
			$t.clean(get("group").id()) +
			`'></div> </div> `
	
	exports['index'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <style> /* #two-d-model { width: 500px; height:500px;} */ div { font-size:x-small; } </style> <script type="text/javascript" src='/cabinet/js/index.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/cabinet/styles/estimate.css"> <script src="/js/utility-filter.js" run-type='auto'></script> <title>Estimate</title> </head> <body> <button id='menu-btn'>&#8801;</button> <div id='menu' hidden></div> <div id='login'><div id='login-cnt' class='center-all'></div></div> <div id='display-ctn'> <div id='app' name='Orders' ` +
			$t.clean(get("id") !== 'home' ? "link='/cabinet/home'" : '') +
			` hidden> <div id='order-cnt'></div> <div id='model-cnt'> <div id='display-menu'></div> <div id='model-display-cnt'> <canvas id="two-d-model"></canvas> <div id="three-d-model" class="viewer small"> <span id="model-controller"></span> <span id="three-d-model-display"></span> </div> </div> </div> </div> <div name='Property Manager' ` +
			$t.clean(get("id") !== 'home' ? "link='/cabinet/property'" : '') +
			` id='property-manager-cnt' hidden> <div class='center'> <button id='property-manager-save-all'>Save All</button> </div> <div id='property-manager'></div> </div> <div id='cost-manager' "link='/cabinet/cost'" name='Cost Manager' ` +
			$t.clean(get("id") !== 'cost' ? "link='/cabinet/cost'" : '') +
			` hidden></div> <div id='template-manager' name='Template Manager' ` +
			$t.clean(get("id") !== 'template' ? "link='/cabinet/template'" : '') +
			` hidden>Temp Man</div> <div id='pattern-manager' name='Pattern Manager' ` +
			$t.clean(get("id") !== 'home' ? "link='/cabinet/pattern'" : '') +
			` hidden>Pat Man</div> </div> <div id='property-select-cnt'></div> </body> </html> `
	
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
	
	exports['managers/cost/body'] = (get, $t) => 
			`<div hidden> <div> <span> ` +
			$t.clean(get("CostManager").nodeInputHtml()) +
			` <button>Add Cost</button> <button>Add Node</button> </span> <span> Cost Display </span> </div> ` +
			$t.clean( new $t('2055573719').render(get("node").children(), 'child', get)) +
			` </div> `
	
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
			$t.clean(get("cost").uniqueId()) +
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
	
	exports['managers/property/body'] = (get, $t) => 
			`<div> No Need </div> `
	
	exports['managers/property/header'] = (get, $t) => 
			`<div> <b>` +
			$t.clean(get("instance").name) +
			` (` +
			$t.clean(get("instance").constructor.code) +
			`) - ` +
			$t.clean(get("instance").value) +
			`</b> </div> `
	
	exports['managers/cost/types/material'] = (get, $t) => 
			`<div cost-id='` +
			$t.clean(get("cost").uniqueId()) +
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
	
	exports['managers/template/body'] = (get, $t) => 
			`<div class='template-body' template-id=` +
			$t.clean(get("template").id()) +
			`> <div class='inline-flex full-width'> <h4>` +
			$t.clean(get("template").type()) +
			`</h4> <div class='full-width'> <button class='copy-template right'>Copy</button> <button class='paste-template right'>Paste</button> </div> </div> <span class='part-input-cnt'> <br> <input type="text" name="partSelector" list='part-list'> <datalist id='part-list'></datalist> </span> <input class='cabinet-input dem' type="text" name="width" value="27"> X <input class='cabinet-input dem' type="text" name="height" value="24"> X <input class='cabinet-input dem' type="text" name="thickness" value="20"> <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>Values</div> <div hidden class="` +
			$t.clean(get("containerClasses").values) +
			`"></div> </div> <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>Subassemblies</div> <div hidden class="` +
			$t.clean(get("containerClasses").subassemblies) +
			`">2</div> </div> <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>Joints</div> <div hidden class="` +
			$t.clean(get("containerClasses").joints) +
			`">3</div> </div> <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>Divider Joint</div> <div hidden class="` +
			$t.clean(get("containerClasses").dividerJoint) +
			`"> ` +
			$t.clean(get("dividerJointInput").html()) +
			` </div> </div> <div template-id='` +
			$t.clean(get("template").id()) +
			`' class='cabinet-template-input-cnt'> <div class='expand-header'>Opening Border Part Codes</div> <div hidden class="` +
			$t.clean(get("containerClasses").openings) +
			`">5</div> </div> </div> `
	
	exports['managers/template/head'] = (get, $t) => 
			`<div> <b>` +
			$t.clean(get("template").type()) +
			`</b> </div> `
	
	exports['managers/template/joints/head'] = (get, $t) => 
			`<b> <input class='template-input' value='` +
			$t.clean(get("obj").malePartCode) +
			`' attr='joints' placeholder='Male Part Code' name='malePartCode'> => <input class='template-input' value='` +
			$t.clean(get("obj").femalePartCode) +
			`' attr='joints' placeholder='Female Part Code' name='femalePartCode'> </b> `
	
	exports['managers/template/joints/body'] = (get, $t) => 
			`` +
			$t.clean(get("jointInput").html()) +
			` <input type="text" name="value" disabled > `
	
	exports['managers/template/main'] = (get, $t) => 
			`<div template-manager=` +
			$t.clean(get("id")()) +
			`> Main template <div id='` +
			$t.clean(get("parentId")()) +
			`'></div> </div> `
	
	exports['managers/template/subassemblies/head'] = (get, $t) => 
			`<label>Part Code</label> <input class='template-input' attr='subassemblies' name='code' value="` +
			$t.clean(get("obj").code) +
			`"> ` +
			$t.clean(get("typeInput").html()) +
			` `
	
	exports['managers/template/openings/head'] = (get, $t) => 
			`<div class='inline-flex'> ` +
			$t.clean(get("select").html()) +
			` <input class='opening-part-code-input' attr='openings' name='partCode' value="` +
			$t.clean(get("obj")[get("select").value()]) +
			`"> </div> `
	
	exports['managers/template/subassemblies/body'] = (get, $t) => 
			`<div template-attr='subassembles'> <label>Name</label> <input class='template-input' attr='subassemblies' name="name" value="` +
			$t.clean(get("obj").name) +
			`"> <br> <div class='sub-demensions-cnt inline-flex'> ` +
			$t.clean(get("demensionXyzSelect").html()) +
			` <input class='template-input' attr='subassemblies' name='demensions' value='` +
			$t.clean(get("getEqn")(get("demensionXyzSelect"), get("obj").demensions)) +
			`'> <input disabled class='measurement-input' name='value'> </div> <br> <div class='sub-center-cnt inline-flex'> ` +
			$t.clean(get("centerXyzSelect").html()) +
			` <input class='template-input' attr='subassemblies' name='center' value='` +
			$t.clean(get("getEqn")(get("centerXyzSelect"), get("obj").center)) +
			`'> <input disabled class='measurement-input' name='value'> </div> <br> <div class='sub-center-cnt inline-flex'> ` +
			$t.clean(get("rotationXyzSelect").html()) +
			` <input class='template-input' attr='subassemblies' name='rotation' value='` +
			$t.clean(get("getEqn")(get("rotationXyzSelect"), get("obj").rotation)) +
			`'> <input disabled class='measurement-input' name='value'> </div> </div> `
	
	exports['managers/template/values/head'] = (get, $t) => 
			`<div template-attr='values'> <input class='template-input' attr='values' type='text' name='name' value='` +
			$t.clean(get("obj").key) +
			`' placeholder="Variable Name"> <input class='measurement-input' type='text' name='value' value='` +
			$t.clean(get("obj").eqn) +
			`' placeholder="Value" disabled> <br> <input class='template-input full-width' attr='values' type='text' name='eqn' value='` +
			$t.clean(get("obj").eqn) +
			`' placeholder="Equation"> </div> `
	
	exports['opening'] = (get, $t) => 
			`<div class='opening-cnt' opening-id='` +
			$t.clean(get("opening").uniqueId()) +
			`'> <div class='divider-controls'> </div> </div> <div id='` +
			$t.clean(get("openDispId")) +
			`'> </div> `
	
	exports['model-controller'] = (get, $t) => 
			`<div> <div class='model-selector'> <div ` +
			$t.clean(get("group").level === -1 ? 'hidden' : '') +
			`> <div class='` +
			$t.clean(get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") +
			` ` +
			$t.clean(get("label") ? "prefix-switch model-label" : "") +
			`' ` +
			$t.clean(!get("label") ? 'hidden' : '') +
			`> <label type='prefix'>` +
			$t.clean(get("label")) +
			`</label> <input type='checkbox' class='prefix-checkbox' prefix='` +
			$t.clean(get("group").prefix) +
			`' ` +
			$t.clean(!get("tdm").hidePrefix(get("label")) ? 'checked' : '') +
			`> </div> <div class='` +
			$t.clean(get("label") ? "prefix-body indent" : "") +
			`' ` +
			$t.clean(get("label") ? 'hidden' : '') +
			`> ` +
			$t.clean( new $t('1753942820').render(get("group").parts, 'partName, partList', get)) +
			` </div> </div> ` +
			$t.clean( new $t('model-controller').render(get("group").groups, 'label, group', get)) +
			` </div> </div> `
	
	exports['-1523801133'] = (get, $t) => 
			`<div part-id='` +
			$t.clean(get("part").uniqueId()) +
			`' class='` +
			$t.clean(get("tdm").isTarget("part-id", get("part").uniqueId()) ? "active " : "") +
			` model-label indent' ` +
			$t.clean(get("partList").length > 1 ? "" : "hidden") +
			`> <label type='part-id' part-id='` +
			$t.clean(get("part").uniqueId()) +
			`'> ` +
			$t.clean(get("part").partCode()) +
			`-` +
			$t.clean(get("$index") +
			1) +
			` </label> <input type='checkbox' class='part-id-checkbox' part-id='` +
			$t.clean(get("part").uniqueId()) +
			`' ` +
			$t.clean(!get("tdm").hidePartId(get("part").uniqueId()) ? 'checked' : '') +
			`> </div>`
	
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
			`<div> <b>` +
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
			$t.clean(get("uniqueId")) +
			`'></div> ` +
			$t.clean( new $t('1927703609').render(get("groups"), 'key, group', get)) +
			` </div> </div> </div> </div> `
	
	exports['properties/property-menu'] = (get, $t) => 
			` <div class='cabinet-style-selector-cnt'>` +
			$t.clean(get("styleSelector")()) +
			`</div> Property MeNu `
	
	exports['properties/radio'] = (get, $t) => 
			`<div class='center'> <label>` +
			$t.clean(get("key")) +
			`:&nbsp;&nbsp;&nbsp;&nbsp;</label> ` +
			$t.clean( new $t('1410278299').render(get("values"), 'property', get)) +
			` </div> `
	
	exports['properties/unit'] = (get, $t) => 
			`<div> <label>Standard</label> <input type='radio' name='unit' ` +
			$t.clean(get("unit").value() === 'Imperial (US)' ? 'checked' : '') +
			` value='Imperial (US)'> <label>Metric</label> <input type='radio' name='unit' ` +
			$t.clean(get("unit").value() === 'Metric' ? 'checked' : '') +
			` value='Metric'> </div> `
	
	exports['room/body'] = (get, $t) => 
			`<div> ` +
			$t.clean( new $t('714657883').render(get("room").groups, 'group', get)) +
			` <div> <button class='group-add-btn' room-id='` +
			$t.clean(get("room").id()) +
			`'>Add Group</button> </div> </div> `
	
	exports['sections/divider'] = (get, $t) => 
			`<h2>Divider: ` +
			$t.clean(get("list").activeKey()) +
			`</h2> <div class='section-feature-ctn'> ` +
			$t.clean(get("featureDisplay")) +
			` </div> `
	
	exports['sections/door'] = (get, $t) => 
			`<h2>DoorSection(` +
			$t.clean(get("list").activeKey()) +
			`):</h2> <br><br> <div> ` +
			$t.clean( new $t('990870856').render(get("assemblies"), 'assem', get)) +
			` </div> `
	
	exports['room/head'] = (get, $t) => 
			`<b>` +
			$t.clean(get("room").name()) +
			`</b> `
	
	exports['sections/drawer'] = (get, $t) => 
			`<h2>Drawer: ` +
			$t.clean(get("list").activeKey()) +
			`</h2> <div class='section-feature-ctn'> ` +
			$t.clean(get("featureDisplay")) +
			` </div> `
	
	exports['sections/dual-door'] = (get, $t) => 
			`<h2>Dual Door: ` +
			$t.clean(get("list").activeKey()) +
			`</h2> <div class='section-feature-ctn'> ` +
			$t.clean(get("featureDisplay")) +
			` </div> `
	
	exports['sections/false-front'] = (get, $t) => 
			`<h2>False Front: ` +
			$t.clean(get("list").activeKey()) +
			`</h2> <div class='section-feature-ctn'> ` +
			$t.clean(get("featureDisplay")) +
			` </div> `
	
	exports['sections/open'] = (get, $t) => 
			`<h2>Open: ` +
			$t.clean(get("list").activeKey()) +
			`</h2> <div class='section-feature-ctn'> ` +
			$t.clean(get("featureDisplay")) +
			` </div> `
	
	exports['three-view'] = (get, $t) => 
			`<div class='three-view-cnt' id='` +
			$t.clean(get("id")()) +
			`'> <div class='three-view-three-d-cnt'></div> <div class='three-view-two-d-cnt'> <div class='three-view-canvases-cnt inline-flex' id='` +
			$t.clean(get("id")()) +
			`-cnt'> <div class='center-vert'>Part Code: <b id='three-view-part-code-` +
			$t.clean(get("id")()) +
			`'></b></div> <span class='three-view-canvas-cnt'> <b>Top</b> <canvas id="three-view-top" width="` +
			$t.clean(get("maxDem")()) +
			`" height="` +
			$t.clean(get("maxDem")()) +
			`"></canvas> </span> <span class='three-view-canvas-cnt'> <b>Left</b> <canvas id="three-view-left" width="` +
			$t.clean(get("maxDem")()) +
			`" height="` +
			$t.clean(get("maxDem")()) +
			`"></canvas> </span> <span class='three-view-canvas-cnt'> <b>Front</b> <canvas id="three-view-front" width="` +
			$t.clean(get("maxDem")()) +
			`" height="` +
			$t.clean(get("maxDem")()) +
			`"></canvas> </span> </div> </div> </div> `
	
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
			$t.clean( new $t('-2108278621').render(get("list")(), 'key, item', get)) +
			` <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> <div> <div class='expand-input-cnt' hidden>` +
			$t.clean(get("inputHtml")()) +
			`</div> <br> <div class='error' id='` +
			$t.clean(get("ERROR_CNT_ID")()) +
			`'></div> </div> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`"></div> </div> `
	
	exports['-2108278621'] = (get, $t) => 
			`<div key='` +
			$t.clean(get("key")) +
			`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'>X</button> </div> <div class="expand-header ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> ` +
			$t.clean(get("getHeader")(get("item"), get("key"))) +
			` </div> </div> </div>`
	
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
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> <div> </div> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'> Hello World! </div> </div> `
	
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
	
	exports['expandable/list'] = (get, $t) => 
			` <div class="expandable-list ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
			` <div class='expand-input-cnt' hidden has-input-tree='` +
			$t.clean(get("hasInputTree")()) +
			`'>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> `
	
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
			$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
			` </div> `
	
	exports['input/decision/decision'] = (get, $t) => 
			` <span class='decision-input-cnt' node-id='` +
			$t.clean(get("_nodeId")) +
			`' ` +
			$t.clean(get("reachable")() ? '' : 'hidden') +
			`> <span id='` +
			$t.clean(get("id")) +
			`' class='inline-flex'> ` +
			$t.clean( new $t('101748844').render(get("inputArray"), 'input', get)) +
			` </span> </span> `
	
	exports['input/decision/decisionTree'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("DecisionInputTree").class) +
			`' root-id='` +
			$t.clean(get("wrapper").nodeId()) +
			`'> ` +
			$t.clean(get("inputHtml")) +
			` <button class='` +
			$t.clean(get("DecisionInputTree").buttonClass) +
			`' root-id='` +
			$t.clean(get("wrapper").nodeId()) +
			`'' ` +
			$t.clean(get("tree").hideButton ? 'hidden' : '') +
			`> ` +
			$t.clean(get("tree").buttonText()) +
			` </button> </div> `
	
	exports['input/input'] = (get, $t) => 
			`<` +
			$t.clean(get("inline") ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
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
			$t.clean(get("attrString")()) +
			`> <datalist id="input-list-` +
			$t.clean(get("id")()) +
			`"> ` +
			$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
			` </datalist> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </` +
			$t.clean(get("inline") ? 'span' : 'div') +
			`> `
	
	exports['-994603408'] = (get, $t) => 
			`<option value="` +
			$t.clean(get("item")) +
			`" ></option>`
	
	exports['input/measurement'] = (get, $t) => 
			`<div class='fit input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
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
			`'> <div class='error' id='` +
			$t.clean(get("errorMsgId")()) +
			`' hidden>` +
			$t.clean(get("errorMsg")()) +
			`</div> </div> `
	
	exports['input/select'] = (get, $t) => 
			`<` +
			$t.clean(get("inline") ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
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
			$t.clean(get("inline") ? 'span' : 'div') +
			`> `
	
});


RequireJS.addFunction('./public/json/cabinets.json',
function (require, exports, module) {
	module.exports = {
	  "base": {
	    "type": "base",
	    "values": [
	      {"key": "brh", "eqn": "tkb.w + pback.t + brr"},
	      {"key": "innerWidth", "eqn": "c.w - pwt34 * 2"},
	      {"key": "innerWidthCenter", "eqn": "innerWidth + pwt34"}
	    ],
	    "subassemblies": [
	      {
	        "name": "ToeKickBacker",
	        "type": "Panel",
	        "code": "tkb",
	        "center": ["c.w / 2", "w / 2", "tkd + (t / 2)"],
	        "demensions": ["tkh", "innerWidth", "tkbw"],
	        "rotation": [0,0,90]
	      },
	      {
	        "name": "Right",
	        "type": "Panel",
	        "code": "pr",
	        "center": ["c.w - (pr.t / 2)", "l / 2", "(w / 2)"],
	        "demensions": ["c.t", "c.l", "pwt34"],
	        "rotation": [0,90,0]
	      },
	      {
	        "name": "Left",
	        "type": "Panel",
	        "code": "pl",
	        "center": ["(t / 2)", " l / 2", " (w/2)"],
	        "demensions": ["c.t", "c.l", "pwt34"],
	        "rotation": [0,90,0]
	      },
	      {
	        "name": "Back",
	        "type": "Panel",
	        "code": "pback",
	        "center": ["l / 2 + pl.t", " (w / 2) + tkb.w", " c.t - (t / 2)"],
	        "demensions": ["c.l - tkb.w", "innerWidth", "pwt34"],
	        "rotation": [0,0,90]
	      },
	      {
	        "name": "Bottom",
	        "type": "Panel",
	        "code": "pb",
	        "center": ["c.w / 2", "tkh + (t/2)", "w / 2"],
	        "demensions": ["c.t - pback.t", "innerWidth", "pwt34"],
	        "rotation": [90,90, 0]
	      },
	      {
	        "name": "Top",
	        "type": "Panel",
	        "code": "pt",
	        "center": ["c.w / 2", "c.h - pwt34/2", "(w / 2)"],
	        "demensions": ["(c.t - pback.t) * .2", "innerWidth", "pwt34"],
	        "rotation": [90,90, 0]
	      },
	      {
	        "name": "Top",
	        "type": "Panel",
	        "code": "pt2",
	        "center": ["c.w / 2", "c.h - pwt34/2", "c.t - pback.t - (w / 2)"],
	        "demensions": ["(c.t - pback.t) * .2", "innerWidth", "pwt34"],
	        "rotation": [90,90, 0]
	      }
	    ],
	    "joints": [
	      {
	        "malePartCode": "pt",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x"
	      },
	      {
	        "malePartCode": "pt",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "+x"
	      },
	      {
	        "malePartCode": "pt2",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x"
	      },
	      {
	        "malePartCode": "pt2",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "+x"
	      },
	      {
	        "malePartCode": "pback",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x"
	      },
	      {
	        "malePartCode": "pback",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "+x"
	      },
	      {
	        "malePartCode": "tkb",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "-x"
	      },
	      {
	        "malePartCode": "tkb",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "+x"
	      },
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "-x"
	      },
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"y",
	        "centerAxis": "+x"
	      },
	      {
	        "malePartCode": "tkb",
	        "femalePartCode": "pb",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis":"x",
	        "centerAxis": "+y"
	      }
	    ],
	    "dividerJoint": {
	      "type": "Dado",
	      "maleOffset": 0.9525,
	    },
	    "openings": [
	      {
	        "top": "pt",
	        "bottom": "pb",
	        "left": "pl",
	        "right": "pr",
	        "back": "pback"
	      }
	    ]
	  },
	  "corner-wall(L)": {
	    "_TYPE": "CabinetTemplate",
	    "ID_ATTRIBUTE": "id",
	    "type": "corner-wall(L)",
	    "values": [
	      {
	        "key": "cnrR",
	        "eqn": "4*2.54"
	      },
	      {
	        "key": "fwl",
	        "eqn": "c.t - depthR"
	      },
	      {
	        "key": "fwr",
	        "eqn": "c.w - depthL"
	      },
	      {
	        "key": "bottomInsetDepth",
	        "eqn": "0"
	      },
	      {
	        "key": "topInsetDepth",
	        "eqn": "0"
	      },
	      {
	        "key": "depthL",
	        "eqn": "12*2.54"
	      },
	      {
	        "key": "depthR",
	        "eqn": "9 * 2.54"
	      },
	      {
	        "key": "cnrD",
	        "eqn": "Math.sqrt(pbw*pbw/2 - cnrR*cnrR)"
	      },
	      {
	        "key": "pbw",
	        "eqn": "Math.sqrt((cnrR+pb.t)*(cnrR+pb.t)*2)"
	      },
	      {
	        "key": "plhyp",
	        "eqn": "Math.sqrt((pl.t*pl.t)*2)"
	      }
	    ],
	    "subassemblies": [
	      {
	        "type": "Panel",
	        "center": [
	          "c.t - cnrR/2",
	          "c.h/2",
	          "c.w - cnrR/2"
	        ],
	        "demensions": [
	          "pbw",
	          "c.h",
	          "pwt14"
	        ],
	        "rotation": [
	          0,
	          "135",
	          0
	        ],
	        "name": "Panel.Back",
	        "code": "pb"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "(c.t - depthR) + depthR / 2",
	          "c.h / 2",
	          "pr.t / 2"
	        ],
	        "demensions": [
	          "depthR",
	          "c.h",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          0,
	          0
	        ],
	        "name": "Panel.Right",
	        "code": "pr"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pl.t/2",
	          "c.h/2",
	          "(c.w - depthL) + depthL/2"
	        ],
	        "demensions": [
	          "depthL",
	          "c.h",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          "90",
	          0
	        ],
	        "name": "Panel.Left",
	        "code": "pl"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pbl.w / 2 + pl.t ",
	          "c.h/2",
	          "c.w - t / 2"
	        ],
	        "demensions": [
	          "c.t - cnrR",
	          "c.h",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          0,
	          0
	        ],
	        "name": "Panel.back.Left",
	        "code": "pbl"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "c.t - pbr.t/2",
	          "c.h/2",
	          "pbr.w/2 + pr.t"
	        ],
	        "demensions": [
	          "c.w - cnrR",
	          "c.h",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          "90",
	          0
	        ],
	        "name": "Panel.Back.Right",
	        "code": "pbr"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "c.t / 2",
	          "c.h - topInsetDepth - t / 2",
	          "c.w / 2"
	        ],
	        "demensions": [
	          "c.t - pbr.t - pl.t",
	          "c.w - pbl.t - pr.t",
	          "pwt34"
	        ],
	        "rotation": [
	          "90",
	          "0",
	          0
	        ],
	        "name": "Panal.top",
	        "code": "pt"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "c.t / 2",
	          "bottomInsetDepth + t / 2",
	          "c.w / 2"
	        ],
	        "demensions": [
	          "c.t - pbr.t - pl.t",
	          "c.w - pbl.t - pr.t",
	          "pwt34"
	        ],
	        "rotation": [
	          "90",
	          "0",
	          0
	        ],
	        "name": "Panal.top",
	        "code": "pbtm"
	      },
	      {
	        "type": "Cutter",
	        "center": [
	          "fwl / 2",
	          "c.h/2",
	          "fwr/2"
	        ],
	        "demensions": [
	          "fwl",
	          "fwr",
	          "c.h"
	        ],
	        "rotation": [
	          "90",
	          0,
	          0
	        ],
	        "name": "Cutter.Front",
	        "code": "cut"
	      }
	    ],
	    "joints": [
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pbtm",
	        "type": "Butt"
	      },
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pbr",
	        "type": "Butt"
	      },
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pbl",
	        "type": "Butt"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pbtm",
	        "femalePartCode": "pr",
	        "maleOffset": "pr.t / 2",
	        "demensionAxis": "y",
	        "centerAxis": "-z"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pbtm",
	        "femalePartCode": "pl",
	        "maleOffset": "pl.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "-x"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pbtm",
	        "femalePartCode": "pbl",
	        "maleOffset": "pbl.t/2",
	        "demensionAxis": "y",
	        "centerAxis": "+z"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pbtm",
	        "femalePartCode": "pbr",
	        "maleOffset": "pbr.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "+x"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pt",
	        "femalePartCode": "pr",
	        "maleOffset": "pr.t / 2",
	        "demensionAxis": "y",
	        "centerAxis": "-z"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pt",
	        "femalePartCode": "pl",
	        "maleOffset": "pl.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "-x"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pt",
	        "femalePartCode": "pbl",
	        "maleOffset": "pbl.t/2",
	        "demensionAxis": "y",
	        "centerAxis": "+z"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pt",
	        "femalePartCode": "pbr",
	        "maleOffset": "pbr.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "+x"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pbl",
	        "femalePartCode": "pl",
	        "maleOffset": "pl.t",
	        "demensionAxis": "x",
	        "centerAxis": "+y"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pbr",
	        "femalePartCode": "pr",
	        "maleOffset": "pr.t",
	        "demensionAxis": "x",
	        "centerAxis": "+y"
	      },
	      {
	        "type": "Butt",
	        "malePartCode": "pb",
	        "femalePartCode": "pt"
	      },
	      {
	        "type": "Butt",
	        "malePartCode": "cut",
	        "femalePartCode": "pt"
	      },
	      {
	        "type": "Butt",
	        "malePartCode": "cut",
	        "femalePartCode": "pbtm"
	      }
	    ],
	    "dividerJoint": {
	      "type": "Dado",
	      "maleOffset": "33"
	    },
	    "openings": []
	  },
	  "wall": {
	    "_TYPE": "CabinetTemplate",
	    "ID_ATTRIBUTE": "id",
	    "type": "wall",
	    "values": [
	      {
	        "key": "bottomInsetDepth",
	        "eqn": "0"
	      },
	      {
	        "key": "topInsetDepth",
	        "eqn": "0"
	      }
	    ],
	    "subassemblies": [
	      {
	        "type": "Panel",
	        "center": [
	          "c.w - pr.t/2",
	          "c.h / 2",
	          "pr.w / 2"
	        ],
	        "demensions": [
	          "c.t",
	          "c.h",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          "90",
	          0
	        ],
	        "name": "Panel.Right",
	        "code": "pr"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pl.t/2",
	          "c.h/2",
	          "pl.w/2"
	        ],
	        "demensions": [
	          "c.t",
	          "c.h",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          "90",
	          0
	        ],
	        "name": "Panel.Left",
	        "code": "pl"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pl.t + pb.w/2",
	          "pb.h/2 + pbtm.t",
	          "c.t - pb.t /2"
	        ],
	        "demensions": [
	          "c.w - pl.t - pr.t",
	          "c.h - pbtm.t -pt.t",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          0,
	          0
	        ],
	        "name": "Panel.back",
	        "code": "pb"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pl.t + pt.w / 2",
	          "c.h - pt.t/2",
	          "pt.l/2 "
	        ],
	        "demensions": [
	          "c.w - pl.t - pr.t",
	          "c.t ",
	          "pwt34"
	        ],
	        "rotation": [
	          "90",
	          "0",
	          0
	        ],
	        "name": "Panal.top",
	        "code": "pt"
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pbtm.w /2 + pl.t",
	          "pbtm.t/2",
	          "pbtm.h / 2"
	        ],
	        "demensions": [
	          "c.w - pl.t - pr.t",
	          "c.t",
	          "pwt34"
	        ],
	        "rotation": [
	          "90",
	          "0",
	          0
	        ],
	        "name": "Panal.Bottom",
	        "code": "pbtm"
	      }
	    ],
	    "joints": [
	      {
	        "type": "Dado",
	        "malePartCode": "pb",
	        "femalePartCode": "pt",
	        "maleOffset": "pt.t/2",
	        "demensionAxis": "y",
	        "centerAxis": "+y"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pb",
	        "femalePartCode": "pr",
	        "maleOffset": "pr.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "+x"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pb",
	        "femalePartCode": "pbtm",
	        "maleOffset": "pbtm.t/2",
	        "demensionAxis": "y",
	        "centerAxis": "-y"
	      },
	      {
	        "type": "Dado",
	        "malePartCode": "pb",
	        "femalePartCode": "pl",
	        "maleOffset": "pl.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "-x"
	      }
	    ],
	    "dividerJoint": {
	      "type": "Dado",
	      "maleOffset": "33"
	    },
	    "openings": []
	  },
	  "corner-base(L)": {
	  "_TYPE": "CabinetTemplate",
	
	  "ID_ATTRIBUTE": "id",
	  "type": "corner-base(L)",
	  "values": [
	    {
	      "key": "cnrR",
	      "eqn": "4*2.54",
	
	    },
	    {
	      "key": "fwl",
	      "eqn": "c.t - depthR",
	
	    },
	    {
	      "key": "fwr",
	      "eqn": "c.w - depthL",
	
	    },
	    {
	      "key": "bottomInsetDepth",
	      "eqn": "0",
	
	    },
	    {
	      "key": "topInsetDepth",
	      "eqn": "0",
	
	    },
	    {
	      "key": "depthL",
	      "eqn": "12*2.54",
	
	    },
	    {
	      "key": "depthR",
	      "eqn": "9 * 2.54",
	
	    },
	    {
	      "key": "cnrD",
	      "eqn": "Math.sqrt(pbw*pbw/2 - cnrR*cnrR)",
	
	    },
	    {
	      "key": "pbw",
	      "eqn": "Math.sqrt((cnrR+pb.t)*(cnrR+pb.t)*2)",
	
	    },
	    {
	      "key": "plhyp",
	      "eqn": "Math.sqrt((pl.t*pl.t)*2)",
	
	    }
	  ],
	  "subassemblies": [
	    {
	      "type": "Panel",
	      "center": [
	        "c.t - cnrR/2",
	        "c.h/2",
	        "c.w - cnrR/2"
	      ],
	      "demensions": [
	        "pbw",
	        "c.h",
	        "pwt14"
	      ],
	      "rotation": [
	        0,
	        "135",
	        0
	      ],
	      "name": "Panel.Back",
	      "code": "pb",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "(c.t - depthR) + depthR / 2",
	        "c.h / 2",
	        "pr.t / 2"
	      ],
	      "demensions": [
	        "depthR",
	        "c.h",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        0,
	        0
	      ],
	      "name": "Panel.Right",
	      "code": "pr",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "pl.t/2",
	        "c.h/2",
	        "(c.w - depthL) + depthL/2"
	      ],
	      "demensions": [
	        "depthL",
	        "c.h",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        "90",
	        0
	      ],
	      "name": "Panel.Left",
	      "code": "pl",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "pbl.w / 2 + pl.t ",
	        "c.h/2",
	        "c.w - t / 2"
	      ],
	      "demensions": [
	        "c.t - cnrR",
	        "c.h",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        0,
	        0
	      ],
	      "name": "Panel.back.Left",
	      "code": "pbl",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "c.t - pbr.t/2",
	        "c.h/2",
	        "pbr.w/2 + pr.t"
	      ],
	      "demensions": [
	        "c.w - cnrR",
	        "c.h",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        "90",
	        0
	      ],
	      "name": "Panel.Back.Right",
	      "code": "pbr",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "c.t / 2",
	        "c.h - topInsetDepth - t / 2",
	        "c.w / 2"
	      ],
	      "demensions": [
	        "c.t - pbr.t - pl.t",
	        "c.w - pbl.t - pr.t",
	        "pwt34"
	      ],
	      "rotation": [
	        "90",
	        "0",
	        0
	      ],
	      "name": "Panal.top",
	      "code": "pt",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "c.t / 2",
	        "tkh + t / 2",
	        "c.w / 2"
	      ],
	      "demensions": [
	        "c.t - pbr.t - pl.t",
	        "c.w - pbl.t - pr.t",
	        "pwt34"
	      ],
	      "rotation": [
	        "90",
	        "0",
	        0
	      ],
	      "name": "Panal.top",
	      "code": "pbtm",
	
	    },
	    {
	      "type": "Cutter",
	      "center": [
	        "fwl / 2",
	        "c.h/2",
	        "fwr/2"
	      ],
	      "demensions": [
	        "fwl",
	        "fwr",
	        "c.h"
	      ],
	      "rotation": [
	        "90",
	        0,
	        0
	      ],
	      "name": "Cutter.Front",
	      "code": "cut",
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "pl.t + tkbl.l/2",
	        "tkh/2",
	        "fwr + tkbl.t/2 + tkd"
	      ],
	      "demensions": [
	        "tkh",
	        "fwl + tkd - tkbr.t/2",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        0,
	        "90"
	      ],
	
	      "name": "Panel.ToeKick.Backer.Left",
	      "code": "tkbl"
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "fwl + pl.t + tkd",
	        "tkh/2",
	        "tkbr.l/2 + pr.t "
	      ],
	      "demensions": [
	        "tkh",
	        "fwr + tkd",
	        "pwt34"
	      ],
	      "rotation": [
	        "90",
	        "0",
	        "90"
	      ],
	
	      "name": "Panel.ToeKick.Backer.Right",
	      "code": "tkbr"
	    }
	  ],
	  "joints": [
	    {
	      "malePartCode": "pb",
	      "femalePartCode": "pbtm",
	      "type": "Butt",
	
	    },
	    {
	      "malePartCode": "pb",
	      "femalePartCode": "pbr",
	      "type": "Butt",
	
	    },
	    {
	      "malePartCode": "pb",
	      "femalePartCode": "pbl",
	      "type": "Butt",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pbtm",
	      "femalePartCode": "pr",
	      "maleOffset": "pr.t / 2",
	      "demensionAxis": "y",
	      "centerAxis": "-z",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pbtm",
	      "femalePartCode": "pl",
	      "maleOffset": "pl.t/2",
	      "demensionAxis": "x",
	      "centerAxis": "-x",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pbtm",
	      "femalePartCode": "pbl",
	      "maleOffset": "pbl.t/2",
	      "demensionAxis": "y",
	      "centerAxis": "+z",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pbtm",
	      "femalePartCode": "pbr",
	      "maleOffset": "pbr.t/2",
	      "demensionAxis": "x",
	      "centerAxis": "+x",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pt",
	      "femalePartCode": "pr",
	      "maleOffset": "pr.t / 2",
	      "demensionAxis": "y",
	      "centerAxis": "-z",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pt",
	      "femalePartCode": "pl",
	      "maleOffset": "pl.t/2",
	      "demensionAxis": "x",
	      "centerAxis": "-x",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pt",
	      "femalePartCode": "pbl",
	      "maleOffset": "pbl.t/2",
	      "demensionAxis": "y",
	      "centerAxis": "+z",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pt",
	      "femalePartCode": "pbr",
	      "maleOffset": "pbr.t/2",
	      "demensionAxis": "x",
	      "centerAxis": "+x",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pbl",
	      "femalePartCode": "pl",
	      "maleOffset": "pl.t",
	      "demensionAxis": "x",
	      "centerAxis": "+y",
	
	    },
	    {
	      "type": "Dado",
	      "malePartCode": "pbr",
	      "femalePartCode": "pr",
	      "maleOffset": "pr.t",
	      "demensionAxis": "x",
	      "centerAxis": "+y",
	
	    },
	    {
	      "type": "Butt",
	      "malePartCode": "pb",
	      "femalePartCode": "pt",
	
	    },
	    {
	      "type": "Butt",
	      "malePartCode": "cut",
	      "femalePartCode": "pt",
	
	    },
	    {
	      "type": "Butt",
	      "malePartCode": "cut",
	      "femalePartCode": "pbtm",
	
	    },
	    {
	
	      "type": "Dado",
	      "malePartCode": "tkbl",
	      "femalePartCode": "tkbr",
	      "maleOffset": "tkbr.t/2",
	      "demensionAxis": "y",
	      "centerAxis": "+x"
	    },
	    {
	
	      "type": "Dado",
	      "malePartCode": "tkbl",
	      "femalePartCode": "pl",
	      "maleOffset": "pl.t/2",
	      "demensionAxis": "y",
	      "centerAxis": "-x"
	    },
	    {
	
	      "type": "Dado",
	      "malePartCode": "tkbr",
	      "femalePartCode": "pr",
	      "maleOffset": "pr.t/2",
	      "demensionAxis": "y",
	      "centerAxis": "-z"
	    }
	  ],
	  "dividerJoint": {
	    "type": "Dado",
	    "maleOffset": "33"
	  },
	  "openings": []
	},
	  "corner-base-blind": {
	  "_TYPE": "CabinetTemplate",
	
	  "ID_ATTRIBUTE": "id",
	  "type": "corner-base-blind",
	  "values": [
	    {
	      "key": "brh",
	      "eqn": "tkb.w + pback.t + brr",
	
	    },
	    {
	      "key": "innerWidth",
	      "eqn": "c.w - pwt34 * 2",
	
	    },
	    {
	      "key": "innerWidthCenter",
	      "eqn": "innerWidth + pwt34",
	
	    },
	    {
	
	      "key": "blindDepth",
	      "eqn": "24*2.54"
	    },
	    {
	
	      "key": "innerHeight",
	      "eqn": "c.h - tkh - pb.t"
	    }
	  ],
	  "subassemblies": [
	    {
	      "name": "ToeKickBacker",
	      "type": "Panel",
	      "code": "tkb",
	      "center": [
	        "c.w / 2",
	        "w / 2",
	        "tkd + (t / 2)"
	      ],
	      "demensions": [
	        "tkh",
	        "innerWidth",
	        "tkbw"
	      ],
	      "rotation": [
	        0,
	        0,
	        90
	      ],
	
	    },
	    {
	      "name": "Right",
	      "type": "Panel",
	      "code": "pr",
	      "center": [
	        "c.w - (pr.t / 2)",
	        "l / 2",
	        "(w / 2)"
	      ],
	      "demensions": [
	        "c.t",
	        "c.l",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        90,
	        0
	      ],
	
	    },
	    {
	      "name": "Left",
	      "type": "Panel",
	      "code": "pl",
	      "center": [
	        "(t / 2)",
	        " l / 2",
	        " (w/2)"
	      ],
	      "demensions": [
	        "c.t",
	        "c.l",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        90,
	        0
	      ],
	
	    },
	    {
	      "name": "Back",
	      "type": "Panel",
	      "code": "pback",
	      "center": [
	        "l / 2 + pl.t",
	        " (w / 2) + tkb.w",
	        " c.t - (t / 2)"
	      ],
	      "demensions": [
	        "c.l - tkb.w",
	        "innerWidth",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        0,
	        90
	      ],
	
	    },
	    {
	      "name": "Bottom",
	      "type": "Panel",
	      "code": "pb",
	      "center": [
	        "c.w / 2",
	        "tkh + (t/2)",
	        "w / 2"
	      ],
	      "demensions": [
	        "c.t - pback.t",
	        "innerWidth",
	        "pwt34"
	      ],
	      "rotation": [
	        90,
	        90,
	        0
	      ],
	
	    },
	    {
	      "name": "Top",
	      "type": "Panel",
	      "code": "pt",
	      "center": [
	        "c.w / 2",
	        "c.h - pwt34/2",
	        "(w / 2)"
	      ],
	      "demensions": [
	        "(c.t - pback.t) * .2",
	        "innerWidth",
	        "pwt34"
	      ],
	      "rotation": [
	        90,
	        90,
	        0
	      ],
	
	    },
	    {
	      "name": "Top2",
	      "type": "Panel",
	      "code": "pt2",
	      "center": [
	        "c.w / 2",
	        "c.h - pwt34/2",
	        "c.t - pback.t - (w / 2)"
	      ],
	      "demensions": [
	        "(c.t - pback.t) * .2",
	        "innerWidth",
	        "pwt34"
	      ],
	      "rotation": [
	        90,
	        90,
	        0
	      ],
	
	    },
	    {
	      "type": "Panel",
	      "center": [
	        "blindDepth + 2*2.54 - bms.w/2",
	        "tkh + pb.t + bms.h/2",
	        "bms.t/2"
	      ],
	      "demensions": [
	        "6*2.54",
	        "innerHeight",
	        "pwt34"
	      ],
	      "rotation": [
	        0,
	        0,
	        0
	      ],
	
	      "name": "Panel.Blind.MiddleSupport",
	      "code": "bms"
	    }
	  ],
	  "joints": [
	    {
	      "malePartCode": "pt",
	      "femalePartCode": "pl",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "-x",
	
	    },
	    {
	      "malePartCode": "pt",
	      "femalePartCode": "pr",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "+x",
	
	    },
	    {
	      "malePartCode": "pt2",
	      "femalePartCode": "pl",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "-x",
	
	    },
	    {
	      "malePartCode": "pt2",
	      "femalePartCode": "pr",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "+x",
	
	    },
	    {
	      "malePartCode": "pback",
	      "femalePartCode": "pl",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "-x",
	
	    },
	    {
	      "malePartCode": "pback",
	      "femalePartCode": "pr",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "+x",
	
	    },
	    {
	      "malePartCode": "tkb",
	      "femalePartCode": "pl",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "-x",
	
	    },
	    {
	      "malePartCode": "tkb",
	      "femalePartCode": "pr",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "+x",
	
	    },
	    {
	      "malePartCode": "pb",
	      "femalePartCode": "pl",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "-x",
	
	    },
	    {
	      "malePartCode": "pb",
	      "femalePartCode": "pr",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "y",
	      "centerAxis": "+x",
	
	    },
	    {
	      "malePartCode": "tkb",
	      "femalePartCode": "pb",
	      "type": "Dado",
	      "maleOffset": 0.9525,
	      "demensionAxis": "x",
	      "centerAxis": "+y",
	
	    }
	  ],
	  "dividerJoint": {
	    "type": "Dado",
	    "maleOffset": 0.9525
	  },
	  "openings": [
	    {
	      "top": "pt",
	      "bottom": "pb",
	      "left": "pl",
	      "right": "pr",
	      "back": "pback",
	
	    }
	  ]
	},
	  "ut": {
	    "_TYPE": "CabinetTemplate",
	
	    "ID_ATTRIBUTE": "id",
	    "type": "ut",
	    "values": [
	      {
	        "key": "brh",
	        "eqn": "tkb.w + pback.t + brr",
	
	      },
	      {
	        "key": "innerWidth",
	        "eqn": "c.w - pwt34 * 2",
	
	      },
	      {
	        "key": "innerWidthCenter",
	        "eqn": "innerWidth + pwt34",
	
	      },
	      {
	
	        "key": "insetTop",
	        "eqn": "4*2.54"
	      }
	    ],
	    "subassemblies": [
	      {
	        "name": "ToeKickBacker",
	        "type": "Panel",
	        "code": "tkb",
	        "center": [
	          "c.w / 2",
	          "w / 2",
	          "tkd + (t / 2)"
	        ],
	        "demensions": [
	          "tkh",
	          "innerWidth",
	          "tkbw"
	        ],
	        "rotation": [
	          0,
	          0,
	          90
	        ],
	
	      },
	      {
	        "name": "Right",
	        "type": "Panel",
	        "code": "pr",
	        "center": [
	          "c.w - (pr.t / 2)",
	          "l / 2",
	          "(w / 2)"
	        ],
	        "demensions": [
	          "c.t",
	          "c.l",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          90,
	          0
	        ],
	
	      },
	      {
	        "name": "Left",
	        "type": "Panel",
	        "code": "pl",
	        "center": [
	          "(t / 2)",
	          " l / 2",
	          " (w/2)"
	        ],
	        "demensions": [
	          "c.t",
	          "c.l",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          90,
	          0
	        ],
	
	      },
	      {
	        "name": "Back",
	        "type": "Panel",
	        "code": "pback",
	        "center": [
	          "l / 2 + pl.t",
	          " (w / 2) + tkb.w",
	          " c.t - (t / 2)"
	        ],
	        "demensions": [
	          "c.l - tkb.w - pt.t - insetTop",
	          "innerWidth",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          0,
	          90
	        ],
	
	      },
	      {
	        "name": "Bottom",
	        "type": "Panel",
	        "code": "pb",
	        "center": [
	          "c.w / 2",
	          "tkh + (t/2)",
	          "w / 2"
	        ],
	        "demensions": [
	          "c.t - pback.t",
	          "innerWidth",
	          "pwt34"
	        ],
	        "rotation": [
	          90,
	          90,
	          0
	        ],
	
	      },
	      {
	        "name": "Top",
	        "type": "Panel",
	        "code": "pt",
	        "center": [
	          "c.w / 2",
	          "c.h - pwt34/2 - insetTop",
	          "(w / 2)"
	        ],
	        "demensions": [
	          "c.t",
	          "innerWidth",
	          "pwt34"
	        ],
	        "rotation": [
	          90,
	          90,
	          0
	        ],
	
	      },
	      {
	        "type": "Panel",
	        "center": [
	          "pl.t + innerWidth/2",
	          "c.h - insetTop/2",
	          "tf.t/2"
	        ],
	        "demensions": [
	          "insetTop",
	          "innerWidth",
	          "pwt34"
	        ],
	        "rotation": [
	          0,
	          "0",
	          "90"
	        ],
	
	        "name": "Panel.Top.Filler",
	        "code": "tf"
	      }
	    ],
	    "joints": [
	      {
	        "malePartCode": "pt",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x",
	
	      },
	      {
	        "malePartCode": "pt",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "+x",
	
	      },
	      {
	        "malePartCode": "pback",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x",
	
	      },
	      {
	        "malePartCode": "pback",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "+x",
	
	      },
	      {
	        "malePartCode": "tkb",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x",
	
	      },
	      {
	        "malePartCode": "tkb",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "+x",
	
	      },
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pl",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "-x",
	
	      },
	      {
	        "malePartCode": "pb",
	        "femalePartCode": "pr",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "y",
	        "centerAxis": "+x",
	
	      },
	      {
	        "malePartCode": "tkb",
	        "femalePartCode": "pb",
	        "type": "Dado",
	        "maleOffset": 0.9525,
	        "demensionAxis": "x",
	        "centerAxis": "+y",
	
	      },
	      {
	
	        "type": "Dado",
	        "malePartCode": "pback",
	        "femalePartCode": "pt",
	        "maleOffset": "pt.t/2",
	        "demensionAxis": "x",
	        "centerAxis": "+y"
	      }
	    ],
	    "dividerJoint": {
	      "type": "Dado",
	      "maleOffset": 0.9525
	    },
	    "openings": [
	      {
	        "top": "pt",
	        "bottom": "pb",
	        "left": "pl",
	        "right": "pr",
	        "back": "pback",
	
	      }
	    ]
	  }
	}
	
});


RequireJS.addFunction('./app-src/show.js',
function (require, exports, module) {
	

	
	const Panel = require('./objects/assembly/assemblies/panel.js');
	
	class Show {
	  constructor(name) {
	    this.name = name;
	    Show.types[name] = this;
	  }
	}
	Show.types = {};
	Show.listTypes = () => Object.values(Show.types);
	new Show('None');
	new Show('Flat');
	new Show('Inset Panel');
	module.exports = Show
	
	
	
	
	
});


RequireJS.addFunction('./app-src/position.js',
function (require, exports, module) {
	

	
	const getDefaultSize = require('./utils.js').getDefaultSize;
	const FunctionCache = require('../../../public/js/utils/services/function-cache.js');
	
	class Position {
	  constructor(assembly, sme) {
	
	    function getSme(attr, obj) {
	      if (attr === undefined) {
	        return {x: sme.eval(obj.x),
	          y: sme.eval(obj.y),
	          z: sme.eval(obj.z)}
	      } else {
	        return sme.eval(obj[attr], assembly);
	      }
	    }
	
	    let center, demension, rotation;
	    let demCoords = {};
	    let centerCoords = {};
	
	    if ((typeof assembly.rotationStr()) !== 'object') {
	      const rotCoords = Position.parseCoordinates(assembly.rotationStr(), '0,0,0');
	      rotation = (attr) => getSme(attr, rotCoords);
	    } else {
	      rotation = assembly.rotationStr;
	    }
	
	    if ((typeof assembly.centerStr()) !== 'object') {
	      centerCoords = Position.parseCoordinates(assembly.centerStr(), '0,0,0');
	      center = (attr) => getSme(attr, centerCoords);
	    } else {
	      center = assembly.centerStr;
	    }
	
	    if ((typeof assembly.demensionStr()) !== 'object') {
	      const defSizes = getDefaultSize(assembly);
	      demCoords = Position.parseCoordinates(assembly.demensionStr(),
	      `${defSizes.width},${defSizes.length},${defSizes.thickness}`,
	      '0,0,0');
	      demension = (attr) => getSme(attr, demCoords);
	    } else new Promise(function(resolve, reject) {
	      demension = assembly.demensionStr
	    });
	
	
	
	    function get(func, sme) {
	      if ((typeof func) === 'function' && (typeof func()) === 'object') return func;
	      return sme;
	    }
	
	
	    const rootAssembly = assembly.getRoot();
	    if (rootAssembly.constructor.name === 'Cabinet') {
	      const cacheId = rootAssembly.uniqueId();
	      this.rotation = new FunctionCache((attr) => rotation(attr), null, cacheId, assembly);
	      this.center = new FunctionCache((attr) => center(attr), null, cacheId, assembly);
	      this.demension = new FunctionCache((attr) => demension(attr), null, cacheId, assembly);
	    } else {
	      this.rotation = (attr) => rotation(attr);
	      this.center = (attr) => center(attr);
	      this.demension = (attr) => demension(attr);
	    }
	
	    this.current = () => {
	      const position = {
	        center: this.center(),
	        demension: this.demension(),
	        rotation: this.rotation()
	      };
	      assembly.getJoints().male.forEach((joint) =>
	        joint.updatePosition(position)
	      );
	      return position;
	    }
	
	    this.centerAdjust = (center, direction) => {
	      const magnitude = direction[0] === '-' ? -1 : 1;
	      const axis = direction.replace(/\+|-/, '');
	      return this.center(center) + (magnitude * this.demension(axis) / 2);
	    }
	
	    this.limits = (targetStr) => {
	      if (targetStr !== undefined) {
	        const match = targetStr.match(/^(\+|-|)([xyz])$/)
	        const attr = match[2];
	        const d = this.demension(attr)/2;
	        const pos = `+${attr}`;
	        const neg = `-${attr}`;
	        const limits = {};
	        limits[pos] = d;
	        if (match[1] === '+') return limits[pos];
	        limits[neg] = -d;
	        if (match[1] === '-') return limits[neg];
	        return  limits;
	      }
	      const d = this.demension();
	      return  {
	        x: d.x / 2,
	        '-x': -d.x / 2,
	        y: d.y / 2,
	        '-y': -d.y / 2,
	        z: d.z / 2,
	        '-z': -d.z / 2,
	      }
	    }
	
	    this.set = (obj, type, value) => {
	      if (value !== undefined) obj[type] = value;
	      return demension(type);
	    }
	
	    this.setDemension = (type, value) => this.set(demCoords, type, value);
	    this.setCenter = (type, value) => this.set(centerCoords, type, value);
	  }
	}
	
	Position.targeted = (attr, x, y, z) => {
	  const all = attr === undefined;
	  const dem = {
	    x: all || attr === 'x' && x(),
	    y: all || attr === 'y' && y(),
	    z: all || attr === 'z' && z()
	  };
	  return all ? {x,y,z} : dem[attr];
	}
	Position.axisStrRegex = /(([xyz])(\(([0-9]*)\)|))/;
	Position.rotateStrRegex = new RegExp(Position.axisStrRegex, 'g');
	Position.touching = (pos1, pos2) => {
	  const touchingAxis = (axis) => {
	    if (pos1[`${axis}1`] === pos2[`${axis}0`])
	      return {axis: `${axis}`, direction: '+'};
	    if (pos1[`${axis}0`] === pos2[`${axis}1`])
	      return {axis: `${axis}`, direction: '-'};
	  }
	  if (!Position.within(pos1, pos2)) return null;
	  return touchingAxis('x') || touchingAxis('y') || touchingAxis('z') || null;
	}
	Position.within = (pos1, pos2, axises) => {
	  const axisTouching = (axis) => {
	    if (axises !== undefined && axises.index(axis) === -1) return true;
	    const p10 = pos1[`${axis}0`];
	    const p11 = pos1[`${axis}1`];
	    const p20 = pos2[`${axis}0`];
	    const p21 = pos2[`${axis}1`];
	    return (p10 >= p20 && p10 <= p21) ||
	            (p11 <= p21 && p11 >= p20);
	  }
	  return axisTouching('x') && axisTouching('y') && axisTouching('z');
	}
	
	Position.parseCoordinates = function() {
	  let coordinateMatch = null;
	  for (let index = 0; coordinateMatch === null && index < arguments.length; index += 1) {
	    const str = arguments[index];
	    if (index > 0 && arguments.length - 1 === index) {
	      //console.error(`Attempted to parse invalid coordinateStr: '${JSON.stringify(arguments)}'`);
	    }
	    if (typeof str === 'string') {
	      coordinateMatch = str.match(Position.demsRegex);
	    }
	  }
	  if (coordinateMatch === null) {
	    throw new Error(`Unable to parse coordinates`);
	  }
	  return {
	    x: coordinateMatch[1],
	    y: coordinateMatch[2],
	    z: coordinateMatch[3]
	  }
	}
	Position.demsRegex = /([^,]{1,}?),([^,]{1,}?),([^,]{1,})/;
	module.exports = Position
	
});


RequireJS.addFunction('./app-src/division-patterns.js',
function (require, exports, module) {
	
const Measurement = require('../../../public/js/utils/measurement.js')
	
	class Pattern {
	  constructor(str) {
	    this.str = str;
	    let unique = {};
	    for (let index = 0; index < str.length; index += 1) {
	      const char = str[index];
	      if (unique[char] === undefined) {
	        unique[char] = {char, count: 1};
	      } else {
	        unique[char].count++;
	      }
	    }
	    const uniqueStr = Object.keys(unique).join('');
	    this.unique = () => uniqueStr;
	    this.equal = this.unique.length === 1;
	    class Element {
	      constructor(id, index, count) {
	        let value;
	        this.id = id;
	        this.count = count || 1;
	        this.indexes = [index];
	        this.value = (val) => {
	          if (val !== undefined) {
	            Pattern.mostResent[id] = val;
	            value = new Measurement(val);
	          }
	          return value;
	        }
	      }
	    }
	
	    if ((typeof str) !== 'string' || str.length === 0)
	      throw new Error('Must define str (arg0) as string of length > 1');
	
	    const elements = {};
	    const values = {};
	    const updateOrder = [];
	    for (let index = str.length - 1; index > -1; index -= 1) {
	      const char = str[index];
	      if (elements[char]) {
	        elements[char].count++;
	        elements[char].indexes.push(index);
	      } else {
	        elements[char] = new Element(char, index);
	        if (Pattern.mostResent[char] !== undefined) {
	          elements[char].value(Pattern.mostResent[char]);
	          updateOrder.push(char);
	        }
	      }
	    }
	
	    this.ids = Object.keys(elements);
	    this.size = str.length;
	    let lastElem;
	    this.satisfied = () => updateOrder.length === uniqueStr.length - 1;
	
	    const numbersOnlyReg = /^[0-9]{1,}$/;
	    const calc = (dist) => {
	      const values = {};
	      if (str.trim().match(numbersOnlyReg)) {
	        let count = 0;
	        for (let index = 0; index < str.length; index += 1) {
	          count += Number.parseInt(str.charAt(index));
	        }
	        const unitDist = dist / count;
	        let retObj = {list: [], fill: [], str, values: {}};
	        for (let index = 0; index < str.length; index += 1) {
	          const char = str.charAt(index);
	          const units = Number.parseInt(char);
	          const value = units * unitDist;
	          retObj.list[index] = value;
	          if (retObj.values[char] === undefined) {
	            retObj.values[char] = value;
	            retObj.fill[retObj.list.fill.length] = value;
	          }
	        }
	        return retObj;
	      }
	      updateOrder.forEach((id) => {
	        const elem = elements[id];
	        dist -= elem.count * elem.value().decimal();
	        values[elem.id] = elem.value().value();
	      });
	      const uniqueVals = Object.values(unique);
	      if (lastElem === undefined) {
	        for (let index = 0; index < uniqueVals.length; index += 1) {
	          const char = uniqueVals[index].char;
	          if (!values[char]) {
	            if (lastElem === undefined) lastElem = elements[char];
	            else {lastElem = undefined; break;}
	          }
	        }
	      }
	      if (lastElem !== undefined) {
	        lastElem.value(new Measurement(dist / lastElem.count).value());
	        values[lastElem.id] = lastElem.value().value();
	      }
	      const list = [];
	      const fill = [];
	      if (lastElem){
	        for (let index = 0; index < uniqueVals.length; index += 1) {
	          fill[index] = elements[uniqueVals[index].char].value().display();
	        }
	      }
	      for (let index = 0; index < str.length; index += 1)
	        list[index] = values[str[index]];
	      const retObj = {values, list, fill, str};
	      return retObj;
	    }
	
	    this.value = (id, value) => {
	      if (value !== undefined) {
	        const index = updateOrder.indexOf(id);
	        if (index !== -1) updateOrder.splice(index, 1);
	        updateOrder.push(id);
	        if (updateOrder.length === this.ids.length) {
	          lastElem = elements[updateOrder[0]];
	          updateOrder.splice(0, 1);
	        }
	        elements[id].value(value);
	      } else {
	        return elements[id].value().decimal();
	      }
	    }
	
	    this.display = (id) => elements[id].value().display();
	
	    this.toJson = () => {
	      const json = this.calc();
	      delete json.list;
	      delete json.fill;
	      Object.keys(json.values).forEach((key) => {
	        if (Number.isNaN(json.values[key])) {
	          delete json.values[key];
	        }
	      })
	      return json;
	    }
	
	    this.elements = elements;
	    this.calc = calc;
	  }
	}
	
	Pattern.fromJson = (json) => {
	  const pattern = new Pattern(json.str);
	  const keys = Object.keys(pattern.values);
	  keys.foEach((key) => pattern.value(key, pattern.values[key]));
	  return pattern;
	};
	Pattern.mostResent = {};
	
	const p1 = new Pattern('babcdaf');
	p1.value('b', 2);
	p1.value('a', 2);
	p1.value('c', 3);
	p1.value('d', 4);
	p1.value('b', 2);
	p1.value('f', 5);
	p1.calc(20);
	const p2 = new Pattern(' // ^^%');
	module.exports = Pattern
	
});


RequireJS.addFunction('./app-src/error.js',
function (require, exports, module) {
	

	
	
	
	class InvalidComputation {
	  constructor(attributes) {
	    this.errorCode = 400;
	    this.message = 'Error within input parameters';
	    const keys = Object.keys(attributes);
	    for (let index = 0; index < keys.length; index += 1) {
	      const key = keys[index];
	      this.message += `\n\t${key}: '${value}'`;
	    }
	  }
	}
	module.exports = InvalidComputation
	
	
	
	
	
});


RequireJS.addFunction('./app-src/utils.js',
function (require, exports, module) {
	

	
	
	const removeSuffixes = ['Part', 'Section'].join('|');
	function formatConstructorId (obj) {
	  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
	}
	
	function getDefaultSize(instance) {
	  const constructorName = instance.constructor.name;
	  if (constructorName === 'Cabinet') return {length: 24 * 2.54, width: 50*2.54, thickness: 21*2.54};
	  return {length: 0, width: 0, thickness: 0};
	}
	
	exports.formatConstructorId = formatConstructorId;
	exports.getDefaultSize = getDefaultSize;
	
});


RequireJS.addFunction('./app-src/init.js',
function (require, exports, module) {
	

	
	require('../../../public/js/utils/utils.js');
	const $t = require('../../../public/js/utils/$t');
	$t.loadFunctions(require('../generated/html-templates'));
	require('./displays/user.js');
	
	// Object Classes
	// require('./bind.js');
	require('./objects/assembly/init-assem');
	require('./objects/joint/init');
	const Order = require('./objects/order.js');
	const Assembly = require('./objects/assembly/assembly.js');
	const Properties = require('./config/properties.js');
	const PopUp = require('../../../public/js/utils/display/pop-up.js');
	
	// Display classes
	const du = require('../../../public/js/utils/dom-utils.js');
	const EPNTS = require('../generated/EPNTS.js');
	const Displays = require('./services/display-svc.js');
	const OrderDisplay = require('./displays/order.js');
	const TwoDLayout = require('./two-d/layout.js');
	const ThreeDMainModel = require('./displays/three-d-main.js');
	const PropertyDisplay = require('./displays/property.js');
	const DisplayManager = require('./display-utils/displayManager.js');
	const utils = require('./utils.js');
	
	// Run Tests
	if (EPNTS.getEnv() === 'local') {
	  require('../test/run');
	}
	
	function updateDivisions (target) {
	  const name = target.getAttribute('name');
	  const index = Number.parseInt(target.getAttribute('index'));
	  const value = Number.parseFloat(target.value);
	  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
	  const uniqueId = du.find.up('.opening-cnt', target).getAttribute('opening-id');
	  const opening = Assembly.get(uniqueId);
	  const values = opening.dividerLayout().fill;
	  for (let index = 0; values && index < inputs.length; index += 1){
	    const value = values[index];
	    if(value) inputs[index].value = value;
	  }
	  ThreeDModel.update(opening);
	}
	
	function getValue(code, obj) {
	  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
	  return CONSTANTS[code].value;
	}
	
	
	const urlSuffix = du.url.breakdown().path.split('/')[2];
	const pageId = {template: 'template-manager', cost: 'cost-manager', home: 'app',
	                pattern: 'pattern-manager', property: 'property-manager-cnt'
	              }[urlSuffix] || 'app';
	function init(body){
	  Properties.load(body);
	  let roomDisplay;
	  let order;
	
	  const propertyDisplay = new PropertyDisplay('#property-manager');
	  Displays.register('propertyDisplay', propertyDisplay);
	  require('./cost/init-costs.js');
	  const mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn', pageId);
	  const modelDisplayManager = new DisplayManager('model-display-cnt', 'display-menu');
	  if (urlSuffix === 'cost') {
	    const CostManager = require('./displays/managers/cost.js');
	    const costManager = new CostManager('cost-manager', 'cost');
	  } else if (urlSuffix === 'template') {
	    const TemplateManager = require('./displays/managers/template.js');
	    const templateDisplayManager = new TemplateManager('template-manager');
	  } else {
	    du.on.match('change', '.open-orientation-radio,.open-division-input', updateDivisions);
	    orderDisplay = new OrderDisplay('#order-cnt');
	    setTimeout(TwoDLayout.init, 1000);
	    setTimeout(ThreeDMainModel.init, 1000);
	  }
	}
	
	Request.get(EPNTS.config.get(), init, console.error);
	
	const popUp = new PopUp({resize: false, noBackdrop: true});
	
	du.on.match('click', '*', (elem, event) => {
	  const errorMsg = elem.getAttribute('error-msg');
	  if (errorMsg) {
	    popUp.positionOnElement(elem).bottom();
	    popUp.updateContent(errorMsg);
	    popUp.show();
	    event.stopPropagation();
	  } else popUp.close();
	});
	
});


RequireJS.addFunction('./app-src/config/property.js',
function (require, exports, module) {
	
const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	
	
	
	class Property extends Lookup {
	  // clone constructor(code, value) {
	  constructor(code, name, props) {
	    super();
	    let value;// = (typeof props) === 'object' && props !== null ? props.value : undefined;
	    const children = [];
	
	    const initVals = {
	      code, name, description: props instanceof Object ? props.description : undefined
	    }
	    Object.getSet(this, initVals, 'value', 'code', 'name', 'description', 'properties');
	
	    this.value = (val, notMetric) => {
	      if (val !== undefined && value !== val) {
	        const measurement = new Measurement(val, notMetric);
	        const measurementVal = measurement.value();
	        value = Number.isNaN(measurementVal) ? val : measurement;
	      }
	      return value instanceof Measurement ? value.value() : value;
	    }
	
	    this.display = () => {
	      return value instanceof Measurement ? value.display() : value;
	    }
	
	    this.measurementId = () => value instanceof Measurement ? value.id() : undefined;
	
	    if ((typeof props) !== 'object' ||  props === null) {
	      this.value(props);
	      props = {};
	    }
	    this.properties(props || {});
	
	    const existingProp = Property.list[code];
	    let clone = false;
	    if (this.properties().value !== undefined) {
	      this.value(this.properties().value, this.properties().notMetric);
	    }
	
	    // if (existingProp) {
	    //   value = value || existingProp.value();
	    //   name = existingProp.name();
	    //   this.properties(existingProp.properties());
	    //   clone = true;
	    // }
	
	    if ((typeof value) === 'number')
	      value = new Measurement(value, this.properties().notMetric);
	
	
	    this.addChild = (property) => {
	      if (property instanceof Property && property.code() === this.code()) {
	            if (children.indexOf(property) === -1) children.push(property);
	            else throw new Error('Property is already a child');
	      }
	      else throw new Error('Child is not an instance of Property or Code does not match');
	    }
	
	    this.children = () => JSON.clone(children);
	
	    this.equals = (other) =>
	        other instanceof Property &&
	        this.value() === other.value() &&
	        this.code() === other.code() &&
	        this.name() === other.name() &&
	        this.description() === other.description();
	
	    this.clone = (val) => {
	      const cProps = this.properties();
	      cProps.clone = true;
	      cProps.value = val === undefined ? this.value() : val;
	      cProps.description = this.description();
	      delete cProps.notMetric;
	      return new Property(this.code(), this.name(), cProps);
	    }
	    if(!clone) Property.list[code] = this;
	    else if (!this.properties().copy && Property.list[code]) Property.list[code].addChild(this);
	  }
	}
	Property.list = {};
	Property.DO_NOT_CLONE = true;
	
	new Property();
	
	module.exports = Property
	
});


RequireJS.addFunction('./app-src/input/inputs.js',
function (require, exports, module) {
	const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
	const Cost = require('../cost/cost.js');
	const Select = require('../../../../public/js/utils/input/styles/select.js');
	const Material = require('../cost/types/material.js');
	const Company = require('../objects/company.js');
	const Input = require('../../../../public/js/utils/input/input.js');
	const Labor = require('../cost/types/labor.js');
	
	
	const defined = {};
	function add (name, input) {
	  if (defined[name]) {
	    throw new Error(`Input by the name of '${name}' is already defined`)
	  }
	  defined[name] = input;
	}
	
	module.exports = (name, properties) => defined[name].clone(properties);
	
	
	add('length', new MeasurementInput({
	  type: 'text',
	  placeholder: 'Length',
	  name: 'length',
	  class: 'center'
	}));
	
	add('width', new MeasurementInput({
	  type: 'text',
	  label: 'x',
	  placeholder: 'Width',
	  name: 'width',
	  class: 'center'
	}));
	
	add('depth', new MeasurementInput({
	  type: 'text',
	  label: 'x',
	  placeholder: 'Depth',
	  name: 'depth',
	  class: 'center'
	}));
	
	add('cost', new MeasurementInput({
	  type: 'number',
	  label: '$',
	  placeholder: 'Cost',
	  name: 'cost'
	}));
	
	add('pattern', new MeasurementInput({
	  type: 'text',
	  class: 'pattern-input',
	}));
	
	
	add('offsetLen', new MeasurementInput({
	  type: 'text',
	  label: 'Offset',
	  placeholder: 'Length',
	  name: 'offsetLength',
	  class: 'center',
	}));
	
	add('offsetWidth', new MeasurementInput({
	  type: 'text',
	  label: 'x',
	  placeholder: 'Width',
	  name: 'offsetWidth',
	  class: 'center',
	}));
	
	add('offsetDepth', new MeasurementInput({
	  type: 'text',
	  label: 'x',
	  placeholder: 'Depth',
	  name: 'offsetDepth',
	  class: 'center',
	}));
	
	
	add('costType', new Select({
	  placeholder: 'Type',
	  name: 'type',
	  class: 'center',
	  list: Cost.typeList
	}));
	
	add('method', new Select({
	  name: 'method',
	  class: 'center',
	  list: Material.methodList,
	}));
	
	add('company', new Select({
	  name: 'company',
	  label: 'Company',
	  class: 'center',
	  list: [''].concat(Object.keys(Company.list)),
	  value: ''
	}));
	
	add('childCost', new Select({
	    name: 'child',
	    label: 'Default',
	    class: 'center',
	}));
	
	
	add('id', new Input({
	  type: 'text',
	  placeholder: 'Id',
	  name: 'id',
	  class: 'center',
	  validation: /^\s*[^\s]{1,}\s*$/,
	  errorMsg: 'You must enter an Id'
	}));
	
	add('propertyId', new Input({
	  type: 'text',
	  placeholder: 'Property Id',
	  name: 'propertyId',
	  class: 'center',
	  validation: /^[a-zA-Z\.]{1}$/,
	  errorMsg: 'Alpha Numeric Value seperated by \'.\'.<br>I.E. Cabinet=>1/2 Overlay = Cabinet.12Overlay'
	}));
	
	add('propertyValue', new Input({
	  type: 'text',
	  placeholder: 'Property Value',
	  name: 'propertyValue',
	  class: 'center'
	}));
	
	add('costId', new Input({
	  type: 'text',
	  placeholder: 'Id',
	  name: 'id',
	  class: 'center',
	  validation: (id, values) =>
	      id !== '' && (!values.referenceable || Object.values(Cost.defined).indexOf(id) === -1),
	  errorMsg: 'You must an Id: value must be unique if Referencable.'
	}));
	
	add('name', new Input({
	  type: 'text',
	  placeholder: 'Name',
	  name: 'name',
	  value: 'peach',
	  class: 'center',
	  validation: /^\s*[^\s].*$/,
	  errorMsg: 'You must enter a Name'
	}));
	
	add('color', new Input({
	  type: 'color',
	  validation: /.*/,
	  placeholder: 'color',
	  name: 'color',
	  class: 'center'
	}));
	
	add('optional', new Input({
	  label: 'Optional',
	  name: 'optional',
	  type: 'checkbox',
	  default: false,
	  validation: [true, false],
	  targetAttr: 'checked'
	}));
	
	add('modifyDemension', new Input({
	  label: 'Modify Demension',
	  name: 'modifyDemension',
	  type: 'checkbox',
	  default: false,
	  validation: [true, false],
	  targetAttr: 'checked'
	}));
	
	add('partNumber', new Input({
	  label: 'Part Number',
	  name: 'partNumber',
	  type: 'text'
	}));
	
	add('count', new Input({
	  label: 'Count',
	  name: 'count',
	  type: 'number',
	  value: 1
	}));
	
	add('quantity', new Input({
	  label: 'Quantity',
	  name: 'quantity',
	  type: 'number',
	  value: 0
	}));
	
	add('hourlyRate', new Input({
	  label: 'Hourly Rate',
	  name: 'hourlyRate',
	  type: 'number',
	}));
	
	add('hours', new Input({
	  label: 'Hours',
	  name: 'hours',
	  type: 'number',
	  value: 0
	}));
	
	add('laborType', new Input({
	  name: 'laborType',
	  placeholder: 'Labor Type',
	  label: 'Type',
	  class: 'center',
	  clearOnClick: true,
	  list: Labor.types
	}));
	
	add('formula', new Input({
	  name: 'formula',
	  placeholder: 'Formula',
	  label: 'Formula',
	  class: 'center'
	}));
	
});


RequireJS.addFunction('./app-src/display-utils/displayManager.js',
function (require, exports, module) {
	

	
	const du = require('../../../../public/js/utils/dom-utils.js');
	const $t = require('../../../../public/js/utils/$t.js');
	
	class DisplayManager {
	  constructor(displayId, listId, switchId, selected) {
	    if (switchId && !listId) throw new Error('switchId can be defined iff listId is defined');
	    const id = String.random();
	    const instance = this;
	    this.list = (func) => {
	      const list = [];
	      const runFunc = (typeof func) === 'function';
	      const displayElems = du.id(displayId).children;
	      for (let index = 0; index < displayElems.length; index += 1) {
	        const elem = displayElems[index];
	        let id = elem.id || String.random(7);
	        elem.id = id;
	        name = elem.getAttribute('name') || id;
	        const item = {id, name, link: elem.getAttribute('link')};
	        if (runFunc) func(elem);
	        list.push(item);
	      }
	      return list;
	    }
	
	    function updateActive(id) {
	      const items = document.querySelectorAll('.display-manager-input');
	      for (let index = 0; index < items.length; index += 1) {
	        const elem = items[index];
	        elem.getAttribute('display-id') === id ?
	              du.class.add(elem, 'active') : du.class.remove(elem, 'active');
	      }
	    }
	
	    function open(id) {
	      const displayElems = du.id(displayId).children;
	      for (let index = 0; index < displayElems.length; index += 1) {
	        const elem = displayElems[index];
	        if (elem.id === id) {
	          const link = elem.getAttribute('link');
	          if (link) {
	            window.location.href = link;
	            return;
	          }
	          elem.hidden = false;
	        }
	        else elem.hidden = true;
	      }
	      updateActive(id);
	    }
	
	    this.open = open;
	
	    const children = du.id(displayId).children;
	
	    if (switchId) {
	      du.on.match('click', `#${switchId}`, (target, event) => {
	        const listElem = du.id(listId);
	        listElem.hidden = !listElem.hidden;
	      });
	      document.addEventListener('click', (event) => {
	        const listElem = du.id(listId);
	        const target = event.target;
	        const withinList = du.find.up(`#${listId}`, target) !== undefined;
	        if (!withinList && target.id !== switchId &&listElem)
	          listElem.hidden = true;
	      });
	    }
	    DisplayManager.instances[id] = this
	    if ((typeof selected) === 'string') setTimeout(() => open(selected), 100);
	    else if (children.length > 0) {
	      this.list();
	      open(children[0].id);
	    }
	    if (listId) {
	      du.id(listId).innerHTML = DisplayManager.template.render({id, switchId, list: this.list()});
	    }
	  }
	}
	
	DisplayManager.instances = {};
	DisplayManager.template = new $t('display-manager');
	
	du.on.match('click', '.display-manager-input', (target, event) => {
	  const displayManager = du.find.up('.display-manager', target);
	  const displayManagerId = displayManager.id;
	  const displayId = target.getAttribute('display-id');
	  DisplayManager.instances[displayManagerId].open(displayId);
	});
	module.exports = DisplayManager
	
});


RequireJS.addFunction('./app-src/display-utils/information-bar.js',
function (require, exports, module) {
	

	
	const du = require('../../../../public/js/utils/dom-utils.js');
	
	class InformationBar {
	  constructor() {
	    const container = du.create.element('div');
	    container.className = 'information-bar';
	
	    this.show = () => container.hidden = false;
	    this.hide = () => container.hidden = true;
	    this.update = (html) => container.innerHTML = html;
	
	    document.body.append(container);
	  }
	}
	module.exports = InformationBar
	
	
	
	
	
});


RequireJS.addFunction('./app-src/display-utils/radio-display.js',
function (require, exports, module) {
	

	
	const InformationBar = require('./information-bar.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	
	class RadioDisplay {
	  constructor(radioClass, groupAttr, alternateToggleClass) {
	    const selector = (attrVal) => {
	      return groupAttr ? `.${radioClass}[${groupAttr}="${attrVal}"]` : `.${radioClass}`;
	    }
	
	    const infoBar = new InformationBar();
	
	    function path () {
	      let path = '';
	      const info = du.find.downInfo(`.${radioClass}.open`, document.body, null, `.${radioClass}.close`);
	      info.matches.forEach((obj) => {
	        const header = obj.node.children[0];
	        if (header && header.getBoundingClientRect().y < 8) {
	          path += `${header.innerText}=>`
	        }
	      });
	      return path;
	    }
	
	    function triggerAlternateToggles(target) {
	      if (alternateToggleClass) {
	        const alterToggles = document.querySelectorAll(alternateToggleClass);
	        alterToggles.forEach((elem) => elem.hidden = false);
	        const closest = du.closest(alternateToggleClass, target);
	        if (closest) closest.hidden = true;
	      }
	    }
	
	    du.on.match('scroll', `*`, (target, event) => {
	      infoBar.update(path());
	    });
	
	    du.on.match('click', `.${radioClass} > .expand-header`, (targetHeader, event) => {
	      const target = targetHeader.parentElement;
	      const attrVal = target.getAttribute(groupAttr);
	      const targetBody = target.children[1];
	      const hidden = targetBody.hidden;
	      targetBody.hidden = !hidden;
	      if (hidden) {
	        du.class.add(targetHeader, 'active');
	        du.class.swap(target, 'open', 'close');
	        const siblings = document.querySelectorAll(selector(attrVal));
	        for (let index = 0; index < siblings.length; index += 1) {
	          if (siblings[index] !== target) {
	            const sibHeader = siblings[index].children[0];
	            const sibBody = siblings[index].children[1];
	            du.class.swap(siblings[index], 'close', 'open');
	            sibBody.hidden = true;
	            du.class.remove(sibHeader, 'active');
	          }
	        }
	      } else {
	        du.class.swap(target, 'close', 'open');
	        du.class.remove(targetHeader, 'active');
	      }
	      infoBar.update(path());
	    });
	  }
	}
	module.exports = RadioDisplay
	
});


RequireJS.addFunction('./app-src/display-utils/toggle-display-list.js',
function (require, exports, module) {
	

	
	const du = require('../../../../public/js/utils/dom-utils.js');
	
	
	const ToggleDisplayList = {};
	ToggleDisplayList.class = 'toggle-display-list';
	ToggleDisplayList.funcs = {};
	
	ToggleDisplayList.onShow = (displayId, func) => {
	  if ((typeof func) === 'function') {
	    if (ToggleDisplayList.funcs[displayId] === undefined) {
	      ToggleDisplayList.funcs[displayId] = [];
	    }
	    ToggleDisplayList.funcs[displayId].push(func);
	  }
	}
	
	ToggleDisplayList.runFuncs = (displayId) => {
	  if (ToggleDisplayList.funcs[displayId] === undefined) return;
	  ToggleDisplayList.funcs[displayId].forEach((func) => func(displayId));
	}
	
	ToggleDisplayList.toggle = function (elem, event) {
	  const target = event.target;
	  const children = elem.children;
	  for (let index = 0; index < children.length; index += 1) {
	    const child = children[index];
	    if (target === child) {
	      du.class.add(child, 'active');
	      const displayId = child.getAttribute('display-id');
	      du.id(displayId).hidden = false;
	      ToggleDisplayList.runFuncs(displayId);
	    } else {
	      du.class.remove(child, 'active');
	      du.id(child.getAttribute('display-id')).hidden = true;
	    }
	  }
	}
	
	du.on.match('click', `.${ToggleDisplayList.class}`, ToggleDisplayList.toggle);
	
	module.exports = ToggleDisplayList;
	
});


RequireJS.addFunction('./app-src/displays/feature.js',
function (require, exports, module) {
	

	const $t = require('../../../../public/js/utils/$t');
	
	class FeatureDisplay {
	  constructor(assembly, parentSelector) {
	    this.html = () => FeatureDisplay.template.render({features: assembly.features, id: 'root'});
	    this.refresh = () => {
	      const container = document.querySelector(parentSelector);
	      container.innerHTML = this.html;
	    }
	  }
	}
	FeatureDisplay.template = new $t('features');
	module.exports = FeatureDisplay
	
});


RequireJS.addFunction('./app-src/displays/cabinet.js',
function (require, exports, module) {
	

	
	const Show = require('../show.js');
	const Select = require('../../../../public/js/utils/input/styles/select.js');
	const ThreeDMain = require('../displays/three-d-main.js');
	const TwoDLayout = require('../two-d/layout');
	const OpenSectionDisplay = require('./open-section.js');
	const CabinetConfig = require('../config/cabinet-configs.js');
	const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
	const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	const Request = require('../../../../public/js/utils/request.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const bind = require('../../../../public/js/utils/input/bind.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const { Object2d } = require('../objects/layout.js');//.Object2d;
	const Inputs = require('../input/inputs.js');
	const EPNTS = require('../../generated/EPNTS');
	
	
	function getHtmlElemCabinet (elem) {
	  const cabinetId = du.find.up('[cabinet-id]', elem).getAttribute('cabinet-id');
	  return Cabinet.get(cabinetId);
	}
	
	class CabinetDisplay {
	  constructor(parentSelector, group) {
	    let propId = 'Half Overlay';
	    let displayId = String.random();
	    const instance = this;
	    this.propId = (id) => {
	      if (id ===  undefined) return propId;
	      propId = id;
	    }
	    function displayValue(val) {
	      return new Measurement(val).display();
	    }
	    const getHeader = (cabinet, $index) =>
	        CabinetDisplay.headTemplate.render({cabinet, $index, displayValue, displayId});
	    const showTypes = Show.listTypes();
	    const getBody = (cabinet, $index) => {
	      if (expandList.activeKey() === $index) {
	        TwoDLayout.panZoom.once();
	        ThreeDMain.update(cabinet);
	      }
	      const scope = {$index, cabinet, showTypes, OpenSectionDisplay};
	      return CabinetDisplay.bodyTemplate.render(scope);
	    }
	
	    function inputValidation(values) {
	      // const validName = values.name !== undefined;
	      // const validType = CabinetConfig.valid(values.type, values.id);
	      if(true) return true;
	      return {type: 'You must select a defined type.'};
	    }
	
	    function updateLayout(target) {
	      setTimeout(() => {
	        const attr = target.name === 'thickness' ? 'height' : 'width';
	        const cabinet = getHtmlElemCabinet(target);
	        const obj2d = Object2d.get(cabinet.uniqueId());
	        const value = new Measurement(target.value, true).decimal();
	        console.log('new cab val', value);
	        obj2d.topview()[attr](value);
	        TwoDLayout.panZoom.once();
	      }, 1000);
	    }
	
	    du.on.match('change', '.cabinet-input.dem[name="width"],.cabinet-input.dem[name="thickness"', updateLayout);
	    du.on.match('blur', '.cabinet-input.dem[name="width"],.cabinet-input.dem[name="thickness"', updateLayout);
	
	    function updateCabValue(cabinet, attr) {
	      const inputCnt = du.find(`[cabinet-id='${cabinet.uniqueId()}']`);
	      const input = du.find.down(`[name='${attr}']`, inputCnt);
	      input.value = displayValue(cabinet[attr]());
	    }
	
	    function removeFromLayout(elem, cabinet) {
	      group.room().layout().removeByPayload(cabinet);
	      TwoDLayout.panZoom.once();
	    }
	
	    function linkLayout(cabinet, obj2d) {
	      console.log('linking!')
	      const square = obj2d.topview().object();
	      if (square.width() !== cabinet.width()) {
	        cabinet.width(square.width());
	        updateCabValue(cabinet, 'width');
	      }
	      if (square.height() !== cabinet.thickness()) {
	        cabinet.thickness(square.height());
	        updateCabValue(cabinet, 'thickness');
	      }
	    }
	
	    const getObject = (values) => {
	      const cabinet = CabinetConfig.get(group, values.type, values.propertyId, values.name || values.id);
	      const obj2d = group.room().layout().addObject(cabinet.uniqueId(), cabinet, cabinet.name);
	      obj2d.topview().onChange(() => linkLayout(cabinet, obj2d));
	      return cabinet;
	    };
	    this.active = () => expandList.active();
	    const expListProps = {
	      list: group.cabinets,
	      dontOpenOnAdd: true,
	      type: 'top-add-list',
	      inputTree:   CabinetConfig.inputTree(),
	      parentSelector, getHeader, getBody, getObject, inputValidation,
	      listElemLable: 'Cabinet'
	    };
	    const expandList = new ExpandableList(expListProps);
	    expandList.afterRemoval(removeFromLayout);
	    this.refresh = () => expandList.refresh();
	
	    const cabinetKey = (path) => {
	      const split = path.split('.');
	      const index = split[0];
	      const key = split[1];
	      const cabinet = expListProps.list[index];
	      return {cabinet, key};
	    }
	
	    const valueUpdate = (path, value) => {
	      const cabKey = cabinetKey(path);
	      const decimal = new Measurement(value, true).decimal();
	      cabKey.cabinet.value(cabKey.key, !Number.isNaN(decimal) ? decimal : val);
	      TwoDLayout.panZoom.once();
	      ThreeDMain.update(cabKey.cabinet);
	    }
	
	    const attrUpdate = (path, value) => {
	      const cabKey = cabinetKey(path);
	      cabKey.cabinet[cabKey.key](value);
	      TwoDLayout.panZoom.once();
	    }
	
	    const saveSuccess = () => console.log('success');
	    const saveFail = () => console.log('failure');
	    const save = (target) => {
	      const index = target.getAttribute('index');
	      const cabinet = expListProps.list[index];
	      if (cabinet.name !== undefined) {
	        Request.post(EPNTS.cabinet.add(cabinet.name()), cabinet.toJson(), saveSuccess, saveFail);
	        console.log('saving');
	      } else {
	        alert('Please enter a name if you want to save the cabinet.')
	      }
	    }
	
	    CabinetConfig.onUpdate(() => props.inputOptions = CabinetConfig.list());
	    bind(`.cabinet-input`, valueUpdate,
	                  {validation: Measurement.validation('(0,)')});
	    bind(`[display-id="${displayId}"].cabinet-id-input`, attrUpdate);
	    du.on.match('click', '.save-cabinet-btn', save);
	  }
	}
	CabinetDisplay.bodyTemplate = new $t('cabinet/body');
	CabinetDisplay.headTemplate = new $t('cabinet/head');
	module.exports = CabinetDisplay
	
});


RequireJS.addFunction('./app-src/displays/group.js',
function (require, exports, module) {
	

	
	const Group = require('../objects/group.js');
	const PropertyConfig = require('../config/property/config.js');
	const Properties = require('../config/properties.js');
	const CabinetDisplay = require('./cabinet.js');
	const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const Select = require('../../../../public/js/utils/input/styles/select.js');
	const Input = require('../../../../public/js/utils/input/input.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const bind = require('../../../../public/js/utils/input/bind.js');
	const ThreeDMain = require('../displays/three-d-main.js');
	
	const currentStyleState = {};
	
	function disableButton(values, dit, elem) {
	  const nId = dit.node.constructor.decode(dit.root().id()).id;
	  const currState = currentStyleState[nId];
	  const rootId = dit.node.constructor.decode(dit.root().id()).id;
	  const button = du.find(`button[root-id='${rootId}']`);
	  if (button) button.hidden = Object.equals(currState, values);
	  const headers = du.find.downAll('.group-header', du.find.up('.group-cnt', button));
	  headers.forEach((header) => {
	    header.hidden = currState.style !== header.getAttribute("cab-style");
	    if (!header.hidden) du.find.down('.group-key', header).innerText = currState.subStyle;
	  });
	}
	
	class GroupDisplay extends Lookup {
	  constructor(group) {
	    super();
	    function setCurrentStyleState(values) {
	      values = values || dit.values();
	      const nId = dit.node.constructor.decode(dit.root().id()).id;
	      currentStyleState[nId] = values;
	      disableButton(values, dit);
	      return values;
	    }
	    function onCabinetStyleSubmit(values) {
	      setCurrentStyleState(values);
	      group.propertyConfig.set(values.style, values.subStyle);
	      ThreeDMain.update();
	    }
	
	    let initialized = false;
	    function initializeDitButton() {
	      if (initialized) disableButton(dit.values(), dit);
	      else {
	        disableButton(setCurrentStyleState(), dit);
	        initialized = true;
	      }
	    }
	    const dit = GroupDisplay.DecisionInputTree(onCabinetStyleSubmit, group.propertyConfig);
	    function styleSelector() {
	      return dit.root().payload().html();
	    }
	    function propertyHtml() {return GroupDisplay.propertyMenuTemplate.render({styleSelector})};
	    this.html = () => {
	      return GroupDisplay.headTemplate.render({group, propertyHtml, groupDisplay: this});
	    }
	    this.bodyHtml = () =>  {
	      setTimeout(initializeDitButton, 200);
	      return GroupDisplay.bodyTemplate.render({group, propertyHtml});
	    }
	
	    this.cabinetDisplay = new CabinetDisplay(`[group-id="${group.id()}"].cabinet-cnt`, group);
	    this.cabinet = () => this.cabinetDisplay().active();
	  }
	}
	
	GroupDisplay.DecisionInputTree = (onSubmit, propertyConfigInst) => {
	  const dit = new DecisionInputTree(undefined, {buttonText: 'Change'});
	  dit.onChange(disableButton);
	  dit.onSubmit(onSubmit);
	  const propertyConfig = new PropertyConfig();
	  const styles = propertyConfig.cabinetStyles();
	  const cabinetStyles = new Select({
	    name: 'style',
	    list: styles,
	    label: 'Style',
	    value: propertyConfigInst.cabinetStyle()
	  });
	
	  const hasFrame = new Select({
	      name: 'FrameStyle',
	      list: ['Frameless', 'Framed', 'Frame Only'],
	      value: 'Frameless'
	    });
	
	  const style = dit.branch('style', [hasFrame, cabinetStyles]);
	  styles.forEach((styleName) => {
	    const properties = Properties.groupList(styleName);
	    const selectObj = Object.keys(properties);
	    const select = new Select({
	      name: 'subStyle',
	      list: selectObj,
	      value: propertyConfigInst.cabinetStyleName()
	    });
	    const condtionalPayload = new DecisionInputTree.ValueCondition('style', [styleName], [select]);
	    style.conditional(styleName, condtionalPayload);
	  });
	
	  return dit;
	}
	
	du.on.match('click', `.group-display-header`, (target) => {
	  const allBodys = du.find.all('.group-display-body');
	  for (let index = 0; index < allBodys.length; index += 1) {
	    allBodys[index].hidden = true;
	  }
	  const allHeaders = du.find.all('.group-display-header');
	  for (let index = 0; index < allHeaders.length; index += 1) {
	    du.class.remove(allHeaders[index], 'active');
	  }
	  du.class.add(target, 'active');
	  const body = du.find.closest('.group-display-body', target);
	  const groupDisplayId = du.find.up('[group-display-id]', target).getAttribute('group-display-id');
	  const groupDisplay = GroupDisplay.get(groupDisplayId);
	  body.innerHTML = groupDisplay.bodyHtml();
	  groupDisplay.cabinetDisplay.refresh();
	  body.hidden = false;
	});
	
	GroupDisplay.valueUpdate = (target) => {
	  const group = Group.get(target.getAttribute('group-id'));
	  const value = target.value;
	  group.name(value);
	}
	
	du.on.match('change', `[group-id].group-input`, GroupDisplay.valueUpdate);
	
	GroupDisplay.headTemplate = new $t('group/head');
	GroupDisplay.bodyTemplate = new $t('group/body');
	GroupDisplay.propertyMenuTemplate = new $t('properties/property-menu');
	module.exports = GroupDisplay
	
});


RequireJS.addFunction('./app-src/config/cabinet-configs.js',
function (require, exports, module) {
	

	
	const CustomEvent = require('../../../../public/js/utils/custom-error.js');
	const cabinetBuildConfig = require('../../public/json/cabinets.json');
	const Select = require('../../../../public/js/utils/input/styles/select.js');
	const Input = require('../../../../public/js/utils/input/input.js');
	const Inputs = require('../input/inputs.js');
	const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
	const Request = require('../../../../public/js/utils/request.js');
	const EPNTS = require('../../generated/EPNTS.js');
	const CabinetTemplate = require('./cabinet-template');
	const ValueCondition = require('../../../../public/js/utils/input/decision/decision.js').ValueCondition;
	
	class CabinetConfig {
	  constructor() {
	    let cabinetList = {};
	    let cabinetKeys = {};
	    let configKeys;
	    const updateEvent = new CustomEvent('update');
	    function setLists(cabinets) {
	      const allCabinetKeys = Object.keys(cabinets);
	      allCabinetKeys.forEach((key) => {
	        const type = cabinets[key].partName;
	        if (cabinetKeys[type] === undefined)  cabinetKeys[type] = {};
	        if (cabinetKeys[type][key] === undefined)  cabinetKeys[type][key] = {};
	        cabinetKeys[type][key] = cabinets[key];
	      });
	
	      cabinetList = cabinets;
	      configKeys = Object.keys(cabinetBuildConfig);
	      updateEvent.trigger();
	    }
	
	    this.valid = (type, id) => (!id ?
	    cabinetBuildConfig[type] : cabinetKeys[type][id]) !== undefined;
	
	    this.onUpdate = (func) => updateEvent.on(func);
	    this.inputTree = () => {
	      const types = JSON.parse(JSON.stringify(configKeys));
	      const typeInput = new Select({
	        name: 'type',
	        class: 'center',
	        list: types
	      });
	      const nameInput = new Input({
	        name: 'name',
	        label: 'Name (optional)',
	        class: 'center',
	      });
	      const inputs = [typeInput, nameInput];
	      const inputTree = new DecisionInputTree();
	      inputTree.onSubmit((t) => {
	        inputTree.payload().inputArray[1].setValue('', true)
	        inputTree.children()[0].payload().inputArray[0].setValue('', true)
	      });
	      const cabinet = inputTree.branch('Cabinet', inputs);
	      const cabinetTypes = Object.keys(cabinetKeys);
	      types.forEach((type) => {
	
	        const cabinetInput = new Input({
	          label: 'Layout (Optional)',
	          name: 'id',
	          class: 'center',
	          clearOnDblClick: true,
	          list: [''].concat(cabinetKeys[type] ? Object.keys(cabinetKeys[type]) : [])
	        });
	        cabinet.conditional(type, new ValueCondition('type', type, [cabinetInput]));
	      });
	      return inputTree;
	    };
	    this.get = (group, type, propertyId, id) => {
	      let cabinet;
	      if (!cabinetList || !cabinetList[id]) cabinet = Cabinet.build(type, group);
	      else cabinet = Cabinet.fromJson(cabinetList[id], group);
	      if (propertyId !== undefined) cabinet.propertyId(propertyId);
	      cabinet.name(id);
	      return cabinet;
	    };
	
	    Request.get(EPNTS.cabinet.list(), setLists, setLists);
	  }
	}
	
	CabinetConfig = new CabinetConfig();
	module.exports = CabinetConfig
	
});


RequireJS.addFunction('./app-src/config/cabinet-template.js',
function (require, exports, module) {
	
const cabinetsJson = require('../../public/json/cabinets.json');
	const Cabinet = require('../objects/assembly/assemblies/cabinet.js')
	const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const PropertyConfig = require('./property/config');
	
	class CabinetTemplate extends Lookup {
	  constructor(type) {
	    super();
	    const instance = this;
	    const initialVals = (typeof type) === 'object' ? type : {
	      type, values: [], subassemblies: [], joints: [], dividerJoint: {},
	      openings: [
	        {
	          "top": "pt",
	          "bottom": "pb",
	          "left": "pl",
	          "right": "pr",
	          "back": "pback"
	        }
	      ]
	    };
	    Object.getSet(this, initialVals);
	    CabinetTemplate.map[type] = this;
	
	    function getCabinet(length, width, thickness, pc) {
	      const cabinet = Cabinet.build(instance.type(), undefined, instance.toJson());
	      cabinet.length(length);
	      cabinet.width(width);
	      cabinet.thickness(thickness);
	
	      cabinet.propertyConfig = pc instanceof PropertyConfig ? pc : new PropertyConfig();
	      return cabinet;
	    }
	    this.getCabinet = getCabinet;
	
	    this.codeMap = () => {
	      let codeMap = {};
	      Object.values(this.subassemblies()).forEach((sa) => codeMap[sa.code] = sa);
	      return codeMap;
	    }
	
	    this.validPartCode = (code) => this.codeMap()[code] !== undefined;
	    const vpc = this.validPartCode;
	
	    this.validOpenings = () => {
	      const bms = this.openings();
	      for (let index = 0; index < bms.length; index += 1) {
	        const bm = bms[index];
	        if (!(vpc(bm.top) && vpc(bm.bottom) && vpc(bm.right) &&
	                vpc(bm.left) && vpc(bm.bottom))) {
	          return false;
	        }
	      }
	      return true;
	    }
	    this.validateDividerJoint = () => {
	      const j = this.dividerJoint();
	      return j.type === 'Butt' || (j.type === 'Dado' && j.maleOffset > 0);
	    }
	
	    const offsetReg = /(-|\+|)[xyz]/;
	    this.validOffset = (offset) => offset && offset.match(offsetReg) !== null;
	    const vo = this.validOffset;
	
	    this.validateJoint = (joint, malePartCode, femalePartCode) => {
	      let isValid = vpc(malePartCode) && vpc(femalePartCode);
	      switch (joint.type) {
	        case "Dado":
	          return isValid && joint.maleOffset > 0 && vo(joint.demensionToOffset) &&
	                  vo(joint.centerOffset);
	        default:
	          return true;
	      }
	    }
	    this.validateJoints = () => {
	      let joints = this.joints();
	      for (let index = 0; index < joints.length; index += 1) {
	        if (!this.validateJoint(joints[index])) return false;
	      }
	      return true;
	    }
	
	    this.evalEqn = (eqn, cab) => {
	      cab ||= getCabinet();
	      return cab.eval(eqn);
	    }
	
	    this.validateEquation = (eqn, cab) => {
	      return !Number.isNaN(this.evalEqn(eqn, cab));
	    }
	    const veq = this.validateEquation;
	
	    this.validateValues = (cab) => {
	      try {
	        cab ||= getCabinet();
	      } catch (e) {
	        return false;
	      }
	      const values = Object.values(this.values());
	      for (let index = 0; index < values.length; index += 1) {
	        if (!veq(values[index].eqn, cab)) return false;
	      }
	      return true;
	    }
	
	    this.validateSubassembly = (subAssem, cab) => {
	      try {
	        cab ||= getCabinet();
	      } catch (e) {
	        return false;
	      }
	
	      const c = subAssem.center;
	      const d = subAssem.demensions;
	      const r = subAssem.rotation;
	      return vpc(subAssem.code) &&
	              r.length === 3 && veq(r[0], cab) && veq(r[1], cab) && veq(r[2], cab) &&
	              veq(c[0], cab) && veq(c[1], cab) && veq(c[2], cab) &&
	              veq(d[0], cab) && veq(d[1], cab) && veq(d[2], cab);
	    }
	
	    this.validateSubassemblies = (cab) => {
	      try {
	        cab ||= getCabinet();
	      } catch (e) {
	        return false;
	      }      const subAssems = Object.values(this.subassemblies());
	      for (let index = 0; index < subAssems.length; index += 1) {
	        if (!this.validateSubassembly(subAssems[index])) return false;
	      }
	      return true;
	    }
	
	    this.valid = () => {
	      let cab;
	      try {
	        cab ||= getCabinet();
	      } catch (e) {
	        return false;
	      }
	      return this.validateValues(cab) && this.validOpenings() &&
	              this.validateDividerJoint() && this.validateJoints() &&
	              this.validateSubassemblies(cab);
	    }
	  }
	}
	
	CabinetTemplate.map = {};
	CabinetTemplate.defaultList = () => {
	  const list = [];
	  const keys = Object.keys(cabinetsJson);
	  for (let index = 0; index < keys.length; index += 1) {
	    list.push(new CabinetTemplate().fromJson(cabinetsJson[keys[index]]));
	  }
	  return list;
	}
	
	CabinetTemplate.typeUndefined = (type) => CabinetTemplate.map[type] === undefined;
	
	module.exports = CabinetTemplate;
	
});


RequireJS.addFunction('./app-src/config/properties.js',
function (require, exports, module) {
	

	const Property = require('./property');
	const Defs = require('./property/definitions');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	const EPNTS = require('../../generated/EPNTS');
	const Request = require('../../../../public/js/utils/request.js');
	
	let unitCount = 0;
	const UNITS = [];
	Measurement.units().forEach((unit) =>
	      UNITS.push(new Property('Unit' + ++unitCount, unit, unit === Measurement.unit())));
	UNITS._VALUE = Measurement.unit();
	
	const assemProps = {}
	const add = (key, properties) => properties.forEach((prop) => {
	  if (assemProps[key] === undefined) assemProps[key] = {};
	  assemProps[key][prop.code()] = prop;
	});
	
	add('Overlay', [Defs.ov]);
	add('Reveal', [Defs.r,Defs.rvt,Defs.rvb,Defs.rvr,Defs.rvl]);
	add('Inset', [Defs.is]);
	add('Cabinet', [Defs.h,Defs.w,Defs.d,Defs.sr,Defs.sl,Defs.rvibr,Defs.rvdd,
	                Defs.tkbw,Defs.tkd,Defs.tkh,Defs.pbt,Defs.iph, Defs.brr,
	                Defs.frw,Defs.frt]);
	add('Panel', [Defs.h,Defs.w,Defs.t]);
	add('Guides', [Defs.l,Defs.dbtos,Defs.dbsos,Defs.dbbos]);
	add('DoorAndFront', [Defs.daffrw,Defs.dafip])
	add('Door', [Defs.h,Defs.w,Defs.t]);
	add('DrawerBox', [Defs.h,Defs.w,Defs.d,Defs.dbst,Defs.dbbt,Defs.dbid,Defs.dbn]);
	add('DrawerFront', [Defs.h,Defs.w,Defs.t,Defs.mfdfd]);
	add('Frame', [Defs.h,Defs.w,Defs.t]);
	add('Handle', [Defs.l,Defs.w,Defs.c2c,Defs.proj]);
	add('Hinge', [Defs.maxtab,Defs.mintab,Defs.maxol,Defs.minol]);
	add('Opening', []);
	
	function definitionsRequired(group) {
	  const required = [];
	  if (assemProps[group] === undefined) return [];
	  Object.values(assemProps[group]).forEach((prop) => {
	    if (prop instanceof Property && prop.value() !== null) required.push(prop);
	  });
	  return required;
	}
	
	function propertiesToDefine() {
	  const propNames = [];
	  const keys = Object.keys(assemProps);
	  keys.forEach((key) => {
	    if (definitionsRequired(key).length !== 0) {
	      propNames.push(key);
	    }
	  });
	  return propNames;
	}
	
	const excludeKeys = ['_ID', '_NAME', '_GROUP', 'properties'];
	function assemProperties(clazz, filter) {
	  clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
	  props = assemProps[clazz] || [];
	  if ((typeof filter) != 'function') return props;
	  props = props.filter(filter);
	  return props;
	}
	
	
	let config = {};
	const changes = {};
	const copyMap = {};
	assemProperties.changes = {
	  saveAll: () => Object.values(changes).forEach((list) => assemProperties.changes.save(list._ID)),
	  save: (id) => {
	    const list = changes[id];
	    if (!list) throw new Error(`Unkown change id '${id}'`);
	    const group = list._GROUP;
	    if (config[group] === undefined) config[group] = [];
	    if(copyMap[id] === undefined) {
	      config[group][list._NAME] = {name: list._NAME, properties: JSON.clone(list, excludeKeys, true)};
	      copyMap[list._ID] = config[group][list._NAME].properties;
	    } else {
	      const tempList = changes[id];
	      for (let index = 0; index < tempList.length; index += 1) {
	        const tempProp = tempList[index];
	        const configProp = copyMap[id][index];
	        configProp.value(tempProp.value());
	      }
	    }
	   },
	  deleteAll: () => Object.values(changes).forEach((list) => assemProperties.changes.delete(list._GROUP)),
	  delete: (id) => {
	    delete config[changes[id][0].name()][changes[id]._NAME];
	    delete changes[id];
	    delete copyMap[id];
	  },
	  changed: (id) => {
	    const list = changes[id];
	    if (list === undefined) return false;
	    for (let index = 0; index < list.length; index += 1) {
	      const prop = list[index];
	      if (prop === undefined || (copyMap[list._ID] !== undefined && copyMap[list._ID][index] === undefined)) {
	        console.log('booyacka!');
	      }
	      if (copyMap[list._ID] === undefined || !copyMap[list._ID][index].equals(prop)) {
	        return true;
	      }
	    }
	    return false;
	  },
	  changesExist: () => {
	      const lists = Object.values(changes);
	      for (let index = 0; index < lists.length; index += 1) {
	        if (assemProperties.changes.changed(lists[index]._ID)) {
	          return true;
	        }
	      }
	      return false;
	  }
	}
	
	assemProperties.config = () => {
	  const plainObj = {};
	  const keys = Object.keys(config);
	  for (let index = 0; index < keys.length; index += 1) {
	    const key = keys[index];
	    const lists = config[key];
	    const listKeys = Object.keys(lists);
	    plainObj[key] = {};
	    for (let lIndex = 0; lIndex < listKeys.length; lIndex += 1) {
	      const listKey = listKeys[lIndex];
	      const list = lists[listKey];
	      const propObj = {name: listKey, properties: []};
	      plainObj[key][listKey] = propObj;
	      list.properties.forEach((property) =>
	          propObj.properties.push(property.toJson(excludeKeys, true)))
	    }
	  }
	  return plainObj;
	}
	assemProperties.list = () => Object.keys(assemProps);
	assemProperties.new = (group, name) => {
	  if (assemProps[group]) {
	    const list = [];
	    let addIndex = 0;
	    const ogList = Object.values(assemProps[group]);
	    for (let index = 0; index < ogList.length; index += 1) {
	      if (hasValueFilter(ogList[index])) {
	        list[addIndex++] = ogList[index].clone();
	      }
	    }
	    list._ID = String.random();
	    list._GROUP = group;
	    list._NAME = name;
	    changes[list._ID] = list;
	    return list;
	  }
	  throw new Error(`Requesting invalid Property Group '${group}'`);
	}
	
	assemProperties.instance = () => {
	  const keys = Object.keys(assemProps);
	  const clone = {};
	  keys.forEach((key) => {
	    const props = Object.values(assemProps[key]);
	    if (clone[key] === undefined) clone[key] = {};
	    props[keys] = {};
	    props.forEach((prop) => clone[key][prop.code()] = prop.clone());
	  });
	  return clone;
	};
	
	assemProperties.getSet = (group, setName) => {
	  const clone = {};
	  let propertyObj = config[group][setName];
	  propertyObj.properties.forEach((prop) => clone[prop.code()] = prop.clone());
	  clone.__KEY = setName;
	  return clone;
	}
	
	const dummyFilter = () => true;
	assemProperties.groupList = (group, filter) => {
	  filter = filter || dummyFilter;
	  const groupList = config[group];
	  const changeList = {};
	  if (groupList === undefined) return {};
	  const groupKeys = Object.keys(groupList);
	  for (let index = 0; index < groupKeys.length; index += 1) {
	    const groupKey = groupKeys[index];
	    const list = groupList[groupKey];
	    const properties = groupList[list.name].properties;
	    const codes = properties.map((prop) => prop.code());
	    // const newProps = assemProps[group].filter((prop) => codes.indexOf(prop.code()) === -1)
	    //                   .filter(filter);
	    // newProps.forEach((prop) => properties.push(prop.clone()));
	    changeList[list.name] = {name: list.name, properties: []};
	    for (let pIndex = 0; pIndex < properties.length; pIndex += 1) {
	      const prop = properties[pIndex];
	      changeList[list.name].properties.push(prop.clone());
	    }
	    const uniqueId = String.random();
	    const set = changeList[list.name].properties;
	    set._ID = uniqueId;
	    set._NAME = list.name;
	    changes[uniqueId] = set;
	    copyMap[uniqueId] = properties;
	  }
	  return changeList;
	}
	
	const hasValueFilter = (prop) => prop.value() !== null;
	assemProperties.hasValue = (group) => {
	  if (props === undefined) return [];
	  return assemProperties.groupList(group, hasValueFilter);
	}
	
	const list = (key) =>
	    assemProps[key] ? Object.values(assemProps[key]) : [];
	
	const noValueFilter = (prop) => prop.value() === null;
	assemProperties.noValue = (group) => {
	  const props = list(group);
	  if (props === undefined) return [];
	  return props.filter(noValueFilter);
	}
	
	assemProperties.all = () => {
	  const props = {};
	  const keys = Object.keys(assemProps);
	  keys.forEach((key) => {
	    const l = [];
	    list(key).forEach((prop) => l.push(prop));
	    props[key] = l;
	  });
	  return props;
	}
	
	assemProperties.UNITS = UNITS;
	
	assemProperties.load = (body) => {
	  config = Object.fromJson(body);
	}
	
	assemProperties.definitionsRequired = definitionsRequired;
	assemProperties.propertiesToDefine = propertiesToDefine;
	module.exports = assemProperties;
	
});


RequireJS.addFunction('./app-src/displays/open-section.js',
function (require, exports, module) {
	

	
	const Section = require('../objects/assembly/assemblies/section/section.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const bind = require('../../../../public/js/utils/input/bind.js');
	const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
	const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
	const ThreeDMain = require('./three-d-main.js');
	const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const FeatureDisplay = require('./feature');
	const Inputs = require('../input/inputs.js');
	
	
	class SectionDisplay {
	  constructor (section) {
	    this.render = (scope) => {
	      scope.featureDisplay = new FeatureDisplay(scope.opening).html();
	      const cId = scope.opening.constructorId;
	      if (cId === 'DivideSection') {
	        return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
	      }
	      return SectionDisplay.template(section).render(scope);
	    }
	  }
	}
	
	const templates = {};
	const fileLocations = {};
	SectionDisplay.template = (section) => {
	  const cName = section.constructor.name;
	  if (fileLocations[cName] === undefined) {
	    const filename = cName.replace(/Section$/, '')
	                            .replace(/([a-z])([A-Z])/g, '$1-$2')
	                            .toLowerCase();
	    fileLocations[cName] = `sections/${filename}`;
	  }
	  const templatePath = fileLocations[cName];
	  if (templates[templatePath] === undefined) templates[templatePath] = new $t(templatePath);
	  return templates[templatePath];
	}
	
	du.on.match('change', '.feature-radio', (target) => {
	  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
	  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
	  target.nextElementSibling.hidden = !target.checked;
	});
	
	displays = {};
	SectionDisplay.render = (scope) => {
	  const uId = scope.opening.uniqueId();
	  if (displays[uId] === undefined) displays[uId] = new SectionDisplay(scope.opening);
	  return displays[uId].render(scope);
	}
	
	const OpenSectionDisplay = {};
	
	OpenSectionDisplay.html = (opening) => {
	  const openDispId = OpenSectionDisplay.getId(opening);
	  opening.init();
	  OpenSectionDisplay.sections[opening.uniqueId()] = opening;
	  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
	  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
	  return OpenSectionDisplay.template.render({opening, openDispId, patternInputHtml});
	}
	
	OpenSectionDisplay.getSelectId = (opening) => `opin-division-pattern-select-${opening.uniqueId()}`;
	OpenSectionDisplay.template = new $t('opening');
	OpenSectionDisplay.listBodyTemplate = new $t('divide/body');
	OpenSectionDisplay.listHeadTemplate = new $t('divide/head');
	OpenSectionDisplay.sections = {};
	OpenSectionDisplay.lists = {};
	OpenSectionDisplay.getId = (opening) => `open-section-display-${opening.uniqueId()}`;
	
	OpenSectionDisplay.getList = (root) => {
	  let openId = root.uniqueId();
	  if (OpenSectionDisplay.lists[openId]) return OpenSectionDisplay.lists[openId];
	  const sections = Section.sections();
	  const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
	  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
	  const list = root.sections;
	  const hideAddBtn = true;
	  const selfCloseTab = true;
	  let exList;
	  const clean = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
	  const getHeader = (opening, index) => {
	    const sections = index % 2 === 0 ? Section.getSections(false) : [];
	    return OpenSectionDisplay.listHeadTemplate.render({opening, sections, clean});
	  }
	  const getBody = (opening) => {
	    const list = OpenSectionDisplay.getList(root);
	    const getFeatureDisplay = (assem) => new FeatureDisplay(assem).html();
	    const assemblies = opening.getSubassemblies();
	    return SectionDisplay.render({assemblies, getFeatureDisplay, opening, list, sections});
	  }
	  const findElement = (selector, target) => du.find.down(selector, du.find.up('.expandable-list', target));
	  const expListProps = {
	    parentSelector, getHeader, getBody, getObject, list, hideAddBtn,
	    selfCloseTab, findElement, startClosed: true
	  }
	  exList = new ExpandableList(expListProps);
	  OpenSectionDisplay.lists[openId] = exList;
	  return exList;
	}
	OpenSectionDisplay.dividerControlTemplate = new $t('divider-controls');
	OpenSectionDisplay.updateDividers = (opening) => {
	  const selector = `[opening-id="${opening.uniqueId()}"].opening-cnt > .divider-controls`;
	  const dividerControlsCnt = document.querySelector(selector);
	  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
	  bind(`#${selectPatternId}`, (g, p) => opening.pattern(p), /.*/);
	  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
	  dividerControlsCnt.innerHTML = OpenSectionDisplay.dividerControlTemplate.render(
	          {opening, selectPatternId, patternInputHtml});
	}
	
	OpenSectionDisplay.changeIds = {};
	OpenSectionDisplay.refresh = (opening) => {
	  let changeId = (OpenSectionDisplay.changeIds[opening.uniqueId()] || 0) + 1;
	  OpenSectionDisplay.changeIds[opening.uniqueId()] = changeId;
	  setTimeout(()=> {
	    if (changeId === OpenSectionDisplay.changeIds[opening.uniqueId()]) {
	      const id = OpenSectionDisplay.getId(opening);
	      const target = du.id(id);
	      const listCnt = du.find.up('.expandable-list', target);
	      if (!listCnt) return;
	      const listId = Number.parseInt(listCnt.getAttribute('ex-list-id'));
	
	      const type = opening.isVertical() === true ? 'pill' : 'sidebar';
	      OpenSectionDisplay.updateDividers(opening);
	      OpenSectionDisplay.getList(opening).refresh(type);
	      const dividerSelector = `[opening-id='${opening.uniqueId()}'].division-count-input`;
	      // listCnt.querySelector(dividerSelector).focus();
	    }
	  }, 500);
	}
	
	OpenSectionDisplay.patternContainerSelector = (opening) =>
	  `.open-pattern-input-cnt[opening-id='${opening.uniqueId()}']`;
	
	OpenSectionDisplay.lastInputValues = {};
	OpenSectionDisplay.patterInputHtml = (opening) => {
	  const pattern = opening.pattern();
	  const patCntSelector = OpenSectionDisplay.patternContainerSelector(opening);
	
	  let inputHtml = '';
	  const unique = pattern.unique();
	  for (let index = 0; index < unique.length; index += 1) {
	    const id = unique[index];
	    let fill = opening.dividerLayout().fill;
	    const measInput = Inputs('pattern', {
	      label: id,
	      placeholder: id,
	      name: id,
	      value: fill[index]
	    });
	    measInput.on('keyup', (value, target) => {
	      opening.pattern().value(target.name, Measurement.decimal(target.value));
	      fill = opening.dividerLayout().fill;
	      const patternCnt = document.querySelector(patCntSelector);
	      const inputs = patternCnt.querySelectorAll('input');
	      fill.forEach((value, index) => {
	        if (inputs[index] !== target)
	          inputs[index].value = value;
	      });
	      if (opening.pattern().satisfied()) {
	        const cabinet = opening.getAssembly('c');
	        ThreeDMain.update(cabinet);
	      }
	    });
	    inputHtml += measInput.html();
	  }
	  return inputHtml;
	};
	
	OpenSectionDisplay.getOpening = (target) => {
	  const openId = target.getAttribute('opening-id');
	  return OpenSectionDisplay.sections[openId];
	}
	
	OpenSectionDisplay.evaluator = new StringMathEvaluator();
	
	OpenSectionDisplay.patternInputSelector = (opening) =>
	  `[name='pattern'][opening-id='${opening.uniqueId()}']`;
	
	OpenSectionDisplay.onPatternChange = (target) => {
	  const opening = OpenSectionDisplay.getOpening(target);
	  const newVal = target.value || 'a';
	  const cntSelector = OpenSectionDisplay.patternContainerSelector(opening);
	  const inputCnt = document.querySelector(OpenSectionDisplay.patternContainerSelector(opening));
	  if (opening.pattern().str !== newVal) {
	    opening.pattern(newVal).str;
	    const html = OpenSectionDisplay.patterInputHtml(opening);
	    document.querySelector(cntSelector).innerHTML = html;
	    OpenSectionDisplay.refresh(opening);
	    const cabinet = opening.getAssembly('c');
	    ThreeDMain.update(cabinet);
	  }
	  if (inputCnt !== null) {
	    inputCnt.hidden = opening.pattern().equal;
	  }
	}
	
	OpenSectionDisplay.onOrientation = (target) => {
	  const openId = target.getAttribute('open-id');
	  const value = target.value;
	  const opening = OpenSectionDisplay.sections[openId];
	  opening.vertical(value === 'vertical');
	  OpenSectionDisplay.refresh(opening);
	};
	
	OpenSectionDisplay.onSectionChange = (target) => {
	  ExpandableList.value('selected', target.value, target);
	  const section = ExpandableList.get(target);
	  const index = ExpandableList.getIdAndKey(target).key;
	  section.parentAssembly().setSection(target.value, index);
	  OpenSectionDisplay.refresh(section.parentAssembly());
	  ThreeDMain.update(section);
	}
	
	du.on.match('keyup', '.division-pattern-input', OpenSectionDisplay.onPatternChange);
	du.on.match('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
	du.on.match('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)
	module.exports = OpenSectionDisplay
	
});


RequireJS.addFunction('./app-src/displays/order.js',
function (require, exports, module) {
	

	
	const du = require('../../../../public/js/utils/dom-utils.js');
	const UFObj = require('./information/utility-filter.js');
	const RoomDisplay = require('./room.js');
	const Order = require('../objects/order.js');
	const Request = require('../../../../public/js/utils/request.js');
	const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const Input = require('../../../../public/js/utils/input/input.js');
	const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const EPNTS = require('../../generated/EPNTS.js')
	const ToggleDisplayList = require('../../app-src/display-utils/toggle-display-list');
	const Inputs = require('../input/inputs.js');
	
	class OrderDisplay {
	  constructor(parentSelector, orders) {
	    const roomDisplays = {};
	    let active;
	    const getHeader = (order, $index) =>
	        OrderDisplay.headTemplate.render({order, $index});
	
	    const setInfo = (order, index) => () => {
	      console.log('oid:', order.id());
	      const elem = du.id(`uf-info-${order.id()}`);
	      if (elem)
	        UTF.buildDisplay(elem, new UFObj(order));
	    }
	
	    function initOrder(order, index) {
	      roomDisplays[order.id()] = new RoomDisplay('#room-pills', order);
	      ToggleDisplayList.onShow(`information-display-${order.id()}`, setInfo(order, index));
	      // expandList.afterRender(setInfo(order, index));
	      return order;
	    }
	
	    function loadOrder(index, start) {
	      return function (orderData) {
	        const order = new Order().fromJson(orderData);
	        initOrder(order, index);
	        expandList.set(index, order);
	        expandList.refresh();
	        console.log('load Time:', new Date().getTime() - start);
	      }
	    }
	
	    const getBody = (order, $index) => {
	      if (order.loaded) {
	        let propertyTypes = Object.keys(['insetfordabet', 'pickles']);
	        active = roomDisplays[order.id()];
	        return OrderDisplay.bodyTemplate.render({$index, order, propertyTypes});
	      } else {
	        const start = new Date().getTime();
	        Request.get(EPNTS.order.get(order.name()), loadOrder($index, start), console.error);
	        return 'Loading...';
	      }
	    }
	    const getObject = (values) => initOrder(new Order(values.name));
	    this.active = () => active;
	
	    const expListProps = {
	      list: orders,
	      inputValidation: (values) => values.name ? true :
	          'You must Define a name',
	      parentSelector, getHeader, getBody, getObject,
	      listElemLable: 'Order', type: 'sidebar',
	      inputTree: OrderDisplay.configInputTree()
	    };
	    const expandList = new ExpandableObject(expListProps);
	    expandList.afterRender(() => {if (active !== undefined) active.refresh()});
	
	    const saveSuccess = () => console.log('success');
	    const saveFail = () => console.log('failure');
	    const save = (target) => {
	      const index = target.getAttribute('index');
	      const order = expandList.get(index);
	      Request.post(EPNTS.order.add(order.name()), order.toJson(), saveSuccess, saveFail);
	      console.log('saving');
	    }
	
	    const attrUpdate = (attr) => (target) => {
	      const index = target.getAttribute('index');
	      const order = expandList.get(index);
	      order[attr] = target.value;
	    };
	
	    function addOrders(names) {
	      names.forEach((name) => expListProps.list[name] = new Order(name, null));
	      expandList.refresh();
	    }
	    Request.get(EPNTS.order.list(), addOrders);
	
	    du.on.match('change', '.order-name-input', attrUpdate('name'));
	    du.on.match('click', '.save-order-btn', save);
	  }
	}
	OrderDisplay.bodyTemplate = new $t('order/body');
	OrderDisplay.headTemplate = new $t('order/head');
	OrderDisplay.builderBodyTemplate = new $t('order/builder/body');
	OrderDisplay.builderHeadTemplate = new $t('order/builder/head');
	OrderDisplay.infoBodyTemplate = new $t('order/information/body');
	OrderDisplay.infoHeadTemplate = new $t('order/information/head');
	
	OrderDisplay.configInputTree = () => {
	  const dit = new DecisionInputTree();
	  dit.leaf('Config', [Inputs('name')]);
	  return dit;
	}
	module.exports = OrderDisplay
	
});


RequireJS.addFunction('./app-src/displays/property.js',
function (require, exports, module) {
	

	
	const Properties = require('../config/properties.js');
	const Property = require('../config/property.js');
	const Cost = require('../cost/cost.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const bind = require('../../../../public/js/utils/input/bind.js');
	const RadioDisplay = require('../display-utils/radio-display.js');
	const EPNTS = require('../../generated/EPNTS');
	const $t = require('../../../../public/js/utils/$t.js');
	const Inputs = require('../input/inputs.js');
	const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	
	// TODO: Rewrite program started to have nested properties no longer making display convoluted(SP).
	const changed = (id) => Properties.changes.changed(id);
	const shouldHide = (prop) => prop.value() === null;
	const hideAll = (properties) => {
	  for (let index = 0; index < properties.length; index += 1) {
	    if (properties[index].value() !== null) return false;
	  }
	  return properties.length > 0;
	}
	
	function updateSaveAll() {
	  const saveAllBtn = du.find('#property-manager-save-all');
	  saveAllBtn.hidden = !Properties.changes.changesExist();
	  if (saveAllBtn.hidden) {
	    const saveBtns = du.find.all('.save-change');
	    saveBtns.forEach((saveBtn) => saveBtn.hidden = true);
	  }
	}
	
	function saveAll() {
	  Properties.changes.saveAll();
	  save();
	  updateSaveAll();
	}
	
	
	function save() {
	  Request.post(EPNTS.config.save(), Properties.config(), console.log, console.error);
	}
	
	function get() {
	  Request.get(EPNTS.config.get(), console.log);
	}
	
	class PropertyDisplay {
	  constructor(containerSelector) {
	    let currProps;
	
	    const noChildren = (properties, groups) => () =>
	          properties.length === 0 && Object.keys(groups).length === 0;
	
	    function childScope (key) {
	      const list = Properties.hasValue(key);
	      if (list.length === 0) return;
	
	      const uniqueId = String.random();
	      const getObject = (values) => {
	        let properties = Properties.new(key,  values.name);
	        return {name: values.name, uniqueId, changed, properties};
	      }
	      const inputTree = PropertyDisplay.configInputTree();
	      const expListProps = {
	        parentSelector: `#config-expand-list-${uniqueId}`,
	        getHeader: (scope) =>
	                    PropertyDisplay.configHeadTemplate.render(scope),
	        getBody: (scope) =>
	                    PropertyDisplay.configBodyTemplate.render({
	                      name: scope.name,
	                      properties: scope.properties,
	                      changed
	                    }),
	        inputValidation: inputTree.validate,
	        listElemLable: 'Config',
	        list, getObject, inputTree
	      };
	      setTimeout(() => {
	        const expList = new ExpandableObject(expListProps);
	        expList.afterRemoval((element, detail) => {
	          console.log(detail);
	          console.log('placehoder');
	          Properties.changes.delete(detail.properties._ID);
	        });
	      }, 500);
	      return uniqueId;
	    }
	
	    function getScope(key, group) {
	      key = key || '';
	      const uniqueId = String.random();
	      let radioId = group.radioId || PropertyDisplay.counter++;
	      const properties = [];
	      const groups = {};
	      const label = key.replace(PropertyDisplay.camelReg, '$1 $2');
	      const scope = {key, label, properties, groups, recurse, radioId, uniqueId,
	                      noChildren: noChildren(properties, groups),
	                      branch: key.match(PropertyDisplay.branchReg)};
	      PropertyDisplay.uniqueMap[uniqueId] = scope;
	      const keys = Object.keys(group.values);
	      radioId = PropertyDisplay.counter++;
	      for( let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        const value = group.values[key];
	        childScope(key, uniqueId);
	      }
	      return scope;
	    }
	
	    this.update = () => {
	      const propKeys = Properties.propertiesToDefine();
	      const propertyObjs = {};
	      const childIdMap = [];
	      for (let index = 0; index < propKeys.length; index += 1) {
	        const key = propKeys[index];
	        const props = Properties(key);
	        const propObj = props;
	        propertyObjs[key] = propObj;
	        childIdMap[key] = childScope(key);
	      }
	      const uniqueId = String.random();
	      const values = {values: propertyObjs, uniqueId, childIdMap, hideAll, Properties};
	      const contianer = document.querySelector(containerSelector);
	      contianer.innerHTML =
	          PropertyDisplay.template.render(values);
	    };
	
	    function updateProperties(name, value) {
	    }
	    bind('property-cnt', updateProperties);
	    new RadioDisplay('property-container', 'radio-id');
	    this.update();
	  }
	}
	
	// bind('property-branch-selector', '');
	
	du.on.match('change', 'select[name="property-branch-selector"]', (target) => {
	  const childTargets = target.parentElement.children[1].children;
	  const childElem = childTargets[target.value];
	  // TODO: set config property: childElem.innerText;
	  du.hide(childTargets);
	  du.show(childElem);
	});
	
	function setPropertyElemValue(elem, idAttr, value) {
	  const id = elem.getAttribute(idAttr);
	  const group = elem.getAttribute('name');
	  const property = Property.get(id);
	  property.value(value, true);
	}
	
	function updateMeasurements () {
	  measureElems = du.find.all('[measurement-id]:not([measurement-id=""])');
	  measureElems.forEach((elem) => {
	    const id = elem.getAttribute('measurement-id');
	    const measurement = Measurement.get(id);
	    elem.value = measurement.display();
	  });
	}
	
	function updateRadio(elem) {
	  const name = elem.getAttribute('name');
	  Properties.config()
	  const elems = du.find.all(`input[type="radio"][name='${name}']`);
	  elems.forEach((elem) => setPropertyElemValue(elem, 'prop-radio-update', false));
	  setPropertyElemValue(elem, 'prop-radio-update', true);
	  if (name.substr(0, 4) === 'UNIT') {
	    Measurement.unit(elem.value);
	    updateMeasurements();
	  }
	}
	
	function updateValueDisplay(elem) {
	  const id = elem.getAttribute('measurement-id');
	  const measurement = Measurement.get(id);
	  elem.value = measurement.display();
	}
	
	function updateValue(elem) {
	  setPropertyElemValue(elem, 'prop-value-update', elem.value);
	  const saveBtn = du.find.closest('.save-change', elem);
	  saveBtn.hidden = !changed(saveBtn.getAttribute('properties-id'));
	  const measurementId = Property.get(elem.getAttribute('prop-value-update')).measurementId();
	  elem.setAttribute('measurement-id', measurementId);
	  updateSaveAll();
	}
	
	function updateBoolean(elem) {
	  setPropertyElemValue(elem, 'prop-boolean-update', elem.checked);
	  const saveBtn = du.find.closest('.save-change', elem);
	  saveBtn.hidden = !changed(saveBtn.getAttribute('properties-id'));
	  updateSaveAll();
	}
	
	function saveChange(elem) {
	  const id = elem.getAttribute('properties-id');
	  Properties.changes.save(id);
	  elem.hidden = true;
	  updateSaveAll();
	  save();
	}
	
	
	du.on.match('keyup', '[prop-value-update]', updateValue);
	du.on.match('change', '[prop-boolean-update]', updateBoolean);
	du.on.match('focusout', '[measurement-id]', updateValueDisplay);
	du.on.match('change', '[prop-radio-update]', updateRadio);
	du.on.match('click', '#property-manager-save-all', saveAll);
	du.on.match('click', '[properties-id]:not([properties-id=""])', saveChange);
	
	PropertyDisplay.attrReg = /^_[A-Z_]{1,}/;
	PropertyDisplay.branchReg = /^OR_(.{1,})/;
	PropertyDisplay.camelReg = /([a-z])([A-Z])/g;
	PropertyDisplay.counter = 0;
	PropertyDisplay.template = new $t('properties/properties');
	PropertyDisplay.configBodyTemplate = new $t('properties/config-body');
	PropertyDisplay.configHeadTemplate = new $t('properties/config-head');
	PropertyDisplay.radioTemplate = new $t('properties/radio');
	PropertyDisplay.uniqueMap = {};
	PropertyDisplay.configMap = {};
	
	PropertyDisplay.configInputTree = () => {
	  const dit = new DecisionInputTree(console.log);
	  dit.leaf('Config', [Inputs('name')]);
	  return dit;
	}
	
	module.exports = PropertyDisplay
	
});


RequireJS.addFunction('./app-src/displays/section.js',
function (require, exports, module) {
	

});


RequireJS.addFunction('./app-src/displays/room.js',
function (require, exports, module) {
	

	
	const Room = require('../objects/room.js');
	const CabinetDisplay = require('./cabinet.js');
	const GroupDisplay = require('./group.js');
	const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const Input = require('../../../../public/js/utils/input/input.js');
	const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const Inputs = require('../input/inputs.js');
	const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const TwoDLayout = require('../two-d/layout');
	
	class RoomDisplay extends Lookup {
	  constructor(parentSelector, order) {
	    super(order.id());
	    const groupDisplays = {};
	    const getHeader = (room, $index) =>
	        RoomDisplay.headTemplate.render({room, $index});
	
	    const getBody = (room, $index) => {
	      TwoDLayout.set(room.layout());
	      return RoomDisplay.bodyTemplate.render({$index, room, groupHtml});
	    }
	
	    const groupHtml = (group) => {
	      if (groupDisplays[group.id()] === undefined) {
	        groupDisplays[group.id()] = new GroupDisplay(group);
	      }
	      return groupDisplays[group.id()].html();
	    }
	
	    const getObject = (values) => {
	      const room = new Room(values.name);
	      return room;
	    }
	    this.active = () => expandList.active();
	
	    const expListProps = {
	      list: order.rooms,
	      parentSelector, getHeader, getBody, getObject,
	      inputValidation: (values) => values.name !== '' ? true : 'name must be defined',
	      listElemLable: 'Room', type: 'pill',
	      inputTree: RoomDisplay.configInputTree()
	    };
	    const expandList = new ExpandableObject(expListProps);
	    this.refresh = () => expandList.refresh();
	  }
	}
	
	du.on.match('click', '.group-add-btn', (target) => {
	  const id = target.getAttribute('room-id');
	  const room = Room.get(id);
	  const orderId = du.find.up('[order-id]', target).getAttribute('order-id');
	  const roomDisplay = RoomDisplay.get(orderId);
	  roomDisplay.refresh();
	  room.addGroup();
	});
	
	RoomDisplay.configInputTree = () => {
	  const dit = new DecisionInputTree(console.log);
	  dit.leaf('Room', [Inputs('name')]);
	  return dit;
	}
	RoomDisplay.bodyTemplate = new $t('room/body');
	RoomDisplay.headTemplate = new $t('room/head');
	module.exports = RoomDisplay
	
});


RequireJS.addFunction('./app-src/displays/three-view.js',
function (require, exports, module) {
	
const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const du = require('../../../../public/js/utils/dom-utils');
	const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
	const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
	const pull = require('../three-d/models/pull.js');
	const ThreeDModel = require('../three-d/three-d-model.js');
	const Layout2D = require('../objects/layout.js')
	const Draw2D = require('../two-d/draw.js');
	const Polygon2d = require('../two-d/objects/polygon.js');
	const Line2d = require('../two-d/objects/line.js');
	const LineMeasurement2d = require('../two-d/objects/line-measurement.js');
	const PanZoom = require('../two-d/pan-zoom.js');
	
	class ThreeView extends Lookup {
	  constructor(viewer) {
	    super();
	    const instance = this;
	    const maxDem = window.innerHeight * .45;
	    const cnt = du.create.element('div');
	    const p = pull(5,2);
	    let front, left, top;
	    let panzFront, panzLeft, panzTop;
	    let threeDModel;
	    document.body.append(cnt);
	    this.maxDem = () => maxDem;
	    cnt.innerHTML = ThreeView.template.render(this);
	
	    const color = 'black';
	    const width = .2;
	    const drawFront = () => {
	      Layout2D.release('three-view-front');
	      const lm = this.lastModel();
	      if (lm === undefined) return;
	      const xy = lm.xy;
	      const twoDmap = Polygon2d.lines(...xy);
	      if (twoDmap.length < 100) {
	        front(twoDmap, color, width);
	        const measurements = LineMeasurement2d.measurements(twoDmap);
	        front(measurements, 'grey');
	      }
	    }
	    const drawLeft = () => {
	      Layout2D.release('three-view-left');
	      const lm = this.lastModel();
	      if (lm === undefined) return;
	      const twoDmap = Polygon2d.lines(...lm.zy);
	      if (twoDmap.length < 100) {
	        left(twoDmap, color, width);
	        const measurements = LineMeasurement2d.measurements(twoDmap);
	        left(measurements, 'grey');
	      }
	    }
	    const drawTop = () => {
	      Layout2D.release('three-view-top');
	      const lm = this.lastModel();
	      if (lm === undefined) return;
	      const twoDmap = Polygon2d.lines(...lm.xz);
	      if (twoDmap.length < 100) {
	        top(twoDmap, color, width);
	        const measurements = LineMeasurement2d.measurements(twoDmap);
	        top(measurements, 'grey');
	      }
	    }
	
	    function init() {
	      if (viewer === undefined) {
	        viewer = new Viewer(p, maxDem, maxDem, 50);
	        addViewer(viewer, `#${instance.id()}>.three-view-three-d-cnt`);
	      }
	      front = new Draw2D(du.id('three-view-front'));
	      left = new Draw2D(du.id('three-view-left'));
	      top = new Draw2D(du.id('three-view-top'));
	
	      panzFront = new PanZoom(front.canvas(), drawFront);
	      panzLeft = new PanZoom(left.canvas(), drawLeft);
	      panzTop = new PanZoom(top.canvas(), drawTop);
	      panzFront.centerOn(0, 0);
	      panzLeft.centerOn(0, 0);
	      panzTop.centerOn(0, 0);
	    }
	
	    this.update = (cabinet) => {
	      if (threeDModel === undefined) threeDModel = new ThreeDModel(cabinet, viewer);
	      threeDModel.assembly(cabinet, viewer);
	      threeDModel.update(cabinet);
	      front.clear();left.clear();top.clear();
	      setTimeout(() => {
	        drawTop();drawLeft();drawFront();
	      }, 1000);
	    }
	
	    this.isolatePart = (partId, cabinet) => {
	      threeDModel = ThreeDModel.get();
	      threeDModel.setTargetPartId(partId);
	      threeDModel.update();
	      setTimeout(() => {
	        panzFront.once();
	        panzLeft.once();
	        panzTop.once();
	      }, 500);
	      du.id(`three-view-part-code-${this.id()}`).innerText = partId;
	    }
	
	    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
	    this.partMap = () => threeDModel ? threeDModel.partMap() : {};
	
	    setTimeout(init, 1000);
	  }
	}
	
	ThreeView.template = new $t('three-view');
	
	module.exports = ThreeView;
	
});


RequireJS.addFunction('./app-src/displays/three-d-main.js',
function (require, exports, module) {
	

	const CSG = require('../../public/js/3d-modeling/csg');
	
	const Assembly = require('../objects/assembly/assembly');
	const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
	const DrawerBox = require('../objects/assembly/assemblies/drawer/drawer-box.js');
	const pull = require('../three-d/models/pull.js');
	const drawerBox = require('../three-d/models/drawer-box.js');
	const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
	const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
	const du = require('../../../../public/js/utils/dom-utils.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const ThreeDModel = require('../three-d/three-d-model.js');
	const ThreeView = require('three-view');
	
	
	const cube = new CSG.cube({radius: [3,5,1]});
	const consts = require('../../globals/CONSTANTS');
	let viewer, threeView;
	function init() {
	  const p = pull(5,2);
	  // const db = drawerBox(10, 15, 22);
	  const canvas2d = du.id('two-d-model');
	  viewer = new Viewer(p, canvas2d.height, canvas2d.width, 50);
	  addViewer(viewer, '#three-d-model');
	  threeView = new ThreeView(viewer);
	
	  const setZFunc = setGreaterZindex('order-cnt', 'model-cnt', `${threeView.id()}-cnt`);
	  du.on.match('click', '#model-cnt', setZFunc);
	  du.on.match('click', '#order-cnt', setZFunc);
	  du.on.match('click', `#${threeView.id()}-cnt`, setZFunc);
	}
	
	// TODO: ????
	function displayPart(part) {
	  return true;
	}
	
	function groupParts(cabinet) {
	  const grouping = {displayPart, group: {groups: {}, parts: {}, level: 0}};
	  const parts = cabinet.getParts();
	  for (let index = 0; index < parts.length; index += 1) {
	    const part = parts[index];
	    const namePieces = part.partName().split('.');
	    let currObj = grouping.group;
	    let level = 0;
	    let prefix = '';
	    for (let nIndex = 0; nIndex < namePieces.length - 1; nIndex += 1) {
	      const piece = namePieces[nIndex];
	      prefix += piece;
	      if (currObj.groups[piece] === undefined) currObj.groups[piece] = {groups: {}, parts: {}};
	      currObj = currObj.groups[piece];
	      currObj.level = ++level;
	      currObj.prefix = prefix;
	      prefix += '.'
	    }
	    if (currObj.parts[part.partName()] === undefined) currObj.parts[part.partName()] = [];
	    currObj.parts[part.partName()].push(part);
	  }
	  return grouping;
	}
	
	const modelContTemplate = new $t('model-controller');
	
	du.on.match('click', '.model-label', (target) => {
	  if (event.target.tagName === 'INPUT') return;
	  const has = target.matches('.active');
	  deselectPrefix();
	  !has ? du.class.add(target, 'active') : du.class.remove(target, 'active');
	  let label = target.children[0]
	  let type = label.getAttribute('type');
	  let value = type !== 'prefix' ? label.innerText :
	        label.nextElementSibling.getAttribute('prefix');
	  const cabinet = lastRendered;
	  const tdm = ThreeDModel.get(cabinet, viewer);
	  let partId = target.getAttribute('part-id');
	  if (partId) {
	    if (!has) {
	      tdm.inclusiveTarget(type, partId);
	      threeView.isolatePart(partId, cabinet);
	    }
	  } else {
	    tdm.inclusiveTarget(type, has ? undefined : value);
	    partId = du.find.closest('[part-id]', target).getAttribute('part-id');
	    threeView.isolatePart(partId, cabinet);
	  }
	  tdm.render();
	});
	
	function deselectPrefix() {
	  document.querySelectorAll('.model-label')
	    .forEach((elem) => du.class.remove(elem, 'active'));
	  const cabinet = lastRendered;
	  const tdm = ThreeDModel.get(cabinet, viewer);
	  tdm.inclusiveTarget(undefined, undefined);
	}
	
	function setGreaterZindex(...ids) {
	  return (target) => {
	    const zMap = [];
	    let zIndexes = [];
	    for (let index = 0; index < ids.length; index += 1) {
	      const id = ids[index];
	      const elem = du.id(id);
	      const zIndex = du.zIndex(elem);
	      zIndexes.push(zIndex);
	      zMap[zIndex] = elem;
	    }
	    zIndexes.sort().reverse();
	    target.style.zIndex = zIndexes[0];
	    for (let index = 0; index < zIndexes.length; index += 1) {
	      const elem = zMap[zIndexes[index]];
	      if (elem === target) {
	        break;
	      } else {
	        elem.style.zIndex = zIndexes[index + 1];
	      }
	    }
	  };
	}
	
	du.on.match('click', '.prefix-switch', (target, event) => {
	  const eventTarg = event.target;
	  const active = du.find.upAll('.model-selector', target);
	  active.push(target.parentElement.parentElement);
	  const all = document.querySelectorAll('.prefix-body');
	  all.forEach((pb) => pb.hidden = true);
	  active.forEach((ms) => ms.children[0].children[1].hidden = false);
	});
	
	du.on.match('change', '.prefix-checkbox', (target) => {
	  const cabinet = lastRendered;
	  const attr = target.getAttribute('prefix');
	  deselectPrefix();
	  ThreeDModel.get(cabinet, viewer).hidePrefix(attr, !target.checked);
	});
	
	du.on.match('change', '.part-name-checkbox', (target) => {
	  const cabinet = lastRendered;
	  const attr = target.getAttribute('part-name');
	  deselectPrefix();
	  const tdm = ThreeDModel.get(cabinet, viewer);
	  tdm.hidePartName(attr, !target.checked);
	  tdm.render();
	});
	
	du.on.match('change', '.part-id-checkbox', (target) => {
	  const cabinet = lastRendered;
	  const attr = target.getAttribute('part-id');
	  deselectPrefix();
	  const tdm = ThreeDModel.get(cabinet, viewer);
	  tdm.hidePartId(attr, !target.checked);
	  tdm.render();
	})
	
	let controllerModel;
	function updateController() {
	  if (controllerModel !== lastRendered) {
	    controllerModel = lastRendered;
	    const controller = du.id('model-controller');
	    const grouping = groupParts(controllerModel);
	    grouping.tdm = ThreeDModel.get(controllerModel, viewer);
	    controller.innerHTML = modelContTemplate.render(grouping);
	    controller.hidden = false;
	  }
	}
	
	
	let lastRendered;
	function update(part) {
	  if (part) lastRendered = part.getAssembly('c');
	  const threeDModel = ThreeDModel.get(lastRendered, viewer);
	  if (threeDModel) {
	    threeDModel.update(lastRendered);
	    updateController();
	  }
	}
	
	module.exports = {init, update}
	
});


RequireJS.addFunction('./app-src/displays/user.js',
function (require, exports, module) {
	
const du = require('../../../../public/js/utils/dom-utils.js');
	const APP_ID = require('../../globals/CONSTANTS.js').APP_ID;
	const Request = require('../../../../public/js/utils/request.js');
	const EPNTS = require('../../generated/EPNTS');
	const $t = require('../../../../public/js/utils/$t.js');
	
	class User {
	  constructor() {
	    const stateAttr = 'user-state';
	    let state, cnt, email, password;
	
	    function updateDisplay(s) {
	      state = s ? User.states[s] : state;
	      cnt = cnt || du.id('login-cnt');
	      cnt.innerHTML = state.template.render({email, password});
	    }
	
	    const hideLogin = () => du.id('login').hidden = true;
	    const showLogin = () => du.id('login').hidden = false;
	    function successfulRegistration(body) {
	      updateDisplay('CONFIRMATION_MESSAGE');
	    }
	
	    function register(target) {password
	      const fail = du.appendError(target, 'Registration Failed: Email already registered');
	      const body = {email, password};
	      document.cookie = `${APP_ID}=${email}:invalid`;
	      Request.post(EPNTS.user.register(), body, successfulRegistration, fail);
	    }
	
	    function successfulLogin(body, res) {
	      const newAuth = res.getResponseHeader('authorization');
	      document.cookie = `${APP_ID}=${newAuth}`;
	      hideLogin();
	    }
	
	    const getEmail = () => du.cookie.get(APP_ID, ':', 'email').email;
	    this.credential = User.credential;
	
	    function login(target) {
	      const fail = du.appendError(target, 'Login Failed: Invalid Email and/or Password');
	      const body = {email, password};
	      Request.post(EPNTS.user.login(), body, successfulLogin, fail);
	    }
	
	    function resendActivation(target) {
	      const fail = du.appendError(target, 'Email Not Registered Or Already Active');
	      const body = {email: getEmail()};
	      Request.post(EPNTS.user.resendActivation(), body, successfulRegistration, fail);
	    }
	
	    function logout() {
	      du.cookie.remove(APP_ID);
	      showLogin();
	      updateDisplay('LOGIN')
	    }
	
	    function resetPassword(target) {
	      const fail = du.appendError(target, 'Server Error Must have occured... try again in a few minutes');
	      const body = {email, newPassword: password};
	      Request.post(EPNTS.user.resetPasswordRequest(), body, successfulRegistration, fail);
	    }
	
	    du.on.match('click', `[${stateAttr}]`, (elem) => {
	      const stateId = elem.getAttribute(stateAttr);
	      if (User.states[stateId]) {
	        updateDisplay(stateId);
	      } else console.error(`Invalid State: '${stateId}'`);
	    });
	
	    du.on.match('click', '#register', register);
	    du.on.match('click', '#login-btn', login);
	    du.on.match('click', '#resend-activation', resendActivation);
	    du.on.match('click', '#reset-password', resetPassword);
	    du.on.match('click', '#logout-btn', logout);
	
	    du.on.match('change', 'input[name="email"]', (elem) => email = elem.value);
	    du.on.match('change', 'input[name="password"]', (elem) => password = elem.value);
	
	    function statusCheck(body) {
	      switch (body) {
	        case 'Not Registered':
	          updateDisplay('LOGIN')
	          break;
	        case 'Not Activated':
	          updateDisplay('CONFIRMATION_MESSAGE');
	          break;
	        case 'Logged In':
	          hideLogin();
	          break;
	        case 'Logged Out':
	          updateDisplay('LOGIN')
	          break;
	        default:
	
	      }
	    }
	
	    Request.globalHeader('Authorization', this.credential);
	    if (this.credential()) Request.get(EPNTS.user.status(), statusCheck);
	    else updateDisplay('LOGIN');
	  }
	}
	
	User.states = {};
	User.states.LOGIN = {
	  template: new $t('login/login')
	};
	User.states.CONFIRMATION_MESSAGE = {
	  template: new $t('login/confirmation-message')
	};
	User.states.CREATE_ACCOUNT = {
	  template: new $t('login/create-account')
	};
	User.states.RESET_PASSWORD = {
	  template: new $t('login/reset-password')
	};
	
	User.credential = () => du.cookie.get(APP_ID);
	
	
	User = new User();
	module.exports = User
	
});


RequireJS.addFunction('./app-src/two-d/pan-zoom.js',
function (require, exports, module) {
	
// Took thiss code from https://stackoverflow.com/a/33929456
	function panZoom(canvas, draw) {
	  let mrx, mry;
	  const eventFuncs = [];
	  const instance = this;
	
	  this.on = (eventName) => {
	    if (eventFuncs[eventName] === undefined) eventFuncs[eventName] = [];
	    return (func) => {
	      if ((typeof func) === 'function') {
	        eventFuncs[eventName].push(func);
	      }
	    }
	  }
	  let sleeping = null;
	  let nextUpdateId = 0;
	  this.sleep = () => sleeping = true;
	  this.wake = () => {
	    if (sleeping) {
	      sleeping = false;
	      requestAnimationFrame(() => update(nextUpdateId));
	    }
	  };
	  this.once = () => {
	    requestAnimationFrame(() => update(nextUpdateId, true))
	  };
	
	  this.onMove = this.on('move');
	  this.onClick = this.on('click');
	  this.onMousedown = this.on('mousedown');
	  this.onMouseup = this.on('mouseup');
	
	  function eventObject(eventName, event) {
	    let x  =  mouse.rx;
	    let y = mouse.ry;
	    const dt = displayTransform;
	    x -= dt.x;
	    y -= dt.y;
	    // screenX and screen Y are the screen coordinates.
	    screenX = event.pageX;//dt.scale*(x * dt.matrix[0] + y * dt.matrix[2])+dt.cox;
	    screenY = event.pageY;//dt.scale*(x * dt.matrix[1] + y * dt.matrix[3])+dt.coy;
	    return {
	      eventName, screenX, screenY,
	      imageX: mouse.rx,
	      imageY: mouse.ry,
	      dx: mrx,
	      dy: mry,
	    };
	  }
	
	  function runOn(type, event) {
	    const dt = displayTransform;
	    let performingFunction = false;
	    const funcs = eventFuncs[type];
	    const eventObj  = eventObject(type, event);
	    for (let index = 0; !performingFunction && index < funcs.length; index += 1) {
	      performingFunction = funcs[index](eventObj, event);
	    }
	    return performingFunction;
	  }
	
	  var ctx = canvas.getContext("2d");
	  var mouse = {
	      x : 0,
	      y : 0,
	      w : 0,
	      alt : false,
	      shift : false,
	      ctrl : false,
	      buttonLastRaw : 0, // user modified value
	      buttonRaw : 0,
	      over : false,
	      buttons : [1, 2, 4, 6, 5, 3], // masks for setting and clearing button raw bits;
	  };
	  let lastMouseMovementId = 0;
	  function mouseMove(event) {
	      const mouseMovementId = ++lastMouseMovementId;
	      mouse.x = event.offsetX;
	      mouse.y = event.offsetY;
	      if (mouse.x === undefined) {
	          mouse.x = event.clientX;
	          mouse.y = event.clientY;
	      }
	      runOn('move', event);
	      mouse.alt = event.altKey;
	      mouse.shift = event.shiftKey;
	      mouse.ctrl = event.ctrlKey;
	      if (event.type === "mousedown") {
	        if (!runOn('mousedown', event))  {
	          event.preventDefault()
	          mouse.buttonRaw |= mouse.buttons[event.which-1];
	        }
	      } else if (event.type === "mouseup") {
	        if (!runOn('mouseup', event)) {
	          mouse.buttonRaw &= mouse.buttons[event.which + 2];
	        }
	      } else if (event.type === "mouseout") {
	          mouse.buttonRaw = 0;
	          mouse.over = false;
	      } else if (event.type === "mouseover") {
	          mouse.over = true;
	      } else if (event.type === "mousewheel") {
	          event.preventDefault()
	          mouse.w = event.wheelDelta;
	      } else if (event.type === "DOMMouseScroll") { // FF you pedantic doffus
	         mouse.w = -event.detail;
	      }
	      instance.wake();
	      setTimeout(() => {
	        if (mouseMovementId === lastMouseMovementId) instance.sleep()
	      }, 500);
	  }
	
	  function setupMouse(e) {
	      e.addEventListener('mousemove', mouseMove);
	      e.addEventListener('mousedown', mouseMove);
	      e.addEventListener('mouseup', mouseMove);
	      e.addEventListener('mouseout', mouseMove);
	      e.addEventListener('mouseover', mouseMove);
	      e.addEventListener('mousewheel', mouseMove);
	      e.addEventListener('DOMMouseScroll', mouseMove); // fire fox
	
	      e.addEventListener("contextmenu", function (e) {
	          e.preventDefault();
	      }, false);
	  }
	  setupMouse(canvas);
	
	  let transformCount = 0;
	  const round = (val) => Math.round((val*100)/displayTransform.scale) / 100;
	  const print = (...attrs) => {
	    if (transformCount++ % 100 !== 0) return;
	    let str = '';
	    for (let index = 0; index < attrs.length; index += 1) {
	      const attr = attrs[index];
	      str += `${attr}: ${round(displayTransform[attr])} `;
	    }
	  }
	  // terms.
	  // Real space, real, r (prefix) refers to the transformed canvas space.
	  // c (prefix), chase is the value that chases a requiered value
	  var displayTransform = {
	      x:0,
	      y:0,
	      ox:0,
	      oy:0,
	      scale:1,
	      rotate:0,
	      cx:0,  // chase values Hold the actual display
	      cy:0,
	      cox:0,
	      coy:0,
	      cscale:1,
	      crotate:0,
	      dx:0,  // deltat values
	      dy:0,
	      dox:0,
	      doy:0,
	      dscale:1,
	      drotate:0,
	      drag:0.2,  // drag for movements
	      accel:0.7, // acceleration
	      matrix:[0,0,0,0,0,0], // main matrix
	      invMatrix:[0,0,0,0,0,0], // invers matrix;
	      mouseX:0,
	      mouseY:0,
	      ctx:ctx,
	      setTransform:function(){
	          var m = this.matrix;
	          var i = 0;
	          const dt = displayTransform;
	          print('x', 'y',  'dx', 'dy', 'mouseX', 'mouseY', 'scale');
	          this.ctx.setTransform(m[i++],m[i++],m[i++],m[i++],m[i++],m[i++]);
	      },
	      setHome:function(){
	          this.ctx.setTransform(1,0,0,1,0,0);
	
	      },
	      update:function(){
	          // smooth all movement out. drag and accel control how this moves
	          // acceleration
	          this.dx += (this.x-this.cx)*this.accel;
	          this.dy += (this.y-this.cy)*this.accel;
	          this.dox += (this.ox-this.cox)*this.accel;
	          this.doy += (this.oy-this.coy)*this.accel;
	          this.dscale += (this.scale-this.cscale)*this.accel;
	          this.drotate += (this.rotate-this.crotate)*this.accel;
	          // drag
	          this.dx *= this.drag;
	          this.dy *= this.drag;
	          this.dox *= this.drag;
	          this.doy *= this.drag;
	          this.dscale *= this.drag;
	          this.drotate *= this.drag;
	          // set the chase values. Chase chases the requiered values
	          this.cx += this.dx;
	          this.cy += this.dy;
	          this.cox += this.dox;
	          this.coy += this.doy;
	          this.cscale += this.dscale;
	          this.crotate += this.drotate;
	
	          // create the display matrix
	          this.matrix[0] = Math.cos(this.crotate)*this.cscale;
	          this.matrix[1] = Math.sin(this.crotate)*this.cscale;
	          this.matrix[2] =  - this.matrix[1];
	          this.matrix[3] = this.matrix[0];
	
	          // set the coords relative to the origin
	          this.matrix[4] = -(this.cx * this.matrix[0] + this.cy * this.matrix[2])+this.cox;
	          this.matrix[5] = -(this.cx * this.matrix[1] + this.cy * this.matrix[3])+this.coy;
	
	
	          // create invers matrix
	          var det = (this.matrix[0] * this.matrix[3] - this.matrix[1] * this.matrix[2]);
	          this.invMatrix[0] = this.matrix[3] / det;
	          this.invMatrix[1] =  - this.matrix[1] / det;
	          this.invMatrix[2] =  - this.matrix[2] / det;
	          this.invMatrix[3] = this.matrix[0] / det;
	
	          // check for mouse. Do controls and get real position of mouse.
	          if(mouse !== undefined){  // if there is a mouse get the real cavas coordinates of the mouse
	              let mdx = mouse.x-mouse.oldX; // get the mouse movement
	              let mdy = mouse.y-mouse.oldY;
	              mrx = (mdx * this.invMatrix[0] + mdy * this.invMatrix[2]);
	              mry = (mdx * this.invMatrix[1] + mdy * this.invMatrix[3]);
	              if(mouse.oldX !== undefined && (mouse.buttonRaw & 1)===1){ // check if panning (middle button)
	                  // get the movement in real space
	                  this.x -= mrx;
	                  this.y -= mry;
	              }
	              // do the zoom with mouse wheel
	              if(mouse.w !== undefined && mouse.w !== 0){
	                  this.ox = mouse.x;
	                  this.oy = mouse.y;
	                  this.x = this.mouseX;
	                  this.y = this.mouseY;
	                  /* Special note from answer */
	                  // comment out the following is you change drag and accel
	                  // and the zoom does not feel right (lagging and not
	                  // zooming around the mouse
	                  /*
	                  this.cox = mouse.x;
	                  this.coy = mouse.y;
	                  this.cx = this.mouseX;
	                  this.cy = this.mouseY;
	                  */
	                  if(mouse.w > 0){ // zoom in
	                      this.scale *= 1.1;
	                      mouse.w -= 20;
	                      if(mouse.w < 0){
	                          mouse.w = 0;
	                      }
	                  }
	                  if(mouse.w < 0){ // zoom out
	                      this.scale *= 1/1.1;
	                      mouse.w += 20;
	                      if(mouse.w > 0){
	                          mouse.w = 0;
	                      }
	                  }
	
	              }
	              // get the real mouse position
	              var screenX = (mouse.x - this.cox);
	              var screenY = (mouse.y - this.coy);
	              this.screenX = screenX;
	              this.screenY = screenY;
	              this.mouseX = this.cx + (screenX * this.invMatrix[0] + screenY * this.invMatrix[2]);
	              this.mouseY = this.cy + (screenX * this.invMatrix[1] + screenY * this.invMatrix[3]);
	              mouse.rx = this.mouseX;  // add the coordinates to the mouse. r is for real
	              mouse.ry = this.mouseY;
	              // save old mouse position
	              mouse.oldX = mouse.x;
	              mouse.oldY = mouse.y;
	          }
	
	      }
	  }
	  // image to show
	  var img = new Image();
	  img.src = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Fiat_500_in_Emilia-Romagna.jpg"
	  // set up font
	  ctx.font = "14px verdana";
	  ctx.textAlign = "center";
	  ctx.textBaseline = "middle";
	  // timer for stuff
	  var timer =0;
	  function update(updateId, once){
	    if (nextUpdateId !== updateId) return;
	      nextUpdateId++;
	      timer += 1; // update timere
	      // update the transform
	      displayTransform.update();
	      // set home transform to clear the screem
	      displayTransform.setHome();
	      ctx.clearRect(0,0,canvas.width,canvas.height);
	      // if the image loaded show it
	      if(img.complete){
	        displayTransform.setTransform();
	        draw(canvas);
	        ctx.fillStyle = "white";
	        // if(Math.floor(timer/100)%2 === 0){
	        //     ctx.fillText("Left but to pan",mouse.rx,mouse.ry);
	        // }else{
	        //     ctx.fillText("Wheel to zoom",mouse.rx,mouse.ry);
	        // }
	    }else{
	        // waiting for image to load
	        displayTransform.setTransform();
	        ctx.fillText("Loading image...",100,100);
	
	    }
	    if(mouse.buttonRaw === 4){ // right click to return to homw
	         displayTransform.x = 0;
	         displayTransform.y = 0;
	         displayTransform.scale = 1;
	         displayTransform.rotate = 0;
	         displayTransform.ox = 0;
	         displayTransform.oy = 0;
	     }
	    // reaquest next frame
	    if (sleeping === false) {
	      if (once) sleeping = true;
	      setTimeout(() => requestAnimationFrame(() => update(nextUpdateId)), 10);
	    }
	  }
	  update(nextUpdateId); // start it happening
	
	  this.centerOn = function(x, y) {
	    displayTransform.scale = 1;
	    displayTransform.x = x - (canvas.width / 2) - displayTransform.x - displayTransform.dx;
	    displayTransform.y = y - (canvas.height / 2) - displayTransform.y - displayTransform.dy;
	  };
	
	  return this;
	}
	
	module.exports = panZoom;
	
});


RequireJS.addFunction('./app-src/cost/cost-tree.js',
function (require, exports, module) {
	
const Properties = require('../config/properties.js');
	const Assembly = require('../objects/assembly/assembly.js');
	const LogicTree = require('../../../../public/js/utils/logic-tree.js');
	const LogicWrapper = LogicTree.LogicWrapper;
	
	class CostDecision {
	  constructor(type, name, relation, formula) {
	    Object.getSet(this, {type, name, costs: [], relation, isChoice: false});
	    this.requiredProperties = Properties.noValue(name);
	    if (this.relation) {
	      if (formula) {
	        function makeDecision(wrapper) {
	          return true;
	        }
	        this.relation = RelationInput.relationsObjs[relation](makeDecision);
	        this.condition = (wrapper) => this.relation.eval(wrapper.children(), wrapper.payload.value());
	      } else {
	        this.isChoice(true);
	      }
	    }
	  }
	}
	
	class CostTree {
	  constructor(logicTree) {
	    const idMap = {};
	    logicTree = CostTree.suplement(logicTree);
	    this.tree = () => logicTree;
	    this.root = () => logicTree.root();
	    const getWrapper = (wrapperId) => (LogicWrapper.get(wrapperId) || this.root());
	
	    this.branch = (wrapperId, name) =>
	            get(wrapperId).branch(String.random(), new CostDecision('Branch', name));
	    this.leaf = (wrapperId, name) =>
	            get(wrapperId).leaf(String.random(), new CostDecision('Leaf', name));
	    this.select = (wrapperId, name, relation, formula) =>
	            get(wrapperId).select(String.random(), new CostDecision('Select', name, relation, formula));
	    this.multiselect = (wrapperId, name, relation, formula) =>
	            get(wrapperId).multiselect(String.random(), new CostDecision('Multiselect', name, relation, formula));
	    this.conditional = (wrapperId, name, relation, formula) =>
	            get(wrapperId).conditional(String.random(), new CostDecision('Conditional', name, relation, formula));
	
	  }
	}
	
	
	CostTree.propertyList = Properties.all();
	CostTree.types = ['branch', 'select', 'conditional', 'multiselect', 'leaf'];
	CostTree.suplement = (logicTree) => {
	  if (!(logicTree instanceof LogicWrapper)) {
	    logicTree = new LogicTree();
	    logicTree.branch('root');
	  }
	  const root = logicTree.root();
	  const assemClassIds = Properties.list();
	  assemClassIds.forEach((classId) => {
	    if (root.node.getNodeByPath(classId) === undefined)
	      root.branch(classId, new CostDecision('Branch', classId));
	  });
	  return logicTree;
	}
	CostTree.choices = [];
	
	
	CostTree.CostDecision = CostDecision;
	module.exports = CostTree;
	
});


RequireJS.addFunction('./app-src/cost/cost.js',
function (require, exports, module) {
	

	
	const Company = require('../objects/company.js');
	const Input = require('../../../../public/js/utils/input/input.js');
	const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
	const Assembly = require('../objects/assembly/assembly.js');
	
	
	// constructors
	// Cost({name, Method: Cost.methods.LINEAR_FEET, cost, length})
	// Cost({name, Method: Cost.methods.SQUARE_FEET, cost, length, width})
	// Cost({name, Method: Cost.methods.CUBIC_FEET, cost, length, width, depth})
	// Cost({name, Method: Cost.methods.UNIT, cost})
	// Cost((name, Cost, formula));
	// props. - (optional*)
	// id - Cost identifier
	// method - Method for calculating cost
	// length - length of piece used to calculate unit cost
	// width - width of piece used to calculate unit cost
	// depth - depth of piece used to calculate unit cost
	// cost - cost of piece used to calculate unit cost
	// formula* - formula used to apply cost to part
	// company* - Company to order from.
	// partNumber* - Part number to order part from company
	// Cost* - Reference Cost.
	
	class Cost extends Lookup {
	  //constructor(id, Cost, formula)
	  constructor(props) {
	    super(props.name);
	    props = props || {};
	    this.props = () => props;
	    let deleted = false;
	    const instance = this;
	    const uniqueId = String.random();
	    const lastUpdated = props.lastUpdated || new Date().getTime();
	    props.requiredBranches = props.requiredBranches || [];
	    this.lastUpdated = new Date(lastUpdated).toLocaleDateString();
	    Object.getSet(this, props, 'group', 'objectId', 'id', 'parent');
	    this.level = () => {
	      let level = -1;
	      let curr = this;
	      while(curr instanceof Cost) {
	        level++;
	        curr = curr.parent();
	      }
	      return level;
	    }
	  }
	}
	
	Cost.types = {};
	
	Cost.freeId = (group, id) => Object.values(Cost.group(group).defined).indexOf(id) === -1;
	Cost.remove = (uniqueId) => Cost.get(uniqueId).remove();
	
	Cost.constructorId = (name) => name.replace(/Cost$/, '');
	Cost.register = (clazz) => {
	  Cost.types[Cost.constructorId(clazz.prototype.constructor.name)] = clazz;
	  Cost.typeList = Object.keys(Cost.types).sort();
	}
	
	Cost.evaluator = new StringMathEvaluator(null, (attr, assem) => Assembly.resolveAttr(assem, attr))
	
	module.exports = Cost
	
});


RequireJS.addFunction('./app-src/input/validation.js',
function (require, exports, module) {
	

	
	const InvalidComputation = require('./error.js');
	
	class ObjectValidator {
	  constructor() {
	    const validators =  {};
	    this.add = (name, validator) => {
	      if (!(validator instanceof ObjectValidator) && !(validator instanceof Validator)) {
	        throw new Error('Invalid Validator');
	      }
	      validator[name] = validator;
	    }
	    this.validate = (obj) => {
	      if (typeof obj !== 'object') throw new InvalidComputation()
	      const keys = Object.keys(validators);
	    }
	  }
	}
	
	
	class Validator {
	  constructor(validator, props, info) {
	    let type, validate;
	    const complement = props.explanation;
	
	    let defaultExpl;
	    if (validator instanceof Regex) {
	      type = 'Regex';
	      if (props.complement) {
	        defaultExpl = 'Value must fit regex expression';
	        validate = (value) => validator.match('value');
	      } else {
	        defaultExpl = 'Value must not fit regex expression';
	        validate = (value) => !validator.match('value');
	      }
	    } else if (Array.isArray(validator)) {
	      if (props.complement) {
	        defaultExpl = 'Value must exist within array';
	        validate = (value) => validator.indexOf(value) !== -1;
	      } else {
	        defaultExpl = 'Value must not exist within array';
	        validate = (value) => validator.indexOf(value) === -1;
	      }
	    }
	
	    props.explanation = props.explanation || defaultExpl;
	
	    val = val === undefined && elem ? elem.value : val;
	    if (val === undefined) return false;
	    if (valid !== undefined && val === value) return valid;
	    let valValid = true;
	    if (props.validation instanceof RegExp) {
	      valValid = val.match(props.validation) !== null;
	    }
	    else if ((typeof props.validation) === 'function') {
	      valValid = props.validation.apply(null, arguments);
	    }
	    else if (Array.isArray(props.validation)) {
	      valValid = props.validation.indexOf(val) !== -1;
	    }
	
	    return valValid;
	  }
	}
	exports.ObjectValidator = ObjectValidator
	exports.Validator = Validator
	
	
	
	
	
});


RequireJS.addFunction('./app-src/two-d/draw.js',
function (require, exports, module) {
	
const Circle2d = require('./objects/circle');
	const Line2d = require('./objects/line');
	const LineMeasurement2d = require('./objects/line-measurement');
	
	class Draw2d {
	  constructor(canvas) {
	    const ctx = canvas.getContext('2d');
	
	    function draw(object, color, width) {
	      if (Array.isArray(object)) {
	        for (let index = 0; index < object.length; index += 1)
	          draw(object[index], color, width);
	        return;
	      }
	      switch (object.constructor.name) {
	        case 'Line2d':
	          draw.line(object, color, width);
	          break;
	        case 'Circle2d':
	          draw.circle(object, color, width);
	          break;
	        case 'Plane2d':
	          draw.plane(object, color, width);
	          break;
	        case 'Polygon2d':
	          draw.polygon(object, color, width);
	          break;
	        case 'Square2d':
	          draw.square(object, color, width);
	          break;
	        case 'LineMeasurement2d':
	          draw.measurement(object, color, width);
	          break;
	        default:
	          console.error(`Cannot Draw '${object.constructor.name}'`);
	      }
	    }
	
	    draw.canvas = () => canvas;
	    draw.ctx = () => ctx;
	    draw.beginPath = () => ctx.beginPath();
	    draw.moveTo = () => ctx.moveTo();
	
	    draw.clear = () => {
	      ctx.save();
	      ctx.setTransform(1, 0, 0, 1, 0, 0);
	      ctx.clearRect(0, 0, canvas.width, canvas.height);
	      ctx.restore();
	    }
	    draw.line = (line, color, width, doNotMeasure) => {
	      if (line === undefined) return;
	      color = color ||  'black';
	      width = width || 10;
	      const measurePoints = line.measureTo();
	      ctx.beginPath();
	      ctx.strokeStyle = color;
	      ctx.lineWidth = width;
	      ctx.moveTo(line.startVertex().x(), line.startVertex().y());
	      ctx.lineTo(line.endVertex().x(), line.endVertex().y());
	      ctx.stroke();
	    }
	
	    draw.plane = (plane, color, width) => {
	      if (plane === undefined) return;
	      color = color ||  'black';
	      width = width || .1;
	      plane.getLines().forEach((line) => draw.line(line, color, width));
	    }
	
	    draw.polygon = (poly, color, width) => {
	      if (poly === undefined) return;
	      color = color ||  'black';
	      width = width || .1;
	      poly.lines().forEach((line) => draw.line(line, color, width));
	    }
	
	    draw.square = (square, color, text) => {
	      ctx.save();
	      ctx.beginPath();
	      ctx.lineWidth = 2;
	      ctx.strokeStyle = 'black';
	      ctx.fillStyle = color;
	
	      const center = square.center();
	      ctx.translate(center.x(), center.y());
	      ctx.rotate(square.radians());
	      ctx.rect(square.offsetX(true), square.offsetY(true), square.width(), square.height());
	      ctx.stroke();
	      ctx.fill();
	
	      if (text) {
	        ctx.beginPath();
	        ctx.lineWidth = 4;
	        ctx.strokeStyle = 'black';
	        ctx.fillStyle =  'black';
	        const lc = square.leftCenter();
	        const fc = square.frontLeft();
	        ctx.fillText(text, 0, square.height() / 4, square.width());
	        ctx.stroke()
	      }
	
	      ctx.restore();
	    }
	
	    draw.circle = (circle, lineColor, fillColor, lineWidth) => {
	      const center = circle.center();
	      ctx.beginPath();
	      ctx.lineWidth = lineWidth || 2;
	      ctx.strokeStyle = lineColor || 'black';
	      ctx.fillStyle = fillColor || 'white';
	      ctx.arc(center.x(),center.y(), circle.radius(),0, 2*Math.PI);
	      ctx.stroke();
	      ctx.fill();
	    }
	
	    const blank = 4;
	    const hblank = blank/2;
	    function drawMeasurementLabel(line, measurement) {
	      if (measurement === undefined) return;
	      const ctx = draw.ctx();
	      const midpoint = line.midpoint();
	
	      ctx.save();
	      ctx.lineWidth = 0;
	      const length = measurement.display();
	      const textLength = length.length;
	      ctx.translate(midpoint.x(), midpoint.y());
	      ctx.rotate(line.radians());
	      ctx.beginPath();
	      ctx.fillStyle = "white";
	      ctx.strokeStyle = 'white';
	      ctx.rect((textLength * -3)/14, -4/15, (textLength * 6)/14, 8/15);
	      ctx.fill();
	      ctx.stroke();
	
	      ctx.beginPath();
	      ctx.font = "1px Arial";
	      ctx.lineWidth = .2;
	      ctx.strokeStyle = 'black';
	      ctx.fillStyle =  'black';
	      ctx.fillText(length, 0, 0);
	      ctx.stroke()
	      ctx.restore();
	    }
	
	    draw.measurement = (measurement, color) => {
	      const measurementColor = color || 'grey';
	      const measurementLineWidth = '.1';
	      const lines = measurement.I();
	      try {
	        const winner = lines.furtherLine();
	        draw.beginPath();
	        draw.line(winner.startLine, measurementColor, measurementLineWidth, true);
	        draw.line(winner.endLine, measurementColor, measurementLineWidth, true);
	        draw.line(winner, measurementColor, measurementLineWidth, true);
	        drawMeasurementLabel(winner, measurement);
	      } catch (e) {
	        console.error('Measurement render error:', e);
	      }
	    }
	
	    return draw;
	  }
	}
	
	module.exports = Draw2d;
	
});


RequireJS.addFunction('./app-src/two-d/layout.js',
function (require, exports, module) {
	const Layout2D = require('../objects/layout');
	const panZoom = require('./pan-zoom');
	const $t = require('../../../../public/js/utils/$t.js');
	const du = require('../../../../public/js/utils/dom-utils.js');
	const PopUp = require('../../../../public/js/utils/display/pop-up');
	const Properties = require('../config/properties');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
	const Draw2D = require('./draw.js');
	const Vertex2d = require('../two-d/objects/vertex.js');
	const Line2d = require('../two-d/objects/line.js');
	const Circle2d = require('../two-d/objects/circle.js');
	const SnapLocation2d = require('../two-d/objects/snap-location.js');
	const Snap2d = require('../two-d/objects/snap.js');
	const LineMeasurement2d = require('../two-d/objects/line-measurement');
	
	// TODO: Rename
	const TwoDLayout = {};
	
	let draw;
	const eval = new StringMathEvaluator({Math}).eval;
	const popUp = new PopUp({resize: false});
	
	let layout;
	TwoDLayout.set = (l) => {
	  if (l instanceof Layout2D) {
	    layout = l;
	    panZ.once();
	  }
	}
	
	let hoverMap;
	
	const resetHoverMap = () => hoverMap = {
	    Window2D: {}, Door2D: {}, Wall2D: {}, Vertex2d: {}, LineMeasurement2d: {},
	    Object2d: {}, Square2d: {}, Snap2d: {}, SnapLocation2d: {}
	  };
	
	const windowLineWidth = 8;
	const tolerance = 1;
	let lastImagePoint;
	let hovering;
	let dragging;
	let clickHolding = false;
	let popupOpen = false;
	let measurementModify = false;
	let lastDown = 0;
	const selectTimeBuffer = 200;
	const quickChangeFuncs = {};
	
	function getPopUpAttrs(elem) {
	  const cnt =  du.find.up('[type-2d]', elem);
	  if (cnt === undefined) return {};
	  const type = cnt.getAttribute('type-2d');
	  const key = elem.getAttribute('key');
	  const raw = elem.type === 'input' ? eval(elem.value) : elem.value;
	  let value, display;
	  if (elem.getAttribute('convert') === 'false') {
	    value = raw;
	    display = raw;
	  } else {
	    const measurement = new Measurement(raw, true);
	    value = measurement.decimal();
	    display = measurement.display();
	  }
	  const id = cnt.id;
	  return {
	    type,id,key,value,display,raw,
	    obj:  Layout2D.get(id),
	    point: {
	      x: cnt.getAttribute('x'),
	      y: cnt.getAttribute('y')
	    }
	  };
	}
	
	du.on.match('enter', '.value-2d', (elem) => {
	  const props = getPopUpAttrs(elem);
	  const member = elem.getAttribute('member');
	  switch (member) {
	    case 'object':
	      props.obj[props.key](props.raw);
	      const cab = props.obj.payload();
	      if (cab && cab.constructor.name === 'Cabinet') {
	        const cabDemCnt = du.find(`.cabinet-dem-cnt[cabinet-id='${cab.uniqueId()}']`);
	        const idInput = du.find.closest('.cabinet-id-input', cabDemCnt);
	        idInput.value = props.raw;
	      }
	      panZ.once();
	      return;
	    case 'cabinet':
	      const cabinet = props.obj.payload();
	      const cabCnt = du.find(`.cabinet-dem-cnt[cabinet-id='${cabinet.uniqueId()}']`);
	      const input = du.find.down(`input[name='${props.key}']`, cabCnt);
	      input.value = props.display;
	      cabinet[props.key](props.value);
	      square[props.key === 'thickness' ? 'height' : props.key](props.value);
	      panZ.once();
	      return;
	    case 'square':
	      props.obj = props.obj.topview().object();
	  }
	  if (props.obj.payload && props.obj.payload() === 'placeholder') {
	    if (props.key === 'thickness') props.key = 'height';
	    props.obj = props.obj.topview().object();
	  }
	
	  props.obj[props.key](props.value);
	  elem.value = props.display;
	  layout.history().forceState();
	  panZ.once();
	});
	
	du.on.match('change', 'input[name=\'UNIT2\']', (elem) => {
	  const props = getPopUpAttrs(elem);
	  const input = du.find.closest('.measurement-mod', elem);
	  if (input) setTimeout(() =>
	      input.value = props.obj.display(), 0);
	});
	
	function remove() {
	  if (hovering.parent) {
	    if (hovering.parent().payload().constructor.name === 'Cabinet') {
	      const cabinet = hovering.parent().payload();
	      const cabinetHeader = du.find(`.cabinet-header[cabinet-id='${cabinet.uniqueId()}']`);
	      const removeButton = du.find.closest('.expandable-item-rm-btn', cabinetHeader)
	      removeButton.click();
	    }
	    layout.remove(hovering.parent().id());
	  } else {
	    layout.remove(hovering.id());
	  }
	  popUp.close();
	  TwoDLayout.panZoom.once();
	}
	
	du.on.match('click', '.remove-btn-2d', remove, popUp.container());
	
	du.on.match('click', '.add-door-btn-2d', (elem) => {
	  const attrs = getPopUpAttrs(elem);
	  const distance = attrs.obj.startVertex().distance(attrs.point);
	  attrs.obj.addDoor(distance);
	  panZ.once();
	});
	
	du.on.match('click', '.hinge-btn', (elem) => {
	  const attrs = getPopUpAttrs(elem);
	  attrs.obj.hinge(true);
	  panZ.once();
	});
	
	du.on.match('click', '.add-window-btn-2d', (elem) => {
	  const attrs = getPopUpAttrs(elem);
	  const distance = attrs.obj.startVertex().distance(attrs.point);
	  attrs.obj.addWindow(distance);
	  panZ.once();
	});
	
	du.on.match('click', '.add-object-btn-2d', (elem) => {
	  const props = getPopUpAttrs(elem);
	  const obj = layout.addObject(props.point, 'placeholder');
	  obj.topview().onChange(console.log);
	  panZ.once();
	});
	
	du.on.match('click', '.add-vertex-btn-2d', (elem) => {
	  const attrs = getPopUpAttrs(elem);
	  const point = hovering.closestPointOnLine(attrs.point);
	  layout.addVertex(point, hovering);
	  panZ.once();
	});
	
	du.on.match('enter', '.measurement-mod', (elem) => {
	  const value = eval(elem.value);
	  getPopUpAttrs(elem).obj.modify(value);
	  panZ.once();
	});
	
	// TODO: define cache better.
	function clearCache() {
	  measurementIs = {};
	}
	
	function undo(target) {
	  const state = layout.history().back();
	  if (state) layout = Layout2D.fromJson(state, layout.history());
	  clearCache();
	  panZ.once();
	  console.log('undo State:', state.id);
	}
	
	function redo () {
	  const state = layout.history().forward();
	  console.log('redo State:', state.id);
	  if (state) layout = Layout2D.fromJson(state, layout.history());
	  clearCache();
	  panZ.once();
	}
	
	du.on.match('keycombo:Control,z', '*', undo);
	du.on.match('keycombo:Control,Shift,Z', '*', redo);
	
	function registerQuickChangeFunc(type, func) {
	  if ((typeof func) === 'function') quickChangeFuncs[type] = func;
	}
	
	function onMousedown(event, stdEvent) {
	  lastDown = clickHolding ? 0 : new Date().getTime();
	  lastImagePoint = {x: event.imageX, y: event.imageY};
	  if (stdEvent.button == 0) {
	    clickHolding = !popupOpen && (clickHolding || hovering !== undefined);
	    return clickHolding;
	  } else {
	    if (hovering && quickChangeFuncs[hovering.constructor.name]) {
	      quickChangeFuncs[hovering.constructor.name](hovering, event, stdEvent);
	    }
	    return true;
	  }
	}
	
	function addVertex(hovering, event, stdEvent) {
	  const point = {x: event.imageX, y: event.imageY};
	  layout.addVertex(point, hovering);
	}
	
	registerQuickChangeFunc('Wall2D', addVertex);
	registerQuickChangeFunc('Vertex2d', remove);
	registerQuickChangeFunc('Window2D', remove);
	registerQuickChangeFunc('SnapLocation2d', (snapLoc) => snapLoc.disconnect());
	registerQuickChangeFunc('Door2D', (door) => door.hinge(true));
	
	function hoverId () {
	  return hovering ? hovering.toString() : undefined;
	}
	
	const templateMap = {};
	function getTemplate(item) {
	  const templateLocation = `2d/pop-up/${item.constructor.name.toKebab()}`;
	  if (templateMap[templateLocation] === undefined) {
	    templateMap[templateLocation] = new $t(templateLocation);
	  }
	  return templateMap[templateLocation];
	}
	
	function display(value) {
	  return new Measurement(value).display();
	}
	
	function openPopup(event, stdEvent) {
	  if (hovering) {
	    if (hovering.constructor.name === 'Snap2d') hovering.pairWithLast();
	    popupOpen = true;
	    const msg = `${hovering.constructor.name}: ${hoverId()}`;
	    const scope = {display, UNITS: Properties.UNITS, target: hovering, lastImagePoint};
	    const html = getTemplate(hovering).render(scope);
	    popUp.open(html, {x: event.screenX, y: event.screenY});
	  }
	}
	
	popUp.onClose((elem, event) => {
	  setTimeout(() => popupOpen = false, 200);
	  const attrs = getPopUpAttrs(du.find.closest('[type-2d]',popUp.container()));
	  measurementModify = attrs.type === 'LineMeasurement2d';
	  lastDown = new Date().getTime();
	  clickHolding = false;
	});
	
	function onMouseup(event, stdEvent) {
	  if (stdEvent.button == 0) {
	    if (lastDown > new Date().getTime() - selectTimeBuffer) {
	      if (hovering) {
	        setTimeout(() => openPopup(event, stdEvent), 5);
	      } else {
	        measurementModify = !measurementModify;
	      }
	    } else {
	      const clickWasHolding = clickHolding;
	      clickHolding = false;
	      hovering = undefined;
	      layout.history().newState();
	      return clickWasHolding;
	    }
	  } else {
	    console.log('rightClick: do stuff!!');
	  }
	}
	
	function  drag(event)  {
	  dragging = !popupOpen && clickHolding && hovering &&
	                      hovering.move && hovering.move({x: event.imageX, y: event.imageY}, event);
	  return dragging;
	}
	
	function hover(event) {
	  if (clickHolding) return true;
	  let found = false;
	  const tuple = {x: event.imageX, y: event.imageY};
	  function  check(list) {
	    for (let index = 0; index < list.length; index += 1) {
	      if (withinTolerance(tuple, list[index])) {
	        hovering = list[index].item;
	        found = true;
	      }
	    }
	    if (!clickHolding && !found) hovering = undefined;
	  }
	
	  if (measurementModify) {
	    check(Object.values(hoverMap.LineMeasurement2d));
	    found || check(Object.values(hoverMap.SnapLocation2d));
	    found || check(Object.values(hoverMap.Snap2d));
	    found || check(Object.values(hoverMap.Object2d));
	    found || check(Object.values(hoverMap.Square2d));
	  } else {
	    check(Object.values(hoverMap.Vertex2d));
	    found || check(Object.values(hoverMap.Window2D));
	    found || check(Object.values(hoverMap.Door2D));
	    found || check(Object.values(hoverMap.Wall2D));
	  }
	
	  return found;
	}
	
	function onMove(event) {
	  if (layout === undefined) return;
	  const canDrag = !popupOpen && lastDown < new Date().getTime() - selectTimeBuffer * 1.5;
	  return (canDrag && drag(event)) || hover(event);
	}
	
	function withinTolerance(point, map) {
	  const x0 = point.x;
	  const y0 = point.y;
	  const x1 = map.start.x;
	  const y1 = map.start.y;
	  const x2 = map.end.x;
	  const y2 = map.end.y;
	  const num = Math.abs((y2 - y1)*x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
	  const denom = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
	  return num / denom < map.tolerance;
	}
	
	function withinTolerance(point, map) {
	  const t = map.tolerance;
	  const start = map.start.point ? map.start.point() : map.start;
	  const end = map.end.point ? map.end.point() : map.end;
	  const x0 = point.x;
	  const y0 = point.y;
	  const x1 = start.x > end.x ? end.x : start.x;
	  const y1 = start.y > end.y ? end.y : start.y;
	  const x2 = start.x < end.x ? end.x : start.x;
	  const y2 = start.y < end.y ? end.y : start.y;
	  return x0>x1-t && x0 < x2+t && y0>y1-t && y0<y2+t;
	}
	
	function updateHoverMap(item, start, end, tolerance) {
	  hoverMap[item.constructor.name][item.toString()] = {start, end, tolerance, item};
	}
	
	let windowCount = 0;
	let getWindowColor = () => {
	  switch (Math.floor(Math.random() * 4)) {
	    case 0: return 'red'; case 1: return 'green';
	    case 2: return 'yellow'; case 3: return 'pink';
	  }
	  return 'white';
	}
	
	const windowDrawMap = {};
	function drawWindow(wallStartPoint, window, wallTheta) {
	  draw.beginPath();
	  const points = window.endpoints2D(wallStartPoint);
	  const lookupKey = window.toString();
	  const ctx = draw.ctx();
	  if (windowDrawMap[lookupKey] === undefined) {
	    windowDrawMap[lookupKey] = () => {
	      ctx.moveTo(points.start.x(), points.start.y());
	      ctx.lineWidth = 8;
	      ctx.strokeStyle = hoverId() === window.toString() ? 'green' : 'blue';
	      ctx.lineTo(points.end.x(), points.end.y());
	      updateHoverMap(window, points.start, points.end, 5);
	      ctx.stroke();
	    }
	  }
	  windowDrawMap[lookupKey]();
	}
	
	function updateDoorHoverMap(door, startpointRight, startpointLeft) {
	  updateHoverMap(door, startpointRight, startpointLeft, 15);
	}
	
	function doorDrawingFunc(startpointLeft, startpointRight) {
	  return (door) => {
	    const ctx = draw.ctx();
	    ctx.beginPath();
	    ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'black';
	    const hinge = door.hinge();
	
	    if (hinge === 4) {
	      ctx.moveTo(startpointLeft.x, startpointLeft.y);
	      ctx.lineWidth = 8;
	      ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'white';
	      ctx.lineTo(startpointRight.x, startpointRight.y);
	      updateDoorHoverMap(door, startpointRight, startpointLeft, 10);
	      ctx.stroke();
	    } else {
	      const offset = Math.PI * hinge / 2;
	      const initialAngle = (door.wall().radians() + offset) % (2 * Math.PI);
	      const endAngle = initialAngle + (Math.PI / 2);
	
	      if (hinge === 0 || hinge === 3) {
	        ctx.moveTo(startpointRight.x, startpointRight.y);
	        ctx.arc(startpointRight.x, startpointRight.y, door.width(), initialAngle, endAngle, false);
	        ctx.lineTo(startpointRight.x, startpointRight.y);
	      } else {
	        ctx.moveTo(startpointLeft.x, startpointLeft.y);
	        ctx.arc(startpointLeft.x, startpointLeft.y, door.width(), endAngle, initialAngle, true);
	        ctx.lineTo(startpointLeft.x, startpointLeft.y);
	      }
	
	      ctx.fillStyle = 'white';
	      ctx.fill();
	    }
	    updateHoverMap(door, startpointRight, startpointLeft, 10);
	    ctx.stroke();
	  }
	}
	
	const doorDrawMap = {};
	function drawDoor(startpoint, door, wallTheta) {
	  const lookupKey = door.toString();
	  if (doorDrawMap[lookupKey] === undefined) {
	    const initialAngle = wallTheta;
	    const width = door.width();
	
	    const distLeft = door.fromPreviousWall() + width;
	    const startpointLeft = {x: startpoint.x + distLeft * Math.cos(theta), y: startpoint.y + distLeft * Math.sin(theta)};
	    const distRight = door.fromPreviousWall();
	    const startpointRight = {x: startpoint.x + distRight * Math.cos(theta), y: startpoint.y + distRight * Math.sin(theta)};
	    doorDrawMap[lookupKey] = doorDrawingFunc(startpointLeft, startpointRight, initialAngle);
	  }
	  doorDrawMap[lookupKey](door);
	}
	
	const blank = 40;
	const hblank = blank/2;
	function drawMeasurementValue(line, midpoint, measurement) {
	  if (line === undefined) return;
	  const ctx = draw.ctx();
	  midpoint = line.midpoint();
	
	  ctx.save();
	  ctx.lineWidth = 0;
	  const length = measurement.display();
	  const textLength = length.length;
	  ctx.translate(midpoint.x(), midpoint.y());
	  ctx.rotate(line.radians());
	  ctx.beginPath();
	  ctx.fillStyle = hoverId() === measurement.toString() ? 'green' : "white";
	  ctx.strokeStyle = 'white';
	  ctx.rect(textLength * -3, -8, textLength * 6, 16);
	  ctx.fill();
	  ctx.stroke();
	
	  ctx.beginPath();
	  ctx.lineWidth = 4;
	  ctx.strokeStyle = 'black';
	  ctx.fillStyle =  'black';
	  ctx.fillText(length, 0, 0);
	  ctx.stroke()
	  ctx.restore();
	}
	
	const measurementLineMap = {};
	const getMeasurementLine = (vertex1, vertex2) => {
	  const lookupKey = `${vertex1} => ${vertex2}`;
	  if (measurementLineMap[lookupKey] === undefined) {
	    const line = new Line2d(vertex1, vertex2);
	    measurementLineMap[lookupKey] = new LineMeasurement2d(line)
	  }
	  return measurementLineMap[lookupKey];
	}
	
	let measurementValues = [];
	function measurementValueToDraw(line, midpoint, measurement) {
	  measurementValues.push({line, midpoint, measurement});
	}
	
	function drawMeasurementValues() {
	  let values = measurementValues;
	  measurementValues = [];
	  for (let index = 0; index < values.length; index += 1) {
	    let m = values[index];
	    drawMeasurementValue(m.line, m.midpoint, m.measurement);
	  }
	}
	
	const measurementLineWidth = 3;
	let measurementIs = {};
	function drawMeasurement(measurement, level, focalVertex)  {
	  const lookupKey = `${measurement.toString()}-[${level}]`;
	  // if (measurementIs[lookupKey] === undefined) {
	    measurementIs[lookupKey] = measurement.I(level);
	  // }
	  const lines = measurementIs[lookupKey];
	  const center = layout.verticies(focalVertex, 2, 3);
	  const measurementColor = hoverId() === measurement.toString() ? 'green' : 'grey';
	  try {
	    draw.beginPath();
	    const isWithin = layout.within(lines.furtherLine().midpoint());
	    const line = isWithin ? lines.closerLine() : lines.furtherLine();
	    const midpoint = Vertex2d.center(line.startLine.endVertex(), line.endLine.endVertex());
	    if (measurementModify || popupOpen) {
	      draw.line(line.startLine, measurementColor, measurementLineWidth);
	      draw.line(line.endLine, measurementColor, measurementLineWidth);
	      draw.line(line, measurementColor, measurementLineWidth);
	      updateHoverMap(measurement, midpoint, midpoint, 15);
	    }
	    measurementValueToDraw(line, midpoint, measurement);
	    return line;
	  } catch (e) {
	    console.error('Measurement render error:', e);
	  }
	}
	
	function measureOnWall(list, level) {
	  for (let index = 0; index < list.length; index += 1) {
	    let item = list[index];
	    const wall = item.wall();
	    const points = item.endpoints2D();
	    const measureLine1 = getMeasurementLine(wall.startVertex(), points.start);
	    const measureLine2 = getMeasurementLine(points.end, wall.endVertex());
	    measureLine1.modificationFunction(item.fromPreviousWall);
	    measureLine2.modificationFunction(item.fromNextWall);
	    drawMeasurement(measureLine1, level, wall.startVertex())
	    drawMeasurement(measureLine2, level, wall.startVertex())
	    level += 4;
	  }
	  return level;
	}
	
	function includeDetails() {
	  return !dragging && (measurementModify || popupOpen)
	}
	
	function drawWall(wall) {
	  const ctx = draw.ctx();
	  const startpoint = wall.startVertex().point();
	  r =  wall.length();
	  theta = wall.radians();
	  ctx.beginPath();
	  ctx.moveTo(startpoint.x, startpoint.y);
	  ctx.lineWidth = 10;
	  ctx.strokeStyle = hoverId() === wall.toString() ? 'green' : 'black';
	  const endpoint = wall.endVertex().point();
	  ctx.lineTo(endpoint.x, endpoint.y);
	  ctx.stroke();
	
	  wall.doors().forEach((door) =>
	    drawDoor(startpoint, door, wall.radians()));
	  wall.windows().forEach((window) =>
	    drawWindow(startpoint, window, wall.radians()));
	
	  let level = 8;
	  if (includeDetails()) {
	    const verticies = wall.verticies();
	    let measLines = {};
	    level = measureOnWall(wall.doors(), level);
	    level = measureOnWall(wall.windows(), level);
	  }
	  const measurement = new LineMeasurement2d(wall, undefined, undefined, layout.reconsileLength(wall));
	  drawMeasurement(measurement, level, wall.startVertex());
	
	  updateHoverMap(wall, startpoint, endpoint, 5);
	
	  return endpoint;
	}
	
	function drawVertex(vertex) {
	  const fillColor = hoverId() === vertex.toString() ? 'green' : 'white';
	  const p = vertex.point();
	  const radius = 10;
	  const circle = new Circle2d(radius, p);
	  draw.circle(circle, 'black', fillColor);
	  updateHoverMap(vertex, p, p, 12);
	}
	
	function drawSnapLocation(locations, color) {
	  for (let index = 0; index < locations.length; index += 1) {
	    const loc = locations[index];
	    const c = hoverId() === loc.toString() ? 'green' : (color || loc.color());
	    draw.circle(loc.circle(), 'black', c);
	    const vertex = loc.vertex();
	    updateHoverMap(loc, vertex.point(), vertex.point(), 8);
	  }
	}
	
	function drawObject(object) {
	  switch (object.object().constructor.name) {
	    case 'Square2d':
	      const square = object.object();
	      const center = square.center();
	      updateHoverMap(object, center, center, 30);
	      const color = hoverId() === object.toString() ? 'green' : 'white';
	      draw.square(square, color, object.parent().name());
	      const potentalSnap = object.potentalSnapLocation();
	      drawSnapLocation(object.snapLocations.paired(), 'black');
	      if (potentalSnap) drawSnapLocation([potentalSnap], 'white');
	      SnapLocation2d.active(object.snapLocations.notPaired());
	      break;
	    case 'Line2d':
	      draw.line(object);
	      break;
	    case 'Circle2d':
	      draw.circle(object);
	      break;
	    case 'Layout2d':
	      drawLayout(object); // NOT IMPLEMENTED YET!!!
	      break;
	    default:
	      throw new Error(`Cannot draw object with constructor: ${object.constructor.name}`);
	  }
	}
	
	function illustrate(canvas) {
	  if (layout === undefined) return;
	  SnapLocation2d.clear();
	  resetHoverMap();
	  let lastEndPoint = {x: 20, y: 20};
	
	  draw.beginPath();
	  const walls = layout.walls();
	  let previousEndpoint;
	  let wl = walls.length;
	  walls.forEach((wall, index) => {
	    lastEndPoint = drawWall(wall, lastEndPoint);
	    const previousWall = walls[(index - 1) % wl];
	    if (previousEndpoint)
	      drawVertex(wall.startVertex());
	    previousEndpoint = lastEndPoint;
	  }, true);
	  drawVertex(walls[0].startVertex());
	  drawMeasurementValues();
	  layout.objects().forEach((obj) => drawObject(obj.topview()));
	}
	
	function updateCanvasSize(canvas) {
	  canvas.style.width = '80vh';
	  const dem = Math.floor(canvas.getBoundingClientRect().width);
	  canvas.width = dem;
	  canvas.height = dem;
	  canvas.style.width = `${dem}px`;
	  canvas.style.width = `${dem}px`;
	}
	
	let panZ;
	function init() {
	  const canvas = document.getElementById('two-d-model');
	  draw = new Draw2D(canvas);
	  updateCanvasSize(draw.canvas());
	  panZ = panZoom(canvas, illustrate);
	  panZ.onMove(onMove);
	  panZ.onMousedown(onMousedown);
	  panZ.onMouseup(onMouseup);
	  // draw(canvas);
	  TwoDLayout.panZoom = panZ;
	}
	
	TwoDLayout.init = init;
	module.exports = TwoDLayout;
	
});


RequireJS.addFunction('./app-src/three-d/three-d-model.js',
function (require, exports, module) {
	

	const CSG = require('../../public/js/3d-modeling/csg');
	
	const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');
	const Polygon3D = require('./objects/polygon');
	const Assembly = require('../objects/assembly/assembly');
	const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
	const DrawerBox = require('../objects/assembly/assemblies/drawer/drawer-box.js');
	const pull = require('./models/pull.js');
	const drawerBox = require('./models/drawer-box.js');
	const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
	const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
	const du = require('../../../../public/js/utils/dom-utils.js');
	const $t = require('../../../../public/js/utils/$t.js');
	const approximate = require('../../../../public/js/utils/approximate.js');
	
	const colors = {
	  indianred: [205, 92, 92],
	  lightcoral: [240, 128, 128],
	  salmon: [250, 128, 114],
	  darksalmon: [233, 150, 122],
	  lightsalmon: [255, 160, 122],
	  white: [255, 255, 255],
	  silver: [192, 192, 192],
	  gray: [128, 128, 128],
	  black: [0, 0, 0],
	  red: [255, 0, 0],
	  maroon: [128, 0, 0],
	  yellow: [255, 255, 0],
	  olive: [128, 128, 0],
	  lime: [0, 255, 0],
	  green: [0, 128, 0],
	  aqua: [0, 255, 255],
	  teal: [0, 128, 128],
	  blue: [0, 0, 255],
	  navy: [0, 0, 128],
	  fuchsia: [255, 0, 255],
	  purple: [128, 0, 128]
	}
	
	const colorChoices = Object.keys(colors);
	function getColor(name) {
	  if(colors[name]) return colors[name];
	  return colors[colorChoices[Math.floor(Math.random() * colorChoices.length)]];
	}
	
	class ThreeDModel {
	  constructor(assembly, viewer) {
	    const hiddenPartIds = {};
	    const hiddenPartNames = {};
	    const hiddenPrefixes = {};
	    const instance = this;
	    let hiddenPrefixReg;
	    let inclusiveTarget = {};
	    let partMap;
	    let renderId;
	    let targetPartId;
	    let rootAssembly = assembly.getRoot();
	    this.setTargetPartId = (id) => targetPartId = id;
	
	    this.assembly = (a) => {
	      if (a !== undefined) {
	        assembly = a;
	        rootAssembly = a.getRoot();
	      }
	      return assembly;
	    }
	
	    this.partMap = () => partMap;
	    this.isTarget = (type, value) => {
	      return inclusiveTarget.type === type && inclusiveTarget.value === value;
	    }
	    this.inclusiveTarget = function(type, value) {
	      let prefixReg;
	      if (type === 'prefix') prefixReg = new RegExp(`^${value}`)
	      inclusiveTarget = {type, value, prefixReg};
	    }
	
	    function inclusiveMatch(part) {
	      if (!inclusiveTarget.type || !inclusiveTarget.value) return null;
	      switch (inclusiveTarget.type) {
	        case 'prefix':
	          return part.partName().match(inclusiveTarget.prefixReg) !== null;
	          break;
	        case 'part-name':
	          return part.partName() === inclusiveTarget.value;
	        case 'part-id':
	          return part.uniqueId() === inclusiveTarget.value;
	        default:
	          throw new Error('unknown inclusiveTarget type');
	      }
	    }
	
	    function manageHidden(object) {
	      return function (attr, value) {
	        if (value === undefined) return object[attr] === true;
	       object[attr] = value === true;
	       instance.render();
	      }
	    }
	
	    function buildHiddenPrefixReg() {
	      const list = [];
	      const keys = Object.keys(hiddenPrefixes);
	      for (let index = 0; index < keys.length; index += 1) {
	        const key = keys[index];
	        if (hiddenPrefixes[key] === true) {
	          list.push(key);
	        }
	      }
	      hiddenPrefixReg = list.length > 0 ? new RegExp(`^${list.join('|')}`) : null;
	    }
	
	    this.hidePartId = manageHidden(hiddenPartIds);
	    this.hidePartName = manageHidden(hiddenPartNames);
	    this.hidePrefix = manageHidden(hiddenPrefixes);
	
	    function hasHidden(hiddenObj) {
	      const keys = Object.keys(hiddenObj);
	      for(let i = 0; i < hiddenObj.length; i += 1)
	        if (hidden[keys[index]])return true;
	      return false;
	    }
	    this.noneHidden = () => !hasHidden(hiddenPartIds) &&
	        !hasHidden(hiddenPartNames) && !hasHidden(hiddenPrefixes);
	
	    this.depth = (label) => label.split('.').length - 1;
	
	    function hidden(part, level) {
	      if (!part.included()) return true;
	      const im = inclusiveMatch(part);
	      if (im !== null) return !im;
	      if (instance.hidePartId(part.uniqueId())) return true;
	      if (instance.hidePartName(part.partName())) return true;
	      if (hiddenPrefixReg && part.partName().match(hiddenPrefixReg)) return true;
	      return false;
	    }
	
	    function coloring(part) {
	      if (part.partName() && part.partName().match(/.*Frame.*/)) return getColor('blue');
	      else if (part.partName() && part.partName().match(/.*Drawer.Box.*/)) return getColor('green');
	      else if (part.partName() && part.partName().match(/.*Handle.*/)) return getColor('silver');
	      return getColor('red');
	    }
	
	    const randInt = (start, range) => start + Math.floor(Math.random() * range);
	    function debugColoring() {
	      return [randInt(0, 255),randInt(0, 255),randInt(0, 255)];
	    }
	
	    function getModel(assem) {
	      const pos = assem.position().current();
	      let model;
	      if (assem instanceof DrawerBox) {
	        model = drawerBox(pos.demension.y, pos.demension.x, pos.demension.z);
	      } else if (assem instanceof Handle) {
	        model = pull(pos.demension.y, pos.demension.z);
	      } else {
	        const radius = [pos.demension.x / 2, pos.demension.y / 2, pos.demension.z / 2];
	        model = CSG.cube({ radius });
	      }
	      model.rotate(pos.rotation);
	      pos.center.z *= -1;
	      model.center(pos.center);
	      // serialize({}, model);
	      return model;
	    }
	
	    let lm;
	    this.lastModel = () => {
	      if (lm === undefined) return undefined;
	      const polys = [];
	      const map = {xy: [], xz: [], zy: []};
	      lm.polygons.forEach((p, index) => {
	        const norm = p.vertices[0].normal;
	        const verticies = p.vertices.map((v) => ({x: v.pos.x, y: v.pos.y, z: v.pos.z}));
	        polys.push(new Polygon3D(verticies));
	      });
	      // Polygon3D.merge(polys);
	      const twoDpolys = Polygon3D.toTwoD(polys);
	      return twoDpolys;
	    }
	
	
	    this.render = function () {
	      ThreeDModel.lastActive = this;
	      const cacheId = rootAssembly.uniqueId();
	      // FunctionCache.on(cacheId);
	      FunctionCache.on('sme');
	
	      const startTime = new Date().getTime();
	      buildHiddenPrefixReg();
	      function buildObject(assem) {
	        let a = getModel(assem);
	        const c = assem.position().center();
	        const e=1;
	        a.center({x: approximate(c.x * e), y: approximate(c.y * e), z: approximate(-c.z * e)});
	        a.setColor(...getColor());
	        assem.getJoints().female.forEach((joint) => {
	          const male = joint.getMale();
	          const m = getModel(male, male.position().current());
	          a = a.subtract(m);
	        });
	        // else a.setColor(1, 0, 0);
	        return a;
	      }
	      const assemblies = this.assembly().getParts();
	      let a;
	      partMap = {};
	      for (let index = 0; index < assemblies.length; index += 1) {
	        const assem = assemblies[index];
	        partMap[assem.uniqueId()] = assem.path();
	        if (!hidden(assem)) {
	          if (assem.constructor.name === 'DrawerFront') {
	            console.log('df mf');
	          }
	          const b = buildObject(assem);
	          // const c = assem.position().center();
	          // b.center({x: approximate(c.x * e), y: approximate(c.y * e), z: approximate(-c.z * e)});
	          if (a === undefined) a = b;
	          else if (b && assem.length() && assem.width() && assem.thickness()) {
	            a = a.union(b);
	          }
	          if (assem.uniqueId() === targetPartId) {
	            lm = b.clone();
	            const rotation = assem.position().rotation();
	            rotation.x *=-1;
	            rotation.y = (360 - rotation.y)  % 360;
	            rotation.z *=-1;
	            lm.center({x:0,y:0,z:0})
	            lm.rotate(rotation);
	          }
	        }
	      }
	      if (a) {
	        // a.polygons.forEach((p) => p.shared = getColor());
	        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
	        viewer.mesh = a.toMesh();
	        viewer.gl.ondraw();
	        console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
	      }
	      // FunctionCache.off(cacheId);
	      FunctionCache.off('sme');
	    }
	
	    this.update = () => {
	      const rId = renderId = String.random();
	      ThreeDModel.renderId = renderId;
	      setTimeout(() => {
	        if(renderId === rId) instance.render();
	      }, 250);
	    };
	  }
	}
	
	ThreeDModel.models = {};
	ThreeDModel.get = (assembly, viewer) => {
	  if (assembly === undefined) return ThreeDModel.lastActive;
	  if (ThreeDModel.models[assembly.uniqueId()] === undefined) {
	    ThreeDModel.models[assembly.uniqueId()] = new ThreeDModel(assembly, viewer);
	  }
	  return ThreeDModel.models[assembly.uniqueId()];
	}
	ThreeDModel.render = (part) => {
	  const renderId = String.random();
	  ThreeDModel.renderId = renderId;
	  setTimeout(() => {
	    if(ThreeDModel.renderId === renderId) {
	      const cacheId = part.getRoot().uniqueId();
	      FunctionCache.on(cacheId);
	      ThreeDModel.get(part).render();
	      FunctionCache.off(cacheId);
	    }
	  }, 2500);
	};
	
	module.exports = ThreeDModel
	
});


RequireJS.addFunction('./app-src/services/history.js',
function (require, exports, module) {
	
class History {
	  constructor() {
	    let changes = [];
	    let changesIndex = [];
	
	      this.addChange = (forward, back) => {
	        changes = changes.slice(0, changesIndex);
	        changes.push({forward, back});
	        changesIndex++;
	      }
	
	    this.getSet = (obj, initialVals, ...attrs) => {
	      attrs = Object.getSet(obj, initialVals, ...attrs);
	      const objFuncs = {};
	      attrs.forEach((attr) => {
	        objFuncs[attr] = obj[attr];
	        obj[attr] = (value) => {
	          if (value !== undefined) {
	            const oldValue = objFuncs[attr]();
	            const back = () => objFuncs[attr](oldValue);
	            const forward = () => objFuncs[attr](value);
	            this.addChange(obj, forward, back);
	          }
	          return objFuncs[attr](value);
	        }
	      });
	    }
	
	    this.undo = () => {
	      const change = changes[--changesIndex];
	      change.back();
	    }
	
	    this.redo = () => {
	      const change = changes[++changesIndex];
	      change.forward();
	    }
	
	    this.canUndo =() => changesIndex > 0;
	    this.canRedo = () => changeIndex < changes.length - 1;
	  }
	}
	
	module.exports = History;
	
});


RequireJS.addFunction('./app-src/services/display-svc.js',
function (require, exports, module) {
	class Register {
	  constructor() {
	    const registered = {};
	    this.register = function (nameOobj, obj) {
	      if ((typeof nameOobj) !== 'object') {
	        registered[nameOobj] = obj;
	      } else {
	        const keys = Object.keys(nameOobj);
	        for (let index = 0; index < keys.length; index += 1) {
	          const key = keys[index];
	          registered[key] = nameOobj[key];
	        }
	      }
	    }
	    this.get = (name) => registered[name];
	  }
	}
	
	module.exports = new Register();
	
});


RequireJS.addFunction('./app-src/cost/init-costs.js',
function (require, exports, module) {
	

	
	
	const Cost = require('./cost.js');
	const Material = require('./types/material.js');
	const Labor = require('./types/labor.js');
	
	Cost.register(Material);
	Cost.register(Labor);
	
});


RequireJS.addFunction('./app-src/objects/order.js',
function (require, exports, module) {
	

	
	const Room = require('./room.js');
	
	class Order {
	  constructor(name, id) {
	    if (id === null) this.loaded = false;
	    else this.loaded = true;
	    const initialVals = {
	      name: name || ++Order.count,
	      id: id || String.random(32),
	    }
	    Object.getSet(this, initialVals, 'rooms');
	    this.rooms = {};
	  }
	}
	
	Order.count = 0;
	module.exports = Order
	
});


RequireJS.addFunction('./app-src/objects/room.js',
function (require, exports, module) {
	

	
	const Cabinet = require('./assembly/assemblies/cabinet.js');
	const Group = require('./group.js');
	const Lookup = require('../../../../public/js/utils/object/lookup');
	const Layout2D = require('../objects/layout');
	
	
	class Room extends Lookup {
	  constructor(name, id) {
	    super(id || String.random(32));
	    const initialVals = {
	      name: name || `Room ${Room.count++}`,
	      layout: new Layout2D()
	    }
	    Object.getSet(this, initialVals, 'groups');
	    this.groups = [new Group(this)];
	    this.addGroup = () => this.groups.push(new Group(this));
	  }
	};
	Room.count = 0;
	new Room();
	
	module.exports = Room;
	
});


RequireJS.addFunction('./app-src/objects/layout.js',
function (require, exports, module) {
	
const Lookup = require('../../../../public/js/utils/object/lookup.js');
	const Measurement = require('../../../../public/js/utils/measurement.js');
	const StateHistory = require('../../../../public/js/utils/services/state-history');
	const approximate = require('../../../../public/js/utils/approximate.js');
	const Vertex2d = require('../two-d/objects/vertex.js');
	const Line2d = require('../two-d/objects/line.js');
	const Square2d = require('../two-d/objects/square.js');
	const Circle2d = require('../two-d/objects/circle.js');
	const Snap2d = require('../two-d/objects/snap.js');
	
	const pushVertex = (x, y, arr) => {
	  if (Number.isNaN(x) || Number.isNaN(y)) return;
	  arr.push(new Vertex2d({x, y}));
	}
	
	
	const vertexMap = {};
	function getVertex(point, wall1, wall2) {
	  const mapId = `${wall1.id()}->${wall2.id()}`;
	  if (vertexMap[mapId] === undefined) {
	    vertexMap[mapId] = new Vertex2d(point);
	    wall1.startVertex(vertexMap[mapId]);
	    wall2.endVertex(vertexMap[mapId]);
	  }
	  else vertexMap[mapId].point(point);
	  return vertexMap[mapId];
	}
	
	class OnWall extends Lookup {
	  constructor(wall, fromPreviousWall, fromFloor, height, width) {
	    super();
	    Object.getSet(this, {width, height, fromFloor, fromPreviousWall}, 'wallId');
	    let start = new Vertex2d();
	    let end = new Vertex2d();
	    this.wallId = () => wall.id();
	    this.endpoints2D = () => {
	      const wallStartPoint = wall.startVertex();
	      const dist = this.fromPreviousWall();
	      const total = dist + this.width();
	      const theta = wall.radians();
	      const startPoint = {};
	      startPoint.x = wallStartPoint.x() + dist * Math.cos(theta);
	      startPoint.y = wallStartPoint.y() + dist * Math.sin(theta);
	      start.point(startPoint);
	
	      const endPoint = {};
	      endPoint.x = (wallStartPoint.x() + total * Math.cos(theta));
	      endPoint.y = (wallStartPoint.y() + total * Math.sin(theta));
	      end.point(endPoint);
	
	      return { start, end, toString: () => `${start.toString()} => ${end.toString()}`};
	    }
	    this.fromPreviousWall = (value) => {
	      value = Number.parseFloat(value);
	      if (!Number.isNaN(value)) fromPreviousWall = value;
	      return fromPreviousWall;
	    }
	    this.fromNextWall = (value) => {
	      value = Number.parseFloat(value);
	      if (value) {
	        this.fromPreviousWall(wall.length() - this.width() - value);
	      }
	      return wall.length() - this.width() - this.fromPreviousWall();
	    }
	    this.wall = () => wall;
	    this.setWall = (w) => wall = w;
	    this.move = (center) => {
	      const point = wall.closestPointOnLine(center);
	      const onLine = wall.closestPointOnLine(point, true);
	      let distanceStart = wall.startVertex().distance(point);
	      if (!onLine) {
	        let distanceEnd = wall.endVertex().distance(point);
	        if (distanceStart < distanceEnd) this.fromPreviousWall(0);
	        else this.fromPreviousWall(wall.length() - this.width());
	      } else {
	        const max = wall.length() - this.width();
	        distanceStart = distanceStart > max ? max : distanceStart;
	        this.fromPreviousWall(distanceStart);
	      }
	    };
	    this.toString = () => `${this.constructor.name}:${wall}, ${fromPreviousWall}, ${fromFloor}, ${height}, ${width}`
	  }
	}
	OnWall.sort = (ow1, ow2) => ow1.fromPreviousWall() - ow2.fromPreviousWall();
	OnWall.fromJson = (json) => {
	  const cxtr = Lookup.decode(json.id).constructor;
	  const instance = new cxtr(null, json.fromPreviousWall, json.fromFloor, json.height, json.width);
	  instance.id(json.id);
	  return instance;
	}
	
	class Door2D extends OnWall {
	  constructor() {
	    super(...arguments);
	    this.width(this.width() || 91.44);
	    this.height(this.height() || 198.12);
	    this.fromPreviousWall(this.fromPreviousWall() || 150);
	    this.fromFloor(this.fromFloor() || 0);
	    let hinge = 0;
	    Object.getSet(this, 'hinge');
	    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}:${hinge}`;
	    this.remove = () => this.wall().removeDoor(this);
	    this.hinge = (val) => val === undefined ? hinge :
	      hinge = ((typeof val) === 'number' ? val : hinge + 1) % 5;
	  }
	}
	
	Door2D.fromJson = (json) => {
	  const inst = OnWall.fromJson(json);
	  inst.hinge(json.hinge);
	  return inst;
	}
	
	class Window2D extends OnWall {
	  constructor(wall, fromPreviousWall, fromFloor, height, width) {
	    width = width || 81.28;
	    height = height || 91.44;
	    fromFloor = fromFloor || 101.6;
	    fromPreviousWall = fromPreviousWall || 20;
	    super(wall, fromPreviousWall, fromFloor, height, width);
	    this.remove = () => this.wall().removeWindow(this);
	    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}`;
	  }
	}
	
	function modifyVertex(vertex) {
	  return (props) => {
	      console.log('DummyFuncNotIntendedToBeCalled');
	  }
	}
	
	class Wall2D extends Line2d {
	  constructor(startVertex, endVertex, height, windows, doors) {
	    super(startVertex, endVertex);
	    this.startVertex().modificationFunction(modifyVertex(this.startVertex()));
	    this.endVertex().modificationFunction(modifyVertex(this.endVertex()));
	    Lookup.convert(this);
	    windows = windows || [];
	    windows.forEach((win) => win.setWall(this));
	    doors = doors || [];
	    doors.forEach((door) => door.setWall(this));
	    const wall = this;
	
	    height = height || 243.84;
	    Object.getSet(this, {height, windows, doors});
	    // this.copy = () => new Wall2D(this.length(), this.radians());
	    this.windows = () => windows;
	    this.addWindow = (fromPreviousWall) => windows.push(new Window2D(this, fromPreviousWall));
	    this.doors = () => doors;
	    this.addDoor = (fromPreviousWall) => doors.push(new Door2D(this, fromPreviousWall));
	    this.verticies = () => {
	      const verts = [this.startVertex()];
	      const doorsAndWindows = doors.concat(windows);
	      doorsAndWindows.sort(OnWall.sort);
	      doorsAndWindows.forEach((onWall) => {
	        const endpoints = onWall.endpoints2D();
	        verts.push(endpoints.start);
	        verts.push(endpoints.end);
	      });
	      verts.push(this.endVertex());
	      return verts;
	    }
	
	    this.remove = () => {
	        const prevWall = this.startVertex().prevLine();
	        const nextLine = this.endVertex().nextLine();
	        const startVertex = this.startVertex();
	        nextLine.startVertex(startVertex);
	        startVertex.nextLine(nextLine);
	    }
	
	    this.removeDoor = (door) => doors.splice(doors.indexOf(door), 1);
	    this.removeWindow = (window) => windows.splice(windows.indexOf(window), 1);
	  }
	}
	Wall2D.fromJson = (json, vertexMap) => {
	  vertexMap ||= {};
	  const newSv = Object.fromJson(json.startVertex);
	  const svStr = newSv.toString();
	  const newEv = Object.fromJson(json.endVertex);
	  const evStr = newEv.toString();
	  if (vertexMap[svStr] === undefined) vertexMap[svStr] = newSv;
	  if (vertexMap[evStr] === undefined) vertexMap[evStr] = newEv;
	  const sv = vertexMap[svStr];
	  const ev = vertexMap[evStr];
	  const windows = Object.fromJson(json.windows);
	  const doors = Object.fromJson(json.doors);
	  const inst = new Wall2D(sv, ev, json.height, windows, doors);
	  inst.id(json.id);
	  return inst;
	}
	
	function defSquare(center, parent) {
	  return new Snap2d(parent, new Square2d(center), 30);
	}
	
	class Object2d extends Lookup {
	  constructor(center, layout, payload, name) {
	    super();
	    center = new Vertex2d(center);
	    this.layout = () => layout;
	    Object.getSet(this, {payload, name,
	      topview: defSquare(center, this), bottomView: defSquare(center, this),
	      leftview: defSquare(center, this), rightview: defSquare(center, this),
	      frontview: defSquare(center, this), backView: defSquare(center, this)
	    });
	
	    if ((typeof name) === 'function') this.name = name;
	    this.toString = () => `Object2d: ${center}`;
	  }
	}
	
	const ww = 500;
	class Layout2D extends Lookup {
	  constructor(walls, objects, history) {
	    super();
	    walls = walls || [];
	    objects = objects || [];
	    Object.getSet(this, {objects, walls});
	    const initialized = walls.length > 0;
	    const instance = this;
	
	    this.startLine = () => this.walls()[0];
	    this.endLine = () => this.walls()[this.walls().length - 1];
	
	    function sortByAttr(attr) {
	      function sort(obj1, obj2) {
	        if (obj2[attr] === obj1[attr]) {
	          return 0;
	        }
	        return obj2[attr] < obj1[attr] ? 1 : -1;
	      }
	      return sort;
	    }
	
	    this.wallIndex = (wallOrIndex) => {
	      if (wallOrIndex instanceof Wall2D) {
	        for (let index = 0; index < walls.length; index += 1) {
	          if (walls[index] === wallOrIndex) return index;
	        }
	        return -1;
	      } else {
	        while(wallOrIndex < 0) wallOrIndex += walls.length;
	        return wallOrIndex % walls.length;
	      }
	    }
	
	    function relitiveWall(wall, i) {
	      let position = instance.wallIndex(wall);
	      if (position === undefined) return null;
	      const relitiveList = walls.slice(position).concat(walls.slice(0, position));
	      return relitiveList[instance.wallIndex(i)];
	    }
	    this.relitiveWall = relitiveWall;
	    this.nextWall = (wall) => relitiveWall(wall, 1);
	    this.prevWall = (wall) => relitiveWall(wall, -1);
	
	    function reconsileLength (wall) {
	      return (newLength) => {
	        const moveVertex = wall.endVertex();
	        const nextLine = instance.nextWall(wall);
	        if (nextLine === undefined) wall.length(newLength);
	
	        const vertex1 = nextLine.endVertex();
	        const circle1 = new Circle2d(nextLine.length(), vertex1);
	        const vertex2 = wall.startVertex();
	        const circle2 = new Circle2d(newLength, vertex2);
	        const intersections = circle1.intersections(circle2);
	
	        const useFirst = (intersections.length !== 0 && intersections.length === 1) ||
	                  moveVertex.distance(intersections[0]) < moveVertex.distance(intersections[1]);
	        if (intersections.length === 0) {
	          wall.length(newLength);
	        } else if (useFirst) {
	          moveVertex.point(intersections[0]);
	        } else {
	          moveVertex.point(intersections[1]);
	        }
	      }
	    }
	    this.reconsileLength = reconsileLength;
	
	    const sortById = sortByAttr('id');
	    this.toJson = () => {
	      const objs = this.objects();
	      const json = {walls: []};
	      json.id = this.id();
	      json.objects = Array.toJson(objs);
	      this.walls().forEach((wall) => {
	        json.walls.push(wall.toJson());
	      });
	      // json.walls.sort(sortById);
	      json.objects.sort(sortById);
	      const snapMap = {};
	      objs.forEach((obj) => {
	        const snapLocs = obj.topview().snapLocations.paired();
	        snapLocs.forEach((snapLoc) => {
	          const snapLocJson = snapLoc.toJson();
	          if (snapMap[snapLocJson.UNIQUE_ID] === undefined) {
	            snapMap[snapLocJson.UNIQUE_ID] = snapLocJson;
	          }
	        });
	      });
	      json.snapLocations = Object.values(snapMap);
	      json._TYPE = this.constructor.name;
	      delete json.id;
	      return json;
	    }
	
	    this.push = (...points) => {
	      if (this.startLine() === undefined) {
	        const walls = this.walls();
	        if (points.length < 3) throw Error('Layout must be initialized with atleast three vertices');
	        walls[0] = new Wall2D(points[0], points[1]);
	      }
	      for (let index = 1; index < points.length; index += 1) {
	        const endLine = this.endLine();
	        const startV = endLine.endVertex();
	        const endV = new Vertex2d(points[(index + 1) % points.length]);
	        walls.push(new Wall2D(startV, endV));
	      }
	    }
	
	    this.addObject = (id, payload, name) => {
	      const center = Vertex2d.center.apply(null, this.verticies())
	      const obj = new Object2d(center, this, payload, name);
	      obj.id(id);
	      this.objects().push(obj);
	      return obj;
	    }
	
	    this.removeObject = (obj) => {
	      for (index = 0; index < objects.length; index += 1) {
	        if (objects[index] === obj) {
	          return objects.splice(index, 1);
	        }
	      }
	      return null;
	    }
	
	    this.removeByPayload = (payload) => {
	      for (index = 0; index < objects.length; index += 1) {
	        if (objects[index].payload() === payload) {
	          return objects.splice(index, 1);
	        }
	      }
	      return null;
	    }
	
	    this.idMap = () => {
	      const idMap = {};
	      const walls = this.walls();
	      idMap[walls[0].startVertex().id()] = walls[0].startVertex();
	      walls.forEach((wall) => {
	        idMap[wall.id()] = wall;
	        const endV = wall.endVertex();
	        idMap[endV.id()] = endV;
	        wall.windows().forEach((window) => idMap[window.id()] = window);
	        wall.windows().forEach((window) => idMap[window.id()] = window);
	        wall.doors().forEach((door) => idMap[door.id()] = door);
	      });
	      objects.forEach((obj) => idMap[obj.id()] = obj);
	      return idMap;
	    }
	
	    this.removeWall = (wall) => {
	      if (!(wall instanceof Wall2D)) return undefined;
	      const walls = this.walls();
	      for (index = 0; index < walls.length; index += 1) {
	        const currWall = walls[index];
	        if (currWall === wall) {
	          const nextWallSv = walls[this.wallIndex(index + 1)].startVertex();
	          walls[this.wallIndex(index - 1)].endVertex(nextWallSv);
	          walls.splice(index, 1);
	          return currWall;
	        }
	      }
	      return null;
	    }
	
	    this.addVertex = (vertex, wall) => {
	      vertex = new Vertex2d(vertex);
	      let wallIndex = this.wallIndex(wall);
	      if (wallIndex === -1) {
	        wall = walls[walls.length - 1];
	        wallIndex = this.wallIndex(wall);
	      }
	      let newWall = new Wall2D(vertex, wall.endVertex());
	      wall.endVertex(vertex);
	
	      const tail = [newWall].concat(walls.slice(wallIndex + 1));
	      walls = walls.slice(0, wallIndex + 1).concat(tail);
	    }
	
	    this.removeVertex = (vertex) => {
	      if (!(vertex instanceof Vertex2d)) return undefined;
	      const walls = this.walls();
	      for (index = 0; index < walls.length; index += 1) {
	        const wall = walls[index];
	        if (wall.startVertex() === vertex) {
	          walls[this.wallIndex(index - 1)].endVertex(walls[this.wallIndex(index + 1)].startVertex());
	          return walls.splice(index, 1);
	        }
	        if (wall.endVertex() === vertex) {
	          walls[this.wallIndex(index + 1)].startVertex(walls[this.wallIndex(index - 1)].endVertex());
	          return walls.splice(index, 1);
	        }
	      }
	      return null;
	    }
	
	    this.remove = (id) => {
	      id = id instanceof Lookup ? id.id() : id;
	      const idMap = this.idMap();
	      const walls = this.walls();
	      const wallCount = walls.length;
	      const item = idMap[id];
	      if (item === undefined) throw new Error(`Unknown id: ${id}`);
	      if (wallCount < 3 && (item instanceof Wall2D || item instanceof Vertex2d))
	          throw new Error('Cannot Remove any more verticies or walls');
	
	      return this.removeVertex(item) || this.removeWall(item) ||
	              this.removeObject(item) || item.remove();
	    }
	
	    this.verticies = (target, before, after) => {
	      const lines = this.walls();
	      if (lines.length === 0) return [];
	      const fullList = [];
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        fullList.push(line.startVertex());
	      }
	      if (target) {
	        const verticies = [];
	        const index = fullList.indexOf(target);
	        if (index === undefined) return null;
	        for (let i = before; i < before + after + 1; i += 1)
	            verticies.push(fullList[Math.mod(i, fullList.length)]);
	        return verticies;
	      } else return fullList;
	
	      return verticies;
	    }
	
	    this.within = (vertex, print) => {
	      vertex = vertex instanceof Vertex2d ? vertex.point() : vertex;
	      const endpoint = {x: 0, y: 0};
	      this.verticies().forEach(vertex => {
	        endpoint.x -= vertex.x();
	        endpoint.y -= vertex.y();
	      });
	      const escapeLine = new Line2d(vertex, endpoint);
	      const intersections = [];
	      let onLine = false;
	      const allIntersections = [];
	      this.walls().forEach((wall) => {
	
	        const intersection = wall.findIntersection(escapeLine, true);
	        allIntersections.push(intersection);
	        if (intersection) {
	          const xEqual = approximate.eq(intersection.x, vertex.x, 100);
	          const yEqual = approximate.eq(intersection.y, vertex.y, 100);
	          if (xEqual && yEqual) onLine = true;
	          intersections.push(intersection);
	        }
	      });
	
	      return onLine || intersections.length % 2 === 1;
	    }
	
	    this.setHistory = (h) => {
	      history = h.clone(this.toJson);
	    }
	
	    history = new StateHistory(this.toJson);
	    this.history = () => history;
	
	    if (!initialized) this.push({x:1, y:1}, {x:ww, y:0}, {x:ww,y:ww}, {x:0,y:ww});
	    this.walls = () => walls;
	
	  }
	}
	
	Layout2D.fromJson = (json, history) => {
	  const walls = [];
	  const vertexMap = {};
	  json.walls.forEach((wallJson) => walls.push(Wall2D.fromJson(wallJson, vertexMap)));
	
	  const objects = Object.fromJson(json.objects);
	  const layout = new Layout2D(walls, objects);
	  layout.id(json.id);
	  json.snapLocations.forEach((snapLocJson) => {
	    const snapLoc1 = Lookup.get(snapLocJson[0].objectId)[snapLocJson[0].location]();
	    const snapLoc2 = Lookup.get(snapLocJson[1].objectId)[snapLocJson[1].location]();
	    snapLoc2.pairWith(snapLoc1);
	  });
	
	  if (history) layout.setHistory(history);
	  return layout;
	}
	
	new Layout2D();
	new Object2d();
	new Door2D();
	new Window2D();
	
	Layout2D.Wall2D = Wall2D;
	Layout2D.Window2D = Window2D;
	Layout2D.Object2d = Object2d;
	Layout2D.Door2D = Door2D;
	module.exports = Layout2D;
	
});


RequireJS.addFunction('./app-src/objects/company.js',
function (require, exports, module) {
	

	
	const Door = require('./assembly/assemblies/door/door.js');
	
	class Company {
	  constructor(properties) {
	    if (!properties.name) throw new Error('Company name must be defined')
	    if (Company.list[properties.name] !== undefined) throw new Error('Company name must be unique: name already registered');
	    this.name = () => properties.name;
	    this.email = () => properties.email;
	    this.address = () => properties.address;
	    Company.list[this.name()] = this;
	  }
	}
	
	Company.list = {};
	new Company({name: 'Central Door'});
	new Company({name: 'Central Wood'});
	new Company({name: 'ADC'});
	new Company({name: 'Accessa'});
	new Company({name: 'Top Knobs'});
	new Company({name: 'Richelieu'});
	module.exports = Company
	
	
	
	
	
});


RequireJS.addFunction('./app-src/objects/group.js',
function (require, exports, module) {
	
const PropertyConfig = require('../config/property/config');
	const Lookup = require('../../../../public/js/utils/object/lookup.js');
	
	class Group extends Lookup {
	  constructor(room, name, id) {
	    super(id);
	    const initialVals = {
	      name: name || 'Group',
	    }
	    Object.getSet(this, initialVals);
	    this.propertyConfig = new PropertyConfig();
	    this.cabinets = [];
	    this.room = () => room;
	    this.toJson = () => {
	      const json = {cabinets: [], _TYPE: 'Group'};
	      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
	      json.name = this.name();
	      json.id = this.id();
	      json.roomId = this.room().id();
	      json.propertyConfig = this.propertyConfig.toJson();
	      return json;
	    }
	  }
	}
	
	Group.count = 0;
	new Group();
	
	Group.fromJson = (json) => {
	  const room = Lookup.get(json.roomId);
	  const group = new Group(room, json.name, json.id);
	  group.propertyConfig = PropertyConfig.fromJson(json.propertyConfig);
	  json.cabinets.forEach((cabinetJson) => {
	    cabinetJson.propertyConfig = group.propertyConfig;
	    group.cabinets.push(Object.fromJson(cabinetJson))
	  });
	  return group;
	}
	
	module.exports = Group;
	
});


RequireJS.addFunction('./app-src/three-d/models/drawer-box.js',
function (require, exports, module) {
	

	const CSG = require('../../../public/js/3d-modeling/csg');
	
	function drawerBox(length, width, depth) {
	  const bottomHeight = 7/8;
	  const box = CSG.cube({demensions: [width, length, depth], center: [0,0,0]});
	  box.setColor(1, 0, 0);
	  const inside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, bottomHeight, 0]});
	  inside.setColor(0, 0, 1);
	  const bInside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, (-length) + (bottomHeight) - 1/4, 0]});
	  bInside.setColor(0, 0, 1);
	
	  return box.subtract(bInside).subtract(inside);
	}
	module.exports = drawerBox
	
});


RequireJS.addFunction('./app-src/two-d/objects/line.js',
function (require, exports, module) {
	
const approximate = require('../../../../../public/js/utils/approximate.js');
	const Vertex2d = require('./vertex');
	const Circle2d = require('./circle');
	
	class Line2d {
	  constructor(startVertex, endVertex) {
	    startVertex = new Vertex2d(startVertex);
	    endVertex = new Vertex2d(endVertex);
	    const measureTo = [];
	    const instance = this;
	    Object.getSet(this, {startVertex, endVertex});
	
	    this.startVertex = (newVertex) => {
	      if (newVertex instanceof Vertex2d) {
	        startVertex = newVertex;
	      }
	      return startVertex;
	    }
	    this.endVertex = (newVertex) => {
	      if (newVertex instanceof Vertex2d) {
	        endVertex = newVertex;
	      }
	      return endVertex;
	    }
	
	    function changeLength(value) {
	      const circle = new Circle2d(value, instance.startVertex());
	      const points = circle.intersections(instance);
	      const dist0 = instance.endVertex().distance(points[0]);
	      const dist1 = instance.endVertex().distance(points[1]);
	      if (dist1 < dist0) {
	        instance.endVertex().point(points[1]);
	      } else {
	        instance.endVertex(points[0]);
	      }
	    }
	
	    this.withinSegmentBounds = (point) => {
	      point = new Vertex2d(point);
	      return approximate.lteq(this.minX(), point.x(), 100) && approximate.lteq(this.minY(), point.y(), 100) &&
	            approximate.gteq(this.maxX(), point.x(), 100) && approximate.gteq(this.maxY(), point.y(), 100);
	    }
	
	
	    function reconsileLength (newLength) {
	      const moveVertex = instance.endVertex();
	      const nextLine = moveVertex.nextLine()
	      if (nextLine === undefined) changeLength(newLength);
	
	      const vertex1 = nextLine.endVertex();
	      const circle1 = new Circle2d(nextLine.length(), vertex1);
	      const vertex2 = instance.startVertex();
	      const circle2 = new Circle2d(newLength, vertex2);
	      const intersections = circle1.intersections(circle2);
	
	      const useFirst = (intersections.length !== 0 && intersections.length === 1) ||
	                moveVertex.distance(intersections[0]) < moveVertex.distance(intersections[1]);
	      if (intersections.length === 0) {
	        changeLength(newLength);
	      } else if (useFirst) {
	        moveVertex.point(intersections[0]);
	      } else {
	        moveVertex.point(intersections[1]);
	      }
	    }
	
	    this.length = (value) => {
	      value = Number.parseFloat(value);
	      if (!Number.isNaN(value)) {
	        const sv = this.startVertex();
	        const x = value * Math.cos(this.radians()) + sv.x();
	        const y = value * Math.sin(this.radians()) + sv.y();
	        this.endVertex().point({x,y});
	      }
	      const a = this.endVertex().x() - this.startVertex().x();
	      const b = this.endVertex().y() - this.startVertex().y();
	      return Math.sqrt(a*a + b*b);
	    }
	
	    function getSlope(v1, v2) {
	      const y1 = v1.y();
	      const y2 = v2.y();
	      const x1 = v1.x();
	      const x2 = v2.x();
	      return approximate((y2 - y1) / (x2 - x1));
	    }
	
	    function getB(x, y, slope) {
	      if (slope === 0) return y;
	      else if (Math.abs(slope) === Infinity) {
	        if (this.startVertex().x() === 0) return 0;
	        else return Infinity;
	      }
	      else return y - slope * x;
	    }
	
	    function newX(m1, m2, b1, b2) {
	      return (b2 - b1) / (m1 - m2);
	    }
	
	    function getY(x, slope, b) {return slope*x + b}
	    function getX(y, slope, b) {return  (y - b)/slope}
	
	    this.midpoint = () => {
	      const x = (this.endVertex().x() + this.startVertex().x())/2;
	      const y = (this.endVertex().y() + this.startVertex().y())/2;
	      return new Vertex2d({x,y});
	    }
	
	    this.yIntercept = () => getB(this.startVertex().x(), this.startVertex().y(), this.slope());
	    this.slope = () => getSlope(this.startVertex(), this.endVertex());
	    this.y = (x) => {
	      x ||= this.startVertex().x();
	      const slope = this.slope();
	      if (Math.abs(slope) === Infinity) return Infinity;
	      if (slope === 0) return this.startVertex().y();
	      return  (this.slope()*x + this.yIntercept());
	    }
	
	    this.x = (y) => {
	      y ||= this.startVertex().y();
	      const slope = this.slope();
	      if (Math.abs(slope) === Infinity) return this.startVertex().x();
	      if (slope === 0) {
	        if (this.yIntercept() === 0) return 0;
	        else return Infinity;
	      }
	      return (y - this.yIntercept())/slope;
	    }
	
	    this.liesOn = (vertices) => {
	      const liesOn = [];
	      for (let index = 0; index < vertices.length; index += 1) {
	        const v = vertices[index];
	        const y = this.y(v.x());
	        if ((y === v.y() || Math.abs(y) === Infinity) && this.withinSegmentBounds(v)) {
	          liesOn.push(v);
	        }
	      }
	      liesOn.sort(Vertex2d.sort);
	      return liesOn;
	    }
	
	    this.measureTo = (verts) => {
	      if (Array.isArray(verts)) {
	        verts = this.liesOn(verts);
	        measureTo.concatInPlace(verts);
	      }
	      return measureTo;
	    }
	
	    this.maxDem = () => this.y() > this.x() ? this.y() : this.x();
	    this.minDem = () => this.y() < this.x() ? this.y() : this.x();
	
	    this.closestPointOnLine = (vertex, segment) => {
	      vertex = (vertex instanceof Vertex2d) ? vertex : new Vertex2d(vertex);
	      const perpLine = this.perpendicular(vertex);
	      const perpSlope = perpLine.slope();
	      const slope = this.slope();
	      let x, y;
	      if (!Number.isFinite(slope)) {
	        x = this.startVertex().x();
	        y = vertex.y();
	      } else if (!Number.isFinite(perpSlope)) {
	        x = vertex.x();
	        y = this.startVertex().y();
	      } else {
	        x = newX(slope, perpSlope, this.yIntercept(), perpLine.yIntercept());
	        y = this.y(x);
	      }
	      const closestPoint = new Vertex2d({x, y});
	      if (!segment || this.withinSegmentBounds(closestPoint)) return closestPoint;
	      return false;
	    }
	
	    this.inverseX = (y) => this.slope()*y + this.yIntercept();
	    this.inverseY = (x) => (x-this.yIntercept())/this.slope();
	    this.perpendicular = (vertex, distance) => {
	      vertex = new Vertex2d(vertex) || this.midpoint();
	      const posOffset = distance !== undefined ? distance/2 : 1000;
	      const negOffset = -1 * posOffset;
	      const slope = this.slope();
	      if (slope === 0) {
	        return new Line2d({x: vertex.x(), y: vertex.y() + posOffset}, {x: vertex.x(), y: vertex.y() + negOffset});
	      }
	      if (Math.abs(slope) === Infinity || Number.isNaN(slope)) {
	        return new Line2d({x: posOffset + vertex.x(), y: vertex.y()}, {x: negOffset + vertex.x(), y: vertex.y()});
	      }
	
	      const slopeInverse = -1/slope;
	      const b = getB(vertex.x(), vertex.y(), slopeInverse);
	      const startVertex = {x: getX(posOffset, slopeInverse, b), y: posOffset};
	      const endVertex = {x: getX(negOffset, slopeInverse, b), y: negOffset};
	      const line = new Line2d(startVertex, endVertex);
	      return line;
	    }
	    this.findIntersection = (line, segment) => {
	      const slope = this.slope();
	      const lineSlope = line.slope();
	      let x, y;
	      if (!Number.isFinite(slope)) {
	        x = this.startVertex().x();
	        y = line.y(x);
	      } else if (!Number.isFinite(lineSlope)) {
	        y = line.startVertex().y();
	        x = line.x(y);
	      } else {
	        x = newX(slope, lineSlope, this.yIntercept(), line.yIntercept());
	        y = this.y(x);
	      }
	      const intersection = {x,y};
	      if (segment !== true) return intersection;
	      if (this.withinSegmentBounds(intersection) && line.withinSegmentBounds(intersection)) {
	        return intersection;
	      }
	      return false;
	    }
	    this.minX = () => this.startVertex().x() < this.endVertex().x() ?
	                        this.startVertex().x() : this.endVertex().x();
	    this.minY = () => this.startVertex().y() < this.endVertex().y() ?
	                        this.startVertex().y() : this.endVertex().y();
	    this.maxX = () => this.startVertex().x() > this.endVertex().x() ?
	                        this.startVertex().x() : this.endVertex().x();
	    this.maxY = () => this.startVertex().y() > this.endVertex().y() ?
	                        this.startVertex().y() : this.endVertex().y();
	    this.angle = (value) => {
	      if (value) this.radians(value);
	      return Math.toDegrees(this.radians());
	    }
	    this.radians = () => {
	      const deltaX = this.endVertex().x() - this.startVertex().x();
	      const deltaY = this.endVertex().y() - this.startVertex().y();
	      return approximate(Math.atan2(deltaY, deltaX), 100);
	    }
	
	    this.clean = (other) => {
	      if (!(other instanceof Line2d)) return;
	      if (other.startVertex().equal(other.endVertex())) return this;
	      if (this.startVertex().equal(this.endVertex())) return other;
	      if (this.toString() === other.toString() || this.toString() === other.toNegitiveString()) return this;
	    }
	
	    this.combine = (other) => {
	      if (!(other instanceof Line2d)) return;
	      const clean = this.clean(other);
	      if (clean) return clean;
	      if (Math.abs(this.slope()) !== Math.abs(other.slope())) return;
	      const otherNeg = other.negitive();
	      const posEq = (this.y(other.x()) === other.y() && this.x(other.y()) === other.x());
	      const negEq = (this.y(otherNeg.x()) === otherNeg.y() && this.x(otherNeg.y()) === otherNeg.x());
	      if (!posEq && !negEq) return;
	      const v1 = this.startVertex();
	      const v2 = this.endVertex();
	      const ov1 = other.startVertex();
	      const ov2 = other.endVertex();
	      if (!this.withinSegmentBounds(ov1) && !this.withinSegmentBounds(ov2)) return;
	      const vs = [v1, v2, ov1, ov2].sort(Vertex2d.sort);
	      const combined = new Line2d(vs[0], vs[vs.length - 1]);
	      return combined;
	    }
	
	    this.move = (center) => {
	      const mouseLocation = new Vertex2d(center);
	      const perpLine = this.perpendicular(mouseLocation);
	      const interX = this.findIntersection(perpLine);
	      const diffLine = new Line2d(interX, mouseLocation);
	      const rads = diffLine.radians();
	      const xDiff = Math.cos(rads);
	      const yDiff = Math.sin(rads);
	      const sv = this.startVertex();
	      const newStart = {x: sv.x() + xDiff, y: sv.y() + yDiff};
	      const ev = this.endVertex();
	      const newEnd = {x: ev.x() + xDiff, y: ev.y() + yDiff};
	      this.startVertex().point().x = newStart.x;
	      this.startVertex().point().y = newStart.y;
	      this.endVertex().point().x = newEnd.x;
	      this.endVertex().point().y = newEnd.y;
	    };
	
	    this.negitive = () => new Line2d(this.endVertex(), this.startVertex());
	    this.toString = () => `${this.startVertex().toString()} => ${this.endVertex().toString()}`;
	    this.toNegitiveString = () => `${this.endVertex().toString()} => ${this.startVertex().toString()}`;
	  }
	}
	Line2d.reusable = true;
	Line2d.startAndTheta = (startvertex, theta) => {
	  const end = {x: dist * Math.cos(theta), y: dist*Math.sin(theta)};
	  return new Line(startVertex.point(), end);
	}
	Line2d.instance = (startV, endV, group) => {
	  const line = Lookup.instance(Line2d.name);
	  line.lookupGroup(group);
	  line.startVertex(new Vertex2d(startV)).lookupGroup(group);
	  line.endVertex(new Vertex2d(endV)).lookupGroup(group);
	  return line;
	}
	
	Line2d.trendLine = (...points) => {
	  const center = Vertex2d.center(...points);
	  let maxArr = [];
	  for (let index = 0; index < points.length; index += 1) {
	    const obj = {};
	    obj.point = new Vertex2d(points[index]);
	    obj.distance = obj.point.distance(center);
	    if (maxArr[0] === undefined || maxArr[0].distance < obj.distance) {
	      maxArr = [obj].concat(maxArr);
	    } else if (maxArr[1] === undefined || maxArr[1].distance < obj.distance) {
	      maxArr = [maxArr[0], obj].concat(maxArr);
	    }
	  }
	  const line = new Line2d(maxArr[0].point, maxArr[1].point);
	  console.log(`trendLine: ${points}\n\t${line}\n\t${center}` );
	  return line;
	}
	
	Line2d.vertices = (lines) => {
	  const verts = {};
	  for (let index = 0; index < lines.length; index += 1) {
	    const line = lines[index];
	    const sv = line.startVertex();
	    const ev = line.endVertex();
	    verts[sv.toString()] = sv;
	    verts[ev.toString()] = ev;
	  }
	  return Object.values(verts);
	}
	
	Line2d.consolidate = (...lines) => {
	  const lineMap = {};
	  for (let index = 0; index < lines.length; index += 1) {
	    const line = lines[index];
	    const slope = Math.abs(line.slope());
	    if (!Number.isNaN(slope)) {
	      if (lineMap[slope] === undefined) lineMap[slope] = [];
	      lineMap[slope].push(line);
	    }
	  }
	  const keys = Object.keys(lineMap);
	  let minList = [];
	  for (let lIndex = 0; lIndex < keys.length; lIndex += 1) {
	    const list = lineMap[keys[lIndex]];
	    for (let tIndex = 0; tIndex < list.length; tIndex += 1) {
	      let target = list[tIndex];
	      for (let index = 0; index < list.length; index += 1) {
	        if (index !== tIndex) {
	          const combined = target.combine(list[index]);
	          if (combined) {
	            const lowIndex = index < tIndex ? index : tIndex;
	            const highIndex = index > tIndex ? index : tIndex;
	            list.splice(highIndex, 1);
	            list[lowIndex] = combined;
	            target = combined;
	            tIndex--;
	            break;
	          }
	        }
	      }
	    }
	    minList = minList.concat(lineMap[keys[lIndex]]);
	  }
	
	  return minList;
	}
	
	new Line2d();
	
	module.exports = Line2d;
	
});


RequireJS.addFunction('./app-src/displays/managers/cost.js',
function (require, exports, module) {
	

	
	const CostTree = require('../../cost/cost-tree.js');
	const Assembly = require('../../objects/assembly/assembly.js');
	const du = require('../../../../../public/js/utils/dom-utils.js');
	const $t = require('../../../../../public/js/utils/$t.js');
	const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
	const Select = require('../../../../../public/js/utils/input/styles/select');
	const Input = require('../../../../../public/js/utils/input/input');
	const RelationInput = require('../../../../../public/js/utils/input/styles/select/relation');
	const Inputs = require('../../input/inputs.js');
	const RadioDisplay = require('../../display-utils/radio-display.js');
	
	class CostManager {
	  constructor(id, name) {
	    const costTree = new CostTree();
	    this.root = () => costTree.root();
	    this.update = () => {
	      const html = CostManager.mainTemplate.render(this);
	      du.find(`#${id}`).innerHTML = html;
	    }
	    this.nodeInputHtml = () => CostManager.nodeInput().payload().html();
	    this.headHtml = (node) =>
	        CostManager.headTemplate.render({node, CostManager: this});
	    this.bodyHtml = (node) =>
	        CostManager.bodyTemplate.render({node, CostManager: this});
	    this.loadPoint = () => console.log('load');
	    this.savePoint = () => console.log('save');
	    this.fromJson = () => {};
	    this.update();
	  }
	}
	
	CostManager.mainTemplate = new $t('managers/cost/main');
	CostManager.headTemplate = new $t('managers/cost/head');
	CostManager.bodyTemplate = new $t('managers/cost/body');
	CostManager.propertySelectTemplate = new $t('managers/cost/property-select');
	CostManager.costInputTree = (costTypes, objId, onUpdate) => {
	  const logicTree = new LogicTree();
	  return logicTree;
	}
	CostManager.nodeInput = () => {
	  const dit = new DecisionInputTree();
	  const typeSelect = new Select({
	    name: 'type',
	    list: CostTree.types,
	    value: CostTree.types[0]
	  });
	  const selectorType = new Select({
	    name: 'selectorType',
	    list: ['Manual', 'Auto'],
	    value: 'Manual'
	  });
	  const propertySelector = new Select({
	    name: 'propertySelector',
	    list: CostTree.propertyList,
	  });
	
	  const accVals = ['select', 'multiselect', 'conditional'];
	  const condtionalPayload = new DecisionInputTree.ValueCondition('type', accVals, [selectorType]);
	  const type = dit.branch('Node', [Inputs('name'), typeSelect]);
	  const selectType = type.conditional('selectorType', condtionalPayload);
	  const payload = [Inputs('formula'), propertySelector, RelationInput.selector];
	  const condtionalPayload2 = new DecisionInputTree.ValueCondition('selectorType', 'Auto', payload);
	  selectType.conditional('formula', condtionalPayload2);
	  return dit;
	}
	new RadioDisplay('cost-tree', 'radio-id');
	
	new CostManager('cost-manager', 'cost');
	
	function abbriviation(group) {
	  return Assembly.classes[group] ? Assembly.classes[group].abbriviation : 'nope';
	}
	const scope = {groups: CostTree.propertyList, abbriviation};
	// du.id('property-select-cnt').innerHTML =
	//       CostManager.propertySelectTemplate.render(scope);
	module.exports = CostManager
	
});


RequireJS.addFunction('./app-src/displays/information/utility-filter.js',
function (require, exports, module) {
	

	
	const Measurement = require('../../../../../public/js/utils/measurement.js');
	
	class UFObj {
	  constructor(order) {
	    class Row {
	      constructor(groupName, assembly, index) {
	        this.groupName = groupName;
	        this.type = assembly.constructor.name;
	        const dems = assembly.position().demension();
	        dems.y = new Measurement(dems.y).display();
	        dems.x = new Measurement(dems.x).display();
	        dems.z = new Measurement(dems.z).display();
	        this.size = `${dems.y} x ${dems.x} x ${dems.z}`;
	        this.quantity = 1;
	        this.cost = '$0';
	        this.notes = assembly.notes || '';
	      }
	    }
	    const cabinets = [];
	    const obj = [];
	    Object.values(order.rooms).forEach((room, rIndex) => room.groups.forEach((group, gIndex) => {
	      group.cabinets.forEach((cabinet, index) => {
	        const cabinetId = `${rIndex+1}-${gIndex+1}-${index+1}`;
	        cabinet.getParts().forEach((part) => {
	          const row = new Row(group.name(), part, cabinetId);
	          if (obj[row.size] === undefined) obj[row.size] = row;
	          else {
	            obj[row.size].quantity++;
	          }
	        });
	      });
	    }));
	    return Object.values(obj);
	  }
	}
	module.exports = UFObj
	
});


RequireJS.addFunction('./app-src/displays/managers/template.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../objects/assembly/assembly.js');
	const Input = require('../../../../../public/js/utils/input/input.js');
	const Select = require('../../../../../public/js/utils/input/styles/select.js');
	const MeasurementInput = require('../../../../../public/js/utils/input/styles/measurement.js');
	const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
	const Lookup = require('../../../../../public/js/utils/object/lookup.js');
	const Inputs = require('../../input/inputs.js');
	const CabinetTemplate = require('../../config/cabinet-template.js');
	const ExpandableList = require('../../../../../public/js/utils/lists/expandable-list.js');
	const $t = require('../../../../../public/js/utils/$t.js');
	const du = require('../../../../../public/js/utils/dom-utils.js');
	const RadioDisplay = require('../../display-utils/radio-display.js');
	const Bind = require('../../../../../public/js/utils/input/bind.js');
	const Joint = require('../../objects/joint/joint.js');
	const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
	const Measurement = require('../../../../../public/js/utils/measurement.js');
	const ThreeView = require('../three-view.js');
	const Layout2D = require('../../objects/layout.js');
	const Draw2D = require('../../two-d/draw.js');
	const cabinetBuildConfig = require('../../../public/json/cabinets.json');
	
	
	const threeView = new ThreeView();
	du.on.match('click', '#template-list-TemplateManager_template-manager', (elem) =>
	  du.move.inFront(elem));
	du.on.match('click', `#${threeView.id()}>.three-view-two-d-cnt>.three-view-canvases-cnt`, (elem) =>
	  du.move.inFront(elem));
	
	const containerClasses = {
	  values: `template-values`,
	  subassemblies: `template-subassemblies`,
	  joints: `template-joints`,
	  dividerJoint: `template-divider-joint`,
	  openings: `template-openings`
	};
	
	function resetHeaderErrors() {
	  const containers = du.find.all('.cabinet-template-input-cnt');
	  containers.forEach((cnt) => {
	    const headers = du.find.downAll('.expand-header', cnt);
	    headers.forEach((h) => du.class.remove(h, 'error'))
	  });
	}
	
	function setHeaderErrors(elem) {
	  const firstHeader = du.find.closest('.expand-header', elem);
	  const secondHeader = du.find.up('.cabinet-template-input-cnt', firstHeader).children[0];
	  du.class.add(firstHeader, 'error');
	  du.class.add(secondHeader, 'error');
	}
	
	function updateCss(elem, isValid, errorMsg) {
	  if (isValid) {
	    du.class.remove(elem, 'error');
	    elem.setAttribute('error-msg', '');
	  } else {
	    du.class.add(elem, 'error');
	    elem.setAttribute('error-msg', errorMsg);
	    setHeaderErrors(elem);
	  }
	}
	
	const varReg = /^[$_a-zA-Z][$_a-zA-Z0-9\.]*$/;
	const variableNameCheck = (elem) => updateCss(elem, elem.value.match(varReg), `Illegal characters: ${varReg}`);
	const positiveValueCheck = (elem) => updateCss(elem, Number.parseFloat(elem.value) > 0, 'Value must be positive');
	const partCodeCheck = (template) => (elem) => updateCss(elem, template.validPartCode(elem.value), 'Invalid Part Code');
	
	function openingCodeCheck(template, opening, input) {
	  let count = 0;
	  let errorString = '';
	  if (!template.validPartCode(opening.top)) {count++; (errorString += 'top,');}
	  if (!template.validPartCode(opening.bottom)) {count++; (errorString += 'bottom,');}
	  if (!template.validPartCode(opening.left)) {count++; (errorString += 'left,');}
	  if (!template.validPartCode(opening.right)) {count++; (errorString += 'right,');}
	  if (!template.validPartCode(opening.back)) {count++; (errorString += 'back,');}
	  if (count === 0) updateCss(input, true);
	  else {
	    errorString = errorString.substring(0, errorString.length - 1);
	    if (count === 1) updateCss(input, false, `'${errorString}' part code is invalid (CABINET WILL NOT RENDER)`);
	    else updateCss(input, false, `Multiple part codes are invalid: ${errorString} (CABINET WILL NOT RENDER)`);
	  }
	  return count === 0;
	}
	
	function openingsCodeCheck (template, inputs) {
	  const openings = template.openings();
	  let valid = true;
	  for (let index = 0; index < openings.length; index += 1) {
	    const opening = openings[index];
	    const input = inputs[index];
	    valid &&= openingCodeCheck(template, opening, input)
	  }
	  return valid;
	}
	
	function validateEquations(template, cabinet, valueInput, eqnInput, valueIndex, eqnMap) {
	  let errorString = '';
	  let errorCount = 0;
	  let eqnKeys = Object.keys(eqnMap);
	  for (let index = 0; index < eqnKeys.length; index += 1) {
	    const key = eqnKeys[index];
	    const eqn = eqnMap[key];
	    if (index === valueIndex) {
	      const value = template.evalEqn(eqn, cabinet);
	      if (Number.isNaN(value)) {
	        errorString += `${key},`;
	        errorCount++;
	      } else {
	        valueInput.value = new Measurement(value).display();
	      }
	    } else {
	      if (!template.validateEquation(eqn, cabinet)) {
	        errorString += `${key},`;
	        errorCount++;
	      }
	    }
	  }
	  if (errorCount > 0) {
	    du.class.add(eqnInput, 'error');
	    if (eqnKeys.length > 1) {
	      errorString = errorString.substring(0, errorString.length - 1);
	      updateCss(eqnInput, false, `Errors found within the following equations:${errorString}`);
	    } else {
	      updateCss(eqnInput, false, `Errors found within the equation.`)
	    }
	  } else {
	    du.class.remove(eqnInput, 'error');
	    updateCss(eqnInput, true);
	  }
	}
	
	const valueEqnCheck = (template, cabinet) => (eqnInput) => {
	  const valueInput = du.find.closest('[name="value"]', eqnInput);
	  const name = eqnInput.name;
	  const eqn = eqnInput.value;
	  const eqnMap = {};
	  eqnMap[name] = eqn;
	  validateEquations(template, cabinet, valueInput, eqnInput, 0, eqnMap);
	}
	
	const xyzEqnCheck = (template, cabinet) => (xyzInput) => {
	  const valueInput = du.find.closest('[name="value"]', xyzInput);
	  const index = Number.parseInt(du.find.closest('select', xyzInput).value);
	  const subAssem = ExpandableList.get(xyzInput);
	  const part = cabinet.getAssembly(subAssem.code);
	  const eqns = subAssem[xyzInput.name];
	  const eqnMap = {x: eqns[0], y: eqns[1], z: eqns[2]};
	  validateEquations(template, cabinet, valueInput, xyzInput, index, eqnMap);
	}
	
	function updatePartsDataList() {
	  const partMap = threeView.partMap();
	  if (!partMap) return;
	  const partKeys = Object.keys(partMap);
	  let html = '';
	  for (let index = 0; index < partKeys.length; index += 1) {
	    const key = partKeys[index];
	    const value = partMap[key];
	    html += `<option value='${key}'>${value}</option>`;
	  }
	
	  const datalist = du.id('part-list');
	  datalist.innerHTML = html;
	}
	
	function onPartSelect(elem) {
	  console.log(elem.value);
	  threeView.isolatePart(elem.value);
	  elem.value = '';
	}
	
	du.on.match('change', '.template-body>span>input[name="partSelector"]', onPartSelect);
	
	const topView = du.id('three-view-top');
	const leftView = du.id('three-view-left');
	const frongView = du.id('three-view-front');
	function validateOpenTemplate (elem) {
	  const templateBody = du.find('.template-body[template-id]');
	  if (!templateBody || du.is.hidden(templateBody)) return;
	  resetHeaderErrors();
	  const template = CabinetTemplate.get(templateBody.getAttribute('template-id'), templateBody);
	
	  const valueNameInputs = du.find.downAll('input[attr="values"][name="name"]', templateBody);
	  valueNameInputs.forEach(variableNameCheck);
	  const subNameInputs = du.find.downAll('input[attr="subassemblies"][name="name"]', templateBody);
	  subNameInputs.forEach(variableNameCheck);
	  const subCodeInputs = du.find.downAll('input[attr="subassemblies"][name="code"]', templateBody);
	  subCodeInputs.forEach(variableNameCheck);
	
	  const positiveInputs = du.find.downAll('input[name="thickness"],input[name="width"],input[name="height"]', templateBody);
	  positiveInputs.forEach(positiveValueCheck);
	
	  const pcc = partCodeCheck(template);
	  const jointMaleInputs = du.find.downAll('input[attr="joints"][name="malePartCode"]', templateBody);
	  jointMaleInputs.forEach(pcc);
	  const jointFemaleInputs = du.find.downAll('input[attr="joints"][name="femalePartCode"]', templateBody);
	  jointFemaleInputs.forEach(pcc);
	
	  const openingCodeInputs = du.find.downAll('input[attr="openings"][name="partCode"]', templateBody);
	  openingsCodeCheck(template, openingCodeInputs);
	
	  try {
	    const templateCnt = du.find(`.template-body[template-id='${template.id()}'`);
	    const height = new Measurement(templateBody.children[3].value, true).decimal();
	    const width = new Measurement(templateBody.children[2].value, true).decimal();
	    const thickness = new Measurement(templateBody.children[4].value, true).decimal();
	    const cabinet = template.getCabinet(height, width, thickness);
	
	    const depthInputs = du.find.downAll('[name=depth]', templateBody);
	    depthInputs.forEach(valueEqnCheck(template, cabinet));
	    const valueEqnInputs = du.find.downAll('input[attr="values"][name="eqn"]', templateBody);
	    valueEqnInputs.forEach(valueEqnCheck(template, cabinet));
	    const subDemInputs = du.find.downAll('input[attr="subassemblies"][name="demensions"]', templateBody);
	    subDemInputs.forEach(xyzEqnCheck(template, cabinet));
	    const subCenterInputs = du.find.downAll('input[attr="subassemblies"][name="center"]', templateBody);
	    subCenterInputs.forEach(xyzEqnCheck(template, cabinet));
	    const subRotInputs = du.find.downAll('input[attr="subassemblies"][name="rotation"]', templateBody);
	    subRotInputs.forEach(xyzEqnCheck(template, cabinet));
	    threeView.update(cabinet);
	    setTimeout(updatePartsDataList, 500);
	  } catch (e) {
	    console.log(e);
	  }
	
	
	}
	
	function getEqn(select, values) {
	  return values && values[select.value()];
	}
	
	const depthValidation = (measurment) =>
	        measurment.decimal() > 0;
	
	function getJointInputTree(func, joint, dividerJoint) {
	  joint.type ||= 'Butt';
	  const selectType = new Select({
	    name: 'type',
	    list: Object.keys(Joint.types),
	    class: 'template-select',
	    value: joint.type
	  });
	
	  const centerOffsetInput = new Select({
	    name: 'centerAxis',
	    list: ['+x', '+y', '+z', '-x', '-y', '-z'],
	    value: joint.centerAxis
	  });
	  const demensionOffsetInput = new Select({
	    name: 'demensionAxis',
	    list: ['x', 'y', 'z'],
	    value: joint.demensionAxis
	  });
	
	  const depthInput = new Input({
	    name: 'maleOffset',
	    value: joint.maleOffset
	  });
	
	  const dadoInputs = dividerJoint ? [depthInput] : [depthInput, centerOffsetInput, demensionOffsetInput];
	
	  const dit = new DecisionInputTree(undefined, {noSubmission: true});
	  const type = dit.branch('Type', [selectType]);
	  const condtionalPayload = new DecisionInputTree.ValueCondition('type', 'Dado', dadoInputs);
	  type.conditional('dado', condtionalPayload);
	  dit.onChange(func);
	  return dit;
	}
	
	let lastDepth;
	const jointOnChange = (vals, dit) => {
	  const selectId = dit.payload().inputArray[0].id();
	  const joint = ExpandableList.get(du.id(selectId));
	  joint.type = vals.type;
	  lastDepth = vals.maleOffset || lastDepth;
	  joint.maleOffset = lastDepth || undefined;
	  const depthInput = dit.children()[0].payload().inputArray[0];
	  // depthInput.updateDisplay();
	  joint.demensionAxis = vals.demensionAxis || undefined;
	  joint.centerAxis = vals.centerAxis || undefined;
	  console.log(vals);
	}
	
	function getTypeInput(obj) {
	  return new Select({
	    name: 'type',
	    value: obj.type,
	    class: 'template-input',
	    list: Object.keys(Assembly.components),
	    inline: true
	  });
	}
	
	function getXyzSelect(label) {
	  return new Select({
	    label,
	    name: 'xyz',
	    list: {'0': 'X', '1': 'Y', '2':'Z'},
	    inline: true
	  });
	}
	
	function getOpeningLocationSelect() {
	  return new Select({
	    name: 'openingLocation',
	    list: ['top', 'bottom', 'left', 'right', 'back'],
	    inline: true
	  });
	}
	
	function getJoint(obj) {
	  return {obj, jointInput: getJointInputTree(jointOnChange, obj).payload()};
	}
	function getSubassembly(obj) {
	  return {typeInput:  getTypeInput(obj),
	          centerXyzSelect: getXyzSelect('Center'),
	          demensionXyzSelect: getXyzSelect('Demension'),
	          rotationXyzSelect: getXyzSelect('Rotation'),
	          getEqn, obj
	        };
	}
	
	function getOpening(obj) {
	  return {obj, select: getOpeningLocationSelect()};
	}
	
	const scopes = {};
	function getScope(type, obj) {
	  obj.id = obj.id || String.random();
	  if (scopes[obj.id]) return scopes[obj.id];
	  switch (type) {
	    case 'joints':
	      scopes[obj.id] = getJoint(obj);
	      break;
	    case 'subassemblies':
	      scopes[obj.id] = getSubassembly(obj);
	      break;
	    case 'openings':
	      scopes[obj.id] = getOpening(obj);
	      break;
	    default:
	      scopes[obj.id] = {obj};
	  }
	  return scopes[obj.id];
	}
	
	const getObjects = {
	    subassemblies: () => (      {
	      "type": "Panel",
	      "center": [0,0,0],
	      "demensions": [1,1,1],
	      "rotation": [0,0,0]
	    })
	}
	
	function updateTemplateDisplay() {
	  const managerElems = du.find.all('[template-manager]');
	  for (let index = 0; index < managerElems.length; index += 1) {
	    const templateManagerId = managerElems[index].getAttribute('template-manager');
	    const templateManager =TemplateManager.get(templateManagerId);
	    templateManager.update();
	  }
	}
	
	
	function addExpandable(template, type) {
	  const containerClass = containerClasses[type];
	  let parentSelector = `[template-id='${template.id()}']>.${containerClass}`;
	  console.log(parentSelector);
	  TemplateManager.headTemplate[type] ||= new $t(`managers/template/${type.toKebab()}/head`);
	  TemplateManager.bodyTemplate[type] = TemplateManager.bodyTemplate[type] === undefined ?
	                    new $t(`managers/template/${type.toKebab()}/body`) : TemplateManager.bodyTemplate[type];
	  let getHeader = (obj) => TemplateManager.headTemplate[type].render(getScope(type, obj));
	  let getBody = TemplateManager.bodyTemplate[type] ? ((obj) => TemplateManager.bodyTemplate[type].render(getScope(type, obj))) : undefined;
	  const expListProps = {
	    idAttribute: 'name',
	    list: template[type](),
	    getObject: getObjects[type],
	    renderBodyOnOpen: false,
	    parentSelector, getHeader, getBody,
	    listElemLable: type.toSentance(),
	  };
	  const expandList = new ExpandableList(expListProps);
	  expandList.afterRemoval(updateTemplateDisplay);
	  return expandList;
	}
	
	class TemplateManager extends Lookup {
	  constructor(id) {
	    super(id);
	    const parentId = `template-list-${this.id()}`;
	    this.parentId = () => parentId;
	    let currentTemplate;
	    const parentSelector = `#${parentId}`;
	    const dividerJointChange = (template) => (vals) => {
	      template.dividerJoint(vals);
	    }
	    const dividerJointInput = (template) =>
	      getJointInputTree(dividerJointChange(template), template.dividerJoint(), true).payload();
	
	    const containerSelector = (template, containerClass) => `[template-id="${template.id()}"]>.${containerClass}`;
	
	    const getHeader = (template) =>
	      TemplateManager.headTemplate.render({template, TemplateManager: this});
	    const getBody = (template) => {
	      currentTemplate = template;
	      setTimeout(() => {
	        updateExpandables(template);
	      }, 100);
	      setTimeout(() => {
	        validateOpenTemplate(du.id(parentId));
	      }, 1000);
	      return TemplateManager.bodyTemplate.render({template, TemplateManager: this,
	        containerClasses, dividerJointInput: dividerJointInput(template)});
	      }
	
	    const expandables = {};
	    function initTemplate(template) {
	      const list = [];
	      expandables[template.id()] = list;
	      return () => {
	        list.push(addExpandable(template, 'values'));
	        list.push(addExpandable(template, 'subassemblies'));
	        list.push(addExpandable(template, 'joints'));
	        list.push(addExpandable(template, 'openings', true));
	      };
	    }
	
	    function updateExpandables(template) {
	      template ||= currentTemplate;
	      if (template === undefined) return;
	      if (!expandables[template.id()]) initTemplate(template)();
	      expandables[template.id()].forEach((e) => e.refresh());
	    }
	    this.updateExpandables = updateExpandables;
	
	    const getObject = (values) => {
	      const cabTemp = new CabinetTemplate(values.name);
	      initTemplate(cabTemp)();
	      return cabTemp;
	    }
	
	    this.active = () => expandList.active();
	    const expListProps = {
	      list: CabinetTemplate.defaultList(),
	      inputTree: TemplateManager.inputTree(),
	      parentSelector, getHeader, getBody, getObject,
	      listElemLable: 'Template',
	      type: 'sidebar'
	    };
	    setTimeout(initTemplate(expListProps.list[0]), 200);
	    const expandList = new ExpandableList(expListProps);
	
	    this.update = () => {
	      expandList.refresh();
	    }
	    this.loadPoint = () => console.log('load');
	    this.savePoint = () => console.log('save');
	    this.fromJson = () => {};
	    const html = TemplateManager.mainTemplate.render(this);
	    du.find(`#${id}`).innerHTML = html;
	  }
	}
	
	new RadioDisplay('cabinet-template-input-cnt', 'template-id');
	
	TemplateManager.inputTree = () => {
	  const dit = new DecisionInputTree();
	  dit.leaf('Template Name', [Inputs('name')]);
	  return dit;
	}
	
	TemplateManager.mainTemplate = new $t('managers/template/main');
	TemplateManager.headTemplate = new $t('managers/template/head');
	TemplateManager.bodyTemplate = new $t('managers/template/body');
	TemplateManager.bodyTemplate.values = false;
	TemplateManager.bodyTemplate.openings = false;
	new TemplateManager('template-manager', 'template');
	
	function updateValuesTemplate(elem, template) {
	  const nameInput = du.find.closest('[name="name"]', elem);
	  const name = nameInput.value;
	  const eqn = du.find.closest('[name="eqn"]', elem).value;
	  const valueObj = ExpandableList.get(elem);
	  valueObj.key = name;
	  valueObj.eqn = eqn;
	  return true
	}
	
	function updateSubassembliesTemplate(elem, template) {
	  const nameInput = du.find.closest('[name="name"]', elem);
	  const type = du.find.closest('[name="type"]', elem).value;
	  const name = `${type}.${nameInput.value.toDot()}`;
	  const subAssem = ExpandableList.get(elem);
	  subAssem.name = nameInput.value;
	  if (elem.name === 'name') return;
	  if (elem.name === 'center' || elem.name === 'demensions' || elem.name === 'rotation') {
	    const index = du.find.closest('[name="xyz"]', elem).value;
	    const eqn = elem.value;
	    if (subAssem[elem.name] === undefined) subAssem[elem.name] = [];
	    subAssem[elem.name][index] = eqn;
	  } else if (elem.name !== 'name') {
	    subAssem[elem.name] = elem.value;
	  }
	}
	
	function switchEqn(elem) {
	  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
	  const template = CabinetTemplate.get(templateId);
	  const nameInput = du.find.closest('[name="name"]', elem);
	  const type = du.find.closest('[name="type"]', elem).value;
	  const name = `${type}.${nameInput.value.toDot()}`;
	  const subAssem = ExpandableList.get(elem);
	  if (subAssem) {
	    const eqnInput = du.find.closest('input', elem);
	    const index = elem.value;
	    if (subAssem[eqnInput.name] === undefined) subAssem[eqnInput.name] = [];
	    const value = subAssem[eqnInput.name][index];
	    eqnInput.value = value === undefined ? '' : value;
	  }
	}
	
	function updateOpeningsTemplate(elem, template) {
	  const partCode = elem.value;
	  const attr = du.find.closest('select', elem).value;
	  const listElem = ExpandableList.get(elem);
	  listElem[attr] = elem.value;
	  console.log(ExpandableList.get(elem,1).toJson());
	}
	
	function updateJointPartCode(elem) {
	  const attr = elem.name;
	  const listElem = ExpandableList.get(elem);
	  listElem[attr] = elem.value;
	}
	
	function updateOpeningPartCode(elem) {
	  const attr = elem.value;
	  const listElem = ExpandableList.get(elem);
	  const partCodeInput = du.find.closest('input', elem);
	  partCodeInput.value = listElem[attr] || '';
	}
	
	function updateTemplate(elem, template) {
	  const attr = du.find.closest('[attr]', elem).getAttribute('attr');
	  switch (attr) {
	    case 'values': return updateValuesTemplate(elem, template);
	    case 'subassemblies': return updateSubassembliesTemplate(elem, template);
	    case 'openings': return updateOpeningsTemplate(elem, template);
	
	    default:
	
	  }
	}
	
	du.on.match('change', '.opening-part-code-input', updateOpeningsTemplate);
	du.on.match('change', '[name="xyz"]', switchEqn);
	du.on.match('change', '[name="openingLocation"]', updateOpeningPartCode);
	du.on.match('change', '.template-input[name="malePartCode"],.template-input[name="femalePartCode"]', updateJointPartCode);
	du.on.match('click', '.copy-template', (elem) => {
	  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
	  const template = CabinetTemplate.get(templateId);
	  let jsonStr = JSON.stringify(template.toJson(), null, 2);
	  jsonStr = jsonStr.replace(/.*"id":.*/g, '');
	  du.copy(jsonStr);
	});
	
	du.on.match('click', '.paste-template', (elem) => {
	  navigator.clipboard.readText()
	  .then(text => {
	    try {
	      const obj = Object.fromJson(JSON.parse(text));
	      if (!(obj instanceof CabinetTemplate)) throw new Error(`Json is of type ${obj.constructor.name}`);
	      const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
	      const template = CabinetTemplate.get(templateId);
	      template.fromJson(obj.toJson());
	      const templateManagerId = du.find.up('[template-manager]', elem).getAttribute('template-manager');
	      const templateManager =TemplateManager.get(templateManagerId);
	      templateManager.update();
	    } catch (e) {
	      alert('clipboard does not contain a valid CabinetTemplate');
	    }
	  })
	  .catch(err => {
	    console.error('Failed to read clipboard contents: ', err);
	  });
	});
	
	du.on.match('change', '.template-input', function (elem) {
	  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
	  const template = CabinetTemplate.get(templateId);
	  updateTemplate(elem, template);
	});
	
	du.on.match('change', 'input,select',   () => setTimeout(validateOpenTemplate, 0));
	
	
	module.exports = TemplateManager
	
});


RequireJS.addFunction('./app-src/two-d/objects/square.js',
function (require, exports, module) {
	
const Vertex2d = require('vertex');
	const approximate = require('../../../../../public/js/utils/approximate.js');
	
	class Square2d {
	  constructor(center, height, width, radians) {
	    center = new Vertex2d(center);
	    width = width === undefined ? 121.92 : width;
	    height = height === undefined ? 60.96 : height;
	    radians = radians === undefined ? 0 : radians;
	    const instance = this;
	    Object.getSet(this, {center, height, width, radians});
	    const startPoint = new Vertex2d(null);
	
	    const getterHeight = this.height;
	    this.height = (v) => {
	      notify(getterHeight(), v);
	      return getterHeight(v);
	    }
	    const getterWidth = this.width;
	    this.width = (v) => notify(getterWidth(), v) || getterWidth(v);
	
	    const changeFuncs = [];
	    this.onChange = (func) => {
	      if ((typeof func) === 'function') {
	        changeFuncs.push(func);
	      }
	    }
	
	    let lastNotificationId = 0;
	    function notify(currentValue, newValue) {
	      if (changeFuncs.length === 0 || (typeof newValue) !== 'number') return;
	      if (newValue !== currentValue) {
	        const id = ++lastNotificationId;
	        setTimeout(() => {
	          if (id === lastNotificationId)
	            for (let i = 0; i < changeFuncs.length; i++) changeFuncs[i](instance);
	        }, 100);
	      }
	    }
	
	    this.radians = (newValue) => {
	      if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
	        notify(radians, newValue);
	        radians = approximate(newValue);
	      }
	      return radians;
	    };
	    this.startPoint = () => {
	      startPoint.point({x: center.x() - width / 2, y: center.y() - height / 2});
	      return startPoint;
	    }
	    this.angle = (value) => {
	      if (value !== undefined) this.radians(Math.toRadians(value));
	      return Math.toDegrees(this.radians());
	    }
	
	    this.x = (val) => notify(this.center().x(), val) || this.center().x(val);
	    this.y = (val) => notify(this.center().y(), val) || this.center().y(val);
	    this.minDem = () => this.width() > this.height() ? this.width() : this.height();
	    this.maxDem = () => this.width() > this.height() ? this.width() : this.height();
	
	    this.shorterSideLength = () => this.height() < this.width() ? this.height() : this.width();
	    this.move = (position, theta) => {
	      const center = position.center instanceof Vertex2d ? position.center.point() : position.center;
	      if (position.maxX !== undefined) center.x = position.maxX - this.offsetX();
	      if (position.maxY !== undefined) center.y = position.maxY - this.offsetY();
	      if (position.minX !== undefined) center.x = position.minX + this.offsetX();
	      if (position.minY !== undefined) center.y = position.minY + this.offsetY();
	      this.radians(position.theta);
	      this.x(center.x);
	      this.y(center.y);
	      this.center().point(center);
	      return true;
	    };
	
	    function centerMethod(widthMultiplier, heightMultiplier, position) {
	      const center = instance.center();
	      const rads = instance.radians();
	      const offsetX = instance.width() * widthMultiplier * Math.cos(rads) -
	                        instance.height() * heightMultiplier * Math.sin(rads);
	      const offsetY = instance.height() * heightMultiplier * Math.cos(rads) +
	                        instance.width() * widthMultiplier * Math.sin(rads);
	
	      if (position !== undefined) {
	        const posCenter = new Vertex2d(position.center);
	        return new Vertex2d({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
	      }
	      const backLeftLocation = {x: center.x() - offsetX , y: center.y() - offsetY};
	      return new Vertex2d(backLeftLocation);
	    }
	
	
	    this.frontCenter = (position) => centerMethod(0, -.5, position);
	    this.backCenter = (position) => centerMethod(0, .5, position);
	    this.leftCenter = (position) => centerMethod(.5, 0, position);
	    this.rightCenter = (position) => centerMethod(-.5, 0, position);
	
	    this.backLeft = (position) => centerMethod(.5, .5, position);
	    this.backRight = (position) => centerMethod(-.5, .5, position);
	    this.frontLeft = (position) =>  centerMethod(.5, -.5, position);
	    this.frontRight = (position) => centerMethod(-.5, -.5, position);
	
	    this.offsetX = (negitive) => negitive ? this.width() / -2 : this.width() / 2;
	    this.offsetY = (negitive) => negitive ? this.height() / -2 : this.height() / 2;
	
	    this.toString = () => `[${this.frontLeft()} - ${this.frontRight()}]\n[${this.backLeft()} - ${this.backRight()}]`
	  }
	}
	
	new Square2d();
	
	module.exports = Square2d;
	
});


RequireJS.addFunction('./app-src/two-d/objects/vertex.js',
function (require, exports, module) {
	
const approximate = require('../../../../../public/js/utils/approximate.js');
	
	class Vertex2d {
	  constructor(point) {
	    if (Array.isArray(point)) point = {x: point[0], y: point[1]};
	    if (point instanceof Vertex2d) return point;
	    let modificationFunction;
	    point = point || {x:0,y:0};
	    Object.getSet(this, {point});
	    this.layer = point.layer;
	    const instance = this;
	    this.move = (center) => {
	      this.point(center);
	      return true;
	    };
	    this.point = (newPoint) => {
	      if (newPoint) this.x(newPoint.x);
	      if (newPoint) this.y(newPoint.y);
	      return point;
	    }
	
	    this.modificationFunction = (func) => {
	      if ((typeof func) === 'function') {
	        if ((typeof this.id) !== 'function') Lookup.convert(this);
	        modificationFunction = func;
	      }
	      return modificationFunction;
	    }
	
	    this.equal = (other) => approximate.eq(other.x(), this.x()) && approximate.eq(other.y(), this.y());
	    this.x = (val) => {
	      if ((typeof val) === 'number') point.x = approximate(val);
	      return this.point().x;
	    }
	    this.y = (val) => {
	      if ((typeof val) === 'number') this.point().y = approximate(val);
	      return this.point().y;
	    }
	
	    const dummyFunc = () => true;
	    this.forEach = (func, backward) => {
	      let currVert = this;
	      let lastVert;
	      do {
	        lastVert = currVert;
	        func(currVert);
	        currVert = backward ? currVert.prevVertex() : currVert.nextVertex();
	      } while (currVert && currVert !== this);
	      return currVert || lastVert;
	    }
	
	    this.distance = (vertex) => {
	      vertex = (vertex instanceof Vertex2d) ? vertex : new Vertex2d(vertex);
	      const xDiff = vertex.x() - this.x();
	      const yDiff = vertex.y() - this.y();
	      return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
	    }
	
	    this.toString = () => `(${this.x()}, ${this.y()})`;
	    const parentToJson = this.toJson;
	
	    this.offset = (x, y) => {
	      const copy = this.toJson();
	      if (y !== undefined) copy.y += y;
	      if (x !== undefined) copy.x += x;
	      return new Vertex2d(copy);
	    }
	
	    this.point(point);
	  }
	}
	
	Vertex2d.fromJson = (json) => {
	  return new Vertex2d(json.point);
	}
	
	Vertex2d.center = (...verticies) => {
	  let x = 0;
	  let y = 0;
	  let count = 0;
	  verticies.forEach((vertex) => {
	    if (Number.isFinite(vertex.x() + vertex.y())) {
	      count++;
	      x += vertex.x();
	      y += vertex.y();
	    }
	  });
	  return new Vertex2d({x: x/count, y: y/count});
	}
	
	Vertex2d.sort = (a, b) =>
	    a.x() === b.x() ? (a.y() === b.y() ? 0 : (a.y() > b.y() ? -1 : 1)) : (a.x() > b.x() ? -1 : 1);
	
	Vertex2d.reusable = true;
	new Vertex2d();
	
	module.exports = Vertex2d;
	
});


RequireJS.addFunction('./app-src/cost/types/labor.js',
function (require, exports, module) {
	

	
	const Material = require('./material.js');
	const Cost = require('../cost.js');
	
	
	// unitCost.value = (hourlyRate*hours)/length
	// calc(assembly) = unitCost.value * formula
	
	class Labor extends Material {
	  constructor (props) {
	    super(props);
	    const type = props.laborType;
	    props.hourlyRate = Labor.hourlyRates[type]
	    const parentCalc = this.calc;
	    this.cost = () => this.hourlyRate() * props.hours;
	    if (Labor.hourlyRates[type] === undefined) Labor.types.push(type);
	    Labor.hourlyRate(type, props.hourlyRate);
	
	    const parentToJson = this.toJson;
	  }
	}
	
	
	Labor.defaultRate = 40;
	Labor.hourlyRate = (type, rate) => {
	  rate = Cost.evaluator.eval(new String(rate));
	  if (!Number.isNaN(rate)) Labor.hourlyRates[type] = rate;
	  return Labor.hourlyRates[type] || Labor.defaultRate;
	}
	Labor.hourlyRates = {};
	Labor.types = [];
	Labor.explanation = `Cost to be calculated hourly`;
	
	module.exports = Labor
	
});


RequireJS.addFunction('./app-src/two-d/objects/snap.js',
function (require, exports, module) {
	
const Vertex2d = require('vertex');
	const SnapLocation2d = require('snap-location');
	
	class Snap2d {
	  constructor(parent, object, tolerance) {
	    name = 'booyacka';
	    Object.getSet(this, {object, tolerance}, 'layoutId');
	    if (parent === undefined) return;
	    const instance = this;
	    const id = String.random();
	    let start = new Vertex2d();
	    let end = new Vertex2d();
	    let layout = parent.layout();
	
	    this.toString = () => `SNAP (${tolerance}):${object}`
	    this.id = () => id;
	    this.parent = () => parent;
	    this.radians = object.radians;
	    this.angle = object.angle;
	    this.x = object.x;
	    this.y = object.y;
	    this.height = object.height;
	    this.width = object.width;
	    this.onChange = object.onChange;
	
	    const backLeft = new SnapLocation2d(this, "backLeft",  new Vertex2d(null),  'backRight', 'red');
	    const backRight = new SnapLocation2d(this, "backRight",  new Vertex2d(null),  'backLeft', 'purple');
	    const frontRight = new SnapLocation2d(this, "frontRight",  new Vertex2d(null),  'frontLeft', 'black');
	    const frontLeft = new SnapLocation2d(this, "frontLeft",  new Vertex2d(null),  'frontRight', 'green');
	
	    const backCenter = new SnapLocation2d(this, "backCenter",  new Vertex2d(null),  'backCenter', 'teal');
	    const leftCenter = new SnapLocation2d(this, "leftCenter",  new Vertex2d(null),  'rightCenter', 'pink');
	    const rightCenter = new SnapLocation2d(this, "rightCenter",  new Vertex2d(null),  'leftCenter', 'yellow');
	
	    const snapLocations = [backCenter,leftCenter,rightCenter,backLeft,backRight,frontLeft,frontRight];
	    function getSnapLocations(paired) {
	      if (paired === undefined) return snapLocations;
	      const locs = [];
	      for (let index = 0; index < snapLocations.length; index += 1) {
	        const loc = snapLocations[index];
	        if (paired) {
	          if (loc.pairedWith() !== null) locs.push(loc);
	        } else if (loc.pairedWith() === null) locs.push(loc);
	      }
	      return locs;
	    }
	
	    this.snapLocations = getSnapLocations;
	    this.snapLocations.notPaired = () => getSnapLocations(false);
	    this.snapLocations.paired = () => getSnapLocations(true);
	    this.snapLocations.rotate = backCenter.rotate;
	    function resetVertices() {
	      for (let index = 0; index < snapLocations.length; index += 1) {
	        const snapLoc = snapLocations[index];
	        instance[snapLoc.location()]();
	      }
	    }
	
	    function centerMethod(snapLoc, widthMultiplier, heightMultiplier, position) {
	      const vertex = snapLoc.vertex();
	      // if (position === undefined && vertex.point() !== null) return vertex;
	      const center = object.center();
	      const rads = object.radians();
	      const offsetX = object.width() * widthMultiplier * Math.cos(rads) -
	                        object.height() * heightMultiplier * Math.sin(rads);
	      const offsetY = object.height() * heightMultiplier * Math.cos(rads) +
	                        object.width() * widthMultiplier * Math.sin(rads);
	
	      if (position !== undefined) {
	        const posCenter = new Vertex2d(position.center);
	        return new Vertex2d({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
	      }
	      const backLeftLocation = {x: center.x() - offsetX , y: center.y() - offsetY};
	      vertex.point(backLeftLocation);
	      return snapLoc;
	    }
	
	    this.frontCenter = (position) => centerMethod(frontCenter, 0, -.5, position);
	    this.backCenter = (position) => centerMethod(backCenter, 0, .5, position);
	    this.leftCenter = (position) => centerMethod(leftCenter, .5, 0, position);
	    this.rightCenter = (position) => centerMethod(rightCenter, -.5, 0, position);
	
	    this.backLeft = (position) => centerMethod(backLeft, .5, .5, position);
	    this.backRight = (position) => centerMethod(backRight, -.5, .5, position);
	    this.frontLeft = (position) =>  centerMethod(frontLeft, .5, -.5, position);
	    this.frontRight = (position) => centerMethod(frontRight, -.5, -.5, position);
	
	    function calculateMaxAndMin(closestVertex, furthestVertex, wall, position, axis) {
	      const maxAttr = `max${axis.toUpperCase()}`;
	      const minAttr = `min${axis.toUpperCase()}`;
	      if (closestVertex[axis]() === furthestVertex[axis]()) {
	        const perpLine = wall.perpendicular(undefined, 10);
	        const externalVertex = !layout.within(perpLine.startVertex()) ?
	                perpLine.endVertex() : perpLine.startVertex();
	        if (externalVertex[axis]() < closestVertex[axis]()) position[maxAttr] = closestVertex[axis]();
	        else position[minAttr] = closestVertex[axis]();
	      } else if (closestVertex[axis]() < furthestVertex[axis]()) position[minAttr] = closestVertex[axis]();
	      else position[maxAttr] = closestVertex[axis]();
	    }
	
	    function findWallSnapLocation(center) {
	      const centerWithin = layout.within(center);
	      let wallObj;
	      layout.walls().forEach((wall) => {
	        const point = wall.closestPointOnLine(center, true);
	        if (point) {
	          const wallDist = point.distance(center);
	          const isCloser = (!centerWithin || wallDist < tolerance) &&
	                          (wallObj === undefined || wallObj.distance > wallDist);
	          if (isCloser) {
	            wallObj = {point, distance: wallDist, wall};
	          }
	        }
	      });
	      if (wallObj) {
	        const wall = wallObj.wall;
	        const point = wallObj.point;
	        center = point;
	        const theta = wall.radians();
	        let position = {center, theta};
	
	        const backCenter = instance.backCenter({center, theta});
	        const backLeftCenter = instance.backLeft({center: wall.startVertex(), theta});
	        if (backCenter.distance(backLeftCenter) < object.maxDem() / 2) return object.move({center: backLeftCenter, theta});
	        const backRightCenter = instance.backRight({center: wall.endVertex(), theta})
	        if (backCenter.distance(backRightCenter) < object.maxDem() / 2) return object.move({center: backRightCenter,theta});
	
	        return {center: backCenter, theta};
	      }
	    }
	
	    function findObjectSnapLocation (center) {
	      let snapObj;
	      SnapLocation2d.active().forEach((snapLoc) => {
	        const targetSnapLoc = instance[snapLoc.targetVertex()]();
	        if (snapLoc.isConnected(instance) ||
	            snapLoc.pairedWith() !== null || targetSnapLoc.pairedWith() !== null) return;
	        const vertDist = snapLoc.vertex().distance(center);
	        const vertCloser = (snapObj === undefined && vertDist < tolerance) ||
	        (snapObj !== undefined && snapObj.distance > vertDist);
	        if (vertCloser) snapObj = {snapLoc: snapLoc, distance: vertDist, targetSnapLoc};
	      });
	      if (snapObj) {
	        const snapLoc = snapObj.snapLoc;
	        let theta = snapLoc.parent().radians();
	        const center = snapLoc.vertex();
	        const funcName = snapLoc.targetVertex();
	        if (funcName === 'backCenter') theta = (theta + Math.PI) % (2 * Math.PI);
	        lastPotentalPair = [snapLoc, snapObj.targetSnapLoc];
	        return {snapLoc, center: instance[funcName]({center, theta}), theta};
	      }
	    }
	
	    let lastPotentalPair;
	    this.setLastPotentialPair = (lpp) => lastPotentalPair = lpp;
	    function checkPotentialPair() {
	      if (!lastPotentalPair) return;
	      const snap1 = lastPotentalPair[0];
	      const snap2 = lastPotentalPair[1];
	      snap1.eval();
	      snap2.eval();
	      if (!snap1.vertex().equal(snap2.vertex())) lastPotentalPair = null;
	      return true;
	    }
	
	    this.potentalSnapLocation = () => checkPotentialPair() && lastPotentalPair && lastPotentalPair[0];
	    this.pairWithLast = () => {
	      lastPotentalPair && lastPotentalPair[0].pairWith(lastPotentalPair[1])
	      lastPotentalPair = null;
	    };
	    this.move = (center) => {
	      checkPotentialPair();
	      const pairedSnapLocs = this.snapLocations.paired();
	      resetVertices();
	      if (pairedSnapLocs.length > 0) {
	        const snapInfo = findObjectSnapLocation(center);
	        if (snapInfo) {
	          const obj = snapInfo.snapLoc.parent();
	          if (snapInfo.theta !== undefined) {
	            const theta = approximate(((snapInfo.theta + 2 * Math.PI) - this.object().radians()) % (2*Math.PI));
	            snapInfo.theta = undefined;
	            this.snapLocations.rotate(theta);
	          }
	          const snapLoc = snapInfo.snapLoc;
	          const targetVertex = snapLoc.targetVertex();
	          const targetSnapLoc = this[targetVertex]();
	          lastPotentalPair = [targetSnapLoc, snapLoc];
	          const vertexCenter = snapLoc.parent()[snapLoc.location()]().vertex();
	          return targetSnapLoc.move(vertexCenter);
	        }
	        const snapLoc = pairedSnapLocs[0];
	        return snapLoc.move(center);
	      }
	      const centerWithin = layout.within(center);
	      let closest = {};
	      const snapLocation = findObjectSnapLocation(center);
	      const wallSnapLocation = findWallSnapLocation(center);
	      if (snapLocation) {
	        return object.move(snapLocation);
	      } else if (!centerWithin && (wallSnapLocation instanceof Object)) {
	        return object.move(wallSnapLocation);
	      } else if (centerWithin) {
	        return object.move({center});
	      }
	    };
	  }
	}
	
	Snap2d.fromJson = (json) => {
	  const layout = Layout2d.get(json.layoutId);
	  const object = Object.fromJson(json.object);
	  const snapObj = new Snap2d(layout, object, json.tolerance);
	  snapObj.id(json.id);
	  return snapObj;
	}
	
	new Snap2d();
	
	module.exports = Snap2d;
	
});


RequireJS.addFunction('./app-src/cost/types/material.js',
function (require, exports, module) {
	

	
	const Cost = require('../cost.js');
	const Assembly = require('../../objects/assembly/assembly.js');
	
	class Material extends Cost {
	  constructor (props) {
	    super(props);
	    props = this.props();
	    props.cost = props.cost / (props.count || 1);
	    const instance = this;
	    Object.getSet(props, 'company', 'formula', 'partNumber',
	                'method', 'length', 'width', 'depth', 'cost');
	
	
	    this.unitCost = (attr) => {
	      const unitCost = Material.configure(instance.method(), instance.cost(),
	        instance.length(), instance.width(), instance.depth());
	      const copy = JSON.parse(JSON.stringify(unitCost));
	      if (attr) return copy[attr];
	      return copy;
	    }
	
	    this.calc = (assemblyOrCount) => {
	      const unitCost = this.unitCost();
	      const formula = this.formula() || unitCost.formula;
	      if (assemblyOrCount instanceof Assembly)
	        return Cost.evaluator.eval(`${unitCost.value}*${formula}`, assemblyOrCount);
	      else if (Number.isFinite(assemblyOrCount))
	        return Cost.evaluator.eval(`${unitCost.value}*${assemblyOrCount}`);
	      else
	        throw new Error('calc argument must be a number or Assembly');
	    }
	  }
	}
	
	Material.methods = {
	  LINEAR_FEET: 'Linear Feet',
	  SQUARE_FEET: 'Square Feet',
	  CUBIC_FEET: 'Cubic Feet',
	  UNIT: 'Unit'
	};
	
	Material.methodList = Object.values(Material.methods);
	
	
	Material.configure = (method, cost, length, width, depth) => {
	  const unitCost = {};
	  switch (method) {
	    case Material.methods.LINEAR_FEET:
	      const perLinearInch = Cost.evaluator.eval(`${cost}/${length}`);
	      unitCost.name = 'Linear Inch';
	      unitCost.value = perLinearInch;
	      unitCost.formula = 'l';
	      return unitCost;
	    case Material.methods.SQUARE_FEET:
	      const perSquareInch = Cost.evaluator.eval(`${cost}/(${length}*${width})`);
	      unitCost.name = 'Square Inch';
	      unitCost.value = perSquareInch;
	      unitCost.formula = 'l*w';
	      return unitCost;
	    case Material.methods.CUBIC_FEET:
	      const perCubicInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*${depth})`);
	      unitCost.name = 'Cubic Inch';
	      unitCost.value = perCubicInch;
	      unitCost.formula = 'l*w*d';
	      return unitCost;
	    case Material.methods.UNIT:
	      unitCost.name = 'Unit';
	      unitCost.value = cost;
	      return unitCost;
	    default:
	      throw new Error('wtf');
	      unitCost.name = 'Unknown';
	      unitCost = -0.01;
	      formula = -0.01;
	      return unitCost;
	  }
	};
	
	Material.explanation = `Cost to be calculated by number of units or demensions`;
	
	module.exports = Material
	
});


RequireJS.addFunction('./app-src/two-d/objects/polygon.js',
function (require, exports, module) {
	const Vertex2d = require('./vertex');
	const Line2d = require('./line');
	
	class Polygon2d {
	  constructor(initialVerticies) {
	    const lines = [];
	    let map;
	
	    this.verticies = (target, before, after) => {
	      if (lines.length === 0) return [];
	      const fullList = [];
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        fullList.push(line.startVertex());
	      }
	      if (target) {
	        const verticies = [];
	        const index = fullList.indexOf(target);
	        if (index === undefined) return null;
	        verticies = [];
	        for (let i = before; i < before + after + 1; i += 1) verticies.push(fullList[i]);
	        return verticies;
	      } else return fullList;
	
	      return verticies;
	    }
	
	    this.lines = () => lines;
	    this.startLine = () => lines[0];
	    this.endLine = () => lines[lines.length - 1];
	
	    this.lineMap = (force) => {
	      if (!force && map !== undefined) return map;
	      if (lines.length === 0) return {};
	      map = {};
	      let lastEnd;
	      if (!lines[0].startVertex().equal(lines[lines.length - 1].endVertex())) throw new Error('Broken Polygon');
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        if (lastEnd && !line.startVertex().equal(lastEnd)) throw new Error('Broken Polygon');
	        lastEnd = line.endVertex();
	        map[line.toString()] = line;
	      }
	      return map;
	    }
	
	    this.equal = (other) => {
	      if (!(other instanceof Polygon2d)) return false;
	      const verts = this.verticies();
	      const otherVerts = other.verticies();
	      if (verts.length !== otherVerts.length) return false;
	      let otherIndex = undefined;
	      let direction;
	      for (let index = 0; index < verts.length * 2; index += 1) {
	        const vIndex = index % verts.length;
	        if (otherIndex === undefined) {
	          if (index > verts.length) {
	            return false
	          } if(verts[index].equal(otherVerts[0])) {
	            otherIndex = otherVerts.length * 2;
	          }
	        } else if (otherIndex === otherVerts.length * 2) {
	          if (verts[vIndex].equal(otherVerts[1])) direction = 1;
	          else if(verts[vIndex].equal(otherVerts[otherVerts.length - 1])) direction = -1;
	          else return false;
	          otherIndex += direction * 2;
	        } else if (!verts[vIndex].equal(otherVerts[otherIndex % otherVerts.length])) {
	          return false;
	        } else {
	          otherIndex += direction;
	        }
	      }
	      return true;
	    }
	
	    function getLine(line) {
	      const lineMap = this.lineMap();
	      return lineMap[line.toString()] || lineMap[line.toNegitiveString()];
	    }
	
	    this.getLines = (startVertex, endVertex, reverse) => {
	      const inc = reverse ? -1 : 1;
	      const subSection = [];
	      let completed = false;
	      const doubleLen = lines.length * 2;
	      for (let steps = 0; steps < doubleLen; steps += 1) {
	        const index =  (!reverse ? steps : (doubleLen - steps - 1)) % lines.length;
	        const curr = lines[index];
	        if (subSection.length === 0) {
	          if (startVertex.equal(!reverse ? curr.startVertex() : curr.endVertex())) {
	            subSection.push(!reverse ? curr : curr.negitive());
	            if (endVertex.equal(reverse ? curr.startVertex() : curr.endVertex())) {
	              completed = true;
	              break;
	            }
	          }
	        } else {
	          subSection.push(!reverse ? curr : curr.negitive());
	          if (endVertex.equal(reverse ? curr.startVertex() : curr.endVertex())) {
	            completed = true;
	            break;
	          }
	        }
	      }
	      if (completed) return subSection;
	    }
	
	    this.center = () => Vertex2d.center(...this.verticies());
	
	    this.addVerticies = (list) => {
	      if (list === undefined) return;
	      if ((lines.length === 0) && list.length < 3) return;//console.error('A Polygon Must be initialized with 3 verticies');
	      const verts = [];
	      const endLine = this.endLine();
	      for (let index = 0; index < list.length + 1; index += 1) {
	        if (index < list.length) verts[index] = new Vertex2d(list[index]);
	        if (index === 0 && endLine) endLine.endVertex() = verts[0];
	        else if (index > 0) {
	          const startVertex = verts[index - 1];
	          const endVertex = verts[index] || this.startLine().startVertex();
	          const line = new Line2d(startVertex, endVertex);
	          lines.push(line);
	        }
	      }
	      if (verts.length > 0 && lines.length > 0) {
	        if (endLine) endline.endVertex() = verts[0];
	      }
	      // this.removeLoops();
	      this.lineMap(true);
	    }
	
	    this.path = () => {
	      let path = '';
	      this.verticies().forEach((v) => path += `${v.toString()} => `);
	      return path.substring(0, path.length - 4);
	    }
	
	    this.toString = this.path;
	
	    this.removeLoops = () => {
	      const map = {}
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        const key = line.toString();
	        const negKey = line.toNegitiveString();
	        if (map[key]) {
	          lines.splice(map[key].index, index - map[key].index + 1);
	        } else if (map[negKey]) {
	          lines.splice(map[negKey].index, index - map[negKey].index + 1);
	        } else {
	          map[key] = {line, index};
	        }
	      }
	    }
	
	    this.addVerticies(initialVerticies);
	  }
	}
	
	Polygon2d.center = (...polys) => {
	  const centers = [];
	  for (let index = 0; index < polys.length; index += 1) {
	    centers.push(polys[index].center());
	  }
	  return Vertex2d.center(...centers);
	}
	
	Polygon2d.lines = (...polys) => {
	  let lines = [];
	  for (let index = 0; index < polys.length; index += 1) {
	    lines = lines.concat(polys[index].lines());
	  }
	  const consolidated = Line2d.consolidate(...Line2d.consolidate(...lines));
	  if (consolidated.length !== Line2d.consolidate(...consolidated).length) {
	    console.error('Line Consolidation malfunction');
	  }
	  return consolidated;
	}
	
	new Polygon2d();
	module.exports = Polygon2d;
	
});


RequireJS.addFunction('./app-src/objects/assembly/assembly.js',
function (require, exports, module) {
	

	
	const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
	const Position = require('../../position.js');
	const getDefaultSize = require('../../utils.js').getDefaultSize;
	const Lookup = require('../../../../../public/js/utils/object/lookup.js');
	
	const valueOfunc = (valOfunc) => (typeof valOfunc) === 'function' ? valOfunc() : valOfunc;
	
	class Assembly extends Lookup {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
	    super(undefined, 'uniqueId');
	    let instance = this;
	    const temporaryInitialVals = {parentAssembly: parent, _TEMPORARY: true};
	    const initialVals = {
	      part: true,
	      included: true,
	      centerStr, demensionStr, rotationStr, partCode, partName,
	      propertyId: undefined,
	    }
	    Object.getSet(this, initialVals, 'values', 'subassemblies', 'joints');
	    Object.getSet(this, temporaryInitialVals);
	    this.path = () => `${this.constructor.name}.${partName}`.toDot();
	
	    if ((typeof centerStr) === 'function') this.centerStr = centerStr;
	    if ((typeof demensionStr) === 'function') this.demensionStr = demensionStr;
	    if ((typeof rotationStr) === 'function') this.rotationStr = rotationStr;
	
	    function getValueSmeFormatter(path) {
	      const split = path.split('.');
	      let attr = split[0];
	      let objIdStr;
	      if (split.length === 2) {
	        objIdStr = split[0];
	        attr = split[1];
	      }
	
	      let obj;
	      if (objIdStr === undefined) {
	        obj = instance;
	      } else {
	        obj = instance.getAssembly(objIdStr);
	      }
	      const returnVal = Assembly.resolveAttr(obj, attr);
	      return returnVal;
	    }
	    const sme = new StringMathEvaluator({Math}, getValueSmeFormatter);
	    this.eval = (eqn) => sme.eval(eqn, this);
	
	    this.getRoot = () => {
	      let currAssem = this;
	      while(currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
	      return currAssem;
	    }
	
	    let getting =  false;
	    this.getAssembly = (partCode, callingAssem) => {
	      if (callingAssem === this) return undefined;
	      if (this.partCode() === partCode) return this;
	      if (this.subassemblies[partCode]) return this.subassemblies[partCode];
	      if (callingAssem !== undefined) {
	        const children = Object.values(this.subassemblies);
	        for (let index = 0; index < children.length; index += 1) {
	          const assem = children[index].getAssembly(partCode, this);
	          if (assem !== undefined) return assem;
	        }
	      }
	      if (this.parentAssembly() !== undefined && this.parentAssembly() !== callingAssem)
	        return this.parentAssembly().getAssembly(partCode, this);
	      return undefined;
	    }
	    let position = new Position(this, sme);
	    this.position = () => position;
	    this.updatePosition = () => position = new Position(this, sme);
	    this.joints = [];
	    this.values = {};
	    this.rootAssembly = () => {
	      let currAssem = this;
	      while (currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
	      return currAssem;
	    }
	    this.getJoints = (pc) => {
	      const root = this.getRoot();
	      if (root !== this) return root.getJoints(pc || partCode);
	      pc = pc || partCode;
	      const assemList = this.getSubassemblies();
	      let jointList = [].concat(this.joints);
	      assemList.forEach((assem) => jointList = jointList.concat(assem.joints));
	      let joints = {male: [], female: []};
	      jointList.forEach((joint) => {
	        if (joint.malePartCode() === pc) {
	          joints.male.push(joint);
	        } else if (joint.femalePartCode() === pc) {
	          joints.female.push(joint);
	        }
	      });
	      return joints;
	    }
	    function initObj(value) {
	      const obj = {};
	      for (let index = 1; index < arguments.length; index += 1) {
	        obj[arguments[index]] = value;
	      }
	      return obj;
	    }
	    const funcAttrs = ['length', 'width', 'thickness'];
	    this.value = (code, value) => {
	      if (code.match(new RegExp(funcAttrs.join('|')))) {
	        this[code](value);
	      } else {
	        if (value !== undefined) {
	          this.values[code] = value;
	        } else {
	          const instVal = this.values[code];
	          if (instVal !== undefined && instVal !== null) {
	            if ((typeof instVal) === 'number' || (typeof instVal) === 'string') {
	              return sme.eval(instVal, this);
	            } else {
	              return instVal;
	            }
	          }
	          if (this.parentAssembly()) return this.parentAssembly().value(code);
	          else {
	            try {
	              const value = this.propertyConfig(this.constructor.name, code);
	              if (value === undefined) throw new Error();
	              return value;
	            } catch (e) {
	              console.error(`Failed to resolve code: ${code}`);
	              throw e;
	              return NaN;
	            }
	          }
	        }
	      }
	    }
	    this.jointOffsets = () => {
	    }
	
	    this.subassemblies = {};
	    this.setSubassemblies = (assemblies) => {
	      this.subassemblies = {};
	      assemblies.forEach((assem) => this.subassemblies[assem.partCode()] = assem);
	    };
	
	    this.partsOf = (clazz) => {
	      const parts = this.getRoot().getParts();
	      if (clazz === undefined) return parts;
	      return parts.filter((p) => p instanceof clazz);
	    }
	
	    // TODO: wierd dependency on inherited class.... fix!!!
	    const defaultPartCode = () =>
	      instance.partCode(instance.partCode() || Assembly.partCode(this));
	
	    this.setParentAssembly = (pa) => {
	      this.parentAssembly(pa);
	      defaultPartCode();
	    }
	    this.addSubAssembly = (assembly) => {
	      this.subassemblies[assembly.partCode()] = assembly;
	      assembly.setParentAssembly(this);
	    }
	
	    this.objId = this.constructor.name;
	
	    this.addJoints = function () {
	      for (let i = 0; i < arguments.length; i += 1) {
	        const joint = arguments[i];
	        this.joints.push(joint);
	        joint.parentAssemblyId(this.uniqueId());
	      }
	    }
	
	    this.addSubassemblies = function () {
	      for (let i = 0; i < arguments.length; i += 1) {
	        this.addSubAssembly(arguments[i]);
	      }
	    }
	
	    this.children = () => Object.values(this.subassemblies);
	
	    this.getSubassemblies = () => {
	      let assemblies = [];
	      this.children().forEach((assem) => {
	        assemblies.push(assem);
	        assemblies = assemblies.concat(assem.getSubassemblies());
	      });
	      return assemblies;
	    }
	    this.getParts = () => {
	      return this.getSubassemblies().filter((a) => a.part && a.included );
	    }
	
	    if (Assembly.idCounters[this.objId] === undefined) {
	      Assembly.idCounters[this.objId] = 0;
	    }
	
	    Assembly.add(this);
	
	    this.width = (value) => position.setDemension('x', value);
	    this.length = (value) => position.setDemension('y', value);
	    this.thickness = (value) => position.setDemension('z', value);
	    defaultPartCode();
	  }
	}
	
	Assembly.list = {};
	Assembly.get = (uniqueId) => {
	  const keys = Object.keys(Assembly.list);
	  for (let index = 0; index < keys.length; index += 1) {
	    const assembly = Assembly.list[keys[index]][uniqueId];
	    if (assembly !== undefined) return assembly;
	  }
	  return null;
	}
	Assembly.add = (assembly) => {
	  const name = assembly.constructor.name;
	  if (Assembly.list[name] === undefined) Assembly.list[name] = {};
	  Assembly.list[name][assembly.uniqueId()] = assembly;
	}
	Assembly.all = () => {
	  const list = [];
	  const keys = Object.keys(Assembly.list);
	  keys.forEach((key) => list.concat(Object.values(Assembly.list[key])));
	  return list;
	}
	Assembly.resolveAttr = (assembly, attr) => {
	  if (!(assembly instanceof Assembly)) return undefined;
	  if (attr === 'length' || attr === 'height' || attr === 'h' || attr === 'l') {
	    return assembly.length();
	  } else if (attr === 'w' || attr === 'width') {
	    return assembly.width();
	  } else if (attr === 'depth' || attr === 'thickness' || attr === 'd' || attr === 't') {
	    return assembly.thickness();
	  }
	  return assembly.value(attr);
	}
	Assembly.fromJson = (assemblyJson) => {
	  const demensionStr = assemblyJson.demensionStr;
	  const centerStr = assemblyJson.centerStr;
	  const rotationStr = assemblyJson.rotationStr;
	  const partCode = assemblyJson.partCode;
	  const partName = assemblyJson.partName;
	  const clazz = Object.class.get(assemblyJson._TYPE);
	  const assembly = new (clazz)(partCode, partName, centerStr, demensionStr, rotationStr);
	  assembly.uniqueId(assemblyJson.uniqueId);
	  assembly.values = assemblyJson.values;
	  assembly.setParentAssembly(assemblyJson.parent)
	  Object.values(assemblyJson.subassemblies).forEach((json) =>
	    assembly.addSubAssembly(Assembly.class(json._TYPE)
	                              .fromJson(json, assembly)));
	  if (assemblyJson.length) assembly.length(assemblyJson.length);
	  if (assemblyJson.width) assembly.width(assemblyJson.width);
	  if (assemblyJson.thickness) assembly.thickness(assemblyJson.thickness);
	  return assembly;
	}
	
	Assembly.classes = Object.class.object;
	Assembly.new = function (id) {
	  return new (Object.class.get(id))(...Array.from(arguments).slice(1));
	};
	Assembly.class = Object.class.get;
	Assembly.classObj = Object.class.filter;
	
	Assembly.classList = (filterFunc) => Object.values(Assembly.classObj(filterFunc));
	Assembly.classIds = (filterFunc) => Object.keys(Assembly.classObj(filterFunc));
	Assembly.lists = {};
	Assembly.idCounters = {};
	
	Assembly.partCode = (assembly) => {
	  const cabinet = assembly.getAssembly('c');
	  if (cabinet) {
	    const name = assembly.constructor.name;
	    cabinet.partIndex = cabinet.partIndex || 0;
	    return `${assembly.constructor.abbriviation}`;
	  }
	}
	
	module.exports = Assembly
	
});


RequireJS.addFunction('./app-src/objects/assembly/init-assem.js',
function (require, exports, module) {
	
const Assembly = require('./assembly.js');
	new Assembly();
	
	const Cabinet = require('./assemblies/cabinet.js');
	new Cabinet();
	
	const Divider = require('./assemblies/divider.js');
	new Divider();
	
	const DoorCatch = require('./assemblies/door/door-catch.js');
	new DoorCatch();
	
	const Door = require('./assemblies/door/door.js');
	new Door();
	
	const Hinges = require('./assemblies/door/hinges.js');
	new Hinges();
	
	const DrawerBox = require('./assemblies/drawer/drawer-box.js');
	new DrawerBox();
	
	const DrawerFront = require('./assemblies/drawer/drawer-front.js');
	new DrawerFront();
	
	const Guides = require('./assemblies/drawer/guides.js');
	new Guides();
	
	const Frame = require('./assemblies/frame.js');
	new Frame();
	
	const Handle = require('./assemblies/hardware/pull.js');
	new Handle();
	
	const Screw = require('./assemblies/hardware/screw.js');
	new Screw();
	
	const Panel = require('./assemblies/panel.js');
	new Panel();
	
	const PartitionSection = require('./assemblies/section/partition/sections/divider.js');
	new PartitionSection();
	
	const DividerSection = require('./assemblies/section/partition/partition');
	new DividerSection();
	
	const Section = require('./assemblies/section/section.js');
	new Section();
	
	const DivideSection = require('./assemblies/section/space/sections/divide-section.js');
	new DivideSection();
	
	const OpeningCoverSection = require('./assemblies/section/space/sections/open-cover/open-cover.js');
	new OpeningCoverSection();
	
	const DoorSection = require('./assemblies/section/space/sections/open-cover/sections/door.js');
	new DoorSection();
	
	const DrawerSection = require('./assemblies/section/space/sections/open-cover/sections/drawer.js');
	new DrawerSection();
	
	const DualDoorSection = require('./assemblies/section/space/sections/open-cover/sections/duel-door.js');
	new DualDoorSection();
	
	const FalseFrontSection = require('./assemblies/section/space/sections/open-cover/sections/false-front.js');
	new FalseFrontSection();
	
	const SpaceSection = require('./assemblies/section/space/space.js');
	new SpaceSection();
	
	const Cutter = require('./assemblies/cutter.js');
	new Cutter();
	
	Assembly.components = {
	  Door, DrawerBox, DrawerFront, Frame, Panel, Cutter,
	};
	
});


RequireJS.addFunction('./app-src/two-d/objects/snap-location.js',
function (require, exports, module) {
	
const Vertex2d = require('vertex');
	const Circle2d = require('circle');
	
	class SnapLocation2d {
	  constructor(parent, location, vertex, targetVertex, color, pairedWith) {
	    Object.getSet(this, {location, vertex, targetVertex, color}, "parentId", "pairedWithId");
	    const circle = new Circle2d(5, vertex);
	    pairedWith = pairedWith || null;
	    this.circle = () => circle;
	    this.eval = () => this.parent()[location]();
	    this.parent = () => parent;
	    this.parentId = () => parent.id();
	    this.pairedWithId = () => pairedWith && pairedWith.id();
	    this.pairedWith = () => pairedWith;
	    this.disconnect = () => {
	      if (pairedWith === null) return;
	      const wasPaired = pairedWith;
	      pairedWith = null;
	      wasPaired.disconnect();
	    }
	    this.pairWith = (otherSnapLoc) => {
	      const alreadyPaired = otherSnapLoc === pairedWith;
	      if (!alreadyPaired) {
	        pairedWith = otherSnapLoc;
	        otherSnapLoc.pairWith(this);
	      }
	    }
	
	    this.forEachObject = (func, objMap) => {
	      objMap = objMap || {};
	      objMap[this.parent().toString()] = this.parent();
	      const locs = this.parent().snapLocations.paired();
	      for (let index = 0; index < locs.length; index += 1) {
	        const loc = locs[index];
	        const connSnap = loc.pairedWith();
	        if (connSnap) {
	          const connObj = connSnap.parent();
	          if (connObj && objMap[connObj.id()] === undefined) {
	            objMap[connObj.id()] = connObj;
	            connSnap.forEachObject(undefined, objMap);
	          }
	        }
	      }
	      if ((typeof func) === 'function') {
	        const objs = Object.values(objMap);
	        for (let index = 0; index < objs.length; index += 1) {
	          func(objs[index]);
	        }
	      }
	    };
	
	    this.isConnected = (obj) => {
	      let connected = false;
	      this.forEachObject((connObj) => connected = connected || obj.id() === connObj.id());
	      return connected;
	    }
	
	    this.rotate = (theta) => {
	      this.forEachObject((obj) => obj.radians((obj.radians() + theta) % (2*Math.PI)));
	    }
	
	    let lastMove = 0;
	    this.move = (vertexLocation, moveId) => {
	      moveId = (typeof moveId) !== 'number' ? lastMove + 1 : moveId;
	      if (lastMove === moveId) return;
	      vertexLocation = new Vertex2d(vertexLocation);
	      const parent = this.parent();
	      const thisNewCenterLoc = this.parent()[location]({center: vertexLocation});
	      parent.object().move({center: thisNewCenterLoc});
	      lastMove = moveId;
	      const pairedLocs = parent.snapLocations.paired();
	      for (let index = 0; index < pairedLocs.length; index += 1) {
	        const loc = pairedLocs[index];
	        const paired = loc.pairedWith();
	        const tarVertexLoc = this.parent()[loc.location()]().vertex();
	        paired.move(tarVertexLoc, moveId);
	      }
	    }
	    this.notPaired = () => pairedWith === null;
	
	    this.instString = () => `${parent.id()}:${location}`;
	    this.toString = () => `${this.instString()}=>${pairedWith && pairedWith.instString()}`;
	    this.toJson = () => {
	      const pw = pairedWith;
	      if (pw === undefined) return;
	      const json = [{
	        location, objectId: parent.id()
	      }, {
	        location: pw.location(), objectId: pw.parent().id()
	      }];
	      const thisStr = this.toString();
	      const pairStr = pw.toString();
	      const uniqueId = thisStr < pairStr ? thisStr : pairStr;
	      json.UNIQUE_ID = uniqueId;
	      return json;
	    }
	  }
	}
	
	SnapLocation2d.fromJson = (json) => {
	  console.log('jsoned it up!')
	}
	
	let activeLocations = [];
	SnapLocation2d.active = (locs) => {
	  if (Array.isArray(locs)) activeLocations = activeLocations.concat(locs);
	  return activeLocations;
	}
	SnapLocation2d.clear = () => activeLocations = [];
	
	module.exports = SnapLocation2d;
	
});


RequireJS.addFunction('./app-src/objects/joint/joint.js',
function (require, exports, module) {
	
const Lookup = require('../../../../../public/js/utils/object/lookup.js')
	
	
	class Joint {
	  constructor(malePartCode, femalePartCode) {
	    let parentAssembly;
	    const initialVals = {
	      maleOffset: 0, femaleOffset: 0, parentAssemblyId:  undefined,
	      malePartCode, femalePartCode, demensionAxis: '', centerAxis: ''
	    }
	    Object.getSet(this, initialVals);
	
	    this.parentAssembly = () => {
	      if (!parentAssembly && this.parentAssemblyId()) {
	        parentAssembly = Lookup.get(this.parentAssemblyId());
	        this.parentAssemblyId = () => parentAssembly.uniqueId();
	      }
	      return parentAssembly;
	    }
	
	    this.updatePosition = () => {};
	
	    this.getFemale = () => this.parentAssembly().getAssembly(this.femalePartCode());
	    this.getMale = () => this.parentAssembly().getAssembly(this.malePartCode());
	
	    this.getDemensions = () => {
	      const malePos = getMale();
	      const femalePos = getFemale();
	      // I created a loop but it was harder to understand
	      return undefined;
	    }
	    this.toString = () => `${this.constructor.name}:${this.malePartCode()}->${this.femalePartCode()}`;
	
	    if (Joint.list[this.malePartCode()] === undefined) Joint.list[this.malePartCode()] = [];
	    if (Joint.list[this.femalePartCode()] === undefined) Joint.list[this.femalePartCode()] = [];
	    Joint.list[this.malePartCode()].push(this);
	    Joint.list[this.femalePartCode()].push(this);
	  }
	}
	Joint.list = {};
	Joint.regex = /([a-z0-9-_\.]{1,})->([a-z0-9-_\.]{1,})/;
	
	Joint.classes = {};
	Joint.register = (clazz) => {
	  new clazz();
	  Joint.classes[clazz.prototype.constructor.name] = clazz;
	}
	Joint.new = function (id, json) {
	  return new Joint.classes[id]().fromJson(json);
	}
	module.exports = Joint
	
});


RequireJS.addFunction('./app-src/objects/joint/init.js',
function (require, exports, module) {
	
const Joint = require('./joint');
	
	const Butt = require('./joints/butt.js');
	const Dado = require('./joints/dado.js');
	const Miter = require('./joints/miter.js');
	const Rabbet = require('./joints/rabbet.js');
	
	Joint.types = {
	  Butt, Dado, Miter, Rabbet
	};
	
});


RequireJS.addFunction('./app-src/two-d/objects/plane.js',
function (require, exports, module) {
	
class Plane2d {
	  constructor(verticies) {
	    this.getLines = () => {
	      const lines = [];
	      for (let index = 0; index < verticies.length; index += 1) {
	        lines.push(new Line2d(verticies[index], verticies[(index + 1) % verticies.length]));
	      }
	      return lines;
	    }
	  }
	}
	
	Plane2d.getPlanes = (planes) => {
	  const ps = [];
	  planes.forEach((p) => ps.push(new Plane2d(p)));
	  return ps;
	}
	
	Plane2d.consolidatePolygons = (polygons) => {
	  const consolidated = {top: {}, left: {}, front: {}};
	  function group(g, poly) {
	
	    map.xy[index].push({x: v.pos.x, y: v.pos.y, level: v.pos.z});
	    map.xz[index].push({x: v.pos.x, y: v.pos.z, level: v.pos.y});
	    map.yz[index].push({x: v.pos.y, y: v.pos.z, level: v.pos.x});
	  }
	  const map = {xy: [], xz: [], yz: []};
	  polygons.forEach((p, index) => {
	    map.xy.push([]);
	    map.xz.push([]);
	    map.yz.push([]);
	    p.vertices.forEach((v) => {
	      map.xy[index].push({x: v.pos.x, y: v.pos.y, level: v.pos.z});
	      map.xz[index].push({x: v.pos.x, y: v.pos.z, level: v.pos.y});
	      map.yz[index].push({x: v.pos.y, y: v.pos.z, level: v.pos.x});
	    });
	  });
	  return map;
	}
	
	new Plane2d();
	module.exports = Plane2d;
	
});


RequireJS.addFunction('./app-src/two-d/objects/circle.js',
function (require, exports, module) {
	
const Vertex2d = require('./vertex');
	
	class Circle2d {
	  constructor(radius, center) {
	    center = new Vertex2d(center);
	    Object.getSet(this, {radius, center});
	    // ( x - h )^2 + ( y - k )^2 = r^2
	    const instance = this;
	    // Stole the root code from: https://stackoverflow.com/a/37225895
	    function lineIntersects (line, bounded) {
	      const p1 = line.startVertex();
	      const p2 = line.endVertex();
	        var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
	        v1 = {};
	        v2 = {};
	        v1.x = p2.x() - p1.x();
	        v1.y = p2.y() - p1.y();
	        v2.x = p1.x() - instance.center().x();
	        v2.y = p1.y() - instance.center().y();
	        b = (v1.x * v2.x + v1.y * v2.y);
	        c = 2 * (v1.x * v1.x + v1.y * v1.y);
	        b *= -2;
	        d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - instance.radius() * instance.radius()));
	        if(isNaN(d)){ // no intercept
	            return [];
	        }
	        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
	        u2 = (b + d) / c;
	        retP1 = {};   // return points
	        retP2 = {}
	        ret = []; // return array
	        if(!bounded || (u1 <= 1 && u1 >= 0)){  // add point if on the line segment
	            retP1.x = p1.x() + v1.x * u1;
	            retP1.y = p1.y() + v1.y * u1;
	            ret[0] = retP1;
	        }
	        if(!bounded || (u2 <= 1 && u2 >= 0)){  // second add point if on the line segment
	            retP2.x = p1.x() + v1.x * u2;
	            retP2.y = p1.y() + v1.y * u2;
	            ret[ret.length] = retP2;
	        }
	        return ret;
	    }
	
	    function circleIntersects(circle) {
	      return Circle2d.intersectionOfTwo(instance, circle);
	    }
	
	    this.toString = () => `(${this.radius()}${this.center()}----)`;
	
	    this.intersections = (input) => {
	        if (input instanceof Circle2d) return circleIntersects(input);
	        if (input.constructor.name === 'Line2d') return lineIntersects(input);
	        throw new Error(`Cannot find intersections for ${input.constructor.name}`);
	    }
	  }
	}
	
	// Ripped off from: https://stackoverflow.com/a/12221389
	Circle2d.intersectionOfTwo = (circle0, circle1) => {
	    const x0 = circle0.center().x();
	    const y0 = circle0.center().y();
	    const r0 = circle0.radius();
	
	    const x1 = circle1.center().x();
	    const y1 = circle1.center().y();
	    const r1 = circle1.radius();
	    var a, dx, dy, d, h, rx, ry;
	    var x2, y2;
	
	    /* dx and dy are the vertical and horizontal distances between
	     * the circle centers.
	     */
	    dx = x1 - x0;
	    dy = y1 - y0;
	
	    /* Determine the straight-line distance between the centers. */
	    d = Math.sqrt((dy*dy) + (dx*dx));
	
	    /* Check for solvability. */
	    if (d > (r0 + r1)) {
	        /* no solution. circles do not intersect. */
	        return [];
	    }
	    if (d < Math.abs(r0 - r1)) {
	        /* no solution. one circle is contained in the other */
	        return [];
	    }
	
	    /* 'point 2' is the point where the line through the circle
	     * intersection points crosses the line between the circle
	     * centers.
	     */
	
	    /* Determine the distance from point 0 to point 2. */
	    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;
	
	    /* Determine the coordinates of point 2. */
	    x2 = x0 + (dx * a/d);
	    y2 = y0 + (dy * a/d);
	
	    /* Determine the distance from point 2 to either of the
	     * intersection points.
	     */
	    h = Math.sqrt((r0*r0) - (a*a));
	
	    /* Now determine the offsets of the intersection points from
	     * point 2.
	     */
	    rx = -dy * (h/d);
	    ry = dx * (h/d);
	
	    /* Determine the absolute intersection points. */
	    var xi = x2 + rx;
	    var xi_prime = x2 - rx;
	    var yi = y2 + ry;
	    var yi_prime = y2 - ry;
	
	    const list = [];
	    return [{x: xi, y: yi}, {x: xi_prime, y: yi_prime}];
	}
	
	Circle2d.reusable = true;
	Circle2d.instance = (radius, center) => {
	  const inst = Lookup.instance(Circle2d.name);
	  inst.radius(radius);
	  inst.center(center);
	  return inst;
	}
	new Circle2d();
	
	module.exports = Circle2d;
	
});


RequireJS.addFunction('./app-src/two-d/objects/line-measurement.js',
function (require, exports, module) {
	
const Circle2d = require('circle');
	const Vertex2d = require('vertex');
	const Line2d = require('line');
	const Lookup = require('../../../../../public/js/utils/object/lookup');
	const Measurement = require('../../../../../public/js/utils/measurement.js');
	
	class LineMeasurement2d {
	  constructor(line, center, layer, modificationFunction) {
	    const offset = 3;
	    this.line = () => line;
	    this.I = (l) => {
	      l = l || layer || 1;
	      const termDist = (l + 1) * offset;
	      const measureDist = l * offset;
	      const startLine = line.perpendicular(line.startVertex(), termDist * 2);
	      const endLine = line.perpendicular(line.endVertex(), termDist * 2);
	      const startCircle = new Circle2d(measureDist, line.startVertex());
	      const endCircle = new Circle2d(measureDist, line.endVertex());
	      const startTerminationCircle = new Circle2d(termDist - 2.5, line.startVertex());
	      const endTerminationCircle = new Circle2d(termDist - 2.5, line.endVertex());
	      const startVerticies = startCircle.intersections(startLine);
	      const endVerticies = endCircle.intersections(endLine);
	      let l1, l2;
	      if (startVerticies.length > 0 && endVerticies.length > 0) {
	        const startTerminationVerticies = startTerminationCircle.intersections(startLine);
	        const endTerminationVerticies = endTerminationCircle.intersections(endLine);
	        let startTerminationLine, endTerminationLine, measurementLine;
	
	        l1 = new Line2d(startVerticies[1], endVerticies[1]);
	        l1.startLine = new Line2d(line.startVertex(), startTerminationVerticies[1]);
	        l1.endLine = new Line2d(line.endVertex(), endTerminationVerticies[1]);
	
	        l2 = new Line2d(startVerticies[0], endVerticies[0]);
	        l2.startLine = new Line2d(line.startVertex(), startTerminationVerticies[0]);
	        l2.endLine = new Line2d(line.endVertex(), endTerminationVerticies[0]);
	        const furtherLine = (point) => LineMeasurement2d.furtherLine(l1, l2, point || center);
	        const closerLine = (point) => LineMeasurement2d.furtherLine(l1, l2, point || center, true);
	        return {furtherLine, closerLine};
	      } else {
	        return {};
	      }
	    }
	
	    this.copy = (modFunc) => new LineMeasurement2d(line, modFunc);
	    this.modificationFunction = (func) => {
	      if ((typeof func) === 'function') {
	        if ((typeof this.id) !== 'function') Lookup.convert(this);
	        modificationFunction = func;
	      }
	      return modificationFunction;
	    }
	
	    this.toString = () => `|--${this.line()}--|`;
	    this.display = () => new Measurement(line.length()).display();
	
	    this.modify = (value) => modificationFunction(new Measurement(value, true).decimal());
	
	    this.modificationFunction(modificationFunction);
	  }
	}
	
	LineMeasurement2d.measurements = (lines) => {
	  const verts = Line2d.vertices(lines);
	  const center = Vertex2d.center(...verts);
	  const measurements = [];
	  for (let tIndex = 0; tIndex < lines.length; tIndex += 1) {
	    const tarVerts = lines[tIndex].liesOn(verts);
	    if (tarVerts.length > 2) {
	      for (let index = 1; index < tarVerts.length; index += 1) {
	        const sv = tarVerts[index - 1];
	        const ev = tarVerts[index];
	        const line = new Line2d(sv,ev);
	        measurements.push(new LineMeasurement2d(line, center, 1));
	      }
	    }
	    if (tarVerts.length > 1) {
	      const sv = tarVerts[0];
	      const ev = tarVerts[tarVerts.length - 1];
	      const line = new Line2d(sv,ev);
	      measurements.push(new LineMeasurement2d(line, center, 2));
	    }
	  }
	  return measurements;
	}
	
	LineMeasurement2d.furtherLine = (l1, l2, point, closer) =>
	    point === undefined ? (closer ? l1 : l2) :
	    (l1.midpoint().distance(point) > l2.midpoint().distance(point) ?
	      (closer ? l2 : l1) :
	      (closer ? l1 : l2));
	
	module.exports = LineMeasurement2d;
	
});


RequireJS.addFunction('./app-src/config/property/definitions.js',
function (require, exports, module) {
	const Property = require('../property');
	const Measurement = require('../../../../../public/js/utils/measurement.js');
	const IMPERIAL_US = Measurement.units()[1];
	
	const defs = {};
	
	defs.h = new Property('h', 'height', null);
	defs.w = new Property('w', 'width', null);
	defs.d = new Property('d', 'depth', null);
	defs.t = new Property('t', 'thickness', null);
	defs.l = new Property('l', 'length', null);
	
	//   Overlay
	defs.ov = new Property('ov', 'Overlay', {value: 1/2, notMetric: IMPERIAL_US})
	
	//   Reveal
	defs.r = new Property('r', 'Reveal', {value: 1/8, notMetric: IMPERIAL_US}),
	defs.rvr = new Property('rvr', 'Reveal Right', {value: 1/8, notMetric: IMPERIAL_US}),
	defs.rvl = new Property('rvl', 'Reveal Left', {value: 1/8, notMetric: IMPERIAL_US}),
	defs.rvt = new Property('rvt', 'Reveal Top', {value: 1/2, notMetric: IMPERIAL_US}),
	defs.rvb = new Property('rvb', 'Reveal Bottom', {value: 0, notMetric: IMPERIAL_US})
	
	//   Inset
	defs.is = new Property('is', 'Spacing', {value: 3/32, notMetric: IMPERIAL_US})
	
	//   Cabinet
	defs.sr = new Property('sr', 'Scribe Right', {value: 3/8, notMetric: IMPERIAL_US}),
	defs.sl = new Property('sl', 'Scribe Left', {value: 3/8, notMetric: IMPERIAL_US}),
	defs.rvibr = new Property('rvibr', 'Reveal Inside Bottom Rail', {value: 1/8, notMetric: IMPERIAL_US}),
	defs.rvdd = new Property('rvdd', 'Reveal Dual Door', {value: 1/16, notMetric: IMPERIAL_US}),
	defs.tkbw = new Property('tkbw', 'Toe Kick Backer Width', {value: 1/2, notMetric: IMPERIAL_US}),
	defs.tkd = new Property('tkd', 'Toe Kick Depth', {value: 4, notMetric: IMPERIAL_US}),
	defs.tkh = new Property('tkh', 'Toe Kick Height', {value: 4, notMetric: IMPERIAL_US}),
	defs.pbt = new Property('pbt', 'Panel Back Thickness', {value: 1/2, notMetric: IMPERIAL_US}),
	defs.iph = new Property('iph', 'Ideal Handle Height', {value: 42, notMetric: IMPERIAL_US})
	defs.brr = new Property('brr', 'Bottom Rail Reveal', {value: 1/8, notMetric: IMPERIAL_US})
	defs.frw = new Property('frw', 'Frame Rail Width', {value: 1.5, notMetric: IMPERIAL_US})
	defs.frt = new Property('frt', 'Frame Rail Thicness', {value: .75, notMetric: IMPERIAL_US})
	
	//   Panel
	
	//   Guides
	defs.dbtos = new Property('dbtos', 'Drawer Box Top Offset', null),
	defs.dbsos = new Property('dbsos', 'Drawer Box Side Offest', null),
	defs.dbbos = new Property('dbbos', 'Drawer Box Bottom Offset', null)
	
	//   DoorAndFront
	defs.daffrw = new Property('daffrw', 'Door and front frame rail width', {value: '2 3/8', notMetric: IMPERIAL_US}),
	defs.dafip = new Property('dafip', 'Door and front inset panel', {value: null})
	
	//   Door
	
	//   DrawerBox
	defs.dbst = new Property('dbst', 'Side Thickness', {value: 5/8, notMetric: IMPERIAL_US}),
	defs.dbbt = new Property('dbbt', 'Box Bottom Thickness', {value: 1/4, notMetric: IMPERIAL_US}),
	defs.dbid = new Property('dbid', 'Bottom Inset Depth', {value: 1/2, notMetric: IMPERIAL_US}),
	defs.dbn = new Property('dbn', 'Bottom Notched', {value: true, notMetric: IMPERIAL_US})
	
	//   DrawerFront
	defs.mfdfd = new Property('mfdfd', 'Minimum Framed Drawer Front Height', {value: 6, notMetric: IMPERIAL_US})
	
	//   Frame
	
	//   Handle
	defs.c2c = new Property('c2c', 'Center To Center', null),
	defs.proj = new Property('proj', 'Projection', null),
	
	//   Hinge
	defs.maxtab = new Property('maxtab', 'Max Spacing from bore to edge of door', null),
	defs.mintab = new Property('mintab', 'Minimum Spacing from bore to edge of door', null),
	defs.maxol = new Property('maxol', 'Max Door Overlay', null),
	defs.minol = new Property('minol', 'Minimum Door Overlay', null)
	
	//   Opening
	
	module.exports = defs;
	
});


RequireJS.addFunction('./app-src/three-d/objects/polygon.js',
function (require, exports, module) {
	
const approximate = require('../../../../../public/js/utils/approximate.js');
	const Polygon2D = require('../../two-d/objects/polygon.js');
	
	class Vertex3D {
	  constructor(x, y) {
	    if (x instanceof Vertex3D) return x;
	    if (arguments.length == 3) {
	      this.x = approximate(x);
	      this.y = approximate(y);
	      this.z = approximate(z);
	    } else if ('x' in x) {
	      this.x = approximate(x.x);
	      this.y = approximate(x.y);
	      this.z = approximate(x.z);
	    } else {
	      this.x = approximate(x[0]);
	      this.y = approximate(x[1]);
	      this.z = approximate(x[2]);
	    }
	    this.equals = (other) => other && this.x === other.x && this.y === other.y;
	    this.toString = () => `${this.x},${this.y},${this.z}`;
	  }
	}
	
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
	      const i = approximate((this.j() * vector.k()) - (vector.j() * this.k()));
	      const j = approximate((this.i() * vector.k()) - (vector.i() * this.k()));
	      const k = approximate((this.i() * vector.j()) - (vector.i() * this.j()));
	      return new Vector3D(i,j,k);
	    }
	    this.perpendicular = (vector) =>
	      ((this.i() * vector.i()) + (this.j() * vector.j()) + (this.k() * vector.k())) === 0;
	    this.parrelle = (vector) => {
	      let coef = this.i() / vector.i() || this.j() / vector.j() || this.k() / vector.k();
	      if (Math.abs(coef) === Infinity || coef === 0 || Number.isNaN(coef)) return null;
	      return vector.i() * coef === this.i() && vector.j() * coef === this.j() && vector.k() * coef === this.k();
	    }
	    this.equals = this.parrelle;
	    this.toString = () => `<${i},${j},${k}>`;
	  }
	}
	
	class Line3D {
	  constructor(startVertex, endVertex) {
	    this.startVertex = startVertex;
	    this.endVertex = endVertex;
	
	
	    let i = endVertex.x - startVertex.x;
	    let j = endVertex.y - startVertex.y;
	    let k = endVertex.z - startVertex.z;
	    const vector = new Vector3D(i,j,k);
	
	    this.negitive = () => new Line3D(endVertex, startVertex);
	    this.equals = (other) => startVertex && endVertex && other &&
	        startVertex.equals(other.startVertex) && endVertex.equals(other.endVertex);
	    this.vector = () => vector;
	
	    this.toString = () => `${new String(this.startVertex)} => ${new String(this.endVertex)}`;
	    this.toNegitiveString = () => `${new String(this.endVertex)} => ${new String(this.startVertex)}`;
	  }
	}
	Line3D.verticies = (lines) => {
	  const verts = [];
	  for (let index = 0; index < lines.length; index += 1) {
	    verts.push(lines[index].endVertex);
	  }
	  return verts;
	}
	
	class Polygon3D {
	  constructor(initialVerticies) {
	    const lines = [];
	    let map;
	    let normal;
	    this.normal = () => normal;
	
	    function calcNormal(l1, l2) {
	      return l1.vector().dot(l2.vector());
	    }
	
	    this.perpendicular = (poly) => {
	      if (normal === undefined || poly.normal() === undefined) return false;
	      return normal.perpendicular(poly.normal());
	    }
	    this.inXY = () => this.perpendicular(xyPoly);
	    this.inYZ = () => this.perpendicular(yzPoly);
	    this.inXZ = () => this.perpendicular(xzPoly);
	
	    this.parrelle = (poly) => {
	      if (normal === undefined || poly.normal() === undefined) return false;
	      return normal.parrelle(poly.normal());
	    }
	
	    this.verticies = () => {
	      if (lines.length === 0) return [];
	      const verticies = [];
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        verticies.push(line.startVertex);
	      }
	
	      return verticies;
	    }
	
	    this.lines = () => lines;
	    this.startLine = () => lines[0];
	    this.endLine = () => lines[lines.length - 1];
	
	    this.lineMap = (force) => {
	      if (!force && map !== undefined) return map;
	      if (lines.length === 0) return {};
	      map = {};
	      let lastEnd;
	      if (!lines[0].startVertex.equals(lines[lines.length - 1].endVertex)) throw new Error('Broken Polygon');
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        if (lastEnd && !line.startVertex.equals(lastEnd)) throw new Error('Broken Polygon');
	        lastEnd = line.endVertex;
	        map[line.toString()] = line;
	      }
	      return map;
	    }
	
	    this.equals = (other) => {
	      if (!(other instanceof Polygon3D)) return false;
	      const verts = this.verticies();
	      const otherVerts = other.verticies();
	      if (verts.length !== otherVerts.length) return false;
	      let otherIndex = undefined;
	      let direction;
	      for (let index = 0; index < verts.length * 2; index += 1) {
	        const vIndex = index % verts.length;
	        if (otherIndex === undefined) {
	          if (index > verts.length) {
	            return false
	          } if(verts[index].equals(otherVerts[0])) {
	            otherIndex = otherVerts.length * 2;
	          }
	        } else if (otherIndex === otherVerts.length * 2) {
	          if (verts[vIndex].equals(otherVerts[1])) direction = 1;
	          else if(verts[vIndex].equals(otherVerts[otherVerts.length - 1])) direction = -1;
	          else return false;
	          otherIndex += direction * 2;
	        } else if (!verts[vIndex].equals(otherVerts[otherIndex % otherVerts.length])) {
	          return false;
	        } else {
	          otherIndex += direction;
	        }
	      }
	      return true;
	    }
	
	    function getLine(line) {
	      const lineMap = this.lineMap();
	      return lineMap[line.toString()] || lineMap[line.toNegitiveString()];
	    }
	
	    this.getLines = (startVertex, endVertex, reverse) => {
	      const inc = reverse ? -1 : 1;
	      const subSection = [];
	      let completed = false;
	      const doubleLen = lines.length * 2;
	      for (let steps = 0; steps < doubleLen; steps += 1) {
	        const index =  (!reverse ? steps : (doubleLen - steps - 1)) % lines.length;
	        const curr = lines[index];
	        if (subSection.length === 0) {
	          if (startVertex.equals(!reverse ? curr.startVertex : curr.endVertex)) {
	            subSection.push(!reverse ? curr : curr.negitive());
	            if (endVertex.equals(reverse ? curr.startVertex : curr.endVertex)) {
	              completed = true;
	              break;
	            }
	          }
	        } else {
	          subSection.push(!reverse ? curr : curr.negitive());
	          if (endVertex.equals(reverse ? curr.startVertex : curr.endVertex)) {
	            completed = true;
	            break;
	          }
	        }
	      }
	      if (completed) return subSection;
	    }
	
	    this.addVerticies = (list) => {
	      if (list === undefined) return;
	      const verts = [];
	      const endLine = this.endLine();
	      for (let index = 0; index < list.length + 1; index += 1) {
	        if (index < list.length) verts[index] = new Vertex3D(list[index]);
	        if (index === 0 && endLine) endLine.endVertex = verts[0];
	        else if (index > 0) {
	          const startVertex = verts[index - 1];
	          const endVertex = verts[index] || this.startLine().startVertex;
	          const line = new Line3D(startVertex, endVertex);
	          lines.push(line);
	          const prevLine = lines[lines.length - 2];
	          if (lines.length > 1 && !(normal instanceof Vector3D)) normal = calcNormal(line, prevLine);
	          // else if (lines.length > 2) {
	          //   const equal = normal.equals(calcNormal(line, prevLine));
	          //   if (equal === false) {
	          //     console.log('Trying to add vertex that does not lie in the existing plane');
	          //   }
	          // }
	        }
	      }
	      if (verts.length > 0 && lines.length > 0) {
	        if (endLine) endline.endVertex = verts[0];
	      }
	      this.removeLoops();
	      this.lineMap(true);
	    }
	
	    this.removeLoops = () => {
	      const map = {}
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        const key = line.toString();
	        const negKey = line.toNegitiveString();
	        if (map[key]) {
	          lines.splice(map[key].index, index - map[key].index + 1);
	        } else if (map[negKey]) {
	          lines.splice(map[negKey].index, index - map[negKey].index + 1);
	        } else {
	          map[key] = {line, index};
	        }
	      }
	    }
	
	    this.path = () => {
	      let path = '';
	      this.verticies().forEach((v) => path += `${v.toString()} => `);
	      return path.substring(0, path.length - 4);
	    }
	
	    this.merge = (other) => {
	      // if (!this.normal.equals(other.normal)) return;
	      const sharedMap = [];
	      const inverseMap = [];
	      const notShared = [];
	      const lineMap = this.lineMap();
	      const otherLines = other.lines();
	      let merged;
	      for (let index = 0; index < otherLines.length; index += 1) {
	        const curr = otherLines[index];
	        if (lineMap[curr.toString()] !== undefined) {
	          let thisLines = this.getLines(curr.startVertex, curr.endVertex, true);
	          let otherLines = other.getLines(curr.endVertex, curr.startVertex, false);
	          if (thisLines && otherLines) {
	            if (thisLines[0].startVertex.equals(otherLines[0].startVertex)) {
	              merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines.reverse())));
	            } else {
	              merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines)));
	            }
	          }
	        }
	        if (lineMap[curr.toNegitiveString()] !== undefined) {
	          let thisLines = this.getLines(curr.endVertex, curr.startVertex, true);
	          let otherLines = other.getLines(curr.startVertex, curr.endVertex, true);
	          if (thisLines[0].startVertex.equals(otherLines[0].startVertex)) {
	            merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines.reverse())));
	          } else {
	            merged = new Polygon3D(Line3D.verticies(thisLines.concat(otherLines)));
	          }
	        }
	      }
	
	      if (merged) {
	        // merged.removeLoops();
	        return merged;
	      }
	    }
	    this.addVerticies(initialVerticies);
	  }
	}
	
	Polygon3D.merge = (polygons) => {
	  let currIndex = 0;
	  while (currIndex < polygons.length - 1) {
	    const target = polygons[currIndex];
	    for (let index = currIndex + 1; index < polygons.length; index += 1) {
	      const other = polygons[index];
	      const merged = target.merge(other);
	      if (merged) {
	        polygons[currIndex--] = merged;
	        polygons.splice(index, 1);
	        break;
	      }
	    }
	    currIndex++;
	  }
	}
	
	const xyPoly = new Polygon3D([[1,1,0],[1,2,0],[2,1,0]]);
	const yzPoly = new Polygon3D([[1,0,1],[1,0,2],[2,0,1]]);
	const xzPoly = new Polygon3D([[0,1,1],[0,1,2],[0,2,1]]);
	
	// const include = (axis1, axis2, axis3) => !(Math.abs(axis1) === 1 || Math.abs(axis2) === 1);
	// const include = (axis1, axis2, axis3) => axis3 !== 0 && axis1 === 0 && axis2 === 0;
	const include = (n1, n2) => ((n1[0] * n2[0]) + (n1[1] * n2[1]) + (n1[2] * n2[2])) !== 0;
	Polygon3D.toTwoD = (polygons) => {
	  const map = {xy: [], xz: [], zy: []};
	  for (let index = 0; index < polygons.length; index += 1) {
	    const poly = polygons[index];
	    const norm = poly.normal();
	    const includeXY = poly.inXY();//include(norm, [0,0,1]);//include(norm[0], norm[1], norm[2]);
	    const includeXZ = poly.inXZ();//include(norm, [0,1,0]);//include(norm[0], norm[2], norm[1]);
	    const includeZY = poly.inYZ();//include(norm, [1,0,0]);//include(norm[2], norm[1], norm[0]);
	    const indexXY = map.xy.length;
	    const indexXZ = map.xz.length;
	    const indexZY = map.zy.length;
	    if (includeXY) map.xy[indexXY] = [];
	    if (includeXZ) map.xz[indexXZ] = [];
	    if (includeZY) map.zy[indexZY] = [];
	    poly.verticies().forEach((vertex) => {
	      if (includeXY) map.xy[indexXY].push({x: vertex.x, y: -1 * vertex.y, layer: vertex.z});
	      if (includeXZ) map.xz[indexXZ].push({x: vertex.x, y: -1 * vertex.z, layer: vertex.y});
	      if (includeZY) map.zy[indexZY].push({x: -1 * vertex.z, y: -1 * vertex.y, layer: vertex.x});
	    });
	    if (includeXY) map.xy[indexXY] = new Polygon2D(map.xy[indexXY]);
	    if (includeXZ) map.xz[indexXZ] = new Polygon2D(map.xz[indexXZ]);
	    if (includeZY) map.zy[indexZY] = new Polygon2D(map.zy[indexZY]);
	  }
	  return map;
	}
	
	
	Polygon3D.Vector3D = Vector3D;
	Polygon3D.Vertex3D = Vertex3D;
	Polygon3D.Line3D = Line3D;
	module.exports = Polygon3D;
	
});


RequireJS.addFunction('./app-src/config/property/config.js',
function (require, exports, module) {
	
const Properties = require('../properties');
	const Measurement = require('../../../../../public/js/utils/measurement.js');
	const IMPERIAL_US = Measurement.units()[1];
	
	class PropertyConfig {
	  constructor(props) {
	    Object.getSet(this);
	    props = props || Properties.instance();
	    let style = props.style || PropertyConfig.lastStyle;
	    let styleName = props.styleName || PropertyConfig.lastStyleName ||
	                    Object.keys(Properties.groupList(style))[0];
	    if (styleName)
	      props[style] = Properties.getSet(style, styleName);
	
	    function isRevealOverlay() {return style === 'Reveal';}
	    function isInset() {return style === 'Inset';}
	    function overlay() {return props['Overlay'].ov.value()}
	    function reveal() {return props['Reveal']};
	
	    function cabinetStyles() {
	      return ['Overlay', 'Inset', 'Reveal'];
	    }
	    function cabinetStyle() {
	      return style;
	    }
	    function cabinetStyleName() {
	      return styleName;
	    }
	
	    function set(group, name) {
	      const newSet = Properties.getSet(group, name);
	      newSet.__KEY = name;
	      if (cabinetStyles().indexOf(group) !== -1) {
	        style = group;
	        styleName = name;
	      }
	      if (newSet === undefined) throw new Error(`Attempting to switch '${group}' to unknown property set '${name}'`);
	      props[group] = newSet;
	    }
	
	    const panelThicknessRegMetric = /^pwt([0-9]{1,})([0-9][0-9])$/;
	    const panelThicknessRegImperial = /^pwt([0-9])([0-9])$/;
	    const resolvePanelThickness = (code) => {
	      let match = code.match(panelThicknessRegImperial);
	      if (match) return new Measurement(match[1]/match[2], IMPERIAL_US).value();
	      match = code.match(panelThicknessRegMetric);
	      if (match) return new Measurement(`${match[1]}.${match[2]}`).value();
	      return undefined;
	    }
	
	    const outerCodeReg = /^(rrv|lrv|brv|trv)$/;
	    const resolveOuterReveal = (code, props) => {
	      if (!code.match(outerCodeReg)) return undefined;
	      switch (code) {
	        case 'rrv':
	          return 0.3175
	        case 'lrv':
	          return 0.3175
	        case 'brv':
	          return 0.3175
	        case 'trv':
	          return 0.3175
	        default:
	          return 0.3175
	      }
	    }
	
	
	    const resolveReveals = (code, props) => {
	      switch (code) {
	        case 'frorl': return new Measurement(1/8, IMPERIAL_US).value();
	        case 'frorr': return new Measurement(1/8, IMPERIAL_US).value();
	        case 'r': if (isInset()) return 0;
	          if (isRevealOverlay()) return new Measurement(props.Reveal.r.value()).value();
	          return new Measurement(props.Cabinet.frw.value() - 2 * props.Overlay.ov.value()).value();
	        default: return resolveCostProps(code, props);
	      }
	    }
	
	    const resolveComplexProps = (code, props) => {
	      if (code === undefined) return undefined;
	      let value = resolvePanelThickness(code, props);
	      if (value !== undefined) return value;
	      value = resolveOuterReveal(code, props);
	      // if (value !== undefined) return value;
	      // value = resolveReveals(code, props);
	      return value;
	    }
	
	    const excludeKeys = ['_ID', '_NAME', '_GROUP', 'properties'];
	    function getProperties(clazz, code) {
	      clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
	      const classProps = props[clazz] || {};
	      if (code === undefined) return classProps;
	      return classProps[code] === undefined ? resolveComplexProps(code, props) : classProps[code].value();
	    }
	
	    function toJson() {
	      const json = {style, styleName};
	      const keys = Object.keys(props).filter((key) => key.match(/^[A-Z]/));
	      keys.forEach((key) => {
	        json[key] = [];
	        const propKeys = Object.keys(props[key]);
	        propKeys.forEach((propKey) => {
	          if (props[key][propKey] && props[key][propKey].toJson === 'function')
	            json[key].push(props[key][propKey].toJson())
	        });
	      });
	      return json;
	    }
	
	    getProperties.isRevealOverlay = isRevealOverlay;
	    getProperties.isInset = isInset;
	    getProperties.overlay = overlay;
	    getProperties.reveal = reveal;
	    getProperties.toJson = toJson;
	    getProperties.cabinetStyles = cabinetStyles;
	    getProperties.cabinetStyle = cabinetStyle;
	    getProperties.cabinetStyleName = cabinetStyleName;
	    getProperties.set = set;
	
	    return getProperties;
	  }
	}
	
	PropertyConfig.lastStyle = 'Overlay';
	
	PropertyConfig.fromJson = (json) => {
	  const propConfig = {style: json.style, styleName: json.styleName};
	  const keys = Object.keys(json).filter((key) => key.match(/^[A-Z]/));
	  keys.forEach((key) => {
	    const propKeys = Object.keys(json[key]);
	    propConfig[key] = {};
	    propKeys.forEach((propKey) =>
	                propConfig[key][json[key][propKey].code] = Object.fromJson(json[key][propKey]));
	  });
	  return new PropertyConfig(propConfig);
	}
	
	module.exports = PropertyConfig;
	
});


RequireJS.addFunction('./app-src/three-d/models/pull.js',
function (require, exports, module) {
	

	const CSG = require('../../../public/js/3d-modeling/csg');
	
	function pull(length, height) {
	  var rspx = length - .75;
	  var h = height-.125;
	  var gerth = .27
	  // var rCyl = CSG.cylinder({start: [rspx, .125, .125-height], end: [rspx, .125, .125], radius: .25})
	  // var lCyl = CSG.cylinder({start: [.75, .125, .125 - height], end: [.75, .125, .125], radius: .25})
	  // var mainCyl = CSG.cylinder({start: [0, .125, .125], end: [length, .125, .125], radius: .25})
	  var rCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/2, 0, h/-2]});
	  var lCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/-2, 0, h/-2]});
	  var mainCyl = CSG.cube({demensions: [length, gerth, gerth], center: [0, 0, 0]});
	
	  return mainCyl.union(lCyl).union(rCyl);
	}
	module.exports = pull
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/cutter.js',
function (require, exports, module) {
	

	
	const Assembly = require('../assembly.js');
	
	class Cutter extends Assembly {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
	    super(partCode, partName, centerStr, demensionStr, rotationStr);
	    this.included(false);
	  }
	}
	Cutter.abbriviation = 'cut';
	
	module.exports = Cutter;
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/divider.js',
function (require, exports, module) {
	

	
	const Assembly = require('../assembly.js');
	
	class Divider extends Assembly {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
	    super(partCode, partName, centerStr, demensionStr, rotationStr);
	  }
	}
	Divider.count = 0;
	
	Divider.abbriviation = 'dv';
	
	module.exports = Divider
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/cabinet.js',
function (require, exports, module) {
	

	
	const Assembly = require('../assembly.js');
	const cabinetBuildConfig = require('../../../../public/json/cabinets.json');
	const Joint = require('../../joint/joint.js');
	const DivideSection = require('./section/space/sections/divide-section.js');
	const Measurement = require('../../../../../../public/js/utils/measurement.js');
	const PropertyConfig = require('../../../config/property/config.js');
	
	const OVERLAY = {};
	OVERLAY.FULL = 'Full';
	OVERLAY.HALF = 'Half';
	OVERLAY.INSET = 'Inset';
	
	const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};
	
	class Cabinet extends Assembly {
	  constructor(partCode, partName, propsId) {
	    super(partCode, partName);
	    Object.getSet(this, {_DO_NOT_OVERWRITE: true}, 'length', 'width', 'thickness');
	    Object.getSet(this, 'propertyId', 'name');
	    this.propertyId(propsId);
	    const instance = this;
	    let toeKickHeight = 4;
	    this.part = false;
	    this.display = false;
	    this.overlay = OVERLAY.HALF;
	    this.openings = [];
	    this.type = CABINET_TYPE.FRAMED;
	    const panels = 0;
	    const framePieces = 0;
	    const addFramePiece = (piece) => framePieces.push(piece);
	    const framePieceCount = () => pieces.length;
	    const addPanel = (panel) => panels.push(panel);
	    const panelCount = () => panels.length;
	
	    const resolveOuterReveal = (panel, location) => {
	      const propConfig = this.rootAssembly().propertyConfig;
	      if (propConfig.isInset()) {
	        return new Measurement(-1 * props.Inset.is.value()).value();
	      }
	      const definedValue = panel.railThickness() - panel.value(location);
	      let calculatedValue;
	      if (this.rootAssembly().propertyConfig.isRevealOverlay()) {
	        calculatedValue = panel.railThickness() - propConfig.reveal();
	      } else {
	        calculatedValue = propConfig.overlay();
	      }
	      return calculatedValue < definedValue ? calculatedValue : definedValue;
	    }
	
	    this.borders = (borderIds) => {
	      const borders = {};
	      borders.right = instance.getAssembly(borderIds.right);
	      borders.left = instance.getAssembly(borderIds.left);
	      borders.top = instance.getAssembly(borderIds.top);
	      borders.bottom = instance.getAssembly(borderIds.bottom);
	
	      const pb = instance.getAssembly(borderIds.back);
	
	      return () => {
	        const depth = pb.position().center('z') + pb.position().limits('-z');
	
	        const position = {};
	        const start = {};
	        if (this.propertyConfig.isRevealOverlay()) {
	          const revealProps = this.rootAssembly().propertyConfig.reveal();
	          position.right = borders.right.position().centerAdjust('x', '+z') - revealProps.rvr.value();
	          position.left = borders.left.position().centerAdjust('x', '-z') + revealProps.rvl.value();
	          position.top = borders.top.position().centerAdjust('y', '+z') - revealProps.rvt.value();
	          position.bottom = borders.bottom.position().centerAdjust('y', '-z') + revealProps.rvb.value();
	        } else if (this.propertyConfig.isInset()) {
	          const insetValue = this.rootAssembly().propertyConfig('Inset').is.value();
	          position.right = borders.right.position().centerAdjust('x', '-z') - insetValue;
	          position.left = borders.left.position().centerAdjust('x', '+z') + insetValue;
	          position.top = borders.top.position().centerAdjust('y', '-z') - insetValue;
	          position.bottom = borders.bottom.position().centerAdjust('y', '+z') + insetValue;
	        } else {
	          const ov = this.propertyConfig('Overlay').ov.value();
	          position.right = borders.right.position().centerAdjust('x', '-z') + ov;;
	          position.left = borders.left.position().centerAdjust('x', '+z') - ov;
	          position.top = borders.top.position().centerAdjust('y', '-z') + ov;
	          position.bottom = borders.bottom.position().centerAdjust('y', '+z') - ov;
	        }
	
	        position.front = 0;
	        position.back = pb.position().center('z') + pb.position().limits('-z');
	
	        return {borders, position, depth, borderIds};
	      }
	    }
	  }
	}
	
	Cabinet.build = (type, group, config) => {
	  const cabinet = new Cabinet('c', type);
	  cabinet.propertyConfig = group && group.propertyConfig ?
	                            group.propertyConfig : new PropertyConfig();
	  if (group) group.propertyConfig = cabinet.propertyConfig;
	  config ||= cabinetBuildConfig[type];
	  config.values.forEach((value) => cabinet.value(value.key, value.eqn));
	
	  config.subassemblies.forEach((subAssemConfig) => {
	    const type = subAssemConfig.type;
	    const name = subAssemConfig.name;
	    const demStr = subAssemConfig.demensions.join(',');
	    const centerStr = subAssemConfig.center.join(',');
	    const rotationStr = subAssemConfig.rotation.join(',');
	    const subAssem = Assembly.new(type, subAssemConfig.code, name, centerStr, demStr, rotationStr);
	    subAssem.partCode(subAssemConfig.code);
	    cabinet.addSubAssembly(subAssem);
	  });
	
	  config.joints.forEach((relationConfig) => {
	    const type = relationConfig.type;
	    const depth = relationConfig.depth;
	    const demensionToOffset = relationConfig.demensionToOffset;
	    const centerOffset = relationConfig.centerOffset;
	    const joint = Joint.new(type, relationConfig);
	    cabinet.addJoints(joint);
	  });
	
	  config.openings.forEach((idMap) => {
	    const divideSection = new DivideSection(cabinet.borders(idMap), cabinet);
	    cabinet.openings.push(divideSection);
	    cabinet.addSubAssembly(divideSection);
	  });
	  return cabinet;
	}
	
	Cabinet.fromJson = (assemblyJson, group) => {
	  const partCode = assemblyJson.partCode;
	  const partName = assemblyJson.partName;
	  const assembly = new Cabinet(partCode, partName);
	  assembly.name(assemblyJson.name);
	  assembly.length(assemblyJson.length);
	  assembly.width(assemblyJson.width);
	  assembly.propertyConfig = group.propertyConfig;
	  assembly.uniqueId(assemblyJson.uniqueId);
	  assembly.values = assemblyJson.values;
	  Object.values(assemblyJson.subassemblies).forEach((json) => {
	    const clazz = Assembly.class(json._TYPE);
	    json.parent = assembly;
	    if (clazz !== DivideSection) {
	      assembly.addSubAssembly(Object.fromJson(json));
	    } else {
	      const divideSection = clazz.fromJson(json, assembly);
	      assembly.openings.push(divideSection);
	      assembly.addSubAssembly(divideSection);
	    }
	  });
	  assembly.thickness(assemblyJson.thickness);
	  const joints = Object.fromJson(assemblyJson.joints);
	  assembly.addJoints.apply(assembly, joints);
	  return assembly;
	}
	Cabinet.abbriviation = 'c';
	
	// Cabinet.partCode = (assembly) => {
	//   const cabinet = assembly.getAssembly('c');
	//   if (cabinet) {
	//     const name = assembly.constructor.name;
	//     cabinet.partIndex = cabinet.partIndex || 0;
	//     return `${assembly.constructor.abbriviation}-${cabinet.partIndex++}`;
	//   }
	// }
	
	
	module.exports = Cabinet
	
});


RequireJS.addFunction('./app-src/objects/joint/joints/rabbet.js',
function (require, exports, module) {
	

	
	const Joint = require('../joint.js');
	
	class Rabbet extends Joint {
	  constructor(joinStr, defaultDepth, axis, centerOffset) {
	    super(joinStr);
	    this.maleOffset = (assembly) => {
	      return defaultDepth;
	    }
	
	    if (axis === undefined) return;
	
	    this.updatePosition = (position) => {
	      const direction = centerOffset[0] === '-' ? -1 : 1;
	      const centerAxis = centerOffset[1];
	      position.demension[axis] += defaultDepth;
	      position.center[centerAxis] += defaultDepth/2 * direction;
	    };
	  }
	}
	
	Joint.register(Rabbet);
	module.exports = Rabbet
	
	
	
	
	
});


RequireJS.addFunction('./app-src/objects/joint/joints/miter.js',
function (require, exports, module) {
	

	
	const Joint = require('../joint.js');
	
	class Miter extends Joint {
	  constructor(joinStr) {
	    super(joinStr);
	  }
	}
	
	Joint.register(Miter);
	module.exports = Miter
	
	
	
	
	
});


RequireJS.addFunction('./app-src/objects/joint/joints/dado.js',
function (require, exports, module) {
	
const approximate = require('./../../../../../../public/js/utils/approximate.js');
	
	
	const Joint = require('../joint.js');
	
	class Dado extends Joint {
	  constructor(malePartCode, femalePartCode) {
	    super(malePartCode, femalePartCode);
	
	    this.updatePosition = (position) => {
	      const direction = this.centerAxis()[0] === '-' ? -1 : 1;
	      const centerAxis = this.centerAxis()[1].toLowerCase();
	      const offset = this.parentAssembly().eval(this.maleOffset());
	      const demAxis = this.demensionAxis().toLowerCase();
	      position.demension[demAxis] = approximate(position.demension[demAxis] + offset);
	      position.center[centerAxis] = approximate(position.center[centerAxis] + (offset/2 * direction));
	    };
	
	  }
	}
	
	Joint.register(Dado);
	module.exports = Dado
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/panel.js',
function (require, exports, module) {
	

	
	const Assembly = require('../assembly.js');
	
	class Panel extends Assembly {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
	    super(partCode, partName, centerStr, demensionStr, rotationStr);
	
	    this.railThickness = () => this.thickness();
	    Object.getSet(this, {hasFrame: false});
	  }
	}
	
	Panel.abbriviation = 'pn';
	
	
	module.exports = Panel
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/frame.js',
function (require, exports, module) {
	

	
	const Assembly = require('../assembly.js');
	
	class Frame extends Assembly {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
	    super(partCode, partName, centerStr, demensionStr, rotationStr);
	  }
	}
	
	Frame.abbriviation = 'fr';
	
	
	module.exports = Frame
	
});


RequireJS.addFunction('./app-src/objects/joint/joints/butt.js',
function (require, exports, module) {
	

	
	const Joint = require('../joint.js');
	
	class Butt extends Joint {
	  constructor(joinStr) {
	    super(joinStr);
	  }
	}
	
	Joint.register(Butt);
	module.exports = Butt
	
	
	
	
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/section.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	const approximate = require('../../../../../../../public/js/utils/approximate.js');
	
	
	class Section extends Assembly {
	  constructor(isPartition, partCode, partName, sectionProperties, parent) {
	    super(partCode, partName);
	    this.setParentAssembly(parent);
	    this.setIndex = () => this.index = () => sectionProperties().index;
	    this.setIndex();
	    this.center = (attr) => {
	      const props = sectionProperties();
	      const topPos = props.borders.top.position();
	      const botPos = props.borders.bottom.position();
	      const leftPos = props.borders.left.position();
	      const rightPos = props.borders.right.position();
	      const center = {};
	      center.x = (!attr || attr === 'x') &&
	            leftPos.center('x') - ((leftPos.center('x') - rightPos.center('x')) / 2);
	      center.y = (!attr || attr === 'y') &&
	            botPos.center('y') + ((topPos.center('y') - botPos.center('y')) / 2);
	      center.z = (!attr || attr === 'z') &&
	            topPos.center('z');
	      return attr ? center[attr] : center;
	    }
	
	    const calculateRevealOffset = (border, direction) => {
	      const borderPos = border.position();
	      const propConfig = this.rootAssembly().propertyConfig;
	      const positive = direction.indexOf('-') === -1;
	      const axis = direction.replace(/\+|-/, '');
	      const magnitude = positive ? 1 : -1;
	      let borderOrigin = (magnitude > 0 ? borderPos.centerAdjust(`${axis}`, '+z') :
		                    borderPos.centerAdjust(`${axis}`, '-z'));
	      if (propConfig.isInset()) {
	        const insetValue = propConfig('Inset').is.value();
	        borderOrigin += magnitude * insetValue;
	      } else if (propConfig.isRevealOverlay()) {
	        let reveal = propConfig.reveal().r.value();
	        borderOrigin -= magnitude * (border.maxWidth() - reveal) / 2;
	      } else {
	        const overlay = propConfig('Overlay').ov.value();
	        borderOrigin -= magnitude * overlay;
	      }
	
	      return  borderOrigin;
	    }
	
	
	    this.outerSize = () => {
	      const props = sectionProperties();
	      const pos = props.position;
	
	      const top = props.borders.top;
	      const bot = props.borders.bottom;
	      const left = props.borders.left;
	      const right = props.borders.right;
	
	      const limits = {};
	      limits.x = approximate(pos.right || calculateRevealOffset(right, '-x'));
	      limits['-x'] = approximate(pos.left || calculateRevealOffset(left, '+x'));
	      limits.y = approximate(pos.top || calculateRevealOffset(top, '-y'));
	      limits['-y'] = approximate(pos.bottom || calculateRevealOffset(bot, '+y'));
	      limits['-z'] = approximate(top.position().limits('-z'));
	      limits.z = approximate(props.depth - limits['-z']);
	
	      const center = {};
	      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
	      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
	      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
	
	      const dems = {};
	      dems.x = limits.x - limits['-x'];
	      dems.y = limits.y - limits['-y'];
	      dems.z = props.depth;
	
	      return {limits, center, dems};
	    }
	
	    this.innerSize = () => {
	      const props = sectionProperties();
	      const topPos = props.borders.top.position();
	      const botPos = props.borders.bottom.position();
	      const leftPos = props.borders.left.position();
	      const rightPos = props.borders.right.position();
	      const x = rightPos.centerAdjust('x', '-z') - leftPos.centerAdjust('x', '+z');
	      const y = topPos.centerAdjust('y', '-z') - botPos.centerAdjust('y', '+z');
	      const z = topPos.center('z');
	      return {x,y,z};
	    }
	
	    this.isPartition = () => isPartition;
	    this.sectionProperties = sectionProperties;
	    this.constructorId = this.constructor.name;
	    this.part = false;
	    this.display = false;
	    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
	
	    ///////////////////////////////   Boundry Functions   //////////////////////
	    let coverCache;
	    this.coverable = () => {
	      const time = new Date().getTime();
	      if (!coverCache || coverCache.time < time + 200) {
	        const props = sectionProperties();
	        const pos = props.position;
	
	        const top = props.borders.top;
	        const bot = props.borders.bottom;
	        const left = props.borders.left;
	        const right = props.borders.right;
	
	        const limits = {};
	        limits.x = pos.right || calculateRevealOffset(right, '-x');
	        limits['-x'] = pos.left || calculateRevealOffset(left, '+x');
	        limits.y = pos.top || calculateRevealOffset(top, '-y');
	        limits['-y'] = pos.bottom || calculateRevealOffset(bot, '+y');
	        limits['-z'] = top.position().limits('-z');
	        limits.z = props.depth - limits['-z'];
	
	        const center = {};
	        center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
	        center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
	        center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
	
	        const dems = {};
	        dems.x = limits.x - limits['-x'];
	        dems.y = limits.y - limits['-y'];
	        dems.z = props.depth;
	
	        coverCache = {value: {limits, center, dems}, time};
	      }
	      return coverCache.value;
	    }
	
	    this.frameInner = () => {
	      const props = sectionProperties();
	      const pos = props.position;
	
	      const topPos = props.borders.top.position();
	      const botPos = props.borders.bottom.position();
	      const leftPos = props.borders.left.position();
	      const rightPos = props.borders.right.position();
	
	      const limits = {};
	      limits.x = leftPos.centerAdjust('x', '+x');
	      limits['-x'] = rightPos.centerAdjust('x', '-x');
	      limits.y = topPos.centerAdjust('y', '-y');
	      limits['-y'] = botPos.centerAdjust('y', '+y');
	      limits.z = top.position().limits('+z');
	      limits['-z'] = top.position().limits('-z');
	
	      const center = {};
	      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
	      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
	      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
	
	      const dems = {};
	      dems.x = limits.x - limits['-x'];
	      dems.y = limits.y - limits['-y'];
	      dems.z = props.depth;
	
	      return {limits, center, dems};
	    }
	
	    this.frameOuter = () => {
	      const props = sectionProperties();
	      const pos = props.position;
	
	      const topPos = props.borders.top.position();
	      const botPos = props.borders.bottom.position();
	      const leftPos = props.borders.left.position();
	      const rightPos = props.borders.right.position();
	
	      const limits = {};
	      limits.x = leftPos.centerAdjust('x', '-x');
	      limits['-x'] = rightPos.centerAdjust('x', '+x');
	      limits.y = topPos.centerAdjust('y', '+y');
	      limits['-y'] = botPos.centerAdjust('y', '-y');
	      limits.z = NaN;
	      limits['-z'] = NaN;
	
	      const center = {};
	      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
	      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
	      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
	
	      const dems = {};
	      dems.x = limits.x - limits['-x'];
	      dems.y = limits.y - limits['-y'];
	      dems.z = props.depth;
	
	      return {limits, center, dems};
	    }
	
	    this.panelOuter = () => {
	      const props = sectionProperties();
	      const pos = props.position;
	
	      const topPos = props.borders.top.position();
	      const botPos = props.borders.bottom.position();
	      const leftPos = props.borders.left.position();
	      const rightPos = props.borders.right.position();
	
	      const limits = {};
	      limits.x = rightPos.centerAdjust('x', '+z');
	      limits['-x'] = leftPos.centerAdjust('x', '-z');
	      limits.y = topPos.centerAdjust('y', '+z');
	      limits['-y'] = botPos.centerAdjust('y', '-z');
	      limits.z = NaN;
	      limits['-z'] = NaN;
	
	      const center = {};
	      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
	      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
	      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
	
	      const dems = {};
	      dems.x = limits.x - limits['-x'];
	      dems.y = limits.y - limits['-y'];
	      dems.z = props.depth;
	
	      return {limits, center, dems};
	    }
	
	    this.panelInner = () => {
	      const props = sectionProperties();
	      const pos = props.position;
	
	      const topPos = props.borders.top.position();
	      const botPos = props.borders.bottom.position();
	      const leftPos = props.borders.left.position();
	      const rightPos = props.borders.right.position();
	
	      const limits = {};
	      limits.x = leftPos.centerAdjust('x', '+x');
	      limits['-x'] = rightPos.centerAdjust('x', '-x');
	      limits.y = topPos.centerAdjust('y', '-y');
	      limits['-y'] = botPos.centerAdjust('y', '+y');
	      limits.z = top.position().limits('+z');
	      limits['-z'] = top.position().limits('-z');
	
	      const center = {};
	      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
	      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
	      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
	
	      const dems = {};
	      dems.x = limits.x - limits['-x'];
	      dems.y = limits.y - limits['-y'];
	      dems.z = props.depth;
	
	      return {limits, center, dems};
	    }
	  }
	}
	Section.isPartition = () => false;
	Section.abstractClasses = ['PartitionSection', 'OpeningCoverSection', 'SpaceSection']
	Section.sectionInstance = (clazz) => clazz.prototype instanceof Section &&
	  Section.abstractClasses.indexOf(clazz.name) === -1;
	Section.sections = () => Assembly.classList(Section.sectionInstance);
	Section.getSections = (isPartition) => {
	  const sections = [];
	  Section.sections().forEach((section) => {
	    const part = section.isPartition();
	    if(isPartition === undefined || part === isPartition) sections.push(section);
	  });
	  return sections;
	}
	Section.filePath = (filename) => `sections/${filename}`;
	
	Section.keys = () => Assembly.classIds(Section.sectionInstance);
	Section.new = function (constructorId) {
	  const section = Assembly.new.apply(null, arguments);
	  if (section instanceof Section) return section;
	  throw new Error(`Invalid section Id: '${constructorId}'`);
	}
	
	
	module.exports = Section
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/drawer/drawer-box.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	
	class DrawerBox extends Assembly {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
	    super(partCode, partName, centerStr, demensionStr, rotationStr);
	  }
	}
	
	DrawerBox.abbriviation = 'db';
	
	
	module.exports = DrawerBox
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/door/hinges.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	
	
	class Hinge extends Assembly {
	  constructor() {
	    super();
	  }
	}
	
	Hinge.abbriviation = 'hg';
	
	module.exports = Hinge
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/door/door-catch.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	
	
	class DoorCatch extends Assembly {
	  constructor() {
	    super();
	  }
	}
	
	module.exports = DoorCatch
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/door/door.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	const Handle = require('../hardware/pull.js');
	const pull = require('../../../../three-d/models/pull.js');
	
	
	class Door extends Assembly {
	  constructor(partCode, partName, coverCenter, coverDems, rotationStr) {
	    super(partCode, partName, coverCenter, coverDems, rotationStr);
	    let pull = new Handle(`${partCode}-dp`, 'Door.Handle', this, Handle.location.TOP_RIGHT);
	    this.pull = () => pull;
	    this.addSubAssembly(pull);
	  }
	}
	
	Door.abbriviation = 'dr';
	
	
	module.exports = Door
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/drawer/guides.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	
	
	class Guides extends Assembly {
	  constructor() {
	    super();
	  }
	}
	
	Guides.abbriviation = 'gu';
	
	
	module.exports = Guides
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/hardware/screw.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	
	
	class Screw extends Assembly {
	  constructor() {
	    super();
	  }
	}
	
	
	module.exports = Screw
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/hardware/pull.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	
	/*
	    a,b,c
	    d,e,f
	    g,h,i
	*/
	class Handle extends Assembly {
	  constructor(partCode, partName, door, location, index, count) {
	    let instance;
	    function rotationStr() {
	      if (!instance || !instance.location) return {x:0,y:0,z:0};
	      return instance.location && instance.location() && instance.location().rotate ?
	          {x: 0, y:0, z: 90} : {x: 0, y:0, z: 0};
	    }
	    function demensionStr(attr) {
	      if (!instance || !instance.location) return {x:0,y:0,z:0};
	      const dems = {x: 1, y: 9.6, z: 1.9};
	      return attr ? dems[attr] : dems;
	    }
	    function centerStr(attr) {
	      if (!instance || !instance.location) return {x:0,y:0,z:0};
	        let center = door.position().center();
	        let doorDems = door.position().demension();
	        let pullDems = instance.demensionStr();
	        center.z -= (doorDems.z + pullDems.z) / 2;
	
	        switch (instance.location()) {
	          case Handle.location.TOP_RIGHT:
	            center.x = center.x + doorDems.x / 2 +  edgeOffset;
	            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
	            break;
	          case Handle.location.TOP_LEFT:
	            center.x = center.x - doorDems.x / 2 -  edgeOffset;
	            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
	            break;
	          case Handle.location.BOTTOM_RIGHT:
	            center.x = center.x + doorDems.x / 2 -  edgeOffset;
	            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
	            break;
	          case Handle.location.BOTTOM_LEFT:
	            center.x = center.x + doorDems.x / 2 -  edgeOffset;
	            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
	            break;
	          case Handle.location.TOP:
	            center.x = offset(center.x, doorDems.x);
	            center.y -= doorDems.y / 2;
	            break;
	          case Handle.location.BOTTOM:
	            center.x = offset(center.x, doorDems.x);
	            center.y += doorDems.y / 2;
	            break;
	          case Handle.location.RIGHT:
	            center.y = offset(center.y, doorDems.y);
	            center.x += doorDems.x / 2;
	            break;
	          case Handle.location.LEFT:
	            center.y = offset(center.y, doorDems.y);
	            center.x -= doorDems.x / 2;
	            break;
	          case Handle.location.CENTER:
	            center.x = offset(center.x, doorDems.x);
	            break;
	          case undefined:
	            center.x = 0;
	            center.y = 0;
	            center.z = 0;
	            break;
	          default:
	            throw new Error('Invalid pull location');
	        }
	        return attr ? center[attr] : center;
	    };
	
	    super(partCode, 'Handle', centerStr, demensionStr, rotationStr);
	    // super(partCode, 'Handle', '0,0,0', '0,0,0', '0,0,0');
	    Object.getSet(this, {location});
	    this.setParentAssembly(door);
	    instance = this;
	    index = index || 0;
	    count = count || 1;
	
	    this.count = (c) => {
	      if (c > 0) {
	        count = c;
	      }
	      return count;
	    }
	
	    function offset(center, distance) {
	      const spacing = distance / count;
	      return center - (distance / 2) + spacing / 2 + spacing * (index);
	    }
	
	    const edgeOffset = 3.01625;
	    const toCenter = 4;
	  }
	}
	Handle.location = {};
	Handle.location.TOP_RIGHT = {rotate: true, position: 'TOP_Right'};
	Handle.location.TOP_LEFT = {rotate: true, position: 'TOP_LEFT'};
	Handle.location.BOTTOM_RIGHT = {rotate: true};
	Handle.location.BOTTOM_LEFT = {rotate: true};
	Handle.location.TOP = {multiple: true};
	Handle.location.BOTTOM = {multiple: true};
	Handle.location.RIGHT = {multiple: true};
	Handle.location.LEFT = {multiple: true};
	Handle.location.CENTER = {multiple: true};
	
	Handle.abbriviation = 'hn';
	
	
	module.exports = Handle
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/drawer/drawer-front.js',
function (require, exports, module) {
	

	
	const Assembly = require('../../assembly.js');
	const Handle = require('../hardware/pull.js');
	
	class DrawerFront extends Assembly {
	  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
	    super(partCode, partName, centerStr, demensionStr, rotationStr);
	    this.setParentAssembly(parent);
	    const instance = this;
	    let pulls = [new Handle(undefined, 'Drawer.Handle', this, Handle.location.CENTER, index, 1)];
	    if (demensionStr === undefined) return;
	    let handleCount = 1;
	
	    function pullCount() {
	      if (instance.demensionStr().x < 55.88) return 1;
	      return 2;
	    }
	
	    this.children = () => this.updateHandles();
	
	    this.updateHandles = (count) => {
	      count = count || pullCount();
	      pulls.splice(count);
	      for (let index = 0; index < count; index += 1) {
	        if (index === pulls.length) {
	          pulls.push(new Handle(undefined, 'Drawer.Handle', this, Handle.location.CENTER, index, count));
	        } else {
	          pulls[index].count(count);
	        }
	      }
	      return pulls;
	    };
	    // if (demensionStr !== undefined)this.updatePosition();
	  }
	}
	
	DrawerFront.abbriviation = 'df';
	
	
	module.exports = DrawerFront
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/space.js',
function (require, exports, module) {
	

	
	const Section = require('../section.js');
	const Assembly = require('../../../assembly.js');
	
	class SpaceSection extends Section {
	  constructor(partCode, partName, sectionProperties, parent) {
	    super(false, partCode, partName, sectionProperties, parent);
	    if ((typeof sectionProperties) !== 'function')
	      Object.getSet(this, 'index');
	    else
	      Object.getSet(this, 'borderIds', 'index');
	    this.setIndex();
	    // this.important = ['partCode', 'partName', 'index'];
	    this.borderIds = () => sectionProperties().borderIds;
	    const instance = this;
	
	    const parentValue = this.value;
	    this.value = (attr, value) => {
	      if ((typeof sectionProperties) !== 'function') return;
	      const props = sectionProperties();
	      const top = props.borders.top;
	      const bottom = props.borders.bottom;
	      const right = props.borders.right;
	      const left = props.borders.left;
	      let panel;
	      switch (attr) {
	        case 'opt':
	          if (props.position.top) return props.position.top;
	          return top.position().center('y');
	        case 'opb':
	          if (props.position.bottom) return props.position.bottom;
	          return bottom.position().center('y');
	        case 'opr':
	          if (props.position.right) return props.position.right;
	          return right.position().center('x');
	        case 'opl':
	          if (props.position.left) return props.position.left;
	          return left.position().center('x');
	        case 'fpt':
	          return top.position().center('y') - top.width() / 2;
	        case 'fpb':
	          return bottom.position().center('y') + bottom.width() / 2;
	        case 'fpr':
	          return right.position().center('x') - right.width() / 2;
	        case 'fpl':
	          return left.position().center('x') + left.width() / 2;
	        case 'ppt':
	          panel = top.getAssembly(top.partCode.replace(/f/, 'p'));
	          return panel === undefined ?
	            top.position().centerAdjust('y', '-x') :
	            panel.position().centerAdjust('y', '-z');
	        case 'ppb':
	          panel = bottom.getAssembly(bottom.partCode.replace(/f/, 'p'));
	          return panel === undefined ?
	            bottom.position().centerAdjust('y', '+x') :
	            panel.position().centerAdjust('y', '+z');
	        case 'ppr':
	          panel = right.getAssembly(right.partCode.replace(/f/, 'p'));
	          return panel === undefined ?
	            right.position().centerAdjust('x', '-x') :
	            panel.position().centerAdjust('x', '-z');
	        case 'ppl':
	          panel = left.getAssembly(left.partCode.replace(/f/, 'p'));
	          return panel === undefined ?
	            left.position().centerAdjust('x', '+x') :
	            panel.position().centerAdjust('x', '+z');
	        default:
	          return parentValue(attr, value);
	      }
	    }
	  }
	}
	
	SpaceSection.fromJson = (json, parent) => {
	  const sectionProps = json.parent.borders(json.borderIds || json.index);
	  const assembly = json._TYPE !== 'DivideSection' ?
	          Assembly.new(json._TYPE, json.partCode, sectionProps, parent) :
	          Assembly.new(json._TYPE, sectionProps, parent);
	  assembly.partCode(json.partCode);
	  assembly.partName(json.partName);
	  assembly.uniqueId(json.uniqueId);
	  assembly.values = json.values;
	  // Object.values(json.subassemblies).forEach((json) => {
	  //   console.log(json._TYPE);
	  //   json.sectionProps = sectionProps();
	  //   assembly.addSubAssembly(Assembly.class(json._TYPE)
	  //                             .fromJson(json, assembly));
	  //                           });
	  return assembly;
	}
	
	
	module.exports = SpaceSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/partition/partition.js',
function (require, exports, module) {
	

	
	const Section = require('../section.js');
	const Assembly = require('../../../assembly.js');
	
	class PartitionSection extends Section {
	  constructor(partCode, partName, sectionProperties) {
	    super(true, partCode, partName, sectionProperties);
	    Object.getSet(this, 'index');
	    this.setIndex();
	
	    const parentToJson = this.toJson;
	    this.toJson = () => {
	      const json = parentToJson();
	      delete json.subassemblies;
	      return json;
	    }
	  }
	}
	
	PartitionSection.isPartition = () => true;
	
	PartitionSection.fromJson = (json) => {
	  const sectionProps = json.parent.dividerProps(json.index);
	  const assembly = Assembly.new(json._TYPE, json.partCode, sectionProps, json.parent);
	  assembly.partCode(json.partCode);
	  assembly.partName(json.partName);
	  assembly.uniqueId(json.uniqueId);
	  assembly.values = json.values;
	  return assembly;
	}
	module.exports = PartitionSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/partition/sections/divider.js',
function (require, exports, module) {
	

	
	const PartitionSection = require('../partition.js');
	const Divider = require('../../../divider.js');
	const Position = require('../../../../../../position.js');
	const Panel = require('../../../panel.js');
	const Frame = require('../../../frame.js');
	const Assembly = require('../../../../assembly.js');
	const Joint = require('../../../../../joint/joint');
	
	class DividerSection extends PartitionSection {
	  constructor(partCode, sectionProperties, parent) {
	    super(partCode, 'Divider', sectionProperties, parent);
	    if (sectionProperties === undefined) return;
	    this.setParentAssembly(parent);
	    const props = sectionProperties;
	    const instance = this;
	    let panel;
	
	    function jointOffset(props) {
	      instance.getAssembly('c').joints
	      if (panel && panel.joints.length < 1) {
	        const pc = panel.partCode();
	        panel.joints = [
	          new Joint(pc, props.borders.top.partCode()),
	          new Joint(pc, props.borders.bottom.partCode()),
	          new Joint(pc, props.borders.left.partCode()),
	          new Joint(pc, props.borders.right.partCode())
	        ];
	        panel.joints.forEach((j) => j.parentAssemblyId(panel.uniqueId()));
	      }
	      return 0.9525;
	    }
	
	    this.position().center = (attr) => {
	      const center = props().center;
	      return attr ? center[attr] : center;
	    };
	    this.position().demension = (attr) =>
	      Position.targeted(attr, () => this.value('frw'),
	          () => props().dividerLength / 2, () => this.value('frt'));
	    const panelCenterFunc = (attr) => {
	      const props = sectionProperties();
	      const dem = {
	        x: props.center.x,
	        y: props.center.y,
	        z: props.depth / 2
	      };
	      return attr ? dem[attr] : dem;
	    };
	    const panelDemFunc = (attr) => {
	      if (attr === 'z') return this.value('pwt34');
	      const props = sectionProperties();
	      const dem = {
	        x: props.depth,
	        y: props.dividerLength + jointOffset(props) * 2,
	        z: this.value('pwt34')
	      };
	      return attr ? dem[attr] : dem;
	    };
	    const panelRotFunc = () => {
	      const isVertical = sectionProperties().vertical;
	      if (isVertical) return {x: 90, y: 90, z: 90};
	      else return {x: 90, y: 90, z: 0};
	    }
	
	    // const frameCenterFunc = (attr) => {
	    //   const props = sectionProperties();
	    //   const dem = {
	    //     x: props.center.x,
	    //     y: props.center.y,
	    //     z: props.center.z
	    //   };
	    //   return attr ? dem[attr] : dem;
	    // };
	    //
	    // const frameDemFunc = (attr) => {
	    //   const reqHeight = attr === 'y' || attr === undefined;
	    //   const dem = {
	    //     x: this.value('frw'),
	    //     y: reqHeight ? sectionProperties().dividerLength : undefined,
	    //     z: this.value('frt'),
	    //   };
	    //   return attr ? dem[attr] : dem;
	    // }
	    //
	    // const frameRotFunc = () => props().rotationFunc();
	
	    const lastWidthCalc = {date: Number.MAX_SAFE_INTEGER};
	    this.maxWidth = () => {
	      const currentDate = new Date().getTime();
	      if (lastWidthCalc.date < currentDate + 1000) {
	        return lastWidthCalc.value;
	      }
	      if (!panel.included && !frame.included) return 0;
	
	      let value;
	      const panelWidth = panel.position().demension('z');
	      // const frameWidth = frame.position().demension('x');
	      // if (value === undefined && !frame.included) return panelWidth;
	      // if (value === undefined && !panel.included) return frameWidth;
	      // if (value === undefined) value = panelWidth > frameWidth ? panelWidth : frameWidth;
	      lastWidthCalc.date = currentDate;
	      lastWidthCalc.value = panelWidth;
	      return lastWidthCalc.value;
	    }
	
	    const index = props().index;
	    panel = new Panel(`dp-${index}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc);
	    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
	    this.addSubAssembly(panel);
	    // this.addSubAssembly(frame);
	  }
	}
	
	DividerSection.abbriviation = 'dvrs';
	
	
	module.exports = DividerSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/sections/divide-section.js',
function (require, exports, module) {
	

	
	const SpaceSection = require('../space.js');
	const Pattern = require('../../../../../../division-patterns.js');
	const DividerSection = require('../../partition/sections/divider.js');
	const Section = require('../../section.js');
	const Assembly = require('../../../../assembly.js');
	
	function sectionId(parent, sectionProperties) {
	
	}
	
	let dvs;
	let dsCount = 0;
	class DivideSection extends SpaceSection {
	  constructor(sectionProperties, parent) {
	    const pId = parent && parent.uniqueId ? parent.uniqueId() : null;
	    const sIndex = (typeof sectionProperties) === 'function' ? sectionProperties().index : null;
	    super(`dvds-${pId}-${sIndex}`, 'divideSection', sectionProperties, parent);
	    // this.important = ['partCode', 'partName', 'borderIds', 'index'];
	    const instance = this;
	    dvs = dvs || this;
	    let pattern;
	    let sectionCount = 1;
	    this.vertical = (is) => instance.value('vertical', is);
	    this.vertical(true);
	    this.sections = [];
	    this.pattern = (patternStr) => {
	      if ((typeof patternStr) === 'string') {
	        sectionCount = patternStr.length;
	        this.divide(sectionCount - 1);
	        pattern = new Pattern(patternStr);
	      } else {
	        if (!pattern || pattern.str.length !== sectionCount)
	          pattern = new Pattern(new Array(sectionCount).fill('a').join(''));
	      }
	      return pattern;
	    }
	    this.dividerCount = () => this.init() && Math.ceil((this.sections.length - 1) / 2);
	    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
	    this.sectionProperties = () => JSON.stringify(sectionProperties);
	    this.init = () => {
	      if (this.sections.length === 0) {
	        this.sections.push(new DivideSection(this.borders(0), this));
	      }
	      return true;
	    }
	
	    // TODO: will break in future should be calling getJoints.. recursive iissue;
	    this.getJoints = () => {
	      let joints = [];
	      this.children().forEach((child) => joints = joints.concat(child.joints));
	      return joints;
	    }
	    this.children = () => this.sections;
	    this.partitions = () => this.sections.filter((e, index) => index % 2 === 1);
	    this.spaces = () => this.sections.filter((e, index) => index % 2 === 0);
	    this.borders = (index) => {
	      return () => {
	        // if (index === 1) {
	        //   console.log('center');
	        // }
	        const props = sectionProperties();
	        const position = {
	          front: props.position.front,
	          back: props.position.back,
	          top: props.position.top,
	          bottom: props.position.bottom,
	          left: props.position.left,
	          right: props.position.right
	        };
	
	        let top = props.borders.top;
	        let bottom = props.borders.bottom;
	        let left = props.borders.left;
	        let right = props.borders.right;
	        if (this.vertical()) {
	          if (index !== 0) {
	            left = this.sections[index - 1];
	            position.left = undefined;
	          } if (this.sections[index + 1] !== undefined) {
	            right = this.sections[index + 1];
	            position.right = undefined;
	          }
	        } else {
	          if (index !== 0) {
	            top = this.sections[index - 1];
	            position.top = undefined;
	          } if (this.sections[index + 1] !== undefined) {
	            bottom = this.sections[index + 1];
	            position.bottom = undefined;
	          }
	        }
	
	        const depth = props.depth;
	        if (!top || !bottom || !right || !left)
	          throw new Error('Border not defined');
	        return {borders: {top, bottom, right, left}, position, depth, index};
	      }
	    }
	    this.dividerProps = (index) => {
	      return () => {
	        // if (index === 1) {
	        //   console.log('center');
	        // }
	        const answer = this.dividerLayout().list;
	        let offset = this.dividerOffset(index * 2);
	        for (let i = 0; i < index + 1; i += 1) offset += answer[i];
	        let props = sectionProperties();
	        const innerSize = this.innerSize();
	        let center = this.center();
	        let dividerLength;
	        if (this.vertical()) {
	          const start = props.borders.left.position().centerAdjust('x', '-z');
	          center.x = start + offset;
	          dividerLength = innerSize.y;
	        } else {
	          const start = props.borders.top.position().centerAdjust('y', '+z');
	          center.y = start - offset;
	          dividerLength = innerSize.x;
	        }
	        const rotationFunc = () =>  this.vertical() ? {x: 0, y:0, z: 0} : {x: 0, y:0, z: 90};
	
	        const depth = props.depth;
	        const vertical = this.vertical();
	        const borders = props.borders;
	        return {center, dividerLength, rotationFunc, index, depth, vertical, borders};
	      }
	    }
	
	    this.dividerOffset = (limitIndex) => {
	      limitIndex = limitIndex > -1 && limitIndex < this.sections.length ? limitIndex : this.sections.length;
	      let cov = this.coverable();
	      let frOut = this.panelOuter();
	      let offset = this.isVertical() ? cov.limits['-x'] - frOut.limits['-x'] : frOut.limits.y - cov.limits.y;
	      for (let index = 0; index < limitIndex + 2; index += 1) {
	        const section = this.sections[index];
	        if (section instanceof DividerSection) {
	          const maxWidth = section.maxWidth();
	          let halfReveal;
	          if (this.rootAssembly().propertyConfig.isRevealOverlay()) {
	            halfReveal = this.rootAssembly().propertyConfig.reveal().r.value() / 2;
	          } else if (this.rootAssembly().propertyConfig.isInset()) {
	            const insetValue = this.rootAssembly().propertyConfig('Inset').is.value();
	            halfReveal = (section.maxWidth() + insetValue * 2) / 2;
	          } else {
	            halfReveal = (maxWidth - this.rootAssembly().propertyConfig.overlay() * 2)/2;
	          }
	          offset += index < limitIndex ? halfReveal*2 : halfReveal;
	        }
	      }
	      return offset;
	    }
	
	    this.dividerReveal = (limitIndex) => {
	      limitIndex = limitIndex > -1 && limitIndex < this.sections.length ? limitIndex : this.sections.length;
	      let offset = 0;
	      for (let index = 0; index < limitIndex; index += 1) {
	        const section = this.sections[index];
	        if (section instanceof DividerSection) {
	          if (this.rootAssembly().propertyConfig.isRevealOverlay()) {
	            offset += this.rootAssembly().propertyConfig.reveal().r.value();
	          }  else if (this.rootAssembly().propertyConfig.isInset()) {
	            const insetValue = this.rootAssembly().propertyConfig('Inset').is.value();
	            offset += section.maxWidth() + insetValue * 2;
	          } else {
	            offset += section.maxWidth();
	            offset -= this.rootAssembly().propertyConfig.overlay() * 2;
	          }
	        }
	      }
	      return offset;
	    }
	
	    this.sectionCount = () => this.dividerCount() + 1;
	    this.dividerLayout = () => {
	      let distance;
	      const coverable = this.coverable();
	      distance = this.vertical() ? coverable.dems.x : coverable.dems.y;
	      distance -= this.dividerReveal();
	      return this.pattern().calc(distance);
	    };
	    this.divide = (dividerCount) => {
	      if (!Number.isNaN(dividerCount)) {
	        dividerCount = dividerCount > 10 ? 10 : dividerCount;
	        dividerCount = dividerCount < 0 ? 0 : dividerCount;
	        const currDividerCount = this.dividerCount();
	        if (dividerCount < currDividerCount) {
	          const diff = currDividerCount - dividerCount;
	          this.sections.splice(dividerCount * 2 + 1);
	          return true;
	        } else {
	          const diff = dividerCount - currDividerCount;
	          for (let index = currDividerCount; index < dividerCount; index +=1) {
	            this.sections.push(new DividerSection(`dv-${this.uniqueId()}-${index}`, this.dividerProps(index), instance));
	            const divideIndex = dividerCount + index + 1;
	            this.sections.push(new DivideSection(this.borders(divideIndex), instance));
	          }
	          return diff !== 0;
	        }
	      }
	      return false;
	    }
	    this.setSection = (constructorIdOobject, index) => {
	      let section;
	      index = Number.parseInt(index);
	      if ((typeof constructorIdOobject) === 'string') {
	        if (constructorIdOobject === 'DivideSection') {
	          section = new DivideSection(this.borders(index), instance);
	        } else {
	          section = Section.new(constructorIdOobject, 'dr', this.borders(index), this);
	        }
	      } else {
	        section = constructorIdOobject;
	      }
	      this.sections[index] = section;
	    }
	    this.size = () => {
	      return {width: this.width, height: this.height};
	    }
	    this.sizes = () => {
	      return 'val';
	    }
	    const assemToJson = this.toJson;
	    this.toJson = () => {
	      const json = assemToJson.apply(this);
	      json.pattern = this.pattern().toJson();
	      json.subassemblies = this.sections.map((section) => section.toJson());
	      return json;
	    }
	  }
	}
	
	DivideSection.fromJson = (json) => {
	  const sectionProps = json.parent.borders(json.borderIds || json.index);
	  const assembly = new DivideSection(sectionProps, json.parent);
	  assembly.partCode(json.partCode);
	  assembly.uniqueId(json.uniqueId)
	  assembly.index(json.index);
	  const subAssems = json.subassemblies;
	  assembly.values = json.values;
	  for (let index = 0; index < subAssems.length / 2; index += 1) {
	    const partIndex = index * 2 + 1;
	    if (partIndex < subAssems.length) {
	      const partJson = subAssems[partIndex];
	      partJson.parent = assembly;
	      const partition = Assembly.class(partJson._TYPE).fromJson(partJson, assembly);
	      assembly.setSection(partition, partIndex);
	    }
	
	    const spaceIndex = index * 2;
	    const spaceJson = subAssems[spaceIndex];
	    spaceJson.index = spaceIndex;
	    spaceJson.parent = assembly;
	    const space = Assembly.class(spaceJson._TYPE).fromJson(spaceJson, assembly);
	    assembly.setSection(space, spaceIndex);
	  }
	  assembly.pattern(json.pattern.str);
	  const pattern = assembly.pattern();
	  const patternIds = Object.keys(json.pattern.values);
	  patternIds.forEach((id) => pattern.value(id, json.pattern.values[id]));
	  return assembly;
	}
	
	DivideSection.abbriviation = 'ds';
	
	
	module.exports = DivideSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/sections/open-cover/open-cover.js',
function (require, exports, module) {
	

	
	const SpaceSection = require('../../space.js');
	const PULL_TYPE = require('../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
	const Handle = require('../../../../hardware/pull.js');
	const Door = require('../../../../door/door.js');
	const Assembly = require('../../../../../assembly.js');
	
	
	class OpeningCoverSection extends SpaceSection {
	  constructor(partCode, partName, divideProps, parent, pullType) {
	    super(partCode, partName, divideProps, parent);
	    const instance = this;
	
	    pullType = pullType || PULL_TYPE.DOOR;
	    let pulls = [];
	
	    this.setHandleType = (pt) => pullType = pt;
	    if (divideProps === undefined) return;
	
	    this.updateHandles = (count) => {
	      pulls = [];
	      if (pullType === PULL_TYPE.DRAWER) {
	        count = count || instance.drawerHandleCount();
	        for (let index = 0; index < count; index += 1) {
	          pulls.push(new Handle(`dwp-${index}`, 'Drawer.Handle', instance.drawerHandleCenter(index, count), instance.pullDems));
	        }
	      } else {
	        pulls.push(new Handle(`dp`, 'Door.Handle', instance.doorHandleCenter, instance.pullDems, 'z'));
	      }
	    }
	
	    this.coverDems = function(attr) {
	      const dems = instance.coverable().dems;
	      // const inset = instance.rootAssembly().propertyConfig.isInset();
	      // const dems = inset ? instance.innerSize() : instance.outerSize().dems;
	      // TODO: access User Defined variable
	      dems.z = (3/4) * 2.54;
	      return attr ? dems[attr] : dems;
	    }
	
	    this.coverCenter = function (attr) {
	      const center = instance.outerSize().center;
	      const inset = instance.rootAssembly().propertyConfig.isInset();
	      // TODO access user defined values;
	      const reveal = inset ? 3/32 : 3/4;
	      center.z = (reveal * 2.54) / -2;
	      // if (true || center.z !== 1.905) console.log('wrong: ', center.z);
	      return attr ? center[attr] : center;
	    }
	
	    this.hingeSide = () => {
	      const props = divideProps();
	      return props.borders.right.partCode === 'fr' ? '+x' : '-x';
	    }
	
	
	    // TODO: add duel door gap variable
	    const gap = 2.54/16 ;
	    function duelDoorDems() {
	      const dems = instance.coverDems();
	      dems.x = (dems.x - gap) / 2;
	      return dems;
	    }
	    this.duelDoorDems = duelDoorDems;
	
	    function duelDoorCenter(right) {
	      return function () {
	        const direction = right ? -1 : 1;
	        const center = instance.coverCenter();
	        const dems = duelDoorDems();
	        center.x += (dems.x + gap) / 2 * direction;
	        return center;
	      }
	    }
	    this.duelDoorCenter = duelDoorCenter;
	
	    function closest(target) {
	      let winner = {value: arguments[1], diff: Math.abs(target - arguments[1])};
	      for (let index = 2; index < arguments.length; index += 1) {
	        const value = arguments[index];
	        const diff = Math.abs(target - value);
	        if (diff < winner.diff) {
	          winner = {diff, value}
	        }
	      }
	      return winner.value;
	    }
	
	    this.drawerHandleCenter = (index, count) =>
	      (attr) => {
	        const center = instance.coverCenter(attr);
	        const dems = instance.coverDems();
	        const spacing = (dems.x / (count));
	        center.x += -(dems.x/2) + spacing / 2 + spacing * (index);
	        center.z -= (instance.coverDems('z') + dems.z) / 2;
	        return center;
	    };
	
	    this.pullDems = (attr) => {
	      const dems = {x: 1, y: 5, z: 2};
	      return attr ? dems[attr] : dems;
	    }
	
	    this.doorHandleCenter = () => {
	      const idealHandleHeight = instance.value('iph');
	      const dems = this.coverDems();
	      const center = this.coverCenter();
	      const top = center.y +  dems.y / 2 - 4;
	      const bottom = center.y -  dems.y / 2 + 4;
	      const xOffset = dems.x / 2 - 1.5;
	      center.x = center.x - xOffset * (this.hingeSide() === '-x' ? 1 : -1);
	      center.y = closest(idealHandleHeight, top, center.y, bottom);
	      center.z -= (instance.coverDems('z') + dems.z) / 2;
	      return center;
	    }
	
	    const parentToJson = this.toJson;
	    this.toJson = () => {
	      const json = parentToJson();
	      delete json.subassemblies;
	      return json;
	    }
	
	  }
	}
	
	OpeningCoverSection.dontSaveChildren = true;
	
	
	module.exports = OpeningCoverSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/sections/open-cover/sections/drawer.js',
function (require, exports, module) {
	

	
	const OpeningCoverSection = require('../open-cover.js');
	const Section = require('../../../../section.js');
	const PULL_TYPE = require('../../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
	const DrawerBox = require('../../../../../drawer/drawer-box.js');
	const DrawerFront = require('../../../../../drawer/drawer-front.js');
	const Assembly = require('../../../../../../assembly.js');
	
	class DrawerSection extends OpeningCoverSection {
	  constructor(partCode, divideProps, parent) {
	    super(partCode, 'Drawer.Section', divideProps, parent, PULL_TYPE.DRAWER);
	    if (divideProps === undefined) return;
	    const instance = this;
	
	    function getDrawerDepth(depth) {
	      if (depth < 3) return 0;
	      return (Math.ceil((depth / 2.54 - 1)/2) * 2) * 2.54;
	    }
	
	    function drawerCenter(attr) {
	      const props = divideProps();
	      const dems = drawerDems();
	      const center = instance.center();
	      center.z = props.position.front + (dems.z) / 2 - 1/8;
	      return attr ? center[attr] : center;
	    }
	
	    function drawerDems(attr) {
	      const props = divideProps();
	      const dems = instance.innerSize()
	      // TODO add box depth tolerance variable
	      dems.z = getDrawerDepth(props.depth - 2.54);
	      dems.x = dems.x - 0.9525;
	      dems.y = dems.y - 2.54;
	      return attr ? dems[attr] : dems;
	    }
	
	    this.addSubAssembly(new DrawerBox('db', 'Drawer.Box', drawerCenter, drawerDems));
	    this.addSubAssembly(new DrawerFront('df', 'Drawer.Front', this.coverCenter, this.coverDems, '', this));
	  }
	}
	
	DrawerSection.abbriviation = 'dws';
	
	
	module.exports = DrawerSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/sections/open-cover/sections/door.js',
function (require, exports, module) {
	

	
	const OpeningCoverSection = require('../open-cover.js');
	const Door = require('../../../../../door/door.js');
	const Assembly = require('../../../../../../assembly.js');
	
	class DoorSection extends OpeningCoverSection {
	  constructor(partCode, divideProps, parent) {
	    super(partCode, 'Door.Section', divideProps, parent);
	    const door = new Door('d', 'Door', this.coverCenter, this.coverDems);
	    this.door = () => door;
	    this.pull = () => door.pull();
	    this.addSubAssembly(new Door('d', 'Door', this.coverCenter, this.coverDems));
	  }
	}
	
	DoorSection.abbriviation = 'drs';
	
	module.exports = DoorSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/sections/open-cover/sections/false-front.js',
function (require, exports, module) {
	

	
	const OpeningCoverSection = require('../open-cover.js');
	const Section = require('../../../../section.js');
	const PULL_TYPE = require('../../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
	const DrawerFront = require('../../../../../drawer/drawer-front.js');
	const Assembly = require('../../../../../../assembly.js');
	
	class FalseFrontSection extends OpeningCoverSection {
	  constructor(partCode, divideProps, parent) {
	    super(partCode, 'False.Front.Section', divideProps, parent, PULL_TYPE.DRAWER);
	    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', this.coverCenter, this.coverDems, '', this));
	  }
	}
	
	FalseFrontSection.abbriviation = 'ffs';
	
	
	module.exports = FalseFrontSection
	
});


RequireJS.addFunction('./app-src/objects/assembly/assemblies/section/space/sections/open-cover/sections/duel-door.js',
function (require, exports, module) {
	

	
	const OpeningCoverSection = require('../open-cover.js');
	const Door = require('../../../../../door/door.js');
	const Handle = require('../../../../../hardware/pull.js');
	const Assembly = require('../../../../../../assembly.js');
	
	class DualDoorSection extends OpeningCoverSection {
	  constructor(partCode, divideProps, parent) {
	    super(partCode, 'Duel.Door.Section', divideProps, parent);
	    if (divideProps === undefined) return;
	    const rightDoor = new Door('dr', 'DoorRight', this.duelDoorCenter(), this.duelDoorDems);
	    this.addSubAssembly(rightDoor);
	    rightDoor.pull().location(Handle.location.TOP_LEFT);
	
	    const leftDoor = new Door('dl', 'DoorLeft', this.duelDoorCenter(true), this.duelDoorDems);
	    this.addSubAssembly(leftDoor);
	    leftDoor.pull().location(Handle.location.TOP_RIGHT);
	  }
	}
	
	DualDoorSection.abbriviation = 'dds';
	
	
	module.exports = DualDoorSection
	
});


RequireJS.addFunction('./test/run.js',
function (require, exports, module) {
	

	
	const EPNTS = require('../generated/EPNTS.js');
	const Test = require('../../../public/js/utils/test/test').Test;
	
	if (EPNTS.getEnv() === 'local') {
	  require('./tests/to-from-json');
	  require('../../../public/js/utils/test/tests/decision-tree');
	  require('../../../public/js/utils/test/tests/logic-tree');
	  require('./tests/polygon-merge');
	  require('./tests/line-consolidate');
	}
	
	Test.run();
	
});


RequireJS.addFunction('./test/tests/polygon-merge.js',
function (require, exports, module) {
	
const Test = require('../../../../public/js/utils/test/test').Test;
	const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
	
	
	const B = new Polygon3D([[0,1,0],[1,1,0],[1,3,0],[0,3,0]])
	const C = new Polygon3D([[0,4,0],[2,4,0],[2,6,0],[0,6,0]]);
	const A = new Polygon3D([[0,0,0],[0,1,0],[1,1,0],[4,1,0],[4,0,0]]);
	const D = new Polygon3D([[0,6,0],[0,8,0],[3,8,0],[3,7,0],[3,6,0],[2,6,0]]);
	const E = new Polygon3D([[3,8,0],[1,10,0],[0,8,0]]);
	const F = new Polygon3D([[6,7,0],[6,8,0],[6,10,0],[8,10,0],[8,7,0]]);
	const G = new Polygon3D([[4,7,0],[4,6,0],[3,6,0],[3,7,0]]);
	const H = new Polygon3D([[6,4,0],[4,4,0],[2,4,0],[2,6,0],[3,6,0],[4,6,0],[6,6,0]]);
	const I = new Polygon3D([[4,7,0],[4,8,0],[6,8,0],[6,7,0]]);
	const J = new Polygon3D([[4,0,0],[4,1,0],[4,4,0],[6,4,0],[6,0,0]])
	
	const polyAB = new Polygon3D([[1,3,0],[0,3,0],[0,1,0],[0,0,0],[4,0,0],[4,1,0],[1,1,0]]);
	const polyIF = new Polygon3D([[6,10,0],[6,8,0],[4,8,0],[4,7,0],[6,7,0],[8,7,0],[8,10,0]]);
	const polyABCDEGHJ = new Polygon3D([[1,10,0],[3,8,0],[3,7,0],[4,7,0],[4,6,0],[6,6,0],[6,4,0],
	                                          [6,0,0],[4,0,0],[0,0,0],[0,1,0],[0,3,0],[1,3,0],[1,1,0],
	                                          [4,1,0],[4,4,0],[2,4,0],[0,4,0],[0,6,0],[0,8,0]]);
	
	// const A = new Polygon3D(null, [[,],[,],[,],[,]])
	Test.add('Polygon3D merge',(ts) => {
	  // const poly = A.merge(B).merge(J);
	  const AB = A.merge(B);
	  const IF = [F,I];
	  Polygon3D.merge(IF);
	  const ABCDEFGHIJ = [A,B,C,D,E,F,G,H,I,J];
	  ABCDEFGHIJ.shuffle();
	  Polygon3D.merge(ABCDEFGHIJ);
	
	  ts.assertTrue(polyAB.equals(AB), 'merge or equals is malfunctioning');
	  ts.assertTrue(AB.equals(polyAB), 'merge or equals is malfunctioning');
	  ts.assertFalse(polyAB.equals(undefined));
	  ts.assertFalse(polyAB.equals(A));
	  ts.assertTrue(IF[0].equals(polyIF));
	  ts.assertTrue(polyIF.equals(IF[0]));
	  ts.assertTrue(ABCDEFGHIJ.length === 2);
	  ts.assertTrue(polyABCDEGHJ.equals(ABCDEFGHIJ[0]) || polyABCDEGHJ.equals(ABCDEFGHIJ[1]));
	  ts.assertTrue(polyIF.equals(ABCDEFGHIJ[1]) || polyIF.equals(ABCDEFGHIJ[0]))
	  ts.success();
	});
	
});


RequireJS.addFunction('./test/tests/RelationInput.js',
function (require, exports, module) {
	

	
	const RelationInput = require('../../../../public/js/utils/input/styles/select/relation.js');
	
	
	
	Test.add('RelationInput: Equal',(ts) => {
	  ts.assertEquals(RelationInput.eval('Equal', [1,4,3,5,6,4,8,9], 6), 4);
	  ts.assertEquals(RelationInput.eval('equal', [1,4,3,5,6,4,8,9], 7), undefined);
	  ts.assertEquals(RelationInput.eval('EQual', [1,4,3,5,6,4,8,9], 1), 0);
	  ts.assertEquals(RelationInput.eval('EqUAL', [1,4,3,5,6,4,8,9], 9), 7);
	  ts.assertEquals(RelationInput.eval('EquaL', [1,4,3,5,6,4,8,9], 4), 1);
	  ts.assertEquals(RelationInput.eval('EqUal', [1,4,3,5,6,undefined,8,9], 8), 6);
	  ts.success();
	});
	
	
	Test.add('RelationInput: Less Than',(ts) => {
	  ts.assertEquals(RelationInput.eval('Less ThAn', [1,4,3,5,6,4,8,9], 6), 3);
	  ts.assertEquals(RelationInput.eval('LeSs_Than', [1,4,3,5,6,4,8,9], 1), undefined);
	  ts.assertEquals(RelationInput.eval('LeSS Than', [1,4,3,5,6,4,8,9], 200), 7);
	  ts.assertEquals(RelationInput.eval('less than', [1,4,3,5,6,4,8,9], 9), 6);
	  ts.assertEquals(RelationInput.eval('Less Than', [1,4,3,5,6,4,8,9], -2), undefined);
	  ts.assertEquals(RelationInput.eval('Less Than', [1,4,3,5,6,undefined,8,9], 8), 4);
	  ts.success();
	});
	
	Test.add('RelationInput: Greater Than',(ts) => {
	  ts.assertEquals(RelationInput.eval('Greater ThAn', [1,4,3,5,6,4,8,9], 6), 6);
	  ts.assertEquals(RelationInput.eval('Greater_Than', [1,4,3,5,6,4,8,9], 1), 2);
	  ts.assertEquals(RelationInput.eval('Greater Than', [1,4,3,5,6,4,8,9], 200), undefined);
	  ts.assertEquals(RelationInput.eval('Greater than', [1,4,3,5,6,4,8,9], 9), undefined);
	  ts.assertEquals(RelationInput.eval('Greater Than', [1,4,3,5,6,4,8,9], -2), 0);
	  ts.assertEquals(RelationInput.eval('Greater Than', [1,4,3,5,6,undefined,8,9], 8), 7);
	  ts.success();
	});
	
	Test.add('RelationInput: Less Than Or Equal',(ts) => {
	  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 6), 4);
	  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 2), 0);
	  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 200), 7);
	  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 9), 7);
	  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], -2), undefined);
	  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,undefined,8,9], 7.5), 4);
	  ts.success();
	});
	
	Test.add('RelationInput: Greater Than Or Equal',(ts) => {
	  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 6), 4);
	  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 1.01), 2);
	  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 200), undefined);
	  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 9), 7);
	  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], -2), 0);
	  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,undefined,8,9], 8), 6);
	  ts.success();
	});
	
});


RequireJS.addFunction('./test/tests/line-consolidate.js',
function (require, exports, module) {
	
const Test = require('../../../../public/js/utils/test/test').Test;
	const Polygon2d = require('../../app-src/two-d/objects/polygon.js');
	const Line2d = require('../../app-src/two-d/objects/line.js');
	
	const extraLinePoly = new Polygon2d([[0,0],[0,1],[0,2],[0,3],
	                [1,3],[1,4],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6],
	                [3,5],[4,5],[5,4],[6,3],[5,3],[5,2],[6,2],[6,1],
	                [6,0],[5,0],[4,0],[4,-1],[4,-2],[1,0]]);
	
	const consisePoly = new Polygon2d([[0,0],[0,3],[1,3],[1,4],
	                [0,4],[0,6],[3,6],[3,5],[4,5],[6,3],[5,3],[5,2],
	                [6,2],[6,0],[4,0],[4,-2],[1,0]])
	
	
	// const A = new Polygon3D([[,],[,],[,],[,]])
	Test.add('Line2d: consolidate',(ts) => {
	  const lines = Polygon2d.lines(extraLinePoly);
	  ts.assertTrue(lines.length === consisePoly.lines().length);
	  ts.success();
	});
	
});


RequireJS.addFunction('./test/tests/to-from-json.js',
function (require, exports, module) {
	
const Test = require('../../../../public/js/utils/test/test').Test;
	const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
	
	
	Test.add('To JSON',(ts) => {
	  ts.assertEquals(6, 6);
	  ts.success();
	});
	
});


RequireJS.addFunction('./test/tests/cost/material.js',
function (require, exports, module) {
	

	const Frame = require('./labor.js').Frame;
	const Material = require('./category.js').Material;
	
	
	{
	  const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
	  const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
	  const props = {};
	  const smeRound = StringMathEvaluator.round;
	  const referenceable = true;
	  const group = 'localTest30487';
	
	  let unitCostValue = smeRound(15.37/(8*12));
	  let costValue = smeRound(unitCostValue * 2 * 196 * 12);
	  let assembly = frame;
	  props.linear = {
	    id: 'frame',
	    method: 'Linear Feet',
	    objectId: 'Frame',
	    length: '8\'',
	    cost: '15.37',
	    formula: '2*l',
	    referenceable, unitCostValue, costValue, assembly, group
	  };
	
	  unitCostValue = smeRound((75.13)/(96*48));
	  costValue = smeRound(unitCostValue * 24 * 10);
	  assembly = panel;
	  props.square = {
	    id: 'panel0',
	    method: 'Square Feet',
	    objectId: 'Panel',
	    length: '96',
	    width: '48',
	    cost: 75.13,
	    referenceable, unitCostValue, costValue, assembly, group
	  };
	
	  unitCostValue = smeRound(29.86/(12*6*1));
	  costValue = smeRound(unitCostValue * 24 * 10 * .75);
	  props.cubic = {
	    id: 'metal',
	    method: 'Cubic Feet',
	    objectId: 'Panel',
	    length: '12',
	    width: '6',
	    depth: '1',
	    cost: 29.86,
	    referenceable, unitCostValue, costValue, assembly, group
	  };
	
	  unitCostValue = smeRound(50.12/10);
	  costValue = smeRound(unitCostValue * 13);
	  props.unit = {
	    id: 'parts',
	    method: 'Unit',
	    laborType: 'Instalation',
	    hourlyRate: '20',
	    hours: '.66',
	    cost: '50.12',
	    count: '10',
	    referenceable, unitCostValue, costValue, group,
	    assembly: 13
	  };
	
	  Test.add('MaterialCost: unitCost/calc',(ts) => {
	    const costs = [];
	    function testProps(props) {
	      const labor = new Material(props);
	      costs.push(labor);
	      ts.assertTolerance(labor.unitCost().value, props.unitCostValue, .0001);
	      ts.assertTolerance(labor.calc(props.assembly), props.costValue, .0001);
	    }
	    Object.values(props).forEach(testProps);
	    costs.forEach((cost) => cost.delete());
	    ts.success();
	  });
	}
	
	exports.Frame = Frame
	exports.Material = Material
	
});


RequireJS.addFunction('./test/tests/cost/category.js',
function (require, exports, module) {
	

	
	const Frame = require('../../../app-src/objects/assembly/assemblies/frame.js');
	const Panel = require('../../../app-src/objects/assembly/assemblies/panel.js');
	const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
	const Category = require('../../../app-src/cost/types/category.js');
	const Material = require('../../../app-src/cost/types/material.js');
	
	//
	//
	// {
	//   const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
	//   const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
	//   const frame.addSubAssembly(panel);
	//   const props = {};
	//   const smeRound = StringMathEvaluator.round;
	//
	//   let unitCostValue = smeRound(15.37/(8*12));
	//   let costValue = smeRound(unitCostValue * 2 * 196 * 12);
	//   let assembly = frame;
	//   props.linear = {
	//     id: 'frame',
	//     method: 'Linear Feet',
	//     length: '8\'',
	//     cost: '15.37',
	//     formula: '2*l',
	//     unitCostValue, costValue, assembly
	//   };
	//
	//   unitCostValue = smeRound((75.13)/(96*48));
	//   costValue = smeRound(unitCostValue * 24 * 10);
	//   props.square = {
	//     id: 'panel0',
	//     method: 'Square Feet',
	//     length: '96',
	//     width: '48',
	//     cost: 75.13,
	//     unitCostValue, costValue, assembly
	//   };
	//
	//   unitCostValue = smeRound(29.86/(12*6*1));
	//   costValue = smeRound(unitCostValue * 24 * 10 * .75);
	//   props.cubic = {
	//     id: 'metal',
	//     method: 'Cubic Feet',
	//     length: '12',
	//     width: '6',
	//     depth: '1',
	//     cost: 29.86,
	//     unitCostValue, costValue, assembly
	//   };
	//
	//   unitCostValue = smeRound(50.12/10);
	//   costValue = smeRound(unitCostValue * 13);
	//   props.unit = {
	//     id: 'parts',
	//     method: 'Unit',
	//     laborType: 'Instalation',
	//     hourlyRate: '20',
	//     hours: '.66',
	//     cost: '50.12',
	//     count: '10',
	//     unitCostValue, costValue,
	//     assembly: 13
	//   };
	//   const catCost = new Category({id: 'catTest'});
	//
	//   Test.add('CategoryCost: calc',(ts) => {
	//     let totalCost = 0;
	//     function testProps(props) {
	//       const matCost = new Material(props);
	//       catCost.addChild(matCost);
	//       totalCost += matCost.calc(props.assembly);
	//     }
	//     Object.values(props).forEach(testProps);
	//     ts.assertTolerance(totalCost, catCost.calc(), .0001);
	//     ts.success();
	//   });
	// }
	
	exports.Frame = Frame
	exports.Panel = Panel
	exports.StringMathEvaluator = StringMathEvaluator
	exports.Category = Category
	exports.Material = Material
	
});


RequireJS.addFunction('./test/tests/cost/labor.js',
function (require, exports, module) {
	

	
	const Frame = require('../../../app-src/objects/assembly/assemblies/frame.js');
	const Panel = require('../../../app-src/objects/assembly/assemblies/panel.js');
	const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
	const Labor = require('../../../app-src/cost/types/material/labor.js');
	const FunctionArgumentTest = require('../../test.js').FunctionArgumentTest;
	
	
	{
	  const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
	  const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
	  const props = {};
	  const smeRound = StringMathEvaluator.round;
	  const referenceable = true;
	  const group = 'localTest30487';
	
	  let unitCostValue = smeRound((35*.017)/(8*12));
	  let costValue = smeRound(unitCostValue * 196 * 12);
	  let assembly = frame;
	  props.linear = {
	    id: 'Sand Frame',
	    method: 'Linear Feet',
	    laborType: 'Sand',
	    objectId: 'Frame',
	    hourlyRate: '35',
	    length: '8\'',
	    hours: '.017',
	    formula: 'l',
	    referenceable, unitCostValue, costValue, assembly, group
	  };
	
	  unitCostValue = smeRound((35*.08)/(48*48));
	  costValue = smeRound(unitCostValue * 24 * 10);
	  assembly = panel;
	  props.square = {
	    id: 'Sand Panel',
	    method: 'Square Feet',
	    laborType: 'Sand',
	    length: '48',
	    objectId: 'Panel',
	    width: '48',
	    hours: '.08',
	    formula: 'l*w',
	    referenceable, unitCostValue, costValue, assembly, group
	  };
	
	  unitCostValue = smeRound((35*.06)/(12*6*1));
	  costValue = smeRound(unitCostValue * 24 * 10 * .75);
	  props.cubic = {
	    id: 'Sand Block',
	    method: 'Cubic Feet',
	    laborType: 'Sand',
	    hourlyRate: '35',
	    objectId: 'Panel',
	    length: '12',
	    width: '6',
	    depth: '1',
	    hours: '.06',
	    formula: 'l*w*d',
	    referenceable, unitCostValue, costValue, assembly, group
	  };
	
	  unitCostValue = smeRound(20*.66);
	  costValue = smeRound(unitCostValue * 13);
	  props.unit = {
	    id: 'instalation',
	    method: 'Unit',
	    laborType: 'Instalation',
	    hourlyRate: '20',
	    hours: '.66',
	    referenceable, unitCostValue, costValue, group,
	    assembly: 13
	  };
	
	  Test.add('LaborCost: unitCost/calc',(ts) => {
	    const costs = [];
	    function testProps(props) {
	      const labor = new Labor(props);
	      costs.push(labor);
	      ts.assertTolerance(labor.unitCost().value, props.unitCostValue, .00001);
	      ts.assertTolerance(labor.calc(props.assembly), props.costValue, .00001);
	    }
	    Object.values(props).forEach(testProps);
	    costs.forEach((cost) => cost.delete());
	    ts.success();
	  });
	
	  // Test.add('LaborCost: argument validation',(ts) => {
	  //   const args = [props.linear];
	  //   const func = function (args) {new (Labor.prototype.constructor)(...arguments);}
	  //   new FunctionArgumentTest(ts, func, args)
	  //       .setIndex(0)
	  //       .add('id', undefined)
	  //       .run();
	  //   ts.success();
	  // });
	}
	
	exports.Frame = Frame
	exports.Panel = Panel
	exports.StringMathEvaluator = StringMathEvaluator
	exports.Labor = Labor
	exports.FunctionArgumentTest = FunctionArgumentTest
	
});


window.onload = () => RequireJS.init('app-src/init.js')
