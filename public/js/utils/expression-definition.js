



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
