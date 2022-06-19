
class CatchAll {
  constructor(container) {
    const instance = this;
    container = container || CE_CONTAINER;
    let events = Array.from(arguments).splice(1);
    events = events.length > 0 ? events : CatchAll.allMouseEvents;

    // const zIndex = 1000008;
    const backdrop = document.createElement('DIV');
    this.backdrop = backdrop;

    this.hide = () => backdrop.hidden = true;
    this.show = () => {
      backdrop.hidden = false
      instance.updateZindex();
    };

    this.updateZindex = (zIndex) => backdrop.style.zIndex = zIndex || CatchAll.findHigestZindex() + 1;

    this.on = (eventName, func) => backdrop.addEventListener(eventName, func);

    backdrop.style.position = 'fixed';
    backdrop.style.backgroundColor = 'transparent';

    // backdrop.style.cursor = 'none';
    backdrop.style.top = 0;
    backdrop.style.bottom = 0;
    backdrop.style.right = 0;
    backdrop.style.left = 0;
    const stopPropagation = (e) => e.stopPropagation();
    events.forEach((eventName) => instance.on(eventName, stopPropagation));
    container.append(backdrop);

    this.updateZindex();
    this.hide();
  }
}


CatchAll.allMouseEvents = ['auxclick', 'click', 'contextmenu', 'dblclick',
                        'mousedown', 'mouseenter', 'mouseleave', 'mousemove',
                        'mouseover', 'mouseout', 'mouseup', 'pointerlockchange',
                        'pointerlockerror', 'select', 'wheel'];

// Ripped off of: https://stackoverflow.com/a/1120068
CatchAll.findHigestZindex = function () {
  var elems = document.querySelectorAll('*');
  var highest = Number.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);
  for (var i = 0; i < elems.length; i++)
  {
    var zindex = Number.parseInt(
      document.defaultView.getComputedStyle(elems[i], null).getPropertyValue("z-index"),
      10
    );
    if (zindex > highest && zindex !== 2147483647)
    {
      highest = zindex;
    }
  }
  return highest;
}

module.exports = CatchAll;
