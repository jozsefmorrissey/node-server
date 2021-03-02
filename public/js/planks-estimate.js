
class Assembly {
  constructor(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

class DrawerSection extends Assembly {
  constructor(width, height, depth) {
    super(width, height, depth);
  }
}

class DoorSection extends Assembly {
  constructor(width, height, depth) {
    super(width, height, depth);
  }
}

class DualDoorSection extends Assembly {
  constructor(width, height, depth) {
    super(width, height, depth);
  }
}

class FalseFrontSection extends Assembly {
  constructor(width, height, depth) {
    super(width, height, depth);
  }
}

class FrameDivider extends Assembly {
  constructor (width, height, depth) {
    super(width, height, depth);
  }
}

const divSet = {horizontal: [], vertical: []};
const getHorizontalDivSet = (id) => divSet.horizontal[id];
const getVerticalDivSet = (id) => divSet.vertical[id];
const setDivSet = (id, sizes) => {
  if (divSet[type][sizes.length] === undefined) divSet[type][sizes.length] = [];
  divSet[type][sizes.length] = sizes;
}
const setHorizontalDivSet = (id, sizes) => (id, sizes, 'horizontal');
const setVerticalDivSet = (id, sizes) => (id, sizes, 'vertical');

class OpenSection extends Assembly {
  constructor(width, height, depth) {
    super(width, height, depth);
    this.width = width;
    this.height = height;
    let vertical;
    let sizeRestrictor;
    const divisions = [];
    const divide = () => divisions.push(new OpenSection());
    const opening = () => {
      return {width: this.width, height: this.height};
    }
  }
}

const framedFrameWidth = 1.5;
const framelessFrameWidth = 3/4;
class Cabnet extends OpenSection {
  constructor(width, height, depth) {
      let frameWidth = framedFrameWidth;
      let toeKickHeight = 4;
      let verticelSections = [];
      let horizontalSections = [];
      const panels = 0;
      const framePieces = 0;
      const addFramePiece = (piece) => framePieces.push(piece);
      const framePieceCount = () => pieces.length;
      const addPanel = (panel) => panels.push(panel);
      const panelCount = () => panels.length;
      const opening = () => {
        const w = width - (frameWidth * 2);
        const h = height - toeKickHeight - (frameWidth * 2);
        return {width: w, height: h};
      }
  }
}

// class Labor {
//   constructor (name, base, sizeAttr, multiplier) {
//     multiplier = multiplier || 1;
//     sizeAttr = sizeAttr ? size[sizeAttr]() : () => 1;
//     this.name = name;
//     this.calculate = (size) => {
//       return base * multiplier * sizeAttr();
//     }
//   }
// }
//
// new Labor('Cut Pannel', 2.00, .5, 'lengthXwidth');
// new Labor('Cut frame', 1, 1, 'pieces');
// new Labor('Glue Frame', 5, 2, 'pieces');
// new Labor('and')







// ----------------------------------  Display  ---------------------------//

function up(selector, node) {
  if (node instanceof HTMLElement) {
    if (node.matches(selector)) {
      return node;
    } else {
      return up(selector, node.parentNode);
    }
  }
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
      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target));
    }
  })
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


class ExpandandableList {
  constructor(parent, listType, getHeader, getBody, list, getObject) {
    list = list || [];
    getObject = getObject || (() => {});
    const id = ExpandandableList.lists.length;
    ExpandandableList.lists[id] = this;
    this.add = () => {
      list.push(getObject());
      this.refresh();
    };
    this.remove = (index) => {
      list.splice(index, 1);
      this.refresh();
    }
    this.refresh = () => parent.innerHTML = ExpandandableList.template.render({getHeader, getBody, listType, id, list})
    this.refresh();
  }
}
ExpandandableList.lists = [];
ExpandandableList.template = new $t('./public/html/planks/expandable-list.html');
matchRun('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  ExpandandableList.lists[id].add();
});
matchRun('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const index = target.getAttribute('index');
  ExpandandableList.lists[id].remove(index);
});

matchRun('click', '.expand-header', (target) => {
  const headers = up('.expandable-list', target).querySelectorAll('.expand-header');
  const bodys = up('.expandable-list', target).querySelectorAll('.expand-body');
  const rmBtns = up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
  headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
  bodys.forEach((body) => body.style.display = 'none');
  rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
  target.parentElement.querySelector('.expand-body').style.display = 'block';
  target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
  target.className += ' active';
});

window.onload = () => {
  const dummyText = (prefix) => (item, index) => `${prefix} ${index}`;
  const cabinetList = new ExpandandableList(document.body, 'Cabnet', dummyText('header'), dummyText('body'));
};
