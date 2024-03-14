
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

function querySelector(selector, context) {
  if (context) {
    if (context.matches(selector)) return context;
    return context.querySelector(selector);
  }
  return document.querySelector(selector);
}

function querySelectorAll(selector, context) {
  const list = [];
  if (context) {
    if (context.matches(selector)) list.push(context);
    list.concatInPlace(context.querySelectorAll(selector))
    return list;
  }
  return document.querySelectorAll(selector);
}

const du = {create: {}, class: {}, cookie: {}, param: {}, style: {}, is: {},
      scroll: {}, input: {}, on: {}, move: {}, url: {}, fade: {}, position: {},
      bounds: {}};
du.find = (selector, context) => querySelector(selector, context);
du.find.all = (selector, context) => querySelectorAll(selector, context);
du.validSelector = VS;

du.input.valueObject = (elem) => {
  const inputs = du.find.downAll('input,select,textarea', elem);
  const obj = {};
  inputs.forEach((input) => {
    switch(input.type) {
      case 'number': obj[input.name] = Number.parseFloat(input.value);break;
      case 'checkbox': obj[input.name] = input.checked;break;
      default: obj[input.name] = input.value;break;
    }
  });
  return obj;
}

du.create.element = function (tagname, attributes) {
  const elem = document.createElement(tagname);
  const keys = Object.keys(attributes || {});
  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
  return elem;
}

du.create.event = (eventName) => {
  let event;
  if(document.createEvent){
      event = document.createEvent("HTMLEvents");
      event.initEvent(eventName, true, true);
      event.eventName = eventName;
  } else {
      event = document.createEventObject();
      event.eventName = eventName;
      event.eventType = eventName;
  }
  event.trigger = (elem) => {
    elem ||= document;
    if(document.createEvent){
      elem.dispatchEvent(event);
    } else {
      elem.fireEvent("on" + event.eventType, event);
    }
  }
  return event;
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
  if (!du.is.fixed(elem)) return;
  const ancestors = [elem];
  while(elem.parentElement) ancestors.push(elem = elem.parentElement);
  while (elem && !du.is.fixed(elem = ancestors.pop()));
  elem ||= ancestors[0];
  minimum ||= 5;
  const windowBounds = du.bounds.window();
  function checkDir(dir1, dir2) {
    const rect = du.bounds.elem(elem);
    const dir1dist = Math.difference(rect[dir1], windowBounds[dir1]);
    const dir2dist = Math.difference(rect[dir2], windowBounds[dir2]);
    if (dir1dist < dir2dist) {
      if (rect[dir1] < windowBounds[dir1] - 1) {
        console.log('moving')
        du.bounds.window();
        du.bounds.window();
        elem.style[dir1] = windowBounds[dir1] + minimum + 'px';
        elem.style[dir2] = 'unset';
      }
    }
    // TODO: Need to apply scale to window bounds in order for upperLimit check
    // else {
    //   if (rect[dir2] > windowBounds[dir2] + 1) {
    //     console.log('moving1');
    //     du.bounds.window();
    //     elem.style[dir2] = windowBounds[dir2] + minimum + 'px';
    //     elem.style[dir1] = 'unset';
    //   }
    // }
  }
  checkDir('left', 'right');
  checkDir('top', 'bottom');
}

du.bounds.window = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const sx = window.scrollX;
  const sy = window.scrollY;
  return {left: 0, right: sx+w, top: 0, bottom: sy+h};
}

du.bounds.view = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {left: 0, right: w, top: 0, bottom: h};
}

du.bounds.elem = (elem) => {
  const rect = elem.getBoundingClientRect();
  const sx = window.scrollX;
  const sy = window.scrollY;
  rect.x += sx;
  rect.y += sy;
  rect.top += sy;
  rect.bottom += sy;
  rect.left += sx;
  rect.right += sx;
  return rect;
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

du.move.inbounds = keepInBounds;

du.move.relitive = function (elem, target, direction, props) {
  props = props || {};
  const clientHeight = document.documentElement.clientHeight;
  const clientWidth = document.documentElement.clientWidth;
  const rect = target.getBoundingClientRect();

  const style = {};
  style.cursor = props.cursor || 'unset';
  style.position = props.position || 'absolute';
  du.style(elem, style);

  const scrollY =  props.isFixed ? 0 : window.scrollY;
  const scrollX =  props.isFixed ? 0 : window.scrollX;
  const isTop = direction.indexOf('top') !== -1;
  const isBottom = direction.indexOf('bottom') !== -1;
  const isRight = direction.indexOf('right') !== -1;
  const isLeft = direction.indexOf('left') !== -1;
  const isCenter = direction.indexOf('center') !== -1;
  const isOutside = direction.indexOf('outer') !== -1;
  const isVertical = isTop || isBottom;
  const position = {};
  const outOffset = isOutside ? (isVertical ? elem.clientHeight : elem.clientWidth) : 0;
  if (isCenter) {
    position.top = (rect.top + rect.bottom - elem.clientHeight) / 2 + scrollY + 'px';
    position.left = (rect.left + rect.right - elem.clientWidth) / 2 + scrollX + 'px';
  }

  if (isOutside) {
    if (isTop) {
      position.bottom = clientHeight - (rect.top + scrollY + outOffset) + elem.clientHeight + 'px';
      position.top = 'unset';
    } else { position.bottom = 'unset'; }

    if (isBottom) {
      position.top = clientHeight - ((clientHeight - rect.bottom) + elem.clientHeight - outOffset - scrollY) + 'px';
    } else if (!isCenter) { position.top = 'unset'; }

    if (isRight) {
      position.left = (rect.right - scrollX) + 'px';
    } else if (!isCenter) { position.left = 'unset'; }

    if (isLeft) {
      position.right = clientWidth - (rect.left + scrollX) + 'px';
      position.left = 'unset';
    } else { position.right = 'unset'; }
  } else {
    if (isTop) {
      position.top = rect.top + scrollY + 'px';
    } else if (!isCenter) { position.top = 'unset'; }

    if (isBottom) {
      position.bottom = (clientHeight - rect.bottom) - scrollY + 'px';
      position.top = 'unset';
    } else { position.bottom = 'unset'; }

    if (isRight) {
      position.right = clientWidth - rect.right - scrollX + 'px';
    } else { position.right = 'unset'; }

    if (isLeft) {
      position.left = rect.left + scrollX + 'px';
    } else if (!isCenter) { position.left = 'unset'; }
  }

  du.style(elem, position);
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
  node ||= document.head;
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

const findAttrFunc = (findFunc) =>
  findFunc.attribute = (attribute, node) => {
  const nearestElem = findFunc(`[${attribute}]`, node);
  return nearestElem ? nearestElem.getAttribute(attribute) : null;
};
findAttrFunc(du.find.closest);
findAttrFunc(du.find);
findAttrFunc(du.find.down);
findAttrFunc(du.find.up);



// TODO: apply this to all relevant functions. (selector, target)|(selector)|(target)
//      target - starting element for function
//      selector - filtering of identified elements
function selectorAndTarget(selector, target) {
  const targetDef = target !== undefined;
  const selectorDef = selector !== undefined;
  if ((typeof target) === 'string') target = du.find(target);
  if (targetDef && selectorDef) return {selector, target};
  if (!targetDef && !selectorDef) return {selector: '*'};
  if (!selector) return {target, selector: '*'}
  if (!targetDef) {
    if (selector instanceof HTMLElement) return {target: selector, selector: '*'};
    return {selector};
  }
  throw new Error('This should not Happen');
}

du.find.siblings = (selector, elem) => {
  const selTar = selectorAndTarget(selector, elem);
  selector = selTar.selector; elem = selTar.target;
  const siblings = [];
  let currP = elem;
  let currN = elem;
  while(currP = currP.previousElementSibling) siblings.push(currP);
  while(currN = currN.nextElementSibling) siblings.push(currN);
  return siblings;
}

du.find.relations = (selector, elem) => {
  const selTar = selectorAndTarget(selector, elem);
  selector = selTar.selector; elem = selTar.target;
  const relations = {};
  relations.ancestors = du.find.upAll(selector, elem);
  relations.distants = [];
  relations.ancestors.forEach(e => relations.distants.concatInPlace(du.find.siblings(selector, e)));
  relations.ancestors.splice(0, 1);
  return relations;
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

function runMatches(withinId, eventType, selectStr, target, event) {
  const eventSelectors = selectors[withinId][eventType];
  if (eventSelectors && eventSelectors[selectStr] !== undefined) {
    eventSelectors[selectStr].forEach((func) => {
      try {
        func(target, event)
      } catch (e) {
        console.error(e);
      }
    });
  }
}

function runMatch(event) {
  const  matchRunTargetId = getTargetId(event.currentTarget);
  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
  selectStrs.forEach((selectStr) => {
    const target = du.find.up(selectStr, event.target);
    const everything = selectStr === '*';
    if (everything || target) {
      runMatches(matchRunTargetId, event.type, selectStr, target, event);
      runMatches(matchRunTargetId, '*', selectStr, target, event);
    }
  })
}

du.is.hidden = function (target) {
  const elem = du.find.up('[hidden]', target);
  return elem !== undefined;
}

du.is.fixed = function (target) {
  const pos = document.defaultView.getComputedStyle(target).position;
  const isAbsolute = pos === 'absolute';
  const isRelative = pos === 'relative';
  const isFixed = pos === 'fixed';
  return isAbsolute || isFixed || isRelative;
}

du.is.inView = function (elem) {
  const rect = elem.getBoundingClientRect();
  const winTopLim = window.scrollY;
  const winBotLim = window.scrollY + window.innerHeight;
  const winLeftLim = window.scrollX;
  const winRightLim = window.scrollY + window.innerWidth;

  const leftGreater = rect.left > winLeftLim;
  const leftLess = rect.left < winRightLim;
  const rightGreater = rect.right > winLeftLim;
  const rightLess = rect.right < winRightLim;
  const topGreater = rect.top > winTopLim;
  const topLess = rect.top < winBotLim;
  const bottomGreater = rect.bottom > winTopLim;
  const bottomLess = rect.bottom < winBotLim;

  const leftTopCornerIn =  leftGreater && leftLess && topGreater && topLess;
  const rightTopCornerIn =  rightGreater && rightLess && topGreater && topLess;

  const leftBottomCornerIn =  leftGreater && leftLess && bottomGreater && bottomLess;
  const rightBottomCornerIn =  rightGreater && rightLess && bottomGreater && bottomLess;

  return leftTopCornerIn || rightTopCornerIn || leftBottomCornerIn || rightBottomCornerIn;
}

du.is.ancestor = function (elem, ancestor) {
  while (elem.parentElement) {
    if(elem === ancestor) return true;
    elem = elem.parentElement;
  }
  return false;
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
  return target.className.match(classReg(clazz)) !== null;
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
    const keys = Object.keys(keysDown);
    if (keys.length !== args.length) return false;
    let is = true;
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

function created(elem, selectors) {
  selectors ||= Object.keys(onCreateSelectors);
  for (let index = 0; index < selectors.length; index++) {
    const selector = selectors[index];
    if (elem.matches(selector)) onCreateSelectors[selector](elem);
  }
  for (let ci = 0; ci < elem.children.length; ci++) {
    created(elem.children[ci], selectors);
  }
}

function onCreate(event) {
  if (event.target instanceof HTMLElement) created(event.target);
}

const onCreateSelectors = {};
function create(func, selector) {
  if (func instanceof Function) onCreateSelectors[selector] = func;
}

document.addEventListener('DOMNodeInserted', onCreate);

function onNoactivity(event, func, selector, args) {
  let time = Number.parseInt(args[0]);
  if (!Number.isFinite(time)) time = 500;
  let lastEventId = 0;
  const anyEvent = (target, event) => {
    const id = ++lastEventId;
    setTimeout(() => {
      if (lastEventId === id) {
        func(target, null);
      }
    }, time);
  }
  return {event: '*', func: anyEvent};
}

// TODO: add custom function selectors.
const argEventReg = /^(.*?)(|:(.*))$/;
function filterCustomEvent(event, func, selector) {
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
    case 'noactivity':
      customEvent = onNoactivity(event, func, selector, args);
    case 'create':
      create(func, selector);
      customEvent = null;
  }
  return customEvent;
}

du.on.match = function(event, selector, func, target) {
  const events = event.split(':');
  if (events.length > 1) return events.forEach((e) => du.on.match(e, selector, func, target));
  const filter = filterCustomEvent(event, func, selector);
  if (filter === null) return;
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



du.switch = (selector, idAttr) => {
  if (!VS(selector)) throw new Error('This class needs a valid selector that can grab your button and your container');
  const btnSelector = `button${selector}`;
  const cntSelector = `${selector}:not(button)`;
  function onlyOne(elem) {
    let allBtns = du.find.all(btnSelector);
    let allCnts = du.find.all(cntSelector);
    for (let i = 0; i < allBtns.length; i++) allBtns[i].hidden = false;
    for (let i = 0; i < allCnts.length; i++) allCnts[i].hidden = true;
    if (elem) {
      let idSel = '';
      if (idAttr) {
        const attr = elem.getAttribute(idAttr);
        idSel = attr ? `[${idAttr}='${attr}']` : '';
      }
      let cnt = du.find.closest(`${cntSelector}${idSel}`, elem);
      if (cnt) cnt.hidden = false;
      else console.warn('Element does not appear to have a corresponding container');
    }
  }

  du.on.match('click', btnSelector, onlyOne);
  return onlyOne;
}

du.trigger = (eventName, elemOid) => {
  const elem = (typeof elemOid) === 'string' ? du.id(elemOid) : elemOid;
  if (elem instanceof HTMLElement) {
    const event = du.create.event(eventName);
    // event.target = elem;
    if(document.createEvent){
      elem.dispatchEvent(event);
    } else {
      elem.fireEvent("on" + event.eventType, event);
    }
  }
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
  if (!(elem instanceof HTMLElement)) {
    for (let index = 0; index < elem.length; index++) {
      du.style(elem[index], style, time);
    }
  } else {
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
  let elem;
  if (textOelem instanceof HTMLElement) {
    elem = textOelem;
  } else {
    if (copyTextArea === undefined) {
      copyTextArea = du.create.element('textarea', {id: 'du-copy-textarea'});
      document.body.append(copyTextArea);
    }
    elem = copyTextArea;
    copyTextArea.value = textOelem;
    copyTextArea.innerText = textOelem;
  }

  elem.select();
  document.execCommand("copy");
}

du.paste = (elem, success, fail, validate) => {
  fail ||= err => console.error('Failed to read clipboard contents: ', err);
  navigator.clipboard.readText()
  .then((text) => {
    if ((typeof validate) !== 'function') {
      success(text, elem);
    } else {
      const validResult = validate(text);
      if (validResult) {
        if (validResult === true) success(text, elem);
        else success(validResult, elem);
      }
    }
  })
  .catch(fail);
};

du.paste.json = (elem, success, fail, validate) => {
  let obj;
  const validateWrapper = (text) => {
    try {
      const obj = Object.fromJson(JSON.parse(text));
      return obj;
    } catch (e) {
      fail(e);
    }
  };
  const successWrapper = (value, elem) => success(value, elem);
  fail ||= err => console.error('Failed to read JSON object from clipboard contents: ', err);
  du.paste(elem, successWrapper, fail, validateWrapper);
}

// du.print = {};
// du.print.elem = (selectorOelem) => {
//   let elem = selectorOelem;
//   if (!(elem instanceof HTMLElement)) elem = du.find(selectorOelem);
//   if (elem instanceof HTMLElement) {
//    const relations = du.find.relations(elem)
//    du.hide(relations.distants);
//    du.style(relations.ancestors, {all: 'unset'});
//    window.print();
//    du.show(relations.distants);
//    du.style(relations.ancestors, {all: ''});
//  } else console.error(`Cant find HTMLElement '${selectorOelem}'`);
// }
//
// du.on.match('click', 'button.print', (elem) => du.print.elem(elem.parentElement));

const attrReg = /^[a-zA-Z-]*$/;
du.uniqueSelector = function selector(focusElem) {
  if (!focusElem) return '';
  let selector = '';
  let percice;
  let attrSelector;
  let currSelector;
  let currElem = focusElem;
  do {
    attrSelector = `${currElem.id ? '#' + currElem.id : `${currElem.tagName}`}`;

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

function createTimerShortCut() {
  let timers = [];
  du.on.match('keycombo(s,t)', '*', () => timers.push(new Date().getTime()));
  du.on.match('keycombo(t)', '*', (info, info2) => {
    if (timers.length === 0) return;
    const endTime = new Date().getTime();
    let str = '';
    for (let index = 0; index < timers.length; index++) {
      let time = endTime - timers[index];
      if (time < 2000) time = `${time/100} msec`;
      else time = `${time/1000} sec`;
      str += `${index}) ${time}\n`;
    }
    if (str) alert(str);
    timers = [];
  });
}
createTimerShortCut();

try {
  module.exports = du;
} catch (e) {}
