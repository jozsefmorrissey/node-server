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
                          this.functions : this.costs));

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
      return `File: ${absolutePath}\n` +
             arrToStr('exports', this.exports) +
             arrToStr('requires', this.requires) +
             arrToStr('classes', this.classes) +
             arrToStr('functions', this.functions) +
             arrToStr('consts', this.consts) +
             `requireStr ${await this.requireStr()}\n` +
             `exportStr ${this.exportStr()}\n` +
             `script: \n${script}`;
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
  path += path.match(/^.*\.js$/) ? '' : '.js';
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
      return stackTarget
          .replace(/^.*?\(([^(^:]*)\/[^/]{1,}?:.*$/, '$1');
    }

    projectDir = projectDir || guessProjectDir();
    const scripts = {};

    function requireWrapper (absDir, relitivePath) {
      relitivePath = MapScript.simplifyPath(relitivePath);
      const path = MapScript.simplifyPath(`${absDir}${relitivePath}`);
      if (scripts[path] instanceof Unloaded) {
        scripts[path] = scripts[path].load();
      }
      return scripts[path];
    }

    function requireFunc (absoluteDir) {
      return (relitivePath) => requireWrapper(absoluteDir, relitivePath);
    }

    class Unloaded {
      constructor(path, func) {
        const absoluteDir = MapScript.simplifyPath(path).replace(/(.*\/).*/, '$1');
        const modulee = {exports: {}};
        this.load = () => {
          func(requireFunc(absoluteDir), modulee.exports, modulee);
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

    const guess = false;
    this.guess = (g) => guess = (typeof g) === 'boolean' ? g : !guess;


    const startTime = new Date().getTime();
    const pathCache = {};
    async function encapsulate(absolutePath, script) {
      const map = new MapScript(absolutePath, script);
      async function resolver (resolve) {
        if (pathCache[absolutePath] === undefined) {
          pathCache[absolutePath] = await MapScript.toRelitivePath(absolutePath, projectDir);
        }
        const reqStr = await map.requireStr();
        const expStr = map.exportStr();
        const body = `${reqStr}${script}${expStr}`;
        const encaps = `RequireJS.addFunction('${pathCache[absolutePath]}',
function (require, exports, module) {
${body}
});\n\n\n`;
        resolve(encaps);

        if (guess && startTime > new Date().getTime() + 5000) {
          fs.write(this.absPath(), body, 'utf8');
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



RequireJS.addFunction('./test-rewrite/$t.js',
function (require, exports, module) {
const CustomEvent = require('./custom-error.js');
const ExprDef = require('./expression-definition.js');

class $t {
	constructor(template, id, selector) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const beforeRenderEvent = new CustomEvent('beforeRender');

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
		const keyWordProps = {opening: /(new|null|undefined|NaN|true|false)[^a-z^A-Z]/, tailOffset: -1};
		const ignoreProps = {opening: /new \$t\('.*?'\).render\(get\('scope'\), '(.*?)', get\)/};
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
					obj[elemName] = get(index);
					resp += new $t(template).render(obj, undefined, get);
				} else {
					resp += new $t(template).render(get(index), undefined, get);
				}
			}
			return `${resp}`;
		}

		function arrayExp(itExp, get) {
			const match = itExp.match($t.arrayItExpReg);
			const varName = match[1];
			const array = match[3] ? get(match[2])() : get(match[2]);
			let built = '';
			for (let index = 0; index < array.length; index += 1) {
				const obj = {};
				obj[varName] = array[index];
				obj.$index = index;
				built += new $t(template).render(obj, undefined, get);
			}
			return built;
		}

		function itOverObject(itExp, get) {
			const match = itExp.match($t.objItExpReg);
			const keyName = match[1];
			const valueName = match[2];
			const obj = get(match[3]);
			const keys = Object.keys(obj);
			let built = '';
			for (let index = 0; index < keys.length; index += 1) {
				const key = keys[index];
				const childScope = {};
				childScope[keyName] = key;
				childScope[valueName] = obj[key];
				childScope.$index = index;
				built += new $t(template).render(childScope, undefined, get);
			}
      return built;
		}

		function rangeExp(itExp, get) {
			const match = itExp.match($t.rangeItExpReg);
			const elemName = match[1];
			let startIndex = (typeof match[2]) === 'number' ||
						match[2].match(/^[0-9]*$/) ?
						match[2] : get(`${match[2]}`);
			let endIndex = (typeof match[3]) === 'number' ||
						match[3].match(/^[0-9]*$/) ?
						match[3] : get(`${match[3]}`);
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

		function type(scope, itExp) {
			if ((typeof itExp) === 'string' && itExp.match($t.rangeAttemptExpReg)) {
				if (itExp.match($t.rangeItExpReg)) {
					return 'rangeExp'
				}
				return 'rangeExpFormatError';
			} else if (Array.isArray(scope)) {
				if (itExp === undefined) {
					return 'defaultArray';
				} else if (itExp.match($t.nameScopeExpReg)) {
					return 'nameArrayExp';
				} else {
					return 'invalidArray';
				}
			} else if ((typeof scope) === 'object') {
				if (itExp === undefined) {
					return 'defaultObject';
				} else if (itExp.match($t.objItExpReg)){
					return 'itOverObject';
				} else if (itExp.match($t.arrayItExpReg)){
					return 'arrayExp';
				} else {
					return 'invalidObject';
				}
			} else {
				return 'defaultObject';
			}
		}

		function render(scope, itExp, parentScope) {
      if (scope === undefined) return '';
			let rendered = '';
			const get = getter(scope, parentScope);
			switch (type(scope, itExp)) {
				case 'rangeExp':
					rendered = rangeExp(itExp, get);
					break;
				case 'rangeExpFormatError':
					throw new Error(`Invalid range itteration expression "${itExp}"`);
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
				str = str.replace(`{{${block}}}`, `\` + (${parced}) + \``);
			}
			return `\`${str}\``;
		}


				const repeatReg = /<([a-zA-Z-]*):t( ([^>]* |))repeat=("|')([^>^\4]*?)\4([^>]*>((?!(<\1:t[^>]*>|<\/\1:t>)).)*<\/)\1:t>/;
				function formatRepeat(string) {
					// tagname:1 prefix:2 quote:4 exlpression:5 suffix:6
					// string = string.replace(/<([^\s^:^-^>]*)/g, '<$1-ce');
					let match;
					while (match = string.match(repeatReg)) {
						let tagContents = match[2] + match[6];
						let template = `<${match[1]}${tagContents}${match[1]}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
						let templateName = tagContents.replace(/.*\$t-id=('|")([\.a-zA-Z-_\/]*?)(\1).*/, '$2');
						let scope = 'scope';
						template = templateName !== tagContents ? templateName : template;
						string = string.replace(match[0], `{{new $t('${template}').render(get('${scope}'), '${match[5]}', get)}}`);
						eval(`new $t(\`${template}\`)`);
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
$t.arrayItExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*in\s*([a-zA-Z][a-z0-9A-Z\.]*)(\(\)|)\s*$/;
$t.objItExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*,\s*([a-zA-Z][a-z0-9A-Z]*)\s*in\s*([a-zA-Z][a-z\.0-9A-Z]*)\s*$/;
$t.rangeAttemptExpReg = /^\s*([a-z0-9A-Z]*)\s*in\s*(.*\.\..*)\s*$/;
$t.rangeItExpReg = /^\s*([a-z0-9A-Z]*)\s*in\s*([a-z0-9A-Z]*)\.\.([a-z0-9A-Z]*)\s*$/;
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
$t.dumpTemplates = function () {
	let templateFunctions = '';
	let tempNames = Object.keys($t.templates);
	for (let index = 0; index < tempNames.length; index += 1) {
		const tempName = tempNames[index];
		if (tempName) {
			const template = $t.templates[tempName];
			templateFunctions += `\nexports['${tempName}'] = (get, $t) => ${template}\n`;
		}
	}
	return templateFunctions;
}

function createGlobalsInterface() {
  const GLOBALS = {};
  const isMotifiable = () => GLOBALS[name] === undefined ||
        GLOBALS[name].imutable !== 'true';
  $t.global = function (name, value, imutable) {
    if (value === undefined) return GLOBALS[name] ? GLOBALS[name].value : undefined;
    if (isMotifiable()) GLOBALS[name] = {value, imutable};
  }
  $t.rmGlobal = function(name) {
    if (isMotifiable()) delete GLOBALS[name];
  }
}
createGlobalsInterface();
module.exports = $t

});


RequireJS.addFunction('./test-rewrite/custom-error.js',
function (require, exports, module) {
class CustomEvent {
  constructor(name) {
    const watchers = [];
    this.name = name;

    const runFuncs = (e) => watchers.forEach((func) => func(e));

    this.on = function (func) {
      if ((typeof func) === 'function') {
        watchers.push(func);
      } else {
        return 'on' + name;
      }
    }

    this.trigger = function (element) {
      element = element === undefined ? window : element;
      runFuncs(element);
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
module.exports = CustomEvent

});


RequireJS.addFunction('./test-rewrite/dom-utils.js',
function (require, exports, module) {
const getValue = require('./utils.js').getValue;
const du = {create: {}, find: {}, class: {}, cookie: {}, param: {}, style: {},
      scroll: {}, input: {}, on: {}};

du.create.element = function (tagname, attributes) {
  const elem = document.createElement(tagname);
  const keys = Object.keys(attributes);
  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
  return elem;
}

du.find.up = function (selector, node) {
  if (node instanceof HTMLElement) {
    if (node.matches(selector)) {
      return node;
    } else {
      return du.find.up(selector, node.parentNode);
    }
  }
}

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

du.find.upAll = function(selector, node) {
  const elems = [];
  let elem = node;
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
  found.matches = matches;
  return found;
}

du.find.down = function(selector, node) {return du.find.downInfo(selector, node).node};
du.find.downAll = function(selector, node) {return du.find.downInfo(selector, node).matches};

du.find.closest = function(selector, node) {
  const visited = [];
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
    let targetId = target.getAttribute('ce-match-run-id');
    if (targetId === null || targetId === undefined) {
      targetId = matchRunIdCount + '';
      target.setAttribute('ce-match-run-id', matchRunIdCount++)
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


du.class.add = function(target, clazz) {
  du.class.remove(target, clazz);
  target.className += ` ${clazz}`;
}

du.class.swap = function(target, newClass, oldClass) {
  du.class.remove(target, oldClass);
  addClass(target, newClass)
}

function classReg(clazz) {
  return new RegExp(`(^| )(${clazz}( |$)){1,}`, 'g');
}

du.class.remove = function(target, clazz) {
  target.className = target.className.replace(classReg(clazz), ' ').trim();
}

du.class.has = function(target, clazz) {
  return target.className.match(classReg(clazz));
}

du.class.toggle = function(target, clazz) {
  if (hasClass(target, clazz)) du.class.remove(target, clazz);
  else addClass(target, clazz);
}

du.on.match = function(event, selector, func, target) {
  target = target || document;
  const  matchRunTargetId = getTargetId(target);
  if (selectors[matchRunTargetId] === undefined) {
    selectors[matchRunTargetId] = {};
  }
  if (selectors[matchRunTargetId][event] === undefined) {
    selectors[matchRunTargetId][event] = {};
    target.addEventListener(event, runMatch);
  }
  if ( selectors[matchRunTargetId][event][selector] === undefined) {
    selectors[matchRunTargetId][event][selector] = [];
  }

  const selectorArray = selectors[matchRunTargetId][event][selector];
  // if (selectorArray.indexOf(func) !== -1) {
    selectorArray.push(func);
  // }
}

const defaultDynamInput = (value, type) => new Input({type, value});

du.input.bind = function(selector, objOrFunc, props) {
  let lastInputTime = {};
  props = props || {};
  const validations = props.validations || {};
  const inputs = props.inputs || {};

  const resolveTarget = (elem) => du.find.down('[prop-update]', elem);
  const getValue = (updatePath, elem) => {
    const input = inputs.pathValue(updatePath);
    return input ? input.value() : elem.value;
  }
  const getValidation = (updatePath) => {
    let validation = validations.pathValue(updatePath);
    const input = inputs.pathValue(updatePath);
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
            objOrFunc(updatePath, elem.value);
          } else {
            objOrFunc.pathValue(updatePath, elem.value);
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
      const input = inputs.pathValue(updatePath) || defaultDynamInput(value, type);

      target.innerHTML = input.html();
      const inputElem = du.find.down(`#${input.id}`, target);
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

du.cookie.get = function(name, seperator) {
  const cookie = document.cookie.parseSeperator(';')[name];
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


du.param.get = function(name) {
  if (getParam.params === undefined) {
    const url = window.location.href;
    const paramStr = url.substr(url.indexOf('?') + 1);
    getParam.params = paramStr.parseSeperator('&');
  }
  return decodeURI(getParam.params[name]);
}

du.style.temporary = function(elem, time, style) {
  const save = {};
  const keys = Object.keys(style);
  keys.forEach((key) => {
    save[key] = elem.style[key];
    elem.style[key] = style[key];
  });

  setTimeout(() => {
    keys.forEach((key) => {
      elem.style[key] = save[key];
    });
  }, time);
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


du.cookie.remove = function (name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

module.exports = du;

});


RequireJS.addFunction('./test-rewrite/decisionTree.js',
function (require, exports, module) {

// terminology
// name - String to define state;
// payload - data returned for a given state
// stateObject - object defining states {name: [payload]...}
// states - array of availible state names.
// node - {name, states, payload, then, addState, addStates};
// then(name) - a function to set a following state.
// next(name) - a function to get the next state.
// back() - a function to move back up the tree.
// top() - a function to get root;
//
// returns all functions return current node;
class DecisionTree {
  constructor(name, payload) {
    name = name || 'root';
    const stateConfigs = {};
    const tree = {};
    const nodeMap = {};

    function addState(name, payload) {
      return stateConfigs[name] = payload;
    }

    function addStates(sts) {
      if ((typeof sts) !== 'object') throw new Error('Argument must be an object\nFormat: {[name]: payload...}');
      const keys = Object.keys(sts);
      keys.forEach((key) => stateConfigs[key] = sts[key]);
    }

    function getState(name, parent) {
      return new DecisionNode(name, stateConfigs[name], parent);
    }


    class DecisionNode {
      constructor(name, payload, parent) {
        const states = {};
        let jump;
        payload = payload || {};
        payload._nodeId = `decision-node-${String.random(7)}`;
        nodeMap[payload._nodeId] = this;
        this.getNode = (nodeId) => nodeMap[nodeId];
        this.name = name;
        this.states = states;
        this.payload = payload;
        this.jump = (name) => {
          if (name) jump = getState(name, parent);
          return jump;
        };
        this.then = (name, payload) => {
          payload = payload ? addState(name, payload) : stateConfigs[name];
          states[name] = (getState(name, this));
          const state = states[name];
          return state === undefined ? undefined : state.jump() || state;
        }
        this.addState = (name, payload) => addState(name, payload) && this;
        this.addStates = (sts) => addStates(sts) && this;
        this.next = (name) => {
          const state = states[name];
          return state === undefined ? undefined : state.jump() || state;
        }

        this.routePayloads = () => {
          let currNode = this;
          const payloads = [];
          while(currNode !== null) {
            payloads.push(currNode.payload);
            currNode = currNode.back();
          }
          return payloads.reverse();
        }
        this.back = () => parent;
        this.top = () => rootNode;
      }
    }

    const rootNode = new DecisionNode(name, payload, null);
    return rootNode;
  }
}
module.exports = DecisionTree

});


RequireJS.addFunction('./test-rewrite/expression-definition.js',
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
module.exports = ExprDef

});


RequireJS.addFunction('./test-rewrite/utils.js',
function (require, exports, module) {
const du = require('./dom-utils.js');
const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}
$t.global('getValue', getValue, true);

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24, width: 50, thickness: 21};
  return {length: 0, width: 0, thickness: 0};
}

function funcOvalue () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 2) {
    const attr = arguments[index];
    const funcOval = arguments[index + 1];
    if ((typeof funcOval) === 'function') this[attr] = funcOval;
    else this[attr] = () => funcOval;
  }
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
  updateModel(opening);
}



du.on.match('change', '.open-orientation-radio,.open-division-input', updateDivisions);
exports.formatConstructorId = formatConstructorId
exports.getValue = getValue
exports.getDefaultSize = getDefaultSize
exports.funcOvalue = funcOvalue
exports.updateDivisions = updateDivisions

});


RequireJS.addFunction('./test-rewrite/string-math-evaluator.js',
function (require, exports, module) {

const Measurement = require('./measurment');

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
      if (resolved) return resolved;
      try {
        if ((typeof path) === 'string') path = path.split(splitter);
        for (let index = 0; index < path.length; index += 1) {
          currObj = currObj[path[index]];
        }
        if (currObj === undefined && !globalCheck) throw Error('try global');
        return currObj;
      }  catch (e) {
        return resolve(path, globalScope, true);
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
            args[index] = instance.eval(args[index], scope);
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
          chainedExpressions(expr, resolve(path, scope).apply(null, args), endIndex - 1, ''));

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
      return expr = expr.replace(StringMathEvaluator.mixedNumberReg, '($1+$2)') || expr;;
    }
    function addUnexpressedMultiplicationSigns(expr) {
      expr = expr.replace(/([0-9]{1,})(\s*)([a-zA-Z]{1,})/g, '$1*$3');
      expr = expr.replace(/([a-zA-Z]{1,})\s{1,}([0-9]{1,})/g, '$1*$2');
      expr = expr.replace(/\)([^\s^+^-^*^\/])/g, ')*$1');
      return expr.replace(/([^\s^+^-^*^\/])\(/g, '$1*(');
    }

    const isolateNumber = isolateValueReg(StringMathEvaluator.numReg, Number.parseFloat);
    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);

    this.cache = (expr) => {
      const time = new Date().getTime();
      if (cache[expr] && cache[expr].time > time - 200) {
        cache[expr].time = time;
        return cache[expr].value;
      }
      return null
    }

    this.eval = function (expr, scope, percision) {
      if (instance.cache(expr) !== null) return instance.cache(expr);
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
            if (isolateOperand(char, operands)) throw new Error('Invalid operand location');
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
        cache[expr] = {time: new Date().getTime(), value};
        return StringMathEvaluator.round(value);
      }
      return NaN;
    }
  }
}

StringMathEvaluator.round = (value, percision) => {
  if (percision)
    return new Measurement(value).decimal(percision);
  return Math.round(value * 10000000) / 10000000;
}
StringMathEvaluator.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;

StringMathEvaluator.mixedNumberReg = /([0-9]{1,})\s{1,}([0-9]{1,}\/[0-9]{1,})/g;
StringMathEvaluator.footInchReg = /\s*([0-9]{1,})\s*'\s*([0-9\/ ]{1,})\s*"\s*/g;
StringMathEvaluator.footReg = /\s*([0-9]{1,})\s*'\s*/g;
StringMathEvaluator.inchReg = /\s*([0-9]{1,})\s*"\s*/g;
StringMathEvaluator.evaluateReg = /[-\+*/]|^\s*[0-9]{1,}\s*$/;
StringMathEvaluator.numReg = /^(-|)[0-9\.]{1,}/;
StringMathEvaluator.varReg = /^((\.|)([a-zA-Z][a-zA-Z0-9\.]*))/;
StringMathEvaluator.multi = (n1, n2) => n1 * n2;
StringMathEvaluator.div = (n1, n2) => n1 / n2;
StringMathEvaluator.add = (n1, n2) => n1 + n2;
StringMathEvaluator.sub = (n1, n2) => n1 - n2;

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
module.exports = StringMathEvaluator

});


window.onload = () => RequireJS.init('app/app.js')
