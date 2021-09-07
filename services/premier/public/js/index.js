

class RequireJS {
  constructor(projectDir, main) {
    function guessProjectDir () {
      const stackTarget = new Error().stack.split('\n')[3];
      return stackTarget
          .replace(/^.*?\(([^(^:]*)\/[^/]{1,}?:.*$/, '$1');
    }

    projectDir = projectDir || guessProjectDir();
    const scripts = {};
    const upFolderRegex = /(\/|^)([^/]{3,}|[^.]|[^.].|.[^.])\/\.\.\//g;

    function simplifyPath (path) {
      path = path.replace(/^\.\//, '');
      path += path.match(/^.*\.js$/) ? '' : '.js';
      let simplified = path;
      let currSimplify = path;
      while(currSimplify.match(upFolderRegex)) {
        currSimplify = currSimplify.replace(upFolderRegex, '$1');
        simplified = currSimplify;
      }
      return simplified;
    }

    function requireWrapper (absDir, relitivePath) {
      relitivePath = simplifyPath(relitivePath);
      const path = simplifyPath(`${absDir}${relitivePath}`);
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
        const absoluteDir = simplifyPath(path).replace(/(.*\/).*/, '$1');
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
        const fs = require('fs');
        header = fs.readFileSync(__filename, 'utf8');
      }
      return `${header}\n\n\n`;
    }

    this.footer = () => {
      return `window.onload = () => RequireJS.init('${main}')\n`;
    }

    function toRelitiveProjectPath (path) {
      const shell = require('shelljs');
      const cmd = `realpath --relative-to='${projectDir}' '${path}'`;
      const output = shell.exec(cmd);
      return output.stderr ? output.stderr :
          simplifyPath(`${output.stdout.trim()}`);
    }

    const pathCache = {};
    function encapsulate(absolutePath, script) {
      if (pathCache[absolutePath] === undefined)
        pathCache[absolutePath] = toRelitiveProjectPath(absolutePath);
      return `RequireJS.addFunction('${pathCache[absolutePath]}',
  function (require, exports, module) {
    ${script}
  });\n\n\n`
    }

    function init(main) {
      requireWrapper ('', main)
    }

    this.init = init;
    this.encapsulate = encapsulate;
    this.toRelitiveProjectPath = toRelitiveProjectPath;
    this.addFunction = addFunction;
  }
}


try {
  exports.RequireJS = RequireJS;
} catch (e) {}
RequireJS = new RequireJS();



RequireJS.addFunction('../../public/js/$t.js',
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
try {
  exports.ExprDef = ExprDef;
} catch (e) {}

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
					return $t.functions[id](get);
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
			templateFunctions += `\n$t.functions['${tempName}'] = function (get) {\n\treturn ${template}\n}`;
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

exports = $t;

  });


RequireJS.addFunction('generated/html-templates.js',
  function (require, exports, module) {
    
exports['202297006'] = (get, $t) => `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + ` ` + (get("$index") === get("activeIndex") ? ' active' : '') + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`

exports['632351395'] = (get, $t) => `<div > <input class='expand-list-sidebar-input' list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </div>`

exports['633282157'] = (get, $t) => `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`

exports['expandable/list'] = (get, $t) => ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='{{id}}' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> `

exports['-1921787246'] = (get, $t) => `<option value="` + (get("option")) + `" ></option>`

exports['-1756076485'] = (get, $t) => `<span > <input list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </span>`

exports['expandable/pill'] = (get, $t) => ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` </div> <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='{{id}}' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <br> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> <div class="expand-body {{type}}"></div> </div> `

exports['-520175802'] = (get, $t) => `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`

exports['expandable/sidebar'] = (get, $t) => ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header ` + (get("type")) + ` {{$index === activeIndex ? \' active\' : \'\'}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<div > <input class=\'expand-list-sidebar-input\' list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </div>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='{{id}}' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> </div> <div> </div> <div class="expand-body {{type}}"> Hello World! </div> </div> `

exports['input/decision/decision'] = (get, $t) => ` <div> <span id='` + (get("id")) + `' class='inline-flex'> ` + (new $t('<span  class=\'pad {{class}}\' node-id=\'{{_nodeId}}\' index=\'{{$index}}\'> {{input.html()}} </span>').render(get('scope'), 'input in inputArray', get)) + ` </span> ` + (new $t('<div  id=\'{{input.childCntId}}\'> {{childHtml($index)}} </div>').render(get('scope'), 'input in inputArray', get)) + ` </div> `

exports['-2022747631'] = (get, $t) => `<span class='pad ` + (get("class")) + `' node-id='` + (get("_nodeId")) + `' index='` + (get("$index")) + `'> ` + (get("input").html()) + ` </span>`

exports['-1362189101'] = (get, $t) => `<div id='` + (get("input").childCntId) + `'> ` + (get("childHtml")(get("$index"))) + ` </div>`

exports['input/decision/decisionTree'] = (get, $t) => `<div class='` + (get("class")) + `' tree-id='` + (get("treeId")) + `'> ` + (get("payload").html()) + ` <button class='` + (get("buttonClass")) + `' tree-id='` + (get("treeId")) + `' ` + (get("formFilled")() ? '' : 'disabled') + `> ` + (get("name")) + ` </button> </div> `

exports['input/input'] = (get, $t) => `<div class='input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='` + (get("class")) + `' list='input-list-` + (get("id")) + `' id='` + (get("id")) + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `' ` + (get("attrString")()) + `> <datalist id="input-list-` + (get("id")) + `"> ` + (new $t('<option value="{{item}}" ></option>').render(get('scope'), 'item in list', get)) + ` </datalist> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `

exports['-994603408'] = (get, $t) => `<option value="` + (get("item")) + `" ></option>`

exports['input/measurement'] = (get, $t) => `<div class='fit input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='measurement-input ` + (get("class")) + `' id='` + (get("id")) + `' value='` + (get("value")() ? get("value")() : "") + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `'> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `

exports['input/select'] = (get, $t) => `<div class='input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <select class='` + (get("class")) + `' id='` + (get("id")) + `' name='` + (get("name")) + `' value='` + (get("value")()) + `'> ` + (new $t('<option  value=\'{{isArray() ? value : key}}\' {{selected(item) ? \'selected\' : \'\'}}> {{value}} </option>').render(get('scope'), 'key, value in list', get)) + ` </select> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `

exports['-1238286346'] = (get, $t) => `<option value='` + (get("isArray")() ? get("value") : get("key")) + `' ` + (get("selected")(get("item")) ? 'selected' : '') + `> ` + (get("value")) + ` </option>`

exports['drawer-box/order-info-form'] = (get, $t) => `<div> <div> <b>Job Name</b> ` + (get("jobName")()) + ` <br> <b>Today's Date</b> ` + (get("todaysDate")()) + ` <b>Due Date</b> ` + (get("dueDate")()) + ` </div> <div> <b>Invoice #</b> ` + (get("invoiceNumber")()) + ` <b>P.O. #</b> ` + (get("poNumber")()) + ` </div> <table> <tr> <td class='label-cnt'> <label>Company Name</label> ` + (get("companyName")()) + ` </td> <td class='label-cnt'> <label>Sales Rep</label> ` + (get("salesRep")()) + ` </td> </tr> <tr> <td class='label-cnt'> <label>Shipping Address</label> ` + (get("shippingAddress")()) + ` </td> <td class='label-cnt'> <label>Ship VIA</label> ` + (get("shipVia")()) + ` </td> </tr> <tr> <td class='label-cnt'> <label>Billing Address</label> ` + (get("billingAddress")()) + ` </td> </tr> <tr> <td class='label-cnt'> <label>Phone</label> ` + (get("phone")()) + ` </td> <td class='label-cnt'> <label>Email</label> ` + (get("email")()) + ` </td> <td class='label-cnt'> <label>Fax</label> ` + (get("fax")()) + ` </td> </tr> </table> `

exports['drawer-box/order-info'] = (get, $t) => `<div> <div> <div class='dynamic'> <b>Job Name</b> <span prop-update='jobName'>` + (get("jobName")()) + `</span> </div> <br> <b>Today's Date</b> ` + (get("todaysDate")()) + ` <div class='dynamic'> <b>Due Date</b> <span prop-update='dueDate' type='date'>` + (get("dueDate")()) + `</span> </div> </div> <div> <b>Invoice #</b> ` + (get("invoiceNumber")()) + ` <div class='dynamic'> <b>P.O. #</b> <span prop-update='poNumber'>` + (get("poNumber")()) + `</span> </div> </div> <table> <tr> <td class='dynamic label-cnt'> <label>Company Name</label> <div prop-update='companyName'>` + (get("companyName")()) + `</div> </td> <td class='dynamic label-cnt'> <label>Sales Rep</label> <div prop-update='salesRep'>` + (get("salesRep")()) + `</div> </td> </tr> <tr> <td class='dynamic label-cnt'> <label>Shipping Address</label> <div prop-update='shippingAddress'>` + (get("shippingAddress")()) + `</div> </td> <td class='dynamic label-cnt'> <label>Ship VIA</label> <div prop-update='shipVia'>` + (get("shipVia")()) + `</div> </td> </tr> <tr> <td class='dynamic label-cnt'> <label>Billing Address</label> <div prop-update='billingAddress'>` + (get("billingAddress")()) + `</div> </td> </tr> <tr> <td class='dynamic label-cnt'> <label>Phone</label> <div prop-update='phone'>` + (get("phone")()) + `</div> </td> <td class='dynamic label-cnt'> <label>Email</label> <div prop-update='email'>` + (get("email")()) + `</div> </td> <td class='dynamic label-cnt'> <label>Fax</label> <div prop-update='fax'>` + (get("fax")()) + `</div> </td> </tr> </table> `

exports['drawer-box/table'] = (get, $t) => `<div class='drawer-group'> <table> <tr> <td class='label-cnt'> <label>Style</label> <span prop-update='style'>` + (get("style")()['id']()) + `</span> </td> <td class='label-cnt'> <label>Finishing</label> ` + (get("finishing")()['id']()) + ` </td> <td class='label-cnt'> <label>Sides</label> ` + (get("sides")().id()) + ` </td> <td class='label-cnt'> <label>Bottom</label> ` + (get("bottom")().id()) + ` </td> </tr> </table> <div ` + (get("options").length > 0 ? 'class="options-cnt"' : ' hidden') + `> <b class='tab'>Options</b> <div style='padding-left: 20pt;'> ` + (new $t('<div > {{option.name()}} </div>').render(get('scope'), 'option in options', get)) + ` </div> </div> <table> <tr> <th>#</th> <th>Quantity</th> <th>Length</th> <th>Width</th> <th>Depth</th> <th>Notes</th> <th>Ea</th> <th>Total</th> </tr> ` + (new $t('<tr > <td>{{drawer.index()}}</td> <td>{{drawer.quantity()}}</td> <td>{{drawer.widthPrint()}}</td> <td>{{drawer.heightPrint()}}</td> <td>{{drawer.depthPrint()}}</td> <td>{{drawer.notes() || \'\'}}</td> <td>{{drawer.each()}}</td> <td>{{drawer.cost()}}</td> </tr>').render(get('scope'), 'drawer in list', get)) + ` <tr> <td class='no-border'></td> <td class='no-border'></td> <td class='no-border'></td> <td class='no-border'></td> <td class='no-border'></td> <td class='no-border'></td> <td class='no-border'></td> <td>` + (get("cost")()) + `</td> </tr> </table> <br><br> </div> `

exports['-586032472'] = (get, $t) => `<div > ` + (get("option").name()) + ` </div>`

exports['-1388459236'] = (get, $t) => `<tr > <td>` + (get("drawer").index()) + `</td> <td>` + (get("drawer").quantity()) + `</td> <td>` + (get("drawer").widthPrint()) + `</td> <td>` + (get("drawer").heightPrint()) + `</td> <td>` + (get("drawer").depthPrint()) + `</td> <td>` + (get("drawer").notes() || '') + `</td> <td>` + (get("drawer").each()) + `</td> <td>` + (get("drawer").cost()) + `</td> </tr>`

  });


RequireJS.addFunction('../../public/js/utils/$t.js',
  function (require, exports, module) {
    
const CustomEvent = require('./custom-error');
const ExprDef = require('./expression-definition');

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

module.exports = $t;

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


Function.safeStdLibAddition(String, 'random',  function (len) {
    len = len || 7;
    let str = '';
    while (str.length < len) str += Math.random().toString(36).substr(2);
    return str.substr(0, len);
}, true);

Function.safeStdLibAddition(Object, 'getSet',   function () {
  let values = {};
  let attrs = Array.from(arguments);
  attrs.forEach((attr) => {
    this[attr] = (value) => {
      if (value === undefined) {
        const noDefaults = (typeof this.defaultGetterValue) !== 'function';
        if (values[attr] !== undefined || noDefaults)
        return values[attr];
        return this.defaultGetterValue(attr);
      }
      values[attr] = value;
    }
  });
  const origToJson = this.toJson;
  this.toJson = () => {
    const json = (typeof origToJson === 'function') ? origToJson() : {};
    json._TYPE = this.constructor.name;
    attrs.forEach((attr) => {
      const value = this[attr]();
      if ((typeof value) === 'object') {
        if ((typeof value.toJson) === 'function') {
          json[attr] = value.toJson();
        } else if (Array.isArray(value)){
          const arr = [];
          value.forEach((val) => {
            if ((typeof val.toJson) === 'function') {
              arr.push(val.toJson());
            } else {
              arr.push(val);
            }
          });
          json[attr] = arr;
        } else {
          json[attr] = JSON.clone(value);
        }
      } else {
        json[attr] = value;
      }
    });
    return json;
  }
  this.fromJson = (json) => {
    attrs.forEach((attr) => {
      this[attr](json[attr]);
    });
    return this;
  }
});

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
});

Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
  const keys = Object.keys(obj);
  const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
                  Array.isArray(obj) ? [] : {};
  for(let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const member = obj[key];
    if ((typeof memeber) === 'object') {
      if ((typeof member.clone) === 'function') {
        clone[key] = member.clone();
      } else {
        clone[key] = JSON.clone(member);
      }
    } else {
      clone[key] = member;
    }
  }
  return clone;
}, true);

Function.safeStdLibAddition(String, 'parseSeperator',   function (seperator, isRegex) {
  if ((typeof this) !== 'string') {
    return {};
  }
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

Function.safeStdLibAddition(Object, 'pathValue', function (path, value) {
  const attrs = path.split('.');
  const lastIndex = attrs.length - 1;
  let currObj = this;
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
});

  });


RequireJS.addFunction('../../public/js/utils/custom-error.js',
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

module.exports = CustomEvent;

  });


RequireJS.addFunction('../../public/js/utils/decisionTree.js',
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

module.exports = DecisionTree;

  });


RequireJS.addFunction('../../public/js/utils/dom-utils.js',
  function (require, exports, module) {
    du = {create: {}, find: {}, class: {}, cookie: {}, param: {}, style: {},
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

function appendError(target, message) {
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
        temporaryStyle(elem, 2000, {
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


RequireJS.addFunction('../../public/js/utils/string-math-evaluator.js',
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

module.exports = StringMathEvaluator;

  });


RequireJS.addFunction('../../public/js/utils/measurment.js',
  function (require, exports, module) {
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

class Measurement {
  constructor(value) {
    if ((typeof value) === 'string') {
      value += ' '; // Hacky fix for regularExpression
    }

    let decimal = 0;
    let nan = false;
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

    function calculateValue(accuracy) {
      accuracy = accuracy || '1/1000'
      const fracObj = parseFraction(accuracy);
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
      return {integer, numerator, denominator};
    }

    this.fraction = (accuracy) => {
      if (nan) return NaN;
      const obj = calculateValue(accuracy);
      const integer = obj.integer !== 0 ? obj.integer : '';
      return `${integer}${reduce(obj.numerator, obj.denominator)}`;
    }

    this.decimal = (accuracy) => {
      if (nan) return NaN;
      const obj = calculateValue(accuracy);
      return obj.integer + (obj.numerator / obj.denominator);
    }

    if ((typeof value) === 'number') {
      decimal = value;
    } else if ((typeof value) === 'string') {
      try {
        decimal = parseFraction(value).decimal;
      } catch (e) {
        nan = true;
      }
    } else {
      nan = true;
    }
  }
}

Measurement.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;

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

module.exports = Measurement;

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


RequireJS.addFunction('../../public/js/utils/lists/expandable-list.js',
  function (require, exports, module) {
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
class ExpandableList {
  constructor(props) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const afterAddEvent = new CustomEvent('afterAdd');
    const afterRefreshEvent = new CustomEvent('afterRefresh');
    const instance = this;
    props.id = ExpandableList.lists.length;
    this.id = () => props.id;
    props.list = props.list || [];
    props.inputs = props.inputs || [];
    props.ERROR_CNT_ID = `expandable-error-msg-cnt-${this.id}`;
    props.inputTreeId = `expandable-input-tree-cnt-${this.id}`
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  du.find.closest(selector, target));
    this.findElement = props.findElement;
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    props.activeIndex = 0;
    ExpandableList.lists[props.id] = this;

    function setErrorMsg(msg) {
        document.getElementById(props.ERROR_CNT_ID).innerHTML = msg;
    }

    function values() {
      if (instance.hasInputTree()) return props.inputTree.values();
      const values = {};
      props.inputs.forEach((input) =>
        values[input.placeholder] = document.getElementById(input.id).value);
      return values;
    }

    this.add = () => {
      const inputValues = values();
      if ((typeof props.inputValidation) !== 'function' ||
              props.inputValidation(inputValues) === true) {
        props.list.push(props.getObject(inputValues));

        this.activeIndex(props.list.length - 1);
        this.refresh();
        afterAddEvent.trigger();
        if (this.hasInputTree) props.inputTree.formFilled();
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
      props.inputTree && props.inputTree.constructor.name === 'DecisionNode';
    if (this.hasInputTree())
      props.inputTree.onComplete(this.add);
    props.hasInputTree = this.hasInputTree;

    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (index) => {
      props.list.splice(index, 1);
      this.refresh();
    }
    this.html = () => ExpandableList[`${props.type}Template`].render(props);
    this.afterRender = (func) => afterRenderEvent.on(func);
    this.afterAdd = (func) => afterAddEvent.on(func);
    this.refresh = (type) => {
      props.type = (typeof type) === 'string' ? type : props.type;
      if (!pendingRefresh) {
        pendingRefresh = true;
        setTimeout(() => {
          props.inputs.forEach((input) => input.id = input.id || randomString(7));
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
    this.activeIndex = (value) => value === undefined ? props.activeIndex : (props.activeIndex = value);
    this.active = () => props.list[this.activeIndex()];
    this.value = (index) => (key, value) => {
      if (props.activeIndex === undefined) props.activeIndex = 0;
      if (index === undefined) index = props.activeIndex;
      if (storage[index] === undefined) storage[index] = {};
      if (value === undefined) return storage[index][key];
      storage[index][key] = value;
    }
    this.set = (index, value) => props.list[index] = value;
    this.get = (index) => props.list[index];
    this.renderBody = (target) => {
      const headerSelector = `.expand-header[ex-list-id='${props.id}'][index='${this.activeIndex()}']`;
      target = target || document.querySelector(headerSelector);
      if (target !== null) {
        const id = target.getAttribute('ex-list-id');
        const list = ExpandableList.lists[id];
        const headers = du.find.up('.expandable-list', target).querySelectorAll('.expand-header');
        const bodys = du.find.up('.expandable-list', target).querySelectorAll('.expand-body');
        const rmBtns = du.find.up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
        headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
        bodys.forEach((body) => body.style.display = 'none');
        rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
        const body = list.findElement('.expand-body', target);
        body.style.display = 'block';
        const index = target.getAttribute('index');
        this.activeIndex(index);
        body.innerHTML = this.htmlBody(index);
        target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
        target.className += ' active';
        afterRenderEvent.trigger();
        // scrollIntoView(target.parentElement, 3, 25, document.body);
      }
    };
    afterRefreshEvent.on(() => {if (!props.startClosed)this.renderBody()});

    this.htmlBody = (index) => props.getBody(props.list[index], index);
    this.getList = () => props.list;
    this.refresh();
  }
}
ExpandableList.lists = [];
ExpandableList.listTemplate = new $t('expandable/list');
ExpandableList.pillTemplate = new $t('expandable/pill');
ExpandableList.sidebarTemplate = new $t('expandable/sidebar');
ExpandableList.getIdAndIndex = (target) => {
  const cnt = du.find.up('.expand-header,.expand-body', target);
  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
  const index = Number.parseInt(cnt.getAttribute('index'));
  return {id, index};
}
ExpandableList.getValueFunc = (target) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].value(idIndex.index);
}

ExpandableList.get = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].get(idIndex.index);
}

ExpandableList.set = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  ExpandableList.lists[idIndex.id].set(idIndex.index, value);
}

ExpandableList.value = (key, value, target) => {
  return ExpandableList.getValueFunc(target)(key, value);
}
du.on.match('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  ExpandableList.lists[id].add();
});
du.on.match('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const index = target.getAttribute('index');
  ExpandableList.lists[id].remove(index);
});
ExpandableList.closeAll = (header) => {
  const hello = 'world';
}

du.on.match('click', '.expand-header', (target, event) => {
  const isActive = target.matches('.active');
  const id = target.getAttribute('ex-list-id');
  const list = ExpandableList.lists[id];
  if (list) {
    if (isActive && !event.target.tagName.match(/INPUT|SELECT/)) {
      target.className = target.className.replace(/(^| )active( |$)/g, '');
      list.findElement('.expand-body', target).style.display = 'none';
      list.activeIndex(null);
      target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
    } else if (!isActive) {
      list.renderBody(target);
    }
  }
});

  });


RequireJS.addFunction('../../public/js/utils/input/input.js',
  function (require, exports, module) {
    
const $t = require('../$t');
const du = require('../dom-utils');

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
class Input {
  constructor(props) {
    let hidden = props.hide || false;
    const instance = this;
    this.type = props.type;
    this.label = props.label;
    this.name = props.name;
    this.id = props.id || `input-${String.random(7)}`;
    const forAll = Input.forAll(this.id);
    this.hidden = () => hidden;
    this.hide = () => forAll((elem) => {
      const cnt = du.find.up('.input-cnt', elem);
      hidden = cnt.hidden = true;
    });
    this.show = () => forAll((elem) => {
      const cnt = du.find.up('.input-cnt', elem);
      hidden = cnt.hidden = false;
    });
    this.placeholder = props.placeholder;
    this.class = props.class;
    this.list = props.list || [];

    let valid;
    let value = props.value;
    props.targetAttr = props.targetAttr || 'value';
    this.targetAttr = () => props.targetAttr;

    props.errorMsg = props.errorMsg || 'Error';

    this.errorMsgId = props.errorMsgId || `error-msg-${this.id}`;
    const idSelector = `#${this.id}`;

    const html = this.constructor.html(this);
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = () =>
     html();

    function valuePriority (func) {
      return (elem, event) => func(elem[props.targetAttr], elem, event);
    }
    this.attrString = () => Input.attrString(this.targetAttr(), this.value());

    function getElem(id) {return document.getElementById(id);}
    this.get = () => getElem(this.id);

    this.on = (eventType, func) => du.on.match(eventType, idSelector, valuePriority(func));
    this.valid = () => valid === undefined ? this.setValue() : valid;
    this.setValue = (val) => {
      const elem = getElem(this.id);
      if (val === undefined){
        if (elem) val = elem[props.targetAttr]
        if (val === undefined) val = props.default;
      }
      if(this.validation(val)) {
        valid = true;
        value = val;
        if (elem) elem[props.targetAttr] = val;
        return true;
      }
      valid = false;
      value = undefined;
      return false;
    }
    this.value = () => {
      const unformatted = (typeof value === 'function') ? value() : value || '';
      return (typeof props.format) !== 'function' ? unformatted : props.format(unformatted);
    }
    this.doubleCheck = () => {
      valid = undefined;
      validate();
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

    const validate = (target) => {
      target = target || getElem(instance.id);
      if (target) {
        if (this.setValue(target[props.targetAttr])) {
          getElem(this.errorMsgId).innerHTML = '';
          valid = true;
        } else {
          getElem(this.errorMsgId).innerHTML = props.errorMsg;
          valid = false;
        }
      }
    }

    if (props.clearOnClick) {
      du.on.match(`mousedown`, `#${this.id}`, () => {
        const elem = getElem(this.id);
        if (elem) elem.value = '';
      });
    }
    du.on.match(`change`, `#${this.id}`, validate);
    du.on.match(`keyup`, `#${this.id}`, validate);
  }
}

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

module.exports = Input;

  });


RequireJS.addFunction('../../public/js/utils/input/decision/decision.js',
  function (require, exports, module) {
    
const DecisionTree = require('../../decisionTree.js');
const Input = require('../input.js');
const du = require('../../dom-utils');
const $t = require('../../$t');

class DecisionInputTree extends DecisionTree {
  constructor(name, inputArrayOinstance, onComplete) {
    const rootClass = `decision-input-${String.random()}`;
    class DecisionInput {
      constructor(name, inputArrayOinstance, decisionTreeId) {
        this.name = name;
        this.decisionTreeId = decisionTreeId;
        this.id = `decision-input-node-${String.random()}`;
        this.childCntId = `decision-child-ctn-${String.random()}`
        this.values = () => root.values()
        this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance, this.values);
        this.class = rootClass;
        this.getValue = (index) => this.inputArray[index].value();

        this.html = () => {
          return DecisionInput.template.render(this);
        }

        this.childHtml = (index) => {
          const node = getNode(this._nodeId);
          const nextNode = next(node, index);
          return nextNode !== undefined ? nextNode.payload.html() : '';
        }
      }
    }
    DecisionInput.template = new $t('input/decision/decision');

    super(name, new DecisionInput(name, inputArrayOinstance, `decision-tree-${String.random()}`));
    if ((typeof name) !== 'string') throw Error('name(arg2) must be defined as a string');


    const root = this;
    const onCompletion = [];
    const onChange = [];
    this.treeId = String.random();
    this.buttonClass = `tree-submit`;
    const buttonSelector = `.${this.buttonClass}[tree-id='${this.treeId}']`;
    this.class = `decision-input-tree`;
    const getNode = this.getNode;
    const parentAddState = this.addState;
    const parentAddStates = this.addStates;

    this.addState = (name, payload) => parentAddState(name, new DecisionInput(name, payload)) && this;
    this.addStates = (sts) => {
      const states = {};
      const keys = Object.keys(sts);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        states[key] = new DecisionInput(key, sts[key]);
      }
      return parentAddStates(states)
    }

    function getInput(name) {
      let answer;
      forEachInput((input) => answer = input.name === name ? input : answer);
      return answer;
    }

    this.set = (name, value) => {
      const input = getInput(name);
      input.setValue(value);
    }

    const next = (node, index) => {
      const inputArray = node.payload.inputArray;
      const input = inputArray[index];
      const name = input.name;
      const value = node.payload.getValue(index);
      return node.next(`${name}:${value}`) || node.next(name);
    }

    function forEachInput(func) {
      let nodes = [root];
      while (nodes.length !== 0) {
        const node = nodes[0];
        const inputs = node.payload.inputArray;
        for (let index = 0; index < inputs.length; index += 1) {
          const input = inputs[index];
          func(inputs[index]);
          const nextNode = next(node, index);
          if (nextNode) nodes.push(nextNode);
        }
        nodes.splice(0, 1);
      }
    }

    function formFilled() {
      let filled = true;
      forEachInput((input) => filled = filled && input.doubleCheck());
      const addBtn = document.querySelector(buttonSelector);
      if (addBtn) addBtn.disabled = !filled;
      return filled;
    }

    this.formFilled = formFilled;

    function values() {
      const values = {};
      forEachInput((input) => values[input.name] = input.value());
      return values;
    }
    this.values = values;

    const contengencies = {};
    this.contengency = (subject, master) => {
      if (contengencies[master] === undefined) contengencies[master] = [];
      contengencies[master].push(subject);
    }

    this.update = (target) => {
      const parentDecisionCnt = du.find.up(`.${rootClass}`, target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const index = parentDecisionCnt.getAttribute('index');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          const currentInput = currentNode.payload.inputArray[index];
          currentInput.setValue();
          (contengencies[currentInput.name] || []).forEach((inputName) => {
            const contengentInput = getInput(inputName);
            if (contengentInput)
              contengentInput.doubleCheck();
          });
          runFunctions(onChange, currentInput.name, currentInput.value(), target);
          const stepLen = Object.keys(currentNode.states).length;
          if (stepLen) {
            const inputCount = currentNode.payload.inputArray.length;
            const nextState = next(currentNode, index);
            const childCntId = currentNode.payload.inputArray[index].childCntId;
            const childCnt = document.getElementById(childCntId);
            if (nextState) {
              childCnt.innerHTML = DecisionInput.template.render(nextState.payload);
            } else {
              childCnt.innerHTML = '';
            }
          }
        }
      }

      formFilled();
    }

    this.html = () =>
      DecisionInputTree.template.render(this);
    function on(func, funcArray) {
      if ((typeof func) === 'function') funcArray.push(func);
    };
    this.onChange = (func) => on(func, onChange);
    this.onComplete = (func) => on(func, onCompletion);

    this.onComplete(onComplete);

    function runFunctions(funcArray, ...args) {
      for(let index = 0; index < funcArray.length; index += 1) {
        funcArray[index].apply(null, args);
      }
    }

    const inputSelector = `.${rootClass} > div > input,select`;
    du.on.match('change', inputSelector, this.update);
    du.on.match('keyup', inputSelector, this.update);
    du.on.match('click', buttonSelector, () => {
      const vals = values();
      runFunctions(onCompletion, values);
    });
  }
}

DecisionInputTree.validateInput = (inputArrayOinstance, valuesFunc) => {
  if (Array.isArray(inputArrayOinstance)) {
    inputArrayOinstance.forEach((instance) => {
      if (!(instance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
      const parentValidate = instance.validation;
      instance.validation = (value) => parentValidate(value, valuesFunc());
      instance.childCntId = `decision-child-ctn-${String.random()}`
    });
    return inputArrayOinstance;
  }
  if (!(inputArrayOinstance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
  inputArrayOinstance.childCntId = `decision-child-ctn-${String.random()}`
  return [inputArrayOinstance];
}

DecisionInputTree.template = new $t('input/decision/decisionTree');

module.exports = DecisionInputTree;

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
const StringMathEvaluator = require('../../string-math-evaluator');

class MeasurementInput extends Input {
  constructor(props) {
    super(props);
    props.validation = (value) => typeof MeasurementInput.eval(value) === 'number';
    props.errorMsg = 'Invalid Mathematical Expression';
    const parentValue = this.value;
    this.value = () => MeasurementInput.eval(parentValue());
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);
MeasurementInput.eval = new StringMathEvaluator(Math).eval;

MeasurementInput.len = (value) => new MeasurementInput({
  type: 'text',
  placeholder: 'Length',
  name: 'length',
  class: 'center',
  value
});
MeasurementInput.width = (value) => new MeasurementInput({
  type: 'text',
  placeholder: 'Width',
  name: 'width',
  class: 'center',
  value
});
MeasurementInput.height = (value) => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Height',
  name: 'height',
  class: 'center',
  value
});
MeasurementInput.depth = (value) => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'depth',
  class: 'center',
  value
});
MeasurementInput.cost = () => new MeasurementInput({
  type: 'number',
  label: '$',
  placeholder: 'Cost',
  name: 'cost',
  value
});
MeasurementInput.pattern = (id, value) => new MeasurementInput({
  type: 'text',
  label: id,
  value,
  placeholder: id,
  name: id,
  class: 'pattern-input',
});

MeasurementInput.offsetLen = () => new MeasurementInput({
  type: 'text',
  label: 'Offset',
  placeholder: 'Length',
  name: 'offsetLength',
  class: 'center',
});
MeasurementInput.offsetWidth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'offsetWidth',
  class: 'center',
});
MeasurementInput.offsetDepth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'offsetDepth',
  class: 'center',
});

module.exports = MeasurementInput;

  });


RequireJS.addFunction('../../public/js/utils/input/styles/select/relation.js',
  function (require, exports, module) {
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


RequireJS.addFunction('src/utils.js',
  function (require, exports, module) {
    
const objectResolver = require('./object-resolver.js');

function FROM_JSON (json) {
  if (Array.isArray(json)) {
    const arr = [];
    json.forEach((value) => {
      if ((typeof value) === 'object') {
        arr.push(FROM_JSON(value));
      } else {
        arr.push(value);
      }
    });
    return arr;
  }
  const keys = Object.keys(json);
  keys.forEach((key) => {
    if (key !== '_TYPE') {
      const value = json[key];
      if ((typeof value) === 'object') {
        json[key] = FROM_JSON(value);
      } else {
        json[key] = value;
      }
    }
  });
  return objectResolver(json);
}

exports.FROM_JSON = FROM_JSON;

  });


RequireJS.addFunction('src/objects/drawer-list.js',
  function (require, exports, module) {
    
const Collection = require('../../../../public/js/utils/collections/collection');

class DrawerList {
  constructor() {
    const instance = this;
    const list = [];
    const byId = {};
    const uniqueId = String.random();
    this.uniqueId = () => uniqueId;


    this.add = (drawerBox) => {
      list.push(drawerBox);
      byId[drawerBox.id()];
    }

    const collectionMembers = ['style', 'finishing', 'sides', 'bottom', 'route', 'branding', 'notch', 'scoop'];
    this.collection = (drawerBox) =>
        Collection.create(collectionMembers, list);

  }
}

module.exports = DrawerList;

  });


RequireJS.addFunction('src/objects/lookup.js',
  function (require, exports, module) {
    class Lookup {
  constructor(id) {
    id = id || String.random();
    console.log('creating lookup: ', id)
    this.getSet('id');
    this.id = () => id;
    const cxtr = this.constructor;
    if(cxtr.selectList === Lookup.selectList) {
      cxtr.get = (id) => Lookup.get(cxtr.name, id);
      Lookup.byId[cxtr.name] = {};
      cxtr.selectList = () => Lookup.selectList(cxtr.name);
    }
    if (Lookup.register[cxtr.name] === undefined)
      Lookup.register[cxtr.name] = {};
    Lookup.register[cxtr.name][id] = this;
    Lookup.byId[cxtr.name][id] = this;
    this.toString = () => this.id();
  }
}

Lookup.register = {};
Lookup.byId = {};
Lookup.get = (cxtrName, id) =>
    Lookup.byId[cxtrName][id];
Lookup.selectList = (className) => {
  return Object.keys(Lookup.register[className]);
}

module.exports = Lookup;

  });


RequireJS.addFunction('src/objects/order-info.js',
  function (require, exports, module) {
    
const DrawerList = require('./drawer-list');

class OrderInfo {
  constructor() {
    this.defaultGetterValue = () => '';
    Function.getSet.apply(this, ['jobName', 'todaysDate', 'dueDate', 'companyName',
    'shippingAddress', 'billingAddress', 'phone', 'fax', 'salesRep', 'email',
    'shipVia', 'invoiceNumber', 'poNumber']);

    const drawerList = new DrawerList();
    this.todaysDate(new Date().toISOString().split('T')[0]);

    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    this.dueDate(twoWeeks.toISOString().split('T')[0]);

    this.invoiceNumber(String.random());

    const drawerMap = {};
    this.drawerList = () => drawerList;

  }
}

module.exports = OrderInfo;

  });


RequireJS.addFunction('src/objects/lookup/drawer-box.js',
  function (require, exports, module) {
    
const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator');
const Lookup = require('../lookup.js');
const Option = require('./option.js');

class DrawerBox extends Lookup {
  constructor (values) {
    super();
    values = values || {};
    Function.getSet.apply(this, ['style', 'finishing', 'sides', 'bottom',
        'quantity', 'notes', 'height', 'width', 'depth', 'options']);
    this.style(values.style);
    this.finishing(values.finishing);
    this.sides(values.sides);
    this.bottom(values.bottom);
    this.quantity(values.quantity);
    this.notes(values.notes);

    this.height(DrawerBox.eval(values.height));
    this.width(DrawerBox.eval(values.width));
    this.depth(DrawerBox.eval(values.depth));
    const setters = {height: this.height, width: this.width, depth: this.depth};
    const sizeFormatter = (attr) => (value) => {
      if (value !== undefined) setters[attr](value);
      return DrawerBox.eval(setters[attr]());
    }

    this.height = sizeFormatter('height');
    this.width = sizeFormatter('width');
    this.depth = sizeFormatter('depth');

    this.heightPrint = () => DrawerBox.simplify(this.height());
    this.widthPrint = () => DrawerBox.simplify(this.width());
    this.depthPrint = () => DrawerBox.simplify(this.depth());

    this.route = () => values['Radius Top Edge After Assembly'] !== undefined;
    this.branding = () => values['Branding Inside of Box'] !== undefined;
    this.notch = () => values['Notch & Drill w/1/2" Inset Bottom for Under Mount Slides'] !== undefined;
    this.scoop = () => values['Standard Scoop'] !== undefined;

    this.index = () => DrawerBox.index(this);
    let options = [];
    this.options = (ops) => {
      if (Array.isArray(ops)) options = ops.filter((val) => val instanceof Option);
      return JSON.clone(options);
    }
    Object.values(values).forEach((value) => {
      if (value instanceof Option) {
        options.push(value);
      }
    });
    this.cost = (quantity) => {
      quantity = quantity > 0 ? quantity : this.quantity();
      let optionCost = 0;
      options.forEach((option) => optionCost += option.cost());
      const radius = this.route() ? this.route().cost() : 0;
      const width = this.width();
      const height = this.height();
      const depth = this.depth();
      if (!Number.isNaN(width + height + depth)) {
        const sides = this.sides();
        const multiplier = height <= 8 ? sides.multiplier() : sides.tallMultiplier();
        const drawerSides = (width + depth) * 2 * height / 144 * multiplier;
        const drawerBottom = width * height / 144 * this.bottom().cost();
        const style = this.style().cost();
        let cost = drawerSides + drawerBottom + this.finishing().cost() + optionCost + style;
        cost *= Number.parseInt(quantity);
        return StringMathEvaluator.round(cost, '1/100');
      }
      return NaN;
    }
    this.each = () => this.cost(1);
  }
}

DrawerBox.idMap = {};
DrawerBox.resetCount = () => {
  DrawerBox.count = 1;
  DrawerBox.idMap = {};
}
DrawerBox.index = (drawer) => {
  const idMap = DrawerBox.idMap;
  const unqId = drawer.id();
  if (!idMap[unqId]) idMap[unqId] = DrawerBox.count++;
  return idMap[unqId];
}
DrawerBox.eval = new StringMathEvaluator().eval;
DrawerBox.simplify = (value) => {
  const decimal = DrawerBox.eval(value);
  return StringMathEvaluator.toFraction(decimal, '1/16');
}

module.exports = DrawerBox;

  });


RequireJS.addFunction('src/objects/lookup/option.js',
  function (require, exports, module) {
    
const Lookup = require('../lookup.js');

class Option extends Lookup {
  constructor(name, cost) {
    super(name, cost);
    this.getSet('cost');
    this.cost(cost);
    let input;

    // TODO: MOVE!
    this.input = () => {
      const Input = require('../../../../../public/js/utils/input/input');
      if (input === undefined) {
        input = new Input({
          label: name,
          name: this.id(),
          type: 'checkbox',
          default: false,
          validation: [true, false],
          format: (bool) => bool ? Option.get(name) : undefined,
          targetAttr: 'checked'
        });

      }
      return input;
    };
  }
}

module.exports = Option;

  });


RequireJS.addFunction('src/objects/lookup/per-box-cost.js',
  function (require, exports, module) {
    
const Lookup = require('../lookup.js');

class PerBoxCost extends Lookup {
  constructor(name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

module.exports = PerBoxCost;

  });


RequireJS.addFunction('src/objects/lookup/style.js',
  function (require, exports, module) {
    
const Lookup = require('../lookup.js');

class Style extends Lookup {
  constructor (name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

module.exports = Style;

  });


RequireJS.addFunction('src/objects/lookup/bottom-material.js',
  function (require, exports, module) {
    
const Lookup = require('../lookup.js');


class BottomMaterial extends Lookup {
  constructor (name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

// TODO: MOVE!
BottomMaterial.select = function () {
  const Select = require('../../../../../public/js/utils/input/styles/select');
  const list = [];
  for (let index = 0; index < arguments.length; index += 1) {
    const bm = arguments[index];
    list.push(bm.id());
  }
  return new Select({
    label: 'Bottom',
    name: 'bottom',
    format: BottomMaterial.get,
    list
  });
}

module.exports = BottomMaterial;

  });


RequireJS.addFunction('src/objects/lookup/box-material.js',
  function (require, exports, module) {
    
const Lookup = require('../lookup.js');

class BoxMaterial extends Lookup {
  constructor (name, multiplier, tallMultiplier) {
    super(name);
    this.getSet('multiplier', 'tallMultiplier');
    this.multiplier(multiplier);
    this.tallMultiplier(tallMultiplier);
  }
}

module.exports = BoxMaterial;

  });


RequireJS.addFunction('src/object-resolver.js',
  function (require, exports, module) {
    const DrawerBox = require('../src/objects/lookup/drawer-box.js');
const BoxMaterial = require('../src/objects/lookup/box-material.js');
const BottomMaterial = require('../src/objects/lookup/bottom-material.js');
const Option = require('../src/objects/lookup/option.js');
const Style = require('../src/objects/lookup/style.js');
const PerBoxCost = require('../src/objects/lookup/per-box-cost.js');
const OrderInfo = require('../src/objects/order-info.js');
const Lookup = require('../src/objects/lookup.js');

function objectResolver(obj) {
    const type = obj._TYPE;
    switch(type) {
      case 'DrawerBox': return new DrawerBox(obj.id).fromJson(obj);
      case 'BoxMaterial': return new BoxMaterial(obj.id).fromJson(obj);
      case 'BottomMaterial': return new BottomMaterial(obj.id).fromJson(obj);
      case 'Option': return new Option(obj.id).fromJson(obj);
      case 'Style': return new Style(obj.id).fromJson(obj);
      case 'PerBoxCost': return new PerBoxCost(obj.id).fromJson(obj);
      case 'OrderInfo': return new OrderInfo(obj.id).fromJson(obj);
      case 'Lookup': return new Lookup(obj.id).fromJson(obj);
      default: return JSON.clone(obj);
    }
  }

  module.exports = objectResolver;

  });


RequireJS.addFunction('app/app.js',
  function (require, exports, module) {
    
const $t = require('./../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));
require('./../../../public/js/utils/utils.js')

const OrderInfo = require('../src/objects/order-info.js');
const Input = require('./../../../public/js/utils/input/input.js');
const Select = require('./../../../public/js/utils/input/styles/select.js');
const MeasurementInput = require('./../../../public/js/utils/input/styles/measurement.js');
const DrawerBox = require('../src/objects/lookup/drawer-box.js');
const BottomMaterial = require('../src/objects/lookup/bottom-material.js');
const BoxMaterial = require('../src/objects/lookup/box-material.js');
const Option = require('../src/objects/lookup/option.js');
const PerBoxCost = require('../src/objects/lookup/per-box-cost.js');
const Style = require('../src/objects/lookup/style.js');
const DecisionInputTree = require('./../../../public/js/utils/input/decision/decision')
const DrawerList = require('../src/objects/drawer-list')
const FROM_JSON = require('../src/utils').FROM_JSON;

const orderInfo = new OrderInfo();
orderInfo.jobName('plankys');
orderInfo.companyName('planks');
orderInfo.shippingAddress('909 wabash ave');
orderInfo.billingAddress('908 wisconsin dr');
orderInfo.phone('2172548654');
orderInfo.fax('faxy');
orderInfo.salesRep('greg');
orderInfo.email('me@awesome.cool');

const phoneNum = new Input({
  label: 'Phone Number',
  name: 'phoneNumber',
  validation: (value) => value.replace(/[^0-9]/g, '').length === 10,
  default: '',
  format: (value) => {
    const nums = value.replace(/[^0-9]/g, '');
    if (nums.length !== 10) return '';
    const areaCode = nums.substr(0,3);
    const prefix = nums.substr(3, 3);
    const suffix = nums.substr(6);
    return `(${areaCode})${prefix}\-${suffix}`;
  }
});

const width = MeasurementInput.width(15);
const height = MeasurementInput.height(6);
const depth = MeasurementInput.depth(21);
const dems = [width, height, depth];

new BoxMaterial('Select White Soft Maple', 6, 6.65);
new BoxMaterial('Select Read Oak', 5.5, 6.15);
new BoxMaterial('Select Walnut', 11, 11.65);
new BoxMaterial('Rustic Walnut', 7, 7.65);
new BoxMaterial('Bass Wood', 5, 5.65);

const maple14 = new BottomMaterial('1/4" Maple A4', 2);
const maple12 = new BottomMaterial('1/2" Maple B1', 3);

const birtch14 = new BottomMaterial('1/4" Baltic Birtch BB/BB VC', .96);
const birtch12 = new BottomMaterial('1/2" Baltic Birtch BB/BB VC', 1.75);

const redOak14 = new BottomMaterial('1/4" Red Oak RC A3 VC', 2);
const redOak12 = new BottomMaterial('1/2" Red Oak RC A3 VC', 3);

const walnut14b = new BottomMaterial('1/4" Walnut B2 VC', 3.3);
const walnut14a = new BottomMaterial('1/4" Walnut A4 MDF Core', 3.32);
const walnut12 = new BottomMaterial('1/2" Walnut A1 Only VC', 4.62);

new PerBoxCost('Unassembles w/o Bottoms', 6);
new PerBoxCost('Unassembles w Bottoms', 8);
new PerBoxCost('Assembled Unfinished', 10);
new PerBoxCost('Assembled Prefinished - 1 Topcoat', 16);
new PerBoxCost('Assembled Prefinished - 2 Topcoat', 20);

const radius = new Option('Radius Top Edge After Assembly', 3).input();
const notch = new Option('Notch & Drill w/1/2" Inset Bottom for Under Mount Slides', 1.5).input();
const braning = new Option('Branding Inside of Box', 1.5).input();
const scoop = new Option('Standard Scoop', 3).input();

new Style('Standard', 0);
new Style('Scalloped Sides', 5);
new Style('Full Dovetail Pluming Notch', 35);
new Style('Signature Trash Rollout', 30);
new Style('Corner Drawers w/Dovetailed 90&#176; Corner & Glue & Pin 135&#176; Corner', 40);

const finishing = new Select({
  name: 'finishing',
  class: 'center',
  format: PerBoxCost.get,
  list: PerBoxCost.selectList(),
});

const style = new Select({
  name: 'style',
  class: 'center',
  list: Style.selectList(),
  format: Style.get,
});

const typeList = BoxMaterial.selectList();
const type = new Select({
  label: 'Sides',
  name: 'sides',
  class: 'center',
  format: BoxMaterial.get,
  list: typeList,
});

const quantity = new Input({
  label: 'Quantity',
  name: 'quantity',
  type: 'number',
  value: 1
});

const notes = new Input({
  label: 'Notes',
  name: 'notes',
  type: 'text'
});

const softMapleBottoms = BottomMaterial.select(maple14, maple12, birtch14, birtch12);
const redOakBottoms = BottomMaterial.select(redOak14, redOak12);
const selWalnutBottoms = BottomMaterial.select(walnut12, walnut14a, walnut14b);
const rusWalnutBottoms = BottomMaterial.select(walnut12, walnut14b);
const bassBottoms = BottomMaterial.select(maple14, maple12, birtch14, birtch12);

const decisionInput = new DecisionInputTree('Add Box',
  [style, finishing, type, notch, braning, scoop, width, height, depth, quantity, notes]);

decisionInput.addStates({softMapleBottoms, redOakBottoms, selWalnutBottoms,
          bassBottoms, rusWalnutBottoms,
          radius});

const finishValues = Object.values(PerBoxCost.selectList());
decisionInput.then(`finishing:${finishValues[2]}`)
        .jump('radius');
decisionInput.then(`finishing:${finishValues[3]}`)
        .jump('radius');

const typeNames = Object.values(typeList);
decisionInput.then(`sides:${typeNames[0]}`)
        .jump('softMapleBottoms');
decisionInput.then(`sides:${typeNames[1]}`)
        .jump('redOakBottoms');
decisionInput.then(`sides:${typeNames[2]}`)
        .jump('selWalnutBottoms');
decisionInput.then(`sides:${typeNames[3]}`)
        .jump('rusWalnutBottoms');
decisionInput.then(`sides:${typeNames[4]}`)
        .jump('bassBottoms');

function sendEmail() {
    var email = 'jozsef.morrissey@gmail.com';
    var subject = 'drawer order';
    let html = du.id('drawer-form').outerHTML;
    var emailBody = encodeURIComponent(html);
    document.location = "mailto:"+email+"?subject="+subject+"&body="+emailBody;
}

du.on.match('click', '#submit', sendEmail);


decisionInput.onChange(() => {
  const box = new DrawerBox(decisionInput.values());

  const cost = box.cost();
  if (cost) du.id('current-cost').innerHTML = cost;
  else du.id('current-cost').innerHTML = '';
});

const orderTemplate = new $t('drawer-box/order-info');
const tableTemplate = new $t('drawer-box/table');
decisionInput.onComplete(() => {
  const box = new DrawerBox(decisionInput.values());
  const drawerList = orderInfo.drawerList();
  drawerList.add(box);
  const collection = drawerList.collection();
  DrawerBox.resetCount();
  du.id('order-cnt').innerHTML = orderTemplate.render(orderInfo);
  du.id('table-cnt').innerHTML = tableTemplate.render(collection);
  let totalCost = 0;
  collection.forEach((drawerList) => totalCost += drawerList.cost());
  du.id('total-cost').innerHTML = totalCost;

  console.log(collection);
});


du.id('order-info-cnt').innerHTML = orderTemplate.render(orderInfo);
du.input.bind('.dynamic', orderInfo, {inputs: {phone: phoneNum}});

// const headTemplate = new $t('drawer-box/head');
// const bodyTemplate = new $t('drawer-box/body');
// const expListProps = {
//   parentSelector: `#box-list`,
//   inputTree:   decisionInput,
//   getHeader: (scope) => headTemplate.render(scope),
//   getBody: (scope) => bodyTemplate.render(scope),
//   getObject: (values) => new DrawerBox(values),
//   listElemLable: 'Drawer B'
// };
// const expandList = new ExpandableList(expListProps);
du.id('cost-tree').innerHTML = decisionInput.html();

this.editClass = () => `drawer-list`;
du.input.bind(`.${this.editClass()}`, this, {inputs: {style}});

  });


window.onload = () => RequireJS.init('app/app.js')
