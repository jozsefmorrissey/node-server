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
      const fileName = wrongPath.replace(nameReg, '$2').toLowerCase();
      Object.keys(scripts).forEach((path) => {
        const name = path.replace(nameReg, '$2').toLowerCase();
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



RequireJS.addFunction('../../public/js/utils/$t.js',
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


RequireJS.addFunction('../../public/js/utils/object/lookup.js',
function (require, exports, module) {
	
class IdString extends String {
	  constructor(...ids) {
	    let id = '';
	    for (let index = 0; index < ids.length; index++) {
	      id += `${ids[index]}_`;
	    }
	    id = id.substring(0, id.length - 1);
	    if (id.length === 0) {
	      console.warn('Not sure if this is a problem');
	    }
	    super(id);
	    this.split = () => {
	      return id.split('_');
	    }
	    this.toJson = () => new String(id);
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
	    Object.getSet(obj, attr, Lookup.ID_ATTRIBUTE);
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
	      if (idStr instanceof IdString) {
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
	    if(cxtr.selectList === Lookup.selectList) {
	      cxtr.get = (id) => Lookup.get(id, cxtr);
	      if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
	      Lookup.byId[cxtr.name] = {};
	      cxtr.selectList = () => Lookup.selectList(cxtr.name);
	    }
	  }
	
	  registerConstructor();
	  addSelectListFuncToConstructor();
	
	
	  Lookup.byId[cxtrName][id.index(-1)] = obj;
	  if (obj.toString === undefined) obj.toString = () => obj[attr]();
	}
	
	Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
	Lookup.byId = {Lookup};
	Lookup.constructorMap = {};
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
	  if ((typeof id) === 'string') id = new IdString(id);
	  if (!(id instanceof IdString)) return;
	  const cxtrId = id.index(0);
	  const objId = id.index(-1);
	  return {
	    constructor: cxtrId === objId ? undefined : Lookup.constructorMap[cxtrId],
	    id: objId
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


RequireJS.addFunction('../../public/js/utils/custom-event.js',
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
	let lastKeyId;
	let keyPressId = 0;
	function onKeycombo(event, func, args) {
	  const keysDown = {};
	  const allPressed = () => {
	    let is = true;
	    const keys = Object.keys(keysDown);
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
	
	// TODO: add custom function selectors.
	const argEventReg = /^(.*?)(|:(.*))$/;
	function filterCustomEvent(event, func) {
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
	  }
	  return customEvent;
	}
	
	du.on.match = function(event, selector, func, target) {
	  const events = event.split(':');
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


RequireJS.addFunction('../../public/js/utils/utils.js',
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
	
	const specialRegChars = /[-[\]{}()*+?.,\\^$|#\\s]/g;
	Function.safeStdLibAddition(RegExp, 'escape',  function (str) {
	  return str.replace(specialRegChars, '\\$&');
	}, true);
	
	Function.safeStdLibAddition(String, 'count',  function (len) {
	  const clean = RegExp.escape(this);
	  return clean.replace(/[^-]/g, '').length
	});
	
	
	const decimalRegStr = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
	const decimalReg = new RegExp(`^${decimalRegStr}$`);
	Function.safeStdLibAddition(String, 'isNumber', function (len) {
	  return this.trim().match(decimalReg) !== null;
	});
	
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
	
	Function.safeStdLibAddition(Array, 'count', function(func) {
	  let count = 0;
	  for (let index = 0; index < this.length; index++) {
	    const retVal = func(this[index]);
	    count += (typeof retVal) === 'number' ? retVal : (retVal ? 1 : 0);
	  }
	  return count;
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
	
	function sortByAttr(attr) {
	  function sort(obj1, obj2) {
	    const val1 = Object.pathValue(obj1, attr);
	    const val2 = Object.pathValue(obj2, attr);
	    if (val2 === val1) {
	      return 0;
	    }
	    return val1 > val2 ? 1 : -1;
	  }
	  return sort;
	}
	
	const nativeSort = Array.sort;
	Function.safeStdLibAddition(Array, 'sortByAttr', function(stringOfunc) {
	  if ((typeof stringOfunc) === 'string')
	    return this.sort.apply(this, [sortByAttr(stringOfunc)]);
	  return this.sort.apply(this, arguments);
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
	        throw e;
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
	
	Function.safeStdLibAddition(Array, 'remap', function (func) {
	  for (let index = 0; index < this.length; index += 1) {
	    this[index] = func(this[index], index);
	  }
	});
	
	Function.safeStdLibAddition(Array, 'swap', function (i, j, doNotModify) {
	  const arr = doNotModify === true ? Array.from(this) : this;
	  const temp = arr[i];
	  arr[i] = arr[j];
	  arr[j] = temp;
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
	    if (this.wrapper === undefined) {
	      console.log('here');
	    }
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
	class LogicTree extends Lookup {
	  constructor(formatPayload, id) {
	    super(id);
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
	    }, 20);
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
	
	  du.on.match('change:keyup:enter', selector, update);
	  du.on.match('click', selector, makeDynamic);
	}
	
	
	const undoDynamic = (target) => {
	  const parent = du.find.up('[resolved="dynam-input"]', target)
	  parent.innerText = target.value;
	  parent.removeAttribute('resolved');
	}
	
	du.on.match('focusout', '.dynam-input', undoDynamic);
	
});


RequireJS.addFunction('../../public/js/utils/input/data-list.js',
function (require, exports, module) {
	
const $t = require('../$t');
	const du = require('../dom-utils');
	
	//TODO: shoould remove datalist from input object... bigger fish
	class DataList {
	  constructor(input) {
	    let list = [];
	    const id = `data-list-${String.random()}`;
	    this.id = () => id;
	    this.list = () => list;
	    this.getElem = () => {
	      let elem = du.id(id);
	      if (!elem)  elem = du.create.element('datalist', {id});
	      du.find('body').append(elem);
	      return elem;
	    }
	    this.update = () => {
	      const elem = this.getElem();
	      elem.innerHTML = DataList.template.render(this);
	      const inputElem = input && input.get();
	      if (inputElem) {
	        inputElem.setAttribute('list', this.id());
	      }
	    }
	    this.setList = (newList) => {
	      if (!Array.isArray(newList) || newList.equals(list)) return
	      list = newList;
	      this.update();
	    }
	  }
	}
	
	DataList.template = new $t('input/data-list');
	
	module.exports = DataList;
	
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
	    Object.getSet(this, props, 'hidden', 'type', 'label', 'name', 'placeholder',
	                            'class', 'list', 'value', 'inline');
	
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
	
	Input.getFromElem = (elem) => {
	  return Input.get(elem.id);
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


RequireJS.addFunction('../../public/js/utils/input/styles/table.js',
function (require, exports, module) {
	
const Input = require('../input');
	const $t = require('../../$t');
	
	class Table extends Input {
	  constructor(props) {
	    super(props);
	    const isArray = Array.isArray(props.list);
	    let value;
	    if (isArray) {
	      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
	    } else {
	      const key = Object.keys(props.list)[0];
	      value = props.value || key;
	    }
	    props.type ||= 'radio';
	    props.value = undefined;
	    this.setValue(value);
	    this.isArray = () => isArray;
	    this.list = () => props.list;
	    this.columns = () => props.columns;
	    this.rows = () => props.rows;
	    this.description = () => props.description;
	    // const parentValue = this.value;
	    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	
	    this.selected = (value) => value === this.value();
	  }
	}
	
	Table.template = new $t('input/table');
	Table.html = (instance) => () => Table.template.render(instance);
	
	module.exports = Table;
	
});


RequireJS.addFunction('../../public/js/utils/input/decision/decision.js',
function (require, exports, module) {
	
// TODO IMPORTANT: refactor this garbage!!!!!!
	// ... its extreamly unIntuitive.
	
	
	
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
	    const instance = this;
	
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
	        wrapperOid : (LogicWrapper.get(wrapperOid));
	
	    this.branch = (wrapperId, inputs) =>
	            getWrapper(wrapperId).branch(String.random(), new DecisionInput(name));
	    this.conditional = (wrapperId, inputs, name, selector) =>
	            getWrapper(wrapperId).conditional(String.random(), new DecisionInput(name, relation, formula));
	
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
	    this.tag = () =>
	      tree.block() ? 'div' : 'span';
	
	    this.html = (parentCalling, editDisplay) => {
	      if (this.isRoot() && parentCalling !== true) return tree.html(null, editDisplay);
	      if (editDisplay) {
	        return DecisionInput.modTemplate.render(this);
	      }
	      return DecisionInput.template.render(this);
	    }
	    this.treeHtml = (wrapper) => tree.html(wrapper);
	  }
	}
	DecisionInput.template = new $t('input/decision/decision');
	DecisionInput.modTemplate = new $t('input/decision/decision-modification');
	
	
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
	    tree.id = this.id;
	    tree.html = (wrapper, editDisplay) => {
	      wrapper = wrapper || root;
	      let inputHtml = '';
	      wrapper.forAll((wrapper) => {
	        inputHtml += wrapper.payload().html(true, editDisplay);
	      });
	      const scope = {wrapper, inputHtml, DecisionInputTree, inputTree: this, tree};
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
	
	    let block = false;
	    tree.block = (is) => {
	      if (is === true || is === false) {
	        block = is;
	      }
	      return block;
	    }
	    this.block = tree.block;
	
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
	
	DecisionInputTree.getNode = (elem) => {
	  const cnt = du.find.closest('[node-id]', elem);
	  const parent = cnt.parentElement;
	  const nodeId = cnt.getAttribute('node-id');
	  return LogicWrapper.get(nodeId);
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
	
	function updateModBtn(elem) {
	  const value = elem.value;
	  const button = du.find.closest('.conditional-button', elem);
	  button.innerText = `If ${elem.name} = ${value}`;
	}
	
	let count = 999;
	const getInput = () => new Input({
	  label: `Label${++count}`,
	  name: `Name${count}`,
	  inline: true,
	  class: 'center',
	});
	
	function modifyBtnPressed(elem) {
	  const node = DecisionInputTree.getNode(elem);
	  const inputArray = node.payload().inputArray;
	  const inputElem = du.find.closest('input,select,textarea', elem);
	  const input = Input.getFromElem(inputElem);
	  console.log('elm')
	  const tree = DecisionInputTree.getTree(elem);
	
	  const newInput = getInput();
	  const branch = tree.getByPath(node.name);
	
	  const newNodeName = String.random();
	  const valueCond = new ValueCondition(input.name(), input.value(), [newInput]);
	  nextBranch = node.root().conditional(newNodeName, valueCond);
	  
	}
	
	du.on.match('keyup', `.${ROOT_CLASS}`, DecisionInputTree.update(true));
	du.on.match('change', `.${ROOT_CLASS}`, DecisionInputTree.update());
	du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);
	du.on.match('keyup', '.decision-input-cnt.mod input', updateModBtn);
	du.on.match('keyup', '.decision-input-cnt.mod select', updateModBtn);
	du.on.match('keyup', '.decision-input-cnt.mod textarea', updateModBtn);
	du.on.match('click', '.conditional-button', modifyBtnPressed);
	
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
	
	DecisionInputTree.getTree = (elem) => {
	  const rootElem = du.find.up("[tree-id]", elem);
	  const rootId = rootElem.getAttribute('tree-id');
	  const tree = DecisionInputTree.get(rootId);
	  return tree;
	}
	
	DecisionInputTree.template = new $t('input/decision/decisionTree');
	
	module.exports = DecisionInputTree;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/radio0.js',
function (require, exports, module) {
	
const Input = require('../input');
	const $t = require('../../$t');
	
	class Radio extends Input {
	  constructor(props) {
	    super(props);
	    if (props.list === undefined) throw new Error('Radio Input is useless without a list of possible values');
	    const isArray = Array.isArray(props.list);
	    let value;
	    if (isArray) {
	      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
	    } else {
	      const key = Object.keys(props.list)[0];
	      value = props.value || key;
	    }
	    props.value = undefined;
	    this.setValue(value);
	    this.isArray = () => isArray;
	    this.list = () => props.list;
	    this.description = () => props.description;
	    // const parentValue = this.value;
	    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.selected = (value) => value === this.value();
	  }
	}
	
	Radio.template = new $t('input/radio');
	Radio.html = (instance) => () => Radio.template.render(instance);
	
	Radio.yes_no = (props) => (props.list = ['Yes', 'No']) && new Radio(props);
	Radio.true_false = (props) => (props.list = ['True', 'False']) && new Radio(props);
	
	module.exports = Radio;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/select.js',
function (require, exports, module) {
	

	
	
	
	const Input = require('../input');
	const $t = require('../../$t');
	
	class Select extends Input {
	  constructor(props) {
	    super(props);
	    if (props.list === undefined) props.list = [];
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
	    this.list = () => props.list;
	    const parentValue = this.value;
	    this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.selected = (value) => value === this.value();
	  }
	}
	
	Select.template = new $t('input/select');
	Select.html = (instance) => () => Select.template.render(instance);
	
	module.exports = Select;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/radio.js',
function (require, exports, module) {
	
const Input = require('../input');
	const $t = require('../../$t');
	
	class Radio extends Input {
	  constructor(props) {
	    super(props);
	    if (props.list === undefined) throw new Error('Radio Input is useless without a list of possible values');
	    const isArray = Array.isArray(props.list);
	    let value;
	    if (isArray) {
	      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
	    } else {
	      const key = Object.keys(props.list)[0];
	      value = props.value || key;
	    }
	    props.value = undefined;
	    this.setValue(value);
	    this.isArray = () => isArray;
	    this.list = () => props.list;
	    this.description = () => props.description;
	    // const parentValue = this.value;
	    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.selected = (value) => value === this.value();
	  }
	}
	
	Radio.template = new $t('input/radio');
	Radio.html = (instance) => () => Radio.template.render(instance);
	
	Radio.yes_no = (props) => (props.list = ['Yes', 'No']) && new Radio(props);
	Radio.true_false = (props) => (props.list = ['True', 'False']) && new Radio(props);
	
	module.exports = Radio;
	
});


RequireJS.addFunction('../../public/js/utils/input/styles/select0.js',
function (require, exports, module) {
	

	
	
	
	const Input = require('../input');
	const $t = require('../../$t');
	
	class Select extends Input {
	  constructor(props) {
	    super(props);
	    if (props.list === undefined) props.list = [];
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
	    this.list = () => props.list;
	    const parentValue = this.value;
	    this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
	    const parentHidden = this.hidden;
	    this.hidden = () => props.list.length < 2 || parentHidden();
	
	    this.selected = (value) => value === this.value();
	  }
	}
	
	Select.template = new $t('input/select');
	Select.html = (instance) => () => Select.template.render(instance);
	
	module.exports = Select;
	
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
	
exports['14589589'] = (get, $t) => 
			`<td > <input type='checkbox'> </td>`
	
	exports['94156316'] = (get, $t) => 
			`<td > <input type='input'> </td>`
	
	exports['101748844'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` </span>`
	
	exports['450668834'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('14589589').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
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
	
	exports['680173222'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('-1330466483').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
	exports['830877709'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('-1258061900').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
	exports['837969265'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` <button class='conditional-button'> If ` +
			$t.clean(get("input").name()) +
			` = ` +
			$t.clean(get("input").value()) +
			` </button> <br> </span>`
	
	exports['877547683'] = (get, $t) => 
			`<td > <input type='` +
			$t.clean(get("type")) +
			`' name='` +
			$t.clean(get("id")()-get("row")) +
			`'> </td>`
	
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
	
	exports['1591500900'] = (get, $t) => 
			`<td > <input type='` +
			$t.clean(get("type")()) +
			`' name='` +
			$t.clean(get("id")()) +
			`-` +
			$t.clean(get("row")) +
			`'> </td>`
	
	exports['1709244846'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("key")) +
			`</label> <input type='radio' ` +
			$t.clean((get("isArray")() ? get("val") : get("key")) === get("value")() ? 'checked' : '') +
			` class='` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`'> </span>`
	
	exports['1798392880'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('877547683').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
	exports['1835219150'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("isArray")() ? get("value") : get("key")) +
			`' ` +
			$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
			`> ` +
			$t.clean(get("value")) +
			` </option>`
	
	exports['1981775641'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('-1281991796').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
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
			$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
			` <div class='expand-input-cnt' hidden has-input-tree='` +
			$t.clean(get("hasInputTree")()) +
			`'>` +
			$t.clean(get("inputHtml")()) +
			`</div> <div class='input-open-cnt'><button>Add ` +
			$t.clean(get("listElemLable")()) +
			`</button></div> </div> `
	
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
			`'></div> </div> <div class='expand-tab'> <div class="expand-body ` +
			$t.clean(get("type")()) +
			`" ex-list-id='` +
			$t.clean(get("id")()) +
			`' key='` +
			$t.clean(get("key")) +
			`'></div> </div> </div> `
	
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
	
	exports['input/data-list'] = (get, $t) => 
			`` +
			$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
			` `
	
	exports['-994603408'] = (get, $t) => 
			`<option value="` +
			$t.clean(get("item")) +
			`" ></option>`
	
	exports['input/decision/decision'] = (get, $t) => 
			` <` +
			$t.clean(get("tag")()) +
			` class='decision-input-cnt' node-id='` +
			$t.clean(get("_nodeId")) +
			`' ` +
			$t.clean(get("reachable")() ? '' : 'hidden') +
			`> <span id='` +
			$t.clean(get("id")) +
			`'> ` +
			$t.clean( new $t('101748844').render(get("inputArray"), 'input', get)) +
			` </span> </` +
			$t.clean(get("tag")()) +
			`> `
	
	exports['input/decision/decisionTree'] = (get, $t) => 
			`<div class='` +
			$t.clean(get("DecisionInputTree").class) +
			`' tree-id='` +
			$t.clean(get("tree").id()) +
			`' root-id='` +
			$t.clean(get("wrapper").nodeId()) +
			`'> ` +
			$t.clean(get("inputHtml")) +
			` <button class='` +
			$t.clean(get("DecisionInputTree").buttonClass) +
			`' root-id='` +
			$t.clean(get("wrapper").nodeId()) +
			`' ` +
			$t.clean(get("tree").hideButton ? 'hidden' : '') +
			`> ` +
			$t.clean(get("tree").buttonText()) +
			` </button> </div> `
	
	exports['input/input'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
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
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
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
			$t.clean(get("inline")() ? 'span' : 'div') +
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
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['configure'] = (get, $t) => 
			`<div id='config-body'></div> <div id='test-ground'></div> `
	
	exports['index'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <script type="text/javascript" src='/mike/js/index.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/mike/styles/mike.css"> <title></title> </head> <body> ` +
			$t.clean(get("header")) +
			` ` +
			$t.clean(get("main")) +
			` ` +
			$t.clean(get("footer")) +
			` </body> </html> `
	
	exports['report'] = (get, $t) => 
			`<div> REPORT === ` +
			$t.clean(get("name")) +
			` </div> `
	
	exports['reports'] = (get, $t) => 
			`<div> REPORTS === ` +
			$t.clean(get("name")) +
			` </div> `
	
	exports['input/decision/decision0'] = (get, $t) => 
			` <` +
			$t.clean(get("tag")()) +
			` class='decision-input-cnt' node-id='` +
			$t.clean(get("_nodeId")) +
			`' ` +
			$t.clean(get("reachable")() ? '' : 'hidden') +
			`> <span id='` +
			$t.clean(get("id")) +
			`'> ` +
			$t.clean( new $t('101748844').render(get("inputArray"), 'input', get)) +
			` </span> </` +
			$t.clean(get("tag")()) +
			`> `
	
	exports['input/decision/decision-modification'] = (get, $t) => 
			` <` +
			$t.clean(get("tag")()) +
			` class='decision-input-cnt mod' node-id='` +
			$t.clean(get("_nodeId")) +
			`' ` +
			$t.clean(get("reachable")() ? '' : 'hidden') +
			`> <span id='` +
			$t.clean(get("id")) +
			`'> ` +
			$t.clean( new $t('837969265').render(get("inputArray"), 'input', get)) +
			` </span> <div> <button class='add-btn'>Add Input</button> </div> </` +
			$t.clean(get("tag")()) +
			`> `
	
	exports['-582967449'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` <button class='conditional-button'>If ` +
			$t.clean(get("input").name()) +
			` = ` +
			$t.clean(get("input").value()) +
			`</button> </span>`
	
	exports['-1925226717'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` <button class='conditional-button'> If ` +
			$t.clean(get("input").name()) +
			` = ` +
			$t.clean(get("input").value()) +
			` </button> </span>`
	
	exports['-463611009'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` <br> <button class='conditional-button'> If ` +
			$t.clean(get("input").name()) +
			` = ` +
			$t.clean(get("input").value()) +
			` </button> </span>`
	
	exports['-1298625746'] = (get, $t) => 
			`<span class='pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> <span> ` +
			$t.clean(get("input").html()) +
			` <br> <button class='conditional-button'> If ` +
			$t.clean(get("input").name()) +
			` = ` +
			$t.clean(get("input").value()) +
			` </button> </span> </span>`
	
	exports['../../public/html/templates/input/radio.js'] = (get, $t) => 
			``
	
	exports['input/radio'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
			$t.clean(get("description")()) +
			`</label> <br> <div class='tab'> ` +
			$t.clean( new $t('-1983906216').render(get("list")(), 'key, val', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-1983906216'] = (get, $t) => 
			`<span > <label>` +
			$t.clean(get("isArray")() ? get("val") : get("key")) +
			`</label> <input type='radio' ` +
			$t.clean((get("isArray")() ? get("val") : get("key")) === get("value")() ? 'checked' : '') +
			` class='` +
			$t.clean(get("class")()) +
			`' id='` +
			$t.clean(get("id")()) +
			`' name='` +
			$t.clean(get("name")()) +
			`'> </span>`
	
	exports['input/radio0'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
			$t.clean(get("description")()) +
			`</label> <br> <div class='tab'> ` +
			$t.clean( new $t('-1983906216').render(get("list")(), 'key, val', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['input/table'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
			$t.clean(get("description")()) +
			`</label> <br> <div class='tab'> <table> <tbody> <tr> <td></td> ` +
			$t.clean( new $t('-706519867').render(get("columns")(), 'col', get)) +
			` </tr> ` +
			$t.clean( new $t('-498428047').render(get("rows")(), 'rowIndex, row', get)) +
			` </tbody> </table> </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-706519867'] = (get, $t) => 
			`<td >col</td>`
	
	exports['-2021380955'] = (get, $t) => 
			`<td > </td>`
	
	exports['-1258061900'] = (get, $t) => 
			`<td > (` +
			$t.clean(get("rowIndex")) +
			`, ` +
			$t.clean(get("colIndex")) +
			`) </td>`
	
	exports['-1171141142'] = (get, $t) => 
			`<tr > ` +
			$t.clean( new $t('-1258061900').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
	exports['-1330466483'] = (get, $t) => 
			`<td > <input type='radio'> </td>`
	
	exports['-393845643'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('94156316').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
	exports['-1281991796'] = (get, $t) => 
			`<td > <input type='` +
			$t.clean(get("type")) +
			`'> </td>`
	
	exports['-935319005'] = (get, $t) => 
			`<td > <input type='` +
			$t.clean(get("type")) +
			`' name='` +
			$t.clean(get("id")()) +
			`-` +
			$t.clean(get("row")) +
			`'> </td>`
	
	exports['-2073315152'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('-935319005').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
	exports['-498428047'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('1591500900').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
});


RequireJS.addFunction('./app/app.js',
function (require, exports, module) {
	
require('../../../public/js/utils/utils.js');
	const du = require('../../../public/js/utils/dom-utils.js');
	const $t = require('../../../public/js/utils/$t.js');
	$t.loadFunctions(require('../generated/html-templates'));
	
	const report = require('./pages/report');
	const reports = require('./pages/reports');
	const configure = require('./pages/configure');
	
	let url = du.url.breakdown().path;
	url = url.replace(/^\/mike/, '');
	
	switch (url) {
	  case '/configure':
	    configure.proccess();
	    break;
	  case '/report':
	    report.proccess();
	    break;
	  case '/reports':
	    reports.proccess();
	    break;
	}
	
});


RequireJS.addFunction('./app/pages/report.js',
function (require, exports, module) {
	
function proccess() {
	  console.log('report bitches');
	}
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/configure.js',
function (require, exports, module) {
	
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const Input = require('../../../../public/js/utils/input/input');
	const Radio = require('../../../../public/js/utils/input/styles/radio');
	const Table = require('../../../../public/js/utils/input/styles/table');
	const du = require('../../../../public/js/utils/dom-utils.js');
	
	let count = 0;
	const getInput = () => new Input({
	  label: `Label${++count}`,
	  name: `Name${count}`,
	  inline: true,
	  class: 'center',
	});
	
	let tree;
	function updateEntireTree() {
	  const body = tree.payload().html(null, true);
	  du.id('config-body').innerHTML = body;
	}
	
	function addInput(elem) {
	  const node = DecisionInputTree.getNode(elem);
	  node.payload().inputArray.push(getInput());
	  if (node.payload().isRoot()) updateEntireTree();
	  else {
	    const html = node.payload().html(null, true);
	    du.find.up('.decision-input-cnt', elem).outerHTML = html;
	  }
	}
	
	du.on.match('click', '.add-btn', addInput);
	
	function proccess() {
	  tree = new DecisionInputTree()
	  const input1 = getInput();
	  const input2 = getInput();
	  const input3 = getInput();
	  tree.leaf('root', [input1, input2, input3]);
	  updateEntireTree();
	}
	
	const radio = new Radio({
	  name: 'radeo',
	  description: 'Pussy farts',
	  list: ['one', 2, 3, 'four']
	});
	du.id('test-ground').innerHTML = radio.html();
	// du.id('test-ground').innerHTML = Radio.yes_no({name: 'yn'}).html();
	// du.id('test-ground').innerHTML = Radio.true_false({name: 'tf'}).html();
	
	const table = new Table({
	  name: 'tabal',
	  description: 'Pussy fartsss',
	  columns: ['one', 2, 3, 'four'],
	  rows: ['bill', 'scott', 'joe', 'fred']
	});
	du.id('test-ground').innerHTML = table.html();
	
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/reports.js',
function (require, exports, module) {
	
function proccess() {
	  console.log('reports bitches');
	}
	
	exports.proccess = proccess;
	
});


window.onload = () => RequireJS.init('app/app.js')
