


const moduleExists = (typeof module) !== 'undefined';

if (moduleExists) {
CustomEvent = require('./custom-event');
ExprDef = require('./expression-definition');
}

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

		const relationalProps = {opening: /((!==|===|!=|==|\<|\>|\<\=|\>\=|\|\||\||&&|&))/};
    const signProps = {opening: /([-+\!])/};
		const ternaryProps = {opening: /\?/};
		const keyWordProps = {opening: /(new|null|undefined|typeof|NaN|true|false)[^a-z^A-Z]/, tailOffset: -1};
		const ignoreProps = {opening: /new \$t\('.*?'\).render\(.*?, (.*?), get\)/};
		const commaProps = {opening: /,/};
		const colonProps = {opening: /:/};
		const multiplierProps = {opening: /([-+*\/](=|))/};
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

		function resolve(str) {
			return ExprDef.parse(expression, str);
		}

		function compile() {
			const blocks = isolateBlocks(template);
			let str = template;
			for (let index = 0; index < blocks.length; index += 1) {
				const parced = resolve(blocks[index]);
				str = str.replace(`{{${block}}}`, `\` + $t.clean(${parced}) + \``);
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
				const t = templateName === instance.id() ? instance : eval(`new $t(\`${template}\`)`);
        let resolvedScope = "get('scope')";;
        try {
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

		// format: <[tagName]:t .*$t-id='[templateName]'.*>[scopeVariableName]</[tagName]:t>
		const templateReg = /<([a-zA-Z-]*):t( ([^>]* |))\$t-id=("|')([^>^\4]*?)\4([^>]*>(((?!(<\1:t[^>]*>|<\/\1:t>)).)*)<\/)\1:t>/;
		function formatTemplate(string) {
			let match;
			while (match = string.match(templateReg)) {
				let tagContents = match[7];
				let tagName = match[1];
				let template = `<${tagName}${tagContents}${tagName}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
				let templateName = match[0].replace(/.*\$t-id=('|")([0-9\.a-zA-Z-_\/]*?)(\1).*/, '$2');
				template = templateName !== tagContents ? templateName : template;
				console.log("Template!!!", template)
				let resolvedScope = ExprDef.parse(expression, match[7] || "scope");
				string = string.replace(match[0], `{{ new $t('${templateName}').render(get('${resolvedScope}'), undefined, get)}}`);
			}
			return string;
		}

		// const ifReg = /<([a-zA-Z-]*):t( ([^>]* |))\$t-if=("|')([^>^\4]*?)\4([^>]*>(((?!(<\1:t[^>]*>|<\/\1:t>)).)*)<\/)\1:t>/;
		// function formatIf(string) {
		// 	let match;
		// 	while (match = string.match(ifReg)) {
		// 		let tagContents = match[7];
		// 		let tagName = match[1];
		// 		let realScope = match[7];
		// 		let template = `<${tagName}${tagContents}${tagName}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
		// 		let conditionStr = match[0].replace(/.*\$t-if=('|")([0-9\.a-zA-Z-_\/]*?)(\1).*/, '$2');
		// 		let condition = resolve(conditionStr);
		// 		string = string.replace(match[0], `${condition} ?  '${template}' : ''`;
		// 	}
		// 	return string;
		// }

		if (id) {
			$t.templates[id] = undefined;
			$t.functions[id] = undefined;
		}

		template = template.replace(/\s{1,}/g, ' ');
		id = $t.functions[template] ? template : id || stringHash(template);
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

if (moduleExists) module.exports = $t;
