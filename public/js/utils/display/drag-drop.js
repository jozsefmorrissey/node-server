
const $t = require('../$t');
const CatchAll = require('./catch-all');


class DragDropResize {
  constructor (props) {
    props = props || {};
    const id = Math.floor(Math.random() * 1000000);
    const POPUP_CNT_ID = 'place-popup-cnt-id-' + id;
    const POPUP_CONTENT_ID = 'place-popup-content-id-' + id;
    const POPUP_CONTENT_CNT_ID = 'place-popup-content-cnt-id-' + id;
    const MAXIMIZE_BTN_ID = 'place-maximize-id-' + id;
    const POPUP_HEADER_CNT_ID = 'place-header-cnt-id-' + id;
    const MINIMIZE_BTN_ID = 'place-minimize-id-' + id;
    const MAX_MIN_CNT_ID = 'place-max-min-id-' + id;
    const CLOSE_BTN_ID = 'place-close-btn-id-' + id;
    const MOVE_BTN_ID = 'place-MOVE-btn-id-' + id;
    const BACK_BTN_ID = 'place-back-btn-id-' + id;
    const FORWARD_BTN_ID = 'place-forward-btn-id-' + id;
    const HISTORY_BTN_ID = 'place-history-btn-id-' + id;
    const position = props.position || 'absolute';
    const template = new $t('place');
    let lastMoveEvent, prevLocation, minLocation, selectElem,
        currElem, hasMoved;
    const instance = this;
    const closeFuncs = [];

    let width = props.width || '40vw';
    let height = props.height || '20vh';
    this.getDems = props.getDems || ( () => { return {width, height}; } );
    this.setDems = props.setDems || ( (w, h) => { width = w; height = h; } );

    this.hasMoved = () => hasMoved;
    function onResizeEvent() {
      const rect = popupCnt.getBoundingClientRect();
      if (!Resizer.isLocked(popupCnt)) instance.setDems({width: rect.width + 'px', height: rect.height + 'px'});
    }

    const defaultStyle = `
      background-color: white;
      position: ${position};
      overflow: hidden;
      min-height: ${props.minWidth === undefined ? '0vh' : props.minWidth};
      min-width: ${props.minHeight === undefined ? '0vw' : props.minHeight};
      display: none;
      ${props.overflow ? 'overflow: ' + props.overflow + ';' : ''}
      border: 1px solid;
      border-radius: 5pt;
      box-shadow: 3px 3px 6px black, 3px 3px 6px grey, 3px 3px 6px lightgrey;`;

    this.close = () => {
      getPopupElems().cnt.style.display = 'none';
      Resizer.hide(popupCnt);
      closeFuncs.forEach((func) => func());
      middleSize();
      histCnt.hidden = true;
    }
    this.hide = this.close;

    this.show = () => {
      if (instance.hidden()) {
        updateControls();
        const css = {display: 'block',
        height: Resizer.isLocked(popupCnt) ? undefined : instance.getDems().height,
        width: Resizer.isLocked(popupCnt) ? undefined : instance.getDems().width};
        if (Number.isFinite(css.height)) css.height = css.height + 'px';
        if (Number.isFinite(css.width)) css.width = css.width + 'px';

        setCss(css);
        if (!Resizer.isLocked(popupCnt)) Resizer.show(popupCnt);
        updateHistZindex();
      }
      return instance;
    };

    this.hidden = () => getPopupElems().cnt.style.display === 'none';

    this.withinPopup = (offset) => {
      const rect = getPopupElems().cnt.getBoundingClientRect();
      if (lastMoveEvent) {
        const withinX = lastMoveEvent.clientX < rect.right - offset && rect.left + offset < lastMoveEvent.clientX;
        const withinY = lastMoveEvent.clientY < rect.bottom - offset && rect.top + offset < lastMoveEvent.clientY;
        return withinX && withinY;
      }
      return false;
    }

    function updateHistZindex() {
      histCnt.style.zIndex = Number.parseInt(popupCnt.style.zIndex) + 1;
    }

    function getRelitiveRect(elem) {
      let rect;
      if (elem === undefined) {
        rect = {top: 0, bottom: 0, right: 0, left: 0, width: 100, height: 100};
      } else {
        rect = elem.getBoundingClientRect();
      }

      const absRect = {};
      const scrollOffset = getScrollOffset();
      absRect.top = rect.top + scrollOffset.y;
      absRect.bottom = rect.bottom + scrollOffset.y;
      absRect.right = rect.right + scrollOffset.x;
      absRect.left = rect.left + scrollOffset.x;
      absRect.width = rect.width;
      absRect.height = rect.height;
      return absRect
    }

    this.back = () => setCss(prevLocation);

    function positionOnElement(elem, container) {
      currElem = elem || currElem;
      instance.show();
      let rect = getRelitiveRect(currElem);
      let popRect = getRelitiveRect(container || getPopupElems().cnt);
      let padding = 8;

      let top = `${rect.top}px`;
      const position = {};
      position.close = instance.close;
      position.top = () =>{setCss({top: rect.top - popRect.height - padding + 'px'}, container); return position;};
      position.bottom = () =>{setCss({top: rect.bottom + padding + 'px'}, container); return position;};
      position.left = () =>{setCss({left: rect.left - popRect.width - padding + 'px'}, container); return position;};
      position.right = () =>{setCss({left: rect.right + padding + 'px'}, container); return position;};
      position.center = () =>{
              let left = rect.left - (popRect.width / 2) + (rect.width / 2);
              let top = rect.top - (popRect.height / 2) + (rect.height / 2);
              setCss({left: left + 'px', top: top + 'px'}, container);
              return position;};
      position.inView = () =>{
        let popRect = getRelitiveRect(container || getPopupElems().cnt);
        const left = (popRect.left > 10 ? popRect.left : 10) + 'px';
        const right = (popRect.right > 10 ? popRect.right : 10) + 'px';
        const top = (popRect.top > 10 ? popRect.top : 10) + 'px';
        const bottom = (popRect.bottom > 10 ? popRect.bottom : 10) + 'px';
        setCss({left, right, top, bottom}, container);
        return position;};
      position.maximize = instance.maximize.bind(position);
      position.minimize = instance.minimize.bind(position);
      if (window.innerHeight / 2 > rect.top - window.scrollY) {
        position.center().bottom().inView();
      } else {
        position.center().top().inView();
      }

      return position;
    }

    this.elem = positionOnElement;
    this.select = () => {
      if (window.getSelection().toString().trim()) {
        selectElem = window.getSelection().getRangeAt(0);
        currElem = selectElem;
      }
      return positionOnElement(selectElem);
    };
    this.top = () => setCss({top:0,bottom:''});
    this.left = () => setCss({right:'',left:0});
    this.bottom = () => setCss({top:'',bottom:0});
    this.right = () => setCss({right:0,left:''});

    this.center = function () {
      const popRect = getPopupElems().cnt.getBoundingClientRect();
      const top = `${(window.innerHeight / 2) - (popRect.height / 2)}px`;
      const left = `${(window.innerWidth / 2) - (popRect.width / 2)}px`;
      setCss({top,left, right: '', bottom: ''});
      return instance;
    }

    function showElem(id, show) {
      document.getElementById(id).hidden = !show;
    }

    function updateControls() {
      showElem(MINIMIZE_BTN_ID, !props.hideMin && (isMaximized || props.tabText !== undefined));
      showElem(MAXIMIZE_BTN_ID, !props.hideMax && !isMaximized());
      const hasPast = props.hasPast ? props.hasPast() : false;
      showElem(BACK_BTN_ID, hasPast);
      const hasFuture = props.hasFuture ? props.hasFuture() : false;
      showElem(FORWARD_BTN_ID, hasFuture);
      showElem(HISTORY_BTN_ID, hasFuture || hasPast);

    }

    function middleSize() {
      if (minLocation) {
        setCss({position, transform: 'unset', top: 'unset', bottom: 'unset', right: 'unset', left: 'unset', width: instance.getDems().width})
        setCss(minLocation);
        showElem(POPUP_HEADER_CNT_ID, false);
        showElem(POPUP_CONTENT_CNT_ID, true);
        prevLocation = minLocation;
        minLocation = undefined;
        updateControls();
        return true;
      }
      return false;
    }

    this.maximize = function () {
      if (!middleSize()) {
        setCss({position: 'fixed', top: 0, bottom: 0, right: 0, left:0, maxWidth: 'unset', maxHeight: 'unset', width: 'unset', height: '95vh'})
        minLocation = prevLocation;
        updateControls();
      }
      return this;
    }

    this.minimize = function () {
      if (!middleSize() && props.tabText) {
        console.log('tab-it')
        tabHeader.innerText = props.tabText();
        showElem(POPUP_HEADER_CNT_ID, true);
        showElem(POPUP_CONTENT_CNT_ID, false);
        setCss({left: 0, right: 0, bottom: 0, maxWidth: 'unset', maxHeight: 'unset', minWidth: 'unset',
                minHeight: 'unset', width: 'fit-content', height: 'fit-content',
                transform: 'rotate(90deg)'});
        minLocation = prevLocation;
        const rect = popupCnt.getBoundingClientRect();
        const left = (rect.width - rect.height)/2 + 'px';
        setCss({left});
        DragDropResize.events.tabbed.trigger(getPopupElems().cnt);
      }
      return this;
    }

    function setCss(rect, container) {
      if (container === undefined) {
        const popRect = getPopupElems().cnt.getBoundingClientRect();
        const top = getPopupElems().cnt.style.top;
        const bottom = getPopupElems().cnt.style.bottom;
        const left = getPopupElems().cnt.style.left;
        const right = getPopupElems().cnt.style.right;
        const maxWidth = getPopupElems().cnt.style.maxWidth;
        const maxHeight = getPopupElems().cnt.style.maxHeight;
        const width = getPopupElems().cnt.style.width;
        const height = getPopupElems().cnt.style.height;
        prevLocation = {top, bottom, left, right, maxWidth, maxHeight, width, height}
        setTimeout(() => Resizer.position(popupCnt), 0);
      }
      styleUpdate(container || getPopupElems().cnt, rect);
      return instance;
    }
    this.setCss = setCss;

    this.onClose = (func) => closeFuncs.push(func);

    function updateContent(html) {
      safeInnerHtml(html, getPopupElems().content);
      return instance;
    }
    this.updateContent = updateContent;

    function isMaximized() {
      return minLocation !== undefined;
    }
    this.isMaximized = isMaximized;

    function getScrollOffset() {
      let x,y;
      if (props.position === 'fixed') {
        y = 0;
        x = 0;
      } else {
        y = window.scrollY;
        x = window.scrollX;
      }
      return {x, y}
    }

    let moving;
    function move(e) {
      console.log('moving!');
      backdrop.show();
      Resizer.hide(popupCnt);
      const rect = popupCnt.getBoundingClientRect();
      const scrollOffset = getScrollOffset();
      moving = {clientX: e.clientX + scrollOffset.x,
                  clientY: e.clientY + scrollOffset.y,
                  top: rect.top + scrollOffset.y,
                  left: rect.left + scrollOffset.x};
      DragDropResize.events.dragstart.trigger(getPopupElems().cnt);
    }

    function get(name) {
      const prop = props[name];
      if ((typeof prop) === 'function') return prop();
      return prop;
    }

    function stopMoving() {
      moving = undefined;
      backdrop.hide();
      Resizer.position(popupCnt);
      DragDropResize.events.dragend.trigger(getPopupElems().cnt);
      DragDropResize.events.drop.trigger(getPopupElems().cnt);
      if (!Resizer.isLocked(popupCnt)) Resizer.show(popupCnt);
    }

    const tempElem = document.createElement('div');
    const tempHtml = template.render({POPUP_CNT_ID, POPUP_CONTENT_ID,
        MINIMIZE_BTN_ID, MAXIMIZE_BTN_ID, MAX_MIN_CNT_ID, CLOSE_BTN_ID,
        HISTORY_BTN_ID, FORWARD_BTN_ID, BACK_BTN_ID, MOVE_BTN_ID,
        POPUP_HEADER_CNT_ID, POPUP_CONTENT_CNT_ID,
        props});
    safeInnerHtml(tempHtml, tempElem);
    tempElem.children[0].style = defaultStyle;
    CE_CONTAINER.append(tempElem);

    const popupContent = document.getElementById(POPUP_CONTENT_ID);
    const popupCnt = document.getElementById(POPUP_CNT_ID);
    const histCnt = document.createElement('DIV');
    const tabHeader = document.getElementById(POPUP_HEADER_CNT_ID);
    tabHeader.onclick = this.maximize;
    const histFilter = document.createElement('input');
    histFilter.placeholder = 'filter';
    const histDisplayCnt = document.createElement('DIV');
    histCnt.append(histFilter);
    histCnt.append(histDisplayCnt);
    histDisplayCnt.style.maxHeight = '20vh';
    histDisplayCnt.style.overflow = 'auto';
    histCnt.style.position = position;
    histCnt.hidden = true;
    histCnt.className = 'place-history-cnt';
    CE_CONTAINER.append(histCnt);
    popupCnt.style = defaultStyle;
    popupCnt.addEventListener(Resizer.events.resize.name, onResizeEvent);
    document.getElementById(MAXIMIZE_BTN_ID).onclick = instance.maximize;
    document.getElementById(MINIMIZE_BTN_ID).onclick = instance.minimize;
    document.getElementById(CLOSE_BTN_ID).onclick = instance.close;
    document.getElementById(MOVE_BTN_ID).onclick = move;
    if (props.back) {
      document.getElementById(BACK_BTN_ID).onclick = () => {
        props.back();
        updateControls();
        event.stopPropagation();
        histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
      }
    }
    if (props.forward) {
      document.getElementById(FORWARD_BTN_ID).onclick = () => {
        props.forward();
        updateControls();
        event.stopPropagation();
        histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
      }
    }
    if (props.historyDisplay) {
      const historyBtn = document.getElementById(HISTORY_BTN_ID);
      historyBtn.onclick = (event) => {
        histCnt.hidden = false;
        histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
        positionOnElement(historyBtn, histCnt).center().bottom();
        updateHistZindex();
        event.stopPropagation();
      }
      histCnt.onclick = (event) => {
        event.stopPropagation();
      }
      histDisplayCnt.onclick = (event) => {
        event.stopPropagation();
        if ((typeof props.historyClick) === 'function') {
          props.historyClick(event);
          updateControls();
          histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
          histFilter.focus();
        }
      }
      histFilter.onkeyup = () => {
        histDisplayCnt.innerHTML = props.historyDisplay(histFilter.value);
        histFilter.focus();
      }
    }

    popupCnt.onclick = (e) => {
      histCnt.hidden = true;
      if (e.target.tagName !== 'A')
      e.stopPropagation()
    };

    // CssFile.apply('place');


    function getPopupElems() {
      return {cnt: popupCnt, content: popupContent};
    }

    let lastDragNotification = new Date().getTime()
    let lastMove = new Date().getTime()
    function mouseMove(e) {
      const time = new Date().getTime();
      const scrollOffset = getScrollOffset();
      lastMoveEvent = {clientX: e.clientX + scrollOffset.x,
                      clientY: e.clientY + scrollOffset.y};
      if (moving && lastMove < time + 100) {
        console.log('moving')
        const dy = moving.clientY - lastMoveEvent.clientY;
        const dx = moving.clientX - lastMoveEvent.clientX;
        const rect = popupCnt.getBoundingClientRect();
        popupCnt.style.top = moving.top - dy + 'px';
        popupCnt.style.left = moving.left - dx + 'px';
        if (lastDragNotification + 350 < time) {
          DragDropResize.events.drag.trigger(getPopupElems().cnt);
          lastDragNotification = time;
        }
      }
    }

    function on(eventName, func) {
      getPopupElems().content.addEventListener(eventName, func);
    }
    this.on = on;

    const cancelFade = fadeOut(getPopupElems().cnt, 10, instance.close);
    getPopupElems().cnt.addEventListener('mouseover', cancelFade);


    this.container = () => getPopupElems().cnt;
    this.lockSize = () => Resizer.lock(popupCnt);
    this.unlockSize = () => Resizer.unlock(popupCnt);

    Resizer.all(popupCnt, props.position);
    const backdrop = new CatchAll(popupCnt);
    backdrop.on('click', stopMoving);
    backdrop.on('mousemove', mouseMove);

    Resizer.position(popupCnt);
  }
}

DragDropResize.events = {};
DragDropResize.events.drag = new CustomEvent ('drag');
DragDropResize.events.dragend = new CustomEvent ('dragend');
DragDropResize.events.dragstart = new CustomEvent ('dragstart');
DragDropResize.events.drop = new CustomEvent ('drop');
DragDropResize.events.tabbed = new CustomEvent ('tabbed');

// drag	An element or text selection is being dragged (fired continuously every 350ms).
// dragend	A drag operation is being ended (by releasing a mouse button or hitting the escape key).
// dragstart	The user starts dragging an element or text selection.
// drop	An element is dropped on a valid drop target.

module.exports = DragDropResize;
