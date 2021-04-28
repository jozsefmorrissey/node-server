function createElement(tagname, attributes) {
  const elem = document.createElement(tagname);
  const keys = Object.keys(attributes);
  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
  return elem;
}

function up(selector, node) {
  if (node instanceof HTMLElement) {
    if (node.matches(selector)) {
      return node;
    } else {
      return up(selector, node.parentNode);
    }
  }
}

function upAll(selector, node) {
  const elems = [];
  let elem = node;
  while(elem = up(selector, elem)) {
    elems.push(elem);
    elem = elem.parentElement;
  }
  return elems;
}

function down(selector, node) {
    function recurse (currNode, distance) {
      if (node instanceof HTMLElement) {
        if (currNode.matches(selector)) {
          return { node: currNode, distance };
        } else {
          let found = { distance: Number.MAX_SAFE_INTEGER };
          for (let index = 0; index < currNode.children.length; index += 1) {
            distance++;
            const child = currNode.children[index];
            const maybe = recurse(child, distance);
            found = maybe && maybe.distance < found.distance ? maybe : found;
          }
          return found;
        }
      }
      return { distance: Number.MAX_SAFE_INTEGER };
    }
    return recurse(node, 0).node;
}

function closest(selector, node) {
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
    const target = up(selectStr, event.target);
    if (target) {
      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target, event));
    }
  })
}


function addClass(target, clazz) {
  target.className += ` ${clazz}`;
}

function classReg(clazz) {
  return new RegExp(`(^| )${clazz}( |$)`, 'g');
}

function removeClass(target, clazz) {
  target.className = target.className.replace(classReg(clazz), '');
}

function hasClass(target, clazz) {
  return target.className.match(classReg(clazz));
}

function toggleClass(target, clazz) {
  if (hasClass(target, clazz)) removeClass(target, clazz);
  else addClass(target, clazz);
}

function matchRun(event, selector, func, target) {
  target = target || document;
  const  matchRunTargetId = getTargetId(target);
  if (selectors[matchRunTargetId] === undefined) {
    selectors[matchRunTargetId] = {};
  }
  if (selectors[matchRunTargetId][event] === undefined) {
    selectors[matchRunTargetId][event] = {};
    target.addEventListener(event, runMatch);
  }
  if (selectors[matchRunTargetId][event][selector] === undefined) {
    selectors[matchRunTargetId][event][selector] = [];
  }

  selectors[matchRunTargetId][event][selector].push(func);
}

function bindField(selector, objOrFunc, validation) {
  function update(elem) {
    const updatePath = elem.getAttribute('prop-update');
    if (updatePath !== null) {
      const newValue = elem.value;
      if (!validation(newValue)) {
        console.error('badValue')
      } else if ((typeof objOrFunc) === 'function') {
        objOrFunc(updatePath, elem.value);
      } else {
        const attrs = updatePath.split('.');
        const lastIndex = attrs.length - 1;
        let currObj = objOrFunc;
        for (let index = 0; index < lastIndex; index += 1) {
          let attr = attrs[index];
          if (currObj[attr] === undefined) currObj[attr] = {};
          currObj = currObj[attr];
        }
        currObj[attrs[lastIndex]] = elem.value;
      }
    }
  }
  matchRun('keyup', selector, update);
  matchRun('change', selector, update);
}


function updateDivisions (target) {
  const name = target.getAttribute('name');
  const index = Number.parseInt(target.getAttribute('index'));
  const value = Number.parseFloat(target.value);
  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
  const pattern = DivisionPattern.patterns[name];
  const uniqueId = up('.opening-cnt', target).getAttribute('opening-id');
  const opening = Assembly.get(uniqueId);
  const values = opening.calcSections(pattern, index, value).fill;
  for (let index = 0; values && index < inputs.length; index += 1){
    const value = values[index];
    if(value) inputs[index].value = value;
  }
  updateModel(opening);
}

matchRun('change', '.open-orientation-radio,.open-division-input', updateDivisions);
