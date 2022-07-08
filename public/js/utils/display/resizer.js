const CatchAll = require('./catch-all');
const du = require('../dom-utils');
const CustomEvent = require('../custom-event');

class Resizer {
  constructor (elem, axisObj, cursor) {
    const instance = this;
    const minimumSize = 40;
    let resizeId = elem.getAttribute(Resizer.resizeAttr);
    let sizeLocked = false;

    if (!resizeId) {
      resizeId = 'resize-' + Math.floor(Math.random() * 1000000);
      elem.setAttribute(Resizer.resizeAttr, resizeId);
    }

    this.show = () => {this.container.hidden = false; this.position()};
    this.hide = () => this.container.hidden = true;

    function updateZindex(zIndex) {
      if (instance.container.hidden === false) {
        instance.container.style.zIndex = zIndex;
        elem.style.zIndex = zIndex;
        Resizer.backdrop.updateZindex();
        instance.position();
      }
    }
    this.updateZindex = updateZindex;
    elem.addEventListener('click', () => Resizer.updateZindex(elem));


    if (resizeId) {
      if (!Resizer.collections[resizeId]) {
        Resizer.collections[resizeId] = [];
      }
      Resizer.collections[resizeId].push(this);
    }
    const padding = 8;
    let resize = false;
    let lastPosition;
    this.getPadding = () => padding;

    const attrs = Object.values(axisObj);
    const top = attrs.indexOf('top') !== -1;
    const bottom = attrs.indexOf('bottom') !== -1;
    const left = attrs.indexOf('left') !== -1;
    const right = attrs.indexOf('right') !== -1;

    this.container = document.createElement('DIV');
    this.container.style.cursor = cursor;
    this.container.style.padding = padding/2 + 'px';
    this.container.style.position = axisObj.position || 'absolute';
    this.container.style.backgroundColor = 'transparent';
    Resizer.container.append(this.container);

    function getComputedSize(element, property) {
      return Number.parseInt(window.getComputedStyle(element).getPropertyValue(property));
    }

    function resizeCnt (event) {
      if (resize) {
        Resizer.updateZindex(elem);
        let dy = resize.clientY - event.clientY;
        let dx = resize.clientX - event.clientX;
        let minHeight = getComputedSize(elem, 'min-height');
        let minWidth = getComputedSize(elem, 'min-width');
        if (axisObj.x) {
          if (left) dx *= -1;
          const newWidth = lastPosition.width - dx;
          if (newWidth > minWidth) {
            if (left) {
              elem.style.left = lastPosition.left + dx + 'px';
            }
            elem.style.width = newWidth + 'px'
          }
        }
        if (axisObj.y) {
          if (top) dy *= -1;
          const newHeight = lastPosition.height - dy;
          if (newHeight > minHeight) {
            if (top) {
              elem.style.top = lastPosition.top + window.scrollY + dy + 'px';
            }
            elem.style.height = newHeight + 'px'
          }
        }
      }
    }

    this.container.onmousedown = (e) => {
      resize = e;
      Resizer.backdrop.show();
      lastPosition = elem.getBoundingClientRect();
      // e.stopPropagation();
      // e.preventDefault();
    }

    function stopResizing() {
      if (resize) {
        resize = undefined;
        Resizer.position(elem);
        Resizer.backdrop.hide();
        Resizer.events.resize.trigger(elem);
      }
    }

    function isFixed() {
      return axisObj.position && axisObj.position === 'fixed';
    }

    // this.container.addEventListener('click',
    // (e) =>
    // e.stopPropagation()
    // );
    Resizer.backdrop.on('mouseup', stopResizing);
    this.container.onmouseup = stopResizing;

    this.container.onmousemove = resizeCnt;
    Resizer.backdrop.on('mousemove', (event) =>
    resizeCnt(event));
    this.position = function () {
      const height = document.documentElement.clientHeight;
      const width = document.documentElement.clientWidth;
      const rect = elem.getBoundingClientRect();
      const cntStyle = instance.container.style;
      const scrollY =  isFixed() ? 0 : window.scrollY;
      const scrollX =  isFixed() ? 0 : window.scrollX;
      if (top) {
        cntStyle.top = rect.top - padding + scrollY + 'px';
      } else if (!bottom) {
        cntStyle.top = rect.top + scrollY + 'px';
      }

      if (bottom) {
        cntStyle.bottom = (height - rect.bottom) - padding - scrollY + 'px';
      } else if (!top) {
        cntStyle.bottom = (height - rect.bottom) - scrollY + 'px';
      }

      if (right) {
        cntStyle.right = (width - rect.right) - padding - scrollX + 'px';
      } else if (!left) {
        cntStyle.right = (width - rect.right) - scrollX + 'px';
      }

      if (left) {
        cntStyle.left = rect.left - padding + scrollX + 'px';
      } else if (!right) {
        cntStyle.left = rect.left + scrollX + 'px';
      }
    }
  }
}

Resizer.container = du.create.element('div', {id: 'resizer-cnt'});
document.body.append(Resizer.container);

Resizer.lastZindexSearch = new Date().getTime();
Resizer.zIndex = (zindex) => {
  const time = new Date().getTime();
  if (time > Resizer.lastZindexSearch + 500) {
    Resizer.zed = CatchAll.findHigestZindex();
    lastZindexSearch = time;
  }
  return Resizer.zed;
}
Resizer.container.id = 'resize-id-id';
// Resizer.container.addEventListener('click', (e) => e.stopPropagation());
Resizer.events = {};
Resizer.events.resize = new CustomEvent ('resized')

Resizer.backdrop = new CatchAll();

Resizer.resizeAttr = 'resizer-id'
Resizer.collections = {};
Resizer.position = function (elem) {
  const resizeId = elem.getAttribute(Resizer.resizeAttr);
  const collection = Resizer.collections[resizeId];
  if (collection) {
    collection.forEach((item) => item.position());
  }
}
Resizer.onEach = function (elem, func) {
  const callArgs = Array.from(arguments).splice(2);
  const resizeId = elem.getAttribute(Resizer.resizeAttr);
  const collection = Resizer.collections[resizeId];
  if (collection) {
    collection.forEach((item) => item[func](...callArgs));
  }
}
Resizer.hide = (elem) => Resizer.onEach(elem, 'hide');
Resizer.show = (elem) => {
    if (!Resizer.isLocked(elem)) {
      Resizer.onEach(elem, 'show');
      Resizer.updateZindex(elem);
    }
};
Resizer.updateZindex = (elem, callback) => {
  const highestZIndex = Resizer.zIndex() - 3;
  if (!elem.style.zIndex ||
      (elem.style.zIndex.match(/[0-9]{1,}/) &&
        highestZIndex > Number.parseInt(elem.style.zIndex))) {
    Resizer.onEach(elem, 'updateZindex', highestZIndex + 4);
  }
}

{
  const locked = {};
  Resizer.lock = (elem) => locked[elem.getAttribute(Resizer.resizeAttr)] = true;
  Resizer.unlock = (elem) => locked[elem.getAttribute(Resizer.resizeAttr)] = false;
  Resizer.isLocked  = (elem) => locked[elem.getAttribute(Resizer.resizeAttr)];
}

Resizer.all = (elem, position) => {
  new Resizer(elem, {y: 'top', position}, 'n-resize');
  new Resizer(elem, {y: 'bottom', position}, 's-resize');
  new Resizer(elem, {x: 'right', position}, 'e-resize');
  new Resizer(elem, {x: 'left', position}, 'w-resize', position);
  new Resizer(elem, {x: 'right', y: 'top', position}, 'ne-resize');
  new Resizer(elem, {x: 'left', y: 'top', position}, 'nw-resize');
  new Resizer(elem, {x: 'right', y: 'bottom', position}, 'se-resize');
  new Resizer(elem, {x: 'left', y: 'bottom', position}, 'sw-resize');
}

module.exports = Resizer;
