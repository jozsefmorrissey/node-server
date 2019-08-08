function ShortCutCointainer(id, keys, html) {
  let currentKeys = {};
  var size = 200;

  function resizeBarId() {
    return 'ssc-resizeBar-' + id;
  }
  function htmlContainerId() {
    return 'ssc-html-container-' + id;
  }
  var barCss = 'border-top-style: double;' +
    'border-top-width: 5pt;' +
    'cursor: row-resize;' +
    'border-color: #4dce55;';

  var ssc = document.createElement('div');
  ssc.id = id;

  var resizeBar = document.createElement('div');
  resizeBar.id = resizeBarId();
  resizeBar.style.cssText = barCss;
  ssc.append(resizeBar);

  var container = document.createElement('div');
  container.id = htmlContainerId();
  container.innerHTML = html;
  container.style.cssText = 'max-height: ' + size + 'px; overflow: scroll;';
  ssc.append(container);

  var noHeight = 'display: block;' +
    'width: 100%;' +
    'margin: 0;' +
    'padding: 0;' +
    'position: fixed;' +
    'width: 100%;' +
    'bottom: 0;' +
    'left: 0;' +
    'background-color: white;';

  ssc.style.cssText = noHeight + 'height: ' + size + 'px;';
  ssc.style.display = 'none';

  function resize(element) {
    if (shouldResize > 0) {
      const minHeight = 80;
      const maxHeight = window.innerHeight - 50;
      let dx = window.innerHeight - element.clientY;
      dx = dx < minHeight ? minHeight : dx;
      dx = dx > maxHeight ? maxHeight : dx;
      container.style.cssText = 'overflow: scroll; max-height: ' + dx + 'px;';
      ssc.style.cssText  = noHeight + 'height: ' + dx + 'px;'
    }
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

  function getEventName(type) {
    return 'ssc-' + id + "-" + type;
  }

  let displayCount = 0;
  function toggleContentEditor() {
        displayCount++;
        const ce = document.getElementById(id);
        if (displayCount %2 == 1) {
          ce.style.display = 'block';
          triggerEvent(getEventName('open'));
        } else {
          ce.style.display = 'none';
          triggerEvent(getEventName('close'));
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

  function triggerEvent(name) {
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

  window.onmouseup = mouseup;
  window.onmousedown = mousedown;
  window.onmousemove = resize;
  window.onkeyup = keyUpListener;
  window.onkeydown = keyDownListener;
  onLoad();
  return {innerHtml};
}
