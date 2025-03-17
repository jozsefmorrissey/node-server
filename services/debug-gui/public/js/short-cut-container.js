var SHORT_CUT_CONTAINERS = [];

function ShortCutContainer(id, keys, html, config) {
  var SPACER_ID = 'scc-html-spacer';
  var OPEN = 'scc-open';
  var CLOSE = 'scc-close';
  var currentKeys = {};
  var size = 200;
  var container;
  var resizeBar;
  var locked;

  const jsAttrReg = / on[a-zA-Z]*\s*=/g
  function innerHtml(html) {
    if (container) {
      const clean = html.replace(/<script[^<]*?>/, '').replace(jsAttrReg, '');
      if (clean !== html)
        throw Error('ddddddddiiiiiiiiiiiiiirrrrrrrrrrrrtttttttttttty');
      container.innerHTML = html;
    }
  }

  function resizeBarId() {
    return 'scc-resizeBar-' + id;
  }
  function htmlContainerId() {
    return 'scc-html-container-' + id;
  }

  function getResizeBarCss() {
    return 'border-top-style: double;' +
      'border-top-width: 10px;' +
      'cursor: row-resize;' +
      'border-color: rgb(22, 44, 166);';
  }

  function createResizeBar() {
    resizeBar = document.createElement('div');
    resizeBar.id = resizeBarId();
    resizeBar.style.cssText = getResizeBarCss();
    return resizeBar;
  }

  function createContainer(html) {
    container = document.createElement('div');
    container.id = htmlContainerId();
    innerHtml(html);
    container.style.cssText = 'height: ' + size + 'px; overflow: scroll;';
    return container;
  }

  function padBottom(height) {
    var spacer = document.getElementById(SPACER_ID);
    if (spacer) {
      spacer.remove();
    }
    spacer = document.createElement('div');
    spacer.id = SPACER_ID;
    spacer.style = 'height: ' + height;
    document.querySelector('body').append(spacer);
  }

  var noHeight = 'display: block;' +
    'width: 100%;' +
    'margin: 0;' +
    'padding: 0;' +
    'position: fixed;' +
    'width: 100%;' +
    'bottom: 0;' +
    'z-index: 10000;' +
    'left: 0;' +
    'background-color: white;';


    function resize(event) {
      if (shouldResize > 0) {
        var minHeight = 80;
        var maxHeight = window.innerHeight - 50;
        let dx = window.innerHeight - event.clientY;
        dx = dx < minHeight ? minHeight : dx;
        dx = dx > maxHeight ? maxHeight : dx;
        var height = dx + 'px;';
        container.style.cssText = 'overflow: scroll; height: ' + height;
        scc.style.cssText  = noHeight + 'height: ' + height;
        padBottom(height);
      }
      // return event.target.height;
    }

  var shouldResize = 0;
  function mouseup(e) {
    shouldResize = 0;
    e.stopPropagation();
  }

  function mousedown(e) {
    var barPos = resizeBar.getBoundingClientRect().top;
    let mPos = e.clientY;
    if (barPos > mPos - 10 && barPos < mPos + 10) {
      shouldResize++;
    }
  }

  function show() {
    if (!locked) {
      var ce = document.getElementById(id);
      ce.style.display = 'block';
      var height = ce.style.height;
      padBottom(height);
      triggerEvent(OPEN, id);
      isShowing = true;
    }
  }

  function hide() {
    if (!locked) {
      var ce = document.getElementById(id);
      ce.style.display = 'none';
      padBottom('0px;');
      triggerEvent(CLOSE, id);
      isShowing = false;
    }
  }

  const lock = () => locked = true;
  const unlock = () => locked = false;

  let isShowing = false;
  function toggleContentEditor() {
        if (isShowing) {
          hide();
        } else {
          show();
        }
  }

  function isOpen() {
    return isShowing;
  }

  function keyDownListener(e) {
      currentKeys[e.key] = true;
      if (shouldToggle()){
        toggleContentEditor();
      }
  }

  function shouldToggle() {
    for (let index = 0; index < keys.length; index += 1) {
      if (!currentKeys[keys[index]]) {
        return false;
      }
    }
    return true;
  }

  function triggerEvent(name, id) {
    var event; // The custom event that will be created

    if (document.createEvent) {
      event = document.createEvent("HTMLEvents");
      event.initEvent(name, true, true);
    } else {
      event = document.createEventObject();
      event.eventType = name;
    }

    event.eventName = name;

    if (document.createEvent) {
      scc.dispatchEvent(event);
    } else {
      scc.fireEvent("on" + event.eventType, event);
    }
  }

  function onLoad() {
    document.body.append(scc);
  }

  function keyUpListener(e) {
    delete currentKeys[e.key];
  }

  function addEventListener(eventType, func) {
    container.addEventListener(eventType, func);
  }

  var scc = document.createElement('div');
  scc.id = id;
  scc.append(createResizeBar());
  scc.append(createContainer(html));
  scc.style.cssText = noHeight + 'height: ' + size + 'px;';
  if (!config || config.open !== true) {
    scc.style.display = 'none';
  }
  scc.addEventListener('mouseup', mouseup);
  scc.addEventListener('mousedown', mousedown);
  onLoad();
  retObject = { innerHtml, mouseup, mousedown, resize, keyUpListener, keyDownListener,
                show, hide, isOpen, lock, unlock, addEventListener };
  SHORT_CUT_CONTAINERS.push(retObject);
  window.onmouseup = hide;
  return retObject;
}

function callOnAll(func, e) {
  for (let index = 0; index < SHORT_CUT_CONTAINERS.length; index += 1) {
    SHORT_CUT_CONTAINERS[index][func](e);
  }
}

function resize(e) { callOnAll('resize', e); }
function keyUpListener(e) { callOnAll('keyUpListener', e); }
function keyDownListener(e) { callOnAll('keyDownListener', e); }

window.onmousemove = resize;
window.onkeyup = keyUpListener;
window.onkeydown = keyDownListener;

function onLoad() {
  let containers = document.querySelectorAll('short-cut-container');
  for (let index = 0; index < containers.length; index += 1) {
    var elem = containers[index];
    if (elem.getAttribute('keys'))
    var keys = elem.getAttribute('keys').split(',')
    id = elem.id || 'scc-' + index;
    html = elem.innerHTML;
    ShortCutContainer(id, keys, html);
    elem.parentNode.removeChild(elem);
  }
}

window.onload = onLoad;
