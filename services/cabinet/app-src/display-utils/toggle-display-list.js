


const du = require('../../../../public/js/utils/dom-utils.js');


ToggleDisplayList = {};
ToggleDisplayList.class = 'toggle-display-list';
ToggleDisplayList.funcs = {};

ToggleDisplayList.onShow = (displayId, func) => {
  if ((typeof func) === 'function') {
    if (ToggleDisplayList.funcs[displayId] === undefined) {
      ToggleDisplayList.funcs[displayId] = [];
    }
    ToggleDisplayList.funcs[displayId].push(func);
  }
}

ToggleDisplayList.runFuncs = (displayId) => {
  if (ToggleDisplayList.funcs[displayId] === undefined) return;
  ToggleDisplayList.funcs[displayId].forEach((func) => func(displayId));
}

ToggleDisplayList.toggle = function (elem, event) {
  const target = event.target;
  const children = elem.children;
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (target === child) {
      du.class.add(child, 'active');
      const displayId = child.getAttribute('display-id');
      du.id(displayId).hidden = false;
      ToggleDisplayList.runFuncs(displayId);
    } else {
      du.class.remove(child, 'active');
      du.id(child.getAttribute('display-id')).hidden = true;
    }
  }
}

du.on.match('click', `.${ToggleDisplayList.class}`, ToggleDisplayList.toggle);

module.exports = du



