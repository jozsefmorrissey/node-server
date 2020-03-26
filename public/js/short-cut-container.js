var SHORT_CUT_CONTAINERS = [];

function ShortCutCointainer(id, keys, html) {
  var SPACER_ID = 'ssc-html-spacer';
  var OPEN = 'ssc-open';
  var CLOSE = 'ssc-close';
  var currentKeys = {};
  var size = 200;
  var container;
  var resizeBar;

  function resizeBarId() {
    return 'ssc-resizeBar-' + id;
  }
  function htmlContainerId() {
    return 'ssc-html-container-' + id;
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
    container.innerHTML = html;
    container.style.cssText = 'max-height: ' + size + 'px; overflow: scroll;';
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


  function resize(element) {
    if (shouldResize > 0) {
      var minHeight = 80;
      var maxHeight = window.innerHeight - 50;
      let dx = window.innerHeight - element.clientY;
      dx = dx < minHeight ? minHeight : dx;
      dx = dx > maxHeight ? maxHeight : dx;
      var height = dx + 'px;';
      container.style.cssText = 'overflow: scroll; max-height: ' + height;
      ssc.style.cssText  = noHeight + 'height: ' + height;
      padBottom(height);
    }
    return element.height;
  }

  var shouldResize = 0;
  function mouseup() {
    shouldResize = 0;
  }

  function mousedown(e) {
    var barPos = resizeBar.getBoundingClientRect().top;
    let mPos = e.clientY;
    if (barPos > mPos - 10 && barPos < mPos + 10) {
      shouldResize++;
    }
  }


  let displayCount = 0;
  function toggleContentEditor() {
        displayCount++;
        var ce = document.getElementById(id);
        if (displayCount %2 == 1) {
          ce.style.display = 'block';
          var height = ce.style.height;
          padBottom(height);
          triggerEvent(OPEN, id);
        } else {
          ce.style.display = 'none';
          padBottom('0px;');
          triggerEvent(CLOSE, id);
        }
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

  function onOpen(id) {
    console.log(id);
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
      ssc.dispatchEvent(event);
    } else {
      ssc.fireEvent("on" + event.eventType, event);
    }
  }

  function onLoad() {
    document.body.append(ssc);
  }

  function keyUpListener(e) {
    delete currentKeys[e.key];
  }

  function innerHtml(html) {
    container.innerHTML = html;
  }

  var ssc = document.createElement('div');
  ssc.id = id;
  ssc.append(createResizeBar());
  ssc.append(createContainer(html));
  ssc.style.cssText = noHeight + 'height: ' + size + 'px;';
  ssc.style.display = 'none';
  ssc.addEventListener(OPEN, onOpen);
  onLoad();
  retObject = {innerHtml, mouseup, mousedown, resize, keyUpListener, keyDownListener};
  SHORT_CUT_CONTAINERS.push(retObject);
  return retObject;
}

function callOnAll(func, e) {
  for (let index = 0; index < SHORT_CUT_CONTAINERS.length; index += 1) {
    SHORT_CUT_CONTAINERS[index][func](e);
  }
}

function mouseup(e) { callOnAll('mouseup', e); }
function mousedown(e) { callOnAll('mousedown', e); }
function resize(e) { callOnAll('resize', e); }
function keyUpListener(e) { callOnAll('keyUpListener', e); }
function keyDownListener(e) { callOnAll('keyDownListener', e); }

window.onmouseup = mouseup;
window.onmousedown = mousedown;
window.onmousemove = resize;
window.onkeyup = keyUpListener;
window.onkeydown = keyDownListener;

function onLoad() {
  let containers = document.querySelectorAll('short-cut-container');
  for (let index = 0; index < containers.length; index += 1) {
    var elem = containers[index];
    if (elem.getAttribute('keys'))
    var keys = elem.getAttribute('keys').split(',')
    id = elem.id || 'ssc-' + index;
    html = elem.innerHTML;
    ShortCutCointainer(id, keys, html);
    elem.parentNode.removeChild(elem);
  }
}

window.addEventListener('load', onLoad);
