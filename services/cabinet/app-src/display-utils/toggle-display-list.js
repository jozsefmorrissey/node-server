
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
      addClass(child, 'active');
      const displayId = child.getAttribute('display-id');
      document.getElementById(displayId).hidden = false;
      ToggleDisplayList.runFuncs(displayId);
    } else {
      removeClass(child, 'active');
      document.getElementById(child.getAttribute('display-id')).hidden = true;
    }
  }
}

matchRun('click', `.${ToggleDisplayList.class}`, ToggleDisplayList.toggle);
