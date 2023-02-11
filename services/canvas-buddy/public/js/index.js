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
        if (name === fileName) {
          guesses.push(determinRelitivePath(currFile, path));
        }
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



RequireJS.addFunction('./services/canvas-buddy/app/app.js',
function (require, exports, module) {
	
require('../../../public/js/utils/utils');
	const du = require('../../../public/js/utils/dom-utils');
	const panZoom = require('../../../public/js/utils/canvas/two-d/pan-zoom');
	const Draw2D = require('../../../public/js/utils/canvas/two-d/draw.js');
	const Circle2d = require('../../../public/js/utils/canvas/two-d/objects/circle.js');
	const Vertex2d = require('../../../public/js/utils/canvas/two-d/objects/vertex.js');
	const Line2d = require('../../../public/js/utils/canvas/two-d/objects/line.js');
	const HoverMap = require('../../../public/js/utils/canvas/two-d/hover-map.js');
	const PopUp = require('../../../public/js/utils/display/pop-up');
	
	function reportError(msg) {
	  console.error(msg);
	}
	
	let verts;
	let hoverMaps;
	const popUp = new PopUp({resize: false});
	
	function polyDrawFunc() {
	  let points = [];
	  return (x,y) => {
	    points.push(drawVertex(x,y));
	    verts.push(points[points.length - 1]);
	    if (points.length > 1) {
	      const line = new Line2d(points[points.length - 2], points[points.length - 1]);
	      hoverMaps.push(new HoverMap(line));
	      draw(line, color(line), .1);
	    }
	  }
	}
	
	function drawVertex(x, y) {
	  const vert = new Vertex2d(x,y);
	  hoverMaps.push(new HoverMap(vert));
	  verts.push(vert);
	  // draw.circle(new Circle2d(.2, vert), null, color(vert));
	  return vert;
	}
	
	let colors = {};
	function color(lineOvert, color) {
	  if (lineOvert.equals(hovering)) return 'blue';
	  const key = lineOvert.toString();
	  if (color) {
	    colors[key] = color;
	  }
	  return colors[key];
	}
	
	function vertColorReplace(garb, c, vertStr) {
	  const match = vertStr.match(pointReg)
	  const x = Number.parseFloat(match[2]);
	  const y = Number.parseFloat(match[5]);
	  color(new Vertex2d(x,y), c);
	  return vertStr;
	}
	
	function pathColorReplace(garb, c, pathStr) {
	  const pointStrs = pathStr.match(pointsReg);
	  const points = [];
	  pointStrs.forEach((pointStr) => {
	    const match = pointStr.match(pointReg)
	    const x = Number.parseFloat(match[2]);
	    const y = Number.parseFloat(match[5]);
	    points.push(new Vertex2d(x,y));
	    if (points.length > 1) color(new Line2d(points[points.length - 2], points[points.length - 1]), c);
	  });
	  return pathStr;
	}
	
	
	const pathColorReg = /([a-zA-Z]{1,})(\[.*?\])/g;
	const vertColorReg = /([a-zA-Z]{1,})(\(.*?\))/g;
	function parseColors(line) {
	  line = line.replace(pathColorReg, pathColorReplace) || line;
	  line = line.replace(vertColorReg, vertColorReplace) || line;
	  return line;
	}
	
	const input = du.find('textarea');
	console.log('hello buddy');
	const splitReg = /(\],\[|\],\(|\),\[)/;
	const pointsReg = /\(\s*(((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,}))\s*,\s*((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,})))\s*\)/g;
	const pointReg = /\(\s*(((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,}))\s*,\s*((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,})))\s*\)/;
	const commentReg = /\s*\/\/.*/;
	
	function splitLocationData(str) {
	  str = parseColors(str);
	  const breakdown = str.split(splitReg);
	  for (let index = 0; index < breakdown.length; index+=2) {
	    const start = index === 0 ? '' : breakdown[index-1].substr(breakdown[index-1].length - 1, 1);
	    const end = index === breakdown.length - 1 ? '' : breakdown[index+1].substr(0,1);
	    const piece = start + breakdown[index] + end;
	    const illustrateFunc = piece.charAt(0) === '[' ?  polyDrawFunc() : drawVertex;
	    const pointStrs = piece.match(pointsReg);
	    if (pointStrs === null) reportError(`trouble parsing section ${piece}`);
	    else {
	      pointStrs.forEach(pointStr => {
	        const match = pointStr.match(pointReg)
	        const x = Number.parseFloat(match[2]);
	        const y = Number.parseFloat(match[5]);
	        illustrateFunc(x,y);
	      });
	    }
	  }
	}
	
	function drawFunc() {
	  colors = {};
	  verts = [];
	  hoverMaps = [];
	  const lines  = input.value.split('\n');
	  lines.forEach((line) =>  {
	    line =  line.replace(commentReg, '');
	    line = line.trim();
	    if (line) splitLocationData(line);
	  })
	
	}
	// [(1,.1),(2.2,88888.2),(.000003,3)],[(4445654.345,4),(-5,-5)],(6,7),[(4,4),(5,5)]
	const canvas = du.find('canvas');
	const height = du.convertCssUnit('100vh');
	canvas.height = height;
	canvas.width = height;
	draw = new Draw2D(canvas, true);
	panZ = panZoom(canvas, drawFunc);
	draw.circle(new Circle2d(2, new Vertex2d(10,10)), null, 'green');
	
	let lastHash;
	input.onkeyup = (event) => {
	  const thisHash = input.value.hash();
	  if (thisHash !== lastHash) {
	    lastHash = thisHash;
	    panZ.once();
	  }
	}
	
	let hovering;
	panZ.onMove((event) => {
	  const vertex = new Vertex2d(event.imageX, -1*event.imageY);
	  hovering = null;
	  for (let index = 0; index < hoverMaps.length; index++) {
	    const hoverMap = hoverMaps[index];
	    if (hoverMap.hovering(vertex)) {
	      hovering = hoverMap.target();
	      break;
	    }
	  }
	  console.log(hovering && hovering.toString())
	});
	
	panZ.onMouseup((event) => {
	  if (hovering) popUp.open(hovering.toString(), {x: event.screenX, y: event.screenY});
	});
	
	setTimeout(() => {
	    const minMax = Math.minMax(verts, ['x', 'y'])
	    const x = (minMax.x.max - minMax.x.min)/2;
	    const y = (minMax.y.max - minMax.y.min)/-2;
	    const center = new Vertex2d(x, y);
	    panZ.centerOn(center.x(), center.y());
	  });
	
	input.onkeyup(true);
	
	const initialValue = `\npurple(-5,-5)//Points
	
	// Paths\n
	red[(1,.1),(2.2,88.2),blue(.000003,3)],pink[(54.35,4),(-5,-5)],[(4,4),(5,5)]
	
	     // Combination\n
	     yellow[(1,.1),(2.2,88.2),(.000003,3)],green[(54.35,4),(-5,-5)][(4,4),(5,5)]`;
	
	input.value = initialValue;
	
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
	
	
	const du = {create: {}, class: {}, cookie: {}, param: {}, style: {}, is: {},
	      scroll: {}, input: {}, on: {}, move: {}, url: {}, fade: {}, position: {}};
	du.find = (selector) => document.querySelector(selector);
	du.find.all = (selector) => document.querySelectorAll(selector);
	du.validSelector = VS;
	
	du.create.element = function (tagname, attributes) {
	  const elem = document.createElement(tagname);
	  const keys = Object.keys(attributes || {});
	  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
	  return elem;
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
	  const events = event.split(',');
	  if (events.length > 1) return events.forEach((e) => du.on.match(e, selector, func, target));
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
	
	const attrReg = /^[a-zA-Z-]*$/;
	du.uniqueSelector = function selector(focusElem) {
	  if (!focusElem) return '';
	  let selector = '';
	  let percice;
	  let attrSelector;
	  let currSelector;
	  let currElem = focusElem;
	  do {
	    attrSelector = `${currElem.tagName}${currElem.id ? '#' + currElem.id : ''}`;
	
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
	
	try {
	  module.exports = du;
	} catch (e) {}
	
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
	
	
	Function.safeStdLibAddition(Math, 'mod',  function (val, mod) {
	  while (val < 0) val += mod;
	  return val % mod;
	}, true);
	
	Function.safeStdLibAddition(Number, 'NaNfinity',  function (...vals) {
	  for (let index = 0; index < vals.length; index++) {
	    let val = vals[index];
	    if(Number.isNaN(val) || !Number.isFinite(val)) return true;
	  }
	  return false;
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
	clazz.register = (clazz) => classLookup[clazz.name] = clazz;
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
	
	Function.safeStdLibAddition(Object, 'merge', (target, object, soft) => {
	  if (!(target instanceof Object)) return;
	  if (!(object instanceof Object)) return;
	  const objKeys = Object.keys(object);
	  for (let index = 0; index < objKeys.length; index++) {
	    const key = objKeys[index];
	    if (!soft || target[key] === undefined) {
	      target[key] = object[key];
	    }
	  }
	}, true);
	
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
	
	const primes = [3,5,7,11,17,19,23,29];
	const firstNotInList = (targetList, ignoreList) => {
	  for (let index = 0; index < targetList.length; index++) {
	    if (ignoreList.indexOf(targetList[index]) === -1) return {item: targetList[index], index};
	  }
	  return null;
	}
	Function.safeStdLibAddition(Array, 'systematicSuffle', function (numberOfSuffles, doNotShufflePrimes) {
	  // const ps = primes;
	  const ps = [];
	  ps.copy(primes);
	  // if (!doNotShufflePrimes) ps.systematicSuffle(numberOfSuffles, true);
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
	      // if (primeCount < shuffleIndex) this.reverse();
	    }
	    // console.log(this.join());
	    map[this.join().hash()] = true;
	  }
	  return Object.keys(map).length;
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
	      } else if (elem !== other[index]) {
	        equal = false;
	      }
	    }
	    return equal;
	});
	
	Function.safeStdLibAddition(Array, 'removeAll', function (arr) {
	  for (let index = 0; index < arr.length; index += 1) {
	    this.remove(arr[index]);
	  }
	});
	
	Function.safeStdLibAddition(Array, 'condition', function (initalValue, conditionFunc) {
	  const valueFuncDefined = (typeof valueFunc) === 'function';
	  for (let index = 0; index < this.length; index += 1) {
	    const elem = this[index];
	    initalValue = conditionFunc(initalValue, elem);
	  }
	  return initalValue;
	});
	
	Function.safeStdLibAddition(Array, 'max', function (max, func) {
	  const funcDefined = (typeof func) === 'function';
	  const initalValue = max || max === 0 ? {elem: max, value: funcDefined ? func(max) : max} : undefined;
	  return this.condition(initalValue, (max, elem) => {
	    let value = funcDefined ? func(elem, index) : elem;
	    if (!(max instanceof Object) || value > max.value) return {value, elem};
	    return max
	  }).elem;
	});
	
	Function.safeStdLibAddition(Array, 'min', function (min, func) {
	  const funcDefined = (typeof func) === 'function';
	  const initalValue = min || min === 0 ? {elem: min, value: funcDefined ? func(min) : min} : undefined;
	  return this.condition(initalValue, (min, elem) => {
	    let value = funcDefined ? func(elem, index) : elem;
	    if (!(min instanceof Object) || value < min.value) return {value, elem};
	    return min
	  }).elem;
	});
	
	Function.safeStdLibAddition(Array, 'print', function (min, func) {
	  const maxLength = new String(this.length).length;
	  for (let index = 0; index < this.length; index++) {
	    const elem = this[index];
	    const length = new String(index).length;
	    const position = new Array(maxLength - length).fill(' ').join('') + index + ':';
	    console.log(position, elem && elem.toString ? elem.toString() : elem);
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
	    for (let index = 0; index < this.length; index += 1) {
	      if (elem && (typeof elem.equals) === 'function' && elem.equals(this[index])) {
	        this.splice(index--, 1);
	      } else if (elem === this[index]) {
	        this.splice(index--, 1);
	      }
	    }
	});
	
	Function.safeStdLibAddition(Array, 'compare', function (original, neww, modify) {
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
	
	    if (modify) {
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
	  for (let index = 0; index < arr.length; index += 1) {
	    if (checkForDuplicats && this.indexOf(arr[index]) !== -1) {
	      console.error('duplicate');
	    } else {
	      this[this.length] = arr[index];
	    }
	  }
	});
	
	// const nativeSort = Array.sort;
	// Function.safeStdLibAddition(Array, 'sort', function() {
	//   if ((typeof stringOfunc) === 'string')
	//     return nativeSort.apply(this, [sortByAttr(stringOfunc)]);
	//   return nativeSort.apply(this, arguments);
	// }, true);
	
	Function.safeStdLibAddition(Array, 'copy', function (arr) {
	  this.length = 0;
	  // const keys = Object.keys(this);
	  // for (let index = 0; index < keys.length; index += 1) delete this[keys[index]];
	  const newKeys = Object.keys(arr);
	  for (let index = 0; index < newKeys.length; index += 1) {
	    const key = newKeys[index];
	    this[key] = arr[key];
	  }
	  return this;
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
	          return values[attr] = value;
	        }
	      }
	    }
	  }
	  if (!temporary) {
	    const origToJson = obj.toJson;
	    obj.toJson = (members, exclusive) => {
	      try {
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
	      } catch(e) {
	        console.warn(e.message);
	        return e.message;
	      }
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
	
	const defaultInterval = 1000;
	const lastTimeStamps = {};
	function intervalFunction() {
	  const caller = intervalFunction.caller;
	  let interval = arguments[0];
	  if (!Number.isFinite(interval) || interval > 60000) interval = defaultInterval;
	  else {
	    arguments = Array.from(arguments)
	    arguments.splice(0,1);
	  }
	  const lastTime = lastTimeStamps[caller];
	  const thisTime = new Date().getTime();
	  if (lastTime === undefined || lastTime + interval < thisTime) this(...arguments);
	  lastTimeStamps[caller] = thisTime;
	}
	Function.safeStdLibAddition(Function, 'subtle',   intervalFunction);
	
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
	  'indianred', 'gray', 'fuchsia', 'lime', 'black', 'lightsalmon', 'red',
	  'maroon', 'yellow', 'olive', 'lightcoral', 'green', 'aqua', 'white',
	  'teal', 'darksalmon', 'blue', 'navy', 'salmon', 'silver', 'purple'
	];
	let colorIndex = 0;
	Function.safeStdLibAddition(String, 'nextColor', () => colors[index++ % colors.length], true);
	
	Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
	  const attrs = path.split('.');
	  const lastIndex = attrs.length - 1;
	  let currObj = obj;
	  for (let index = 0; index < lastIndex; index += 1) {
	    let attr = attrs[index];
	    if (currObj[attr] === undefined) currObj[attr] = {};
	    currObj = (typeof currObj[attr]) === 'function' ? currObj[attr]() : currObj[attr];
	  }
	
	  const lastAttr = attrs[lastIndex];
	  if ((typeof currObj[lastAttr]) === 'function') {
	    return currObj[lastAttr](value);
	  } else if (value !== undefined) {
	    currObj[lastAttr] = value;
	  }
	  return currObj[lastAttr];
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
	    meanObject[key] = maxMin[key].total/items.length;
	  }
	  return meanObject;
	}, true);
	
});


RequireJS.addFunction('./public/js/utils/$t.js',
function (require, exports, module) {
	

	
	
	
	const CustomEvent = require('./custom-event');
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


RequireJS.addFunction('./public/js/utils/custom-event.js',
function (require, exports, module) {
	

	
	
	class CustomEvent {
	  constructor(name) {
	    const watchers = [];
	    this.name = name;
	
	    const runFuncs = (elem, detail) => 
	    watchers.forEach((func) => {
	      try {
	        func(elem, detail);
	      } catch (e) {
	        console.error(e);
	      }
	    });
	
	
	    this.on = function (func) {
	      if ((typeof func) === 'function') {
	        watchers.push(func);
	      } else {
	        return 'on' + name;
	      }
	    }
	
	    this.trigger = function (element, detail) {
	      element = element ? element : window;
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
	
	CustomEvent.all = (obj, ...eventNames) => {
	  if (obj.on === undefined) obj.on = {};
	  if (obj.trigger === undefined) obj.trigger = {};
	  for (let index = 0; index < eventNames.length; index++) {
	    const name = eventNames[index];
	    const e = new CustomEvent(name);
	    obj.on[name] = e.on;
	    obj.trigger[name] = (...args) => e.trigger.apply(e, args);
	  }
	}
	
	module.exports = CustomEvent;
	
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
	
	module.exports = ExprDef;
	
	
	
	
	
});


RequireJS.addFunction('./public/js/utils/approximate.js',
function (require, exports, module) {
	

	
	let defaultAccuracy;
	
	class Approximate {
	  constructor(accuracy) {
	    if ((typeof accuracy) !== 'number' || accuracy === defaultAccuracy) return Approximate.default;
	
	    function approximate(value) {
	      return Math.round(value * accuracy) / accuracy;
	    }
	
	    function approximateFunc(test) {
	      return function () {
	        if (arguments.length === 2) return test(approximate(arguments[0]), approximate(arguments[1]));
	        for (let index = 1; index < arguments.length; index++) {
	          if (!test(approximate(arguments[index - 1]), approximate(arguments[index]))) return false;
	        }
	        return true;
	      }
	    }
	    const af = approximateFunc;
	    approximate.eq = af((one, two) => one === two);
	    approximate.neq = af((one, two) => one !== two);
	    approximate.gt = af((one, two) => one > two);
	    approximate.lt = af((one, two) => one < two);
	    approximate.gteq = af((one, two) => one >= two);
	    approximate.lteq = af((one, two) => one <= two);
	    approximate.eqAbs = af((one, two) => Math.abs(one) === Math.abs(two));
	    approximate.neqAbs = af((one, two) => Math.abs(one) !== Math.abs(two));
	    approximate.abs = (value) => Math.abs(approximate(value));
	    approximate.object = (obj) => {
	      const approx = {};
	      return Object.forAllRecursive(obj,
	            (value) => (typeof value) === 'number' ? approximate(value) : value);
	    }
	    approximate.sameSign = af((value1, value2) => (value1 === 0 && value2 === 0) ||
	                                                      (value2 > 0 && value1 > 0) ||
	                                                      (value2 < 0 && value1 < 0));
	    return approximate;
	  }
	}
	
	
	Approximate.setDefault = (accuracy) => {
	  if ((typeof accuracy) !== 'number') throw new Error('Must enter a number for accuracy: hint must be a power of 10');
	  Approximate.default = new Approximate(accuracy);
	  defaultAccuracy = accuracy;
	  Approximate.default.new = (acc) => new Approximate(acc);
	  Approximate.default.setDefault = Approximate.default;
	}
	
	Approximate.setDefault(1000000);
	
	module.exports  = Approximate.default;
	
});


RequireJS.addFunction('./public/js/utils/tolerance.js',
function (require, exports, module) {
	
const DEFAULT_TOLERANCE = .0001;
	
	function round(val) {
	  return Math.round(1000000000000 * val)/1000000000000
	}
	
	function decimalLimit(value, limit) {
	  return (new String(value)).replace(/([0-9]{1,})(.[0-9]{1,}|)/, '$2').length > limit;
	}
	
	function rangeStr(lower, upper) {
	  return `${round(lower)} => ${round(upper)}`;
	}
	
	function boundsFunc(attr, attributeMap, tolerance) {
	  const singleValue = attr === undefined;
	  return (elem) => {
	    const tol = singleValue ? tolerance : attributeMap[attr];
	    const value = singleValue ? elem : Object.pathValue(elem, attr);
	    let lower, upper, center;
	    if (Number.NaNfinity(value)) return {lower: value, upper: value, id: rangeStr(value, value)};
	    else {
	      const mod = value % tol;
	      const center = mod > tol/2 ? value + (tol - mod) : value - mod;
	      lower = round(center - tol);
	      upper = round(center + tol);
	      if (lower>upper) {const temp = lower; lower = upper; upper = temp;}
	      const prevId = rangeStr(lower - tol, center);
	      const id = rangeStr(lower, upper);
	      const nextId = rangeStr(center, upper + tol);
	      if (decimalLimit(lower, 10) || decimalLimit(upper, 10))
	        console.warn.subtle(`Bounding limits may be incorrect: ${id}`);
	      return {lower, upper, prevId, id, nextId};
	    }
	  }
	}
	
	function withinBounds(attr, attributeMap, tolerance) {
	  const singleValue = attr === undefined;
	  return (value1, value2) => {
	    if (value1 === value2) return true;
	    const tol = singleValue ? tolerance : attributeMap[attr];
	    return Math.abs(value1 - value2) < tol;
	  }
	}
	
	class Tolerance {
	  constructor(attributeMap, tolerance) {
	    attributeMap ||= {};
	    let within, bounds;
	    const attrs = Object.keys(attributeMap);
	    const singleValue = attrs.length === 0;
	    this.bounds = {};
	    if (!singleValue)
	      this.attributes = () => attrs;
	    else {
	      tolerance ||= DEFAULT_TOLERANCE;
	      bounds = boundsFunc();
	      within = withinBounds(undefined, undefined, tolerance);
	    }
	
	    this.finalAttr = () => attrs[attrs.length - 1];
	
	    this.details = (elem) => {
	      if (singleValue) return bounds(elem);
	      let details = {};
	      for (let index = 0; index < attrs.length; index++) {
	        details[attrs[index]] = this.bounds[attrs[index]](elem);
	      }
	      return details;
	    }
	
	    this.boundries = (elem) => {
	      if (singleValue) return bounds(elem).id;
	      let boundries = '';
	      for (let index = 0; index < attrs.length; index++) {
	        boundries += this.bounds[attrs[index]](elem).id + '\n';
	      }
	      return boundries.substr(0,boundries.length - 1);
	    }
	
	    for (let index = 0; index < attrs.length; index++) {
	      const attr = attrs[index];
	      this.bounds[attr] = boundsFunc(attr, attributeMap);
	      this.bounds[attr].within = withinBounds(attr, attributeMap);
	    }
	
	    this.within = (elem1, elem2) => {
	      if (singleValue) return within(elem1, elem2);
	      let isWithin = true;
	      for (let index = 0; index < attrs.length; index++) {
	        const attr = attrs[index];
	        const value1 = Object.pathValue(elem1, attr);
	        const value2 = Object.pathValue(elem2, attr);
	        isWithin &&= this.bounds[attr].within(value1, value2);
	        if (!isWithin) return false;
	      }
	      return isWithin;
	    }
	  }
	}
	
	Tolerance.within = (tol) => new Tolerance({'value': tol}).bounds.value.within;
	
	module.exports = Tolerance;
	
});


RequireJS.addFunction('./public/js/utils/display/pop-up.js',
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


RequireJS.addFunction('./public/js/utils/display/drag-drop.js',
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


RequireJS.addFunction('./public/js/utils/display/catch-all.js',
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


RequireJS.addFunction('./public/js/utils/display/resizer.js',
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


RequireJS.addFunction('./public/js/utils/tolerance-map.js',
function (require, exports, module) {
	
const Tolerance = require('tolerance');
	
	function sortByAttr(attr) {
	  function sort(obj1, obj2) {
	    if (obj2[attr] === obj1[attr]) {
	      return 0;
	    }
	    return obj2[attr]() < obj1[attr]() ? 1 : -1;
	  }
	  return sort;
	}
	
	class ToleranceMap {
	  constructor(attributeMap, toleranceMap) {
	    const map = toleranceMap || {};
	    const tolerance = new Tolerance(attributeMap);
	    const finalAttrSort = sortByAttr(tolerance.finalAttr());
	
	    this.clone = () => {
	      const tMap = new ToleranceMap(attributeMap);
	      this.forEach(value => tMap.add(value));
	      return tMap;
	    }
	    function forEachSet(func, node, attrs, attrIndex) {
	      if ((typeof func) !== 'function') throw new Error('Arg1 must be of type function');
	      if (Array.isArray(node)) {
	        func(node);
	        return;
	      }
	      if (attrs && !node) return;
	      attrs ||= tolerance.attributes();
	      node ||= map;
	      attrIndex ||= 0;
	      const keys = Object.keys(node);
	      for (let index = 0; index < keys.length; index++) {
	        forEachSet(func, node[keys[index]], attrs, attrIndex + 1);
	      }
	    }
	
	    function matches(elem, node, attrs, list, attrIndex) {
	      if (Array.isArray(node)) {
	        list.concatInPlace(node);
	        return;
	      }
	      if (attrs && !node) return;
	      list ||= [];
	      attrs ||= tolerance.attributes();
	      node ||= map;
	      attrIndex ||= 0;
	      const attr = attrs[attrIndex];
	      const bounds = tolerance.bounds[attr](elem);
	      const id = bounds.id;
	      matches(elem, node[bounds.nextId], attrs, list, attrIndex + 1);
	      matches(elem, node[bounds.id], attrs, list, attrIndex + 1);
	      matches(elem, node[bounds.prevId], attrs, list, attrIndex + 1);
	
	      if (attrIndex === 0) {
	        const matchList = list.filter((other) => tolerance.within(elem, other));
	        matchList.sort(finalAttrSort);
	        return matchList;
	      }
	    }
	
	    function getSet(elem) {
	      let curr = map;
	      let attrs = tolerance.attributes();
	      for (let index = 0; index < attrs.length; index += 1) {
	        const attr = attrs[index];
	        const bounds = tolerance.bounds[attr](elem);
	        const id = bounds.id;
	        if (curr[id] === undefined) {
	          if (index < attrs.length -1) curr[id] = {};
	          else curr[id] = [];
	        }
	        curr = curr[id];
	      }
	
	      return curr;
	    }
	
	    this.forEachSet = forEachSet;
	    this.maxSet = () => {
	      const maxSet = [];
	      forEachSet((set) => maxSet.push(set[0]));
	      maxSet.sort(finalAttrSort);
	      maxSet.reverse();
	      return maxSet;
	    }
	    this.minSet = () => {
	      const minSet = [];
	      forEachSet((set) => minSet.push(set[set.length - 1]));
	      minSet.sort(finalAttrSort);
	      return minSet;
	    }
	    this.forEach = (func, detailed) => {
	      if (!(typeof func) === 'function') return;
	      forEachSet(set => set.forEach((value) => {
	        const details = detailed ? undefined : tolerance.details(value);
	        func(value, details);
	      }));
	    };
	
	    this.values = () => {
	      const values = [];
	      forEachSet(set => values.concatInPlace(set));
	      return values;
	    }
	    this.tolerance = () => tolerance;
	
	    this.matches = (elem) => matches(elem);
	
	    this.add = (elem) => {
	      let matchArr = getSet(elem);
	      matchArr.push(elem);
	      matchArr.sort(finalAttrSort);
	    }
	
	    this.remove = (elem) => {
	      const matchArr = getSet(elem);
	      if (matchArr) {
	        const index = matchArr.indexOf(elem);
	        if (index !== -1) matchArr.splice(index, 1);
	      }
	    }
	
	    this.filter = (elem, filter) => {
	      const matchArr = matches(elem);
	      const filtered = filter(Array.from(matchArr), elem);
	      const returnedArr = new Array(matchArr.length);
	      for (let index = 0; index < filtered.length; index++) {
	        const filElem = filtered[index];
	        const origIndex = matchArr.indexOf(filElem);
	        if (origIndex !== -1) returnedArr[origIndex] = filElem;
	        else this.add(filElem);
	      }
	      let rmElemIndex = 0;
	      while(-1 !== (rmElemIndex = returnedArr.indexOf(undefined, rmElemIndex))) {
	        this.remove(matchArr[rmElemIndex]);
	      }
	    }
	
	    this.addAll = (list) => {
	      for (let index = 0; index < list.length; index++) {
	        const elem = list[index];
	        let matchArr = getSet(elem);
	        matchArr.push(elem);
	      }
	      matchArr.sort(finalAttrSort);
	    }
	
	    this.map = () => map;
	  }
	}
	
	module.exports = ToleranceMap;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/draw.js',
function (require, exports, module) {
	
const Circle2d = require('./objects/circle');
	const ToleranceMap = require('../../tolerance-map.js');
	const du = require('../../dom-utils.js');
	const tol = .1;
	let vertLocTolMap;
	
	class Draw2d {
	  constructor(canvasOselector, invertY) {
	    const yCoef = invertY ? -1 : 1;
	    let takenLocations;
	    let coloredLocations;
	
	    function canvas() {
	      if (typeof canvasOid === 'string') return du.find(canvasOselector);
	      return canvasOselector;
	    }
	    const ctx = () => canvas().getContext('2d');
	
	    function draw(object, color, width) {
	      if (object === undefined) return;
	      if (Array.isArray(object)) {
	        takenLocations = [];
	        vertLocTolMap = new ToleranceMap({x: tol, y: tol});
	        for (let index = 0; index < object.length; index += 1)
	          draw(object[index], color, width);
	        return;
	      }
	      let constructorId = object.constructor.name;
	      if (constructorId !== 'SnapLocation2d')
	        constructorId = constructorId.replace(/^(Snap).*$/, '$1')
	      switch (constructorId) {
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
	        case 'Snap':
	          draw.snap(object, color, width);
	          break;
	        case 'SnapLocation2d':
	          draw.snapLocation(object, color, width);
	        break;
	        default:
	          console.error(`Cannot Draw '${object.constructor.name}'`);
	      }
	    }
	
	    draw.canvas = canvas;
	    draw.ctx = ctx;
	    draw.beginPath = () => ctx().beginPath();
	    draw.moveTo = () => ctx().moveTo();
	
	    draw.clear = () => {
	      ctx().save();
	      ctx().setTransform(1, 0, 0, 1, 0, 0);
	      ctx().clearRect(0, 0, canvas().width, canvas().height);
	      ctx().restore();
	    }
	    const colors = [
	      'indianred', 'gray', 'fuchsia', 'lime', 'black', 'lightsalmon', 'red',
	      'maroon', 'yellow', 'olive', 'lightcoral', 'green', 'aqua', 'white',
	      'teal', 'darksalmon', 'blue', 'navy', 'salmon', 'silver', 'purple'
	    ];
	    let colorIndex = 0;
	
	    let rMultiplier = 1;
	    function identifyVertices(line) {
	      vertLocTolMap.add(line.startVertex());
	      vertLocTolMap.add(line.endVertex());
	      const svHits = vertLocTolMap.matches(line.startVertex()).length;
	      const evHits = vertLocTolMap.matches(line.endVertex()).length;
	      const svRadius = Math.pow(.5,  1 + ((svHits - 1) * .75));
	      const evRadius = Math.pow(.5,  1 + ((evHits - 1) * .75));
	
	      const vertId = 13*(line.startVertex().x() + line.endVertex().x() + 13*(line.startVertex().y() + line.endVertex().y()));
	      const ccolor = colors[Math.floor(line.length() + vertId) % colors.length];
	
	      draw.circle(new Circle2d(svRadius * rMultiplier, line.startVertex()), null, ccolor, .01);
	      draw.circle(new Circle2d(evRadius * rMultiplier, line.endVertex()), null, ccolor, .01);
	    }
	
	    draw.line = (line, color, width, doNotMeasure) => {
	      if (line === undefined) return;
	      color = color ||  'black';
	      width = width || 10;
	      const measurePoints = line.measureTo();
	      ctx().beginPath();
	      ctx().strokeStyle = color;
	      ctx().lineWidth = width;
	      ctx().moveTo(line.startVertex().x(), yCoef * line.startVertex().y());
	      ctx().lineTo(line.endVertex().x(), yCoef * line.endVertex().y());
	      ctx().stroke();
	      // identifyVertices(line);
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
	      width = width || 1;
	      poly.lines().forEach((line) => draw.line(line, color, width));
	      if ((typeof poly.getTextInfo) === 'function') {
	        ctx().save();
	        const info = poly.getTextInfo();
	        ctx().translate(info.center.x(), yCoef * info.center.y());
	        ctx().rotate(info.radians);
	        ctx().beginPath();
	        ctx().lineWidth = 4;
	        ctx().strokeStyle = 'black';
	        ctx().fillStyle =  'black';
	        const text = info.limit === undefined ? info.text : (info.text || '').substring(0, info.limit);
	        ctx().fillText(text, info.x, yCoef * info.y, info.maxWidth);
	        ctx().stroke()
	        ctx().restore();
	      }
	    }
	
	    draw.square = (square, color, text) => {
	      ctx().save();
	      ctx().beginPath();
	      ctx().lineWidth = 2;
	      ctx().strokeStyle = 'black';
	      ctx().fillStyle = color;
	
	      const center = square.center();
	      ctx().translate(center.x(), yCoef * center.y());
	      ctx().rotate(square.radians());
	      ctx().rect(square.offsetX(true), square.offsetY(true), square.width(), square.height());
	      ctx().stroke();
	      ctx().fill();
	
	      if (text) {
	        ctx().beginPath();
	        ctx().lineWidth = 4;
	        ctx().strokeStyle = 'black';
	        ctx().fillStyle =  'black';
	        ctx().fillText(text, 0, square.height() / 4, square.width());
	        ctx().stroke()
	      }
	
	      ctx().restore();
	    }
	
	    draw.text = (text, center, width, color, maxWidth) => {
	      ctx().beginPath();
	      ctx().lineWidth = width || 4;
	      ctx().strokeStyle = color || 'black';
	      ctx().fillStyle =  color || 'black';
	      ctx().font = width + "px Arial";
	      ctx().fillText(text, center.x, yCoef * center.y, maxWidth);
	      ctx().stroke()
	    }
	
	    draw.circle = (circle, lineColor, fillColor, lineWidth) => {
	      const center = circle.center();
	      ctx().beginPath();
	      ctx().lineWidth = Number.isFinite(lineWidth) ? lineWidth : 2;
	      ctx().strokeStyle = lineColor || 'black';
	      ctx().fillStyle = fillColor || 'white';
	      ctx().arc(center.x(),yCoef * center.y(), circle.radius(),0, 2*Math.PI);
	      ctx().stroke();
	      ctx().fill();
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
	      ctx.translate(midpoint.x(), yCoef * midpoint.y());
	      ctx.rotate(line.radians());
	      ctx.beginPath();
	      ctx.fillStyle = "white";
	      ctx.strokeStyle = 'white';
	      ctx.rect((textLength * -3)/14, -4/15, (textLength * 6)/14, 8/15);
	      ctx.fill();
	      ctx.stroke();
	
	      ctx.beginPath();
	      ctx.font = '3px Arial';//(Math.abs((Math.log(Math.floor(line.length() * 10)))) || .1) + "px Arial";
	      ctx.lineWidth = .2;
	      ctx.strokeStyle = 'black';
	      ctx.fillStyle =  'black';
	      ctx.fillText(length, 0, 0);
	      ctx.stroke()
	      ctx.restore();
	    }
	
	    draw.measurement = (measurement, color, textWidth) => {
	      const measurementColor = color || 'grey';
	      const measurementLineWidth = '.1';
	      const lines = measurement.I(1, takenLocations);
	      try {
	        const winner = lines.midpointClear();
	        if (winner === undefined) return;
	        draw.beginPath();
	        draw.line(winner.startLine, measurementColor, measurementLineWidth, true);
	        draw.line(winner.endLine, measurementColor, measurementLineWidth, true);
	        draw.line(winner, measurementColor, measurementLineWidth, true);
	        drawMeasurementLabel(winner, measurement);
	      } catch (e) {
	        console.error('Measurement render error:', e);
	      }
	    }
	
	    function snapLocColor(snapLoc) {
	      const locIdentifier = snapLoc.location().replace(/(.{1,}?)[0-9]{1,}(.*)/, '$1$2');
	      switch (locIdentifier) {
	        case "right": return 'red';
	        case "rightcenter": return 'pink';
	        case "left": return '#b57edc';
	        case "leftcenter": return 'lavender';
	        case "back": return 'gray';
	        case "backcenter": return 'yellow';
	        default: return "grey"
	      }
	    }
	
	    draw.snapLocation = (location, color, radius) => {
	      const c = color || snapLocColor(location);
	      draw.circle(location.circle(radius), 'black', c);
	    }
	
	    draw.snap = (snap, color, width) => {
	      draw(snap.object(), color, width);
	      draw(snap.object().normals());
	    }
	
	    return draw;
	  }
	}
	
	module.exports = Draw2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/hover-map.js',
function (require, exports, module) {
	
const Line2d = require('./objects/line')
	class HoverMap2d {
	  constructor(lineOrVertex, tolerance) {
	    tolerance ||= 2;
	    const toleranceFunction = (typeof tolerance) === 'function';
	    const targetFunction = (typeof lineOrVertex) === 'function';
	    function getTolerence() {
	      if (toleranceFunction) return tolerance();
	      return tolerance;
	    }
	    function vertexHovered(targetVertex, hoverVertex) {
	      return targetVertex.distance(hoverVertex) < getTolerence();
	    }
	
	    function lineHovered(targetLine, hoverVertex) {
	      const tol = getTolerence();
	      const hv = hoverVertex;
	      const sv = targetLine.startVertex();
	      const ev = targetLine.endVertex();
	      if (targetLine.isVertical()) {
	        return Math.abs(sv.x() - hv.x()) < tol &&
	              ((sv.y() > hv.y() && ev.y() < hv.y()) ||
	              (sv.y() < hv.y() && ev.y() > hv.y()));
	      } else if (targetLine.isHorizontal()) {
	        return Math.abs(sv.y() - hv.y()) < tol &&
	              ((sv.x() > hv.x() && ev.x() < hv.x()) ||
	              (sv.x() < hv.x() && ev.x() > hv.x()));
	      } else if (Math.abs(sv.y() - ev.y()) < Math.abs(sv.x() - ev.x())) {
	        const yValue = targetLine.y(hv.x());
	        return yValue + tol > hv.y() && yValue - tol < hv.y();
	      } else {
	        const xValue = targetLine.x(hv.y());
	        return xValue + tol > hv.x() && xValue - tol < hv.x();
	      }
	    }
	
	    this.target = () => lineOrVertex;
	
	    this.hovering = (hoverVertex) => {
	      const lov = targetFunction ? lineOrVertex() : lineOrVertex;
	      if (lov instanceof Line2d)
	        return lineHovered(lov, hoverVertex);
	      return vertexHovered(lov, hoverVertex);
	    }
	  }
	}
	
	module.exports = HoverMap2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/pan-zoom.js',
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
	  this.displayTransform = displayTransform;
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
	  const min = -.000000000001;
	  const max = .000000000001;
	  function hasDelta() {
	    const dt = displayTransform;
	    return !((dt.dx > min && dt.dx < max) &&
	            (dt.dy > min && dt.dy < max) &&
	            (dt.dox > min && dt.dox < max) &&
	            (dt.doy > min && dt.doy < max));
	  }
	
	  // image to show
	  // var img = new Image();
	  // img.src = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Fiat_500_in_Emilia-Romagna.jpg"
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
	    displayTransform.update();
	    displayTransform.setHome();
	    ctx.clearRect(0,0,canvas.width,canvas.height);
	    displayTransform.setTransform();
	    draw(canvas);
	    ctx.fillStyle = "white";
	    if(mouse.buttonRaw === 4){ // right click to return to homw
	         displayTransform.x = 0;
	         displayTransform.y = 0;
	         displayTransform.scale = 1;
	         displayTransform.rotate = 0;
	         displayTransform.ox = 0;
	         displayTransform.oy = 0;
	     }
	    if (hasDelta() || sleeping === false) {
	      if (once) sleeping = true;
	      setTimeout(() => requestAnimationFrame(() => update(nextUpdateId)), 10);
	    }
	  }
	  update(nextUpdateId); // start it happening
	
	  this.centerOn = function(x, y) {
	    displayTransform.scale = 1;
	    displayTransform.cox = 0;
	    displayTransform.coy = 0;
	    displayTransform.dox = 0;
	    displayTransform.doy = 0;
	    displayTransform.dx = 0;
	    displayTransform.dy = 0;
	    displayTransform.ox = 0;
	    displayTransform.oy = 0;
	    displayTransform.x = x - (canvas.width / 2);
	    displayTransform.y = y - (canvas.height / 2);
	    displayTransform.update();
	    this.once();
	  };
	
	  return this;
	}
	
	module.exports = panZoom;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/polygon.js',
function (require, exports, module) {
	const Vertex2d = require('./vertex');
	const Line2d = require('./line');
	
	class Polygon2d {
	  constructor(initialVertices) {
	    let lines = [];
	    const instance = this;
	    let faceIndecies = [2];
	    let map
	
	    this.vertices = (target, before, after) => {
	      if (lines.length === 0) return [];
	      const fullList = [];
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        fullList.push(line.startVertex());
	      }
	      if (target) {
	        const vertices = [];
	        const index = fullList.indexOf(target);
	        if (index === undefined) return null;
	        vertices = [];
	        for (let i = before; i < before + after + 1; i += 1) vertices.push(fullList[i]);
	        return vertices;
	      } else return fullList;
	
	      return vertices;
	    }
	
	    this.verticesAndMidpoints = (target, before, after) => {
	      const verts = this.vertices();
	      const both = [];
	      for (let index = 0; index < verts.length; index++) {
	        const sv = verts[index];
	        const ev = verts[index + 1 === verts.length ? 0 : index + 1];
	        both.push(sv);
	        both.push(Vertex2d.center(sv, ev));
	      }
	      return both;
	    }
	
	    function addNieghborsOfVertexWithinLine(vertex, indicies) {
	      const list = [];
	      for (let index = 0; index < indicies.length; index++) {
	        const i = indicies[index];
	        let found = false;
	        for (let index = 0; !found && index < lines.length; index++) {
	          const line = lines[index];
	          if (line.withinSegmentBounds(vertex)) {
	            found = true;
	            if (i > 0) {
	              list.push(instance.neighbors(line.endVertex(), i - 1)[0]);
	            } else if (i < 0) {
	              list.push(instance.neighbors(line.startVertex(), i + 1)[0]);
	            } else {
	              list.push(vertex);
	            }
	          }
	        }
	        if (!found) list.push(null);
	      }
	      return list;
	    }
	
	    this.neighbors = (vertex,...indicies) => {
	      const verts = this.verticesAndMidpoints();
	      const targetIndex = verts.equalIndexOf(vertex);
	      if (targetIndex !== -1) {
	        const list = [];
	        for (let index = 0; index < indicies.length; index++) {
	          const i = indicies[index];
	          const offsetIndex = Math.mod(targetIndex + i, verts.length);
	          list.push(verts[offsetIndex]);
	        }
	        return list;
	      }
	      return addNieghborsOfVertexWithinLine(vertex, indicies);
	    }
	
	    function positionRelitiveToVertex(vertex, moveTo, externalVertex) {
	      const center = instance.center();
	      if (moveTo.theta) {
	        if (externalVertex) vertex.rotate(moveTo.theta, center);
	        const rotatedPoly = instance.rotate(moveTo.theta, vertex, true);
	        const rotatedCenter = rotatedPoly.center();
	        const offset = rotatedCenter.differance(vertex);
	        return moveTo.center.translate(offset.x(), offset.y(), true);
	      }
	      const offset = center.differance(vertex);
	      return moveTo.center.translate(offset.x(), offset.y(), true);
	    }
	
	    function vertexFunction(midpoint) {
	      const getVertex = midpoint ? (line) => line.midpoint() : (line) => line.startVertex().copy();
	      return (index, moveTo) => {
	        const vertex = getVertex(lines[Math.mod(index, lines.length)]);
	        if (moveTo === undefined) return vertex;
	        return positionRelitiveToVertex(vertex, moveTo);
	      }
	    }
	
	    this.relativeToExternalVertex = (vertex, moveTo) => positionRelitiveToVertex(vertex, moveTo, true);
	    this.vertex = vertexFunction();
	    this.midpoint = vertexFunction(true);
	    this.point = (index, moveTo) => {
	      if (index % 2 === 0) return this.vertex(index/2, moveTo);
	      else return this.midpoint((index - 1)/2, moveTo);
	    }
	
	    this.midpoints = () => {
	      const list = [];
	      for (let index = 0; index < lines.length; index++) {
	        list.push(this.midpoint(index));
	      }
	      return list;
	    }
	
	    this.radians = (rads) => {
	      const currRads = new Line2d(this.center(), this.faces()[0].midpoint()).radians();
	      if (Number.isFinite(rads)) {
	        const radOffset = rads - currRads;
	        this.rotate(radOffset);
	        return rads;
	      }
	      return currRads;
	    }
	    this.angle = (angle) => Math.toDegrees(this.radians(Math.toRadians(angle)));
	
	    this.faceIndecies = (indicies) => {
	      if (indicies) {
	        if (indicies.length > 1) console.warn('vertex sorting has not been tested for multple faces');
	        faceIndecies = [0];
	        const i = indicies[0];
	        lines = lines.slice(i).concat(lines.slice(0, i));
	        for (let index = 1; index < lines.length; index++) {
	          faceIndecies.push(Math.mod(indicies[index] - i, lines.length));
	        }
	      }
	      return faceIndecies;
	    }
	    this.faces = () => this.lines().filter((l, i) => faceIndecies.indexOf(i) !== -1);
	    this.normals = () => {
	      let normals = [];
	      let center = this.center();
	      for (let index = 0; index < faceIndecies.length; index++) {
	        const line = lines[faceIndecies[index]];
	        if (line)
	          normals.push(new Line2d(center.copy(), line.midpoint()));
	      }
	      return normals;
	    }
	
	    this.lines = () => lines;
	    this.startLine = () => lines[0];
	    this.endLine = () => lines[lines.length - 1];
	    this.valid = () => lines.length > 2;
	
	    this.lineMap = (force) => {
	      if (!force && map !== undefined) return map;
	      if (lines.length === 0) return {};
	      map = {};
	      let lastEnd;
	      if (!lines[0].startVertex().equals(lines[lines.length - 1].endVertex())) throw new Error('Broken Polygon');
	      for (let index = 0; index < lines.length; index += 1) {
	        const line = lines[index];
	        if (lastEnd && !line.startVertex().equals(lastEnd)) throw new Error('Broken Polygon');
	        lastEnd = line.endVertex();
	        map[line.toString()] = line;
	      }
	      return map;
	    }
	
	    this.equals = (other) => {
	      if (!(other instanceof Polygon2d)) return false;
	      const verts = this.vertices();
	      const otherVerts = other.vertices();
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
	          if (startVertex.equals(!reverse ? curr.startVertex() : curr.endVertex())) {
	            subSection.push(!reverse ? curr : curr.negitive());
	            if (endVertex.equals(reverse ? curr.startVertex() : curr.endVertex())) {
	              completed = true;
	              break;
	            }
	          }
	        } else {
	          subSection.push(!reverse ? curr : curr.negitive());
	          if (endVertex.equals(reverse ? curr.startVertex() : curr.endVertex())) {
	            completed = true;
	            break;
	          }
	        }
	      }
	      if (completed) return subSection;
	    }
	
	    this.center = () => Vertex2d.center(...this.vertices());
	
	    this.translate = (xDiff, yDiff) => {
	      for (let index = 0; index < lines.length; index++) {
	        lines[index].startVertex().translate(xDiff, yDiff);
	      }
	    }
	
	    this.rotate = (theta, pivot, doNotModify) => {
	      pivot ||= this.center();
	      const poly = doNotModify ? this.copy() : this;
	      if (doNotModify) return this.copy().rotate(theta, pivot);
	      for (let index = 0; index < lines.length; index++) {
	        lines[index].startVertex().rotate(theta, pivot);
	      }
	      return this;
	    }
	
	    this.centerOn = (newCenter) => {
	      if (newCenter) {
	        newCenter = new Vertex2d(newCenter);
	        const center = this.center();
	        const diff = newCenter.copy().differance(center);
	        this.translate(diff.x(), diff.y());
	      }
	    }
	
	    this.addVertices = (list) => {
	      if (list === undefined) return;
	      const verts = [];
	      const endLine = this.endLine();
	      for (let index = 0; index < list.length + 1; index += 1) {
	        if (index < list.length) verts[index] = new Vertex2d(list[index]);
	        if (index > 0) {
	          const startVertex = verts[index - 1];
	          const endVertex = verts[index] || this.startLine().startVertex();
	          const line = new Line2d(startVertex, endVertex);
	          lines.push(line);
	        }
	      }
	      if (verts.length > 0 && lines.length > 0) {
	        if (endLine) endline.endVertex(verts[0]);
	      }
	      // this.removeLoops();
	      this.lineMap(true);
	    }
	
	    this.addBest = (lineList) => {
	      if (lineList.length > 100) throw new Error('This algorythum is slow: you should either find a way to speed it up or use a different method');
	      const lastLine = lines[lines.length - 2];
	      const endVert = lastLine.endVertex();
	      lineList.sort(Line2d.distanceSort(endVert));
	      const nextLine = lineList[0].acquiescent(lastLine);
	      const connectLine = new Line2d(endVert, nextLine.startVertex());
	      endVert.translate(connectLine.run()/2, connectLine.rise()/2);
	      lines.splice(lines.length - 1, 1);
	      const newLastLine = new Line2d(endVert, nextLine.endVertex());
	      const newConnectLine = new Line2d(nextLine.endVertex(), lines[0].startVertex());
	      lines.push(newLastLine);
	      if (!newConnectLine.isPoint()) lines.push(newConnectLine);
	      lineList.splice(0,1);
	    }
	
	    this.path = (offset) => {
	      offset ||= 0;
	      let path = '';
	      const verts = this.vertices();
	      for (let index = 0; index < verts.length; index++) {
	        const i = Math.mod(index + offset, verts.length);
	        path += `${verts[i].toString()} => `
	      }
	      return path.substring(0, path.length - 4);
	    }
	
	    this.toString = this.path;
	    this.area = () => {
	      let total = 0;
	      let verts = this.vertices();
	      for (var i = 0, l = verts.length; i < l; i++) {
	        var addX = verts[i].x();
	        var addY = verts[i == verts.length - 1 ? 0 : i + 1].y();
	        var subX = verts[i == verts.length - 1 ? 0 : i + 1].x();
	        var subY = verts[i].y();
	
	        total += (addX * addY * 0.5);
	        total -= (subX * subY * 0.5);
	      }
	
	      return Math.abs(total);
	    }
	
	    this.clockWise = () => {
	      let sum = 0;
	      for (let index = 0; index < lines.length; index++) {
	        const l = lines[index];
	        sum += (l.endVertex().x() - l.startVertex().x()) * (l.endVertex().y() + l.startVertex().y());
	      }
	      return sum >= 0;
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
	
	    this.copy = () => new Polygon2d(this.vertices().map((v) => v.copy()));
	
	    this.addVertices(initialVertices);
	  }
	}
	
	Polygon2d.centerOn = (newCenter, polys) => {
	  newCenter = new Vertex2d(newCenter);
	  const center = Polygon2d.center(...polys);
	  const diff = newCenter.copy().differance(center);
	  for (let index = 0; index < polys.length; index++) {
	    const poly = polys[index];
	    poly.translate(diff.x(), diff.y());
	  }
	}
	
	Polygon2d.build = (lines) => {
	  const start = lines[0].startVertex().copy();
	  const end = lines[0].endVertex().copy();
	  lines.splice(0, 1);
	  const poly = new Polygon2d([start, end]);
	  while (lines.length > 0) {
	    poly.addBest(lines);
	  }
	  return poly;
	}
	
	Polygon2d.fromLines = (lines) => {
	  if (lines === undefined || lines.length === 0) return null;
	  let lastLine = lines[0];
	  const verts = [lastLine.startVertex()];
	  for (let index = 1; index < lines.length; index++) {
	    let line = lines[index].acquiescent(lastLine);
	    if (!line.startVertex().equals(verts[verts.length - 1])) {
	      verts.push(line.startVertex());
	    }
	    if (!line.endVertex().equals(verts[verts.length - 1])) {
	      if (index !== lines.length - 1 || !line.endVertex().equals(verts[0]))
	        verts.push(line.endVertex());
	    }
	    lastLine = line;
	  }
	  return new Polygon2d(verts);
	}
	
	Polygon2d.minMax = (...polys) => {
	  const centers = [];
	  const max = new Vertex2d(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
	  const min = new Vertex2d(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
	  for (let index = 0; index < polys.length; index += 1) {
	    const verts = polys[index].vertices();
	    for (let vIndex = 0; vIndex < verts.length; vIndex++) {
	      const vert = verts[vIndex];
	      if (max.x() < vert.x()) max.x(vert.x());
	      if (max.y() < vert.y()) max.y(vert.y());
	      if (min.x() > vert.x()) min.x(vert.x());
	      if (min.y() > vert.y()) min.y(vert.y());
	    }
	  }
	  return {min, max};
	}
	
	Polygon2d.center = (...polys) => {
	  const minMax = Polygon2d.minMax(...polys);
	  return Vertex2d.center(minMax.min, minMax.max);
	}
	
	Polygon2d.lines = (...polys) => {
	  if (Array.isArray(polys[0])) polys = polys[0];
	  let lines = [];
	  for (let index = 0; index < polys.length; index += 1) {
	    lines = lines.concat(polys[index].lines());
	  }
	  // return lines;
	  const consolidated = Line2d.consolidate(...Line2d.consolidate(...lines));
	  if (consolidated.length !== Line2d.consolidate(...consolidated).length) {
	    console.error.subtle('Line Consolidation malfunction');
	  }
	  return consolidated;
	}
	
	
	
	const vertRegStr = "\\(([0-9]*(\\.[0-9]*|))\\s*,\\s*([0-9]*(\\.[0-9]*|))\\)";
	const vertReg = new RegExp(vertRegStr);
	const vertRegG = new RegExp(vertRegStr, 'g');
	
	Polygon2d.fromString = (str) => {
	  const vertStrs = str.match(vertRegG);
	  const verts = vertStrs.map((str) => {
	    const match = str.match(vertReg);
	    return new Vertex2d(Number.parseFloat(match[1]), Number.parseFloat(match[3]));
	  });
	  return new Polygon2d(verts);
	}
	
	const tol = .1;
	Polygon2d.toParimeter = (lines, recurseObj) => {
	  if (lines.length < 2) throw new Error('Not enough lines to create a parimeter');
	  let lineMap, splitMap, parimeter;
	  if (recurseObj) {
	    lineMap = recurseObj.lineMap;
	    splitMap = recurseObj.splitMap;
	    parimeter = recurseObj.parimeter;
	  } else {
	    lineMap = Line2d.toleranceMap(tol, true, lines);
	    const center = Vertex2d.center(Line2d.vertices(lines));
	    const isolate = Line2d.isolateFurthestLine(center, lines);
	    splitMap = Vertex2d.toleranceMap();
	    // splitMap.add(isolate.line.startVertex());
	    parimeter = [isolate.line];
	  }
	  parimeter.slice(1).forEach((l) => {
	    if (splitMap.matches(l.startVertex()).length === 0)
	      throw new Error('wtf');
	  });
	  if (parimeter.length > lines.length) return null;
	  const sv = parimeter[0].startVertex();
	  const ev = parimeter[parimeter.length - 1].endVertex();
	  const alreadyVisitedStart = splitMap.matches(sv).length !== 0;
	  const alreadyVisitedEnd = splitMap.matches(ev).length !== 0;
	  if (alreadyVisitedEnd || alreadyVisitedStart) return null;
	  const madeItAround = parimeter.length > 1 && sv.equals(ev);
	  if (madeItAround) return Polygon2d.fromLines(parimeter);
	
	  const startLine = parimeter[0];
	  const partialParimeters = []
	  const lastLine = parimeter[parimeter.length - 1];
	  let matches = lineMap.matches(lastLine.negitive());
	  if (matches.length < 2) {
	    if (parimeter.length === 1) {
	      lines.remove(lastLine);
	      return Polygon2d.toParimeter(lines);
	    } else return null;
	  }
	    // throw new Error('A parimeter must exist between lines for function to work');
	  for (let index = 0; index < matches.length; index++) {
	    if (splitMap.matches(matches[index].endVertex()).length === 0) {
	      const newParim = Array.from(parimeter).concat(matches[index]);
	      const newSplitMap = splitMap.clone();
	      newSplitMap.add(matches[index].startVertex());
	      partialParimeters.push({parimeter: newParim, splitMap: newSplitMap, lineMap});
	    }
	  }
	
	  let biggest = null;
	  for (let index = 0; index < partialParimeters.length; index ++) {
	    const recObj = partialParimeters[index];
	    const searchResult = Polygon2d.toParimeter(lines, recObj);
	    if (biggest === null || (searchResult !== null && biggest.area() < searchResult.area()))
	      biggest = searchResult;
	  }
	  if (recurseObj === undefined)
	    biggest = biggest.clockWise() ? biggest : new Polygon2d(biggest.vertices().reverse());
	  return biggest;
	}
	
	
	new Polygon2d();
	module.exports = Polygon2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/circle.js',
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
	      if (input === undefined)
	        console.log('here');
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


RequireJS.addFunction('./public/js/utils/canvas/two-d/maps/escape.js',
function (require, exports, module) {
	
const Line2d = require('../objects/line');
	const Vertex2d = require('../objects/vertex');
	const Polygon2d = require('../objects/polygon');
	const Tolerance = require('../../../tolerance.js');
	const ToleranceMap = require('../../../tolerance-map.js');
	const tol = .0015;
	const withinTol = Tolerance.within(tol);
	
	class EscapeGroup {
	  constructor(line) {
	    let canEscape;
	    const lineMap = {};
	    const id = String.random();
	    lineMap[line.toString()] = line;
	    let reference, type;
	
	    this.id = () => id;
	    this.type = (val) => {
	      if (val !== undefined) type = val;
	      return type;
	    }
	    this.reference = (other) => {
	      if (other instanceof EscapeGroup && other !== this)
	        reference = other;
	      return reference;
	    }
	    this.lines = () => Object.values(lineMap);
	    this.canEscape = (ce, type) => {
	      if (ce === true || ce === false) {
	        if ((canEscape === true && ce === false) || (canEscape === false && ce === true))
	          console.warn('Conflicting escape values???');
	      }
	      this.type(type);
	      if (ce === true && this.type() !== 'independent') {
	        console.log.subtle('gotcha', 1000);
	      }
	      if (ce === true) canEscape = true;
	      return canEscape;
	    }
	    this.connect = (other) => {
	      if (other === this) return;
	      const lines = other.lines();
	      for (let index = 0; index < lines.length; index++) {
	        const line = lines[index];
	        lineMap[line.toString()] = line;
	      }
	      this.canEscape(other.canEscape());
	    }
	  }
	}
	
	class Escape {
	  constructor(line) {
	    let escapeGroupRight = new EscapeGroup(line);
	    let escapeGroupLeft = new EscapeGroup(line);
	    let groupIdMap = {}
	    groupIdMap[escapeGroupRight.id()] = true;
	    groupIdMap[escapeGroupLeft.id()] = true;
	    const updateReference = {
	      left: () => {
	        let reference = escapeGroupLeft.reference();
	        if (reference) {
	          if (groupIdMap[reference.id()]) {
	            reference = new EscapeGroup(line);
	            reference.connect(escapeGroupLeft);
	          }
	          groupIdMap[reference.id()] = true;
	          escapeGroupLeft = reference;
	          updateReference.left();
	        }
	      },
	      right: () => {
	        let reference = escapeGroupRight.reference();
	        if (reference) {
	          if (groupIdMap[reference.id()]) {
	            reference = new EscapeGroup(line);
	            reference.connect(escapeGroupRight);
	          }
	          groupIdMap[reference.id()] = true;
	          escapeGroupRight = reference;
	          updateReference.right();
	        }
	      }
	    }
	    this.updateReference = () => updateReference.left() || updateReference.right();
	    this.right = (ce, type) => {
	      updateReference.right();
	      return escapeGroupRight.canEscape(ce, type);
	    }
	    this.left = (ce, type) => {
	      updateReference.left();
	      return escapeGroupLeft.canEscape(ce, type);
	    }
	
	    this.right.connected = (other) => {
	      updateReference.right();
	      escapeGroupRight.connect(other);
	      other.reference(escapeGroupRight);
	    }
	    this.left.connected = (other) => {
	      updateReference.left();
	      escapeGroupLeft.connect(other);
	      other.reference(escapeGroupLeft);
	    }
	
	    this.right.group = () => escapeGroupRight;
	    this.left.group = () => escapeGroupLeft;
	    this.right.type = (type) => escapeGroupRight.type(type);
	    this.left.type = (type) => escapeGroupLeft.type(type);
	  }
	}
	
	class EscapeMap {
	  constructor(lines, perpindicularDistance) {
	    perpindicularDistance ||= .05;
	    const instance = this;
	    let escapeObj;
	
	    function escapeLines(lines, perpDist) {
	      const getState = (lineOstr) =>
	        escapeObj.states[lineOstr instanceof Line2d ? lineOstr.toString() : lineOstr];
	
	      function recursiveEscape(obj) {
	        const closests = Object.values(obj.closest);
	        for (let cIndex = 0; cIndex < closests.length; cIndex++) {
	          setEscapes(obj, closests[cIndex]);
	        }
	      }
	
	      function setEscape(obj, closest, dir) {
	        const dirObj = closest[dir];
	        if (dirObj.line) {
	          const dirState = getState(dirObj.line);
	          let dirOfEndpoint = dirObj.line.direction(dirObj.runner.endVertex());
	          let escapeBretheran = dirOfEndpoint === 'left' ? dirState.escape.right.group() : dirState.escape.left.group();
	          obj.escape[dir].connected(escapeBretheran);
	          dirState.escape.updateReference();
	          if (obj.escape[dir]()) dirObj.successful = true;
	        }
	      }
	
	      function setEscapes(obj, closest) {
	        if (obj.escape.right() === true) obj.escape.left(false);
	        else if (obj.escape.left() === true) obj.escape.right(false);
	        setEscape(obj, closest, 'right');
	        setEscape(obj, closest, 'left');
	        return obj;
	      }
	
	      const initEscape = (line, index) => {
	        if (getState(line) === undefined)
	          escapeObj.states[line.toString()] = {index, line, closest: {}, escape: new Escape(line)};
	      };
	
	      const isClosest = (origin, curr, prospective) => prospective instanceof Vertex2d &&
	                    (!curr || prospective.distance(origin) < curr.distance(origin));
	
	      function runners(line, funcName, radians) {
	        const state = getState(line);
	        const vertex = line[funcName]();
	        const perp = line.perpendicular(perpDist, vertex, true);
	        const rightOrigin = Line2d.startAndTheta(perp.startVertex(), radians - Math.PI, .1).endVertex();
	        const right = Line2d.startAndTheta(rightOrigin, radians, 1000000000);
	        const leftOrigin = Line2d.startAndTheta(perp.endVertex(), radians - Math.PI, .1).endVertex();
	        const left = Line2d.startAndTheta(leftOrigin, radians, 100000000);
	        escapeObj.runners.right.push(right);
	        escapeObj.runners.left.push(left);
	        state.closest[funcName] = {right: {}, left:{}};
	        let closest = state.closest[funcName];
	        let escapedLeft = true;
	        let escapedRight = true;
	        for (let index = 0; index < lines.length; index++) {
	          const other = lines[index];
	          const leftIntersection = left.findDirectionalIntersection(other);
	          if (other.withinSegmentBounds(leftIntersection)) {
	            escapedLeft = false;
	            if (isClosest(leftOrigin, closest.left.intersection, leftIntersection)) {
	              const escapeLine = new Line2d(left.startVertex(), leftIntersection);
	              closest.left = {intersection: leftIntersection, line: other, escapeLine, runner: left};
	            }
	          }
	          const rightIntersection = right.findDirectionalIntersection(other);
	          if (other.withinSegmentBounds(rightIntersection)) {
	            escapedRight = false;
	            if (isClosest(rightOrigin, closest.right.intersection, rightIntersection)) {
	              const escapeLine = new Line2d(right.startVertex(), rightIntersection);
	              closest.right = {intersection: rightIntersection, line: other, escapeLine, runner: right};
	            }
	          }
	        }
	
	        if (escapedRight)
	          state.escape.right(true, 'independent');
	        if (escapedLeft)
	          state.escape.left(true, 'independent');
	        if (escapedRight || escapedLeft) state.type = 'independent';
	      }
	
	      function runAll(lines) {
	        escapeObj = {states: {}, runners: {right: [], left: []}};
	        for (let index = 0; index < lines.length; index++) {
	          const line = lines[index];
	          initEscape(line, index);
	          runners(line, 'startVertex', line.radians() - Math.PI);
	          runners(line, 'endVertex', line.radians());
	        }
	      }
	
	      runAll(lines);
	
	      const indStates = instance.states.independent();
	      const indLines = indStates.map(s => s.line);
	      for (let index = indStates.length - 1; index > -1; index--) {
	        const state = indStates[index];
	        const indLine = state.line;
	        const sliced = indLine.slice(indLines);
	        if (sliced) {
	          lines.splice(state.index, 1);
	          for (let sIndex = 0; sIndex < sliced.length; sIndex++) {
	            lines.push(sliced[sIndex]);
	          }
	        }
	      }
	
	      runAll(lines);
	
	      const values = Object.values(escapeObj.states);
	      for (let index = 0; index < values.length; index++) {
	        recursiveEscape(values[index]);
	      }
	      return escapeObj;
	    }
	
	    this.states = () => escapeObj.states;
	    this.states.independent = () => Object.values(escapeObj.states)
	                                .filter(obj => obj.type === 'independent');
	    this.independent = () => this.states.independent().map(obj => obj.line);
	
	
	    this.dependent = () => Object.values(escapeObj.states)
	                                .filter(obj => (obj.escape.left() || obj.escape.right()) && obj.type !== 'independent')
	                                .map(obj => obj.line);
	    this.escaped = () => Object.values(escapeObj.states)
	                                .filter(obj => obj.escape.left() || obj.escape.right())
	                                .map(obj => obj.line);
	
	    this.groups = () => {
	      const parents = {};
	      Object.values(escapeObj.states).forEach((obj) => {
	        if (parents[obj.escape.right.group().id()] === undefined)
	          parents[obj.escape.right.group().id()] = obj.escape.right.group();
	        if (parents[obj.escape.left.group().id()] === undefined)
	          parents[obj.escape.left.group().id()] = obj.escape.left.group();
	      })
	      return Object.values(parents);
	    }
	
	    this.escapeAttempts = (successOfailure) => {
	      const lines = [];
	      const add = (obj) =>
	            (successOfailure === undefined || (successOfailure && obj.successful) || (!successOfailure && !obj.successful)) &&
	            obj.intersection && lines.push(obj.escapeLine);
	      const lateBloomers = Object.values(escapeObj.states).filter(obj => obj.type !== 'independent');
	      for (let index = 0; index < lateBloomers.length; index++) {
	        const target = lateBloomers[index];
	        const closests = Object.values(target.closest);
	        for (let cIndex = 0; cIndex < closests.length; cIndex++) {
	          add(closests[cIndex].right);
	          add(closests[cIndex].left);
	        }
	      }
	      return lines;
	    }
	
	
	
	    this.toDrawString = () => {
	      let str = Line2d.toDrawString(lines);
	      // str += '\n\n//Right Runners\n' + Line2d.toDrawString(escapeObj.runners.right, 'red');
	      // str += '\n\n//Left Runners\n' + Line2d.toDrawString(escapeObj.runners.left, 'lavender');
	      str += '\n\n//Independed Escapers\n' + Line2d.toDrawString(this.independent(), 'green');
	      str += '\n\n//Dependent Escapers\n' + Line2d.toDrawString(this.dependent(), 'lightgreen');
	      // str += '\n\n//Successful Escapes\n' + Line2d.toDrawString(this.escapeAttempts(true), 'blue');
	      // str += '\n\n//Attempted Escapes\n' + Line2d.toDrawString(this.escapeAttempts(false), 'red');
	      return str;
	    }
	
	    this.groupDrawString = () => {
	      const groups = this.groups();
	      let str = '';
	      for (let index = 0; index < groups.length; index++) {
	        const group = groups[index];
	        const lines = group.lines();
	        str += `\n\n//Group ${index} (${lines.length})\n//${Line2d.toDrawString(lines, 'red')}`;
	      }
	      return str;
	    }
	
	    escapeLines(lines, perpindicularDistance);
	  }
	}
	
	EscapeMap.parimeter = (lines) => {
	  const escapeObj = new EscapeMap(lines);
	  const escaped = escapeObj.escaped();
	  const breakdown = Line2d.sliceAll(escaped);
	  const parimeter = new EscapeMap(breakdown).escaped();
	  const poly = Polygon2d.build(parimeter);
	  console.log(escapeObj.toDrawString());
	  return poly;
	}
	
	module.exports = EscapeMap;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/line-measurement.js',
function (require, exports, module) {
	
const Circle2d = require('circle');
	const Vertex2d = require('vertex');
	const Line2d = require('line');
	const Lookup = require('../../../object/lookup');
	const Measurement = require('../../../measurement.js');
	const approximate = require('../../../approximate.js');
	const ToleranceMap = require('../../../tolerance-map.js');
	
	class LineMeasurement2d {
	  constructor(line, center, layer, modificationFunction) {
	    const offset = 3;
	    this.line = () => line;
	
	    function modifyMeasurment(offsetLine, line, buffer, takenLocations) {
	      const startLength = line.startLine.length();
	      line.startLine.length(startLength + buffer);
	      line.endLine.length(startLength + buffer);
	      line.translate(offsetLine);
	      let notTaken = true;
	      const point = line.midpoint();
	      for (let index = 0; index < takenLocations.length; index++) {
	        const locationInfo = takenLocations[index];
	        const takenPoint = locationInfo.point;
	        const biggestBuffer = locationInfo.buffer < buffer ? locationInfo.buffer : buffer;
	        if (takenPoint.distance(point) < biggestBuffer) {
	          if (takenPoint.length === length) return;
	          notTaken = false;
	        }
	      }
	      return notTaken === true ? point : undefined;
	    }
	
	    function notTaken(obj) {
	      return (buffer) => {
	        buffer ||= 7.5;
	        const closer = obj.closerLine();
	        const further = obj.furtherLine();
	        const cStartL = further.startLine
	        const cEndL = further.endLine
	        const offsetLine = cStartL.copy();
	        offsetLine.length(buffer);
	        const length = approximate(further.length());
	        do {
	          const point = modifyMeasurment(offsetLine, further, buffer, obj.takenLocations);
	          if (point) {
	            obj.takenLocations.push({point, buffer, length});
	            return further;
	          }
	        } while (buffer < 1000);
	      }
	    }
	    this.I = (l, takenLocations) => {
	      takenLocations ||= [];
	      l = l || layer || 1;
	      const termDist = (l + 1) * offset;
	      const measureDist = l * offset;
	      const startLine = line.perpendicular(termDist * 2, line.startVertex(), true);
	      const endLine = line.perpendicular(termDist * 2, line.endVertex(), true);
	      const startCircle = new Circle2d(measureDist, line.startVertex());
	      const endCircle = new Circle2d(measureDist, line.endVertex());
	      const startTerminationCircle = new Circle2d(termDist - 2.5, line.startVertex());
	      const endTerminationCircle = new Circle2d(termDist - 2.5, line.endVertex());
	      const startVertices = startCircle.intersections(startLine);
	      const endVertices = endCircle.intersections(endLine);
	      let l1, l2;
	      if (startVertices.length > 0 && endVertices.length > 0) {
	        const startTerminationVertices = startTerminationCircle.intersections(startLine);
	        const endTerminationVertices = endTerminationCircle.intersections(endLine);
	        let startTerminationLine, endTerminationLine, measurementLine;
	
	        l1 = new Line2d(startVertices[1], endVertices[1]);
	        l1.startLine = new Line2d(line.startVertex(), startTerminationVertices[1]);
	        l1.endLine = new Line2d(line.endVertex(), endTerminationVertices[1]);
	
	        l2 = new Line2d(startVertices[0], endVertices[0]);
	        l2.startLine = new Line2d(line.startVertex(), startTerminationVertices[0]);
	        l2.endLine = new Line2d(line.endVertex(), endTerminationVertices[0]);
	        const furtherLine = (point) => LineMeasurement2d.furtherLine(l1, l2, point || center);
	        const closerLine = (point) => LineMeasurement2d.furtherLine(l1, l2, point || center, true);
	        const obj = {furtherLine, closerLine, takenLocations};
	        obj.midpointClear = notTaken(obj);
	        return obj;
	      } else {
	        throw new Error('No Intersection???');
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
	
	function measurementLevel(line) {
	  if ((typeof line.length) !== 'function')
	    console.log(line);
	
	  return Math.log(line.length()*line.length())*2;
	}
	
	const lengthSortFunc = (center) => (l1, l2) => {
	  const lengthDiff = l1.length() - l2.length();
	  if (lengthDiff !== 0)
	    return lengthDiff;
	  return center.distance(l2.midpoint()) - center.distance(l1.midpoint());
	}
	LineMeasurement2d.measurements = (lines) => {
	  const verts = Line2d.vertices(lines);
	  const center = Vertex2d.center(...verts);
	  lines.sort(lengthSortFunc(center));
	  // lines.sort(lengthSortFunc(center));
	  const measurements = [];
	  const lengthMap = new ToleranceMap({length: .00001});
	  for (let tIndex = 0; tIndex < lines.length; tIndex += 1) {
	    const tarVerts = lines[tIndex].liesOn(verts);
	    if (tarVerts.length > 2) {
	      for (let index = 1; index < tarVerts.length; index += 1) {
	        const sv = tarVerts[index - 1];
	        const ev = tarVerts[index];
	        const line = new Line2d(sv,ev);
	        lengthMap.add(line);
	      }
	    }
	    if (tarVerts.length > 1) {
	      const sv = tarVerts[0];
	      const ev = tarVerts[tarVerts.length - 1];
	      const line = new Line2d(sv,ev);
	      lengthMap.add(line);
	    }
	  }
	
	
	  const lengths = Object.keys(lengthMap.map());
	  const slopeMap = new ToleranceMap({length: .00001, slope: .1});
	  for (index = 0; index < lengths.length; index += 1) {
	    let lines = lengthMap.map()[lengths[index]];
	    //TODO: possibly restrict the measurements that display....
	    for(let li = 0; li < lines.length; li++) {
	      const line = lines[li];
	      const perpLine = line.perpendicular();
	      if (slopeMap.matches(perpLine).length === 0) {
	        slopeMap.add(perpLine);
	      } else {
	        lines.splice(li, 1);
	        li--;
	      }
	    }
	    measurements.concatInPlace(lines);
	  }
	
	  for (let index = 0; index < measurements.length; index++)
	    if (approximate.abs(measurements[index].length()) !== 0)
	      measurements[index] = new LineMeasurement2d(measurements[index], center, measurementLevel(measurements[index]));
	    else
	      measurements.splice(index--, 1);
	
	  return measurements;
	}
	
	LineMeasurement2d.furtherLine = (l1, l2, point, closer) =>
	    point === undefined ? (closer ? l1 : l2) :
	    (l1.midpoint().distance(point) > l2.midpoint().distance(point) ?
	      (closer ? l2 : l1) :
	      (closer ? l1 : l2));
	
	module.exports = LineMeasurement2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/corner.js',
function (require, exports, module) {
	//
	// const Vertex2d = require('vertex');
	//
	// class Corner {
	//   constructor(center, height, width, radians) {
	//     width = width === undefined ? 121.92 : width;
	//     height = height === undefined ? 60.96 : height;
	//     radians = radians === undefined ? 0 : radians;
	//     const instance = this;
	//     Object.getSet(this, {center: new Vertex2d(center), height, width, radians});
	//     if ((typeof center) === 'function') this.center = center;
	//     const startPoint = new Vertex2d(null);
	//
	//     const getterHeight = this.height;
	//     this.height = (v) => {
	//       notify(getterHeight(), v);
	//       return getterHeight(v);
	//     }
	//     const getterWidth = this.width;
	//     this.width = (v) => notify(getterWidth(), v) || getterWidth(v);
	//
	//     const changeFuncs = [];
	//     this.onChange = (func) => {
	//       if ((typeof func) === 'function') {
	//         changeFuncs.push(func);
	//       }
	//     }
	//
	//     let lastNotificationId = 0;
	//     function notify(currentValue, newValue) {
	//       if (changeFuncs.length === 0 || (typeof newValue) !== 'number') return;
	//       if (newValue !== currentValue) {
	//         const id = ++lastNotificationId;
	//         setTimeout(() => {
	//           if (id === lastNotificationId)
	//             for (let i = 0; i < changeFuncs.length; i++) changeFuncs[i](instance);
	//         }, 100);
	//       }
	//     }
	//
	//     this.radians = (newValue) => {
	//       if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
	//         notify(radians, newValue);
	//         radians = newValue;
	//       }
	//       return radians;
	//     };
	//     this.startPoint = () => {
	//       startPoint.point({x: this.center().x() - width / 2, y: this.center().y() - height / 2});
	//       return startPoint;
	//     }
	//     this.angle = (value) => {
	//       if (value !== undefined) this.radians(Math.toRadians(value));
	//       return Math.toDegrees(this.radians());
	//     }
	//
	//     // this.x = (val) => notify(this.center().x(), val) || this.center().x(val);
	//     // this.y = (val) => notify(this.center().y(), val) || this.center().y(val);
	//     this.x = (val) => {
	//       if (val !== undefined) this.center().x(val);
	//       return this.center().x();
	//     }
	//     this.y = (val) => {
	//       if (val !== undefined) this.center().y(val);
	//       return this.center().y();
	//     }
	//     this.minDem = () => this.width() > this.height() ? this.width() : this.height();
	//     this.maxDem = () => this.width() > this.height() ? this.width() : this.height();
	//
	//     this.shorterSideLength = () => this.height() < this.width() ? this.height() : this.width();
	//     this.move = (position, theta) => {
	//       const center = position.center instanceof Vertex2d ? position.center.point() : position.center;
	//       if (position.maxX !== undefined) center.x = position.maxX - this.offsetX();
	//       if (position.maxY !== undefined) center.y = position.maxY - this.offsetY();
	//       if (position.minX !== undefined) center.x = position.minX + this.offsetX();
	//       if (position.minY !== undefined) center.y = position.minY + this.offsetY();
	//       this.radians(position.theta);
	//       this.center().point(center);
	//       return true;
	//     };
	//
	//     function centerMethod(widthMultiplier, heightMultiplier, position) {
	//       const center = instance.center();
	//       const rads = instance.radians();
	//       const offsetX = instance.width() * widthMultiplier * Math.cos(rads) -
	//                         instance.height() * heightMultiplier * Math.sin(rads);
	//       const offsetY = instance.height() * heightMultiplier * Math.cos(rads) +
	//                         instance.width() * widthMultiplier * Math.sin(rads);
	//
	//       if (position !== undefined) {
	//         const posCenter = new Vertex2d(position.center);
	//         return new Vertex2d({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
	//       }
	//       const backLeftLocation = {
	//             x: instance.center().x() - offsetX ,
	//             y: instance.center().y() - offsetY
	//       };
	//       return new Vertex2d(backLeftLocation);
	//     }
	//
	//
	//     this.frontCenter = (position) => centerMethod(0, -.5, position);
	//     this.backCenter = (position) => centerMethod(0, .5, position);
	//     this.leftCenter = (position) => centerMethod(.5, 0, position);
	//     this.rightCenter = (position) => centerMethod(-.5, 0, position);
	//
	//     this.backLeft = (position) => centerMethod(.5, .5, position);
	//     this.backRight = (position) => centerMethod(-.5, .5, position);
	//     this.frontLeft = (position) =>  centerMethod(.5, -.5, position);
	//     this.frontRight = (position) => centerMethod(-.5, -.5, position);
	//
	//     this.offsetX = (negitive) => negitive ? this.width() / -2 : this.width() / 2;
	//     this.offsetY = (negitive) => negitive ? this.height() / -2 : this.height() / 2;
	//
	//     this.toString = () => `[${this.frontLeft()} - ${this.frontRight()}]\n[${this.backLeft()} - ${this.backRight()}]`
	//   }
	// }
	//
	// new Square2d();
	//
	// module.exports = Square2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/line.js',
function (require, exports, module) {
	
const Vertex2d = require('./vertex');
	const Circle2d = require('./circle');
	const ToleranceMap = require('../../../tolerance-map.js');
	const Tolerance = require('../../../tolerance.js');
	const tol = .01;
	const withinTol = Tolerance.within(tol);
	
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
	
	    this.rise = () => endVertex.y() - startVertex.y();
	    this.run = () =>  endVertex.x() - startVertex.x();
	
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
	
	    this.isVertical = () => this.slope() > 1000;
	    this.isHorizontal = () => Math.abs(this.slope()) < .001;
	
	    this.withinDirectionalBounds = (point, limit) => {
	      point = new Vertex2d(point);
	      const withinLimit = limit === undefined || (limit > point.y() && limit > point.x());
	      const rise = this.rise();
	      const run = this.run();
	      if (withinLimit && this.withinSegmentBounds(point)) return true;
	      const offsetPoint = Line2d.startAndTheta(point, this.radians(), .0000001).endVertex();
	      if (this.startVertex().distance(point) > this.startVertex().distance(offsetPoint)) return false;
	      return withinLimit;
	    }
	
	    this.withinSegmentBounds = (pointOline) => {
	      if (pointOline instanceof Line2d) {
	        const l = pointOline
	        const slopeEqual = withinTol(this.slope(), l.slope());
	        const c = l.midpoint();
	        const xBounded = c.x() < this.maxX() + tol && c.x() > this.minX() - tol;
	        const yBounded = c.y() < this.maxY() + tol && c.y() > this.minY() - tol;
	        if (slopeEqual && xBounded && yBounded) return true;
	        return this.withinSegmentBounds(l.startVertex()) || this.withinSegmentBounds(l.endVertex()) ||
	                l.withinSegmentBounds(this.startVertex()) || l.withinSegmentBounds(this.endVertex());
	      } else {
	        let point = new Vertex2d(pointOline);
	        return this.minX() - tol < point.x() && this.minY() - tol < point.y() &&
	          this.maxX() + tol > point.x() && this.maxY() + tol > point.y();
	      }
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
	
	    this.translate = (line) => {
	      const xOffset = line.endVertex().x() - line.startVertex().x();
	      const yOffset = line.endVertex().y() - line.startVertex().y();
	      this.startVertex().translate(xOffset, yOffset);
	      this.endVertex().translate(xOffset, yOffset);
	    }
	
	    this.length = (value) => {
	      value = Number.parseFloat(value);
	      if (!Number.isNaN(value) && value !== 0) {
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
	      return Line2d.getSlope(v1.x(), v1.y(), v2.x(), v2.y());
	    }
	
	    function getB(x, y, slope) {
	      if (slope === 0) return y;
	      else if (Math.abs(slope) === Infinity) {
	        if (instance.startVertex().x() === 0) return 0;
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
	
	    this.closestEnds = (other) => {
	      const tsv = this.startVertex();
	      const osv = other.startVertex();
	      const tev = this.endVertex();
	      const oev = other.endVertex();
	
	      const ss = tsv.distance(osv);
	      const se = tsv.distance(oev);
	      const ee = tev.distance(oev);
	      const es = tev.distance(osv);
	
	      if (ss <= se && ss <= ee && ss <= es) return [tsv, osv];
	      if (se <= ee && se <= es) return [tsv, oev];
	      if (ee <= es) return [tev, oev];
	      else return [tev, osv]
	    }
	
	    // Always returns left side of intersection path
	    this.thetaBetween = (other) => {
	      if (!(other instanceof Line2d)) throw new Error('Cannot calculate thetaBetween if arg1 is not an instanceof Line2d');
	      let theta;
	      let theta1 = this.radians();
	      let closestEnds = this.closestEnds(other);
	      if (closestEnds.indexOf(this.startVertex()) !== -1) {
	        theta1 += Math.PI;
	      }
	      let theta2 = other.radians();
	      if (closestEnds.indexOf(other.startVertex()) !== -1) {
	        theta2 += Math.PI;
	      }
	
	      if (theta1 > theta2) {
	        theta = theta2 - theta1 + Math.PI * 2;
	      } else {
	        theta = theta2 - theta1;
	      }
	      return theta % (2 * Math.PI)
	    }
	
	    this.yIntercept = () => getB(this.startVertex().x(), this.startVertex().y(), this.slope());
	    this.slope = () => getSlope(this.startVertex(), this.endVertex());
	    this.y = (x) => {
	      x ||= this.startVertex().x();
	      const slope = this.slope();
	      if (slope === Infinity) return Infinity;
	      if (slope === 0) return this.startVertex().y();
	      return  (this.slope()*x + this.yIntercept());
	    }
	
	    this.x = (y) => {
	      y ||= this.startVertex().y();
	      const slope = this.slope();
	      if (slope === Infinity) return this.startVertex().x();
	      if (slope === 0) {
	        return Infinity;
	      }
	      return (y - this.yIntercept())/slope;
	    }
	
	    //TODO: fix!!!!
	    this.liesOn = (vertices) => {
	      const liesOn = [];
	      for (let index = 0; index < vertices.length; index += 1) {
	        const v = vertices[index];
	        const y = this.y(v.x());
	        if ((withinTol(y, v.y()) || Math.abs(y) === Infinity) && this.withinSegmentBounds(v)) {
	          liesOn.push(v);
	        }
	      }
	      liesOn.sort(Vertex2d.sort);
	      return liesOn;
	    }
	
	    this.isOn = (vertex) => {
	      const y = this.y(vertex.x());
	      return (y === vertex.y() || Math.abs(y) === Infinity) && this.withinSegmentBounds(vertex);
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
	      const perpLine = this.perpendicular(undefined, vertex, true);
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
	
	    this.closestVertex = (vertex) => {
	      const sv = this.startVertex()
	      const ev = this.endVertex()
	      return sv.distance(vertex) < ev.distance(vertex) ? sv : ev;
	    }
	    this.furthestVertex = (vertex) => {
	      const sv = this.startVertex()
	      const ev = this.endVertex()
	      return sv.distance(vertex) > ev.distance(vertex) ? sv : ev;
	    }
	
	    const leftRightTol = .000001;
	    function rightLeftInfo(vertex) {
	      const closestPoint = instance.closestPointOnLine(vertex);
	      const perp = instance.perpendicular(vertex.distance(closestPoint)/2, closestPoint, true);
	      const distStart = vertex.distance(perp.startVertex());
	      const distEnd = vertex.distance(perp.endVertex());
	      return {distStart, distEnd, inconclusive: Math.abs(distStart - distEnd) < leftRightTol};
	    }
	    function isRight(info) {
	      return !info.inconclusive && info.distStart < info.distEnd;
	    }
	    this.isRight = (vertex) => isRight(rightLeftInfo(vertex));
	    this.isLeft = (vertex) => {
	      const info = rightLeftInfo(vertex);
	      return !info.inconclusive && info.distStart > info.distEnd;
	    }
	    this.direction = (vertOline) => {
	      if (vertOline instanceof Vertex2d) {
	        const info = rightLeftInfo(vertOline);
	        return info.inconclusive ? 'on' : (isRight(info) ? 'right' : 'left');
	      } else if (vertOline instanceof Line2d) {
	        const startDir = this.direction(vertOline.startVertex());
	        const endDir = this.direction(vertOline.endVertex());
	        if (startDir === 'on' || endDir === 'on' || startDir !== endDir) return 'across';
	        return startDir;
	      }
	    }
	
	    this.inverseX = (y) => this.slope()*y + this.yIntercept();
	    this.inverseY = (x) => (x-this.yIntercept())/this.slope();
	    this.perpendicular = (distance, vertex, center) => {
	      distance ||= this.length();
	      const rotated = this.copy().rotate(Math.PI12);
	      const mp = vertex || rotated.midpoint();
	      if (center) {
	        distance = Math.abs(distance);
	        const left = Line2d.startAndTheta(mp, rotated.negitive().radians(), distance/2);
	        const right = Line2d.startAndTheta(mp, rotated.radians(), distance/2);
	        // return new Line2d(right.endVertex(), left.endVertex());
	        return new Line2d(left.endVertex(), right.endVertex());
	        // return right.combine(left);
	      }
	      return Line2d.startAndTheta(mp, rotated.radians(), distance);
	    }
	
	    this.rotate = (radians, pivot) => {
	      pivot ||= this.midpoint();
	
	      const sv = this.startVertex();
	      const spl = new Line2d(pivot, sv);
	      const sRadOffset = radians + spl.radians();
	      const sfl = Line2d.startAndTheta(pivot, sRadOffset, spl.length());
	      sv.point(sfl.endVertex());
	
	      const ev = this.endVertex();
	      const epl = new Line2d(pivot, ev);
	      const eRadOffset = radians + epl.radians();
	      const efl = Line2d.startAndTheta(pivot, eRadOffset, epl.length());
	      ev.point(efl.endVertex());
	      return this;
	    }
	
	    this.vertical = () => this.slope() === Infinity;
	
	
	    const consideredInfinity = 1000000000;
	    const NaNfinity = (x,y) => Number.NaNfinity(x,y) ||
	                                Math.abs(x) > consideredInfinity ||
	                                Math.abs(y) > consideredInfinity;
	    this.findIntersection = (line) => {
	      if (this.slope() === 0 && line.slope() === 0) {
	        if (this.yIntercept() === line.yIntercept()) return Infinity;
	        return false;
	      }
	
	      if (this.vertical() && line.vertical()) {
	        if (this.startVertex().x() === line.startVertex().x()) return Infinity;
	        return false;
	      }
	
	      if (withinTol(line.radians(), this.radians()) &&
	              withinTol(line.yIntercept(), this.yIntercept())) {
	        return Vertex2d.center(line.startVertex(), this.startVertex(), line.endVertex(), this.endVertex());
	      }
	      const slope = this.slope();
	      const lineSlope = line.slope();
	      let x, y;
	      if (!Number.isFinite(slope)) {
	        x = this.startVertex().x();
	        y = line.y(x);
	      } else if (!Number.isFinite(lineSlope)) {
	        x = line.startVertex().x();
	        y = this.y(x);
	      } else if (slope === 0) {
	        y = this.startVertex().y();
	        x = line.x(y);
	      } else if (lineSlope === 0) {
	        y = line.startVertex().y();
	        x = this.x(y);
	      } else {
	        x = newX(slope, lineSlope, this.yIntercept(), line.yIntercept());
	        y = this.y(x);
	      }
	      if (NaNfinity(x,y)) return false;
	      if (this.toString() === '"(9, 10) => (9.000000000000005, -90)"' && this.toString() === '(20, 40) => (20, 15)') {
	        console.log('wtf');
	      }
	      // if (!Line2d.withinLineBounds(new Vertex2d(x,y), this, line)) return false;
	
	      return new Vertex2d({x,y});
	    }
	
	    this.findDirectionalIntersection = (line, limit) => {
	      const intersection = this.findIntersection(line);
	      if (intersection && this.withinDirectionalBounds(intersection, limit)) return intersection;
	      return false;
	    }
	
	    this.findSegmentIntersection = (line, both) => {
	      const intersection = this.findIntersection(line);
	      if (!intersection) return false;
	      if (!both && this.withinSegmentBounds(intersection)) {
	        return intersection;
	      }
	      if (this.withinSegmentBounds(intersection) && line.withinSegmentBounds(intersection)) {
	        return intersection;
	      }
	      return false;
	    }
	
	    this.distance = (other) => {
	      if (other instanceof Vertex2d) {
	        const point =  this.closestPointOnLine(other, true);
	        if (point) return point.distance(other);
	        const dist1 = startVertex.distance(other);
	        const dist2 = endVertex.distance(other);
	        return dist1 > dist2 ? dist2 : dist1;
	      }
	      if (other instanceof Line2d) {
	        if (this.findSegmentIntersection(other, true)) return 0;
	        const dist1 = this.distance(other.startVertex());
	        const dist2 = this.distance(other.endVertex());
	        const dist3 = other.distance(this.startVertex());
	        const dist4 = other.distance(this.endVertex());
	        return Math.min(...[dist1,dist2,dist3,dist4].filter((d) => Number.isFinite(d)));
	      }
	    }
	
	    this.minX = () => this.startVertex().x() < this.endVertex().x() ?
	                        this.startVertex().x() : this.endVertex().x();
	    this.minY = () => this.startVertex().y() < this.endVertex().y() ?
	                        this.startVertex().y() : this.endVertex().y();
	    this.maxX = () => this.startVertex().x() > this.endVertex().x() ?
	                        this.startVertex().x() : this.endVertex().x();
	    this.maxY = () => this.startVertex().y() > this.endVertex().y() ?
	                        this.startVertex().y() : this.endVertex().y();
	    this.withinLineBounds = (vertex) => {
	      if (this.slope() > consideredInfinity)
	        return vertex.x() > this.startVertex().x() - tol && vertex.x() < this.startVertex().x() + tol;
	      if (this.slope() === 0)
	        return vertex.y() > this.startVertex().y() - tol && vertex.y() < this.startVertex().y() + tol;
	      return true;
	    }
	    this.angle = () => {
	      return Math.toDegrees(this.radians());
	    }
	    this.radians = () => {
	      const deltaX = this.endVertex().x() - this.startVertex().x();
	      const deltaY = this.endVertex().y() - this.startVertex().y();
	      return Math.atan2(deltaY, deltaX);
	    }
	
	    // Positive returns right side.
	    this.parrelle = (distance, midpoint, length) => {
	      if (distance === 0) return this.copy();
	      if ((typeof distance) !== 'number') throw new Error('distance (arg1) must be of type number && a non-zero value');
	      length ||= this.length();
	      midpoint ||= this.midpoint();
	      const perpLine = this.perpendicular(distance * 2, midpoint, true);
	      let targetPoint = perpLine.startVertex();
	      if (distance < 0) targetPoint = perpLine.endVertex();
	      const radians = this.radians();
	      const halfLine1 = Line2d.startAndTheta(targetPoint, radians, length/2);
	      const halfLine2 = Line2d.startAndTheta(targetPoint, radians, length/-2);
	      const parrelle = halfLine1.combine(halfLine2);
	      return Math.abs(parrelle.radians() - this.radians()) < Math.PI12 ? parrelle : parrelle.negitive();
	    }
	
	    this.isParrelle = (other) => {
	      const posRads = Math.mod(this.radians(), 2*Math.PI);
	      const negRads = Math.mod(this.radians() + Math.PI, 2*Math.PI);
	      const otherRads = Math.mod(other.radians(), 2*Math.PI);
	      return withinTol(posRads, otherRads) || withinTol(negRads, otherRads);
	    }
	
	    this.radianDifference = (other) => {
	      const posRads = Math.mod(this.radians(), 2*Math.PI);
	      const negRads = Math.mod(this.radians() + Math.PI, 2*Math.PI);
	      const otherRads = Math.mod(other.radians(), 2*Math.PI);
	      const positiveDiff = Math.abs(otherRads - posRads);
	      const negitiveDiff = Math.abs(otherRads - negRads);
	      return positiveDiff > negitiveDiff ? positiveDiff : negitiveDiff;
	    }
	
	    this.equals = (other) => {
	      if (!(other instanceof Line2d)) return false;
	      if (other === this) return true;
	      const forwardEq = this.startVertex().equals(other.startVertex()) && this.endVertex().equals(other.endVertex());
	      const backwardEq = this.startVertex().equals(other.endVertex()) && this.endVertex().equals(other.startVertex());
	      return forwardEq || backwardEq;
	    }
	
	
	    this.isPoint = () => withinTol(this.length(), 0);
	    this.clean = (other) => {
	      if (!(other instanceof Line2d)) return;
	      if (other.startVertex().equals(other.endVertex())) return this;
	      if (this.startVertex().equals(this.endVertex())) return other;
	      if (this.toString() === other.toString() || this.toString() === other.toNegitiveString()) return this;
	      if (this.isPoint()) return other;
	      if (other.isPoint()) return this;
	    }
	
	    this.copy = () => new Line2d(this.startVertex().copy(), this.endVertex().copy());
	
	    this.combine = (other) => {
	      if (!(other instanceof Line2d)) return;
	      const clean = this.clean(other);
	      if (clean) return clean;
	      if (!withinTol(this.slope(), other.slope())) return;
	      const otherNeg = other.negitive();
	      const outputWithinTol = withinTol(this.y(other.x()), other.y()) &&
	                    withinTol(this.x(other.y()), other.x());
	      if (!outputWithinTol) return;
	      const v1 = this.startVertex();
	      const v2 = this.endVertex();
	      const ov1 = other.startVertex();
	      const ov2 = other.endVertex();
	      if (!this.withinSegmentBounds(other)) {
	        const dist = this.distance(other);
	        if (dist < tol) {
	          console.warn('distance is incorrect:', dist);
	          this.withinSegmentBounds(other);
	        }
	        return;
	      }
	      // Fix sort method
	      const vs = Vertex2d.sortByMax([v1, v2, ov1, ov2]);
	      const combined = new Line2d(vs[0], vs[vs.length - 1]);
	      return withinTol(this.radians(), combined.radians()) ? combined : combined.negitive();
	    }
	
	    this.isEndpoint = (vertex) => this.startVertex().equals(vertex) || this.endVertex().equals(vertex);
	    this.sortVerticies = (vertices) =>
	      vertices.sort((v1,v2) => this.startVertex().distance(v1) - this.startVertex().distance(v2))
	
	    this.slice = (lines) => {
	      if (this.isPoint()) return null;
	      const intersections = {};
	      for (let index = 0; index < lines.length; index++) {
	        if (!lines[index].equals(this)) {
	          const intersect = this.findSegmentIntersection(lines[index], true);
	          if (intersect && !this.isEndpoint(intersect)) {
	            intersections[intersect.toString()] = intersect;
	          }
	        }
	      }
	
	      const list = Object.values(intersections);
	      this.sortVerticies(list);
	      if (list.length === 0) return null;
	      const fractured = [];
	      let prevVert = this.startVertex().copy();
	      for (let index = 0; index < list.length; index++) {
	        const currVert = list[index];
	        const line = new Line2d(prevVert, currVert);
	        if (!line.isPoint()) {
	          fractured.push(line);
	          prevVert = currVert;
	        } else {
	          console.log('point?');
	        }
	      }
	      const lastLine = new Line2d(prevVert, this.endVertex().copy());
	      if (!lastLine.isPoint()) fractured.push(lastLine);
	      return fractured;
	    }
	
	    this.trimmed = (distance, both) => {
	      if ((typeof distance) !== 'number' || distance === 0) throw new Error('distance (arg1) must be of type number && a non-zero value');
	      const trimBack = distance < 0;
	      distance = Math.abs(distance);
	      const halfLen = this.length() / 2;
	      const halfNewLen = halfLen - distance;
	      const midPoint = this.midpoint();
	      const frontRads = this.radians();
	      const backRads = frontRads + Math.PI;
	      let xOffsetFront, yOffsetFront, xOffsetBack, yOffsetBack;
	      if (both) {
	        xOffsetFront = halfNewLen * Math.cos(frontRads);
	        yOffsetFront = halfNewLen * Math.sin(frontRads);
	        xOffsetBack = halfNewLen * Math.cos(backRads);
	        yOffsetBack = halfNewLen * Math.sin(backRads);
	      } else if (trimBack) {
	        xOffsetFront = halfLen * Math.cos(frontRads);
	        yOffsetFront = halfLen * Math.sin(frontRads);
	        xOffsetBack = halfNewLen * Math.cos(backRads);
	        yOffsetBack = halfNewLen * Math.sin(backRads);
	      } else {
	        xOffsetFront = halfNewLen * Math.cos(frontRads);
	        yOffsetFront = halfNewLen * Math.sin(frontRads);
	        xOffsetBack = halfLen * Math.cos(backRads);
	        yOffsetBack = halfLen * Math.sin(backRads);
	      }
	      const sv = this.startVertex();
	      const ev = this.endVertex();
	      const startVertex = {x: midPoint.x() - xOffsetBack, y: midPoint.y() - yOffsetBack};
	      const endVertex = {x: midPoint.x() - xOffsetFront, y: midPoint.y() - yOffsetFront};
	      const line = new Line2d(startVertex, endVertex);
	      return withinTol(line.radians(), this.radians()) ? line : line.negitive();
	    }
	
	    this.move = (center) => {
	      const mouseLocation = new Vertex2d(center);
	      const perpLine = this.perpendicular(undefined, mouseLocation);
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
	
	    this.acquiescent = (trendSetter) => {
	      if (!(trendSetter instanceof Line2d)) return this;
	      const shouldReverse = trendSetter.endVertex().distance(this.endVertex()) <
	                            trendSetter.endVertex().distance(this.startVertex());
	      if (shouldReverse) return this.negitive();
	      return this;
	    }
	
	    this.negitive = () => new Line2d(this.endVertex(), this.startVertex());
	    this.toString = () => `${this.startVertex().toString()} => ${this.endVertex().toString()}`;
	    this.toInfoString = () => `slope: ${this.slope()}\n` +
	                        `angle: ${this.angle()}\n` +
	                        `segment: ${this.toString()}`;
	    this.toNegitiveString = () => `${this.endVertex().toString()} => ${this.startVertex().toString()}`;
	    this.approxToString = () => `${this.startVertex().approxToString()} => ${this.endVertex().approxToString()}`;
	  }
	}
	Line2d.reusable = true;
	Line2d.startAndTheta = (startVertex, theta, dist) => {
	  dist ||= 100;
	  startVertex = new Vertex2d(startVertex);
	  const end = {
	    x: startVertex.x() + dist * Math.cos(theta),
	    y: startVertex.y() +dist*Math.sin(theta)
	  };
	  return new Line2d(startVertex.point(), end);
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
	
	const distanceObj = (line, trendLine) => ({
	  line: line.acquiescent(trendLine),
	  distance: line.distance(vertex),
	  deltaRad: trendLine.radianDifference(line.radians())
	});
	
	Line2d.vertices = (lines) => {
	  const verts = {};
	  for (let index = 0; index < lines.length; index += 1) {
	    const line = lines[index];
	    const sv = line.startVertex();
	    const ev = line.endVertex();
	    verts[sv.id()] = sv;
	    verts[ev.id()] = ev;
	  }
	  return Object.values(verts);
	}
	
	Line2d.consolidate = (...lines) => {
	  const tolMap = new ToleranceMap({'slope': tol});
	  const lineMap = {};
	  for (let index = 0; index < lines.length; index += 1) {
	    if (!lines[index].isPoint()) {
	      if (Number.isNaN(lines[index].slope())) {
	        console.log('here');
	        lines[index].slope();
	      }
	      tolMap.add(lines[index]);
	    }
	  }
	  let minList = [];
	  const combinedKeys = {};
	  for (let index = 0; index < lines.length; index += 1) {
	    const line = lines[index];
	    const matches = tolMap.matches(line);
	    const mapId = tolMap.tolerance().boundries(line);
	    if (!combinedKeys[mapId]) {
	      combinedKeys[mapId] = true;
	      for (let tIndex = 0; tIndex < matches.length; tIndex += 1) {
	        let target = matches[tIndex];
	        for (let mIndex = tIndex + 1; mIndex < matches.length; mIndex += 1) {
	          if (mIndex !== tIndex) {
	            const combined = target.combine(matches[mIndex]);
	            if (combined) {
	              const lowIndex = mIndex < tIndex ? mIndex : tIndex;
	              const highIndex = mIndex > tIndex ? mIndex : tIndex;
	              if (lowIndex == highIndex)
	                console.log('STF');
	              matches.splice(highIndex, 1);
	              matches[lowIndex] = combined;
	              tIndex--;
	              break;
	            }
	          }
	        }
	      }
	      minList = minList.concat(matches);
	    }
	  }
	
	  return minList;
	}
	
	const within = Tolerance.within(.00001);
	Line2d.favored = (trendLine,lines) => {
	  if (lines.length < 2) return lines[0].acquiescent(trendLine);
	  const best = distanceObj(lines[0], trendLine);
	  for (let index = 1; index < lines.length; index++) {
	    const curr = distanceObj(line[index], trendLine);
	    const closer = within(curr.distance, best.distance) || curr.distance < best.distance;
	    const straighter = within(curr.deltaRad, best.deltaRad) || curr.deltaRad < best.deltaRad;
	    if (straighter && closer) best = curr;
	  }
	  return best.line;
	}
	
	Line2d.withinLineBounds = (vertex, ...lines) => {
	  for (let index = 0; index < lines.length; index++) {
	    if (!lines[index].withinLineBounds(vertex)) return false;
	  }
	  return true;
	}
	
	const distLine = (line, vertex, index) => {
	  return {line, distance: line.distance(vertex), index};
	}
	Line2d.isolateFurthestLine = (vertex, lines) => {
	  let retLines = [];
	  let max = distLine(lines[0], vertex, index);
	  for (let index = 1; index < lines.length; index++) {
	    let curr = distLine(lines[index], vertex, index);
	    if (curr.distance > max.distance) {
	      retLines = retLines.slice(0, max.index)
	                  .concat([max.line]).concat(retLines.slice(max.index));
	      max = curr;
	    } else retLines.push(curr.line);
	  }
	  return {line: max.line, lines: retLines};
	}
	
	Line2d.getSlope = function(x1, y1, x2, y2) {
	  const slope = (y2 - y1) / (x2 - x1);
	  if (Number.NaNfinity(slope) || slope > 10000 || slope < -10000) return Infinity;
	  if (slope > -0.00001 && slope < 0.00001) return 0;
	  return slope;
	}
	
	Line2d.toleranceMap = (tol, startEndBoth, lines) => {
	  tol ||= .01;
	  lines ||= [];
	  const tolAttrs = {};
	  const both = startEndBoth !== true && startEndBoth !== false;
	  if (both || startEndBoth === true) {
	    tolAttrs['startVertex.x'] = tol;
	    tolAttrs['startVertex.y'] = tol;
	  }
	  if (both || startEndBoth === false) {
	    tolAttrs['endVertex.x'] = tol;
	    tolAttrs['endVertex.y'] = tol;
	  }
	  const map = new ToleranceMap(tolAttrs);
	  for (let index = 0; index < lines.length; index++) {
	    map.add(lines[index]);
	    if (!both) map.add(lines[index].negitive());
	  }
	  return map;
	}
	
	Line2d.sliceAll = (lines) => {
	  const fractured = [];
	  for (let index = 0; index < lines.length; index++) {
	    const sliced = lines[index].slice(lines);
	    if (sliced) fractured.concatInPlace(sliced);
	    else fractured.push(lines[index]);
	  }
	  return fractured;
	}
	
	Line2d.toDrawString = (lines, color) => {
	  color ||= '';
	  let str = '';
	  lines.forEach((l) => str += `${color}[${l.startVertex().approxToString()},${l.endVertex().approxToString()}],`);
	  return str.substr(0, str.length - 1);
	}
	
	Line2d.toString = (lines) => {
	  let str = '';
	  for (let index = 0; index < lines.length; index++) {
	    str += `[${lines[index].startVertex().toString()}, ${lines[index].endVertex().toString()}],`;
	  }
	  return str.substring(0, str.length - 1);
	}
	
	const pathReg = /\[.*?\]/g;
	const vertRegStr = "\\(([0-9]*(\\.[0-9]*|)),\\s*([0-9]*(\\.[0-9]*|))\\)";
	const vertReg = new RegExp(vertRegStr);
	const vertRegG = new RegExp(vertRegStr, 'g');
	
	function sectionFromString(str, lines) {
	  const vertStrs = str.match(vertRegG);
	  let prevVert;
	  const verts = vertStrs.map((str) => {
	    const match = str.match(vertReg);
	    const currVert = new Vertex2d(Number.parseFloat(match[1]), Number.parseFloat(match[3]));
	    if (prevVert) lines.push(new Line2d(prevVert, currVert));
	    prevVert = currVert;
	  });
	  return prevVert;
	}
	
	Line2d.fromString = (str) => {
	  const lines = [];
	  const sections = str.match(pathReg) || [str];
	  let prevVert;
	  for (let index = 0; index < sections.length; index++) {
	    prevVert = sectionFromString(sections[index], lines);
	  }
	  return lines;
	}
	
	Line2d.mirror = (lines) => {
	  return Vertex2d.mirror(Line2d.vertices(lines));
	}
	
	Line2d.distanceSort = (target) => (l1,l2) => {
	  const ds1 = target.distance(l1.startVertex());
	  const ds2 = target.distance(l2.startVertex());
	  const de1 = target.distance(l1.endVertex());
	  const de2 = target.distance(l2.endVertex());
	  return (ds1 < de1 ? ds1 : de1) - (ds2 < de2 ? ds2 : de2);
	}
	
	new Line2d();
	
	module.exports = Line2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/plane.js',
function (require, exports, module) {
	
class Plane2d {
	  constructor(vertices) {
	    this.getLines = () => {
	      const lines = [];
	      for (let index = 0; index < vertices.length; index += 1) {
	        lines.push(new Line2d(vertices[index], vertices[(index + 1) % vertices.length]));
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


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/vertex.js',
function (require, exports, module) {
	
const approximate10 = require('../../../approximate.js').new(10);
	const ToleranceMap = require('../../../tolerance-map.js');
	const Tolerance = require('../../../tolerance.js');
	const tol = .00001;
	const within = Tolerance.within(tol);
	
	
	class Vertex2d {
	  constructor(point) {
	    if (arguments.length === 2) point = {x:arguments[0], y: arguments[1]};
	    if (Array.isArray(point)) point = {x: point[0], y: point[1]};
	    if (point instanceof Vertex2d) return point;
	    let modificationFunction;
	    let id = String.random();
	    this.id = () => id;
	    point = point || {x:0,y:0};
	    Object.getSet(this, {point});
	    this.layer = point.layer;
	    const instance = this;
	    this.move = (center) => {
	      this.point(center);
	      return true;
	    };
	
	    this.translate = (xOffset, yOffset, doNotModify) => {
	      const vertex = doNotModify ? this.copy() : this;
	      vertex.point().x += xOffset;
	      vertex.point().y += yOffset;
	      return vertex;
	    }
	
	    this.rotate = (radians, pivot, doNotModify) => {
	      const vertex = doNotModify ? this.copy() : this;
	      const point = vertex.point();
	      pivot ||= new Vertex2d(0,0);
	      const s = Math.sin(radians);
	      const c = Math.cos(radians);
	      point.x -= pivot.x();
	      point.y -= pivot.y();
	      const newX = point.x * c - point.y * s;
	      const newY = point.x * s + point.y * c;
	      point.x = newX + pivot.x();
	      point.y = newY + pivot.y();
	      return vertex;
	    }
	    this.point = (newPoint) => {
	      newPoint = newPoint instanceof Vertex2d ? newPoint.point() : newPoint;
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
	
	    this.equals = (other) => other instanceof Vertex2d && within(other.x(), this.x()) && within(other.y(), this.y());
	    this.x = (val) => {
	      if ((typeof val) === 'number') point.x = val;
	      return this.point().x;
	    }
	    this.y = (val) => {
	      if ((typeof val) === 'number') this.point().y = val;
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
	    this.approxToString = () => `(${approximate10(this.x())}, ${approximate10(this.y())})`;
	    const parentToJson = this.toJson;
	
	    this.offset = (x, y) => {
	      if (x instanceof Vertex2d) {
	        y = x.y();
	        x = x.x();
	      }
	      const copy = this.toJson().point;
	      if (y !== undefined) copy.y += y;
	      if (x !== undefined) copy.x += x;
	      return new Vertex2d(copy);
	    }
	
	    this.copy = () => new Vertex2d([this.x(), this.y()]);
	
	    this.differance = (x, y) => {
	      if (x instanceof Vertex2d) {
	        y = x.y();
	        x = x.x();
	      }
	      return new Vertex2d({x: this.x() - x, y: this.y() - y});
	    }
	
	    this.point(point);
	  }
	}
	
	Vertex2d.fromJson = (json) => {
	  return new Vertex2d(json.point);
	}
	
	Vertex2d.minMax = (...vertices) => {
	  if (Array.isArray(vertices[0])) vertices = vertices[0];
	  const max = new Vertex2d(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
	  const min = new Vertex2d(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
	  for (let index = 0; index < vertices.length; index += 1) {
	    const vert = vertices[index];
	    if (max.x() < vert.x()) max.x(vert.x());
	    if (max.y() < vert.y()) max.y(vert.y());
	    if (min.x() > vert.x()) min.x(vert.x());
	    if (min.y() > vert.y()) min.y(vert.y());
	  }
	  return {min, max, diff: new Vertex2d(max.x() - min.x(), max.y() - min.y())};
	}
	
	Vertex2d.center = (...vertices) => {
	  if (Array.isArray(vertices[0])) vertices = vertices[0];
	  const minMax = Vertex2d.minMax(...vertices);
	  const centerX = minMax.min.x() + (minMax.max.x() - minMax.min.x())/2;
	  const centerY = minMax.min.y() + (minMax.max.y() - minMax.min.y())/2;
	  return new Vertex2d(centerX, centerY);
	}
	
	Vertex2d.weightedCenter = (...vertices) => {
	  if (Array.isArray(vertices[0])) vertices = vertices[0];
	  let x = 0;
	  let y = 0;
	  let count = 0;
	  vertices.forEach((vertex) => {
	    if (Number.isFinite(vertex.x() + vertex.y())) {
	      count++;
	      x += vertex.x();
	      y += vertex.y();
	    }
	  });
	  return new Vertex2d({x: x/count, y: y/count});
	}
	
	// Vertex2d.center = Vertex2d.weightedCenter;
	
	Vertex2d.sort = (a, b) =>
	    a.x() === b.x() ? (a.y() === b.y() ? 0 : (a.y() > b.y() ? -1 : 1)) : (a.x() > b.x() ? -1 : 1);
	
	const ignoreVerySmall = (v) => Math.abs(v) < .000001 ? 0 : v;
	Vertex2d.sortByMax = (verts) => {
	  let max;
	  const center = Vertex2d.center(verts);
	  for (let index = 0; index < verts.length; index++) {
	    let v = verts[index];
	    let curr = {v, distance: v.distance(center)};
	    if (max === undefined || max.distance < curr.distance) {
	      max = curr;
	    }
	  }
	  return verts.sort((v1, v2) => {
	    const d1 = v1.distance(max.v);
	    const d2 = v2.distance(max.v);
	    return d2 - d1;
	  });
	}
	
	Vertex2d.centerOn = (newCenter, vertices) => {
	  newCenter = new Vertex2d(newCenter);
	  const center = Vertex2d.center(...vertices);
	  const diff = newCenter.copy().differance(center);
	  for (let index = 0; index < vertices.length; index++) {
	    const vert = vertices[index];
	    vert.translate(diff.x(), diff.y());
	  }
	}
	
	Vertex2d.scale = (scaleX, scaleY, vertices) => {
	  const center = Vertex2d.center(vertices);
	  Vertex2d.centerOn(new Vertex2d(0,0), vertices);
	  for (let index = 0; index < vertices.length; index++) {
	    const vert = vertices[index];
	    vert.x(vert.x() * 1);
	    vert.y(vert.y() * -1);
	  }
	  Vertex2d.centerOn(center, vertices);
	}
	
	Vertex2d.toleranceMap = (tolerance, vertices) => {
	  tolerance ||= tol;
	  vertices = [];
	  const map = new ToleranceMap({x: tolerance, y: tolerance});
	  for (let index = 0; index < vertices.length; index++) {
	    map.add(vertices[index]);
	  }
	  return map;
	}
	
	Vertex2d.reusable = true;
	new Vertex2d();
	
	module.exports = Vertex2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/snap.js',
function (require, exports, module) {
	
const Vertex2d = require('vertex');
	const Line2d = require('line');
	const SnapLocation2d = require('snap-location');
	const HoverMap2d = require('../hover-map');
	const Tolerance = require('../../../tolerance.js');
	const Lookup = require('../../../object/lookup.js');
	const withinTol = Tolerance.within(.1);
	
	class Snap2d extends Lookup {
	  constructor(parent, object, tolerance) {
	    super();
	    name = 'booyacka';
	    Object.getSet(this, {object, tolerance}, 'layoutId');
	    if (parent === undefined) return;
	    const instance = this;
	    const id = String.random();
	    let start = new Vertex2d();
	    let end = new Vertex2d();
	    let layout = parent.layout();
	
	    this.dl = () => 24 * 2.54;
	    this.dr = () => 24 * 2.54;
	    this.dol = () => 12;
	    this.dor = () => 12;
	    this.toString = () => `SNAP ${this.id()}(${tolerance}):${object}`
	    this.position = {};
	    this.id = () => id;
	    this.parent = () => parent;
	    this.x = parent.x;
	    this.y = parent.y;
	    this.width = parent.width;
	    this.height = parent.height;
	    this.center = parent.center;
	    this.angle = parent.angle;
	    this.rotate = parent.rotate;
	
	    this.radians = (newValue) => {
	      if (newValue !== undefined ) {
	        const constraint = this.constraint();
	        if (constraint === 'fixed') return;
	        const radians = parent.radians(newValue);
	        const snapAnchor = constraint.snapLoc;
	        const originalPosition = snapAnchor && snapAnchor.center();
	        const radianDifference = newValue - radians;
	        this.parent().rotate(radianDifference);
	        // notify(radians, newValue);
	        if (snapAnchor) this.parent.center(snapAnchor.at({center: originalPosition}));
	      }
	      return parent.radians();
	    };
	
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
	
	    // this.minDem = () => this.width() > this.height() ? this.width() : this.height();
	    // this.maxDem = () => this.width() > this.height() ? this.width() : this.height();
	
	    this.view = () => {
	      switch (this) {
	        case parent.topview(): return 'topview';
	        case parent.bottomview(): return 'bottomview';
	        case parent.leftview(): return 'leftview';
	        case parent.rightview(): return 'rightview';
	        case parent.frontview(): return 'frontview';
	        case parent.backview(): return 'backview';
	        default: return null;
	      }
	    }
	
	    this.forEachConnectedObject = (func, objMap) => {
	      objMap = objMap || {};
	      objMap[this.id()] = this;
	      const locs = this.snapLocations.paired();
	      for (let index = 0; index < locs.length; index += 1) {
	        const loc = locs[index];
	        const connSnap = loc.pairedWith();
	        if (connSnap instanceof SnapLocation2d) {
	          const connObj = connSnap.parent();
	          if (connObj && objMap[connOb.id()] === undefined) {
	            objMap[connObj.id()] = connObj;
	            connSnap.parent().forEachConnectedObject(undefined, objMap);
	          }
	        }
	      }
	      if ((typeof func) === 'function') {
	        const objs = Object.values(objMap);
	        for (let index = 0; index < objs.length; index += 1) {
	          func(objs[index]);
	        }
	      } else return objMap;
	    };
	
	    this.forEachConnectedSnap = (func, pairedMap) => {
	      pairedMap ||= {};
	      const locs = this.snapLocations.paired();
	      for (let index = 0; index < locs.length; index += 1) {
	        const loc = locs[index];
	        pairedMap[loc.toString()]  = loc;
	        const connSnap = loc.pairedWith();
	        if (connSnap instanceof SnapLocation2d) {
	          const snapStr = connSnap.toString();
	          if (pairedMap[snapStr] === undefined) {
	            pairedMap[snapStr] = connSnap;
	            connSnap.parent().forEachConnectedSnap(undefined, pairedMap);
	          }
	        }
	      }
	
	      if ((typeof func) === 'function') {
	        const snaps = Object.values(pairedMap);
	        for (let index = 0; index < snaps.length; index += 1) {
	          func(snaps[index]);
	        }
	      } else return pairedMap;
	    }
	
	    this.constraints = () => {
	      let constraints = [];
	      this.forEachConnectedSnap((snapLoc) => {
	        const possible = snapLoc.pairedWith();
	        if (!(possible instanceof SnapLocation2d)) constraints.push(snapLoc);
	      });
	      return constraints;
	    };
	
	    this.constraint = () => {
	      let constraints = this.constraints();
	      if (constraints.length === 0) return 'free';
	      const wallMap = {};
	      let anchor;
	      for (let index = 0; index < constraints.length; index++) {
	        const snapLoc = constraints[index];
	        const constraint = snapLoc.pairedWith();
	        if (constraint instanceof Line2d && !wallMap[constraint.toString()]) {
	          wallMap[constraint.toString()] = {wall: constraint, snapLoc};
	          if (Object.keys(wallMap).length === 2 || anchor) return 'fixed';
	        } else if (constraint instanceof Vertex2d) {
	          if (anchor || Object.keys(wallMap).length === 1) return 'fixed';
	          anchor = {vertex: constraint, snapLoc};
	        }
	      }
	      if (anchor) return anchor;
	      const walls = Object.values(wallMap);
	      return walls.length === 1 ? walls[0] : 'free';
	    }
	
	    const snapLocations = [];
	    this.addLocation = (snapLoc) => {
	      if (snapLoc instanceof SnapLocation2d && this.position[snapLoc.location()] === undefined) {
	        const index = snapLocations.length;
	        snapLocations.push(snapLoc);
	        snapLoc.prev = () => snapLocations[Math.mod(index - 1, snapLocations.length)];
	        snapLoc.next = () => snapLocations[Math.mod(index + 1, snapLocations.length)];
	        this.position[snapLoc.location()] = snapLoc.at;
	      }
	    }
	    function getSnapLocations(func) {
	      const locs = [];
	      for (let index = 0; index < snapLocations.length; index += 1) {
	        const loc = snapLocations[index];
	        if ((typeof func) === 'function') {
	          if (func(loc)) locs.push(loc);
	        } else locs.push(loc);
	      }
	      return locs;
	    }
	
	    const backReg = /^back[0-9]{1,}$/;
	    const rightCenterReg = /^right[0-9]{1,}center$/;
	    const leftCenterReg = /^left[0-9]{1,}center$/;
	    const backCenterReg = /^back[0-9]{1,}center$/;
	    const centerReg = /^[a-z]{1,}[0-9]{1,}center$/;
	    this.snapLocations = getSnapLocations;
	    this.snapLocations.notPaired = () => getSnapLocations((loc) => loc.pairedWith() === null);
	    this.snapLocations.paired = () => getSnapLocations((loc) => loc.pairedWith() !== null);
	    this.snapLocations.wallPairable = () => getSnapLocations((loc) => loc.location().match(backReg));
	    this.snapLocations.rightCenter = () => getSnapLocations((loc) => loc.location().match(rightCenterReg));
	    this.snapLocations.leftCenter = () => getSnapLocations((loc) => loc.location().match(leftCenterReg));
	    this.snapLocations.backCenter = () => getSnapLocations((loc) => loc.location().match(backCenterReg));
	    this.snapLocations.center = () => getSnapLocations((loc) => loc.location().match(centerReg));
	    this.snapLocations.byLocation = (name) => getSnapLocations((loc) => loc.location() === name);
	    this.snapLocations.at = (vertex) => {
	      for (let index = 0; index < snapLocations.length; index++)
	        if (snapLocations[index].center().equals(vertex)) return snapLocations[index];
	      return null;
	    }
	    this.snapLocations.resetCourting = () => {
	      for (let index = 0; index < snapLocations.length; index++) {
	        if (snapLocations[index] instanceof SnapLocation2d)
	          snapLocations[index].courting(null);
	      }
	    }
	
	    this.connected = () => this.snapLocations.paired().length > 0;
	
	    // this.snapLocations.rotate = backCenter.rotate;
	    function resetVertices() {
	      for (let index = 0; index < snapLocations.length; index += 1) {
	        const snapLoc = snapLocations[index];
	        instance.position[snapLoc.location()]();
	      }
	    }
	
	    this.maxRadius = () => {
	      const center = this.center();
	      let maxDist = 0;
	      for (let index = 0; index < snapLocations.length; index++) {
	        const loc = snapLocations[index].center();
	        const currDist = center.distance(loc);
	        if (currDist > maxDist) {
	          maxDist = currDist;
	        }
	      }
	      return maxDist;
	    }
	
	    this.minRadius = () => {
	      const center = this.center();
	      let minDist = Number.MAX_SAFE_INTEGER;
	      for (let index = 0; index < snapLocations.length; index++) {
	        const loc = snapLocations[index].center();
	        const currDist = center.distance(loc);
	        if (currDist < minDist) {
	          minDist = currDist;
	        }
	      }
	      return minDist;
	    }
	
	    const hoveringNear = new HoverMap2d(this.object().center, () => this.maxRadius() + 10).hovering;
	    const hoveringObject = new HoverMap2d(this.object().center, () => this.minRadius() * 1.3).hovering;
	    this.hovering = (vertex) => {
	      const isNear = hoveringNear(vertex);
	      if (!isNear) return;
	      for (let index = 0; index < snapLocations.length; index++) {
	        const hoveringSnap = snapLocations[index].hovering(vertex);
	        if (hoveringSnap) return snapLocations[index];
	      }
	      return hoveringObject(vertex) && this;
	    }
	
	    this.hoveringSnap = (vertex, excluded) => {
	      if (this === excluded || Array.exists(excluded, this)) return false;
	      const isNear = hoveringNear(vertex);
	      if (!isNear) return;
	      for (let index = 0; index < snapLocations.length; index++) {
	        const hoveringSnap = snapLocations[index].hovering(vertex);
	        if (hoveringSnap) return snapLocations[index];
	      }
	      return false;
	    }
	
	    this.otherHoveringSnap = (vertex) =>
	      parent.layout().snapAt(vertex, this);
	
	    function calculateMaxAndMin(closestVertex, furthestVertex, wall, position, axis) {
	      const maxAttr = `max${axis.toUpperCase()}`;
	      const minAttr = `min${axis.toUpperCase()}`;
	      if (closestVertex[axis]() === furthestVertex[axis]()) {
	        const perpLine = wall.perpendicular(10, null, true);
	        const externalVertex = !layout.within(perpLine.startVertex()) ?
	                perpLine.endVertex() : perpLine.startVertex();
	        if (externalVertex[axis]() < closestVertex[axis]()) position[maxAttr] = closestVertex[axis]();
	        else position[minAttr] = closestVertex[axis]();
	      } else if (closestVertex[axis]() < furthestVertex[axis]()) position[minAttr] = closestVertex[axis]();
	      else position[maxAttr] = closestVertex[axis]();
	    }
	
	    function sameSlopeAsWall(wall, v1, v2, v3) {
	      const wallSlope = wall.slope();
	      const p1 = v1.point();
	      const p2 = v2.point()
	      const p3 = v3.point()
	      return withinTol(wallSlope, Line2d.getSlope(p1.x, p1.y, p2.x, p2.y)) ||
	              withinTol(wallSlope, Line2d.getSlope(p2.x, p2.y, p3.x, p3.y));
	    }
	
	    function findBestWallSnapLoc(center, wall, wallPairables, theta) {
	      let best;
	      const currentCenter = instance.parent().center();
	      for (let index = 0; index < wallPairables.length; index++) {
	        const snapLoc = wallPairables[index];
	        const neighbors = instance.object().neighbors(snapLoc.center(), -1, 1);
	        if (theta === 180)
	          console.log('rotated');
	        if (sameSlopeAsWall(wall, neighbors[0], snapLoc.center(), neighbors[1])) {
	          const centerVertex = snapLoc.at({center, theta});
	          const moveIsWithin = layout.within(centerVertex);
	          if (moveIsWithin) {
	            const dist = centerVertex.distance(currentCenter);
	            if (best === undefined || best.dist > dist) {
	              best = {center: centerVertex, theta, wall, pairWith: snapLoc};
	            }
	          }
	        }
	      }
	      return best;
	    }
	
	    function findWallSnapLocation(center) {
	      const centerWithin = layout.within(center);
	      let wallObj;
	      layout.walls().forEach((wall) => {
	        const point = wall.closestPointOnLine(center, true);
	        if (point) {
	          const wallDist = point.distance(center);
	          const isCloser = (!centerWithin || wallDist < tolerance*2) &&
	                          (wallObj === undefined || wallObj.distance > wallDist);
	          if (isCloser) {
	            wallObj = {point, distance: wallDist, wall};
	          }
	        }
	      });
	      if (wallObj) {
	        const wall = wallObj.wall;
	        const point = wallObj.point;
	        const wallPairables = instance.snapLocations.wallPairable();
	        return findBestWallSnapLoc(point, wall, wallPairables, 0) ||
	                    findBestWallSnapLoc(point, wall, wallPairables, Math.PI);
	      }
	    }
	
	    const neighborSelectFunc = (cursorCenter, neighborSeperation) => (min, index) =>
	      min.distance(cursorCenter);// + (index === 1 ? neighborSeperation / 2 : 0);
	
	    function findClosestNeighbor(otherMidpoint, radians, targetMidpoint, otherLoc, cursorCenter) {
	      const obj = instance.object();
	      const tempPoly = obj.copy();
	      const objVerts = obj.verticesAndMidpoints();
	      const targetIndex = objVerts.equalIndexOf(targetMidpoint.center());
	
	      if (targetIndex === undefined) {
	        console.log('wtf');
	      }
	
	      tempPoly.rotate(radians);
	      const newCenter = tempPoly.point(targetIndex, {center: otherMidpoint.center()});
	      tempPoly.centerOn(newCenter);
	      const neighbors = tempPoly.neighbors(otherMidpoint.center(), -1, 0, 1);
	      const neighborSeperation = neighbors[0].distance(neighbors[2]);
	      const neighbor = neighbors.min(null, neighborSelectFunc(cursorCenter, neighborSeperation));
	      const neighborIndex = tempPoly.verticesAndMidpoints().equalIndexOf(neighbor);
	      const locCount = instance.snapLocations().length;
	
	      const originalPosition = objVerts[neighborIndex + locCount % locCount];
	      if (originalPosition === undefined) { // Vertex
	        console.log('wtff');
	      }
	      const targetLoc = instance.snapLocations.at(originalPosition);
	      if (!targetLoc) {
	        // console.log(targetLoc.location());
	        return;
	      }
	
	      const dist = neighbor.distance(cursorCenter);
	      const centerDist = tempPoly.center().distance(otherMidpoint.parent().object().center());
	      return {targetLoc, dist, radians, targetMidpoint, otherMidpoint, centerDist};
	    }
	
	    function closestSnap(otherMidpoint, otherLoc, snapList, cursorCenter) {
	      let closest = null;
	      const c = cursorCenter;
	      const om = otherMidpoint;
	      const ol = otherLoc;
	      const otherParent = otherMidpoint.parent();
	      for (let index = 0; index < snapList.length; index++) {
	        const snapLoc = snapList[index];
	        if (snapLoc.parent() !== otherParent) {
	          const targetMidpoint = snapList[index];
	          const tm = targetMidpoint;
	          const radDiff = otherMidpoint.forwardRadians() - targetMidpoint.forwardRadians();
	          const parrelle = findClosestNeighbor(om, radDiff, tm, ol, c);
	          const antiParrelle = findClosestNeighbor(om, radDiff - Math.PI, tm, ol, c);
	          const furthestCenter =
	          parrelle.centerDist > antiParrelle.centerDist ? parrelle : antiParrelle;
	          furthestCenter.otherLoc = otherLoc;
	          if (furthestCenter.radians === 0) return furthestCenter;
	          if (!closest || closest.dist < furthestCenter.dist) {
	            closest = furthestCenter;
	          }
	        }
	      }
	      return closest;
	    }
	
	
	    function closestBackSnapInfo(otherLoc, cursorCenter) {
	      const snapList = instance.snapLocations.center();
	      let midpoint = otherLoc.neighbor(1);
	      let snapInfo1 = closestSnap(midpoint, otherLoc, snapList, cursorCenter);
	      if (snapInfo1.radians === 0) return snapInfo1;
	      midpoint = otherLoc.neighbor(-1);
	      let snapInfo2 = closestSnap(midpoint, otherLoc, snapList, cursorCenter);
	      if (snapInfo2.radians === 0) return snapInfo2;
	      if (snapInfo1.radians === Math.PI) return snapInfo1;
	      if (snapInfo2.radians === Math.PI) return snapInfo2;
	      const rotation1isSmallest = snapInfo2.radians > snapInfo1.radians;
	      return rotation1isSmallest ? snapInfo1 : snapInfo2;
	    }
	
	    function closestCenterSnap(otherLoc, cursorCenter) {
	      const snapList = instance.snapLocations.center();
	    }
	
	    let lastClosestSnapLocation;
	    const distanceFunc = (center) => (snapLoc) => snapLoc.center().distance(center);// +
	//          (lastClosestSnapLocation === snapLoc ? -10 : 0);
	    function findClosestSnapLoc (center) {
	      const objects = parent.layout().objects();
	      const instObj = instance.object();
	      const instCenter = instObj.center();
	      let closest = null;
	      for (let index = 0; index < objects.length; index++) {
	        const object = objects[index];
	        if (object !== parent) {
	          const otherSnap = object.snap2d.top();
	          const combinedRadius = otherSnap.maxRadius() + instance.maxRadius();
	          const center2centerDist = otherSnap.object().center().distance(instCenter);
	          if (center2centerDist - 1 < combinedRadius) {
	            const snapLocs = otherSnap.snapLocations();
	            closest = snapLocs.min(closest, distanceFunc(center));
	          }
	        }
	      }
	      lastClosestSnapLocation = closest;
	      return closest;
	    }
	
	    function snapMove(snapInfo) {
	      if (snapInfo) {
	        snapInfo.targetLoc.move(snapInfo.otherLoc.center(), null);
	        instance.rotate(snapInfo.radians, snapInfo.otherLoc.center());
	        snapInfo.targetLoc.courting(snapInfo.otherLoc);
	      }
	    }
	
	    function findObjectSnapLocation(center) {
	      const closestOtherLoc = findClosestSnapLoc(center);
	      if (closestOtherLoc === null) return;
	      let snapList, midpointOffset;
	      if (closestOtherLoc.isLeft) {
	        if (!closestOtherLoc.isCenter) midpointOffset = -1;
	        snapList = instance.snapLocations.rightCenter();
	      } else if (closestOtherLoc.isRight) {
	        if (!closestOtherLoc.isCenter) midpointOffset = 1;
	        snapList = instance.snapLocations.leftCenter();
	      } else if (closestOtherLoc.isBack && ! closestOtherLoc.isCenter) {
	        const snapInfo = closestBackSnapInfo(closestOtherLoc, center);
	        snapMove(snapInfo);
	        return;
	      } else {
	        snapList = instance.snapLocations.backCenter();
	      }
	      if (snapList) {
	        let midpoint = midpointOffset ? closestOtherLoc.neighbor(midpointOffset) : closestOtherLoc;
	        const snapInfo = closestSnap(midpoint, closestOtherLoc, snapList, center);
	        snapMove(snapInfo);
	      }
	    }
	
	    let lastValidMove;
	    this.makeMove = (position, force) => {
	      this.snapLocations.resetCourting();
	      this.parent().center(position.center);
	      if (position.theta !== undefined) instance.radians(position.theta);
	      if (!force) {
	        let validMove = true;
	        if (!validMove) {
	          if (lastValidMove) {
	            console.log('Invalid Move');
	            return this.makeMove(lastValidMove, true); // No move was made return undefined
	          }
	        } else lastValidMove = position;
	        lastValidMove = position;
	      }
	    }
	
	    function clearIdentifiedConstraints() {
	      Snap2d.identifiedConstraints = null;
	    }
	    this.clearIdentifiedConstraints = clearIdentifiedConstraints;
	
	    this.move = (center) => {
	      clearIdentifiedConstraints.subtle(2000);
	      let constraint = this.constraint();
	      if (constraint.wall) {
	        const snapCenter = constraint.wall.closestPointOnLine(center, true) ||
	          constraint.wall.closestVertex(center);
	        const vertCenter = constraint.snapLoc.at({center: snapCenter});
	        return this.moveConnected(vertCenter);
	      } else if (constraint.vertex) {
	        console.log('vertex constraint');
	        return;
	      } else if (constraint === 'fixed') {
	        Snap2d.identifiedConstraints = this.constraints();
	        return;
	      }
	      const pairedSnapLocs = this.snapLocations.paired();
	      const centerWithin = layout.within(center);
	      let closest = {};
	      const wallSnapLocation = findWallSnapLocation(center);
	      if (wallSnapLocation !== undefined) {
	        this.makeMove(wallSnapLocation);
	        wallSnapLocation.pairWith.courting(wallSnapLocation.wall);
	        this.moveConnected(null, wallSnapLocation.theta);
	      } else if (centerWithin) {
	        if (this.connected()) {
	          this.moveConnected(center);
	        } else {
	          this.makeMove({center});
	          findObjectSnapLocation(center);
	        }
	      }
	    }
	
	    function moveConnectedObjects(moveId, theta) {
	      const pairedLocs = instance.snapLocations.paired();
	      for (let index = 0; index < pairedLocs.length; index += 1) {
	        const loc = pairedLocs[index];
	        const paired = loc.pairedWith();
	        if (paired instanceof SnapLocation2d) {
	          const tarVertexLoc = paired.at({center: loc.center()});
	          paired.parent().moveConnected(tarVertexLoc, theta, moveId);
	        }
	      }
	    }
	
	    let moveCounter = 0;
	    let lastMove;
	    this.moveConnected = (center, theta, moveId) => {
	      const alreadyMoved = moveId === false;
	      moveId ||= moveCounter++;
	      if (moveId === lastMove) return;
	      lastMove = moveId;
	      if (!alreadyMoved) {
	        if (theta) instance.rotate(theta, moveId);
	        if (center) instance.makeMove({center});
	      }
	      moveConnectedObjects(moveId, theta);
	    }
	  }
	}
	
	Snap2d.get = {};
	Snap2d.registar = (clazz) => {
	  const instance = new clazz();
	  if (instance instanceof Snap2d) {
	    const name = clazz.prototype.constructor.name.replace(/^Snap/, '').toCamel();
	    if (Snap2d.get[name] === undefined)
	      Snap2d.get[name] = (parent, tolerance) => new clazz(parent, tolerance);
	    else throw new Error(`Double registering Snap2d: ${name}`);
	  }
	}
	
	Snap2d.identfied = (snapLoc) => Snap2d.identifiedConstraints &&
	        Snap2d.identifiedConstraints.indexOf(snapLoc) !== -1;
	
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


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/three-view.js',
function (require, exports, module) {
	
const Polygon3D = require('../../../../../../services/cabinet/app-src/three-d/objects/polygon.js');
	const Vector3D = require('../../../../../../services/cabinet/app-src/three-d/objects/vector.js');
	const EscapeMap = require('../maps/escape.js');
	const Polygon2d = require('../objects/polygon');
	const Line2d = require('../objects/line');
	const Vertex2d = require('../objects/vertex');
	
	const defaultNormals = {front: new Vector3D(0,0,-1), right: new Vector3D(-1,0,0), top: new Vector3D(0,-1,0)};
	
	class ThreeView {
	  constructor(polygons, normals, gap) {
	    normals ||= defaultNormals;
	    gap ||= 10;
	    const frontView = Polygon3D.viewFromVector(polygons, normals.front);
	    const rightView = Polygon3D.viewFromVector(polygons, normals.right);
	    const topview = Polygon3D.viewFromVector(polygons, normals.top);
	
	    const axis = {};
	    axis.front = Polygon3D.mostInformation(frontView);
	    axis.right = Polygon3D.mostInformation(rightView);
	    axis.top = Polygon3D.mostInformation(topview);
	
	    // Orient properly
	    if (axis.front.indexOf('y') === 0) axis.front.reverse();
	    if (axis.top.indexOf(axis.front[0]) !== 0) axis.top.reverse();
	    if (axis.right.indexOf(axis.front[1]) !== 1) axis.right.reverse();
	
	    const to2D = (mi) => (p) => p.to2D(mi[0],mi[1]);
	    const front2D = frontView.map(to2D(axis.front));
	    const right2D = rightView.map(to2D(axis.right));
	    const top2D = topview.map(to2D(axis.top));
	
	    Polygon2d.centerOn({x:0,y:0}, front2D);
	
	    const frontMinMax = Polygon2d.minMax(...front2D);
	    const rightMinMax = Polygon2d.minMax(...right2D);
	    const topMinMax = Polygon2d.minMax(...top2D);
	    const rightCenterOffset = frontMinMax.max.x() + gap + (rightMinMax.max.x() - rightMinMax.min.x())/2;
	    const topCenterOffset = frontMinMax.max.y() + gap + (topMinMax.max.y() - topMinMax.min.y())/2;
	
	    Polygon2d.centerOn({x:rightCenterOffset, y:0}, right2D);
	    Polygon2d.centerOn({x:0,y:topCenterOffset}, top2D);
	
	    const front = Polygon2d.lines(front2D);
	    const right = Polygon2d.lines(right2D);
	    const top = Polygon2d.lines(top2D);
	    // Line2d.mirror(top);
	    // Vertex2d.scale(1, -1, Line2d.vertices(top));
	
	    let parimeter;
	    this.parimeter = () => {
	      if (!parimeter) {
	        parimeter = {};
	        parimeter.front = EscapeMap.parimeter(this.front());
	        parimeter.right = EscapeMap.parimeter(this.right());
	        parimeter.top = EscapeMap.parimeter(this.top());
	      }
	      return {
	        front: () => parimeter.front.copy(),
	        right: () => parimeter.right.copy(),
	        top: () => parimeter.top.copy(),
	        allLines: () => parimeter.front.lines().concat(parimeter.right.lines().concat(parimeter.top.lines()))
	      };
	    }
	
	    this.axis = () => axis;
	    this.front = () => front;
	    this.right = () => right;
	    this.top = () => top;
	    this.toDrawString = () => {
	      let str = '';
	      str += '//Front\n' + Line2d.toDrawString(front);
	      str += '\n//Right\n' + Line2d.toDrawString(right);
	      str += '\n//Top\n' + Line2d.toDrawString(top);
	      return str;
	    }
	  }
	}
	
	module.exports = ThreeView;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/snap-location.js',
function (require, exports, module) {
	
const Vertex2d = require('vertex');
	const Line2d = require('line');
	const Circle2d = require('circle');
	const HoverMap2d = require('../hover-map')
	
	class SnapLocation2d {
	  constructor(parent, location, centerFunction) {
	    Object.getSet(this, {location});
	    let pairedWith = null;
	    let courting;
	    const instance = this;
	
	    this.center = () => centerFunction();
	
	    // If position is defined and a Vertex2d:
	    //        returns the position of parents center iff this location was at position
	    // else
	    //        returns current postion based off of the parents current center
	
	    this.at = (position) => {
	      return centerFunction(position);
	    }
	    this.centerFunction = (lf) => {
	      if ((typeof lf) === 'function') centerFunction = lf;
	      return lf;
	    }
	    this.circle = (radius) => new Circle2d(radius || 2, centerFunction());
	    this.eval = () => this.parent().position[location]();
	    this.parent = () => parent;
	    this.pairedWith = () => pairedWith;
	    this.disconnect = () => {
	      if (pairedWith === null) return false;
	      const wasPaired = pairedWith;
	      pairedWith = null;
	      if (wasPaired instanceof SnapLocation2d) wasPaired.disconnect();
	      instance.parent().clearIdentifiedConstraints();
	      return true;
	    }
	    this.pairWith = (otherSnapLoc) => {
	      otherSnapLoc ||= courting;
	      const alreadyPaired = otherSnapLoc === pairedWith;
	      if (!alreadyPaired && otherSnapLoc) {
	        pairedWith = otherSnapLoc;
	        courting = null;
	        if (otherSnapLoc instanceof SnapLocation2d) otherSnapLoc.pairWith(this);
	      }
	    }
	
	    // TODO: location should be immutible and so should these;
	    this.isRight = this.location().indexOf('right') === 0;
	    this.isLeft = this.location().indexOf('left') === 0;
	    this.isBack = this.location().indexOf('back') === 0;
	    this.isCenter = this.location().match(/center$/) !== null;
	
	    this.courting = (otherSnapLoc) => {
	      if (courting === otherSnapLoc) return courting;
	      if (!pairedWith) {
	        if (otherSnapLoc) {
	          courting = otherSnapLoc;
	          if (otherSnapLoc instanceof SnapLocation2d)
	            otherSnapLoc.courting(this);
	        } else if (otherSnapLoc === null && courting) {
	          const tempLocation = courting;
	          courting = null;
	          if (tempLocation instanceof SnapLocation2d)
	            tempLocation.courting(null);
	        }
	      } else if (otherSnapLoc) {
	        throw new Error('You cannot court a location when alreadyPaired');
	      }
	      return courting;
	    }
	
	    this.neighbors = (...indicies) => {
	      const vertexNeighbors = parent.object().neighbors(this.center(), ...indicies);
	      return vertexNeighbors.map((vert) => parent.snapLocations.at(vert));
	    }
	
	    this.neighbor = (index) => this.neighbors(index)[0];
	
	    this.slope = (offsetIndex) => {
	      const neighbor = parent.object().neighbors(this.center(), offsetIndex)[0];
	      const nCenter = neighbor.point();
	      const center = this.center().point();
	      if (offsetIndex < 0)
	        return Line2d.getSlope(nCenter.x, nCenter.y, center.x, center.y);
	      return Line2d.getSlope(center.x, center.y, nCenter.x, nCenter.y);
	    }
	
	    this.forwardSlope = () => this.slope(1);
	    this.reverseSlope =  () => this.slope(-1);
	    this.forwardRadians = () => Math.atan(this.slope(1));
	    this.reverseRadians = () => Math.atan(this.slope(-1));
	
	
	    this.snapToLocation = (otherSnapLoc) => {
	      const center = otherSnapLoc.center();
	      const otherRads = otherSnapLoc.forwardRadians();
	      const rads = instance.forwardRadians();
	      const changeInTheta = otherRads - rads;
	      const position1 = {center: center, theta: changeInTheta};
	      const position2 = {center: center, theta: changeInTheta - Math.PI};
	      const newPosition1 = instance.parent().position[location](position1);
	      const newPosition2 = instance.parent().position[location](position2);
	      const otherObjectCenter = otherSnapLoc.parent().object().center()
	      const dist1 = newPosition1.distance(otherObjectCenter);
	      const dist2 = newPosition2.distance(otherObjectCenter);
	      const objTheta = instance.parent().radians();
	      const theta = objTheta - changeInTheta;
	      if (dist1 > dist2) {
	        instance.parent().makeMove({center: newPosition1, theta});
	      } else {
	        instance.parent().makeMove({center: newPosition2, theta: theta - Math.PI});
	      }
	    }
	
	    function snapToObject(vertex) {
	      const otherSnapLoc = parent.otherHoveringSnap(vertex);
	      if (!otherSnapLoc) return false;
	      instance.courting(otherSnapLoc);
	      instance.snapToLocation(otherSnapLoc);
	      return true;
	    }
	
	    this.move = (vertex, moveId) => {
	      if (parent.connected()) return parent.moveConnected(this.at({center: vertex}));
	      const shouldNotSnap = (typeof moveId) === 'number' || moveId === null;
	      vertex = new Vertex2d(vertex);
	      if (shouldNotSnap || !snapToObject(vertex)) {
	        const thisNewCenterLoc = this.parent().position[location]({center: vertex});
	        this.parent().makeMove({center: thisNewCenterLoc});
	      }
	    }
	
	    this.rotateAround = (theta) => {
	      const startPosition = {center: this.center()};
	      this.parent().moveConnected(null, theta);
	      const newCenter = this.at(startPosition);
	      this.parent().moveConnected(newCenter);
	    }
	
	    this.setRadians = (radians) => {
	      const startPosition = {center: this.center()};
	      const theta = radians - parent.radians();
	      this.parent().moveConnected(null, theta);
	      const newCenter = this.at(startPosition);
	      this.parent().moveConnected(newCenter);
	    }
	
	    this.notPaired = () => pairedWith === null;
	
	    this.hovering = new HoverMap2d(() => this.center(), 12).hovering;
	
	    this.instString = () => `${parent.id()}:${location}`;
	    this.toString = () => pairedWith  instanceof SnapLocation2d ?
	                  `${this.instString()}=>${pairedWith && pairedWith.instString()}` :
	                  `${this.instString()}=>${pairedWith}`;
	    this.toJson = () => {
	      const pw = pairedWith;
	      if (pw === undefined) return;
	      const json = [{
	        location, objectId: parent.parent().id()
	      }];
	      json[1] = pw instanceof SnapLocation2d ?
	                  {location: pw.location(), objectId: pw.parent().parent().id()} :
	                  pw.constructor.name;
	      const thisStr = this.toString();
	      const pairStr = pw.toString();
	      json.view = parent.view();
	      json.UNIQUE_ID = thisStr < pairStr ? thisStr : pairStr;;
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
	
	function fromToPoint(snapLoc, xDiffFunc, yDiffFunc) {
	  return (position) => {
	    const xDiff = xDiffFunc();
	    const yDiff = yDiffFunc();
	    const vertex = snapLoc.center();
	    if (xDiff === 0 && yDiff === 0) {
	      if (position) return snapLoc.parent().parent().center().clone();
	      vertex.point(snapLoc.parent().parent().center().clone());
	      return snapLoc;
	    }
	    const center = snapLoc.parent().parent().center();
	    const direction = xDiff >= 0 ? 1 : -1;
	    const hypeLen = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
	    let rads = Math.atan(yDiff/xDiff);
	    if (position) {
	      rads += position.theta === undefined ? snapLoc.parent().radians() : position.theta;
	      const newPoint = position.center;
	      return new Vertex2d({
	        x: newPoint.x() - direction * (hypeLen * Math.cos(rads)),
	        y: newPoint.y() - direction * (hypeLen * Math.sin(rads))
	      });
	    } else {
	      rads += snapLoc.parent().radians();
	      vertex.point({
	        x: center.x() + direction * (hypeLen * Math.cos(rads)),
	        y: center.y() + direction * (hypeLen * Math.sin(rads))
	      });
	      return snapLoc;
	    }
	  }
	}
	SnapLocation2d.fromToPoint = fromToPoint;
	
	const f = (snapLoc, attr, attrM, props) => () => {
	  let val = snapLoc.parent()[attr]() * attrM;
	  let keys = Object.keys(props || {});
	  for (let index = 0; index < keys.length; index += 1) {
	    const key = keys[index];
	    val += snapLoc.parent()[key]() * props[key];
	  }
	  return val;
	};
	
	SnapLocation2d.locationFunction = f;
	
	module.exports = SnapLocation2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/square.js',
function (require, exports, module) {
	
const Vertex2d = require('vertex');
	
	class Square2d {
	  constructor(center, height, width, radians) {
	    width = width === undefined ? 121.92 : width;
	    height = height === undefined ? 60.96 : height;
	    radians = radians === undefined ? 0 : radians;
	    const id = String.random();
	    const instance = this;
	    Object.getSet(this, {center: new Vertex2d(center), height, width, radians});
	    if ((typeof center) === 'function') this.center = center;
	    const startPoint = new Vertex2d(null);
	
	
	    this.radians = (newValue) => {
	      if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
	        radians = newValue;
	      }
	      return radians;
	    };
	    this.startPoint = () => {
	      startPoint.point({x: this.center().x() - width / 2, y: this.center().y() - height / 2});
	      return startPoint;
	    }
	    this.angle = (value) => {
	      if (value !== undefined) this.radians(Math.toRadians(value));
	      return Math.toDegrees(this.radians());
	    }
	
	    this.x = (val) => {
	      if (val !== undefined) this.center().x(val);
	      return this.center().x();
	    }
	    this.y = (val) => {
	      if (val !== undefined) this.center().y(val);
	      return this.center().y();
	    }
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
	      this.center().point(center);
	      return true;
	    };
	
	    this.offsetX = (negitive) => negitive ? this.width() / -2 : this.width() / 2;
	    this.offsetY = (negitive) => negitive ? this.height() / -2 : this.height() / 2;
	
	    this.toString = () => `Square2d(${id}): ${this.width()} X ${this.height()}] @ ${this.center()}`
	  }
	}
	
	new Square2d();
	
	module.exports = Square2d;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/maps/star-line-map.js',
function (require, exports, module) {
	
const Vertex2d = require('../objects/vertex');
	const Line2d = require('../objects/line');
	const ExtremeSector = require('./star-sectors/extreme');
	
	
	
	class StarLineMap {
	  constructor(type, sectorCount, center) {
	    type = type.toLowerCase();
	    let sectors;
	    let compiled;
	    const lines = [];
	    const instance = this;
	    sectorCount ||= 1000;
	
	    this.center = () => center ||= Vertex2d.center(...Line2d.vertices(lines));
	
	    function getSector(t) {
	      const args = Array.from(arguments).slice(1);
	      t ||= type;
	      switch (t) {
	        case 'extreme':
	          return new ExtremeSector(...args);
	        default:
	          throw new Error(`Unknown sector type '${t}'`);
	      }
	    }
	
	    function buildSectors(type, center, count) {
	      count ||= sectorCount;
	      sectors = [];
	      center ||= instance.center();
	      const thetaDiff = 2*Math.PI / count;
	      for (let index = 0; index < count; index++) {
	        const sector = getSector(type, center, thetaDiff * (index));
	        sectors.push(sector);
	        for (let sIndex = 0; sIndex < lines.length; sIndex++) {
	          sector.add(lines[sIndex]);
	        }
	      }
	    }
	
	    this.isSupported = (obj) => obj instanceof Line2d;
	
	    this.add = (obj) => {
	      if (!this.isSupported(obj)) throw new Error(`obj of type ${obj.constructor.name} is not supported`);
	      lines.push(obj);
	    }
	
	    this.addAll = (lines) => {
	      for(let index = 0; index < lines.length; index++)this.add(lines[index]);
	    }
	
	    this.filter = (type, center, count) => {
	      buildSectors(type, center, count);
	      const extremes = {};
	      for (let index = 0; index < sectors.length; index++) {
	        sectors[index].filter(extremes);
	      }
	      return Object.values(extremes);
	    }
	
	    this.sectorLines = () => buildSectors() || sectors.map((s) => s.line());
	    this.toDrawString = (sectorCount) => {
	      buildSectors(null, sectorCount || 24);
	      const center = this.center();
	      let str = `//center ${center.approxToString()}`;
	      str += '\n//lines\n' + Line2d.toDrawString(lines, 'black');
	      str += '\n\n//Sectors\n';
	      sectors.forEach(s => str += s.toDrawString(String.nextColor()));
	      return str;
	    }
	  }
	}
	
	
	module.exports = StarLineMap;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/snap/square.js',
function (require, exports, module) {
	const Snap2d = require('../snap');
	const Square2d = require('../square');
	const Polygon2d = require('../polygon');
	const SnapLocation2d = require('../snap-location');
	const Vertex2d = require('../vertex');
	
	class SnapSquare extends Snap2d {
	  constructor(parent, tolerance) {
	    const polygon = new Polygon2d();
	    polygon.getTextInfo = () => ({
	      text: this.parent().name() || 'kazzooi',
	      center: this.center(),
	      radians: this.radians(),
	      x: this.x(),
	      y: this.y() / 4,
	      maxWidth: this.width(),
	      limit: 10
	    });
	    // super(parent, new Square2d(parent.center), tolerance);
	    super(parent, polygon, tolerance);
	    if (parent === undefined) return this;
	    this.addLocation(SnapSquare.backCenter(this));
	    this.addLocation(SnapSquare.backRight(this));
	    this.addLocation(SnapSquare.rightCenter(this));
	    this.addLocation(SnapSquare.frontRight(this));
	    this.addLocation(SnapSquare.frontLeft(this));
	    this.addLocation(SnapSquare.leftCenter(this));
	    this.addLocation(SnapSquare.backLeft(this));
	    const vertices = this.snapLocations().map((snap) =>
	      snap.center());
	    polygon.addVertices(vertices);
	  }
	}
	
	const fromToPoint = SnapLocation2d.fromToPoint;
	const wFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'width', multiplier);
	const hFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'height', multiplier);
	
	SnapSquare.backCenter = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "backCenter",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, 0), hFunc(snapLoc, -.5)));
	  return snapLoc;
	}
	SnapSquare.frontCenter = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "frontCenter",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, 0), () => hFunc(snapLoc, .5)));
	  snapLoc.at();
	  return snapLoc;
	}
	SnapSquare.leftCenter = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "leftCenter",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, 0)));
	  return snapLoc;
	}
	SnapSquare.rightCenter = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "rightCenter",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, 0)));
	  return snapLoc;
	}
	
	SnapSquare.backLeft = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "backLeft",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, -.5)));
	  return snapLoc;
	}
	SnapSquare.backRight = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "backRight",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, -.5)));
	  return snapLoc;
	}
	
	SnapSquare.frontRight = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "frontRight",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, .5)));
	  return snapLoc;
	}
	SnapSquare.frontLeft = (parent) => {
	  const snapLoc = new SnapLocation2d(parent, "frontLeft",
	      () => fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, .5)));
	  return snapLoc;
	}
	
	module.exports = SnapSquare;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/objects/snap/polygon.js',
function (require, exports, module) {
	const Snap2d = require('../snap');
	const Line2d = require('../line');
	const Square2d = require('../square');
	const Polygon2d = require('../polygon');
	const SnapLocation2d = require('../snap-location');
	const Vertex2d = require('../vertex');
	const ToleranceMap = require('../../../../tolerance-map.js');
	
	class SnapPolygon extends Snap2d {
	  constructor(parent, polygon, tolerance) {
	    if (!(polygon instanceof Polygon2d) || !polygon.valid()) throw new Error('PolygonSnap requires a valid polygon to intialize');
	    super(parent, polygon, tolerance);
	    let locationCount = 0;
	    polygon.centerOn(parent.center());
	    if (parent === undefined) return this;
	    const instance = this;
	    let longestFaceLine;
	
	    const setOpeningLine = (index) => {
	      const line = polygon.lines()[index];
	      if (longestFaceLine === undefined || longestFaceLine.length() < line.length()) {
	        longestFaceLine = line;
	      }
	    }
	
	    const midpointMap = new ToleranceMap({x: .1, y:.1});
	    const vertexFunc = (index) => (position) => polygon.vertex(index, position);
	    const midpointFunc = (index) => (position) => polygon.midpoint(index, position);
	    function addLine(index, name, targetName) {
	      const locFunc = vertexFunc(index + 1);
	      const snapLoc = new SnapLocation2d(instance, name + locationCount++,  locFunc,  targetName);
	      instance.addLocation(snapLoc);
	      const mpFunc = midpointFunc(index + (name === 'right' ? 1 : 0));
	      const mpLoc = mpFunc();
	      if(midpointMap.matches(mpLoc).length === 0) {
	        midpointMap.add(mpLoc);
	        const snapLocMidpoint = new SnapLocation2d(instance, `${name}${locationCount++}center`,  mpFunc,  `${targetName}Center`);
	        instance.addLocation(snapLocMidpoint);
	      }
	
	      // snapLoc.wallThetaOffset(0);
	      // snapLoc.thetaOffset(null, null, 180);
	      snapLoc.at();
	    }
	
	    const backs = [];
	    function queBack (index) {backs.push(index)};
	
	    function addBacks(index) {
	      for (let index = 0; index < backs.length; index++) {
	        const i = backs[index];
	        addLine(i, `back${i}`, 'back');
	      }
	    }
	
	    function addVertex(index, prevIsFace, targetIsFace, nextIsFace) {
	      if (prevIsFace && !targetIsFace && nextIsFace){
	        queBack(index);
	      } else if (targetIsFace && !nextIsFace) {
	        addLine(index, 'right', 'left');
	        setOpeningLine(index);
	      } else if (!targetIsFace && nextIsFace) {
	        addLine(index, 'left', 'right');
	      } else if (targetIsFace) {
	        setOpeningLine(index);
	        return;
	      } else {
	        queBack(index);
	      }
	    }
	
	    function build() {
	      const faces = polygon.faces();
	      const lines = polygon.lines();
	      let prevPrevIsFace = faces.equalIndexOf(lines[lines.length -2]) !== -1;
	      let prevIsFace = faces.equalIndexOf(lines[lines.length - 1]) !== -1;
	      for (let index = 0; index < lines.length; index++) {
	        const line = lines[index];
	        const currIsFace = faces.equalIndexOf(line) !== -1;
	        const currIndex = index === 0 ? lines.length - 1 : index - 1;
	        addVertex(currIndex, prevPrevIsFace, prevIsFace, currIsFace);
	        prevPrevIsFace = prevIsFace;
	        prevIsFace = currIsFace;
	      }
	      addBacks();
	    }
	
	    function textCenter () {
	      const center = instance.object().center();
	      // if (longestFaceLine)
	      //   return new Line2d(longestFaceLine.midpoint(), center).midpoint();
	      return center;
	    }
	
	    polygon.getTextInfo = () => ({
	      text: instance.parent().name(),
	      center: textCenter(),
	      radians: longestFaceLine ? longestFaceLine.radians() : 0,
	      x: 0,
	      y: instance.height() / 4,
	      maxWidth: longestFaceLine ? longestFaceLine.length() : instance.width(),
	      limit: 10
	    });
	
	    build();
	  }
	}
	
	module.exports = SnapPolygon;
	
});


RequireJS.addFunction('./public/js/utils/canvas/two-d/maps/star-sectors/extreme.js',
function (require, exports, module) {
	
const Line2d = require('../../objects/line');
	const Tolerance = require('../../../../tolerance.js');
	const ToleranceMap = require('../../../../tolerance-map.js');
	const tol = .0001;
	const withinTol = Tolerance.within(tol);
	
	
	class ExtremeSector {
	  constructor(center, theta) {
	    const intersectionMap = new ToleranceMap({'line.slope': tol})
	    center = center.copy();
	    const limits = {start: {
	        dist: 0
	      },middle: {
	        dist: 0
	      },end: {
	        dist: 0
	      }
	    }
	
	    const sectorLine = Line2d.startAndTheta(center, theta);
	    // sectorLine.translate(new Line2d(sectorLine.midpoint(), sectorLine.startVertex()));
	    this.line = () => sectorLine;
	
	    function newLimit(vertex, line, limitObj) {
	      const dist = center.distance(vertex);
	      if (dist > limitObj.dist) {
	        limitObj.dist = dist;
	        limitObj.line = line;
	      }
	    }
	
	    this.filter = (extremes) => {
	      extremes ||= {};
	      const add = (line) => line && extremes[line.toString()] === undefined &&
	                            (extremes[line.toString()] = line);
	      add(limits.start.line);
	      add(limits.middle.line);
	      add(limits.end.line);
	      return extremes;
	    }
	
	    this.toDrawString = (color) => {
	      const sectionStr = Line2d.toDrawString([sectorLine], color);
	      const extremes = Object.values(this.extremes());
	      const linesStrs = Line2d.toDrawString(extremes, color);
	      return `// ${Math.toDegrees(theta)}\n${sectionStr}\n${linesStrs}\n`;
	    }
	
	    //Maybe useful to remove consolidatable lines.
	    function additionFilter(matches, elem) {
	      matches.push(elem);
	      const lineToMatch = {};
	      let lines = [];
	      for (let index = 0; index < matches.length; index++) {
	        const match = matches[index];
	        lines.push(match.line);
	        lineToMatch[match.line.toString()] = match;
	      }
	      lines = Line2d.consolidate(...lines);
	      const consolidated = [];
	      for (let index = 0; index < lines.length; index++) {
	        const line = lines[index];
	        let match = lineToMatch[line.toString()];
	        if (!match) match = {line, intersection: sectorLine.findDirectionalIntersection(line)}
	        consolidated.push(match);
	      }
	      return consolidated;
	    }
	
	    this.add = (line) => {
	      const intersection = sectorLine.findDirectionalIntersection(line);
	      if (intersection && line.withinSegmentBounds(intersection)) {
	        const sv = line.startVertex(); const mv = line.midpoint(); const ev = line.endVertex();
	        // intersectionMap.filter({line, intersection},  additionFilter);
	        newLimit(sv, line, limits.start);
	        newLimit(mv, line, limits.middle);
	        newLimit(ev, line, limits.end);
	      }
	    }
	  }
	}
	
	module.exports = ExtremeSector;
	
});


window.onload = () => RequireJS.init('./services/canvas-buddy/app/app.js')
