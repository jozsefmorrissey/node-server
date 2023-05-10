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
	Lookup.release = (group) => {
	  const groupList = Lookup.groups[group];
	  if (groupList === undefined) return;
	  Lookup.groups[group] = [];
	  for (let index = 0; index < groupList.length; index += 1) {
	    groupList[index].release();
	  }
	}
	
	Lookup.fromJson = (json) => {
	  const attr = json[Lookup.ID_ATTRIBUTE];
	  if (attr) {
	    const obj = Lookup.get(json[attr]);
	    if(obj) return obj;
	  }
	
	  const type = json._TYPE;
	  if (type && type === 'Lookup') return new Lookup(json);
	  const obj = Object.fromJson(json);
	  if (obj instanceof Lookup) return obj;
	  if (attr) {
	    Lookup.convert(obj, obj[attr], attr)
	    return obj;
	  }
	  return null;
	}
	
	try {
	  module.exports = Lookup;
	} catch (e) {/* TODO: Consider Removing */}
	
});


RequireJS.addFunction('../../public/js/utils/object/imposter.js',
function (require, exports, module) {
	
class Imposter {
	  constructor(object, cuckooEggs, ...args) {
	    const imposter = new (object.constructor)(...args);
	    cuckooEggs ||= {};
	    const cuckooKeys = Object.getOwnPropertyNames(cuckooEggs);
	
	    const keys = ['toString'];//Object.getOwnPropertyNames(object);
	    for (let index = 0; index < keys.length; index++) {
	      const key = keys[index];
	      if (cuckooKeys.indexOf(key) === -1) {
	        if ((typeof object[key]) === 'function') {
	          imposter[key] = (...args) => object[key].apply(object, args);
	        } else {
	          Object.defineProperty(imposter, key, {
	            get() {
	              return object[key];
	            },
	            set(value) {
	              object[key] = value;
	            }
	          });
	        }
	      }
	    }
	
	    for (let index = 0; index < cuckooKeys.length; index++) {
	      const key = cuckooKeys[index];
	      imposter[key] = cuckooEggs[key];
	    }
	
	    imposter.equals = (obj) => {
	      if (obj === object) return true;
	      return object.equals(obj);
	    }
	
	    return imposter;
	  }
	}
	
	module.exports = Imposter;
	
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
	
	    //TODO: This could easily be more efficient.... bigger fish.
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
	      const diff1 = Math.abs(decimalValue) - ((numerator - fracObj.numerator) / denominator);
	      const diff2 = (numerator / denominator) - Math.abs(decimalValue);
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


RequireJS.addFunction('../../public/js/utils/string-math-evaluator.js',
function (require, exports, module) {
	let FunctionCache;
	try {
	  FunctionCache = require('./services/function-cache.js');
	} catch(e) {
	
	}
	
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
	
	    function resolve (path, currObj, globalCheck) {
	      if (path === '') return currObj;
	      // TODO: this try is a patch... resolve path/logic needs to be mapped properly
	      try {
	        const resolved = !globalCheck && resolver && resolver(path, currObj);
	        if (Number.isFinite(resolved)) return resolved;
	      } catch (e) {}
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
	      expr = expr.replace(/-([a-z(])/g, '-1*$1');
	      return expr.replace(/([^a-z^A-Z^\s^$^(^+^\-^*^\/])\(/g, '$1*(');
	    }
	
	    const isolateNumber = isolateValueReg(StringMathEvaluator.decimalReg, Number.parseFloat);
	    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);
	
	    function evaluate(expr, scope, percision) {
	      if (Number.isFinite(expr))
	        return expr;
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
	            let newIndex = isolateNumber(expr, index, values, operands, scope);
	            if (!newIndex && isolateOperand(char, operands)) {
	              throw new Error(`Invalid operand location ${expr.substr(0,index)}'${expr[index]}'${expr.substr(index + 1)}`);
	            }
	            newIndex = newIndex || (isolateParenthesis(expr, index, values, operands, scope) ||
	                (allowVars && isolateVar(expr, index, values, operands, scope)));
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
	        value = value;
	        return value;
	      }
	      return NaN;
	    }
	
	    function evalObject(obj, scope) {
	      const returnObj = Object.forEachConditional(obj, (value, key, object) => {
	        value = evaluate(value, scope);
	        if (!Number.isNaN(value)) object[key] = value;
	      }, (value) => (typeof value) === 'string');
	      return returnObj;
	    }
	
	    this.eval = FunctionCache ? new FunctionCache(evaluate, this, 'sme') : evaluate;
	    this.evalObject = FunctionCache ? new FunctionCache(evalObject, this, 'sme') : evalObject;
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


RequireJS.addFunction('../../public/js/utils/services/function-cache.js',
function (require, exports, module) {
	
const cacheState = {};
	const cacheFuncs = {};
	
	class FunctionCache {
	  constructor(func, context, group, assem) {
	    if ((typeof func) !== 'function') return func;
	    let cache = {};
	    cacheFunc.group = () => {
	      const gp = (typeof group === 'function') ? group() : group || 'global';
	      if (cacheFuncs[gp] === undefined) cacheFuncs[gp] = [];
	      cacheFuncs[gp].push(cacheFunc);
	      return gp;
	    }
	
	    function cacheFunc() {
	      if (FunctionCache.isOn(cacheFunc.group())) {
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
	let disabled = false;
	FunctionCache.isOn = (group) => !disabled && cacheState[group];
	FunctionCache.disable = () => disabled = true;
	FunctionCache.enable = () => disabled = false;
	module.exports = FunctionCache;
	
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
	
	function objEq(obj1, obj2, ignoreKeys) {
	  ignoreKeys ||= [];
	  if (!(obj1 instanceof Object)) return false;
	  if (!(obj2 instanceof Object)) return false;
	  const filter = key => ignoreKeys.indexOf(key) === -1;
	  const obj1Keys = Object.keys(obj1).sort().filter(filter);
	  const obj2Keys = Object.keys(obj2).sort().filter(filter);
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
	          console.log('failed!')
	          objEq(obj1Val, obj2Val)
	          return false;
	        }
	      }
	      else if (!obj1Val.equals(obj2Val)) return false;
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
	}
	
	function setFromJson(obj, options) {
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
	        else
	          obj[attr] = Object.fromJson(json[attr]);
	      }
	    };
	    return obj;
	  }
	}
	
	function setClone(obj, options) {
	  const cxtrFromJson = obj.constructor.fromJson;
	  if (obj.constructor.DO_NOT_CLONE) {
	    obj.clone = () => obj;
	  } else if (cxtrFromJson !== Object.fromJson) {
	    obj.clone = () => cxtrFromJson(obj.toJson());
	  } else if (options.isObject) {
	    setFromJson(obj, options);
	    obj.clone = () => {
	      const clone = Object.fromJson(obj.toJson());
	      Object.getSet(clone, clone);
	      return clone;
	    }
	  } else {
	    obj.clone = () => {
	      const clone = new obj.constructor(obj.toJson());
	      setFromJson(obj, options);
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
	      if (options.immutable) obj[attr] = () => options.values[attr];
	      else {
	        obj[attr] = (value) => {
	          if (value === undefined) {
	            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
	            if (options.values[attr] !== undefined || noDefaults)
	            return options.values[attr];
	            return obj.defaultGetterValue(attr);
	          }
	          return options.values[attr] = value;
	        }
	      }
	    }
	  }
	}
	
	// TODO: test/fix for normal Object(s);
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
	
	Function.safeStdLibAddition(Array, 'idObject',   function  (idAttr) {
	  const obj = {};
	  for (let index = 0; index < this.length; index++) {
	    const elem = this[index];
	    const id = (typeof elem[idAttr] === 'function') ? elem[idAttr]() : elem[idAttr];
	    obj[id] = elem;
	  }
	  return obj;
	});
	
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
	const DecisionNode = DecisionTree.Node;
	const Lookup = require('./object/lookup');
	
	
	class LogicNode extends DecisionNode {
	  constructor (tree, name, instancePayload, parent) {
	    super(tree, name, instancePayload, parent);
	    const conditionMap = {};
	
	    this.conditionsSatisfied = (name) => {
	      if (!parent) return true;
	      if (name === undefined) return parent.conditionsSatisfied(this.name());
	      const conditions  = conditionMap[name];
	      if (conditions === undefined) return true;
	      const value = this.payload().values()[this.name()];
	      const state = this.next(name);
	      for (let index = 0; index < conditions.length; index++) {
	        if (DecisionTree.conditionSatisfied(conditions[index], state, value)) return true;
	      }
	      return false;
	    }
	
	    const parentThen = this.then;
	    this.then = (name, instancePayload, key, condition) => {
	      const state = parentThen(name, instancePayload);
	      if (key) {
	        if(conditionMap[key] === undefined) conditionMap[key] = [];
	        conditionMap[key].push(condition);
	      }
	      return state;
	    }
	  }
	}
	
	//
	class LogicTree  extends DecisionTree {
	  constructor(name, payload) {
	    super(name, payload);
	
	  }
	}
	
	LogicTree.Node = LogicNode;
	
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
	
	function getByName(node, ...namePath) {
	  for (let index = 0; index < namePath.length; index++) {
	    node = node.next(namePath[index]);
	    if (node === undefined) return;
	  }
	  return node;
	}
	
	function getById(node, ...idPath) {
	  for (let index = 0; index < endIndex; index++) {
	    node = node.child(idPath[index]);
	    if (node === undefined) return;
	  }
	  return node;
	}
	
	function formatName(name) {
	  if (name === undefined || name === '') return;
	  return new String(name).toString();
	}
	class StateConfig extends Lookup {
	  constructor(name, payload) {
	    super();
	    name = formatName(name)
	    Object.getSet(this, {name, payload});
	    const states = [];
	    payload = payload || {};
	    const instance = this;
	    this.setValue = (key, value) => payload[key] = value;
	    this.states = () => Array.from(states);
	    this.payload = () => JSON.clone(payload);
	    this.isLeaf = () => states.length === 0;
	    this.stateNames = () => states.map(s => s.name());
	    this.stateMap = () => states.idObject('name');
	    this.validState = (n) => !!this.stateMap()[n];
	    this.remove = (stateConfig) => states.remove(stateConfig);
	    this.then = (stateConfig) => {
	      if (this.validState(stateConfig.name())) return null;
	      states.push(stateConfig);
	    }
	
	    this.toString = (tabs) => {
	      const tab = new Array(tabs).fill('  ').join('');
	      return `${tab}name: ${this.name()}\n${tab}states: ${this.stateNames()}`;
	    }
	  }
	}
	
	StateConfig.fromJson = (json) => {
	  const id = json.id;
	  const existing = StateConfig.get(id);
	  if (existing) return existing;
	  return new StateConfig(json.name, json.payload);
	}
	
	
	const payloadMap = {};
	// terminology
	// name - String to define state;
	// payload - data returned for a given state
	// node - {name, states, payload, then};
	// then(name, payload:optional) - a function to set a following state.
	// next(name) - a function to get the next state.
	// back() - a function to move back up the tree.
	// root() - a function to get root;
	class DecisionNode extends Lookup {
	  constructor(stateConfig, payload, parent) {
	    super();
	    const instance = this;
	    const stateMap = {};
	    payload = payload || {};
	    if (payloadMap[payload.PAYLOAD_ID]) payload = payloadMap[payload.PAYLOAD_ID];
	    else {
	      payload.PAYLOAD_ID ||= String.random();
	      payloadMap[payload.PAYLOAD_ID] = payload;
	    }
	    this.parent = () => parent;
	
	    this.stateConfig = () => stateConfig;
	    this.name = stateConfig.name;
	    this.states = stateConfig.states;
	    this.stateMap = () => stateMap;
	    this.isLeaf = stateConfig.isLeaf;
	    this.stateNames = stateConfig.stateNames;
	    this.getById = (...idPath) => getById(this, ...idPath);
	    this.getByName = (...namePath) => getByName(this, ...namePath);
	
	    this.setValue = (key, value) => payload[key] = value;
	
	    this.payload = (noConfig) => {
	      if (noConfig) return payload;
	      const copy = stateConfig.payload();
	      Object.keys(payload).forEach((key) => {
	        copy[key] = payload[key];
	      });
	      copy.node = this;
	      return copy;
	    };
	
	    const shouldRecurse = () => Object.keys(stateMap) > 0 || !instance.selfReferencingPath();
	
	    function attachTree(treeOnode) {
	      if (shouldRecurse()) {
	        const node = treeOnode instanceof DecisionNode ? treeOnode : treeOnode.root();
	        return node.subtree(instance);
	      }
	    }
	
	    function createNode(name, payload) {
	      const node = stateMap[name];
	      if (node) return node;
	      const tree = instance.tree();
	      const stateCreated = !tree.stateConfigs()[name];
	      const stateConfig = tree.getState(name, payload);
	      instance.stateConfig().then(stateConfig);
	      if (stateCreated) payload = {};
	      return new (tree.constructor.Node)(stateConfig, payload, instance)
	    }
	
	    this.then = (name, payload) => {
	      if (name instanceof DecisionNode) return attachTree(name);
	      if (Array.isArray(name)) {
	        const returnNodes = [];
	        for (let index = 0; index < name.length; index += 1) {
	          returnNodes.push(this.then(formatName(name[index])));
	        }
	        return returnNodes;
	      }
	      name = formatName(name);
	      const newState = createNode(name, payload);
	      stateMap[name] = newState;
	
	      return newState;
	    }
	
	    this.remove = () => this.back().stateConfig().remove(this.stateConfig());
	
	    this.back = () => parent;
	    this.tree = () => {
	      let curr = this;
	      while (!(curr instanceof DecisionTree)) curr = curr.back();
	      return curr;
	    };
	    this.root = () => this.tree().root();
	    this.isRoot = () => parent instanceof DecisionTree;
	
	    // Breath First Search
	    this.forEach = (func, conditions) => {
	      if (this.reachable(conditions)) {
	        const stateKeys = this.stateNames();
	        func(this);
	        if (shouldRecurse()) {
	          for(let index = 0; index < stateKeys.length; index += 1) {
	              const state = this.next(stateKeys[index]);
	              state.forEach(func, conditions);
	          }
	        }
	      }
	    }
	
	    this.next = (name) => {
	      name = formatName(name);
	      if (!stateConfig.validState(name)) throw new Error(`Invalid State: ${name}`);
	      if (stateMap[name] === undefined) {
	        stateMap[name] = createNode(name, null);
	      }
	      return stateMap[name];
	    }
	
	    this.forEachChild = (func, conditions) => {
	      const stateKeys = this.stateNames();
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const state = this.next([stateKeys[index]]);
	        func(state);
	      }
	    }
	    this.children = () => {
	      const children = [];
	      this.forEachChild((child) => children.push(child));
	      return children;
	    }
	    this.list = (filter, map, conditions) => {
	      const list = [];
	      const should = {filter: (typeof filter) === 'function', map: (typeof map) === 'function'};
	      this.forEach((node) => {
	        if (should.filter ? filter(node) : true) {
	          list.push((should.map ? map(node) : node));
	        }
	      }, conditions);
	      return list;
	    };
	    this.nodes = (conditions) => this.list(null, (node) => node, conditions);
	    this.leaves = (conditions) => this.list((node) => node.isLeaf(), null, conditions);
	    this.addChildren = (nodeOnameOstate) => {
	      const nns = nodeOnameOstate;
	      const stateConfig = nns instanceof DecisionNode ? nns.stateConfig() :
	                nns instanceof StateConfig ? nns : this.tree().stateConfigs()[nns];
	      if (!(stateConfig instanceof StateConfig)) throw new Error(`Invalid nodeOnameOstate '${nns}'`);
	      const tree = this.tree();
	      const states = stateConfig.states();
	      states.forEach((state) => {
	        tree.addState(stateConfig);
	        this.then(state.name());
	      });
	      return this;
	    }
	    this.reachable = (conditions) => {
	      if (this.isRoot()) return true;
	      const parent = this.back();
	      conditions = conditions || {};
	      const cond = conditions[parent.name()] === undefined ?
	                    conditions._DEFAULT : conditions[parent.name()];
	      return DecisionTree.conditionSatisfied(cond, this)
	    }
	    this.child = (nodeId) => {
	      const children = this.children();
	      for (let index = 0; index < children.length; index++) {
	        if (children[index].id() === nodeId) return children[index];
	      }
	    }
	    function reached(node, nodeMap, conditions) {
	      let reachable;
	      do {
	        reachable = node.reachable(conditions);
	        if (reachable) {
	          if (nodeMap[node.id()]) return true;
	          nodeMap[node.id()] = node;
	          node = node.back();
	        }
	      } while (reachable && node);
	    }
	    this.reachableFrom = (conditions, node) => {
	      node ||= this.root();
	      const nodeMap = {};
	      nodeMap[node.id()] = node;
	      return reached(this, nodeMap, conditions) || reached(node.back(), nodeMap, conditions);
	    }
	    this.subtree = (node) => {
	      if (node === undefined) {
	        const tree = new (this.tree().constructor)(this.name(), payload, this.tree().stateConfigs());
	        tree.root().addSubtree(this, true);
	        return tree.root();
	      }
	      node.addSubtree(this);
	      return node;
	    }
	    this.path = () => {
	      let path = [];
	      let curr = this;
	      while (!(curr instanceof DecisionTree)) {
	        path.push(curr.name());
	        curr = curr.back();
	      }
	      return path.reverse();
	    }
	    this.addSubtree = (node, recursive) => {
	      if (!recursive) {
	        node.tree().addStates(this.tree().stateConfigs());
	      }
	      const stateKeys = this.stateNames();
	
	      if (shouldRecurse()) {
	        shouldRecurse();
	        for(let index = 0; index < stateKeys.length; index += 1) {
	          const childNode = this.next(stateKeys[index]);
	          const alreadyPresent = childNode.stateNames().indexOf(childNode.name());
	          if (! alreadyPresent && !childNode.selfReferencingPath()) {
	            node.then(childNode).addSubtree(childNode, true);
	          }
	        }
	      }
	      return node;
	    }
	    this.nodeOnlyToJson = () => {
	      if (payload.toJson) payload = payload.toJson();
	      const json = {name: this.name(), payload};
	
	      json.children = {};
	      if (shouldRecurse()) {
	        this.children().forEach((child) => {
	          json.children[child.name()] = child.nodeOnlyToJson();
	        });
	      }
	      return json;
	    }
	    this.toJson = () => {
	      const treeJson = this.tree().toJson(this);
	      return treeJson;
	    }
	    this.equals = function (other) {
	      if (!other || !(other instanceof DecisionNode)) return false;
	      const config = this.stateConfig();
	      const otherConfig = other.stateConfig();
	      if (config !== otherConfig) return false;
	      if (shouldRecurse()) {
	        const states = config.stateNames();
	        for (let index = 0; index < states.length; index++) {
	          const state = states[index];
	          if (!this.next(state).equals(other.next(state))) return false;
	        }
	      }
	      return true;
	    }
	    this.parentCount = (name) => {
	      let count = 0;
	      let curr = this.back();
	      while(!(curr instanceof DecisionTree)) {
	        if (curr.name() === name) count++;
	        curr = curr.back();
	      }
	      return count;
	    }
	    this.selfReferencingPath = () => {
	      let names = {};
	      let curr = this.back();
	      while(!(curr instanceof DecisionTree)) {
	        if (names[curr.name()]) return true;
	        names[curr.name()] = true;
	        curr = curr.back();
	      }
	      return false;
	    }
	    this.toString = (tabs, attr) => {
	      tabs = tabs || 0;
	      const tab = new Array(tabs).fill('  ').join('');
	      let str = `${tab}${this.name()}`;
	      let attrStr = this.payload()[attr];
	      str += attrStr ? `) ${this.payload()[attr]}\n` : '\n';
	      const stateKeys = this.stateNames();
	      for(let index = 0; index < stateKeys.length; index += 1) {
	        const stateName = stateKeys[index];
	        const nextState = this.next(stateName);
	        if (nextState.parentCount(stateName) < 2) {
	          str += nextState.toString(tabs + 1, attr);
	        }
	      }
	      return str;
	    }
	  }
	}
	
	
	class DecisionTree {
	  constructor(name, payload, stateConfigs) {
	    name = formatName(name);
	    Object.getSet(this, {stateConfigs});
	    const names = {};
	    name = name || String.random();
	    stateConfigs ||= {};
	    this.stateConfigs = () => stateConfigs;
	    const tree = this;
	
	    const parentToJson = this.toJson;
	    this.toJson = (node) => {
	      node ||= this.root();
	      const json = parentToJson();
	      json.name = node.name();
	      json.root = node.nodeOnlyToJson();
	      return json;
	    }
	
	    this.nameTaken = (name) => stateConfigs[formatName(name)] !== undefined;
	
	    function change(from, to) {
	      const state = stateConfig[from];
	      if (!state) throw new Error(`Invalid state name '${to}'`);
	      state.name(to);
	    }
	
	    function getState(name, payload) {
	      const stateConfig = stateConfigs[name];
	      if (stateConfig) return stateConfig;
	      return (stateConfigs[name] = new StateConfig(name, payload));
	    }
	
	    function addState(name, payload) {
	      if (name instanceof StateConfig) {
	        if (stateConfigs[name.name()] === undefined)
	          return (stateConfigs[name.name()] = name);
	        if (stateConfigs[name.name()] === name) return name;
	        throw new Error(`Attempting to add a new state with name '${name.name()}' which is already defined`);
	      }
	      return getState(name, payload);
	    }
	
	    function addStates(states) {
	      Object.keys(states).forEach((name) => getState(name, states[name]));
	    }
	
	    this.getById = (...idPath) => getById(this.root(), ...idPath);
	    this.getByName = (...namePath) => getByName(this.root(), ...namePath);
	    this.change = change;
	    this.getState = getState;
	    this.addState = addState;
	    this.addStates = addStates;
	    this.stateConfigs = () => stateConfigs;
	    tree.declairedName = (name) => !!stateConfigs[formatName(name)];
	
	
	    let instPld = payload;
	    if (!this.nameTaken(name)) {
	      instPld = {};
	    }
	
	    const rootNode = new (this.constructor.Node)(getState(name, payload), instPld, this);
	    this.root = () => rootNode
	
	    this.toString = (...args) => this.root().toString(...args);
	    return this;
	  }
	}
	
	DecisionTree.conditionSatisfied = (condition, state, value) => {
	  value = value ? new String(value).toString() : state.name();
	  const noRestrictions = condition === undefined;
	  const regex = condition instanceof RegExp ? condition : null;
	  const target = (typeof condition) === 'string' ? condition : null;
	  const func = (typeof condition) === 'function' ? condition : null;
	  return noRestrictions || (regex && value.match(regex)) ||
	          (target !== null && value === target) ||
	          (func && func(state, value));
	}
	
	function addChildren(node, json) {
	  const childNames = Object.keys(json);
	  for (let index = 0; index < childNames.length; index++) {
	    const name = childNames[index];
	    const payload = Object.fromJson(json[name].payload);
	    const child = node.then(name, payload);
	    addChildren(child, json[name].children);
	  }
	}
	
	DecisionTree.fromJson = (json) => {
	  const constructor = Object.class.get(json._TYPE);
	  const stateConfigs = Object.fromJson(json.stateConfigs);
	  const tree = new constructor(json.root.name, json.root.payload, stateConfigs);
	  addChildren(tree.root(), json.root.children);
	  return tree;
	}
	
	DecisionTree.DecisionNode = DecisionNode;
	DecisionTree.Node = DecisionNode;
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
	    this.isInitialized = () => true;
	    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
	    this.html = () => {
	      return html(this);
	    }
	
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


RequireJS.addFunction('../../public/js/utils/input/styles/multiple-entries.js',
function (require, exports, module) {
	

	
	
	
	const Input = require('../input');
	const $t = require('../../$t');
	const du = require('../../dom-utils');
	
	class MultipleEntries extends Input {
	  constructor(inputArray, props) {
	    props ||= {};
	    super(props);
	    let inputArrayFunc;
	    if ((typeof inputArray) === 'function') {
	      inputArrayFunc = inputArray;
	      inputArray = [];
	    }
	    props.list ||= [];
	    this.set = (index) => {
	      if (props.list[index] === undefined) {
	        const list = [];
	        props.list[index] = list;
	        inputArray.forEach((i) =>
	          list.push(i.clone()));
	      }
	      return props.list[index];
	    }
	    this.set(0);
	    // Allows for recursion.
	    let hasInit = false;
	    this.isInitialized = () => hasInit;
	    this.initialize = () => {
	      if (hasInit) return;
	      if (inputArrayFunc) {
	        props.list.copy([]);
	        inputArray.copy(inputArrayFunc());
	        this.set(0);
	      }
	      hasInit = true;
	    }
	    this.value = (val) => {
	      const values = [];
	      const list = this.list();
	      for (let i = 0; i < list.length; i++) {
	        const inputArr = list[i]
	        values[i] = {};
	        for(let index = 0; index < inputArr.length; index++) {
	          const input = inputArr[index];
	          values[i][input.name()] = input.value();
	        }
	      }
	      return values;
	    };
	    this.length = () => this.list().length;
	    this.setHtml = (index) =>
	        MultipleEntries.singleTemplate.render(this.set(index));
	  }
	}
	
	MultipleEntries.template = new $t('input/multiple-entries');
	MultipleEntries.singleTemplate = new $t('input/one-entry');
	MultipleEntries.html = (instance) => () => MultipleEntries.template.render(instance);
	
	function meInfo(elem) {
	  const info = {};
	  info.oneCnt = du.find.up('.one-entry-cnt', elem);
	  if (info.oneCnt) {
	    info.indexCnt = du.find.up('[index]', info.oneCnt);
	    info.index = Number.parseInt(info.indexCnt.getAttribute('index'));
	    const ae =  document.activeElement;
	    info.inFocus = !(!(ae && ae.id && du.find.down('#' + ae.id, info.indexCnt)));
	  }
	  info.multiCnt = du.find.up('.multiple-entry-cnt', info.indexCnt || elem);
	  info.multiInput = MultipleEntries.getFromElem(info.multiCnt);
	  info.length = info.multiInput.length();
	  info.inputs = du.find.downAll('input,select,textarea', info.indexCnt);
	  info.last = info.index === info.length - 1;
	  info.empty = true;
	  info.multiInput.set(info.index).forEach(i => info.empty &&= (i.value() == false));
	  return info;
	}
	
	const meSelector = '.multiple-entry-cnt input,select,textarea';
	const oneSelector = '.one-entry-cnt *';
	const isInput = (elem) => elem.tagName.match(/(SELECT|INPUT|TEXTAREA)/) !== null;
	du.on.match('change', meSelector, (elem) => {
	  // console.log('changed');
	});
	
	du.on.match('click', meSelector, (elem) => {
	  // console.log('clicked');
	});
	
	const lastCallers = [];
	du.on.match('focusout', '.one-entry-cnt', (elem) => {
	  let info = meInfo(elem);
	  if (!lastCallers[info.index]) lastCallers[info.index] = 0;
	  const id = ++lastCallers[info.index];
	  setTimeout(() => {
	    if (id !== lastCallers[info.index]) return;
	    info = meInfo(elem);
	    if (!info.last && !info.inFocus && info.empty) {
	      info.indexCnt.remove()
	      const children = info.multiCnt.children;
	      for (let index = 0; index < children.length; index++) {
	        children[index].setAttribute('index', index);
	      }
	      const list = info.multiInput.list();
	      list.remove(list[info.index]);
	    }
	  }, 2000);
	});
	
	du.on.match('focusin', oneSelector, (elem) => {
	  // console.log('focusin');
	});
	
	du.on.match('keyup', oneSelector, (elem) => {
	  if (!isInput(elem)) return;
	  const info = meInfo(elem);
	  if (info.index === info.length - 1 && !info.empty) {
	    const newElem = du.create.element('div', {index: info.index + 1});
	    newElem.innerHTML = info.multiInput.setHtml(info.index + 1);
	    info.multiCnt.append(newElem);
	    console.log('add 1')
	  }
	  // console.log('keyup');
	});
	
	module.exports = MultipleEntries;
	
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


RequireJS.addFunction('../../public/js/utils/input/decision/decision.js',
function (require, exports, module) {
	
// TODO IMPORTANT: refactor this garbage!!!!!!
	// ... its extreamly unIntuitive.
	
	
	
	const DecisionTree = require('../../decision-tree.js');
	const LogicMap = require('../../logic-tree.js');
	const LogicWrapper = LogicMap.LogicWrapper
	const Input = require('../input.js');
	const Select = require('../styles/select.js');
	const MultipleEntries = require('../styles/multiple-entries.js');
	const du = require('../../dom-utils');
	const $t = require('../../$t');
	const Measurement = require('../../measurement');
	
	const ROOT_CLASS = 'decision-input-tree';
	
	function isComplete(wrapper) {
	  return wrapper.isComplete() && DecisionInputTree.validate(wrapper)
	}
	
	class ValueCondition {
	  constructor(name, accepted, payload) {
	    Object.getSet(this, {name, accepted}, 'type');
	    this.payload = payload;
	    this.type = () => {
	      if (Array.isArray(accepted)) return 'Array';
	      if (accepted instanceof RegExp) return 'RegExp';
	      return 'Exact';
	    }
	    this.targetInput = (wrapper) => {
	      wrapper.root().node.forEach((node) => {
	        node.payload().inputArray.forEach((input) => {
	          if (input.name() === name) return input;
	        });
	      });
	    }
	    this.condition = (wrapper) => {
	      console.log(this.condition.json);
	        let input = this.targetInput(wrapper);
	        if (input === undefined) return;
	        switch (this.type()) {
	          case 'Array':
	            for (let index = 0; index < accepted.length; index +=1) {
	              if (input.value === accepted[index]) return true;
	            }
	            return false;
	          case 'RegExp':
	            return input.value.match(accepted);
	            break;
	          default:
	            return input.value === accepted;
	        }
	    }
	    this.condition.target = name;
	    this.condition.json = this.toJson();
	  }
	}
	
	class DecisionInput {
	  constructor(name, inputArrayOinstance, tree, isRoot) {
	    Object.getSet(this, 'name', 'id', 'inputArray', 'class');
	    this.clone = () => this;
	    const instance = this;
	
	    const toJson = this.toJson;
	    this.toJson = () => {
	      const json = toJson();
	      if (this.condition) {
	        json.condition = this.condition.json ? this.condition.json : this.condition;
	      }
	      return json;
	    }
	    this.tree = () => tree;
	    if (inputArrayOinstance instanceof ValueCondition) {
	      this.condition = inputArrayOinstance.condition;
	      this.isConditional = true;
	      inputArrayOinstance = inputArrayOinstance.payload;
	    }
	    if (inputArrayOinstance !== undefined){
	      this.name(name);
	      this.id = `decision-input-node-${String.random()}`;
	      this.childCntId = `decision-child-ctn-${String.random()}`
	      this.values = tree.values;
	      this.value = this.values
	      this.onComplete = tree.onComplete;
	      this.onChange = tree.onChange;
	      this.inputTree = inputInputTree;
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
	
	    // this.update = tree.update;
	    this.addValues = (values) => {
	      this.inputArray.forEach((input) => values[input.name()] = input.value())
	    }
	
	    this.node = () =>
	      LogicWrapper.get(this._nodeId);
	    this.children = () => this.node().children().map((n) => n.payload());
	    this.reachable = () => this.node().reachable();
	    this.childrenHtml = (inputName, editDisplay) => {
	      const children = this.children();
	      let html = '';
	      for (let index = 0; index < children.length; index++) {
	        const child = children[index];
	        if (child.reachable()) {
	          if (!child.inputArray.initialized) {
	            child.inputArray.forEach(i => i.initialize && i.initialize());
	            child.inputArray.initialized = true;
	          }
	          if (child.condition.target === inputName) html += child.html()
	        }
	      }
	      return html;
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
	
	du.on.match('click', '.conditional-button', (elem) => {
	  console.log(elem);
	});
	
	
	// properties
	// optional :
	// noSubmission: /[0-9]{1,}/ delay that determins how often a submission will be processed
	// buttonText: determins the text displayed on submit button;
	
	class DecisionInputTree extends LogicMap {
	  constructor(rootName, payload, onComplete, props) {
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
	      let inputHtml = wrapper.payload().html(true, editDisplay);
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
	  // if (elem.matches('.modification-add-input *')) return;
	
	  const treeCnt = du.find.up('[tree-id]', elem);
	  const inputs = du.find.downAll('select,input,textarea', treeCnt);
	  for (let index = 0; index < inputs.length; index++) {
	    const input = inputs[index];
	
	    const cnt = du.find.closest('[node-id]', input);
	    const nodeId = cnt.getAttribute('node-id');
	    const wrapper = LogicWrapper.get(nodeId);
	
	    const inputCnt = du.find.up('.decision-input-array-cnt', input);
	    const childrenHtmlCnt = du.find.down('.children-recurse-cnt', inputCnt);
	    const value = childrenHtmlCnt.getAttribute('value');
	    const parentValue =  wrapper.payload().values()[input.name];
	    const parentName = input.name;
	    const cs = wrapper.reachableChildren();
	    if (!parentValue || value !== parentValue) {
	      cs.forEach((child) => {
	        const di = wrapper.payload();
	        const inputArray = di.inputArray;
	        if (!inputArray.initialized) {
	          inputArray.forEach(input => input.isInitialized() || input.initialize());
	          inputArray.initialized = true;
	        }
	      });
	      childrenHtmlCnt.setAttribute('value', parentValue)
	      const childHtml = wrapper.payload().childrenHtml(input.name)
	      childrenHtmlCnt.innerHTML = childHtml;
	    }
	
	    if(!soft) {
	      wrapper.root().changed();
	      wrapper.root().completed()
	    }
	  }
	
	    // const cnt = du.find.closest('[node-id]', elem);
	    // const parent = cnt.parentElement;
	    // const nodeId = cnt.getAttribute('node-id');
	    // const wrapper = LogicWrapper.get(nodeId);
	    // if (wrapper.children().length > 0) {
	    //   const childHtmlCnt = du.find.closest('.children-recurse-cnt', elem);
	    //   const childrenHtml = wrapper.payload().childrenHtml();
	    //   childHtmlCnt.innerHTML = childrenHtml;
	    // }
	    // console.log(isComplete(wrapper));
	    // if(!soft) {
	    //   // du.find.downAll('.decision-input-cnt', parent).forEach((e) => e.hidden = true)
	    //   // wrapper.forEach((n) => {
	    //   //   let selector = `[node-id='${n.nodeId()}']`;
	    //   //   elem = du.find.down(selector, parent);
	    //   //   if (elem) elem.hidden = false;
	    //   // });
	    //   wrapper.root().changed();
	    //   wrapper.root().completed()
	    // }
	    // wrapper.payload().tree().disableButton(undefined, elem);
	  };
	
	DecisionInputTree.submit = (elem) => {
	  const wrapper = LogicWrapper.get(elem.getAttribute('root-id'));
	  wrapper.submit();
	}
	
	function updateModBtn(elem) {
	  const value = elem.value;
	  const button = du.find.closest('.conditional-button', elem);
	  if (button.getAttribute('target-id') === elem.id) {
	    button.innerText = `If ${elem.name} = ${value}`;
	  }
	}
	
	let count = 999;
	const getInput = () => new Input({
	  label: `Label${++count}`,
	  name: `Name${count}`,
	  inline: true,
	  class: 'center',
	});
	
	function conditionalInputTree() {
	  const group = new Input({
	    name: 'group',
	    inline: true,
	    label: 'Group',
	    class: 'center',
	  });
	
	  const type = new Select({
	    label: 'Type',
	    name: 'type',
	    inline: true,
	    class: 'center',
	    list: ['Any', 'Exact', 'Except', 'Reference', 'List(commaSep)', 'Exclude List(commaSep)', 'Regex']
	  });
	
	  const condition = new Input({
	    label: 'Condition',
	    name: 'condition',
	    inline: true,
	    class: 'center',
	  });
	
	  const reference = new Input({
	    label: 'Reference',
	    name: 'reference',
	    inline: true,
	    class: 'center',
	  });
	
	  const inputs = [group, type];
	  const condCond = new ValueCondition('type', /^(?!(Reference)$).*$/, [condition]);
	  const refCond = new ValueCondition('type', 'Reference', [reference]);
	
	  const tree = new DecisionInputTree();
	  tree.leaf('Question Group', inputs);
	  payload = tree.payload();
	  tree.conditional('condition', condCond);
	  tree.conditional('reference', refCond);
	
	  return tree;
	}
	
	function inputInputTree() {
	  const name = new Input({
	    name: 'name',
	    inline: true,
	    label: 'Name',
	    class: 'center',
	  });
	  const format = new Select({
	    label: 'Format',
	    name: 'format',
	    inline: true,
	    class: 'center',
	    list: ['Text', 'Checkbox', 'Radio', 'Date', 'Time', 'Table', 'Multiple Entries', 'Measurement']
	  });
	  const tableType = new Select({
	    label: 'Type',
	    name: 'type',
	    inline: true,
	    class: 'center',
	    list: ['Text', 'checkbox', 'radio', 'date', 'time']
	  });
	  const textCntSize = new Select({
	    label: 'Size',
	    name: 'size',
	    inline: true,
	    class: 'center',
	    list: ['Small', 'Large']
	  });
	  const units = new Select({
	    label: 'Units',
	    name: 'units',
	    inline: true,
	    class: 'center',
	    list: Measurement.units()
	  });
	  const label = new Input({
	    name: 'label',
	    inline: true,
	    label: 'Label',
	    class: 'center',
	  });
	  const row = new Input({
	    name: 'row',
	    inline: true,
	    label: 'Row',
	    class: 'center',
	  });
	  const col = new Input({
	    name: 'col',
	    inline: true,
	    label: 'Column',
	    class: 'center',
	  });
	  const labels = new MultipleEntries([label]);
	  const rowCols = [new MultipleEntries([col], {inline: true}), new MultipleEntries([row])];
	  const multiInputs = new MultipleEntries(() => [inputInputTree()], {name: 'multiInp'});
	
	
	['Text', 'Radio', 'Table', 'Multiple Entries', 'Measurement']
	  const inputs = [name, format];
	  const textCond = new ValueCondition('format', 'Text', [textCntSize]);
	  const radioCond = new ValueCondition('format', 'Radio', [labels]);
	  const tableCond = new ValueCondition('format', 'Table', rowCols);
	  const multiCond = new ValueCondition('format', 'Multiple Entries', [multiInputs]);
	  const measureCond = new ValueCondition('format', 'Measurement', [units]);
	
	  const tree = new DecisionInputTree();
	  tree.leaf('InputTree', inputs);
	  payload = tree.payload();
	  tree.conditional('text', textCond);
	  tree.conditional('radio', radioCond);
	  tree.conditional('table', tableCond);
	  tree.conditional('multi', multiCond);
	  const measure = tree.conditional('measure', measureCond);
	
	  // REMOVE
	  const measureMulti = new ValueCondition('unit', 'Imperial (US)', [multiInputs]);
	  const measureInput = new ValueCondition('unit', 'Metric', [labels]);
	  measure.conditional('measureMulti', measureMulti);
	  measure.conditional('measureInput', measureInput);
	
	  const t = tree.node.tree();
	  const tJson = t.toJson();
	  console.log(DecisionInputTree.fromJson(tJson));
	
	  return tree.payload();
	}
	
	function modifyBtnPressed(elem) {
	  const node = DecisionInputTree.getNode(elem);
	  const inputArray = node.payload().inputArray;
	  const inputElem = du.find.closest('input,select,textarea', elem);
	  const input = Input.getFromElem(inputElem);
	  const treeHtml = conditionalInputTree().payload().html();
	  const inputTreeCnt = du.find.closest('.condition-input-tree', elem);
	  inputTreeCnt.innerHTML = '<br>' + treeHtml;
	  elem.hidden = true;
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
	
	DecisionInputTree.fromJson = (json) => {
	  let tree = new DecisionInputTree();
	
	  const rootConfig = json.stateConfigs[json.nodeId];
	  const rootPayload = Object.fromJson(rootConfig.payload);
	  const root = tree.leaf(rootConfig.name, rootPayload);
	  tree = root.tree();
	  let nodeMap = {};
	  nodeMap[json.nodeId] = root;
	  const paths = [rootConfig.name];
	  let currIndex = 0;
	  while (currIndex < paths.length) {
	    const pathArr = paths[currIndex].split('.');
	    const parent = tree.getByIdPath.apply(tree, pathArr.slice(0, -1));
	    const node = tree.getByIdPath.apply(tree, pathArr);
	    if (node === undefined) {
	      const nodeId = pathArr[pathArr.length - 1];
	      console.log('createNew')
	      const config = json.stateConfigs[nodeId];
	      const subPaths = Object.keys(Object.pathValue(json.tree, path));
	      subPaths.forEach((subPath) => paths.push(`${path}.${subPath}`));
	    }
	    console.log(path);
	    currIndex++;
	  }
	}
	
	DecisionInputTree.template = new $t('input/decision/decisionTree');
	
	module.exports = DecisionInputTree;
	
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
	
	function round(value, accuracy) {
	  if (accuracy === undefined) return value;
	  return Math.round(value * accuracy) / accuracy;
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
	      if (b === true) {
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
	    this.assertFalse = (b, msg) => !assert(b === false) &&
	                            possiblyFail(`${msg}\n\t\t'${b}' should be false`);
	    this.assertEquals = (a, b, msg, acc) => !assert(round(a, acc) === round(b, acc)) &&
	                            possiblyFail(`${msg}\n\t\t'${a}' === '${b}' should be true`);
	    this.assertNotEquals = (a, b, msg, acc) => !assert(round(a, acc) !== round(b, acc)) &&
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


RequireJS.addFunction('../../public/js/utils/test/tests/compress-string.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	const CompressedString = require('../../object/compressed-string.js');
	
	Test.add('Imposter: fooled me',(ts) => {
	  let str = 'one, two,threefour,one,twothree,four';
	  let cStr = new CompressedString(str);
	  ts.assertEquals(cStr, '^a ^b,^c^d,^a^b^c,^d');
	
	  ts.success();
	});
	
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
	const Lookup = require('../../object/lookup');
	// const DecisionTree = require('../../logic-tree');
	
	function createTree() {
	  const states = {};
	
	  states[5] = {descriptor: 'style'}
	  states[6] = {descriptor: 'solid'}
	  states[7] = {descriptor: 'isInset=false'}
	  states[8] = {descriptor: 'material'}
	  states[9] = {descriptor: 'mdf'}
	  states[10] = {descriptor: 'cost'}
	  states[11] = {descriptor: 'profile'}
	  states[12] = {descriptor: 'soft maple'}
	  states[15] = {descriptor: 'walnut'}
	  states[18] = {descriptor: 'alder'}
	  states[21] = {descriptor: 'panel'}
	  states[22] = {descriptor: 'isInset=true'}
	  states[24] = {descriptor: 'shaker'}
	  states[25] = {descriptor: 'mdfCore'}
	  states[26] = {descriptor: 'soft maple'}
	  states[27] = {descriptor: 'nonMdfCore'}
	  states[28] = {descriptor: 'soft maple'}
	  states[29] = {descriptor: 'walnut'}
	  states[30] = {descriptor: 'alder'}
	
	  states[32] = {descriptor: 'isInset (type===Inset)'}
	  states[33] = {descriptor: 'magnet'}
	
	
	  const dTree = new DecisionTree('root');
	  const dNode = dTree.root();
	  const statess = dTree.addStates(states);
	  const style = dNode.then(5);
	  const solid = style.then(6);
	  const material = solid.then([7,8])[1];
	  const materials = material.then([9,12,15,18]);
	  materials[0].then([10,11]);
	  materials[1].addChildren(9);
	  materials[2].addChildren(materials[1]);
	  materials[3].addChildren(materials[0].stateConfig());
	  dTree.toString();
	
	  const panel = style.then(21);
	  panel.then(22);
	  const profile = panel.then(11);
	  const shaker = profile.then(24);
	  shaker.then(25).then(26);
	  const nonMdfCore = shaker.then(27);
	  const alder = nonMdfCore.then([28,29,30])[2];
	
	  dNode.then(32).then(33);
	
	  return dTree;
	}
	
	Test.add('DecisionTree: subtree',(ts) => {
	  const tree = createTree();
	  const style = tree.root().next(5);
	  const shaker = tree.getByName('5','21','11',24);
	  const subtree = style.subtree();
	  const shakerSubtree = shaker.subtree();
	
	  ts.assertEquals(style.payload(true), subtree.root().payload(true));
	  ts.assertEquals(style, style.payload().node);
	  ts.assertNotEquals(subtree.root().payload().node, style.payload().node);
	  ts.assertEquals(subtree.root(), subtree.root().payload().node);
	  ts.assertTrue(style.equals(subtree.root()));
	  ts.assertFalse(shaker.equals(subtree.root()));
	  ts.assertFalse(shakerSubtree.equals(subtree.root()));
	  ts.assertTrue(shaker.equals(shakerSubtree.root()));
	  ts.success();
	});
	
	
	Test.add('DecisionTree: reachable',(ts) => {
	  const tree = createTree();
	  const style = tree.root().next(5);
	  const subtree = style.subtree();
	  const func = (node) => node.payload().descriptor !== 'cost';
	  const conditions = {'21': '11', '27': /29|30/, '9': func};
	
	  const kept = ['5','6','7','8','9', '10', '11','12','15',
	                '18','21','24','25','26','27','29','30'];
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
	    const errorMsg = errors[node.name()] || errors.default;
	    ts.assertNotEquals(kept.indexOf(node.name()), -1, errorMsg);
	    nodeCount++;
	  }, conditions);
	  ts.assertEquals(nodeCount, 47, 'Subtree does not include all the nodes it should');
	  ts.success();
	});
	
	Test.add('DecisionTree: leaves', (ts) => {
	  const tree = createTree();
	  const style = tree.root().next(5);
	  const subtree = style.subtree();
	  const func = (node) => node.payload().descriptor !== 'cost';
	  const conditions = {'21': '11', '27': /29|30/, '9': func};
	
	  const leaves = subtree.leaves(conditions);
	  ts.assertEquals(leaves.length, 19, 'Not plucking all the leaves');
	  ts.assertEquals(tree.root().leaves().length, 27, 'Not plucking all the leaves');
	  ts.success();
	});
	
	function createSelfRefernceTree() {
	  const tree = new DecisionTree('root');
	  const recursive = tree.root().then('recursive', {id: 'recDefault'});
	  recursive.setValue('id', 'original');
	  recursive.then('recursive', {id: 'recusion1'});
	  const other = tree.root().then('other', {id: 'otherDefault'});
	  other.setValue('id', 'original');
	  other.then('recursive', {id: 'other'}).then('other', {id: 'recursive'});
	  return tree;
	}
	
	Test.add('DecisionTree: selfRefernce', (ts) => {
	  const tree = createSelfRefernceTree();
	  const recOrig = tree.getByName('recursive');
	  ts.assertEquals(recOrig.payload().id, 'original');
	  const rec1 = tree.getByName('recursive', 'recursive');
	  ts.assertEquals(rec1.payload().id, 'recusion1');
	  const otherOrig = tree.getByName('other');
	  ts.assertEquals(otherOrig.payload().id, 'original');
	  const otherRec = tree.getByName('other', 'recursive', 'other');
	  ts.assertEquals(otherRec.payload().id, 'recursive');
	
	  const recDeep = tree.getByName('other', 'recursive', 'recursive', 'other','recursive');
	  ts.assertEquals(recDeep.payload().id, 'recDefault');
	  const otherDeep = tree.getByName('recursive', 'other', 'recursive', 'recursive', 'other','recursive', 'other');
	  ts.assertEquals(otherDeep.payload().id, 'otherDefault');
	
	  ts.assertTrue(recOrig.subtree().root().equals(recOrig));
	
	  ts.success();
	});
	
	Test.add('DecisionTree: remove', (ts) => {
	  const tree = createSelfRefernceTree();
	  const other = tree.getByName('recursive', 'other');
	  other.remove();
	
	  let otherList = tree.root().list((n) => n.name() === 'other');
	  ts.assertEquals(otherList.length, 1);
	  otherList[0].remove();
	  otherList = tree.root().list((n) => n.name() === 'other');
	  ts.assertEquals(otherList.length, 0);
	
	  ts.success();
	});
	
	Test.add('DecisionTree: change', (ts) => {
	  const tree = createSelfRefernceTree();
	  const other = tree.getByName('recursive', 'other');
	  other.stateConfig().name('other2');
	  ts.success();
	});
	
	Test.add('DecisionTree: toJson', (ts) => {
	  const tree = createSelfRefernceTree();
	  const treeJson = tree.toJson();
	  const rootJson = tree.root().toJson();
	  ts.assertTrue(Object.equals(treeJson, rootJson));
	
	  const recNode = tree.getByName('recursive');
	  ts.assertFalse(recNode.equals(tree.root()));
	  const recJson = recNode.toJson();
	  ts.assertFalse(Object.equals(recNode, rootJson));
	  const recFromRootJson = {name: 'recursive', root: rootJson.root.children.recursive,
	              _TYPE: rootJson._TYPE, stateConfigs: rootJson.stateConfigs};
	  ts.assertTrue(Object.equals(recJson, recFromRootJson));
	  ts.success();
	});
	
	Test.add('DecisionTree: fromJson', (ts) => {
	  const tree = createSelfRefernceTree();
	  const treeJson = tree.toJson();
	  const treeFromJson = Object.fromJson(treeJson);
	  ts.assertTrue(treeFromJson.root().equals(tree.root()));
	  ts.assertTrue(tree.root().payload(true) === treeFromJson.root().payload(tree));
	  ts.success();
	});
	
	Test.add('DecisionTree: clone', (ts) => {
	  const tree = createSelfRefernceTree();
	  const clone = tree.clone();
	  ts.assertTrue(clone !== tree);
	  ts.assertTrue(clone.root().equals(tree.root()));
	  ts.assertTrue(tree.root().payload(true) === clone.root().payload(tree));
	
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/imposter.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	const Imposter = require('../../object/imposter');
	
	class JustTryAndCopyMe {
	  constructor() {
	    Object.getSet(this, {one: 1, two: 2, override1: 'unchanged1'});
	    this.three = 3;
	    this.four = 4;
	    this.override2 = 'unchanged2'
	    this.array = [1,2,3,4];
	    this.object = {one: 1, two: 2, three: 3};
	
	    this.equals = () => false;
	  }
	}
	
	Test.add('Imposter: fooled me',(ts) => {
	  const orig = new JustTryAndCopyMe();
	  const imposter = new Imposter(orig, {override1: () => 'changed1', override2: 'changed2'});
	  ts.assertTrue(imposter instanceof JustTryAndCopyMe);
	  ts.assertEquals(orig.one(), imposter.one());
	  ts.assertEquals(orig.two(), imposter.two());
	  ts.assertEquals(orig.three, imposter.three);
	  ts.assertEquals(orig.four, imposter.four);
	
	  ts.assertEquals(orig.one(4), imposter.one());
	  ts.assertEquals(orig.two(3), imposter.two());
	  orig.three = 7;
	  ts.assertEquals(orig.three, imposter.three);
	  orig.four = 8;
	  ts.assertEquals(orig.four, imposter.four);
	
	  ts.assertEquals(imposter.one(2), orig.one());
	  ts.assertEquals(imposter.two(1), orig.two());
	  imposter.three = 5;
	  ts.assertEquals(orig.three, imposter.three);
	  imposter.four = 0;
	  ts.assertEquals(orig.four, imposter.four);
	
	  ts.assertEquals(orig.array, imposter.array);
	  ts.assertEquals(orig.object, imposter.object);
	  orig.array[0] = 44;
	  imposter.object.one = 66;
	  ts.assertEquals(orig.array[0], imposter.array[0]);
	  ts.assertEquals(orig.object.one, imposter.object.one);
	
	  ts.assertFalse(orig === imposter);
	  ts.assertFalse(orig.equals(imposter));
	  ts.assertTrue(imposter.equals(orig));
	
	  // Test initial values
	  ts.assertEquals(imposter.override1(), 'changed1');
	  ts.assertEquals(imposter.override2, 'changed2');
	  ts.assertEquals(orig.override1(), 'unchanged1');
	  ts.assertEquals(orig.override2, 'unchanged2');
	
	  // Test function changes
	  ts.assertEquals(imposter.override1('changed3'), 'changed1');
	  ts.assertEquals(imposter.override2, 'changed2');
	  ts.assertEquals(orig.override1('unchanged3'), 'unchanged3');
	  ts.assertEquals(orig.override2, 'unchanged2');
	
	  // Test field assinments
	  imposter.override2 = 'changed4';
	  ts.assertEquals(imposter.override2, 'changed4');
	  ts.assertEquals(imposter.override1(), 'changed1');
	  orig.override2 = 'unchanged5';
	  ts.assertEquals(orig.override2, 'unchanged5');
	  ts.assertEquals(orig.override1(), 'unchanged3');
	
	  ts.success();
	});
	
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
	const LogicMap = require('../../logic-tree');
	//
	// class ReferenceableFuctions {
	//   constructor(id) {
	//     id = id._TYPE === undefined ? id : id.id;
	//     Object.getSet(this, {id});
	//     this.condition = (tree) => {
	//       if (id === 1) {
	//         return tree.reachable('bacon') || tree.reachable('eggs');
	//       } else if (id === 2) {
	//         return tree.reachable('cereal');
	//       }
	//     }
	//     this.LOGIC_TYPE = 'Conditional';
	//     this.clone = () => new ReferenceableFuctions(id);
	//   }
	// }
	//
	// function createTree(connectEggs, optional, shouldCopy, testFuncs) {
	//   const logicMap = new LogicMap('breakfast');
	//   const breakfast = logicMap.root();
	//
	//   function runTestFunc(name) {
	//     if (testFuncs && testFuncs[name]) {
	//       testFuncs[name](breakfast, name);
	//     }
	//   }
	//
	//   const food = breakfast.multiselect('food');
	//   food.optional(optional);
	//   food.leaf('bacon', {cost: 1});
	//   const eggs = food.select('eggs');
	//   const two = eggs.select(2, {multiplier: 2});
	//   eggs.optional(optional);
	//   two.optional(optional);
	//   two.leaf('over easy', {cost: 1.8});
	//   two.leaf('sunny side up', {cost: 2.6});
	//   two.leaf('scramble', {cost: 3.2});
	//   two.leaf('fried', {cost: 1.3});
	//   runTestFunc('onlyOne');
	//   const three = eggs.select(3, {multiplier: 3}).addChildren('2');
	//   runTestFunc('now2');
	//   const six = eggs.select(6, {multiplier: 6}).addChildren('2');
	//   runTestFunc('now3');
	//   const toast = food.select('toast');
	//   three.optional(optional);
	//   six.optional(optional);
	//   toast.optional(optional);
	//   toast.leaf('white', {cost: 1.01});
	//   toast.leaf('wheat', {cost: 1.24});
	//   toast.leaf('texas', {cost: 1.17});
	//   const cereal = food.branch('cereal');
	//   cereal.leaf('milk', {cost: 8.99});
	//   const type = cereal.select('type');
	//   type.optional(optional);
	//   type.leaf('raisin brand', {cost: -0.55});
	//   type.leaf('cheerios', {cost: 1.58});
	//   type.leaf('life', {cost: 1.23});
	//
	//   const dishes = breakfast.branch('dishes');
	//   const needPlate = dishes.conditional('need plate', new ReferenceableFuctions(1));
	//   needPlate.leaf('plate', {cost: .14});
	//   needPlate.leaf('fork', {cost: .07});
	//   const havingCereal = dishes.conditional('having cereal', new ReferenceableFuctions(2));
	//   havingCereal.leaf('bowl', {cost: .18});
	//   havingCereal.leaf('spoon', {cost: .06});
	//   runTestFunc('all');
	//
	//   if (connectEggs) {
	//     // two.valueSync(three);
	//     // two.defaultSync(six);
	//     console.log(breakfast.toJson());
	//     breakfast.toJson();
	//   }
	//   return shouldCopy ? copy(breakfast).root() : breakfast;
	// }
	//
	// function copy(origTree) {
	//     const treeJson = origTree.toJson();
	//     return Object.fromJson(treeJson);
	// }
	//
	// function testIsComplete(ts) {
	//   return (tree, isComplete) => ts.assertTrue(isComplete === tree.isComplete());
	// }
	//
	// function access(index, returnValue, testFuncs, tree) {
	//   const func = testFuncs[index];
	//   if ((typeof func === 'function')) {
	//     func(tree, returnValue);
	//   }
	// }
	//
	// function accessProcess(ts, testFuncs, optional, shouldCopy) {
	//   let tree = createTree(true, optional, shouldCopy);
	//   access('init', tree, testFuncs, tree);
	//   access('dontEat2', tree.setChoice('food', null), testFuncs, tree);
	//   if (optional)
	//     access('dontEat', tree.setChoice('food', {}), testFuncs, tree);
	//
	//   access('bacon', tree.setChoice('food', {bacon: true}), testFuncs, tree);
	//
	//   access('toast', tree.setChoice('food', {toast: true}), testFuncs, tree);
	//   access('chooseToast', tree.setChoice('toast', 'white'), testFuncs, tree);
	//
	//   access('chooseCereal', tree.setChoice('type', 'life'), testFuncs, tree);
	//   access('cereal', tree.setChoice('food', {cereal: true}), testFuncs, tree);
	//
	//   access('eggs', tree.setChoice('food', {eggs: true}), testFuncs, tree);
	//   access('2', tree.setChoice('eggs', '2'), testFuncs, tree);
	//   access('2value', tree.setChoice('2', 'scramble'), testFuncs, tree);
	//   if (optional)
	//     access('2NoValue', tree.setChoice('2', null), testFuncs, tree);
	//   access('2valueAgain', tree.setChoice('2', 'scramble'), testFuncs, tree);
	//   access('2default', tree.setDefault('2', 'fried'), testFuncs, tree);
	//   access('3', tree.setChoice('eggs', '3'), testFuncs, tree);
	//   access('6', tree.setChoice('eggs', '6'), testFuncs, tree);
	//
	//
	//   access('all', tree.setChoice('food', {eggs: true, bacon: true, toast: true, cereal: true}), testFuncs, tree);
	//   return tree;
	// }
	//
	// function LogicTest(tree, ts) {
	//   const properStructure = "breakfast\n  food) Multiselect\n    bacon) Leaf\n    eggs) Select\n      2) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      3) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      6) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n    toast) Select\n      white) Leaf\n      wheat) Leaf\n      texas) Leaf\n    cereal) Branch\n      milk) Leaf\n      type) Select\n        raisin brand) Leaf\n        cheerios) Leaf\n        life) Leaf\n  dishes) Branch\n    need plate) Conditional\n      plate) Leaf\n      fork) Leaf\n    having cereal) Conditional\n      bowl) Leaf\n      spoon) Leaf\n";
	//   ts.assertEquals(tree.structure(), properStructure);
	//   ts.success();
	// }
	//
	// function decisionsTest(ts, copy) {
	//   function validateDecisions (tree, ...names) {
	//     if (tree.decisions().length !== names.length) {
	//       console.log('badd!')
	//     }
	//     const decisions = tree.decisions();
	//     ts.assertEquals(decisions.length, names.length);
	//     const decisionNames = decisions.map((elem) => elem.name);
	//     for (let index = 0; index < names.length; index += 1) {
	//       ts.assertNotEquals(decisionNames.indexOf(names[index]) === -1);
	//     }
	//   }
	//
	//   const testFuncs = {
	//     init: (tree) => validateDecisions(tree, 'food'),
	//     dontEat: (tree) => validateDecisions(tree, 'food'),
	//
	//     bacon: (tree) => validateDecisions(tree, 'food'),
	//
	//     toast: (tree) => validateDecisions(tree, 'food', 'toast'),
	//     chooseToast: (tree) => validateDecisions(tree, 'food', 'toast'),
	//
	//     chooseCereal: (tree) => validateDecisions(tree, 'food', 'toast'),
	//     cereal: (tree) => validateDecisions(tree, 'food', 'having cereal'),
	//
	//     eggs: (tree) => validateDecisions(tree, 'food', 'eggs'),
	//     "2": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	//     "2value": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	//     "2NoValue": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	//     "2valueAgain": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	//     "2default": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
	//     "3": (tree) => validateDecisions(tree, 'food', 'eggs', '3'),
	//     "6": (tree) => validateDecisions(tree, 'food', 'eggs', '6'),
	//
	//     all: (tree) => validateDecisions(tree, 'food', 'eggs', '6', 'having cereal', 'toast')
	//   }
	//   accessProcess(ts, testFuncs, undefined, copy);
	//   ts.success();
	// }
	//
	// function optionalTest(ts, shouldCopy) {
	//   const tic = testIsComplete(ts);
	//   const testFuncs = {
	//     init: (tree) => tic(tree, true),
	//     dontEat: (tree) =>  tic(tree, true),
	//     dontEat2: (tree) =>  tic(tree, true),
	//     bacon: (tree) =>  tic(tree, true),
	//     toast: (tree) =>  tic(tree, true),
	//     chooseToast: (tree) =>  tic(tree, true),
	//     chooseCereal: (tree) =>  tic(tree, true),
	//     cereal: (tree) =>  tic(tree, true),
	//     eggs: (tree) =>  tic(tree, true),
	//     "2": (tree) =>  tic(tree, true),
	//     "2value": (tree) =>  tic(tree, true),
	//     "2NoValue": (tree) =>  tic(tree, true),
	//     "2valueAgain": (tree) =>  tic(tree, true),
	//     "2default": (tree) =>  tic(tree, true),
	//     "3": (tree) =>  tic(tree, true),
	//     "6": (tree) =>  tic(tree, true),
	//     all: (tree) =>  tic(tree, true),
	//   }
	//   accessProcess(ts, testFuncs, true, shouldCopy);
	//   ts.success();
	// }
	//
	// function notOptionalTest(ts, shouldCopy) {
	//   const tic = testIsComplete(ts);
	//   const testFuncs = {
	//     init: (tree) => tic(tree, false),
	//     dontEat: (tree) =>  tic(tree, false),
	//     dontEat2: (tree) =>  tic(tree, false),
	//     bacon: (tree) =>  tic(tree, true),
	//     toast: (tree) =>  tic(tree, false),
	//     chooseToast: (tree) =>  tic(tree, true),
	//     chooseCereal: (tree) =>  tic(tree, true),
	//     cereal: (tree) =>  tic(tree, true),
	//     eggs: (tree) =>  tic(tree, false),
	//     "2": (tree) =>  tic(tree, false),
	//     "2value": (tree) =>  tic(tree, true),
	//     "2NoValue": (tree) =>  tic(tree, false),
	//     "2valueAgain": (tree) =>  tic(tree, true),
	//     "2default": (tree) =>  tic(tree, true),
	//     "3": (tree) =>  tic(tree, true),
	//     "6": (tree) =>  tic(tree, true),
	//     all: (tree) =>  tic(tree, true),
	//   }
	//   accessProcess(ts, testFuncs, false, shouldCopy);
	//   ts.success();
	// }
	//
	// function instanceCountTest(ts, shouldCopy) {
	//   const instanceCountCorrect = (tree, countObj, stage) => {
	//     Object.keys(countObj).forEach((name) =>
	//       ts.assertEquals(countObj[name], tree.node.instanceCount(name),
	//           `@stage=${stage} name=${name} incorrect instance count shouldCopy=${shouldCopy}`)
	//     );
	//   }
	//
	//   function instanceCountObj(count, obj, two, three, six) {
	//     obj['over easy'] = count;
	//     obj['sunny side up'] = count;
	//     obj['scramble'] = count;
	//     obj['fried'] = count;
	//     obj['2'] = two;
	//     obj['3'] = three;
	//     obj['6'] = six;
	//     return obj;
	//   }
	//   const food = 1;
	//   const eggs = 1;
	//   const two = 1;
	//   const three = 1;
	//   const six = 1;
	//   const toast = 1
	//   const white = 1;
	//   const wheat = 1;
	//   const texas = 1;
	//   const milk = 1;
	//   const type = 1;
	//   const cheerios = 1;
	//   const life = 1;
	//   const onlyOneObj = instanceCountObj(1, {food, eggs}, 1, 0, 0);
	//   const now2Obj = instanceCountObj(2, {food, eggs}, 1, 1, 0);
	//   const now3Obj = instanceCountObj(3, {food, eggs}, 1, 1, 1);
	//   const allObj = instanceCountObj(3, {food,eggs,toast,white,wheat,texas,milk,type,cheerios,life}, 1, 1, 1);
	//   const testFuncs = {
	//     onlyOne: (tree, stage) =>  instanceCountCorrect(tree, onlyOneObj, stage),
	//     now2: (tree, stage) =>  instanceCountCorrect(tree, now2Obj, stage),
	//     now3: (tree, stage) =>  instanceCountCorrect(tree, now3Obj, stage),
	//     all: (tree, stage) =>  instanceCountCorrect(tree, allObj, stage),
	//   }
	//   createTree(undefined, undefined, shouldCopy, testFuncs)
	//   ts.success();
	// }
	//
	// function forPathTest(ts, shouldCopy) {
	//     function verifyCost(choices, expectedCost) {
	//       const tree = createTree(undefined, undefined, shouldCopy);
	//       const keys = Object.keys(choices);
	//       keys.forEach((key) => tree.setChoice(key, choices[key]));
	//       const data = tree.forPath((wrapper, cost) => {
	//         cost = cost || 0;
	//         const payload = wrapper.payload();
	//         if (payload.cost) cost += payload.cost;
	//         if (payload.multiplier) cost *= payload.multiplier;
	//         return cost;
	//       });
	//       let total = 0;
	//       data.forEach((cost) => total += cost);
	//       ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
	//     }
	//
	//     verifyCost({food: {bacon: true}}, 1.21)
	//     verifyCost({food: {bacon: false, eggs: false, cereal:true},
	//                 type: 'life'}, 10.46);
	//     verifyCost({food: {bacon: true, eggs: true},
	//                 eggs: '2', '2': 'fried'}, 2.51)
	//     verifyCost({food: {bacon: true, eggs: false, cereal:true},
	//                 eggs: '2', '2': 'fried', type: 'life'}, 11.67);
	//     verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
	//                 eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 15.51);
	//     ts.success();
	// }
	//
	// function forPathReverseTest(ts, shouldCopy) {
	//       function verifyCost(choices, expectedCost) {
	//         const tree = createTree(true, undefined, shouldCopy);
	//         const keys = Object.keys(choices);
	//         keys.forEach((key) => tree.setChoice(key, choices[key]));
	//         const data = tree.forPath((wrapper, cost) => {
	//           cost = cost || 0;
	//           const payload = wrapper.payload();
	//           if (payload.cost) cost += payload.cost;
	//           if (payload.multiplier) cost *= payload.multiplier;
	//           return cost;
	//         }, true);
	//         let total = 0;
	//         data.forEach((cost) => total += cost);
	//         ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
	//       }
	//
	//       verifyCost({food: {bacon: true}}, 1.21)
	//       verifyCost({food: {bacon: false, eggs: false, cereal:true},
	//                   type: 'life'}, 10.46);
	//       verifyCost({food: {bacon: true, eggs: true},
	//                   eggs: '2', '2': 'fried'}, 3.81)
	//       verifyCost({food: {bacon: true, eggs: true},
	//                   eggs: '3', '2': 'fried'}, 5.11)
	//       verifyCost({food: {bacon: true, eggs: true},
	//                   eggs: '6', '2': 'fried'}, 1.21)
	//       verifyCost({food: {bacon: true, eggs: true},
	//                   eggs: '6', '6': 'scramble'}, 20.41)
	//       verifyCost({food: {bacon: true, eggs: false, cereal:true},
	//                   eggs: '2', '2': 'fried', type: 'life'}, 11.67);
	//       verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
	//                   eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 28.51);
	//       ts.success();
	// }
	//
	// function leavesTest(ts, shouldCopy) {
	//       function verifyCost(choices, expectedCost) {
	//         const tree = createTree(undefined, undefined, true);
	//         const keys = Object.keys(choices);
	//         keys.forEach((key) => tree.setChoice(key, choices[key]));
	//         let total = 0;
	//         tree.leaves().forEach((wrapper) => {
	//           const payload = wrapper.payload();
	//           if (payload.cost) total += payload.cost;
	//         });
	//         ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
	//       }
	//
	//       verifyCost({food: {bacon: true}}, 1.21)
	//       verifyCost({food: {bacon: false, eggs: false, cereal:true},
	//                   type: 'life'}, 10.46);
	//       verifyCost({food: {bacon: true, eggs: true},
	//                   eggs: '2', '2': 'fried'}, 2.51)
	//       verifyCost({food: {bacon: true, eggs: false, cereal:true},
	//                   eggs: '2', '2': 'fried', type: 'life'}, 11.67);
	//       verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
	//                   eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 15.51);
	//       ts.success();
	// }
	//
	// function getNodeByPathTest(ts, shouldCopy) {
	//   const tree = createTree(undefined, undefined, shouldCopy)
	//
	//   const fried2 = tree.root().node.next('food').next('eggs').next('2').next('fried');
	//   const fried3 = tree.root().node.next('food').next('eggs').next('3').next('fried');
	//   const fried6 = tree.root().node.next('food').next('eggs').next('6').next('fried');
	//
	//   const friedBy2 = tree.node.getNodeByPath('food', 'eggs', '2', 'fried');
	//   const friedBy3 = tree.node.getNodeByPath('food', 'eggs', '3', 'fried');
	//   const friedBy6 = tree.node.getNodeByPath('food', 'eggs', '6', 'fried');
	//
	//   ts.assertEquals(fried2, friedBy2);
	//   ts.assertEquals(fried3, friedBy3);
	//   ts.assertEquals(fried6, friedBy6);
	//
	//   ts.assertNotEquals(fried2, friedBy3);
	//   ts.assertNotEquals(fried2, friedBy6);
	//   ts.assertNotEquals(fried3, friedBy2);
	//   ts.assertNotEquals(fried3, friedBy6);
	//   ts.assertNotEquals(fried6, friedBy2);
	//   ts.assertNotEquals(fried6, friedBy3);
	//
	//   ts.success();
	// }
	//
	// function removeTest(ts, shouldCopy) {
	//     const tree = createTree(null, null, shouldCopy);
	//     function checkNodeCounts(tree, nodeCounts) {
	//       Object.keys(nodeCounts).forEach((key) =>
	//           ts.assertEquals(nodeCounts[key], tree.node.instanceCount(key),
	//             `RemoveTest Failed: incorrect instance count for ${key}`));
	//     }
	//     function nodeCounts(overwrites, eggTypeCount, nuke) {
	//       overwrites = overwrites || {};
	//       function overVal(id, def) {
	//         return overwrites[id] !== undefined ? overwrites[id] :
	//                                 (nuke !== undefined ? nuke : def);
	//       }
	//       return {
	//         food: overVal("food", 1),
	//         eggs: overVal("eggs", 1),
	//         '2': overVal("2", 1),
	//         '3': overVal("3", 1),
	//         '6': overVal("6", 1),
	//         toast: overVal("toast", 1),
	//         white: overVal("white", 1),
	//         wheat: overVal("wheat", 1),
	//         texas: overVal("texas", 1),
	//         milk: overVal("milk", 1),
	//         type: overVal("type", 1),
	//         cheerios: overVal("cheerios", 1),
	//         life: overVal("life", 1),
	//
	//         scramble: overVal("scramble", eggTypeCount || 3),
	//         fried: overVal("fried", eggTypeCount || 3),
	//         "sunny side up": overVal("sunny side up", eggTypeCount || 3),
	//         "over easy": overVal("over easy", eggTypeCount || 3)
	//       }
	//     }
	//
	//     try {
	//       tree.node.addState('food', {hello: 'world'});
	//       ts.fail();
	//     } catch (e) {}
	//
	//     checkNodeCounts(tree, nodeCounts());
	//     tree.node.getNodeByPath('food', 'eggs', '3', 'fried').remove();
	//     checkNodeCounts(tree, nodeCounts({fried: 2}));
	//     tree.node.getNodeByPath('food', 'eggs', '3').remove();
	//     checkNodeCounts(tree, nodeCounts({'3': 0}, 2))
	//     tree.node.getNodeByPath('food', 'eggs', '2').remove();
	//     checkNodeCounts(tree, nodeCounts({'3': 0, '2': 0}, 1))
	//     tree.node.getNodeByPath('food').remove();
	//     checkNodeCounts(tree, nodeCounts(undefined, undefined, 0));
	//     ts.assertEquals(tree.node.instanceCount('dishes'), 1);
	//
	//     const msg = 'hello world';
	//     const payload = {msg};
	//     tree.node.addState('food', payload);
	//     tree.node.then('food');
	//     const food = tree.node.getNodeByPath('food');
	//     ts.assertEquals(Object.keys(food.payload()).length, 2);
	//     ts.assertEquals(food.payload().msg, msg);
	//
	//     ts.success();
	// }
	//
	// function attachTreeTest(ts) {
	//   const orderTree = createTree();
	//   const origLeaves = orderTree.node.leaves();
	//   let leaveCount = origLeaves.length;
	//   const drinkTree = new LogicMap(String.random());
	//
	//   const type = drinkTree.select('drink type');
	//   type.select('alcholic').leaf('beer');
	//   type.select('non alcholic').leaf('soda');
	//   orderTree.attachTree(drinkTree);
	//   let newLeaves = orderTree.node.leaves();
	//   ts.assertEquals(leaveCount + 2, newLeaves.length)
	//   leaveCount = newLeaves.length;
	//
	//   const eggs = orderTree.getByPath('food', 'eggs');
	//   const nonAlcholic = orderTree.getByPath('drink type', 'non alcholic');
	//   nonAlcholic.attachTree(eggs);
	//   newLeaves = orderTree.node.leaves();
	//   ts.assertEquals(leaveCount + 12, newLeaves.length)
	//   leaveCount = newLeaves.length;
	//
	//   const milk = orderTree.getByPath('food', 'cereal', 'milk');
	//   nonAlcholic.attachTree(milk);
	//   newLeaves = orderTree.node.leaves();
	//   ts.assertEquals(leaveCount + 1, newLeaves.length)
	//
	//   milk.attachTree(nonAlcholic);
	//
	//   ts.success();
	// }
	
	
	
	
	// Test.add('LogicMap structure', (ts) => {
	//   LogicTest(createTree(), ts);
	// });
	// // Test.add('LogicMap structure (copy)', (ts) => {
	// //   LogicTest(createTree(undefined, undefined, true), ts);
	// // });
	// //
	// // Test.add('LogicMap getNodeByPath', (ts) => {
	// //   getNodeByPathTest(ts);
	// // });
	// // Test.add('LogicMap getNodeByPath (copy)', (ts) => {
	// //   getNodeByPathTest(ts, true);
	// // });
	// //
	// // Test.add('LogicMap remove', (ts) => {
	// //   removeTest(ts);
	// // });
	// // Test.add('LogicMap remove (copy)', (ts) => {
	// //   removeTest(ts, true);
	// // });
	// //
	// // Test.add('LogicMap decisions', (ts) => {
	// //   decisionsTest(ts);
	// // });
	// Test.add('LogicMap decisions (copy)', (ts) => {
	//   decisionsTest(ts, true);
	// });
	//
	// Test.add('LogicMap isComplete (optional)', (ts) => {
	//   optionalTest(ts);
	// });
	// Test.add('LogicMap isComplete (optional & copy)', (ts) => {
	//   optionalTest(ts,true);
	// });
	//
	// Test.add('LogicMap isComplete (!optional)', (ts) => {
	//   notOptionalTest(ts);
	// });
	// Test.add('LogicMap isComplete (!optional & copy)', (ts) => {
	//   notOptionalTest(ts, true);
	// });
	//
	// Test.add('LogicMap forPath (forward)', (ts) => {
	//   forPathTest(ts);
	// });
	// Test.add('LogicMap forPath (forward & copy)', (ts) => {
	//   forPathTest(ts, true);
	// });
	//
	// Test.add('LogicMap forPath (reverse)', (ts) => {
	//   forPathReverseTest(ts);
	// });
	// Test.add('LogicMap forPath (reverse & copy)', (ts) => {
	//   forPathReverseTest(ts, true);
	// });
	//
	// Test.add('LogicMap leaves', (ts) => {
	//   leavesTest(ts);
	// });
	// Test.add('LogicMap leaves (copy)', (ts) => {
	//   leavesTest(ts, true);
	// });
	//
	// Test.add('LogicMap instanceCount', (ts) => {
	//   instanceCountTest(ts);
	// });
	// Test.add('LogicMap instanceCount (copy)', (ts) => {
	//   instanceCountTest(ts, true);
	// });
	//
	// Test.add('LogicMap attachTree', (ts) => {
	//   attachTreeTest(ts);
	// });
	// Test.add('LogicMap attachTree (copy)', (ts) => {
	//   attachTreeTest(ts, true);
	// });
	//
	// Test.add('LogicMap change', (ts) => {
	//   let tree = createTree();
	//   const food = tree.getByPath('food');
	//   const needPlate = tree.getByPath('dishes', 'need plate');
	//   food.node.change('needPlate');
	//   ts.success();
	// });
	
	
	// Test.add('LogicMap ', (ts) => {
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
	
	const LogicTree = require('../../logic-tree');
	const Lookup = require('../../object/lookup');
	
	function createTree() {
	  const tree = new LogicTree('breakfast');
	  const root = tree.rootNode;
	  const eggs = root.then('eggs', {}, 'food', 'eggs');
	  const two = eggs.then('2', {multiplier: 2}, 'count', '2');
	  const three = eggs.then(3, {multiplier: 3}, 'count', '3');
	  const six = eggs.then('6', {multiplier: 6}, 'count', 6);
	  two.then('overEasy', {cost: 1.8}, 'type', 'Over Easy');
	  two.then('sunnySideUp', {cost: 2.6}, 'type', 'Sunny Side Up');
	  two.then('scramble', {cost: 3.2}, 'type', 'Scrambled');
	  two.then('fried', {cost: 1.3}, 'type', 'Fried');
	  three.then(['overEasy', 'sunnySideUp', 'scramble', 'fried']);
	  six.addChildren('2');
	
	  const cookooRoot = new Imposter(root, {payload: () => 'The shizzle'}, tree);
	
	  return tree;
	}
	
	const Imposter = require('../../object/imposter');
	Test.add('LogicMap structure', (ts) => {
	  const tree = createTree();
	  console.log(tree.toString());
	
	  ts.success();
	});
	// Test.add('LogicMap structure (copy)', (ts) => {
	//   LogicTest(createTree(undefined, undefined, true), ts);
	// });
	//
	// Test.add('LogicMap getNodeByPath', (ts) => {
	//   getNodeByPathTest(ts);
	// });
	// Test.add('LogicMap getNodeByPath (copy)', (ts) => {
	//   getNodeByPathTest(ts, true);
	// });
	//
	// Test.add('LogicMap remove', (ts) => {
	//   removeTest(ts);
	// });
	// Test.add('LogicMap remove (copy)', (ts) => {
	//   removeTest(ts, true);
	// });
	//
	// Test.add('LogicMap decisions', (ts) => {
	//   decisionsTest(ts);
	// });
	// Test.add('LogicMap decisions (copy)', (ts) => {
	//   decisionsTest(ts, true);
	// });
	//
	// Test.add('LogicMap isComplete (optional)', (ts) => {
	//   optionalTest(ts);
	// });
	// Test.add('LogicMap isComplete (optional & copy)', (ts) => {
	//   optionalTest(ts,true);
	// });
	//
	// Test.add('LogicMap isComplete (!optional)', (ts) => {
	//   notOptionalTest(ts);
	// });
	// Test.add('LogicMap isComplete (!optional & copy)', (ts) => {
	//   notOptionalTest(ts, true);
	// });
	//
	// Test.add('LogicMap forPath (forward)', (ts) => {
	//   forPathTest(ts);
	// });
	// Test.add('LogicMap forPath (forward & copy)', (ts) => {
	//   forPathTest(ts, true);
	// });
	//
	// Test.add('LogicMap forPath (reverse)', (ts) => {
	//   forPathReverseTest(ts);
	// });
	// Test.add('LogicMap forPath (reverse & copy)', (ts) => {
	//   forPathReverseTest(ts, true);
	// });
	//
	// Test.add('LogicMap leaves', (ts) => {
	//   leavesTest(ts);
	// });
	// Test.add('LogicMap leaves (copy)', (ts) => {
	//   leavesTest(ts, true);
	// });
	//
	// Test.add('LogicMap instanceCount', (ts) => {
	//   instanceCountTest(ts);
	// });
	// Test.add('LogicMap instanceCount (copy)', (ts) => {
	//   instanceCountTest(ts, true);
	// });
	//
	// Test.add('LogicMap attachTree', (ts) => {
	//   attachTreeTest(ts);
	// });
	// Test.add('LogicMap attachTree (copy)', (ts) => {
	//   attachTreeTest(ts, true);
	// });
	//
	// Test.add('LogicMap change', (ts) => {
	//   let tree = createTree();
	//   const food = tree.getByPath('food');
	//   const needPlate = tree.getByPath('dishes', 'need plate');
	//   food.node.change('needPlate');
	//   ts.success();
	// });
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/star-line-map.js',
function (require, exports, module) {
	

	const Test = require('../test.js').Test;
	const EscapeMap = require('../../canvas/two-d/maps/escape');
	const Vertex2d = require('../../canvas/two-d/objects/vertex');
	const Line2d = require('../../canvas/two-d/objects/line');
	const Polygon2d = require('../../canvas/two-d/objects/polygon');
	
	// [new Vertex2d(10,50),new Vertex2d(10,10),new Vertex2d(50,10),new Vertex2d(50,40),new Vertex2d(20,40),new Vertex2d(20,15),new Vertex2d(40,15), new Vertex2d(40,35), new Vertex2d(35,35), new Vertex2d(35,20),new Vertex2d(25,20),new Vertex2d(25,37.5), new Vertex2d(45,37.5),new Vertex2d(45,12.5),new Vertex2d(15,12.5), new Vertex2d(15,45),new Vertex2d(50,45), new Vertex2d(50,50),new Vertex2d(10,50)]
	//
	// [new Vertex2d(20,14),new Vertex2d(15,8),new Vertex2d(24,3),new Vertex2d(20,14)]
	
	const spiral = Polygon2d.fromString('[(10,50),(10,10),(50,10),(50,40),(20,40),(20,15),(40,15), (40,35), (35,35), (35,20),(25,20),(25,37.5), (45,37.5),(45,12.5),(15,12.5), (15,45),(50,45), (50,50)]');
	const triangle = Polygon2d.fromString('[(20,14),(15,8),(24,3),(20,14)]');
	const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
	const innerLines = [new Line2d(new Vertex2d(40,47), new Vertex2d(40,48)),
	                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,25)),
	                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,15))]
	
	// star.forEach(l => l.translate(new Line2d(new Vertex2d(0,0),new Vertex2d(10,12))));
	
	Test.add('StarLineMap: escape',(ts) => {
	  // const escapeMap = new EscapeMap(spiral.lines().concat(triangle.lines()).concat(innerLines));
	  let lines = spiral.lines().concat(triangle.lines()).concat(star).concat(innerLines);
	  const escapeMap = new EscapeMap(lines);
	  const parimeterAns = Polygon2d.fromString(`(10, 50) => (10, 10) => (16.666666666666668, 10) => (15, 8) => (24, 3) => (21.454545454545453, 10) => (50, 10) => (50, 40) => (20, 40) => (20, 15) => (40, 15) => (40, 35) => (35, 35) => (35, 20) => (25, 20) => (25, 37.5) => (45, 37.5) => (45, 12.5) => (20.545454545454547, 12.5) => (20, 14) => (18.75, 12.5) => (15, 12.5) => (15, 21.18181818181818) => (16.5, 20.5) => (15.556603773584905, 22.198113207547173) => (17, 23) => (15.111111111111112, 23) => (15, 23.200000000000003) => (15, 45) => (50, 45) => (50, 50)`);
	  const parimeter = EscapeMap.parimeter(lines);
	  ts.assertTrue(parimeter.equals(parimeterAns), 'Use canvas buddy to isolate issue: /canvas-buddy/html/index.html\n\t\tIt seams like there is an error somewhere in the merging of groups... I would focus your investigation there.');
	  ts.success();
	});
	
	Test.add('Polygon: build', (ts) => {
	  const polyAns = Polygon2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5)]');
	  for (let index = 0; index < 5; index++) {
	    const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
	    star.shuffle();
	    const poly = Polygon2d.build(star);
	    ts.assertTrue(poly.equals(polyAns));
	  }
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/lookup.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	const Lookup = require('../../object/lookup');
	
	Test.add('Lookup structure', (ts) => {
	  const l1 = new Lookup();
	  const l2 = new Lookup(null, 'id2');
	  const l3 = {};
	  Lookup.convert(l3);
	  const l4 = {hic: 'cups'};
	  Lookup.convert(l4, 'id2');
	  Object.fromJson(l4.toJson())
	
	  const l12 = Lookup.fromJson(l1.toJson());
	  ts.assertTrue(l12 === l1);
	  const l22 = Lookup.fromJson(l2.toJson());
	  ts.assertTrue(l22 === l2);
	  const l32 = Lookup.fromJson(l3.toJson());
	  ts.assertTrue(l32 === l3);
	  const l42 = Lookup.fromJson(l4.toJson());
	  ts.assertTrue(l42 === l4);
	
	  const l5Json = {pickes: 'fried', id5: 'Lookup_gibberish', ID_ATTRIBUTE: 'id5'};
	  const l5 = Lookup.fromJson(l5Json);
	  ts.assertEquals(l5.pickes, 'fried');
	  const l52 = Lookup.fromJson(l5.toJson());
	  ts.assertTrue(l52 === l5);
	  l52.pickes = 'boiled...(Ewwwwww)';
	  ts.assertEquals(l52.pickes, 'boiled...(Ewwwwww)');
	
	  ts.success();
	});
	
});


RequireJS.addFunction('../../public/js/utils/test/tests/utils.js',
function (require, exports, module) {
	
const Test = require('../test.js').Test;
	
	Test.add('Array: scale',(ts) => {
	  const original = [1,2,3,4];
	  const arr = Array.from(original);
	  const valScale = arr.scale(3, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(valScale.equals([3,6,9,12]));
	  const funcScale = arr.scale((val, index) => index, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(funcScale.equals([0,2,6,12]));
	  arr.scale([9,5,3,2]);
	  ts.assertTrue(!original.equals(arr));
	  ts.assertTrue(arr.equals([9,10,9,8]));
	
	  ts.success();
	});
	
	Test.add('Array: add',(ts) => {
	  const original = [1,2,3,4];
	  const arr = Array.from(original);
	  const valScale = arr.add(3, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(valScale.equals([4,5,6,7]));
	  const funcScale = arr.add((val, index) => index, true);
	  ts.assertTrue(original.equals(arr));
	  ts.assertTrue(funcScale.equals([1,3,5,7]));
	  arr.add([9,5,3,2]);
	  ts.assertTrue(!original.equals(arr));
	  ts.assertTrue(arr.equals([10,7,6,6]));
	
	  ts.success();
	});
	
});


RequireJS.addFunction('./generated/html-templates.js',
function (require, exports, module) {
	
exports['176893079'] = (get, $t) => 
			`<span class='decision-input-array-cnt pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` <span> <button class='conditional-button' target-id='` +
			$t.clean(get("input").id()) +
			`'> If ` +
			$t.clean(get("input").name()) +
			` = ` +
			$t.clean(get("input").value()) +
			` </button> <div class='condition-input-tree tab'></div> <div class='children-recurse-cnt' value='` +
			$t.clean(get("input").value()) +
			`'>` +
			$t.clean(get("childrenHtml")(get("input").name(), true)) +
			`</div> </span> <br> </span>`
	
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
	
	exports['1390854481'] = (get, $t) => 
			`<span class='decision-input-array-cnt pad ` +
			$t.clean(get("class")) +
			`' index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("input").html()) +
			` <div class='children-recurse-cnt' value='` +
			$t.clean(get("input").value()) +
			`'> ` +
			$t.clean(get("childrenHtml")(get("input").name())) +
			` </div> </span>`
	
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
	
	exports['1835219150'] = (get, $t) => 
			`<option value='` +
			$t.clean(get("isArray")() ? get("value") : get("key")) +
			`' ` +
			$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
			`> ` +
			$t.clean(get("value")) +
			` </option>`
	
	exports['auto-save'] = (get, $t) => 
			`<div> <button type="button" class='auto-save-btn' name="button">Auto Save</button> <span class='status'></span> </div> `
	
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
			$t.clean( new $t('176893079').render(get("inputArray"), 'input', get)) +
			` </span> <div class='modification-add-input'> ` +
			$t.clean(get("inputTree")().html()) +
			` </div> </` +
			$t.clean(get("tag")()) +
			`> `
	
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
			$t.clean( new $t('1390854481').render(get("inputArray"), 'input', get)) +
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
	
	exports['input/multiple-entries'] = (get, $t) => 
			`<` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			` class='input-cnt multi'` +
			$t.clean(get("hidden")() ? ' hidden' : '') +
			`> <label>` +
			$t.clean(get("label")()) +
			`</label> <div class='multiple-entry-cnt tab' id='` +
			$t.clean(get("id")()) +
			`'> ` +
			$t.clean( new $t('-1306926582').render(get("list")(), 'inputArray', get)) +
			` </div> </` +
			$t.clean(get("inline")() ? 'span' : 'div') +
			`> `
	
	exports['-1306926582'] = (get, $t) => 
			`<div index='` +
			$t.clean(get("$index")) +
			`'> ` +
			$t.clean(get("setHtml")(get("$index"))) +
			` </div>`
	
	exports['input/one-entry'] = (get, $t) => 
			`<span class='one-entry-cnt'> ` +
			$t.clean(get("html")()) +
			` </span> `
	
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
	
	exports['-498428047'] = (get, $t) => 
			`<tr > <td>row</td> ` +
			$t.clean( new $t('1591500900').render(get("columns")(), 'colIndex, col', get)) +
			` </tr>`
	
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
	
	exports['report'] = (get, $t) => 
			`<div> REPORT === ` +
			$t.clean(get("name")) +
			` </div> `
	
	exports['index'] = (get, $t) => 
			`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <script type="text/javascript" src='/mike/js/index.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/mike/styles/mike.css"> <title></title> </head> <body> ` +
			$t.clean(get("header")) +
			` ` +
			$t.clean(get("main")) +
			` ` +
			$t.clean(get("footer")) +
			` </body> </html> `
	
	exports['reports'] = (get, $t) => 
			`<div> REPORTS === ` +
			$t.clean(get("name")) +
			` </div> `
	
});


RequireJS.addFunction('./app/app.js',
function (require, exports, module) {
	
require('../../../public/js/utils/utils.js');
	// Run Tests
	require('../tests/run');
	
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


RequireJS.addFunction('./app/pages/configure.js',
function (require, exports, module) {
	
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
	const Input = require('../../../../public/js/utils/input/input');
	const Radio = require('../../../../public/js/utils/input/styles/radio');
	const Table = require('../../../../public/js/utils/input/styles/table');
	const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
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
	  const input1 = getInput();
	  const input2 = getInput();
	  const input3 = getInput();
	  tree = new DecisionInputTree('root', [input1, input2, input3]);
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
	
	// const table = new Table({
	//   name: 'tabal',
	//   description: 'Pussy fartsss',
	//   columns: ['one', 2, 3, 'four'],
	//   rows: ['bill', 'scott', 'joe', 'fred']
	// });
	// du.id('test-ground').innerHTML = table.html();
	
	const input1 = getInput();
	const input2 = getInput();
	const input3 = getInput();
	const me = new MultipleEntries([input1, input2, input3], {label: 'oneTwoThree'});
	du.id('test-ground').innerHTML = me.html();
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/reports.js',
function (require, exports, module) {
	
function proccess() {
	  console.log('reports bitches');
	}
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./app/pages/report.js',
function (require, exports, module) {
	
function proccess() {
	  console.log('report bitches');
	}
	
	exports.proccess = proccess;
	
});


RequireJS.addFunction('./tests/run.js',
function (require, exports, module) {
	

	
	const Test = require('../../../public/js/utils/test/test').Test;
	
	require('../../../public/js/utils/test/tests/lookup');
	require('../../../public/js/utils/test/tests/decision-tree');
	// require('../../../public/js/utils/test/tests/logic-tree');
	
	Test.run();
	
});


window.onload = () => RequireJS.init('app/app.js')
