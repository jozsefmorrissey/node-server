
const frag = document.createDocumentFragment();
function validSelector (selector) {
  try {
    frag.querySelector(selector)
    return selector;
  } catch (e) {
    const errMsg = `Invalid Selector: '${selector}'` ;
    console.error(errMsg);
    return errMsg;
  }
};
const VS = validSelector;


const du = {create: {}, class: {}, cookie: {}, param: {}, style: {},
      scroll: {}, input: {}, on: {}, move: {}};
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
  du.class.add(target, newClass)
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
  if (du.class.has(target, clazz)) du.class.remove(target, clazz);
  else du.class.add(target, clazz);
}

du.on.match = function(event, selector, func, target) {
  target = target || document;
  selector = VS(selector);
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

du.cookie.set = function(name, value, lifeMilliSecs) {
  if (value instanceof Object) {
    value = JSON.stringify(value);
  }
  const expireDate = new Date();
  expireDate.setTime(expireDate.getTime() + (lifeMilliSecs || (8035200000))); //93 days by default
  document.cookie = `${name}=${value}; expires=${expireDate.toUTCString()}`;
}

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

let params;
du.param.get = function(name) {
  if (params === undefined) {
    const url = window.location.href;
    const paramStr = url.substr(url.indexOf('?') + 1);
    params = paramStr.parseSeperator('&');
  }
  const value = params[name];
  if (value === undefined) return undefined;
  return decodeURI(value);
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


du.cookie.remove = function (name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

try {
  module.exports = du;
} catch (e) {}
