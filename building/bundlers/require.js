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
